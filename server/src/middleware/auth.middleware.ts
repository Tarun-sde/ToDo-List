import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: { message: 'Missing or invalid authorization header', code: 'UNAUTHORIZED' } });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as { id: string; email: string };
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: { message: 'Token expired or invalid', code: 'TOKEN_INVALID' } });
  }
}
