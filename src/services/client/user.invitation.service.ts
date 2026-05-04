import { singleton } from '@/shared/decorators/singleton';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';
import { ENV } from '@/config/env';
import {
  IClientUserInvitation,
  IClientUserInvitationAccepted,
  IClientUserInvitationFilterQuery,
  IClientUserInvitationSend,
  toIClientUserInvitation,
} from '@/shared/models/domain/client/user.invitation.domain';
import {
  UserStatusEnum,
  ClientUserInvitationStatusEnum,
  UserTypeEnum,
  UserRoleEnum,
} from '@/shared/models/common/enums';
import { INotificationProvider } from '@/services/notification/notification.interface';
import { getAuthToken } from '@/utils/generate.token';
import { toIAuthUser } from '@/shared/models/domain/auth/auth.user.domain';
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
import { ClientSubscriptionService } from './subscription.service';
import { ClientUserProfileService } from './user.profile.service';
import { NotificationFactory } from '../notification/notification.factory';
import { ClientSubscriptionLimitsService } from './subscription.limits.service';
import { hashPassword, generatePassword } from '@/utils/password';
import { formatEmail, formatName } from '@/shared/utils/formatters';

@singleton
export class ClientUserInvitationService {
  private readonly prisma: PrismaClient;
  private readonly invitationExpiryHours = 72; // 3 days

  private readonly subscriptionLimitsService: ClientSubscriptionLimitsService;

  constructor(
    private readonly notificationProvider: INotificationProvider,
    private readonly subscriptionService: ClientSubscriptionService,
    private readonly clientUserProfileService: ClientUserProfileService
  ) {
    this.prisma = new PrismaClient();
    this.notificationProvider =
      new NotificationFactory().getNotificationProvider();
    this.subscriptionLimitsService = new ClientSubscriptionLimitsService();
  }

  private readonly searchConfig: ISearchConfig = {
    searchableFields: ['email', 'name', 'jobTitle'],
  };

  private readonly filterConfig: IFilterConfig = {
    allowedFields: ['email', 'name', 'jobTitle', 'role', 'status'],
    arrayFields: [],
    enumFields: [],
    enumRelationFields: {},
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
    defaultSort: { field: 'createdAt', order: 'desc' },
  };

