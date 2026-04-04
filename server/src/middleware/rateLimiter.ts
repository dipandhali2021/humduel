import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter: 100 requests per minute per IP.
 */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many requests, please try again in a minute.',
  },
});

/**
 * Stricter limiter for upload endpoints: 10 requests per minute per IP.
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Upload rate limit exceeded, please try again later.',
  },
});
