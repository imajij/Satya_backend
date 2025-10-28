import { Request, Response, NextFunction } from 'express';
import { analyzeTextWithAI } from '../services/aiService';
import { FactCheckOrchestrator } from '../services/factCheckOrchestrator';
import { CredibilityScorer } from '../services/credibilityScorer';
import UserQuery from '../models/UserQuery';
import { createError } from '../middleware/errorHandler';
import crypto from 'crypto';

const factCheckOrchestrator = new FactCheckOrchestrator();
const credibilityScorer = new CredibilityScorer();

interface IngestMessageBody {
  text: string;
  attachments?: Array<{ type: string; url: string }>;
  source_app?: string;
  user_id?: string;
}

export const ingestMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { text, attachments, source_app, user_id }: IngestMessageBody = req.body;

    if (!text || text.length < 10) {
      throw createError('Message text is required and must be at least 10 characters', 400);
    }

    // Hash user_id for privacy
    const hashedUserId = user_id 
      ? crypto.createHash('sha256').update(user_id).digest('hex')
      : undefined;

    // Quick preliminary analysis
    const [aiResult, factCheckResults] = await Promise.all([
      analyzeTextWithAI(text),
      factCheckOrchestrator.findFactChecks(text),
    ]);

    // Compute credibility score
    const scoring = credibilityScorer.score({
      aiFactuality: aiResult.credibilityScore || 50 / 100,
      aiBias: aiResult.biasDetected === 'biased' ? 0.7 : 0.3,
      aiSensationalism: aiResult.sensationalismScore || 0,
      aiToxicity: 0,
      factCheckMatches: factCheckResults,
    });

    // Save to database
    const userQuery = await UserQuery.create({
      message: text,
      language: 'en', // Would detect language
      aiResult,
      verdict: scoring.verdict,
      sourceFound: factCheckResults[0]?.url,
    });

    // Return immediate response
    res.json({
      success: true,
      data: {
        queryId: userQuery._id,
        verdict: scoring.verdict,
        credibilityScore: scoring.credibilityScore,
        confidence: scoring.confidence,
        explanation: scoring.explanation,
        factCheckReferences: factCheckResults.slice(0, 3),
        processingTime: 'immediate',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const whatsappWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Verify WhatsApp signature
    const signature = req.headers['x-hub-signature-256'] as string;
    const webhookSecret = process.env.WHATSAPP_WEBHOOK_SECRET || '';
    
    if (signature) {
      const expectedSignature = 'sha256=' + 
        crypto.createHmac('sha256', webhookSecret)
          .update(JSON.stringify(req.body))
          .digest('hex');
      
      if (signature !== expectedSignature) {
        throw createError('Invalid webhook signature', 401);
      }
    }

    // Handle WhatsApp webhook verification
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === webhookSecret) {
      res.send(req.query['hub.challenge']);
      return;
    }

    // Process incoming message
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    if (message && message.type === 'text') {
      // Queue message for processing
      await ingestMessage(
        { body: { text: message.text.body, source_app: 'whatsapp', user_id: message.from } } as any,
        res,
        next
      );
    } else {
      res.json({ success: true, message: 'Webhook received' });
    }
  } catch (error) {
    next(error);
  }
};
