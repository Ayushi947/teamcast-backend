import { singleton } from '@/shared/decorators/singleton';
import { PrismaClient } from '@prisma/client';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';
import { ENV } from '@/config/env';
import {
  generateInvitationToken,
  verifyInvitationToken,
  IInvitationTokenPayload,
} from '@/utils/invitation.token';
import { InvitationTokenPurposeEnum } from '@/shared/models/common/enums';
import {
  ISupportInvitation,
  ISupportInvitationAccepted,
  ISupportInvitationFilterQuery,
  ISupportInvitationSend,
  ISupportInvitationListResponse,
  toISupportInvitation,
} from '@/shared/models/domain/support/invitation.domain';
import {
  UserStatusEnum,
  SupportInvitationStatusEnum,
  SupportInvitationImportStatusEnum,
  SupportInvitationTypeEnum,
  UserTypeEnum,
  UserRoleEnum,
  CandidateStatusEnum,
  JobSearchStatusEnum,
  CompanyTypeEnum,
  CompanyIndustryEnum,
  CompanySizeEnum,
  CompanyStageEnum,
  SupportDepartmentEnum,
  SupportLevelEnum,
} from '@/shared/models/common/enums';
import { INotificationProvider } from '@/services/notification/notification.interface';
import { getAuthToken } from '@/utils/generate.token';
import { toIAuthUser } from '@/shared/models/domain/auth/auth.user.domain';
import { IPaginationRequest } from '@/shared/models/api/common/common.api';
import {
  buildQueryConditions,
  ISearchConfig,
  IFilterConfig,
  ISortConfig,
} from '@/utils/pagination';
import { NotificationFactory } from '@/services/notification/notification.factory';
import { CandidateSignupService } from '@/services/candidate/signup.service';
import { CandidateSubscriptionService } from '@/services/candidate/subscription.service';
import { CandidateProfileSettingsService } from '@/services/candidate/profile.settings.service';
import { CandidateResumeService } from '@/services/candidate/resume.service';
import { StorageFactory } from '@/services/helpers/storage/storage.factory';
import { CandidateProfileService } from '@/services/candidate/profile.service';
import { PaymentFactory } from '@/services/subscription/payment.factory';
import { generatePassword, hashPassword } from '@/utils/password';
import { ClientSubscriptionService } from '@/services/client/subscription.service';
import { ClientProfileService } from '@/services/client/profile.service';
import { NodemailerProvider } from '@/services/notification/nodemailer.service';
import { AccountManagerAssignmentService } from '@/services/support/account.manager.assignment.service';
import { VerifyService } from '@/services/auth/verify.service';
import { formatEmail, formatName } from '@/shared/utils/formatters';
import { v4 as uuidv4 } from 'uuid';

@singleton
export class SupportInvitationService {
  private readonly prisma: PrismaClient;
  private readonly invitationExpiryHours = 72; // 3 days for email invitations
  private readonly invitationExpiryMinutes = 30; // 30 minutes for copied invitations
  private readonly notificationProvider: INotificationProvider;
  private readonly candidateSignupService: CandidateSignupService;
  private readonly candidateProfileSettingsService: CandidateProfileSettingsService;
  private readonly candidateSubscriptionService: CandidateSubscriptionService;
  private readonly candidateResumeService: CandidateResumeService;
  private readonly clientSubscriptionService: ClientSubscriptionService;
  private readonly clientProfileService: ClientProfileService;
  private readonly accountManagerAssignmentService: AccountManagerAssignmentService;

  private readonly searchConfig: ISearchConfig = {
    searchableFields: ['email', 'name', 'jobTitle'],
  };

  private readonly filterConfig: IFilterConfig = {
    allowedFields: [
      'email',
      'name',
      'jobTitle',
      'status',
      'type',
      'isCampaign',
    ],
    arrayFields: [],
    enumFields: ['status', 'type'],
    enumRelationFields: {},
    booleanFields: ['isCampaign'],
  };

  private readonly sortConfig: ISortConfig = {
    allowedFields: [
      'email',
      'name',
      'jobTitle',
      'status',
      'type',
      'isCampaign',
      'createdAt',
      'updatedAt',
    ],
    defaultSort: { field: 'createdAt', order: 'desc' },
  };

  constructor() {
    this.prisma = new PrismaClient();
    this.notificationProvider =
      new NotificationFactory().getNotificationProvider();

    const storageService = StorageFactory.getInstance().getProvider();
    const paymentFactory = new PaymentFactory();
    const nodemailerProvider = new NodemailerProvider();
    const profileService = new CandidateProfileService(storageService);

    this.candidateSubscriptionService = new CandidateSubscriptionService(
      paymentFactory
    );
    this.candidateProfileSettingsService =
      new CandidateProfileSettingsService();
    this.candidateResumeService = new CandidateResumeService(
      profileService,
      storageService
    );

    const verifyService = new VerifyService(this.notificationProvider);

    this.candidateSignupService = new CandidateSignupService(
      this.notificationProvider,
      this.candidateSubscriptionService,
      this.candidateProfileSettingsService,
      this.candidateResumeService,
      verifyService
    );

    this.clientSubscriptionService = new ClientSubscriptionService(
      paymentFactory,
      nodemailerProvider
    );
    this.clientProfileService = new ClientProfileService();
    this.accountManagerAssignmentService =
      new AccountManagerAssignmentService();
  }

  /**
   * Generate invitation URL for a given token and type
   */
  private generateInvitationUrl(
    token: string,
    type: SupportInvitationTypeEnum
  ): string {
    return `${ENV.FRONTEND_URL}/app/support/invitation/accept/${token}?type=${type.toLowerCase()}`;
  }

