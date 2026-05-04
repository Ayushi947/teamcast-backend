/**
 * @openapi
 * components:
 *   schemas:
 *     AiAssessmentResultEnum:
 *       type: string
 *       description: Result of an AI assessment
 *       enum:
 *         - NOT_AVAILABLE
 *         - PASSED
 *         - FAILED
 */
export enum AiAssessmentResultEnum {
  NOT_AVAILABLE = 'NOT_AVAILABLE',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     AiAssessmentStatusEnum:
 *       type: string
 *       description: Status of an AI assessment
 *       enum:
 *         - NOT_STARTED
 *         - AI_GENERATION_IN_PROGRESS
 *         - AI_GENERATION_COMPLETED
 *         - ASSESSMENT_IN_PROGRESS
 *         - ASSESSMENT_COMPLETED
 *         - AI_REVIEW_IN_PROGRESS
 *         - AI_REVIEW_COMPLETED
 *         - MANUAL_REVIEW_IN_PROGRESS
 *         - MANUAL_REVIEW_COMPLETED
 */
export enum AiAssessmentStatusEnum {
  NOT_STARTED = 'NOT_STARTED',
  AI_GENERATION_IN_PROGRESS = 'AI_GENERATION_IN_PROGRESS',
  AI_GENERATION_COMPLETED = 'AI_GENERATION_COMPLETED',
  ASSESSMENT_IN_PROGRESS = 'ASSESSMENT_IN_PROGRESS',
  ASSESSMENT_COMPLETED = 'ASSESSMENT_COMPLETED',
  AI_REVIEW_IN_PROGRESS = 'AI_REVIEW_IN_PROGRESS',
  AI_REVIEW_COMPLETED = 'AI_REVIEW_COMPLETED',
  MANUAL_REVIEW_IN_PROGRESS = 'MANUAL_REVIEW_IN_PROGRESS',
  MANUAL_REVIEW_COMPLETED = 'MANUAL_REVIEW_COMPLETED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     AiAssessmentRecommendationEnum:
 *       type: string
 *       description: Recommendation based on AI assessment
 *       enum:
 *         - HIGHLY_RECOMMENDED
 *         - RECOMMENDED
 *         - NOT_RECOMMENDED
 */
export enum AiAssessmentRecommendationEnum {
  HIGHLY_RECOMMENDED = 'HIGHLY_RECOMMENDED',
  RECOMMENDED = 'RECOMMENDED',
  NOT_RECOMMENDED = 'NOT_RECOMMENDED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     AiAssessmentSectionStatusEnum:
 *       type: string
 *       description: Status of an AI assessment section
 *       enum:
 *         - NOT_STARTED
 *         - IN_PROGRESS
 *         - COMPLETED
 *         - FAILED
 */
export enum AiAssessmentSectionStatusEnum {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     AiAssessmentSectionResultEnum:
 *       type: string
 *       description: Result of an AI assessment section
 *       enum:
 *         - NOT_AVAILABLE
 *         - PASSED
 *         - FAILED
 */
export enum AiAssessmentSectionResultEnum {
  NOT_AVAILABLE = 'NOT_AVAILABLE',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ResumeAssessmentResultEnum:
 *       type: string
 *       description: Result of a resume assessment
 *       enum:
 *         - NOT_AVAILABLE
 *         - PASSED
 *         - FAILED
 */
export enum ResumeAssessmentResultEnum {
  NOT_AVAILABLE = 'NOT_AVAILABLE',
  PASSED = 'PASSED',
  AI_REVIEW_FAILED = 'AI_REVIEW_FAILED',
  MANUAL_REVIEW_FAILED = 'MANUAL_REVIEW_FAILED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ResumeAssessmentRecommendationEnum:
 *       type: string
 *       description: Recommendation based on resume assessment
 *       enum:
 *         - HIGHLY_RECOMMENDED
 *         - RECOMMENDED
 *         - NOT_RECOMMENDED
 */
export enum ResumeAssessmentRecommendationEnum {
  HIGHLY_RECOMMENDED = 'HIGHLY_RECOMMENDED',
  RECOMMENDED = 'RECOMMENDED',
  NOT_RECOMMENDED = 'NOT_RECOMMENDED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ResumeAssessmentStatusEnum:
 *       type: string
 *       description: Status of a resume assessment
 *       enum:
 *         - NOT_STARTED
 *         - AI_REVIEW_IN_PROGRESS
 *         - AI_REVIEW_COMPLETED
 *         - COMPLETED
 */
export enum ResumeAssessmentStatusEnum {
  NOT_STARTED = 'NOT_STARTED',
  AI_REVIEW_IN_PROGRESS = 'AI_REVIEW_IN_PROGRESS',
  AI_REVIEW_COMPLETED = 'AI_REVIEW_COMPLETED',
  MANUAL_REVIEW_IN_PROGRESS = 'MANUAL_REVIEW_IN_PROGRESS',
  MANUAL_REVIEW_COMPLETED = 'MANUAL_REVIEW_COMPLETED',
  ASSESSMENT_COMPLETED = 'ASSESSMENT_COMPLETED',
  ASSESSMENT_FAILED = 'ASSESSMENT_FAILED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ResumeParsingTaskStatusEnum:
 *       type: string
 *       description: Status of a resume parsing task
 *       enum:
 *         - PENDING
 *         - PROCESSING
 *         - UPDATING_CANDIDATE_RESUME
 *         - COMPLETED
 *         - FAILED
 */
export enum ResumeParsingTaskStatusEnum {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  UPDATING_CANDIDATE_RESUME = 'UPDATING_CANDIDATE_RESUME',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     JobParsingTaskStatusEnum:
 *       type: string
 *       description: Status of a job parsing task
 *       enum:
 *         - PENDING
 *         - PROCESSING
 *         - UPDATING_JOB_POSTING
 *         - COMPLETED
 *         - FAILED
 */
export enum JobParsingTaskStatusEnum {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  UPDATING_JOB_POSTING = 'UPDATING_JOB_POSTING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ClientUserInvitationStatusEnum:
 *       type: string
 *       description: Status of a client user invitation
 *       enum:
 *         - PENDING
 *         - ACCEPTED
 *         - EXPIRED
 *         - WITHDRAWN
 */
export enum ClientUserInvitationStatusEnum {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  WITHDRAWN = 'WITHDRAWN',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     PartnerUserInvitationStatusEnum:
 *       type: string
 *       description: Status of a partner user invitation
 *       enum:
 *         - PENDING
 *         - ACCEPTED
 *         - EXPIRED
 *         - WITHDRAWN
 */
export enum PartnerUserInvitationStatusEnum {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  WITHDRAWN = 'WITHDRAWN',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportUserInvitationStatusEnum:
 *       type: string
 *       description: Status of a support user invitation
 *       enum:
 *         - PENDING
 *         - ACCEPTED
 *         - EXPIRED
 *         - WITHDRAWN
 *         - RESEND
 */
export enum SupportUserInvitationStatusEnum {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  WITHDRAWN = 'WITHDRAWN',
  RESEND = 'RESEND',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportCandidateInvitationStatusEnum:
 *       type: string
 *       description: Status of a support candidate invitation
 *       enum:
 *         - PENDING
 *         - ACCEPTED
 *         - EXPIRED
 *         - WITHDRAWN
 *         - RESEND
 */
export enum SupportCandidateInvitationStatusEnum {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  WITHDRAWN = 'WITHDRAWN',
  RESEND = 'RESEND',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportPartnerInvitationStatusEnum:
 *       type: string
 *       enum:
 *         - PENDING
 *         - ACCEPTED
 *         - EXPIRED
 *         - WITHDRAWN
 *         - RESEND
 *       description: Status of support partner invitation
 */
export enum SupportPartnerInvitationStatusEnum {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  WITHDRAWN = 'WITHDRAWN',
  RESEND = 'RESEND',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportClientInvitationStatusEnum:
 *       type: string
 *       enum:
 *         - PENDING
 *         - ACCEPTED
 *         - EXPIRED
 *         - WITHDRAWN
 *         - RESEND
 *       description: Status of support client invitation
 */
export enum SupportClientInvitationStatusEnum {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  WITHDRAWN = 'WITHDRAWN',
  RESEND = 'RESEND',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     JobRequirementTypeEnum:
 *       type: string
 *       description: Type of job requirement
 *       enum:
 *         - REQUIRED
 *         - PREFERRED
 *         - NICE_TO_HAVE
 */
export enum JobRequirementTypeEnum {
  REQUIRED = 'REQUIRED',
  PREFERRED = 'PREFERRED',
  NICE_TO_HAVE = 'NICE_TO_HAVE',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     JobPostingStatusEnum:
 *       type: string
 *       description: Status of a job posting
 *       enum:
 *         - DRAFT
 *         - PUBLISHED
 *         - CLOSED
 *         - ARCHIVED
 */
export enum JobPostingStatusEnum {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ClientCreditTypeEnum:
 *       type: string
 *       description: Type of credit for client subscription
 *       enum:
 *         - CANDIDATE_VIEW
 *         - AI_ASSESSMENT
 *         - SEAT
 */
export enum ClientCreditTypeEnum {
  CANDIDATE_VIEW = 'CANDIDATE_VIEW',
  AI_ASSESSMENT = 'AI_ASSESSMENT',
  SEAT = 'SEAT',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     CandidateCreditTypeEnum:
 *       type: string
 *       description: Type of credit for candidate subscription
 *       enum:
 *         - PRACTICE_ASSESSMENT
 */
export enum CandidateCreditTypeEnum {
  PRACTICE_ASSESSMENT = 'PRACTICE_ASSESSMENT',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     CandidateStatusEnum:
 *       type: string
 *       description: Status of a candidate
 *       enum:
 *         - NEW
 *         - ONBOARDED
 *         - REJECTED
 *         - HIRED
 */
export enum CandidateStatusEnum {
  NEW = 'NEW',
  ONBOARDED = 'ONBOARDED',
  REJECTED = 'REJECTED',
  HIRED = 'HIRED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     CandidateJobSearchStatusEnum:
 *       type: string
 *       description: Job search status of a candidate
 *       enum:
 *         - OPEN_TO_OPPORTUNITIES
 *         - NOT_LOOKING
 */
export enum CandidateJobSearchStatusEnum {
  OPEN_TO_OPPORTUNITIES = 'OPEN_TO_OPPORTUNITIES',
  NOT_LOOKING = 'NOT_LOOKING',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     CandidateAssessmentStageEnum:
 *       type: string
 *       description: Assessment stage for a candidate
 *       enum:
 *         - RESUME_ASSESSMENT
 *         - ONBOARDING_ASSESSMENT
 */
export enum CandidateAssessmentStageEnum {
  RESUME_ASSESSMENT = 'RESUME_ASSESSMENT',
  ONBOARDING_ASSESSMENT = 'ONBOARDING_ASSESSMENT',
  JOB_AI_ASSESSMENT = 'JOB_AI_ASSESSMENT',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     CandidateResumeAssessmentStatusEnum:
 *       type: string
 *       description: Status of a candidate's resume assessment
 *       enum:
 *         - ASSESSMENT_PENDING
 *         - ASSESSMENT_COMPLETED
 *         - ASSESSMENT_FAILED
 */
export enum CandidateResumeAssessmentStatusEnum {
  ASSESSMENT_NOT_DONE = 'ASSESSMENT_NOT_DONE',
  ASSESSMENT_IN_PROGRESS = 'ASSESSMENT_IN_PROGRESS',
  ASSESSMENT_COMPLETED = 'ASSESSMENT_COMPLETED',
  ASSESSMENT_FAILED = 'ASSESSMENT_FAILED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     PracticeAssessmentStatusEnum:
 *       type: string
 *       description: Status of a practice assessment
 *       enum:
 *         - NOT_STARTED
 *         - IN_PROGRESS
 *         - COMPLETED
 *         - FAILED
 */
export enum PracticeAssessmentStatusEnum {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     PracticeAssessmentResultEnum:
 *       type: string
 *       description: Result of a practice assessment
 *       enum:
 *         - NOT_AVAILABLE
 *         - PASSED
 *         - FAILED
 */
export enum PracticeAssessmentResultEnum {
  NOT_AVAILABLE = 'NOT_AVAILABLE',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     PublicPracticeAssessmentStatusEnum:
 *       type: string
 *       description: Status of a public practice assessment
 *       enum:
 *         - NOT_STARTED
 *         - AI_INITIALIZATION_IN_PROGRESS
 *         - AI_INITIALIZATION_COMPLETED
 *         - IN_PROGRESS
 *         - AI_REVIEW_IN_PROGRESS
 *         - AI_REVIEW_COMPLETED
 *         - COMPLETED
 *         - FAILED
 */
export enum PublicPracticeAssessmentStatusEnum {
  NOT_STARTED = 'NOT_STARTED',
  AI_INITIALIZATION_IN_PROGRESS = 'AI_INITIALIZATION_IN_PROGRESS',
  AI_INITIALIZATION_COMPLETED = 'AI_INITIALIZATION_COMPLETED',
  IN_PROGRESS = 'IN_PROGRESS',
  AI_REVIEW_IN_PROGRESS = 'AI_REVIEW_IN_PROGRESS',
  AI_REVIEW_COMPLETED = 'AI_REVIEW_COMPLETED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     PublicPracticeAssessmentResultEnum:
 *       type: string
 *       description: Result of a public practice assessment
 *       enum:
 *         - NOT_AVAILABLE
 *         - PASSED
 *         - FAILED
 */
export enum PublicPracticeAssessmentResultEnum {
  NOT_AVAILABLE = 'NOT_AVAILABLE',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     PublicPracticeAssessmentRecommendationEnum:
 *       type: string
 *       description: Recommendation based on public practice assessment
 *       enum:
 *         - HIGHLY_RECOMMENDED
 *         - RECOMMENDED
 *         - NOT_RECOMMENDED
 */
export enum PublicPracticeAssessmentRecommendationEnum {
  HIGHLY_RECOMMENDED = 'HIGHLY_RECOMMENDED',
  RECOMMENDED = 'RECOMMENDED',
  NOT_RECOMMENDED = 'NOT_RECOMMENDED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     PublicPracticeAssessmentSectionStatusEnum:
 *       type: string
 *       description: Status of a public practice assessment section
 *       enum:
 *         - NOT_STARTED
 *         - IN_PROGRESS
 *         - COMPLETED
 *         - FAILED
 */
export enum PublicPracticeAssessmentSectionStatusEnum {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     PublicPracticeAssessmentSectionResultEnum:
 *       type: string
 *       description: Result of a public practice assessment section
 *       enum:
 *         - NOT_AVAILABLE
 *         - PASSED
 *         - FAILED
 */
export enum PublicPracticeAssessmentSectionResultEnum {
  NOT_AVAILABLE = 'NOT_AVAILABLE',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     PublicPracticeAssessmentTaskStatusEnum:
 *       type: string
 *       description: Status of a public practice assessment task
 *       enum:
 *         - PENDING
 *         - PROCESSING
 *         - COMPLETED
 *         - FAILED
 */
export enum PublicPracticeAssessmentTaskStatusEnum {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     PublicPracticeAssessmentVideoAnalysisStatusEnum:
 *       type: string
 *       description: Status of a public practice assessment video analysis
 *       enum:
 *         - NOT_STARTED
 *         - IN_PROGRESS
 *         - COMPLETED
 *         - FAILED
 *         - UPLOADED
 *         - SKIPPED
 */
export enum PublicPracticeAssessmentVideoAnalysisStatusEnum {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  UPLOADED = 'UPLOADED',
  SKIPPED = 'SKIPPED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     PracticeAssessmentSectionStatusEnum:
 *       type: string
 *       description: Status of a practice assessment section
 *       enum:
 *         - NOT_STARTED
 *         - IN_PROGRESS
 *         - COMPLETED
 *         - FAILED
 */
export enum PracticeAssessmentSectionStatusEnum {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     PracticeAssessmentSectionResultEnum:
 *       type: string
 *       description: Result of a practice assessment section
 *       enum:
 *         - NOT_AVAILABLE
 *         - PASSED
 *         - FAILED
 */
export enum PracticeAssessmentSectionResultEnum {
  NOT_AVAILABLE = 'NOT_AVAILABLE',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ApplicationStatusEnum:
 *       type: string
 *       description: Status of a job application
 *       enum:
 *         - DRAFT
 *         - INVITED
 *         - APPLIED
 *         - REVIEWING
 *         - SHORTLISTED
 *         - ASSESSING
 *         - OFFERED
 *         - ACCEPTED
 *         - FAILED
 *         - REJECTED
 *         - WITHDRAWN
 */
export enum ApplicationStatusEnum {
  DRAFT = 'DRAFT',
  INVITED = 'INVITED',
  APPLIED = 'APPLIED',
  REVIEWING = 'REVIEWING',
  SHORTLISTED = 'SHORTLISTED',
  ASSESSING = 'ASSESSING',
  OFFERED = 'OFFERED',
  ACCEPTED = 'ACCEPTED',
  FAILED = 'FAILED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
  DECLINED = 'DECLINED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     CandidateOnboardingAssessmentStatusEnum:
 *       type: string
 *       description: Status of a candidate's onboarding assessment
 *       enum:
 *         - ASSESSMENT_PENDING
 *         - ASSESSMENT_COMPLETED
 *         - ASSESSMENT_FAILED
 */
export enum CandidateOnboardingAssessmentStatusEnum {
  ASSESSMENT_NOT_DONE = 'ASSESSMENT_NOT_DONE',
  ASSESSMENT_IN_PROGRESS = 'ASSESSMENT_IN_PROGRESS',
  ASSESSMENT_RESET = 'ASSESSMENT_RESET',
  ASSESSMENT_COMPLETED = 'ASSESSMENT_COMPLETED',
  ASSESSMENT_FAILED = 'ASSESSMENT_FAILED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     OnboardingAssessmentResultEnum:
 *       type: string
 *       description: Result of an onboarding assessment
 *       enum:
 *         - NOT_AVAILABLE
 *         - PASSED
 *         - FAILED
 */
export enum OnboardingAssessmentResultEnum {
  NOT_AVAILABLE = 'NOT_AVAILABLE',
  PASSED = 'PASSED',
  AI_REVIEW_FAILED = 'AI_REVIEW_FAILED',
  MANUAL_REVIEW_FAILED = 'MANUAL_REVIEW_FAILED',
  TERMINATED_MAX_WARNINGS = 'TERMINATED_MAX_WARNINGS',
  TERMINATED_FOUL_LANGUAGE = 'TERMINATED_FOUL_LANGUAGE',
  TERMINATED_CANDIDATE_REQUEST = 'TERMINATED_CANDIDATE_REQUEST',
  TERMINATED_INCIDENT = 'TERMINATED_INCIDENT',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     OnboardingAssessmentVideoAnalysisStatusEnum:
 *       type: string
 *       description: Status of an onboarding assessment video analysis
 *       enum:
 *         - NOT_STARTED
 *         - IN_PROGRESS
 *         - COMPLETED
 *         - FAILED
 */
export enum OnboardingAssessmentVideoAnalysisStatusEnum {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     OnboardingAssessmentRecommendationEnum:
 *       type: string
 *       description: Recommendation based on onboarding assessment
 *       enum:
 *         - HIGHLY_RECOMMENDED
 *         - RECOMMENDED
 *         - NOT_RECOMMENDED
 */
export enum OnboardingAssessmentRecommendationEnum {
  HIGHLY_RECOMMENDED = 'HIGHLY_RECOMMENDED',
  RECOMMENDED = 'RECOMMENDED',
  NOT_RECOMMENDED = 'NOT_RECOMMENDED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     OnboardingAssessmentStatusEnum:
 *       type: string
 *       description: Status of an onboarding assessment
 *       enum:
 *         - NOT_STARTED
 *         - AI_INITIALIZATION_IN_PROGRESS
 *         - AI_INITIALIZATION_COMPLETED
 *         - CANDIDATE_ASSESSMENT_IN_PROGRESS
 *         - CANDIDATE_ASSESSMENT_COMPLETED
 *         - AI_REVIEW_IN_PROGRESS
 *         - AI_REVIEW_COMPLETED
 *         - MANUAL_REVIEW_IN_PROGRESS
 *         - MANUAL_REVIEW_COMPLETED
 *         - ASSESSMENT_COMPLETED
 *         - ASSESSMENT_FAILED
 *         - ASSESSMENT_TERMINATED
 */
export enum OnboardingAssessmentStatusEnum {
  NOT_STARTED = 'NOT_STARTED',
  AI_INITIALIZATION_IN_PROGRESS = 'AI_INITIALIZATION_IN_PROGRESS',
  AI_INITIALIZATION_COMPLETED = 'AI_INITIALIZATION_COMPLETED',
  CANDIDATE_ASSESSMENT_IN_PROGRESS = 'CANDIDATE_ASSESSMENT_IN_PROGRESS',
  CANDIDATE_ASSESSMENT_COMPLETED = 'CANDIDATE_ASSESSMENT_COMPLETED',
  AI_REVIEW_IN_PROGRESS = 'AI_REVIEW_IN_PROGRESS',
  AI_REVIEW_COMPLETED = 'AI_REVIEW_COMPLETED',
  MANUAL_REVIEW_IN_PROGRESS = 'MANUAL_REVIEW_IN_PROGRESS',
  MANUAL_REVIEW_COMPLETED = 'MANUAL_REVIEW_COMPLETED',
  ASSESSMENT_COMPLETED = 'ASSESSMENT_COMPLETED',
  ASSESSMENT_FAILED = 'ASSESSMENT_FAILED',
  ASSESSMENT_TERMINATED = 'ASSESSMENT_TERMINATED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     OnboardingAssessmentSectionStatusEnum:
 *       type: string
 *       description: Status of an onboarding assessment section
 *       enum:
 *         - NOT_STARTED
 *         - IN_PROGRESS
 *         - COMPLETED
 *         - FAILED
 */
export enum OnboardingAssessmentSectionStatusEnum {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     OnboardingAssessmentSectionResultEnum:
 *       type: string
 *       description: Result of an onboarding assessment section
 *       enum:
 *         - NOT_AVAILABLE
 *         - PASSED
 *         - FAILED_AI_REVIEW
 *         - FAILED_MANUAL_REVIEW
 */
export enum OnboardingAssessmentSectionResultEnum {
  NOT_AVAILABLE = 'NOT_AVAILABLE',
  PASSED = 'PASSED',
  FAILED_AI_REVIEW = 'FAILED_AI_REVIEW',
  FAILED_MANUAL_REVIEW = 'FAILED_MANUAL_REVIEW',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     OnboardingAssessmentTaskStatusEnum:
 *       type: string
 *       description: Status of an onboarding assessment initialize task
 *       enum:
 *         - PENDING
 *         - INITIALIZE_STARTED
 *         - INITIALIZE_COMPLETED
 *         - ASSESSMENT_STARTED
 *         - ASSESSMENT_COMPLETED
 *         - COMPLETED
 *         - FAILED
 */
export enum OnboardingAssessmentTaskStatusEnum {
  PENDING = 'PENDING',
  INITIALIZE_STARTED = 'INITIALIZE_STARTED',
  INITIALIZE_COMPLETED = 'INITIALIZE_COMPLETED',
  ASSESSMENT_STARTED = 'ASSESSMENT_STARTED',
  ASSESSMENT_COMPLETED = 'ASSESSMENT_COMPLETED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     AssessmentTerminationReasonEnum:
 *       type: string
 *       description: Reason for assessment termination
 *       enum:
 *         - MAX_WARNINGS_EXCEEDED
 *         - FOUL_LANGUAGE_DETECTED
 *         - CANDIDATE_REQUESTED
 *         - INCIDENT_DETECTED
 *         - SYSTEM_ERROR
 */
export enum AssessmentTerminationReasonEnum {
  MAX_WARNINGS_EXCEEDED = 'MAX_WARNINGS_EXCEEDED',
  FOUL_LANGUAGE_DETECTED = 'FOUL_LANGUAGE_DETECTED',
  CANDIDATE_REQUESTED = 'CANDIDATE_REQUESTED',
  INCIDENT_DETECTED = 'INCIDENT_DETECTED',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     CandidateSubscriptionStatusEnum:
 *       type: string
 *       description: Status of a candidate subscription
 *       enum:
 *         - ACTIVE
 *         - EXPIRED
 *         - CANCELLED
 *         - PENDING
 *         - TRIALING
 */
export enum CandidateSubscriptionStatusEnum {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  PENDING = 'PENDING',
  TRIALING = 'TRIALING',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ClientSubscriptionStatusEnum:
 *       type: string
 *       description: Status of a subscription
 *       enum:
 *         - ACTIVE
 *         - EXPIRED
 *         - CANCELLED
 *         - PENDING
 *         - TRIALING
 */
export enum ClientSubscriptionStatusEnum {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  PENDING = 'PENDING',
  TRIALING = 'TRIALING',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     PaymentProviderEnum:
 *       type: string
 *       description: Payment provider for subscriptions
 *       enum:
 *         - STRIPE
 *         - PAYPAL
 *         - MANUAL
 *         - OTHER
 *         - DUMMY
 */
export enum PaymentProviderEnum {
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  MANUAL = 'MANUAL',
  OTHER = 'OTHER',
  DUMMY = 'DUMMY',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     CommunicationChannelEnum:
 *       type: string
 *       description: Communication channel for notifications
 *       enum:
 *         - EMAIL
 *         - PHONE
 *         - SMS
 *         - IN_APP
 */
export enum CommunicationChannelEnum {
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  SMS = 'SMS',
  IN_APP = 'IN_APP',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     DifficultyLevelEnum:
 *       type: string
 *       description: Difficulty level for assessments
 *       enum:
 *         - EASY
 *         - MEDIUM
 *         - HARD
 *         - EXPERT
 */
export enum DifficultyLevelEnum {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  EXPERT = 'EXPERT',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     DateFormatEnum:
 *       type: string
 *       description: Date format for display
 *       enum:
 *         - MM_DD_YYYY
 *         - DD_MM_YYYY
 *         - YYYY_MM_DD
 */
export enum DateFormatEnum {
  MM_DD_YYYY = 'MM_DD_YYYY',
  DD_MM_YYYY = 'DD_MM_YYYY',
  YYYY_MM_DD = 'YYYY_MM_DD',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     TimeFormatEnum:
 *       type: string
 *       description: Time format for display
 *       enum:
 *         - TWELVE_HOUR
 *         - TWENTY_FOUR_HOUR
 */
export enum TimeFormatEnum {
  TWELVE_HOUR = 'TWELVE_HOUR',
  TWENTY_FOUR_HOUR = 'TWENTY_FOUR_HOUR',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     WorkTypeEnum:
 *       type: string
 *       description: Type of work arrangement
 *       enum:
 *         - EMPLOYEE
 *         - CONTRACTOR
 *         - FREELANCER
 *         - VOLUNTEER
 *         - INTERN
 *         - APPRENTICESHIP
 *         - OTHER
 */
export enum WorkTypeEnum {
  EMPLOYEE = 'EMPLOYEE',
  CONTRACTOR = 'CONTRACTOR',
  FREELANCER = 'FREELANCER',
  VOLUNTEER = 'VOLUNTEER',
  INTERN = 'INTERN',
  APPRENTICESHIP = 'APPRENTICESHIP',
  OTHER = 'OTHER',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     WorkCommitmentEnum:
 *       type: string
 *       description: Type of work commitment
 *       enum:
 *         - FULL_TIME
 *         - PART_TIME
 *         - HOURLY
 *         - PROJECT_BASED
 */
export enum WorkCommitmentEnum {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  HOURLY = 'HOURLY',
  PROJECT_BASED = 'PROJECT_BASED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     WorkScheduleEnum:
 *       type: string
 *       description: Type of work schedule
 *       enum:
 *         - REGULAR
 *         - FLEXIBLE
 *         - SHIFT_BASED
 */
export enum WorkScheduleEnum {
  REGULAR = 'REGULAR',
  FLEXIBLE = 'FLEXIBLE',
  SHIFT_BASED = 'SHIFT_BASED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SexEnum:
 *       type: string
 *       description: Sex of a person
 *       enum:
 *         - MALE
 *         - FEMALE
 *         - OTHER
 *         - PREFER_NOT_TO_SAY
 */
export enum SexEnum {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     MaritalStatusEnum:
 *       type: string
 *       description: Marital status of a person
 *       enum:
 *         - SINGLE
 *         - MARRIED
 *         - DIVORCED
 *         - WIDOWED
 *         - PREFER_NOT_TO_SAY
 */
export enum MaritalStatusEnum {
  SINGLE = 'SINGLE',
  MARRIED = 'MARRIED',
  DIVORCED = 'DIVORCED',
  WIDOWED = 'WIDOWED',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     QuestionTypeEnum:
 *       type: string
 *       description: Type of question in assessments
 *       enum:
 *         - MULTIPLE_CHOICE
 *         - TEXT
 *         - CODE
 *         - BOOLEAN
 */
export enum QuestionTypeEnum {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TEXT = 'TEXT',
  CODE = 'CODE',
  BOOLEAN = 'BOOLEAN',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     UserRoleEnum:
 *       type: string
 *       description: Role of a user in the system
 *       enum:
 *         - ADMIN
 *         - HR
 *         - RECRUITER
 *         - ACCOUNTS
 *         - PARTNER_RESOURCE
 *         - INDIVIDUAL
 *         - ACCOUNT_MANAGER
 *         - TECHNICAL_SUPPORT
 */
export enum UserRoleEnum {
  ADMIN = 'ADMIN',
  HR = 'HR',
  RECRUITER = 'RECRUITER',
  ACCOUNTS = 'ACCOUNTS',
  PARTNER_RESOURCE = 'PARTNER_RESOURCE',
  INDIVIDUAL = 'INDIVIDUAL',
  ACCOUNT_MANAGER = 'ACCOUNT_MANAGER',
  TECHNICAL_SUPPORT = 'TECHNICAL_SUPPORT',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportUserRoleEnum:
 *       type: string
 *       description: Level of a support user in the system
 *       enum:
 *         - HR
 *         - RECRUITER
 *         - ACCOUNT
 *         - ACCOUNT_MANAGER
 *         - TECHNICAL_SUPPORT
 */
export enum SupportUserRoleEnum {
  HR = 'HR',
  RECRUITER = 'RECRUITER',
  ACCOUNTS = 'ACCOUNTS',
  ACCOUNT_MANAGER = 'ACCOUNT_MANAGER',
  TECHNICAL_SUPPORT = 'TECHNICAL_SUPPORT',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     JobPostingRecruiterAssignmentStatusEnum:
 *       type: string
 *       description: Status of a job posting recruiter assignment
 *       enum:
 *         - ACTIVE
 *         - REASSIGNED
 *         - COMPLETED
 *         - CANCELLED
 */
export enum JobPostingRecruiterAssignmentStatusEnum {
  ACTIVE = 'ACTIVE',
  REASSIGNED = 'REASSIGNED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     UserTypeEnum:
 *       type: string
 *       description: Type of user in the system
 *       enum:
 *         - SUPPORT
 *         - CANDIDATE
 *         - CLIENT
 *         - PARTNER
 */
export enum UserTypeEnum {
  SUPPORT = 'SUPPORT',
  CANDIDATE = 'CANDIDATE',
  CLIENT = 'CLIENT',
  PARTNER = 'PARTNER',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     EducationLevelEnum:
 *       type: string
 *       description: Level of education
 *       enum:
 *         - HIGH_SCHOOL
 *         - BACHELORS
 *         - MASTERS
 *         - DOCTORATE
 */
export enum EducationLevelEnum {
  HIGH_SCHOOL = 'HIGH_SCHOOL',
  BACHELORS = 'BACHELORS',
  MASTERS = 'MASTERS',
  DOCTORATE = 'DOCTORATE',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     JobSearchStatusEnum:
 *       type: string
 *       description: Status of a candidate's job search
 *       enum:
 *         - OPEN_TO_OPPORTUNITIES
 *         - NOT_LOOKING
 */
export enum JobSearchStatusEnum {
  OPEN_TO_OPPORTUNITIES = 'OPEN_TO_OPPORTUNITIES',
  NOT_LOOKING = 'NOT_LOOKING',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     CompanyIndustryEnum:
 *       type: string
 *       description: Industry of a company
 *       enum:
 *         - TECHNOLOGY
 *         - HEALTHCARE
 *         - FINANCE
 *         - EDUCATION
 *         - RETAIL
 *         - OTHER
 */
export enum CompanyIndustryEnum {
  TECHNOLOGY = 'TECHNOLOGY',
  HEALTHCARE = 'HEALTHCARE',
  FINANCE = 'FINANCE',
  EDUCATION = 'EDUCATION',
  RETAIL = 'RETAIL',
  OTHER = 'OTHER',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     CompanySizeEnum:
 *       type: string
 *       description: Size of a company
 *       enum:
 *         - ONE_TO_TEN
 *         - ELEVEN_TO_FIFTY
 *         - FIFTY_ONE_TO_TWO_HUNDRED
 *         - TWO_HUNDRED_ONE_TO_FIVE_HUNDRED
 *         - FIVE_HUNDRED_ONE_TO_THOUSAND
 *         - OVER_THOUSAND
 */
export enum CompanySizeEnum {
  ONE_TO_TEN = 'ONE_TO_TEN',
  ELEVEN_TO_FIFTY = 'ELEVEN_TO_FIFTY',
  FIFTY_ONE_TO_TWO_HUNDRED = 'FIFTY_ONE_TO_TWO_HUNDRED',
  TWO_HUNDRED_ONE_TO_FIVE_HUNDRED = 'TWO_HUNDRED_ONE_TO_FIVE_HUNDRED',
  FIVE_HUNDRED_ONE_TO_THOUSAND = 'FIVE_HUNDRED_ONE_TO_THOUSAND',
  OVER_THOUSAND = 'OVER_THOUSAND',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     CompanyTypeEnum:
 *       type: string
 *       description: Type of company
 *       enum:
 *         - STARTUP
 *         - SCALE_UP
 *         - ENTERPRISE
 *         - AGENCY
 *         - CONSULTING
 */
export enum CompanyTypeEnum {
  STARTUP = 'STARTUP',
  SCALE_UP = 'SCALE_UP',
  ENTERPRISE = 'ENTERPRISE',
  AGENCY = 'AGENCY',
  CONSULTING = 'CONSULTING',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     UserStatusEnum:
 *       type: string
 *       description: Status of a user in the system
 *       enum:
 *         - ACTIVE
 *         - INACTIVE
 *         - BLOCKED
 */
export enum UserStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportLevelEnum:
 *       type: string
 *       description: Support level of a support user
 *       enum:
 *         - L1
 *         - L2
 *         - L3
 *         - L4
 */
export enum SupportLevelEnum {
  L1 = 'L1',
  L2 = 'L2',
  L3 = 'L3',
  L4 = 'L4',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportDepartmentEnum:
 *       type: string
 *       description: Department of a support user
 *       enum:
 *         - TECHNICAL_SUPPORT
 *         - CUSTOMER_SUCCESS
 *         - SALES_SUPPORT
 *         - BILLING_FINANCE
 *         - OPERATIONS
 */
export enum SupportDepartmentEnum {
  TECHNICAL_SUPPORT = 'TECHNICAL_SUPPORT',
  CUSTOMER_SUCCESS = 'CUSTOMER_SUCCESS',
  SALES_SUPPORT = 'SALES_SUPPORT',
  BILLING_FINANCE = 'BILLING_FINANCE',
  OPERATIONS = 'OPERATIONS',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     NoticePeriodEnum:
 *       type: string
 *       description: Notice period for job changes
 *       enum:
 *         - IMMEDIATE
 *         - ONE_WEEK
 *         - TWO_WEEKS
 *         - ONE_MONTH
 *         - TWO_MONTHS
 *         - THREE_MONTHS
 */
export enum NoticePeriodEnum {
  IMMEDIATE = 'IMMEDIATE',
  ONE_WEEK = 'ONE_WEEK',
  TWO_WEEKS = 'TWO_WEEKS',
  ONE_MONTH = 'ONE_MONTH',
  TWO_MONTHS = 'TWO_MONTHS',
  THREE_MONTHS = 'THREE_MONTHS',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     USWorkAuthorizationStatusEnum:
 *       type: string
 *       description: USA work authorization status
 *       enum:
 *         - US_CITIZEN
 *         - GREEN_CARD_HOLDER
 *         - WORK_VISA
 *         - EAD
 *         - STUDENT_VISA
 *         - OTHER
 *         - PREFER_NOT_TO_SAY
 */
export enum USWorkAuthorizationStatusEnum {
  US_CITIZEN = 'US_CITIZEN',
  GREEN_CARD_HOLDER = 'GREEN_CARD_HOLDER',
  WORK_VISA = 'WORK_VISA',
  EAD = 'EAD',
  STUDENT_VISA = 'STUDENT_VISA',
  OTHER = 'OTHER',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     CertificationLevelEnum:
 *       type: string
 *       description: Level of certification
 *       enum:
 *         - BASIC
 *         - INTERMEDIATE
 *         - ADVANCED
 *         - EXPERT
 */
export enum CertificationLevelEnum {
  BASIC = 'BASIC',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     CompanyStageEnum:
 *       type: string
 *       description: Stage of a company
 *       enum:
 *         - SEED
 *         - EARLY_STAGE
 *         - GROWTH
 *         - MATURE
 *         - ENTERPRISE
 */
export enum CompanyStageEnum {
  SEED = 'SEED',
  EARLY_STAGE = 'EARLY_STAGE',
  GROWTH = 'GROWTH',
  MATURE = 'MATURE',
  ENTERPRISE = 'ENTERPRISE',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ResumeAssessmentTaskStatusEnum:
 *       type: string
 *       description: Status of a resume assessment task
 *       enum:
 *         - PENDING
 *         - PROCESSING
 *         - UPDATING_CANDIDATE_RESUME_ASSESSMENT
 *         - COMPLETED
 *         - FAILED
 */
export enum ResumeAssessmentTaskStatusEnum {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  UPDATING_CANDIDATE_RESUME_ASSESSMENT = 'UPDATING_CANDIDATE_RESUME_ASSESSMENT',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     JobPostingAssessmentResultEnum:
 *       type: string
 *       description: Result of a job posting assessment
 *       enum:
 *         - NOT_AVAILABLE
 *         - PASSED
 *         - AI_REVIEW_FAILED
 *         - MANUAL_REVIEW_FAILED
 */
export enum JobPostingAssessmentResultEnum {
  NOT_AVAILABLE = 'NOT_AVAILABLE',
  PASSED = 'PASSED',
  AI_REVIEW_FAILED = 'AI_REVIEW_FAILED',
  MANUAL_REVIEW_FAILED = 'MANUAL_REVIEW_FAILED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     JobPostingAssessmentRecommendationEnum:
 *       type: string
 *       description: Recommendation based on job posting assessment
 *       enum:
 *         - HIGHLY_RECOMMENDED
 *         - RECOMMENDED
 *         - NOT_RECOMMENDED
 *         - NEEDS_IMPROVEMENT
 */
export enum JobPostingAssessmentRecommendationEnum {
  HIGHLY_RECOMMENDED = 'HIGHLY_RECOMMENDED',
  RECOMMENDED = 'RECOMMENDED',
  NOT_RECOMMENDED = 'NOT_RECOMMENDED',
  NEEDS_IMPROVEMENT = 'NEEDS_IMPROVEMENT',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     JobPostingAssessmentStatusEnum:
 *       type: string
 *       description: Status of a job posting assessment
 *       enum:
 *         - NOT_STARTED
 *         - AI_REVIEW_IN_PROGRESS
 *         - AI_REVIEW_COMPLETED
 *         - MANUAL_REVIEW_IN_PROGRESS
 *         - MANUAL_REVIEW_COMPLETED
 *         - ASSESSMENT_COMPLETED
 *         - ASSESSMENT_FAILED
 */
export enum JobPostingAssessmentStatusEnum {
  NOT_STARTED = 'NOT_STARTED',
  AI_REVIEW_IN_PROGRESS = 'AI_REVIEW_IN_PROGRESS',
  AI_REVIEW_COMPLETED = 'AI_REVIEW_COMPLETED',
  MANUAL_REVIEW_IN_PROGRESS = 'MANUAL_REVIEW_IN_PROGRESS',
  MANUAL_REVIEW_COMPLETED = 'MANUAL_REVIEW_COMPLETED',
  ASSESSMENT_COMPLETED = 'ASSESSMENT_COMPLETED',
  ASSESSMENT_FAILED = 'ASSESSMENT_FAILED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     JobPostingAssessmentTaskStatusEnum:
 *       type: string
 *       description: Status of a job posting assessment task
 *       enum:
 *         - PENDING
 *         - PROCESSING
 *         - UPDATING_JOB_POSTING_ASSESSMENT
 *         - COMPLETED
 *         - FAILED
 */
export enum JobPostingAssessmentTaskStatusEnum {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  UPDATING_JOB_POSTING_ASSESSMENT = 'UPDATING_JOB_POSTING_ASSESSMENT',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ProctorTypeEnum:
 *       type: string
 *       description: Type of proctoring event
 *       enum:
 *         - TAB_SWITCHED
 *         - COPY_PASTE
 *         - MULTIPLE_PERSONS_DETECTED
 *         - NO_FACE_DETECTED
 *         - AUDIO_IRREGULARITY
 *         - SCREEN_SHARE_VIOLATION
 *         - WARNING
 *         - OTHER
 */
export enum ProctorTypeEnum {
  TAB_SWITCHED = 'TAB_SWITCHED',
  COPY_PASTE = 'COPY_PASTE',
  MULTIPLE_PERSONS_DETECTED = 'MULTIPLE_PERSONS_DETECTED',
  NO_FACE_DETECTED = 'NO_FACE_DETECTED',
  AUDIO_IRREGULARITY = 'AUDIO_IRREGULARITY',
  SCREEN_SHARE_VIOLATION = 'SCREEN_SHARE_VIOLATION',
  WARNING = 'WARNING',
  OTHER = 'OTHER',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ActivityModuleEnum:
 *       type: string
 *       description: Module where the activity occurred
 *       enum:
 *         - AUTH
 *         - CANDIDATE
 *         - CLIENT
 *         - PARTNER
 *         - JOB
 *         - APPLICATION
 *         - ASSESSMENT
 *         - SYSTEM
 *         - SUBSCRIPTION
 *         - NOTIFICATION
 */
export enum ActivityModuleEnum {
  AUTH = 'auth',
  CANDIDATE = 'candidate',
  CLIENT = 'client',
  PARTNER = 'partner',
  JOB = 'job',
  APPLICATION = 'application',
  ASSESSMENT = 'assessment',
  SYSTEM = 'system',
  SUBSCRIPTION = 'subscription',
  NOTIFICATION = 'notification',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ActivityEntityTypeEnum:
 *       type: string
 *       description: Type of entity affected by the activity
 *       enum:
 *         - USER
 *         - CANDIDATE
 *         - CLIENT
 *         - PARTNER
 *         - SUPPORT
 *         - COMPANY
 *         - JOB_POSTING
 *         - JOB_APPLICATION
 *         - AI_ASSESSMENT
 *         - ONBOARDING_ASSESSMENT
 *         - PRACTICE_ASSESSMENT
 *         - RESUME
 *         - SUBSCRIPTION
 *         - PAYMENT
 *         - DOCUMENT
 *         - INVITATION
 */
export enum ActivityEntityTypeEnum {
  USER = 'user',
  CANDIDATE = 'candidate',
  CLIENT = 'client',
  PARTNER = 'partner',
  SUPPORT = 'support',
  COMPANY = 'company',
  JOB_POSTING = 'job_posting',
  JOB_APPLICATION = 'job_application',
  AI_ASSESSMENT = 'ai_assessment',
  ONBOARDING_ASSESSMENT = 'onboarding_assessment',
  PRACTICE_ASSESSMENT = 'practice_assessment',
  RESUME = 'resume',
  SUBSCRIPTION = 'subscription',
  PAYMENT = 'payment',
  DOCUMENT = 'document',
  INVITATION = 'invitation',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     LookupStatus:
 *       type: string
 *       description: Status of an enum
 *       enum:
 *         - ACTIVE
 *         - INACTIVE
 */
export enum LookupStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ILookupValue:
 *       type: object
 *       description: Lookup value information
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the lookup value
 *         label:
 *           type: string
 *           description: The lookup value label
 *           example: "Open"
 *         lookupCategoryId:
 *           type: string
 *           format: uuid
 *           description: ID of the lookup category this value belongs to
 *         status:
 *           $ref: '#/components/schemas/LookupStatus'
 */
export interface ILookupValue {
  id: string;
  label: string;
  lookupCategoryId: string;
  status: LookupStatus;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ILookupCategory:
 *       type: object
 *       description: Lookup category information
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the lookup category
 *         name:
 *           type: string
 *           description: Name of the lookup category
 *           example: "Job Status"
 *         label:
 *           type: string
 *           description: Display name for the lookup category
 *           example: "Job Status"
 *         status:
 *           $ref: '#/components/schemas/LookupStatus'
 *         lookupValues:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ILookupValue'
 *           description: Array of lookup values belonging to this category
 */
export interface ILookupCategory {
  id: string;
  name: string;
  label: string;
  status: LookupStatus;
  lookupValues: ILookupValue[];
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICompanyVerificationStatus:
 *       type: string
 *       description: Status of a company verification
 *       enum:
 *         - IN_PROGRESS
 *         - UNVERIFIED
 *         - VERIFIED
 *         - REJECTED
 */
export enum ICompanyVerificationStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  UNVERIFIED = 'UNVERIFIED',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     JobAiAssessmentResultEnum:
 *       type: string
 *       description: Result of an JobAi assessment
 *       enum:
 *         - NOT_AVAILABLE
 *         - PASSED
 *         - FAILED
 */
export enum JobAiAssessmentResultEnum {
  NOT_AVAILABLE = 'NOT_AVAILABLE',
  PASSED = 'PASSED',
  AI_REVIEW_FAILED = 'AI_REVIEW_FAILED',
  MANUAL_REVIEW_FAILED = 'MANUAL_REVIEW_FAILED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     JobAiAssessmentVideoAnalysisStatusEnum:
 *       type: string
 *       description: Status of an JobAi assessment video analysis
 *       enum:
 *         - NOT_STARTED
 *         - IN_PROGRESS
 *         - COMPLETED
 *         - FAILED
 */
export enum JobAiAssessmentVideoAnalysisStatusEnum {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     JobAiAssessmentRecommendationEnum:
 *       type: string
 *       description: Recommendation based on JobAi assessment
 *       enum:
 *         - HIGHLY_RECOMMENDED
 *         - RECOMMENDED
 *         - NOT_RECOMMENDED
 */
export enum JobAiAssessmentRecommendationEnum {
  HIGHLY_RECOMMENDED = 'HIGHLY_RECOMMENDED',
  RECOMMENDED = 'RECOMMENDED',
  NOT_RECOMMENDED = 'NOT_RECOMMENDED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     JobAiAssessmentStatusEnum:
 *       type: string
 *       description: Status of an JobAi assessment
 *       enum:
 *         - NOT_STARTED
 *         - AI_INITIALIZATION_IN_PROGRESS
 *         - AI_INITIALIZATION_COMPLETED
 *         - CANDIDATE_ASSESSMENT_IN_PROGRESS
 *         - CANDIDATE_ASSESSMENT_COMPLETED
 *         - AI_REVIEW_IN_PROGRESS
 *         - AI_REVIEW_COMPLETED
 *         - MANUAL_REVIEW_IN_PROGRESS
 *         - MANUAL_REVIEW_COMPLETED
 *         - ASSESSMENT_COMPLETED
 *         - ASSESSMENT_FAILED
 */
export enum JobAiAssessmentStatusEnum {
  NOT_STARTED = 'NOT_STARTED',
  AI_INITIALIZATION_IN_PROGRESS = 'AI_INITIALIZATION_IN_PROGRESS',
  AI_INITIALIZATION_COMPLETED = 'AI_INITIALIZATION_COMPLETED',
  CANDIDATE_ASSESSMENT_IN_PROGRESS = 'CANDIDATE_ASSESSMENT_IN_PROGRESS',
  CANDIDATE_ASSESSMENT_COMPLETED = 'CANDIDATE_ASSESSMENT_COMPLETED',
  AI_REVIEW_IN_PROGRESS = 'AI_REVIEW_IN_PROGRESS',
  AI_REVIEW_COMPLETED = 'AI_REVIEW_COMPLETED',
  MANUAL_REVIEW_IN_PROGRESS = 'MANUAL_REVIEW_IN_PROGRESS',
  MANUAL_REVIEW_COMPLETED = 'MANUAL_REVIEW_COMPLETED',
  ASSESSMENT_COMPLETED = 'ASSESSMENT_COMPLETED',
  ASSESSMENT_FAILED = 'ASSESSMENT_FAILED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     JobAiAssessmentSectionStatusEnum:
 *       type: string
 *       description: Status of an JobAi assessment section
 *       enum:
 *         - NOT_STARTED
 *         - IN_PROGRESS
 *         - COMPLETED
 *         - FAILED
 */
export enum JobAiAssessmentSectionStatusEnum {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     JobAiAssessmentSectionResultEnum:
 *       type: string
 *       description: Result of an JobAi assessment section
 *       enum:
 *         - NOT_AVAILABLE
 *         - PASSED
 *         - FAILED_AI_REVIEW
 *         - FAILED_MANUAL_REVIEW
 */
export enum JobAiAssessmentSectionResultEnum {
  NOT_AVAILABLE = 'NOT_AVAILABLE',
  PASSED = 'PASSED',
  FAILED_AI_REVIEW = 'FAILED_AI_REVIEW',
  FAILED_MANUAL_REVIEW = 'FAILED_MANUAL_REVIEW',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     JobAiAssessmentTaskStatusEnum:
 *       type: string
 *       description: Status of an JobAi assessment initialize task
 *       enum:
 *         - PENDING
 *         - INITIALIZE_STARTED
 *         - INITIALIZE_COMPLETED
 *         - ASSESSMENT_STARTED
 *         - ASSESSMENT_COMPLETED
 *         - COMPLETED
 *         - FAILED
 */
export enum JobAiAssessmentTaskStatusEnum {
  PENDING = 'PENDING',
  INITIALIZE_STARTED = 'INITIALIZE_STARTED',
  INITIALIZE_COMPLETED = 'INITIALIZE_COMPLETED',
  ASSESSMENT_STARTED = 'ASSESSMENT_STARTED',
  ASSESSMENT_COMPLETED = 'ASSESSMENT_COMPLETED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     JobAssessmentInviteStatusEnum:
 *       type: string
 *       description: Status of an job assessment invite
 *       enum:
 *         - PENDING
 *         - ACCEPTED
 *         - DECLINED
 *         - EXPIRED
 *         - CANCELLED
 */
export enum JobAssessmentInviteStatusEnum {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     VerificationStatus:
 *       type: string
 *       description: Status of a document verification
 *       enum:
 *         - UNVERIFIED
 *         - REVISED
 *         - VERIFIED
 *         - REJECTED
 */

export enum VerificationStatus {
  UNVERIFIED = 'UNVERIFIED',
  REVISED = 'REVISED',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     JobPanelAssessmentStatusEnum:
 *       type: string
 *       description: Status of a panel assessment
 *       enum:
 *         - NOT_STARTED
 *         - INVITATION_SENT
 *         - SLOT_SELECTED
 *         - MEETING_SCHEDULED
 *         - IN_PROGRESS
 *         - COMPLETED
 *         - FAILED
 *         - CANCELLED
 */
export enum JobPanelAssessmentStatusEnum {
  NOT_STARTED = 'NOT_STARTED',
  INVITATION_SENT = 'INVITATION_SENT',
  SLOT_SELECTED = 'SLOT_SELECTED',
  MEETING_SCHEDULED = 'MEETING_SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     JobPanelAssessmentResultEnum:
 *       type: string
 *       description: Result of a panel assessment
 *       enum:
 *         - NOT_AVAILABLE
 *         - PASSED
 *         - FAILED
 *         - REQUIRES_REVIEW
 */
export enum JobPanelAssessmentResultEnum {
  NOT_AVAILABLE = 'NOT_AVAILABLE',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  REQUIRES_REVIEW = 'REQUIRES_REVIEW',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     JobPanelAssessmentRecommendationEnum:
 *       type: string
 *       description: Recommendation from a panel assessment
 *       enum:
 *         - HIGHLY_RECOMMENDED
 *         - RECOMMENDED
 *         - NOT_RECOMMENDED
 *         - REQUIRES_FURTHER_REVIEW
 */
export enum JobPanelAssessmentRecommendationEnum {
  HIGHLY_RECOMMENDED = 'HIGHLY_RECOMMENDED',
  RECOMMENDED = 'RECOMMENDED',
  NOT_RECOMMENDED = 'NOT_RECOMMENDED',
  REQUIRES_FURTHER_REVIEW = 'REQUIRES_FURTHER_REVIEW',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     JobPanelAssessmentInvitationStatusEnum:
 *       type: string
 *       description: Status of a panel assessment invitation
 *       enum:
 *         - PENDING
 *         - ACCEPTED
 *         - DECLINED
 *         - EXPIRED
 *         - CANCELLED
 */
export enum JobPanelAssessmentInvitationStatusEnum {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     JobPanelAssessmentSlotStatusEnum:
 *       type: string
 *       description: Status of a panel assessment slot
 *       enum:
 *         - AVAILABLE
 *         - SELECTED
 *         - OCCUPIED
 *         - CANCELLED
 */
export enum JobPanelAssessmentSlotStatusEnum {
  AVAILABLE = 'AVAILABLE',
  SELECTED = 'SELECTED',
  OCCUPIED = 'OCCUPIED',
  CANCELLED = 'CANCELLED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     JobPanelAssessmentFeedbackDecisionEnum:
 *       type: string
 *       description: Panel member decision for candidate
 *       enum:
 *         - HIRE
 *         - NO_HIRE
 *         - MAYBE
 *         - NEEDS_ANOTHER_ROUND
 */
export enum JobPanelAssessmentFeedbackDecisionEnum {
  HIRE = 'HIRE',
  NO_HIRE = 'NO_HIRE',
  NEEDS_ANOTHER_ROUND = 'NEEDS_ANOTHER_ROUND',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     InterviewTypeEnum:
 *       type: string
 *       description: Type of interview
 */
export enum InterviewTypeEnum {
  AI_INTERVIEW = 'AI_INTERVIEW',
  PANEL_ASSESSMENT = 'PANEL_ASSESSMENT',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     OAuthProviderEnum:
 *       type: string
 *       enum: [GOOGLE, GITHUB]
 *       description: Supported OAuth providers
 */
export enum OAuthProviderEnum {
  GOOGLE = 'GOOGLE',
  GITHUB = 'GITHUB',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     InterviewInvitationStatusEnum:
 *       type: string
 *       description: Status of an interview invitation
 *       enum:
 *         - PENDING
 *         - ACCEPTED
 *         - DECLINED
 *         - EXPIRED
 *         - CANCELLED
 */
export enum InterviewInvitationStatusEnum {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     InterviewInvitationTypeEnum:
 *       type: string
 *       description: Type of interview invitation
 *       enum:
 *         - AI
 *         - PANEL
 */
export enum InterviewInvitationTypeEnum {
  AI = 'AI',
  PANEL = 'PANEL',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     JobAiAssessmentInviteStatusEnum:
 *       type: string
 *       description: Status of a JD assessment invite
 *       enum:
 *         - PENDING
 *         - ACCEPTED
 *         - DECLINED
 *         - CANCELLED
 *         - EXPIRED
 */
export enum JobAiAssessmentInviteStatusEnum {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IntegrationProviderType:
 *       type: string
 *       enum: [JOB_BOARD, ATS]
 *       description: Types of integration providers
 */
export enum IntegrationProviderType {
  JOB_BOARD = 'JOB_BOARD',
  ATS = 'ATS',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IntegrationStatus:
 *       type: string
 *       enum: [ACTIVE, INACTIVE, ERROR, SYNCING]
 *       description: Status of an integration
 */
export enum IntegrationStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ERROR = 'ERROR',
  SYNCING = 'SYNCING',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IntegrationSyncStatus:
 *       type: string
 *       enum: [PENDING, IN_PROGRESS, COMPLETED, FAILED, PARTIAL]
 *       description: Status of integration synchronization
 */
export enum IntegrationSyncStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PARTIAL = 'PARTIAL',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportInvitationTypeEnum:
 *       type: string
 *       description: Type of support invitation
 *       enum:
 *         - CANDIDATE
 *         - CLIENT
 *         - PARTNER
 *         - SUPPORT_USER
 */
export enum SupportInvitationTypeEnum {
  CANDIDATE = 'CANDIDATE',
  CLIENT = 'CLIENT',
  PARTNER = 'PARTNER',
  SUPPORT_USER = 'SUPPORT_USER',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportInvitationStatusEnum:
 *       type: string
 *       description: Status of a support invitation
 *       enum:
 *         - PENDING
 *         - ACCEPTED
 *         - EXPIRED
 *         - WITHDRAWN
 *         - RESEND
 */
export enum SupportInvitationStatusEnum {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  WITHDRAWN = 'WITHDRAWN',
  RESEND = 'RESEND',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportInvitationImportStatusEnum:
 *       type: string
 *       description: Status of a support invitation import
 *       enum:
 *         - PENDING
 *         - PROCESSED
 *         - INVITED
 *         - DUPLICATE
 *         - FAILED
 */
export enum SupportInvitationImportStatusEnum {
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
  INVITED = 'INVITED',
  DUPLICATE = 'DUPLICATE',
  FAILED = 'FAILED',
  ACCEPTED = 'ACCEPTED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     JobPostingIntegrationStatus:
 *       type: string
 *       enum: [DRAFT, PUBLISHED, SYNCED, FAILED, DELETED]
 *       description: Status of job posting integration
 */
export enum JobPostingIntegrationStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  SYNCED = 'SYNCED',
  FAILED = 'FAILED',
  DELETED = 'DELETED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     CandidateSource:
 *       type: string
 *       enum: [SELF_SIGNUP, JOB_BOARD_IMPORT, ATS_IMPORT, MANUAL_IMPORT, REFERRAL]
 *       description: Source of candidate data
 */
export enum CandidateSource {
  SELF_SIGNUP = 'SELF_SIGNUP',
  JOB_BOARD_IMPORT = 'JOB_BOARD_IMPORT',
  ATS_IMPORT = 'ATS_IMPORT',
  MANUAL_IMPORT = 'MANUAL_IMPORT',
  REFERRAL = 'REFERRAL',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SourceType:
 *       type: string
 *       enum: [JOB, CANDIDATE]
 *       description: Type of source
 */
export enum SourceType {
  JOB = 'JOB',
  CANDIDATE = 'CANDIDATE',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     CandidateShortlistStatusEnum:
 *       type: string
 *       description: Status of a candidate shortlist
 *       enum:
 *         - SHORTLISTED
 *         - NOT_INTERESTED
 *         - REJECTED
 */
export enum CandidateShortlistStatusEnum {
  SHORTLISTED = 'SHORTLISTED',
  NOT_INTERESTED = 'NOT_INTERESTED',
  REJECTED = 'REJECTED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     JobInviteStatusEnum:
 *       type: string
 *       description: Status of a job invite
 *       enum:
 *         - PENDING
 *         - ACCEPTED
 *         - DECLINED
 *         - CANCELLED
 *         - EXPIRED
 *         - WITHDRAWN
 */
export enum JobInviteStatusEnum {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  WITHDRAWN = 'WITHDRAWN',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportJobInviteStatusEnum:
 *       type: string
 *       description: Status of a support user job posting invite
 *       enum:
 *         - PENDING
 *         - ACCEPTED
 *         - DECLINED
 *         - CANCELLED
 *         - EXPIRED
 *         - WITHDRAWN
 */
export enum SupportJobInviteStatusEnum {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  WITHDRAWN = 'WITHDRAWN',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     JobRecommendationStatusEnum:
 *       type: string
 *       description: Status of a job recommendation
 *       enum:
 *         - ACTIVE
 *         - REJECTED
 *         - WITHDRAWN
 */
export enum JobRecommendationStatusEnum {
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     JobRecommendationFeedbackTypeEnum:
 *       type: string
 *       description: Type of feedback for job recommendation
 *       enum:
 *         - LIKE
 *         - DISLIKE
 *         - NOT_INTERESTED
 *         - ALREADY_INVITED
 *         - NOT_RELEVANT
 *         - RELEVANT
 *         - IRRELEVANT
 *         - TOO_JUNIOR
 *         - TOO_SENIOR
 *         - LOCATION_MISMATCH
 *         - SALARY_MISMATCH
 *         - SKILL_MISMATCH
 *         - OTHER
 */
export enum JobRecommendationFeedbackTypeEnum {
  LIKE = 'LIKE',
  DISLIKE = 'DISLIKE',
  NOT_INTERESTED = 'NOT_INTERESTED',
  ALREADY_INVITED = 'ALREADY_INVITED',
  NOT_RELEVANT = 'NOT_RELEVANT',
  RELEVANT = 'RELEVANT',
  IRRELEVANT = 'IRRELEVANT',
  TOO_JUNIOR = 'TOO_JUNIOR',
  TOO_SENIOR = 'TOO_SENIOR',
  LOCATION_MISMATCH = 'LOCATION_MISMATCH',
  SALARY_MISMATCH = 'SALARY_MISMATCH',
  SKILL_MISMATCH = 'SKILL_MISMATCH',
  OTHER = 'OTHER',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     CandidateRecommendationStatusEnum:
 *       type: string
 *       description: Status of a candidate recommendation
 *       enum:
 *         - ACTIVE
 *         - REJECTED
 *         - WITHDRAWN
 */
export enum CandidateRecommendationStatusEnum {
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     CandidateRecommendationFeedbackTypeEnum:
 *       type: string
 *       description: Type of feedback for candidate recommendation
 *       enum:
 *         - LIKE
 *         - DISLIKE
 *         - NOT_INTERESTED
 *         - ALREADY_APPLIED
 *         - NOT_RELEVANT
 *         - RELEVANT
 *         - LOCATION_MISMATCH
 *         - SALARY_MISMATCH
 *         - SKILL_MISMATCH
 *         - OTHER
 */
export enum CandidateRecommendationFeedbackTypeEnum {
  LIKE = 'LIKE',
  DISLIKE = 'DISLIKE',
  NOT_INTERESTED = 'NOT_INTERESTED',
  ALREADY_APPLIED = 'ALREADY_APPLIED',
  NOT_RELEVANT = 'NOT_RELEVANT',
  RELEVANT = 'RELEVANT',
  LOCATION_MISMATCH = 'LOCATION_MISMATCH',
  SALARY_MISMATCH = 'SALARY_MISMATCH',
  SKILL_MISMATCH = 'SKILL_MISMATCH',
  OTHER = 'OTHER',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ImpersonationActionEnum:
 *       type: string
 *       description: Actions related to impersonation
 *       enum:
 *         - IMPERSONATE_START
 *         - IMPERSONATE_END
 */
export enum ImpersonationActionEnum {
  IMPERSONATE_START = 'IMPERSONATE_START',
  IMPERSONATE_END = 'IMPERSONATE_END',
}

export enum ImpersonationReasonEnum {
  TECHNICAL_SUPPORT = 'TECHNICAL_SUPPORT',
  ACCOUNT_VERIFICATION = 'ACCOUNT_VERIFICATION',
  BUG_INVESTIGATION = 'BUG_INVESTIGATION',
  USER_TRAINING = 'USER_TRAINING',
  DATA_MIGRATION = 'DATA_MIGRATION',
  FEATURE_DEMONSTRATION = 'FEATURE_DEMONSTRATION',
  SECURITY_AUDIT = 'SECURITY_AUDIT',
  CUSTOMER_SUCCESS = 'CUSTOMER_SUCCESS',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     DocumentType:
 *       type: string
 *       enum: [contract, certificate, legal, invoice, agreement, license, work_permit, passport, driving_license, visa, national_id, social_security_number, tax_id, bank_statement, bank_account, other]
 *       description: The standardized type/category of the document
 *       example: contract
 *       examples:
 *         - contract: This is a contract document
 *         - certificate: This is a certificate document
 *         - legal: This is a legal document
 *         - resume: This is a resume document
 *         - invoice: This is an invoice document
 *         - agreement: This is an agreement document
 *         - license: This is a license document
 *         - work_permit: This is a work permit document
 *         - passport: This is a passport document
 *         - driving_license: This is a driving license document
 *         - visa: This is a visa document
 *         - national_id: This is a national id document
 *         - social_security_number: This is a social security number document
 *         - tax_id: This is a tax id document
 *         - bank_statement: This is a bank statement document
 *         - bank_account: This is a bank account document
 *         - other: This is a other document
 */
export enum DocumentTypeEnum {
  CONTRACT = 'contract',
  CERTIFICATE = 'certificate',
  LEGAL = 'legal',
  INVOICE = 'invoice',
  AGREEMENT = 'agreement',
  LICENSE = 'license',
  WORK_PERMIT = 'work_permit',
  PASSPORT = 'passport',
  DRIVING_LICENSE = 'driving_license',
  VISA = 'visa',
  NATIONAL_ID = 'national_id',
  SOCIAL_SECURITY_NUMBER = 'social_security_number',
  TAX_ID = 'tax_id',
  BANK_STATEMENT = 'bank_statement',
  BANK_ACCOUNT = 'bank_account',
  SUPPORT_TICKET_ATTACHMENT = 'support_ticket_attachment',
  OTHER = 'other',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     UserTourStatusEnum:
 *       type: string
 *       description: Status of a user's tour progress
 *       enum:
 *         - NOT_STARTED
 *         - IN_PROGRESS
 *         - PAUSED
 *         - COMPLETED
 *         - DISMISSED
 */
export enum UserTourStatusEnum {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  DISMISSED = 'DISMISSED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     TourActionEnum:
 *       type: string
 *       description: Actions that can be performed during a tour
 *       enum:
 *         - START
 *         - NEXT_STEP
 *         - PREVIOUS_STEP
 *         - SKIP_STEP
 *         - PAUSE
 *         - SKIP_TOUR
 *         - RESUME
 *         - COMPLETE
 *         - DISMISS
 *         - RESET
 */
export enum TourActionEnum {
  START = 'START',
  NEXT_STEP = 'NEXT_STEP',
  PREVIOUS_STEP = 'PREVIOUS_STEP',
  SKIP_STEP = 'SKIP_STEP',
  PAUSE = 'PAUSE',
  SKIP_TOUR = 'SKIP_TOUR',
  RESUME = 'RESUME',
  COMPLETE = 'COMPLETE',
  DISMISS = 'DISMISS',
  RESET = 'RESET',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     TourStepTypeEnum:
 *       type: string
 *       description: Type of tour step
 *       enum:
 *         - TOOLTIP
 *         - MODAL
 *         - HIGHLIGHT
 *         - OVERLAY
 *         - BEACON
 *         - SIDEBAR_TOOLTIP
 */
export enum TourStepTypeEnum {
  TOOLTIP = 'TOOLTIP',
  MODAL = 'MODAL',
  HIGHLIGHT = 'HIGHLIGHT',
  OVERLAY = 'OVERLAY',
  BEACON = 'BEACON',
  SIDEBAR_TOOLTIP = 'SIDEBAR_TOOLTIP',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     TourTriggerTypeEnum:
 *       type: string
 *       description: Type of trigger that can start a tour
 *       enum:
 *         - ON_LOGIN
 *         - ON_FIRST_VISIT
 *         - ON_FEATURE_ACCESS
 *         - MANUAL
 *         - ON_PAGE_LOAD
 *         - ON_USER_ACTION
 */
export enum TourTriggerTypeEnum {
  ON_LOGIN = 'ON_LOGIN',
  ON_FIRST_VISIT = 'ON_FIRST_VISIT',
  ON_FEATURE_ACCESS = 'ON_FEATURE_ACCESS',
  MANUAL = 'MANUAL',
  ON_PAGE_LOAD = 'ON_PAGE_LOAD',
  ON_USER_ACTION = 'ON_USER_ACTION',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     CandidateImportStatus:
 *       type: string
 *       description: Status of a candidate import
 *       enum:
 *         - PENDING
 *         - PROCESSED
 *         - INVITED
 *         - REGISTERED
 *         - DUPLICATE
 *         - FAILED
 */
export enum CandidateImportStatusEnum {
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
  INVITED = 'INVITED',
  REGISTERED = 'REGISTERED',
  DUPLICATE = 'DUPLICATE',
  FAILED = 'FAILED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     InvitationTokenPurposeEnum:
 *       type: string
 *       description: Purpose of invitation token
 *       enum:
 *         - EMAIL
 *         - COPY
 */
export enum InvitationTokenPurposeEnum {
  EMAIL = 'EMAIL',
  COPY = 'COPY',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketTypeEnum:
 *       type: string
 *       description: Type of support ticket
 *       enum:
 *         - NEW_ENTITY
 *         - EXISTING_ENTITY
 *         - FEATURE_REQUEST
 *         - BUG_REPORT
 *         - TECHNICAL_ISSUE
 *         - BILLING_INQUIRY
 *         - ACCOUNT_ISSUE
 *         - GENERAL_INQUIRY
 */
export enum SupportTicketTypeEnum {
  NEW_ENTITY = 'NEW_ENTITY',
  EXISTING_ENTITY = 'EXISTING_ENTITY',
  FEATURE_REQUEST = 'FEATURE_REQUEST',
  BUG_REPORT = 'BUG_REPORT',
  TECHNICAL_ISSUE = 'TECHNICAL_ISSUE',
  BILLING_INQUIRY = 'BILLING_INQUIRY',
  ACCOUNT_ISSUE = 'ACCOUNT_ISSUE',
  GENERAL_INQUIRY = 'GENERAL_INQUIRY',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketStatusEnum:
 *       type: string
 *       description: Status of support ticket
 *       enum:
 *         - OPEN
 *         - ASSIGNED
 *         - IN_PROGRESS
 *         - PENDING
 *         - RESOLVED
 *         - CLOSED
 *         - CANCELLED
 *         - REOPENED
 */
export enum SupportTicketStatusEnum {
  NEW = 'NEW',
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
  REOPENED = 'REOPENED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketAssignmentStatusEnum:
 *       type: string
 *       description: Assignment status of support ticket
 *       enum:
 *         - UNASSIGNED
 *         - ASSIGNED
 *         - REASSIGNED
 *         - ESCALATED
 *         - AUTO_ASSIGNED
 */
export enum SupportTicketAssignmentStatusEnum {
  UNASSIGNED = 'UNASSIGNED',
  ASSIGNED = 'ASSIGNED',
  REASSIGNED = 'REASSIGNED',
  ESCALATED = 'ESCALATED',
  AUTO_ASSIGNED = 'AUTO_ASSIGNED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketPriorityEnum:
 *       type: string
 *       description: Priority level of support ticket
 *       enum:
 *         - LOW
 *         - MEDIUM
 *         - HIGH
 *         - URGENT
 *         - CRITICAL
 */
export enum SupportTicketPriorityEnum {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
  CRITICAL = 'CRITICAL',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketEntityTypeEnum:
 *       type: string
 *       description: Entity type that can create support tickets
 *       enum:
 *         - CANDIDATE
 *         - CLIENT
 *         - PARTNER
 *         - SUPPORT
 */
export enum SupportTicketEntityTypeEnum {
  CANDIDATE = 'CANDIDATE',
  CLIENT = 'CLIENT',
  PARTNER = 'PARTNER',
  SUPPORT = 'SUPPORT',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketCategoryEnum:
 *       type: string
 *       description: Category of support ticket
 *       enum:
 *         - TECHNICAL
 *         - BILLING
 *         - ACCOUNT
 *         - FEATURE
 *         - BUG
 *         - GENERAL
 *         - INTEGRATION
 *         - SECURITY
 *         - OTHER
 */
export enum SupportTicketCategoryEnum {
  TECHNICAL = 'TECHNICAL',
  BILLING = 'BILLING',
  ACCOUNT = 'ACCOUNT',
  FEATURE = 'FEATURE',
  BUG = 'BUG',
  GENERAL = 'GENERAL',
  INTEGRATION = 'INTEGRATION',
  SECURITY = 'SECURITY',
  OTHER = 'OTHER',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketEscalationReasonEnum:
 *       type: string
 *       description: Reason for ticket escalation
 *       enum:
 *         - SLA_BREACH
 *         - CUSTOMER_REQUEST
 *         - TECHNICAL_COMPLEXITY
 *         - BILLING_DISPUTE
 *         - SECURITY_CONCERN
 *         - MANAGER_REVIEW
 *         - OTHER
 */
export enum SupportTicketEscalationReasonEnum {
  SLA_BREACH = 'SLA_BREACH',
  CUSTOMER_REQUEST = 'CUSTOMER_REQUEST',
  TECHNICAL_COMPLEXITY = 'TECHNICAL_COMPLEXITY',
  BILLING_DISPUTE = 'BILLING_DISPUTE',
  SECURITY_CONCERN = 'SECURITY_CONCERN',
  MANAGER_REVIEW = 'MANAGER_REVIEW',
  OTHER = 'OTHER',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportClientTicketCategoryEnum:
 *       type: string
 *       description: Category of support ticket for client
 *       enum:
 *         - JOB_POSTING
 *         - JOB_APPLICATION
 *         - JOB_INTERVIEW
 *         - JOB_ONBOARDING
 *         - CANDIDATE_RECOMMENDATION
 *         - USER_INVITATION
 *         - USER_MANAGEMENT
 *         - SUBSCRIPTION_BILLING
 *         - AI_ASSESSMENT
 *         - PANEL_ASSESSMENT
 *         - COMPANY_PROFILE
 *         - INTEGRATION
 *         - TECHNICAL_ISSUE
 *         - ACCOUNT_SETTINGS
 *         - NOTIFICATION_SETTINGS
 *         - DATA_EXPORT_IMPORT
 *         - SECURITY_AUTHENTICATION
 *         - API_ACCESS
 *         - REPORTING_ANALYTICS
 *         - FEATURE_REQUEST
 *         - GENERAL_INQUIRY
 *         - OTHER
 */

export enum SupportClientTicketCategoryEnum {
  JOB_POSTING = 'JOB_POSTING',
  JOB_APPLICATION = 'JOB_APPLICATION',
  JOB_INTERVIEW = 'JOB_INTERVIEW',
  JOB_ONBOARDING = 'JOB_ONBOARDING',
  CANDIDATE_RECOMMENDATION = 'CANDIDATE_RECOMMENDATION',
  USER_INVITATION = 'USER_INVITATION',
  USER_MANAGEMENT = 'USER_MANAGEMENT',
  SUBSCRIPTION_BILLING = 'SUBSCRIPTION_BILLING',
  AI_ASSESSMENT = 'AI_ASSESSMENT',
  PANEL_ASSESSMENT = 'PANEL_ASSESSMENT',
  COMPANY_PROFILE = 'COMPANY_PROFILE',
  TECHNICAL_ISSUE = 'TECHNICAL_ISSUE',
  ACCOUNT_SETTINGS = 'ACCOUNT_SETTINGS',
  NOTIFICATION_SETTINGS = 'NOTIFICATION_SETTINGS',
  DATA_EXPORT_IMPORT = 'DATA_EXPORT_IMPORT',
  SECURITY_AUTHENTICATION = 'SECURITY_AUTHENTICATION',
  API_ACCESS = 'API_ACCESS',
  REPORTING_ANALYTICS = 'REPORTING_ANALYTICS',
  FEATURE_REQUEST = 'FEATURE_REQUEST',
  GENERAL_INQUIRY = 'GENERAL_INQUIRY',
  OTHER = 'OTHER',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportClientTicketSubcategoryEnum:
 *       type: string
 *       description: Subcategory of support ticket for client
 *       enum:
 *         # Job Posting Subcategories
 *         - JOB_POSTING_CREATE
 *         - JOB_POSTING_UPDATE
 *         - JOB_POSTING_DELETE
 *         - JOB_POSTING_PUBLISH
 *         - JOB_POSTING_UNPUBLISH
 *         - JOB_POSTING_ARCHIVE
 *         - JOB_POSTING_AI_REVIEW_FAILED
 *         - JOB_POSTING_AI_REVIEW_SUCCESS
 *         - JOB_POSTING_MANUAL_REVIEW
 *         - JOB_POSTING_TEMPLATE_ISSUE
 *         - JOB_POSTING_DUPLICATE
 *         - JOB_POSTING_PERMISSIONS
 *         - JOB_POSTING_INTEGRATION
 *         - JOB_POSTING_JOB_BOARD_PUBLISH
 *         - JOB_POSTING_ATS
 *         # Job Application Subcategories
 *         - JOB_APPLICATION_VIEW
 *         - JOB_APPLICATION_STATUS_UPDATE
 *         - JOB_APPLICATION_SHORTLIST
 *         - JOB_APPLICATION_REJECT
 *         - JOB_APPLICATION_BULK_ACTIONS
 *         - JOB_APPLICATION_EXPORT
 *         - JOB_APPLICATION_NOTES
 *         - JOB_APPLICATION_COMMUNICATION
 *         - JOB_APPLICATION_CANDIDATE_PROFILE
 *         - JOB_APPLICATION_RESUME_ACCESS
 *         # Job Interview Subcategories
 *         - JOB_INTERVIEW_SCHEDULE
 *         - JOB_INTERVIEW_RESCHEDULE
 *         - JOB_INTERVIEW_CANCEL
 *         - JOB_INTERVIEW_AI_ASSESSMENT
 *         - JOB_INTERVIEW_PANEL_ASSESSMENT
 *         - JOB_INTERVIEW_VIDEO_CALL
 *         - JOB_INTERVIEW_IN_PERSON
 *         - JOB_INTERVIEW_FEEDBACK
 *         - JOB_INTERVIEW_RECORDING
 *         - JOB_INTERVIEW_TECHNICAL_ISSUE
 *         # Job Onboarding Subcategories
 *         - JOB_ONBOARDING_SETUP
 *         - JOB_ONBOARDING_DOCUMENTS
 *         - JOB_ONBOARDING_CHECKLIST
 *         - JOB_ONBOARDING_TASKS
 *         - JOB_ONBOARDING_PROGRESS
 *         - JOB_ONBOARDING_COMPLETION
 *         # Candidate Recommendation Subcategories
 *         - CANDIDATE_RECOMMENDATION_ALGORITHM
 *         - CANDIDATE_RECOMMENDATION_FILTERS
 *         - CANDIDATE_RECOMMENDATION_ACCURACY
 *         - CANDIDATE_RECOMMENDATION_FEEDBACK
 *         - CANDIDATE_RECOMMENDATION_CUSTOMIZATION
 *         - CANDIDATE_RECOMMENDATION_MATCHING
 *         # User Invitation Subcategories
 *         - USER_INVITATION_SEND
 *         - USER_INVITATION_RESEND
 *         - USER_INVITATION_WITHDRAW
 *         - USER_INVITATION_EXPIRE
 *         - USER_INVITATION_ACCEPT
 *         - USER_INVITATION_DECLINE
 *         - USER_INVITATION_BULK_SEND
 *         - USER_INVITATION_TEMPLATE
 *         - USER_INVITATION_PERMISSIONS
 *         # User Management Subcategories
 *         - USER_CREATE
 *         - USER_UPDATE
 *         - USER_DEACTIVATE
 *         - USER_ACTIVATE
 *         - USER_DELETE
 *         - USER_ROLE_CHANGE
 *         - USER_PERMISSIONS
 *         - USER_ACCESS_CONTROL
 *         - USER_BULK_ACTIONS
 *         - USER_IMPORT
 *         # Subscription Billing Subcategories
 *         - SUBSCRIPTION_UPGRADE
 *         - SUBSCRIPTION_DOWNGRADE
 *         - SUBSCRIPTION_CANCEL
 *         - SUBSCRIPTION_RENEW
 *         - SUBSCRIPTION_TRIAL
 *         - SUBSCRIPTION_PAYMENT_FAILED
 *         - SUBSCRIPTION_PAYMENT_METHOD
 *         - SUBSCRIPTION_BILLING_CYCLE
 *         - SUBSCRIPTION_CREDITS_PURCHASE
 *         - SUBSCRIPTION_CREDITS_USAGE
 *         - SUBSCRIPTION_LIMITS
 *         - SUBSCRIPTION_INVOICE
 *         - SUBSCRIPTION_REFUND
 *         - SUBSCRIPTION_PRICING
 *         # AI Assessment Subcategories
 *         - AI_ASSESSMENT_CREATE
 *         - AI_ASSESSMENT_CONFIGURE
 *         - AI_ASSESSMENT_INVITE_CANDIDATE
 *         - AI_ASSESSMENT_RESULTS
 *         - AI_ASSESSMENT_VIDEO_ANALYSIS
 *         - AI_ASSESSMENT_PROCTORING
 *         - AI_ASSESSMENT_DIFFICULTY
 *         - AI_ASSESSMENT_SCORING
 *         - AI_ASSESSMENT_FEEDBACK
 *         - AI_ASSESSMENT_TECHNICAL_ISSUE
 *         - AI_ASSESSMENT_REPORTING
 *         # Company Profile Subcategories
 *         - COMPANY_PROFILE_UPDATE
 *         - COMPANY_VERIFICATION
 *         - COMPANY_LOGO
 *         - COMPANY_CULTURE
 *         - COMPANY_BENEFITS
 *         - COMPANY_SOCIAL_MEDIA
 *         - COMPANY_ADDRESS
 *         - COMPANY_CONTACT_INFO
 *         - COMPANY_DOCUMENTS
 *         # Integration Subcategories
 *         - INTEGRATION_JOB_BOARD
 *         - INTEGRATION_ATS
 *         - INTEGRATION_HRIS
 *         - INTEGRATION_CALENDAR
 *         - INTEGRATION_EMAIL
 *         - INTEGRATION_SLACK
 *         - INTEGRATION_TEAMS
 *         - INTEGRATION_WEBHOOK
 *         - INTEGRATION_API
 *         - INTEGRATION_SETUP
 *         - INTEGRATION_SYNC
 *         - INTEGRATION_ERROR
 *         # Technical Issue Subcategories
 *         - TECHNICAL_ISSUE_LOGIN
 *         - TECHNICAL_ISSUE_PERFORMANCE
 *         - TECHNICAL_ISSUE_UI_BUG
 *         - TECHNICAL_ISSUE_MOBILE_APP
 *         - TECHNICAL_ISSUE_BROWSER
 *         - TECHNICAL_ISSUE_VIDEO_CALL
 *         - TECHNICAL_ISSUE_FILE_UPLOAD
 *         - TECHNICAL_ISSUE_NOTIFICATION
 *         - TECHNICAL_ISSUE_DATA_SYNC
 *         - TECHNICAL_ISSUE_SEARCH
 *         # Account Settings Subcategories
 *         - ACCOUNT_SETTINGS_PROFILE
 *         - ACCOUNT_SETTINGS_PASSWORD
 *         - ACCOUNT_SETTINGS_EMAIL
 *         - ACCOUNT_SETTINGS_PHONE
 *         - ACCOUNT_SETTINGS_TIMEZONE
 *         - ACCOUNT_SETTINGS_LANGUAGE
 *         - ACCOUNT_SETTINGS_PREFERENCES
 *         - ACCOUNT_SETTINGS_PRIVACY
 *         - ACCOUNT_SETTINGS_SECURITY
 *         - ACCOUNT_SETTINGS_TWO_FACTOR
 *         # Notification Settings Subcategories
 *         - NOTIFICATION_SETTINGS_EMAIL
 *         - NOTIFICATION_SETTINGS_PUSH
 *         - NOTIFICATION_SETTINGS_SMS
 *         - NOTIFICATION_SETTINGS_IN_APP
 *         - NOTIFICATION_SETTINGS_FREQUENCY
 *         - NOTIFICATION_SETTINGS_TEMPLATES
 *         - NOTIFICATION_SETTINGS_DIGEST
 *         - NOTIFICATION_SETTINGS_ALERTS
 *         # Data Export Import Subcategories
 *         - DATA_EXPORT_IMPORT_CANDIDATES
 *         - DATA_EXPORT_IMPORT_JOBS
 *         - DATA_EXPORT_IMPORT_APPLICATIONS
 *         - DATA_EXPORT_IMPORT_USERS
 *         - DATA_EXPORT_IMPORT_ASSESSMENTS
 *         - DATA_EXPORT_IMPORT_CSV
 *         - DATA_EXPORT_IMPORT_JSON
 *         - DATA_EXPORT_IMPORT_XML
 *         - DATA_EXPORT_IMPORT_FORMAT
 *         - DATA_EXPORT_IMPORT_VALIDATION
 *         # Security Authentication Subcategories
 *         - SECURITY_AUTHENTICATION_LOGIN
 *         - SECURITY_AUTHENTICATION_LOGOUT
 *         - SECURITY_AUTHENTICATION_PASSWORD_RESET
 *         - SECURITY_AUTHENTICATION_ACCOUNT_LOCK
 *         - SECURITY_AUTHENTICATION_SUSPICIOUS_ACTIVITY
 *         - SECURITY_AUTHENTICATION_ACCESS_DENIED
 *         - SECURITY_AUTHENTICATION_SESSION_EXPIRE
 *         - SECURITY_AUTHENTICATION_SSO
 *         - SECURITY_AUTHENTICATION_OAUTH
 *         # API Access Subcategories
 *         - API_ACCESS_KEY_GENERATION
 *         - API_ACCESS_KEY_REVOKE
 *         - API_ACCESS_RATE_LIMIT
 *         - API_ACCESS_DOCUMENTATION
 *         - API_ACCESS_WEBHOOK
 *         - API_ACCESS_AUTHENTICATION
 *         - API_ACCESS_PERMISSIONS
 *         - API_ACCESS_LOGS
 *         # Reporting Analytics Subcategories
 *         - REPORTING_ANALYTICS_DASHBOARD
 *         - REPORTING_ANALYTICS_JOBS
 *         - REPORTING_ANALYTICS_CANDIDATES
 *         - REPORTING_ANALYTICS_APPLICATIONS
 *         - REPORTING_ANALYTICS_ASSESSMENTS
 *         - REPORTING_ANALYTICS_PERFORMANCE
 *         - REPORTING_ANALYTICS_EXPORT
 *         - REPORTING_ANALYTICS_CUSTOM
 *         - REPORTING_ANALYTICS_SCHEDULED
 *         # Feature Request Subcategories
 *         - FEATURE_REQUEST_NEW_FEATURE
 *         - FEATURE_REQUEST_ENHANCEMENT
 *         - FEATURE_REQUEST_INTEGRATION
 *         - FEATURE_REQUEST_MOBILE
 *         - FEATURE_REQUEST_API
 *         - FEATURE_REQUEST_UI_UX
 *         - FEATURE_REQUEST_WORKFLOW
 *         - FEATURE_REQUEST_AUTOMATION
 *         # General Inquiry Subcategories
 *         - GENERAL_INQUIRY_HOW_TO
 *         - GENERAL_INQUIRY_BEST_PRACTICES
 *         - GENERAL_INQUIRY_TRAINING
 *         - GENERAL_INQUIRY_DEMO
 *         - GENERAL_INQUIRY_PRICING
 *         - GENERAL_INQUIRY_COMPARISON
 *         - GENERAL_INQUIRY_SUPPORT
 *         - GENERAL_INQUIRY_FEEDBACK
 *         # Other Subcategories
 *         - OTHER
 */

export enum SupportClientTicketSubcategoryEnum {
  // Job Posting Subcategories
  JOB_POSTING_CREATE = 'JOB_POSTING_CREATE',
  JOB_POSTING_UPDATE = 'JOB_POSTING_UPDATE',
  JOB_POSTING_DELETE = 'JOB_POSTING_DELETE',
  JOB_POSTING_PUBLISH = 'JOB_POSTING_PUBLISH',
  JOB_POSTING_UNPUBLISH = 'JOB_POSTING_UNPUBLISH',
  JOB_POSTING_ARCHIVE = 'JOB_POSTING_ARCHIVE',
  JOB_POSTING_AI_REVIEW_FAILED = 'JOB_POSTING_AI_REVIEW_FAILED',
  JOB_POSTING_AI_REVIEW_SUCCESS = 'JOB_POSTING_AI_REVIEW_SUCCESS',
  JOB_POSTING_MANUAL_REVIEW = 'JOB_POSTING_MANUAL_REVIEW',
  JOB_POSTING_TEMPLATE_ISSUE = 'JOB_POSTING_TEMPLATE_ISSUE',
  JOB_POSTING_DUPLICATE = 'JOB_POSTING_DUPLICATE',
  JOB_POSTING_PERMISSIONS = 'JOB_POSTING_PERMISSIONS',
  JOB_POSTING_INTEGRATION = 'JOB_POSTING_INTEGRATION',
  JOB_POSTING_JOB_BOARD_PUBLISH = 'JOB_POSTING_JOB_BOARD_PUBLISH',
  JOB_POSTING_ATS = 'JOB_POSTING_ATS',

