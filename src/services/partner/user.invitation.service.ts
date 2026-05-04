import { singleton } from '@/shared/decorators/singleton';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';
import { ENV } from '@/config/env';
import {
  IPartnerUserInvitation,
  IPartnerUserInvitationAccepted,
  IPartnerUserInvitationFilterQuery,
  IPartnerUserInvitationSend,
  toIPartnerUserInvitation,
} from '@/shared/models/domain/partner/user.invitation.domain';
import {
  UserStatusEnum,
  PartnerUserInvitationStatusEnum,
  UserTypeEnum,
  CandidateStatusEnum,
  JobSearchStatusEnum,
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
import { NotificationFactory } from '@/services/notification/notification.factory';
import { CandidateSignupService } from '@/services/candidate/signup.service';
import { CandidateSubscriptionService } from '@/services/candidate/subscription.service';
import { CandidateProfileSettingsService } from '@/services/candidate/profile.settings.service';
import { CandidateResumeService } from '@/services/candidate/resume.service';
import { StorageFactory } from '@/services/helpers/storage/storage.factory';
import { CandidateProfileService } from '@/services/candidate/profile.service';
import { PaymentFactory } from '@/services/subscription/payment.factory';
import { generatePassword, hashPassword } from '@/utils/password';
import { VerifyService } from '@/services/auth/verify.service';
import { formatEmail, formatName } from '@/shared/utils/formatters';

@singleton
export class PartnerUserInvitationService {
  private readonly prisma: PrismaClient;
  private readonly invitationExpiryHours = 72; // 3 days
  private readonly notificationProvider: INotificationProvider;
  private readonly candidateSignupService: CandidateSignupService;
  private readonly candidateProfileSettingsService: CandidateProfileSettingsService;
  private readonly subscriptionService: CandidateSubscriptionService;
  private readonly resumeService: CandidateResumeService;

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

  constructor() {
    this.prisma = new PrismaClient();
    this.notificationProvider =
      new NotificationFactory().getNotificationProvider();

    const storageService = StorageFactory.getInstance().getProvider();
    const paymentFactory = new PaymentFactory();
    const profileService = new CandidateProfileService(storageService);

    this.subscriptionService = new CandidateSubscriptionService(paymentFactory);
    this.candidateProfileSettingsService =
      new CandidateProfileSettingsService();
    this.resumeService = new CandidateResumeService(
      profileService,
      storageService
    );

    const verifyService = new VerifyService(this.notificationProvider);

    this.candidateSignupService = new CandidateSignupService(
      this.notificationProvider,
      this.subscriptionService,
      this.candidateProfileSettingsService,
      this.resumeService,
      verifyService
    );
  }

  /**
   * Send invitation to a user to join a partner team
   */
  async sendInvitation(
    partnerId: string,
    inviterUserId: string,
    invitationData: IPartnerUserInvitationSend
  ): Promise<IPartnerUserInvitation> {
    try {
      const partner = await this.prisma.partner.findUnique({
        where: { id: partnerId },
        include: { company: true },
      });

      if (!partner) {
        throw new AppError('Partner not found', 404, ErrorCode.NOT_FOUND);
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

      if (existingUser) {
        const existingPartnerUser = await this.prisma.partner_user.findFirst({
          where: {
            userId: existingUser.id,
            partnerId: partnerId,
          },
        });

        if (existingPartnerUser) {
          throw new AppError(
            'User is already a member of this partner organization',
            400,
            ErrorCode.ALREADY_EXISTS
          );
        }
      }

      // Check if an active invitation already exists for this email
      const existingInvitation =
        await this.prisma.partner_user_invitation.findFirst({
          where: {
            partnerId,
            email: invitationData.email,
            status: PartnerUserInvitationStatusEnum.PENDING,
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
      const invitation = await this.prisma.partner_user_invitation.create({
        data: {
          partnerId,
          email: formatEmail(invitationData.email),
          name: formatName(invitationData.name),
          jobTitle: invitationData.jobTitle,
          role: invitationData.role,
          token,
          expiresAt,
          status: PartnerUserInvitationStatusEnum.PENDING,
          createdById: inviterUserId,
        },
      });

      // Generate invitation URL
      const invitationUrl = `${ENV.FRONTEND_URL}/app/partner/invitation/accept/${token}`;

      // Send email notification
      await this.notificationProvider.sendPartnerUserInvitationEmail(
        invitationData.email,
        invitationData.name,
        partner.company.name,
        inviter.name,
        invitationUrl,
        invitationData.role,
        this.invitationExpiryHours,
        UserTypeEnum.PARTNER,
        invitationData.role
      );

      return toIPartnerUserInvitation(invitation);
    } catch (error) {
      logger.error({
        message: 'Failed to send partner user invitation',
        context: 'PartnerUserInvitationService.sendInvitation',
        error: error instanceof Error ? error.message : 'Unknown error',
        partnerId,
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
    partnerId: string,
    invitationId: string
  ): Promise<IPartnerUserInvitation> {
    try {
      // Find the invitation that belongs to the partner
      const invitation = await this.prisma.partner_user_invitation.findFirst({
        where: {
          id: invitationId,
          partnerId,
        },
      });
      if (!invitation) {
        throw new AppError('Invitation not found', 404, ErrorCode.NOT_FOUND);
      }
      return toIPartnerUserInvitation(invitation);
    } catch (error) {
      logger.error({
        message: 'Failed to get partner user invitation',
        context: 'PartnerUserInvitationService.getInvitation',
        error: error instanceof Error ? error.message : 'Unknown error',
        partnerId,
        invitationId,
      });
      throw error;
    }
  }

  /**
   * Withdraw an invitation
   */
  async withdrawInvitation(
    partnerId: string,
    invitationId: string
  ): Promise<IPartnerUserInvitation> {
    try {
      // Verify the invitation belongs to the partner
      const invitation = await this.prisma.partner_user_invitation.findFirst({
        where: {
          id: invitationId,
          partnerId,
          status: PartnerUserInvitationStatusEnum.PENDING,
        },
        include: {
          partner: {
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

      // Update invitation status
      const updatedInvitation =
        await this.prisma.partner_user_invitation.update({
          where: { id: invitationId },
          data: {
            status: PartnerUserInvitationStatusEnum.WITHDRAWN,
          },
        });

      // Note: Partner invitation withdrawal notification can be implemented
      // when the corresponding notification method is added to the notification provider
      // await this.notificationProvider.sendPartnerUserInvitationWithdrawnEmail(
      //   invitation.email,
      //   invitation.name,
      //   invitation.partner.company.name,
      //   inviter.name
      // );

      return toIPartnerUserInvitation(updatedInvitation);
    } catch (error) {
      logger.error('Error withdrawing partner user invitation', {
        error,
        partnerId,
        invitationId,
      });
      throw error;
    }
  }

  /**
   * Resend an invitation
   */
  async resendInvitation(
    partnerId: string,
    inviterUserId: string,
    invitationId: string
  ): Promise<IPartnerUserInvitation> {
    try {
      // Get partner details
      const partner = await this.prisma.partner.findUnique({
        where: { id: partnerId },
        include: { company: true },
      });

      if (!partner) {
        throw new AppError('Partner not found', 404, ErrorCode.NOT_FOUND);
      }

      // Get inviter details
      const inviter = await this.prisma.user.findUnique({
        where: { id: inviterUserId },
      });

      if (!inviter) {
        throw new AppError('Inviter not found', 404, ErrorCode.NOT_FOUND);
      }

      // Verify the invitation belongs to the partner and is in pending, withdrawn, or expired state
      const invitation = await this.prisma.partner_user_invitation.findFirst({
        where: {
          id: invitationId,
          partnerId,
          status: {
            in: [
              PartnerUserInvitationStatusEnum.PENDING,
              PartnerUserInvitationStatusEnum.WITHDRAWN,
              PartnerUserInvitationStatusEnum.EXPIRED,
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
      const updatedInvitation =
        await this.prisma.partner_user_invitation.update({
          where: { id: invitationId },
          data: {
            token,
            expiresAt,
            status: PartnerUserInvitationStatusEnum.PENDING,
          },
        });

      // Generate invitation URL
      const invitationUrl = `${ENV.FRONTEND_URL}/app/partner/invitation/accept/${token}`;

      // Send email notification
      await this.notificationProvider.sendPartnerUserInvitationEmail(
        invitation.email,
        invitation.name,
        partner.company.name,
        inviter.name,
        invitationUrl,
        invitation.role,
        this.invitationExpiryHours,
        UserTypeEnum.PARTNER,
        invitation.role
      );

      return toIPartnerUserInvitation(updatedInvitation);
    } catch (error) {
      logger.error({
        message: 'Failed to resend partner user invitation',
        context: 'PartnerUserInvitationService.resendInvitation',
        error: error instanceof Error ? error.message : 'Unknown error',
        partnerId,
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
  ): Promise<IPartnerUserInvitationAccepted> {
    try {
      logger.info({
        message: 'Accepting partner user invitation',
        context: 'PartnerUserInvitationService.acceptInvitation',
        token,
      });

      // Find the invitation by token
      const invitation = await this.prisma.partner_user_invitation.findFirst({
        where: {
          token,
          status: PartnerUserInvitationStatusEnum.PENDING,
        },
        include: {
          partner: {
            include: {
              company: true,
            },
          },
          createdBy: true,
        },
      });

      logger.info({
        message: 'Invitation',
        context: 'PartnerUserInvitationService.acceptInvitation',
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
        await this.prisma.partner_user_invitation.update({
          where: { id: invitation.id },
          data: {
            status: PartnerUserInvitationStatusEnum.EXPIRED,
          },
        });

        throw new AppError(
          'Invitation has expired',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      // Check if user already exists
      let user = await this.prisma.user.findUnique({
        where: { email: invitation.email },
      });

      // Begin transaction
      return await this.prisma.$transaction(async (prisma) => {
        if (!user) {
          user = await prisma.user.create({
            data: {
              email: invitation.email,
              name: invitation.name,
              password: await hashPassword(generatePassword()),
              type: UserTypeEnum.PARTNER,
              role: invitation.role,
              status: UserStatusEnum.ACTIVE,
              jobTitle: invitation.jobTitle,
              emailVerified: new Date(),
            },
          });
        }
        // If user exists but is not a partner, update type/role
        else if (user.type !== UserTypeEnum.PARTNER) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              type: UserTypeEnum.PARTNER,
              role: invitation.role,
              jobTitle: invitation.jobTitle || user.jobTitle,
              emailVerified: new Date(), // Mark as verified in database too
            },
          });
        }
        if (!user.emailVerified) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              emailVerified: new Date(),
            },
          });
        }

        // Check for existing partner user association (any partner)
        const existingPartnerUser = await prisma.partner_user.findFirst({
          where: {
            userId: user.id,
          },
        });

        let partnerUser;
        if (existingPartnerUser) {
          // User is already associated with a partner
          if (existingPartnerUser.partnerId === invitation.partnerId) {
            // Same partner - use existing association
            partnerUser = existingPartnerUser;
          } else {
            // Different partner - update the association to the new partner
            partnerUser = await prisma.partner_user.update({
              where: { id: existingPartnerUser.id },
              data: {
                partnerId: invitation.partnerId,
              },
            });
          }
        } else {
          // No existing association - create new one
          partnerUser = await prisma.partner_user.create({
            data: {
              userId: user.id,
              partnerId: invitation.partnerId,
            },
          });

          // Create default settings for the partner user
          const newSettings = await this.getPartnerUserDefaultSettings(
            partnerUser.id
          );
          await prisma.partner_user_settings.create({
            data: {
              globalSettingsId: newSettings.globalSettingsId,
              partnerUserId: partnerUser.id,
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
        }

        // Update invitation status
        await prisma.partner_user_invitation.update({
          where: { id: invitation.id },
          data: {
            status: PartnerUserInvitationStatusEnum.ACCEPTED,
            acceptedAt: new Date(),
            partnerUserId: partnerUser.id,
          },
        });

        if (invitation.role === UserRoleEnum.PARTNER_RESOURCE) {
          const candidate = await prisma.candidate.findFirst({
            where: { userId: user.id },
          });

          let newCandidate;
          if (!candidate) {
            newCandidate = await prisma.candidate.create({
              data: {
                userId: user.id,
                status: CandidateStatusEnum.NEW,
                jobSearchStatus: JobSearchStatusEnum.OPEN_TO_OPPORTUNITIES,
                isPublished: false,
                completionPercentage: 0,
                partnerId: partnerUser.partnerId,
              },
            });

            const defaultSettings =
              await this.candidateProfileSettingsService.getDefaultSettings(
                newCandidate.id
              );
            await prisma.candidate_settings.create({
              data: {
                candidateId: newCandidate.id,
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

            const defaultPackage =
              await prisma.candidate_subscription_package.findFirst({
                where: { isDefault: true, isActive: true },
              });
            if (defaultPackage) {
              await prisma.candidate_subscription.create({
                data: {
                  candidateId: newCandidate.id,
                  packageId: defaultPackage.id,
                  paymentProviderCustomerId: null,
                  status: 'ACTIVE',
                  startDate: new Date(),
                  autoRenew: true,
                  practiceAssessmentsUsed: 0,
                  paymentProvider: defaultPackage.paymentProvider,
                  lastBillingDate: new Date(),
                },
              });
            }

            await prisma.resume.create({
              data: {
                candidateId: newCandidate.id,
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
                // Add other default fields as needed
              },
            });
          }
        }

        // Generate auth token - fetch user with all relationships needed for auth
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

        const inviter = await this.prisma.user.findUnique({
          where: { id: invitation.createdBy.id },
        });

        if (inviter) {
          await this.notificationProvider.sendPartnerInvitationAcceptedEmail(
            inviter.email,
            inviter.name,
            user.name,
            invitation.partner.company.name,
            invitation.role
          );
        }

        return {
          user: authUser,
          authToken,
        };
      });
    } catch (error) {
      logger.error({
        message: 'Failed to accept partner user invitation',
        context: 'PartnerUserInvitationService.acceptInvitation',
        error: error instanceof Error ? error.message : 'Unknown error',
        token: token.substring(0, 8) + '...', // Log partial token for debugging
      });
      throw error;
    }
  }

  /**
   * List all invitations for a partner with optional filtering
   */
  async listInvitations(
    partnerId: string,
    _userId: string,
    filter: IPartnerUserInvitationFilterQuery,
    paginationRequest: IPaginationRequest
  ): Promise<IPaginatedResponse<IPartnerUserInvitation>> {
    try {
      logger.info({
        message: 'Listing partner user invitations',
        context: 'PartnerUserInvitationService.listInvitations',
        partnerId,
        filter,
        paginationRequest,
      });

      // Build query conditions using the generic pagination utilities
      const queryConditions = buildQueryConditions(filter, paginationRequest, {
        search: this.searchConfig,
        filter: this.filterConfig,
        sort: this.sortConfig,
      });

      // Add base conditions for this partner's invitations
      const baseWhere = {
        partnerId,
        status: {
          not: PartnerUserInvitationStatusEnum.ACCEPTED,
        },
      };

      // Get total count
      const total = await this.prisma.partner_user_invitation.count({
        where: {
          ...baseWhere,
          ...queryConditions.where,
        },
      });

      // Get paginated results
      const invitations = await this.prisma.partner_user_invitation.findMany({
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
        items: filteredInvitations as IPartnerUserInvitation[],
        pagination: {
          total,
          page: queryConditions.pagination.page,
          limit: queryConditions.pagination.limit,
          totalPages: Math.ceil(total / queryConditions.pagination.limit),
        },
      };
    } catch (error) {
      logger.error({
        message: 'Failed to list partner user invitations',
        context: 'PartnerUserInvitationService.listInvitations',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        partnerId,
        filter,
        paginationRequest,
      });
      throw error;
    }
  }

  /**
   * Create settings from global settings
   * This is a helper method that can be used when creating a new partner user
   * or when settings don't exist
   */
  private async getPartnerUserDefaultSettings(
    partnerUserId: string
  ): Promise<any> {
    try {
      // Get the global settings
      const globalSettings = await this.prisma.global_settings.findFirst({
        where: { isSingleton: true },
      });

      if (!globalSettings) {
        // Fallback to hardcoded defaults if no global settings exist
        return {
          partnerUserId,
          globalSettingsId: null,
          notificationsEnabled: true,
          emailNotifications: true,
          pushNotifications: true,
          darkMode: false,
          language: 'en',
          timezone: 'UTC',
          preferredCommunicationChannel: 'EMAIL',
        };
      }

      // Create new settings with global defaults
      return {
        partnerUserId,
        globalSettingsId: globalSettings.id,
        notificationsEnabled: globalSettings.defaultNotificationsEnabled,
        emailNotifications: globalSettings.defaultEmailNotifications,
        pushNotifications: globalSettings.defaultPushNotifications,
        darkMode: globalSettings.defaultDarkMode,
        language: globalSettings.defaultLanguage,
        timezone: globalSettings.defaultTimezone,
        preferredCommunicationChannel:
          globalSettings.defaultCommunicationChannel,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to create partner user default settings',
        context: 'PartnerUserInvitationService.getPartnerUserDefaultSettings',
        error: error instanceof Error ? error.message : 'Unknown error',
        partnerUserId,
      });
      throw error;
    }
  }
}
