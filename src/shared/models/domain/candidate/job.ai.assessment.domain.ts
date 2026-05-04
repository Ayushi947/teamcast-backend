import {
  JobAiAssessmentStatusEnum,
  JobAiAssessmentVideoAnalysisStatusEnum,
  JobAiAssessmentResultEnum,
  JobAiAssessmentRecommendationEnum,
  QuestionTypeEnum,
  JobAiAssessmentSectionStatusEnum,
  JobAiAssessmentSectionResultEnum,
  JobAiAssessmentTaskStatusEnum,
  DifficultyLevelEnum,
  JobAiAssessmentInviteStatusEnum,
} from '../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobAiAssessment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the assessment
 *         candidateId:
 *           type: string
 *           description: ID of the candidate taking the assessment
 *         status:
 *           $ref: '#/components/schemas/JobAiAssessmentStatusEnum'
 *           description: Current status of the assessment
 *         result:
 *           $ref: '#/components/schemas/JobAiAssessmentResultEnum'
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
 *           $ref: '#/components/schemas/JobAiAssessmentRecommendationEnum'
 *           description: AI recommendation status
 *         duration:
 *           type: number
 *           description: Duration taken to complete the assessment in seconds
 *         selectedForNextRound:
 *           type: boolean
 *           description: Whether candidate is selected for next round
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
 *             $ref: '#/components/schemas/ICandidateJobAiAssessmentSection'
 *           description: Assessment sections
 *         progressState:
 *           $ref: '#/components/schemas/ICandidateJobAiAssessmentProgress'
 *         videoAnalysis:
 *           $ref: '#/components/schemas/ICandidateJobAiAssessmentVideoAnalysis'
 *         videoAnalysisStatus:
 *           $ref: '#/components/schemas/JobAiAssessmentVideoAnalysisStatusEnum'
 *         videoAnalysisError:
 *           type: string
 *           description: Error message from video analysis
 *         proctoring:
 *           $ref: '#/components/schemas/ICandidateJobAiAssessmentProctoring'
 *         jobAiAssessmentSettings:
 *           $ref: '#/components/schemas/ICandidateJobAiAssessmentSettings'
 *         task:
 *           $ref: '#/components/schemas/ICandidateJobAiAssessmentTask'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the assessment was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the assessment was last updated
 */
export interface ICandidateJobAiAssessment {
  id: string;
  candidateId: string;
  status: JobAiAssessmentStatusEnum;
  result: JobAiAssessmentResultEnum;
  score: number;
  startedAt?: Date;
  completedAt?: Date;
  automaticallyPublished: boolean;
  duration?: number;
  selectedForNextRound: boolean;

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
  recommendation?: JobAiAssessmentRecommendationEnum;

  sections: ICandidateJobAiAssessmentSection[];
  progressState?: ICandidateJobAiAssessmentProgress;
  videoAnalysis?: ICandidateJobAiAssessmentVideoAnalysis;
  videoAnalysisStatus?: JobAiAssessmentVideoAnalysisStatusEnum;
  videoAnalysisError?: string;
  proctoring?: ICandidateJobAiAssessmentProctoring;
  jobAiAssessmentSettings?: ICandidateJobAiAssessmentSettings;
  task?: ICandidateJobAiAssessmentTask;