  // Job Application Subcategories
  JOB_APPLICATION_VIEW = 'JOB_APPLICATION_VIEW',
  JOB_APPLICATION_STATUS_UPDATE = 'JOB_APPLICATION_STATUS_UPDATE',
  JOB_APPLICATION_SHORTLIST = 'JOB_APPLICATION_SHORTLIST',
  JOB_APPLICATION_REJECT = 'JOB_APPLICATION_REJECT',
  JOB_APPLICATION_BULK_ACTIONS = 'JOB_APPLICATION_BULK_ACTIONS',
  JOB_APPLICATION_EXPORT = 'JOB_APPLICATION_EXPORT',
  JOB_APPLICATION_NOTES = 'JOB_APPLICATION_NOTES',
  JOB_APPLICATION_COMMUNICATION = 'JOB_APPLICATION_COMMUNICATION',
  JOB_APPLICATION_CANDIDATE_PROFILE = 'JOB_APPLICATION_CANDIDATE_PROFILE',
  JOB_APPLICATION_RESUME_ACCESS = 'JOB_APPLICATION_RESUME_ACCESS',

  // Job Interview Subcategories
  JOB_INTERVIEW_SCHEDULE = 'JOB_INTERVIEW_SCHEDULE',
  JOB_INTERVIEW_RESCHEDULE = 'JOB_INTERVIEW_RESCHEDULE',
  JOB_INTERVIEW_CANCEL = 'JOB_INTERVIEW_CANCEL',
  JOB_INTERVIEW_AI_ASSESSMENT = 'JOB_INTERVIEW_AI_ASSESSMENT',
  JOB_INTERVIEW_PANEL_ASSESSMENT = 'JOB_INTERVIEW_PANEL_ASSESSMENT',
  JOB_INTERVIEW_VIDEO_CALL = 'JOB_INTERVIEW_VIDEO_CALL',
  JOB_INTERVIEW_IN_PERSON = 'JOB_INTERVIEW_IN_PERSON',
  JOB_INTERVIEW_FEEDBACK = 'JOB_INTERVIEW_FEEDBACK',
  JOB_INTERVIEW_RECORDING = 'JOB_INTERVIEW_RECORDING',
  JOB_INTERVIEW_TECHNICAL_ISSUE = 'JOB_INTERVIEW_TECHNICAL_ISSUE',

