import { logger } from '@/shared/utils/logger';
import { ENV } from '@/config/env';

export interface StartupDiagnostics {
  database: {
    configured: boolean;
    reachable: boolean;
    error?: string;
  };
  environment: {
    nodeEnv: string;
    port: number;
    timestamp: string;
  };
}

export class StartupDiagnosticsService {
  /**
   * Run comprehensive startup diagnostics
   */
  static async runDiagnostics(): Promise<StartupDiagnostics> {
    const diagnostics: StartupDiagnostics = {
      database: {
        configured: !!ENV.DATABASE_URL,
        reachable: false,
      },
      environment: {
        nodeEnv: ENV.NODE_ENV || 'unknown',
        port: ENV.PORT || 4300,
        timestamp: new Date().toISOString(),
      },
    };

    // Log comprehensive diagnostics
    logger.info('🔍 Startup Diagnostics', {
      database: {
        configured: diagnostics.database.configured,
        hasUrl: !!ENV.DATABASE_URL,
      },
      environment: diagnostics.environment,
    });

    return diagnostics;
  }

  /**
   * Log environment variable status for debugging
   */
  static logEnvironmentStatus(): void {
    logger.info('🔧 Environment Variables Status', {
      database: {
        DATABASE_URL: ENV.DATABASE_URL ? 'SET' : 'NOT_SET',
      },
      oauth: {
        OAUTH_REDIRECT_URL: ENV.OAUTH_REDIRECT_URL ? 'SET' : 'NOT_SET',
        OAUTH_STATE_SECRET: ENV.OAUTH_STATE_SECRET ? 'SET' : 'NOT_SET',
        GOOGLE_OAUTH_CLIENT_ID: ENV.GOOGLE_OAUTH_CLIENT_ID ? 'SET' : 'NOT_SET',
        GOOGLE_OAUTH_CLIENT_SECRET: ENV.GOOGLE_OAUTH_CLIENT_SECRET
          ? 'SET'
          : 'NOT_SET',
        GITHUB_OAUTH_CLIENT_ID: ENV.GITHUB_OAUTH_CLIENT_ID ? 'SET' : 'NOT_SET',
        GITHUB_OAUTH_CLIENT_SECRET: ENV.GITHUB_OAUTH_CLIENT_SECRET
          ? 'SET'
          : 'NOT_SET',
      },
    });
  }
}
