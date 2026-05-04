import {
  JobRecommendationStatusEnum,
  JobRecommendationFeedbackTypeEnum,
} from '../../common/enums';
import {
  IResume,
  IResumeEducation,
  IResumeCertification,
  IResumeExperience,
} from '../candidate/resume.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPostingRecommendation:
 *       type: object
 *       description: Domain model representing a job posting recommendation
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the recommendation
 *         jobPostingId:
 *           type: string
 *           format: uuid
 *           description: ID of the job posting
 *         candidateId:
 *           type: string
 *           format: uuid
 *           description: ID of the candidate
 *         score:
 *           type: number
 *           minimum: 0
 *           maximum: 1
 *           description: Match score between 0-1
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
 *         isInvited:
 *           type: boolean
 *           description: Whether the candidate has been invited
 *         status:
 *           $ref: '#/components/schemas/JobRecommendationStatusEnum'
 *         feedback:
 *           $ref: '#/components/schemas/IJobRecommendationFeedback'
 *         candidate:
 *           type: object
 *           description: Detailed candidate information including education, certifications, and work experience
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 *             email:
 *               type: string
 *               format: email
 *             profilePicture:
 *               type: string
 *               nullable: true
 *             skills:
 *               type: array
 *               items:
 *                 type: string
 *             experience:
 *               type: number
 *               description: Years of experience
 *             currentLocation:
 *               type: string
 *               nullable: true
 *             expectedSalary:
 *               type: number
 *               nullable: true
 *             education:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IResumeEducation'
 *               description: Educational background
 *             certifications:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IResumeCertification'
 *               description: Professional certifications
 *             workExperience:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IResumeExperience'
 *               description: Work experience with projects and achievements
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - id
 *         - jobPostingId
 *         - candidateId
 *         - score
 *         - matchReason
 *         - isViewed
 *         - isSaved
 *         - isInvited
 *         - status
 *         - createdAt
 *         - updatedAt
 */
export interface IJobPostingRecommendation {
  id: string;
  jobPostingId: string;
  candidateId: string;
  score: number;
  matchReason: string[];
  isViewed: boolean;
  resume: IResume;
  isSaved: boolean;
  isInvited: boolean;
  status: JobRecommendationStatusEnum;
  feedback?: IJobRecommendationFeedback;
  candidate?: {
    id: string;
    name: string;
    email: string;
    profilePicture?: string;
    skills?: string[];
    experience?: number;
    currentLocation?: string;
    expectedSalary?: number;
    education?: IResumeEducation[];
    certifications?: IResumeCertification[];
    workExperience?: IResumeExperience[];
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobRecommendationFeedback:
 *       type: object
 *       description: Domain model representing job recommendation feedback
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the feedback
 *         jobRecommendationId:
 *           type: string
 *           format: uuid
 *           description: ID of the job recommendation
 *         type:
 *           $ref: '#/components/schemas/JobRecommendationFeedbackTypeEnum'
 *         comment:
 *           type: string
 *           description: Optional comment about the feedback
 *           nullable: true
 *         isHelpful:
 *           type: boolean
 *           description: Whether the feedback is helpful
 *         reason:
 *           type: string
 *           description: Additional context for the feedback
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - id
 *         - jobRecommendationId
 *         - type
 *         - isHelpful
 *         - createdAt
 *         - updatedAt
 */
export interface IJobRecommendationFeedback {
  id: string;
  jobRecommendationId: string;
  type: JobRecommendationFeedbackTypeEnum;
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
 *     IJobPostingRecommendationFilterQuery:
 *       type: object
 *       description: Filter options for job posting recommendations
 *       properties:
 *         jobPostingId:
 *           type: string
 *           format: uuid
 *           description: Filter by job posting ID
 *         candidateId:
 *           type: string
 *           format: uuid
 *           description: Filter by candidate ID
 *         status:
 *           $ref: '#/components/schemas/JobRecommendationStatusEnum'
 *         minScore:
 *           type: number
 *           minimum: 0
 *           maximum: 1
 *           description: Minimum match score
 *         maxScore:
 *           type: number
 *           minimum: 0
 *           maximum: 1
 *           description: Maximum match score
 *         isViewed:
 *           type: boolean
 *           description: Filter by viewed status
 *         isSaved:
 *           type: boolean
 *           description: Filter by saved status
 *         isInvited:
 *           type: boolean
 *           description: Filter by invited status
 */
export interface IJobPostingRecommendationFilterQuery {
  jobPostingId?: string;
  candidateId?: string;
  status?: JobRecommendationStatusEnum;
  minScore?: number;
  maxScore?: number;
  isViewed?: boolean;
  isSaved?: boolean;
  isInvited?: boolean;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPostingRecommendationIdParams:
 *       type: object
 *       description: Parameters for job posting recommendation by ID
 *       properties:
 *         jobPostingId:
 *           type: string
 *           format: uuid
 *           description: Job posting ID
 *         recommendationId:
 *           type: string
 *           format: uuid
 *           description: Recommendation ID
 *       required:
 *         - jobPostingId
 *         - recommendationId
 */
export interface IJobPostingRecommendationIdParams {
  jobPostingId: string;
  recommendationId: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobRecommendationReject:
 *       type: object
 *       description: Data for rejecting a job recommendation
 *       properties:
 *         feedbackType:
 *           $ref: '#/components/schemas/JobRecommendationFeedbackTypeEnum'
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
export interface IJobRecommendationReject {
  feedbackType: JobRecommendationFeedbackTypeEnum;
  comment?: string;
  reason?: string;
  isHelpful?: boolean;
}

// Transform database model to domain model
export const toJobPostingRecommendationDomain = (
  data: any
): IJobPostingRecommendation => {
  return {
    id: data.id,
    jobPostingId: data.jobPostingId,
    candidateId: data.candidateId,
    score: data.score,
    matchReason: data.matchReason,
    isViewed: data.isViewed,
    isSaved: data.isSaved,
    resume: data.candidate.resume,
    isInvited: data.isInvited,
    status: data.status as JobRecommendationStatusEnum,
    feedback: data.feedback
      ? toJobRecommendationFeedbackDomain(data.feedback)
      : undefined,
    candidate: data.candidate
      ? {
          id: data.candidate.id,
          name: data.candidate.user?.name || '',
          email: data.candidate.user?.email || '',
          profilePicture: data.candidate.user?.image,
          skills: data.candidate.resume?.resumeSkills || [],
          experience: data.candidate.resume?.totalExperience,
          currentLocation: data.candidate.resume?.currentWorkLocation,
          expectedSalary: data.candidate.resume?.currentSalary,
          education: data.candidate.resume?.education || [],
          certifications: data.candidate.resume?.certifications || [],
          workExperience: data.candidate.resume?.experience || [],
        }
      : undefined,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
};

// Transform database model to domain model for feedback
export const toJobRecommendationFeedbackDomain = (
  data: any
): IJobRecommendationFeedback => {
  return {
    id: data.id,
    jobRecommendationId: data.jobRecommendationId,
    type: data.type as JobRecommendationFeedbackTypeEnum,
    comment: data.comment,
    isHelpful: data.isHelpful,
    reason: data.reason,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
};
