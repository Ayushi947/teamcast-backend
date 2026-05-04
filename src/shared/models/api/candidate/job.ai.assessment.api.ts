import {
  IApiRequest,
  IApiResponse,
  IPaginatedResponse,
  IApiPaginatedRequest,
} from '../common/common.api';
import {
  ICandidateJobAiAssessment,
  ICandidateJobAiAssessmentTask,
  ICandidateJobAiAssessmentSubmitAnswer,
  ICandidateJobAiAssessmentAnswerSubmitted,
  ICandidateJobAiAssessmentProctoring,
  ICandidateJobAiAssessmentPresignedUrl,
  ICandidateJobAiAssessmentInterviewsFilterQuery,
} from '../../domain/candidate/job.ai.assessment.domain';
import { JobAiAssessmentStatusEnum, ProctorTypeEnum } from '../../common/enums';
import { IJobAiAssessmentInterviewItem } from '../../domain/client/job.ai.assessment.invite';

/**
 * @openapi
 * components:
 *   parameters:
 *     ICandidateJobAiAssessmentFilterQueryStatus:
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
export interface ICandidateJobAiAssessmentFilterQuery {
  status?: JobAiAssessmentStatusEnum[];
  type?: string[];
  search?: string;
}

export type ICandidateJobAiAssessmentListRequest = IApiPaginatedRequest<
  void,
  ICandidateJobAiAssessmentFilterQuery
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobAiAssessmentListGetApiResponse:
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
 *                     $ref: '#/components/schemas/ICandidateJobAiAssessment'
 */
export type ICandidateJobAiAssessmentListGetApiResponse = IApiResponse<
  IPaginatedResponse<ICandidateJobAiAssessment>
>;

/**
 * @openapi
 * components:
 *   parameters:
 *     ICandidateJobAiAssessmentIdParams:
 *       in: path
 *       name: assessmentId
 *       required: true
 *       schema:
 *         type: string
 */
export interface ICandidateJobAiAssessmentIdParams {
  assessmentId: string;
}

/**
 * @openapi
 * components:
 *   parameters:
 *     ICandidateJobAiAssessmentApplicationIdParams:
 *       in: path
 *       name: jobAiAssessmentInviteId
 */
export interface ICandidateJobAiAssessmentApplicationIdParams {
  jobAiAssessmentInviteId: string;
}

export type ICandidateJobAiAssessmentGetApiRequest = IApiRequest<
  void,
  void,
  ICandidateJobAiAssessmentIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobAiAssessmentGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidateJobAiAssessment'
 */
export type ICandidateJobAiAssessmentGetApiResponse =
  IApiResponse<ICandidateJobAiAssessment>;

export type ICandidateLatestJobAiAssessmentGetApiRequest = IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateLatestJobAiAssessmentGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidateJobAiAssessment'
 */
export type ICandidateLatestJobAiAssessmentGetApiResponse =
  IApiResponse<ICandidateJobAiAssessment>;

/**
 * @openapi
 * components:
 *   parameters:
 *     ICandidateJobAiAssessmentCandidateIdParams:
 *       in: path
 *       name: candidateId
 *       required: true
 *       schema:
 *         type: string
 */
type ICandidateJobAiAssessmentCandidateIdParams = {
  candidateId: string;
};

/**
 * Get the latest job ai assessment for a candidate
 */
export type ICandidateJobAiAssessmentGetLatestByCandidateIdApiRequest =
  IApiRequest<void, void, ICandidateJobAiAssessmentCandidateIdParams>;

/*
 * Initialize the job ai assessment
 */
export type ICandidateJobAiAssessmentInitializeApiResquest = IApiRequest<
  void,
  void,
  ICandidateJobAiAssessmentApplicationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobAiAssessmentInitializeApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidateJobAiAssessmentTask'
 */
export type ICandidateJobAiAssessmentInitializeApiResponse =
  IApiResponse<ICandidateJobAiAssessmentTask>;

