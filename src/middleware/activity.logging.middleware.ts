import { Request, Response, NextFunction } from 'express';
import { activityHelper } from '@/services/activity/activity.helper.service';
import { logger } from '@/shared/utils/logger';
import {
  ActivityModuleEnum,
  ActivityEntityTypeEnum,
} from '@/shared/models/common/enums';
import { IApiRequest } from '@/shared/models/api/common/common.api';

interface ActivityLoggingOptions {
  module: ActivityModuleEnum;
  action?: string;
  description?: string;
  skipRoutes?: string[];
  entityIdParam?: string; // Parameter name to extract entity ID from (e.g., 'id', 'candidateId')
  entityType?: ActivityEntityTypeEnum;
}

/**
 * Middleware to automatically log activities based on HTTP requests
 */
export const createActivityLoggingMiddleware = (
  options: ActivityLoggingOptions
) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    // Skip if user is not authenticated
    if (!req.user?.id) {
      return next();
    }

    // Skip certain routes if specified
    if (options.skipRoutes?.some((route) => req.path.includes(route))) {
      return next();
    }

    try {
      // Extract IP and User-Agent
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      // Determine action based on HTTP method if not provided
      const action = options.action || getActionFromMethod(req.method);

      // Extract entity ID if parameter is specified
      let entityId: string | undefined;
      if (options.entityIdParam && req.params[options.entityIdParam]) {
        entityId = req.params[options.entityIdParam];
      }

      // Generate description if not provided
      const description =
        options.description ||
        generateDescription(
          req.method,
          req.path,
          req.user.name || req.user.email
        );

      // Log the activity
      await activityHelper.logActivity(
        req.user.id,
        {
          module: options.module,
          action,
          entityId,
          entityType: options.entityType,
          description,
          metadata: {
            method: req.method,
            path: req.path,
            query: req.query,
            // Don't log sensitive data like passwords
            body: sanitizeRequestBody(req.body),
          },
        },
        ipAddress,
        userAgent
      );
    } catch (error) {
      // Log error but don't fail the request
      logger.error('Activity logging middleware error', {
        error,
        userId: req.user?.id,
        path: req.path,
        method: req.method,
        context: 'ActivityLoggingMiddleware',
      });
    }

    next();
  };
};

/**
 * Generate action name based on HTTP method
 */
function getActionFromMethod(method: string): string {
  switch (method.toUpperCase()) {
    case 'GET':
      return 'VIEW';
    case 'POST':
      return 'CREATE';
    case 'PUT':
    case 'PATCH':
      return 'UPDATE';
    case 'DELETE':
      return 'DELETE';
    default:
      return method.toUpperCase();
  }
}

/**
 * Generate human-readable description
 */
function generateDescription(
  method: string,
  path: string,
  userName: string
): string {
  const action = getActionFromMethod(method);
  const resource = path.split('/').pop() || 'resource';
  return `${userName} performed ${action} on ${resource}`;
}

/**
 * Remove sensitive data from request body for logging
 */
function sanitizeRequestBody(body: IApiRequest['data']): IApiRequest['data'] {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sensitiveFields = [
    'password',
    'confirmPassword',
    'token',
    'refreshToken',
    'accessToken',
    'apiKey',
    'secret',
    'key',
    'auth',
  ];

  const sanitized = { ...body };

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Pre-configured middleware for common modules
 */
export const candidateActivityLogger = createActivityLoggingMiddleware({
  module: ActivityModuleEnum.CANDIDATE,
  entityIdParam: 'id',
  entityType: ActivityEntityTypeEnum.CANDIDATE,
});

export const clientActivityLogger = createActivityLoggingMiddleware({
  module: ActivityModuleEnum.CLIENT,
  entityIdParam: 'id',
  entityType: ActivityEntityTypeEnum.CLIENT,
});

export const jobActivityLogger = createActivityLoggingMiddleware({
  module: ActivityModuleEnum.JOB,
  entityIdParam: 'id',
  entityType: ActivityEntityTypeEnum.JOB_POSTING,
});

export const applicationActivityLogger = createActivityLoggingMiddleware({
  module: ActivityModuleEnum.APPLICATION,
  entityIdParam: 'id',
  entityType: ActivityEntityTypeEnum.JOB_APPLICATION,
});

export const assessmentActivityLogger = createActivityLoggingMiddleware({
  module: ActivityModuleEnum.ASSESSMENT,
  entityIdParam: 'id',
  entityType: ActivityEntityTypeEnum.AI_ASSESSMENT,
});
