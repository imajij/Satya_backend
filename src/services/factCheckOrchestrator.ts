import axios from 'axios';
import { config } from '../config/env';
import Redis from 'ioredis';
import * as cheerio from 'cheerio';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export interface FactCheckMatch {
  source: string;
  title: string;
  url: string;
  rating: string;
  claimReview?: string;
  matchType: 'exact' | 'partial' | 'similar' | 'none';
  confidence: number;
  publishedDate?: Date;
}

export class FactCheckOrchestrator {
  private allowedDomains: string[];

  constructor() {
    this.allowedDomains = (process.env.FACTCHECK_SCRAPER_ALLOWLIST || '').split(',');
  }

  async findFactChecks(claim: string, language: string = 'en'): Promise<FactCheckMatch[]> {
    const cacheKey = `factcheck:${Buffer.from(claim).toString('base64')}`;
    
    // Check cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const results: FactCheckMatch[] = [];

    // 1. Query Google Fact Check API
    const googleResults = await this.queryGoogleFactCheck(claim, language);
    results.push(...googleResults);

    // 2. If no exact matches, search local embeddings (via AI service)
    if (results.length === 0) {
      const embeddingResults = await this.searchLocalEmbeddings(claim);
      results.push(...embeddingResults);
    }

    // 3. Query RSS feeds from Indian fact-checkers
    const rssResults = await this.queryRSSFeeds(claim);
    results.push(...rssResults);

    // 4. Fallback to scraping (only if no results and query is critical)
    if (results.length === 0 && claim.length > 50) {
      const scrapedResults = await this.scrapeFactCheckSites(claim);
      results.push(...scrapedResults);
    }

    // Sort by confidence and recency
    results.sort((a, b) => {
      if (a.matchType !== b.matchType) {
        const typeOrder = { exact: 0, partial: 1, similar: 2, none: 3 };
        return typeOrder[a.matchType] - typeOrder[b.matchType];
      }
      return b.confidence - a.confidence;
    });

    // Cache results
    await redis.setex(cacheKey, parseInt(process.env.REDIS_CACHE_TTL_SEC || '604800'), JSON.stringify(results));

    return results.slice(0, 10); // Return top 10 matches
  }

  private async queryGoogleFactCheck(claim: string, language: string): Promise<FactCheckMatch[]> {
    try {
      const response = await axios.get('https://factchecktools.googleapis.com/v1alpha1/claims:search', {
        params: {
          key: config.GOOGLE_FACTCHECK_API_KEY,
          query: claim,
          languageCode: language,
        },
      });

      if (!response.data.claims) return [];

      return response.data.claims.map((claim: any) => ({
        source: claim.claimReview?.[0]?.publisher?.name || 'Google Fact Check',
        title: claim.text,
        url: claim.claimReview?.[0]?.url || '',
        rating: claim.claimReview?.[0]?.textualRating || 'unverified',
        claimReview: claim.claimReview?.[0]?.title || '',
        matchType: this.determineMatchType(claim.text, claim),
        confidence: 0.9,
        publishedDate: claim.claimReview?.[0]?.reviewDate 
          ? new Date(claim.claimReview[0].reviewDate) 
          : undefined,
      }));
    } catch (error) {
      console.error('Google Fact Check API error:', error);
      return [];
    }
  }

  private async searchLocalEmbeddings(claim: string): Promise<FactCheckMatch[]> {
    try {
      const response = await axios.post(
        `${process.env.AI_SERVICE_HOST}/api/search-similar`,
        { text: claim },
        {
          headers: { 'X-API-Key': process.env.AI_SERVICE_KEY },
          timeout: 5000,
        }
      );

      return response.data.results?.map((result: any) => ({
        source: result.source_name,
        title: result.text || claim,
        url: result.url,
        rating: result.rating || 'unverified',
        matchType: 'similar' as const,
        confidence: result.confidence || 0.5,
      })) || [];
    } catch (error) {
      console.error('Embedding search error:', error);
      return [];
    }
  }

  private async queryRSSFeeds(claim: string): Promise<FactCheckMatch[]> {
    const feeds = [
      { url: process.env.ALTNEWS_RSS_FEED, source: 'Alt News' },
      { url: process.env.BOOM_RSS_FEED, source: 'BOOM Live' },
      { url: process.env.FACTLY_RSS_FEED, source: 'Factly' },
    ];

    const results: FactCheckMatch[] = [];
    const claimKeywords = claim.toLowerCase().split(' ').filter(w => w.length > 3);

    for (const feed of feeds) {
      if (!feed.url) continue;

      try {
        const response = await axios.get(feed.url, { timeout: 5000 });
        const $ = cheerio.load(response.data, { xmlMode: true });

        $('item').each((_, item) => {
          const title = $(item).find('title').text();
          const link = $(item).find('link').text();
          const pubDate = $(item).find('pubDate').text();
          
          // Simple keyword matching
          const titleLower = title.toLowerCase();
          const matchCount = claimKeywords.filter(kw => titleLower.includes(kw)).length;
          
          if (matchCount >= 2) {
            results.push({
              source: feed.source,
              title,
              url: link,
              rating: this.extractRatingFromTitle(title),
              matchType: matchCount >= 3 ? 'partial' : 'similar',
              confidence: matchCount / claimKeywords.length,
              publishedDate: pubDate ? new Date(pubDate) : undefined,
            });
          }
        });
      } catch (error) {
        console.error(`RSS feed error for ${feed.source}:`, error);
      }
    }

    return results;
  }

  private async scrapeFactCheckSites(claim: string): Promise<FactCheckMatch[]> {
    // Only scrape if domains are whitelisted
    const results: FactCheckMatch[] = [];
    const keywords = claim.split(' ').slice(0, 5).join('+');

    for (const domain of this.allowedDomains.slice(0, 2)) {
      try {
        const searchUrl = `https://www.google.com/search?q=site:${domain}+${keywords}`;
        
        // Note: In production, use proper scraping with rate limiting and respect robots.txt
        // This is a simplified example
        const response = await axios.get(searchUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SatyaBot/1.0)' },
          timeout: 5000,
        });

        const $ = cheerio.load(response.data);
        
        $('.g').slice(0, 3).each((_, result) => {
          const title = $(result).find('h3').text();
          const url = $(result).find('a').attr('href') || '';
          
          if (title && url) {
            results.push({
              source: domain,
              title,
              url,
              rating: 'unverified',
              matchType: 'similar',
              confidence: 0.4,
            });
          }
        });
      } catch (error) {
        console.error(`Scraping error for ${domain}:`, error);
      }
    }

    return results;
  }

  private determineMatchType(text1: string, text2: string): 'exact' | 'partial' | 'similar' {
    const similarity = this.calculateSimilarity(text1.toLowerCase(), text2.toLowerCase());
    
    if (similarity > 0.9) return 'exact';
    if (similarity > 0.6) return 'partial';
    return 'similar';
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.split(' '));
    const words2 = new Set(str2.split(' '));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  private extractRatingFromTitle(title: string): string {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('false') || titleLower.includes('fake')) return 'false';
    if (titleLower.includes('misleading') || titleLower.includes('misrepresent')) return 'misleading';
    if (titleLower.includes('true') || titleLower.includes('correct')) return 'true';
    if (titleLower.includes('mixed')) return 'mixed';
    
    return 'unverified';
  }
}
