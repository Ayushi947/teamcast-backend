import { PrismaClient } from '@prisma/client';
import { singleton } from '@/shared/decorators/singleton';
import { INotificationProvider } from '../notification/notification.interface';
import {
  ISupportUser,
  ISupportUserUpdate,
  ISupportUserFilterQuery,
  ISupportUserActivateDeactivate,
  ISupportUserListResponse,
  toSupportUserDomain,
  ISupportUserPasswordChange,
  ISupportUserRecruiterAnalytics,
  ISupportUserProfilePhotoUrl,
} from '@/shared/models/domain/support/user.domain';
import {
  JobInviteStatusEnum,
  OnboardingAssessmentRecommendationEnum,
  UserRoleEnum,
  UserStatusEnum,
  UserTypeEnum,
} from '@/shared/models/common/enums';
import {
  IPaginationRequest,
  IPaginatedResponse,
} from '@/shared/models/api/common/common.api';
import { buildQueryConditions } from '@/utils/pagination';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';
import { ENV } from '@/config/env';
import { IUser } from '@/shared/models/domain/user/user.domain';
import { hashPassword } from '@/utils/password';
import { comparePassword } from '@/utils/password';
import { AccountManagerAssignmentService } from './account.manager.assignment.service';
import { getBucketFolderPathToSupportUserProfilePhoto } from '@/utils/presigned.urls';
import { IStorageProvider } from '../helpers/storage/storage.interface';

@singleton
export class SupportUserService {
  private readonly prisma: PrismaClient;
  private readonly accountManagerAssignmentService: AccountManagerAssignmentService;

  constructor(
    private readonly notificationProvider: INotificationProvider,
    private readonly storageService: IStorageProvider
  ) {
    this.prisma = new PrismaClient();
    this.accountManagerAssignmentService =
      new AccountManagerAssignmentService();
  }

