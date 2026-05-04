import {
  PrismaClient,
  application_status,
  application_action_by,
} from '@prisma/client';
import { singleton } from '@/shared/decorators/singleton';
import {
  ICandidateAcceptJobAssessmentInviteRequest,
  ICandidateDeclineJobAssessmentInviteRequest,
  ICandidateJobAssessmentInviteResponse,
  ICandidateJobAssessmentInviteFilterQuery,
} from '../../shared/models/api/candidate/job.assessment.invite.api';
import {
  JobAssessmentInviteStatusEnum,
  JobAiAssessmentInviteStatusEnum,
  JobInviteStatusEnum,
} from '../../shared/models/common/enums';
import {
  IPaginatedResponse,
  IPaginationRequest,
} from '../../shared/models/api/common/common.api';
import { toCandidateJobAssessmentInviteDomain } from '../../shared/models/domain/candidate/job.assessment.invite.domain';
import { logger } from '../../shared/utils/logger';
import { AppError } from '../../utils/app.error';
import { ErrorCode } from '../../utils/error.codes';
import { formatEmail } from '../../shared/utils/formatters';
import { NotificationFactory } from '@/services/notification/notification.factory';
import { INotificationProvider } from '@/services/notification/notification.interface';

@singleton
export class CandidateJobAssessmentInviteService {
  private readonly prisma: PrismaClient;
  private readonly notificationProvider: INotificationProvider;

  constructor() {
    this.prisma = new PrismaClient();
    this.notificationProvider =
      new NotificationFactory().getNotificationProvider();
  }