export type ICandidateJobAiAssessmentTaskGetApiRequest = IApiRequest<
  void,
  void,
  ICandidateJobAiAssessmentIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobAiAssessmentTaskGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidateJobAiAssessmentTask'
 */
export type ICandidateJobAiAssessmentTaskGetApiResponse =
  IApiResponse<ICandidateJobAiAssessmentTask>;

/**
 * Start the job ai assessment
 */
export type ICandidateJobAiAssessmentStartApiRequest = IApiRequest<
  void,
  void,
  ICandidateJobAiAssessmentIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobAiAssessmentStartApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 task:
 *                   $ref: '#/components/schemas/ICandidateJobAiAssessment'
 */
export type ICandidateJobAiAssessmentStartApiResponse =
  IApiResponse<ICandidateJobAiAssessment>;

/**
 * @openapi
 * components:
 *   parameters:
 *     ICandidateJobAiAssessmentQuestionIdParams:
 *       in: path
 *       name: questionId
 *       required: true
 *       schema:
 *         type: string
 */
export interface ICandidateJobAiAssessmentQuestionIdParams {
  questionId: string;
}

/**
 * Submit an answer to the job ai assessment
 */
export type ICandidateJobAiAssessmentSubmitAnswerApiRequest = IApiRequest<
  ICandidateJobAiAssessmentSubmitAnswer,
  void,
  ICandidateJobAiAssessmentIdParams & ICandidateJobAiAssessmentQuestionIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobAiAssessmentSubmitAnswerApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 currentQuestion:
 *                   $ref: '#/components/schemas/ICandidateJobAiAssessmentQuestion'
 *                 isLastQuestion:
 *                   type: boolean
 *                   description: Whether this is the last question in the assessment
 */
export type ICandidateJobAiAssessmentSubmitAnswerApiResponse =
  IApiResponse<ICandidateJobAiAssessmentAnswerSubmitted>;

/**
 * Heartbeat (status update) API
 */
export type ICandidateJobAiAssessmentHeartbeatApiRequest = IApiRequest<
  { duration: number; status?: string },
  void,
  ICandidateJobAiAssessmentIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobAiAssessmentHeartbeatApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: boolean
 */
export type ICandidateJobAiAssessmentHeartbeatApiResponse =
  IApiResponse<boolean>;

/**
 * Proctoring API
 */
export type ICandidateJobAiAssessmentProctorApiRequest = IApiRequest<
  { type: ProctorTypeEnum },
  void,
  ICandidateJobAiAssessmentIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobAiAssessmentProctorApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 proctoring:
 *                   $ref: '#/components/schemas/ICandidateJobAiAssessmentProctoring'
 */
export type ICandidateJobAiAssessmentProctorApiResponse = IApiResponse<{
  proctoring: ICandidateJobAiAssessmentProctoring;
}>;

/**
 * Submit assessment API
 */
export type ICandidateJobAiAssessmentSubmitApiRequest = IApiRequest<
  void,
  void,
  ICandidateJobAiAssessmentIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobAiAssessmentSubmitApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 assessment:
 *                   $ref: '#/components/schemas/ICandidateJobAiAssessment'
 */
export type ICandidateJobAiAssessmentSubmitApiResponse = IApiResponse<{
  assessment: ICandidateJobAiAssessment;
}>;

/**
 * Get presigned URL query filters
 */
export interface ICandidateJobAiAssessmentPresignedUrlFilters {
  chunkIndex?: number;
}

/**
 * Get presigned URL API
 */
export type ICandidateJobAiAssessmentPresignedUrlApiRequest = IApiRequest<
  void,
  ICandidateJobAiAssessmentPresignedUrlFilters,
  ICandidateJobAiAssessmentIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobAiAssessmentPresignedUrlApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidateJobAiAssessmentPresignedUrl'
 */
export type ICandidateJobAiAssessmentPresignedUrlApiResponse =
  IApiResponse<ICandidateJobAiAssessmentPresignedUrl>;

/**
 * Get presigned URL API
 */