  // Job Onboarding Subcategories
  JOB_ONBOARDING_SETUP = 'JOB_ONBOARDING_SETUP',
  JOB_ONBOARDING_DOCUMENTS = 'JOB_ONBOARDING_DOCUMENTS',
  JOB_ONBOARDING_CHECKLIST = 'JOB_ONBOARDING_CHECKLIST',
  JOB_ONBOARDING_TASKS = 'JOB_ONBOARDING_TASKS',
  JOB_ONBOARDING_PROGRESS = 'JOB_ONBOARDING_PROGRESS',
  JOB_ONBOARDING_COMPLETION = 'JOB_ONBOARDING_COMPLETION',

  // Candidate Recommendation Subcategories
  CANDIDATE_RECOMMENDATION_ALGORITHM = 'CANDIDATE_RECOMMENDATION_ALGORITHM',
  CANDIDATE_RECOMMENDATION_FILTERS = 'CANDIDATE_RECOMMENDATION_FILTERS',
  CANDIDATE_RECOMMENDATION_ACCURACY = 'CANDIDATE_RECOMMENDATION_ACCURACY',
  CANDIDATE_RECOMMENDATION_FEEDBACK = 'CANDIDATE_RECOMMENDATION_FEEDBACK',
  CANDIDATE_RECOMMENDATION_CUSTOMIZATION = 'CANDIDATE_RECOMMENDATION_CUSTOMIZATION',
  CANDIDATE_RECOMMENDATION_MATCHING = 'CANDIDATE_RECOMMENDATION_MATCHING',

