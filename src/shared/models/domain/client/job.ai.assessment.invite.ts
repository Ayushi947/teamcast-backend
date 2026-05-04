import {
  ApplicationStatusEnum,
  JobAiAssessmentInviteStatusEnum,
} from '../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobAiAssessmentInvite:
 *       type: object
 *       description: Client view of JD assessment invite
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the invite
 *         clientId:
 *           type: string
 *           format: uuid
 *           description: ID of the client who created the invite
 *         candidateId:
 *           type: string
 *           format: uuid
 *           description: ID of the candidate being invited
 *         candidateName:
 *           type: string
 *           description: Name of the candidate
 *         candidateEmail:
 *           type: string
 *           description: Email of the candidate
 *         jobPostingId:
 *           type: string
 *           format: uuid
 *           description: ID of the job posting
 *         jobPostingTitle:
 *           type: string
 *           description: Title of the job posting
 *         jdAssessmentId:
 *           type: string
 *           format: uuid
 *           description: ID of the JD assessment
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
 *           $ref: '#/components/schemas/JdAssessmentInviteStatusEnum'
 *           description: Current status of the invite
 *         scheduledDate:
 *           type: string
 *           format: date-time
 *           description: Scheduled date for the assessment
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
 */
export interface IJobAiAssessmentInvite {
  id: string;
  clientId: string;
  candidateId: string;
  candidateName?: string;
  candidateEmail?: string;
  jobPostingId: string;
  jobPostingTitle?: string;
  jdAssessmentId?: string;
  invitedById: string;
  inviterName?: string;
  message?: string;
  status: JobAiAssessmentInviteStatusEnum;
  scheduledDate?: Date;
  expiresAt: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
  declineReason?: string;
  createdAt: Date;
  updatedAt: Date;
  assessmentStatus?: string | null;
  assessmentCompleted?: boolean | null;
  assessmentResult?: string | null;
  assessmentScore?: number | null;
  assessmentRecommendation?: string | null;
  assessmentStartedAt?: Date | null;
  assessmentCompletedAt?: Date | null;
}

/**
 * Transform database record to client domain model
 */
export function toJobAiAssessmentInviteDomain(
  invite: any
): IJobAiAssessmentInvite {
  return {
    id: invite.id,
    clientId: invite.clientUserId || invite.clientId,
    candidateId: invite.candidateId,
    candidateName: invite.candidate?.user?.name,
    candidateEmail: invite.candidate?.user?.email,
    jobPostingId: invite.jobPostingId,
    jobPostingTitle: invite.jobPosting?.title,
    jdAssessmentId: invite.jdAssessmentId,
    invitedById: invite.clientUserId,
    inviterName: invite.clientUser?.user?.name,
    message: invite.message,
    status: invite.status,
    scheduledDate: invite.scheduledDate,
    expiresAt: invite.expiresAt,
    acceptedAt: invite.acceptedAt,
    declinedAt: invite.declinedAt,
    declineReason: invite.declineReason,
    createdAt: invite.createdAt,
    updatedAt: invite.updatedAt,
  };
}

// Helper function to map application status to invite status
const mapApplicationStatusToInviteStatus = (
  status: ApplicationStatusEnum,
  acceptedAt?: Date | null,
  declinedAt?: Date | null
): JobAiAssessmentInviteStatusEnum => {
  switch (status) {
    case ApplicationStatusEnum.INVITED:
      return JobAiAssessmentInviteStatusEnum.PENDING;
    case ApplicationStatusEnum.ASSESSING:
      if (acceptedAt) {
        return JobAiAssessmentInviteStatusEnum.ACCEPTED;
      }
      return JobAiAssessmentInviteStatusEnum.PENDING;
    case ApplicationStatusEnum.DECLINED:
      return JobAiAssessmentInviteStatusEnum.DECLINED;
    case ApplicationStatusEnum.WITHDRAWN:
      return JobAiAssessmentInviteStatusEnum.CANCELLED;
    case ApplicationStatusEnum.APPLIED:
    case ApplicationStatusEnum.REVIEWING:
    case ApplicationStatusEnum.SHORTLISTED:
    case ApplicationStatusEnum.OFFERED:
    case ApplicationStatusEnum.ACCEPTED:
    case ApplicationStatusEnum.FAILED:
    case ApplicationStatusEnum.REJECTED:
      // For these statuses, check if there was an acceptance/decline action
      if (acceptedAt) {
        return JobAiAssessmentInviteStatusEnum.ACCEPTED;
      }
      if (declinedAt) {
        return JobAiAssessmentInviteStatusEnum.DECLINED;
      }
      return JobAiAssessmentInviteStatusEnum.PENDING;
    case ApplicationStatusEnum.DRAFT:
    default:
      return JobAiAssessmentInviteStatusEnum.PENDING;
  }
};

// Helper function to check if invite is expired
const isInviteExpired = (expiresAt: Date): boolean => {
  return new Date() > expiresAt;
};

// Helper function to get expiration date (7 days from creation)
const getExpirationDate = (
  createdAt: Date,
  customExpiryDays: number = 7
): Date => {
  const expiryDate = new Date(createdAt);
  expiryDate.setDate(expiryDate.getDate() + customExpiryDays);
  return expiryDate;
};

