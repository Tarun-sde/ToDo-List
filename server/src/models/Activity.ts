import mongoose, { Document, Schema } from 'mongoose';

export type ActivityType = 
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_COMPLETED'
  | 'TASK_DELETED'
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'PROJECT_DELETED'
  | 'PROFILE_UPDATED'
  | 'PASSWORD_CHANGED';

export interface IActivity extends Document {
  user: mongoose.Types.ObjectId;
  type: ActivityType;
  message: string;
  referenceId?: mongoose.Types.ObjectId;
  referenceType?: string;
  createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    message: { type: String, required: true },
    referenceId: { type: Schema.Types.ObjectId },
    referenceType: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ActivitySchema.index({ user: 1, createdAt: -1 });

export default mongoose.model<IActivity>('Activity', ActivitySchema);
