import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  name: string;
  owner: mongoose.Types.ObjectId;
  color: string;
  createdAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true, trim: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    color: { type: String, default: '#6366f1' },
  },
  { timestamps: true }
);

ProjectSchema.index({ owner: 1 });

export default mongoose.model<IProject>('Project', ProjectSchema);
