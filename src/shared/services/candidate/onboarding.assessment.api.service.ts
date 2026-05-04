import { ApiService } from '../core/api.service';
import type { ICandidateOnboardingAssessmentFilterQuery } from '../../models/api/candidate/onboarding.assessment.api';
import {
  IPaginatedResponse,
  IPaginationRequest,
} from '../../models/api/common/common.api';
import {
  ICandidateOnboardingAssessment,
  ICandidateOnboardingAssessmentAnswerSubmitted,
  ICandidateOnboardingAssessmentTask,
  ICandidateOnboardingAssessmentPresignedUrl,
} from '../../models/domain/candidate/onboarding.assessment.domain';
import { singleton } from '../../decorators/singleton';

/**
 * API endpoints for onboarding assessment related operations
 *
 * This service provides methods for interacting with onboarding assessments.
 *
 * ## Public Endpoints (No Authentication Required)
 *
 * The following endpoints can be used without candidate authentication:
 *
 * ### Video Upload Presigned URL
 * ```typescript
 * const service = new CandidateOnboardingAssessmentApiService();
 * const result = await service.getPresignedUrlPublic("assessment-id");
 * // Returns: { presignedUrl: "https://..." }
 * ```
 *
 * ### Question Audio Upload Presigned URL
 * ```typescript
 * const service = new CandidateOnboardingAssessmentApiService();
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
 * - updateTermsAccepted()
 */
const ONBOARDING_ASSESSMENT_ENDPOINTS = {
  BASE: '/candidate/onboarding-assessments',
  INITIALIZE: '/candidate/onboarding-assessments/initialize',
  PRESIGNED_URL_PUBLIC:
    '/candidate/onboarding-assessments/{assessmentId}/presigned-url/public',
  QUESTION_AUDIO_PRESIGNED_URL_PUBLIC:
    '/candidate/onboarding-assessments/{assessmentId}/questions/{questionId}/audio-presigned-url/public',
  LATEST_BY_CANDIDATE_ID:
    '/candidate/onboarding-assessments/:candidateId/latest',
  TERMS_ACCEPTED: '/candidate/onboarding-assessments/terms-accepted',
} as const;

/**
 * Service for handling onboarding assessment related API operations
 */
