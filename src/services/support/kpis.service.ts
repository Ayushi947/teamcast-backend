import { PrismaClient } from '@prisma/client';
import { singleton } from '@/shared/decorators/singleton';
import {
  ISupportCandidateKpis,
  ISupportCandidateKpisFilterOptions,
  IAccountManagerInfo,
  IRecruiterInfo,
  IPartnerFilterOption,
  ISupportCandidateKpisExport,
  ICandidateExportData,
} from '@/shared/models/domain/support/kpis.domain';
import { ISupportCandidateKpisFilterQuery } from '@/shared/models/api/support/kpis.api';
import { logger } from '@/shared/utils/logger';
import {
  UserRoleEnum,
  CandidateStatusEnum,
  CandidateJobSearchStatusEnum,
  CandidateAssessmentStageEnum,
  CandidateResumeAssessmentStatusEnum,
  CandidateOnboardingAssessmentStatusEnum,
  CandidateShortlistStatusEnum,
  ResumeAssessmentResultEnum,
  OnboardingAssessmentResultEnum,
  OnboardingAssessmentRecommendationEnum,
  JobAiAssessmentStatusEnum,
  JobAiAssessmentResultEnum,
  JobAiAssessmentRecommendationEnum,
  SupportInvitationTypeEnum,
  SupportInvitationStatusEnum,
  PartnerUserInvitationStatusEnum,
  JobInviteStatusEnum,
  JobAssessmentInviteStatusEnum,
  CandidateSubscriptionStatusEnum,
  UserStatusEnum,
  JobPostingRecruiterAssignmentStatusEnum,
} from '@/shared/models/common/enums';

// Constants for filter types
const FILTER_TYPES = {
  ALL: 'all',
  USER_SIGNUP: 'user_signup',
  SUPPORT_INVITATIONS: 'support_invitations',
  PARTNER_INVITATIONS: 'partner_invitations',
  JOB_INVITATIONS: 'job_invitations',
  JOB_AI_ASSESSMENT_INVITATIONS: 'job_ai_assessment_invitations',
} as const;

// Constants for filter prefixes
const FILTER_PREFIXES = {
  RECRUITER: 'recruiter',
  HR: 'hr',
  ACCOUNT_MANAGER: 'account_manager',
  PARTNER: 'partner',
} as const;

// Constants for traditional filters array
const TRADITIONAL_FILTERS = [
  FILTER_TYPES.USER_SIGNUP,
  FILTER_TYPES.SUPPORT_INVITATIONS,
  FILTER_TYPES.PARTNER_INVITATIONS,
  FILTER_TYPES.JOB_INVITATIONS,
  FILTER_TYPES.JOB_AI_ASSESSMENT_INVITATIONS,
] as const;

@singleton
export class SupportKpisService {
  private readonly prisma: PrismaClient;
  private currentFilter?: ISupportCandidateKpisFilterQuery;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Enhanced filter parser for candidate KPIs
   * Supports traditional filters and ID-based filters with multiple IDs
   */
  private parseFilterBy(filterBy: string) {
    const filters = filterBy.split(',').map((f) => f.trim());
    const result = {
      traditional: [] as string[],
      recruiter: [] as string[],
      hr: [] as string[],
      accountManager: [] as string[],
      partner: [] as string[],
    };

    for (const filter of filters) {
      if (filter.includes(':')) {
        const [type, ids] = filter.split(':');
        const idList = ids.split(',').map((id) => id.trim());

        switch (type) {
          case FILTER_PREFIXES.RECRUITER:
            result.recruiter.push(...idList);
            break;
          case FILTER_PREFIXES.HR:
            result.hr.push(...idList);
            break;
          case FILTER_PREFIXES.ACCOUNT_MANAGER:
            result.accountManager.push(...idList);
            break;
          case FILTER_PREFIXES.PARTNER:
            result.partner.push(...idList);
            break;
          default:
            // If unknown type with colon, treat as traditional filter
            result.traditional.push(filter);
        }
      } else {
        result.traditional.push(filter);
      }
    }

    return result;
  }

