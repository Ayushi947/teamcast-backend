/**
 * MCP Interview API Models
 * API request/response types for MCP interview operations
 */

import { IApiResponse } from '../common/common.api';
import {
  McpInterviewStatusEnum,
  McpAssessmentLevelEnum,
  McpSkillProficiencyEnum,
  IMcpExternalCandidateData,
  IMcpInterviewJobContext,
  IMcpInterviewLandingData,
  IMcpInterviewResults,
} from '../../domain/client/mcp.interview.domain';

// ============================================================================
// Interview Landing Page (Public)
// ============================================================================

/**
 * @openapi
 * components:
 *   schemas:
 *     IMcpInterviewLandingResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IMcpInterviewLandingData'
 */
export type IMcpInterviewLandingResponse =
  IApiResponse<IMcpInterviewLandingData>;

// ============================================================================
// Accept Interview (Public)
// ============================================================================

export interface IMcpInterviewAcceptRequest {
  password?: string;
  acceptTerms?: boolean;
}

export interface IMcpInterviewAcceptResponseData {
  redirectUrl: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IMcpInterviewAcceptApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 redirectUrl:
 *                   type: string
 */
export type IMcpInterviewAcceptApiResponse =
  IApiResponse<IMcpInterviewAcceptResponseData>;

// ============================================================================
// Decline Interview (Public)
// ============================================================================

export interface IMcpInterviewDeclineRequest {
  reason?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IMcpInterviewDeclineApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 */
export type IMcpInterviewDeclineApiResponse = IApiResponse<void>;

// ============================================================================
// Request Interview (MCP Tool)
// ============================================================================

export interface IMcpInterviewRequestInput {
  candidateId?: string;
  candidate?: IMcpExternalCandidateData;
  skillsToAssess: string[];
  assessmentLevel?: McpAssessmentLevelEnum;
  jobContext?: IMcpInterviewJobContext;
  customInstructions?: string;
  externalReferenceId?: string;
  expiryDays?: number;
  inviteMessage?: string;
}

export interface IMcpInterviewRequestResponseData {
  interviewId: string;
  status: McpInterviewStatusEnum;
  candidateType: 'EXISTING' | 'EXTERNAL';
  candidateEmail: string;
  inviteUrl: string;
  expiresAt: Date;
  message?: string;
}

export type IMcpInterviewRequestResponse =
  IApiResponse<IMcpInterviewRequestResponseData>;

// ============================================================================
// Get Interview Status (MCP Tool)
// ============================================================================

export interface IMcpInterviewStatusData {
  interviewId: string;
  status: McpInterviewStatusEnum;
  externalReferenceId: string | null;
  externalCandidateId: string | null;
  candidateEmail: string;
  candidateName: string;
  skillsToAssess: string[];
  invitedAt: Date;
  acceptedAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  expiresAt: Date;
  hasResults: boolean;
}

export type IMcpInterviewStatusResponse = IApiResponse<IMcpInterviewStatusData>;

// ============================================================================
// Get Interview Results (MCP Tool)
// ============================================================================

export type IMcpInterviewResultsResponse = IApiResponse<IMcpInterviewResults>;

// ============================================================================
// List Interviews (MCP Tool)
// ============================================================================

export interface IMcpInterviewListItem {
  interviewId: string;
  status: McpInterviewStatusEnum;
  externalReferenceId: string | null;
  externalCandidateId: string | null;
  candidateEmail: string;
  candidateName: string;
  skillsToAssess: string[];
  invitedAt: Date;
  completedAt: Date | null;
  overallScore: number | null;
}

export interface IMcpInterviewListResponseData {
  interviews: IMcpInterviewListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type IMcpInterviewListResponse =
  IApiResponse<IMcpInterviewListResponseData>;

// ============================================================================
// Skill Assessment Result
// ============================================================================

export interface IMcpSkillAssessmentResult {
  skill: string;
  score: number | null;
  level: McpSkillProficiencyEnum | null;
  strengths: string[];
  improvements: string[];
  notes: string | null;
}

// ============================================================================
// Section Result
// ============================================================================

export interface IMcpInterviewSectionResult {
  name: string;
  skillName: string;
  score: number | null;
  timeSpent: string | null;
  questionsAnswered: number;
  questionsTotal: number;
}