@singleton
export class CandidateOnboardingAssessmentApiService extends ApiService {
  /**
   * Initializes a new onboarding assessment
   * @returns Promise resolving to the initialized assessment
   * @throws Error if the API request fails
   */
  public async initializeAssessment(): Promise<ICandidateOnboardingAssessmentTask> {
    try {
      return await this.apiPost<ICandidateOnboardingAssessmentTask>(
        ONBOARDING_ASSESSMENT_ENDPOINTS.INITIALIZE
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Starts an onboarding assessment
   * @param assessmentId - The ID of the assessment to start
   * @returns Promise resolving to the started assessment
   * @throws Error if the API request fails
   */
  public async startAssessment(
    assessmentId: string
  ): Promise<ICandidateOnboardingAssessment> {
    try {
      return await this.apiPost<ICandidateOnboardingAssessment>(
        `${ONBOARDING_ASSESSMENT_ENDPOINTS.BASE}/${assessmentId}/start`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets the task for an onboarding assessment
   * @param assessmentId - The ID of the assessment
   * @returns Promise resolving to the assessment task
   * @throws Error if the API request fails
   */
  public async getAssessmentTask(
    assessmentId: string
  ): Promise<ICandidateOnboardingAssessmentTask> {
    try {
      return await this.apiGet<ICandidateOnboardingAssessmentTask>(
        `${ONBOARDING_ASSESSMENT_ENDPOINTS.BASE}/${assessmentId}/task`
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
  ): Promise<ICandidateOnboardingAssessmentAnswerSubmitted> {
    try {
      return await this.apiPost<ICandidateOnboardingAssessmentAnswerSubmitted>(
        `${ONBOARDING_ASSESSMENT_ENDPOINTS.BASE}/${assessmentId}/questions/${questionId}/submit`,
        { answerGiven }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Retrieves all onboarding assessments with optional filtering
   * @param filter - Optional filter parameters
   * @returns Promise resolving to the list of onboarding assessments
   * @throws Error if the API request fails
   */
  public async getAssessments(
    filter?: ICandidateOnboardingAssessmentFilterQuery & IPaginationRequest
  ): Promise<IPaginatedResponse<ICandidateOnboardingAssessment>> {
    try {
      return await this.apiGet<
        IPaginatedResponse<ICandidateOnboardingAssessment>
      >(
        `${ONBOARDING_ASSESSMENT_ENDPOINTS.BASE}${filter ? this.buildQueryString(filter) : ''}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Retrieves a specific onboarding assessment
   * @param assessmentId - The ID of the assessment to retrieve
   * @returns Promise resolving to the assessment details
   * @throws Error if the API request fails
   */
  public async getAssessment(
    assessmentId: string
  ): Promise<ICandidateOnboardingAssessment> {
    try {
      return await this.apiGet<ICandidateOnboardingAssessment>(
        `${ONBOARDING_ASSESSMENT_ENDPOINTS.BASE}/${assessmentId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Retrieves the latest onboarding assessment
   * @returns Promise resolving to the assessment details
   * @throws Error if the API request fails
   */
  public async getLatestAssessment(): Promise<ICandidateOnboardingAssessment> {
    try {
      return await this.apiGet<ICandidateOnboardingAssessment>(
        `${ONBOARDING_ASSESSMENT_ENDPOINTS.BASE}/latest`
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
  ): Promise<ICandidateOnboardingAssessmentPresignedUrl> {
    try {
      return await this.apiGet<ICandidateOnboardingAssessmentPresignedUrl>(
        `${ONBOARDING_ASSESSMENT_ENDPOINTS.BASE}/${assessmentId}/presigned-url`
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
  ): Promise<ICandidateOnboardingAssessment> {
    try {
      return await this.apiPatch<ICandidateOnboardingAssessment>(
        `${ONBOARDING_ASSESSMENT_ENDPOINTS.BASE}/${assessmentId}/heartbeat`,
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
  ): Promise<ICandidateOnboardingAssessment> {
    try {
      return await this.apiPost<ICandidateOnboardingAssessment>(
        `${ONBOARDING_ASSESSMENT_ENDPOINTS.BASE}/${assessmentId}/proctor`,
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
  ): Promise<ICandidateOnboardingAssessment> {
    try {
      return await this.apiPost<ICandidateOnboardingAssessment>(
        `${ONBOARDING_ASSESSMENT_ENDPOINTS.BASE}/${assessmentId}/submit`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Updates the terms accepted status for a candidate
   * @param termsAccepted - Whether terms have been accepted
   * @returns Promise resolving to success message
   * @throws Error if the API request fails
   */
  public async updateTermsAccepted(
    termsAccepted: boolean
  ): Promise<{ message: string }> {
    try {
      return await this.apiPut<{ message: string }>(
        ONBOARDING_ASSESSMENT_ENDPOINTS.TERMS_ACCEPTED,
        {
          termsAccepted,
        }
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
  ): Promise<ICandidateOnboardingAssessmentPresignedUrl> {
    try {
      return await this.apiGet<ICandidateOnboardingAssessmentPresignedUrl>(
        `${ONBOARDING_ASSESSMENT_ENDPOINTS.BASE}/${assessmentId}/questions/${questionId}/audio-presigned-url`
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
  ): Promise<ICandidateOnboardingAssessmentPresignedUrl> {
    try {
      const url = ONBOARDING_ASSESSMENT_ENDPOINTS.PRESIGNED_URL_PUBLIC.replace(
        '{assessmentId}',
        assessmentId
      );
      return await this.apiGet<ICandidateOnboardingAssessmentPresignedUrl>(url);
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
  ): Promise<ICandidateOnboardingAssessmentPresignedUrl> {
    try {
      const url =
        ONBOARDING_ASSESSMENT_ENDPOINTS.QUESTION_AUDIO_PRESIGNED_URL_PUBLIC.replace(
          '{assessmentId}',
          assessmentId
        ).replace('{questionId}', questionId);
      return await this.apiGet<ICandidateOnboardingAssessmentPresignedUrl>(url);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  public async getLatestAssessmentByCandidateId(
    candidateId: string
  ): Promise<ICandidateOnboardingAssessment> {
    try {
      return await this.apiGet<ICandidateOnboardingAssessment>(
        ONBOARDING_ASSESSMENT_ENDPOINTS.LATEST_BY_CANDIDATE_ID.replace(
          ':candidateId',
          candidateId
        )
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
