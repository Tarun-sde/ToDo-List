import { Response, NextFunction } from 'express';
import { z } from 'zod';
import Task from '../models/Task.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { createError } from '../middleware/errorHandler.js';
import { logActivity } from '../services/activity.service.js';

const CreateTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  project: z.string().optional().nullable(),
  status: z.enum(['todo', 'in-progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  category: z.enum(['Study', 'Work', 'Personal', 'Fitness', 'Shopping', 'Other']).optional(),
  dueDate: z.string().datetime({ offset: true }).optional().nullable(),
  tags: z.array(z.string()).optional(),
  subtasks: z.array(z.object({ title: z.string().min(1), completed: z.boolean() })).optional(),
});

const UpdateTaskSchema = CreateTaskSchema.partial();

export async function listTasks(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { status, project, priority, dueBefore, dueAfter, search, category, page = '1', limit = '20' } = req.query;

    const filter: Record<string, unknown> = { owner: req.user!.id };
    if (typeof status === 'string') filter.status = status;
    if (project === 'null') filter.project = null;
    else if (typeof project === 'string') filter.project = project;
    if (typeof priority === 'string') filter.priority = priority;
    if (typeof category === 'string' && category !== 'All') filter.category = category;
    if (typeof dueBefore === 'string' || typeof dueAfter === 'string') {
      filter.dueDate = {};
      if (typeof dueBefore === 'string') (filter.dueDate as Record<string, Date>).$lte = new Date(dueBefore);
      if (typeof dueAfter === 'string') (filter.dueDate as Record<string, Date>).$gte = new Date(dueAfter);
    }
    if (typeof search === 'string' && search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    const pageStr = typeof page === 'string' ? page : '1';
    const limitStr = typeof limit === 'string' ? limit : '20';
    const skip = (parseInt(pageStr) - 1) * parseInt(limitStr);
    const [tasks, total] = await Promise.all([
      Task.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limitStr)).populate('project', 'name color'),
      Task.countDocuments(filter),
    ]);

    res.json({ tasks, total, page: parseInt(pageStr), pages: Math.ceil(total / parseInt(limitStr)) });
  } catch (err) {
    next(err);
  }
}

export async function getTask(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const task = await Task.findOne({ _id: req.params.id, owner: req.user!.id }).populate('project', 'name color');
    if (!task) return next(createError('Task not found', 404, 'NOT_FOUND'));
    res.json(task);
  } catch (err) {
    next(err);
  }
}

export async function createTask(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = CreateTaskSchema.safeParse(req.body);
    if (!parsed.success) return next(createError(parsed.error.errors[0].message, 400, 'VALIDATION_ERROR'));

    const data = parsed.data;
    const task = await Task.create({
      ...data,
      owner: req.user!.id,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    });
    
    await logActivity(req.user!.id, 'TASK_CREATED', `Created task "${task.title}"`, task.id, 'Task');
    
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

export async function updateTask(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = UpdateTaskSchema.safeParse(req.body);
    if (!parsed.success) return next(createError(parsed.error.errors[0].message, 400, 'VALIDATION_ERROR'));

    const data: Record<string, unknown> = { ...parsed.data };
    if (data.dueDate) data.dueDate = new Date(data.dueDate as string);

    // Set completedAt when status flips to done
    if (data.status === 'done') data.completedAt = new Date();
    else if (data.status && data.status !== 'done') data.completedAt = null;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, owner: req.user!.id },
      data,
      { new: true, runValidators: true }
    ).populate('project', 'name color');

    if (!task) return next(createError('Task not found', 404, 'NOT_FOUND'));

    if (data.status === 'done') {
      await logActivity(req.user!.id, 'TASK_COMPLETED', `Completed task "${task.title}"`, task.id, 'Task');
    } else {
      await logActivity(req.user!.id, 'TASK_UPDATED', `Updated task "${task.title}"`, task.id, 'Task');
    }

    res.json(task);
  } catch (err) {
    next(err);
  }
}

export async function patchStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { status } = z.object({ status: z.enum(['todo', 'in-progress', 'done']) }).parse(req.body);
    const update: Record<string, unknown> = { status };
    if (status === 'done') update.completedAt = new Date();
    else update.completedAt = null;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, owner: req.user!.id },
      update,
      { new: true }
    );
    if (!task) return next(createError('Task not found', 404, 'NOT_FOUND'));
    
    if (status === 'done') {
      await logActivity(req.user!.id, 'TASK_COMPLETED', `Completed task "${task.title}"`, task.id, 'Task');
    } else {
      await logActivity(req.user!.id, 'TASK_UPDATED', `Updated task "${task.title}"`, task.id, 'Task');
    }
    
    res.json(task);
  } catch (err) {
    next(err);
  }
}

export async function deleteTask(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user!.id });
    if (!task) return next(createError('Task not found', 404, 'NOT_FOUND'));
    
    await logActivity(req.user!.id, 'TASK_DELETED', `Deleted task "${task.title}"`, task.id, 'Task');
    
    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
}
