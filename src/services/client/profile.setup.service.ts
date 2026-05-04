import { PrismaClient } from '@prisma/client';
import { logger } from '@/shared/utils/logger';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { singleton } from '@/shared/decorators/singleton';
import {
  IClientProfileSetup,
  IClientProfileSetupDone,
  IClientProfileSetupRequired,
} from '@/shared/models/domain/client/profile.setup.domain';
import { toIAuthUser } from '@/shared/models/domain/auth/auth.user.domain';
import { CompanySizeEnum, CompanyTypeEnum } from '@/shared/models/common/enums';
import { ClientSubscriptionService } from './subscription.service';
import { ClientProfileService } from './profile.service';

@singleton
export class ClientProfileSetupService {
  private readonly prisma: PrismaClient;

  private readonly companySizeToTypeMapping: Record<
    CompanySizeEnum,
    CompanyTypeEnum
  > = {
    [CompanySizeEnum.ONE_TO_TEN]: CompanyTypeEnum.STARTUP,
    [CompanySizeEnum.ELEVEN_TO_FIFTY]: CompanyTypeEnum.SCALE_UP,
    [CompanySizeEnum.FIFTY_ONE_TO_TWO_HUNDRED]: CompanyTypeEnum.ENTERPRISE,
    [CompanySizeEnum.TWO_HUNDRED_ONE_TO_FIVE_HUNDRED]:
      CompanyTypeEnum.ENTERPRISE,
    [CompanySizeEnum.FIVE_HUNDRED_ONE_TO_THOUSAND]: CompanyTypeEnum.ENTERPRISE,
    [CompanySizeEnum.OVER_THOUSAND]: CompanyTypeEnum.ENTERPRISE,
  };

  constructor(
    private readonly subscriptionService: ClientSubscriptionService,
    private readonly clientProfileService: ClientProfileService
  ) {
    this.prisma = new PrismaClient();
  }

  async completeProfileSetup(
    userId: string,
    setupData: IClientProfileSetup
  ): Promise<IClientProfileSetupDone> {
    logger.info('Starting client profile setup', {
      userId,
      context: 'ClientProfileSetupService.completeProfileSetup',
    });

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Get user with client association
        const user = await tx.user.findUnique({
          where: { id: userId },
          include: {
            clientUser: {
              include: {
                client: {
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

        if (!user.clientUser) {
          throw new AppError(
            'User is not associated with a client',
            400,
            ErrorCode.INVALID_REQUEST
          );
        }

        if (!user.clientUser.client.company) {
          throw new AppError(
            'Client company not found',
            404,
            ErrorCode.NOT_FOUND
          );
        }

        // Update user information
        await tx.user.update({
          where: { id: userId },
          data: {
            name: setupData.name,
            jobTitle: setupData.jobTitle,
            profileSetup: true,
          },
        });

        // Map CompanySizeEnum to CompanyTypeEnum
        const companyType =
          this.companySizeToTypeMapping[setupData.companySize];

        if (!companyType) {
          throw new AppError(
            `Invalid company size: ${setupData.companySize}`,
            400,
            ErrorCode.INVALID_REQUEST
          );
        }

        // Update company information
        await tx.company.update({
          where: { id: user.clientUser.client.company.id },
          data: {
            name: setupData.companyName,
            industry: setupData.companyIndustry,
            size: setupData.companySize,
            companyType: companyType,
            description: setupData.companyDescription || '',
            contactPhone: setupData.phone,
          },
        });

        // Return updated user with all relations
        const finalUser = await tx.user.findUnique({
          where: { id: userId },
          include: {
            clientUser: {
              include: {
                client: {
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

        // Generate auth user
        const authUser = toIAuthUser(finalUser);

        return {
          message: 'Profile setup completed successfully',
          user: authUser,
        };
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Failed to complete client profile setup', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        context: 'ClientProfileSetupService.completeProfileSetup',
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
  ): Promise<IClientProfileSetupRequired> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          clientUser: {
            include: {
              client: {
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

      if (!user.clientUser) {
        throw new AppError(
          'User is not associated with a client',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      const company = user.clientUser.client.company;

      // Check if required fields are missing
      const isRequired =
        !user.name ||
        !user.jobTitle ||
        !company?.name ||
        !company?.industry ||
        !company?.companyType;

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

      logger.error('Failed to check profile setup requirement', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        context: 'ClientProfileSetupService.isProfileSetupRequired',
      });

      throw new AppError(
        'Failed to check profile setup requirement',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }
}
