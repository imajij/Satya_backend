import cron from 'node-cron';
import Article from '../models/Article';
import SourceReputation from '../models/SourceReputation';
import { fetchNewsDataArticles, fetchMediastackArticles } from '../services/newsService';
import { analyzeTextWithAI } from '../services/aiService';

export const startNewsUpdater = (): void => {
  // Run every 3 hours
  cron.schedule('0 */3 * * *', async () => {
    console.log('🔄 Starting news update job...');

    try {
      const [newsDataArticles, mediastackArticles] = await Promise.all([
        fetchNewsDataArticles(),
        fetchMediastackArticles(),
      ]);

      const allArticles = [...newsDataArticles, ...mediastackArticles];

      for (const article of allArticles) {
        // Check if article already exists
        const exists = await Article.findOne({ url: article.url });
        if (exists) continue;

        // Get source reputation
        const sourceRep = await SourceReputation.findOne({ name: article.source });
        
        // Analyze with AI
        const aiInsights = await analyzeTextWithAI(`${article.title} ${article.description}`);

        // Create article
        await Article.create({
          title: article.title,
          summary: article.description,
          source: article.source,
          url: article.url,
          language: article.language || 'en',
          category: article.category || 'general',
          bias: sourceRep?.bias || 'unknown',
          credibilityScore: sourceRep?.credibilityScore || aiInsights.credibilityScore || 50,
          verdict: 'unverified',
          aiInsights,
          publishedAt: new Date(article.publishedAt),
        });
      }

      console.log(`✅ News update completed. Processed ${allArticles.length} articles.`);
    } catch (error) {
      console.error('❌ News update job error:', error);
    }
  });

  console.log('📅 News updater cron job scheduled (every 3 hours)');
};
