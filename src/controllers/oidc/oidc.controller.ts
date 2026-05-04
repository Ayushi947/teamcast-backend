/**
 * OIDC Controller for Deel SSO Integration
 *
 * Handles HTTP requests for OIDC endpoints:
 * - Discovery endpoint (.well-known/openid-configuration)
 * - JWKS endpoint (JSON Web Key Set)
 * - Deel SSO initiation
 * - UserInfo endpoint
 *
 * Environment-driven Configuration:
 * - DEV: devapi.teamcast.ai
 * - PROD: api.teamcast.ai
 */

import { Request, Response, NextFunction } from 'express';
import { BaseController } from '@/controllers/common/base.controller';
import { OIDCProviderService } from '@/services/oidc/oidc.provider.service';
import { singleton } from '@/shared/decorators/singleton';
import { AppError } from '@/utils/app.error';
import { logger } from '@/shared/utils/logger';
import { ENV } from '@/config/env';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { IAuthUser } from '@/shared/models/domain/auth/auth.user.domain';

@singleton
export class OIDCController extends BaseController {
  private readonly oidcService: OIDCProviderService;

  constructor() {
    super();
    this.oidcService = new OIDCProviderService();
  }

  /**
   * GET /.well-known/openid-configuration
   * Returns OIDC discovery configuration
   * Deel fetches this first to discover all OIDC endpoints
   *
   * IMPORTANT: Must return raw JSON per OpenID Connect spec (no wrapper)
   */
  getDiscoveryConfiguration = (
    _req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    try {
      logger.info('OIDC Discovery configuration requested');
      const config = this.oidcService.getDiscoveryConfiguration();
      // Return raw OIDC configuration (no wrapper) per OpenID Connect spec
      res.json(config);
    } catch (error) {
      logger.error('Failed to get OIDC discovery configuration', error);
      next(error);
    }
  };

  /**
   * GET /api/v1/oidc/jwks
   * Returns JSON Web Key Set (JWKS)
   * Deel uses this to get public keys for verifying ID Token signatures
   *
   * IMPORTANT: Must return raw JSON per JWKS spec (no wrapper)
   */
  getJWKS = (_req: Request, res: Response, next: NextFunction): void => {
    try {
      logger.info('JWKS requested');
      const jwks = this.oidcService.getJWKS();
      // Return raw JWKS (no wrapper) per RFC 7517 spec
      res.json(jwks);
    } catch (error) {
      logger.error('Failed to get JWKS', error);
      next(error);
    }
  };

  /**
   * POST /api/v1/oidc/deel/sso
   * Initiates SSO to Deel
   * Requires user to be authenticated (JWT middleware)
   *
   * Flow:
   * 1. User is authenticated in TeamCast (Google or Email/Password)
   * 2. User clicks "Hire on Deel" button
   * 3. This endpoint generates ID Token
   * 4. Returns HTML with auto-redirect to Deel
   */
  initiateDeelSSO = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Check if user is authenticated
      if (!req.user?.id) {
        throw new AppError('Unauthorized. Please login first.', 401);
      }

      const userId = req.user.id;
      logger.info(`Deel SSO initiated for user ${userId}`);

      // Generate ID Token and get Deel SSO URL
      const deelSSOUrl = await this.oidcService.initiateDeelSSO(userId);

