import { PrismaClient } from '@prisma/client';
import { AppError } from '@/utils/app.error';
import { logger } from '@/shared/utils/logger';
import { ErrorCode } from '@/utils/error.codes';
import { singleton } from '@/shared/decorators/singleton';
import {
  IPartnerSignup,
  IPartnerSignupDone,
} from '@/shared/models/domain/partner/signup.domain';
import { getAuthToken } from '@/utils/generate.token';
import { toIAuthUser } from '@/shared/models/domain/auth/auth.user.domain';
import { INotificationProvider } from '../notification/notification.interface';
import { hashPassword } from '@/utils/password';
import { VerifyService } from '@/services/auth/verify.service';
import { formatEmail, formatName } from '@/shared/utils/formatters';

const prisma = new PrismaClient();

@singleton
export class PartnerSignupService {
  constructor(
    private readonly notificationProvider: INotificationProvider,
    private readonly verifyService: VerifyService
  ) {}

  /**
   * Registers a new partner with an admin user
   * @param signupData Partner signup data
   * @returns Partner signup result
   */
  async signup(signupData: IPartnerSignup): Promise<IPartnerSignupDone> {
    logger.info('Starting partner signup process', {
      email: signupData.email,
      context: 'PartnerSignupService.signup',
    });

    // Check if user with this email already exists in our database
    const existingUser = await prisma.user.findUnique({
      where: { email: signupData.email },
    });

    if (existingUser) {
      throw new AppError('Email already in use', 409, ErrorCode.ALREADY_EXISTS);
    }

    // Use a transaction to ensure all operations are atomic
    const result = await prisma.$transaction(async (tx) => {
      // Create company
      const company = await tx.company.create({
        data: {
          name: signupData.companyName,
          contactEmail: signupData.email,
          description: `Partner company profile for ${signupData.companyName}`,
          companyType: 'AGENCY', // Default value for partners
          industry: 'OTHER', // Default value for partners
          size: 'ONE_TO_TEN', // Default value
          stage: 'MATURE', // Default value for partners
          foundedYear: new Date().getFullYear(),
        },
      });

      // Create partner
      const partner = await tx.partner.create({
        data: {
          companyId: company.id,
          settings: {
            create: {
              notificationsEnabled: true,
              emailNotifications: true,
              pushNotifications: true,
              consultantAlerts: true,
              contractAlerts: true,
              privacySettings: {
                dataSharing: true,
                profileVisibility: 'public',
                dataRetention: 365,
              },
              brandingSettings: {
                primaryColor: '#007bff',
                secondaryColor: '#6c757d',
              },
              integrationSettings: {
                calendarIntegration: false,
                emailIntegration: true,
                slackIntegration: false,
              },
            },
          },
        },
      });

      // Create user in our database
      const user = await tx.user.create({
        data: {
          name: formatName(signupData.name),
          email: formatEmail(signupData.email),
          password: await hashPassword(signupData.password), // Hash password
          type: 'PARTNER',
          role: 'ADMIN',
          status: 'ACTIVE',
          jobTitle: signupData.title,
          emailVerified: null, // Require email verification
        },
      });

      // Create partner user relationship
      await tx.partner_user.create({
        data: {
          partnerId: partner.id,
          userId: user.id,
          settings: {
            create: {
              notificationsEnabled: true,
              emailNotifications: true,
              pushNotifications: true,
              darkMode: false,
              language: 'en',
              timezone: 'UTC',
            },
          },
        },
      });

      // Return user with partner relationship
      return await tx.user.findUnique({
        where: { id: user.id },
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
    });

    if (!result) {
      throw new AppError(
        'Failed to create partner',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }

    // Send OTP verification email
    try {
      await this.verifyService.sendOtpVerification({
        email: result.email,
      });
    } catch (emailError) {
      logger.warn('Failed to send OTP verification email', {
        error:
          emailError instanceof Error ? emailError.message : 'Unknown error',
        email: result.email,
        context: 'PartnerSignupService.signup',
      });
    }

    // Generate auth token for immediate login
    const authUser = toIAuthUser(result);
    const authToken = getAuthToken(authUser);

    logger.info('Partner signup completed successfully', {
      userId: result.id,
      email: result.email,
      context: 'PartnerSignupService.signup',
    });

    return {
      message:
        'Partner registered successfully. Please check your email to verify your account.',
      user: authUser,
      token: authToken,
    };
  }
}
