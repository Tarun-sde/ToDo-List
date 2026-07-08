import { Router } from 'express';
import { getSummary } from '../controllers/analytics.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.get('/summary', getSummary);

export default router;
