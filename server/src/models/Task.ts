import mongoose, { Document, Schema } from 'mongoose';

export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface ISubtask {
  _id?: mongoose.Types.ObjectId;
  title: string;
  completed: boolean;
}

export interface ITask extends Document {
  title: string;
  description?: string;
  owner: mongoose.Types.ObjectId;
  project?: mongoose.Types.ObjectId;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  tags: string[];
  subtasks: ISubtask[];
  category: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubtaskSchema = new Schema<ISubtask>({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
});

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', default: null },
    status: { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    dueDate: { type: Date },
    tags: [{ type: String }],
    subtasks: [SubtaskSchema],
    category: { type: String, enum: ['Study', 'Work', 'Personal', 'Fitness', 'Shopping', 'Other'], default: 'Personal' },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

// Fast dashboard queries
TaskSchema.index({ owner: 1, status: 1 });
TaskSchema.index({ owner: 1, dueDate: 1 });

export default mongoose.model<ITask>('Task', TaskSchema);