  /**
   * Update an existing support user
   */
  async updateSupportUser(
    requestingUserId: string,
    supportUserId: string,
    updateData: ISupportUserUpdate
  ): Promise<ISupportUser> {
    try {
      logger.info({
        message: 'Updating support user',
        context: 'SupportUserService.updateSupportUser',
        supportUserId,
        updateData,
      });

      // Get the requesting user to check their role
      const requestingUser = (await this.prisma.user.findUnique({
        where: { id: requestingUserId },
      })) as IUser | null;

      if (!requestingUser) {
        throw new AppError('User not found', 404, ErrorCode.NOT_FOUND);
      }

      // Find the support user association
      const supportUser = await this.prisma.support_user.findFirst({
        where: {
          id: supportUserId,
        },
        include: {
          user: true,
        },
      });

      if (!supportUser || !supportUser.user) {
        throw new AppError('User not found', 404, ErrorCode.NOT_FOUND);
      }

      // Enforce authorization rules
      // Only ADMIN can change roles and status
      // HR/ACCOUNTS can only update themselves but not change roles or status
      const finalUpdateData = { ...updateData };

      if (requestingUserId === supportUser.userId) {
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
        supportUser.user.status !== UserStatusEnum.ACTIVE &&
        updateData.status === UserStatusEnum.ACTIVE;

      // Track if status is changing to INACTIVE
      const isDeactivating =
        supportUser.user.status === UserStatusEnum.ACTIVE &&
        updateData.status === UserStatusEnum.INACTIVE;

      // Update the user within a transaction
      const updatedUser = await this.prisma.$transaction(async (tx) => {
        if (!supportUser.user) {
          throw new AppError('User not found', 404, ErrorCode.NOT_FOUND);
        }

        // Update user (excluding department)
        const { department, ...userUpdateData } = finalUpdateData;

        const updatedUser = (await tx.user.update({
          where: { id: supportUser.user.id },
          data: userUpdateData,
        })) as IUser;

        // Update support user specific fields (department only)
        if (department !== undefined) {
          await tx.support_user.update({
            where: { id: supportUserId },
            data: {
              ...(department !== undefined && { department }),
            },
          });
        }

        return updatedUser;
      });

      // Send activation/deactivation notifications if status changed
      if (isActivating) {
        await this.sendUserStatusNotification(
          updatedUser.email,
          updatedUser.name,
          requestingUser.name,
          true, // isActivation = true
          updatedUser.role
        );
      } else if (isDeactivating) {
        await this.sendUserStatusNotification(
          updatedUser.email,
          updatedUser.name,
          requestingUser.name,
          false, // isActivation = false
          updatedUser.role
        );
      }

      // Fetch the updated support user to return
      const updatedSupportUser = await this.prisma.support_user.findFirst({
        where: { id: supportUserId },
        include: { user: true },
      });

      // Convert to domain model
      return toSupportUserDomain(updatedSupportUser);
    } catch (error) {
      logger.error({
        message: 'Failed to update support user',
        context: 'SupportUserService.updateSupportUser',
        error: error instanceof Error ? error.message : 'Unknown error',
        supportUserId,
        updateData,
      });
      throw error;
    }
  }

  /**
   * Get a support user by ID
   */
  async getSupportUser(supportUserId: string): Promise<ISupportUser> {
    try {
      // Find the support user association
      const supportUser = await this.prisma.support_user.findFirst({
        where: {
          id: supportUserId,
        },
        include: {
          user: true,
        },
      });

      if (!supportUser) {
        throw new AppError('User not found', 404, ErrorCode.NOT_FOUND);
      }

      if (
        supportUser.user.image &&
        !supportUser.user.image.startsWith('http')
      ) {
        const presignedUrl = await this.storageService.generatePreSignedUrl(
          supportUser.user.image,
          'read'
        );
        supportUser.user.image = presignedUrl;
      }

      // Convert to domain model
      return toSupportUserDomain(supportUser);
    } catch (error) {
      logger.error({
        message: 'Failed to get support user',
        context: 'SupportUserService.getSupportUser',
        error: error instanceof Error ? error.message : 'Unknown error',
        supportUserId,
      });
      throw error;
    }
  }

  /**
   * Delete a support user
   */
  async deleteSupportUser(supportUserId: string): Promise<void> {
    try {
      // Find the support user association
      const supportUser = await this.prisma.support_user.findFirst({
        where: {
          id: supportUserId,
        },
      });

      if (!supportUser) {
        throw new AppError('User not found', 404, ErrorCode.NOT_FOUND);
      }

      // Delete in a transaction
      await this.prisma.$transaction(async (tx) => {
        // First delete the support_user association
        await tx.support_user.delete({
          where: { id: supportUserId },
        });

        // Then delete the user
        await tx.user.delete({
          where: { id: supportUser.userId },
        });
      });
    } catch (error) {
      logger.error({
        message: 'Failed to delete support user',
        context: 'SupportUserService.deleteSupportUser',
        error: error instanceof Error ? error.message : 'Unknown error',
        supportUserId,
      });
      throw error;
    }
  }

  /**
   * List all support users with optional filtering
   */
  async listSupportUsers(
    filter: ISupportUserFilterQuery & { search?: string },
    paginationRequest: IPaginationRequest
  ): Promise<IPaginatedResponse<ISupportUserListResponse>> {
    try {
      // Build query conditions with proper sorting configuration
      const queryConditions = buildQueryConditions(filter, paginationRequest, {
        search: {
          searchableFields: [],
          relationFields: {
            user: ['name', 'email', 'jobTitle'],
          },
        },
        filter: {
          allowedFields: ['email', 'name', 'role', 'status', 'department'],
          relationFields: {
            email: 'user',
            name: 'user',
            role: 'user',
            status: 'user',
          },
          enumFields: ['role', 'status', 'department'],
          enumRelationFields: {
            role: 'user',
            status: 'user',
          },
        },
        sort: {
          allowedFields: ['id', 'createdAt', 'updatedAt', 'department'],
          relationFields: {
            name: { relation: 'user', field: 'name' },
            email: { relation: 'user', field: 'email' },
            jobTitle: { relation: 'user', field: 'jobTitle' },
            role: { relation: 'user', field: 'role' },
            status: { relation: 'user', field: 'status' },
          },
          defaultSort: { field: 'createdAt', order: 'desc' },
        },
      });

      // Build where clause based on filters with user type constraint
      const where = {
        ...queryConditions.where,
        user: {
          type: UserTypeEnum.SUPPORT,
          ...(queryConditions.where.user || {}),
        },
      };

      // Get total count for pagination
      const total = await this.prisma.support_user.count({
        where,
      });

      // Get paginated results
      const users = await this.prisma.support_user.findMany({
        where,
        skip: queryConditions.skip,
        take: queryConditions.take,
        orderBy: queryConditions.orderBy,
        include: {
          user: true,
        },
      });

      // Add account manager assignment flag for recruiters
      const usersWithAccountManagerFlag = await Promise.all(
        users.map(async (user) => {
          let accountManagerAssigned = false;

          if (user.user.role === UserRoleEnum.RECRUITER) {
            const isAccountManagerAvailable =
              await this.prisma.support_user_account_manager_assignment.findFirst(
                {
                  where: {
                    supportUserId: user.id,
                  },
                }
              );

            accountManagerAssigned = !!isAccountManagerAvailable;
          }

          return {
            ...user,
            accountManagerAssigned,
          };
        })
      );

      // Transform to simplified list response format
      const transformedUsers: ISupportUserListResponse[] =
        usersWithAccountManagerFlag.map((user) => ({
          id: user.id,
          email: user.user.email,
          name: user.user.name,
          jobTitle: user.user.jobTitle || undefined,
          role: user.user.role as UserRoleEnum,
          status: user.user.status as UserStatusEnum,
          department: user.department as any,
          accountManagerAssigned: user.accountManagerAssigned,
          createdAt: user.createdAt.toISOString(),
        }));

      return {
        items: transformedUsers,
        pagination: {
          total,
          page: queryConditions.pagination.page,
          limit: queryConditions.pagination.limit,
          totalPages: Math.ceil(total / queryConditions.pagination.limit),
        },
      };
    } catch (error) {
      logger.error({
        message: 'Failed to list support users',
        context: 'SupportUserService.listSupportUsers',
        error: error instanceof Error ? error.message : 'Unknown error',
        filter,
      });
      throw error;
    }
  }

  /**
   * Activate or deactivate a support user
   */
  async activateDeactivateSupportUser(
    requestingUserId: string,
    supportUserId: string,
    statusData: ISupportUserActivateDeactivate
  ): Promise<ISupportUser> {
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

      // Find the support user association
      const supportUser = await this.prisma.support_user.findFirst({
        where: {
          id: supportUserId,
        },
        include: {
          user: true,
        },
      });

      if (!supportUser) {
        throw new AppError('User not found', 404, ErrorCode.NOT_FOUND);
      }

      // Get the user to be updated
      const userToUpdate = (await this.prisma.user.findUnique({
        where: { id: supportUser.userId },
      })) as IUser | null;

      if (!userToUpdate) {
        throw new AppError('User not found', 404, ErrorCode.NOT_FOUND);
      }

      // Check if this is an account manager being deactivated
      const isAccountManagerBeingDeactivated =
        userToUpdate.role === UserRoleEnum.ACCOUNT_MANAGER &&
        userToUpdate.status === UserStatusEnum.ACTIVE &&
        statusData.status === UserStatusEnum.INACTIVE;

      // Handle account manager deactivation - release recruiters and reassign clients
      let canProceedWithDeactivation = true;
      let reassignmentMessage = '';

      if (isAccountManagerBeingDeactivated) {
        // Use autoReassign from request, defaulting to true if not provided
        const autoReassign = statusData.autoReassign ?? true;

        const reassignmentResult =
          await this.accountManagerAssignmentService.handleInactiveAccountManager(
            supportUser.userId,
            requestingUserId,
            autoReassign
          );

        canProceedWithDeactivation = reassignmentResult.success;
        reassignmentMessage = reassignmentResult.message;

        if (!canProceedWithDeactivation) {
          throw new AppError(reassignmentMessage);
        }
      }

      // Update the user status within a transaction (only if we can proceed)
      const updatedUser = await this.prisma.$transaction(async (tx) => {
        // Update user status
        const updatedUser = (await tx.user.update({
          where: { id: supportUser.userId },
          data: { status: statusData.status },
        })) as IUser;

        return updatedUser;
      });

      // Send activation/deactivation notification
      const isActivation = statusData.status === UserStatusEnum.ACTIVE;
      await this.sendUserStatusNotification(
        updatedUser.email,
        updatedUser.name,
        requestingUser.name,
        isActivation,
        updatedUser.role
      );

      // Convert to domain model
      return toSupportUserDomain(supportUser);
    } catch (error) {
      logger.error({
        message: 'Failed to activate/deactivate support user',
        context: 'SupportUserService.activateDeactivateSupportUser',
        error: error instanceof Error ? error.message : 'Unknown error',
        supportUserId,
        status: statusData.status,
      });
      throw error;
    }
  }

