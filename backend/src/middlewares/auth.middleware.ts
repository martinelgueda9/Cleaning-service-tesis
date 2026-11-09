import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Rol } from '@prisma/client';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
  userRole?: Rol;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ ok: false, error: 'Token no proporcionado' });
    return;
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.jwtSecret) as {
      userId: string;
      email: string;
      rol: Rol;
    };
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    req.userRole = decoded.rol;
    next();
  } catch {
    res.status(401).json({ ok: false, error: 'Token inválido o expirado' });
  }
}

export function requireRole(...roles: Rol[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole) {
      res.status(401).json({ ok: false, error: 'No autenticado' });
      return;
    }

    if (!roles.includes(req.userRole)) {
      res.status(403).json({ ok: false, error: 'No tiene permisos para realizar esta acción' });
      return;
    }

    next();
  };
}
