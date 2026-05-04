import { PrismaClient } from '@prisma/client';
import { logger } from '@/shared/utils/logger';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { singleton } from '@/shared/decorators/singleton';
import {
  IPartnerProfileSetup,
  IPartnerProfileSetupDone,
  IPartnerProfileSetupRequired,
} from '@/shared/models/domain/partner/profile.setup.domain';
import { toIAuthUser } from '@/shared/models/domain/auth/auth.user.domain';
import { PartnerProfileService } from './profile.service';

@singleton
export class PartnerProfileSetupService {
  private readonly prisma: PrismaClient;

  constructor(private readonly profileService: PartnerProfileService) {
    this.prisma = new PrismaClient();
  }

  async completeProfileSetup(
    userId: string,
    setupData: IPartnerProfileSetup
  ): Promise<IPartnerProfileSetupDone> {
    logger.info('Starting partner profile setup', {
      userId,
      context: 'PartnerProfileSetupService.completeProfileSetup',
    });

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Get user with partner association
        const user = await tx.user.findUnique({
          where: { id: userId },
          include: {
            partnerUser: {
              include: {
                partner: {
                  include: {
                    company: true,
                  },
                },
              },
            },
          },
        });

        if (!user) {
          throw new AppError('User not found', 404, ErrorCode.NOT_FOUND);
        }

        if (!user.partnerUser) {
          throw new AppError(
            'User is not associated with a partner',
            400,
            ErrorCode.INVALID_REQUEST
          );
        }

        if (!user.partnerUser.partner.company) {
          throw new AppError(
            'Partner company not found',
            404,
            ErrorCode.NOT_FOUND
          );
        }

        // Update user information
        await tx.user.update({
          where: { id: userId },
          data: {
            name: setupData.name,
            jobTitle: setupData.title,
            profileSetup: true,
          },
        });

        // Update company information
        await tx.company.update({
          where: { id: user.partnerUser.partner.company.id },
          data: {
            name: setupData.companyName,
            // Store phone in company contact info if needed
            contactPhone: setupData.phone,
          },
        });

        // Return updated user with all relations
        const finalUser = await tx.user.findUnique({
          where: { id: userId },
          include: {
            partnerUser: {
              include: {
                partner: {
                  include: {
                    company: true,
                  },
                },
              },
            },
          },
        });

        if (!finalUser) {
          throw new AppError(
            'Failed to retrieve updated user',
            500,
            ErrorCode.INTERNAL_SERVER_ERROR
          );
        }

        return {
          message: 'Profile setup completed successfully',
          user: toIAuthUser(finalUser),
        };
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Failed to complete partner profile setup', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        context: 'PartnerProfileSetupService.completeProfileSetup',
      });

      throw new AppError(
        'Failed to complete profile setup',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async isProfileSetupRequired(
    userId: string
  ): Promise<IPartnerProfileSetupRequired> {
    logger.info('Checking if partner profile setup is required', {
      userId,
      context: 'PartnerProfileSetupService.isProfileSetupRequired',
    });

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          partnerUser: {
            include: {
              partner: {
                include: {
                  company: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        throw new AppError('User not found', 404, ErrorCode.NOT_FOUND);
      }

      if (!user.partnerUser) {
        throw new AppError(
          'User is not associated with a partner',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      const company = user.partnerUser.partner.company;

      // Check if required fields are missing
      const isRequired = !user.name || !user.jobTitle || !company?.name;

      return {
        required: isRequired,
        message: isRequired
          ? 'Please complete your profile setup to continue'
          : 'Profile setup is complete',
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Failed to check partner profile setup requirement', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        context: 'PartnerProfileSetupService.isProfileSetupRequired',
      });

      throw new AppError(
        'Failed to check profile setup requirement',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }
}
