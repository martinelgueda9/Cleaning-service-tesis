import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ ok: false, error: 'Token no proporcionado' });
    return;
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.jwtSecret) as { email: string };
    req.userEmail = decoded.email;
    next();
  } catch {
    res.status(401).json({ ok: false, error: 'Token inválido o expirado' });
  }
}
