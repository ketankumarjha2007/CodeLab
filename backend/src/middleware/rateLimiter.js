import rateLimit from 'express-rate-limit';

export const executionRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,             // 60 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'Internal Error',
    stdout: '',
    stderr: 'Too many execution requests. Please wait a moment before trying again.',
    executionTimeMs: 0
  }
});
