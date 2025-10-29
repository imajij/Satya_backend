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

  try {
    // Pipeline now handles scraping via News Scraper service
    // Just forward the URL or article object to Pipeline
    if (!article && !url) {
      return res.status(400).json({ error: "Provide article object or url to verify" });
    }

    // Prepare payload for Pipeline
    const pipelinePayload: any = {};
    
    if (url) {
      // Just pass the URL - Pipeline will call News Scraper
      pipelinePayload.url = url;
    } else if (article) {
      // Normalize fields to pipeline expected shape
      pipelinePayload.article = {
        publisher: article.publisher || article.publisherName || '',
        title: article.headline || article.title,
        content: article.content || '',
        url: article.url || ''
      };
    }

    // Call external pipeline
    try {
      const resp = await axios.post(`${PIPELINE_URL}/api/verify`, pipelinePayload, { timeout: 15000 });
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

      // Extract article info from processed result or use original payload
      const articleInfo = processed.publisher && processed.title ? {
        title: processed.title,
        publisher: processed.publisher,
        content: processed.content || '',
        url: processed.url || url || ''
      } : (pipelinePayload.article || { 
        title: 'Article', 
        publisher: url ? new URL(url).hostname : 'Unknown',
        content: '',
        url: url || ''
      });

      // Map processed to Article model fields when available
      const doc = {
        headline: articleInfo.title,
        publisher: articleInfo.publisher,
        content: articleInfo.content,
        url: articleInfo.url,
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
      // pipeline call failed — return error (Pipeline should handle scraping)
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Pipeline call failed:', errorMessage);
      
      return res.status(502).json({ 
        error: 'Verification service unavailable',
        details: errorMessage,
        note: 'The article verification service is currently unavailable. Please try again later.'
      });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || String(error) });
  }
});

export default verifyRouter;
