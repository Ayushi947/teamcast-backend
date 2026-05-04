import { singleton } from '@/shared/decorators/singleton';
import { PrismaClient } from '@prisma/client';
import {
  IClientCandidateShortlistCreate,
  IClientCandidateShortlistUpdate,
  IClientCandidateShortlist,
  IClientCandidateShortlistWithCandidate,
  IClientCandidateShortlistQuery,
  toClientCandidateShortlistDomain,
  toClientCandidateShortlistWithCandidateDomain,
} from '@/shared/models/domain/client/candidate.shortlist.domain';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';
import { ClientSubscriptionLimitsService } from './subscription.limits.service';
import {
  CandidateShortlistStatusEnum,
  CandidateStatusEnum,
  JobPostingStatusEnum,
} from '@/shared/models/common/enums';
import { INotificationProvider } from '@/services/notification/notification.interface';
import { NotificationFactory } from '@/services/notification/notification.factory';

@singleton
export class ClientCandidateShortlistService {
  private readonly prisma: PrismaClient;
  private readonly subscriptionLimitsService: ClientSubscriptionLimitsService;
  private readonly notificationProvider: INotificationProvider;

  constructor() {
    this.prisma = new PrismaClient();
    this.subscriptionLimitsService = new ClientSubscriptionLimitsService();
    this.notificationProvider =
      new NotificationFactory().getNotificationProvider();
  }

