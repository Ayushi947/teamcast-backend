import {
  IApiRequest,
  IApiResponse,
  IPaginatedResponse,
  IApiPaginatedRequest,
} from '../common/common.api';
import {
  ICandidateOnboardingAssessment,
  ICandidateOnboardingAssessmentTask,
  ICandidateOnboardingAssessmentSubmitAnswer,
  ICandidateOnboardingAssessmentAnswerSubmitted,
  ICandidateOnboardingAssessmentProctoring,
  ICandidateOnboardingAssessmentPresignedUrl,
} from '../../domain/candidate/onboarding.assessment.domain';
import {
  OnboardingAssessmentStatusEnum,
  ProctorTypeEnum,
} from '../../common/enums';

/**
 * @openapi
 * components:
 *   parameters:
 *     ICandidateOnboardingAssessmentFilterQueryStatus:
 *       in: query
 *       name: status
 *       schema:
 *         type: string
 *         enum:
 *           - NOT_STARTED
 *           - IN_PROGRESS
 *           - COMPLETED
 *       description: Filter by assessment status
 */
export interface ICandidateOnboardingAssessmentFilterQuery {
  status?: OnboardingAssessmentStatusEnum;
}

export type ICandidateOnboardingAssessmentListRequest = IApiPaginatedRequest<
  void,
  ICandidateOnboardingAssessmentFilterQuery
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateOnboardingAssessmentListGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPaginatedResponse'
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ICandidateOnboardingAssessment'
 */
export type ICandidateOnboardingAssessmentListGetApiResponse = IApiResponse<
  IPaginatedResponse<ICandidateOnboardingAssessment>
>;

/**
 * @openapi
 * components:
 *   parameters:
 *     ICandidateOnboardingAssessmentIdParams:
 *       in: path
 *       name: assessmentId
 *       required: true
 *       schema:
 *         type: string
 */
export interface ICandidateOnboardingAssessmentIdParams {
  assessmentId: string;
}

export type ICandidateOnboardingAssessmentGetApiRequest = IApiRequest<
  void,
  void,
  ICandidateOnboardingAssessmentIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateOnboardingAssessmentGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidateOnboardingAssessment'
 */
export type ICandidateOnboardingAssessmentGetApiResponse =
  IApiResponse<ICandidateOnboardingAssessment>;

export type ICandidateLatestOnboardingAssessmentGetApiRequest =
  IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateLatestOnboardingAssessmentGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidateOnboardingAssessment'
 */
export type ICandidateLatestOnboardingAssessmentGetApiResponse =
  IApiResponse<ICandidateOnboardingAssessment>;

type ICandidateOnboardingAssessmentCandidateIdParams = {
  candidateId: string;
};

/**
 * @openapi
 * components:
 *   parameters:
 *     ICandidateOnboardingAssessmentCandidateIdParams:
 *       in: path
 *       name: candidateId
 *       required: true
 *       schema:
 *         type: string
 */
export type ICandidateOnboardingAssessmentGetLatestByCandidateIdApiRequest =
  IApiRequest<void, void, ICandidateOnboardingAssessmentCandidateIdParams>;

/*
 * Initialize the onboarding assessment
 */
export type ICandidateOnboardingAssessmentInitializeApiResquest =
  IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateOnboardingAssessmentInitializeApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidateOnboardingAssessmentTask'
 */
export type ICandidateOnboardingAssessmentInitializeApiResponse =
  IApiResponse<ICandidateOnboardingAssessmentTask>;

export type ICandidateOnboardingAssessmentTaskGetApiRequest = IApiRequest<
  void,
  void,
  ICandidateOnboardingAssessmentIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateOnboardingAssessmentTaskGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidateOnboardingAssessmentTask'
 */
export type ICandidateOnboardingAssessmentTaskGetApiResponse =
  IApiResponse<ICandidateOnboardingAssessmentTask>;

/**
 * Start the onboarding assessment
 */
export type ICandidateOnboardingAssessmentStartApiRequest = IApiRequest<
  void,
  void,
  ICandidateOnboardingAssessmentIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateOnboardingAssessmentStartApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 task:
 *                   $ref: '#/components/schemas/ICandidateOnboardingAssessment'
 */
export type ICandidateOnboardingAssessmentStartApiResponse =
  IApiResponse<ICandidateOnboardingAssessment>;

/**
 * @openapi
 * components:
 *   parameters:
 *     ICandidateOnboardingAssessmentQuestionIdParams:
 *       in: path
 *       name: questionId
 *       required: true
 *       schema:
 *         type: string
 */
export interface ICandidateOnboardingAssessmentQuestionIdParams {
  questionId: string;
}

/**
 * Submit an answer to the onboarding assessment
 */
export type ICandidateOnboardingAssessmentSubmitAnswerApiRequest = IApiRequest<
  ICandidateOnboardingAssessmentSubmitAnswer,
  void,
  ICandidateOnboardingAssessmentIdParams &
    ICandidateOnboardingAssessmentQuestionIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateOnboardingAssessmentSubmitAnswerApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 currentQuestion:
 *                   $ref: '#/components/schemas/ICandidateOnboardingAssessmentQuestion'
 *                 isLastQuestion:
 *                   type: boolean
 *                   description: Whether this is the last question in the assessment
 */