      // Return HTML with auto-redirect
      // This provides better UX than direct redirect
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Connecting to Deel...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .container {
      text-align: center;
      padding: 40px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
    }
    .spinner {
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top: 4px solid white;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin: 20px auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    h1 {
      font-size: 24px;
      margin: 0 0 10px 0;
      font-weight: 600;
    }
    p {
      font-size: 16px;
      margin: 0;
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Connecting to Deel</h1>
    <div class="spinner"></div>
    <p>Please wait while we securely log you in...</p>
  </div>
  <script>
    // Auto-redirect after 1 second
    setTimeout(() => {
      window.location.href = '${deelSSOUrl}';
    }, 1000);
  </script>
</body>
</html>
        `.trim();

      // Set content type to HTML
      res.setHeader('Content-Type', 'text/html');
      res.send(html);

      logger.info(`Deel SSO HTML response sent for user ${userId}`);
    } catch (error) {
      logger.error(
        `Failed to initiate Deel SSO for user ${req.user?.id || 'unknown'}`,
        error
      );
      next(error);
    }
  };

  /**
   * GET /api/v1/oidc/userinfo
   * Returns user information
   * Standard OIDC UserInfo endpoint
   * Requires user to be authenticated
   */
  getUserInfo = (req: Request, res: Response, next: NextFunction): void => {
    this.handleRequest(req, res, next, async () => {
      if (!req.user?.id) {
        throw new AppError('Unauthorized', 401);
      }

      const userId = req.user.id;
      logger.info(`UserInfo requested for user ${userId}`);

      const userInfo = await this.oidcService.getUserInfo(userId);

      return {
        success: true,
        data: userInfo,
        message: 'User information',
      };
    });
  };

  /**
   * GET /api/v1/oidc/authorize
   * OAuth2 Authorization Endpoint
   * Deel redirects user here to initiate authorization
   *
   * Query Parameters:
   * - response_type: "code"
   * - client_id: Deel's client ID
   * - redirect_uri: Deel's callback URL
   * - scope: "openid email" or similar
   * - state: CSRF protection token from Deel
   */
  authorize = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      const hasAuthToken = authHeader && authHeader.startsWith('Bearer ');

      // Case 1: Called from frontend with Authorization header (authenticated API call)
      // Verify token and generate authorization code
      if (hasAuthToken) {
        const token = authHeader!.substring(7); // Remove 'Bearer ' prefix

        // Verify JWT token
        let userId: string | undefined;
        try {
          const decoded = jwt.verify(token, ENV.JWT_SECRET) as IAuthUser;
          userId = decoded.id;
        } catch (error) {
          logger.error('Failed to verify JWT token', error);
        }

        // Verify user exists
        const prisma = new PrismaClient();
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });
        await prisma.$disconnect();

        if (!user) {
          throw new AppError('User not found', 401);
        }
        const { response_type, client_id, redirect_uri, scope, state } =
          req.query;

        logger.info('Authenticated API call to /authorize', {
          userId,
          client_id,
        });

        // Validate required parameters
        if (!response_type || response_type !== 'code') {
          throw new AppError(
            'Invalid response_type. Only "code" is supported.',
            400
          );
        }

        if (!client_id || typeof client_id !== 'string') {
          throw new AppError('Missing or invalid client_id', 400);
        }

        if (!redirect_uri || typeof redirect_uri !== 'string') {
          throw new AppError('Missing or invalid redirect_uri', 400);
        }

        if (!scope || typeof scope !== 'string') {
          throw new AppError('Missing or invalid scope', 400);
        }

        logger.info(`User ${userId} authorized, generating authorization code`);

        // Generate authorization code
        const authCode = await this.oidcService.generateAuthorizationCode(
          userId!,
          client_id,
          redirect_uri,
          scope,
          state as string | undefined
        );

        // Build redirect URL with authorization code
        const redirectUrl = new URL(redirect_uri);
        redirectUrl.searchParams.append('code', authCode);
        if (state && typeof state === 'string') {
          redirectUrl.searchParams.append('state', state);
        }

        logger.info(`Redirecting to Deel with authorization code`);

        // Return redirect URL as JSON for frontend to handle
        res.json({ redirect_url: redirectUrl.toString() });
        return;
      }

      // Case 2: Called from browser (Deel redirect, no Authorization header)
      // Redirect to frontend OAuth page for authentication
      logger.info(
        'Browser call to /authorize (Deel cached URL) - redirecting to frontend'
      );

      const frontendAuthUrl = new URL('/oauth/authorize', ENV.FRONTEND_URL);

      // Copy all query parameters
      Object.entries(req.query).forEach(([key, value]) => {
        if (value && typeof value === 'string') {
          frontendAuthUrl.searchParams.append(key, value);
        }
      });

      logger.info(`Redirecting to frontend: ${frontendAuthUrl.toString()}`);
      res.redirect(frontendAuthUrl.toString());
    } catch (error) {
      logger.error('Failed to process authorization request', error);
      next(error);
    }
  };

  /**
   * POST /api/v1/oidc/token
   * OAuth2 Token Endpoint
   * Deel exchanges authorization code for ID Token here
   *
   * Request Body (application/x-www-form-urlencoded):
   * - grant_type: "authorization_code"
   * - code: Authorization code from /authorize endpoint
   * - redirect_uri: Same redirect_uri used in /authorize
   * - client_id: Deel's client ID
   * - client_secret: Deel's client secret (optional for public clients)
   */
  token = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const {
        grant_type,
        code,
        redirect_uri,
        client_id,
        client_secret: _client_secret,
      } = req.body;

      logger.info('OAuth2 token exchange request received', {
        grant_type,
        client_id,
        redirect_uri,
      });

      // Validate grant_type
      if (grant_type !== 'authorization_code') {
        throw new AppError(
          'Invalid grant_type. Only "authorization_code" is supported.',
          400
        );
      }

      // Validate required parameters
      if (!code || typeof code !== 'string') {
        throw new AppError('Missing or invalid code', 400);
      }

      if (!redirect_uri || typeof redirect_uri !== 'string') {
        throw new AppError('Missing or invalid redirect_uri', 400);
      }

      if (!client_id || typeof client_id !== 'string') {
        throw new AppError('Missing or invalid client_id', 400);
      }

      // Exchange code for token
      const tokenResponse = await this.oidcService.exchangeCodeForToken(
        code,
        client_id,
        redirect_uri
      );

      logger.info(`ID token issued for client ${client_id}`);

      // Return token response (raw JSON per OAuth2 spec)
      res.json(tokenResponse);
    } catch (error) {
      logger.error('Failed to exchange authorization code for token', error);

      // Return OAuth2 error response
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({
        error: 'invalid_grant',
        error_description: errorMessage,
      });
    }
  };

  /**
   * GET /api/v1/oidc/health
   * Health check endpoint for OIDC service
   */
  healthCheck = (req: Request, res: Response, next: NextFunction): void => {
    this.handleRequest(req, res, next, async () => {
      logger.info('OIDC health check requested');
      return {
        success: true,
        data: {
          status: 'healthy',
          service: 'OIDC Provider',
          timestamp: new Date().toISOString(),
        },
        message: 'OIDC service is healthy',
      };
    });
  };

  /**
   * GET /api/v1/oidc/deel/status
   * Check if Deel is enabled for the authenticated user's client
   * This endpoint allows client users to check if Deel integration is available
   */
  getDeelStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      if (!req.user?.id) {
        throw new AppError('Unauthorized', 401);
      }

      const userId = req.user.id;
      logger.info(`Checking Deel status for user ${userId}`);

      try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();

        // Get user's client information
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            clientUser: {
              include: {
                client: {
                  include: {
                    settings: true,
                    company: true,
                  },
                },
              },
            },
          },
        });

        await prisma.$disconnect();

        if (!user) {
          throw new AppError('User not found', 404);
        }

        // Check if user belongs to a client
        const clientUser = user.clientUser;
        if (!clientUser || !clientUser.client) {
          return {
            success: true,
            data: {
              isDeelEnabled: false,
              message: 'User does not belong to a client organization',
            },
            message: 'Deel status retrieved',
          };
        }

        const isDeelEnabled =
          clientUser.client.settings?.isDeelEnabled || false;

        return {
          success: true,
          data: {
            isDeelEnabled,
            clientId: clientUser.client.id,
            companyName: clientUser.client.company.name,
          },
          message: 'Deel status retrieved successfully',
        };
      } catch (error) {
        logger.error(`Failed to get Deel status for user ${userId}`, error);
        throw new AppError('Failed to retrieve Deel status', 500);
      }
    });
  };
}
