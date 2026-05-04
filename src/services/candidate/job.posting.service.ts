import { PrismaClient } from '@prisma/client';
import { singleton } from '@/shared/decorators/singleton';
import {
  ICandidateJobPosting,
  ICandidateJobPostingApply,
  toCandidateJobPostingDomain,
} from '@/shared/models/domain/candidate/job.posting.domain';
import {
  ICandidateJobApplication,
  toCandidateJobApplicationDomain,
} from '@/shared/models/domain/candidate/application.domain';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';
import { ICandidateJobPostingFilterQuery } from '@/shared/models/api/candidate/job.posting.api';
import {
  IPaginatedResponse,
  IPaginationRequest,
} from '@/shared/models/api/common/common.api';
import { getPaginationInfo } from '@/utils/pagination';
import { job_posting_status } from '@prisma/client';
import { INotificationProvider } from '../notification/notification.interface';
import { JobAiAssessmentInviteService } from '../client/job.ai.assessment.invite.service';

@singleton
export class CandidateJobPostingService {
  private readonly prisma: PrismaClient;
  private readonly jobAiAssessmentInviteService: JobAiAssessmentInviteService;

  constructor(private readonly notificationProvider: INotificationProvider) {
    this.prisma = new PrismaClient();
    this.jobAiAssessmentInviteService = new JobAiAssessmentInviteService(
      notificationProvider
    );
  }

  /**
   * Get all job postings with pagination and filtering
   */
  async getJobPostings(
    filter: ICandidateJobPostingFilterQuery,
    paginationRequest: IPaginationRequest
  ): Promise<IPaginatedResponse<ICandidateJobPosting>> {
    try {
      // Get pagination info
      const paginationInfo = getPaginationInfo(paginationRequest);

      // Build where clause based on filters
      const where = {
        status: job_posting_status.PUBLISHED,
        ...(filter.jobType && { jobType: filter.jobType }),
        ...(filter.jobCommitment && { jobCommitment: filter.jobCommitment }),
        ...(filter.jobSchedule && { jobSchedule: filter.jobSchedule }),
        ...(filter.industry && { industry: filter.industry }),
        ...(filter.isRemote !== undefined && { isRemote: filter.isRemote }),
        ...(filter.minExperience && {
          totalExperience: { gte: filter.minExperience },
        }),
        ...(filter.maxExperience && {
          totalExperience: { lte: filter.maxExperience },
        }),
        ...(filter.minSalary && { minSalary: { gte: filter.minSalary } }),
        ...(filter.maxSalary && { maxSalary: { lte: filter.maxSalary } }),
        ...(filter.salaryCurrency && { salaryCurrency: filter.salaryCurrency }),
        ...(filter.skills && {
          OR: [
            { requiredSkills: { hasSome: filter.skills } },
            { preferredSkills: { hasSome: filter.skills } },
          ],
        }),
        ...(filter.company && {
          client: {
            company: {
              name: {
                contains: filter.company,
                mode: 'insensitive' as const,
              },
            },
          },
        }),
      };

      const jobPostings = await this.prisma.job_posting.findMany({
        where,
        skip: paginationInfo.skip,
        take: paginationInfo.take,
        orderBy: paginationInfo.orderBy,
        include: {
          client: {
            include: {
              company: true,
            },
          },
        },
      });

      // Get total count for pagination
      const total = await this.prisma.job_posting.count({
        where,
      });

      const page = paginationRequest.page ?? 1;
      return {
        items: jobPostings.map(toCandidateJobPostingDomain),
        pagination: {
          total,
          page,
          limit: paginationInfo.take,
          totalPages: Math.ceil(total / paginationInfo.take),
        },
      };
    } catch (error) {
      logger.error({
        message: 'Failed to get job postings',
        context: 'JobPostingService.getJobPostings',
        error: error instanceof Error ? error.message : 'Unknown error',
        filter,
        paginationRequest,
      });
      throw error;
    }
  }