  resumeText?: string;
  jobDescriptionText?: string;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobAiAssessmentSection:
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
 *             $ref: '#/components/schemas/ICandidateJobAiAssessmentQuestion'
 *           description: Questions in the section
 */
export interface ICandidateJobAiAssessmentSection {
  id: string;
  assessmentId: string;
  title: string;
  description: string;
  type: string;
  status: JobAiAssessmentSectionStatusEnum;
  result: JobAiAssessmentSectionResultEnum;
  score: number;
  order: number;
  isRequired: boolean;
  passThreshold: number;
  startedAt?: Date;
  completedAt?: Date;
  feedback?: string;
  strengths: string[];
  areasForImprovement: string[];
  questions: ICandidateJobAiAssessmentQuestion[];
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobAiAssessmentQuestion:
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
export interface ICandidateJobAiAssessmentQuestion {
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

export function toCandidateJobAiAssessmentQuestionDomain(
  question: any
): ICandidateJobAiAssessmentQuestion {
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
 *     ICandidateJobAiAssessmentProgress:
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
export interface ICandidateJobAiAssessmentProgress {
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
 *     ICandidateJobAiAssessmentVideoAnalysis:
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
export interface ICandidateJobAiAssessmentVideoAnalysis {
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
 *     ICandidateJobAiAssessmentProctoring:
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
export interface ICandidateJobAiAssessmentProctoring {
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
 *     ICandidateJobAiAssessmentSettings:
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
 *           description: Greeting message for candidates
 *         assessmentDuration:
 *           type: number
 *           description: Duration of the assessment in seconds
 *         passingScore:
 *           type: number
 *           description: Minimum score required to pass
 *         requiredSections:
 *           type: array
 *           items:
 *             type: string
 *           description: Types of sections required in this assessment
 *         maxSections:
 *           type: number
 *           description: Maximum number of sections allowed
 *         maxQuestionsPerSection:
 *           type: number
 *           description: Maximum number of questions per section allowed
 *         proctoringEnabled:
 *           type: boolean
 *           description: Whether proctoring is enabled
 *         maxWarnings:
 *           type: number
 *           description: Maximum warnings before automatic failure
 *         tabSwitchLimit:
 *           type: number
 *           description: Number of tab switches allowed
 *         copyPasteAllowed:
 *           type: boolean
 *           description: Whether copy-paste is allowed
 *         videoRecordingEnabled:
 *           type: boolean
 *           description: Whether video recording is enabled
 *         minimumVideoLength:
 *           type: number
 *           description: Minimum video length in seconds
 *         aiVideoAnalysisEnabled:
 *           type: boolean
 *           description: Whether AI video analysis is enabled
 *         autoPublishOnSuccess:
 *           type: boolean
 *           description: Whether to auto-publish profile on passing
 *         autoNotifyOnComplete:
 *           type: boolean
 *           description: Whether to auto-notify candidate on completion
 *         sectionTemplates:
 *           type: object
 *           description: Templates for sections
 *         questionTemplates:
 *           type: object
 *           description: Templates for questions
 *         customStyles:
 *           type: object
 *           description: UI customization options
 *         customInstructions:
 *           type: string
 *           description: Custom instructions for candidates
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the settings were created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the settings were last updated
 */
export interface ICandidateJobAiAssessmentSettings {
  id: string;
  assessmentId: string;
  greetingMessage?: string;

  defaultAssessmentDuration?: number;
  defaultPassingScore?: number;
  requiredSections?: string[];
  maximumAttempts?: number;
  cooldownPeriod?: number;
  maxAssessmentDuration?: number;
  assessmentBuffer?: number;

  useCustomPrompts?: boolean;
  aiDifficulty?: DifficultyLevelEnum;
  customPrompts?: Record<string, string>;
  skillWeightings?: Record<string, number>;

  maxSections?: number;
  maxQuestionsPerSection?: number;

  proctoringEnabled?: boolean;
  maxWarnings?: number;
  tabSwitchLimit?: number;
  copyPasteAllowed?: boolean;

  videoRecordingEnabled?: boolean;
  minimumVideoLength?: number;
  aiVideoAnalysisEnabled?: boolean;

  autoPublishOnSuccess?: boolean;
  autoNotifyOnComplete?: boolean;

  // Voice configuration
  interviewLanguage?: string; // Primary language for interviews (e.g., "ENGLISH")
  interviewDialect?: string; // Dialect code for voice synthesis (e.g., "en-US", "en-GB", "en-AU", "en-CA", "en-IN")
  interviewVoiceGender?: string; // Voice gender: "female" or "male"

  sectionTemplates?: Record<string, string>;
  questionTemplates?: Record<string, string>;

  customStyles?: Record<string, string>;
  customInstructions?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobAiAssessmentTask:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the task
 *         assessment:
 *           $ref: '#/components/schemas/ICandidateJobAiAssessment'
 *         status:
 *           $ref: '#/components/schemas/JobAiAssessmentTaskStatusEnum'
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
export interface ICandidateJobAiAssessmentTask {
  id: string;
  assessment: ICandidateJobAiAssessment;
  status: JobAiAssessmentTaskStatusEnum;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IGlobalJobAiAssessmentSettings:
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
 *         maxAssessmentDuration:
 *           type: number
 *         assessmentBuffer:
 *           type: number
 *         useCustomPrompts:
 *           type: boolean
 *         aiDifficulty:
 *           type: string
 *         customPrompts:
 *           type: object
 *         skillWeightings:
 *           type: object
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
export interface IGlobalJobAiAssessmentSettings {
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
  maxAssessmentDuration: number; // Maximum assessment duration in seconds
  assessmentBuffer: number; // Buffer time in seconds

  // AI configuration
  useCustomPrompts: boolean;
  aiDifficulty: string; // EASY, MEDIUM, HARD
  customPrompts?: Record<string, string>; // Custom prompts for AI assessment
  skillWeightings?: Record<string, number>; // Weightings for different skills

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
  minimumVideoLength: number; // Minimum video length in seconds
  aiVideoAnalysisEnabled: boolean;

  // Automatic actions
  autoPublishOnSuccess: boolean; // Auto-publish result on passing
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
 * Update payload for global job AI assessment settings
 */
export type IGlobalJobAiAssessmentSettingsUpdate = Partial<
  Omit<
    IGlobalJobAiAssessmentSettings,
    'id' | 'isSingleton' | 'createdAt' | 'updatedAt'
  >
>;

/**
 * Helper function to convert database model to domain model
 */
export function toGlobalJobAiAssessmentSettingsDomain(
  settings: any
): IGlobalJobAiAssessmentSettings {
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
    maxAssessmentDuration: settings.maxAssessmentDuration ?? 7200,
    assessmentBuffer: settings.assessmentBuffer ?? 300,

    // AI configuration
    useCustomPrompts: settings.useCustomPrompts ?? false,
    aiDifficulty: settings.aiDifficulty ?? 'MEDIUM',
    customPrompts: settings.customPrompts
      ? (settings.customPrompts as Record<string, string>)
      : undefined,
    skillWeightings: settings.skillWeightings
      ? (settings.skillWeightings as Record<string, number>)
      : undefined,

    // Max sections and questions per section
    maxSections: settings.maxSections ?? 5,
    maxQuestionsPerSection: settings.maxQuestionsPerSection ?? 5,

    // Proctoring configuration
    proctoringEnabled: settings.proctoringEnabled ?? true,
    maxWarnings: settings.maxWarnings ?? 3,
    tabSwitchLimit: settings.tabSwitchLimit ?? 3,
    copyPasteAllowed: settings.copyPasteAllowed ?? false,

    // Video analysis configuration
    videoRecordingEnabled: settings.videoRecordingEnabled ?? true,
    minimumVideoLength: settings.minimumVideoLength ?? 300,
    aiVideoAnalysisEnabled: settings.aiVideoAnalysisEnabled ?? true,

    // Automatic actions
    autoPublishOnSuccess: settings.autoPublishOnSuccess ?? false,
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
 *     ICandidateJobAiAssessmentSubmitAnswer:
 *       type: object
 *       properties:
 *         answerGiven:
 *           type: string
 *           description: The answer provided by the candidate
 */
export interface ICandidateJobAiAssessmentSubmitAnswer {
  answerGiven: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobAiAssessmentPresignedUrl:
 *       type: object
 *       properties:
 *         presignedUrl:
 *           type: string
 *           description: Presigned URL for uploading video chunks
 */
export interface ICandidateJobAiAssessmentPresignedUrl {
  presignedUrl: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobAiAssessmentAnswerSubmitted:
 *       type: object
 *       properties:
 *         nextQuestion:
 *           $ref: '#/components/schemas/ICandidateJobAiAssessmentQuestion'
 */
export interface ICandidateJobAiAssessmentAnswerSubmitted {
  nextQuestion: ICandidateJobAiAssessmentQuestion;
  shouldEndAssessment: boolean;
}

export function toCandidateJobAiAssessmentDomain(
  assessment: any
): ICandidateJobAiAssessment {
  return {
    id: assessment.id,
    candidateId: assessment.candidateId,
    status: assessment.status as JobAiAssessmentStatusEnum,
    result: assessment.result as JobAiAssessmentResultEnum,
    score: assessment.score,
    startedAt: assessment.startedAt || undefined,
    completedAt: assessment.completedAt || undefined,
    automaticallyPublished: assessment.automaticallyPublished,
    overallFeedback: assessment.overallFeedback || undefined,
    recommendation:
      (assessment.recommendation as JobAiAssessmentRecommendationEnum) ||
      undefined,
    duration: assessment.duration || undefined,
    selectedForNextRound: assessment.selectedForNextRound,
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
        status: section.status as JobAiAssessmentSectionStatusEnum,
        result: section.result as JobAiAssessmentSectionResultEnum,
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
    jobAiAssessmentSettings: assessment.jobAiAssessmentSettings
      ? {
          id: assessment.jobAiAssessmentSettings.id,
          assessmentId: assessment.jobAiAssessmentSettings.assessmentId,

          greetingMessage:
            assessment.jobAiAssessmentSettings.greetingMessage || undefined,
          defaultAssessmentDuration:
            assessment.jobAiAssessmentSettings.defaultAssessmentDuration ||
            undefined,
          defaultPassingScore:
            assessment.jobAiAssessmentSettings.defaultPassingScore || undefined,
          requiredSections:
            assessment.jobAiAssessmentSettings.requiredSections || undefined,
          maximumAttempts:
            assessment.jobAiAssessmentSettings.maximumAttempts || undefined,
          cooldownPeriod:
            assessment.jobAiAssessmentSettings.cooldownPeriod || undefined,
          maxAssessmentDuration:
            assessment.jobAiAssessmentSettings.maxAssessmentDuration ||
            undefined,
          assessmentBuffer:
            assessment.jobAiAssessmentSettings.assessmentBuffer || undefined,
          useCustomPrompts:
            assessment.jobAiAssessmentSettings.useCustomPrompts || undefined,
          aiDifficulty:
            assessment.jobAiAssessmentSettings.aiDifficulty || undefined,
          customPrompts:
            assessment.jobAiAssessmentSettings.customPrompts || undefined,
          skillWeightings:
            assessment.jobAiAssessmentSettings.skillWeightings || undefined,
          maxSections:
            assessment.jobAiAssessmentSettings.maxSections || undefined,
          maxQuestionsPerSection:
            assessment.jobAiAssessmentSettings.maxQuestionsPerSection ||
            undefined,
          proctoringEnabled:
            assessment.jobAiAssessmentSettings.proctoringEnabled || undefined,
          maxWarnings:
            assessment.jobAiAssessmentSettings.maxWarnings || undefined,
          tabSwitchLimit:
            assessment.jobAiAssessmentSettings.tabSwitchLimit || undefined,
          copyPasteAllowed:
            assessment.jobAiAssessmentSettings.copyPasteAllowed || undefined,
          videoRecordingEnabled:
            assessment.jobAiAssessmentSettings.videoRecordingEnabled ||
            undefined,
          minimumVideoLength:
            assessment.jobAiAssessmentSettings.minimumVideoLength || undefined,
          aiVideoAnalysisEnabled:
            assessment.jobAiAssessmentSettings.aiVideoAnalysisEnabled ||
            undefined,
          autoPublishOnSuccess:
            assessment.jobAiAssessmentSettings.autoPublishOnSuccess ||
            undefined,
          autoNotifyOnComplete:
            assessment.jobAiAssessmentSettings.autoNotifyOnComplete ||
            undefined,
          interviewLanguage:
            assessment.jobAiAssessmentSettings.interviewLanguage || undefined,
          interviewDialect:
            assessment.jobAiAssessmentSettings.interviewDialect || undefined,
          interviewVoiceGender:
            assessment.jobAiAssessmentSettings.interviewVoiceGender ||
            undefined,
          sectionTemplates:
            assessment.jobAiAssessmentSettings.sectionTemplates || undefined,
          questionTemplates:
            assessment.jobAiAssessmentSettings.questionTemplates || undefined,
          customStyles:
            assessment.jobAiAssessmentSettings.customStyles || undefined,
          customInstructions:
            assessment.jobAiAssessmentSettings.customInstructions || undefined,
          createdAt: assessment.jobAiAssessmentSettings.createdAt,
          updatedAt: assessment.jobAiAssessmentSettings.updatedAt,
        }
      : undefined,
    task: assessment.task
      ? {
          id: assessment.task.id,
          assessment: assessment.task.assessment,
          status: assessment.task.status as JobAiAssessmentTaskStatusEnum,
          error: assessment.task.error || undefined,
          createdAt: assessment.task.createdAt,
          updatedAt: assessment.task.updatedAt,
        }
      : undefined,

    resumeText: assessment.resumeText || undefined,
    jobDescriptionText: assessment.jobDescriptionText || undefined,

    createdAt: assessment.createdAt,
    updatedAt: assessment.updatedAt,
  };
}

export function toCandidateJobAiAssessmentTaskDomain(
  task: any
): ICandidateJobAiAssessmentTask {
  return {
    id: task.id,
    assessment: toCandidateJobAiAssessmentDomain(task.assessment),
    status: task.status as JobAiAssessmentTaskStatusEnum,
    error: task.error || undefined,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

export function toCandidateJobAiAssessmentProctoringDomain(
  proctoring: any
): ICandidateJobAiAssessmentProctoring {
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

/**
 * @openapi
 * components:
 *   parameters:
 *     ICandidateJobAiAssessmentInterviewsFilterQuery:
 *       in: query
 *       name: status
 *       required: false
 *       schema:
 *         type: array
 *         items:
 *           $ref: '#/components/schemas/JobAiAssessmentInviteStatusEnum'
 *           description: Filter by invitation status (supports PENDING, ACCEPTED, DECLINED, EXPIRED, CANCELLED)
 *         search:
 *           type: string
 *           description: Search by candidate name, email, company name, or job posting title
 */
export interface ICandidateJobAiAssessmentInterviewsFilterQuery {
  status: JobAiAssessmentInviteStatusEnum[];
  search?: string;
}
