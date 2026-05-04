import { PrismaClient } from '@prisma/client';
import { singleton } from '@/shared/decorators/singleton';
import {
  IClientAnalytics,
  IJobPostingAnalytics,
  IAiAssessmentAnalytics,
  IPanelAssessmentAnalytics,
  ICandidateAnalytics,
  ITeamMemberAnalytics,
  ICandidateOnboardingAnalytics,
  IJobPostingBasic,
  IAiAssessmentBasic,
  IPanelAssessmentBasic,
  ICandidateApplicationBasic,
  ITeamMemberBasic,
  ICandidateOnboardingBasic,
  OnboardingAssessmentWithRelations,
  PanelAssessmentWithRelations,
  JobPostingWithRelations,
  AiAssessmentWithRelations,
  JobApplicationWithRelations,
  ClientUserWithRelations,
} from '@/shared/models/domain/client/client.admin.analytics.domain';
import { logger } from '@/shared/utils/logger';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';

@singleton
export class ClientAdminAnalyticsService {
  private readonly prisma: PrismaClient;
  private readonly MAX_RECENT_ITEMS = 5;

  constructor() {
    this.prisma = new PrismaClient();
    logger.info('ClientAdminAnalyticsService initialized', {
      context: 'ClientAdminAnalyticsService.constructor',
    });
  }

  /**
   * Get analytics data for a specific client
   * @param clientId The client ID
   * @returns Client analytics data
   */
  async getClientAnalytics(clientId: string): Promise<IClientAnalytics> {
    try {
      logger.info('Fetching client analytics data', {
        context: 'ClientAdminAnalyticsService.getClientAnalytics',
        clientId,
      });

      // Validate client exists
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
        select: { id: true },
      });

      if (!client) {
        throw new AppError('Client not found', 404, ErrorCode.NOT_FOUND);
      }

      const [
        jobPostingAnalytics,
        aiAssessmentAnalytics,
        panelAssessmentAnalytics,
        candidateAnalytics,
        teamMemberAnalytics,
        candidateOnboardingAnalytics,
      ] = await Promise.all([
        this.getJobPostingAnalytics(clientId),
        this.getAiAssessmentAnalytics(clientId),
        this.getPanelAssessmentAnalytics(clientId),
        this.getCandidateAnalytics(clientId),
        this.getTeamMemberAnalytics(clientId),
        this.getCandidateOnboardingAnalytics(clientId),
      ]);