  // User Invitation Subcategories
  USER_INVITATION_SEND = 'USER_INVITATION_SEND',
  USER_INVITATION_RESEND = 'USER_INVITATION_RESEND',
  USER_INVITATION_WITHDRAW = 'USER_INVITATION_WITHDRAW',
  USER_INVITATION_EXPIRE = 'USER_INVITATION_EXPIRE',
  USER_INVITATION_ACCEPT = 'USER_INVITATION_ACCEPT',
  USER_INVITATION_DECLINE = 'USER_INVITATION_DECLINE',
  USER_INVITATION_BULK_SEND = 'USER_INVITATION_BULK_SEND',
  USER_INVITATION_TEMPLATE = 'USER_INVITATION_TEMPLATE',
  USER_INVITATION_PERMISSIONS = 'USER_INVITATION_PERMISSIONS',

  // User Management Subcategories
  USER_CREATE = 'USER_CREATE',
  USER_UPDATE = 'USER_UPDATE',
  USER_DEACTIVATE = 'USER_DEACTIVATE',
  USER_ACTIVATE = 'USER_ACTIVATE',
  USER_DELETE = 'USER_DELETE',
  USER_ROLE_CHANGE = 'USER_ROLE_CHANGE',
  USER_PERMISSIONS = 'USER_PERMISSIONS',
  USER_ACCESS_CONTROL = 'USER_ACCESS_CONTROL',
  USER_BULK_ACTIONS = 'USER_BULK_ACTIONS',
  USER_IMPORT = 'USER_IMPORT',

