import { Request, Response, NextFunction } from 'express';
import { logger } from '@/shared/utils/logger';

export const loggingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const logData = {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${Date.now() - startTime}ms`,
      userAgent: req.get('user-agent'),
      ip: req.ip,
      context: 'HttpRequest',
      userId: req.user?.id,
      query: Object.keys(req.query).length ? req.query : undefined,
      body: Object.keys(req.body || {}).length ? req.body : undefined,
    };

    if (res.statusCode >= 400) {
      logger.error(`Request failed: ${req.method} ${req.originalUrl}`, logData);
    } else {
      logger.info(
        `Request completed: ${req.method} ${req.originalUrl}`,
        logData
      );
    }
  });

  next();
};