export type ICandidateOnboardingAssessmentSubmitAnswerApiResponse =
  IApiResponse<ICandidateOnboardingAssessmentAnswerSubmitted>;

/**
 * Heartbeat (status update) API
 */
export type ICandidateOnboardingAssessmentHeartbeatApiRequest = IApiRequest<
  { duration: number; status?: string },
  void,
  ICandidateOnboardingAssessmentIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateOnboardingAssessmentHeartbeatApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: boolean
 */
export type ICandidateOnboardingAssessmentHeartbeatApiResponse =
  IApiResponse<boolean>;

/**
 * Proctoring API
 */
export type ICandidateOnboardingAssessmentProctorApiRequest = IApiRequest<
  { type: ProctorTypeEnum },
  void,
  ICandidateOnboardingAssessmentIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateOnboardingAssessmentProctorApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 proctoring:
 *                   $ref: '#/components/schemas/ICandidateOnboardingAssessmentProctoring'
 */
export type ICandidateOnboardingAssessmentProctorApiResponse = IApiResponse<{
  proctoring: ICandidateOnboardingAssessmentProctoring;
}>;

/**
 * Submit assessment API
 */
export type ICandidateOnboardingAssessmentSubmitApiRequest = IApiRequest<
  void,
  void,
  ICandidateOnboardingAssessmentIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateOnboardingAssessmentSubmitApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 assessment:
 *                   $ref: '#/components/schemas/ICandidateOnboardingAssessment'
 */
export type ICandidateOnboardingAssessmentSubmitApiResponse = IApiResponse<{
  assessment: ICandidateOnboardingAssessment;
}>;

/**
 * Re-submit an assessment API
 * @openapi
 * components:
 *   schemas:
 *     ICandidateOnboardingAssessmentReSubmitApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 assessmentId:
 *                   type: string
 *                   description: The ID of the assessment to re-submit
 *     ICandidateOnboardingAssessmentReSubmitApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidateOnboardingAssessment'
 *
 */
export type ICandidateOnboardingAssessmentReSubmitApiRequest = IApiRequest<
  void,
  void,
  ICandidateOnboardingAssessmentIdParams
>;

/**
 * Get presigned URL query filters
 */
export interface ICandidateOnboardingAssessmentPresignedUrlFilters {
  chunkIndex?: number;
}

/**
 * Get presigned URL API
 */
export type ICandidateOnboardingAssessmentPresignedUrlApiRequest = IApiRequest<
  void,
  ICandidateOnboardingAssessmentPresignedUrlFilters,
  ICandidateOnboardingAssessmentIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateOnboardingAssessmentPresignedUrlApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidateOnboardingAssessmentPresignedUrl'
 */
export type ICandidateOnboardingAssessmentPresignedUrlApiResponse =
  IApiResponse<ICandidateOnboardingAssessmentPresignedUrl>;

/**
 * Get presigned URL API
 */
export type ICandidateOnboardingAssessmentQuestionAudioPresignedUrlApiRequest =
  IApiRequest<
    void,
    void,
    ICandidateOnboardingAssessmentIdParams &
      ICandidateOnboardingAssessmentQuestionIdParams
  >;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateOnboardingAssessmentQuestionAudioPresignedUrlApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidateOnboardingAssessmentPresignedUrl'
 */
export type ICandidateOnboardingAssessmentQuestionAudioPresignedUrlApiResponse =
  IApiResponse<ICandidateOnboardingAssessmentPresignedUrl>;

/**
 * Video chunk data
 */
export interface IVideoChunk {
  id: string;
  chunkIndex: number;
  questionId: string | null;
  attemptNumber: number;
  status: string;
  createdAt: Date;
  analysis?: any;
  playbackUrl?: string;
  duration?: number;
}

/**
 * Get video chunks API request
 */
export type ICandidateOnboardingAssessmentVideoChunksGetApiRequest =
  IApiRequest<
    void,
    {
      questionId?: string;
      includeAnalysis?: string;
      includePlaybackUrls?: string;
    },
    ICandidateOnboardingAssessmentIdParams
  >;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateOnboardingAssessmentVideoChunksGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 chunks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/IVideoChunk'
 */
export type ICandidateOnboardingAssessmentVideoChunksGetApiResponse =
  IApiResponse<{ chunks: IVideoChunk[] }>;

/**
 * Get chunk playback URL API request
 */
export type ICandidateOnboardingAssessmentChunkPlaybackUrlGetApiRequest =
  IApiRequest<
    void,
    void,
    ICandidateOnboardingAssessmentIdParams & { chunkId: string }
  >;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateOnboardingAssessmentChunkPlaybackUrlGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 playbackUrl:
 *                   type: string
 *                 expiresIn:
 *                   type: number
 */
export type ICandidateOnboardingAssessmentChunkPlaybackUrlGetApiResponse =
  IApiResponse<{ playbackUrl: string; expiresIn: number }>;
