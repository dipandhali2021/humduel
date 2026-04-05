import type { Request, Response, NextFunction } from 'express';

export interface ValidationDetail {
  field: string;
  message: string;
}

/**
 * Send a structured 400 validation error response.
 */
export function sendValidationError(
  res: Response,
  details: ValidationDetail[],
  message = 'Validation failed',
): void {
  res.status(400).json({
    error: message,
    code: 'VALIDATION_ERROR',
    details,
  });
}

/**
 * Build a middleware that validates the request body for a set of required
 * string fields. Each field must be present and non-empty after trimming.
 */
export function requireBodyFields(
  ...fields: string[]
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    const details: ValidationDetail[] = [];

    for (const field of fields) {
      const value = (req.body as Record<string, unknown>)[field];
      if (value === undefined || value === null || String(value).trim() === '') {
        details.push({ field, message: `"${field}" is required` });
      }
    }

    if (details.length > 0) {
      sendValidationError(res, details);
      return;
    }

    next();
  };
}
