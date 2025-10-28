import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { createError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: { email: string; isAdmin: boolean };
}

export const authenticateAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    throw createError('No token provided', 401);
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as { email: string; isAdmin: boolean };
    
    if (!decoded.isAdmin) {
      throw createError('Unauthorized: Admin access required', 403);
    }

    req.user = decoded;
    next();
  } catch (error) {
    throw createError('Invalid token', 401);
  }
};
