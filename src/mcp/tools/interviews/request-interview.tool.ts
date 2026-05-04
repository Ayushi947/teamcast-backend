import { z } from 'zod';
import { McpContext } from '../../core/mcp.server';
import { McpToolRegistry } from '../../core/tool.registry';
import { MCP_SCOPES } from '../../config/mcp.config';
import { logger } from '@/shared/utils/logger';
import { mcpInterviewService } from '@/services/mcp/mcp.interview.service';
import { McpAssessmentLevelEnum } from '@/shared/models/domain/client/mcp.interview.domain';

/**
 * External Candidate Schema
 */
const ExternalCandidateSchema = z.object({
  name: z.string().min(1).max(200).describe('Candidate full name'),
  email: z.string().email().describe('Candidate email address'),
  phone: z.string().optional().describe('Phone number'),
  currentTitle: z.string().optional().describe('Current job title'),
  currentCompany: z.string().optional().describe('Current company'),
  yearsOfExperience: z.number().optional().describe('Years of experience'),
  linkedInUrl: z.string().url().optional().describe('LinkedIn profile URL'),
  githubUrl: z.string().url().optional().describe('GitHub profile URL'),
  portfolioUrl: z.string().url().optional().describe('Portfolio URL'),
  resumeUrl: z.string().url().optional().describe('Resume URL'),
  location: z.string().optional().describe('Location'),
  externalCandidateId: z
    .string()
    .optional()
    .describe('Your ID for this candidate'),
  sourceSystem: z.string().optional().describe('Source system name'),
});

/**
 * Job Context Schema
 */
const JobContextSchema = z.object({
  title: z.string().min(1).max(200).describe('Job title shown to candidate'),
  company: z.string().optional().describe('Company name shown to candidate'),
  description: z.string().optional().describe('Brief job description'),
  location: z.string().optional().describe('Job location'),
});

/**
 * Request Interview Input Schema
 */
export const RequestInterviewInputSchema = z.object({
  // Option 1: Existing Teamcast candidate
  candidateId: z
    .string()
    .uuid()
    .optional()
    .describe('Existing Teamcast candidate ID (use this OR candidate object)'),

  // Option 2: External candidate
  candidate: ExternalCandidateSchema.optional().describe(
    'External candidate details (use this OR candidateId)'
  ),

  // Interview configuration (required)
  skillsToAssess: z
    .array(z.string())
    .min(1)
    .max(10)
    .describe('Skills to assess (e.g., ["Python", "React", "AWS"])'),

  // Optional settings
  assessmentLevel: z
    .enum(['JUNIOR', 'INTERMEDIATE', 'SENIOR', 'LEAD'])
    .default('INTERMEDIATE')
    .describe('Assessment difficulty level'),

  jobContext: JobContextSchema.optional().describe(
    'Job context shown to candidate (recommended for better candidate experience)'
  ),

  customInstructions: z
    .string()
    .max(1000)
    .optional()
    .describe('Custom instructions for AI assessment generation'),

  externalReferenceId: z
    .string()
    .optional()
    .describe('Your reference ID for tracking this interview request'),

  expiryDays: z
    .number()
    .min(1)
    .max(30)
    .default(7)
    .describe('Days until invite expires (default: 7)'),

  inviteMessage: z
    .string()
    .max(500)
    .optional()
    .describe('Custom message to include in the invite email'),
});

export type RequestInterviewInput = z.infer<typeof RequestInterviewInputSchema>;

/**
 * Request Interview Tool Handler
 */
async function handleRequestInterview(
  args: Record<string, unknown>,
  context: McpContext
): Promise<unknown> {
  const input = args as RequestInterviewInput;

  logger.info('MCP: Request interview tool called', {
    context: 'requestInterview.tool',
    mcpClientId: context.mcpClientId,
    hasExistingCandidate: !!input.candidateId,
    hasExternalCandidate: !!input.candidate,
    skillsCount: input.skillsToAssess.length,
  });

  try {
    // Validate input
    if (!input.candidateId && !input.candidate) {
      throw new Error(
        'Either candidateId (for existing Teamcast candidate) or candidate object (for external candidate) is required'
      );
    }

    if (input.candidateId && input.candidate) {
      throw new Error(
        'Provide either candidateId OR candidate object, not both'
      );
    }

    // Map assessment level
    const assessmentLevel = input.assessmentLevel as McpAssessmentLevelEnum;

    // Request the interview
    const result = await mcpInterviewService.requestInterview(
      context.mcpClientId,
      {
        candidateId: input.candidateId,
        candidate: input.candidate,
        skillsToAssess: input.skillsToAssess,
        assessmentLevel,
        jobContext: input.jobContext,
        customInstructions: input.customInstructions,
        externalReferenceId: input.externalReferenceId,
        externalCandidateId: input.candidate?.externalCandidateId,
        expiryDays: input.expiryDays,
        inviteMessage: input.inviteMessage,
      }
    );

    logger.info('MCP: Interview requested successfully', {
      context: 'requestInterview.tool',
      interviewId: result.interviewId,
      candidateType: result.candidateType,
    });

    return {
      success: true,
      interviewId: result.interviewId,
      status: result.status,
      candidateType: result.candidateType,
      candidateEmail: result.candidateEmail,
      inviteUrl: result.inviteUrl,
      expiresAt: result.expiresAt,
      message: `Interview invite sent to ${result.candidateEmail}. The candidate will receive an email with instructions to complete the assessment.`,
    };
  } catch (error) {
    logger.error('MCP: Request interview failed', {
      context: 'requestInterview.tool',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}

/**
 * Register the Request Interview Tool
 */
export function registerRequestInterviewTool(): void {
  const registry = McpToolRegistry.getInstance();

  registry.register(
    'teamcast.interviews.request',
    'Request an interview for a candidate to assess specific skills. Works with both existing Teamcast candidates (by candidateId) and external candidates (by providing candidate details). The candidate will receive an email invitation to complete the assessment. Provide jobContext for a better candidate experience.',
    RequestInterviewInputSchema,
    handleRequestInterview,
    {
      requiredScopes: [MCP_SCOPES.INVITES_WRITE],
    }
  );
}
