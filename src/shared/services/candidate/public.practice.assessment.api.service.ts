import { ApiService } from '../core/api.service';
import {
  IPublicPracticeAssessment,
  IPublicPracticeAssessmentCreate,
  IPublicPracticeAssessmentTask,
  IPublicPracticeAssessmentAnswerSubmitted,
  IPublicPracticeAssessmentPresignedUrl,
  IPublicPracticeAssessmentChunkUpload,
} from '../../models/domain/candidate/public.practice.assessment.domain';

/**
 * API endpoints for public practice assessment related operations
 *
 * This service provides methods for interacting with public practice assessments.
 * All endpoints are public (no authentication required).
 */
const PUBLIC_PRACTICE_ASSESSMENT_ENDPOINTS = {
  BASE: '/public/practice-assessments',
  PARSE: '/public/practice-assessments/parse',
  GET_PARSED_JOB_DATA:
    '/public/practice-assessments/parsed-job-data/:parsedJobDataId',
  CREATE: '/public/practice-assessments',
  GET: '/public/practice-assessments/:assessmentId',
  GET_TASK: '/public/practice-assessments/:assessmentId/task',
  INITIALIZE: '/public/practice-assessments/:assessmentId/initialize',
  START: '/public/practice-assessments/:assessmentId/start',
  SUBMIT_ANSWER:
    '/public/practice-assessments/:assessmentId/questions/:questionId/submit',
  SUBMIT: '/public/practice-assessments/:assessmentId/submit',
  LINK: '/public/practice-assessments/:assessmentId/link',
  GET_BY_EMAIL: '/public/practice-assessments/by-email',
  CHECK_CANDIDATE: '/public/practice-assessments/check-candidate',
  LIST_FOR_CANDIDATE: '/candidate/practice-assessments',
  PRESIGNED_URL: '/public/practice-assessments/:assessmentId/presigned-url',
  RECORD_CHUNK: '/public/practice-assessments/:assessmentId/chunks',
  UPDATE_TERMS_ACCEPTED:
    '/public/practice-assessments/:assessmentId/terms-accepted',
  VIDEO_CHUNKS_PRESIGNED_URL:
    '/public/practice-assessments/:assessmentId/video-chunks/presigned-url',
  VIDEO_CHUNKS_RECORD:
    '/public/practice-assessments/:assessmentId/video-chunks/record',
  VIDEO_CHUNKS: '/public/practice-assessments/:assessmentId/video-chunks',
  PROCTORING: '/public/practice-assessments/:assessmentId/proctoring',
  VIDEO_ANALYSIS_TRIGGER:
    '/public/practice-assessments/:assessmentId/video-analysis/trigger',
  VIDEO_ANALYSIS: '/public/practice-assessments/:assessmentId/video-analysis',
  PARSE_DESCRIPTION: '/public/practice-assessments/parse-description',
  HEARTBEAT: '/public/practice-assessments/:assessmentId/heartbeat',
} as const;

/**
 * Service for handling public practice assessment related API operations
 */
