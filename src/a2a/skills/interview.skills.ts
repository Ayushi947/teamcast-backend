/**
 * A2A Interview Skills
 * Skills for agent-to-agent interview operations
 */

import { logger } from '@/shared/utils/logger';
import { mcpInterviewService } from '@/services/mcp/mcp.interview.service';
import {
  A2ASkillHandler,
  A2AContext,
  A2ATaskState,
  A2AMessageRole,
} from '../core/a2a.types';
import { A2ATaskManager } from '../core/a2a.task.manager';
import { A2ASkillRegistry } from './skill.registry';
import {
  McpAssessmentLevelEnum,
  McpInterviewStatusEnum,
} from '@/shared/models/domain/client/mcp.interview.domain';

/**
 * Get MCP client ID from A2A context
 * A2A clients map to MCP clients for authorization
 */
async function getMcpClientId(context: A2AContext): Promise<string> {
  // A2A clientId should map to an MCP client
  // This could be a direct mapping or through a lookup
  return context.clientId;
}

/**
 * Interview Request Skill Handler
 */
const interviewRequestHandler: A2ASkillHandler = async (params, context) => {
  logger.info('A2A: Interview request skill executing', {
    context: 'interviewSkills.request',
    clientId: context.clientId,
    params: {
      candidateEmail: params.candidateEmail,
      skillsCount: (params.skillsToAssess as string[])?.length,
    },
  });

  // Validate required params
  if (!params.candidateEmail) {
    return {
      state: A2ATaskState.FAILED,
      message: A2ATaskManager.createTextMessage(
        A2AMessageRole.AGENT,
        'candidateEmail is required'
      ),
    };
  }

  if (!params.candidateName) {
    return {
      state: A2ATaskState.FAILED,
      message: A2ATaskManager.createTextMessage(
        A2AMessageRole.AGENT,
        'candidateName is required'
      ),
    };
  }

  if (
    !params.skillsToAssess ||
    !Array.isArray(params.skillsToAssess) ||
    params.skillsToAssess.length === 0
  ) {
    return {
      state: A2ATaskState.FAILED,
      message: A2ATaskManager.createTextMessage(
        A2AMessageRole.AGENT,
        'skillsToAssess array is required with at least one skill'
      ),
    };
  }

  try {
    const mcpClientId = await getMcpClientId(context);

    // Call the existing MCP interview service
    const result = await mcpInterviewService.requestInterview(mcpClientId, {
      candidate: {
        email: params.candidateEmail as string,
        name: params.candidateName as string,
        phone: params.phone as string | undefined,
        currentTitle: params.currentTitle as string | undefined,
        currentCompany: params.currentCompany as string | undefined,
        yearsOfExperience: params.yearsOfExperience as number | undefined,
        linkedInUrl: params.linkedInUrl as string | undefined,
        githubUrl: params.githubUrl as string | undefined,
        externalCandidateId: params.externalCandidateId as string | undefined,
      },
      skillsToAssess: params.skillsToAssess as string[],
      assessmentLevel:
        (params.assessmentLevel as McpAssessmentLevelEnum) ||
        McpAssessmentLevelEnum.INTERMEDIATE,
      jobContext: params.jobTitle
        ? {
            title: params.jobTitle as string,
            company: params.companyName as string | undefined,
            description: params.jobDescription as string | undefined,
            location: params.jobLocation as string | undefined,
          }
        : undefined,
      externalReferenceId: params.externalReferenceId as string | undefined,
      externalCandidateId: params.externalCandidateId as string | undefined,
      expiryDays: (params.expiryDays as number) || 7,
      customInstructions: params.customInstructions as string | undefined,
      inviteMessage: params.inviteMessage as string | undefined,
      expectedDurationMinutes: params.expectedDurationMinutes as
        | number
        | undefined,
      maxSections: params.maxSections as number | undefined,
      resumeFile: params.resumeFile as string | undefined,
      resumeFileName: params.resumeFileName as string | undefined,
    });

    const responseData = {
      interviewId: result.interviewId,
      status: result.status,
      candidateType: result.candidateType,
      candidateEmail: result.candidateEmail,
      inviteUrl: result.inviteUrl,
      expiresAt: result.expiresAt.toISOString(),
      emailSent: result.emailSent,
      emailError: result.emailError,
    };

    const responseText =
      `Interview requested successfully. Interview ID: ${result.interviewId}. ` +
      `Invite sent to ${result.candidateEmail}. ` +
      `Status: ${result.status}. ` +
      `Expires: ${result.expiresAt.toISOString()}.`;

    return {
      state: A2ATaskState.COMPLETED,
      message: A2ATaskManager.createDataMessage(
        A2AMessageRole.AGENT,
        responseData,
        responseText
      ),
      artifacts: [
        A2ATaskManager.createArtifact(
          'interview_details',
          responseData,
          responseText
        ),
      ],
    };
  } catch (error) {
    logger.error('A2A: Interview request failed', {
      context: 'interviewSkills.request',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      state: A2ATaskState.FAILED,
      message: A2ATaskManager.createTextMessage(
        A2AMessageRole.AGENT,
        `Failed to request interview: ${error instanceof Error ? error.message : 'Unknown error'}`
      ),
    };
  }
};

/**
 * Interview Status Skill Handler
 */
const interviewStatusHandler: A2ASkillHandler = async (params, context) => {
  logger.info('A2A: Interview status skill executing', {
    context: 'interviewSkills.status',
    clientId: context.clientId,
  });

  // Need at least one identifier
  if (
    !params.interviewId &&
    !params.externalReferenceId &&
    !params.candidateEmail
  ) {
    return {
      state: A2ATaskState.FAILED,
      message: A2ATaskManager.createTextMessage(
        A2AMessageRole.AGENT,
        'At least one of interviewId, externalReferenceId, or candidateEmail is required'
      ),
    };
  }

  try {
    const mcpClientId = await getMcpClientId(context);

    const interview = await mcpInterviewService.getInterviewStatus(
      mcpClientId,
      {
        interviewId: params.interviewId as string | undefined,
        externalReferenceId: params.externalReferenceId as string | undefined,
        candidateEmail: params.candidateEmail as string | undefined,
      }
    );

    if (!interview) {
      return {
        state: A2ATaskState.COMPLETED,
        message: A2ATaskManager.createTextMessage(
          A2AMessageRole.AGENT,
          'Interview not found with the provided criteria'
        ),
      };
    }

    const responseData = {
      interviewId: interview.id,
      status: interview.status,
      candidateName: interview.candidateName,
      candidateEmail: interview.candidateEmail,
      skillsToAssess: interview.skillsToAssess,
      assessmentLevel: interview.assessmentLevel,
      invitedAt: interview.invitedAt.toISOString(),
      acceptedAt: interview.acceptedAt?.toISOString() || null,
      startedAt: interview.startedAt?.toISOString() || null,
      completedAt: interview.completedAt?.toISOString() || null,
      resultsReady: interview.status === McpInterviewStatusEnum.RESULTS_READY,
      expiresAt: interview.expiresAt.toISOString(),
      externalReferenceId: interview.externalReferenceId,
      externalCandidateId: interview.externalCandidateId,
    };

    const responseText =
      `Interview ${interview.id} status: ${interview.status}. ` +
      `Candidate: ${interview.candidateName} (${interview.candidateEmail}). ` +
      `Skills: ${interview.skillsToAssess.join(', ')}. ` +
      (interview.status === McpInterviewStatusEnum.RESULTS_READY
        ? 'Results are ready.'
        : `Current status: ${interview.status}.`);

    return {
      state: A2ATaskState.COMPLETED,
      message: A2ATaskManager.createDataMessage(
        A2AMessageRole.AGENT,
        responseData,
        responseText
      ),
    };
  } catch (error) {
    logger.error('A2A: Interview status check failed', {
      context: 'interviewSkills.status',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      state: A2ATaskState.FAILED,
      message: A2ATaskManager.createTextMessage(
        A2AMessageRole.AGENT,
        `Failed to get interview status: ${error instanceof Error ? error.message : 'Unknown error'}`
      ),
    };
  }
};

/**
 * Interview Results Skill Handler
 */
const interviewResultsHandler: A2ASkillHandler = async (params, context) => {
  logger.info('A2A: Interview results skill executing', {
    context: 'interviewSkills.results',
    clientId: context.clientId,
  });

  if (!params.interviewId && !params.externalReferenceId) {
    return {
      state: A2ATaskState.FAILED,
      message: A2ATaskManager.createTextMessage(
        A2AMessageRole.AGENT,
        'Either interviewId or externalReferenceId is required'
      ),
    };
  }

  try {
    const mcpClientId = await getMcpClientId(context);

    // First get the interview to find the ID
    let interviewId = params.interviewId as string;

    if (!interviewId && params.externalReferenceId) {
      const interview = await mcpInterviewService.getInterviewStatus(
        mcpClientId,
        {
          externalReferenceId: params.externalReferenceId as string,
        }
      );
      if (!interview) {
        return {
          state: A2ATaskState.COMPLETED,
          message: A2ATaskManager.createTextMessage(
            A2AMessageRole.AGENT,
            'Interview not found with the provided external reference ID'
          ),
        };
      }
      interviewId = interview.id;
    }

    const results = await mcpInterviewService.getInterviewResults(
      mcpClientId,
      interviewId
    );

    if (!results) {
      return {
        state: A2ATaskState.COMPLETED,
        message: A2ATaskManager.createTextMessage(
          A2AMessageRole.AGENT,
          'Interview results not found. The interview may not be completed yet.'
        ),
      };
    }

    if (results.status !== McpInterviewStatusEnum.RESULTS_READY) {
      return {
        state: A2ATaskState.COMPLETED,
        message: A2ATaskManager.createDataMessage(
          A2AMessageRole.AGENT,
          { interviewId, status: results.status },
          `Interview results are not ready yet. Current status: ${results.status}`
        ),
      };
    }

    const responseData = {
      interviewId: results.interviewId,
      candidate: results.candidate,
      status: results.status,
      completedAt: results.completedAt?.toISOString() || null,
      overall: results.overall,
      skillAssessments: results.skillAssessments,
      sections: results.sections,
    };

    const skillSummary = results.skillAssessments
      .map((sa) => `${sa.skill}: ${sa.score}% (${sa.level})`)
      .join(', ');

    const responseText =
      `Interview results for ${results.candidate.name}:\n` +
      `Overall Score: ${results.overall.score}%\n` +
      `Recommendation: ${results.overall.recommendation}\n` +
      `Skills: ${skillSummary}\n` +
      `Summary: ${results.overall.summary}`;

    return {
      state: A2ATaskState.COMPLETED,
      message: A2ATaskManager.createDataMessage(
        A2AMessageRole.AGENT,
        responseData,
        responseText
      ),
      artifacts: [
        A2ATaskManager.createArtifact(
          'interview_results',
          responseData,
          responseText
        ),
      ],
    };
  } catch (error) {
    logger.error('A2A: Interview results fetch failed', {
      context: 'interviewSkills.results',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      state: A2ATaskState.FAILED,
      message: A2ATaskManager.createTextMessage(
        A2AMessageRole.AGENT,
        `Failed to get interview results: ${error instanceof Error ? error.message : 'Unknown error'}`
      ),
    };
  }
};

/**
 * Interview List Skill Handler
 */
const interviewListHandler: A2ASkillHandler = async (params, context) => {
  logger.info('A2A: Interview list skill executing', {
    context: 'interviewSkills.list',
    clientId: context.clientId,
  });

  try {
    const mcpClientId = await getMcpClientId(context);

    // Parse status filter
    let statusFilter: McpInterviewStatusEnum[] | undefined;
    if (params.status) {
      statusFilter = Array.isArray(params.status)
        ? (params.status as McpInterviewStatusEnum[])
        : [params.status as McpInterviewStatusEnum];
    }

    // Parse date filters
    let fromDate: Date | undefined;
    let toDate: Date | undefined;
    if (params.fromDate) {
      fromDate = new Date(params.fromDate as string);
    }
    if (params.toDate) {
      toDate = new Date(params.toDate as string);
    }

    const result = await mcpInterviewService.listInterviews(
      mcpClientId,
      {
        status: statusFilter,
        candidateEmail: params.candidateEmail as string | undefined,
        externalReferenceId: params.externalReferenceId as string | undefined,
        fromDate,
        toDate,
      },
      {
        page:
          Math.floor(
            ((params.offset as number) || 0) / ((params.limit as number) || 20)
          ) + 1,
        limit: (params.limit as number) || 20,
      }
    );

    const interviews = result.data.map((i) => ({
      interviewId: i.id,
      candidateName: i.candidateName,
      candidateEmail: i.candidateEmail,
      status: i.status,
      skillsToAssess: i.skillsToAssess,
      overallScore: i.overallScore,
      invitedAt: i.invitedAt.toISOString(),
      externalReferenceId: i.externalReferenceId,
      externalCandidateId: i.externalCandidateId,
    }));

    const responseData = {
      interviews,
      total: result.total,
      limit: (params.limit as number) || 20,
      offset: (params.offset as number) || 0,
    };

    const responseText =
      `Found ${result.total} interviews. ` +
      `Showing ${interviews.length} results. ` +
      (interviews.length > 0
        ? `Latest: ${interviews[0].candidateName} - ${interviews[0].status}`
        : 'No interviews match the criteria.');

    return {
      state: A2ATaskState.COMPLETED,
      message: A2ATaskManager.createDataMessage(
        A2AMessageRole.AGENT,
        responseData,
        responseText
      ),
    };
  } catch (error) {
    logger.error('A2A: Interview list failed', {
      context: 'interviewSkills.list',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      state: A2ATaskState.FAILED,
      message: A2ATaskManager.createTextMessage(
        A2AMessageRole.AGENT,
        `Failed to list interviews: ${error instanceof Error ? error.message : 'Unknown error'}`
      ),
    };
  }
};

/**
 * Interview Cancel Skill Handler
 */
const interviewCancelHandler: A2ASkillHandler = async (params, context) => {
  logger.info('A2A: Interview cancel skill executing', {
    context: 'interviewSkills.cancel',
    clientId: context.clientId,
    interviewId: params.interviewId,
  });

  if (!params.interviewId) {
    return {
      state: A2ATaskState.FAILED,
      message: A2ATaskManager.createTextMessage(
        A2AMessageRole.AGENT,
        'interviewId is required'
      ),
    };
  }

  try {
    const mcpClientId = await getMcpClientId(context);

    const result = await mcpInterviewService.cancelInterview(
      mcpClientId,
      params.interviewId as string
    );

    const responseData = {
      success: result.success,
      interviewId: params.interviewId,
      message: 'Interview cancelled successfully',
    };

    return {
      state: A2ATaskState.COMPLETED,
      message: A2ATaskManager.createDataMessage(
        A2AMessageRole.AGENT,
        responseData,
        `Interview ${params.interviewId} has been cancelled successfully.`
      ),
    };
  } catch (error) {
    logger.error('A2A: Interview cancel failed', {
      context: 'interviewSkills.cancel',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      state: A2ATaskState.FAILED,
      message: A2ATaskManager.createTextMessage(
        A2AMessageRole.AGENT,
        `Failed to cancel interview: ${error instanceof Error ? error.message : 'Unknown error'}`
      ),
    };
  }
};

/**
 * Register all interview skills
 */
export function registerInterviewSkills(): void {
  const registry = A2ASkillRegistry.getInstance();

  registry.registerHandler('interview.request', interviewRequestHandler, [
    'invites:write',
  ]);
  registry.registerHandler('interview.status', interviewStatusHandler, [
    'applications:read',
  ]);
  registry.registerHandler('interview.results', interviewResultsHandler, [
    'applications:read',
  ]);
  registry.registerHandler('interview.list', interviewListHandler, [
    'applications:read',
  ]);
  registry.registerHandler('interview.cancel', interviewCancelHandler, [
    'invites:write',
  ]);

  logger.info('A2A: Interview skills registered', {
    context: 'interviewSkills.register',
    skills: [
      'interview.request',
      'interview.status',
      'interview.results',
      'interview.list',
      'interview.cancel',
    ],
  });
}
