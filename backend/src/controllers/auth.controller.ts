import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import * as authService from '../services/auth.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function login(req: AuthRequest, res: Response) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    sendSuccess(res, result);
  } catch (err) {
    sendError(res, (err as Error).message, 401);
  }
}

export async function register(req: AuthRequest, res: Response) {
  try {
    const result = await authService.register(req.body);
    sendSuccess(res, result, 201);
  } catch (err) {
    sendError(res, (err as Error).message, 400);
  }
}

export async function me(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      sendError(res, 'No autenticado', 401);
      return;
    }
    const user = await authService.getMe(req.userId);
    sendSuccess(res, user);
  } catch (err) {
    sendError(res, (err as Error).message, 401);
  }
}
