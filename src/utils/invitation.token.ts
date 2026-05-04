import jwt from 'jsonwebtoken';
import { ENV } from '@/config/env';
import { Secret } from 'jsonwebtoken';
import { SignOptions } from 'jsonwebtoken';
import { logger } from '@/shared/utils/logger';
import {
  SupportInvitationTypeEnum,
  InvitationTokenPurposeEnum,
} from '@/shared/models/common/enums';

export interface IInvitationTokenPayload {
  email: string;
  invitationId: string;
  type: SupportInvitationTypeEnum;
  purpose: InvitationTokenPurposeEnum; // Use enum instead of string literals
  iat?: number;
  exp?: number;
}

/**
 * Generate JWT token for invitation with dynamic expiry
 */
export function generateInvitationToken(
  email: string,
  invitationId: string,
  type: SupportInvitationTypeEnum,
  purpose: InvitationTokenPurposeEnum = InvitationTokenPurposeEnum.EMAIL
): string {
  const expiryHours = purpose === InvitationTokenPurposeEnum.EMAIL ? 72 : 0.5; // 72 hours for email, 30 minutes for copy
  const expiryMinutes = Math.floor(expiryHours * 60);

  const payload: IInvitationTokenPayload = {
    email,
    invitationId,
    type,
    purpose,
  };

  const options: SignOptions = {
    expiresIn: `${expiryMinutes}m`,
    issuer: 'teamcast-invitation',
    audience: 'teamcast-users',
  };

  logger.info({
    message: 'Generating invitation JWT token',
    context: 'generateInvitationToken',
    email,
    invitationId,
    type,
    purpose,
    expiryMinutes,
  });

  return jwt.sign(payload, ENV.JWT_SECRET as Secret, options);
}

/**
 * Verify and decode invitation JWT token
 */
export function verifyInvitationToken(token: string): IInvitationTokenPayload {
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET as Secret, {
      issuer: 'teamcast-invitation',
      audience: 'teamcast-users',
    }) as IInvitationTokenPayload;

    logger.info({
      message: 'Invitation JWT token verified successfully',
      context: 'verifyInvitationToken',
      email: decoded.email,
      invitationId: decoded.invitationId,
      type: decoded.type,
      purpose: decoded.purpose,
      expiresAt: new Date((decoded.exp || 0) * 1000),
    });

    return decoded;
  } catch (error) {
    logger.error({
      message: 'Failed to verify invitation JWT token',
      context: 'verifyInvitationToken',
      error: error instanceof Error ? error.message : 'Unknown error',
      token: token.substring(0, 8) + '...',
    });

    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Invitation token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid invitation token');
    } else {
      throw new Error('Token verification failed');
    }
  }
}

/**
 * Decode invitation token without verification (for frontend use)
 */
export function decodeInvitationToken(
  token: string
): IInvitationTokenPayload | null {
  try {
    const decoded = jwt.decode(token) as IInvitationTokenPayload;

    if (!decoded || typeof decoded === 'string') {
      return null;
    }

    return decoded;
  } catch (error) {
    logger.error({
      message: 'Failed to decode invitation JWT token',
      context: 'decodeInvitationToken',
      error: error instanceof Error ? error.message : 'Unknown error',
      token: token.substring(0, 8) + '...',
    });
    return null;
  }
}

/**
 * Check if invitation token is expired without verification
 */
export function isInvitationTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as IInvitationTokenPayload;

    if (!decoded || typeof decoded === 'string' || !decoded.exp) {
      return true;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime > decoded.exp;
  } catch (error) {
    logger.error({
      message: 'Failed to check invitation token expiry',
      context: 'isInvitationTokenExpired',
      error: error instanceof Error ? error.message : 'Unknown error',
      token: token.substring(0, 8) + '...',
    });
    return true;
  }
}

/**
 * Get remaining time in minutes for invitation token
 */
export function getInvitationTokenRemainingTime(token: string): number {
  try {
    const decoded = jwt.decode(token) as IInvitationTokenPayload;

    if (!decoded || typeof decoded === 'string' || !decoded.exp) {
      return 0;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const remainingSeconds = decoded.exp - currentTime;

    return Math.max(0, Math.floor(remainingSeconds / 60));
  } catch (error) {
    logger.error({
      message: 'Failed to get invitation token remaining time',
      context: 'getInvitationTokenRemainingTime',
      error: error instanceof Error ? error.message : 'Unknown error',
      token: token.substring(0, 8) + '...',
    });
    return 0;
  }
}
