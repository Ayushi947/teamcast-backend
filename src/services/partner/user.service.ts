import { singleton } from '@/shared/decorators/singleton';
import { PrismaClient } from '@prisma/client';
import { INotificationProvider } from '../notification/notification.interface';
import {
  IPartnerUser,
  IPartnerUserActivateDeactivate,
  IPartnerUserCreate,
  IPartnerUserFilterQuery,
  IPartnerUserUpdate,
  toPartnerUserDomain,
} from '@/shared/models/domain/partner/user.domain';
import { ErrorCode } from '@/utils/error.codes';
import { AppError } from '@/utils/app.error';
import {
  UserRoleEnum,
  UserStatusEnum,
  UserTypeEnum,
} from '@/shared/models/common/enums';
import { IUser } from '@/shared/models/domain/user/user.domain';
import { logger } from '@/shared/utils/logger';
import { ENV } from '@/config/env';
import {
  IPaginatedResponse,
  IPaginationRequest,
} from '@/shared/models/api/common/common.api';
import {
  buildQueryConditions,
  ISearchConfig,
  IFilterConfig,
  ISortConfig,
} from '@/utils/pagination';

@singleton
export class PartnerUserService {
  private readonly prisma: PrismaClient;
  private readonly notificationProvider: INotificationProvider;

  constructor(notificationProvider: INotificationProvider) {
    this.prisma = new PrismaClient();
    this.notificationProvider = notificationProvider;
  }

  private readonly searchConfig: ISearchConfig = {
    searchableFields: [],
    relationFields: {
      user: ['email', 'name', 'jobTitle'],
    },
  };

  private readonly filterConfig: IFilterConfig = {
    allowedFields: [
      'email',
      'name',
      'jobTitle',
      'role',
      'status',
      'hasProfilePicture',
    ],
    relationFields: {
      email: 'user',
      name: 'user',
      jobTitle: 'user',
    },
    arrayFields: [],
    enumFields: [],
    enumRelationFields: {
      role: 'user',
      status: 'user',
    },
  };

  private readonly sortConfig: ISortConfig = {
    allowedFields: [
      'email',
      'name',
      'jobTitle',
      'role',
      'status',
      'createdAt',
      'updatedAt',
    ],
    relationFields: {
      email: { relation: 'user', field: 'email' },
      name: { relation: 'user', field: 'name' },
      jobTitle: { relation: 'user', field: 'jobTitle' },
      role: { relation: 'user', field: 'role' },
      status: { relation: 'user', field: 'status' },
    },
    defaultSort: { field: 'createdAt', order: 'desc' },
  };

