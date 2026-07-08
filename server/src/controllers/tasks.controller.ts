import { Response, NextFunction } from 'express';
import { z } from 'zod';
import Task from '../models/Task.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { createError } from '../middleware/errorHandler.js';

const CreateTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  project: z.string().optional().nullable(),
  status: z.enum(['todo', 'in-progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().datetime({ offset: true }).optional().nullable(),
  tags: z.array(z.string()).optional(),
  subtasks: z.array(z.object({ title: z.string().min(1), completed: z.boolean() })).optional(),
});

const UpdateTaskSchema = CreateTaskSchema.partial();

export async function listTasks(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { status, project, priority, dueBefore, dueAfter, search, page = '1', limit = '20' } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = { owner: req.user!.id };
    if (status) filter.status = status;
    if (project === 'null') filter.project = null;
    else if (project) filter.project = project;
    if (priority) filter.priority = priority;
    if (dueBefore || dueAfter) {
      filter.dueDate = {};
      if (dueBefore) (filter.dueDate as Record<string, Date>).$lte = new Date(dueBefore);
      if (dueAfter) (filter.dueDate as Record<string, Date>).$gte = new Date(dueAfter);
    }
    if (search) filter.title = { $regex: search, $options: 'i' };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [tasks, total] = await Promise.all([
      Task.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).populate('project', 'name color'),
      Task.countDocuments(filter),
    ]);

    res.json({ tasks, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
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
    res.json(task);
  } catch (err) {
    next(err);
  }
}

export async function deleteTask(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user!.id });
    if (!task) return next(createError('Task not found', 404, 'NOT_FOUND'));
    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
}
