import {
  AiAssessmentRecommendationEnum,
  ApplicationStatusEnum,
  AiAssessmentResultEnum,
  AiAssessmentStatusEnum,
  QuestionTypeEnum,
  AiAssessmentSectionStatusEnum,
  AiAssessmentSectionResultEnum,
  JobAiAssessmentInviteStatusEnum,
} from '../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobApplication:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         candidateId:
 *           type: string
 *         jobPostingId:
 *           type: string
 *         status:
 *           $ref: '#/components/schemas/ApplicationStatusEnum'
 *         appliedAt:
 *           type: string
 *           format: date-time
 *         notes:
 *           type: string
 *         coverLetterUrl:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         jobPosting:
 *           $ref: '#/components/schemas/ICandidateJobPostingDetails'
 */
export interface ICandidateJobApplication {
  id: string;
  candidateId: string;
  jobPostingId: string;
  status: ApplicationStatusEnum;
  appliedAt: Date;
  notes?: string;
  coverLetterUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  jobPosting: ICandidateJobPostingDetails;
  aiAssessment?: {
    id: string;
    status: string;
    // Add other fields as needed
  };
  aiAssessmentInviteId?: string;
  jobInviteStatus?: string; // Status of the associated job_invite (PENDING, ACCEPTED, etc.)
  jobInviteId?: string; // ID of the associated job_invite
  declinedAt?: Date | null;
  declineReason?: string | null;
  acceptedAt?: Date | null;
  acceptanceNote?: string | null;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobPostingDetails:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         company:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             industry:
 *               type: string
 */
export interface ICandidateJobPostingDetails {
  id: string;
  title: string;
  description: string;
  company: {
    name: string;
    industry: string;
  };
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobApplicationUpdate:
 *       type: object
 *       properties:
 *         status:
 *           $ref: '#/components/schemas/ApplicationStatusEnum'
 *         notes:
 *           type: string
 *         coverLetterUrl:
 *           type: string
 */
export interface ICandidateJobApplicationUpdate {
  status?: ApplicationStatusEnum;
  notes?: string;
  coverLetterUrl?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobApplicationStatusUpdate:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           $ref: '#/components/schemas/ApplicationStatusEnum'
 *         notes:
 *           type: string
 *           description: Optional notes about the status change
 */
export interface ICandidateJobApplicationStatusUpdate {
  status: ApplicationStatusEnum;
  notes?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobApplicationAccept:
 *       type: object
 *       properties:
 *         notes:
 *           type: string
 *           description: Optional notes about accepting the application
 */
export interface ICandidateJobApplicationAccept {
  notes?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobApplicationReject:
 *       type: object
 *       properties:
 *         notes:
 *           type: string
 *           description: Optional notes about rejecting the application
 */
export interface ICandidateJobApplicationReject {
  notes?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobApplicationWithdraw:
 *       type: object
 *       properties:
 *         notes:
 *           type: string
 *           description: Optional notes about withdrawing the application
 */
export interface ICandidateJobApplicationWithdraw {
  notes?: string;
}

/**
 * Helper function to convert database model to domain model
 */
export function toCandidateJobApplicationDomain(
  application: any
): ICandidateJobApplication {
  // Find the pending invite for this application, if any
  const pendingInvite = Array.isArray(application.jobAiAssessmentInvitations)
    ? application.jobAiAssessmentInvitations.find(
        (invite: any) =>
          invite.status === JobAiAssessmentInviteStatusEnum.PENDING
      )
    : undefined;
  const domain: ICandidateJobApplication = {
    id: application.id,
    candidateId: application.candidateId,
    jobPostingId: application.jobPostingId,
    status: application.status,
    appliedAt: application.appliedAt,
    notes: application.notes,
    coverLetterUrl: application.coverLetterUrl,
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
    jobPosting: {
      id: application.jobPosting.id,
      title: application.jobPosting.title,
      description: application.jobPosting.description,
      company: {
        name: application.jobPosting.client.company.name,
        industry: application.jobPosting.client.company.industry,
      },
    },
    aiAssessmentInviteId: pendingInvite?.id,
    jobInviteStatus: application.jobInvite?.status,
    jobInviteId: application.jobInvite?.id,
    declinedAt: application.declinedAt || null,
    declineReason: application.declineReason || null,
    acceptedAt: application.acceptedAt || null,
    acceptanceNote: application.acceptanceNote || null,
  };
  if (application.aiAssessment) {
    domain.aiAssessment = {
      id: application.aiAssessment.id,
      status: application.aiAssessment.status,
      // Add other fields as needed
    };
  }
  return domain;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobApplicationAiAssessment:
 *       type: object
 *       description: Domain model representing an AI assessment for a job application
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the assessment
 *         status:
 *           $ref: '#/components/schemas/AssessmentStatusEnum'
 *           description: Current status of the assessment
 *         result:
 *           $ref: '#/components/schemas/AssessmentResultEnum'
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
 *             $ref: '#/components/schemas/ICandidateJobApplicationAiAssessmentSection'
 *           description: Assessment sections
 */
export interface ICandidateJobApplicationAiAssessment {
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
  sections: ICandidateJobApplicationAiAssessmentSection[];
  progressState?: ICandidateJobApplicationAiAssessmentProgress;
  videoAnalysis?: ICandidateJobApplicationAiAssessmentVideoAnalysis;
  proctoring?: ICandidateJobApplicationAiAssessmentProctoring;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobApplicationAiAssessmentSection:
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
 *           $ref: '#/components/schemas/AssessmentStatusEnum'
 *           description: Status of the section
 *         result:
 *           $ref: '#/components/schemas/AssessmentResultEnum'
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
 *             $ref: '#/components/schemas/ICandidateJobApplicationAiAssessmentQuestion'
 *           description: Questions in this section
 *         videoAnalysis:
 *           $ref: '#/components/schemas/ICandidateJobApplicationAiAssessmentVideoAnalysis'
 *           description: Video analysis results for this section
 *         proctoring:
 *           $ref: '#/components/schemas/ICandidateJobApplicationAiAssessmentProctoring'
 *           description: Proctoring results for this section
 *         progressState:
 *           $ref: '#/components/schemas/ICandidateJobApplicationAiAssessmentProgress'
 *           description: Progress state for this section
 */
export interface ICandidateJobApplicationAiAssessmentSection {
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
  questions: ICandidateJobApplicationAiAssessmentQuestion[];
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobApplicationAiAssessmentQuestion:
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
export interface ICandidateJobApplicationAiAssessmentQuestion {
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
 *     ICandidateJobApplicationAiAssessmentProgress:
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
export interface ICandidateJobApplicationAiAssessmentProgress {
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
 *     ICandidateJobApplicationAiAssessmentVideoAnalysis:
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
export interface ICandidateJobApplicationAiAssessmentVideoAnalysis {
  videoUrl?: string;
  transcriptText?: string;
  strengths: string[];
  areasForImprovement: string[];
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobApplicationAiAssessmentProctoring:
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
export interface ICandidateJobApplicationAiAssessmentProctoring {
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
export function toICandidateJobApplicationAiAssessment(
  assessment: any
): ICandidateJobApplicationAiAssessment {
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
    sections: assessment.sections.map((section: any) => ({
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
      questions: section.questions.map((question: any) => ({
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
      })),
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