  async createPartnerUser(
    adminUserId: string,
    partnerId: string,
    userData: IPartnerUserCreate
  ): Promise<IPartnerUser> {
    try {
      const partner = await this.prisma.partner.findUnique({
        where: { id: partnerId },
        include: {
          company: true,
        },
      });

      if (!partner) {
        throw new AppError('Partner not found', 404, ErrorCode.NOT_FOUND);
      }

      // Check if the email is already registered
      const existingUser = await this.prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        throw new AppError(
          'User with this email already exists',
          409,
          ErrorCode.CONFLICT
        );
      }

      const result = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: userData.email,
            name: userData.name,
            jobTitle: userData.jobTitle,
            role: userData.role,
            status: userData.status,
            type: UserTypeEnum.PARTNER,
            emailVerified: new Date(),
          },
        });

        const partnerUser = await tx.partner_user.create({
          data: {
            userId: user.id,
            partnerId: userData.partnerId,
          },
          include: {
            user: true,
          },
        });

        return { user, partnerUser };
      });

      const adminUser = (await this.prisma.user.findUnique({
        where: { id: adminUserId },
      })) as IUser | null;

      if (result.user.status === UserStatusEnum.ACTIVE) {
        await this.sendUserStatusNotification(
          result.user.email,
          result.user.name,
          partner?.company?.name || '',
          adminUser?.name || 'Admin',
          true // isActivation = true
        );
      }

      return toPartnerUserDomain(result.partnerUser);
    } catch (error) {
      logger.error({
        message: 'Failed to create partner user',
        context: 'PartnerUserService.createPartnerUser',
        error: error instanceof Error ? error.message : 'Unknown error',
        userData,
      });
      throw error;
    }
  }

  async updatePartnerUser(
    adminUserId: string,
    partnerId: string,
    partnerUserId: string,
    userData: IPartnerUserUpdate
  ): Promise<IPartnerUser> {
    try {
      logger.info({
        message: 'Updating partner user',
        context: 'PartnerUserService.updatePartnerUser',
        partnerUserId,
        userData,
      });

      const requestingUser = (await this.prisma.user.findUnique({
        where: { id: adminUserId },
      })) as IUser | null;

      if (!requestingUser) {
        throw new AppError('User not found', 404, ErrorCode.NOT_FOUND);
      }

      const partnerUser = await this.prisma.partner_user.findFirst({
        where: {
          id: partnerUserId,
          partnerId: partnerId,
        },
        include: {
          user: true,
        },
      });

      if (!partnerUser) {
        throw new AppError('Partner user not found', 404, ErrorCode.NOT_FOUND);
      }

      const finalUpdateData = { ...userData };
      delete finalUpdateData.partnerId; // Remove partnerId from user update data

      if (adminUserId === partnerUser.userId) {
        if (requestingUser.role !== UserRoleEnum.ADMIN) {
          if (userData.role !== undefined || userData.status !== undefined) {
            throw new AppError(
              'You cannot change your own role or status',
              403,
              ErrorCode.FORBIDDEN
            );
          }
        }
      } else {
        if (requestingUser.role !== UserRoleEnum.ADMIN) {
          throw new AppError(
            'Only admins can update other users',
            403,
            ErrorCode.FORBIDDEN
          );
        }
      }

      const isActivating =
        partnerUser.user.status !== UserStatusEnum.ACTIVE &&
        userData.status === UserStatusEnum.ACTIVE;

      const isDeactivating =
        partnerUser.user.status === UserStatusEnum.ACTIVE &&
        userData.status === UserStatusEnum.INACTIVE;

      const updatedUser = await this.prisma.$transaction(async (tx) => {
        if (!partnerUser.user) {
          throw new AppError('User not found', 404, ErrorCode.NOT_FOUND);
        }

        const updatedUser = (await tx.user.update({
          where: { id: partnerUser.user.id },
          data: finalUpdateData,
        })) as IUser;

        // If partnerId is provided, update the partner_user relation
        if (userData.partnerId) {
          await tx.partner_user.update({
            where: { id: partnerUserId },
            data: { partnerId: userData.partnerId },
          });
        }

        // if(isActivating) {
        //     await this.subscriptionService.incrementUsedSeats(partnerId);
        // }

        return updatedUser;
      });

      const partner = await this.prisma.partner.findUnique({
        where: { id: partnerId },
        include: {
          company: true,
        },
      });

      if (isActivating) {
        await this.sendUserStatusNotification(
          updatedUser.email,
          updatedUser.name,
          partner?.company?.name || '',
          requestingUser.name,
          true // isActivation = true
        );
      }

      if (isDeactivating) {
        await this.sendUserStatusNotification(
          updatedUser.email,
          updatedUser.name,
          partner?.company?.name || '',
          requestingUser.name,
          false // isActivation = false
        );
      }

      return toPartnerUserDomain(partnerUser);
    } catch (error) {
      logger.error({
        message: 'Failed to update partner user',
        context: 'PartnerUserService.updatePartnerUser',
        error: error instanceof Error ? error.message : 'Unknown error',
        partnerUserId,
        userData,
      });
      throw error;
    }
  }

  async getPartnerUser(
    partnerId: string,
    partnerUserId: string
  ): Promise<IPartnerUser> {
    try {
      const partnerUser = await this.prisma.partner_user.findFirst({
        where: {
          id: partnerUserId,
          partnerId: partnerId,
        },
        include: {
          user: true,
        },
      });

      if (!partnerUser) {
        throw new AppError('Partner user not found', 404, ErrorCode.NOT_FOUND);
      }

      return toPartnerUserDomain(partnerUser);
    } catch (error) {
      logger.error({
        message: 'Failed to get partner user',
        context: 'PartnerUserService.getPartnerUser',
        error: error instanceof Error ? error.message : 'Unknown error',
        partnerUserId,
      });
      throw error;
    }
  }

  async deletePartnerUser(
    partnerId: string,
    partnerUserId: string
  ): Promise<void> {
    try {
      const partnerUser = await this.prisma.partner_user.findFirst({
        where: {
          id: partnerUserId,
          partnerId: partnerId,
        },
      });

      if (!partnerUser) {
        throw new AppError('Partner user not found', 404, ErrorCode.NOT_FOUND);
      }

      const user = (await this.prisma.user.findUnique({
        where: { id: partnerUser.userId },
      })) as IUser | null;

      if (!user) {
        throw new AppError('User not found', 404, ErrorCode.NOT_FOUND);
      }

      // const isActive = user.status === UserStatusEnum.ACTIVE;

      await this.prisma.$transaction(async (tx) => {
        await tx.partner_user.delete({
          where: { id: partnerUserId },
        });

        await tx.user.delete({
          where: { id: partnerUser.userId },
        });
      });
    } catch (error) {
      logger.error({
        message: 'Failed to delete partner user',
        context: 'PartnerUserService.deletePartnerUser',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async listPartnerUsers(
    partnerId: string,
    filter: IPartnerUserFilterQuery,
    paginationRequest: IPaginationRequest
  ): Promise<IPaginatedResponse<IPartnerUser>> {
    try {
      logger.info({
        message: 'Listing partner users',
        context: 'PartnerUserService.listPartnerUsers',
        partnerId,
        filter,
        paginationRequest,
      });

      const queryConditions = buildQueryConditions(filter, paginationRequest, {
        search: this.searchConfig,
        filter: this.filterConfig,
        sort: this.sortConfig,
      });

      const baseWhere = {
        partnerId,
        user: {
          type: UserTypeEnum.PARTNER,
        },
      };

      const total = await this.prisma.partner_user.count({
        where: {
          ...baseWhere,
          ...queryConditions.where,
        },
      });

      const users = await this.prisma.partner_user.findMany({
        where: {
          ...baseWhere,
          ...queryConditions.where,
        },
        skip: queryConditions.skip,
        take: queryConditions.take,
        orderBy: queryConditions.orderBy,
        include: {
          user: true,
        },
      });

      return {
        items: users.map(toPartnerUserDomain),
        pagination: {
          total,
          page: queryConditions.pagination.page,
          limit: queryConditions.pagination.limit,
          totalPages: Math.ceil(total / queryConditions.pagination.limit),
        },
      };
    } catch (error) {
      logger.error({
        message: 'Failed to list partner users',
        context: 'PartnerUserService.listPartnerUsers',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        partnerId,
        filter,
        paginationRequest,
      });
      throw error;
    }
  }

  async activateDeactivatePartnerUser(
    adminUserId: string,
    partnerId: string,
    partnerUserId: string,
    statusData: IPartnerUserActivateDeactivate
  ): Promise<IPartnerUser> {
    try {
      // Get the requesting user to check their role
      const requestingUser = (await this.prisma.user.findUnique({
        where: { id: adminUserId },
      })) as IUser | null;

      if (!requestingUser) {
        throw new AppError('User not found', 404, ErrorCode.NOT_FOUND);
      }

      // Only ADMIN can change user status
      if (requestingUser.role !== UserRoleEnum.ADMIN) {
        throw new AppError(
          'Only admins can activate or deactivate users',
          403,
          ErrorCode.FORBIDDEN
        );
      }

      const partnerUser = await this.prisma.partner_user.findFirst({
        where: {
          id: partnerUserId,
          partnerId: partnerId,
        },
        include: {
          user: true,
        },
      });

      if (!partnerUser) {
        throw new AppError('Partner user not found', 404, ErrorCode.NOT_FOUND);
      }

      const userToUpdate = (await this.prisma.user.findUnique({
        where: { id: partnerUser.userId },
      })) as IUser | null;

      if (!userToUpdate) {
        throw new AppError('User not found', 404, ErrorCode.NOT_FOUND);
      }

      const updatedUser = await this.prisma.$transaction(async (tx) => {
        const updatedUser = (await tx.user.update({
          where: { id: partnerUser.userId },
          data: { status: statusData.status },
        })) as IUser;

        return updatedUser;
      });

      const partner = await this.prisma.partner.findUnique({
        where: { id: partnerId },
        include: {
          company: true,
        },
      });

      if (!partner) {
        throw new AppError('Partner not found', 404, ErrorCode.NOT_FOUND);
      }

      const isActivation = statusData.status === UserStatusEnum.ACTIVE;
      await this.sendUserStatusNotification(
        updatedUser.email,
        updatedUser.name,
        partner.company?.name || '',
        requestingUser.name,
        isActivation,
        updatedUser.role
      );

      return toPartnerUserDomain(partnerUser);
    } catch (error) {
      logger.error({
        message: 'Failed to activate or deactivate partner user',
        context: 'PartnerUserService.activateDeactivatePartnerUser',
        error: error instanceof Error ? error.message : 'Unknown error',
        partnerUserId,
        statusData,
      });
      throw error;
    }
  }

  private async sendUserStatusNotification(
    userEmail: string,
    userName: string,
    companyName: string,
    actionByName: string,
    isActivation: boolean,
    userRole?: string
  ) {
    try {
      if (isActivation) {
        await this.notificationProvider.sendPartnerUserActivatedEmail(
          userEmail,
          userName,
          companyName,
          actionByName,
          `${ENV.FRONTEND_URL}/app/auth/login`,
          userRole
        );

        logger.info({
          message: 'Partner user activation notification sent',
          context: 'PartnerUserService.sendUserStatusNotification',
          userEmail,
          companyName,
          actionByName,
        });
      } else {
        await this.notificationProvider.sendPartnerUserDeactivatedEmail(
          userEmail,
          userName,
          companyName,
          actionByName,
          `${ENV.FRONTEND_URL}/contact`,
          userRole
        );

        logger.info({
          message: 'Partner user deactivation notification sent',
          context: 'PartnerUserService.sendUserStatusNotification',
          userEmail,
          companyName,
          actionByName,
        });
      }
    } catch (_error) {
      logger.error({
        message: 'Failed to send user status notification',
        context: 'PartnerUserService.sendUserStatusNotification',
        userEmail,
        companyName,
        actionByName,
      });
    }
  }
}
