import { Request, Response, NextFunction } from 'express';
import { ENV } from '@/config/env';
import { logger } from '@/shared/utils/logger';
// import { setCorsHeaders, getCorsAllowedOrigin } from '@/utils/cors.helper';

/**
 * CORS Middleware Configuration
 * Handles Cross-Origin Resource Sharing for the Teamcast backend
 */
export const corsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Validate required environment variables
  if (!ENV.FRONTEND_URL) {
    logger.error(
      'CORS Error: FRONTEND_URL environment variable is not defined'
    );
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Define allowed origins with environment-specific handling
  const getAllowedOrigins = (): string[] => {
    const baseOrigins = [
      'https://teamcast.ai',
      'https://*.teamcast.ai',
      'https://www.teamcast.ai',
      ENV.FRONTEND_URL,
    ];

    // Add development origins for non-production environments
    if (ENV.NODE_ENV !== 'production') {
      baseOrigins.push(
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:4300',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:4300'
      );
    }

    // Remove duplicates and filter out undefined values
    return [...new Set(baseOrigins.filter(Boolean))];
  };

  const allowedOrigins = getAllowedOrigins();
  const requestOrigin = req.headers.origin;

  // Determine the origin to set based on environment and request origin
  let allowedOrigin: string;

  if (ENV.ENV_NAME === 'local') {
    // Allow all origins in local development
    allowedOrigin = '*';
  } else if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    // Use the specific requesting origin if it's in our allowlist
    allowedOrigin = requestOrigin;
  } else if (
    ENV.NODE_ENV === 'development' &&
    requestOrigin?.includes('localhost')
  ) {
    // Be more permissive with localhost in development
    allowedOrigin = requestOrigin;
  } else {
    // Fallback to the configured frontend URL for unknown origins
    allowedOrigin = ENV.FRONTEND_URL;
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-goog-resumable, x-goog-content-length-range, X-Requested-With, Accept, x-user-data, x-api-key, x-request-id, x-no-compression, x-forwarded-for'
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader(
    'Access-Control-Expose-Headers',
    'Content-Length, Content-Type, Authorization, X-Total-Count'
  );
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

  // Development debugging
  if (ENV.NODE_ENV === 'development' && requestOrigin) {
    logger.debug(`CORS: ${req.method} request from origin: ${requestOrigin}`);
    if (!allowedOrigins.includes(requestOrigin) && ENV.ENV_NAME !== 'local') {
      logger.warn(
        `CORS Warning: Origin ${requestOrigin} not in allowed list. Using fallback: ${allowedOrigin}`
      );
    }
  }

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
};
