import { Request, Response, NextFunction } from 'express';
import { ENV } from '@/config/env';

export const addDelay = (req: Request, _res: Response, next: NextFunction) => {
  // Only add delay for API routes if delay is configured
  if (req.path.startsWith('/api/') && ENV.API_DELAY_MS > 0) {
    setTimeout(() => {
      next();
    }, ENV.API_DELAY_MS);
  } else {
    next();
  }
};
