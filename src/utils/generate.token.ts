import { ENV } from '@/config/env';
import { Secret } from 'jsonwebtoken';
import crypto from 'crypto';
import { SignOptions } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import { logger } from '@/shared/utils/logger';
import { IAuthUser } from '@/shared/models/domain/auth/auth.user.domain';
import { IAuthToken } from '@/shared/models/domain/auth/auth.token.domain';

export function generateToken(length: number): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Convert JWT expiry string to seconds
 * @param expiry - JWT expiry string (e.g., "15m", "1h", "7d")
 * @returns number of seconds
 */
function parseJwtExpiryToSeconds(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(
      `Invalid JWT expiry format: ${expiry}. Expected format: <number>[s|m|h|d]`
    );
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 24 * 60 * 60;
    default:
      throw new Error(`Invalid time unit: ${unit}`);
  }
}

export function getAuthToken(user: IAuthUser): IAuthToken {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user.id);

  const expiresInSeconds = parseJwtExpiryToSeconds(ENV.JWT_EXPIRY);

  return {
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: expiresInSeconds,
  };
}

export function generateAccessToken(user: IAuthUser): string {
  logger.info({
    message: 'Generating access token',
    context: 'generateAccessToken',
    user: user,
  });
  return jwt.sign(
    user,
    ENV.JWT_SECRET as Secret,
    {
      expiresIn: ENV.JWT_EXPIRY,
    } as SignOptions
  );
}

export function generateImpersonationToken(user: IAuthUser): string {
  logger.info({
    message: 'Generating impersonation token',
    context: 'generateImpersonationToken',
    user: user,
  });
  return jwt.sign(
    user,
    ENV.JWT_SECRET as Secret,
    {
      expiresIn: '1h', // Impersonation tokens expire in 1 hour
    } as SignOptions
  );
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { userId },
    ENV.REFRESH_TOKEN_SECRET as Secret,
    {
      expiresIn: ENV.REFRESH_TOKEN_EXPIRY,
    } as SignOptions
  );
}

export function generateResetPasswordToken(userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');

  logger.info('Generated forgot password token', {
    context: 'generateForgotPasswordToken',
    userId,
  });

  return token;
}
