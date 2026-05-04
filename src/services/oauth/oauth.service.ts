import { PrismaClient, user_type } from '@prisma/client';
import { logger } from '@/shared/utils/logger';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { singleton } from '@/shared/decorators/singleton';
import {
  IOAuthProviders,
  IOAuthAuthUrl,
  IOAuthLoginDone,
  OAuthUserInfo,
  OAuthState,
} from '@/shared/models/domain/oauth/oauth.domain';
import { getAuthToken } from '@/utils/generate.token';
import { toIAuthUser } from '@/shared/models/domain/auth/auth.user.domain';
import { CandidateSignupService } from '../candidate/signup.service';
import { ClientSignupService } from '../client/signup.service';
import { PartnerSignupService } from '../partner/signup.service';
import crypto from 'crypto';
import { OAuthProviderEnum } from '@/shared/models/common/enums';
import { ENV } from '@/config/env';
import axios from 'axios';

@singleton
export class OAuthService {
  private readonly prisma: PrismaClient;

  /**
   * Supported OAuth providers mapping
   */
  private readonly supportedProviders: Partial<
    Record<
      OAuthProviderEnum,
      {
        displayName: string;
        enumValue: OAuthProviderEnum;
        clientId: string;
        clientSecret: string;
        authUrl: string;
        tokenUrl: string;
        userInfoUrl: string;
      }
    >
  > = {
    [OAuthProviderEnum.GOOGLE]: {
      displayName: 'Google',
      enumValue: OAuthProviderEnum.GOOGLE,
      clientId: ENV.GOOGLE_OAUTH_CLIENT_ID || '',
      clientSecret: ENV.GOOGLE_OAUTH_CLIENT_SECRET || '',
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    },
    [OAuthProviderEnum.GITHUB]: {
      displayName: 'GitHub',
      enumValue: OAuthProviderEnum.GITHUB,
      clientId: ENV.GITHUB_OAUTH_CLIENT_ID || '',
      clientSecret: ENV.GITHUB_OAUTH_CLIENT_SECRET || '',
      authUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      userInfoUrl: 'https://api.github.com/user',
    },
  };

  /**
   * Valid user types that can use OAuth
   */
  private readonly validUserTypes: Set<user_type> = new Set([
    user_type.CANDIDATE,
    user_type.CLIENT,
    user_type.PARTNER,
    user_type.SUPPORT,
  ]);

  /**
   * OAuth state token expiration time in milliseconds (10 minutes)
   */
  private readonly stateExpirationTime = 10 * 60 * 1000;

  constructor(
    private readonly candidateSignupService: CandidateSignupService,
    private readonly clientSignupService: ClientSignupService,
    private readonly partnerSignupService: PartnerSignupService
  ) {
    this.prisma = new PrismaClient();
  }

  /**
   * Generate OAuth state token with user type information
   */
  private generateOAuthState(
    provider: OAuthProviderEnum,
    userType?: user_type,
    returnUrl?: string
  ): string {
    const providerConfig = this.supportedProviders[provider];
    if (!providerConfig) {
      throw new AppError(
        `Unsupported OAuth provider: ${provider}`,
        400,
        ErrorCode.INVALID_REQUEST
      );
    }

    const state: OAuthState & { userType?: string } = {
      provider: providerConfig.enumValue,
      userType: userType ? userType.toLowerCase() : undefined,
      returnUrl,
      timestamp: Date.now(),
    };

    return Buffer.from(JSON.stringify(state)).toString('base64');
  }

