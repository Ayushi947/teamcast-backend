import { Request, Response, NextFunction } from 'express';
import { ENV } from '@/config/env';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';

/**
 * Middleware to validate API key for cron tasks
 */
export const validateApiKey = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    throw new AppError('API key is required', 401, ErrorCode.UNAUTHORIZED);
  }

  if (apiKey !== ENV.CRON_API_KEY) {
    throw new AppError('Invalid API key', 401, ErrorCode.UNAUTHORIZED);
  }

  next();
};
