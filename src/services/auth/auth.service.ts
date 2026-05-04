import { PrismaClient } from '@prisma/client';
import { ENV } from '@/config/env';
import { AppError } from '@/utils/app.error';
import { logger } from '@/shared/utils/logger';
import { ErrorCode } from '@/utils/error.codes';
import { singleton } from '@/shared/decorators/singleton';
import {
  generateRefreshToken,
  getAuthToken,
  generateResetPasswordToken,
} from '@/utils/generate.token';
import jwt from 'jsonwebtoken';
import { INotificationProvider } from '../notification/notification.interface';
import { toIAuthUser } from '@/shared/models/domain/auth/auth.user.domain';
import { ILoggedIn, ILogin } from '@/shared/models/domain/auth/login.domain';
import { IRefreshedToken } from '@/shared/models/domain/auth/refresh.token.domain';
import { IRefreshToken } from '@/shared/models/domain/auth/refresh.token.domain';
import { ILoggedOut } from '@/shared/models/domain/auth/logout.domain';
import {
  ISendResetPasswordTokenDone,
  ISendResetPasswordToken,
  IResetPasswordDone,
  ISetNewPasswordDone,
  ISetPasswordByEmail,
  ISetPasswordByEmailDone,
} from '@/shared/models/domain/auth/reset.password.domain';
import { IUser, toUserDomain } from '@/shared/models/domain/user/user.domain';
import { activityHelper } from '@/services/activity/activity.helper.service';
import {
  comparePassword,
  hashPassword,
  isPasswordDifferent,
} from '@/utils/password';
import crypto from 'crypto';
import { UserTypeEnum } from '@/shared/models/common/enums';
import { ClientSubscriptionService } from '../client/subscription.service';
import { IClientSubscriptionOverview } from '@/shared/models/domain/client/subscription.domain';
import { formatEmail } from '@/shared/utils/formatters';

const prisma = new PrismaClient();

// Helper functions for refresh token security
const hashRefreshToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const generateAndHashRefreshToken = (
  userId: string
): { token: string; hashedToken: string } => {
  const token = generateRefreshToken(userId);
  const hashedToken = hashRefreshToken(token);
  return { token, hashedToken };
};

@singleton
export class AuthService {
  constructor(
    private notificationProvider: INotificationProvider,
    private clientSubscriptionService: ClientSubscriptionService
  ) {}