  /**
   * Get all job assessment invites for a candidate with filtering and pagination
   */
  async getInvites(
    candidateId: string,
    filter: ICandidateJobAssessmentInviteFilterQuery,
    paginationRequest: IPaginationRequest
  ): Promise<IPaginatedResponse<ICandidateJobAssessmentInviteResponse>> {
    try {
      const filters = filter;
      const pagination = paginationRequest;

      logger.info('Getting job assessment invites for candidate', {
        candidateId,
        filters,
        pagination,
        searchTerm: pagination?.search,
        statusFilter: filters?.status,
        hasSearch: !!pagination?.search?.trim(),
        hasStatusFilter: !!filters?.status,
      });

      const baseWhere: any = {
        candidateId,
        OR: [
          { status: application_status.INVITED },
          { status: application_status.ASSESSING },
          { status: application_status.DECLINED },
          { status: application_status.WITHDRAWN },
          {
            AND: [
              {
                status: {
                  in: [
                    application_status.APPLIED,
                    application_status.REVIEWING,
                    application_status.SHORTLISTED,
                    application_status.OFFERED,
                    application_status.ACCEPTED,
                    application_status.FAILED,
                    application_status.REJECTED,
                  ],
                },
              },
              {
                OR: [
                  { acceptedAt: { not: null } },
                  { declinedAt: { not: null } },
                ],
              },
            ],
          },
        ],
      };

      const { status, ..._otherFilters } = filters || {};

      let statusArray: string[] = [];
      if (status) {
        statusArray = Array.isArray(status) ? status : [status];
      } else {
        const statusKeys = Object.keys(filters || {}).filter((key) =>
          key.startsWith('status[')
        );
        if (statusKeys.length > 0) {
          statusArray = statusKeys
            .map((key) => (filters as any)[key])
            .filter(Boolean);
        }
      }

      if (statusArray.length > 0) {
        const statusConditions: any[] = [];

        for (const statusValue of statusArray) {
          switch (statusValue) {
            case JobAssessmentInviteStatusEnum.PENDING:
              statusConditions.push({
                OR: [
                  {
                    AND: [
                      {
                        status: {
                          in: [
                            application_status.INVITED,
                            application_status.ASSESSING,
                          ],
                        },
                      },
                      { acceptedAt: null },
                      { declinedAt: null },
                    ],
                  },
                  {
                    AND: [
                      {
                        status: {
                          in: [
                            application_status.APPLIED,
                            application_status.REVIEWING,
                            application_status.SHORTLISTED,
                            application_status.OFFERED,
                            application_status.ACCEPTED,
                            application_status.FAILED,
                            application_status.REJECTED,
                          ],
                        },
                      },
                      { acceptedAt: null },
                      { declinedAt: null },
                    ],
                  },
                ],
              });
              break;
            case JobAssessmentInviteStatusEnum.ACCEPTED:
              statusConditions.push({
                OR: [
                  { acceptedAt: { not: null } },
                  {
                    jobAiAssessmentInvitations: {
                      some: {
                        status: JobAiAssessmentInviteStatusEnum.ACCEPTED,
                      },
                    },
                  },
                ],
              });
              break;
            case JobAssessmentInviteStatusEnum.DECLINED:
              statusConditions.push({
                OR: [
                  { status: application_status.DECLINED },
                  { declinedAt: { not: null } },
                ],
              });
              break;
            case JobAssessmentInviteStatusEnum.EXPIRED:
              statusConditions.push({
                jobAiAssessmentInvitations: {
                  some: {
                    status: 'EXPIRED',
                  },
                },
              });
              break;
            case JobAssessmentInviteStatusEnum.CANCELLED:
              statusConditions.push({ status: application_status.WITHDRAWN });
              break;
          }
        }

        if (statusConditions.length > 0) {
          baseWhere.AND = [
            { candidateId },
            { OR: baseWhere.OR },
            { OR: statusConditions },
          ];
          delete baseWhere.OR;
        }
      }

      if (pagination?.search?.trim()) {
        const searchValue = pagination.search.trim();
        const searchConditions = [
          // Search by job posting title (Position)
          {
            jobPosting: {
              title: {
                contains: searchValue,
                mode: 'insensitive' as const,
              },
            },
          },
          {
            jobPosting: {
              client: {
                company: {
                  name: {
                    contains: searchValue,
                    mode: 'insensitive' as const,
                  },
                },
              },
            },
          },
          {
            jobPosting: {
              client: {
                clientUsers: {
                  some: {
                    user: {
                      name: {
                        contains: searchValue,
                        mode: 'insensitive' as const,
                      },
                    },
                  },
                },
              },
            },
          },
        ];

        if (baseWhere.AND) {
          baseWhere.AND.push({ OR: searchConditions });
        } else {
          baseWhere.AND = [
            { candidateId },
            { OR: baseWhere.OR },
            { OR: searchConditions },
          ];
          delete baseWhere.OR;
        }
      }

      // Build order by clause
      const sortBy = pagination?.sortBy || 'createdAt';
      const sortOrder = pagination?.sortOrder || 'desc';

      // Map sort fields to actual database columns
      let orderBy: any = {};
      switch (sortBy) {
        case 'invited':
          orderBy = { createdAt: sortOrder };
          break;
        case 'expiresAt':
          orderBy = { createdAt: sortOrder };
          break;
        case 'accepted':
          orderBy = { acceptedAt: sortOrder };
          break;
        case 'declined':
          orderBy = { declinedAt: sortOrder };
          break;
        default:
          orderBy = { [sortBy]: sortOrder };
          break;
      }

      // Get total count
      const total = await this.prisma.job_application.count({
        where: baseWhere,
      });

      // Calculate pagination
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 10;
      const skip = (page - 1) * limit;
      const totalPages = Math.ceil(total / limit);

      // Get applications with all related data
      const applications = await this.prisma.job_application.findMany({
        where: baseWhere,
        include: {
          jobPosting: {
            include: {
              client: {
                include: {
                  company: true,
                  clientUsers: {
                    include: {
                      user: true,
                    },
                  },
                },
              },
            },
          },
          aiAssessment: {
            include: {
              sections: {
                include: {
                  questions: true,
                },
                orderBy: {
                  order: 'asc',
                },
              },
              progressState: true,
              videoAnalysis: true,
              proctoring: true,
            },
          },
          jobAiAssessmentInvitations: {
            include: {
              invitedBy: {
                include: {
                  user: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
          jobInvite: true,
        },
        orderBy,
        skip,
        take: limit,
      });

      // Transform to domain models
      const invites = applications.map((app) => {
        // Log for debugging expiresAt issue
        logger.info('Transforming application to invite', {
          applicationId: app.id,
          hasAiAssessment: !!app.aiAssessment,
          hasInvitations: !!app.jobAiAssessmentInvitations?.length,
          invitationCount: app.jobAiAssessmentInvitations?.length || 0,
          invitationExpiresAt: app.jobAiAssessmentInvitations?.[0]?.expiresAt,
          applicationCreatedAt: app.createdAt,
        });
        return toCandidateJobAssessmentInviteDomain(app);
      });

      // Transform to API response format
      const apiInvites: ICandidateJobAssessmentInviteResponse[] = invites.map(
        (invite) => ({
          id: invite.id,
          candidateId: invite.candidateId,
          jobPostingId: invite.jobPostingId,
          jobPostingTitle: invite.jobPostingTitle || '',
          companyName: invite.companyName || '',
          jobAssessmentId: invite.jobAssessmentId,
          inviterName: invite.inviterName || '',
          message: invite.message,
          status: invite.status,
          appliedAt: invite.appliedAt.toISOString(),
          notes: invite.notes,
          coverLetterUrl: invite.coverLetterUrl,
          scheduledDate: invite.scheduledDate?.toISOString() || null,
          expiresAt: invite.expiresAt.toISOString(),
          acceptedAt: invite.acceptedAt?.toISOString() || null,
          acceptedBy: invite.acceptedBy,
          acceptedById: invite.acceptedById,
          acceptanceNote: invite.acceptanceNote,
          declinedAt: invite.declinedAt?.toISOString() || null,
          declinedBy: invite.declinedBy,
          declinedById: invite.declinedById,
          declineReason: invite.declineReason,
          createdAt: invite.createdAt.toISOString(),
          updatedAt: invite.updatedAt.toISOString(),
        })
      );

      return {
        items: apiInvites,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      logger.error('Error getting job assessment invites', error);
      throw error;
    }
  }

  /**
   * Accept a job assessment invite
   */
  async acceptInvite(
    candidateId: string,
    inviteId: string,
    request?: ICandidateAcceptJobAssessmentInviteRequest
  ): Promise<void> {
    try {
      logger.info('Accepting job assessment invite', {
        candidateId,
        inviteId,
        request,
      });

      // Find the application
      const application = await this.prisma.job_application.findFirst({
        where: {
          id: inviteId,
          candidateId,
        },
        include: {
          aiAssessment: true,
          jobAiAssessmentInvitations: true,
          candidate: {
            include: {
              user: true,
            },
          },
          jobPosting: true,
          jobInvite: true, // Include jobInvite relation
        },
      });

      if (!application) {
        throw new AppError(
          'Job assessment invite not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Check if invite can be accepted
      if (application.acceptedAt || application.declinedAt) {
        throw new AppError(
          'Job assessment invite has already been processed',
          400,
          ErrorCode.CONFLICT
        );
      }

      // Check if invite is expired (7 days from creation)
      const expiryDate = new Date(application.createdAt);
      expiryDate.setDate(expiryDate.getDate() + 7);

      if (new Date() > expiryDate) {
        throw new AppError(
          'Job assessment invite has expired',
          400,
          ErrorCode.INVITATION_EXPIRED
        );
      }

      // Update job_invite status to ACCEPTED (do NOT update application status)
      // The application should only be updated when candidate explicitly applies
      await this.prisma.$transaction(async (tx) => {
        // Find and update job_invite if it exists
        // First, try to find invite linked to this application
        let existingJobInvite = await tx.job_invite.findFirst({
          where: {
            jobApplicationId: inviteId,
          },
        });

        // If not found by applicationId, try to find by email and jobId
        // Normalize email to lowercase to match how invites are stored
        if (!existingJobInvite) {
          const normalizedEmail = application.candidate.user.email
            .toLowerCase()
            .trim();
          existingJobInvite = await tx.job_invite.findFirst({
            where: {
              jobId: application.jobPostingId,
              email: normalizedEmail,
            },
          });
        }

        // Update invite to ACCEPTED and link to application if not already linked
        if (existingJobInvite) {
          await tx.job_invite.update({
            where: { id: existingJobInvite.id },
            data: {
              status: JobInviteStatusEnum.ACCEPTED,
              jobApplicationId: existingJobInvite.jobApplicationId || inviteId, // Link to application if not already linked
              updatedAt: new Date(),
            },
          });

          logger.info(
            'Updated job_invite status to ACCEPTED and linked to application',
            {
              candidateId,
              inviteId,
              jobInviteId: existingJobInvite.id,
              previousStatus: existingJobInvite.status,
              applicationId: inviteId,
              wasLinked: !!existingJobInvite.jobApplicationId,
              context: 'CandidateJobAssessmentInviteService.acceptInvite',
            }
          );
        } else {
          logger.warn('No job_invite found to update', {
            candidateId,
            inviteId,
            jobPostingId: application.jobPostingId,
            email: application.candidate.user.email,
            context: 'CandidateJobAssessmentInviteService.acceptInvite',
          });
        }
      });

      // Update related job_ai_assessment_invitation status to ACCEPTED if it exists
      if (
        application.jobAiAssessmentInvitations &&
        application.jobAiAssessmentInvitations.length > 0
      ) {
        await this.prisma.job_ai_assessment_invitation.updateMany({
          where: {
            jobApplicationId: inviteId,
            candidateId,
            status: {
              not: JobAiAssessmentInviteStatusEnum.DECLINED,
            },
          },
          data: {
            status: JobAiAssessmentInviteStatusEnum.ACCEPTED,
            updatedAt: new Date(),
          },
        });

        logger.info('Updated job AI assessment invitation status to ACCEPTED', {
          candidateId,
          inviteId,
          invitationCount: application.jobAiAssessmentInvitations.length,
        });
      }

      logger.info('Successfully accepted job assessment invite', {
        candidateId,
        inviteId,
      });
    } catch (error) {
      logger.error('Error accepting job assessment invite', error);
      throw error;
    }
  }

  /**
   * Decline a job assessment invite
   */
  async declineInvite(
    candidateId: string,
    inviteId: string,
    request?: ICandidateDeclineJobAssessmentInviteRequest
  ): Promise<void> {
    try {
      logger.info('Declining job assessment invite', {
        candidateId,
        inviteId,
        request,
      });

      // Find the application
      const application = await this.prisma.job_application.findFirst({
        where: {
          id: inviteId,
          candidateId,
        },
        include: {
          jobAiAssessmentInvitations: true,
          candidate: {
            include: {
              user: true,
            },
          },
          jobPosting: {
            include: {
              createdBy: {
                include: {
                  user: true,
                },
              },
            },
          },
          jobInvite: true, // Include jobInvite relation
        },
      });

      if (!application) {
        throw new AppError(
          'Job assessment invite not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Check if invite can be declined
      if (application.acceptedAt || application.declinedAt) {
        throw new AppError(
          'Job assessment invite has already been processed',
          400,
          ErrorCode.CONFLICT
        );
      }

      // Check if invite is expired (7 days from creation)
      const expiryDate = new Date(application.createdAt);
      expiryDate.setDate(expiryDate.getDate() + 7);

      if (new Date() > expiryDate) {
        throw new AppError(
          'Job assessment invite has expired',
          400,
          ErrorCode.INVITATION_EXPIRED
        );
      }

      // Update application status
      const updateData: any = {
        status: 'DECLINED' as application_status,
        declinedAt: new Date(),
        declinedBy: application_action_by.CANDIDATE,
        declinedById: candidateId,
        updatedAt: new Date(),
      };

      if (request?.reason) {
        updateData.declineReason = request.reason;
      }

      if (request?.declineNote) {
        updateData.declineNote = request.declineNote;
      }

      // Update application and job_invite in a transaction
      await this.prisma.$transaction(async (tx) => {
        // Update application status to DECLINED
        await tx.job_application.update({
          where: { id: inviteId },
          data: updateData,
        });

        // Find and update job_invite if it exists
        // Normalize email to match how invites are stored
        const candidateEmail = formatEmail(application.candidate.user.email);
        let existingJobInvite = await tx.job_invite.findFirst({
          where: {
            jobApplicationId: inviteId,
          },
        });

        // If not found by applicationId, try to find by email and jobId
        if (!existingJobInvite) {
          existingJobInvite = await tx.job_invite.findFirst({
            where: {
              jobId: application.jobPostingId,
              email: candidateEmail,
            },
          });
        }

        // Update job_invite status to DECLINED if it exists
        if (existingJobInvite) {
          await tx.job_invite.update({
            where: { id: existingJobInvite.id },
            data: {
              status: JobInviteStatusEnum.DECLINED,
              updatedAt: new Date(),
            },
          });

          logger.info('Updated job_invite status to DECLINED', {
            candidateId,
            inviteId,
            jobInviteId: existingJobInvite.id,
            context: 'CandidateJobAssessmentInviteService.declineInvite',
          });
        }
      });

      // Update related job_ai_assessment_invitation status to DECLINED if it exists
      if (
        application.jobAiAssessmentInvitations &&
        application.jobAiAssessmentInvitations.length > 0
      ) {
        await this.prisma.job_ai_assessment_invitation.updateMany({
          where: {
            jobApplicationId: inviteId,
            candidateId,
            status: {
              not: JobAiAssessmentInviteStatusEnum.DECLINED,
            },
          },
          data: {
            status: JobAiAssessmentInviteStatusEnum.DECLINED,
            updatedAt: new Date(),
          },
        });

        logger.info('Updated job AI assessment invitation status to DECLINED', {
          candidateId,
          inviteId,
          invitationCount: application.jobAiAssessmentInvitations.length,
        });
      }

      // Send email notification to client about the declined application
      // Note: Candidate does NOT receive an email when they decline - they initiated the action
      // Only notify the client that the candidate declined
      try {
        if (
          application.jobPosting?.createdBy?.user?.email &&
          application.candidate?.user?.name &&
          application.jobPosting?.title
        ) {
          await this.notificationProvider.sendCandidateDeclinedApplicationEmail(
            {
              to: application.jobPosting.createdBy.user.email,
              candidateName: application.candidate.user.name,
              jobTitle: application.jobPosting.title,
              notes: request?.declineNote || request?.reason || undefined,
            }
          );

          logger.info(
            'Sent email notification to client about declined invite',
            {
              candidateId,
              inviteId,
              clientEmail: application.jobPosting.createdBy.user.email,
              context: 'CandidateJobAssessmentInviteService.declineInvite',
            }
          );
        } else {
          logger.warn(
            'Cannot send email notification - missing required data',
            {
              candidateId,
              inviteId,
              hasClientEmail: !!application.jobPosting?.createdBy?.user?.email,
              hasCandidateName: !!application.candidate?.user?.name,
              hasJobTitle: !!application.jobPosting?.title,
              context: 'CandidateJobAssessmentInviteService.declineInvite',
            }
          );
        }
      } catch (emailError) {
        // Log email error but don't fail the decline operation
        logger.error('Failed to send email notification for declined invite', {
          error:
            emailError instanceof Error ? emailError.message : 'Unknown error',
          candidateId,
          inviteId,
          context: 'CandidateJobAssessmentInviteService.declineInvite',
        });
      }

      logger.info('Successfully declined job assessment invite', {
        candidateId,
        inviteId,
      });
    } catch (error) {
      logger.error('Error declining job assessment invite', error);
      throw error;
    }
  }
}