      return {
        activeJobPostings: jobPostingAnalytics,
        aiAssessments: aiAssessmentAnalytics,
        panelAssessment: panelAssessmentAnalytics,
        activeCandidates: candidateAnalytics,
        teamMembers: teamMemberAnalytics,
        candidateOnboarding: candidateOnboardingAnalytics,
      };
    } catch (error) {
      logger.error('Error getting client analytics data', { error, clientId });
      throw error;
    }
  }

  /**
   * Get detailed job posting analytics
   */
  private async getJobPostingAnalytics(
    clientId: string
  ): Promise<IJobPostingAnalytics> {
    try {
      // Get all job postings for this client with optimized query
      const jobPostings = (await this.prisma.job_posting.findMany({
        where: { clientId },
        select: {
          id: true,
          title: true,
          status: true,
          industry: true,
          jobType: true,
          isFeatured: true,
          isRemote: true,
          numberOfApplications: true,
          numberOfViews: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      })) as JobPostingWithRelations[];

      // Count job postings by status using efficient filtering
      const statusCounts = jobPostings.reduce(
        (acc, job) => {
          acc.total++;
          acc[job.status] = (acc[job.status] || 0) + 1;
          return acc;
        },
        { total: 0 } as Record<string, number>
      );

      // Count featured and remote jobs
      const featuredCount = jobPostings.filter((job) => job.isFeatured).length;
      const remoteCount = jobPostings.filter((job) => job.isRemote).length;

      // Group by industry and job type
      const byIndustry: Record<string, number> = {};
      const byJobType: Record<string, number> = {};

      jobPostings.forEach((job) => {
        if (job.industry) {
          byIndustry[job.industry] = (byIndustry[job.industry] || 0) + 1;
        }
        if (job.jobType) {
          byJobType[job.jobType] = (byJobType[job.jobType] || 0) + 1;
        }
      });

      // Get recently added job postings
      const recentlyAdded: IJobPostingBasic[] = jobPostings
        .slice(0, this.MAX_RECENT_ITEMS)
        .map(this.toJobPostingBasicDomain);

      return {
        totalCount: statusCounts.total,
        activeCount: statusCounts.PUBLISHED || 0,
        draftCount: statusCounts.DRAFT || 0,
        closedCount: statusCounts.CLOSED || 0,
        archivedCount: statusCounts.ARCHIVED || 0,
        byIndustry,
        byJobType,
        featuredCount,
        remoteCount,
        recentlyAdded,
      };
    } catch (error) {
      logger.error('Error getting job posting analytics', { error, clientId });
      throw error;
    }
  }

  /**
   * Get detailed AI assessment analytics
   */
  private async getAiAssessmentAnalytics(
    clientId: string
  ): Promise<IAiAssessmentAnalytics> {
    try {
      // Get all AI assessments for this client's job postings with optimized query
      const assessments = (await this.prisma.job_ai_assessment.findMany({
        where: {
          jobApplication: {
            jobPosting: {
              clientId,
            },
          },
        },
        select: {
          id: true,
          status: true,
          result: true,
          score: true,
          startedAt: true,
          completedAt: true,
          createdAt: true,
          candidate: {
            select: {
              id: true,
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
          jobApplication: {
            select: {
              jobPosting: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })) as AiAssessmentWithRelations[];

      // Count assessments by status and result
      const totalCount = assessments.length;
      const completedCount = assessments.filter((assessment) =>
        [
          'ASSESSMENT_COMPLETED',
          'AI_REVIEW_COMPLETED',
          'MANUAL_REVIEW_COMPLETED',
        ].includes(assessment.status)
      ).length;
      const inProgressCount = assessments.filter((assessment) =>
        [
          'AI_INITIALIZATION_IN_PROGRESS',
          'AI_INITIALIZATION_COMPLETED',
          'CANDIDATE_ASSESSMENT_IN_PROGRESS',
          'CANDIDATE_ASSESSMENT_COMPLETED',
          'AI_REVIEW_IN_PROGRESS',
          'MANUAL_REVIEW_IN_PROGRESS',
        ].includes(assessment.status)
      ).length;
      const passedCount = assessments.filter(
        (assessment) => assessment.result === 'PASSED'
      ).length;
      const failedCount = assessments.filter(
        (assessment) =>
          assessment.result &&
          ['AI_REVIEW_FAILED', 'MANUAL_REVIEW_FAILED'].includes(
            assessment.result
          )
      ).length;

      // Group by job posting
      const byJobPosting: Record<string, number> = {};
      assessments.forEach((assessment) => {
        const jobId = assessment.jobApplication?.jobPosting?.id;
        if (jobId) {
          byJobPosting[jobId] = (byJobPosting[jobId] || 0) + 1;
        }
      });

      // Get recent assessments
      const recentAssessments: IAiAssessmentBasic[] = assessments
        .slice(0, this.MAX_RECENT_ITEMS)
        .map(this.toAiAssessmentBasicDomain);

      return {
        totalCount,
        completedCount,
        inProgressCount,
        passedCount,
        failedCount,
        byJobPosting,
        recentAssessments,
      };
    } catch (error) {
      logger.error('Error getting AI assessment analytics', {
        error,
        clientId,
      });
      throw error;
    }
  }

  /**
   * Get detailed panel assessment analytics
   */
  private async getPanelAssessmentAnalytics(
    clientId: string
  ): Promise<IPanelAssessmentAnalytics> {
    try {
      // Get all panel assessments for this client's job postings with optimized query
      const panelAssessments = (await this.prisma.job_panel_assessment.findMany(
        {
          where: {
            jobApplication: {
              jobPosting: {
                clientId,
              },
            },
          },
          select: {
            id: true,
            status: true,
            result: true,
            recommendation: true,
            scheduledDate: true,
            startedAt: true,
            completedAt: true,
            createdAt: true,
            candidate: {
              select: {
                id: true,
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            jobApplication: {
              select: {
                jobPosting: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }
      )) as PanelAssessmentWithRelations[];

      // Count panel assessments by status
      const totalCount = panelAssessments.length;
      const pendingCount = panelAssessments.filter((assessment) =>
        ['NOT_STARTED', 'INVITATION_SENT'].includes(assessment.status)
      ).length;
      const scheduledCount = panelAssessments.filter((assessment) =>
        ['SLOT_SELECTED', 'MEETING_SCHEDULED'].includes(assessment.status)
      ).length;
      const completedCount = panelAssessments.filter((assessment) =>
        ['COMPLETED', 'FAILED'].includes(assessment.status)
      ).length;

      // Count by job posting
      const byJobPosting: Record<string, number> = {};
      panelAssessments.forEach((assessment) => {
        if (assessment.jobApplication?.jobPosting) {
          const jobId = assessment.jobApplication.jobPosting.id;
          byJobPosting[jobId] = (byJobPosting[jobId] || 0) + 1;
        }
      });

      // Get pending panel assessments
      const pendingAssessments: IPanelAssessmentBasic[] = panelAssessments
        .filter((assessment) =>
          ['NOT_STARTED', 'INVITATION_SENT'].includes(assessment.status)
        )
        .slice(0, this.MAX_RECENT_ITEMS)
        .map(this.toPanelAssessmentBasicDomain);

      return {
        totalCount,
        pendingCount,
        scheduledCount,
        completedCount,
        byJobPosting,
        pendingAssessments,
      };
    } catch (error) {
      logger.error('Error getting panel assessment analytics', {
        error,
        clientId,
      });
      throw error;
    }
  }

  /**
   * Get detailed candidate analytics
   */
  private async getCandidateAnalytics(
    clientId: string
  ): Promise<ICandidateAnalytics> {
    try {
      // Get all applications for this client's job postings with optimized query
      const applications = (await this.prisma.job_application.findMany({
        where: {
          jobPosting: {
            clientId,
          },
        },
        select: {
          id: true,
          appliedAt: true,
          status: true,
          candidate: {
            select: {
              id: true,
              user: {
                select: {
                  name: true,
                  status: true,
                },
              },
            },
          },
          jobPosting: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { appliedAt: 'desc' },
      })) as JobApplicationWithRelations[];

      // Get unique candidates
      const uniqueCandidateIds = new Set<string>();
      const activeCandidateIds = new Set<string>();
      applications.forEach((app) => {
        if (app.candidate) {
          uniqueCandidateIds.add(app.candidate.id);
          if (app.candidate.user?.status === 'ACTIVE') {
            activeCandidateIds.add(app.candidate.id);
          }
        }
      });

      // Count by job posting
      const byJobPosting: Record<string, number> = {};
      applications.forEach((app) => {
        if (app.jobPosting) {
          byJobPosting[app.jobPosting.id] =
            (byJobPosting[app.jobPosting.id] || 0) + 1;
        }
      });

      // Get recent applications
      const recentApplications: ICandidateApplicationBasic[] = applications
        .slice(0, this.MAX_RECENT_ITEMS)
        .map(this.toCandidateApplicationBasicDomain);

      return {
        totalCount: uniqueCandidateIds.size,
        activeCount: activeCandidateIds.size,
        byJobPosting,
        recentApplications,
      };
    } catch (error) {
      logger.error('Error getting candidate analytics', { error, clientId });
      throw error;
    }
  }

  /**
   * Get detailed team member analytics
   */
  private async getTeamMemberAnalytics(
    clientId: string
  ): Promise<ITeamMemberAnalytics> {
    try {
      // Get all client users with their roles with optimized query
      const clientUsers = (await this.prisma.client_user.findMany({
        where: { clientId },
        select: {
          id: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })) as ClientUserWithRelations[];

      const totalCount = clientUsers.length;
      const activeCount = clientUsers.filter(
        (user) => user.user?.status === 'ACTIVE'
      ).length;
      const inactiveCount = totalCount - activeCount;

      // Count by role
      const byRole = {
        admin: 0,
        hr: 0,
        recruiter: 0,
        accounts: 0,
        other: 0,
      };

      clientUsers.forEach((user) => {
        if (user.user) {
          const role = user.user.role.toLowerCase();
          if (role === 'admin') {
            byRole.admin++;
          } else if (role === 'hr') {
            byRole.hr++;
          } else if (role === 'recruiter') {
            byRole.recruiter++;
          } else if (role === 'accounts') {
            byRole.accounts++;
          } else {
            byRole.other++;
          }
        }
      });

      // Get recently added team members
      const recentlyAdded: ITeamMemberBasic[] = clientUsers
        .slice(0, this.MAX_RECENT_ITEMS)
        .map(this.toTeamMemberBasicDomain);

      return {
        totalCount,
        byRole,
        activeCount,
        inactiveCount,
        recentlyAdded,
      };
    } catch (error) {
      logger.error('Error getting team member analytics', { error, clientId });
      throw error;
    }
  }

  /**
   * Get detailed candidate onboarding analytics
   */
  private async getCandidateOnboardingAnalytics(
    clientId: string
  ): Promise<ICandidateOnboardingAnalytics> {
    try {
      // Get all onboarding assessments for candidates who applied to this client's jobs
      const onboardingAssessments =
        await this.prisma.onboarding_assessment.findMany({
          where: {
            candidate: {
              applications: {
                some: {
                  jobPosting: {
                    clientId,
                  },
                },
              },
            },
          },
          select: {
            id: true,
            status: true,
            score: true,
            startedAt: true,
            completedAt: true,
            createdAt: true,
            candidate: {
              select: {
                id: true,
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

      // Calculate statistics
      const totalCount = onboardingAssessments.length;
      const completedCount = onboardingAssessments.filter((assessment) =>
        ['ASSESSMENT_COMPLETED'].includes(assessment.status)
      ).length;
      const inProgressCount = onboardingAssessments.filter((assessment) =>
        [
          'AI_INITIALIZATION_IN_PROGRESS',
          'AI_INITIALIZATION_COMPLETED',
          'CANDIDATE_ASSESSMENT_IN_PROGRESS',
          'CANDIDATE_ASSESSMENT_COMPLETED',
          'AI_REVIEW_IN_PROGRESS',
          'AI_REVIEW_COMPLETED',
          'MANUAL_REVIEW_IN_PROGRESS',
        ].includes(assessment.status)
      ).length;
      const pendingCount = onboardingAssessments.filter((assessment) =>
        ['NOT_STARTED'].includes(assessment.status)
      ).length;

      // Count by status
      const byStatus: Record<string, number> = {};
      onboardingAssessments.forEach((assessment) => {
        byStatus[assessment.status] = (byStatus[assessment.status] || 0) + 1;
      });

      // Get recent onboarding assessments
      const recentOnboarding: ICandidateOnboardingBasic[] =
        onboardingAssessments
          .slice(0, this.MAX_RECENT_ITEMS)
          .map(this.toCandidateOnboardingBasicDomain);

      return {
        totalCount,
        completedCount,
        inProgressCount,
        pendingCount,
        byStatus,
        recentOnboarding,
      };
    } catch (error) {
      logger.error('Error getting candidate onboarding analytics', {
        error,
        clientId,
      });
      throw error;
    }
  }

  // Domain mapping functions
  private toJobPostingBasicDomain(
    job: JobPostingWithRelations
  ): IJobPostingBasic {
    return {
      id: job.id,
      title: job.title,
      status: job.status,
      createdAt: job.createdAt,
      numberOfApplications: job.numberOfApplications,
      numberOfViews: job.numberOfViews,
    };
  }

  private toAiAssessmentBasicDomain(
    assessment: AiAssessmentWithRelations
  ): IAiAssessmentBasic {
    return {
      id: assessment.id,
      candidateId: assessment.candidate?.id || '',
      candidateName: assessment.candidate?.user?.name || 'Unknown',
      jobPostingId: assessment.jobApplication?.jobPosting?.id || '',
      jobTitle: assessment.jobApplication?.jobPosting?.title || 'Unknown',
      status: assessment.status,
      score: assessment.score || 0,
      startedAt: assessment.startedAt || assessment.createdAt,
      completedAt: assessment.completedAt || undefined,
    };
  }

  private toPanelAssessmentBasicDomain(
    assessment: PanelAssessmentWithRelations
  ): IPanelAssessmentBasic {
    return {
      id: assessment.id,
      candidateId: assessment.candidate?.id || '',
      candidateName: assessment.candidate?.user?.name || 'Unknown',
      jobPostingId: assessment.jobApplication?.jobPosting?.id || '',
      jobTitle: assessment.jobApplication?.jobPosting?.title || 'Unknown',
      status: assessment.status,
      scheduledDate: assessment.scheduledDate || undefined,
      startedAt: assessment.startedAt || undefined,
      completedAt: assessment.completedAt || undefined,
    };
  }

  private toCandidateApplicationBasicDomain(
    application: JobApplicationWithRelations
  ): ICandidateApplicationBasic {
    return {
      id: application.id,
      candidateId: application.candidate?.id || '',
      candidateName: application.candidate?.user?.name || 'Unknown',
      jobPostingId: application.jobPosting?.id || '',
      jobTitle: application.jobPosting?.title || 'Unknown',
      status: application.status,
      appliedAt: application.appliedAt,
    };
  }

  private toTeamMemberBasicDomain(
    clientUser: ClientUserWithRelations
  ): ITeamMemberBasic {
    return {
      id: clientUser.id,
      userId: clientUser.user?.id || '',
      name: clientUser.user?.name || 'Unknown',
      email: clientUser.user?.email || 'Unknown',
      role: clientUser.user?.role || 'Unknown',
      status: clientUser.user?.status || 'Unknown',
      createdAt: clientUser.createdAt,
    };
  }

  private toCandidateOnboardingBasicDomain(
    assessment: OnboardingAssessmentWithRelations
  ): ICandidateOnboardingBasic {
    return {
      id: assessment.id,
      candidateId: assessment.candidate?.id || '',
      candidateName: assessment.candidate?.user?.name || 'Unknown',
      status: assessment.status,
      score: assessment.score || 0,
      startedAt: assessment.startedAt || undefined,
      completedAt: assessment.completedAt || undefined,
    };
  }
}