export function toClientJobAiAssessmentInviteDomain(
  application: any
): IJobAiAssessmentInvite {
  // Calculate expiration date (7 days from creation)
  const expiresAt = getExpirationDate(application.createdAt);

  // Get inviter name from job posting client users
  const inviterName =
    application.jobPosting?.client?.clientUsers?.[0]?.user?.name || 'HR Team';

  // Check if invite is expired and update status accordingly
  let status = mapApplicationStatusToInviteStatus(
    application.status,
    application.acceptedAt,
    application.declinedAt
  );

  if (
    status === JobAiAssessmentInviteStatusEnum.PENDING &&
    isInviteExpired(expiresAt)
  ) {
    status = JobAiAssessmentInviteStatusEnum.EXPIRED;
  }

  const assessment = application.aiAssessment;
  const assessmentStatus = assessment?.status || null;
  const assessmentCompleted = assessment?.status === 'COMPLETED' || false;
  const assessmentResult = assessment?.result || null;
  const assessmentScore = assessment?.overallScore || null;
  const assessmentRecommendation = assessment?.recommendation || null;
  const assessmentStartedAt = assessment?.startedAt || null;
  const assessmentCompletedAt = assessment?.completedAt || null;

  return {
    id: application.id,
    clientId:
      application.jobPosting?.clientId || application.jobPosting?.client?.id,
    candidateId: application.candidateId,
    candidateName: application.candidate?.user?.name,
    candidateEmail: application.candidate?.user?.email,
    jobPostingId: application.jobPostingId,
    jobPostingTitle: application.jobPosting?.title,
    jdAssessmentId: application.aiAssessment?.assessmentId || null,
    invitedById:
      application.jobPosting?.client?.clientUsers?.[0]?.id ||
      application.jobPosting?.clientId,
    inviterName,
    message: application.notes,
    status,
    scheduledDate: undefined, // This would need to be set based on assessment scheduling
    expiresAt,
    acceptedAt: application.acceptedAt,
    declinedAt: application.declinedAt,
    declineReason: application.declineReason,
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
    assessmentStatus,
    assessmentCompleted,
    assessmentResult,
    assessmentScore,
    assessmentRecommendation,
    assessmentStartedAt,
    assessmentCompletedAt,
  };
}

export interface IClientJobAiAssessmentInviteUrl {
  invitationUrl: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobAiAssessmentInterviewItem:
 *       type: object
 *       description: Individual job AI assessment interview information
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the interview invitation
 *         candidateName:
 *           type: string
 *           description: Name of the candidate
 *         candidateEmail:
 *           type: string
 *           format: email
 *           description: Email of the candidate
 *         companyName:
 *           type: string
 *           description: Name of the company
 *         jobTitle:
 *           type: string
 *           description: Title of the job posting
 *         status:
 *           type: string
 *           enum: [PENDING, ACCEPTED, DECLINED, EXPIRED, CANCELLED]
 *           description: Current status of the interview invitation
 *         assessmentStatus:
 *           type: string
 *           nullable: true
 *           description: Current status of the actual assessment if it exists
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the interview invitation was created
 *         selectedSlotDateTime:
 *           type: string
 *           format: date-time
 *           description: Date and time of the selected interview slot
 *         invitationUrl:
 *           type: string
 *           description: URL of the invitation
 */
export interface IJobAiAssessmentInterviewItem {
  id: string;
  candidateName: string;
  candidateEmail: string;
  companyName?: string;
  jobPostingId?: string;
  jobApplicationId?: string;
  jobTitle: string;
  status: string;
  assessmentStatus?: string | null;
  assessmentId?: string | null;
  createdAt: Date;
  selectedSlotDateTime?: Date;
  invitationUrl?: string;
  // Additional fields to match IScheduledInterviewItem
  slotId?: string;
  slotStatus?: string;
  panelMemberNames?: string[];
  meetingStatus?: string;
  // Job application status fields for frontend logic
  jobApplicationAcceptedAt?: Date | null;
  jobApplicationDeclinedAt?: Date | null;
  jobApplicationStatus?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IScheduledJobAssessmentDetails:
 *       type: object
 *       description: Detailed information about a scheduled panel assessment meeting
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the invitation
 *         candidateName:
 *           type: string
 *           description: Name of the candidate
 *         candidateEmail:
 *           type: string
 *           format: email
 *           description: Email of the candidate
 *         jobAssessmentId:
 *           type: string
 *           format: uuid
 *           description: ID of the job assessment
 *         meetingStatus:
 *           type: string
 *           description: Status of the meeting/job assessment
 *         jobTitle:
 *           type: string
 *           description: Title of the job posting
 *         selectedSlotDateTime:
 *           type: string
 *           format: date-time
 *           description: Date and time of the selected interview slot
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time of the creation of the invitation
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: Date and time of the expiration of the invitation
 */
export interface IScheduledJobAssessmentDetails {
  id: string;
  candidateName: string;
  candidateEmail: string;
  jobAssessmentId?: string;
  meetingStatus: string;
  jobTitle: string;
  selectedSlotDateTime?: Date;
  createdAt: Date;
  expiresAt?: Date;
}