  async login(loginRequest: ILogin): Promise<ILoggedIn> {
    if (!loginRequest.email || !loginRequest.password) {
      throw new AppError(
        'Please provide valid credentials',
        401,
        ErrorCode.INVALID_CREDENTIALS
      );
    }

    const normalizedEmail = formatEmail(loginRequest.email);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        clientUser: {
          include: {
            client: {
              include: {
                settings: true,
              },
            },
          },
        },
        partnerUser: {
          include: {
            partner: true,
          },
        },
        candidate: true,
        supportUser: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404, ErrorCode.INVALID_CREDENTIALS);
    }

    if (user.status !== 'ACTIVE') {
      throw new AppError(
        'Account is not active. Please contact support.',
        403,
        ErrorCode.USER_NOT_ACTIVE
      );
    }

    // Check if user has a password set
    if (!user.password) {
      throw new AppError(
        'No password set for this account. Please reset your password.',
        401,
        ErrorCode.INVALID_CREDENTIALS
      );
    }

    // Verify password
    const isPasswordValid = await comparePassword(
      loginRequest.password,
      user.password
    );

    if (!isPasswordValid) {
      logger.error('Invalid password attempt', {
        email: normalizedEmail,
        context: 'AuthService.login',
      });
      throw new AppError(
        'Invalid credentials',
        401,
        ErrorCode.INVALID_CREDENTIALS
      );
    }

    let subscriptionOverview: IClientSubscriptionOverview | undefined =
      undefined;
    if (user.type === UserTypeEnum.CLIENT && user.clientUser?.clientId) {
      subscriptionOverview =
        await this.clientSubscriptionService.getCurrentSubscriptionOverview(
          user.clientUser?.clientId
        );
    }

    const authUser = toIAuthUser(user);
    const authToken = getAuthToken(authUser);
    const { token: refreshToken, hashedToken: hashedRefreshToken } =
      generateAndHashRefreshToken(user.id);

    // Update user with hashed refresh token
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    // Return the plain token to the client, but store the hashed version
    authToken.refreshToken = refreshToken;

    // Log successful login activity
    await activityHelper.logAuth({
      userId: user.id,
      action: 'LOGIN',
      description: 'User logged in successfully',
    });

    return <ILoggedIn>{
      message: 'Login successful',
      user: authUser,
      token: authToken,
      subscriptionOverview: subscriptionOverview,
    };
  }

  async refresh(refreshTokenRequest: IRefreshToken): Promise<IRefreshedToken> {
    if (!refreshTokenRequest.refreshToken) {
      throw new AppError(
        'Refresh token is required',
        400,
        ErrorCode.INVALID_TOKEN
      );
    }

    try {
      const decoded = jwt.verify(
        refreshTokenRequest.refreshToken,
        ENV.REFRESH_TOKEN_SECRET
      ) as {
        userId: string;
      };

      logger.debug('Processing refresh token request', {
        userId: decoded.userId,
        context: 'AuthService.refresh',
      });

      // Hash the incoming refresh token to compare with stored hash
      const hashedIncomingToken = hashRefreshToken(
        refreshTokenRequest.refreshToken
      );

      const user = await prisma.user.findFirst({
        where: {
          id: decoded.userId,
          refreshToken: hashedIncomingToken,
        },
        include: {
          clientUser: {
            include: {
              client: true,
            },
          },
          partnerUser: {
            include: {
              partner: true,
            },
          },
          candidate: true,
          supportUser: true,
        },
      });

      if (!user) {
        throw new AppError(
          'Invalid refresh token',
          401,
          ErrorCode.INVALID_TOKEN
        );
      }
      const authToken = getAuthToken(toIAuthUser(user));
      const { token: newRefreshToken, hashedToken: newHashedRefreshToken } =
        generateAndHashRefreshToken(user.id);

      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: newHashedRefreshToken },
      });

      // Return the plain token to the client, but store the hashed version
      authToken.refreshToken = newRefreshToken;
      return <IRefreshedToken>{
        token: authToken,
      };
    } catch (error) {
      logger.error('Refresh token error', {
        error,
        context: 'AuthService.refresh',
      });
      throw new AppError('Invalid refresh token', 401, ErrorCode.INVALID_TOKEN);
    }
  }

  async logout(userId: string): Promise<ILoggedOut> {
    if (!userId) {
      throw new AppError('User ID is required', 400, ErrorCode.INVALID_INPUT);
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError('User not found', 404, ErrorCode.NOT_FOUND);
      }

      await prisma.user.update({
        where: { id: userId },
        data: { refreshToken: null },
      });

      // Log successful logout activity
      await activityHelper.logAuth({
        userId,
        action: 'LOGOUT',
        description: 'User logged out successfully',
      });

      return <ILoggedOut>{
        message: 'Logged out successfully',
      };
    } catch (error) {
      logger.error('Logout error', {
        error,
        userId,
        context: 'AuthService.logout',
      });
      throw new AppError(
        'Failed to logout',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async sendResetPasswordToken(
    resetPasswordTokenRequest: ISendResetPasswordToken
  ): Promise<ISendResetPasswordTokenDone> {
    const normalizedEmail = formatEmail(resetPasswordTokenRequest.email);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new AppError('User not found', 404, ErrorCode.NOT_FOUND);
    }

    const resetPasswordToken = generateResetPasswordToken(user.id);

    // Set token expiry to 1 hour from now
    const passwordResetExpires = new Date();
    passwordResetExpires.setHours(passwordResetExpires.getHours() + 1);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetPasswordToken,
        passwordResetExpires: passwordResetExpires,
      },
    });

    const resetUrl = `${ENV.FRONTEND_URL}/app/auth/reset-password?token=${resetPasswordToken}`;

    await this.notificationProvider.sendForgotPasswordEmail(
      user.email,
      user.name,
      resetUrl,
      user.type
    );

    await activityHelper.logAuth({
      userId: user.id,
      action: 'FORGOT_PASSWORD_TOKEN',
      description: 'Forgot password token generated',
      metadata: {
        email: user.email,
      },
    });

    return {
      message: 'Please complete password reset through the provided link',
    };
  }

  async resetPassword(
    token: string,
    password: string
  ): Promise<IResetPasswordDone> {
    try {
      logger.debug('Attempting to reset password', {
        tokenLength: token?.length,
        context: 'AuthService.resetPassword',
      });

      const user = await prisma.user.findFirst({
        where: {
          passwordResetToken: token,
          passwordResetExpires: {
            gt: new Date(),
          },
        },
      });

      if (!user) {
        logger.error('Invalid or expired reset token', {
          context: 'AuthService.resetPassword',
        });
        throw new AppError(
          'Invalid or expired reset token',
          400,
          ErrorCode.INVALID_TOKEN
        );
      }

      // Check if user has an existing password and if the new password is different
      if (user.password) {
        const isDifferent = await isPasswordDifferent(password, user.password);
        if (!isDifferent) {
          logger.warn(
            'User attempted to reset password with the same password',
            {
              userId: user.id,
              context: 'AuthService.resetPassword',
            }
          );
          throw new AppError(
            'New password must be different from your current password',
            400,
            ErrorCode.INVALID_INPUT
          );
        }
      }

      // Hash the new password
      const hashedPassword = await hashPassword(password);

      // Update password in database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpires: null,
        },
      });

      // Log activity
      await activityHelper.logAuth({
        userId: user.id,
        action: 'PASSWORD_RESET',
        description: 'Password reset completed successfully',
      });

      return {
        message:
          'Password has been successfully reset. Please login with your new password.',
      };
    } catch (error) {
      logger.error('Password reset failed', {
        error,
        context: 'AuthService.resetPassword',
      });

      if (error instanceof AppError) {
        throw error;
      }
      // If decryption fails, throw invalid token error
      throw new AppError('Invalid reset token', 400, ErrorCode.INVALID_TOKEN);
    }
  }

  async setNewPassword(
    userId: string,
    password: string
  ): Promise<ISetNewPasswordDone> {
    try {
      logger.debug('Attempting to set new password', {
        userId,
        context: 'AuthService.setNewPassword',
      });

      const user = await prisma.user.findFirst({
        where: {
          id: userId,
        },
      });

      if (!user) {
        logger.error('User not found', {
          context: 'AuthService.setNewPassword',
        });
        throw new AppError('User not found', 404, ErrorCode.NOT_FOUND);
      }

      // Check if user has an existing password and if the new password is different
      if (user.password) {
        const isDifferent = await isPasswordDifferent(password, user.password);
        if (!isDifferent) {
          logger.warn('User attempted to set password with the same password', {
            userId: user.id,
            context: 'AuthService.setNewPassword',
          });
          throw new AppError(
            'New password must be different from your current password',
            400,
            ErrorCode.INVALID_INPUT
          );
        }
      }

      // Hash the new password
      const hashedPassword = await hashPassword(password);

      // Update password in database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpires: null,
        },
      });

      // Log activity
      await activityHelper.logAuth({
        userId: user.id,
        action: 'NEW_PASSWORD_SET',
        description: 'New password set successfully',
      });

      return {
        message: 'New password set successfully',
      };
    } catch (error) {
      logger.error('New password set failed', {
        error,
        context: 'AuthService.setNewPassword',
      });

      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        'Failed to set new password',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Set password by email (public endpoint for practice assessment users)
   */
  async setPasswordByEmail(
    request: ISetPasswordByEmail
  ): Promise<ISetPasswordByEmailDone> {
    try {
      logger.debug('Attempting to set password by email', {
        email: request.email,
        context: 'AuthService.setPasswordByEmail',
      });

      const normalizedEmail = formatEmail(request.email);

      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        logger.error('User not found', {
          email: normalizedEmail,
          context: 'AuthService.setPasswordByEmail',
        });
        throw new AppError('User not found', 404, ErrorCode.NOT_FOUND);
      }

      // Check if user has an existing password and if the new password is different
      if (user.password) {
        const isDifferent = await isPasswordDifferent(
          request.password,
          user.password
        );
        if (!isDifferent) {
          logger.warn('User attempted to set password with the same password', {
            userId: user.id,
            email: request.email,
            context: 'AuthService.setPasswordByEmail',
          });
          throw new AppError(
            'New password must be different from your current password',
            400,
            ErrorCode.INVALID_INPUT
          );
        }
      }

      // Hash the new password
      const hashedPassword = await hashPassword(request.password);

      // Update password in database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpires: null,
        },
      });

      // Log activity
      await activityHelper.logAuth({
        userId: user.id,
        action: 'NEW_PASSWORD_SET',
        description: 'New password set successfully via email',
      });

      return {
        message: 'Password set successfully',
      };
    } catch (error) {
      logger.error('Set password by email failed', {
        error,
        email: request.email,
        context: 'AuthService.setPasswordByEmail',
      });

      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        'Failed to set password',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async me(userId: string): Promise<IUser> {
    if (!userId) {
      throw new AppError('User ID is required', 400, ErrorCode.INVALID_INPUT);
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          clientUser: {
            include: {
              client: {
                include: {
                  settings: true,
                },
              },
            },
          },
          partnerUser: {
            include: {
              partner: true,
            },
          },
          candidate: true,
          supportUser: true,
        },
      });

      if (!user) {
        throw new AppError('User not found', 404, ErrorCode.NOT_FOUND);
      }

      // Return user without sensitive fields (as defined by IUser type)
      const userResponse: IUser = toUserDomain(user);

      return userResponse;
    } catch (error) {
      logger.error('Failed to get user information', {
        error,
        userId,
        context: 'AuthService.me',
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        'Failed to get user information',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }
}
