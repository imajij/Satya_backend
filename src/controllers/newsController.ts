import { Request, Response, NextFunction } from 'express';
import Article from '../models/Article';
import { createError } from '../middleware/errorHandler';

export const getNews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { category, credibility, limit = 20, page = 1 } = req.query;
    
    const filter: any = {};
    if (category) filter.category = category;
    if (credibility) filter.credibilityScore = { $gte: Number(credibility) };

    const articles = await Article.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Article.countDocuments(filter);

    res.json({
      success: true,
      data: articles,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTrendingNews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const articles = await Article.find({ credibilityScore: { $gte: 70 } })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: articles,
    });
  } catch (error) {
    next(error);
  }
};

export const getArticleById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      throw createError('Article not found', 404);
    }

    res.json({
      success: true,
      data: article,
    });
  } catch (error) {
    next(error);
  }
};
