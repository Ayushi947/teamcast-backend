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
 *     IClientJobApplication:
 *       type: object
 *       description: Domain model representing a client application
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
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID of the user who applied
 *         status:
 *           $ref: '#/components/schemas/ApplicationStatusEnum'
 *           description: Current status of the application
 *         coverLetter:
 *           type: string
 *           description: Cover letter submitted with the application
 *         resumeUrl:
 *           type: string
 *           description: URL to the resume
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
 *         - userId
 *         - status
 *         - createdAt
 *         - updatedAt
 */
export interface IClientJobApplication {
  id: string;
  jobId: string;
  companyName: string;
  jobTitle: string;
  userId: string;
  candidate?: ICandidateProfile;
  status: ApplicationStatusEnum;
  coverLetter?: string;
  resumeUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  jobInvite?: {
    id: string;
    status: string; // JobInviteStatusEnum
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
  };
}

/**
 * @openapi
 * components:
 *   parameters:
 *     IClientJobApplicationFilterQueryJobId:
 *       in: query
 *       name: jobId
 *       required: false
 *       schema:
 *         type: string
 *         format: uuid
 *         description: Filter by job ID
 *     IClientJobApplicationFilterQueryUserId:
 *       in: query
 *       name: userId
 *       required: false
 *       schema:
 *         type: string
 *         format: uuid
 *         description: Filter by user ID
 *     IClientJobApplicationFilterQueryStatus:
 *       in: query
 *       name: status
 *       required: false
 *       schema:
 *         $ref: '#/components/schemas/ApplicationStatusEnum'
 *         description: Filter by application status
 *     IClientJobApplicationFilterQuerySearch:
 *       in: query
 *       name: search
 *       required: false
 *       schema:
 *         type: string
 *         description: Search term to filter applications by candidate name, email, job title, or company name
 */
export interface IClientJobApplicationFilterQuery {
  jobId?: string;
  userId?: string;
  status?: ApplicationStatusEnum | ApplicationStatusEnum[];
  search?: string;
}

/**
 * @openapi
 * components:
 *   parameters:
 *     IClientJobApplicationIdParams:
 *       in: path
 *       name: applicationId
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *         description: ID of the application
 */
