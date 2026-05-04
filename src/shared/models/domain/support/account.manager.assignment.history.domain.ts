/**
 * @openapi
 * components:
 *   schemas:
 *     IAccountManagerAssignmentHistory:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the assignment history record
 *         clientId:
 *           type: string
 *           description: ID of the client
 *         previousAccountManagerId:
 *           type: string
 *           description: ID of the previous account manager
 *         newAccountManagerId:
 *           type: string
 *           nullable: true
 *           description: ID of the new account manager
 *         changeReason:
 *           type: string
 *           description: Reason for the change (can be any custom string from frontend)
 *         changedBy:
 *           type: string
 *           description: User ID who made the change
 *         changedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the change was made
 *         notes:
 *           type: string
 *           nullable: true
 *           description: Additional notes about the change
 *       required:
 *         - id
 *         - clientId
 *         - previousAccountManagerId
 *         - changeReason
 *         - changedBy
 *         - changedAt
 */
export interface IAccountManagerAssignmentHistory {
  id: string;
  clientId: string;
  previousAccountManagerId: string;
  newAccountManagerId?: string;
  changeReason: string;
  changedBy: string;
  changedAt: Date;
  notes?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPostingAssignmentHistory:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the job posting assignment history
 *         jobPostingId:
 *           type: string
 *           description: ID of the job posting
 *         previousRecruiterId:
 *           type: string
 *           description: ID of the previous recruiter
 *         newRecruiterId:
 *           type: string
 *           nullable: true
 *           description: ID of the new recruiter
 *         previousAccountManagerId:
 *           type: string
 *           description: ID of the previous account manager
 *         newAccountManagerId:
 *           type: string
 *           nullable: true
 *           description: ID of the new account manager

 *         changedBy:
 *           type: string
 *           description: User ID who made the change
 *         changedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the change was made
 *         notes:
 *           type: string
 *           nullable: true
 *           description: Additional notes about the change
 *       required:
 *         - id
 *         - jobPostingId
 *         - previousRecruiterId
 *         - previousAccountManagerId
 *         - changedBy
 *         - changedAt
 */
export interface IJobPostingAssignmentHistory {
  id: string;
  jobPostingId: string;
  previousRecruiterId: string;
  newRecruiterId?: string;
  previousAccountManagerId: string;
  newAccountManagerId?: string;
  changedBy: string;
  changedAt: Date;
  notes?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPostingRecommendationArchive:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the archived recommendation
 *         originalRecommendationId:
 *           type: string
 *           description: ID of the original recommendation
 *         jobPostingId:
 *           type: string
 *           description: ID of the job posting
 *         candidateId:
 *           type: string
 *           description: ID of the candidate
 *         recruiterId:
 *           type: string
 *           description: ID of the recruiter
 *         accountManagerId:
 *           type: string
 *           description: ID of the account manager
 *         archivedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the recommendation was archived

 *         originalScore:
 *           type: number
 *           description: Original matching score
 *         originalMatchReason:
 *           type: array
 *           items:
 *             type: string
 *           description: Original matching reasons
 *         originalStatus:
 *           type: string
 *           description: Original recommendation status
 *       required:
 *         - id
 *         - originalRecommendationId
 *         - jobPostingId
 *         - candidateId
 *         - recruiterId
 *         - accountManagerId
 *         - archivedAt

 *         - originalScore
 *         - originalMatchReason
 *         - originalStatus
 */
export interface IJobPostingRecommendationArchive {
  id: string;
  originalRecommendationId: string;
  jobPostingId: string;
  candidateId: string;
  recruiterId: string;
  accountManagerId: string;
  archivedAt: Date;
  originalScore: number;
  originalMatchReason: string[];
  originalStatus: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IAccountManagerReassignmentRequest:
 *       type: object
 *       properties:
 *         clientId:
 *           type: string
 *           description: ID of the client to reassign
 *         newAccountManagerId:
 *           type: string
 *           description: ID of the new account manager
 *         changeReason:
 *           type: string
 *           description: Reason for the reassignment
 *         changedBy:
 *           type: string
 *           description: User ID making the change
 *         notes:
 *           type: string
 *           nullable: true
 *           description: Additional notes about the reassignment
 *       required:
 *         - clientId
 *         - newAccountManagerId
 *         - changeReason
 *         - changedBy
 */
export interface IAccountManagerReassignmentRequest {
  clientId: string;
  newAccountManagerId: string;
  changeReason: string;
  changedBy: string;
  notes?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPostingWorkload:
 *       type: object
 *       properties:
 *         recruiterId:
 *           type: string
 *           description: ID of the recruiter
 *         recruiterName:
 *           type: string
 *           description: Name of the recruiter
 *         totalJobPostings:
 *           type: integer
 *           description: Total number of job postings assigned
 *         fulfilledJobPostings:
 *           type: integer
 *           description: Number of fulfilled job postings
 *         pendingJobPostings:
 *           type: integer
 *           description: Number of pending job postings
 *         workloadPercentage:
 *           type: number
 *           description: Workload completion percentage
 *       required:
 *         - recruiterId
 *         - recruiterName
 *         - totalJobPostings
 *         - fulfilledJobPostings
 *         - pendingJobPostings
 *         - workloadPercentage
 */
export interface IJobPostingWorkload {
  recruiterId: string;
  recruiterName: string;
  totalJobPostings: number;
  fulfilledJobPostings: number;
  pendingJobPostings: number;
  workloadPercentage: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPostingRedistributionPlan:
 *       type: object
 *       properties:
 *         jobPostingId:
 *           type: string
 *           description: ID of the job posting being redistributed
 *         jobTitle:
 *           type: string
 *           description: Title of the job posting
 *         currentRecruiterId:
 *           type: string
 *           description: ID of the current recruiter
 *         newRecruiterId:
 *           type: string
 *           description: ID of the new recruiter
 *         reason:
 *           type: string
 *           description: Reason for redistribution
 *       required:
 *         - jobPostingId
 *         - jobTitle
 *         - currentRecruiterId
 *         - newRecruiterId
 *         - reason
 */
export interface IJobPostingRedistributionPlan {
  jobPostingId: string;
  jobTitle: string;
  currentRecruiterId: string;
  newRecruiterId: string;
  reason: string;
}
