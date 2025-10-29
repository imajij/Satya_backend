import { Router } from "express";
import type { Request, Response } from "express";
// @ts-ignore - Article is a JS file
import Article from "../models/Article.js";
// @ts-ignore - Source is a JS file
import Source from "../models/Source.js";
import { requireClerkAuth } from "../middleware/auth.js";
import type { NewsCategory } from "../types/news.js";

const feedRouter = Router();

feedRouter.get("/", requireClerkAuth, async (req: Request, res: Response) => {
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
        const meta = publisherMap.get((d.publisher || "").toLowerCase()) || null;
        return { ...d, mbfc_publisher_match: meta };
      }
      // Article already has mbfc_publisher_match from pipeline, keep it
      return d;
    });

    res.json({ data: items, meta: { page, limit, total } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /feed/:id - Get article by ID
feedRouter.get("/:id", requireClerkAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const article = await Article.findById(id).lean();
    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    // Try to find matching publisher metadata
    const publishers = await Source.find({}).lean();
    const publisherMap = new Map(publishers.map((p: any) => [p.publisher.toLowerCase(), p]));
    const meta = publisherMap.get((article.publisher || "").toLowerCase()) || null;
    
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