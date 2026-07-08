import { Router } from 'express';
import { getActivities } from '../controllers/activity.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.get('/', getActivities);

export default router;
