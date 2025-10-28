import { Router } from 'express';
import { ingestMessage, whatsappWebhook } from '../controllers/ingestController';
import { verifyLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/message', verifyLimiter, ingestMessage);
router.post('/whatsapp-webhook', whatsappWebhook);
router.get('/whatsapp-webhook', whatsappWebhook); // For verification

export default router;
