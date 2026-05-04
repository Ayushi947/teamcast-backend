import { Request, Response } from 'express';
import { ApiResponse } from '../utils/api.response';
import { ErrorCode } from '@/utils/error.codes';
import { setCorsHeaders } from '@/utils/cors.helper';

/**
 * Middleware to handle 404 Not Found errors
 * This should be mounted after all other routes
 */
export const notFoundHandler = (req: Request, res: Response) => {
  // Ensure CORS headers are preserved on 404 responses
  setCorsHeaders(res, req.headers.origin);

  ApiResponse.error(
    res,
    '🔍 Ooops! Looks like you are lost. 🗺️',
    ErrorCode.NOT_FOUND,
    404
  );
};
