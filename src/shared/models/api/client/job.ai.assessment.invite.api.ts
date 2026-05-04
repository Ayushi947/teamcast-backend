import {
  JobAiAssessmentInviteStatusEnum,
  JobAssessmentInviteStatusEnum,
} from '../../common/enums';
import {
  IJobAiAssessmentInterviewItem,
  IScheduledJobAssessmentDetails,
} from '../../domain/client/job.ai.assessment.invite';
import {
  IApiPaginatedRequest,
  IApiRequest,
  IApiResponse,
  IPaginatedResponse,
} from '../common/common.api';

/**
 * @openapi
 * components:
 *   schemas:
 *     ISendAiAssessmentInviteSimpleResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the created invite
 *         status:
 *           $ref: '#/components/schemas/JdAssessmentInviteStatusEnum'
 *           description: Current status of the invite
 *         message:
 *           type: string
 *           description: Success message
 *           example: "Interview scheduled successfully"
 */
export interface IJobAiAssessmentInviteCreateSimpleApiResponse {
  id: string;
  status: JobAiAssessmentInviteStatusEnum;
  message: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobAiAssessmentInviteSendApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISendAiAssessmentInviteSimpleResponse'
 */
export type IJobAiAssessmentInviteCreateApiResponse =
  IApiResponse<IJobAiAssessmentInviteCreateSimpleApiResponse>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISendAiAssessmentInviteRequest:
 *       type: object
 *       required:
 *         - candidateId
 *         - jobApplicationId
 *       properties:
 *         candidateId:
 *           type: string
 *           format: uuid
 *           description: ID of the candidate to send the invite to
 *         jobApplicationId:
 *           type: string
 *           format: uuid
 *           description: ID of the job application for the assessment
 *     IJobAiAssessmentInviteApiRequest:
 *       type: object
 *       required:
 *         - candidateId
 *         - jobApplicationId
 *       properties:
 *         candidateId:
 *           type: string
 *           format: uuid
 *           description: ID of the candidate to send the invite to
 *         jobApplicationId:
 *           type: string
 *           format: uuid
 *           description: ID of the job application for the assessment
 */
export interface IJobAiAssessmentInviteApiRequest {
  candidateId: string;
  jobApplicationId: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobAiAssessmentInviteCreateApiRequest:
 *       type: object
 *       required:
 *         - candidateId
 *         - jobApplicationId
 *       properties:
 *         candidateId:
 *           type: string
 *           format: uuid
 *           description: ID of the candidate to send the invite to
 *         jobApplicationId:
 *           type: string
 *           format: uuid
 *           description: ID of the job application for the assessment
 */
export interface IJobAiAssessmentInviteRequestData {
  candidateId: string;
  jobApplicationId: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobAiAssessmentInviteCreateApiRequestWrapper:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IJobAiAssessmentInviteCreateApiRequest'
 */
export type IJobAiAssessmentInviteCreateApiRequest =
  IApiRequest<IJobAiAssessmentInviteRequestData>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobAssessmentInviteResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         candidateId:
 *           type: string
 *         jobPostingId:
 *           type: string
 *         jobPostingTitle:
 *           type: string
 *         companyName:
 *           type: string
 *         jobAssessmentId:
 *           type: string
 *         inviterName:
 *           type: string
 *         message:
 *           type: string
 *         status:
 *           type: string
 *         appliedAt:
 *           type: string
 *         notes:
 *           type: string
 *         coverLetterUrl:
 *           type: string
 *         scheduledDate:
 *           type: string
 *         expiresAt:
 *           type: string
 *         acceptedAt:
 *           type: string
 *         acceptedBy:
 *           type: string
 *         acceptedById:
 *           type: string
 *         acceptanceNote:
 *           type: string
 *         declinedAt:
 *           type: string
 *         declinedBy:
 *           type: string
 *         declinedById:
 *           type: string
 *         declineReason:
 *           type: string
 *         createdAt:
 *           type: string
 *         updatedAt:
 *           type: string
 */
export interface IClientJobAssessmentInviteResponse {
  id: string;
  candidateId: string;
  jobPostingId: string;
  jobPostingTitle?: string;
  companyName: string;
  jobAssessmentId: string | null;
  inviterName: string;
  message?: string;
  status: JobAssessmentInviteStatusEnum;
  appliedAt: string;
  notes?: string | null;
  coverLetterUrl?: string | null;
  scheduledDate?: string | null;
  expiresAt: string;
  acceptedAt?: string | null;
  acceptedBy?: string | null;
  acceptedById?: string | null;
  acceptanceNote?: string | null;
  declinedAt?: string | null;
  declinedBy?: string | null;
  declinedById?: string | null;
  declineReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Paginated AI Assessment Interviews API
/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobAiAssessmentInterviewsListApiRequest:
 *       type: object
 *       properties:
 *         search:
 *           type: string
 *           description: Search query for filtering interviews
 *         pagination:
 *           $ref: '#/components/schemas/IPaginationRequest'
 */
export type IClientJobAiAssessmentInterviewsListApiRequest =
  IApiPaginatedRequest<void, { search?: string }, void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobAiAssessmentInterviewsListApiResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IJobAiAssessmentInterviewItem'
 *         pagination:
 *           $ref: '#/components/schemas/IPaginatedResponse'
 */
export type IClientJobAiAssessmentInterviewsListApiResponse =
  IPaginatedResponse<IJobAiAssessmentInterviewItem>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobAssessmentInviteFilterQuery:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *         companyName:
 *           type: string
 *         jobPostingTitle:
 *           type: string
 *         hasAssessment:
 *           type: boolean
 *         assessmentCompleted:
 *           type: boolean
 *         dateFrom:
 *           type: string
 *         dateTo:
 *           type: string
 */
export interface IClientJobAssessmentInviteFilterQuery {
  status?: JobAssessmentInviteStatusEnum;
  companyName?: string;
  jobPostingTitle?: string;
  hasAssessment?: boolean;
  assessmentCompleted?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobAssessmentInviteListApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiPaginatedRequest'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientJobAssessmentInviteFilterQuery'
 */
export type IClientJobAssessmentInviteListApiRequest = IApiPaginatedRequest<
  void,
  IClientJobAssessmentInviteFilterQuery,
  void
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobAiAssessmentInviteCreateApiResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 */
export interface IClientJobAiAssessmentInviteCreateApiResponse {
  id: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobAiAssessmentApplicationUrlGenerateResponse:
 *       type: object
 *       properties:
 *         jdAssessmentUrl:
 *           type: string
 *           format: uri
 *           description: URL for accessing the JD assessment with authentication token
 *         jdAssessmentId:
 *           type: string
 *           format: uuid
 *           description: ID of the JD assessment
 *         inviteId:
 *           type: string
 *           format: uuid
 *           description: ID of the interview invitation
 *         candidateId:
 *           type: string
 *           format: uuid
 *           description: ID of the candidate
 *         jobPostingId:
 *           type: string
 *           format: uuid
 *           description: ID of the job posting
 *         status:
 *           type: string
 *           description: Status of the invitation
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: When the invitation expires
 */
export interface IJobAiAssessmentApplicationUrlGenerateResponse {
  jobAiAssessmentUrl: string;
  inviteId: string;
  candidateId: string;
  status: string;
  expiresAt: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobAiAssessmentApplicationUrlGenerateApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IJobAiAssessmentInviteApiRequest'
 */
export interface IJobAiAssessmentApplicationUrlGenerateApiRequest
  extends IApiRequest {
  data: IJobAiAssessmentInviteApiRequest;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobAiAssessmentApplicationUrlGenerateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IJobAiAssessmentApplicationUrlGenerateResponse'
 */
export interface IJobAiAssessmentApplicationUrlGenerateApiResponse
  extends IApiResponse<IJobAiAssessmentApplicationUrlGenerateResponse> {
  data: IJobAiAssessmentApplicationUrlGenerateResponse;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientListJobAiAssessmentInterviewsApiResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IJobAiAssessmentInterviewItem'
 *         pagination:
 *           $ref: '#/components/schemas/IPaginatedResponse'
 */
export type IClientListJobAiAssessmentInterviewsApiResponse =
  IPaginatedResponse<IJobAiAssessmentInterviewItem>;

export type IScheduledJobAssessmentDetailsApiResponse =
  IApiResponse<IScheduledJobAssessmentDetails>;
