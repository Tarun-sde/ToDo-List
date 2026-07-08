import { Response, NextFunction } from 'express';
import { z } from 'zod';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { createError } from '../middleware/errorHandler.js';

const ProjectSchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export async function listProjects(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const projects = await Project.find({ owner: req.user!.id }).sort({ createdAt: -1 });

    const counts = await Task.aggregate([
      { $match: { owner: req.user!.id, project: { $in: projects.map(p => p._id) } } },
      { $group: { _id: '$project', count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map(c => [c._id.toString(), c.count]));

    res.json(projects.map(p => ({ ...p.toObject(), taskCount: countMap[p.id] ?? 0 })));
  } catch (err) {
    next(err);
  }
}

export async function getProject(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const project = await Project.findOne({ _id: req.params.id, owner: req.user!.id });
    if (!project) return next(createError('Project not found', 404, 'NOT_FOUND'));
    res.json(project);
  } catch (err) {
    next(err);
  }
}

export async function createProject(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = ProjectSchema.safeParse(req.body);
    if (!parsed.success) return next(createError(parsed.error.errors[0].message, 400, 'VALIDATION_ERROR'));

    const project = await Project.create({ ...parsed.data, owner: req.user!.id });
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
}

export async function updateProject(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = ProjectSchema.partial().safeParse(req.body);
    if (!parsed.success) return next(createError(parsed.error.errors[0].message, 400, 'VALIDATION_ERROR'));

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, owner: req.user!.id },
      parsed.data,
      { new: true, runValidators: true }
    );
    if (!project) return next(createError('Project not found', 404, 'NOT_FOUND'));
    res.json(project);
  } catch (err) {
    next(err);
  }
}

export async function deleteProject(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, owner: req.user!.id });
    if (!project) return next(createError('Project not found', 404, 'NOT_FOUND'));

    await Task.updateMany({ project: project._id }, { $set: { project: null } });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
}