  /**
   * Get a specific job posting
   */
  async getJobPosting(jobPostingId: string): Promise<ICandidateJobPosting> {
    try {
      const jobPosting = await this.prisma.job_posting.findUnique({
        where: {
          id: jobPostingId,
          status: job_posting_status.PUBLISHED,
        },
        include: {
          client: {
            include: {
              company: true,
            },
          },
        },
      });

      if (!jobPosting) {
        throw new AppError(
          'Job posting not found',
          404,
          ErrorCode.JOB_POSTING_NOT_FOUND
        );
      }

      return toCandidateJobPostingDomain(jobPosting);
    } catch (error) {
      logger.error({
        message: 'Failed to get job posting',
        context: 'JobPostingService.getJobPosting',
        error: error instanceof Error ? error.message : 'Unknown error',
        jobPostingId,
      });
      throw error;
    }
  }

  async getJobPostingSearchTerms(jobPostingId: string): Promise<{
    jobSearchTerms: string;
    jobPostTitle: string;
  }> {
    const jobPosting = await this.prisma.job_posting.findUnique({
      where: {
        id: jobPostingId,
      },
    });

    if (!jobPosting) {
      throw new AppError(
        'Job posting not found',
        404,
        ErrorCode.JOB_POSTING_NOT_FOUND
      );
    }

    // Create search query from job post details
    const jobSearchTerms = [
      jobPosting.title,
      jobPosting.description,
      ...(jobPosting.requiredSkills || []),
      ...(jobPosting.preferredSkills || []),
      jobPosting.industry,
      jobPosting.jobType,
    ]
      .filter(Boolean)
      .join(' ');

    return { jobSearchTerms, jobPostTitle: jobPosting.title };
  }

  /**
   * Apply for a job posting
   */
  async applyForJobPosting(
    candidateId: string,
    jobPostingId: string,
    data: ICandidateJobPostingApply
  ): Promise<ICandidateJobApplication> {
    try {
      // First check if job posting exists and is published
      const jobPosting = await this.prisma.job_posting.findUnique({
        where: {
          id: jobPostingId,
          status: job_posting_status.PUBLISHED,
        },
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
      });

      if (!jobPosting) {
        throw new AppError(
          'Job posting not found or not published',
          404,
          ErrorCode.JOB_POSTING_NOT_FOUND
        );
      }

      // Check if candidate has already applied
      const existingApplication = await this.prisma.job_application.findUnique({
        where: {
          candidateId_jobPostingId: {
            candidateId,
            jobPostingId,
          },
        },
      });

      if (existingApplication) {
        throw new AppError(
          'You have already applied for this job',
          400,
          ErrorCode.JOB_APPLICATION_ALREADY_EXISTS
        );
      }

      // Create the application
      const application = await this.prisma.job_application.create({
        data: {
          candidateId,
          jobPostingId,
          status: 'APPLIED',
          notes: data.notes,
          coverLetterUrl: data.coverLetterUrl,
        },
        include: {
          jobPosting: {
            include: {
              client: {
                include: {
                  company: true,
                },
              },
            },
          },
          candidate: {
            include: {
              user: true,
            },
          },
        },
      });

      // Send notifications
      await this.notificationProvider.sendJobApplicationSubmittedEmail({
        to: application.candidate.user.email,
        jobTitle: application.jobPosting.title,
        companyName: application.jobPosting.client.company.name,
        notes: data.notes,
      });

      // Send notification to all client users who created the job posting
      for (const clientUser of jobPosting.client.clientUsers) {
        await this.notificationProvider.sendNewJobApplicationEmail({
          to: clientUser.user.email,
          candidateName: application.candidate.user.name,
          jobTitle: application.jobPosting.title,
          companyName: application.jobPosting.client.company.name,
        });
      }

      // Create Job AI Assessment invite for this application
      try {
        const clientId = jobPosting.client.id;
        // Use the first client user as the inviter (or adjust logic as needed)
        const clientUserId = jobPosting.client.clientUsers[0]?.id;
        if (clientId && clientUserId) {
          await this.jobAiAssessmentInviteService.createAiAssessmentInvite(
            candidateId,
            application.id,
            clientId,
            clientUserId
          );
        }
      } catch (err) {
        logger.error({
          message: 'Failed to create Job AI Assessment invite',
          error: err instanceof Error ? err.message : err,
          candidateId,
          jobPostingId,
        });
      }

      return toCandidateJobApplicationDomain(application);
    } catch (error) {
      logger.error({
        message: 'Failed to apply for job posting',
        context: 'JobPostingService.applyForJobPosting',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        jobPostingId,
        data,
      });
      throw error;
    }
  }
}