  /**
   * Verify and decode OAuth state token
   */
  private verifyOAuthState(
    stateToken: string
  ): OAuthState & { userType?: string } {
    try {
      const decoded = Buffer.from(stateToken, 'base64').toString('utf-8');
      const state = JSON.parse(decoded) as OAuthState & { userType?: string };

      // Verify timestamp (state should not be older than configured expiration time)
      const expirationTime = Date.now() - this.stateExpirationTime;
      if (state.timestamp < expirationTime) {
        throw new AppError(
          'OAuth state has expired',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      return state;
    } catch (error) {
      logger.error('Failed to verify OAuth state', {
        error: error instanceof Error ? error.message : 'Unknown error',
        context: 'OAuthService.verifyOAuthState',
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError('Invalid OAuth state', 400, ErrorCode.INVALID_REQUEST);
    }
  }

  /**
   * Validate OAuth provider
   */
  private validateProvider(provider: string): OAuthProviderEnum {
    const upperProvider = provider.toUpperCase() as OAuthProviderEnum;

    if (!Object.values(OAuthProviderEnum).includes(upperProvider)) {
      throw new AppError(
        `Unsupported OAuth provider: ${provider}`,
        400,
        ErrorCode.INVALID_REQUEST
      );
    }

    // Check if it's one of the currently supported providers for OAuth
    if (
      upperProvider !== OAuthProviderEnum.GOOGLE &&
      upperProvider !== OAuthProviderEnum.GITHUB
    ) {
      throw new AppError(
        `OAuth provider not currently supported: ${provider}. Supported providers: google, github`,
        400,
        ErrorCode.INVALID_REQUEST
      );
    }

    return upperProvider;
  }

  /**
   * Validate user type (including support)
   */
  private validateUserType(userType?: string): user_type | undefined {
    if (!userType) return undefined;

    const upperUserType = userType.toUpperCase() as user_type;

    if (!Object.values(user_type).includes(upperUserType)) {
      throw new AppError(
        `Invalid user type: ${userType}`,
        400,
        ErrorCode.INVALID_REQUEST
      );
    }

    if (!this.validUserTypes.has(upperUserType)) {
      throw new AppError(
        `User type not supported for OAuth: ${userType}. Supported types: candidate, client, partner, support`,
        400,
        ErrorCode.INVALID_REQUEST
      );
    }

    return upperUserType;
  }

  /**
   * Get available OAuth providers
   */
  async getProviders(): Promise<IOAuthProviders> {
    logger.info('Fetching OAuth providers', {
      context: 'OAuthService.getProviders',
    });

    try {
      const providers = [
        { name: OAuthProviderEnum.GOOGLE, displayName: 'Google' },
        { name: OAuthProviderEnum.GITHUB, displayName: 'GitHub' },
      ];

      return { providers };
    } catch (error) {
      logger.error('Failed to fetch OAuth providers', {
        error: error instanceof Error ? error.message : 'Unknown error',
        context: 'OAuthService.getProviders',
      });

      throw new AppError(
        'Failed to fetch OAuth providers',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get OAuth authorization URL
   */
  async getAuthorizationUrl(
    provider: OAuthProviderEnum,
    userType?: string,
    state?: string,
    returnUrl?: string
  ): Promise<IOAuthAuthUrl> {
    try {
      const validatedProvider = this.validateProvider(provider);
      const validatedUserType = this.validateUserType(userType);

      // Generate state token with user type information
      const stateToken =
        state ||
        this.generateOAuthState(
          validatedProvider,
          validatedUserType,
          returnUrl
        );

      const providerConfig = this.supportedProviders[provider];
      if (!providerConfig) {
        throw new AppError(
          `Unsupported OAuth provider: ${provider}`,
          500,
          ErrorCode.INTERNAL_SERVER_ERROR
        );
      }

      const authUrl = `${providerConfig.authUrl}?client_id=${providerConfig.clientId}&redirect_uri=${ENV.OAUTH_REDIRECT_URL}&response_type=code&scope=email%20profile%20openid&state=${stateToken}`;

      return {
        authUrl,
        state: stateToken,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Failed to generate OAuth authorization URL', {
        error: error instanceof Error ? error.message : 'Unknown error',
        provider,
        userType,
        context: 'OAuthService.getAuthorizationUrl',
      });

      throw new AppError(
        'Failed to generate authorization URL',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Handle OAuth callback
   */
  async handleCallback(
    provider: OAuthProviderEnum,
    code: string,
    state?: string
  ): Promise<IOAuthLoginDone> {
    try {
      const validatedProvider = this.validateProvider(provider);

      // Verify state if provided
      let validatedUserType: user_type | undefined;

      if (state) {
        const decodedState = this.verifyOAuthState(state);
        validatedUserType = decodedState.userType
          ? this.validateUserType(decodedState.userType)
          : undefined;
      }

      const providerConfig = this.supportedProviders[provider];
      if (!providerConfig) {
        throw new AppError(
          `Unsupported OAuth provider: ${provider}`,
          500,
          ErrorCode.INTERNAL_SERVER_ERROR
        );
      }

      // Exchange code for access token
      const tokenResponse = await axios.post(providerConfig.tokenUrl, {
        code,
        client_id: providerConfig.clientId,
        client_secret: providerConfig.clientSecret,
        redirect_uri: ENV.OAUTH_REDIRECT_URL,
        grant_type: 'authorization_code',
      });

      const accessToken = tokenResponse.data.access_token;

      // Get user info from OAuth provider
      const userInfoResponse = await axios.get(providerConfig.userInfoUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const oauthUserInfo: OAuthUserInfo = {
        id: userInfoResponse.data.id,
        email: userInfoResponse.data.email,
        name: userInfoResponse.data.name,
        firstName: userInfoResponse.data.given_name || '',
        lastName: userInfoResponse.data.family_name || '',
        provider: providerConfig.enumValue,
        avatar: userInfoResponse.data.picture,
        sub: userInfoResponse.data.sub,
        given_name: userInfoResponse.data.given_name,
        family_name: userInfoResponse.data.family_name,
        preferred_username: userInfoResponse.data.preferred_username,
      };

      // Find or create user (enhanced to handle existing users)
      const { user, isNewUser } = await this.findOrCreateUser(
        oauthUserInfo,
        validatedProvider,
        validatedUserType
      );

      // Generate auth token
      const authUser = toIAuthUser(user);
      const authToken = getAuthToken(authUser);

      // Check if profile completion is required for client/partner admin users
      const requiresProfileCompletion =
        await this.checkProfileCompletionRequired(
          user.id,
          user.type,
          user.role
        );

      return {
        message: isNewUser
          ? 'Account created successfully'
          : 'Login successful',
        user: authUser,
        token: authToken,
        requiresProfileCompletion,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Failed to handle OAuth callback', {
        error: error instanceof Error ? error.message : 'Unknown error',
        provider,
        context: 'OAuthService.handleCallback',
      });

      throw new AppError(
        'Failed to handle OAuth callback',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Enhanced method to find existing user or create new one
   */
  private async findOrCreateUser(
    oauthUserInfo: OAuthUserInfo,
    provider: OAuthProviderEnum,
    userType?: user_type
  ) {
    try {
      // Check if user already exists by email
      const existingUser = await this.prisma.user.findUnique({
        where: { email: oauthUserInfo.email },
        include: {
          candidate: true,
          clientUser: {
            include: {
              client: { include: { company: true } },
            },
          },
          partnerUser: {
            include: {
              partner: { include: { company: true } },
            },
          },
          supportUser: true,
        },
      });

      if (existingUser) {
        logger.info('Existing user found for OAuth login', {
          email: oauthUserInfo.email,
          provider,
          existingUserType: existingUser.type,
          requestedUserType: userType,
          context: 'OAuthService.findOrCreateUser',
        });

        // For support users, allow OAuth login if they already exist
        if (existingUser.type === 'SUPPORT') {
          logger.info('Existing support user logging in via OAuth', {
            email: oauthUserInfo.email,
            provider,
            userId: existingUser.id,
            context: 'OAuthService.findOrCreateUser',
          });
        }

        // Update existing user's image if not set
        const updatedUser = await this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            image: existingUser.image || oauthUserInfo.avatar,
            emailVerified: new Date(), // OAuth providers verify email
          },
          include: {
            candidate: true,
            clientUser: {
              include: {
                client: { include: { company: true } },
              },
            },
            partnerUser: {
              include: {
                partner: { include: { company: true } },
              },
            },
            supportUser: true,
          },
        });

        return { user: updatedUser, isNewUser: false };
      }

      // Special handling for support users - they cannot signup via OAuth
      if (userType === user_type.SUPPORT) {
        throw new AppError(
          `No support user found with email ${oauthUserInfo.email}. Support accounts must be created manually by administrators before they can login via OAuth. Please contact your system administrator.`,
          403,
          ErrorCode.FORBIDDEN
        );
      }

      // Create new user from OAuth using signup services
      return await this.createUserFromOAuth(oauthUserInfo, provider, userType);
    } catch (error) {
      // Handle the case where user was created between our check and the signup attempt
      if (
        error instanceof Error &&
        (error.message.includes('Email already in use') ||
          error.message.includes('already exists'))
      ) {
        logger.warn(
          'User was created during OAuth flow, attempting to find existing user',
          {
            email: oauthUserInfo.email,
            provider,
            userType,
            context: 'OAuthService.findOrCreateUser',
          }
        );

        // Try to find the user again
        const existingUser = await this.prisma.user.findUnique({
          where: { email: oauthUserInfo.email },
          include: {
            candidate: true,
            clientUser: {
              include: {
                client: { include: { company: true } },
              },
            },
            partnerUser: {
              include: {
                partner: { include: { company: true } },
              },
            },
            supportUser: true,
          },
        });

        if (existingUser) {
          const updatedUser = await this.prisma.user.update({
            where: { id: existingUser.id },
            data: {
              image: existingUser.image || oauthUserInfo.avatar,
              emailVerified: new Date(),
            },
            include: {
              candidate: true,
              clientUser: {
                include: {
                  client: { include: { company: true } },
                },
              },
              partnerUser: {
                include: {
                  partner: { include: { company: true } },
                },
              },
              supportUser: true,
            },
          });

          return { user: updatedUser, isNewUser: false };
        }
      }

      logger.error('Failed to find or create user', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email: oauthUserInfo.email,
        provider,
        userType,
        context: 'OAuthService.findOrCreateUser',
      });
      throw error;
    }
  }

  /**
   * Create new user from OAuth using signup services
   */
  private async createUserFromOAuth(
    oauthUserInfo: OAuthUserInfo,
    provider: OAuthProviderEnum,
    userType?: user_type
  ) {
    // Determine user type - default to candidate if not specified
    const finalUserType = userType || user_type.CANDIDATE;

    try {
      const randomPassword = crypto.randomBytes(16).toString('hex');
      let _signupResult: any;

      // Call the exact same services as form-based signup
      switch (finalUserType) {
        case user_type.CANDIDATE: {
          _signupResult = await this.candidateSignupService.signup({
            name: oauthUserInfo.name,
            email: oauthUserInfo.email,
            password: randomPassword,
            jobTitle: 'To be updated',
          });

          logger.info('Candidate created via OAuth', {
            email: oauthUserInfo.email,
            provider,
            context: 'OAuthService.createUserFromOAuth',
          });
          break;
        }

        case user_type.CLIENT: {
          _signupResult = await this.clientSignupService.signup({
            name: oauthUserInfo.name,
            email: oauthUserInfo.email,
            password: randomPassword,
            companyName: 'To be updated',
            jobTitle: 'To be updated',
          });

          logger.info('Client created via OAuth', {
            email: oauthUserInfo.email,
            provider,
            context: 'OAuthService.createUserFromOAuth',
          });
          break;
        }

        case user_type.PARTNER: {
          _signupResult = await this.partnerSignupService.signup({
            name: oauthUserInfo.name,
            email: oauthUserInfo.email,
            password: randomPassword,
            companyName: 'To be updated',
            title: 'To be updated',
            specialization: 'To be updated',
          });

          logger.info('Partner created via OAuth', {
            email: oauthUserInfo.email,
            provider,
            context: 'OAuthService.createUserFromOAuth',
          });
          break;
        }

        case user_type.SUPPORT: {
          // Support users cannot signup via OAuth, but if they already exist, we should link them
          throw new AppError(
            'Support users cannot signup via OAuth. Support accounts must be created manually by administrators. Please contact your system administrator.',
            403,
            ErrorCode.FORBIDDEN
          );
        }

        default:
          throw new AppError(
            `Unsupported user type for OAuth: ${finalUserType}`,
            400,
            ErrorCode.INVALID_REQUEST
          );
      }

      // The signup service already returns the user with auth token
      // We just need to get the user with all relations
      const user = await this.prisma.user.findUnique({
        where: { email: oauthUserInfo.email },
        include: {
          candidate: true,
          clientUser: {
            include: {
              client: { include: { company: true } },
            },
          },
          partnerUser: {
            include: {
              partner: { include: { company: true } },
            },
          },
          supportUser: true,
        },
      });

      if (!user) {
        throw new AppError(
          'Failed to retrieve created user',
          500,
          ErrorCode.INTERNAL_SERVER_ERROR
        );
      }

      // Update user with OAuth info (non-critical - don't fail signup if this fails)
      let updatedUser = user;
      try {
        // Check if profile setup is required for client/partner admin
        const shouldRequireProfileSetup =
          (finalUserType === user_type.CLIENT ||
            finalUserType === user_type.PARTNER) &&
          user.role === 'ADMIN';

        updatedUser = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            image: oauthUserInfo.avatar,
            emailVerified: new Date(), // OAuth providers verify email
            profileSetup: shouldRequireProfileSetup ? false : true,
          },
          include: {
            candidate: true,
            clientUser: {
              include: {
                client: { include: { company: true } },
              },
            },
            partnerUser: {
              include: {
                partner: { include: { company: true } },
              },
            },
            supportUser: true,
          },
        });
      } catch (updateError) {
        logger.error(
          'Failed to update user with OAuth info, but signup successful',
          {
            error:
              updateError instanceof Error
                ? updateError.message
                : 'Unknown error',
            userId: user.id,
            provider,
            context: 'OAuthService.createUserFromOAuth',
          }
        );
      }

      return { user: updatedUser, isNewUser: true };
    } catch (error) {
      logger.error('Failed to create user from OAuth', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email: oauthUserInfo.email,
        provider,
        userType: finalUserType,
        context: 'OAuthService.createUserFromOAuth',
      });

      // If this is a database error related to resume creation, provide a helpful message
      if (
        error instanceof Error &&
        error.message.includes('cache lookup failed')
      ) {
        throw new AppError(
          'Database schema issue detected. Please contact support or try again later.',
          500,
          ErrorCode.INTERNAL_SERVER_ERROR
        );
      }

      throw error;
    }
  }

  /**
   * Enhanced method to check if profile completion is required
   */
  private async checkProfileCompletionRequired(
    userId: string,
    userType: user_type,
    userRole: string
  ): Promise<boolean> {
    try {
      // Only require profile completion for client and partner admin users
      const requiresProfileSetup =
        (userType === user_type.CLIENT || userType === user_type.PARTNER) &&
        userRole === 'ADMIN';

      if (!requiresProfileSetup) {
        return false;
      }

      // Check the profileSetup flag in the database
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { profileSetup: true },
      });

      return user?.profileSetup === false;
    } catch (error) {
      logger.error('Failed to check profile completion requirement', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        userType,
        userRole,
        context: 'OAuthService.checkProfileCompletionRequired',
      });

      return false;
    }
  }
}