  /**
   * change support user password
   */

  async changePassword(
    supportUserId: string,
    passwordData: ISupportUserPasswordChange
  ): Promise<void> {
    try {
      // Find the support user by ID
      const supportUser = await this.prisma.support_user.findUnique({
        where: {
          id: supportUserId,
        },
        include: {
          user: true,
        },
      });

      if (!supportUser) {
        throw new AppError('Support user not found', 404, ErrorCode.NOT_FOUND);
      }

      // Check if the current password is correct
      const isCurrentPasswordValid = await comparePassword(
        passwordData.currentPassword,
        supportUser.user?.password || ''
      );

      if (!isCurrentPasswordValid) {
        throw new AppError(
          'Current password is incorrect',
          400,
          ErrorCode.PASSWORD_CHANGE_FAILED
        );
      }

      try {
        await this.prisma.user.update({
          where: { id: supportUser.userId },
          data: { password: await hashPassword(passwordData.newPassword) },
        });
      } catch (error) {
        logger.error('Failed to change password', {
          error,
          supportUserId,
          context: 'SupportUserService.changePassword',
        });
        throw new AppError(
          'Failed to change password. Please try again.',
          500,
          ErrorCode.PASSWORD_CHANGE_FAILED
        );
      }
    } catch (error) {
      logger.error({
        message: 'Failed to change password',
        context: 'SupportUserService.changePassword',
        error: error instanceof Error ? error.message : 'Unknown error',
        supportUserId,
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
    actionByName: string,
    isActivation: boolean,
    userRole?: string
  ): Promise<void> {
    try {
      // Use notification service to send appropriate email
      if (isActivation) {
        // Send activation email
        await this.notificationProvider.sendSupportUserActivatedEmail(
          userEmail,
          userName,
          actionByName,
          `${ENV.FRONTEND_URL}/app/auth/login`, // Redirect to login
          userRole
        );

        logger.info({
          message: 'User activation notification sent',
          context: 'SupportUserService.sendUserStatusNotification',
          userEmail,
          actionByName,
        });
      } else {
        // Send deactivation email
        await this.notificationProvider.sendSupportUserDeactivatedEmail(
          userEmail,
          userName,
          actionByName,
          `${ENV.FRONTEND_URL}/contact`,
          userRole
        );

        logger.info({
          message: 'User deactivation notification sent',
          context: 'SupportUserService.sendUserStatusNotification',
          userEmail,
          actionByName,
        });
      }
    } catch (error) {
      logger.error({
        message: 'Failed to send user status notification',
        context: 'SupportUserService.sendUserStatusNotification',
        error: error instanceof Error ? error.message : 'Unknown error',
        userEmail,
        isActivation,
      });
      // Don't throw the error - we don't want to fail the API call if email fails
    }
  }

  async getAcoountManagerRecruitersAnalytics(
    supportUserId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ISupportUserRecruiterAnalytics[]> {
    try {
      const accountManagerRecruiters =
        await this.prisma.support_user_account_manager_assignment.findMany({
          where: {
            accountManagerId: supportUserId,
          },
        });

      const supportRecruiters = await this.prisma.support_user.findMany({
        where: {
          id: {
            in: accountManagerRecruiters.map(
              (assignment) => assignment.supportUserId
            ),
          },
          user: {
            role: UserRoleEnum.RECRUITER,
            status: UserStatusEnum.ACTIVE,
            type: UserTypeEnum.SUPPORT,
          },
        },
      });

      const result: ISupportUserRecruiterAnalytics[] = [];

      for (const recruiter of supportRecruiters) {
        const jobPostings =
          await this.prisma.job_posting_recruiter_assignment.findMany({
            where: {
              recruiterId: recruiter.id,
              ...(startDate &&
                endDate && {
                  createdAt: {
                    gte: new Date(startDate),
                    lte: new Date(endDate + 'T23:59:59.999Z'),
                  },
                }),
            },
          });

        const jobPostingData = await Promise.all(
          jobPostings.map(async (jobPosting) => {
            const jobPostingInvites = await this.prisma.job_invite.findMany({
              where: {
                AND: [
                  {
                    jobId: jobPosting.jobPostingId,
                  },
                  {
                    inviterId: recruiter.id,
                  },
                ],
              },
            });

            // Get candidates for this job posting
            const jobPostingCandidates = await Promise.all(
              jobPostingInvites.map(async (invite) => {
                const candidate = await this.prisma.candidate.findFirst({
                  where: {
                    user: {
                      email: invite.email,
                    },
                  },
                  include: {
                    onboardingAssessments: true,
                  },
                });
                return candidate;
              })
            );

            // Count recommended candidates for this job posting
            const recommendedCandidates = jobPostingCandidates.filter(
              (candidate) =>
                candidate?.onboardingAssessments.some(
                  (assessment) =>
                    assessment.recommendation ===
                    OnboardingAssessmentRecommendationEnum.RECOMMENDED
                )
            ).length;

            return {
              jobPostingId: jobPosting.jobPostingId,
              jobPostingTotalInvites: jobPostingInvites.length,
              jobPostingTotalRecommendedCandidates: recommendedCandidates,
            };
          })
        );

        const jobInvites = await this.prisma.job_invite.findMany({
          where: {
            inviterId: recruiter.id,
            ...(startDate &&
              endDate && {
                createdAt: {
                  gte: new Date(startDate),
                  lte: new Date(endDate + 'T23:59:59.999Z'),
                },
              }),
          },
        });

        const candidates = await Promise.all(
          jobInvites.map(async (invite) => {
            const candidate = await this.prisma.candidate.findFirst({
              where: {
                user: {
                  email: invite.email,
                },
              },
              include: {
                user: true,
                onboardingAssessments: true,
              },
            });
            return candidate;
          })
        );

        const recommendationsData = {
          total: candidates.filter((candidate) =>
            candidate?.onboardingAssessments.some(
              (assessment) =>
                assessment.recommendation ===
                OnboardingAssessmentRecommendationEnum.RECOMMENDED
            )
          ).length,
          firstStageRecommendations: candidates.filter((candidate) =>
            candidate?.onboardingAssessments.some(
              (assessment) =>
                assessment.score > 80 &&
                assessment.recommendation ===
                  OnboardingAssessmentRecommendationEnum.RECOMMENDED
            )
          ).length,
          secondStageRecommendations: candidates.filter((candidate) =>
            candidate?.onboardingAssessments.some(
              (assessment) =>
                assessment.score > 70 &&
                assessment.recommendation ===
                  OnboardingAssessmentRecommendationEnum.RECOMMENDED
            )
          ).length,
          thirdStageRecommendations: candidates.filter((candidate) =>
            candidate?.onboardingAssessments.some(
              (assessment) =>
                assessment.score > 60 &&
                assessment.recommendation ===
                  OnboardingAssessmentRecommendationEnum.RECOMMENDED
            )
          ).length,
        };

        result.push({
          recruiterId: recruiter.id,
          jobPostings: jobPostings.length,
          pendingInvites: jobInvites.filter(
            (invite) => invite.status === JobInviteStatusEnum.PENDING
          ).length,
          acceptedInvites: jobInvites.filter(
            (invite) => invite.status === JobInviteStatusEnum.ACCEPTED
          ).length,
          rejectedInvites: jobInvites.filter(
            (invite) => invite.status === JobInviteStatusEnum.EXPIRED
          ).length,
          withdrawnInvites: jobInvites.filter(
            (invite) => invite.status === JobInviteStatusEnum.WITHDRAWN
          ).length,
          totalInvites: jobInvites.length,
          recommendationsData,
          jobPostingData,
        });
      }

      if (result.length === 0) {
        throw new AppError('No recruiters found', 404, ErrorCode.NOT_FOUND);
      }

      return result;
    } catch (error) {
      logger.error({
        message: 'Failed to get recruiters analytics',
        context: 'SupportUserService.getRecruitersAnalytics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async updateProfilePhoto(
    supportUserId: string,
    file: Buffer
  ): Promise<ISupportUserProfilePhotoUrl> {
    try {
      // Find the candidate by ID
      const supportUser = await this.prisma.support_user.findUnique({
        where: {
          id: supportUserId,
        },
        include: {
          user: true,
        },
      });

      if (!supportUser) {
        throw new AppError('Support user not found', 404, ErrorCode.NOT_FOUND);
      }

      // Generate a unique filename for the upload
      const uniqueFileName = `${supportUserId}-${Date.now()}.jpg`;
      const { folderPath } =
        getBucketFolderPathToSupportUserProfilePhoto(supportUserId);
      const filePath = `${folderPath}/${uniqueFileName}`;

      // Upload file directly to storage
      const uploadedUrl = await this.storageService.uploadFile(file, filePath);

      // Update the user's profile photo
      await this.prisma.user.update({
        where: { id: supportUser.userId },
        data: { image: uploadedUrl },
      });

      // Generate a read URL for the uploaded photo
      const presignedUrl = await this.storageService.generatePreSignedUrl(
        uploadedUrl,
        'read'
      );

      return {
        fileName: uniqueFileName,
        presignedUrl,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to update profile photo',
        context: 'CandidateProfileService.updateProfilePhoto',
        error: error instanceof Error ? error.message : 'Unknown error',
        supportUserId,
      });
      throw error;
    }
  }
}