  /**
   * Build enhanced where clause for candidate filtering
   * Supports traditional filters and ID-based filters
   */
  private buildWhereClause(filter?: ISupportCandidateKpisFilterQuery) {
    const dateFilter: any = {};
    if (filter?.startDate) {
      dateFilter.gte = new Date(filter.startDate);
    }
    if (filter?.endDate) {
      dateFilter.lte = new Date(filter.endDate);
    }
    const hasDateFilters = filter?.startDate || filter?.endDate;

    const filterBy = filter?.filterBy || FILTER_TYPES.ALL;
    const parsedFilters = this.parseFilterBy(filterBy);

    // Build candidate filter based on traditional filters and ID-based filters
    let candidateFilter: any = {};

    // Handle traditional filters properly
    const hasTraditionalFilters = parsedFilters.traditional.length > 0;
    const hasSupportInvitationsFilter = parsedFilters.traditional.includes(
      FILTER_TYPES.SUPPORT_INVITATIONS
    );
    const hasPartnerInvitationsFilter = parsedFilters.traditional.includes(
      FILTER_TYPES.PARTNER_INVITATIONS
    );
    const hasJobInvitationsFilter = parsedFilters.traditional.includes(
      FILTER_TYPES.JOB_INVITATIONS
    );
    const hasJobAiAssessmentInvitationsFilter =
      parsedFilters.traditional.includes(
        FILTER_TYPES.JOB_AI_ASSESSMENT_INVITATIONS
      );

    // If no traditional filters or 'all' is specified, get all candidates
    if (
      !hasTraditionalFilters ||
      parsedFilters.traditional.includes(FILTER_TYPES.ALL)
    ) {
      // Apply date filter to user signup if dates are provided
      if (hasDateFilters) {
        candidateFilter.user = { createdAt: dateFilter };
      }
    } else {
      // Apply specific traditional filters
      if (
        parsedFilters.traditional.includes(FILTER_TYPES.USER_SIGNUP) &&
        hasDateFilters
      ) {
        candidateFilter.user = { createdAt: dateFilter };
      }

      // For invitation-based filters, we need to ensure we get candidates that have these invitations
      // We'll handle this by getting all candidates and filtering in calculateStats
      // But we need to ensure the invitation queries are not date-filtered when we're doing invitation-based filtering
    }

    // Apply ID-based filters to candidate
    const candidateIdFilters: any[] = [];

    // Recruiter filter: Find candidates through job posting recruiter assignments
    if (parsedFilters.recruiter.length > 0) {
      candidateIdFilters.push({
        applications: {
          some: {
            jobPosting: {
              recruiterAssignments: {
                some: {
                  recruiterId: { in: parsedFilters.recruiter },
                  status: JobPostingRecruiterAssignmentStatusEnum.ACTIVE,
                },
              },
            },
          },
        },
      });
    }

    // HR filter: Find candidates through support user assignments (assuming HR is a role)
    if (parsedFilters.hr.length > 0) {
      candidateIdFilters.push({
        OR: [
          { createdBy: { in: parsedFilters.hr } },
          { updatedBy: { in: parsedFilters.hr } },
        ],
      });
    }

    // Account Manager filter: Find candidates through account manager assignments
    if (parsedFilters.accountManager.length > 0) {
      candidateIdFilters.push({
        applications: {
          some: {
            jobPosting: {
              client: {
                accountManagerAssignments: {
                  some: {
                    accountManagerId: { in: parsedFilters.accountManager },
                  },
                },
              },
            },
          },
        },
      });
    }

    // Partner filter: Direct relationship
    if (parsedFilters.partner.length > 0) {
      candidateIdFilters.push({
        partnerId: { in: parsedFilters.partner },
      });
    }

    // Combine all ID-based filters with OR logic
    if (candidateIdFilters.length > 0) {
      if (Object.keys(candidateFilter).length > 0) {
        // If we have both traditional and ID-based filters, combine with AND
        candidateFilter.AND = [candidateFilter, { OR: candidateIdFilters }];
        // Clear the original filter since we're using AND
        candidateFilter = candidateFilter.AND[0];
        candidateFilter.AND = candidateFilter.AND[1];
      } else {
        // Only ID-based filters, use OR
        candidateFilter.OR = candidateIdFilters;
      }
    }

    // Build invitation filters based on traditional filters
    // For invitation-based filtering, we should apply date filters to invitations
    // to ensure we only get candidates with invitations in the specified date range
    const supportInvitationFilter =
      hasSupportInvitationsFilter && hasDateFilters
        ? { createdAt: dateFilter }
        : hasDateFilters
          ? { createdAt: dateFilter }
          : {};
    const partnerInvitationFilter =
      hasPartnerInvitationsFilter && hasDateFilters
        ? { createdAt: dateFilter }
        : hasDateFilters
          ? { createdAt: dateFilter }
          : {};
    const jobInviteFilter =
      hasJobInvitationsFilter && hasDateFilters
        ? { createdAt: dateFilter }
        : hasDateFilters
          ? { createdAt: dateFilter }
          : {};
    const jobAiAssessmentInvitationFilter =
      hasJobAiAssessmentInvitationsFilter && hasDateFilters
        ? { createdAt: dateFilter }
        : hasDateFilters
          ? { createdAt: dateFilter }
          : {};

    return {
      candidate: candidateFilter,
      supportInvitation: supportInvitationFilter,
      partnerInvitation: partnerInvitationFilter,
      jobInvite: jobInviteFilter,
      jobAiAssessmentInvitation: jobAiAssessmentInvitationFilter,
    };
  }