export interface IClientJobApplicationIdParams {
  applicationId: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobApplicationStatusUpdate:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           $ref: '#/components/schemas/ApplicationStatusEnum'
 *           description: New status for the application
 *         notes:
 *           type: string
 *           description: Optional notes about the status change
 *           maxLength: 1000
 */
export interface IClientJobApplicationStatusUpdate {
  status: ApplicationStatusEnum;
  notes?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobApplicationHireRequestResponse:
 *       type: object
 *       description: Response for hire request processing
 *       properties:
 *         message:
 *           type: string
 *           description: Success message for hire request processing
 *           example: "Hire request processed successfully. Account manager has been notified."
 *       required:
 *         - message
 */
export interface IClientJobApplicationHireRequestResponse {
  message: string;
}

/**
 * Helper function to convert database models to domain models
 */
export function toClientApplicationDomain(
  application: any
): IClientJobApplication {
  // Transform candidate profile if candidate exists
  let candidate: ICandidateProfile | undefined;
  if (application.candidate) {
    candidate = toCandidateProfileDomain(
      application.candidate.user || {},
      application.candidate
    );
    // Ensure user and resume objects are included for frontend access
    candidate.user = application.candidate.user;
    candidate.resume = application.candidate.resume;
  }

  return {
    id: application.id,
    jobId: application.jobPostingId,
    companyName: application?.jobPosting?.client?.company?.name,
    jobTitle: application?.jobPosting?.title,
    userId: application.candidateId,
    candidate,
    status: application.status,
    coverLetter: application.coverLetterUrl,
    resumeUrl: application.resumeUrl,
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,

    // Include job invite information if available
    jobInvite: application.jobInvite
      ? {
          id: application.jobInvite.id,
          status: application.jobInvite.status,
          expiresAt: application.jobInvite.expiresAt,
          createdAt: application.jobInvite.createdAt,
          updatedAt: application.jobInvite.updatedAt,
        }
      : undefined,
  };
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobApplicationAiAssessment:
 *       type: object
 *       description: Domain model representing an AI assessment for a job application
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
 *             $ref: '#/components/schemas/IClientJobApplicationAiAssessmentSection'
 *           description: Assessment sections
 */
export interface IClientJobApplicationAiAssessment {
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
  sections: IClientJobApplicationAiAssessmentSection[];
  progressState?: IClientJobApplicationAiAssessmentProgress;
  videoAnalysis?: IClientJobApplicationAiAssessmentVideoAnalysis;
  proctoring?: IClientJobApplicationAiAssessmentProctoring;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobApplicationAiAssessmentSection:
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
 *             $ref: '#/components/schemas/IClientJobApplicationAiAssessmentQuestion'
 *           description: Questions in this section
 *         videoAnalysis:
 *           $ref: '#/components/schemas/IClientJobApplicationAiAssessmentVideoAnalysis'
 *           description: Video analysis results for this section
 *         proctoring:
 *           $ref: '#/components/schemas/IClientJobApplicationAiAssessmentProctoring'
 *           description: Proctoring results for this section
 *         progressState:
 *           $ref: '#/components/schemas/IClientJobApplicationAiAssessmentProgress'
 *           description: Progress state for this section
 */
export interface IClientJobApplicationAiAssessmentSection {
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
  questions: IClientJobApplicationAiAssessmentQuestion[];
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobApplicationAiAssessmentQuestion:
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
export interface IClientJobApplicationAiAssessmentQuestion {
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
 * @openapi
 * components:
 *   schemas:
 *     IClientJobApplicationAiAssessmentProgress:
 *       type: object
 *       description: Progress tracking for an AI assessment
 *       properties:
 *         currentSectionId:
 *           type: string
 *           format: uuid
 *           description: ID of the current section being attempted
 *         currentQuestionId:
 *           type: string
 *           format: uuid
 *           description: ID of the current question being attempted
 *         lastSavedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of the last saved progress
 *         progressData:
 *           type: object
 *           description: Complete state of the assessment
 *         isCompleted:
 *           type: boolean
 *           description: Whether the assessment is completed
 */
export interface IClientJobApplicationAiAssessmentProgress {
  currentSectionId?: string;
  currentQuestionId?: string;
  lastSavedAt: Date;
  progressData?: any;
  isCompleted: boolean;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobApplicationAiAssessmentVideoAnalysis:
 *       type: object
 *       description: Video analysis results for an AI assessment
 *       properties:
 *         videoUrl:
 *           type: string
 *           description: URL to the recorded assessment
 *         transcriptText:
 *           type: string
 *           description: Full transcript of the assessment
 *         strengths:
 *           type: array
 *           items:
 *             type: string
 *           description: List of strengths identified
 *         areasForImprovement:
 *           type: array
 *           items:
 *             type: string
 *           description: List of areas for improvement
 */
export interface IClientJobApplicationAiAssessmentVideoAnalysis {
  videoUrl?: string;
  highlightsVideoUrl?: string;
  transcriptText?: string;
  strengths: string[];
  areasForImprovement: string[];
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobApplicationAiAssessmentProctoring:
 *       type: object
 *       description: Proctoring results for an AI assessment
 *       properties:
 *         warningCount:
 *           type: integer
 *           description: Number of warnings issued
 *         suspiciousEvents:
 *           type: object
 *           description: Log of suspicious events with timestamps
 *         tabSwitches:
 *           type: integer
 *           description: Number of browser tab switches
 *         copyPasteAttempts:
 *           type: integer
 *           description: Number of copy-paste attempts
 *         multiplePersonsDetected:
 *           type: boolean
 *           description: Whether multiple persons were detected
 *         audioIrregularities:
 *           type: boolean
 *           description: Whether audio irregularities were detected
 *         screenShareViolations:
 *           type: boolean
 *           description: Whether screen share violations occurred
 *         automaticallyFailed:
 *           type: boolean
 *           description: Whether the assessment was automatically failed
 *         manualReviewRequired:
 *           type: boolean
 *           description: Whether manual review is required
 *         reviewerNotes:
 *           type: string
 *           description: Notes from the reviewer
 */
export interface IClientJobApplicationAiAssessmentProctoring {
  warningCount: number;
  suspiciousEvents?: any;
  tabSwitches: number;
  copyPasteAttempts: number;
  multiplePersonsDetected: boolean;
  audioIrregularities: boolean;
  screenShareViolations: boolean;
  automaticallyFailed: boolean;
  manualReviewRequired: boolean;
  reviewerNotes?: string;
}

/**
 * Helper function to convert database models to domain models
 */
export function toIClientJobApplicationAiAssessment(
  assessment: any
): IClientJobApplicationAiAssessment {
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
    progressState: assessment.progressState
      ? {
          currentSectionId:
            assessment.progressState.currentSectionId || undefined,
          currentQuestionId:
            assessment.progressState.currentQuestionId || undefined,
          lastSavedAt: assessment.progressState.lastSavedAt,
          progressData: assessment.progressState.progressData || undefined,
          isCompleted: assessment.progressState.isCompleted,
        }
      : undefined,
    videoAnalysis: assessment.videoAnalysis
      ? {
          videoUrl: assessment.videoAnalysis.videoUrl || undefined,
          highlightsVideoUrl:
            assessment.videoAnalysis.highlightsVideoUrl || undefined,
          transcriptText: assessment.videoAnalysis.transcriptText || undefined,
          strengths: assessment.videoAnalysis.strengths,
          areasForImprovement: assessment.videoAnalysis.areasForImprovement,
        }
      : undefined,
    proctoring: assessment.proctoring
      ? {
          warningCount: assessment.proctoring.warningCount,
          suspiciousEvents: assessment.proctoring.suspiciousEvents || undefined,
          tabSwitches: assessment.proctoring.tabSwitches,
          copyPasteAttempts: assessment.proctoring.copyPasteAttempts,
          multiplePersonsDetected:
            assessment.proctoring.multiplePersonsDetected,
          audioIrregularities: assessment.proctoring.audioIrregularities,
          screenShareViolations: assessment.proctoring.screenShareViolations,
          automaticallyFailed: assessment.proctoring.automaticallyFailed,
          manualReviewRequired: assessment.proctoring.manualReviewRequired,
          reviewerNotes: assessment.proctoring.reviewerNotes || undefined,
        }
      : undefined,
  };
}
