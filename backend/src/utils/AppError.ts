export interface FieldError {
  field: string;
  message: string;
}

export interface AppError extends Error {
  isAppError: true;
  statusCode: number;
  code: string;
  details?: FieldError[];
}

export const AppError = (
  message: string,
  statusCode = 500,
  code = 'INTERNAL_ERROR',
  details?: FieldError[],
): AppError => {
  const error = new Error(message) as AppError;
  error.isAppError = true;
  error.statusCode = statusCode;
  error.code = code;
  if (details) error.details = details;
  return error;
};

export const isAppError = (err: unknown): err is AppError =>
  typeof err === 'object' && err !== null && (err as AppError).isAppError === true;
