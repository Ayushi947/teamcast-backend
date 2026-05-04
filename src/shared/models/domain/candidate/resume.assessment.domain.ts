import {
  ResumeAssessmentTaskStatusEnum,
  ResumeAssessmentResultEnum,
  ResumeAssessmentRecommendationEnum,
  ResumeAssessmentStatusEnum,
} from '../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeAssessmentTask:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The task ID
 *         status:
 *           $ref: '#/components/schemas/ResumeAssessmentTaskStatusEnum'
 *         error:
 *           type: string
 *           description: Error message if task failed
 *         resumeText:
 *           type: string
 *           description: The text content of the resume
 *         assessment:
 *           $ref: '#/components/schemas/IResumeAssessment'
 *           description: The assessment result if completed
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
export interface IResumeAssessmentTask {
  id: string;
  resumeId: string;
  status: ResumeAssessmentTaskStatusEnum;
  error?: string;
  assessmentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeAssessment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The assessment ID
 *         candidateId:
 *           type: string
 *           description: The candidate ID
 *         status:
 *           $ref: '#/components/schemas/ResumeAssessmentStatusEnum'
 *         result:
 *           $ref: '#/components/schemas/ResumeAssessmentResultEnum'
 *         score:
 *           type: number
 *           description: Overall score of the assessment
 *         confidenceScore:
 *           type: number
 *           description: Confidence score of the assessment
 *         resumeText:
 *           type: string
 *           description: The text content of the resume
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
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *           description: List of skills identified in the resume
 *         technicalSkills:
 *           type: array
 *           items:
 *             type: string
 *           description: List of technical skills
 *         softSkills:
 *           type: array
 *           items:
 *             type: string
 *           description: List of soft skills
 *         industriesFit:
 *           type: array
 *           items:
 *             type: string
 *           description: Industries the candidate fits into
 *         jobRolesFit:
 *           type: array
 *           items:
 *             type: string
 *           description: Job roles the candidate fits into
 *         experienceSummary:
 *           type: string
 *           description: Summary of work experience
 *         educationSummary:
 *           type: string
 *           description: Summary of education
 *         yearsOfExperience:
 *           type: number
 *           description: Total years of experience
 *         overallFeedback:
 *           type: string
 *           description: Overall feedback on the resume
 *         recommendation:
 *           $ref: '#/components/schemas/ResumeAssessmentRecommendationEnum'
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
export interface IResumeAssessment {
  id: string;
  candidateId: string;
  status: ResumeAssessmentStatusEnum;
  result: ResumeAssessmentResultEnum;
  score: number;
  confidenceScore: number;
  resumeText: string;

  strengths: string[];
  areasForImprovement: string[];

  experienceSummary?: string;
  educationSummary?: string;

  skills: string[];
  technicalSkills: string[];
  softSkills: string[];
  industriesFit: string[];
  jobRolesFit: string[];

  yearsOfExperience?: number;
  overallFeedback?: string;
  recommendation?: ResumeAssessmentRecommendationEnum;

  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Helper function to convert database model to domain model
 */
export function toResumeAssessmentTaskDomain(task: any): IResumeAssessmentTask {
  return {
    id: task.id,
    resumeId: task.resumeId,
    status: task.status as ResumeAssessmentTaskStatusEnum,
    error: task.error,
    assessmentId: task.assessmentId,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

/**
 * Helper function to convert database model to domain model
 */
export function toResumeAssessmentDomain(assessment: any): IResumeAssessment {
  return {
    id: assessment.id,
    candidateId: assessment.candidateId,
    status: assessment.status as ResumeAssessmentStatusEnum,
    result: assessment.result as ResumeAssessmentResultEnum,
    score: assessment.score,
    confidenceScore: assessment.confidenceScore,
    resumeText: assessment.resumeText,
    strengths: assessment.strengths,
    areasForImprovement: assessment.areasForImprovement,
    skills: assessment.skills,
    technicalSkills: assessment.technicalSkills,
    softSkills: assessment.softSkills,
    industriesFit: assessment.industriesFit,
    jobRolesFit: assessment.jobRolesFit,
    experienceSummary: assessment.experienceSummary,
    educationSummary: assessment.educationSummary,
    yearsOfExperience: assessment.yearsOfExperience,
    overallFeedback: assessment.overallFeedback,
    recommendation:
      assessment.recommendation as ResumeAssessmentRecommendationEnum,
    startedAt: assessment.startedAt,
    completedAt: assessment.completedAt,
    createdAt: assessment.createdAt,
    updatedAt: assessment.updatedAt,
  };
}
