import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { RateLimitError } from '../utils/error';

// Helper to get client identifier (IP or user ID)
const getClientIdentifier = (req: Request): string => {
  // If user is authenticated, use their ID
  if (req.user && req.user.id) {
    return `user-${req.user.id}`;
  }

  // Otherwise use IP address
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? String(forwarded).split(',')[0] : req.ip;
  return `ip-${ip}`;
};

// Custom key generator that combines IP and user ID when available
const keyGenerator = (req: Request): string => {
  return getClientIdentifier(req);
};

// Standard error handler for rate limiting
const standardHandler = (_req: Request, res: Response) => {
  const error = new RateLimitError(
    'Too many requests, please try again later.'
  );
  res.status(error.statusCode).json({
    success: false,
    error: {
      message: error.message,
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: res.getHeader('Retry-After'),
    },
  });
};

// Authentication endpoints rate limiter (stricter)
export const authLimiter = rateLimit({
  windowMs: 1 * 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator,
  handler: standardHandler,
  skipSuccessfulRequests: false, // Count all requests, not just failed ones
  skip: (req: Request) => {
    // Skip rate limiting for certain trusted IPs if needed
    const trustedIps = process.env.TRUSTED_IPS?.split(',') || [];
    const clientIp = req.ip || '';
    return trustedIps.includes(clientIp);
  },
});

// Password reset rate limiter (very strict)
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit to 3 password reset requests per hour
  message: 'Too many password reset requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: standardHandler,
  skipFailedRequests: true, // Don't count failed requests
});

// General API endpoints rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: standardHandler,
  skip: (req: Request) => {
    // Skip rate limiting for health checks and status endpoints
    const exemptPaths = ['/health', '/status', '/metrics'];
    return exemptPaths.includes(req.path);
  },
});

// File upload rate limiter (strict to prevent abuse)
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit to 10 uploads per 15 minutes
  message: 'Too many file uploads, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: standardHandler,
});

// Create custom rate limiter for specific needs
export const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message?: string;
  skipFailedRequests?: boolean;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || 'Too many requests',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    handler: standardHandler,
    skipFailedRequests: options.skipFailedRequests || false,
  });
};

// Rate limiter for sensitive operations (e.g., admin actions)
export const sensitiveOperationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Very limited
  message: 'Too many sensitive operations, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // For sensitive operations, always use user ID if available
    if (req.user && req.user.id) {
      return `sensitive-user-${req.user.id}`;
    }
    return `sensitive-ip-${req.ip}`;
  },
  handler: standardHandler,
});
