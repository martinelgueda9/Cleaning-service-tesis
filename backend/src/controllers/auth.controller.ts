import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { sendSuccess, sendError } from '../utils/response.js';

export function login(req: Request, res: Response) {
  
  const { email, password } = req.body;

  if (email !== env.adminEmail || password !== env.adminPass) {
    sendError(res, 'Credenciales incorrectas', 401);
    return;
  }

  const token = jwt.sign({ email: env.adminEmail }, env.jwtSecret, { expiresIn: '8h' });
  sendSuccess(res, { token, user: { email: env.adminEmail } });
}

export function me(req: Request, res: Response) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    sendError(res, 'No autenticado', 401);
    return;
  }

  try {
    const decoded = jwt.verify(header.split(' ')[1], env.jwtSecret) as { email: string };
    sendSuccess(res, { email: decoded.email });
  } catch {
    sendError(res, 'Token inválido', 401);
  }
}
