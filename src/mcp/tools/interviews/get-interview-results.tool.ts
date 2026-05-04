import { z } from 'zod';
import { McpContext } from '../../core/mcp.server';
import { McpToolRegistry } from '../../core/tool.registry';
import { MCP_SCOPES } from '../../config/mcp.config';
import { logger } from '@/shared/utils/logger';
import { mcpInterviewService } from '@/services/mcp/mcp.interview.service';

/**
 * Get Interview Status Input Schema
 */
export const GetInterviewStatusInputSchema = z.object({
  interviewId: z.string().uuid().optional().describe('Interview ID'),
  externalReferenceId: z
    .string()
    .optional()
    .describe('Your external reference ID'),
  candidateEmail: z
    .string()
    .email()
    .optional()
    .describe('Candidate email address'),
});

export type GetInterviewStatusInput = z.infer<
  typeof GetInterviewStatusInputSchema
>;

/**
 * Get Interview Status Tool Handler
 */
async function handleGetInterviewStatus(
  args: Record<string, unknown>,
  context: McpContext
): Promise<unknown> {
  const input = args as GetInterviewStatusInput;

  logger.info('MCP: Get interview status tool called', {
    context: 'getInterviewStatus.tool',
    mcpClientId: context.mcpClientId,
    hasInterviewId: !!input.interviewId,
    hasExternalRef: !!input.externalReferenceId,
  });

  try {
    if (
      !input.interviewId &&
      !input.externalReferenceId &&
      !input.candidateEmail
    ) {
      throw new Error(
        'At least one filter is required: interviewId, externalReferenceId, or candidateEmail'
      );
    }

    const interview = await mcpInterviewService.getInterviewStatus(
      context.mcpClientId,
      {
        interviewId: input.interviewId,
        externalReferenceId: input.externalReferenceId,
        candidateEmail: input.candidateEmail,
      }
    );

    if (!interview) {
      return {
        success: false,
        message: 'Interview not found',
      };
    }

    return {
      success: true,
      data: {
        interviewId: interview.id,
        status: interview.status,
        externalReferenceId: interview.externalReferenceId,
        externalCandidateId: interview.externalCandidateId,
        candidateEmail: interview.candidateEmail,
        candidateName: interview.candidateName,
        skillsToAssess: interview.skillsToAssess,
        invitedAt: interview.invitedAt,
        acceptedAt: interview.acceptedAt,
        startedAt: interview.startedAt,
        completedAt: interview.completedAt,
        expiresAt: interview.expiresAt,
        hasResults: interview.status === 'RESULTS_READY',
      },
    };
  } catch (error) {
    logger.error('MCP: Get interview status failed', {
      context: 'getInterviewStatus.tool',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}

/**
 * Get Interview Results Input Schema
 */
export const GetInterviewResultsInputSchema = z.object({
  interviewId: z.string().uuid().describe('Interview ID'),
});

export type GetInterviewResultsInput = z.infer<
  typeof GetInterviewResultsInputSchema
>;

/**
 * Get Interview Results Tool Handler
 */
async function handleGetInterviewResults(
  args: Record<string, unknown>,
  context: McpContext
): Promise<unknown> {
  const input = args as GetInterviewResultsInput;

  logger.info('MCP: Get interview results tool called', {
    context: 'getInterviewResults.tool',
    mcpClientId: context.mcpClientId,
    interviewId: input.interviewId,
  });

  try {
    const results = await mcpInterviewService.getInterviewResults(
      context.mcpClientId,
      input.interviewId
    );

    if (!results) {
      return {
        success: false,
        message: 'Interview not found or results not ready',
      };
    }

    if (results.status !== 'RESULTS_READY') {
      return {
        success: false,
        message: `Results not available yet. Current status: ${results.status}`,
        data: {
          interviewId: results.interviewId,
          status: results.status,
        },
      };
    }

    return {
      success: true,
      data: results,
    };
  } catch (error) {
    logger.error('MCP: Get interview results failed', {
      context: 'getInterviewResults.tool',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}

/**
 * List Interviews Input Schema
 */
export const ListInterviewsInputSchema = z.object({
  status: z
    .enum([
      'INVITED',
      'ACCEPTED',
      'DECLINED',
      'EXPIRED',
      'IN_PROGRESS',
      'COMPLETED',
      'EVALUATING',
      'RESULTS_READY',
      'CANCELLED',
    ])
    .optional()
    .describe('Filter by status'),
  externalReferenceId: z
    .string()
    .optional()
    .describe('Filter by external reference ID'),
  externalCandidateId: z
    .string()
    .optional()
    .describe('Filter by external candidate ID'),
  candidateEmail: z
    .string()
    .email()
    .optional()
    .describe('Filter by candidate email'),
  page: z.number().min(1).default(1).describe('Page number'),
  limit: z.number().min(1).max(100).default(20).describe('Items per page'),
});

export type ListInterviewsInput = z.infer<typeof ListInterviewsInputSchema>;

/**
 * List Interviews Tool Handler
 */
async function handleListInterviews(
  args: Record<string, unknown>,
  context: McpContext
): Promise<unknown> {
  const input = args as ListInterviewsInput;

  logger.info('MCP: List interviews tool called', {
    context: 'listInterviews.tool',
    mcpClientId: context.mcpClientId,
  });

  try {
    const result = await mcpInterviewService.listInterviews(
      context.mcpClientId,
      {
        status: input.status as never,
        externalReferenceId: input.externalReferenceId,
        externalCandidateId: input.externalCandidateId,
        candidateEmail: input.candidateEmail,
      },
      {
        page: input.page,
        limit: input.limit,
      }
    );

    return {
      success: true,
      data: {
        interviews: result.data.map((interview) => ({
          interviewId: interview.id,
          status: interview.status,
          externalReferenceId: interview.externalReferenceId,
          externalCandidateId: interview.externalCandidateId,
          candidateEmail: interview.candidateEmail,
          candidateName: interview.candidateName,
          skillsToAssess: interview.skillsToAssess,
          invitedAt: interview.invitedAt,
          completedAt: interview.completedAt,
          overallScore: interview.overallScore,
        })),
        pagination: {
          page: input.page,
          limit: input.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / input.limit),
        },
      },
    };
  } catch (error) {
    logger.error('MCP: List interviews failed', {
      context: 'listInterviews.tool',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}

/**
 * Cancel Interview Input Schema
 */
export const CancelInterviewInputSchema = z.object({
  interviewId: z.string().uuid().describe('Interview ID to cancel'),
});

export type CancelInterviewInput = z.infer<typeof CancelInterviewInputSchema>;

/**
 * Cancel Interview Tool Handler
 */
async function handleCancelInterview(
  args: Record<string, unknown>,
  context: McpContext
): Promise<unknown> {
  const input = args as CancelInterviewInput;

  logger.info('MCP: Cancel interview tool called', {
    context: 'cancelInterview.tool',
    mcpClientId: context.mcpClientId,
    interviewId: input.interviewId,
  });

  try {
    const result = await mcpInterviewService.cancelInterview(
      context.mcpClientId,
      input.interviewId
    );

    return {
      success: result.success,
      message: 'Interview cancelled successfully',
    };
  } catch (error) {
    logger.error('MCP: Cancel interview failed', {
      context: 'cancelInterview.tool',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}

/**
 * Register all Interview Result Tools
 */
export function registerInterviewResultTools(): void {
  const registry = McpToolRegistry.getInstance();

  // Get Interview Status
  registry.register(
    'teamcast.interviews.getStatus',
    'Get the current status of an interview request. Use interviewId, externalReferenceId, or candidateEmail to find the interview.',
    GetInterviewStatusInputSchema,
    handleGetInterviewStatus,
    {
      requiredScopes: [MCP_SCOPES.APPLICATIONS_READ],
    }
  );

  // Get Interview Results
  registry.register(
    'teamcast.interviews.getResults',
    'Get detailed results of a completed interview including per-skill assessments, scores, and feedback. Results are only available when status is RESULTS_READY.',
    GetInterviewResultsInputSchema,
    handleGetInterviewResults,
    {
      requiredScopes: [MCP_SCOPES.APPLICATIONS_READ],
    }
  );

  // List Interviews
  registry.register(
    'teamcast.interviews.list',
    'List all interviews requested by your agent. Supports filtering by status, candidate, and external IDs.',
    ListInterviewsInputSchema,
    handleListInterviews,
    {
      requiredScopes: [MCP_SCOPES.APPLICATIONS_READ],
    }
  );

  // Cancel Interview
  registry.register(
    'teamcast.interviews.cancel',
    'Cancel a pending interview request. Cannot cancel interviews that are already completed or in progress.',
    CancelInterviewInputSchema,
    handleCancelInterview,
    {
      requiredScopes: [MCP_SCOPES.INVITES_WRITE],
    }
  );
}
