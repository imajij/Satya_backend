import { Request, Response, NextFunction } from 'express';
import Article from '../models/Article';
import UserQuery from '../models/UserQuery';

export const getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [
      totalArticles,
      verifiedArticles,
      misleadingArticles,
      falseArticles,
      totalQueries,
      recentArticles,
    ] = await Promise.all([
      Article.countDocuments(),
      Article.countDocuments({ verdict: 'verified' }),
      Article.countDocuments({ verdict: 'misleading' }),
      Article.countDocuments({ verdict: 'false' }),
      UserQuery.countDocuments(),
      Article.find().sort({ createdAt: -1 }).limit(5),
    ]);

    res.json({
      success: true,
      data: {
        articles: {
          total: totalArticles,
          verified: verifiedArticles,
          misleading: misleadingArticles,
          false: falseArticles,
        },
        queries: {
          total: totalQueries,
        },
        recentArticles,
      },
    });
  } catch (error) {
    next(error);
  }
};