  /**
   * Send invitation to a user to join a client team
   */
  async sendInvitation(
    clientId: string,
    inviterUserId: string,
    invitationData: IClientUserInvitationSend
  ): Promise<IClientUserInvitation> {
    try {
      const inviteUser = await this.prisma.user.findUnique({
        where: { email: invitationData.email },
      });

      if (inviteUser) {
        throw new AppError(
          'User already exists',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      // Check if client exists
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
        include: { company: true },
      });

      if (!client) {
        throw new AppError('Client not found', 404, ErrorCode.NOT_FOUND);
      }

      // Check if client has available seats if yes cut one seat
      const seatsCheck =
        await this.subscriptionLimitsService.checkSeatsLimit(clientId);

      if (!seatsCheck.canAdd) {
        throw new AppError(
          seatsCheck.errorMessage ||
            'No available seats in the current subscription',
          400,
          ErrorCode.SUBSCRIPTION_LIMIT_REACHED
        );
      }

      // Get inviter details
      const inviter = await this.prisma.user.findUnique({
        where: { id: inviterUserId },
      });

      if (!inviter) {
        throw new AppError('Inviter not found', 404, ErrorCode.NOT_FOUND);
      }

      // Check if email is already registered
      const existingUser = await this.prisma.user.findUnique({
        where: { email: invitationData.email },
      });

      // Check if an active invitation already exists for this email
      const existingInvitation =
        await this.prisma.client_user_invitation.findFirst({
          where: {
            clientId,
            email: invitationData.email,
            status: ClientUserInvitationStatusEnum.PENDING,
          },
        });

      if (existingInvitation) {
        throw new AppError(
          'An active invitation already exists for this email',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      // Generate unique token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.invitationExpiryHours);

      // Create invitation
      const invitation = await this.prisma.client_user_invitation.create({
        data: {
          clientId,
          email: formatEmail(invitationData.email),
          name: formatName(invitationData.name),
          jobTitle: invitationData.jobTitle,
          role: invitationData.role,
          token,
          expiresAt,
          status: ClientUserInvitationStatusEnum.PENDING,
        },
      });

      // If user already exists and has an active client association, update the invitation
      if (existingUser && existingUser.type === UserTypeEnum.CLIENT) {
        const existingClientUser = await this.prisma.client_user.findFirst({
          where: { userId: existingUser.id },
        });

        if (existingClientUser) {
          // Update the invitation to link with existing client user
          await this.prisma.client_user_invitation.update({
            where: { id: invitation.id },
            data: {
              clientUserId: existingClientUser.id,
            },
          });
        }
      }

      // Generate invitation URL
      const invitationUrl = `${ENV.FRONTEND_URL}/app/client/invitation/accept/${token}`;

      // Send email notification
      await this.notificationProvider.sendClientUserInvitationEmail(
        invitationData.email,
        invitationData.name,
        client.company.name,
        inviter.name,
        invitationUrl,
        invitationData.role,
        this.invitationExpiryHours,
        UserTypeEnum.CLIENT,
        invitationData.role
      );

      return toIClientUserInvitation(invitation);
    } catch (error) {
      logger.error({
        message: 'Failed to send client user invitation',
        context: 'ClientUserInvitationService.sendInvitation',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        invitationData: {
          email: invitationData.email,
          role: invitationData.role,
        },
      });
      throw error;
    }
  }

  /**
   * Get an invitation by ID
   */
  async getInvitation(
    clientId: string,
    invitationId: string
  ): Promise<IClientUserInvitation> {
    try {
      // Find the invitation that belongs to the client
      const invitation = await this.prisma.client_user_invitation.findFirst({
        where: {
          id: invitationId,
          clientId,
        },
      });
      if (!invitation) {
        throw new AppError('Invitation not found', 404, ErrorCode.NOT_FOUND);
      }
      return toIClientUserInvitation(invitation);
    } catch (error) {
      logger.error({
        message: 'Failed to get client user invitation',
        context: 'ClientUserInvitationService.getInvitation',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        invitationId,
      });
      throw error;
    }
  }

  /**
   * Withdraw an invitation
   */
  async withdrawInvitation(
    clientId: string,
    inviterUserId: string,
    invitationId: string
  ): Promise<IClientUserInvitation> {
    try {
      // Verify the invitation belongs to the client
      const invitation = await this.prisma.client_user_invitation.findFirst({
        where: {
          id: invitationId,
          clientId,
          status: ClientUserInvitationStatusEnum.PENDING,
        },
        include: {
          client: {
            include: {
              company: true,
            },
          },
        },
      });

      if (!invitation) {
        throw new AppError(
          'Invitation not found or already processed',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Get inviter details
      const inviter = await this.prisma.user.findUnique({
        where: { id: inviterUserId },
      });

      if (!inviter) {
        throw new AppError('Inviter not found', 404, ErrorCode.NOT_FOUND);
      }

      // Update invitation status
      const updatedInvitation = await this.prisma.client_user_invitation.update(
        {
          where: { id: invitationId },
          data: {
            status: ClientUserInvitationStatusEnum.WITHDRAWN,
          },
        }
      );

      // Send withdrawal notification
      await this.notificationProvider.sendClientUserInvitationWithdrawnEmail(
        invitation.email,
        invitation.name,
        invitation.client.company.name,
        inviter.name
      );

      return toIClientUserInvitation(updatedInvitation);
    } catch (error) {
      logger.error('Error withdrawing client user invitation', {
        error,
        clientId,
        invitationId,
      });
      throw error;
    }
  }

  /**
   * Resend an invitation
   */
  async resendInvitation(
    clientId: string,
    inviterUserId: string,
    invitationId: string
  ): Promise<IClientUserInvitation> {
    try {
      // Get client details
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
        include: { company: true },
      });

      if (!client) {
        throw new AppError('Client not found', 404, ErrorCode.NOT_FOUND);
      }

      // Get inviter details
      const inviter = await this.prisma.user.findUnique({
        where: { id: inviterUserId },
      });

      if (!inviter) {
        throw new AppError('Inviter not found', 404, ErrorCode.NOT_FOUND);
      }

      // Verify the invitation belongs to the client and is in pending, withdrawn, or expired state
      const invitation = await this.prisma.client_user_invitation.findFirst({
        where: {
          id: invitationId,
          clientId,
          status: {
            in: [
              ClientUserInvitationStatusEnum.PENDING,
              ClientUserInvitationStatusEnum.WITHDRAWN,
              ClientUserInvitationStatusEnum.EXPIRED,
            ],
          },
        },
      });

      if (!invitation) {
        throw new AppError(
          'Invitation not found or already processed',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Generate new token and update expiration
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.invitationExpiryHours);

      // Update invitation
      const updatedInvitation = await this.prisma.client_user_invitation.update(
        {
          where: { id: invitationId },
          data: {
            token,
            expiresAt,
            status: ClientUserInvitationStatusEnum.PENDING,
          },
        }
      );

      // Generate invitation URL
      const invitationUrl = `${ENV.FRONTEND_URL}/app/client/invitation/accept/${token}`;

      // Send email notification
      await this.notificationProvider.sendClientUserInvitationEmail(
        invitation.email,
        invitation.name,
        client.company.name,
        inviter.name,
        invitationUrl,
        invitation.role,
        this.invitationExpiryHours,
        UserTypeEnum.CLIENT,
        invitation.role
      );

      return toIClientUserInvitation(updatedInvitation);
    } catch (error) {
      logger.error({
        message: 'Failed to resend client user invitation',
        context: 'ClientUserInvitationService.resendInvitation',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        invitationId,
      });
      throw error;
    }
  }

  /**
   * Accept an invitation and create a user account if needed
   */
  async acceptInvitation(
    token: string
  ): Promise<IClientUserInvitationAccepted> {
    try {
      logger.info({
        message: 'Accepting client user invitation',
        context: 'ClientUserInvitationService.acceptInvitation',
        token,
      });
      // Find the invitation by token
      const invitation = await this.prisma.client_user_invitation.findFirst({
        where: {
          token,
          status: ClientUserInvitationStatusEnum.PENDING,
        },
        include: {
          client: {
            include: {
              company: true,
            },
          },
        },
      });

      logger.info({
        message: 'Invitation',
        context: 'ClientUserInvitationService.acceptInvitation',
        invitation,
      });

      if (!invitation) {
        throw new AppError(
          'Invitation not found or already processed',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Check if invitation has expired
      if (new Date() > invitation.expiresAt) {
        // Update invitation status to expired
        await this.prisma.client_user_invitation.update({
          where: { id: invitation.id },
          data: {
            status: ClientUserInvitationStatusEnum.EXPIRED,
          },
        });

        throw new AppError(
          'Invitation has expired',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      // Check if there are available seats before accepting
      // We need to check this separately from the sendInvitation method because
      // the subscription status might have changed since the invitation was sent
      const seatsCheck = await this.subscriptionLimitsService.checkSeatsLimit(
        invitation.clientId
      );
      if (!seatsCheck.canAdd) {
        throw new AppError(
          seatsCheck.errorMessage ||
            'No available seats in the current subscription',
          400,
          ErrorCode.SUBSCRIPTION_LIMIT_REACHED
        );
      }

      // Check if user already exists
      let user = await this.prisma.user.findUnique({
        where: { email: invitation.email },
      });

      // Begin transaction
      const result = await this.prisma.$transaction(async (prisma) => {
        if (!user) {
          // Create user with a generated password
          const hashedPassword = await hashPassword(generatePassword());

          user = await prisma.user.create({
            data: {
              email: invitation.email,
              name: invitation.name,
              password: hashedPassword,
              type: UserTypeEnum.CLIENT,
              role: invitation.role,
              status: UserStatusEnum.ACTIVE,
              jobTitle: invitation.jobTitle,
              emailVerified: new Date(),
            },
          });
        }
        // If user exists but is not a client, update type/role
        else if (user.type !== UserTypeEnum.CLIENT) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              type: UserTypeEnum.CLIENT,
              role: invitation.role,
              jobTitle: invitation.jobTitle || user.jobTitle,
              emailVerified: new Date(), // Mark as verified in database too
            },
          });
        }
        // If user exists and is already a client, ensure email is verified
        else {
          // Update database verification if not already verified
          if (!user.emailVerified) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                emailVerified: new Date(),
              },
            });
          }
        }

        // Check for existing client user association
        let clientUser = await prisma.client_user.findFirst({
          where: {
            userId: user.id,
            clientId: invitation.clientId,
          },
        });

        // If no association exists, create one and update the seat usage
        if (!clientUser) {
          clientUser = await prisma.client_user.create({
            data: {
              userId: user.id,
              clientId: invitation.clientId,
            },
          });

          // Create default settings for the client user
          const newSettings =
            await this.clientUserProfileService.getClientUserDefaultSettings(
              clientUser.id
            );
          await prisma.client_user_settings.create({
            data: {
              globalSettingsId: newSettings.globalSettingsId,
              clientUserId: clientUser.id,
              notificationsEnabled: newSettings.notificationsEnabled,
              emailNotifications: newSettings.emailNotifications,
              pushNotifications: newSettings.pushNotifications,
              darkMode: newSettings.darkMode,
              language: newSettings.language,
              timezone: newSettings.timezone,
              preferredCommunicationChannel:
                newSettings.preferredCommunicationChannel,
            },
          });

          // Update subscription used seats count using the subscription limits service
          await this.subscriptionLimitsService.incrementSeatsUsage(
            invitation.clientId
          );
        }

        // Update invitation status
        await prisma.client_user_invitation.update({
          where: { id: invitation.id },
          data: {
            status: ClientUserInvitationStatusEnum.ACCEPTED,
            acceptedAt: new Date(),
            clientUserId: clientUser.id,
          },
        });

        // Generate auth token - fetch user with all relations
        const userWithRelations = await prisma.user.findUnique({
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
        const authUser = toIAuthUser(userWithRelations);
        const authToken = getAuthToken(authUser);

        return {
          user: authUser,
          authToken,
        };
      });

      // Send acceptance notification to client admins (like partner flow does)
      try {
        // Find client admins or users who can invite others
        const clientAdmins = await this.prisma.client_user.findMany({
          where: {
            clientId: invitation.clientId,
            user: {
              OR: [
                { role: UserRoleEnum.ADMIN },
                { role: UserRoleEnum.HR },
                { role: UserRoleEnum.RECRUITER },
              ],
            },
          },
          include: {
            user: true,
          },
          take: 3, // Limit to first 3 admins to avoid spam
        });

        // If no specific admins found, get the oldest client user (likely the owner)
        if (clientAdmins.length === 0) {
          const oldestClientUser = await this.prisma.client_user.findFirst({
            where: {
              clientId: invitation.clientId,
            },
            include: {
              user: true,
            },
            orderBy: {
              createdAt: 'asc',
            },
          });

          if (oldestClientUser) {
            clientAdmins.push(oldestClientUser);
          }
        }

        // Send acceptance notification to relevant client users
        for (const clientAdmin of clientAdmins) {
          if (clientAdmin.user.email !== invitation.email && user) {
            // Don't notify the person who just accepted
            await this.notificationProvider.sendClientInvitationAcceptedEmail(
              clientAdmin.user.email,
              clientAdmin.user.name,
              user.name,
              invitation.client.company.name,
              invitation.role
            );
          }
        }
      } catch (notificationError) {
        // Log notification errors but don't fail the invitation acceptance
        logger.error({
          message: 'Failed to send client invitation acceptance notification',
          context: 'ClientUserInvitationService.acceptInvitation',
          error:
            notificationError instanceof Error
              ? notificationError.message
              : 'Unknown error',
          invitationId: invitation.id,
        });
      }

      return result;
    } catch (error) {
      logger.error({
        message: 'Failed to accept client user invitation',
        context: 'ClientUserInvitationService.acceptInvitation',
        error: error instanceof Error ? error.message : 'Unknown error',
        token: token.substring(0, 8) + '...', // Log partial token for debugging
      });
      throw error;
    }
  }

  /**
   * List all invitations for a client with optional filtering
   */
  async listInvitations(
    clientId: string,
    _userId: string,
    filter: IClientUserInvitationFilterQuery,
    paginationRequest: IPaginationRequest
  ): Promise<IPaginatedResponse<IClientUserInvitation>> {
    try {
      logger.info({
        message: 'Listing client user invitations',
        context: 'ClientUserInvitationService.listInvitations',
        clientId,
        filter,
        paginationRequest,
      });

      const queryConditions = buildQueryConditions(filter, paginationRequest, {
        search: this.searchConfig,
        filter: this.filterConfig,
        sort: this.sortConfig,
      });

      const baseWhere = {
        clientId,
        status: {
          not: ClientUserInvitationStatusEnum.ACCEPTED,
        },
      };

      const total = await this.prisma.client_user_invitation.count({
        where: {
          ...baseWhere,
          ...queryConditions.where,
        },
      });

      const invitations = await this.prisma.client_user_invitation.findMany({
        where: {
          ...baseWhere,
          ...queryConditions.where,
        },
        skip: queryConditions.skip,
        take: queryConditions.take,
        orderBy: queryConditions.orderBy,
      });

      // Remove sensitive data from invitations
      const filteredInvitations = invitations.map((invitation) => {
        const { token, expiresAt, ...rest } = invitation;
        return rest;
      });

      return {
        items: filteredInvitations as IClientUserInvitation[],
        pagination: {
          total,
          page: queryConditions.pagination.page,
          limit: queryConditions.pagination.limit,
          totalPages: Math.ceil(total / queryConditions.pagination.limit),
        },
      };
    } catch (error) {
      logger.error({
        message: 'Failed to list client user invitations',
        context: 'ClientUserInvitationService.listInvitations',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        clientId,
        filter,
        paginationRequest,
      });
      throw error;
    }
  }
}