  // Subscription Billing Subcategories
  SUBSCRIPTION_UPGRADE = 'SUBSCRIPTION_UPGRADE',
  SUBSCRIPTION_DOWNGRADE = 'SUBSCRIPTION_DOWNGRADE',
  SUBSCRIPTION_CANCEL = 'SUBSCRIPTION_CANCEL',
  SUBSCRIPTION_RENEW = 'SUBSCRIPTION_RENEW',
  SUBSCRIPTION_TRIAL = 'SUBSCRIPTION_TRIAL',
  SUBSCRIPTION_PAYMENT_FAILED = 'SUBSCRIPTION_PAYMENT_FAILED',
  SUBSCRIPTION_PAYMENT_METHOD = 'SUBSCRIPTION_PAYMENT_METHOD',
  SUBSCRIPTION_BILLING_CYCLE = 'SUBSCRIPTION_BILLING_CYCLE',
  SUBSCRIPTION_CREDITS_PURCHASE = 'SUBSCRIPTION_CREDITS_PURCHASE',
  SUBSCRIPTION_CREDITS_USAGE = 'SUBSCRIPTION_CREDITS_USAGE',
  SUBSCRIPTION_LIMITS = 'SUBSCRIPTION_LIMITS',
  SUBSCRIPTION_INVOICE = 'SUBSCRIPTION_INVOICE',
  SUBSCRIPTION_REFUND = 'SUBSCRIPTION_REFUND',
  SUBSCRIPTION_PRICING = 'SUBSCRIPTION_PRICING',