  /**
   * Add a candidate to shortlist
   */
  async createCandidateShortlist(
    clientId: string,
    clientUserId: string,
    shortlistData: IClientCandidateShortlistCreate
  ): Promise<IClientCandidateShortlist> {
    try {
      // Check subscription limits before shortlisting candidate
      const limitCheck =
        await this.subscriptionLimitsService.checkCandidateViewLimit(clientId);

      if (!limitCheck.canView) {
        throw new AppError(
          limitCheck.errorMessage || 'Candidate view limit exceeded',
          403,
          ErrorCode.SUBSCRIPTION_LIMIT_REACHED
        );
      }

      // Validate that the candidate exists and is published
      const candidate = await this.prisma.candidate.findUnique({
        where: {
          id: shortlistData.candidateId,
          isPublished: true,
          deletedAt: null,
          status: CandidateStatusEnum.NEW,
        },
      });

      if (!candidate) {
        throw new AppError(
          'Candidate not found or not available for shortlisting',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Validate job posting if provided
      let jobPosting = null;
      if (shortlistData.jobPostingId) {
        jobPosting = await this.prisma.job_posting.findFirst({
          where: {
            id: shortlistData.jobPostingId,
            clientId: clientId,
            status: JobPostingStatusEnum.PUBLISHED,
          },
        });

        if (!jobPosting) {
          throw new AppError(
            'Job posting not found or does not belong to client',
            404,
            ErrorCode.NOT_FOUND
          );
        }
      }

      // Validate client user belongs to client
      const clientUser = await this.prisma.client_user.findFirst({
        where: {
          id: clientUserId,
          clientId: clientId,
        },
      });

      if (!clientUser) {
        throw new AppError(
          'Client user not found or does not belong to client',
          403,
          ErrorCode.FORBIDDEN
        );
      }

      // Check if candidate is already shortlisted for this client/job combination
      const existingShortlist = await this.prisma.candidate_shortlist.findFirst(
        {
          where: {
            candidateId: shortlistData.candidateId,
            clientId: clientId,
            jobPostingId: shortlistData.jobPostingId || null,
          },
        }
      );

      if (existingShortlist) {
        throw new AppError(
          shortlistData.jobPostingId
            ? 'Candidate is already shortlisted for this position'
            : 'Candidate is already shortlisted',
          409,
          ErrorCode.CONFLICT
        );
      }

      // Validate rating if provided
      if (
        shortlistData.rating &&
        (shortlistData.rating < 1 || shortlistData.rating > 5)
      ) {
        throw new AppError(
          'Rating must be between 1 and 5',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      // Create the shortlist entry
      const shortlist = await this.prisma.candidate_shortlist.create({
        data: {
          candidateId: shortlistData.candidateId,
          clientId: clientId,
          jobPostingId: shortlistData.jobPostingId || null,
          shortlistedById: clientUserId,
          notes: shortlistData.notes || null,
          rating: shortlistData.rating || null,
          tags: shortlistData.tags || [],
          status: CandidateShortlistStatusEnum.SHORTLISTED,
          viewedAt: new Date(), // Mark as viewed since it's being shortlisted
        },
      });

      // Send email notification to candidate
      await this.sendCandidateShortlistNotification(
        shortlistData.candidateId,
        clientId,
        clientUserId,
        shortlistData.jobPostingId!,
        shortlistData.notes
      );

      logger.info({
        message: 'Candidate shortlisted successfully',
        context: 'ClientCandidateShortlistService.createCandidateShortlist',
        clientId,
        candidateId: shortlistData.candidateId,
        jobPostingId: shortlistData.jobPostingId,
        shortlistId: shortlist.id,
        shortlistedBy: clientUserId,
      });

      return toClientCandidateShortlistDomain(shortlist);
    } catch (error) {
      logger.error({
        message: 'Failed to create candidate shortlist',
        context: 'ClientCandidateShortlistService.createCandidateShortlist',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        clientUserId,
        shortlistData,
      });
      throw error;
    }
  }

  /**
   * Update a shortlist entry
   */
  async updateCandidateShortlist(
    clientId: string,
    shortlistId: string,
    updateData: IClientCandidateShortlistUpdate
  ): Promise<IClientCandidateShortlist> {
    try {
      // Validate shortlist exists and belongs to client
      const existingShortlist = await this.prisma.candidate_shortlist.findFirst(
        {
          where: {
            id: shortlistId,
            clientId: clientId,
          },
        }
      );

      if (!existingShortlist) {
        throw new AppError(
          'Shortlist entry not found or does not belong to client',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Validate rating if provided
      if (
        updateData.rating &&
        (updateData.rating < 1 || updateData.rating > 5)
      ) {
        throw new AppError(
          'Rating must be between 1 and 5',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      // Update the shortlist entry
      const updatedShortlist = await this.prisma.candidate_shortlist.update({
        where: {
          id: shortlistId,
        },
        data: {
          status: updateData.status,
          notes: updateData.notes,
          rating: updateData.rating,
          tags: updateData.tags,
          updatedAt: new Date(),
        },
      });

      logger.info({
        message: 'Candidate shortlist updated successfully',
        context: 'ClientCandidateShortlistService.updateCandidateShortlist',
        clientId,
        shortlistId,
        updateData,
      });

      return toClientCandidateShortlistDomain(updatedShortlist);
    } catch (error) {
      logger.error({
        message: 'Failed to update candidate shortlist',
        context: 'ClientCandidateShortlistService.updateCandidateShortlist',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        shortlistId,
        updateData,
      });
      throw error;
    }
  }

  /**
   * Get a single shortlist entry with candidate details
   */
  async getCandidateShortlist(
    clientId: string,
    shortlistId: string
  ): Promise<IClientCandidateShortlistWithCandidate> {
    try {
      const shortlist = await this.prisma.candidate_shortlist.findFirst({
        where: {
          id: shortlistId,
          clientId: clientId,
        },
        include: {
          candidate: {
            include: {
              user: true,
              resume: true,
            },
          },
          jobPosting: {
            select: {
              id: true,
              title: true,
              department: true,
            },
          },
          shortlistedBy: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!shortlist) {
        throw new AppError(
          'Shortlist entry not found or does not belong to client',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      return toClientCandidateShortlistWithCandidateDomain(shortlist);
    } catch (error) {
      logger.error({
        message: 'Failed to get candidate shortlist',
        context: 'ClientCandidateShortlistService.getCandidateShortlist',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        shortlistId,
      });
      throw error;
    }
  }

  /**
   * Get paginated list of shortlisted candidates
   */
  async listCandidateShortlists(
    clientId: string,
    query: IClientCandidateShortlistQuery
  ): Promise<{
    data: IClientCandidateShortlistWithCandidate[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    try {
      const page = query.page || 1;
      const limit = Math.min(query.limit || 10, 100);
      const skip = (page - 1) * limit;

      const where: any = {
        clientId: clientId,
      };

      // Apply filters
      if (query.status) {
        where.status = query.status;
      }

      if (query.jobPostingId) {
        where.jobPostingId = query.jobPostingId;
      }

      if (query.candidateId) {
        where.candidateId = query.candidateId;
      }

      if (query.shortlistedById) {
        where.shortlistedById = query.shortlistedById;
      }

      if (query.rating) {
        where.rating = {
          gte: query.rating,
        };
      }

      if (query.tags && query.tags.length > 0) {
        where.tags = {
          hasSome: query.tags,
        };
      }

      if (query.search) {
        where.candidate = {
          user: {
            OR: [
              {
                firstName: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                lastName: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                email: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            ],
          },
        };
      }

      const [shortlists, total] = await Promise.all([
        this.prisma.candidate_shortlist.findMany({
          where,
          include: {
            candidate: {
              include: {
                user: true,
                resume: {
                  select: {
                    currentJobTitle: true,
                    currentCompany: true,
                    currentWorkLocation: true,
                    currentSalary: true,
                    currentSalaryCurrency: true,
                    currentWorkType: true,
                    currentWorkCommitment: true,
                    currentWorkSchedule: true,
                    resumeSkills: true,
                    education: true,
                    experience: true,
                    certifications: true,
                    languages: true,
                    totalExperience: true,
                  },
                },
              },
            },
            jobPosting: {
              select: {
                id: true,
                title: true,
                department: true,
              },
            },
            shortlistedBy: {
              include: {
                user: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
        }),
        this.prisma.candidate_shortlist.count({ where }),
      ]);

      const shortlistsWithCandidate = shortlists.map(
        toClientCandidateShortlistWithCandidateDomain
      );

      return {
        data: shortlistsWithCandidate,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error({
        message: 'Failed to list candidate shortlists',
        context: 'ClientCandidateShortlistService.listCandidateShortlists',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        query,
      });
      throw error;
    }
  }

  /**
   * Remove a candidate from shortlist
   */
  async deleteCandidateShortlist(
    clientId: string,
    shortlistId: string
  ): Promise<{ success: boolean }> {
    try {
      // Validate shortlist exists and belongs to client
      const existingShortlist = await this.prisma.candidate_shortlist.findFirst(
        {
          where: {
            id: shortlistId,
            clientId: clientId,
          },
        }
      );

      if (!existingShortlist) {
        throw new AppError(
          'Shortlist entry not found or does not belong to client',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      await this.prisma.candidate_shortlist.delete({
        where: {
          id: shortlistId,
        },
      });

      logger.info({
        message: 'Candidate shortlist deleted successfully',
        context: 'ClientCandidateShortlistService.deleteCandidateShortlist',
        clientId,
        shortlistId,
      });

      return { success: true };
    } catch (error) {
      logger.error({
        message: 'Failed to delete candidate shortlist',
        context: 'ClientCandidateShortlistService.deleteCandidateShortlist',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        shortlistId,
      });
      throw error;
    }
  }

  /**
   * Bulk update multiple shortlist entries
   */
  async bulkUpdateCandidateShortlists(
    clientId: string,
    shortlistIds: string[],
    updateData: IClientCandidateShortlistUpdate
  ): Promise<{ updatedCount: number; success: boolean }> {
    try {
      // Validate rating if provided
      if (
        updateData.rating &&
        (updateData.rating < 1 || updateData.rating > 5)
      ) {
        throw new AppError(
          'Rating must be between 1 and 5',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      const updateResult = await this.prisma.candidate_shortlist.updateMany({
        where: {
          id: {
            in: shortlistIds,
          },
          clientId: clientId,
        },
        data: {
          status: updateData.status,
          notes: updateData.notes,
          rating: updateData.rating,
          tags: updateData.tags,
          updatedAt: new Date(),
        },
      });

      logger.info({
        message: 'Candidate shortlists bulk updated successfully',
        context:
          'ClientCandidateShortlistService.bulkUpdateCandidateShortlists',
        clientId,
        shortlistIds,
        updatedCount: updateResult.count,
        updateData,
      });

      return {
        updatedCount: updateResult.count,
        success: true,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to bulk update candidate shortlists',
        context:
          'ClientCandidateShortlistService.bulkUpdateCandidateShortlists',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        shortlistIds,
        updateData,
      });
      throw error;
    }
  }

  /**
   * Get shortlist statistics for a client
   */
  async getCandidateShortlistStats(clientId: string) {
    try {
      const [totalShortlisted, statusCounts, jobPostingCounts, recentActivity] =
        await Promise.all([
          // Total shortlisted candidates
          this.prisma.candidate_shortlist.count({
            where: { clientId },
          }),

          // Count by status
          this.prisma.candidate_shortlist.groupBy({
            by: ['status'],
            where: { clientId },
            _count: true,
          }),

          // Count by job posting
          this.prisma.candidate_shortlist.groupBy({
            by: ['jobPostingId'],
            where: {
              clientId,
            },
            _count: true,
            orderBy: {
              _count: {
                id: 'desc',
              },
            },
            take: 10,
          }),

          // Recent activity (last 10 shortlisted candidates)
          this.prisma.candidate_shortlist.findMany({
            where: { clientId },
            include: {
              candidate: {
                include: {
                  user: true,
                  resume: true,
                },
              },
              jobPosting: {
                select: {
                  id: true,
                  title: true,
                  department: true,
                },
              },
              shortlistedBy: {
                include: {
                  user: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 10,
          }),
        ]);

      // Format status counts
      const byStatus = {
        SHORTLISTED: 0,
        NOT_INTERESTED: 0,
        REJECTED: 0,
      };

      statusCounts.forEach((statusCount) => {
        byStatus[statusCount.status as keyof typeof byStatus] =
          statusCount._count;
      });

      // Get job posting details for counts
      const jobPostingIds = jobPostingCounts.map((jpc) => jpc.jobPostingId);
      const validJobPostingIds = jobPostingIds.filter(
        (id): id is string => id !== null
      );

      const jobPostings = await this.prisma.job_posting.findMany({
        where: {
          id: {
            in: validJobPostingIds,
          },
        },
        select: {
          id: true,
          title: true,
        },
      });

      const byJobPosting = jobPostingCounts.map((jpc) => {
        const jobPosting = jobPostings.find((jp) => jp.id === jpc.jobPostingId);
        return {
          jobPostingId: jpc.jobPostingId,
          title: jobPosting?.title || 'Unknown Job',
          count: jpc._count,
        };
      });

      const recentActivityFormatted = recentActivity.map(
        toClientCandidateShortlistWithCandidateDomain
      );

      return {
        totalShortlisted,
        byStatus,
        byJobPosting,
        recentActivity: recentActivityFormatted,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to get candidate shortlist stats',
        context: 'ClientCandidateShortlistService.getCandidateShortlistStats',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
      });
      throw error;
    }
  }

  /**
   * Send email notification to candidate when they are shortlisted
   */
  private async sendCandidateShortlistNotification(
    candidateId: string,
    clientId: string,
    clientUserId: string,
    jobPostingId: string,
    notes?: string
  ): Promise<void> {
    try {
      // Fetch candidate details with user info
      const candidate = await this.prisma.candidate.findUnique({
        where: { id: candidateId },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      if (!candidate || !candidate.user) {
        logger.warn('Candidate or user not found for shortlist notification', {
          candidateId,
          context:
            'ClientCandidateShortlistService.sendCandidateShortlistNotification',
        });
        return;
      }

      // Fetch client company details
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
        include: {
          company: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!client || !client.company) {
        logger.warn('Client or company not found for shortlist notification', {
          clientId,
          context:
            'ClientCandidateShortlistService.sendCandidateShortlistNotification',
        });
        return;
      }

      // Fetch client user details
      const clientUser = await this.prisma.client_user.findUnique({
        where: { id: clientUserId },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!clientUser || !clientUser.user) {
        logger.warn('Client user not found for shortlist notification', {
          clientUserId,
          context:
            'ClientCandidateShortlistService.sendCandidateShortlistNotification',
        });
        return;
      }

      // Fetch job posting details
      const jobPosting = await this.prisma.job_posting.findUnique({
        where: { id: jobPostingId },
        select: { title: true },
      });
      const jobTitle = jobPosting?.title;

      // Construct email parameters
      const candidateName = candidate.user.name;
      const companyName = client.company.name;
      const clientUserName = clientUser.user.name;

      if (this.notificationProvider.sendCandidateShortlistedEmail) {
        // Send the notification
        await this.notificationProvider.sendCandidateShortlistedEmail({
          to: candidate.user.email,
          candidateName,
          companyName,
          clientUserName,
          jobTitle,
          notes,
        });
      }
      logger.info('Candidate shortlist notification sent successfully', {
        candidateId,
        candidateEmail: candidate.user.email,
        companyName,
        jobTitle,
        context:
          'ClientCandidateShortlistService.sendCandidateShortlistNotification',
      });
    } catch (error) {
      logger.error('Failed to send candidate shortlist notification', {
        context:
          'ClientCandidateShortlistService.sendCandidateShortlistNotification',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        clientId,
        clientUserId,
        jobPostingId,
      });
      // Don't throw error - notification failure shouldn't break the main flow
    }
  }
}
