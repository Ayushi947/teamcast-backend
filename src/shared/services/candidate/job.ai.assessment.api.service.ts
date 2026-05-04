import { ApiService } from '../core/api.service';
import type { ICandidateJobAiAssessmentFilterQuery } from '../../models/api/candidate/job.ai.assessment.api';
import {
  IPaginatedResponse,
  IPaginationRequest,
} from '../../models/api/common/common.api';
import {
  ICandidateJobAiAssessment,
  ICandidateJobAiAssessmentAnswerSubmitted,
  ICandidateJobAiAssessmentTask,
  ICandidateJobAiAssessmentPresignedUrl,
  ICandidateJobAiAssessmentInterviewsFilterQuery,
} from '../../models/domain/candidate/job.ai.assessment.domain';
import { IJobAiAssessmentInterviewItem } from '../../models/domain/client/job.ai.assessment.invite';

/**
 * API endpoints for job AI assessment related operations
 *
 * This service provides methods for interacting with job AI assessments.
 *
 * ## Public Endpoints (No Authentication Required)
 *
 * The following endpoints can be used without candidate authentication:
 *
 * ### Video Upload Presigned URL
 * ```typescript
 * const service = new CandidateJobAiAssessmentApiService();
 * const result = await service.getPresignedUrlPublic("assessment-id");
 * // Returns: { presignedUrl: "https://..." }
 * ```
 *
 * ### Video Upload Presigned URL by GCP Video URL
 * ```typescript
 * const service = new CandidateJobAiAssessmentApiService();
 * const result = await service.getPresignedUrlByVideoUrlPublic("gs://bucket-name/path/to/video");
 * // Returns: { presignedUrl: "https://..." }
 * ```
 *
 * ### Question Audio Upload Presigned URL
 * ```typescript
 * const service = new CandidateJobAiAssessmentApiService();
 * const result = await service.getQuestionAudioPresignedUrlPublic("assessment-id", "question-id");
 * // Returns: { presignedUrl: "https://..." }
 * ```
 *
 * ## Authenticated Endpoints
 *
 * The following endpoints require candidate authentication:
 * - initializeAssessment()
 * - startAssessment()
 * - submitAnswer()
 * - getAssessments()
 * - getAssessment()
 * - getLatestAssessment()
 * - getPresignedUrl() (authenticated version)
 * - getQuestionAudioPresignedUrl() (authenticated version)
 * - heartbeat()
 * - proctor()
 * - submitAssessment()
 * - listJobAiAssessmentInterviews()
 */
const JOB_AI_ASSESSMENT_ENDPOINTS = {
  BASE: '/candidate/job-ai-assessments',
  INITIALIZE:
    '/candidate/job-ai-assessments/:jobAiAssessmentInviteId/initialize',
  PRESIGNED_URL_PUBLIC:
    '/candidate/job-ai-assessments/{assessmentId}/presigned-url/public',
  PRESIGNED_URL_BY_VIDEO_URL_PUBLIC:
    '/candidate/job-ai-assessments/presigned-url/by-video-url',
  QUESTION_AUDIO_PRESIGNED_URL_PUBLIC:
    '/candidate/job-ai-assessments/{assessmentId}/questions/{questionId}/audio-presigned-url/public',

  INVITATION_URL: '/candidate/job-ai-assessments/{invitationId}/invitation-url',
  LATEST_BY_CANDIDATE_ID: '/candidate/job-ai-assessments/:candidateId/latest',
} as const;

/**
 * Service for handling job ai assessment related API operations
 */
