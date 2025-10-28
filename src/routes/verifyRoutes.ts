import { Router } from 'express';
import { verifyContent } from '../controllers/verifyController';
import { verifyLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/', verifyLimiter, verifyContent);

export default router;
