import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/utils/app.error';
import { ApiResponse } from '@/utils/api.response';
import { logger } from '@/shared/utils/logger';
import { MetricsService } from '@/services/metrics/metrics.service';
import { ErrorCode } from '@/utils/error.codes';
import { setCorsHeaders } from '@/utils/cors.helper';
import { SentryService } from '@/services/monitoring/sentry.service';

const metricsService = new MetricsService();
const sentryService = new SentryService();

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = error instanceof AppError ? error.statusCode : 500;

  logger.error({
    message: error.message,
    stack: error.stack,
    context: 'ErrorHandler',
    statusCode,
  });

  // Only capture errors in Sentry if they should be tracked
  if (sentryService.shouldTrackError(error, statusCode)) {
    // Capture error in Sentry with comprehensive context
    sentryService.captureException(error, {
      request: {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        user: (req as any).user,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
      },
      route: req.route?.path || req.path || '/unknown',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      processInfo: {
        pid: process.pid,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
      },
      application: {
        name: process.env.APP_NAME || 'Teamcast Backend',
        version: process.env.npm_package_version || '1.0.0',
      },
    });
  } else {
    logger.info('Skipping Sentry tracking for business logic error', {
      error: error.message,
      statusCode,
      context: 'ErrorHandler',
    });
  }

  // Ensure CORS headers are preserved on error responses
  setCorsHeaders(res, req.headers.origin);
  const route = req.route?.path || req.path || '/unknown';

  metricsService.recordHttpRequest(req.method, route, statusCode, 0);

  if (error instanceof AppError) {
    ApiResponse.error(res, error.message, error.code, error.statusCode);
    return;
  }

  ApiResponse.error(
    res,
    'Internal server error',
    ErrorCode.INTERNAL_SERVER_ERROR,
    500
  );
};
