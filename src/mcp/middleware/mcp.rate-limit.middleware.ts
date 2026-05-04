import { Request, Response, NextFunction } from 'express';
import { logger } from '@/shared/utils/logger';
import { mcpConfig } from '../config/mcp.config';

/**
 * Simple in-memory rate limit store
 * In production, consider using Redis for distributed rate limiting
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore: Map<string, RateLimitEntry> = new Map();

/**
 * Clean up expired entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

/**
 * MCP Rate Limit Middleware
 * Enforces request rate limits per MCP client
 */
export function mcpRateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Skip rate limiting if disabled
  if (!mcpConfig.rateLimit.enabled) {
    return next();
  }

  const clientId = (req as any).mcpClientId || 'anonymous';
  const now = Date.now();
  const windowMs = 60000; // 1 minute window

  const key = `mcp:ratelimit:${clientId}`;
  let entry = rateLimitStore.get(key);

  // Initialize or reset if window expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + windowMs,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  // Check if rate limit exceeded
  if (entry.count > mcpConfig.rateLimit.requestsPerMinute) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);

    logger.warn('MCP: Rate limit exceeded', {
      context: 'mcpRateLimitMiddleware',
      clientId,
      count: entry.count,
      limit: mcpConfig.rateLimit.requestsPerMinute,
    });

    res.setHeader(
      'X-RateLimit-Limit',
      mcpConfig.rateLimit.requestsPerMinute.toString()
    );
    res.setHeader('X-RateLimit-Remaining', '0');
    res.setHeader(
      'X-RateLimit-Reset',
      Math.ceil(entry.resetAt / 1000).toString()
    );
    res.setHeader('Retry-After', retryAfter.toString());

    res.status(429).json({
      jsonrpc: '2.0',
      error: {
        code: -32002,
        message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        data: {
          limit: mcpConfig.rateLimit.requestsPerMinute,
          retryAfter,
        },
      },
    });
    return;
  }

  // Set rate limit headers
  const remaining = Math.max(
    0,
    mcpConfig.rateLimit.requestsPerMinute - entry.count
  );
  res.setHeader(
    'X-RateLimit-Limit',
    mcpConfig.rateLimit.requestsPerMinute.toString()
  );
  res.setHeader('X-RateLimit-Remaining', remaining.toString());
  res.setHeader(
    'X-RateLimit-Reset',
    Math.ceil(entry.resetAt / 1000).toString()
  );

  next();
}
