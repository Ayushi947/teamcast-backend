import {
  AiAssessmentSectionResultEnum,
  AiAssessmentSectionStatusEnum,
  ApplicationStatusEnum,
} from '../../common/enums';
import {
  AiAssessmentStatusEnum,
  AiAssessmentResultEnum,
  AiAssessmentRecommendationEnum,
} from '../../common/enums';
import { QuestionTypeEnum } from '../../common/enums';
import {
  ICandidateProfile,
  toCandidateProfileDomain,
} from '../candidate/profile.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportJobApplication:
 *       type: object
 *       description: Domain model representing a support application (accepted applications)
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the application
 *         jobId:
 *           type: string
 *           format: uuid
 *           description: ID of the job posting
 *         companyName:
 *           type: string
 *           description: Name of the company that posted the job
 *         jobTitle:
 *           type: string
 *           description: Title of the job posting
 *         candidateId:
 *           type: string
 *           format: uuid
 *           description: ID of the candidate who applied
 *         candidate:
 *           $ref: '#/components/schemas/ICandidateProfile'
 *           description: Candidate profile information
 *         clientId:
 *           type: string
 *           format: uuid
 *           description: ID of the client company
 *         clientName:
 *           type: string
 *           description: Name of the client company
 *         partnerId:
 *           type: string
 *           format: uuid
 *           description: ID of the partner (if application was submitted by partner)
 *         partnerName:
 *           type: string
 *           description: Name of the partner company
 *         status:
 *           $ref: '#/components/schemas/ApplicationStatusEnum'
 *           description: Current status of the application (should be ACCEPTED)
 *         coverLetter:
 *           type: string
 *           description: Cover letter submitted with the application
 *         resumeUrl:
 *           type: string
 *           description: URL to the resume
 *         appliedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the application was submitted
 *         acceptedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the application was accepted
 *         acceptedBy:
 *           type: string
 *           description: Who accepted the application (CLIENT or CANDIDATE)
 *         acceptanceNote:
 *           type: string
 *           description: Notes about the acceptance
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the application was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the application was last updated
 *       required:
 *         - id
 *         - jobId
 *         - candidateId
 *         - status
 *         - appliedAt
 *         - acceptedAt
 *         - createdAt
 *         - updatedAt
 */
