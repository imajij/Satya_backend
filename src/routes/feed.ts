import { Router } from "express";
import type { Request, Response } from "express";
import { sampleArticles } from "../data/sampleArticles.js";
import { requireClerkAuth } from "../middleware/auth.js";
import type { NewsCategory } from "../types/news.js";

const feedRouter = Router();

feedRouter.get("/", requireClerkAuth, (req: Request, res: Response) => {
  const availableCategories = Array.from(
    new Set(sampleArticles.map((article) => article.category))
  ) as NewsCategory[];

  const categoryParam =
    typeof req.query.category === "string"
      ? (req.query.category.toLowerCase() as NewsCategory)
      : undefined;

  if (categoryParam && !availableCategories.includes(categoryParam)) {
    return res.status(400).json({
      error: "invalid_category",
      allowedCategories: availableCategories
    });
  }

  const filteredArticles = categoryParam
    ? sampleArticles.filter((article) => article.category === categoryParam)
    : sampleArticles;

  res.json({
    data: filteredArticles,
    meta: {
      category: categoryParam ?? "all",
      total: filteredArticles.length,
      availableCategories
    }
  });
});

export default feedRouter;
