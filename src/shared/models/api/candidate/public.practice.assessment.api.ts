import { IApiRequest, IApiResponse } from '../common/common.api';
import {
  IPublicPracticeAssessment,
  IPublicPracticeAssessmentCreate,
  IPublicPracticeAssessmentTask,
  IPublicPracticeAssessmentAnswerSubmitted,
} from '../../domain/candidate/public.practice.assessment.domain';

export type IPublicPracticeAssessmentCreateApiRequest = IApiRequest<
  IPublicPracticeAssessmentCreate,
  void,
  void
> & {
  data: IPublicPracticeAssessmentCreate;
};

/**
 * @openapi
 * components:
 *   schemas:
 *     IPublicPracticeAssessmentCreateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPublicPracticeAssessment'
 *             metadata:
 *               type: object
 *               properties:
 *                 requiresPasswordSetup:
 *                   type: boolean
 *                   description: Whether the user needs to set up a password
 *                 hasResume:
 *                   type: boolean
 *                   description: Whether the candidate has a resume
 *                 resumeParsed:
 *                   type: boolean
 *                   description: Whether the resume has been parsed successfully
 */
export interface IPublicPracticeAssessmentCreateApiResponse
  extends IApiResponse<IPublicPracticeAssessment> {
  metadata?: {
    requiresPasswordSetup: boolean;
    hasResume: boolean;
    resumeParsed: boolean;
  };
}

/**
 * @openapi
 * components:
 *   parameters:
 *     IPublicPracticeAssessmentIdParams:
 *       in: path
 *       name: assessmentId
 *       required: true
 *       schema:
 *         type: string
 */
export interface IPublicPracticeAssessmentIdParams {
  assessmentId: string;
}

export type IPublicPracticeAssessmentGetApiRequest = IApiRequest<
  void,
  void,
  IPublicPracticeAssessmentIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPublicPracticeAssessmentGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPublicPracticeAssessment'
 */
export type IPublicPracticeAssessmentGetApiResponse =
  IApiResponse<IPublicPracticeAssessment>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPublicPracticeAssessmentLinkRequest:
 *       type: object
 *       required:
 *         - candidateId
 *       properties:
 *         candidateId:
 *           type: string
 *           description: ID of the candidate to link the assessment to
 */
export interface IPublicPracticeAssessmentLinkRequest {
  candidateId: string;
}

export type IPublicPracticeAssessmentLinkApiRequest = IApiRequest<
  IPublicPracticeAssessmentLinkRequest,
  void,
  IPublicPracticeAssessmentIdParams
> & {
  data: IPublicPracticeAssessmentLinkRequest;
  params: IPublicPracticeAssessmentIdParams;
};

/**
 * @openapi
 * components:
 *   schemas:
 *     IPublicPracticeAssessmentLinkApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPublicPracticeAssessment'
 */
export type IPublicPracticeAssessmentLinkApiResponse =
  IApiResponse<IPublicPracticeAssessment>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPublicPracticeAssessmentListByEmailApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IPublicPracticeAssessment'
 */
export type IPublicPracticeAssessmentListByEmailApiResponse = IApiResponse<
  IPublicPracticeAssessment[]
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPublicPracticeAssessmentListApiRequest:
 *       type: object
 *       properties:
 *         page:
 *           type: number
 *           minimum: 1
 *           default: 1
 *         limit:
 *           type: number
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         sortBy:
 *           type: string
 *           enum: [createdAt, updatedAt, completedAt]
 *           default: createdAt
 *         sortOrder:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 */
