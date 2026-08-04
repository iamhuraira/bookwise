import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../utils/AppError.js';

export const validate = (schema: z.ZodType) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || 'body',
        message: issue.message,
      }));

      next(AppError('Validation failed', 400, 'VALIDATION_ERROR', details));
      return;
    }

    req.body = result.data;
    next();
  };
};