export class PublicPracticeAssessmentApiService extends ApiService {
  /**
   * Parses a job URL and stores parsed job data, returns ID
   * @param jobUrl - The URL of the job posting to parse
   * @returns Promise resolving to the parsed job data ID
   * @throws Error if the API request fails
   */
  public async parseJobUrl(
    jobUrl: string
  ): Promise<{ parsedJobDataId: string }> {
    try {
      const response = await this.apiPost<{ parsedJobDataId: string }>(
        PUBLIC_PRACTICE_ASSESSMENT_ENDPOINTS.PARSE,
        {
          jobUrl,
        }
      );
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Parses a job description text and stores parsed job data, returns ID
   * @param jobDescriptionText - The job description text to parse
   * @returns Promise resolving to the parsed job data ID
   * @throws Error if the API request fails
   */
  public async parseJobDescription(
    jobDescriptionText: string
  ): Promise<{ parsedJobDataId: string }> {
    try {
      const response = await this.apiPost<{ parsedJobDataId: string }>(
        PUBLIC_PRACTICE_ASSESSMENT_ENDPOINTS.PARSE_DESCRIPTION,
        {
          jobDescriptionText,
        }
      );
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets parsed job data by ID
   * @param parsedJobDataId - The ID of the stored parsed job data
   * @returns Promise resolving to the parsed job data
   * @throws Error if the API request fails
   */
  public async getParsedJobData(parsedJobDataId: string): Promise<any> {
    try {
      const url =
        PUBLIC_PRACTICE_ASSESSMENT_ENDPOINTS.GET_PARSED_JOB_DATA.replace(
          ':parsedJobDataId',
          parsedJobDataId
        );
      return await this.apiGet<any>(url);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Creates a new public practice assessment from parsed job data
   * @param createRequest - The request containing parsed job data ID or parsed job data, candidate name and email, and optionally resume file
   * @returns Promise resolving to the created assessment
   * @throws Error if the API request fails
   */
  public async createAssessment(
    createRequest: IPublicPracticeAssessmentCreate
  ): Promise<{
    assessment: IPublicPracticeAssessment;
    metadata?: {
      requiresPasswordSetup: boolean;
      hasResume: boolean;
      resumeParsed: boolean;
    };
  }> {
    try {
      // If resume file is provided, send as FormData
      if (createRequest.resumeFile && createRequest.resumeFileName) {
        const formData = new FormData();

        // Handle Buffer (Node.js) - convert to Blob for FormData
        if (Buffer.isBuffer(createRequest.resumeFile)) {
          // For Node.js environments, create a Blob from Buffer
          const blob = new Blob([
            createRequest.resumeFile as unknown as ArrayBuffer,
          ]);
          formData.append('resumeFile', blob, createRequest.resumeFileName);
        } else {
          // Handle File (browser) or other types
          formData.append(
            'resumeFile',
            createRequest.resumeFile,
            createRequest.resumeFileName
          );
        }

        if (createRequest.parsedJobDataId) {
          formData.append('parsedJobDataId', createRequest.parsedJobDataId);
        }
        formData.append('candidateName', createRequest.candidateName);
        formData.append('candidateEmail', createRequest.candidateEmail);

        // Use standard apiPost method with FormData config
        const response = await this.apiPost<{
          data: IPublicPracticeAssessment;
          metadata?: {
            requiresPasswordSetup: boolean;
            hasResume: boolean;
            resumeParsed: boolean;
          };
        }>(PUBLIC_PRACTICE_ASSESSMENT_ENDPOINTS.CREATE, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return {
          assessment: response.data || response,
          metadata: response.metadata,
        };
      } else {
        // No file, use regular JSON POST
        const response = await this.apiPost<{
          data: IPublicPracticeAssessment;
          metadata?: {
            requiresPasswordSetup: boolean;
            hasResume: boolean;
            resumeParsed: boolean;
          };
        }>(PUBLIC_PRACTICE_ASSESSMENT_ENDPOINTS.CREATE, createRequest);
        return {
          assessment: response.data || response,
          metadata: response.metadata,
        };
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets a public practice assessment by ID
   * @param assessmentId - The ID of the assessment to retrieve
   * @returns Promise resolving to the assessment details
   * @throws Error if the API request fails
   */
  public async getAssessment(
    assessmentId: string
  ): Promise<IPublicPracticeAssessment> {
    try {
      return await this.apiGet<IPublicPracticeAssessment>(
        PUBLIC_PRACTICE_ASSESSMENT_ENDPOINTS.GET.replace(
          ':assessmentId',
          assessmentId
        )
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets the initialization task for a public practice assessment
   * @param assessmentId - The ID of the assessment
   * @returns Promise resolving to the assessment task
   * @throws Error if the API request fails
   */
  public async getTask(
    assessmentId: string
  ): Promise<IPublicPracticeAssessmentTask> {
    try {
      return await this.apiGet<IPublicPracticeAssessmentTask>(
        PUBLIC_PRACTICE_ASSESSMENT_ENDPOINTS.GET_TASK.replace(
          ':assessmentId',
          assessmentId
        )
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Initializes a public practice assessment (matches job AI assessment flow)
   * Called when user clicks "I am ready" on check page
   * @param assessmentId - The ID of the assessment to initialize
   * @returns Promise resolving to the assessment task
   * @throws Error if the API request fails
   */
  public async initializeAssessment(
    assessmentId: string
  ): Promise<IPublicPracticeAssessmentTask> {
    try {
      return await this.apiPost<IPublicPracticeAssessmentTask>(
        PUBLIC_PRACTICE_ASSESSMENT_ENDPOINTS.INITIALIZE.replace(
          ':assessmentId',
          assessmentId
        )
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Starts a public practice assessment
   * @param assessmentId - The ID of the assessment to start
   * @returns Promise resolving to the started assessment
   * @throws Error if the API request fails
   */
  public async startAssessment(
    assessmentId: string
  ): Promise<IPublicPracticeAssessment> {
    try {
      return await this.apiPost<IPublicPracticeAssessment>(
        PUBLIC_PRACTICE_ASSESSMENT_ENDPOINTS.START.replace(
          ':assessmentId',
          assessmentId
        )
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
  ): Promise<IPublicPracticeAssessmentAnswerSubmitted> {
    try {
      return await this.apiPost<IPublicPracticeAssessmentAnswerSubmitted>(
        PUBLIC_PRACTICE_ASSESSMENT_ENDPOINTS.SUBMIT_ANSWER.replace(
          ':assessmentId',
          assessmentId
        ).replace(':questionId', questionId),
        { answerGiven }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Submits a public practice assessment for completion
   * @param assessmentId - The ID of the assessment to submit
   * @returns Promise resolving to the submitted assessment
   * @throws Error if the API request fails
   */
  public async submitAssessment(
    assessmentId: string
  ): Promise<IPublicPracticeAssessment> {
    try {
      return await this.apiPost<IPublicPracticeAssessment>(
        PUBLIC_PRACTICE_ASSESSMENT_ENDPOINTS.SUBMIT.replace(
          ':assessmentId',
          assessmentId
        )
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Links a public practice assessment to a candidate account
   * @param assessmentId - The ID of the assessment
   * @param candidateId - The ID of the candidate
   * @returns Promise resolving to the linked assessment
   * @throws Error if the API request fails
   */
  public async linkToCandidate(
    assessmentId: string,
    candidateId: string
  ): Promise<IPublicPracticeAssessment> {
    try {
      return await this.apiPost<IPublicPracticeAssessment>(
        PUBLIC_PRACTICE_ASSESSMENT_ENDPOINTS.LINK.replace(
          ':assessmentId',
          assessmentId
        ),
        { candidateId }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets public practice assessments by email
   * @param email - The email address to search for
   * @returns Promise resolving to the list of assessments
   * @throws Error if the API request fails
   */
  public async getByEmail(email: string): Promise<IPublicPracticeAssessment[]> {
    try {
      return await this.apiGet<IPublicPracticeAssessment[]>(
        `${PUBLIC_PRACTICE_ASSESSMENT_ENDPOINTS.GET_BY_EMAIL}?email=${encodeURIComponent(email)}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Checks if candidate exists by email and returns candidate info
   * @param email - The email address to check
   * @returns Promise resolving to candidate check result
   * @throws Error if the API request fails
   */
  public async checkCandidateByEmail(email: string): Promise<{
    exists: boolean;
    name?: string;
    hasResume: boolean;
    resumeParsed: boolean;
    userType?: string;
  }> {
    try {
      return await this.apiGet<{
        exists: boolean;
        name?: string;
        hasResume: boolean;
        resumeParsed: boolean;
        userType?: string;
      }>(
        `${PUBLIC_PRACTICE_ASSESSMENT_ENDPOINTS.CHECK_CANDIDATE}?email=${encodeURIComponent(email)}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets a presigned URL for uploading video chunks
   * @param assessmentId - The ID of the assessment
   * @param chunkIndex - Optional chunk index. If not provided, next available index is used.
   * @returns Promise resolving to the presigned URL and chunk information
   * @throws Error if the API request fails
   */
  public async getPresignedUrl(
    assessmentId: string,
    chunkIndex?: number
  ): Promise<
    IPublicPracticeAssessmentPresignedUrl & {
      chunkIndex: number;
      gcsUri: string;
      filePath: string;
    }
  > {
    try {
      const url = PUBLIC_PRACTICE_ASSESSMENT_ENDPOINTS.PRESIGNED_URL.replace(
        ':assessmentId',
        assessmentId
      );
      const queryParams =
        chunkIndex !== undefined ? `?chunkIndex=${chunkIndex}` : '';
      return await this.apiGet<
        IPublicPracticeAssessmentPresignedUrl & {
          chunkIndex: number;
          gcsUri: string;
          filePath: string;
        }
      >(`${url}${queryParams}`);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Records a video chunk upload and triggers analysis
   * @param assessmentId - The ID of the assessment
   * @param chunkIndex - The index of the chunk
   * @param gcsUri - The GCS URI of the uploaded chunk
   * @param questionId - Optional question ID this chunk belongs to
   * @param sectionId - Optional section ID this chunk belongs to
   * @returns Promise resolving to the chunk upload result
   * @throws Error if the API request fails
   */
  public async recordChunkUpload(
    assessmentId: string,
    chunkIndex: number,
    gcsUri: string,
    questionId?: string,
    sectionId?: string
  ): Promise<IPublicPracticeAssessmentChunkUpload> {
    try {
      return await this.apiPost<IPublicPracticeAssessmentChunkUpload>(
        PUBLIC_PRACTICE_ASSESSMENT_ENDPOINTS.RECORD_CHUNK.replace(
          ':assessmentId',
          assessmentId
        ),
        {
          chunkIndex,
          gcsUri,
          questionId,
          sectionId,
        }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Updates terms acceptance status for a public practice assessment
   * @param assessmentId - The ID of the assessment
   * @param termsAccepted - Whether terms have been accepted
   * @returns Promise resolving to a success message
   * @throws Error if the API request fails
   */
  public async updateTermsAccepted(
    assessmentId: string,
    termsAccepted: boolean
  ): Promise<{ message: string }> {
    try {
      return await this.apiPut<{ message: string }>(
        PUBLIC_PRACTICE_ASSESSMENT_ENDPOINTS.UPDATE_TERMS_ACCEPTED.replace(
          ':assessmentId',
          assessmentId
        ),
        { termsAccepted }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets a presigned URL for uploading a video chunk
   * @param assessmentId - The ID of the assessment
   * @param chunkIndex - Optional chunk index
   * @param questionId - Optional question ID
   * @param sectionId - Optional section ID
   * @returns Promise resolving to the presigned URL and chunk information
   * @throws Error if the API request fails
   */
  public async getPresignedUrlForVideoChunk(
    assessmentId: string,
    chunkIndex?: number,
    questionId?: string,
    sectionId?: string
  ): Promise<
    IPublicPracticeAssessmentPresignedUrl & {
      chunkIndex: number;
      gcsUri: string;
      filePath: string;
    }
  > {
    try {
      const url =
        PUBLIC_PRACTICE_ASSESSMENT_ENDPOINTS.VIDEO_CHUNKS_PRESIGNED_URL.replace(
          ':assessmentId',
          assessmentId
        );
      const params = new URLSearchParams();
      if (chunkIndex !== undefined)
        params.append('chunkIndex', String(chunkIndex));
      if (questionId) params.append('questionId', questionId);
      if (sectionId) params.append('sectionId', sectionId);
      const queryString = params.toString();
      return await this.apiPost<
        IPublicPracticeAssessmentPresignedUrl & {
          chunkIndex: number;
          gcsUri: string;
          filePath: string;
        }
      >(`${url}${queryString ? `?${queryString}` : ''}`);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Records a video chunk upload and triggers analysis
   * @param assessmentId - The ID of the assessment
   * @param chunkIndex - The index of the chunk
   * @param gcsUri - The GCS URI of the uploaded chunk
   * @param questionId - Optional question ID this chunk belongs to
   * @param sectionId - Optional section ID this chunk belongs to
   * @returns Promise resolving to the chunk upload result
   * @throws Error if the API request fails
   */
  public async recordVideoChunkUpload(
    assessmentId: string,
    chunkIndex: number,
    gcsUri: string,
    questionId?: string,
    sectionId?: string
  ): Promise<IPublicPracticeAssessmentChunkUpload> {
    try {
      return await this.apiPost<IPublicPracticeAssessmentChunkUpload>(
        PUBLIC_PRACTICE_ASSESSMENT_ENDPOINTS.VIDEO_CHUNKS_RECORD.replace(
          ':assessmentId',
          assessmentId
        ),
        {
          chunkIndex,
          gcsUri,
          questionId,
          sectionId,
        }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets video chunks for an assessment
   * @param assessmentId - The ID of the assessment
   * @param options - Optional filters and options
   * @returns Promise resolving to the video chunks
   * @throws Error if the API request fails
   */
  public async getVideoChunks(
    assessmentId: string,
    options?: {
      questionId?: string;
      sectionId?: string;
      includeAnalysis?: boolean;
      includePlaybackUrls?: boolean;
    }
  ): Promise<
    Array<{
      id: string;
      chunkIndex: number;
      questionId: string | null;
      sectionId: string | null;
      attemptNumber: number;
      status: string;
      createdAt: Date;
      analysis?: any;
      playbackUrl?: string;
      playbackUrlError?: string;
    }>
  > {
    try {
      const url = PUBLIC_PRACTICE_ASSESSMENT_ENDPOINTS.VIDEO_CHUNKS.replace(
        ':assessmentId',
        assessmentId
      );
      const params = new URLSearchParams();
      if (options?.questionId) params.append('questionId', options.questionId);
      if (options?.sectionId) params.append('sectionId', options.sectionId);
      if (options?.includeAnalysis !== undefined)
        params.append('includeAnalysis', String(options.includeAnalysis));
      if (options?.includePlaybackUrls !== undefined)
        params.append(
          'includePlaybackUrls',
          String(options.includePlaybackUrls)
        );
      const queryString = params.toString();
      return await this.apiGet<
        Array<{
          id: string;
          chunkIndex: number;
          questionId: string | null;
          sectionId: string | null;
          attemptNumber: number;
          status: string;
          createdAt: Date;
          analysis?: any;
          playbackUrl?: string;
          playbackUrlError?: string;
        }>
      >(`${url}${queryString ? `?${queryString}` : ''}`);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Records a proctoring event
   * @param assessmentId - The ID of the assessment
   * @param type - The type of proctoring event
   * @param data - Optional event data
   * @returns Promise resolving to the proctoring result
   * @throws Error if the API request fails
   */
  public async recordProctoringEvent(
    assessmentId: string,
    type: string,
    data?: any
  ): Promise<{ success: boolean; warningCount: number }> {
    try {
      return await this.apiPost<{ success: boolean; warningCount: number }>(
        PUBLIC_PRACTICE_ASSESSMENT_ENDPOINTS.PROCTORING.replace(
          ':assessmentId',
          assessmentId
        ),
        {
          type,
          data,
        }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets proctoring data for an assessment
   * @param assessmentId - The ID of the assessment
   * @returns Promise resolving to the proctoring data
   * @throws Error if the API request fails
   */
  public async getProctoringData(assessmentId: string): Promise<any> {
    try {
      return await this.apiGet<any>(
        PUBLIC_PRACTICE_ASSESSMENT_ENDPOINTS.PROCTORING.replace(
          ':assessmentId',
          assessmentId
        )
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Triggers video analysis for an assessment
   * @param assessmentId - The ID of the assessment
   * @returns Promise resolving to the trigger result
   * @throws Error if the API request fails
   */
  public async triggerVideoAnalysis(
    assessmentId: string
  ): Promise<{ success: boolean }> {
    try {
      return await this.apiPost<{ success: boolean }>(
        PUBLIC_PRACTICE_ASSESSMENT_ENDPOINTS.VIDEO_ANALYSIS_TRIGGER.replace(
          ':assessmentId',
          assessmentId
        )
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets video analysis results for an assessment
   * @param assessmentId - The ID of the assessment
   * @returns Promise resolving to the video analysis results
   * @throws Error if the API request fails
   */
  public async getVideoAnalysis(assessmentId: string): Promise<any> {
    try {
      return await this.apiGet<any>(
        PUBLIC_PRACTICE_ASSESSMENT_ENDPOINTS.VIDEO_ANALYSIS.replace(
          ':assessmentId',
          assessmentId
        )
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets practice assessments for authenticated candidate with pagination
   * @param options - Pagination and sorting options
   * @returns Promise resolving to paginated list of practice assessments
   * @throws Error if the API request fails
   */
  public async getPracticeAssessmentsForCandidate(options?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    items: IPublicPracticeAssessment[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (options?.page) {
        queryParams.append('page', options.page.toString());
      }
      if (options?.limit) {
        queryParams.append('limit', options.limit.toString());
      }
      if (options?.sortBy) {
        queryParams.append('sortBy', options.sortBy);
      }
      if (options?.sortOrder) {
        queryParams.append('sortOrder', options.sortOrder);
      }

      const url = `${PUBLIC_PRACTICE_ASSESSMENT_ENDPOINTS.LIST_FOR_CANDIDATE}${
        queryParams.toString() ? `?${queryParams.toString()}` : ''
      }`;

      const response = await this.apiGet<{
        items: IPublicPracticeAssessment[];
        pagination: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      }>(url);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Sends heartbeat to update assessment duration with remaining time
   * This keeps the timer state synchronized on page refresh
   * @param assessmentId - The ID of the assessment
   * @param duration - The remaining time in seconds
   * @param status - Optional status update
   * @returns Promise resolving to success boolean
   * @throws Error if the API request fails
   */
  public async heartbeat(
    assessmentId: string,
    duration: number,
    status?: string
  ): Promise<boolean> {
    try {
      const response = await this.apiPost<boolean>(
        PUBLIC_PRACTICE_ASSESSMENT_ENDPOINTS.HEARTBEAT.replace(
          ':assessmentId',
          assessmentId
        ),
        {
          duration,
          status,
        }
      );
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
