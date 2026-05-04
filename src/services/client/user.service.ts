import { PrismaClient } from '@prisma/client';
import { singleton } from '@/shared/decorators/singleton';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';
import {
  IClientUser,
  IClientUserCreate,
  IClientUserUpdate,
  IClientUserFilterQuery,
  IClientUserActivateDeactivate,
  toClientUserDomain,
} from '@/shared/models/domain/client/user.domain';
import {
  UserRoleEnum,
  UserStatusEnum,
  UserTypeEnum,
} from '@/shared/models/common/enums';
import {
  IPaginationRequest,
  IPaginatedResponse,
} from '@/shared/models/api/common/common.api';
import {
  buildQueryConditions,
  ISearchConfig,
  IFilterConfig,
  ISortConfig,
} from '@/utils/pagination';
import { INotificationProvider } from '@/services/notification/notification.interface';
import { ENV } from '@/config/env';
import { IUser } from '@/shared/models/domain/user/user.domain';
import { ClientUserInvitationService } from '@/services/client/user.invitation.service';
import { ClientSubscriptionService } from '@/services/client/subscription.service';
import { NotificationFactory } from '@/services/notification/notification.factory';
import { generatePassword, hashPassword } from '@/utils/password';

@singleton
export class ClientUserService {
  private readonly prisma: PrismaClient;
  private readonly notificationProvider: INotificationProvider;
  private readonly invitationService: ClientUserInvitationService;
  private readonly subscriptionService: ClientSubscriptionService;

  constructor(
    invitationService: ClientUserInvitationService,
    subscriptionService: ClientSubscriptionService
  ) {
    this.prisma = new PrismaClient();
    this.notificationProvider =
      new NotificationFactory().getNotificationProvider();
    this.invitationService = invitationService;
    this.subscriptionService = subscriptionService;
  }

  private readonly searchConfig: ISearchConfig = {
    searchableFields: [],
    relationFields: {
      user: ['email', 'name', 'jobTitle'],
    },
  };

