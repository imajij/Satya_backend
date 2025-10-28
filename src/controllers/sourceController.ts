import { Request, Response, NextFunction } from 'express';
import SourceReputation from '../models/SourceReputation';
import { createError } from '../middleware/errorHandler';

export const getSources = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sources = await SourceReputation.find().sort({ credibilityScore: -1 });

    res.json({
      success: true,
      data: sources,
    });
  } catch (error) {
    next(error);
  }
};

export const addOrUpdateSource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, bias, credibilityScore, country } = req.body;

    if (!name || credibilityScore === undefined) {
      throw createError('Name and credibility score are required', 400);
    }

    const source = await SourceReputation.findOneAndUpdate(
      { name },
      { name, bias, credibilityScore, country, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      data: source,
    });
  } catch (error) {
    next(error);
  }
};