  /**
   * Send invitation to join the platform
   */
  async sendInvitation(
    inviterUserId: string,
    invitationData: ISupportInvitationSend
  ): Promise<ISupportInvitation> {
    try {
      const inviteUser = await this.prisma.user.findUnique({
        where: { email: invitationData.email },
      });

      if (inviteUser) {
        throw new AppError(
          `User ${invitationData.email} already exists`,
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      // Get inviter details and support user record
      const inviter = await this.prisma.user.findUnique({
        where: { id: inviterUserId },
        include: {
          supportUser: true,
        },
      });

      if (!inviter) {
        throw new AppError('Inviter not found', 404, ErrorCode.NOT_FOUND);
      }

      if (!inviter.supportUser) {
        throw new AppError(
          'Inviter is not a support user',
          403,
          ErrorCode.FORBIDDEN
        );
      }

      // Check if email is already registered
      const existingUser = await this.prisma.user.findUnique({
        where: { email: invitationData.email },
      });

      if (existingUser) {
        throw new AppError(
          'User with this email already exists in the system',
          400,
          ErrorCode.ALREADY_EXISTS
        );
      }

      // Check if an active invitation already exists for this email
      const existingInvitation = await this.prisma.support_invitation.findFirst(
        {
          where: {
            email: invitationData.email,
            status: SupportInvitationStatusEnum.PENDING,
          },
        }
      );

      if (existingInvitation) {
        const typeName = this.getInvitationTypeName(
          existingInvitation.type as SupportInvitationTypeEnum
        );
        throw new AppError(
          `A ${typeName.toLowerCase()} invitation has already been sent to this email address. Please wait for the user to accept or withdraw the existing invitation before sending a new one.`,
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      // Also check for any invitation (including expired ones) to prevent spam
      const anyExistingInvitation =
        await this.prisma.support_invitation.findFirst({
          where: {
            email: invitationData.email,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

      if (
        anyExistingInvitation &&
        anyExistingInvitation.status === SupportInvitationStatusEnum.ACCEPTED
      ) {
        throw new AppError(
          'This email address has already been used to accept an invitation. Please use a different email address.',
          400,
          ErrorCode.ALREADY_EXISTS
        );
      }

      // Check if there's a recent expired invitation (within last 24 hours) to prevent spam
      if (
        anyExistingInvitation &&
        anyExistingInvitation.status === SupportInvitationStatusEnum.PENDING
      ) {
        const invitationAge =
          Date.now() - anyExistingInvitation.createdAt.getTime();
        const oneDayInMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

        if (invitationAge < oneDayInMs) {
          const typeName = this.getInvitationTypeName(
            anyExistingInvitation.type as SupportInvitationTypeEnum
          );
          throw new AppError(
            `A ${typeName.toLowerCase()} invitation was recently sent to this email address. Please wait at least 24 hours before sending another invitation to the same email.`,
            400,
            ErrorCode.INVALID_REQUEST
          );
        }
      }

      // Generate a temporary UUID token
      const tempToken = uuidv4();

      // Create invitation with temporary token and proper expiry
      const invitation = await this.prisma.support_invitation.create({
        data: {
          email: formatEmail(invitationData.email),
          name: formatName(invitationData.name),
          jobTitle: invitationData.jobTitle,
          type: invitationData.type,
          token: tempToken, // Use temporary token to avoid unique constraint issues
          expiresAt: new Date(
            Date.now() + this.invitationExpiryHours * 60 * 60 * 1000
          ), // 72 hours
          status: SupportInvitationStatusEnum.PENDING,
          clientId: invitationData.clientId,
          partnerId: invitationData.partnerId,
          companyName: invitationData.companyName,
          specialization: invitationData.specialization,
          role: invitationData.role,
          department: invitationData.department,
          supportLevel: invitationData.supportLevel,
          accountManagerId: invitationData.accountManagerId,
          isCampaign: invitationData.isCampaign || false,
          createdById: inviter.supportUser.id,
        },
      });

      // Generate JWT token for email invitation using the actual invitation ID
      const jwtToken = generateInvitationToken(
        invitationData.email,
        invitation.id,
        invitationData.type,
        InvitationTokenPurposeEnum.EMAIL
      );

      // Update invitation with JWT token (keep the same expiry time)
      const updatedInvitation = await this.prisma.support_invitation.update({
        where: { id: invitation.id },
        data: {
          token: jwtToken,
        },
      });

      // Generate invitation URL with type parameter
      const invitationUrl = this.generateInvitationUrl(
        jwtToken,
        invitationData.type
      );

      // Log the invitation URL for manual testing
      logger.info({
        message: 'Support invitation created successfully',
        context: 'SupportInvitationService.sendInvitation',
        invitationId: updatedInvitation.id,
        email: invitationData.email,
        name: invitationData.name,
        type: invitationData.type,
        invitationUrl: invitationUrl,
        token: jwtToken.substring(0, 8) + '...', // Log partial token for security
        expiresAt: updatedInvitation.expiresAt,
      });

      // Send email notification based on invitation type
      try {
        await this.sendInvitationEmail(
          invitationData,
          inviter.name,
          invitationUrl
        );
        logger.info({
          message: 'Support invitation email sent successfully',
          context: 'SupportInvitationService.sendInvitation',
          email: invitationData.email,
          type: invitationData.type,
        });
      } catch (emailError) {
        logger.warn({
          message:
            'Failed to send support invitation email, but invitation was created',
          context: 'SupportInvitationService.sendInvitation',
          error:
            emailError instanceof Error ? emailError.message : 'Unknown error',
          email: invitationData.email,
          type: invitationData.type,
          invitationUrl: invitationUrl, // Log URL again in case email fails
        });
        // Don't throw the error - invitation was created successfully
      }

      const invitationWithUrl = toISupportInvitation(updatedInvitation);
      invitationWithUrl.invitationUrl = this.generateInvitationUrl(
        jwtToken,
        invitationData.type
      );
      return invitationWithUrl;
    } catch (error) {
      logger.error({
        message: 'Failed to send support invitation',
        context: 'SupportInvitationService.sendInvitation',
        error: error instanceof Error ? error.message : 'Unknown error',
        invitationData: {
          email: invitationData.email,
          type: invitationData.type,
        },
      });
      throw error;
    }
  }

  /**
   * Get an invitation by ID
   */
  async getInvitation(invitationId: string): Promise<ISupportInvitation> {
    try {
      const invitation = await this.prisma.support_invitation.findUnique({
        where: { id: invitationId },
      });
      if (!invitation) {
        throw new AppError('Invitation not found', 404, ErrorCode.NOT_FOUND);
      }
      const invitationWithUrl = toISupportInvitation(invitation);
      invitationWithUrl.invitationUrl = this.generateInvitationUrl(
        invitation.token,
        invitation.type as SupportInvitationTypeEnum
      );
      return invitationWithUrl;
    } catch (error) {
      logger.error({
        message: 'Failed to get support invitation',
        context: 'SupportInvitationService.getInvitation',
        error: error instanceof Error ? error.message : 'Unknown error',
        invitationId,
      });
      throw error;
    }
  }

  /**
   * Withdraw an invitation
   */
  async withdrawInvitation(
    inviterUserId: string,
    invitationId: string
  ): Promise<ISupportInvitation> {
    try {
      // Verify the invitation is in pending or resend state
      const invitation = await this.prisma.support_invitation.findFirst({
        where: {
          id: invitationId,
          status: {
            in: [
              SupportInvitationStatusEnum.PENDING,
              SupportInvitationStatusEnum.RESEND,
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

      // Get inviter details
      const inviter = await this.prisma.user.findUnique({
        where: { id: inviterUserId },
      });

      if (!inviter) {
        throw new AppError('Inviter not found', 404, ErrorCode.NOT_FOUND);
      }

      // Update invitation status
      const updatedInvitation = await this.prisma.support_invitation.update({
        where: { id: invitationId },
        data: {
          status: SupportInvitationStatusEnum.WITHDRAWN,
        },
      });

      // Send withdrawal notification
      await this.sendWithdrawalEmail(invitation, inviter.name);

      const invitationWithUrl = toISupportInvitation(updatedInvitation);
      invitationWithUrl.invitationUrl = this.generateInvitationUrl(
        updatedInvitation.token,
        updatedInvitation.type as SupportInvitationTypeEnum
      );
      return invitationWithUrl;
    } catch (error) {
      logger.error('Error withdrawing support invitation', {
        error,
        invitationId,
      });
      throw error;
    }
  }

  /**
   * Resend an invitation
   */
  async resendInvitation(
    inviterUserId: string,
    invitationId: string
  ): Promise<ISupportInvitation> {
    try {
      // Get inviter details
      const inviter = await this.prisma.user.findUnique({
        where: { id: inviterUserId },
      });

      if (!inviter) {
        throw new AppError('Inviter not found', 404, ErrorCode.NOT_FOUND);
      }

      // Verify the invitation is in pending, withdrawn, or expired state
      const invitation = await this.prisma.support_invitation.findFirst({
        where: {
          id: invitationId,
          status: {
            in: [
              SupportInvitationStatusEnum.PENDING,
              SupportInvitationStatusEnum.WITHDRAWN,
              SupportInvitationStatusEnum.EXPIRED,
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

      // Generate new JWT token for resend (email purpose)
      const token = generateInvitationToken(
        invitation.email,
        invitation.id,
        invitation.type as SupportInvitationTypeEnum,
        InvitationTokenPurposeEnum.EMAIL
      );

      // Update invitation with new JWT token and expiry
      const updatedInvitation = await this.prisma.support_invitation.update({
        where: { id: invitationId },
        data: {
          token,
          expiresAt: new Date(
            Date.now() + this.invitationExpiryHours * 60 * 60 * 1000
          ), // 72 hours
          status: SupportInvitationStatusEnum.RESEND,
        },
      });

      // Generate invitation URL
      const invitationUrl = `${ENV.FRONTEND_URL}/app/support/invitation/accept/${token}?type=${invitation.type.toLowerCase()}`;

      // Log the resend invitation URL for manual testing
      logger.info({
        message: 'Support invitation resent successfully',
        context: 'SupportInvitationService.resendInvitation',
        invitationId: invitationId,
        email: invitation.email,
        name: invitation.name,
        type: invitation.type,
        invitationUrl: invitationUrl,
        token: token.substring(0, 8) + '...', // Log partial token for security
        expiresAt: updatedInvitation.expiresAt,
      });

      // Send email notification
      try {
        await this.sendInvitationEmail(
          {
            email: invitation.email,
            name: invitation.name,
            jobTitle: invitation.jobTitle || undefined,
            type: invitation.type as SupportInvitationTypeEnum,
            clientId: invitation.clientId || undefined,
            partnerId: invitation.partnerId || undefined,
            companyName: invitation.companyName || undefined,
            specialization: invitation.specialization || undefined,
            role: (invitation.role as UserRoleEnum) || undefined,
            department:
              (invitation.department as SupportDepartmentEnum) || undefined,
            supportLevel:
              (invitation.supportLevel as SupportLevelEnum) || undefined,
            accountManagerId: invitation.accountManagerId || undefined,
            isCampaign: invitation.isCampaign || false,
          },
          inviter.name,
          invitationUrl
        );
        logger.info({
          message: 'Support invitation resend email sent successfully',
          context: 'SupportInvitationService.resendInvitation',
          email: invitation.email,
          type: invitation.type,
        });
      } catch (emailError) {
        logger.warn({
          message:
            'Failed to send support invitation resend email, but invitation was updated',
          context: 'SupportInvitationService.resendInvitation',
          error:
            emailError instanceof Error ? emailError.message : 'Unknown error',
          email: invitation.email,
          type: invitation.type,
          invitationUrl: invitationUrl, // Log URL again in case email fails
        });
        // Don't throw the error - invitation was updated successfully
      }

      // Return the invitation using consistent data transformation
      const invitationWithUrl = toISupportInvitation(updatedInvitation);
      invitationWithUrl.invitationUrl = this.generateInvitationUrl(
        updatedInvitation.token,
        updatedInvitation.type as SupportInvitationTypeEnum
      );
      return invitationWithUrl;
    } catch (error) {
      logger.error({
        message: 'Failed to resend support invitation',
        context: 'SupportInvitationService.resendInvitation',
        error: error instanceof Error ? error.message : 'Unknown error',
        invitationId,
      });
      throw error;
    }
  }

  /**
   * Generic expire invitation method that automatically checks and expires all invitations that have actually expired
   */
  async expireGenericInvitation(
    inviterUserId: string,
    invitationType: 'support' | 'job-posting'
  ): Promise<{
    totalChecked: number;
    totalExpired: number;
    alreadyExpired: number;
    notYetExpired: number;
    message: string;
    details: Array<{
      id: string;
      status: string;
      email: string;
      message: string;
    }>;
  }> {
    try {
      const now = new Date();
      let totalChecked = 0;
      let totalExpired = 0;
      const alreadyExpired = 0;
      let notYetExpired = 0;
      const details: Array<{
        id: string;
        status: string;
        email: string;
        message: string;
      }> = [];

      if (invitationType === 'support') {
        // Find all support invitations that are not already expired or accepted
        const invitations = await this.prisma.support_invitation.findMany({
          where: {
            status: {
              in: [
                SupportInvitationStatusEnum.PENDING,
                SupportInvitationStatusEnum.RESEND,
              ],
            },
          },
          select: {
            id: true,
            email: true,
            name: true,
            status: true,
            expiresAt: true,
          },
        });

        totalChecked = invitations.length;

        for (const invitation of invitations) {
          // Check if invitation has actually expired based on expiresAt
          if (invitation.expiresAt <= now) {
            // Expire the invitation
            const updatedInvitation =
              await this.prisma.support_invitation.update({
                where: { id: invitation.id },
                data: {
                  status: SupportInvitationStatusEnum.EXPIRED,
                },
              });

            totalExpired++;
            details.push({
              id: invitation.id,
              status: updatedInvitation.status,
              email: invitation.email,
              message:
                'Support invitation expired successfully (was past expiry date)',
            });

            logger.info({
              message:
                'Support invitation automatically expired due to expiry date',
              context: 'SupportInvitationService.expireGenericInvitation',
              invitationId: invitation.id,
              email: invitation.email,
              name: invitation.name,
              expiredBy: inviterUserId,
              originalExpiryDate: invitation.expiresAt,
            });
          } else {
            notYetExpired++;
            details.push({
              id: invitation.id,
              status: invitation.status,
              email: invitation.email,
              message: 'Invitation has not expired yet',
            });
          }
        }
      } else if (invitationType === 'job-posting') {
        // Find all job posting invitations that are not already expired or accepted
        const invitations = await this.prisma.job_invite.findMany({
          where: {
            status: {
              in: ['PENDING'],
            },
          },
          select: {
            id: true,
            email: true,
            name: true,
            status: true,
            expiresAt: true,
          },
        });

        totalChecked = invitations.length;

        for (const invitation of invitations) {
          // Check if invitation has actually expired based on expiresAt
          if (invitation.expiresAt <= now) {
            // Expire the invitation
            const updatedInvitation = await this.prisma.job_invite.update({
              where: { id: invitation.id },
              data: {
                status: 'EXPIRED',
              },
            });

            totalExpired++;
            details.push({
              id: invitation.id,
              status: updatedInvitation.status,
              email: invitation.email,
              message:
                'Job posting invitation expired successfully (was past expiry date)',
            });

            logger.info({
              message:
                'Job posting invitation automatically expired due to expiry date',
              context: 'SupportInvitationService.expireGenericInvitation',
              invitationId: invitation.id,
              email: invitation.email,
              name: invitation.name,
              expiredBy: inviterUserId,
              originalExpiryDate: invitation.expiresAt,
            });
          } else {
            notYetExpired++;
            details.push({
              id: invitation.id,
              status: invitation.status,
              email: invitation.email,
              message: 'Invitation has not expired yet',
            });
          }
        }
      } else {
        throw new AppError(
          'Invalid invitation type. Must be "support" or "job-posting"',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      const message = `Processed ${totalChecked} ${invitationType} invitations. ${totalExpired} expired, ${notYetExpired} not yet expired.`;

      return {
        totalChecked,
        totalExpired,
        alreadyExpired,
        notYetExpired,
        message,
        details,
      };
    } catch (error) {
      logger.error('Error expiring generic invitations', {
        error,
        invitationType,
        inviterUserId,
      });
      throw error;
    }
  }

  /**
   * Accept an invitation and create a user account if needed
   */
  async acceptInvitation(token: string): Promise<ISupportInvitationAccepted> {
    try {
      logger.info('Accepting support invitation', {
        message: 'Accepting support invitation',
        context: 'SupportInvitationService.acceptInvitation',
        token: token.substring(0, 8) + '...',
      });

      // Verify JWT token first (this will check expiry and validity)
      let tokenPayload: IInvitationTokenPayload;
      try {
        tokenPayload = verifyInvitationToken(token);
      } catch (tokenError) {
        logger.error({
          message: 'JWT token verification failed',
          context: 'SupportInvitationService.acceptInvitation',
          error:
            tokenError instanceof Error ? tokenError.message : 'Unknown error',
          token: token.substring(0, 8) + '...',
        });
        throw new AppError(
          tokenError instanceof Error
            ? tokenError.message
            : 'Invalid invitation token',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      // Find invitation by ID from token payload
      const invitation = await this.prisma.support_invitation.findUnique({
        where: { id: tokenPayload.invitationId },
      });

      if (!invitation) {
        throw new AppError('Invitation not found', 404, ErrorCode.NOT_FOUND);
      }

      // Verify email matches
      if (invitation.email !== tokenPayload.email) {
        throw new AppError(
          'Invitation email mismatch',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      logger.info('Invitation found and verified', {
        message: 'Invitation found and verified',
        context: 'SupportInvitationService.acceptInvitation',
        invitationId: invitation.id,
        email: invitation.email,
        type: invitation.type,
        purpose: tokenPayload.purpose,
      });

      // Check if invitation is already accepted
      if (invitation.status === SupportInvitationStatusEnum.ACCEPTED) {
        throw new AppError(
          'Invitation has already been accepted',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      // Check if invitation has been withdrawn
      if (invitation.status === SupportInvitationStatusEnum.WITHDRAWN) {
        throw new AppError(
          'Invitation has been withdrawn',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      // Begin transaction
      return await this.prisma.$transaction(async (prisma) => {
        // Handle invitation acceptance based on type
        switch (invitation.type) {
          case SupportInvitationTypeEnum.CANDIDATE:
            return await this.handleCandidateInvitation(prisma, invitation);
          case SupportInvitationTypeEnum.CLIENT:
            return await this.handleClientInvitation(prisma, invitation);
          case SupportInvitationTypeEnum.PARTNER:
            return await this.handlePartnerInvitation(prisma, invitation);
          case SupportInvitationTypeEnum.SUPPORT_USER:
            return await this.handleSupportUserInvitation(prisma, invitation);
          default:
            throw new AppError(
              'Invalid invitation type',
              400,
              ErrorCode.INVALID_REQUEST
            );
        }
      });
    } catch (error) {
      logger.error('Failed to accept support invitation', {
        message: 'Failed to accept support invitation',
        context: 'SupportInvitationService.acceptInvitation',
        error: error instanceof Error ? error.message : 'Unknown error',
        token: token.substring(0, 8) + '...',
      });
      throw error;
    }
  }

  /**
   * List all invitations with optional filtering
   */
  async listInvitations(
    supportUserId: string,
    filter: ISupportInvitationFilterQuery,
    paginationRequest: IPaginationRequest
  ): Promise<ISupportInvitationListResponse> {
    try {
      logger.info({
        message: 'Listing support invitations',
        context: 'SupportInvitationService.listInvitations',
        filter,
        paginationRequest,
      });

      // Extract search from filter if it exists and add to paginationRequest
      const { search, ...otherFilters } = filter as any;
      const paginationWithSearch = {
        ...paginationRequest,
        ...(search && { search: search as string }),
      };

      // Build query conditions using the generic pagination utilities
      const queryConditions = buildQueryConditions(
        otherFilters,
        paginationWithSearch,
        {
          search: this.searchConfig,
          filter: this.filterConfig,
          sort: this.sortConfig,
        },
        supportUserId
      );

      const whereConditions: any = {
        ...queryConditions.where,
        AND: [
          ...(queryConditions.where?.AND || []),
          { status: { not: SupportInvitationStatusEnum.ACCEPTED } },
          // Exclude campaign invitations (isCampaign = true)
          { isCampaign: false },
          ...(queryConditions.where?.status
            ? [{ status: queryConditions.where.status }]
            : []),
        ],
      };

      if (whereConditions.status) {
        delete whereConditions.status;
      }

      let finalWhereConditions: any = whereConditions;
      if (search && typeof search === 'string' && search.trim()) {
        const searchTerm = search.trim();

        const matchingSupportUsers = await this.prisma.support_user.findMany({
          where: {
            user: {
              name: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
          },
          select: { id: true },
        });

        const matchingCreatorIds = matchingSupportUsers.map((su) => su.id);

        finalWhereConditions = {
          ...whereConditions,
          OR: [
            ...(queryConditions.where?.OR || []),
            {
              createdById: {
                in: matchingCreatorIds,
              },
            },
          ],
        };
      }

      const total = await this.prisma.support_invitation.count({
        where: finalWhereConditions,
      });

      // Get paginated results with invited by information
      const invitations = await this.prisma.support_invitation.findMany({
        where: finalWhereConditions,
        skip: queryConditions.skip,
        take: queryConditions.take,
        orderBy: queryConditions.orderBy,
        include: {
          createdBy: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      // Remove sensitive data from invitations and add invitation URLs
      const filteredInvitations = invitations.map((invitation) => {
        const { token, expiresAt, createdBy, ...rest } = invitation;
        const invitationWithUrl = rest as ISupportInvitation;
        invitationWithUrl.invitationUrl = this.generateInvitationUrl(
          token,
          invitation.type as SupportInvitationTypeEnum
        );
        invitationWithUrl.invitedBy = createdBy?.user?.name || 'Unknown';
        return invitationWithUrl;
      });

      return {
        items: filteredInvitations,
        pagination: {
          total,
          page: queryConditions.pagination.page,
          limit: queryConditions.pagination.limit,
          totalPages: Math.ceil(total / queryConditions.pagination.limit),
        },
      };
    } catch (error) {
      logger.error({
        message: 'Failed to list support invitations',
        context: 'SupportInvitationService.listInvitations',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        filter,
        paginationRequest,
      });
      throw error;
    }
  }

  /**
   * List all invitations with optional filtering (including ACCEPTED status, excluding campaigns)
   */
  async listAllInvitations(
    supportUserId: string,
    filter: ISupportInvitationFilterQuery,
    paginationRequest: IPaginationRequest
  ): Promise<ISupportInvitationListResponse> {
    try {
      logger.info({
        message:
          'Listing all support invitations (including accepted, excluding campaigns)',
        context: 'SupportInvitationService.listAllInvitations',
        filter,
        paginationRequest,
      });

      // Extract search from filter if it exists and add to paginationRequest
      const { search, ...otherFilters } = filter as any;
      const paginationWithSearch = {
        ...paginationRequest,
        ...(search && { search: search as string }),
      };

      // Build query conditions using the generic pagination utilities
      const queryConditions = buildQueryConditions(
        otherFilters,
        paginationWithSearch,
        {
          search: this.searchConfig,
          filter: this.filterConfig,
          sort: this.sortConfig,
        },
        supportUserId
      );

      const whereConditions: any = {
        ...queryConditions.where,
        AND: [
          ...(queryConditions.where?.AND || []),
          ...(queryConditions.where?.status
            ? [{ status: queryConditions.where.status }]
            : []),
        ],
      };

      if (whereConditions.status) {
        delete whereConditions.status;
      }

      let finalWhereConditions: any = whereConditions;
      if (search && typeof search === 'string' && search.trim()) {
        const searchTerm = search.trim();

        const matchingSupportUsers = await this.prisma.support_user.findMany({
          where: {
            user: {
              name: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
          },
          select: { id: true },
        });

        const matchingCreatorIds = matchingSupportUsers.map((su) => su.id);

        finalWhereConditions = {
          ...whereConditions,
          OR: [
            ...(queryConditions.where?.OR || []),
            {
              createdById: {
                in: matchingCreatorIds,
              },
            },
          ],
        };
      }

      const total = await this.prisma.support_invitation.count({
        where: finalWhereConditions,
      });

      // Get paginated results with invited by information
      const invitations = await this.prisma.support_invitation.findMany({
        where: finalWhereConditions,
        skip: queryConditions.skip,
        take: queryConditions.take,
        orderBy: queryConditions.orderBy,
        include: {
          createdBy: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      // Remove sensitive data from invitations and add invitation URLs
      const filteredInvitations = invitations.map((invitation) => {
        const { token, expiresAt, createdBy, ...rest } = invitation;
        const invitationWithUrl = rest as ISupportInvitation;
        invitationWithUrl.invitationUrl = this.generateInvitationUrl(
          token,
          invitation.type as SupportInvitationTypeEnum
        );
        invitationWithUrl.invitedBy = createdBy?.user?.name || 'Unknown';
        return invitationWithUrl;
      });

      return {
        items: filteredInvitations,
        pagination: {
          total,
          page: queryConditions.pagination.page,
          limit: queryConditions.pagination.limit,
          totalPages: Math.ceil(total / queryConditions.pagination.limit),
        },
      };
    } catch (error) {
      logger.error({
        message: 'Failed to list all support invitations',
        context: 'SupportInvitationService.listAllInvitations',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        filter,
        paginationRequest,
      });
      throw error;
    }
  }

  /**
   * Handle client invitation acceptance
   */
  private async handleClientInvitation(
    _prisma: any,
    invitation: any
  ): Promise<ISupportInvitationAccepted> {
    // Use a single transaction for all client creation operations

    const result = await this.prisma.$transaction(async (tx: any) => {
      // Create company
      const company = await tx.company.create({
        data: {
          name: invitation.companyName || 'Client Company',
          contactEmail: invitation.email,
          description: `Company profile for ${invitation.companyName || 'Client Company'}`,
          companyType: CompanyTypeEnum.ENTERPRISE, // Default value, can be updated by client later
          industry: CompanyIndustryEnum.TECHNOLOGY, // Default value, can be updated by client later
          size: CompanySizeEnum.ONE_TO_TEN, // Default value, can be updated by client later
          stage: CompanyStageEnum.EARLY_STAGE, // Default value, can be updated by client later
          foundedYear: new Date().getFullYear(),
        },
      });

      // Create client
      const client = await tx.client.create({
        data: {
          companyId: company.id,
        },
      });

      // Create client settings with default values
      const defaultClientSettings =
        await this.clientProfileService.getDefaultSettings(client.id);

      await tx.client_settings.create({
        data: {
          clientId: client.id,
          globalSettingsId: defaultClientSettings.globalSettingsId,
          notificationsEnabled: defaultClientSettings.notificationsEnabled,
          emailNotifications: defaultClientSettings.emailNotifications,
          pushNotifications: defaultClientSettings.pushNotifications,
          jobAlerts: defaultClientSettings.jobAlerts,
          candidateAlerts: defaultClientSettings.candidateAlerts,
          applicationAlerts: defaultClientSettings.applicationAlerts,
        },
      });

      // Create client AI assessment settings with default values
      const defaultAiAssessmentSettings =
        await this.clientProfileService.getDefaultAiAssessmentSettings(
          client.id
        );
      if (!defaultAiAssessmentSettings) {
        throw new AppError(
          'No default AI assessment settings found',
          500,
          ErrorCode.INTERNAL_SERVER_ERROR
        );
      }

      await tx.client_ai_assessment_settings.create({
        data: {
          clientId: client.id,
          globalJobAiAssessmentSettingsId:
            defaultAiAssessmentSettings.globalSettingsId,
          greetingMessage: defaultAiAssessmentSettings.greetingMessage,
          defaultAssessmentDuration:
            defaultAiAssessmentSettings.defaultAssessmentDuration,
          defaultPassingScore: defaultAiAssessmentSettings.defaultPassingScore,
          requiredSections: defaultAiAssessmentSettings.requiredSections,
          maximumAttempts: defaultAiAssessmentSettings.maximumAttempts,
          cooldownPeriod: defaultAiAssessmentSettings.cooldownPeriod,
          maxSections: defaultAiAssessmentSettings.maxSections,
          maxQuestionsPerSection:
            defaultAiAssessmentSettings.maxQuestionsPerSection,
          proctoringEnabled: defaultAiAssessmentSettings.proctoringEnabled,
          maxWarnings: defaultAiAssessmentSettings.maxWarnings,
          tabSwitchLimit: defaultAiAssessmentSettings.tabSwitchLimit,
          copyPasteAllowed: defaultAiAssessmentSettings.copyPasteAllowed,
          videoRecordingEnabled:
            defaultAiAssessmentSettings.videoRecordingEnabled,
          minimumVideoLength: defaultAiAssessmentSettings.minimumVideoLength,
          aiVideoAnalysisEnabled:
            defaultAiAssessmentSettings.aiVideoAnalysisEnabled,
          autoPublishOnSuccess:
            defaultAiAssessmentSettings.autoPublishOnSuccess,
          autoNotifyOnComplete:
            defaultAiAssessmentSettings.autoNotifyOnComplete,
          sectionTemplates: defaultAiAssessmentSettings.sectionTemplates,
          questionTemplates: defaultAiAssessmentSettings.questionTemplates,
          customStyles: defaultAiAssessmentSettings.customStyles,
          customInstructions: defaultAiAssessmentSettings.customInstructions,
          customPrompts: defaultAiAssessmentSettings.customPrompts,
          skillWeightings: defaultAiAssessmentSettings.skillWeightings,
        },
      });

      // Create user in our database
      const user = await tx.user.create({
        data: {
          name: invitation.name,
          email: invitation.email,
          password: await hashPassword(generatePassword()), // Hash password
          type: UserTypeEnum.CLIENT,
          role: UserRoleEnum.ADMIN,
          status: UserStatusEnum.ACTIVE,
          jobTitle: invitation.jobTitle,
          emailVerified: new Date(), // Mark as verified since they accepted invitation
        },
      });

      // Create client user relationship
      const clientUser = await tx.client_user.create({
        data: {
          clientId: client.id,
          userId: user.id,
        },
      });

      await tx.client_user_settings.create({
        data: {
          clientUserId: clientUser.id,
          globalSettingsId: defaultClientSettings.globalSettingsId,
          notificationsEnabled: defaultClientSettings.notificationsEnabled,
          emailNotifications: defaultClientSettings.emailNotifications,
          pushNotifications: defaultClientSettings.pushNotifications,
        },
      });

      // Update invitation status with clientId
      await tx.support_invitation.update({
        where: { id: invitation.id },
        data: {
          status: SupportInvitationStatusEnum.ACCEPTED,
          acceptedAt: new Date(),
          clientId: client.id,
        },
      });

      // Return user with client relationship
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
        'Failed to create client',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }

    // Create subscription with default package
    await this.clientSubscriptionService.createDefaultSubscription(
      result.clientUser?.client.id || ''
    );

    // Assign account manager to client
    try {
      if (invitation.accountManagerId) {
        // Use the specified account manager from the invitation
        await this.accountManagerAssignmentService.changeAccountManager(
          result.clientUser?.client.id || '',
          invitation.accountManagerId
        );
        logger.info({
          message: 'Specified account manager assigned to client successfully',
          context: 'SupportInvitationService.handleClientInvitation',
          clientId: result.clientUser?.client.id,
          accountManagerId: invitation.accountManagerId,
        });
      } else {
        // Use round-robin assignment if no account manager was specified
        await this.accountManagerAssignmentService.assignAccountManagerToClient(
          result.clientUser?.client.id || ''
        );
        logger.info({
          message:
            'Account manager assigned to client via round-robin successfully',
          context: 'SupportInvitationService.handleClientInvitation',
          clientId: result.clientUser?.client.id,
        });
      }
    } catch (assignmentError) {
      logger.warn({
        message: 'Failed to assign account manager to client',
        context: 'SupportInvitationService.handleClientInvitation',
        error:
          assignmentError instanceof Error
            ? assignmentError.message
            : 'Unknown error',
        clientId: result.clientUser?.client.id,
        accountManagerId: invitation.accountManagerId,
      });
      // Don't throw error - client creation should continue even if account manager assignment fails
    }

    // Generate auth token for immediate login
    const authUser = toIAuthUser(result);
    const authToken = getAuthToken(authUser);

    return {
      message: 'Invitation accepted successfully',
      user: authUser,
      token: authToken,
    };
  }

  private async handleCandidateInvitation(
    _prisma: any,
    invitation: any
  ): Promise<ISupportInvitationAccepted> {
    // Use a single transaction for all candidate creation operations

    const result = await this.prisma.$transaction(async (tx: any) => {
      // Determine user type and role - candidates are always CANDIDATE type
      const userType = UserTypeEnum.CANDIDATE;
      const userRole = UserRoleEnum.INDIVIDUAL;

      // Check if this is a campaign invitation (from Excel upload)
      let isImportedCandidate = false;
      let importedIntegrationId = null;

      if (invitation.isCampaign) {
        // Use integrationProviderId from invitation data if available
        if (invitation.integrationProviderId) {
          importedIntegrationId = invitation.integrationProviderId;
          isImportedCandidate = true;
        }

        // Find the corresponding support invitation import record
        const importRecord = await tx.support_invitation_import.findFirst({
          where: {
            email: invitation.email,
            invitationId: invitation.id,
          },
        });

        if (importRecord) {
          // Update the import record status to ACCEPTED
          await tx.support_invitation_import.update({
            where: { id: importRecord.id },
            data: {
              status: SupportInvitationImportStatusEnum.ACCEPTED,
              updatedAt: new Date(),
            },
          });

          // If we don't have integrationProviderId from invitation data, use it from import record
          if (!importedIntegrationId) {
            importedIntegrationId = importRecord.integrationProviderId;
            isImportedCandidate = true;
          }

          logger.info('Updated support invitation import record to ACCEPTED', {
            context: 'SupportInvitationService.handleCandidateInvitation',
            importRecordId: importRecord.id,
            email: invitation.email,
            integrationProviderId: importedIntegrationId,
          });
        }
      }

      // Create user in our database
      const user = await tx.user.create({
        data: {
          email: invitation.email,
          name: invitation.name,
          password: await hashPassword(generatePassword()),
          type: userType,
          role: userRole,
          status: UserStatusEnum.ACTIVE,
          jobTitle: invitation.jobTitle,
          emailVerified: new Date(),
        },
      });

      // Check for existing candidate association
      const existingCandidate = await tx.candidate.findFirst({
        where: {
          userId: user.id,
        },
      });

      let candidate;
      if (existingCandidate) {
        // User is already associated with candidate profile
        candidate = existingCandidate;

        // Update import tracking fields if this is an imported candidate
        if (isImportedCandidate) {
          await tx.candidate.update({
            where: { id: candidate.id },
            data: {
              isImportedCandidate: true,
              importedIntegrationId: importedIntegrationId,
            },
          });
        }
      } else {
        // No existing association - create new one
        candidate = await tx.candidate.create({
          data: {
            userId: user.id,
            status: CandidateStatusEnum.NEW,
            jobSearchStatus: JobSearchStatusEnum.OPEN_TO_OPPORTUNITIES,
            isPublished: false,
            completionPercentage: 0,
            // Import tracking fields
            isImportedCandidate: isImportedCandidate,
            importedIntegrationId: importedIntegrationId,
          },
        });

        const defaultSettings =
          await this.candidateProfileSettingsService.getDefaultSettings(
            candidate.id
          );
        await tx.candidate_settings.create({
          data: {
            candidateId: candidate.id,
            globalSettingsId: defaultSettings.globalSettingsId,
            notificationsEnabled: defaultSettings.notificationsEnabled,
            emailNotifications: defaultSettings.emailNotifications,
            pushNotifications: defaultSettings.pushNotifications,
            jobAlerts: defaultSettings.jobAlerts,
            applicationUpdates: defaultSettings.applicationUpdates,
            profileVisibility: defaultSettings.profileVisibility,
            shareDataWithEmployers: defaultSettings.shareDataWithEmployers,
            darkMode: defaultSettings.darkMode,
            language: defaultSettings.language,
            timezone: defaultSettings.timezone,
            preferredCommunicationChannel:
              defaultSettings.preferredCommunicationChannel,
          },
        });

        await tx.resume.create({
          data: {
            candidateId: candidate.id,
            phone: '',
            location: '',
            summary: '',
            primaryIndustry: '',
            totalExperience: 0,
            currentJobTitle: '',
            currentCompany: '',
            currentIndustry: '',
            currentWorkLocation: '',
            currentWorkType: null,
            currentWorkCommitment: null,
            currentWorkSchedule: null,
            currentSalary: 0,
            currentSalaryCurrency: 'USD',
            availableFrom: null,
            noticePeriod: null,
            highestEducationLevel: 'BACHELORS',
          },
        });
      }

      // Update invitation status
      await tx.support_invitation.update({
        where: { id: invitation.id },
        data: {
          status: SupportInvitationStatusEnum.ACCEPTED,
          acceptedAt: new Date(),
          candidateId: candidate.id,
        },
      });

      // Generate auth token
      const userWithRelations = await tx.user.findUnique({
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

      return userWithRelations;
    });

    if (!result) {
      throw new AppError(
        'Failed to create candidate',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }

    // Create subscription with default package
    await this.candidateSubscriptionService.createDefaultSubscription(
      result.candidate?.id || ''
    );

    // Generate auth token
    const authUser = toIAuthUser(result);
    const authToken = getAuthToken(authUser);

    return {
      message: 'Invitation accepted successfully',
      user: authUser,
      token: authToken,
    };
  }

  /**
   * Handle partner invitation acceptance
   */
  private async handlePartnerInvitation(
    _prisma: any,
    invitation: any
  ): Promise<ISupportInvitationAccepted> {
    // Use a single transaction for all partner creation operations
    return await this.prisma.$transaction(async (tx: any) => {
      // Create company
      const company = await tx.company.create({
        data: {
          name: invitation.companyName || 'Partner Company',
          contactEmail: invitation.email,
          description: `Company profile for ${invitation.companyName || 'Partner Company'}`,
          companyType: CompanyTypeEnum.CONSULTING, // Default value, can be updated by partner later
          industry: CompanyIndustryEnum.TECHNOLOGY, // Default value, can be updated by partner later
          size: CompanySizeEnum.ONE_TO_TEN, // Default value, can be updated by partner later
          stage: CompanyStageEnum.EARLY_STAGE, // Default value, can be updated by partner later
          foundedYear: new Date().getFullYear(),
        },
      });

      // Create partner
      const partner = await tx.partner.create({
        data: {
          companyId: company.id,
        },
      });

      // Create partner settings with default values
      const defaultPartnerSettings = await this.getPartnerDefaultSettings(
        partner.id
      );

      await tx.partner_settings.create({
        data: {
          partnerId: partner.id,
          globalSettingsId: defaultPartnerSettings.globalSettingsId,
          notificationsEnabled: defaultPartnerSettings.notificationsEnabled,
          emailNotifications: defaultPartnerSettings.emailNotifications,
          pushNotifications: defaultPartnerSettings.pushNotifications,
          consultantAlerts: defaultPartnerSettings.consultantAlerts,
          contractAlerts: defaultPartnerSettings.contractAlerts,
        },
      });

      // Create user in our database
      const user = await tx.user.create({
        data: {
          name: invitation.name,
          email: invitation.email,
          password: await hashPassword(generatePassword()), // Hash password
          type: UserTypeEnum.PARTNER,
          role: UserRoleEnum.ADMIN,
          status: UserStatusEnum.ACTIVE,
          jobTitle: invitation.jobTitle,
          emailVerified: new Date(), // Mark as verified since they accepted invitation
        },
      });

      // Create partner user relationship
      const partnerUser = await tx.partner_user.create({
        data: {
          partnerId: partner.id,
          userId: user.id,
        },
      });

      await tx.partner_user_settings.create({
        data: {
          partnerUserId: partnerUser.id,
          globalSettingsId: defaultPartnerSettings.globalSettingsId,
          notificationsEnabled: defaultPartnerSettings.notificationsEnabled,
          emailNotifications: defaultPartnerSettings.emailNotifications,
          pushNotifications: defaultPartnerSettings.pushNotifications,
        },
      });

      // Update invitation status with partnerId
      await tx.support_invitation.update({
        where: { id: invitation.id },
        data: {
          status: SupportInvitationStatusEnum.ACCEPTED,
          acceptedAt: new Date(),
          partnerId: partner.id,
        },
      });

      // Return user with partner relationship
      const result = await tx.user.findUnique({
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

      // Generate auth token for immediate login
      const authUser = toIAuthUser(result);
      const authToken = getAuthToken(authUser);

      return {
        message: 'Invitation accepted successfully',
        user: authUser,
        token: authToken,
      };
    });
  }

  /**
   * Handle support user invitation acceptance
   */
  private async handleSupportUserInvitation(
    _prisma: any,
    invitation: any
  ): Promise<ISupportInvitationAccepted> {
    // Use a single transaction for all support user creation operations
    return await this.prisma.$transaction(async (tx: any) => {
      // Create user in our database
      const user = await tx.user.create({
        data: {
          name: invitation.name,
          email: invitation.email,
          password: await hashPassword(generatePassword()), // Hash password
          type: UserTypeEnum.SUPPORT,
          role: invitation.role || UserRoleEnum.ADMIN,
          status: UserStatusEnum.ACTIVE,
          jobTitle: invitation.jobTitle,
          emailVerified: new Date(), // Mark as verified since they accepted invitation
        },
      });

      // Create support user relationship
      const supportUser = await tx.support_user.create({
        data: {
          userId: user.id,
          department: invitation.department,
          supportLevel: invitation.supportLevel,
        },
      });

      // Create account manager assignment if accountManagerId is provided
      if (invitation.accountManagerId) {
        const accountMAnagerSupportUserId = await tx.support_user.findUnique({
          where: {
            userId: invitation.accountManagerId,
          },
        });

        await tx.support_user_account_manager_assignment.create({
          data: {
            supportUserId: supportUser.id,
            accountManagerId: accountMAnagerSupportUserId?.id || null,
          },
        });
      }

      // Create support user settings with default values
      const defaultSupportUserSettings =
        await this.getSupportUserDefaultSettings(supportUser.id);

      await tx.support_user_settings.create({
        data: {
          supportUserId: supportUser.id,
          globalSettingsId: defaultSupportUserSettings.globalSettingsId,
          notificationsEnabled: defaultSupportUserSettings.notificationsEnabled,
          emailNotifications: defaultSupportUserSettings.emailNotifications,
          pushNotifications: defaultSupportUserSettings.pushNotifications,
          darkMode: defaultSupportUserSettings.darkMode,
          language: defaultSupportUserSettings.language,
          timezone: defaultSupportUserSettings.timezone,
          preferredCommunicationChannel:
            defaultSupportUserSettings.preferredCommunicationChannel,
        },
      });

      // Update invitation status
      await tx.support_invitation.update({
        where: { id: invitation.id },
        data: {
          status: SupportInvitationStatusEnum.ACCEPTED,
          acceptedAt: new Date(),
        },
      });

      // Return user with support user relationship
      const result = await tx.user.findUnique({
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

      // Generate auth token for immediate login
      const authUser = toIAuthUser(result);
      const authToken = getAuthToken(authUser);

      return {
        message: 'Invitation accepted successfully',
        user: authUser,
        token: authToken,
      };
    });
  }

  /**
   * Send invitation email based on type
   */
  private async sendInvitationEmail(
    invitationData: ISupportInvitationSend,
    inviterName: string,
    invitationUrl: string
  ): Promise<void> {
    switch (invitationData.type) {
      case SupportInvitationTypeEnum.CANDIDATE:
        // Check if this is a campaign invitation
        if (invitationData.isCampaign) {
          await this.notificationProvider.sendCampaignInvitationEmail(
            invitationData.email,
            invitationData.name,
            inviterName,
            invitationUrl,
            invitationData.jobTitle
          );
        } else {
          await this.notificationProvider.sendSupportCandidateInvitationEmail(
            invitationData.email,
            invitationData.name,
            inviterName,
            invitationUrl,
            this.invitationExpiryHours,
            invitationData.jobTitle,
            UserTypeEnum.CANDIDATE.toString(),
            UserRoleEnum.INDIVIDUAL.toString()
          );
        }
        break;
      case SupportInvitationTypeEnum.CLIENT:
        await this.notificationProvider.sendClientUserInvitationEmail(
          invitationData.email,
          invitationData.name,
          invitationData.companyName || 'Teamcast',
          inviterName,
          invitationUrl,
          invitationData.role || UserRoleEnum.ADMIN.toString(),
          this.invitationExpiryHours,
          UserTypeEnum.CLIENT.toString(),
          invitationData.role || UserRoleEnum.ADMIN.toString()
        );
        break;
      case SupportInvitationTypeEnum.PARTNER:
        await this.notificationProvider.sendPartnerUserInvitationEmail(
          invitationData.email,
          invitationData.name,
          invitationData.companyName || 'Teamcast',
          inviterName,
          invitationUrl,
          invitationData.role || UserRoleEnum.ADMIN.toString(),
          this.invitationExpiryHours,
          UserTypeEnum.PARTNER.toString(),
          invitationData.role || UserRoleEnum.ADMIN.toString()
        );
        break;
      case SupportInvitationTypeEnum.SUPPORT_USER:
        await this.notificationProvider.sendSupportUserInvitationEmail(
          invitationData.email,
          invitationData.name,
          inviterName,
          invitationUrl,
          invitationData.role || UserRoleEnum.ADMIN.toString(),
          this.invitationExpiryHours,
          invitationData.department || SupportDepartmentEnum.TECHNICAL_SUPPORT,
          invitationData.supportLevel || SupportLevelEnum.L1,
          UserTypeEnum.SUPPORT.toString(),
          invitationData.role || UserRoleEnum.ADMIN.toString()
        );
        break;
    }
  }

  /**
   * Send withdrawal email based on type
   */
  private async sendWithdrawalEmail(
    invitation: any,
    inviterName: string
  ): Promise<void> {
    switch (invitation.type) {
      case SupportInvitationTypeEnum.CANDIDATE:
        await this.notificationProvider.sendSupportCandidateInvitationWithdrawnEmail(
          invitation.email,
          invitation.name,
          inviterName
        );
        break;
      case SupportInvitationTypeEnum.CLIENT:
      case SupportInvitationTypeEnum.PARTNER:
      case SupportInvitationTypeEnum.SUPPORT_USER:
        await this.notificationProvider.sendSupportUserInvitationWithdrawnEmail(
          invitation.email,
          invitation.name,
          inviterName
        );
        break;
    }
  }

  /**
   * Generate a copied invitation token with shorter expiry (30 minutes)
   */
  async generateCopiedInvitationToken(invitationId: string): Promise<string> {
    try {
      const invitation = await this.prisma.support_invitation.findUnique({
        where: { id: invitationId },
      });

      if (!invitation) {
        throw new AppError('Invitation not found', 404, ErrorCode.NOT_FOUND);
      }

      // Generate JWT token for copied invitation (30 minutes expiry)
      const token = generateInvitationToken(
        invitation.email,
        invitation.id,
        invitation.type as SupportInvitationTypeEnum,
        InvitationTokenPurposeEnum.COPY
      );

      // Update invitation with new token and shorter expiry
      await this.prisma.support_invitation.update({
        where: { id: invitationId },
        data: {
          token,
          expiresAt: new Date(
            Date.now() + this.invitationExpiryMinutes * 60 * 1000
          ), // 30 minutes
        },
      });

      logger.info({
        message: 'Copied invitation token generated successfully',
        context: 'SupportInvitationService.generateCopiedInvitationToken',
        invitationId,
        email: invitation.email,
        type: invitation.type,
        expiryMinutes: this.invitationExpiryMinutes,
      });

      return token;
    } catch (error) {
      logger.error({
        message: 'Failed to generate copied invitation token',
        context: 'SupportInvitationService.generateCopiedInvitationToken',
        error: error instanceof Error ? error.message : 'Unknown error',
        invitationId,
      });
      throw error;
    }
  }

  /**
   * Get invitation type name for error messages
   */
  private getInvitationTypeName(type: SupportInvitationTypeEnum): string {
    switch (type) {
      case SupportInvitationTypeEnum.CANDIDATE:
        return 'Candidate';
      case SupportInvitationTypeEnum.CLIENT:
        return 'Client';
      case SupportInvitationTypeEnum.PARTNER:
        return 'Partner';
      case SupportInvitationTypeEnum.SUPPORT_USER:
        return 'Support User';
      default:
        return 'Invitation';
    }
  }

  /**
   * Get partner default settings
   */
  private async getPartnerDefaultSettings(_partnerId: string): Promise<any> {
    const globalSettings = await this.prisma.global_settings.findFirst({
      where: { isSingleton: true },
    });

    return {
      globalSettingsId: globalSettings?.id,
      notificationsEnabled: true,
      emailNotifications: true,
      pushNotifications: true,
      consultantAlerts: true,
      contractAlerts: true,
    };
  }

  /**
   * Get support user default settings
   */
  private async getSupportUserDefaultSettings(
    _supportUserId: string
  ): Promise<any> {
    const globalSettings = await this.prisma.global_settings.findFirst({
      where: { isSingleton: true },
    });

    return {
      globalSettingsId: globalSettings?.id,
      notificationsEnabled: true,
      emailNotifications: true,
      pushNotifications: true,
      darkMode: false,
      language: 'en',
      timezone: 'UTC',
      preferredCommunicationChannel: 'EMAIL',
    };
  }
}
