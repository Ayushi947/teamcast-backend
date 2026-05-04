import {
  OnboardingAssessmentStatusEnum,
  OnboardingAssessmentResultEnum,
  OnboardingAssessmentRecommendationEnum,
  QuestionTypeEnum,
  OnboardingAssessmentSectionStatusEnum,
  OnboardingAssessmentSectionResultEnum,
  OnboardingAssessmentTaskStatusEnum,
  OnboardingAssessmentVideoAnalysisStatusEnum,
} from '../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateOnboardingAssessment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the assessment
 *         candidateId:
 *           type: string
 *           description: ID of the candidate taking the assessment
 *         status:
 *           $ref: '#/components/schemas/OnboardingAssessmentStatusEnum'
 *           description: Current status of the assessment
 *         result:
 *           $ref: '#/components/schemas/OnboardingAssessmentResultEnum'
 *           description: Result of the assessment
 *         score:
 *           type: number
 *           description: Overall score achieved in the assessment
 *         startedAt:
 *           type: string
 *           format: date-time
 *           description: When the assessment was started
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: When the assessment was completed
 *         automaticallyPublished:
 *           type: boolean
 *           description: Whether the result was automatically published
 *         overallFeedback:
 *           type: string
 *           description: Overall feedback for the assessment
 *         recommendation:
 *           $ref: '#/components/schemas/OnboardingAssessmentRecommendationEnum'
 *           description: AI recommendation status
 *         duration:
 *           type: number
 *           description: Duration taken to complete the assessment in seconds
 *         selectedForNextRound:
 *           type: boolean
 *           description: Whether candidate is selected for next round
 *         termsAccepted:
 *           type: boolean
 *           description: Whether the candidate has accepted the terms and conditions
 *         termsAcceptedAt:
 *           type: string
 *           format: date-time
 *           description: When the terms were accepted by the candidate
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
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *           description: List of skills identified
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
 *         sections:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ICandidateOnboardingAssessmentSection'
 *           description: Assessment sections
 *         progressState:
 *           $ref: '#/components/schemas/ICandidateOnboardingAssessmentProgress'
 *         videoAnalysis:
 *           $ref: '#/components/schemas/ICandidateOnboardingAssessmentVideoAnalysis'
 *         videoAnalysisStatus:
 *           $ref: '#/components/schemas/OnboardingAssessmentVideoAnalysisStatusEnum'
 *         videoAnalysisError:
 *           type: string
 *           description: Error message from video analysis
 *         proctoring:
 *           $ref: '#/components/schemas/ICandidateOnboardingAssessmentProctoring'
 *         settings:
 *           $ref: '#/components/schemas/ICandidateOnboardingAssessmentSettings'
 *         task:
 *           $ref: '#/components/schemas/ICandidateOnboardingAssessmentTask'
 *         resumeText:
 *           type: string
 *           description: Resume text for the assessment
 *         videoChunks:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               chunkIndex:
 *                 type: number
 *               questionId:
 *                 type: string
 *               attemptNumber:
 *                 type: number
 *               status:
 *                 type: string
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *               playbackUrl:
 *                 type: string
 *           description: Video chunks for the assessment
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the assessment was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the assessment was last updated
 */
export interface ICandidateOnboardingAssessment {
  id: string;
  candidateId: string;
  status: OnboardingAssessmentStatusEnum;
  result: OnboardingAssessmentResultEnum;
  score: number;
  startedAt?: Date;
  completedAt?: Date;
  automaticallyPublished: boolean;
  duration?: number;
  selectedForNextRound: boolean;
  termsAccepted: boolean;
  termsAcceptedAt?: Date;

  strengths: string[];
  areasForImprovement: string[];

  skills: string[];
  technicalSkills: string[];
  softSkills: string[];
  industriesFit: string[];
  jobRolesFit: string[];

  experienceSummary?: string;
  educationSummary?: string;

  overallFeedback?: string;
  recommendation?: OnboardingAssessmentRecommendationEnum;