  async getCandidateKpis(
    filter?: ISupportCandidateKpisFilterQuery
  ): Promise<ISupportCandidateKpis> {
    try {
      this.currentFilter = filter;
      const whereClause = this.buildWhereClause(filter);
      const filterBy = filter?.filterBy || FILTER_TYPES.ALL;
      const parsedFilters = this.parseFilterBy(filterBy);

      // First, get all invitations
      const [
        supportInvitations,
        partnerInvitations,
        jobInvites,
        jobAiAssessmentInvitations,
      ] = await Promise.all([
        this.prisma.support_invitation.findMany({
          where: {
            type: SupportInvitationTypeEnum.CANDIDATE,
            ...whereClause.supportInvitation,
          },
          select: {
            id: true,
            email: true,
            status: true,
            createdAt: true,
            candidateId: true,
          },
        }),
        this.prisma.partner_user_invitation.findMany({
          where: {
            role: UserRoleEnum.PARTNER_RESOURCE,
            ...whereClause.partnerInvitation,
          },
          select: { id: true, email: true, status: true, createdAt: true },
        }),
        this.prisma.job_invite.findMany({
          where: whereClause.jobInvite,
          select: {
            id: true,
            email: true,
            status: true,
            createdAt: true,
          },
        }),
        this.prisma.job_ai_assessment_invitation.findMany({
          where: whereClause.jobAiAssessmentInvitation,
          select: {
            id: true,
            candidateId: true,
            status: true,
            createdAt: true,
          },
        }),
      ]);

      // Determine which candidates we need based on filter type
      let candidateWhereClause = whereClause.candidate;

      // If we have invitation-based filters, we need to get candidates that have these invitations
      if (
        parsedFilters.traditional.includes('support_invitations') ||
        parsedFilters.traditional.includes('partner_invitations') ||
        parsedFilters.traditional.includes('job_invitations') ||
        parsedFilters.traditional.includes('job_ai_assessment_invitations')
      ) {
        const candidateIdsFromInvitations = new Set<string>();

        // Add candidate IDs from support invitations
        if (parsedFilters.traditional.includes('support_invitations')) {
          supportInvitations.forEach((inv) => {
            if (inv.candidateId) {
              candidateIdsFromInvitations.add(inv.candidateId);
            }
          });
        }

        // Add candidate IDs from partner invitations (by email)
        if (parsedFilters.traditional.includes('partner_invitations')) {
          const partnerEmails = partnerInvitations.map((inv) => inv.email);
          if (partnerEmails.length > 0) {
            const candidatesWithPartnerInvitations =
              await this.prisma.candidate.findMany({
                where: {
                  user: {
                    email: { in: partnerEmails },
                  },
                },
                select: { id: true },
              });
            candidatesWithPartnerInvitations.forEach((c) =>
              candidateIdsFromInvitations.add(c.id)
            );
          }
        }

        // Add candidate IDs from job invites (by email)
        if (parsedFilters.traditional.includes('job_invitations')) {
          const jobInviteEmails = jobInvites.map((inv) => inv.email);
          if (jobInviteEmails.length > 0) {
            const candidatesWithJobInvites =
              await this.prisma.candidate.findMany({
                where: {
                  user: {
                    email: { in: jobInviteEmails },
                  },
                },
                select: { id: true },
              });
            candidatesWithJobInvites.forEach((c) =>
              candidateIdsFromInvitations.add(c.id)
            );
          }
        }

        // Add candidate IDs from job AI assessment invitations
        if (
          parsedFilters.traditional.includes('job_ai_assessment_invitations')
        ) {
          jobAiAssessmentInvitations.forEach((inv) => {
            candidateIdsFromInvitations.add(inv.candidateId);
          });
        }

        // Update candidate where clause to only get candidates with invitations
        if (candidateIdsFromInvitations.size > 0) {
          candidateWhereClause = {
            ...candidateWhereClause,
            id: { in: Array.from(candidateIdsFromInvitations) },
          };
        } else {
          // No invitations found, return empty result
          return this.calculateStats(
            [],
            supportInvitations,
            partnerInvitations,
            jobInvites,
            jobAiAssessmentInvitations
          );
        }
      }

      // Now get candidates with the updated where clause
      const candidates = await this.prisma.candidate.findMany({
        where: candidateWhereClause,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              status: true,
              createdAt: true,
            },
          },
          resumeAssessments: {
            select: { id: true, result: true, recommendation: true },
          },
          onboardingAssessments: {
            select: { id: true, result: true, recommendation: true },
          },
          jobAiAssessments: {
            select: {
              id: true,
              status: true,
              result: true,
              recommendation: true,
            },
          },
          shortlists: { select: { id: true, status: true } },
          savedJobs: { select: { id: true } },
          views: { select: { id: true } },
          applications: { select: { id: true } },
          recommendationsReceived: {
            select: {
              id: true,
              isViewed: true,
              isSaved: true,
              isInvited: true,
            },
          },
          practiceAssessments: { select: { id: true } },
          candidateSubscription: {
            select: {
              status: true,
              assessmentsUsedThisMonth: true,
              practiceAssessmentsUsed: true,
            },
          },
        },
      });

      return this.calculateStats(
        candidates,
        supportInvitations,
        partnerInvitations,
        jobInvites,
        jobAiAssessmentInvitations
      );
    } catch (error) {
      logger.error({
        message: 'Failed to get candidate KPIs',
        context: 'SupportKpisService.getCandidateKpis',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Export candidate KPIs data as CSV
   */
  async exportCandidateKpis(
    filter?: ISupportCandidateKpisFilterQuery
  ): Promise<ISupportCandidateKpisExport> {
    try {
      this.currentFilter = filter;
      const whereClause = this.buildWhereClause(filter);
      const filterBy = filter?.filterBy || FILTER_TYPES.ALL;
      const parsedFilters = this.parseFilterBy(filterBy);

      // Get candidates with all necessary relations for export
      const candidates = await this.prisma.candidate.findMany({
        where: whereClause.candidate,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              status: true,
              createdAt: true,
            },
          },
          partner: {
            select: {
              id: true,
              company: {
                select: {
                  name: true,
                },
              },
            },
          },
          applications: {
            select: {
              id: true,
              jobPosting: {
                select: {
                  title: true,
                },
              },
            },
          },
          shortlists: {
            select: { id: true },
          },
          candidateSubscription: {
            select: {
              status: true,
              assessmentsUsedThisMonth: true,
              practiceAssessmentsUsed: true,
            },
          },
          supportInvitations: {
            select: {
              createdAt: true,
              acceptedAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1, // Get the most recent invitation
          },
          jobAiAssessmentInvitations: {
            select: {
              jobApplication: {
                select: {
                  jobPosting: {
                    select: {
                      title: true,
                    },
                  },
                },
              },
            },
          },
          resumeAssessments: {
            select: {
              status: true,
              result: true,
              score: true,
              recommendation: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1, // Get the most recent resume assessment
          },
          onboardingAssessments: {
            select: {
              status: true,
              result: true,
              score: true,
              recommendation: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1, // Get the most recent onboarding assessment
          },
        },
        orderBy: {
          user: {
            createdAt: 'desc',
          },
        },
      });

      // Transform candidates to export data
      const exportData: ICandidateExportData[] = candidates.map(
        (candidate: any) => {
          // Get the most recent support invitation
          const latestSupportInvitation = candidate.supportInvitations?.[0];

          // Get applied job posting names
          const appliedJobPostings =
            candidate.applications
              ?.map((app: any) => app.jobPosting?.title || '')
              .filter(Boolean) || [];

          // Get invited job posting names
          const invitedJobPostings =
            candidate.jobAiAssessmentInvitations
              ?.map((inv: any) => inv.jobApplication?.jobPosting?.title || '')
              .filter(Boolean) || [];

          // Get the most recent resume assessment
          const latestResumeAssessment = candidate.resumeAssessments?.[0];

          // Get the most recent onboarding assessment
          const latestOnboardingAssessment =
            candidate.onboardingAssessments?.[0];

          return {
            candidateId: candidate.id,
            userId: candidate.user?.id || '',
            name: candidate.user?.name || '',
            email: candidate.user?.email || '',
            status: candidate.status,
            signupDate: candidate.user?.createdAt?.toISOString() || '',
            partnerId: candidate.partner?.id,
            partnerName: candidate.partner?.company?.name,
            profileCompletion: candidate.completionPercentage || 0,
            resumeAssessmentStatus: candidate.resumeAssessmentStatus,
            onboardingAssessmentStatus: candidate.onboardingAssessmentStatus,
            totalApplications: candidate.applications?.length || 0,
            totalShortlists: candidate.shortlists?.length || 0,
            subscriptionStatus: candidate.candidateSubscription?.status,
            assessmentsUsed:
              candidate.candidateSubscription?.assessmentsUsedThisMonth || 0,
            practiceAssessmentsUsed:
              candidate.candidateSubscription?.practiceAssessmentsUsed || 0,
            lastActivity: candidate.updatedAt?.toISOString() || '',
            supportInviteDate:
              latestSupportInvitation?.createdAt?.toISOString(),
            supportInviteAcceptedDate:
              latestSupportInvitation?.acceptedAt?.toISOString(),
            appliedJobPostings,
            invitedJobPostings,
            profilePublished: candidate.isPublished || false,
            aiReviewCompleted:
              latestResumeAssessment?.status === 'AI_REVIEW_COMPLETED' || false,
            resumeAssessmentResult: latestResumeAssessment?.result || undefined,
            resumeAssessmentScore: latestResumeAssessment?.score || undefined,
            resumeAssessmentRecommendation:
              latestResumeAssessment?.recommendation || undefined,
            onboardingAssessmentResult:
              latestOnboardingAssessment?.result || undefined,
            onboardingAssessmentScore:
              latestOnboardingAssessment?.score || undefined,
            onboardingAssessmentRecommendation:
              latestOnboardingAssessment?.recommendation || undefined,
          };
        }
      );

      // Generate CSV data
      const csvData = this.generateCsvData(exportData);
      const filename = await this.generateExportFilename(
        filter,
        parsedFilters,
        exportData.length
      );

      return {
        filename,
        csvData: Buffer.from(csvData).toString('base64'),
        totalCandidates: exportData.length,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to export candidate KPIs',
        context: 'SupportKpisService.exportCandidateKpis',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Generate CSV data from candidate export data
   */
  private generateCsvData(data: ICandidateExportData[]): string {
    if (data.length === 0) {
      return '';
    }

    // Define CSV headers - Reorganized for better readability
    const headers = [
      'Candidate ID',
      'User ID',
      'Name',
      'Email',
      'Status',
      'Signup Date',
      'Last Activity',
      'Profile Completion (%)',
      'Profile Published',
      'Partner ID',
      'Partner Name',
      'Resume Assessment Status',
      'Resume Assessment Result',
      'Resume Assessment Score',
      'Resume Assessment Recommendation',
      'AI Review Completed',
      'Onboarding Assessment Status',
      'Onboarding Assessment Result',
      'Onboarding Assessment Score',
      'Onboarding Assessment Recommendation',
      'Total Applications',
      'Applied Job Postings',
      'Total Shortlists',
      'Invited Job Postings',
      'Support Invite Date',
      'Support Invite Accepted Date',
      'Subscription Status',
      'Assessments Used',
      'Practice Assessments Used',
    ];

    // Generate CSV rows - Reorganized to match new header order
    const rows = data.map((candidate) => [
      candidate.candidateId,
      candidate.userId,
      candidate.name,
      candidate.email,
      candidate.status,
      candidate.signupDate,
      candidate.lastActivity,
      candidate.profileCompletion,
      candidate.profilePublished ? 'Yes' : 'No',
      candidate.partnerId || '',
      candidate.partnerName || '',
      candidate.resumeAssessmentStatus,
      candidate.resumeAssessmentResult || '',
      candidate.resumeAssessmentScore || '',
      candidate.resumeAssessmentRecommendation || '',
      candidate.aiReviewCompleted ? 'Yes' : 'No',
      candidate.onboardingAssessmentStatus,
      candidate.onboardingAssessmentResult || '',
      candidate.onboardingAssessmentScore || '',
      candidate.onboardingAssessmentRecommendation || '',
      candidate.totalApplications,
      candidate.appliedJobPostings.join('; '),
      candidate.totalShortlists,
      candidate.invitedJobPostings.join('; '),
      candidate.supportInviteDate || '',
      candidate.supportInviteAcceptedDate || '',
      candidate.subscriptionStatus || '',
      candidate.assessmentsUsed,
      candidate.practiceAssessmentsUsed,
    ]);

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');

    return csvContent;
  }

  /**
   * Generate export filename with filter information
   */
  private generateExportFilename(
    filter?: ISupportCandidateKpisFilterQuery,
    parsedFilters?: any,
    totalCandidates?: number
  ): Promise<string> {
    return new Promise((resolve) => {
      (async () => {
        const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const time = new Date()
          .toISOString()
          .split('T')[1]
          .split('.')[0]
          .replace(/:/g, '-'); // HH-MM-SS

        let filename = `support-kpis-${timestamp}-${time}`;

        // Add filter information to filename
        if (filter?.startDate && filter?.endDate) {
          const startDate = new Date(filter.startDate)
            .toISOString()
            .split('T')[0];
          const endDate = new Date(filter.endDate).toISOString().split('T')[0];
          filename += `-${startDate}-to-${endDate}`;
        }

        if (parsedFilters) {
          const filterParts = [];

          if (
            parsedFilters.traditional.length > 0 &&
            !parsedFilters.traditional.includes('all')
          ) {
            filterParts.push(parsedFilters.traditional.join('-'));
          }

          // Get actual filter names for better filename
          if (parsedFilters.accountManager.length > 0) {
            const accountManagerNames = await this.getAccountManagerNames(
              parsedFilters.accountManager
            );
            filterParts.push(
              `account-managers-${accountManagerNames.join('-')}`
            );
          }

          if (parsedFilters.recruiter.length > 0) {
            const recruiterNames = await this.getRecruiterNames(
              parsedFilters.recruiter
            );
            filterParts.push(`recruiters-${recruiterNames.join('-')}`);
          }

          if (parsedFilters.partner.length > 0) {
            const partnerNames = await this.getPartnerNames(
              parsedFilters.partner
            );
            filterParts.push(`partners-${partnerNames.join('-')}`);
          }

          if (filterParts.length > 0) {
            filename += `-${filterParts.join('-')}`;
          }
        }

        if (totalCandidates !== undefined) {
          filename += `-${totalCandidates}-candidates`;
        }

        resolve(`${filename}.csv`);
      })();
    });
  }

  /**
   * Get account manager names by IDs
   */
  private async getAccountManagerNames(
    accountManagerIds: string[]
  ): Promise<string[]> {
    try {
      const accountManagers = await this.prisma.support_user.findMany({
        where: {
          id: { in: accountManagerIds },
        },
        select: {
          user: {
            select: {
              name: true,
            },
          },
        },
      });

      return accountManagers.map((am) => am.user.name.replace(/\s+/g, '-'));
    } catch (_error) {
      return accountManagerIds;
    }
  }

  /**
   * Get recruiter names by IDs
   */
  private async getRecruiterNames(recruiterIds: string[]): Promise<string[]> {
    try {
      const recruiters = await this.prisma.support_user.findMany({
        where: {
          id: { in: recruiterIds },
        },
        select: {
          user: {
            select: {
              name: true,
            },
          },
        },
      });

      return recruiters.map((rec) => rec.user.name.replace(/\s+/g, '-'));
    } catch (_error) {
      return recruiterIds;
    }
  }

  /**
   * Get partner names by IDs
   */
  private async getPartnerNames(partnerIds: string[]): Promise<string[]> {
    try {
      const partners = await this.prisma.partner.findMany({
        where: {
          id: { in: partnerIds },
        },
        select: {
          company: {
            select: {
              name: true,
            },
          },
        },
      });

      return partners.map((partner) =>
        partner.company.name.replace(/\s+/g, '-')
      );
    } catch (_error) {
      return partnerIds;
    }
  }

  /**
   * Get comprehensive filter options for candidate KPIs
   * Returns all available filters with hierarchical relationships
   */
  async getFilterOptions(): Promise<ISupportCandidateKpisFilterOptions> {
    try {
      const [accountManagersWithRecruiters, unassignedRecruiters, partners] =
        await Promise.all([
          this.getAccountManagersWithRecruiters(),
          this.getUnassignedRecruiters(),
          this.getPartners(),
        ]);

      const result = {
        supportTeam: {
          accountManagers: accountManagersWithRecruiters,
          unassignedRecruiters,
        },
        partners,
        traditionalFilters: Array.from(TRADITIONAL_FILTERS),
      };
      return result;
    } catch (error) {
      logger.error('Failed to fetch filter options', {
        context: 'SupportKpisService.getFilterOptions',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Get partners with their statistics
   */
  private async getPartners(): Promise<IPartnerFilterOption[]> {
    try {
      const partners = await this.prisma.partner.findMany({
        include: {
          company: true,
          candidates: true,
        },
      });

      const result = partners.map((partner) => ({
        id: partner.id,
        name: partner.company.name,
        email: partner.company.contactEmail || '',
        companyName: partner.company.name,
        managedCandidates: partner.candidates.length,
      }));

      return result;
    } catch (error) {
      logger.error('Failed to fetch partners', {
        context: 'SupportKpisService.getPartners',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get account managers with their assigned recruiters
   */
  private async getAccountManagersWithRecruiters(): Promise<
    IAccountManagerInfo[]
  > {
    try {
      const accountManagers = await this.prisma.support_user.findMany({
        where: {
          user: {
            role: UserRoleEnum.ACCOUNT_MANAGER,
            status: UserStatusEnum.ACTIVE,
          },
        },
        include: {
          user: true,
          accountManagerFor: {
            include: {
              supportUser: {
                include: {
                  user: true,
                  recruiterAssignments: {
                    where: {
                      status: JobPostingRecruiterAssignmentStatusEnum.ACTIVE,
                    },
                  },
                },
              },
            },
          },
          clientAccountManagerAssignments: true,
        },
      });

      const result = accountManagers.map((accountManager) => {
        const recruiters = accountManager.accountManagerFor.map(
          (assignment) => ({
            id: assignment.supportUser.id,
            name: assignment.supportUser.user.name,
            email: assignment.supportUser.user.email,
            activeJobPostings:
              assignment.supportUser.recruiterAssignments.length,
          })
        );

        return {
          id: accountManager.id,
          name: accountManager.user.name,
          email: accountManager.user.email,
          assignedClients:
            accountManager.clientAccountManagerAssignments.length,
          recruiters,
        };
      });

      return result;
    } catch (error) {
      logger.error('Failed to fetch account managers with recruiters', {
        context: 'SupportKpisService.getAccountManagersWithRecruiters',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private async getUnassignedRecruiters(): Promise<IRecruiterInfo[]> {
    try {
      const unassignedRecruiters = await this.prisma.support_user.findMany({
        where: {
          user: {
            role: UserRoleEnum.RECRUITER,
            status: UserStatusEnum.ACTIVE,
          },
          accountManagerAssignments: {
            none: {},
          },
        },
        include: {
          user: true,
          recruiterAssignments: {
            where: {
              status: JobPostingRecruiterAssignmentStatusEnum.ACTIVE,
            },
          },
        },
      });

      const result = unassignedRecruiters.map((recruiter) => ({
        id: recruiter.id,
        name: recruiter.user.name,
        email: recruiter.user.email,
        activeJobPostings: recruiter.recruiterAssignments.length,
      }));

      return result;
    } catch (error) {
      logger.error('Failed to fetch unassigned recruiters', {
        context: 'SupportKpisService.getUnassignedRecruiters',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private calculateStats(
    candidates: any[],
    supportInvitations: any[],
    partnerInvitations: any[],
    jobInvites: any[],
    jobAiAssessmentInvitations: any[],
    _filter?: ISupportCandidateKpisFilterQuery
  ) {
    const totalCandidates = candidates.length;
    const totalSignups = totalCandidates; // All filtered candidates are considered signups

    // Calculate organic vs invitation-based signups
    const organicSignups = candidates.filter(
      (c) =>
        !supportInvitations.some((si) => si.candidateId === c.id) &&
        !partnerInvitations.some((pi) => pi.email === c.user.email) &&
        !jobInvites.some((ji) => ji.email === c.user.email) &&
        !jobAiAssessmentInvitations.some((jai) => jai.candidateId === c.id)
    ).length;
    const fromInvitationSignups = totalSignups - organicSignups;

    const countByStatus = <T>(
      items: T[],
      statusField: keyof T,
      statusValue: string
    ): number =>
      items.filter((item) => item[statusField] === statusValue).length;
    const countByRecommendation = (
      assessments: any[],
      recommendation: string
    ): number =>
      assessments.filter((a) => a.recommendation === recommendation).length;

    const allResumeAssessments = candidates.flatMap((c) => c.resumeAssessments);
    const allOnboardingAssessments = candidates.flatMap(
      (c) => c.onboardingAssessments
    );
    const allJobAiAssessments = candidates.flatMap((c) => c.jobAiAssessments);

    // Ensure uniqueness to prevent duplicate counting
    const filteredResumeAssessments = allResumeAssessments.filter(
      (ra, index, self) => index === self.findIndex((r) => r.id === ra.id)
    );
    const filteredOnboardingAssessments = allOnboardingAssessments.filter(
      (oa, index, self) => index === self.findIndex((o) => o.id === oa.id)
    );
    const filteredJobAiAssessments = allJobAiAssessments.filter(
      (jaa, index, self) => index === self.findIndex((j) => j.id === jaa.id)
    );

    return {
      total: totalCandidates,
      invites: this.calculateInviteStats(
        supportInvitations,
        partnerInvitations,
        jobInvites,
        jobAiAssessmentInvitations,
        countByStatus,
        new Set(candidates.map((c) => c.id)),
        candidates
      ),
      signups: {
        total: totalSignups,
        organic: organicSignups,
        fromInvitations: fromInvitationSignups,
      },
      profileCompletion: this.calculateProfileCompletionStats(
        candidates,
        totalCandidates
      ),
      candidateStatus: this.calculateCandidateStatusStats(
        candidates,
        totalCandidates,
        countByStatus
      ),
      jobSearchStatus: this.calculateJobSearchStatusStats(
        candidates,
        totalCandidates,
        countByStatus
      ),
      assessmentStage: this.calculateAssessmentStageStats(
        candidates,
        totalCandidates,
        countByStatus
      ),
      resumeAssessment: this.calculateResumeAssessmentStats(
        candidates,
        filteredResumeAssessments,
        countByStatus
      ),
      onboardingAssessment: this.calculateOnboardingAssessmentStats(
        candidates,
        filteredOnboardingAssessments,
        countByStatus,
        countByRecommendation
      ),
      jobAiAssessment: this.calculateJobAiAssessmentStats(
        filteredJobAiAssessments,
        countByRecommendation
      ),
      recommendations: this.calculateRecommendationStats(
        filteredResumeAssessments,
        filteredOnboardingAssessments,
        filteredJobAiAssessments,
        countByRecommendation
      ),
      engagement: this.calculateEngagementStats(candidates, totalCandidates),
      subscription: this.calculateSubscriptionStats(
        candidates,
        totalCandidates
      ),
      userStatus: this.calculateUserStatusStats(candidates, totalCandidates),
    };
  }

  private calculateInviteStats(
    supportInvitations: any[],
    partnerInvitations: any[],
    jobInvites: any[],
    jobAiAssessmentInvitations: any[],
    countByStatus: <T>(
      items: T[],
      statusField: keyof T,
      statusValue: string
    ) => number,
    filteredCandidateIds?: Set<string>,
    allCandidates?: any[] // Added allCandidates parameter
  ) {
    // If we have filtered candidates, only count invitations for those candidates
    let filteredSupportInvitations = supportInvitations;
    let filteredPartnerInvitations = partnerInvitations;
    let filteredJobInvites = jobInvites;
    let filteredJobAiAssessmentInvitations = jobAiAssessmentInvitations;

    if (filteredCandidateIds) {
      // Filter support invitations to only include those for the filtered candidates
      filteredSupportInvitations = supportInvitations.filter(
        (inv) => inv.candidateId && filteredCandidateIds.has(inv.candidateId)
      );

      // Filter partner invitations to only include those for the filtered candidates
      filteredPartnerInvitations = partnerInvitations.filter((inv) => {
        // Partner invitations don't have candidateId, so we match by email
        return Array.from(filteredCandidateIds).some((candidateId) => {
          const candidate = allCandidates?.find((c) => c.id === candidateId);
          return candidate && candidate.user.email === inv.email;
        });
      });

      // Filter job invites to only include those for the filtered candidates (by email)
      filteredJobInvites = jobInvites.filter((inv) => {
        // We need to check if any of the filtered candidates have this email
        return Array.from(filteredCandidateIds).some((candidateId) => {
          // Find the candidate and check if their email matches the invitation email
          const candidate = allCandidates?.find((c) => c.id === candidateId);
          return candidate && candidate.user.email === inv.email;
        });
      });

      // Filter job AI assessment invitations to only include those for the filtered candidates
      filteredJobAiAssessmentInvitations = jobAiAssessmentInvitations.filter(
        (inv) => filteredCandidateIds.has(inv.candidateId)
      );
    }

    return {
      total:
        filteredSupportInvitations.length +
        filteredPartnerInvitations.length +
        filteredJobInvites.length +
        filteredJobAiAssessmentInvitations.length,
      supportInvitations: {
        total: filteredSupportInvitations.length,
        pending: countByStatus(
          filteredSupportInvitations,
          'status',
          SupportInvitationStatusEnum.PENDING
        ),
        accepted: countByStatus(
          filteredSupportInvitations,
          'status',
          SupportInvitationStatusEnum.ACCEPTED
        ),
        expired: countByStatus(
          filteredSupportInvitations,
          'status',
          SupportInvitationStatusEnum.EXPIRED
        ),
        withdrawn: countByStatus(
          filteredSupportInvitations,
          'status',
          SupportInvitationStatusEnum.WITHDRAWN
        ),
      },
      partnerInvitations: {
        total: filteredPartnerInvitations.length,
        pending: countByStatus(
          filteredPartnerInvitations,
          'status',
          PartnerUserInvitationStatusEnum.PENDING
        ),
        accepted: countByStatus(
          filteredPartnerInvitations,
          'status',
          PartnerUserInvitationStatusEnum.ACCEPTED
        ),
        expired: countByStatus(
          filteredPartnerInvitations,
          'status',
          PartnerUserInvitationStatusEnum.EXPIRED
        ),
        withdrawn: countByStatus(
          filteredPartnerInvitations,
          'status',
          PartnerUserInvitationStatusEnum.WITHDRAWN
        ),
      },
      jobInvitations: {
        total: filteredJobInvites.length,
        pending: countByStatus(
          filteredJobInvites,
          'status',
          JobInviteStatusEnum.PENDING
        ),
        accepted: countByStatus(
          filteredJobInvites,
          'status',
          JobInviteStatusEnum.ACCEPTED
        ),
        declined: countByStatus(
          filteredJobInvites,
          'status',
          JobInviteStatusEnum.DECLINED
        ),
        expired: countByStatus(
          filteredJobInvites,
          'status',
          JobInviteStatusEnum.EXPIRED
        ),
        cancelled: countByStatus(
          filteredJobInvites,
          'status',
          JobInviteStatusEnum.CANCELLED
        ),
        withdrawn: countByStatus(
          filteredJobInvites,
          'status',
          JobInviteStatusEnum.WITHDRAWN
        ),
      },
      jobAiAssessmentInvitations: {
        total: filteredJobAiAssessmentInvitations.length,
        pending: countByStatus(
          filteredJobAiAssessmentInvitations,
          'status',
          JobAssessmentInviteStatusEnum.PENDING
        ),
        accepted: countByStatus(
          filteredJobAiAssessmentInvitations,
          'status',
          JobAssessmentInviteStatusEnum.ACCEPTED
        ),
        declined: countByStatus(
          filteredJobAiAssessmentInvitations,
          'status',
          JobAssessmentInviteStatusEnum.DECLINED
        ),
        expired: countByStatus(
          filteredJobAiAssessmentInvitations,
          'status',
          JobAssessmentInviteStatusEnum.EXPIRED
        ),
        cancelled: countByStatus(
          filteredJobAiAssessmentInvitations,
          'status',
          JobAssessmentInviteStatusEnum.CANCELLED
        ),
      },
    };
  }

  private calculateProfileCompletionStats(
    candidates: any[],
    totalCandidates: number
  ) {
    return {
      total: totalCandidates,
      completed: candidates.filter((c) => c.completionPercentage >= 100).length,
      inProgress: candidates.filter(
        (c) => c.completionPercentage > 0 && c.completionPercentage < 100
      ).length,
      notStarted: candidates.filter((c) => c.completionPercentage === 0).length,
      averageCompletion:
        candidates.reduce((sum, c) => sum + c.completionPercentage, 0) /
          totalCandidates || 0,
      byPercentage: {
        '0-25': candidates.filter(
          (c) => c.completionPercentage >= 0 && c.completionPercentage <= 25
        ).length,
        '26-50': candidates.filter(
          (c) => c.completionPercentage > 25 && c.completionPercentage <= 50
        ).length,
        '51-75': candidates.filter(
          (c) => c.completionPercentage > 50 && c.completionPercentage <= 75
        ).length,
        '76-99': candidates.filter(
          (c) => c.completionPercentage > 75 && c.completionPercentage < 100
        ).length,
        '100': candidates.filter((c) => c.completionPercentage === 100).length,
      },
    };
  }

  private calculateCandidateStatusStats(
    candidates: any[],
    totalCandidates: number,
    countByStatus: <T>(
      items: T[],
      statusField: keyof T,
      statusValue: string
    ) => number
  ) {
    return {
      total: totalCandidates,
      new: countByStatus(candidates, 'status', CandidateStatusEnum.NEW),
      onboarded: countByStatus(
        candidates,
        'status',
        CandidateStatusEnum.ONBOARDED
      ),
      rejected: countByStatus(
        candidates,
        'status',
        CandidateStatusEnum.REJECTED
      ),
      hired: countByStatus(candidates, 'status', CandidateStatusEnum.HIRED),
    };
  }

  private calculateJobSearchStatusStats(
    candidates: any[],
    totalCandidates: number,
    countByStatus: <T>(
      items: T[],
      statusField: keyof T,
      statusValue: string
    ) => number
  ) {
    return {
      total: totalCandidates,
      openToOpportunities: countByStatus(
        candidates,
        'jobSearchStatus',
        CandidateJobSearchStatusEnum.OPEN_TO_OPPORTUNITIES
      ),
      notLooking: countByStatus(
        candidates,
        'jobSearchStatus',
        CandidateJobSearchStatusEnum.NOT_LOOKING
      ),
    };
  }

  private calculateAssessmentStageStats(
    candidates: any[],
    totalCandidates: number,
    countByStatus: <T>(
      items: T[],
      statusField: keyof T,
      statusValue: string
    ) => number
  ) {
    return {
      total: totalCandidates,
      resumeAssessment: countByStatus(
        candidates,
        'assessmentStage',
        CandidateAssessmentStageEnum.RESUME_ASSESSMENT
      ),
      onboardingAssessment: countByStatus(
        candidates,
        'assessmentStage',
        CandidateAssessmentStageEnum.ONBOARDING_ASSESSMENT
      ),
    };
  }

  private calculateResumeAssessmentStats(
    candidates: any[],
    resumeAssessments: any[],
    countByStatus: <T>(
      items: T[],
      statusField: keyof T,
      statusValue: string
    ) => number
  ) {
    return {
      total: resumeAssessments.length,
      byStatus: {
        notDone: countByStatus(
          candidates,
          'resumeAssessmentStatus',
          CandidateResumeAssessmentStatusEnum.ASSESSMENT_NOT_DONE
        ),
        inProgress: countByStatus(
          candidates,
          'resumeAssessmentStatus',
          CandidateResumeAssessmentStatusEnum.ASSESSMENT_IN_PROGRESS
        ),
        completed: countByStatus(
          candidates,
          'resumeAssessmentStatus',
          CandidateResumeAssessmentStatusEnum.ASSESSMENT_COMPLETED
        ),
        failed: countByStatus(
          candidates,
          'resumeAssessmentStatus',
          CandidateResumeAssessmentStatusEnum.ASSESSMENT_FAILED
        ),
      },
      byResult: {
        notAvailable: resumeAssessments.filter(
          (ra) => ra.result === ResumeAssessmentResultEnum.NOT_AVAILABLE
        ).length,
        passed: resumeAssessments.filter(
          (ra) => ra.result === ResumeAssessmentResultEnum.PASSED
        ).length,
        aiReviewFailed: resumeAssessments.filter(
          (ra) => ra.result === ResumeAssessmentResultEnum.AI_REVIEW_FAILED
        ).length,
        manualReviewFailed: resumeAssessments.filter(
          (ra) => ra.result === ResumeAssessmentResultEnum.MANUAL_REVIEW_FAILED
        ).length,
      },
      // Resume assessments don't have recommendations - only onboarding assessments do
      byRecommendation: {
        highlyRecommended: 0,
        recommended: 0,
        notRecommended: 0,
      },
    };
  }

  private calculateOnboardingAssessmentStats(
    candidates: any[],
    onboardingAssessments: any[],
    countByStatus: <T>(
      items: T[],
      statusField: keyof T,
      statusValue: string
    ) => number,
    countByRecommendation: (
      assessments: any[],
      recommendation: string
    ) => number
  ) {
    return {
      total: onboardingAssessments.length,
      byStatus: {
        notDone: countByStatus(
          candidates,
          'onboardingAssessmentStatus',
          CandidateOnboardingAssessmentStatusEnum.ASSESSMENT_NOT_DONE
        ),
        inProgress: countByStatus(
          candidates,
          'onboardingAssessmentStatus',
          CandidateOnboardingAssessmentStatusEnum.ASSESSMENT_IN_PROGRESS
        ),
        completed: countByStatus(
          candidates,
          'onboardingAssessmentStatus',
          CandidateOnboardingAssessmentStatusEnum.ASSESSMENT_COMPLETED
        ),
        failed: countByStatus(
          candidates,
          'onboardingAssessmentStatus',
          CandidateOnboardingAssessmentStatusEnum.ASSESSMENT_FAILED
        ),
      },
      byResult: {
        notAvailable: onboardingAssessments.filter(
          (oa) => oa.result === OnboardingAssessmentResultEnum.NOT_AVAILABLE
        ).length,
        passed: onboardingAssessments.filter(
          (oa) => oa.result === OnboardingAssessmentResultEnum.PASSED
        ).length,
        aiReviewFailed: onboardingAssessments.filter(
          (oa) => oa.result === OnboardingAssessmentResultEnum.AI_REVIEW_FAILED
        ).length,
        manualReviewFailed: onboardingAssessments.filter(
          (oa) =>
            oa.result === OnboardingAssessmentResultEnum.MANUAL_REVIEW_FAILED
        ).length,
      },
      byRecommendation: {
        highlyRecommended: countByRecommendation(
          onboardingAssessments,
          OnboardingAssessmentRecommendationEnum.HIGHLY_RECOMMENDED
        ),
        recommended: countByRecommendation(
          onboardingAssessments,
          OnboardingAssessmentRecommendationEnum.RECOMMENDED
        ),
        notRecommended: countByRecommendation(
          onboardingAssessments,
          OnboardingAssessmentRecommendationEnum.NOT_RECOMMENDED
        ),
      },
    };
  }

  private calculateJobAiAssessmentStats(
    jobAiAssessments: any[],
    countByRecommendation: (
      assessments: any[],
      recommendation: string
    ) => number
  ) {
    return {
      total: jobAiAssessments.length,
      byStatus: {
        notDone: jobAiAssessments.filter(
          (ja) => ja.status === JobAiAssessmentStatusEnum.NOT_STARTED
        ).length,
        inProgress: jobAiAssessments.filter((ja) =>
          ja.status.includes('IN_PROGRESS')
        ).length,
        completed: jobAiAssessments.filter(
          (ja) => ja.status === JobAiAssessmentStatusEnum.ASSESSMENT_COMPLETED
        ).length,
        failed: jobAiAssessments.filter(
          (ja) => ja.status === JobAiAssessmentStatusEnum.ASSESSMENT_FAILED
        ).length,
      },
      byResult: {
        notAvailable: jobAiAssessments.filter(
          (ja) => ja.result === JobAiAssessmentResultEnum.NOT_AVAILABLE
        ).length,
        passed: jobAiAssessments.filter(
          (ja) => ja.result === JobAiAssessmentResultEnum.PASSED
        ).length,
        aiReviewFailed: jobAiAssessments.filter(
          (ja) => ja.result === JobAiAssessmentResultEnum.AI_REVIEW_FAILED
        ).length,
        manualReviewFailed: jobAiAssessments.filter(
          (ja) => ja.result === JobAiAssessmentResultEnum.MANUAL_REVIEW_FAILED
        ).length,
      },
      byRecommendation: {
        highlyRecommended: countByRecommendation(
          jobAiAssessments,
          JobAiAssessmentRecommendationEnum.HIGHLY_RECOMMENDED
        ),
        recommended: countByRecommendation(
          jobAiAssessments,
          JobAiAssessmentRecommendationEnum.RECOMMENDED
        ),
        notRecommended: countByRecommendation(
          jobAiAssessments,
          JobAiAssessmentRecommendationEnum.NOT_RECOMMENDED
        ),
      },
    };
  }

  private calculateRecommendationStats(
    _resumeAssessments: any[],
    onboardingAssessments: any[],
    _jobAiAssessments: any[],
    countByRecommendation: (
      assessments: any[],
      recommendation: string
    ) => number
  ) {
    // Recommendations are based on onboarding assessments only
    const highlyRecommended = countByRecommendation(
      onboardingAssessments,
      OnboardingAssessmentRecommendationEnum.HIGHLY_RECOMMENDED
    );
    const recommended = countByRecommendation(
      onboardingAssessments,
      OnboardingAssessmentRecommendationEnum.RECOMMENDED
    );
    const notRecommended = countByRecommendation(
      onboardingAssessments,
      OnboardingAssessmentRecommendationEnum.NOT_RECOMMENDED
    );

    return {
      total: highlyRecommended + recommended + notRecommended,
      highlyRecommended,
      recommended,
      notRecommended,
    };
  }

  private calculateEngagementStats(candidates: any[], totalCandidates: number) {
    return {
      total: totalCandidates,
      shortlisted: candidates.reduce((sum, c) => sum + c.shortlists.length, 0),
      shortlistedByStatus: {
        shortlisted: candidates.reduce(
          (sum, c) =>
            sum +
            c.shortlists.filter(
              (s: any) => s.status === CandidateShortlistStatusEnum.SHORTLISTED
            ).length,
          0
        ),
        notInterested: candidates.reduce(
          (sum, c) =>
            sum +
            c.shortlists.filter(
              (s: any) =>
                s.status === CandidateShortlistStatusEnum.NOT_INTERESTED
            ).length,
          0
        ),
        rejected: candidates.reduce(
          (sum, c) =>
            sum +
            c.shortlists.filter(
              (s: any) => s.status === CandidateShortlistStatusEnum.REJECTED
            ).length,
          0
        ),
      },
      savedJobs: candidates.reduce((sum, c) => sum + c.savedJobs.length, 0),
      views: candidates.reduce((sum, c) => sum + c.views.length, 0),
      applications: candidates.reduce(
        (sum, c) => sum + c.applications.length,
        0
      ),
      recommendationsReceived: candidates.reduce(
        (sum, c) => sum + c.recommendationsReceived.length,
        0
      ),
      recommendationsViewed: candidates.reduce(
        (sum, c) =>
          sum + c.recommendationsReceived.filter((r: any) => r.isViewed).length,
        0
      ),
      recommendationsSaved: candidates.reduce(
        (sum, c) =>
          sum + c.recommendationsReceived.filter((r: any) => r.isSaved).length,
        0
      ),
      recommendationsApplied: candidates.reduce(
        (sum, c) =>
          sum +
          c.recommendationsReceived.filter((r: any) => r.isInvited).length,
        0
      ),
      practiceAssessments: candidates.reduce(
        (sum, c) => sum + c.practiceAssessments.length,
        0
      ),
    };
  }

  private calculateSubscriptionStats(
    candidates: any[],
    totalCandidates: number
  ) {
    const withSubscription = candidates.filter(
      (c) => c.candidateSubscription
    ).length;
    return {
      total: totalCandidates,
      active: candidates.filter(
        (c) =>
          c.candidateSubscription?.status ===
          CandidateSubscriptionStatusEnum.ACTIVE
      ).length,
      inactive: candidates.filter(
        (c) =>
          c.candidateSubscription?.status ===
          CandidateSubscriptionStatusEnum.CANCELLED
      ).length,
      cancelled: candidates.filter(
        (c) =>
          c.candidateSubscription?.status ===
          CandidateSubscriptionStatusEnum.CANCELLED
      ).length,
      expired: candidates.filter(
        (c) =>
          c.candidateSubscription?.status ===
          CandidateSubscriptionStatusEnum.EXPIRED
      ).length,
      withSubscription,
      withoutSubscription: totalCandidates - withSubscription,
      averageAssessmentsUsed:
        withSubscription > 0
          ? candidates.reduce(
              (sum, c) =>
                sum + (c.candidateSubscription?.assessmentsUsedThisMonth || 0),
              0
            ) / withSubscription
          : 0,
      averagePracticeAssessmentsUsed:
        withSubscription > 0
          ? candidates.reduce(
              (sum, c) =>
                sum + (c.candidateSubscription?.practiceAssessmentsUsed || 0),
              0
            ) / withSubscription
          : 0,
    };
  }

  private calculateUserStatusStats(candidates: any[], totalCandidates: number) {
    return {
      total: totalCandidates,
      active: candidates.filter((c) => c.user.status === UserStatusEnum.ACTIVE)
        .length,
      inactive: candidates.filter(
        (c) => c.user.status === UserStatusEnum.INACTIVE
      ).length,
      blocked: candidates.filter(
        (c) => c.user.status === UserStatusEnum.BLOCKED
      ).length,
    };
  }
}
