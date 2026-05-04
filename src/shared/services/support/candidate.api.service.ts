import { ApiService } from '../core/api.service';
import type {
  ISupportCandidateCreateSimple,
  ISupportCandidateCreateDone,
  ISupportCandidateUpdate,
  ISupportCandidate,
  ISupportCandidateFilterQuery,
  ISupportRecommendedCandidate,
  ISupportCandidateResetOnboardingAssessmentResponse,
  ISupportCandidateResetOnboardingAssessmentRequest,
  ISupportCandidateActionResponse,
} from '../../models/domain/support/candidates.domain';
import {
  IPaginatedResponse,
  IPaginationRequest,
} from '../../models/api/common/common.api';

/**
 * API endpoints for support candidate management related operations
 */
const SUPPORT_CANDIDATE_MANAGEMENT_ENDPOINTS = {
  BASE: '/support/candidates',
  RECOMMENDED: '/support/candidates/recommended',
  PUBLISH: '/support/candidates/publish',
  UNPUBLISH: '/support/candidates/unpublish',
  RESET_ONBOARDING_ASSESSMENT:
    '/support/candidates/onboarding-assessment/:supportCandidateId/reset',
  RESET_JOB_AI_ASSESSMENT:
    '/support/candidates/job-assessment/:assessmentId/reset',
  RESUBMIT_ONBOARDING_ASSESSMENT:
    '/support/candidates/onboarding-assessment/:supportCandidateId/resubmit',
  RESUBMIT_JOB_AI_ASSESSMENT:
    '/support/candidates/job-assessment/:assessmentId/resubmit',
  DO_NOT_PUBLISH: '/support/candidates/do-not-publish',
  RESEND_JOB_AI_INVITATION:
    '/support/candidates/job-ai-invitation/:invitationId/resend',
  ONBOARDING_VIDEO_CHUNKS:
    '/support/candidates/onboarding-assessment/:assessmentId/video-chunks',
  ONBOARDING_CHUNK_PLAYBACK_URL:
    '/support/candidates/onboarding-assessment/:assessmentId/video-chunks/:chunkId/playback-url',
  JOB_AI_VIDEO_CHUNKS:
    '/support/candidates/job-ai-assessment/:assessmentId/video-chunks',
  JOB_AI_CHUNK_PLAYBACK_URL:
    '/support/candidates/job-ai-assessment/:assessmentId/video-chunks/:chunkId/playback-url',
} as const;

