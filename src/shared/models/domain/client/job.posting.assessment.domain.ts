import {
  JobPostingAssessmentTaskStatusEnum,
  JobPostingAssessmentResultEnum,
  JobPostingAssessmentRecommendationEnum,
  JobPostingAssessmentStatusEnum,
} from '../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPostingAssessmentTask:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The task ID
 *         jobPostingId:
 *           type: string
 *           description: The job posting ID
 *         status:
 *           $ref: '#/components/schemas/JobPostingAssessmentTaskStatusEnum'
 *         error:
 *           type: string
 *           description: Error message if task failed
 *         assessmentId:
 *           type: string
 *           description: The assessment ID if completed
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
export interface IJobPostingAssessmentTask {
  id: string;
  jobPostingId: string;
  status: JobPostingAssessmentTaskStatusEnum;
  error?: string;
  assessmentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPostingAssessment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The assessment ID
 *         jobPostingId:
 *           type: string
 *           description: The job posting ID
 *         status:
 *           $ref: '#/components/schemas/JobPostingAssessmentStatusEnum'
 *         result:
 *           $ref: '#/components/schemas/JobPostingAssessmentResultEnum'
 *         score:
 *           type: number
 *           description: Overall score of the assessment
 *         confidenceScore:
 *           type: number
 *           description: Confidence score of the assessment
 *         jobPostingText:
 *           type: string
 *           description: The text content of the job posting
 *         strengths:
 *           type: array
 *           items:
 *             type: string
 *           description: List of identified strengths
 *         areasForImprovement:
 *           type: array
 *           items:
 *             type: string
 *           description: List of areas that need improvement
 *         overallFeedback:
 *           type: string
 *           description: Overall feedback on the job posting
 *         jobDescriptionQuality:
 *           type: string
 *           description: Analysis of job description quality
 *         requirementsClarity:
 *           type: string
 *           description: Analysis of requirements clarity
 *         compensationAnalysis:
 *           type: string
 *           description: Analysis of compensation structure
 *         identifiedSkills:
 *           type: array
 *           items:
 *             type: string
 *           description: List of skills identified in the job posting
 *         requiredSkills:
 *           type: array
 *           items:
 *             type: string
 *           description: List of required skills
 *         preferredSkills:
 *           type: array
 *           items:
 *             type: string
 *           description: List of preferred skills
 *         industryRelevance:
 *           type: array
 *           items:
 *             type: string
 *           description: Industries the job posting is relevant to
 *         roleClarity:
 *           type: array
 *           items:
 *             type: string
 *           description: Role clarity analysis
 *         titleQuality:
 *           type: number
 *           description: Quality score of the job title
 *         descriptionQuality:
 *           type: number
 *           description: Quality score of the job description
 *         requirementsQuality:
 *           type: number
 *           description: Quality score of the requirements
 *         compensationQuality:
 *           type: number
 *           description: Quality score of the compensation
 *         complianceIssues:
 *           type: array
 *           items:
 *             type: string
 *           description: List of compliance issues found
 *         diversityCompliance:
 *           type: boolean
 *           description: Whether the job posting meets diversity compliance
 *         legalCompliance:
 *           type: boolean
 *           description: Whether the job posting meets legal compliance
 *         recommendation:
 *           $ref: '#/components/schemas/JobPostingAssessmentRecommendationEnum'
 *           description: Recommendation based on assessment
 *         startedAt:
 *           type: string
 *           format: date-time
 *           description: When the assessment was started
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: When the assessment was completed
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
export interface IJobPostingAssessment {
  id: string;
  jobPostingId: string;
  status: JobPostingAssessmentStatusEnum;
  result: JobPostingAssessmentResultEnum;
  score: number;
  confidenceScore: number;
  jobPostingText: string;

  strengths: string[];
  areasForImprovement: string[];

  overallFeedback?: string;
  jobDescriptionQuality?: string;
  requirementsClarity?: string;
  compensationAnalysis?: string;

  identifiedSkills: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  industryRelevance: string[];
  roleClarity: string[];

  titleQuality?: number;
  descriptionQuality?: number;
  requirementsQuality?: number;
  compensationQuality?: number;

  complianceIssues: string[];
  diversityCompliance: boolean;
  legalCompliance: boolean;

  recommendation?: JobPostingAssessmentRecommendationEnum;

  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Helper function to convert database model to domain model
 */
export function toJobPostingAssessmentTaskDomain(
  task: any
): IJobPostingAssessmentTask {
  return {
    id: task.id,
    jobPostingId: task.jobPostingId,
    status: task.status as JobPostingAssessmentTaskStatusEnum,
    error: task.error,
    assessmentId: task.assessmentId,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

/**
 * Helper function to convert database model to domain model
 */
export function toJobPostingAssessmentDomain(
  assessment: any
): IJobPostingAssessment {
  return {
    id: assessment.id,
    jobPostingId: assessment.jobPostingId,
    status: assessment.status as JobPostingAssessmentStatusEnum,
    result: assessment.result as JobPostingAssessmentResultEnum,
    score: assessment.score,
    confidenceScore: assessment.confidenceScore,
    jobPostingText: assessment.jobPostingText,
    strengths: assessment.strengths,
    areasForImprovement: assessment.areasForImprovement,
    overallFeedback: assessment.overallFeedback,
    jobDescriptionQuality: assessment.jobDescriptionQuality,
    requirementsClarity: assessment.requirementsClarity,
    compensationAnalysis: assessment.compensationAnalysis,
    identifiedSkills: assessment.identifiedSkills,
    requiredSkills: assessment.requiredSkills,
    preferredSkills: assessment.preferredSkills,
    industryRelevance: assessment.industryRelevance,
    roleClarity: assessment.roleClarity,
    titleQuality: assessment.titleQuality,
    descriptionQuality: assessment.descriptionQuality,
    requirementsQuality: assessment.requirementsQuality,
    compensationQuality: assessment.compensationQuality,
    complianceIssues: assessment.complianceIssues,
    diversityCompliance: assessment.diversityCompliance,
    legalCompliance: assessment.legalCompliance,
    recommendation:
      assessment.recommendation as JobPostingAssessmentRecommendationEnum,
    startedAt: assessment.startedAt,
    completedAt: assessment.completedAt,
    createdAt: assessment.createdAt,
    updatedAt: assessment.updatedAt,
  };
}
