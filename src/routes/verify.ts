import { Router } from "express";
import type { Request, Response } from "express";
import axios from "axios";
import { requireClerkAuth } from "../middleware/auth.js";
// @ts-ignore - Article is a JS file
import Article from "../models/Article.js";
// @ts-ignore - Source is a JS file
import Source from "../models/Source.js";

const verifyRouter = Router();

const PIPELINE_URL = process.env.PIPELINE_URL || "http://localhost:3000";

// POST /verify
// body: { url?: string, article?: { publisher, headline, content, url } }
verifyRouter.post("/", requireClerkAuth, async (req: Request, res: Response) => {
  const { url, article } = req.body || {};

  let articleObj = article;

  try {
    if (!articleObj) {
      if (!url) return res.status(400).json({ error: "Provide article object or url to verify" });
      // Try to fetch the URL and extract title/content (basic fallback)
      try {
        const r = await axios.get(url, { timeout: 8000 });
        const html = r.data as string;
        const titleMatch = html.match(/<title>(.*?)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : url;
        // extract first two <p> tags as content fallback
        const pMatches = Array.from(html.matchAll(/<p>(.*?)<\/p>/gi)).slice(0, 4).map(m => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean);
        const content = pMatches.join('\n\n') || '';
        articleObj = { publisher: new URL(url).hostname.replace('www.',''), title, content, url };
      } catch (err) {
        // cannot scrape
        const errorMessage = err instanceof Error ? err.message : String(err);
        return res.status(502).json({ error: 'Failed to fetch url for scraping', details: errorMessage });
      }
    }

    // Normalize fields to pipeline expected shape
    const pipelineArticle = {
      publisher: articleObj.publisher || articleObj.publisherName || '' ,
      title: articleObj.headline || articleObj.title || articleObj.headline,
      content: articleObj.content || '',
      url: articleObj.url || url || ''
    };

    // Call external pipeline if available
    try {
      const resp = await axios.post(`${PIPELINE_URL}/api/verify`, { article: pipelineArticle }, { timeout: 15000 });
      const data = resp.data || {};
      
      // Pipeline returns jobId for async processing
      let processed = data.result || data || {};
      
      // If we got a jobId, poll for the result
      if (data.jobId && !data.result) {
        const jobId = data.jobId;
        const maxAttempts = 30; // 30 seconds max wait
        const pollInterval = 1000; // 1 second
        
        for (let i = 0; i < maxAttempts; i++) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          
          try {
            const statusResp = await axios.get(`${PIPELINE_URL}/api/status/${jobId}`, { timeout: 5000 });
            const statusData = statusResp.data || {};
            
            if (statusData.status === 'finished' && statusData.result) {
              processed = statusData.result;
              break;
            } else if (statusData.status === 'error') {
              console.error('Pipeline processing failed:', statusData.error);
              break;
            }
            // If still processing, continue polling
          } catch (pollErr) {
            const pollErrMsg = pollErr instanceof Error ? pollErr.message : String(pollErr);
            console.warn('Error polling job status:', pollErrMsg);
            break;
          }
        }
      }

      // Map processed to Article model fields when available
      const doc = {
        headline: pipelineArticle.title,
        publisher: pipelineArticle.publisher,
        content: pipelineArticle.content,
        url: pipelineArticle.url,
        classification: processed.classification || 'unverified',
        factual: processed.credibilityScore ? Math.round((processed.credibilityScore || 0) * 100) : undefined,
        bias: typeof processed.articleBiasScore === 'number' 
          ? (processed.articleBiasScore > 0 ? 'right' : processed.articleBiasScore < 0 ? 'left' : 'neutral')
          : 'neutral',
        claims: processed.claims || [],
        fact_check_results: processed.factcheck_results || processed.factCheckResults || [],
        bias_analysis: processed.biasAnalysis || {},
        mbfc_publisher_match: processed.mbfc_publisher_match || processed.publisherMatch || null
      };

      // Upsert into DB
      let savedArticle;
      try {
        savedArticle = await Article.findOneAndUpdate(
          { url: doc.url }, 
          { $set: doc }, 
          { upsert: true, new: true }
        );
      } catch (e: any) {
        console.warn('Article upsert failed:', e?.message || e);
      }

      // Return the saved article in the format frontend expects
      return res.json({ 
        data: savedArticle || doc,
        pipeline: data,
        saved: true 
      });
    } catch (err) {
      // pipeline call failed — fallback to saving minimal article
      const doc = {
        headline: pipelineArticle.title,
        publisher: pipelineArticle.publisher,
        content: pipelineArticle.content,
        url: pipelineArticle.url,
        classification: 'unverified'
      };
      let savedArticle;
      try { 
        savedArticle = await Article.findOneAndUpdate(
          { url: doc.url }, 
          { $set: doc }, 
          { upsert: true, new: true }
        ); 
      } catch(e: any) {
        console.warn('Fallback article save failed:', e?.message || e);
      }
      return res.status(200).json({ 
        data: savedArticle || doc,
        pipeline: null, 
        saved: true, 
        note: 'Pipeline unavailable; saved basic article for manual processing' 
      });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || String(error) });
  }
});

export default verifyRouter;