export type ICandidateJobAiAssessmentQuestionAudioPresignedUrlApiRequest =
  IApiRequest<
    void,
    void,
    ICandidateJobAiAssessmentIdParams &
      ICandidateJobAiAssessmentQuestionIdParams
  >;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobAiAssessmentQuestionAudioPresignedUrlApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidateJobAiAssessmentPresignedUrl'
 */
export type ICandidateJobAiAssessmentQuestionAudioPresignedUrlApiResponse =
  IApiResponse<ICandidateJobAiAssessmentPresignedUrl>;

export type ICandidateListJobAiAssessmentInterviewsRequest =
  IApiPaginatedRequest<void, ICandidateJobAiAssessmentInterviewsFilterQuery>;

/**
 * Get presigned URL API
 */
export type ICandidateJobAiAssessmentPresignedUrlByVideoUrlApiRequest =
  IApiRequest<void, { videoUrl: string }, void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobAiAssessmentPresignedUrlByVideoUrlApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidateJobAiAssessmentPresignedUrl'
 */
export type ICandidateJobAiAssessmentPresignedUrlByVideoUrlApiResponse =
  IApiResponse<ICandidateJobAiAssessmentPresignedUrl>;

/**
 * Get job ai assessment invitation URL params
 */
export interface ICandidateJobAiAssessmentInvitationUrlParams {
  invitationId: string;
}

/**
 * Get job ai assessment invitation URL API
 * @openapi
 * components:
 *   parameters:
 *     ICandidateJobAiAssessmentInvitationUrlParams:
 *       in: path
 *       name: invitationId
 *       required: true
 *       schema:
 *         type: string
 *   schemas:
 *     ICandidateJobAiAssessmentInvitationUrlApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             params:
 *               $ref: '#/components/schemas/ICandidateJobAiAssessmentInvitationUrlParams'
 */
export type ICandidateJobAiAssessmentInvitationUrlApiRequest = IApiRequest<
  void,
  void,
  ICandidateJobAiAssessmentInvitationUrlParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobAiAssessmentInvitationUrlApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: string
 *               description: The invitation URL for the job ai assessment
 */
export type ICandidateJobAiAssessmentInvitationUrlApiResponse =
  IApiResponse<string>;

/**
 * List job ai assessment interviews
 */
/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobAiAssessmentInterviewsApiPaginatedResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IPaginatedResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IJobAiAssessmentInterviewItem'
 *           description: Response for listing job AI assessment interviews
 */
export type ICandidateJobAiAssessmentInterviewsApiPaginatedResponse =
  IPaginatedResponse<IJobAiAssessmentInterviewItem>;

/**
 * List job ai assessment interviews
 */
export type ICandidateJobAiAssessmentInterviewsApiRequest =
  IApiPaginatedRequest<
    void,
    ICandidateJobAiAssessmentInterviewsFilterQuery,
    void
  >;

/**
 * Video chunk data for job AI assessments
 */
export interface IJobAiVideoChunk {
  id: string;
  chunkIndex: number;
  questionId: string | null;
  sectionId: string | null;
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
export type ICandidateJobAiAssessmentVideoChunksGetApiRequest = IApiRequest<
  void,
  {
    questionId?: string;
    sectionId?: string;
    includeAnalysis?: string;
    includePlaybackUrls?: string;
  },
  ICandidateJobAiAssessmentIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobAiAssessmentVideoChunksGetApiResponse:
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
 *                     $ref: '#/components/schemas/IJobAiVideoChunk'
 */
export type ICandidateJobAiAssessmentVideoChunksGetApiResponse = IApiResponse<{
  chunks: IJobAiVideoChunk[];
}>;

/**
 * Get chunk playback URL API request
 */
export type ICandidateJobAiAssessmentChunkPlaybackUrlGetApiRequest =
  IApiRequest<
    void,
    void,
    ICandidateJobAiAssessmentIdParams & { chunkId: string }
  >;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobAiAssessmentChunkPlaybackUrlGetApiResponse:
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
export type ICandidateJobAiAssessmentChunkPlaybackUrlGetApiResponse =
  IApiResponse<{ playbackUrl: string; expiresIn: number }>;
