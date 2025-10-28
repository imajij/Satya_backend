import { Request, Response, NextFunction } from 'express';
import UserQuery from '../models/UserQuery';
import { analyzeTextWithAI } from '../services/aiService';
import { searchFactCheck } from '../services/factCheckService';
import { createError } from '../middleware/errorHandler';

export const verifyContent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { text, url } = req.body;

    if (!text && !url) {
      throw createError('Text or URL is required', 400);
    }

    const contentToAnalyze = text || url;

    // Run AI analysis and fact-checking in parallel
    const [aiResult, factCheckResults] = await Promise.all([
      analyzeTextWithAI(contentToAnalyze),
      searchFactCheck(contentToAnalyze.substring(0, 200)),
    ]);

    // Determine verdict based on AI and fact-check results
    let verdict = 'unverified';
    if (factCheckResults.length > 0) {
      const ratings = factCheckResults.map(r => r.rating?.toLowerCase() || '');
      if (ratings.some(r => r.includes('false'))) verdict = 'false';
      else if (ratings.some(r => r.includes('misleading'))) verdict = 'misleading';
      else if (ratings.some(r => r.includes('true'))) verdict = 'verified';
      else verdict = 'needs_review';
    } else if (aiResult.credibilityScore && aiResult.credibilityScore >= 70) {
      verdict = 'verified';
    } else if (aiResult.credibilityScore && aiResult.credibilityScore < 40) {
      verdict = 'misleading';
    }

    // Save query to database
    const userQuery = await UserQuery.create({
      message: contentToAnalyze,
      language: 'en',
      aiResult,
      verdict,
      sourceFound: factCheckResults.length > 0 ? factCheckResults[0].url : undefined,
    });

    res.json({
      success: true,
      data: {
        verdict,
        aiAnalysis: aiResult,
        factCheckReferences: factCheckResults,
        queryId: userQuery._id,
      },
    });
  } catch (error) {
    next(error);
  }
};