  private readonly filterConfig: IFilterConfig = {
    allowedFields: ['email', 'name', 'jobTitle', 'role', 'status'],
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

  /**
   * Create a new client user
   */
  async createClientUser(
    adminUserId: string,
    clientId: string,
    userData: IClientUserCreate
  ): Promise<IClientUser> {
    try {
      // Check if client exists
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        throw new AppError('Client not found', 404, ErrorCode.NOT_FOUND);
      }

      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        throw new AppError(
          'User with this email already exists',
          400,
          ErrorCode.ALREADY_EXISTS
        );
      }

      // Create user in database
      const user = await this.prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          password: await hashPassword(userData.password || generatePassword()),
          type: UserTypeEnum.CLIENT,
          role: userData.role,
          status: UserStatusEnum.ACTIVE,
          emailVerified: new Date(),
          jobTitle: userData.jobTitle,
        },
      });

      // Create client user association
      const clientUser = await this.prisma.client_user.create({
        data: {
          userId: user.id,
          clientId: clientId,
        },
        include: {
          user: true,
        },
      });

      // Get client company information for email notifications
      const clientInfo = await this.prisma.client.findUnique({
        where: { id: clientId },
        include: {
          company: true,
        },
      });

      if (!clientInfo) {
        throw new AppError('Client not found', 404, ErrorCode.NOT_FOUND);
      }

      const adminUser = (await this.prisma.user.findUnique({
        where: { id: adminUserId },
      })) as IUser | null;

      // Send notification to the admin about user activation
      await this.notificationProvider.sendClientUserActivatedEmail(
        user.email,
        user.name,
        clientInfo.company?.name || 'Company',
        adminUser?.name || 'System Admin',
        `${ENV.FRONTEND_URL}/app/auth/login`,
        userData.role
      );

      return toClientUserDomain(clientUser);
    } catch (error) {
      logger.error('Error creating client user', {
        error,
        clientId,
        userData: { email: userData.email, role: userData.role },
      });
      throw error;
    }
  }

  /**
   * Update an existing client user
   */
  async updateClientUser(
    requestingUserId: string,
    clientId: string,
    clientUserId: string,
    updateData: IClientUserUpdate
  ): Promise<IClientUser> {
    try {
      logger.info({
        message: 'Updating client user',
        context: 'ClientUserService.updateClientUser',
        clientUserId,
        updateData,
      });

      // Get the requesting user to check their role
      const requestingUser = (await this.prisma.user.findUnique({
        where: { id: requestingUserId },
      })) as IUser | null;

      if (!requestingUser) {
        throw new AppError('User not found', 404, ErrorCode.NOT_FOUND);
      }

      // Find the client user association
      const clientUser = await this.prisma.client_user.findFirst({
        where: {
          id: clientUserId,
          clientId: clientId,
        },
        include: {
          user: true,
        },
      });

      if (!clientUser || !clientUser.user) {
        throw new AppError(
          'User not found in this client',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Enforce authorization rules
      // Only ADMIN can change roles and status
      // HR/ACCOUNTS can only update themselves but not change roles or status
      const finalUpdateData = { ...updateData };

      if (requestingUserId === clientUser.userId) {
        // User is updating themselves
        if (requestingUser.role !== UserRoleEnum.ADMIN) {
          // Non-admins can't change their own role or status
          if (
            updateData.role !== undefined ||
            updateData.status !== undefined
          ) {
            throw new AppError(
              'You cannot change your own role or status',
              403,
              ErrorCode.FORBIDDEN
            );
          }
        } else {
          // Admin is updating themselves - prevent role demotion
          if (
            updateData.role !== undefined &&
            updateData.role !== UserRoleEnum.ADMIN
          ) {
            throw new AppError(
              'You cannot change your own role from Admin to a lower role',
              403,
              ErrorCode.FORBIDDEN
            );
          }
        }
      } else {
        // User is updating someone else
        if (requestingUser.role !== UserRoleEnum.ADMIN) {
          throw new AppError(
            'Only admins can update other users',
            403,
            ErrorCode.FORBIDDEN
          );
        }
      }

      // Track if status is changing to ACTIVE
      const isActivating =
        clientUser.user.status !== UserStatusEnum.ACTIVE &&
        updateData.status === UserStatusEnum.ACTIVE;

      // Track if status is changing to INACTIVE
      const isDeactivating =
        clientUser.user.status === UserStatusEnum.ACTIVE &&
        updateData.status === UserStatusEnum.INACTIVE;

      // If activating, check if there are available seats
      if (isActivating) {
        const hasAvailableSeats =
          await this.subscriptionService.hasAvailableSeats(clientId);
        if (!hasAvailableSeats) {
          throw new AppError(
            'No available seats in the current subscription',
            400,
            ErrorCode.SUBSCRIPTION_LIMIT_REACHED
          );
        }
      }

      // Update the user within a transaction
      const updatedUser = await this.prisma.$transaction(async (tx) => {
        if (!clientUser.user) {
          throw new AppError('User not found', 404, ErrorCode.NOT_FOUND);
        }

        // Update user
        const updatedUser = (await tx.user.update({
          where: { id: clientUser.user.id },
          data: finalUpdateData,
        })) as IUser;

        // If activating, increment used seats
        if (isActivating) {
          await this.subscriptionService.incrementUsedSeats(clientId);
        }
        // If deactivating, decrement used seats
        else if (isDeactivating) {
          await this.subscriptionService.decrementUsedSeats(clientId);
        }

        return updatedUser;
      });

      // Get client company name for email notifications
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
        include: {
          company: true,
        },
      });

      // Send activation/deactivation notifications if status changed
      if (isActivating) {
        await this.sendUserStatusNotification(
          updatedUser.email,
          updatedUser.name,
          client?.company?.name || '',
          requestingUser.name,
          true // isActivation = true
        );
      } else if (isDeactivating) {
        await this.sendUserStatusNotification(
          updatedUser.email,
          updatedUser.name,
          client?.company?.name || '',
          requestingUser.name,
          false // isActivation = false
        );
      }

      // Convert to domain model
      return toClientUserDomain(clientUser);
    } catch (error) {
      logger.error({
        message: 'Failed to update client user',
        context: 'ClientUserService.updateClientUser',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientUserId,
        updateData,
      });
      throw error;
    }
  }

  /**
   * Get a client user by ID
   */
  async getClientUser(
    clientId: string,
    clientUserId: string
  ): Promise<IClientUser> {
    try {
      // Find the client user association
      const clientUser = await this.prisma.client_user.findFirst({
        where: {
          id: clientUserId,
          clientId: clientId,
        },
        include: {
          user: true,
        },
      });

      if (!clientUser) {
        throw new AppError(
          'User not found in this client',
          404,
          ErrorCode.NOT_FOUND
        );
      }
      // Convert to domain model
      return toClientUserDomain(clientUser);
    } catch (error) {
      logger.error({
        message: 'Failed to get client user',
        context: 'ClientUserService.getClientUser',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientUserId,
      });
      throw error;
    }
  }

  /**
   * Delete a client user
   */
  async deleteClientUser(clientId: string, userId: string): Promise<void> {
    try {
      // Find the client user association
      const clientUser = await this.prisma.client_user.findFirst({
        where: {
          userId: userId,
          clientId: clientId,
        },
      });

      if (!clientUser) {
        throw new AppError(
          'User not found in this client',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Get the user to check their status
      const user = (await this.prisma.user.findUnique({
        where: { id: userId },
      })) as IUser | null;

      if (!user) {
        throw new AppError('User not found', 404, ErrorCode.NOT_FOUND);
      }

      // Check if user is active
      const isActive = user.status === UserStatusEnum.ACTIVE;

      // Delete in a transaction
      await this.prisma.$transaction(async (tx) => {
        // First delete the client_user association
        await tx.client_user.delete({
          where: { id: clientUser.id },
        });

        // Then delete the user
        await tx.user.delete({
          where: { id: userId },
        });

        // If user was active, decrement the seat count
        if (isActive) {
          await this.subscriptionService.decrementUsedSeats(clientId);
        }
      });
    } catch (error) {
      logger.error({
        message: 'Failed to delete client user',
        context: 'ClientUserService.deleteClientUser',
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });
      throw error;
    }
  }

  /**
   * List all client users with optional filtering
   */
  async listClientUsers(
    clientId: string,
    filter: IClientUserFilterQuery,
    paginationRequest: IPaginationRequest
  ): Promise<IPaginatedResponse<IClientUser>> {
    try {
      const queryConditions = buildQueryConditions(filter, paginationRequest, {
        search: this.searchConfig,
        filter: this.filterConfig,
        sort: this.sortConfig,
      });

      const baseWhere = {
        clientId,
        user: {
          type: UserTypeEnum.CLIENT,
        },
      };

      const total = await this.prisma.client_user.count({
        where: {
          ...baseWhere,
          ...queryConditions.where,
        },
      });

      const users = await this.prisma.client_user.findMany({
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
        items: users.map(toClientUserDomain),
        pagination: {
          total,
          page: queryConditions.pagination.page,
          limit: queryConditions.pagination.limit,
          totalPages: Math.ceil(total / queryConditions.pagination.limit),
        },
      };
    } catch (error) {
      logger.error({
        message: 'Failed to list client users',
        context: 'ClientUserService.listClientUsers',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        clientId,
        filter,
        paginationRequest,
      });
      throw error;
    }
  }

  /**
   * Activate or deactivate a client user
   */
  async activateDeactivateClientUser(
    requestingUserId: string,
    clientId: string,
    clientUserId: string,
    statusData: IClientUserActivateDeactivate
  ): Promise<IClientUser> {
    try {
      // Get the requesting user to check their role
      const requestingUser = (await this.prisma.user.findUnique({
        where: { id: requestingUserId },
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

      // Find the client user association
      const clientUser = await this.prisma.client_user.findFirst({
        where: {
          id: clientUserId,
          clientId: clientId,
        },
        include: {
          user: true,
        },
      });

      if (!clientUser) {
        throw new AppError(
          'User not found in this client',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Get the user to be updated
      const userToUpdate = (await this.prisma.user.findUnique({
        where: { id: clientUser.userId },
      })) as IUser | null;

      if (!userToUpdate) {
        throw new AppError('User not found', 404, ErrorCode.NOT_FOUND);
      }

      // Determine if we're activating or deactivating the user
      const isActivating =
        userToUpdate.status !== UserStatusEnum.ACTIVE &&
        statusData.status === UserStatusEnum.ACTIVE;

      const isDeactivating =
        userToUpdate.status === UserStatusEnum.ACTIVE &&
        statusData.status !== UserStatusEnum.ACTIVE;

      // If activating, check if there are available seats
      if (isActivating) {
        const hasAvailableSeats =
          await this.subscriptionService.hasAvailableSeats(clientId);
        if (!hasAvailableSeats) {
          throw new AppError(
            'No available seats in the current subscription',
            400,
            ErrorCode.SUBSCRIPTION_LIMIT_REACHED
          );
        }
      }

      // Update the user status within a transaction
      const updatedUser = await this.prisma.$transaction(async (tx) => {
        // Update user status
        const updatedUser = (await tx.user.update({
          where: { id: clientUser.userId },
          data: { status: statusData.status },
        })) as IUser;

        // If activating, increment used seats
        if (isActivating) {
          await this.subscriptionService.incrementUsedSeats(clientId);
        }
        // If deactivating, decrement used seats
        else if (isDeactivating) {
          await this.subscriptionService.decrementUsedSeats(clientId);
        }

        return updatedUser;
      });

      // Get client company name for email notifications
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
        include: {
          company: true,
        },
      });

      if (!client) {
        throw new AppError('Client not found', 404, ErrorCode.NOT_FOUND);
      }

      // Send activation/deactivation notification
      const isActivation = statusData.status === UserStatusEnum.ACTIVE;
      await this.sendUserStatusNotification(
        updatedUser.email,
        updatedUser.name,
        client.company?.name || '',
        requestingUser.name,
        isActivation,
        updatedUser.role
      );

      // Convert to domain model
      return toClientUserDomain(clientUser);
    } catch (error) {
      logger.error({
        message: 'Failed to activate/deactivate client user',
        context: 'ClientUserService.activateDeactivateClientUser',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientUserId,
        status: statusData.status,
      });
      throw error;
    }
  }

  /**
   * Send email notification for user status change
   */
  private async sendUserStatusNotification(
    userEmail: string,
    userName: string,
    companyName: string,
    actionByName: string,
    isActivation: boolean,
    userRole?: string
  ): Promise<void> {
    try {
      // Use notification service to send appropriate email
      if (isActivation) {
        // Send activation email
        await this.notificationProvider.sendClientUserActivatedEmail(
          userEmail,
          userName,
          companyName,
          actionByName,
          `${ENV.FRONTEND_URL}/app/auth/login`, // Redirect to login
          userRole
        );

        logger.info({
          message: 'User activation notification sent',
          context: 'ClientUserService.sendUserStatusNotification',
          userEmail,
          companyName,
          actionByName,
        });
      } else {
        // Send deactivation email
        await this.notificationProvider.sendClientUserDeactivatedEmail(
          userEmail,
          userName,
          companyName,
          actionByName,
          `${ENV.FRONTEND_URL}/contact`,
          userRole
        );

        logger.info({
          message: 'User deactivation notification sent',
          context: 'ClientUserService.sendUserStatusNotification',
          userEmail,
          companyName,
          actionByName,
        });
      }
    } catch (error) {
      logger.error({
        message: 'Failed to send user status notification',
        context: 'ClientUserService.sendUserStatusNotification',
        error: error instanceof Error ? error.message : 'Unknown error',
        userEmail,
        isActivation,
      });
      // Don't throw the error - we don't want to fail the API call if email fails
    }
  }
}
