import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler(_req, res) {
    res.status(429).json({
      error: { message: 'Too many requests, try again later', code: 'RATE_LIMITED' },
    });
  },
});

// protects AI provider budget
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler(_req, res) {
    res.status(429).json({
      error: { message: 'Too many messages, try again later', code: 'RATE_LIMITED' },
    });
  },
});
