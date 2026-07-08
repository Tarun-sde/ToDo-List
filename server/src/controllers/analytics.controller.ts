import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Task from '../models/Task.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

export async function getSummary(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const ownerId = new mongoose.Types.ObjectId(req.user!.id);
    const now = new Date();

    // 8 weeks ago (start of that week, Monday)
    const eightWeeksAgo = new Date(now);
    eightWeeksAgo.setDate(now.getDate() - 7 * 8);
    eightWeeksAgo.setHours(0, 0, 0, 0);

    const [completionRate, perWeek, byPriority, streakData, byCategory, completedByCategory] = await Promise.all([
      // Completion rate
      Task.aggregate([
        { $match: { owner: ownerId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // Tasks completed per week — last 8 weeks
      Task.aggregate([
        { $match: { owner: ownerId, completedAt: { $gte: eightWeeksAgo } } },
        {
          $group: {
            _id: { $isoWeek: '$completedAt' },
            year: { $first: { $isoWeekYear: '$completedAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { year: 1, '_id': 1 } },
      ]),

      // Breakdown by priority
      Task.aggregate([
        { $match: { owner: ownerId } },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),

      // Daily streak — sorted list of unique days with completedAt
      Task.aggregate([
        { $match: { owner: ownerId, completedAt: { $exists: true } } },
        {
          $group: {
            _id: {
              y: { $year: '$completedAt' },
              m: { $month: '$completedAt' },
              d: { $dayOfMonth: '$completedAt' },
            },
          },
        },
      ]),

      // Tasks by category
      Task.aggregate([
        { $match: { owner: ownerId } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),

      // Completed tasks by category
      Task.aggregate([
        { $match: { owner: ownerId, status: 'done' } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
    ]);

    // Calculate streak
    let streak = 0;
    let cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    for (const day of streakData) {
      const d = new Date(day._id.y, day._id.m - 1, day._id.d);
      const diff = Math.round((cursor.getTime() - d.getTime()) / 86400000);
      if (diff === 0 || diff === 1) {
        streak++;
        cursor = d;
      } else {
        break;
      }
    }

    res.json({
      completionRate: Object.fromEntries(completionRate.map(r => [r._id, r.count])),
      perWeek,
      byPriority: Object.fromEntries(byPriority.map(r => [r._id, r.count])),
      streak,
      byCategory: Object.fromEntries(byCategory.map(r => [r._id || 'Personal', r.count])),
      completedByCategory: Object.fromEntries(completedByCategory.map(r => [r._id || 'Personal', r.count])),
    });
  } catch (err) {
    next(err);
  }
}
