import { Response, NextFunction } from 'express';
import Activity from '../models/Activity.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

export async function getActivities(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { limit = '10' } = req.query as { limit?: string };
    const maxLimit = parseInt(limit, 10);
    const safeLimit = isNaN(maxLimit) ? 10 : Math.min(maxLimit, 50);

    const activities = await Activity.find({ user: req.user!.id })
      .sort({ createdAt: -1 })
      .limit(safeLimit);

    res.json({ activities });
  } catch (err) {
    next(err);
  }
}