  // AI Assessment Subcategories
  AI_ASSESSMENT_CREATE = 'AI_ASSESSMENT_CREATE',
  AI_ASSESSMENT_CONFIGURE = 'AI_ASSESSMENT_CONFIGURE',
  AI_ASSESSMENT_INVITE_CANDIDATE = 'AI_ASSESSMENT_INVITE_CANDIDATE',
  AI_ASSESSMENT_RESULTS = 'AI_ASSESSMENT_RESULTS',
  AI_ASSESSMENT_VIDEO_ANALYSIS = 'AI_ASSESSMENT_VIDEO_ANALYSIS',
  AI_ASSESSMENT_PROCTORING = 'AI_ASSESSMENT_PROCTORING',
  AI_ASSESSMENT_DIFFICULTY = 'AI_ASSESSMENT_DIFFICULTY',
  AI_ASSESSMENT_SCORING = 'AI_ASSESSMENT_SCORING',
  AI_ASSESSMENT_FEEDBACK = 'AI_ASSESSMENT_FEEDBACK',
  AI_ASSESSMENT_TECHNICAL_ISSUE = 'AI_ASSESSMENT_TECHNICAL_ISSUE',
  AI_ASSESSMENT_REPORTING = 'AI_ASSESSMENT_REPORTING',

