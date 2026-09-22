import { Response } from 'express';

export function sendSuccess(res: Response, data: unknown, statusCode = 200) {
  res.status(statusCode).json({ ok: true, data });
}

export function sendError(res: Response, message: string, statusCode = 400) {
  res.status(statusCode).json({ ok: false, error: message });
}
