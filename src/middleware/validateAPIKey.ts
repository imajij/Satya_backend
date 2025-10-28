import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';
import { createError } from './errorHandler';

export const validateAPIKey = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey || apiKey !== config.INTERNAL_API_KEY) {
    throw createError('Invalid or missing API key', 401);
  }

  next();
};
