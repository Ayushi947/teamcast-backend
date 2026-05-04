import * as Sentry from '@sentry/node';
import { ENV } from '@/config/env';
import { logger } from '@/shared/utils/logger';
import { singleton } from '@/shared/decorators/singleton';
import { AppError } from '@/utils/app.error';

@singleton
export class SentryService {
  private isInitialized = false;

  constructor() {
    this.initializeSentry();
  }

  private initializeSentry(): void {
    if (!ENV.SENTRY_ENABLE || !ENV.SENTRY_DSN) {
      logger.info('Sentry is disabled or DSN not provided');
      return;
    }

    // Only enable Sentry for specific environments
    const allowedEnvironments = ['development', 'production', 'qa'];
    if (!allowedEnvironments.includes(ENV.NODE_ENV)) {
      logger.info(
        `Sentry disabled for environment: ${ENV.NODE_ENV} (not in allowed list: ${allowedEnvironments.join(', ')})`
      );
      return;
    }

    try {
      Sentry.init({
        dsn: ENV.SENTRY_DSN,
        environment: ENV.NODE_ENV || 'development',
        tracesSampleRate: ENV.SENTRY_TRACES_SAMPLE_RATE,
        profilesSampleRate: ENV.SENTRY_PROFILES_SAMPLE_RATE,
        sendDefaultPii: true,
        debug: ENV.NODE_ENV === 'development',
        maxBreadcrumbs: ENV.NODE_ENV === 'development' ? 100 : 50,

        // Performance Monitoring
        beforeSend(event) {
          // Environment-specific filtering
          if (ENV.NODE_ENV === 'development') {
            // In development, capture everything
            return event;
          } else if (ENV.NODE_ENV === 'production') {
            // In production, filter out certain types of errors
            if (event.exception && event.exception.values) {
              const errorMessage = event.exception.values[0]?.value || '';
              // Filter out common development errors
              if (
                errorMessage.includes('ECONNREFUSED') ||
                errorMessage.includes('ENOTFOUND') ||
                errorMessage.includes('localhost')
              ) {
                return null; // Don't send to Sentry
              }
            }
          }
          return event;
        },

        // Environment-specific sampling
        beforeSendTransaction(event) {
          if (ENV.NODE_ENV === 'production') {
            // Reduce transaction sampling in production
            return Math.random() < 0.1 ? event : null;
          }
          return event;
        },
      });

      this.isInitialized = true;

      // Set global tags and context for environment
      this.setTag('environment', ENV.NODE_ENV || 'development');
      this.setTag('nodeEnv', ENV.NODE_ENV || 'development');
      this.setTag('appName', ENV.APP_NAME || 'Teamcast Backend');
      this.setTag('version', process.env.npm_package_version || '1.0.0');

      // Set environment context
      this.setContext('system', {
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
        pid: process.pid,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      });

      logger.info(
        `Sentry initialized for environment: ${ENV.NODE_ENV || 'development'}`
      );
    } catch (error) {
      logger.error('Failed to initialize Sentry', { error });
      this.isInitialized = false;
    }
  }

  public getSentry(): typeof Sentry {
    return Sentry;
  }

  public isSentryEnabled(): boolean {
    return this.isInitialized;
  }

  public captureException(error: Error, context?: any): void {
    if (!this.isInitialized) {
      logger.error('Sentry not initialized, logging error locally', {
        error,
        context,
      });
      return;
    }

    // Set additional context for better error tracking
    this.setTag('service', 'teamcast-backend');
    this.setTag('node_version', process.version);
    this.setTag('platform', process.platform);
    this.setTag('arch', process.arch);

    // Set user context if available
    if (context?.request?.user) {
      this.setUser({
        id: context.request.user.id || 'unknown',
        email: context.request.user.email,
        username: context.request.user.username,
      });
    }

    // Set additional context
    this.setContext('request', {
      method: context?.request?.method,
      url: context?.request?.url,
      ip: context?.request?.ip,
      userAgent: context?.request?.userAgent,
    });

    this.setContext('environment', {
      nodeEnv: ENV.NODE_ENV,
      sentryEnv: ENV.NODE_ENV,
      appName: ENV.APP_NAME,
      timestamp: context?.timestamp,
    });

    this.setContext('process', context?.processInfo || {});

    Sentry.captureException(error, {
      extra: context,
      tags: {
        environment: ENV.NODE_ENV || 'development',
        service: 'teamcast-backend',
        nodeEnv: ENV.NODE_ENV || 'development',
        route: context?.route || 'unknown',
      },
    });
  }

  public captureMessage(
    message: string,
    level: Sentry.SeverityLevel = 'info',
    context?: any
  ): void {
    if (!this.isInitialized) {
      logger.info('Sentry not initialized, logging message locally', {
        message,
        level,
        context,
      });
      return;
    }

    Sentry.captureMessage(message, {
      level,
      extra: context,
      tags: {
        environment: ENV.NODE_ENV || 'development',
        service: 'teamcast-backend',
      },
    });
  }

  public setUser(user: {
    id: string;
    email?: string;
    username?: string;
  }): void {
    if (this.isInitialized) {
      Sentry.setUser(user);
    }
  }

  public setTag(key: string, value: string): void {
    if (this.isInitialized) {
      Sentry.setTag(key, value);
    }
  }

  public setContext(name: string, context: Record<string, any>): void {
    if (this.isInitialized) {
      Sentry.setContext(name, context);
    }
  }

  public setupExpressErrorHandler(app: any): void {
    if (this.isInitialized) {
      Sentry.setupExpressErrorHandler(app);
    }
  }

  /**
   * Determines if an error should be tracked in Sentry
   * Business logic errors (4xx) should not be tracked as they are expected user behavior
   * @param error The error to evaluate
   * @param statusCode The HTTP status code
   * @returns true if the error should be tracked in Sentry
   */
  public shouldTrackError(error: Error, statusCode: number): boolean {
    // Don't track business logic errors (4xx status codes)
    if (statusCode >= 400 && statusCode < 500) {
      return false;
    }

    // Don't track specific business logic error codes even if they have 5xx status
    if (error instanceof AppError) {
      const businessLogicErrorCodes = [
        'ERR_4002', // ALREADY_EXISTS
        'ERR_4004', // EMAIL_ALREADY_EXISTS
        'ERR_4001', // NOT_FOUND
        'ERR_4003', // CONFLICT
        'ERR_1002', // INVALID_CREDENTIALS
        'ERR_1003', // TOKEN_EXPIRED
        'ERR_1004', // INVALID_TOKEN
        'ERR_1005', // USER_NOT_ACTIVE
        'ERR_1006', // EMAIL_NOT_VERIFIED
        'ERR_2001', // FORBIDDEN
        'ERR_2002', // INSUFFICIENT_PERMISSIONS
        'ERR_3001', // INVALID_INPUT
        'ERR_3002', // MISSING_REQUIRED_FIELD
        'ERR_3003', // INVALID_EMAIL
        'ERR_3004', // INVALID_PASSWORD
        'ERR_3005', // INVALID_REQUEST
        'ERR_3006', // VALIDATION_ERROR
        'ERR_3007', // INVITATION_EXPIRED
        'ERR_3008', // PASSWORD_CHANGE_FAILED
      ];

      if (businessLogicErrorCodes.includes((error as AppError).code)) {
        return false;
      }
    }

    // Track all other errors (5xx, unexpected errors, etc.)
    return true;
  }
}
