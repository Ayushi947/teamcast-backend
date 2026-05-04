import {
  IDemoProfile,
  IDemoAssessment,
  IDemoQuestion,
  IDemoResults,
  IDemoVideoAnalysis,
} from '../../domain/demo/demo.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     IDemoProfilesApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the request was successful
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IDemoProfile'
 *           description: List of available demo profiles
 *         message:
 *           type: string
 *           description: Response message
 */
export interface IDemoProfilesApiResponse {
  success: boolean;
  data: IDemoProfile[];
  message: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IDemoProfileApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the request was successful
 *         data:
 *           $ref: '#/components/schemas/IDemoProfile'
 *           description: Demo profile data
 *         message:
 *           type: string
 *           description: Response message
 */
export interface IDemoProfileApiResponse {
  success: boolean;
  data: IDemoProfile;
  message: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IDemoAssessmentStartRequest:
 *       type: object
 *       required:
 *         - profileId
 *       properties:
 *         profileId:
 *           type: string
 *           description: ID of the selected demo profile
 *         candidateName:
 *           type: string
 *           description: Name of the candidate (optional for demo)
 *         candidateEmail:
 *           type: string
 *           description: Email of the candidate (optional for demo)
 */
export interface IDemoAssessmentStartRequest {
  profileId: string;
  candidateName?: string;
  candidateEmail?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IDemoAssessmentStartApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the request was successful
 *         data:
 *           $ref: '#/components/schemas/IDemoAssessment'
 *           description: Started assessment data
 *         message:
 *           type: string
 *           description: Response message
 */
export interface IDemoAssessmentStartApiResponse {
  success: boolean;
  data: IDemoAssessment;
  message: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IDemoAssessmentQuestionsApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the request was successful
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IDemoQuestion'
 *           description: Assessment questions
 *         message:
 *           type: string
 *           description: Response message
 */
export interface IDemoAssessmentQuestionsApiResponse {
  success: boolean;
  data: IDemoQuestion[];
  message: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IDemoAnswerSubmitRequest:
 *       type: object
 *       required:
 *         - questionId
 *       properties:
 *         questionId:
 *           type: string
 *           description: ID of the question being answered
 *         answer:
 *           type: string
 *           description: Text answer (if applicable)
 *         videoUrl:
 *           type: string
 *           description: URL of recorded video (if applicable)
 *         duration:
 *           type: number
 *           description: Duration of the answer in seconds
 */
export interface IDemoAnswerSubmitRequest {
  questionId: string;
  answer?: string;
  videoUrl?: string;
  duration?: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IDemoAnswerSubmitApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the request was successful
 *         data:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *               description: Whether the answer was submitted successfully
 *             nextQuestion:
 *               $ref: '#/components/schemas/IDemoQuestion'
 *               description: Next question (if available)
 *           description: Answer submission result
 *         message:
 *           type: string
 *           description: Response message
 */
export interface IDemoAnswerSubmitApiResponse {
  success: boolean;
  data: {
    success: boolean;
    nextQuestion?: IDemoQuestion;
  };
  message: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IDemoAssessmentCompleteApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the request was successful
 *         data:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *               description: Whether the assessment was completed successfully
 *             resultsId:
 *               type: string
 *               description: ID for retrieving results
 *           description: Assessment completion result
 *         message:
 *           type: string
 *           description: Response message
 */
export interface IDemoAssessmentCompleteApiResponse {
  success: boolean;
  data: {
    success: boolean;
    resultsId: string;
  };
  message: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IDemoAssessmentResultsApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the request was successful
 *         data:
 *           $ref: '#/components/schemas/IDemoResults'
 *           description: Assessment results
 *         message:
 *           type: string
 *           description: Response message
 */
export interface IDemoAssessmentResultsApiResponse {
  success: boolean;
  data: IDemoResults;
  message: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IDemoVideoAnalysisRequest:
 *       type: object
 *       required:
 *         - videoUrl
 *       properties:
 *         videoUrl:
 *           type: string
 *           description: URL of the video to analyze
 *         sessionId:
 *           type: string
 *           description: Assessment session ID (optional)
 */
export interface IDemoVideoAnalysisRequest {
  videoUrl: string;
  sessionId?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IDemoVideoAnalysisApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the request was successful
 *         data:
 *           $ref: '#/components/schemas/IDemoVideoAnalysis'
 *           description: Video analysis results
 *         message:
 *           type: string
 *           description: Response message
 */
export interface IDemoVideoAnalysisApiResponse {
  success: boolean;
  data: IDemoVideoAnalysis;
  message: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IDemoPresignedUrlApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the request was successful
 *         data:
 *           type: object
 *           properties:
 *             uploadUrl:
 *               type: string
 *               description: Presigned URL for uploading video
 *             videoUrl:
 *               type: string
 *               description: Public URL of the uploaded video
 *           description: Presigned URL data
 *         message:
 *           type: string
 *           description: Response message
 */
export interface IDemoPresignedUrlApiResponse {
  success: boolean;
  data: {
    uploadUrl: string;
    videoUrl: string;
  };
  message: string;
}