export class CandidateJobAiAssessmentApiService extends ApiService {
  /**
   * Initializes a new job ai assessment
   * @param jobAiAssessmentInviteId - The ID of the job ai assessment invite
   * @returns Promise resolving to the initialized assessment
   * @throws Error if the API request fails
   */
  public async initializeAssessment(
    jobAiAssessmentInviteId: string
  ): Promise<ICandidateJobAiAssessmentTask> {
    try {
      return await this.apiPost<ICandidateJobAiAssessmentTask>(
        `${JOB_AI_ASSESSMENT_ENDPOINTS.INITIALIZE.replace(
          ':jobAiAssessmentInviteId',
          jobAiAssessmentInviteId
        )}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Starts an job ai assessment
   * @param assessmentId - The ID of the assessment to start
   * @returns Promise resolving to the started assessment
   * @throws Error if the API request fails
   */
  public async startAssessment(
    assessmentId: string
  ): Promise<ICandidateJobAiAssessment> {
    try {
      return await this.apiPost<ICandidateJobAiAssessment>(
        `${JOB_AI_ASSESSMENT_ENDPOINTS.BASE}/${assessmentId}/start`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets the task for an job ai assessment
   * @param assessmentId - The ID of the assessment
   * @returns Promise resolving to the assessment task
   * @throws Error if the API request fails
   */
  public async getAssessmentTask(
    assessmentId: string
  ): Promise<ICandidateJobAiAssessmentTask> {
    try {
      return await this.apiGet<ICandidateJobAiAssessmentTask>(
        `${JOB_AI_ASSESSMENT_ENDPOINTS.BASE}/${assessmentId}/task`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Submits an answer for a question in the assessment
   * @param assessmentId - The ID of the assessment
   * @param questionId - The ID of the question
   * @param answerGiven - The answer provided by the candidate
   * @returns Promise resolving to the next question or assessment completion
   * @throws Error if the API request fails
   */
  public async submitAnswer(
    assessmentId: string,
    questionId: string,
    answerGiven: string
  ): Promise<ICandidateJobAiAssessmentAnswerSubmitted> {
    try {
      return await this.apiPost<ICandidateJobAiAssessmentAnswerSubmitted>(
        `${JOB_AI_ASSESSMENT_ENDPOINTS.BASE}/${assessmentId}/questions/${questionId}/submit`,
        { answerGiven }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Retrieves all job ai assessments with optional filtering
   * @param filter - Optional filter parameters
   * @returns Promise resolving to the list of job ai assessments
   * @throws Error if the API request fails
   */
  public async getAssessments(
    filter?: ICandidateJobAiAssessmentFilterQuery & IPaginationRequest
  ): Promise<IPaginatedResponse<ICandidateJobAiAssessment>> {
    try {
      return await this.apiGet<IPaginatedResponse<ICandidateJobAiAssessment>>(
        `${JOB_AI_ASSESSMENT_ENDPOINTS.BASE}${filter ? this.buildQueryString(filter) : ''}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Retrieves a specific job ai assessment
   * @param assessmentId - The ID of the assessment to retrieve
   * @returns Promise resolving to the assessment details
   * @throws Error if the API request fails
   */
  public async getAssessment(
    assessmentId: string
  ): Promise<ICandidateJobAiAssessment> {
    try {
      return await this.apiGet<ICandidateJobAiAssessment>(
        `${JOB_AI_ASSESSMENT_ENDPOINTS.BASE}/${assessmentId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Retrieves the latest job ai assessment
   * @returns Promise resolving to the assessment details
   * @throws Error if the API request fails
   */
  public async getLatestAssessment(): Promise<ICandidateJobAiAssessment> {
    try {
      return await this.apiGet<ICandidateJobAiAssessment>(
        `${JOB_AI_ASSESSMENT_ENDPOINTS.BASE}/latest`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets a presigned URL for uploading video chunks
   * @param assessmentId - The ID of the assessment
   * @returns Promise resolving to the presigned URL
   * @throws Error if the API request fails
   */
  public async getPresignedUrl(
    assessmentId: string
  ): Promise<ICandidateJobAiAssessmentPresignedUrl> {
    try {
      return await this.apiGet<ICandidateJobAiAssessmentPresignedUrl>(
        `${JOB_AI_ASSESSMENT_ENDPOINTS.BASE}/${assessmentId}/presigned-url`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Updates the heartbeat status of an assessment
   * @param assessmentId - The ID of the assessment
   * @param duration - The duration of the assessment
   * @param status - The status of the assessment
   * @returns Promise resolving to the updated assessment
   * @throws Error if the API request fails
   */
  public async heartbeat(
    assessmentId: string,
    duration: number,
    status: string
  ): Promise<ICandidateJobAiAssessment> {
    try {
      return await this.apiPatch<ICandidateJobAiAssessment>(
        `${JOB_AI_ASSESSMENT_ENDPOINTS.BASE}/${assessmentId}/heartbeat`,
        { duration, status }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Records a proctoring event for an assessment
   * @param assessmentId - The ID of the assessment
   * @param type - The type of proctoring event
   * @returns Promise resolving to the updated proctoring information
   * @throws Error if the API request fails
   */
  public async proctor(
    assessmentId: string,
    type: string
  ): Promise<ICandidateJobAiAssessment> {
    try {
      return await this.apiPost<ICandidateJobAiAssessment>(
        `${JOB_AI_ASSESSMENT_ENDPOINTS.BASE}/${assessmentId}/proctor`,
        { type }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Submits an assessment for AI review
   * @param assessmentId - The ID of the assessment to submit
   * @returns Promise resolving to the submitted assessment
   * @throws Error if the API request fails
   */
  public async submitAssessment(
    assessmentId: string
  ): Promise<ICandidateJobAiAssessment> {
    try {
      return await this.apiPost<ICandidateJobAiAssessment>(
        `${JOB_AI_ASSESSMENT_ENDPOINTS.BASE}/${assessmentId}/submit`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets a presigned URL for uploading question response audio
   * @param assessmentId - The ID of the assessment
   * @param questionId - The ID of the question
   * @returns Promise resolving to the presigned URL
   * @throws Error if the API request fails
   */
  public async getQuestionAudioPresignedUrl(
    assessmentId: string,
    questionId: string
  ): Promise<ICandidateJobAiAssessmentPresignedUrl> {
    try {
      return await this.apiGet<ICandidateJobAiAssessmentPresignedUrl>(
        `${JOB_AI_ASSESSMENT_ENDPOINTS.BASE}/${assessmentId}/questions/${questionId}/audio-presigned-url`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Lists job ai assessment interviews with pagination support
   * @param filter - filter parameters
   * @returns Promise resolving to the list of job ai assessment interviews
   * @throws Error if the API request fails
   */
  public async listJobAiAssessmentInterviews(
    filter: ICandidateJobAiAssessmentInterviewsFilterQuery & IPaginationRequest
  ): Promise<IPaginatedResponse<IJobAiAssessmentInterviewItem>> {
    try {
      return await this.apiGet<
        IPaginatedResponse<IJobAiAssessmentInterviewItem>
      >(
        `${JOB_AI_ASSESSMENT_ENDPOINTS.BASE}/interviews${filter ? this.buildQueryString(filter) : ''}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets a presigned URL for uploading video chunks (public endpoint - no authentication required)
   * @param assessmentId - The ID of the assessment
   * @returns Promise resolving to the presigned URL
   * @throws Error if the API request fails
   */
  public async getPresignedUrlPublic(
    assessmentId: string
  ): Promise<ICandidateJobAiAssessmentPresignedUrl> {
    try {
      const url = JOB_AI_ASSESSMENT_ENDPOINTS.PRESIGNED_URL_PUBLIC.replace(
        '{assessmentId}',
        assessmentId
      );
      return await this.apiGet<ICandidateJobAiAssessmentPresignedUrl>(url);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets a presigned URL for uploading question response audio (public endpoint - no authentication required)
   * @param assessmentId - The ID of the assessment
   * @param questionId - The ID of the question
   * @returns Promise resolving to the presigned URL
   * @throws Error if the API request fails
   */
  public async getQuestionAudioPresignedUrlPublic(
    assessmentId: string,
    questionId: string
  ): Promise<ICandidateJobAiAssessmentPresignedUrl> {
    try {
      const url =
        JOB_AI_ASSESSMENT_ENDPOINTS.QUESTION_AUDIO_PRESIGNED_URL_PUBLIC.replace(
          '{assessmentId}',
          assessmentId
        ).replace('{questionId}', questionId);
      return await this.apiGet<ICandidateJobAiAssessmentPresignedUrl>(url);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets a presigned URL for uploading video chunks using GCP video URL (public endpoint - no authentication required)
   * @param videoUrl - The GCP video URL
   * @returns Promise resolving to the presigned URL
   * @throws Error if the API request fails
   */
  public async getPresignedUrlByVideoUrlPublic(
    videoUrl: string
  ): Promise<ICandidateJobAiAssessmentPresignedUrl> {
    try {
      return await this.apiGet<ICandidateJobAiAssessmentPresignedUrl>(
        `${JOB_AI_ASSESSMENT_ENDPOINTS.PRESIGNED_URL_BY_VIDEO_URL_PUBLIC}?videoUrl=${encodeURIComponent(videoUrl)}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets a job ai assessment invitation URL
   * @param invitationId - The ID of the invitation
   * @returns Promise resolving to the invitation URL
   * @throws Error if the API request fails
   */
  public async getJobAiAssessmentInvitationUrl(
    invitationId: string
  ): Promise<string> {
    try {
      const url = JOB_AI_ASSESSMENT_ENDPOINTS.INVITATION_URL.replace(
        '{invitationId}',
        invitationId
      );
      return await this.apiGet<string>(url);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets the latest job ai assessment for a candidate
   * @param candidateId - The ID of the candidate
   * @returns Promise resolving to the assessment details
   * @throws Error if the API request fails
   */
  public async getLatestJobAiAssessmentByCandidateId(
    candidateId: string
  ): Promise<ICandidateJobAiAssessment> {
    try {
      return await this.apiGet<ICandidateJobAiAssessment>(
        `${JOB_AI_ASSESSMENT_ENDPOINTS.LATEST_BY_CANDIDATE_ID.replace(':candidateId', candidateId)}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets video chunks for a job AI assessment
   * @param assessmentId - The ID of the assessment
   * @param options - Optional parameters
   * @param options.includePlaybackUrls - Whether to include signed playback URLs
   * @returns Promise resolving to the video chunks
   * @throws Error if the API request fails
   */
  public async getVideoChunks(
    assessmentId: string,
    options?: { includePlaybackUrls?: boolean }
  ): Promise<{
    chunks: Array<{
      id: string;
      chunkIndex: number;
      gcsUri: string;
      playbackUrl?: string;
      status: string;
      createdAt: Date;
    }>;
  }> {
    try {
      const queryParams = options?.includePlaybackUrls
        ? '?includePlaybackUrls=true'
        : '';
      return await this.apiGet<{
        chunks: Array<{
          id: string;
          chunkIndex: number;
          gcsUri: string;
          playbackUrl?: string;
          status: string;
          createdAt: Date;
        }>;
      }>(
        `${JOB_AI_ASSESSMENT_ENDPOINTS.BASE}/${assessmentId}/video-chunks${queryParams}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