export interface ISupportJobApplication {
  id: string;
  jobId: string;
  companyName: string;
  jobTitle: string;
  candidateId: string;
  candidate?: ICandidateProfile;
  clientId: string;
  clientName: string;
  partnerId?: string;
  partnerName?: string;
  status: ApplicationStatusEnum;
  coverLetter?: string;
  resumeUrl?: string;
  appliedAt: Date;
  acceptedAt?: Date;
  acceptedBy?: string;
  acceptanceNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   parameters:
 *     ISupportJobApplicationFilterQueryJobId:
 *       in: query
 *       name: jobId
 *       required: false
 *       schema:
 *         type: string
 *         format: uuid
 *         description: Filter by job ID
 *     ISupportJobApplicationFilterQueryCandidateId:
 *       in: query
 *       name: candidateId
 *       required: false
 *       schema:
 *         type: string
 *         format: uuid
 *         description: Filter by candidate ID
 *     ISupportJobApplicationFilterQueryClientId:
 *       in: query
 *       name: clientId
 *       required: false
 *       schema:
 *         type: string
 *         format: uuid
 *         description: Filter by client ID
 *     ISupportJobApplicationFilterQueryPartnerId:
 *       in: query
 *       name: partnerId
 *       required: false
 *       schema:
 *         type: string
 *         format: uuid
 *         description: Filter by partner ID
 *     ISupportJobApplicationFilterQueryDateFrom:
 *       in: query
 *       name: dateFrom
 *       required: false
 *       schema:
 *         type: string
 *         format: date
 *         description: Filter by acceptance date from (YYYY-MM-DD)
 *     ISupportJobApplicationFilterQueryDateTo:
 *       in: query
 *       name: dateTo
 *       required: false
 *       schema:
 *         type: string
 *         format: date
 *         description: Filter by acceptance date to (YYYY-MM-DD)
 *     ISupportJobApplicationFilterQuerySearch:
 *       in: query
 *       name: search
 *       required: false
 *       schema:
 *         type: string
 *         description: Search term to filter applications by candidate name, email, job title, or company name
 */
export interface ISupportJobApplicationFilterQuery {
  jobId?: string;
  candidateId?: string;
  clientId?: string;
  partnerId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

/**
 * @openapi
 * components:
 *   parameters:
 *     ISupportJobApplicationIdParams:
 *       in: path
 *       name: applicationId
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *         description: ID of the application
 */
export interface ISupportJobApplicationIdParams {
  applicationId: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportJobApplicationStatistics:
 *       type: object
 *       description: Conversion statistics for support dashboard
 *       properties:
 *         totalAccepted:
 *           type: integer
 *           description: Total number of accepted applications
 *         totalApplications:
 *           type: integer
 *           description: Total number of applications
 *         conversionRate:
 *           type: number
 *           format: float
 *           description: Conversion rate percentage
 *       required:
 *         - totalAccepted
 *         - totalApplications
 *         - conversionRate
 */
export interface ISupportJobApplicationStatistics {
  totalAccepted: number;
  totalApplications: number;
  conversionRate: number;
}

/**
 * @openapi
 * components:
 *   parameters:
 *     ISupportJobApplicationStatisticsQueryDateFrom:
 *       in: query
 *       name: dateFrom
 *       required: false
 *       schema:
 *         type: string
 *         format: date
 *         description: Filter statistics by date from (YYYY-MM-DD)
 *     ISupportJobApplicationStatisticsQueryDateTo:
 *       in: query
 *       name: dateTo
 *       required: false
 *       schema:
 *         type: string
 *         format: date
 *         description: Filter statistics by date to (YYYY-MM-DD)
 */
export interface ISupportJobApplicationStatisticsQuery {
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Helper function to convert database models to domain models
 */
export function toSupportApplicationDomain(
  application: any
): ISupportJobApplication {
  // Transform candidate profile if candidate exists
  let candidate: ICandidateProfile | undefined;
  if (application.candidate) {
    candidate = toCandidateProfileDomain(
      application.candidate.user || {},
      application.candidate
    );
    // Ensure user and resume objects are included for frontend access
    // This ensures the frontend can access candidate.user.image
    if (application.candidate.user) {
      candidate.user = application.candidate.user;
    }
    if (application.candidate.resume) {
      candidate.resume = application.candidate.resume;
    }
  }

  return {
    id: application.id,
    jobId: application.jobPostingId,
    companyName: application?.jobPosting?.client?.company?.name,
    jobTitle: application?.jobPosting?.title,
    candidateId: application.candidateId,
    candidate,
    clientId: application?.jobPosting?.clientId,
    clientName: application?.jobPosting?.client?.company?.name,
    partnerId: application.partnerId,
    partnerName: application?.partner?.company?.name,
    status: application.status,
    coverLetter: application.coverLetterUrl,
    resumeUrl: application.resumeUrl,
    appliedAt: application.appliedAt,
    acceptedAt: application.acceptedAt,
    acceptedBy: application.acceptedBy,
    acceptanceNote: application.acceptanceNote,
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
  };
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportJobApplicationAiAssessment:
 *       type: object
 *       description: Domain model representing an AI assessment for a support job application
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the assessment
 *         status:
 *           $ref: '#/components/schemas/AiAssessmentStatusEnum'
 *           description: Current status of the assessment
 *         result:
 *           $ref: '#/components/schemas/AiAssessmentResultEnum'
 *           description: Result of the assessment
 *         score:
 *           type: number
 *           format: float
 *           description: Overall score of the assessment
 *         startedAt:
 *           type: string
 *           format: date-time
 *           description: When the assessment was started
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: When the assessment was completed
 *         duration:
 *           type: integer
 *           description: Duration of the assessment in seconds
 *         overallFeedback:
 *           type: string
 *           description: Overall feedback for the assessment
 *         recommendation:
 *           $ref: '#/components/schemas/AiAssessmentRecommendationEnum'
 *           description: AI recommendation status
 *         selectedForNextRound:
 *           type: boolean
 *           description: Whether candidate was selected for next round
 *         strengths:
 *           type: array
 *           items:
 *             type: string
 *           description: List of candidate's strengths
 *         areasForImprovement:
 *           type: array
 *           items:
 *             type: string
 *           description: Areas where candidate can improve
 *         sections:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ISupportJobApplicationAiAssessmentSection'
 *           description: Assessment sections
 */
export interface ISupportJobApplicationAiAssessment {
  id: string;
  status: AiAssessmentStatusEnum;
  result: AiAssessmentResultEnum;
  score: number;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  overallFeedback?: string;
  recommendation?: AiAssessmentRecommendationEnum;
  selectedForNextRound: boolean;
  strengths: string[];
  areasForImprovement: string[];
  sections: ISupportJobApplicationAiAssessmentSection[];
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportJobApplicationAiAssessmentSection:
 *       type: object
 *       description: A section within an AI assessment
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the section
 *         title:
 *           type: string
 *           description: Title of the section
 *         description:
 *           type: string
 *           description: Description of the section
 *         type:
 *           type: string
 *           description: Type of section
 *         status:
 *           $ref: '#/components/schemas/AiAssessmentSectionStatusEnum'
 *           description: Status of the section
 *         result:
 *           $ref: '#/components/schemas/AiAssessmentSectionResultEnum'
 *           description: Result of the section
 *         score:
 *           type: number
 *           format: float
 *           description: Score for this section
 *         order:
 *           type: integer
 *           description: Order of the section
 *         isRequired:
 *           type: boolean
 *           description: Whether this section is required
 *         passThreshold:
 *           type: number
 *           format: float
 *           description: Score threshold to pass this section
 *         startedAt:
 *           type: string
 *           format: date-time
 *           description: When the section was started
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: When the section was completed
 *         feedback:
 *           type: string
 *           description: Feedback for this section
 *         strengths:
 *           type: array
 *           items:
 *             type: string
 *           description: Section-specific strengths
 *         areasForImprovement:
 *           type: array
 *           items:
 *             type: string
 *           description: Section-specific areas for improvement
 *         questions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ISupportJobApplicationAiAssessmentQuestion'
 *           description: Questions in this section
 */
export interface ISupportJobApplicationAiAssessmentSection {
  id: string;
  title: string;
  description: string;
  type: string;
  status: AiAssessmentSectionStatusEnum;
  result: AiAssessmentSectionResultEnum;
  score: number;
  order: number;
  isRequired: boolean;
  passThreshold: number;
  startedAt?: Date;
  completedAt?: Date;
  feedback?: string;
  strengths: string[];
  areasForImprovement: string[];
  questions: ISupportJobApplicationAiAssessmentQuestion[];
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportJobApplicationAiAssessmentQuestion:
 *       type: object
 *       description: A question within an AI assessment section
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the question
 *         question:
 *           type: string
 *           description: The question text
 *         questionType:
 *           $ref: '#/components/schemas/QuestionTypeEnum'
 *           description: Type of question
 *         options:
 *           type: object
 *           description: Options for multiple choice questions
 *         answerGiven:
 *           type: string
 *           description: Answer provided by the candidate
 *         correctAnswer:
 *           type: string
 *           description: Correct answer for the question
 *         score:
 *           type: number
 *           format: float
 *           description: Score for this question
 *         maxScore:
 *           type: number
 *           format: float
 *           description: Maximum possible score
 *         order:
 *           type: integer
 *           description: Order of the question
 *         isRequired:
 *           type: boolean
 *           description: Whether this question is required
 *         feedback:
 *           type: string
 *           description: Feedback for this question
 *         strengths:
 *           type: array
 *           items:
 *             type: string
 *           description: Question-specific strengths
 *         areasForImprovement:
 *           type: array
 *           items:
 *             type: string
 *           description: Question-specific areas for improvement
 */
export interface ISupportJobApplicationAiAssessmentQuestion {
  id: string;
  question: string;
  questionType: QuestionTypeEnum;
  options?: any;
  answerGiven?: string;
  correctAnswer?: string;
  score: number;
  maxScore: number;
  order: number;
  isRequired: boolean;
  feedback?: string;
  strengths: string[];
  areasForImprovement: string[];
}

/**
 * Helper function to convert database models to domain models
 */
export function toISupportJobApplicationAiAssessment(
  assessment: any
): ISupportJobApplicationAiAssessment {
  return {
    id: assessment.id,
    status: assessment.status as AiAssessmentStatusEnum,
    result: assessment.result as AiAssessmentResultEnum,
    score: assessment.score,
    startedAt: assessment.startedAt || undefined,
    completedAt: assessment.completedAt || undefined,
    duration: assessment.duration || undefined,
    overallFeedback: assessment.overallFeedback || undefined,
    recommendation:
      (assessment.recommendation as AiAssessmentRecommendationEnum) ||
      undefined,
    selectedForNextRound: assessment.selectedForNextRound,
    strengths: assessment.strengths,
    areasForImprovement: assessment.areasForImprovement,
    sections: assessment?.sections?.map((section: any) => ({
      id: section.id,
      title: section.title,
      description: section.description,
      type: section.type,
      status: section.status as AiAssessmentSectionStatusEnum,
      result: section.result as AiAssessmentSectionResultEnum,
      score: section.score,
      order: section.order,
      isRequired: section.isRequired,
      passThreshold: section.passThreshold,
      startedAt: section.startedAt || undefined,
      completedAt: section.completedAt || undefined,
      feedback: section.feedback || undefined,
      strengths: section.strengths,
      areasForImprovement: section.areasForImprovement,
      questions:
        section?.questions?.map((question: any) => ({
          id: question.id,
          question: question.question,
          questionType: question.questionType as QuestionTypeEnum,
          options: question.options || undefined,
          answerGiven: question.answerGiven || undefined,
          correctAnswer: question.correctAnswer || undefined,
          score: question.score,
          maxScore: question.maxScore,
          order: question.order,
          isRequired: question.isRequired,
          feedback: question.feedback || undefined,
          strengths: question.strengths,
          areasForImprovement: question.areasForImprovement,
        })) || [],
    })),
  };
}
