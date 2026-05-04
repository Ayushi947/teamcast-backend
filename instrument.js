// This file is required for Sentry to work properly
// It must be imported at the very top of your main application file
// before any other imports

// Import Sentry and initialize it early
import { logger } from '@/shared/utils/logger';
import Sentry from '@sentry/node';

// Only initialize Sentry for specific environments
const allowedEnvironments = ['development', 'production', 'qa'];
const currentEnv = process.env.NODE_ENV || 'development';

if (allowedEnvironments.includes(currentEnv)) {
  // Basic initialization - will be overridden by SentryService
  Sentry.init({
    dsn: process.env.SENTRY_DSN || '',
    environment: currentEnv,
    tracesSampleRate: parseFloat(
      process.env.SENTRY_TRACES_SAMPLE_RATE || '1.0'
    ),
    profilesSampleRate: parseFloat(
      process.env.SENTRY_PROFILES_SAMPLE_RATE || '1.0'
    ),
    sendDefaultPii: true,
    debug: currentEnv === 'development',
    maxBreadcrumbs: currentEnv === 'development' ? 100 : 50,

    // Set initial tags
    initialScope: {
      tags: {
        environment: currentEnv,
        nodeEnv: currentEnv,
        appName: process.env.APP_NAME || 'Teamcast Backend',
        version: process.env.npm_package_version || '1.0.0',
      },
      contexts: {
        system: {
          nodeVersion: process.version,
          platform: process.platform,
          architecture: process.arch,
          pid: process.pid,
          uptime: process.uptime(),
        },
      },
    },
  });
} else {
  logger.info(
    `Sentry disabled for environment: ${currentEnv} (not in allowed list: ${allowedEnvironments.join(', ')})`
  );
}

// Export Sentry for use in other parts of the application
export default Sentry;
