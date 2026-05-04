import { PrismaClient } from '@prisma/client';
import { AppError } from '@/utils/app.error';
import { logger } from '@/shared/utils/logger';
import { ErrorCode } from '@/utils/error.codes';

import { singleton } from '@/shared/decorators/singleton';
import { INotificationProvider } from '../notification/notification.interface';
import {
  ISendOtpVerification,
  ISendOtpVerificationSent,
  IVerifyOtp,
  IOtpVerified,
} from '@/shared/models/domain/auth/otp.verification.domain';
import { toIAuthUser } from '@/shared/models/domain/auth/auth.user.domain';
import { getAuthToken } from '@/utils/generate.token';

const prisma = new PrismaClient();

@singleton
export class VerifyService {
  constructor(private notificationProvider: INotificationProvider) {}

  async sendOtpVerification(
    sendOtpVerificationRequest: ISendOtpVerification
  ): Promise<ISendOtpVerificationSent> {
    // Clean up expired OTPs first
    await this.cleanupExpiredOtps();

    const user = await prisma.user.findUnique({
      where: { email: sendOtpVerificationRequest.email },
    });

    if (!user) {
      throw new AppError('User not found', 404, ErrorCode.NOT_FOUND);
    }

    if (user.emailVerified) {
      throw new AppError(
        'Email is already verified',
        400,
        ErrorCode.INVALID_REQUEST
      );
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode,
        otpExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiry
      },
    });

    // Send OTP email
    await this.notificationProvider.sendOtpVerificationEmail(
      user.email,
      user.name,
      otpCode
    );

    logger.info(`OTP sent to ${sendOtpVerificationRequest.email}`);
    return {
      message: 'OTP verification email sent',
    };
  }

  async verifyOtp(verifyOtpRequest: IVerifyOtp): Promise<IOtpVerified> {
    // Clean up expired OTPs first
    await this.cleanupExpiredOtps();

    const user = await prisma.user.findFirst({
      where: {
        otpCode: verifyOtpRequest.otp,
        otpExpires: {
          gt: new Date(),
        },
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
        'Invalid or expired OTP',
        400,
        ErrorCode.INVALID_TOKEN
      );
    }

    // Update user to verified
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        otpCode: null,
        otpExpires: null,
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

    const authUser = toIAuthUser(updatedUser);
    const authToken = getAuthToken(authUser);

    logger.info(`Email verified via OTP for user ${user.id}`);
    return {
      message: 'Email verified successfully',
      user: authUser,
      token: authToken,
    };
  }

  private async cleanupExpiredOtps() {
    await prisma.user.updateMany({
      where: {
        otpExpires: {
          lt: new Date(),
        },
        emailVerified: null,
      },
      data: {
        otpCode: null,
        otpExpires: null,
      },
    });
  }
}