  // Panel Assessment Subcategories
  PANEL_ASSESSMENT_SLOT_CREATION = 'PANEL_ASSESSMENT_SLOT_CREATION',
  PANEL_ASSESSMENT_CONFIGURE = 'PANEL_ASSESSMENT_CONFIGURE',
  PANEL_ASSESSMENT_INVITE_CANDIDATE = 'PANEL_ASSESSMENT_INVITE_CANDIDATE',
  PANEL_ASSESSMENT_FEEDBACK = 'PANEL_ASSESSMENT_FEEDBACK',
  PANEL_ASSESSMENT_MEETING_CREATION = 'PANEL_ASSESSMENT_MEETING_CREATION',
  PANEL_ASSESSMENT_MEETING_LINK_GENERATION = 'PANEL_ASSESSMENT_MEETING_LINK_GENERATION',

  // Company Profile Subcategories
  COMPANY_PROFILE_UPDATE = 'COMPANY_PROFILE_UPDATE',
  COMPANY_VERIFICATION = 'COMPANY_VERIFICATION',
  COMPANY_LOGO = 'COMPANY_LOGO',
  COMPANY_DESCRIPTION = 'COMPANY_DESCRIPTION',
  COMPANY_CULTURE = 'COMPANY_CULTURE',
  COMPANY_BENEFITS = 'COMPANY_BENEFITS',
  COMPANY_SOCIAL_MEDIA = 'COMPANY_SOCIAL_MEDIA',
  COMPANY_ADDRESS = 'COMPANY_ADDRESS',
  COMPANY_CONTACT_INFO = 'COMPANY_CONTACT_INFO',
  COMPANY_DOCUMENTS = 'COMPANY_DOCUMENTS',

  // Integration Subcategories
  INTEGRATION_JOB_BOARD = 'INTEGRATION_JOB_BOARD',
  INTEGRATION_ATS = 'INTEGRATION_ATS',
  INTEGRATION_HRIS = 'INTEGRATION_HRIS',
  INTEGRATION_CALENDAR = 'INTEGRATION_CALENDAR',
  INTEGRATION_EMAIL = 'INTEGRATION_EMAIL',
  INTEGRATION_SLACK = 'INTEGRATION_SLACK',
  INTEGRATION_TEAMS = 'INTEGRATION_TEAMS',
  INTEGRATION_WEBHOOK = 'INTEGRATION_WEBHOOK',
  INTEGRATION_API = 'INTEGRATION_API',
  INTEGRATION_SETUP = 'INTEGRATION_SETUP',
  INTEGRATION_SYNC = 'INTEGRATION_SYNC',
  INTEGRATION_ERROR = 'INTEGRATION_ERROR',

  // Technical Issue Subcategories
  TECHNICAL_ISSUE_LOGIN = 'TECHNICAL_ISSUE_LOGIN',
  TECHNICAL_ISSUE_PERFORMANCE = 'TECHNICAL_ISSUE_PERFORMANCE',
  TECHNICAL_ISSUE_UI_BUG = 'TECHNICAL_ISSUE_UI_BUG',
  TECHNICAL_ISSUE_MOBILE_APP = 'TECHNICAL_ISSUE_MOBILE_APP',
  TECHNICAL_ISSUE_BROWSER = 'TECHNICAL_ISSUE_BROWSER',
  TECHNICAL_ISSUE_VIDEO_CALL = 'TECHNICAL_ISSUE_VIDEO_CALL',
  TECHNICAL_ISSUE_FILE_UPLOAD = 'TECHNICAL_ISSUE_FILE_UPLOAD',
  TECHNICAL_ISSUE_NOTIFICATION = 'TECHNICAL_ISSUE_NOTIFICATION',
  TECHNICAL_ISSUE_DATA_SYNC = 'TECHNICAL_ISSUE_DATA_SYNC',
  TECHNICAL_ISSUE_SEARCH = 'TECHNICAL_ISSUE_SEARCH',

  // Account Settings Subcategories
  ACCOUNT_SETTINGS_PROFILE = 'ACCOUNT_SETTINGS_PROFILE',
  ACCOUNT_SETTINGS_PASSWORD = 'ACCOUNT_SETTINGS_PASSWORD',
  ACCOUNT_SETTINGS_EMAIL = 'ACCOUNT_SETTINGS_EMAIL',
  ACCOUNT_SETTINGS_PHONE = 'ACCOUNT_SETTINGS_PHONE',
  ACCOUNT_SETTINGS_TIMEZONE = 'ACCOUNT_SETTINGS_TIMEZONE',
  ACCOUNT_SETTINGS_LANGUAGE = 'ACCOUNT_SETTINGS_LANGUAGE',
  ACCOUNT_SETTINGS_PREFERENCES = 'ACCOUNT_SETTINGS_PREFERENCES',
  ACCOUNT_SETTINGS_PRIVACY = 'ACCOUNT_SETTINGS_PRIVACY',
  ACCOUNT_SETTINGS_SECURITY = 'ACCOUNT_SETTINGS_SECURITY',
  ACCOUNT_SETTINGS_TWO_FACTOR = 'ACCOUNT_SETTINGS_TWO_FACTOR',

  // Notification Settings Subcategories
  NOTIFICATION_SETTINGS_EMAIL = 'NOTIFICATION_SETTINGS_EMAIL',
  NOTIFICATION_SETTINGS_PUSH = 'NOTIFICATION_SETTINGS_PUSH',
  NOTIFICATION_SETTINGS_SMS = 'NOTIFICATION_SETTINGS_SMS',
  NOTIFICATION_SETTINGS_IN_APP = 'NOTIFICATION_SETTINGS_IN_APP',
  NOTIFICATION_SETTINGS_FREQUENCY = 'NOTIFICATION_SETTINGS_FREQUENCY',
  NOTIFICATION_SETTINGS_TEMPLATES = 'NOTIFICATION_SETTINGS_TEMPLATES',
  NOTIFICATION_SETTINGS_DIGEST = 'NOTIFICATION_SETTINGS_DIGEST',
  NOTIFICATION_SETTINGS_ALERTS = 'NOTIFICATION_SETTINGS_ALERTS',

  // Data Export Import Subcategories
  DATA_EXPORT_IMPORT_CANDIDATES = 'DATA_EXPORT_IMPORT_CANDIDATES',
  DATA_EXPORT_IMPORT_JOBS = 'DATA_EXPORT_IMPORT_JOBS',
  DATA_EXPORT_IMPORT_APPLICATIONS = 'DATA_EXPORT_IMPORT_APPLICATIONS',
  DATA_EXPORT_IMPORT_USERS = 'DATA_EXPORT_IMPORT_USERS',
  DATA_EXPORT_IMPORT_ASSESSMENTS = 'DATA_EXPORT_IMPORT_ASSESSMENTS',
  DATA_EXPORT_IMPORT_CSV = 'DATA_EXPORT_IMPORT_CSV',
  DATA_EXPORT_IMPORT_JSON = 'DATA_EXPORT_IMPORT_JSON',
  DATA_EXPORT_IMPORT_XML = 'DATA_EXPORT_IMPORT_XML',
  DATA_EXPORT_IMPORT_FORMAT = 'DATA_EXPORT_IMPORT_FORMAT',
  DATA_EXPORT_IMPORT_VALIDATION = 'DATA_EXPORT_IMPORT_VALIDATION',

  // Security Authentication Subcategories
  SECURITY_AUTHENTICATION_LOGIN = 'SECURITY_AUTHENTICATION_LOGIN',
  SECURITY_AUTHENTICATION_LOGOUT = 'SECURITY_AUTHENTICATION_LOGOUT',
  SECURITY_AUTHENTICATION_PASSWORD_RESET = 'SECURITY_AUTHENTICATION_PASSWORD_RESET',
  SECURITY_AUTHENTICATION_ACCOUNT_LOCK = 'SECURITY_AUTHENTICATION_ACCOUNT_LOCK',
  SECURITY_AUTHENTICATION_SUSPICIOUS_ACTIVITY = 'SECURITY_AUTHENTICATION_SUSPICIOUS_ACTIVITY',
  SECURITY_AUTHENTICATION_ACCESS_DENIED = 'SECURITY_AUTHENTICATION_ACCESS_DENIED',
  SECURITY_AUTHENTICATION_SESSION_EXPIRE = 'SECURITY_AUTHENTICATION_SESSION_EXPIRE',
  SECURITY_AUTHENTICATION_SSO = 'SECURITY_AUTHENTICATION_SSO',
  SECURITY_AUTHENTICATION_OAUTH = 'SECURITY_AUTHENTICATION_OAUTH',

  // API Access Subcategories
  API_ACCESS_KEY_GENERATION = 'API_ACCESS_KEY_GENERATION',
  API_ACCESS_KEY_REVOKE = 'API_ACCESS_KEY_REVOKE',
  API_ACCESS_RATE_LIMIT = 'API_ACCESS_RATE_LIMIT',
  API_ACCESS_DOCUMENTATION = 'API_ACCESS_DOCUMENTATION',
  API_ACCESS_WEBHOOK = 'API_ACCESS_WEBHOOK',
  API_ACCESS_AUTHENTICATION = 'API_ACCESS_AUTHENTICATION',
  API_ACCESS_PERMISSIONS = 'API_ACCESS_PERMISSIONS',
  API_ACCESS_LOGS = 'API_ACCESS_LOGS',

