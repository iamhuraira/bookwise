import { Request, Response, NextFunction } from 'express';
import { isAppError } from '../utils/AppError.js';

interface PostgresError extends Error {
  code?: string;
}

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (isAppError(err)) {
    const body: { error: { message: string; code: string; details?: typeof err.details } } = {
      error: { message: err.message, code: err.code },
    };
    if (err.details) {
      body.error.details = err.details;
    }
    res.status(err.statusCode).json(body);
    return;
  }

  const pgErr = err as PostgresError;
  if (pgErr.code === '23505') {
    res.status(409).json({
      error: { message: 'Resource already exists', code: 'DUPLICATE' },
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
  });
};