export class SupportCandidateManagementApiService extends ApiService {
  /**
   * Get list of support candidates
   */
  public async getSupportCandidates(
    filter: ISupportCandidateFilterQuery & IPaginationRequest
  ): Promise<IPaginatedResponse<ISupportCandidate>> {
    try {
      return await this.apiGet<IPaginatedResponse<ISupportCandidate>>(
        `${SUPPORT_CANDIDATE_MANAGEMENT_ENDPOINTS.BASE}${filter ? this.buildQueryString(filter) : ''}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific support candidate
   */
  public async getSupportCandidate(
    supportCandidateId: string
  ): Promise<ISupportCandidate> {
    try {
      return await this.apiGet<ISupportCandidate>(
        `${SUPPORT_CANDIDATE_MANAGEMENT_ENDPOINTS.BASE}/${supportCandidateId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a new support candidate
   */
  public async createSupportCandidate(
    data: ISupportCandidateCreateSimple
  ): Promise<ISupportCandidateCreateDone> {
    try {
      return await this.apiPost<ISupportCandidateCreateDone>(
        SUPPORT_CANDIDATE_MANAGEMENT_ENDPOINTS.BASE,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update a support candidate
   */
  public async updateSupportCandidate(
    supportCandidateId: string,
    data: ISupportCandidateUpdate
  ): Promise<ISupportCandidate> {
    try {
      return await this.apiPatch<ISupportCandidate>(
        `${SUPPORT_CANDIDATE_MANAGEMENT_ENDPOINTS.BASE}/${supportCandidateId}`,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete a support candidate
   */
  public async deleteSupportCandidate(
    supportCandidateId: string
  ): Promise<boolean> {
    try {
      return await this.apiDelete<boolean>(
        `${SUPPORT_CANDIDATE_MANAGEMENT_ENDPOINTS.BASE}/${supportCandidateId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get recommended candidates
   */
  public async getRecommendedCandidates(
    filter: ISupportCandidateFilterQuery & IPaginationRequest
  ): Promise<IPaginatedResponse<ISupportRecommendedCandidate>> {
    try {
      return await this.apiGet<
        IPaginatedResponse<ISupportRecommendedCandidate>
      >(
        `${SUPPORT_CANDIDATE_MANAGEMENT_ENDPOINTS.RECOMMENDED}${filter ? this.buildQueryString(filter) : ''}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Publish a candidate
   */
  public async publishCandidate(
    candidateId: string,
    note?: string
  ): Promise<ISupportCandidate> {
    try {
      return await this.apiPost<ISupportCandidate>(
        `${SUPPORT_CANDIDATE_MANAGEMENT_ENDPOINTS.PUBLISH}`,
        { candidateId, note }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Unpublish a candidate
   */
  public async unpublishCandidate(
    candidateId: string,
    note?: string
  ): Promise<ISupportCandidate> {
    try {
      return await this.apiPost<ISupportCandidate>(
        `${SUPPORT_CANDIDATE_MANAGEMENT_ENDPOINTS.UNPUBLISH}`,
        { candidateId, note }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Do not publish a candidate
   */
  public async doNotPublishCandidate(
    candidateId: string,
    note?: string
  ): Promise<ISupportCandidate> {
    try {
      return await this.apiPost<ISupportCandidate>(
        `${SUPPORT_CANDIDATE_MANAGEMENT_ENDPOINTS.DO_NOT_PUBLISH}`,
        { candidateId, note }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Reset onboarding assessment for a support candidate
   */
  public async resetOnboardingAssessment(
    supportCandidateId: string,
    data: ISupportCandidateResetOnboardingAssessmentRequest
  ): Promise<ISupportCandidateResetOnboardingAssessmentResponse> {
    try {
      return await this.apiPatch<ISupportCandidateResetOnboardingAssessmentResponse>(
        SUPPORT_CANDIDATE_MANAGEMENT_ENDPOINTS.RESET_ONBOARDING_ASSESSMENT.replace(
          ':supportCandidateId',
          supportCandidateId
        ),
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Resubmit onboarding assessment for re-analysis
   * Note: This endpoint has a 10-minute rate limit per candidate
   */
  public async resubmitOnboardingAssessment(
    supportCandidateId: string
  ): Promise<ISupportCandidateResetOnboardingAssessmentResponse> {
    try {
      return await this.apiPost<ISupportCandidateResetOnboardingAssessmentResponse>(
        SUPPORT_CANDIDATE_MANAGEMENT_ENDPOINTS.RESUBMIT_ONBOARDING_ASSESSMENT.replace(
          ':supportCandidateId',
          supportCandidateId
        ),
        {}
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Reset job AI assessment for a support candidate
   */
  public async resetJobAiAssessment(
    assessmentId: string,
    data: ISupportCandidateResetOnboardingAssessmentRequest
  ): Promise<ISupportCandidateResetOnboardingAssessmentResponse> {
    try {
      return await this.apiPatch<ISupportCandidateResetOnboardingAssessmentResponse>(
        SUPPORT_CANDIDATE_MANAGEMENT_ENDPOINTS.RESET_JOB_AI_ASSESSMENT.replace(
          ':assessmentId',
          assessmentId
        ),
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Resubmit job AI assessment for re-analysis
   * Note: This endpoint has a 10-minute rate limit per assessment
   */
  public async resubmitJobAssessment(
    assessmentId: string
  ): Promise<ISupportCandidateResetOnboardingAssessmentResponse> {
    try {
      return await this.apiPost<ISupportCandidateResetOnboardingAssessmentResponse>(
        SUPPORT_CANDIDATE_MANAGEMENT_ENDPOINTS.RESUBMIT_JOB_AI_ASSESSMENT.replace(
          ':assessmentId',
          assessmentId
        ),
        {}
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Resend expired job AI assessment invitation
   * Only expired invitations can be resent
   */
  public async resendJobAiAssessmentInvitation(
    invitationId: string
  ): Promise<ISupportCandidateActionResponse> {
    try {
      return await this.apiPost<ISupportCandidateActionResponse>(
        SUPPORT_CANDIDATE_MANAGEMENT_ENDPOINTS.RESEND_JOB_AI_INVITATION.replace(
          ':invitationId',
          invitationId
        ),
        {}
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get video chunks for an onboarding assessment (Support/Admin access)
   * Returns all relevant video chunks with optional playback URLs
   */
  public async getOnboardingVideoChunks(
    assessmentId: string,
    options?: {
      questionId?: string;
      includeAnalysis?: boolean;
      includePlaybackUrls?: boolean;
    }
  ): Promise<{
    chunks: Array<{
      id: string;
      chunkIndex: number;
      questionId: string | null;
      attemptNumber: number;
      status: string;
      createdAt: Date;
      analysis?: any;
      playbackUrl?: string;
    }>;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (options?.questionId) {
        queryParams.append('questionId', options.questionId);
      }
      if (options?.includeAnalysis !== undefined) {
        queryParams.append('includeAnalysis', String(options.includeAnalysis));
      }
      if (options?.includePlaybackUrls !== undefined) {
        queryParams.append(
          'includePlaybackUrls',
          String(options.includePlaybackUrls)
        );
      }

      const url =
        SUPPORT_CANDIDATE_MANAGEMENT_ENDPOINTS.ONBOARDING_VIDEO_CHUNKS.replace(
          ':assessmentId',
          assessmentId
        );
      const queryString = queryParams.toString();

      return await this.apiGet<{
        chunks: Array<{
          id: string;
          chunkIndex: number;
          questionId: string | null;
          attemptNumber: number;
          status: string;
          createdAt: Date;
          analysis?: any;
          playbackUrl?: string;
        }>;
      }>(`${url}${queryString ? `?${queryString}` : ''}`);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get playback URL for a specific video chunk (Support/Admin access)
   * Returns a signed URL valid for 1 hour
   */
  public async getOnboardingChunkPlaybackUrl(
    assessmentId: string,
    chunkId: string
  ): Promise<{ playbackUrl: string; expiresIn: number }> {
    try {
      const url =
        SUPPORT_CANDIDATE_MANAGEMENT_ENDPOINTS.ONBOARDING_CHUNK_PLAYBACK_URL.replace(
          ':assessmentId',
          assessmentId
        ).replace(':chunkId', chunkId);

      return await this.apiGet<{ playbackUrl: string; expiresIn: number }>(url);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get video chunks for a job AI assessment (Support/Admin access)
   * Returns all relevant video chunks with optional playback URLs
   */
  public async getJobAiAssessmentVideoChunks(
    assessmentId: string,
    options?: {
      questionId?: string;
      sectionId?: string;
      includeAnalysis?: boolean;
      includePlaybackUrls?: boolean;
    }
  ): Promise<{
    chunks: Array<{
      id: string;
      chunkIndex: number;
      questionId: string | null;
      sectionId: string | null;
      attemptNumber: number;
      status: string;
      createdAt: Date;
      analysis?: any;
      playbackUrl?: string;
    }>;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (options?.questionId) {
        queryParams.append('questionId', options.questionId);
      }
      if (options?.sectionId) {
        queryParams.append('sectionId', options.sectionId);
      }
      if (options?.includeAnalysis !== undefined) {
        queryParams.append('includeAnalysis', String(options.includeAnalysis));
      }
      if (options?.includePlaybackUrls !== undefined) {
        queryParams.append(
          'includePlaybackUrls',
          String(options.includePlaybackUrls)
        );
      }

      const url =
        SUPPORT_CANDIDATE_MANAGEMENT_ENDPOINTS.JOB_AI_VIDEO_CHUNKS.replace(
          ':assessmentId',
          assessmentId
        );
      const queryString = queryParams.toString();

      return await this.apiGet<{
        chunks: Array<{
          id: string;
          chunkIndex: number;
          questionId: string | null;
          sectionId: string | null;
          attemptNumber: number;
          status: string;
          createdAt: Date;
          analysis?: any;
          playbackUrl?: string;
        }>;
      }>(`${url}${queryString ? `?${queryString}` : ''}`); // Unwrap the data property
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get playback URL for a specific job AI assessment video chunk (Support/Admin access)
   * Returns a signed URL valid for 1 hour
   */
  public async getJobAiAssessmentChunkPlaybackUrl(
    assessmentId: string,
    chunkId: string
  ): Promise<{ playbackUrl: string; expiresIn: number }> {
    try {
      const url =
        SUPPORT_CANDIDATE_MANAGEMENT_ENDPOINTS.JOB_AI_CHUNK_PLAYBACK_URL.replace(
          ':assessmentId',
          assessmentId
        ).replace(':chunkId', chunkId);

      return await this.apiGet<{ playbackUrl: string; expiresIn: number }>(url); // Unwrap the data property
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
