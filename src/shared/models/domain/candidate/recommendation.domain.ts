import {
  CandidateRecommendationStatusEnum,
  CandidateRecommendationFeedbackTypeEnum,
} from '../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateRecommendation:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the recommendation
 *         candidateId:
 *           type: string
 *           format: uuid
 *           description: ID of the candidate
 *         jobPostingId:
 *           type: string
 *           format: uuid
 *           description: ID of the job posting
 *         score:
 *           type: number
 *           format: float
 *           minimum: 0
 *           maximum: 1
 *           description: Match score between candidate and job posting
 *         matchReason:
 *           type: array
 *           items:
 *             type: string
 *           description: Reasons for the match
 *         isViewed:
 *           type: boolean
 *           description: Whether the recommendation has been viewed
 *         isSaved:
 *           type: boolean
 *           description: Whether the recommendation has been saved
 *         hasApplied:
 *           type: boolean
 *           description: Whether the candidate has applied to this job
 *         status:
 *           $ref: '#/components/schemas/CandidateRecommendationStatusEnum'
 *         feedback:
 *           $ref: '#/components/schemas/ICandidateRecommendationFeedback'
 *         jobPosting:
 *           type: object
 *           description: Job posting details
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the recommendation was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the recommendation was last updated
 */
export interface ICandidateRecommendation {
  id: string;
  candidateId: string;
  jobPostingId: string;
  score: number;
  matchReason: string[];
  isViewed: boolean;
  isSaved: boolean;
  hasApplied: boolean;
  status: CandidateRecommendationStatusEnum;
  feedback?: ICandidateRecommendationFeedback;
  jobPosting?: any; // Job posting details
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateRecommendationFeedback:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the feedback
 *         candidateRecommendationId:
 *           type: string
 *           format: uuid
 *           description: ID of the recommendation
 *         type:
 *           $ref: '#/components/schemas/CandidateRecommendationFeedbackTypeEnum'
 *         comment:
 *           type: string
 *           description: Additional comment about the feedback
 *         isHelpful:
 *           type: boolean
 *           description: Whether the recommendation was helpful
 *         reason:
 *           type: string
 *           description: Additional context for the feedback
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the feedback was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the feedback was last updated
 */
export interface ICandidateRecommendationFeedback {
  id: string;
  candidateRecommendationId: string;
  type: CandidateRecommendationFeedbackTypeEnum;
  comment?: string;
  isHelpful: boolean;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateRecommendationFilterQuery:
 *       type: object
 *       description: Filter options for candidate recommendations
 *       properties:
 *         candidateId:
 *           type: string
 *           format: uuid
 *           description: Filter by candidate ID
 *         jobPostingId:
 *           type: string
 *           format: uuid
 *           description: Filter by specific job posting
 *         status:
 *           $ref: '#/components/schemas/CandidateRecommendationStatusEnum'
 *         minScore:
 *           type: number
 *           format: float
 *           minimum: 0
 *           maximum: 1
 *           description: Minimum match score filter
 *         maxScore:
 *           type: number
 *           format: float
 *           minimum: 0
 *           maximum: 1
 *           description: Maximum match score filter
 *         isViewed:
 *           type: boolean
 *           description: Filter by viewed status
 *         isSaved:
 *           type: boolean
 *           description: Filter by saved status
 *         hasApplied:
 *           type: boolean
 *           description: Filter by application status
 *         industry:
 *           type: string
 *           description: Filter by job industry
 *         location:
 *           type: string
 *           description: Filter by job location
 *         jobType:
 *           type: string
 *           description: Filter by job type
 *         createdAfter:
 *           type: string
 *           format: date-time
 *           description: Filter recommendations created after this date
 *         createdBefore:
 *           type: string
 *           format: date-time
 *           description: Filter recommendations created before this date
 */
export interface ICandidateRecommendationFilterQuery {
  candidateId?: string;
  jobPostingId?: string;
  status?: CandidateRecommendationStatusEnum;
  minScore?: number;
  maxScore?: number;
  isViewed?: boolean;
  isSaved?: boolean;
  hasApplied?: boolean;
  industry?: string;
  location?: string;
  jobType?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateRecommendationIdParams:
 *       type: object
 *       description: Parameters for candidate recommendation by ID
 *       properties:
 *         candidateId:
 *           type: string
 *           format: uuid
 *           description: Candidate ID
 *         recommendationId:
 *           type: string
 *           format: uuid
 *           description: Recommendation ID
 *       required:
 *         - candidateId
 *         - recommendationId
 */
export interface ICandidateRecommendationIdParams {
  recommendationId: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IGetCandidateRecommendedJobsParams:
 *       type: object
 *       description: Parameters for getting candidate recommended jobs
 *       properties:
 *         candidateId:
 *           type: string
 *           format: uuid
 *           description: Candidate ID
 */
export interface IGetCandidateRecommendedJobsParams {
  candidateId: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateRecommendationReject:
 *       type: object
 *       description: Data for rejecting a candidate recommendation
 *       properties:
 *         feedbackType:
 *           $ref: '#/components/schemas/CandidateRecommendationFeedbackTypeEnum'
 *         comment:
 *           type: string
 *           description: Optional comment about why the recommendation was rejected
 *           maxLength: 1000
 *         reason:
 *           type: string
 *           description: Additional context for the rejection
 *           maxLength: 500
 *         isHelpful:
 *           type: boolean
 *           description: Whether the recommendation was helpful even if rejected
 *           default: false
 *       required:
 *         - feedbackType
 */
export interface ICandidateRecommendationReject {
  feedbackType: CandidateRecommendationFeedbackTypeEnum;
  comment?: string;
  reason?: string;
  isHelpful?: boolean;
}

// Transform database model to domain model
export const toCandidateRecommendationDomain = (
  data: any
): ICandidateRecommendation => {
  return {
    id: data.id,
    candidateId: data.candidateId,
    jobPostingId: data.jobPostingId,
    score: data.score,
    matchReason: data.matchReason,
    isViewed: data.isViewed,
    isSaved: data.isSaved,
    hasApplied: data.hasApplied,
    status: data.status as CandidateRecommendationStatusEnum,
    feedback: data.feedback
      ? toCandidateRecommendationFeedbackDomain(data.feedback)
      : undefined,
    jobPosting: data.jobPosting,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
};

export const toCandidateRecommendationFeedbackDomain = (
  data: any
): ICandidateRecommendationFeedback => {
  return {
    id: data.id,
    candidateRecommendationId: data.candidateRecommendationId,
    type: data.type as CandidateRecommendationFeedbackTypeEnum,
    comment: data.comment,
    isHelpful: data.isHelpful,
    reason: data.reason,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
};
