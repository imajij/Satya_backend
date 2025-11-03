import { Router } from "express";
import type { Request, Response } from "express";
// @ts-ignore - Article is a JS file
import Article from "../models/Article.js";
// @ts-ignore - Source is a JS file
import Source from "../models/Source.js";
import { optionalAuth } from "../middleware/auth.js";
import type { NewsCategory } from "../types/news.js";

const feedRouter = Router();

// Use optionalAuth so both authenticated and unauthenticated users can access
feedRouter.get("/", optionalAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "6", 10);
    const skip = (Math.max(1, page) - 1) * limit;

    // Optional filter by classification (verified, unverified, false, misleading)
    const classification = typeof req.query.classification === "string" ? req.query.classification : undefined;
    const q: any = {};
    if (classification) q.classification = classification;

    const total = await Article.countDocuments(q);
    const docs = await Article.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();

    // For each article, attempt to find matching publisher metadata from media_bias_publishers
    const publishers = await Source.find({}).lean();
    const publisherMap = new Map(publishers.map((p: any) => [p.publisher.toLowerCase(), p]));

    const items = docs.map((d: any) => {
      // Only fetch from Source collection if Article doesn't already have mbfc_publisher_match
      if (!d.mbfc_publisher_match) {
        const publisherName = (d.publisher || "").toLowerCase();
        
        // Try exact match first
        let meta = publisherMap.get(publisherName);
        
        // If no exact match, try finding by domain/URL similarity
        if (!meta && publisherName) {
          // Check if publisher name looks like a domain (contains .)
          if (publisherName.includes('.')) {
            // Try to match against Source URLs
            for (const [key, pub] of publisherMap.entries()) {
              const pubUrl = (pub.url || '').toLowerCase();
              // Check if domain appears in MBFC URL
              if (pubUrl.includes(publisherName) || publisherName.includes(key)) {
                meta = pub;
                break;
              }
            }
          }
        }
        
        return { ...d, mbfc_publisher_match: meta || null };
      }
      // Article already has mbfc_publisher_match from pipeline, keep it
      return d;
    });

    res.json({ data: items, meta: { page, limit, total } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /feed/:id - Get article by ID (public access)
feedRouter.get("/:id", optionalAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const article = await Article.findById(id).lean();
    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    // Try to find matching publisher metadata
    const publishers = await Source.find({}).lean();
    const publisherMap = new Map(publishers.map((p: any) => [p.publisher.toLowerCase(), p]));
    const publisherName = (article.publisher || "").toLowerCase();
    
    // Try exact match first
    let meta = publisherMap.get(publisherName);
    
    // If no exact match, try finding by domain/URL similarity
    if (!meta && publisherName) {
      // Check if publisher name looks like a domain (contains .)
      if (publisherName.includes('.')) {
        // Try to match against Source URLs
        for (const [key, pub] of publisherMap.entries()) {
          const pubUrl = (pub.url || '').toLowerCase();
          // Check if domain appears in MBFC URL
          if (pubUrl.includes(publisherName) || publisherName.includes(key)) {
            meta = pub;
            break;
          }
        }
      }
    }
    
    // Merge publisher metadata if not already present
    if (meta && !article.mbfc_publisher_match) {
      article.mbfc_publisher_match = meta;
    }

    res.json({ data: article });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default feedRouter;