  // Reporting Analytics Subcategories
  REPORTING_ANALYTICS_DASHBOARD = 'REPORTING_ANALYTICS_DASHBOARD',
  REPORTING_ANALYTICS_JOBS = 'REPORTING_ANALYTICS_JOBS',
  REPORTING_ANALYTICS_CANDIDATES = 'REPORTING_ANALYTICS_CANDIDATES',
  REPORTING_ANALYTICS_APPLICATIONS = 'REPORTING_ANALYTICS_APPLICATIONS',
  REPORTING_ANALYTICS_ASSESSMENTS = 'REPORTING_ANALYTICS_ASSESSMENTS',
  REPORTING_ANALYTICS_PERFORMANCE = 'REPORTING_ANALYTICS_PERFORMANCE',
  REPORTING_ANALYTICS_EXPORT = 'REPORTING_ANALYTICS_EXPORT',
  REPORTING_ANALYTICS_CUSTOM = 'REPORTING_ANALYTICS_CUSTOM',
  REPORTING_ANALYTICS_SCHEDULED = 'REPORTING_ANALYTICS_SCHEDULED',

  // Feature Request Subcategories
  FEATURE_REQUEST_NEW_FEATURE = 'FEATURE_REQUEST_NEW_FEATURE',
  FEATURE_REQUEST_ENHANCEMENT = 'FEATURE_REQUEST_ENHANCEMENT',
  FEATURE_REQUEST_INTEGRATION = 'FEATURE_REQUEST_INTEGRATION',
  FEATURE_REQUEST_MOBILE = 'FEATURE_REQUEST_MOBILE',
  FEATURE_REQUEST_API = 'FEATURE_REQUEST_API',
  FEATURE_REQUEST_UI_UX = 'FEATURE_REQUEST_UI_UX',
  FEATURE_REQUEST_WORKFLOW = 'FEATURE_REQUEST_WORKFLOW',
  FEATURE_REQUEST_AUTOMATION = 'FEATURE_REQUEST_AUTOMATION',

  // General Inquiry Subcategories
  GENERAL_INQUIRY_HOW_TO = 'GENERAL_INQUIRY_HOW_TO',
  GENERAL_INQUIRY_BEST_PRACTICES = 'GENERAL_INQUIRY_BEST_PRACTICES',
  GENERAL_INQUIRY_TRAINING = 'GENERAL_INQUIRY_TRAINING',
  GENERAL_INQUIRY_DEMO = 'GENERAL_INQUIRY_DEMO',
  GENERAL_INQUIRY_PRICING = 'GENERAL_INQUIRY_PRICING',
  GENERAL_INQUIRY_COMPARISON = 'GENERAL_INQUIRY_COMPARISON',
  GENERAL_INQUIRY_SUPPORT = 'GENERAL_INQUIRY_SUPPORT',
  GENERAL_INQUIRY_FEEDBACK = 'GENERAL_INQUIRY_FEEDBACK',

  // Other Subcategories
  OTHER = 'OTHER',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportCandidateTicketCategoryEnum:
 *       type: string
 *       description: Category of support ticket for candidate
 *       enum:
 *         - PROFILE_MANAGEMENT
 *         - JOB_APPLICATION
 *         - ASSESSMENT
 *         - ONBOARDING
 *         - RESUME
 *         - NOTIFICATION_SETTINGS
 *         - TECHNICAL_ISSUE
 *         - SECURITY_AUTHENTICATION
 *         - OTHER
 */

export enum SupportCandidateTicketCategoryEnum {
  PROFILE_MANAGEMENT = 'PROFILE_MANAGEMENT',
  JOB_APPLICATION = 'JOB_APPLICATION',
  ASSESSMENT = 'ASSESSMENT',
  ONBOARDING = 'ONBOARDING',
  RESUME = 'RESUME',
  NOTIFICATION_SETTINGS = 'NOTIFICATION_SETTINGS',
  TECHNICAL_ISSUE = 'TECHNICAL_ISSUE',
  SECURITY_AUTHENTICATION = 'SECURITY_AUTHENTICATION',
  OTHER = 'OTHER',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportCandidateTicketSubcategoryEnum:
 *       type: string
 *       description: Subcategory of support ticket for candidate
 *       enum:
 *         # Profile Management Subcategories
 *         - PROFILE_CREATE
 *         - PROFILE_UPDATE
 *         - PROFILE_VERIFICATION
 *         - PROFILE_DEACTIVATE
 *         - PROFILE_ACTIVATE
 *         - PROFILE_DELETE
 *         - PROFILE_PRIVACY
 *         - PROFILE_VISIBILITY
 *         - PROFILE_COMPLETION
 *         - PROFILE_SKILLS
 *         - PROFILE_EXPERIENCE
 *         - PROFILE_EDUCATION
 *         - PROFILE_CERTIFICATION
 *         - PROFILE_PROJECTS
 *         # Job Application Subcategories
 *         - JOB_APPLICATION_SUBMIT
 *         - JOB_APPLICATION_STATUS
 *         - JOB_APPLICATION_WITHDRAW
 *         - JOB_APPLICATION_TRACKING
 *         - JOB_APPLICATION_REFERENCES
 *         - JOB_APPLICATION_FOLLOW_UP
 *         # Assessment Subcategories
 *         - ASSESSMENT_INVITATION
 *         - ASSESSMENT_ACCESS
 *         - ASSESSMENT_COMPLETION
 *         - ASSESSMENT_RESULTS
 *         - ASSESSMENT_FEEDBACK
 *         - ASSESSMENT_RETRY
 *         - ASSESSMENT_TECHNICAL_ISSUE
 *         - ASSESSMENT_SCHEDULING
 *         - ASSESSMENT_PROCTORING
 *         - ASSESSMENT_VIDEO_ISSUE
 *         - ASSESSMENT_AUDIO_ISSUE
 *         - ASSESSMENT_PERFORMANCE
 *         # Onboarding Subcategories
 *         - ONBOARDING_SETUP
 *         - ONBOARDING_PROGRESS
 *         - ONBOARDING_COMPLETION
 *         - ONBOARDING_ISSUES
 *         - ONBOARDING_ACCESS
 *         - ONBOARDING_GUIDANCE
 *         # Resume Subcategories
 *         - RESUME_UPLOAD
 *         - RESUME_UPDATE
 *         - RESUME_DELETE
 *         - RESUME_PARSING
 *         # Notification Settings Subcategories
 *         - NOTIFICATION_SETTINGS_EMAIL
 *         - NOTIFICATION_SETTINGS_SMS
 *         - NOTIFICATION_SETTINGS_IN_APP
 *         - NOTIFICATION_SETTINGS_FREQUENCY
 *         - NOTIFICATION_SETTINGS_DIGEST
 *         - NOTIFICATION_SETTINGS_ALERTS
 *         # Technical Issue Subcategories
 *         - TECHNICAL_ISSUE_LOGIN
 *         - TECHNICAL_ISSUE_PERFORMANCE
 *         - TECHNICAL_ISSUE_UI_BUG
 *         - TECHNICAL_ISSUE_MOBILE_APP
 *         - TECHNICAL_ISSUE_BROWSER
 *         - TECHNICAL_ISSUE_VIDEO_CALL
 *         - TECHNICAL_ISSUE_FILE_UPLOAD
 *         - TECHNICAL_ISSUE_NOTIFICATION
 *         - TECHNICAL_ISSUE_SEARCH
 *         # Security Authentication Subcategories
 *         - SECURITY_AUTHENTICATION_LOGIN
 *         - SECURITY_AUTHENTICATION_LOGOUT
 *         - SECURITY_AUTHENTICATION_PASSWORD_RESET
 *         - SECURITY_AUTHENTICATION_ACCESS_DENIED
 *         - SECURITY_AUTHENTICATION_SESSION_EXPIRE
 *         # Other Subcategories
 *         - OTHER
 */

export enum SupportCandidateTicketSubcategoryEnum {
  // Profile Management Subcategories
  PROFILE_CREATE = 'PROFILE_CREATE',
  PROFILE_UPDATE = 'PROFILE_UPDATE',
  PROFILE_VERIFICATION = 'PROFILE_VERIFICATION',
  PROFILE_DEACTIVATE = 'PROFILE_DEACTIVATE',
  PROFILE_ACTIVATE = 'PROFILE_ACTIVATE',
  PROFILE_DELETE = 'PROFILE_DELETE',
  PROFILE_PRIVACY = 'PROFILE_PRIVACY',
  PROFILE_VISIBILITY = 'PROFILE_VISIBILITY',
  PROFILE_COMPLETION = 'PROFILE_COMPLETION',
  PROFILE_SKILLS = 'PROFILE_SKILLS',
  PROFILE_EXPERIENCE = 'PROFILE_EXPERIENCE',
  PROFILE_EDUCATION = 'PROFILE_EDUCATION',
  PROFILE_CERTIFICATION = 'PROFILE_CERTIFICATION',
  PROFILE_PROJECTS = 'PROFILE_PROJECTS',

  // Job Application Subcategories
  JOB_APPLICATION_SUBMIT = 'JOB_APPLICATION_SUBMIT',
  JOB_APPLICATION_STATUS = 'JOB_APPLICATION_STATUS',
  JOB_APPLICATION_WITHDRAW = 'JOB_APPLICATION_WITHDRAW',
  JOB_APPLICATION_TRACKING = 'JOB_APPLICATION_TRACKING',
  JOB_APPLICATION_REFERENCES = 'JOB_APPLICATION_REFERENCES',
  JOB_APPLICATION_FOLLOW_UP = 'JOB_APPLICATION_FOLLOW_UP',

  // Assessment Subcategories
  ASSESSMENT_INVITATION = 'ASSESSMENT_INVITATION',
  ASSESSMENT_ACCESS = 'ASSESSMENT_ACCESS',
  ASSESSMENT_COMPLETION = 'ASSESSMENT_COMPLETION',
  ASSESSMENT_RESULTS = 'ASSESSMENT_RESULTS',
  ASSESSMENT_FEEDBACK = 'ASSESSMENT_FEEDBACK',
  ASSESSMENT_RETRY = 'ASSESSMENT_RETRY',
  ASSESSMENT_TECHNICAL_ISSUE = 'ASSESSMENT_TECHNICAL_ISSUE',
  ASSESSMENT_SCHEDULING = 'ASSESSMENT_SCHEDULING',
  ASSESSMENT_PROCTORING = 'ASSESSMENT_PROCTORING',
  ASSESSMENT_VIDEO_ISSUE = 'ASSESSMENT_VIDEO_ISSUE',
  ASSESSMENT_AUDIO_ISSUE = 'ASSESSMENT_AUDIO_ISSUE',
  ASSESSMENT_PERFORMANCE = 'ASSESSMENT_PERFORMANCE',

  // Onboarding Subcategories
  ONBOARDING_SETUP = 'ONBOARDING_SETUP',
  ONBOARDING_PROGRESS = 'ONBOARDING_PROGRESS',
  ONBOARDING_COMPLETION = 'ONBOARDING_COMPLETION',
  ONBOARDING_ISSUES = 'ONBOARDING_ISSUES',
  ONBOARDING_ACCESS = 'ONBOARDING_ACCESS',
  ONBOARDING_GUIDANCE = 'ONBOARDING_GUIDANCE',

  // Resume Subcategories
  RESUME_UPLOAD = 'RESUME_UPLOAD',
  RESUME_UPDATE = 'RESUME_UPDATE',
  RESUME_DELETE = 'RESUME_DELETE',
  RESUME_PARSING = 'RESUME_PARSING',

  // Notification Settings Subcategories
  NOTIFICATION_SETTINGS_EMAIL = 'NOTIFICATION_SETTINGS_EMAIL',
  NOTIFICATION_SETTINGS_SMS = 'NOTIFICATION_SETTINGS_SMS',
  NOTIFICATION_SETTINGS_IN_APP = 'NOTIFICATION_SETTINGS_IN_APP',
  NOTIFICATION_SETTINGS_FREQUENCY = 'NOTIFICATION_SETTINGS_FREQUENCY',
  NOTIFICATION_SETTINGS_DIGEST = 'NOTIFICATION_SETTINGS_DIGEST',
  NOTIFICATION_SETTINGS_ALERTS = 'NOTIFICATION_SETTINGS_ALERTS',

  // Technical Issue Subcategories
  TECHNICAL_ISSUE_LOGIN = 'TECHNICAL_ISSUE_LOGIN',
  TECHNICAL_ISSUE_PERFORMANCE = 'TECHNICAL_ISSUE_PERFORMANCE',
  TECHNICAL_ISSUE_UI_BUG = 'TECHNICAL_ISSUE_UI_BUG',
  TECHNICAL_ISSUE_MOBILE_APP = 'TECHNICAL_ISSUE_MOBILE_APP',
  TECHNICAL_ISSUE_BROWSER = 'TECHNICAL_ISSUE_BROWSER',
  TECHNICAL_ISSUE_VIDEO_CALL = 'TECHNICAL_ISSUE_VIDEO_CALL',
  TECHNICAL_ISSUE_FILE_UPLOAD = 'TECHNICAL_ISSUE_FILE_UPLOAD',
  TECHNICAL_ISSUE_NOTIFICATION = 'TECHNICAL_ISSUE_NOTIFICATION',
  TECHNICAL_ISSUE_SEARCH = 'TECHNICAL_ISSUE_SEARCH',

  // Security Authentication Subcategories
  SECURITY_AUTHENTICATION_LOGIN = 'SECURITY_AUTHENTICATION_LOGIN',
  SECURITY_AUTHENTICATION_LOGOUT = 'SECURITY_AUTHENTICATION_LOGOUT',
  SECURITY_AUTHENTICATION_PASSWORD_RESET = 'SECURITY_AUTHENTICATION_PASSWORD_RESET',
  SECURITY_AUTHENTICATION_ACCESS_DENIED = 'SECURITY_AUTHENTICATION_ACCESS_DENIED',
  SECURITY_AUTHENTICATION_SESSION_EXPIRE = 'SECURITY_AUTHENTICATION_SESSION_EXPIRE',

  // Other Subcategories
  OTHER = 'OTHER',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     CandidateReviewStatusEnum:
 *       type: string
 *       description: Review status of a candidate for publishing
 *       enum:
 *         - PENDING_PUBLISH
 *         - PUBLISHED
 *         - UNPUBLISHED
 */
export enum CandidateReviewStatusEnum {
  PENDING_PUBLISH = 'PENDING_PUBLISH',
  PUBLISHED = 'PUBLISHED',
  UNPUBLISHED = 'UNPUBLISHED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     PaymentStatus:
 *       type: string
 *       enum: [SUCCEEDED, FAILED, PENDING, CANCELED, REFUNDED]
 *       description: Payment status enumeration
 */
export enum PaymentStatus {
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  PENDING = 'PENDING',
  CANCELED = 'CANCELED',
  REFUNDED = 'REFUNDED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     FeatureFlagCategoryEnum:
 *       type: string
 *       description: Category of a feature flag
 *       enum:
 *         - SYSTEM
 *         - ASSESSMENT
 *         - PROCTORING
 *         - UI_ENHANCEMENT
 *         - ANALYTICS
 *         - INTEGRATION
 *         - EXPERIMENTAL
 *         - BETA
 *         - DEPRECATED
 */
export enum FeatureFlagCategoryEnum {
  SYSTEM = 'SYSTEM',
  ASSESSMENT = 'ASSESSMENT',
  PROCTORING = 'PROCTORING',
  UI_ENHANCEMENT = 'UI_ENHANCEMENT',
  ANALYTICS = 'ANALYTICS',
  INTEGRATION = 'INTEGRATION',
  EXPERIMENTAL = 'EXPERIMENTAL',
  BETA = 'BETA',
  DEPRECATED = 'DEPRECATED',
}
