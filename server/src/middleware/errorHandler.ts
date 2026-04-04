import type { ErrorRequestHandler, RequestHandler } from 'express';
import { NODE_ENV } from '../config.js';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Global Express error handler.
 * Must have 4 parameters to be recognized as error-handling middleware.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err: AppError, _req, res, _next) => {
  const statusCode = err.statusCode ?? 500;
  const message = err.isOperational ? err.message : 'Internal Server Error';

  // Log full error in development
  if (NODE_ENV !== 'production') {
    console.error('[ErrorHandler]', err);
  } else if (statusCode >= 500) {
    // Always log 5xx in production (but omit stack)
    console.error(`[ErrorHandler] ${statusCode} — ${err.message}`);
  }

  res.status(statusCode).json({
    status: 'error',
    message,
    ...(NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

/**
 * 404 handler — mount after all routes.
 */
export const notFoundHandler: RequestHandler = (req, _res, next) => {
  const error: AppError = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  error.isOperational = true;
  next(error);
};
