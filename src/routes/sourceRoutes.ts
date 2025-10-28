import { Router } from 'express';
import { getSources, addOrUpdateSource } from '../controllers/sourceController';
import { authenticateAdmin } from '../middleware/auth';

const router = Router();

router.get('/', getSources);
router.post('/', authenticateAdmin, addOrUpdateSource);

export default router;