export interface IPublicPracticeAssessmentListApiRequest {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPublicPracticeAssessmentListApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/IPublicPracticeAssessment'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     page:
 *                       type: number
 *                     limit:
 *                       type: number
 *                     totalPages:
 *                       type: number
 */
export type IPublicPracticeAssessmentListApiResponse = IApiResponse<{
  items: IPublicPracticeAssessment[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPublicPracticeAssessmentParseRequest:
 *       type: object
 *       required:
 *         - jobUrl
 *       properties:
 *         jobUrl:
 *           type: string
 *           format: uri
 *           description: URL of the job posting to parse
 */
export interface IPublicPracticeAssessmentParseRequest {
  jobUrl: string;
}

export type IPublicPracticeAssessmentParseApiRequest = IApiRequest<
  IPublicPracticeAssessmentParseRequest,
  void,
  void
> & {
  data: IPublicPracticeAssessmentParseRequest;
};

/**
 * @openapi
 * components:
 *   schemas:
 *     IPublicPracticeAssessmentParseApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 parsedJobDataId:
 *                   type: string
 *                   description: ID of the stored parsed job data
 */
export type IPublicPracticeAssessmentParseApiResponse = IApiResponse<{
  parsedJobDataId: string;
}>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPublicPracticeAssessmentParseDescriptionRequest:
 *       type: object
 *       required:
 *         - jobDescriptionText
 *       properties:
 *         jobDescriptionText:
 *           type: string
 *           description: The job description text to parse
 */
export interface IPublicPracticeAssessmentParseDescriptionRequest {
  jobDescriptionText: string;
}

export type IPublicPracticeAssessmentParseDescriptionApiRequest = IApiRequest<
  IPublicPracticeAssessmentParseDescriptionRequest,
  void,
  void
> & {
  data: IPublicPracticeAssessmentParseDescriptionRequest;
};

/**
 * @openapi
 * components:
 *   schemas:
 *     IPublicPracticeAssessmentParseDescriptionApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 parsedJobDataId:
 *                   type: string
 *                   description: ID of the stored parsed job data
 */
export type IPublicPracticeAssessmentParseDescriptionApiResponse =
  IApiResponse<{
    parsedJobDataId: string;
  }>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPublicPracticeAssessmentGetParsedJobDataRequest:
 *       type: object
 *       required:
 *         - parsedJobDataId
 *       properties:
 *         parsedJobDataId:
 *           type: string
 *           description: ID of the parsed job data to retrieve
 */
export interface IPublicPracticeAssessmentGetParsedJobDataRequest {
  parsedJobDataId: string;
}

export type IPublicPracticeAssessmentGetParsedJobDataApiRequest = IApiRequest<
  void,
  void,
  { parsedJobDataId: string }
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPublicPracticeAssessmentGetParsedJobDataApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               description: Parsed job data
 */
export type IPublicPracticeAssessmentGetParsedJobDataApiResponse =
  IApiResponse<any>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPublicPracticeAssessmentCreateWithParsedDataRequest:
 *       type: object
 *       required:
 *         - candidateName
 *         - candidateEmail
 *       properties:
 *         parsedJobDataId:
 *           type: string
 *           format: uuid
 *           description: ID of the stored parsed job data (preferred)
 *         parsedJobData:
 *           type: object
 *           description: Parsed job data from the parse endpoint (alternative to parsedJobDataId)
 *         candidateName:
 *           type: string
 *           description: Name of the candidate
 *         candidateEmail:
 *           type: string
 *           format: email
 *           description: Email of the candidate
 */
export interface IPublicPracticeAssessmentCreateWithParsedDataRequest {
  parsedJobDataId?: string;
  parsedJobData?: any;
  candidateName: string;
  candidateEmail: string;
}

export type IPublicPracticeAssessmentCreateWithParsedDataApiRequest =
  IApiRequest<
    IPublicPracticeAssessmentCreateWithParsedDataRequest,
    void,
    void
  > & {
    data: IPublicPracticeAssessmentCreateWithParsedDataRequest;
  };

/**
 * @openapi
 * components:
 *   schemas:
 *     IPublicPracticeAssessmentTask:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         status:
 *           type: string
 *         assessment:
 *           $ref: '#/components/schemas/IPublicPracticeAssessment'
 */
// IPublicPracticeAssessmentTask is imported from domain

export type IPublicPracticeAssessmentTaskGetApiRequest = IApiRequest<
  void,
  void,
  IPublicPracticeAssessmentIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPublicPracticeAssessmentTaskGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPublicPracticeAssessmentTask'
 */
export type IPublicPracticeAssessmentTaskGetApiResponse =
  IApiResponse<IPublicPracticeAssessmentTask>;

/**
 * Start the public practice assessment
 */
export type IPublicPracticeAssessmentStartApiRequest = IApiRequest<
  void,
  void,
  IPublicPracticeAssessmentIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPublicPracticeAssessmentStartApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPublicPracticeAssessment'
 */
export type IPublicPracticeAssessmentStartApiResponse =
  IApiResponse<IPublicPracticeAssessment>;

/**
 * @openapi
 * components:
 *   parameters:
 *     IPublicPracticeAssessmentQuestionIdParams:
 *       in: path
 *       name: questionId
 *       required: true
 *       schema:
 *         type: string
 */
export interface IPublicPracticeAssessmentQuestionIdParams {
  questionId: string;
}

/**
 * Submit an answer to the public practice assessment
 */
export interface IPublicPracticeAssessmentSubmitAnswer {
  answerGiven: string;
}

export type IPublicPracticeAssessmentSubmitAnswerApiRequest = IApiRequest<
  IPublicPracticeAssessmentSubmitAnswer,
  void,
  IPublicPracticeAssessmentIdParams & IPublicPracticeAssessmentQuestionIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPublicPracticeAssessmentAnswerSubmitted:
 *       type: object
 *       properties:
 *         nextQuestion:
 *           type: object
 *           nullable: true
 *         isCompleted:
 *           type: boolean
 */
// IPublicPracticeAssessmentAnswerSubmitted is imported from domain

/**
 * @openapi
 * components:
 *   schemas:
 *     IPublicPracticeAssessmentSubmitAnswerApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPublicPracticeAssessmentAnswerSubmitted'
 */
export type IPublicPracticeAssessmentSubmitAnswerApiResponse =
  IApiResponse<IPublicPracticeAssessmentAnswerSubmitted>;

/**
 * Submit the public practice assessment
 */
export type IPublicPracticeAssessmentSubmitApiRequest = IApiRequest<
  void,
  void,
  IPublicPracticeAssessmentIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPublicPracticeAssessmentSubmitApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPublicPracticeAssessment'
 */
export type IPublicPracticeAssessmentSubmitApiResponse =
  IApiResponse<IPublicPracticeAssessment>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPublicPracticeAssessmentPresignedUrlFilters:
 *       type: object
 *       properties:
 *         chunkIndex:
 *           type: number
 *           description: Optional chunk index for video upload
 */
export interface IPublicPracticeAssessmentPresignedUrlFilters {
  chunkIndex?: number;
}

/**
 * Get presigned URL API
 */
export type IPublicPracticeAssessmentPresignedUrlApiRequest = IApiRequest<
  void,
  IPublicPracticeAssessmentPresignedUrlFilters,
  IPublicPracticeAssessmentIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPublicPracticeAssessmentPresignedUrlApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 presignedUrl:
 *                   type: string
 *                 chunkIndex:
 *                   type: number
 *                 gcsUri:
 *                   type: string
 *                 filePath:
 *                   type: string
 */
export type IPublicPracticeAssessmentPresignedUrlApiResponse = IApiResponse<{
  presignedUrl: string;
  chunkIndex: number;
  gcsUri: string;
  filePath: string;
}>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPublicPracticeAssessmentChunkUploadRequest:
 *       type: object
 *       required:
 *         - chunkIndex
 *         - gcsUri
 *       properties:
 *         chunkIndex:
 *           type: number
 *         gcsUri:
 *           type: string
 *         questionId:
 *           type: string
 *         sectionId:
 *           type: string
 */
export interface IPublicPracticeAssessmentChunkUploadRequest {
  chunkIndex: number;
  gcsUri: string;
  questionId?: string;
  sectionId?: string;
}

/**
 * Record chunk upload API
 */
export type IPublicPracticeAssessmentChunkUploadApiRequest = IApiRequest<
  IPublicPracticeAssessmentChunkUploadRequest,
  void,
  IPublicPracticeAssessmentIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPublicPracticeAssessmentChunkUploadApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 chunkId:
 *                   type: string
 */
export type IPublicPracticeAssessmentChunkUploadApiResponse = IApiResponse<{
  success: boolean;
  chunkId: string;
}>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPublicPracticeAssessmentUpdateTermsAcceptedRequest:
 *       type: object
 *       required:
 *         - termsAccepted
 *       properties:
 *         termsAccepted:
 *           type: boolean
 *           description: Whether terms have been accepted
 */
export interface IPublicPracticeAssessmentUpdateTermsAcceptedRequest {
  termsAccepted: boolean;
}

export type IPublicPracticeAssessmentUpdateTermsAcceptedApiRequest =
  IApiRequest<
    IPublicPracticeAssessmentUpdateTermsAcceptedRequest,
    void,
    IPublicPracticeAssessmentIdParams
  > & {
    data: IPublicPracticeAssessmentUpdateTermsAcceptedRequest;
    params: IPublicPracticeAssessmentIdParams;
  };

/**
 * @openapi
 * components:
 *   schemas:
 *     IPublicPracticeAssessmentUpdateTermsAcceptedApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
export type IPublicPracticeAssessmentUpdateTermsAcceptedApiResponse =
  IApiResponse<{ message: string }>;
