import { JobInviteStatusEnum, ApplicationStatusEnum } from '../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobInvite:
 *       type: object
 *       description: Client view of job invite with application status
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the invite
 *         clientId:
 *           type: string
 *           format: uuid
 *           description: ID of the client who created the invite
 *         candidateName:
 *           type: string
 *           description: Name of the candidate
 *         candidateEmail:
 *           type: string
 *           description: Email of the candidate
 *         jobId:
 *           type: string
 *           format: uuid
 *           description: ID of the job posting
 *         jobTitle:
 *           type: string
 *           description: Title of the job posting
 *         invitedById:
 *           type: string
 *           format: uuid
 *           description: ID of the user who created the invite
 *         inviterName:
 *           type: string
 *           description: Name of the user who created the invite
 *         message:
 *           type: string
 *           description: Optional message from the inviter
 *         status:
 *           $ref: '#/components/schemas/JobInviteStatusEnum'
 *           description: Current status of the invite
 *         scheduledDate:
 *           type: string
 *           format: date-time
 *           description: Scheduled date for the onboarding/assessment
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: Expiration date of the invite
 *         acceptedAt:
 *           type: string
 *           format: date-time
 *           description: Date when the invite was accepted
 *         declinedAt:
 *           type: string
 *           format: date-time
 *           description: Date when the invite was declined
 *         declineReason:
 *           type: string
 *           description: Reason for declining the invite
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the invite was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the invite was last updated
 *         isImportedCandidate:
 *           type: boolean
 *           description: Whether this candidate was imported from an external source
 *         integrationId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: ID of the integration provider used for import
 *         applicationStatus:
 *           $ref: '#/components/schemas/ApplicationStatusEnum'
 *           description: Current status of the job application
 *         applicationId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: ID of the associated job application
 *         appliedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Date when the application was submitted
 *         applicationAcceptedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Date when the application was accepted
 *         applicationAcceptedBy:
 *           type: string
 *           nullable: true
 *           description: Who accepted the application (CLIENT or CANDIDATE)
 *         applicationAcceptedById:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: ID of the user who accepted the application
 *         applicationDeclinedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Date when the application was declined
 *         applicationDeclinedBy:
 *           type: string
 *           nullable: true
 *           description: Who declined the application (CLIENT or CANDIDATE)
 *         applicationDeclinedById:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: ID of the user who declined the application
 *         applicationNotes:
 *           type: string
 *           nullable: true
 *           description: Notes on the application
 *         coverLetterUrl:
 *           type: string
 *           nullable: true
 *           description: URL to the cover letter document
 */
export interface IJobInvite {
  id: string;
  clientId: string;
  candidateName?: string;
  candidateEmail?: string;
  jobId: string;
  jobTitle?: string;
  invitedById: string;
  inviterName?: string;
  message?: string;
  status: JobInviteStatusEnum;
  scheduledDate?: Date;
  expiresAt: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
  declineReason?: string;
  createdAt: Date;
  updatedAt: Date;
  isImportedCandidate?: boolean;
  integrationId?: string;

  // Application status information
  applicationStatus?: ApplicationStatusEnum;
  applicationId?: string;
  appliedAt?: Date;
  applicationAcceptedAt?: Date;
  applicationAcceptedBy?: string;
  applicationAcceptedById?: string;
  applicationDeclinedAt?: Date;
  applicationDeclinedBy?: string;
  applicationDeclinedById?: string;
  applicationNotes?: string;
  coverLetterUrl?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobInviteTokenValidation:
 *       type: object
 *       description: Domain model for job invite token validation
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email address from the invite
 *         name:
 *           type: string
 *           description: Name from the invite
 *         jobId:
 *           type: string
 *           format: uuid
 *           description: Job ID from the invite
 *         inviteId:
 *           type: string
 *           format: uuid
 *           description: Invite ID
 *         isValid:
 *           type: boolean
 *           description: Whether the invite token is valid
 *         message:
 *           type: string
 *           description: Error message if validation fails
 *         isUSBasedJob:
 *           type: boolean
 *           description: Whether the job posting is USA-based
 */
export interface IJobInviteTokenValidation {
  email: string;
  name: string;
  jobId: string;
  inviteId: string;
  isValid: boolean;
  message?: string;
  isUSBasedJob?: boolean;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobInviteListResponse:
 *       type: object
 *       description: Response for job invite list
 *       properties:
 *         invites:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IJobInvite'
 *           description: List of job invites
 *         total:
 *           type: integer
 *           description: Total number of invites
 *         page:
 *           type: integer
 *           description: Current page number
 *         limit:
 *           type: integer
 *           description: Number of items per page
 *         totalPages:
 *           type: integer
 *           description: Total number of pages
 */
export interface IJobInviteListResponse {
  invites: IJobInvite[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobInviteFilters:
 *       type: object
 *       description: Filters for job invite queries
 *       properties:
 *         status:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/JobInviteStatusEnum'
 *           description: Filter by invite status
 *         jobId:
 *           type: string
 *           format: uuid
 *           description: Filter by specific job posting ID
 *         search:
 *           type: string
 *           description: Search term for candidate name or email
 *         startDate:
 *           type: string
 *           format: date
 *           description: Filter invites created from this date
 *         endDate:
 *           type: string
 *           format: date
 *           description: Filter invites created until this date
 */
export interface IJobInviteFilters {
  status?: JobInviteStatusEnum[];
  jobId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export function toJobInviteDomain(invite: any): IJobInvite {
  return {
    id: invite.id,
    clientId: invite.clientUserId || invite.clientId,
    candidateName: invite.candidate?.user?.name,
    candidateEmail: invite.candidate?.user?.email,
    jobId: invite.jobId,
    jobTitle: invite.job?.title,
    invitedById: invite.clientUserId,
    inviterName: invite.clientUser?.user?.name,
    message: invite.message,
    status: invite.status,
    scheduledDate: invite.scheduledDate,
    expiresAt: invite.expiresAt,
    acceptedAt:
      invite.status === JobInviteStatusEnum.ACCEPTED
        ? invite.updatedAt
        : undefined,
    declinedAt:
      invite.status === JobInviteStatusEnum.DECLINED
        ? invite.updatedAt
        : undefined,
    declineReason: invite.declineReason,
    createdAt: invite.createdAt,
    updatedAt: invite.updatedAt,
    isImportedCandidate: invite.isImportedCandidate,
    integrationId: invite.integrationId,

    // Application status information
    applicationStatus: invite.application?.status,
    applicationId: invite.application?.id,
    appliedAt: invite.application?.createdAt,
    applicationAcceptedAt: invite.application?.acceptedAt,
    applicationAcceptedBy: invite.application?.acceptedBy,
    applicationAcceptedById: invite.application?.acceptedById,
    applicationDeclinedAt: invite.application?.declinedAt,
    applicationDeclinedBy: invite.application?.declinedBy,
    applicationDeclinedById: invite.application?.declinedById,
    applicationNotes: invite.application?.notes,
    coverLetterUrl: invite.application?.coverLetterUrl,
  };
}

export function toJobInviteTokenValidationDomain(
  validation: any
): IJobInviteTokenValidation {
  return {
    email: validation.email,
    name: validation.name,
    jobId: validation.jobId,
    inviteId: validation.inviteId,
    isValid: validation.isValid,
    message: validation.message,
  };
}
