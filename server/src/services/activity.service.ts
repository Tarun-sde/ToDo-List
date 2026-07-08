import Activity, { ActivityType } from '../models/Activity.js';
import mongoose from 'mongoose';

export async function logActivity(
  userId: string | mongoose.Types.ObjectId,
  type: ActivityType,
  message: string,
  referenceId?: string | mongoose.Types.ObjectId,
  referenceType?: string
) {
  try {
    await Activity.create({
      user: userId,
      type,
      message,
      referenceId: referenceId || undefined,
      referenceType: referenceType || undefined,
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}
