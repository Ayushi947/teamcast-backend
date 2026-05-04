import { ENV } from '@/config/env';

/**
 * Utility function to determine the allowed CORS origin based on environment and request origin
 */
export const getCorsAllowedOrigin = (requestOrigin?: string): string => {
  // Define allowed origins with environment-specific handling
  const getAllowedOrigins = (): string[] => {
    const baseOrigins = [
      'https://teamcast.ai',
      'https://www.teamcast.ai',
      ENV.FRONTEND_URL,
    ];

    // Add development origins for non-production environments
    if (ENV.NODE_ENV !== 'production') {
      baseOrigins.push(
        'http://localhost:3000',
        'http://localhost:3001',
        'https://localhost:3000',
        'https://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001'
      );
    }

    // Remove duplicates and filter out undefined values
    return [...new Set(baseOrigins.filter(Boolean))];
  };

  const allowedOrigins = getAllowedOrigins();

  // Determine the origin to set based on environment and request origin
  if (ENV.ENV_NAME === 'local') {
    // Allow all origins in local development
    return '*';
  } else if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    // Use the specific requesting origin if it's in our allowlist
    return requestOrigin;
  } else if (
    ENV.NODE_ENV === 'development' &&
    requestOrigin?.includes('localhost')
  ) {
    // Be more permissive with localhost in development
    return requestOrigin;
  } else {
    // Fallback to the configured frontend URL for unknown origins
    return ENV.FRONTEND_URL;
  }
};

/**
 * Utility function to set CORS headers on a response
 */
export const setCorsHeaders = (res: any, requestOrigin?: string): void => {
  const allowedOrigin = getCorsAllowedOrigin(requestOrigin);

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
};
