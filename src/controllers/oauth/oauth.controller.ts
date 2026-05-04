import { Request, Response, NextFunction } from 'express';
import { BaseController } from '@/controllers/common/base.controller';
import { OAuthService } from '@/services/oauth/oauth.service';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';
import { OAuthProviderEnum } from '@/shared/models/common/enums';

import {
  IOAuthProviders,
  IOAuthAuthUrl,
  IOAuthLoginDone,
} from '@/shared/models/domain/oauth/oauth.domain';

export class OAuthController extends BaseController {
  constructor(private oauthService: OAuthService) {
    super();
  }

  /**
   * Convert provider parameter to uppercase enum value
   */
  private normalizeProvider(provider: string): OAuthProviderEnum {
    const normalizedProvider = provider.toUpperCase() as OAuthProviderEnum;

    if (!['GOOGLE', 'GITHUB'].includes(normalizedProvider)) {
      logger.error('Invalid OAuth provider attempted', {
        provider,
        context: 'OAuthController.normalizeProvider',
      });
      throw new AppError(
        'Invalid OAuth provider. Supported providers: google, github',
        400,
        ErrorCode.INVALID_INPUT
      );
    }

    return normalizedProvider;
  }

  /**
   * Get available OAuth providers
   */
  getProviders = (req: Request, res: Response, next: NextFunction): void => {
    this.handleRequest<IOAuthProviders>(req, res, next, async () => {
      return await this.oauthService.getProviders();
    });
  };

  /**
   * Get OAuth authorization URL
   */
  getAuthUrl = (req: Request, res: Response, next: NextFunction): void => {
    this.handleRequest<IOAuthAuthUrl>(req, res, next, async () => {
      const { provider } = req.params;
      const { userType, state, returnUrl } = req.query;

      const normalizedProvider = this.normalizeProvider(provider);

      return await this.oauthService.getAuthorizationUrl(
        normalizedProvider,
        userType as string,
        state as string,
        returnUrl as string
      );
    });
  };

  /**
   * Handle OAuth callback
   */
  handleCallback = (req: Request, res: Response, next: NextFunction): void => {
    this.handleRequest<IOAuthLoginDone>(req, res, next, async () => {
      const { provider } = req.params;
      const { code, state, error, error_description } = req.query;

      if (error) {
        const errorMessage =
          error_description || error || 'OAuth authentication failed';
        logger.error('OAuth provider returned error', {
          provider,
          error,
          errorDescription: error_description,
          context: 'OAuthController.handleCallback',
        });
        throw new AppError(
          `OAuth authentication failed: ${errorMessage}`,
          400,
          ErrorCode.OAUTH_AUTHENTICATION_FAILED
        );
      }

      if (!code) {
        logger.error('No authorization code received', {
          provider,
          context: 'OAuthController.handleCallback',
        });
        throw new AppError(
          'Authorization code is required',
          400,
          ErrorCode.INVALID_INPUT
        );
      }

      const normalizedProvider = this.normalizeProvider(provider);

      return await this.oauthService.handleCallback(
        normalizedProvider,
        code as string,
        state as string
      );
    });
  };
}
