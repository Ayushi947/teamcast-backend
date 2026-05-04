import {
  ApplicationStatusEnum,
  JobAssessmentInviteStatusEnum,
  JobInviteStatusEnum,
} from '../../common/enums';

// Helper function to map application status to invite status
const mapApplicationStatusToInviteStatus = (
  status: ApplicationStatusEnum,
  acceptedAt?: Date | null,
  declinedAt?: Date | null,
  invitationStatus?: string | null,
  jobInviteStatus?: string | null
): JobAssessmentInviteStatusEnum => {
  // PRIORITY 0: Check job_invite status first (most authoritative)
  // This reflects the actual invite acceptance/decline status from the job_invite table
  if (jobInviteStatus) {
    switch (jobInviteStatus) {
      case 'ACCEPTED':
        return JobAssessmentInviteStatusEnum.ACCEPTED;
      case 'DECLINED':
        return JobAssessmentInviteStatusEnum.DECLINED;
      case 'PENDING':
        return JobAssessmentInviteStatusEnum.PENDING;
      case 'EXPIRED':
        return JobAssessmentInviteStatusEnum.EXPIRED;
    }
  }

  // PRIORITY 1: Check invitation status from job_ai_assessment_invitation table
  // This handles invite-based signups where application is auto-accepted
  // but the candidate still needs to explicitly accept the assessment invitation
  if (invitationStatus) {
    switch (invitationStatus) {
      case 'PENDING':
        return JobAssessmentInviteStatusEnum.PENDING;
      case 'ACCEPTED':
        return JobAssessmentInviteStatusEnum.ACCEPTED;
      case 'DECLINED':
        return JobAssessmentInviteStatusEnum.DECLINED;
      case 'EXPIRED':
        return JobAssessmentInviteStatusEnum.EXPIRED;
      case 'CANCELLED':
        return JobAssessmentInviteStatusEnum.CANCELLED;
    }
  }

  // PRIORITY 2: Fall back to application status and acceptance/decline timestamps
  switch (status) {
    case ApplicationStatusEnum.INVITED:
      return JobAssessmentInviteStatusEnum.PENDING;
    case ApplicationStatusEnum.ASSESSING:
      if (acceptedAt) {
        return JobAssessmentInviteStatusEnum.ACCEPTED;
      }
      return JobAssessmentInviteStatusEnum.PENDING;
    case ApplicationStatusEnum.DECLINED:
      return JobAssessmentInviteStatusEnum.DECLINED;
    case ApplicationStatusEnum.WITHDRAWN:
      return JobAssessmentInviteStatusEnum.CANCELLED;
    case ApplicationStatusEnum.APPLIED:
    case ApplicationStatusEnum.REVIEWING:
    case ApplicationStatusEnum.SHORTLISTED:
    case ApplicationStatusEnum.OFFERED:
    case ApplicationStatusEnum.ACCEPTED:
    case ApplicationStatusEnum.FAILED:
    case ApplicationStatusEnum.REJECTED:
      // For these statuses, check if there was an acceptance/decline action
      if (acceptedAt) {
        return JobAssessmentInviteStatusEnum.ACCEPTED;
      }
      if (declinedAt) {
        return JobAssessmentInviteStatusEnum.DECLINED;
      }
      return JobAssessmentInviteStatusEnum.PENDING;
    case ApplicationStatusEnum.DRAFT:
    default:
      return JobAssessmentInviteStatusEnum.PENDING;
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

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobAssessmentInvite:
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
 *           description: ID of the job ai assessment
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
 *           description: Who accepted the invite
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
 *           description: Who declined the invite
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
export interface ICandidateJobAssessmentInvite {
  id: string;
  candidateId: string;
  jobPostingId: string;
  jobPostingTitle?: string;
  companyName?: string;
  jobAssessmentId: string | null;
  assessmentId?: string | null; // Alias for jobAssessmentId for backward compatibility
  inviterName?: string;
  message?: string;
  status: JobAssessmentInviteStatusEnum;
  appliedAt: Date;
  notes?: string | null;
  coverLetterUrl?: string | null;
  scheduledDate?: Date | null;
  expiresAt: Date;
  acceptedAt?: Date | null;
  acceptedBy?: string | null;
  acceptedById?: string | null;
  acceptanceNote?: string | null;
  declinedAt?: Date | null;
  declinedBy?: string | null;
  declinedById?: string | null;
  declineReason?: string | null;
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
 * Transform job application data to candidate job assessment invite domain model
 */
export function toCandidateJobAssessmentInviteDomain(
  application: any
): ICandidateJobAssessmentInvite {
  // Get invitation data if available
  const invitation = application.jobAiAssessmentInvitations?.[0];

  // Use expiresAt from job_ai_assessment_invitation if invitation exists,
  // otherwise calculate expiration date (7 days from creation)
  let expiresAt: Date;
  if (invitation?.expiresAt) {
    // Use the most recent invitation's expiresAt from database
    expiresAt = new Date(invitation.expiresAt);
  } else {
    // Fallback to calculated expiration date (7 days from creation)
    // This happens when no invitation record exists in job_ai_assessment_invitations table
    expiresAt = getExpirationDate(application.createdAt);
  }

  // Get inviter name from invitation if available, otherwise from job posting client users
  const inviterName =
    invitation?.invitedBy?.user?.name ||
    application.jobPosting?.client?.clientUsers?.[0]?.user?.name ||
    'HR Team';

  // Check if invite is expired and update status accordingly
  // Pass jobInvite status as highest priority, then invitation status
  let status = mapApplicationStatusToInviteStatus(
    application.status,
    application.acceptedAt,
    application.declinedAt,
    invitation?.status,
    application.jobInvite?.status // PRIORITY 0: Check job_invite status first
  );

  if (
    status === JobAssessmentInviteStatusEnum.PENDING &&
    isInviteExpired(expiresAt)
  ) {
    status = JobAssessmentInviteStatusEnum.EXPIRED;
  }

  // Extract assessment data if available
  const assessment = application.aiAssessment;
  const assessmentStatus = assessment?.status || null;
  const assessmentCompleted = assessment?.status === 'COMPLETED' || false;
  const assessmentResult = assessment?.result || null;
  const assessmentScore = assessment?.overallScore || null;
  const assessmentRecommendation = assessment?.recommendation || null;
  const assessmentStartedAt = assessment?.startedAt || null;
  const assessmentCompletedAt = assessment?.completedAt || null;

  const assessmentId = application.aiAssessment?.id || null;

  return {
    id: application.id,
    candidateId: application.candidateId,
    jobPostingId: application.jobPostingId,
    jobPostingTitle: application.jobPosting?.title,
    companyName: application.jobPosting?.client?.company?.name,
    jobAssessmentId: assessmentId,
    // Add assessmentId as alias for backward compatibility with frontend
    assessmentId: assessmentId,
    inviterName,
    message: invitation?.message || application.notes,
    status,
    appliedAt: application.appliedAt,
    notes: application.notes,
    coverLetterUrl: application.coverLetterUrl,
    scheduledDate: invitation?.scheduledDate
      ? new Date(invitation.scheduledDate)
      : null,
    expiresAt,
    acceptedAt:
      application.jobInvite?.status === JobInviteStatusEnum.ACCEPTED
        ? application.jobInvite.updatedAt
        : null,
    acceptedBy: application.acceptedBy,
    acceptedById: application.acceptedById,
    acceptanceNote: application.acceptanceNote,
    declinedAt:
      application.jobInvite?.status === JobInviteStatusEnum.DECLINED
        ? application.jobInvite.updatedAt
        : application.declinedAt || null,
    declinedBy: application.declinedBy,
    declinedById: application.declinedById,
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
