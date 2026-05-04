import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { McpContext } from '../../core/mcp.server';
import { McpToolRegistry } from '../../core/tool.registry';
import { MCP_SCOPES } from '../../config/mcp.config';
import { logger } from '@/shared/utils/logger';

const prisma = new PrismaClient();

/**
 * Get Interview Results Input Schema
 * Allows external AI agents to query interview/assessment results for candidates they sent
 */
export const GetInterviewResultsInputSchema = z.object({
  // Filter by specific invite IDs (returned when sending invites)
  inviteIds: z
    .array(z.string().uuid())
    .optional()
    .describe('Specific invite IDs to get results for'),

  // Filter by job posting
  jobPostingId: z
    .string()
    .uuid()
    .optional()
    .describe('Filter results by job posting ID'),

  // Filter by external candidate ID (from source system)
  externalCandidateIds: z
    .array(z.string())
    .optional()
    .describe('External candidate IDs from your source system'),

  // Filter by batch ID
  batchId: z
    .string()
    .optional()
    .describe('Batch ID to filter invites from a specific batch'),

  // Filter by status
  statuses: z
    .array(
      z.enum([
        'PENDING',
        'ACCEPTED',
        'DECLINED',
        'CANCELLED',
        'EXPIRED',
        'WITHDRAWN',
      ])
    )
    .optional()
    .describe('Filter by invite statuses'),

  // Filter by application status
  applicationStatuses: z
    .array(
      z.enum([
        'DRAFT',
        'INVITED',
        'APPLIED',
        'REVIEWING',
        'SHORTLISTED',
        'ASSESSING',
        'OFFERED',
        'ACCEPTED',
        'FAILED',
        'REJECTED',
        'WITHDRAWN',
        'DECLINED',
      ])
    )
    .optional()
    .describe('Filter by application statuses'),

  // Include detailed assessment results
  includeAssessmentDetails: z
    .boolean()
    .default(false)
    .describe('Include detailed AI assessment results'),

  // Date filters
  sentAfter: z
    .string()
    .datetime()
    .optional()
    .describe('Filter invites sent after this date'),
  sentBefore: z
    .string()
    .datetime()
    .optional()
    .describe('Filter invites sent before this date'),

  // Pagination
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export type GetInterviewResultsInput = z.infer<
  typeof GetInterviewResultsInputSchema
>;

/**
 * Interview Result Response
 */
interface InterviewResult {
  inviteId: string;
  externalCandidateId: string | null;
  batchId: string | null;
  candidate: {
    email: string;
    name: string;
    userId: string | null;
  };
  jobPosting: {
    id: string;
    title: string;
  };
  invite: {
    status: string;
    sentAt: string;
    expiresAt: string;
    acceptedAt?: string;
  };
  application: {
    id: string;
    status: string;
    appliedAt: string;
    notes?: string;
  } | null;
  assessment: {
    id: string;
    status: string;
    result: string;
    score: number;
    recommendation: string | null;
    completedAt: string | null;
    strengths: string[];
    areasForImprovement: string[];
    overallFeedback: string | null;
    sections?: Array<{
      title: string;
      type: string;
      score: number;
      result: string;
      feedback: string | null;
    }>;
  } | null;
}

/**
 * Get Interview Results Tool Handler
 */
async function handleGetInterviewResults(
  args: Record<string, unknown>,
  context: McpContext
): Promise<unknown> {
  const input = args as GetInterviewResultsInput;

  logger.info('MCP: Getting interview results', {
    context: 'getInterviewResults.tool',
    mcpClientId: context.mcpClientId,
    hasInviteIds: !!input.inviteIds?.length,
    hasJobPostingId: !!input.jobPostingId,
    hasExternalIds: !!input.externalCandidateIds?.length,
  });

  try {
    // Build where clause - only return invites sent by THIS MCP client
    const whereClause: Record<string, unknown> = {
      sourceMcpClientId: context.mcpClientId,
    };

    // Filter by specific invite IDs
    if (input.inviteIds && input.inviteIds.length > 0) {
      whereClause.id = { in: input.inviteIds };
    }

    // Filter by job posting
    if (input.jobPostingId) {
      whereClause.jobId = input.jobPostingId;
    }

    // Filter by external candidate IDs
    if (input.externalCandidateIds && input.externalCandidateIds.length > 0) {
      whereClause.externalCandidateId = { in: input.externalCandidateIds };
    }

    // Filter by batch ID
    if (input.batchId) {
      whereClause.externalBatchId = input.batchId;
    }

    // Filter by invite status
    if (input.statuses && input.statuses.length > 0) {
      whereClause.status = { in: input.statuses };
    }

    // Filter by date range
    if (input.sentAfter || input.sentBefore) {
      whereClause.createdAt = {};
      if (input.sentAfter) {
        (whereClause.createdAt as Record<string, unknown>).gte = new Date(
          input.sentAfter
        );
      }
      if (input.sentBefore) {
        (whereClause.createdAt as Record<string, unknown>).lte = new Date(
          input.sentBefore
        );
      }
    }

    const skip = (input.page - 1) * input.limit;

    // Fetch invites with related data
    const [invites, total] = await Promise.all([
      prisma.job_invite.findMany({
        where: whereClause,
        include: {
          jobApplication: {
            include: {
              aiAssessment: input.includeAssessmentDetails
                ? {
                    include: {
                      sections: {
                        select: {
                          title: true,
                          type: true,
                          score: true,
                          result: true,
                          feedback: true,
                        },
                        orderBy: { order: 'asc' },
                      },
                    },
                  }
                : true,
              jobPosting: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
        skip,
        take: input.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.job_invite.count({ where: whereClause }),
    ]);

    // Filter by application status if specified (post-filter since it's a nested relation)
    let filteredInvites = invites;
    if (input.applicationStatuses && input.applicationStatuses.length > 0) {
      filteredInvites = invites.filter(
        (invite) =>
          invite.jobApplication &&
          input.applicationStatuses!.includes(
            invite.jobApplication.status as any
          )
      );
    }

    // Transform results
    const results: InterviewResult[] = filteredInvites.map((invite) => {
      const application = invite.jobApplication;
      const assessment = application?.aiAssessment;

      return {
        inviteId: invite.id,
        externalCandidateId: invite.externalCandidateId,
        batchId: invite.externalBatchId,
        candidate: {
          email: invite.email,
          name: invite.name,
          userId: invite.userId,
        },
        jobPosting: application?.jobPosting
          ? {
              id: application.jobPosting.id,
              title: application.jobPosting.title,
            }
          : {
              id: invite.jobId,
              title: 'Unknown',
            },
        invite: {
          status: invite.status,
          sentAt: invite.createdAt.toISOString(),
          expiresAt: invite.expiresAt.toISOString(),
        },
        application: application
          ? {
              id: application.id,
              status: application.status,
              appliedAt: application.appliedAt.toISOString(),
              notes: application.notes || undefined,
            }
          : null,
        assessment: assessment
          ? {
              id: assessment.id,
              status: assessment.status,
              result: assessment.result,
              score: assessment.score,
              recommendation: assessment.recommendation,
              completedAt: assessment.completedAt?.toISOString() || null,
              strengths: assessment.strengths,
              areasForImprovement: assessment.areasForImprovement,
              overallFeedback: assessment.overallFeedback,
              sections:
                input.includeAssessmentDetails && (assessment as any).sections
                  ? (assessment as any).sections.map((section: any) => ({
                      title: section.title,
                      type: section.type,
                      score: section.score,
                      result: section.result,
                      feedback: section.feedback,
                    }))
                  : undefined,
            }
          : null,
      };
    });

    // Calculate summary statistics
    const summary = {
      total: total,
      byInviteStatus: {} as Record<string, number>,
      byApplicationStatus: {} as Record<string, number>,
      byAssessmentResult: {} as Record<string, number>,
    };

    for (const result of results) {
      // Count by invite status
      summary.byInviteStatus[result.invite.status] =
        (summary.byInviteStatus[result.invite.status] || 0) + 1;

      // Count by application status
      if (result.application) {
        summary.byApplicationStatus[result.application.status] =
          (summary.byApplicationStatus[result.application.status] || 0) + 1;
      }

      // Count by assessment result
      if (result.assessment) {
        summary.byAssessmentResult[result.assessment.result] =
          (summary.byAssessmentResult[result.assessment.result] || 0) + 1;
      }
    }

    logger.info('MCP: Interview results retrieved', {
      context: 'getInterviewResults.tool',
      total,
      returned: results.length,
    });

    return {
      success: true,
      data: {
        results,
        pagination: {
          page: input.page,
          limit: input.limit,
          total,
          totalPages: Math.ceil(total / input.limit),
        },
        summary,
      },
      message: `Found ${total} interview results for candidates you sent`,
    };
  } catch (error) {
    logger.error('MCP: Failed to get interview results', {
      context: 'getInterviewResults.tool',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}

/**
 * Register the Get Interview Results Tool
 */
export function registerGetInterviewResultsTool(): void {
  const registry = McpToolRegistry.getInstance();

  registry.register(
    'teamcast.jobs.getInterviewResults',
    'Get interview and assessment results for candidates you previously sent via sendInvite. Returns invite status, application status, AI assessment scores, and detailed feedback. Only returns results for candidates sent by your MCP client.',
    GetInterviewResultsInputSchema,
    handleGetInterviewResults,
    {
      requiredScopes: [MCP_SCOPES.APPLICATIONS_READ],
    }
  );
}
