import {
  IApiPaginatedRequest,
  IApiRequest,
  IApiResponse,
  IPaginatedResponse,
} from '../common/common.api';
import { JobAssessmentInviteStatusEnum } from '../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobAssessmentInviteResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the invite
 *         jobPostingId:
 *           type: string
 *           format: uuid
 *           description: ID of the job posting
 *         jobPostingTitle:
 *           type: string
 *           description: Title of the job posting
 *         companyName:
 *           type: string
 *           description: Name of the company
 *         jobAssessmentId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: ID of the job assessment
 *         inviterName:
 *           type: string
 *           description: Name of the person who sent the invite
 *         message:
 *           type: string
 *           description: Optional message from the inviter
 *         status:
 *           $ref: '#/components/schemas/JobAssessmentInviteStatusEnum'
 *           description: Current status of the invite
 *         appliedAt:
 *           type: string
 *           format: date-time
 *           description: Date when the application was submitted
 *         notes:
 *           type: string
 *           nullable: true
 *           description: Application notes
 *         coverLetterUrl:
 *           type: string
 *           nullable: true
 *           description: URL to the cover letter document
 *         scheduledDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Scheduled date for the assessment
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: Expiration date of the invite
 *         acceptedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Date when the invite was accepted
 *         acceptedBy:
 *           type: string
 *           nullable: true
 *           description: Who accepted the invite (CLIENT or CANDIDATE)
 *         acceptedById:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: ID of the user who accepted the invite
 *         acceptanceNote:
 *           type: string
 *           nullable: true
 *           description: Note provided when accepting the invite
 *         declinedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Date when the invite was declined
 *         declinedBy:
 *           type: string
 *           nullable: true
 *           description: Who declined the invite (CLIENT or CANDIDATE)
 *         declinedById:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: ID of the user who declined the invite
 *         declineReason:
 *           type: string
 *           nullable: true
 *           description: Reason provided for declining the invite
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the invite was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the invite was last updated
 *         assessmentStatus:
 *           type: string
 *           nullable: true
 *           description: Current status of the assessment
 *         assessmentCompleted:
 *           type: boolean
 *           nullable: true
 *           description: Whether the assessment has been completed
 *         assessmentResult:
 *           type: string
 *           nullable: true
 *           description: Result of the assessment
 *         assessmentScore:
 *           type: number
 *           nullable: true
 *           description: Assessment score (0.0-1.0)
 *         assessmentRecommendation:
 *           type: string
 *           nullable: true
 *           description: Assessment recommendation
 *         assessmentStartedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: When the assessment was started
 *         assessmentCompletedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: When the assessment was completed
 */
export interface ICandidateJobAssessmentInviteResponse {
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

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobAssessmentInviteFilterQuery:
 *       type: object
 *       properties:
 *         status:
 *           $ref: '#/components/schemas/JobAssessmentInviteStatusEnum'
 *           description: Filter by invite status
 *         companyName:
 *           type: string
 *           description: Filter by company name
 *         jobPostingTitle:
 *           type: string
 *           description: Filter by job posting title
 *         hasAssessment:
 *           type: boolean
 *           description: Filter by whether the invite has an assessment
 *         assessmentCompleted:
 *           type: boolean
 *           description: Filter by assessment completion status
 *         dateFrom:
 *           type: string
 *           format: date
 *           description: Filter invites from this date
 *         dateTo:
 *           type: string
 *           format: date
 *           description: Filter invites to this date
 */
export interface ICandidateJobAssessmentInviteFilterQuery {
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
 *     ICandidateAcceptJobAssessmentInviteRequest:
 *       type: object
 *       properties:
 *         acceptanceNote:
 *           type: string
 *           maxLength: 500
 *           description: Optional note when accepting the invite
 *         scheduledDate:
 *           type: string
 *           format: date-time
 *           description: Preferred scheduled date for the assessment
 */
export interface ICandidateAcceptJobAssessmentInviteRequest {
  acceptanceNote?: string;
  scheduledDate?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateDeclineJobAssessmentInviteRequest:
 *       type: object
 *       properties:
 *         reason:
 *           type: string
 *           maxLength: 500
 *           description: Reason for declining the invite
 *         declineNote:
 *           type: string
 *           maxLength: 1000
 *           description: Additional note for declining
 */
export interface ICandidateDeclineJobAssessmentInviteRequest {
  reason?: string;
  declineNote?: string;
}

/**
 * @openapi
 * components:
 *   parameters:
 *     IJobAssessmentInviteIdParams:
 *       in: path
 *       name: inviteId
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *       description: The ID of the job assessment invite
 */
export interface ICandidateJobAssessmentInviteIdParams {
  inviteId: string;
}

// API Request/Response Types with Swagger Documentation

export type ICandidateJobAssessmentInviteListApiRequest = IApiPaginatedRequest<
  void,
  ICandidateJobAssessmentInviteFilterQuery,
  void
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobAssessmentInviteListApiResponse:
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
 *                     $ref: '#/components/schemas/ICandidateJobAssessmentInviteResponse'
 */
export type ICandidateJobAssessmentInviteListApiResponse = IApiResponse<
  IPaginatedResponse<ICandidateJobAssessmentInviteResponse>
>;

export type ICandidateJobAssessmentInviteAcceptApiRequest = IApiRequest<
  ICandidateAcceptJobAssessmentInviteRequest,
  void,
  ICandidateJobAssessmentInviteIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobAssessmentInviteAcceptApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidateJobAssessmentInviteResponse'
 */
export type ICandidateJobAssessmentInviteAcceptApiResponse =
  IApiResponse<ICandidateJobAssessmentInviteResponse>;

export type ICandidateJobAssessmentInviteDeclineApiRequest = IApiRequest<
  ICandidateDeclineJobAssessmentInviteRequest,
  void,
  ICandidateJobAssessmentInviteIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobAssessmentInviteDeclineApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidateJobAssessmentInviteResponse'
 */
export type ICandidateJobAssessmentInviteDeclineApiResponse =
  IApiResponse<ICandidateJobAssessmentInviteResponse>;
