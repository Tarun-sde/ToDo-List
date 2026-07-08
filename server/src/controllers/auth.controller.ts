import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/User.js';
import { createError } from '../middleware/errorHandler.js';
import { logActivity } from '../services/activity.service.js';

const RegisterSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const UpdateProfileSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(50, "Name must be at most 50 characters"),
  avatarUrl: z.string().url("Must be a valid URL").or(z.literal('')).optional(),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

function signAccess(id: string, email: string) {
  return jwt.sign({ id, email }, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  } as jwt.SignOptions);
}

function signRefresh(id: string) {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  } as jwt.SignOptions);
}

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(createError(parsed.error.errors[0].message, 400, 'VALIDATION_ERROR'));
    }
    const { name, email, password } = parsed.data;

    if (await User.findOne({ email })) {
      return next(createError('Email already in use', 409, 'EMAIL_TAKEN'));
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });

    const accessToken = signAccess(user.id, user.email);
    const refreshToken = signRefresh(user.id);

    res.cookie('refreshToken', refreshToken, COOKIE_OPTS);
    res.status(201).json({ accessToken, user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl } });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(createError('Invalid email or password', 400, 'VALIDATION_ERROR'));
    }
    const { email, password } = parsed.data;

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return next(createError('Invalid email or password', 401, 'INVALID_CREDENTIALS'));
    }

    const accessToken = signAccess(user.id, user.email);
    const refreshToken = signRefresh(user.id);

    res.cookie('refreshToken', refreshToken, COOKIE_OPTS);
    res.json({ accessToken, user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl } });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return next(createError('No refresh token', 401, 'UNAUTHORIZED'));

    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { id: string };
    const user = await User.findById(payload.id);
    if (!user) return next(createError('User not found', 401, 'UNAUTHORIZED'));

    const accessToken = signAccess(user.id, user.email);
    res.json({ accessToken });
  } catch {
    next(createError('Refresh token invalid or expired', 401, 'TOKEN_INVALID'));
  }
}

export function logout(_req: Request, res: Response) {
  res.clearCookie('refreshToken', { path: '/' });
  res.json({ message: 'Logged out' });
}

export async function me(req: Request & { user?: { id: string } }, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.user!.id).select('-passwordHash');
    if (!user) return next(createError('User not found', 404, 'NOT_FOUND'));
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: Request & { user?: { id: string } }, res: Response, next: NextFunction) {
  try {
    const parsed = UpdateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(createError(parsed.error.errors[0].message, 400, 'VALIDATION_ERROR'));
    }
    const { name, avatarUrl } = parsed.data;

    const user = await User.findByIdAndUpdate(
      req.user!.id,
      { name, avatarUrl: avatarUrl || undefined },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!user) return next(createError('User not found', 404, 'NOT_FOUND'));

    await logActivity(req.user!.id, 'PROFILE_UPDATED', 'Updated profile information');

    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req: Request & { user?: { id: string } }, res: Response, next: NextFunction) {
  try {
    const parsed = ChangePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(createError(parsed.error.errors[0].message, 400, 'VALIDATION_ERROR'));
    }
    const { currentPassword, newPassword } = parsed.data;

    const user = await User.findById(req.user!.id);
    if (!user) return next(createError('User not found', 404, 'NOT_FOUND'));

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return next(createError('Current password is incorrect.', 400, 'INVALID_CREDENTIALS'));
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    user.passwordHash = passwordHash;
    await user.save();

    await logActivity(req.user!.id, 'PASSWORD_CHANGED', 'Changed account password');

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    next(err);
  }
}