  sections: ICandidateOnboardingAssessmentSection[];
  progressState?: ICandidateOnboardingAssessmentProgress;
  videoAnalysis?: ICandidateOnboardingAssessmentVideoAnalysis;
  videoAnalysisStatus?: OnboardingAssessmentVideoAnalysisStatusEnum;
  videoAnalysisError?: string;
  proctoring?: ICandidateOnboardingAssessmentProctoring;
  onboardingAssessmentSettings?: ICandidateOnboardingAssessmentSettings;
  task?: ICandidateOnboardingAssessmentTask;

  resumeText?: string;

  videoChunks?: Array<{
    id: string;
    chunkIndex: number;
    questionId: string | null;
    attemptNumber: number;
    status: string;
    createdAt: Date;
    playbackUrl?: string;
  }>;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateOnboardingAssessmentSection:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the section
 *         assessmentId:
 *           type: string
 *           description: ID of the assessment this section belongs to
 *         title:
 *           type: string
 *           description: Title of the section
 *         description:
 *           type: string
 *           description: Description of the section
 *         type:
 *           type: string
 *           description: Type of the section
 *         status:
 *           type: string
 *           enum: [NOT_STARTED, IN_PROGRESS, COMPLETED, FAILED]
 *           description: Current status of the section
 *         result:
 *           type: string
 *           enum: [NOT_AVAILABLE, PASSED, FAILED]
 *           description: Result of the section
 *         score:
 *           type: number
 *           description: Score achieved in the section
 *         order:
 *           type: number
 *           description: Order of the section in the assessment
 *         isRequired:
 *           type: boolean
 *           description: Whether the section is mandatory
 *         passThreshold:
 *           type: number
 *           description: Minimum score required to pass
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
 *           description: Feedback for the section
 *         strengths:
 *           type: array
 *           items:
 *             type: string
 *           description: List of strengths in this section
 *         areasForImprovement:
 *           type: array
 *           items:
 *             type: string
 *           description: Areas for improvement in this section
 *         questions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ICandidateOnboardingAssessmentQuestion'
 *           description: Questions in the section
 */
export interface ICandidateOnboardingAssessmentSection {
  id: string;
  assessmentId: string;
  title: string;
  description: string;
  type: string;
  status: OnboardingAssessmentSectionStatusEnum;
  result: OnboardingAssessmentSectionResultEnum;
  score: number;
  order: number;
  isRequired: boolean;
  passThreshold: number;
  startedAt?: Date;
  completedAt?: Date;
  feedback?: string;
  strengths: string[];
  areasForImprovement: string[];
  questions: ICandidateOnboardingAssessmentQuestion[];
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateOnboardingAssessmentQuestion:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the question
 *         sectionId:
 *           type: string
 *           description: ID of the section this question belongs to
 *         question:
 *           type: string
 *           description: The question text
 *         questionType:
 *           type: string
 *           description: Type of the question (MULTIPLE_CHOICE, TEXT, CODE, etc.)
 *         options:
 *           type: object
 *           description: Question options (for multiple choice)
 *         correctAnswer:
 *           type: string
 *           description: The correct answer
 *         answerGiven:
 *           type: string
 *           description: The answer provided by candidate
 *         score:
 *           type: number
 *           description: Score achieved for this question
 *         maxScore:
 *           type: number
 *           description: Maximum possible score
 *         order:
 *           type: number
 *           description: Order of the question in the section
 *         isRequired:
 *           type: boolean
 *           description: Whether the question is mandatory
 *         feedback:
 *           type: string
 *           description: Feedback for the answer
 *         isAnswered:
 *           type: boolean
 *           description: Whether the question has been answered
 */
export interface ICandidateOnboardingAssessmentQuestion {
  id: string;
  sectionId: string;
  question: string;
  questionType: QuestionTypeEnum;
  options?: any;
  correctAnswer?: string;
  answerGiven?: string;
  score: number;
  maxScore: number;
  order: number;
  isRequired: boolean;
  isLastQuestion: boolean;
  feedback?: string;
  isAnswered: boolean;
}

export function toCandidateOnboardingAssessmentQuestionDomain(
  question: any
): ICandidateOnboardingAssessmentQuestion {
  return {
    id: question.id,
    sectionId: question.sectionId,
    question: question.question,
    questionType: question.questionType,
    options: question.options,
    correctAnswer: question.correctAnswer,
    answerGiven: question.answerGiven,
    score: question.score,
    maxScore: question.maxScore,
    order: question.order,
    isRequired: question.isRequired,
    isLastQuestion: question.isLastQuestion,
    feedback: question.feedback,
    isAnswered: question.isAnswered,
  };
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateOnboardingAssessmentProgress:
 *       type: object
 *       properties:
 *         currentSectionId:
 *           type: string
 *           description: ID of the current section
 *         currentQuestionId:
 *           type: string
 *           description: ID of the current question
 *         lastSavedAt:
 *           type: string
 *           format: date-time
 *           description: When the progress was last saved
 *         progressData:
 *           type: object
 *           description: Additional progress data
 *         isCompleted:
 *           type: boolean
 *           description: Whether the assessment is completed
 */
export interface ICandidateOnboardingAssessmentProgress {
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
 *     ICandidateOnboardingAssessmentVideoAnalysis:
 *       type: object
 *       properties:
 *         videoUrl:
 *           type: string
 *           description: URL of the recorded video
 *         transcriptText:
 *           type: string
 *           description: Transcript of the video
 *         overallScore:
 *           type: number
 *           description: Overall score from video analysis
 *         overallFeedback:
 *           type: string
 *           description: Overall feedback from video analysis
 *         engagementScore:
 *           type: number
 *           description: Score for engagement
 *         confidenceScore:
 *           type: number
 *           description: Score for confidence
 *         clarityScore:
 *           type: number
 *           description: Score for clarity
 *         professionalDemeanorScore:
 *           type: number
 *           description: Score for professional demeanor
 *         proctoringScore:
 *           type: number
 *           description: Score for proctoring
 *         engagementFeedback:
 *           type: string
 *           description: Feedback for engagement
 *         confidenceFeedback:
 *           type: string
 *           description: Feedback for confidence
 *         clarityFeedback:
 *           type: string
 *           description: Feedback for clarity
 *         professionalDemeanorFeedback:
 *           type: string
 *           description: Feedback for professional demeanor
 *         proctoringFeedback:
 *           type: string
 *           description: Feedback from proctoring analysis
 *         areasForImprovement:
 *           type: array
 *           items:
 *             type: string
 *           description: Areas where candidate can improve
 *         strengths:
 *           type: array
 *           items:
 *             type: string
 *           description: Candidate's strengths identified from video
 *         highlightsInstructions:
 *           type: string
 *           description: Highlights instructions for the video analysis
 *         highlightsVideoUrl:
 *           type: string
 *           description: URL of the generated highlights video
 */
export interface ICandidateOnboardingAssessmentVideoAnalysis {
  videoUrl?: string;
  transcriptText?: string;
  overallScore?: number;
  overallFeedback?: string;
  engagementScore?: number;
  engagementFeedback?: string;
  confidenceScore?: number;
  confidenceFeedback?: string;
  clarityScore?: number;
  clarityFeedback?: string;
  professionalDemeanorScore?: number;
  professionalDemeanorFeedback?: string;
  proctoringScore?: number;
  proctoringFeedback?: string;
  areasForImprovement?: string[];
  strengths?: string[];
  highlightsInstructions?: string;
  highlightsVideoUrl?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateOnboardingAssessmentProctoring:
 *       type: object
 *       properties:
 *         warningCount:
 *           type: number
 *           description: Number of warnings issued
 *         suspiciousEvents:
 *           type: object
 *           description: Record of suspicious activities
 *         tabSwitches:
 *           type: number
 *           description: Number of tab switches detected
 *         copyPasteAttempts:
 *           type: number
 *           description: Number of copy-paste attempts
 *         multiplePersonsDetected:
 *           type: boolean
 *           description: Whether multiple persons were detected
 *         audioIrregularities:
 *           type: boolean
 *           description: Whether audio irregularities were detected
 *         screenShareViolations:
 *           type: boolean
 *           description: Whether screen sharing violations occurred
 *         automaticallyFailed:
 *           type: boolean
 *           description: Whether assessment was auto-failed due to violations
 *         manualReviewRequired:
 *           type: boolean
 *           description: Whether manual review is needed
 *         reviewerNotes:
 *           type: string
 *           description: Notes from the reviewer
 */
export interface ICandidateOnboardingAssessmentProctoring {
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
 * @openapi
 * components:
 *   schemas:
 *     ICandidateOnboardingAssessmentSettings:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the settings
 *         assessmentId:
 *           type: string
 *           description: ID of the associated assessment
 *         globalSettingsId:
 *           type: string
 *           description: ID of the global settings this was copied from
 *         greetingMessage:
 *           type: string
 *           description: Greeting message for the assessment
 *         defaultAssessmentDuration:
 *           type: number
 *           description: Default assessment duration
 *         defaultPassingScore:
 *           type: number
 *           description: Default passing score
 *         requiredSections:
 *           type: array
 *           items:
 *             type: string
 *           description: Required sections
 *         maximumAttempts:
 *           type: number
 *           description: Maximum attempts
 *         cooldownPeriod:
 *           type: number
 *           description: Cooldown period
 *         maxSections:
 *           type: number
 *         maxQuestionsPerSection:
 *           type: number
 *           description: Maximum questions per section
 *         proctoringEnabled:
 *           type: boolean
 *           description: Whether proctoring is enabled
 *         maxWarnings:
 *           type: number
 *           description: Maximum warnings
 *         tabSwitchLimit:
 *           type: number
 *           description: Maximum tab switches
 *         copyPasteAllowed:
 *           type: boolean
 *         videoRecordingEnabled:
 *           type: boolean
 *           description: Whether video recording is enabled
 *         minimumVideoLength:
 *           type: number
 *           description: Minimum video length
 *         aiVideoAnalysisEnabled:
 *           type: boolean
 *           description: Whether AI video analysis is enabled
 *         autoPublishOnSuccess:
 *           type: boolean
 *           description: Whether to auto-publish on success
 *         autoNotifyOnComplete:
 *           type: boolean
 *         interviewLanguage:
 *           type: string
 *           description: Primary language for interviews (e.g., "ENGLISH")
 *         interviewDialect:
 *           type: string
 *           description: Dialect code for voice synthesis (e.g., "en-US", "en-GB", "en-AU", "en-CA", "en-IN")
 *         interviewVoiceGender:
 *           type: string
 *           description: Voice gender ("female" or "male")
 *         sectionTemplates:
 *           type: object
 *           description: Section templates
 *         questionTemplates:
 *           type: object
 *           description: Question templates
 *         customStyles:
 *           type: object
 *           description: Custom styles
 *         customInstructions:
 *           type: string
 *           description: Custom instructions
 *         createdAt:
 *           type: string
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the settings were last updated
 *
 */
export interface ICandidateOnboardingAssessmentSettings {
  id: string;
  assessmentId: string;
  globalSettingsId?: string;
  greetingMessage?: string;
  defaultAssessmentDuration: number;
  defaultPassingScore: number;
  requiredSections: string[];
  maximumAttempts: number;
  cooldownPeriod: number;
  maxSections: number;
  maxQuestionsPerSection: number;
  proctoringEnabled: boolean;
  maxWarnings: number;
  tabSwitchLimit: number;
  copyPasteAllowed: boolean;
  videoRecordingEnabled: boolean;
  minimumVideoLength: number;
  aiVideoAnalysisEnabled: boolean;
  autoPublishOnSuccess: boolean;
  autoNotifyOnComplete: boolean;
  // Voice configuration
  interviewLanguage?: string; // Primary language for interviews (e.g., "ENGLISH")
  interviewDialect?: string; // Dialect code for voice synthesis (e.g., "en-US", "en-GB", "en-AU", "en-CA", "en-IN")
  interviewVoiceGender?: string; // Voice gender: "female" or "male"
  sectionTemplates: any;
  questionTemplates: any;
  customStyles: any;
  customInstructions: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateOnboardingAssessmentTask:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the task
 *         assessment:
 *           $ref: '#/components/schemas/ICandidateOnboardingAssessment'
 *         status:
 *           $ref: '#/components/schemas/OnboardingAssessmentTaskStatusEnum'
 *         error:
 *           type: string
 *           description: Error message if task failed
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the task was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the task was last updated
 */
export interface ICandidateOnboardingAssessmentTask {
  id: string;
  assessment: ICandidateOnboardingAssessment;
  status: OnboardingAssessmentTaskStatusEnum;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateOnboardingAssessmentSubmitAnswer:
 *       type: object
 *       properties:
 *         answerGiven:
 *           type: string
 *           description: The answer provided by the candidate
 */
export interface ICandidateOnboardingAssessmentSubmitAnswer {
  answerGiven: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IGlobalOnboardingAssessmentSettings:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         isSingleton:
 *           type: boolean
 *         greetingMessage:
 *           type: string
 *         defaultAssessmentDuration:
 *           type: number
 *         defaultPassingScore:
 *           type: number
 *         requiredSections:
 *           type: array
 *           items:
 *             type: string
 *         maximumAttempts:
 *           type: number
 *         cooldownPeriod:
 *           type: number
 *         maxSections:
 *           type: number
 *         maxQuestionsPerSection:
 *           type: number
 *         proctoringEnabled:
 *           type: boolean
 *         maxWarnings:
 *           type: number
 *         tabSwitchLimit:
 *           type: number
 *         copyPasteAllowed:
 *           type: boolean
 *         videoRecordingEnabled:
 *           type: boolean
 *         minimumVideoLength:
 *           type: number
 *         aiVideoAnalysisEnabled:
 *           type: boolean
 *         autoPublishOnSuccess:
 *           type: boolean
 *         autoNotifyOnComplete:
 *           type: boolean
 *         interviewLanguage:
 *           type: string
 *         interviewDialect:
 *           type: string
 *         interviewVoiceGender:
 *           type: string
 *         sectionTemplates:
 *           type: object
 *         questionTemplates:
 *           type: object
 *         customStyles:
 *           type: object
 *         customInstructions:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
export interface IGlobalOnboardingAssessmentSettings {
  id: string;
  name: string;
  description?: string;
  isSingleton: boolean;

  // Greeting message
  greetingMessage?: string;

  // Assessment configuration
  defaultAssessmentDuration: number; // in seconds
  defaultPassingScore: number; // Score threshold to pass (0.0-1.0)
  requiredSections: string[]; // Types of sections required in all assessments
  maximumAttempts: number; // Maximum attempts allowed
  cooldownPeriod: number; // Days between attempts

  // Max sections and questions per section
  maxSections: number;
  maxQuestionsPerSection: number;

  // Proctoring configuration
  proctoringEnabled: boolean;
  maxWarnings: number; // Maximum warnings before automatic failure
  tabSwitchLimit: number; // Number of tab switches allowed
  copyPasteAllowed: boolean;

  // Video analysis configuration
  videoRecordingEnabled: boolean;
  minimumVideoLength: number; // Minimum video length in minutes
  aiVideoAnalysisEnabled: boolean;

  // Automatic actions
  autoPublishOnSuccess: boolean; // Auto-publish profile on passing
  autoNotifyOnComplete: boolean; // Auto-notify candidate on completion

  // Voice configuration
  interviewLanguage?: string; // Primary language for interviews (e.g., "ENGLISH")
  interviewDialect?: string; // Dialect code for voice synthesis (e.g., "en-US", "en-GB", "en-AU", "en-CA", "en-IN")
  interviewVoiceGender?: string; // Voice gender: "female" or "male"

  // Section templates (stored as JSON)
  sectionTemplates?: Record<string, any>; // Predefined section templates
  questionTemplates?: Record<string, any>; // Predefined question templates

  // Customization
  customStyles?: Record<string, any>; // UI customization options
  customInstructions?: string; // Custom instructions for candidates

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Update payload for global onboarding assessment settings
 */
export type IGlobalOnboardingAssessmentSettingsUpdate = Partial<
  Omit<
    IGlobalOnboardingAssessmentSettings,
    'id' | 'isSingleton' | 'createdAt' | 'updatedAt'
  >
>;

/**
 * Helper function to convert database model to domain model
 */
export function toGlobalOnboardingAssessmentSettingsDomain(
  settings: any
): IGlobalOnboardingAssessmentSettings {
  return {
    id: settings.id,
    name: settings.name,
    description: settings.description,
    isSingleton: settings.isSingleton ?? false,

    // Greeting message
    greetingMessage: settings.greetingMessage,

    // Assessment configuration
    defaultAssessmentDuration: settings.defaultAssessmentDuration ?? 3600,
    defaultPassingScore: settings.defaultPassingScore ?? 0.7,
    requiredSections: (settings.requiredSections as string[]) ?? [],
    maximumAttempts: settings.maximumAttempts ?? 3,
    cooldownPeriod: settings.cooldownPeriod ?? 7,

    // Max sections and questions per section
    maxSections: settings.maxSections ?? 6,
    maxQuestionsPerSection: settings.maxQuestionsPerSection ?? 8,

    // Proctoring configuration
    proctoringEnabled: settings.proctoringEnabled ?? true,
    maxWarnings: settings.maxWarnings ?? 3,
    tabSwitchLimit: settings.tabSwitchLimit ?? 3,
    copyPasteAllowed: settings.copyPasteAllowed ?? false,

    // Video analysis configuration
    videoRecordingEnabled: settings.videoRecordingEnabled ?? true,
    minimumVideoLength: settings.minimumVideoLength ?? 10,
    aiVideoAnalysisEnabled: settings.aiVideoAnalysisEnabled ?? true,

    // Automatic actions
    autoPublishOnSuccess: settings.autoPublishOnSuccess ?? true,
    autoNotifyOnComplete: settings.autoNotifyOnComplete ?? true,

    // Voice configuration
    interviewLanguage: settings.interviewLanguage,
    interviewDialect: settings.interviewDialect,
    interviewVoiceGender: settings.interviewVoiceGender,

    // Section templates
    sectionTemplates: settings.sectionTemplates
      ? (settings.sectionTemplates as Record<string, any>)
      : undefined,
    questionTemplates: settings.questionTemplates
      ? (settings.questionTemplates as Record<string, any>)
      : undefined,

    // Customization
    customStyles: settings.customStyles
      ? (settings.customStyles as Record<string, any>)
      : undefined,
    customInstructions: settings.customInstructions,

    createdAt: settings.createdAt,
    updatedAt: settings.updatedAt,
  };
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateOnboardingAssessmentPresignedUrl:
 *       type: object
 *       properties:
 *         presignedUrl:
 *           type: string
 *           description: Presigned URL for uploading video chunks
 *         gcsUri:
 *           type: string
 *           description: GCS URI for the video chunk
 *         chunkIndex:
 *           type: number
 *           description: Index of the video chunk
 */
export interface ICandidateOnboardingAssessmentPresignedUrl {
  presignedUrl: string;
  gcsUri?: string;
  chunkIndex?: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateOnboardingAssessmentAnswerSubmitted:
 *       type: object
 *       properties:
 *         nextQuestion:
 *           $ref: '#/components/schemas/ICandidateOnboardingAssessmentQuestion'
 */
export interface ICandidateOnboardingAssessmentAnswerSubmitted {
  nextQuestion: ICandidateOnboardingAssessmentQuestion;
  shouldEndAssessment: boolean;
}

export function toCandidateOnboardingAssessmentDomain(
  assessment: any
): ICandidateOnboardingAssessment {
  return {
    id: assessment.id,
    candidateId: assessment.candidateId,
    status: assessment.status as OnboardingAssessmentStatusEnum,
    result: assessment.result as OnboardingAssessmentResultEnum,
    score: assessment.score,
    startedAt: assessment.startedAt || undefined,
    completedAt: assessment.completedAt || undefined,
    automaticallyPublished: assessment.automaticallyPublished,
    overallFeedback: assessment.overallFeedback || undefined,
    recommendation:
      (assessment.recommendation as OnboardingAssessmentRecommendationEnum) ||
      undefined,
    duration: assessment.duration || undefined,
    selectedForNextRound: assessment.selectedForNextRound,
    termsAccepted: assessment.termsAccepted,
    termsAcceptedAt: assessment.termsAcceptedAt || undefined,
    strengths: assessment.strengths,
    areasForImprovement: assessment.areasForImprovement,
    skills: assessment.skills,
    technicalSkills: assessment.technicalSkills,
    softSkills: assessment.softSkills,
    industriesFit: assessment.industriesFit,
    jobRolesFit: assessment.jobRolesFit,
    experienceSummary: assessment.experienceSummary || undefined,
    educationSummary: assessment.educationSummary || undefined,
    sections:
      assessment.sections?.map((section: any) => ({
        id: section.id,
        assessmentId: section.assessmentId,
        title: section.title,
        description: section.description,
        type: section.type,
        status: section.status as OnboardingAssessmentSectionStatusEnum,
        result: section.result as OnboardingAssessmentSectionResultEnum,
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
          section.questions?.map((question: any) => ({
            id: question.id,
            sectionId: question.sectionId,
            question: question.question,
            questionType: question.questionType as QuestionTypeEnum,
            options: question.options || undefined,
            correctAnswer: question.correctAnswer || undefined,
            answerGiven: question.answerGiven || undefined,
            score: question.score,
            maxScore: question.maxScore,
            order: question.order,
            isRequired: question.isRequired,
            isLastQuestion: question.isLastQuestion,
            feedback: question.feedback || undefined,
            isAnswered: question.isAnswered,
          })) || [],
      })) || [],
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
          overallScore: assessment.videoAnalysis.overallScore || undefined,
          overallFeedback:
            assessment.videoAnalysis.overallFeedback || undefined,
          engagementScore:
            assessment.videoAnalysis.engagementScore || undefined,
          engagementFeedback:
            assessment.videoAnalysis.engagementFeedback || undefined,
          confidenceScore:
            assessment.videoAnalysis.confidenceScore || undefined,
          confidenceFeedback:
            assessment.videoAnalysis.confidenceFeedback || undefined,
          clarityScore: assessment.videoAnalysis.clarityScore || undefined,
          clarityFeedback:
            assessment.videoAnalysis.clarityFeedback || undefined,
          professionalDemeanorScore:
            assessment.videoAnalysis.professionalDemeanorScore || undefined,
          professionalDemeanorFeedback:
            assessment.videoAnalysis.professionalDemeanorFeedback || undefined,
          areasForImprovement:
            assessment.videoAnalysis.areasForImprovement || [],
          strengths: assessment.videoAnalysis.strengths || [],
          proctoringScore:
            assessment.videoAnalysis.proctoringScore || undefined,
          proctoringFeedback:
            assessment.videoAnalysis.proctoringFeedback || undefined,
          highlightsInstructions:
            assessment.videoAnalysis.highlightsInstructions || undefined,
          highlightsVideoUrl:
            assessment.videoAnalysis.highlightsVideoUrl || undefined,
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
    onboardingAssessmentSettings: assessment.onboardingAssessmentSettings
      ? {
          id: assessment.onboardingAssessmentSettings.id,
          assessmentId: assessment.onboardingAssessmentSettings.assessmentId,
          greetingMessage:
            assessment.onboardingAssessmentSettings.greetingMessage ||
            undefined,
          defaultAssessmentDuration:
            assessment.onboardingAssessmentSettings.defaultAssessmentDuration,
          defaultPassingScore:
            assessment.onboardingAssessmentSettings.defaultPassingScore,
          requiredSections:
            assessment.onboardingAssessmentSettings.requiredSections,
          maximumAttempts:
            assessment.onboardingAssessmentSettings.maximumAttempts,
          cooldownPeriod:
            assessment.onboardingAssessmentSettings.cooldownPeriod,
          maxSections: assessment.onboardingAssessmentSettings.maxSections,
          maxQuestionsPerSection:
            assessment.onboardingAssessmentSettings.maxQuestionsPerSection,
          proctoringEnabled:
            assessment.onboardingAssessmentSettings.proctoringEnabled,
          maxWarnings: assessment.onboardingAssessmentSettings.maxWarnings,
          tabSwitchLimit:
            assessment.onboardingAssessmentSettings.tabSwitchLimit,
          copyPasteAllowed:
            assessment.onboardingAssessmentSettings.copyPasteAllowed,
          videoRecordingEnabled:
            assessment.onboardingAssessmentSettings.videoRecordingEnabled,
          minimumVideoLength:
            assessment.onboardingAssessmentSettings.minimumVideoLength,
          aiVideoAnalysisEnabled:
            assessment.onboardingAssessmentSettings.aiVideoAnalysisEnabled,
          autoPublishOnSuccess:
            assessment.onboardingAssessmentSettings.autoPublishOnSuccess,
          autoNotifyOnComplete:
            assessment.onboardingAssessmentSettings.autoNotifyOnComplete,
          interviewLanguage:
            assessment.onboardingAssessmentSettings.interviewLanguage ||
            undefined,
          interviewDialect:
            assessment.onboardingAssessmentSettings.interviewDialect ||
            undefined,
          interviewVoiceGender:
            assessment.onboardingAssessmentSettings.interviewVoiceGender ||
            undefined,
          sectionTemplates:
            assessment.onboardingAssessmentSettings.sectionTemplates ||
            undefined,
          questionTemplates:
            assessment.onboardingAssessmentSettings.questionTemplates ||
            undefined,
          customStyles:
            assessment.onboardingAssessmentSettings.customStyles || undefined,
          customInstructions:
            assessment.onboardingAssessmentSettings.customInstructions ||
            undefined,
          createdAt: assessment.onboardingAssessmentSettings.createdAt,
          updatedAt: assessment.onboardingAssessmentSettings.updatedAt,
        }
      : undefined,
    task: assessment.task
      ? {
          id: assessment.task.id,
          assessment: assessment.task.assessment,
          status: assessment.task.status as OnboardingAssessmentTaskStatusEnum,
          error: assessment.task.error || undefined,
          createdAt: assessment.task.createdAt,
          updatedAt: assessment.task.updatedAt,
        }
      : undefined,
    resumeText: assessment.resumeText || undefined,
    createdAt: assessment.createdAt,
    updatedAt: assessment.updatedAt,
  };
}

export function toCandidateOnboardingAssessmentTaskDomain(
  task: any
): ICandidateOnboardingAssessmentTask {
  return {
    id: task.id,
    assessment: toCandidateOnboardingAssessmentDomain(task.assessment),
    status: task.status as OnboardingAssessmentTaskStatusEnum,
    error: task.error || undefined,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

export function toCandidateOnboardingAssessmentProctoringDomain(
  proctoring: any
): ICandidateOnboardingAssessmentProctoring {
  return {
    warningCount: proctoring.warningCount,
    suspiciousEvents: proctoring.suspiciousEvents || undefined,
    tabSwitches: proctoring.tabSwitches,
    copyPasteAttempts: proctoring.copyPasteAttempts,
    multiplePersonsDetected: proctoring.multiplePersonsDetected,
    audioIrregularities: proctoring.audioIrregularities,
    screenShareViolations: proctoring.screenShareViolations,
    automaticallyFailed: proctoring.automaticallyFailed,
    manualReviewRequired: proctoring.manualReviewRequired,
    reviewerNotes: proctoring.reviewerNotes || undefined,
  };
}
