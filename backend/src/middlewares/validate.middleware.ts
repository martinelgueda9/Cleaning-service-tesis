import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const messages = err.errors.map((e) => {
          const path = e.path.length > 0 ? `${e.path.join('.')}: ` : '';
          return `${path}${e.message}`;
        });

        res.status(400).json({
          ok: false,
          error: 'Error de validación',
          details: messages,
        });
        return;
      }
      next(err);
    }
  };
}
