import {
  PublicPracticeAssessmentStatusEnum,
  PublicPracticeAssessmentResultEnum,
  PublicPracticeAssessmentSectionStatusEnum,
  PublicPracticeAssessmentSectionResultEnum,
  PublicPracticeAssessmentRecommendationEnum,
} from '../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     IPublicPracticeAssessmentCreate:
 *       type: object
 *       required:
 *         - candidateName
 *         - candidateEmail
 *       properties:
 *         parsedJobDataId:
 *           type: string
 *           format: uuid
 *           description: ID of the stored parsed job data (alternative to parsedJobData)
 *         parsedJobData:
 *           type: object
 *           description: Parsed job data from the parse endpoint (alternative to parsedJobDataId)
 *         candidateName:
 *           type: string
 *           description: Name of the candidate
 *         candidateEmail:
 *           type: string
 *           format: email
 *           description: Email of the candidate
 */
export interface IPublicPracticeAssessmentCreate {
  parsedJobDataId?: string;
  parsedJobData?: any;
  candidateName: string;
  candidateEmail: string;
  resumeFile?: Buffer; // Optional: Resume file buffer
  resumeFileName?: string; // Optional: Resume file name
  resumeParsingTaskId?: string; // Optional: ID of the public resume parsing task (legacy)
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPublicPracticeAssessment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the assessment
 *         title:
 *           type: string
 *           description: Title of the assessment
 *         description:
 *           type: string
 *           description: Description of the assessment
 *         sourceJobUrl:
 *           type: string
 *           format: uri
 *           description: URL of the job posting used to create this assessment
 *         candidateName:
 *           type: string
 *           description: Name of the candidate
 *         candidateEmail:
 *           type: string
 *           format: email
 *           description: Email of the candidate
 *         status:
 *           $ref: '#/components/schemas/PublicPracticeAssessmentStatusEnum'
 *         result:
 *           $ref: '#/components/schemas/PublicPracticeAssessmentResultEnum'
 *         score:
 *           type: number
 *           description: Score achieved in the assessment
 *         duration:
 *           type: number
 *           description: Duration of the assessment in seconds
 *         startedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         completedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         linkedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: When the assessment was linked to a candidate account
 *         candidateId:
 *           type: string
 *           nullable: true
 *           description: ID of the candidate (null if not yet linked)
 */
export interface IPublicPracticeAssessment {
  id: string;
  title: string;
  description: string;
  sourceJobUrl: string;
  candidateName: string;
  candidateEmail: string;
  status: PublicPracticeAssessmentStatusEnum;
  result: PublicPracticeAssessmentResultEnum;
  score: number;
  duration: number;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  linkedAt?: Date;
  candidateId?: string;
  termsAccepted?: boolean;
  termsAcceptedAt?: Date;
  // Feedback fields
  overallFeedback?: string;
  strengths?: string[];
  areasForImprovement?: string[];
  recommendation?: PublicPracticeAssessmentRecommendationEnum;
  // Skills and fit analysis
  technicalSkills?: string[];
  softSkills?: string[];
  industriesFit?: string[];
  jobRolesFit?: string[];

  resumeText?: string;
  jobDescriptionText?: string;
  // Relationships
  sections?: IPublicPracticeAssessmentSection[];
  progressState?: IPublicPracticeAssessmentProgress;
  proctoring?: IPublicPracticeAssessmentProctoring;
  publicPracticeAssessmentSettings?: IPublicPracticeAssessmentSettings;
  videoAnalysis?: IPublicPracticeAssessmentVideoAnalysis;
}

/**
 * Metadata returned when creating a public practice assessment
 */
export interface IPublicPracticeAssessmentCreateMetadata {
  requiresPasswordSetup: boolean;
  hasResume: boolean;
  resumeParsed: boolean;
}

/**
 * Public practice assessment with creation metadata (for internal service use)
 */
export interface IPublicPracticeAssessmentWithMetadata
  extends IPublicPracticeAssessment {
  _metadata: IPublicPracticeAssessmentCreateMetadata;
}

/**
 * Public practice assessment task
 */
export interface IPublicPracticeAssessmentTask {
  id: string;
  status: string;
  assessment?: IPublicPracticeAssessment;
}

/**
 * Public practice assessment answer submitted
 */
export interface IPublicPracticeAssessmentAnswerSubmitted {
  nextQuestion?: any;
  isCompleted: boolean;
  shouldEndAssessment?: boolean;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPublicPracticeAssessmentSettings:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         assessmentId:
 *           type: string
 *         greetingMessage:
 *           type: string
 *         defaultAssessmentDuration:
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
 *         interviewLanguage:
 *           type: string
 *         interviewDialect:
 *           type: string
 *         interviewVoiceGender:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
export interface IPublicPracticeAssessmentSettings {
  id: string;
  assessmentId: string;
  greetingMessage?: string;
  defaultAssessmentDuration?: number;
  maxSections?: number;
  maxQuestionsPerSection?: number;
  proctoringEnabled?: boolean;
  maxWarnings?: number;
  tabSwitchLimit?: number;
  copyPasteAllowed?: boolean;
  videoRecordingEnabled?: boolean;
  minimumVideoLength?: number;
  aiVideoAnalysisEnabled?: boolean;
  interviewLanguage?: string;
  interviewDialect?: string;
  interviewVoiceGender?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPublicPracticeAssessmentPresignedUrl:
 *       type: object
 *       properties:
 *         presignedUrl:
 *           type: string
 *           description: Presigned URL for uploading video chunks
 */
export interface IPublicPracticeAssessmentPresignedUrl {
  presignedUrl: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPublicPracticeAssessmentChunkUpload:
 *       type: object
 *       properties:
 *         chunkId:
 *           type: string
 *           description: ID of the uploaded chunk
 */
export interface IPublicPracticeAssessmentChunkUpload {
  chunkId: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPublicPracticeAssessmentSection:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         assessmentId:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         type:
 *           type: string
 *         status:
 *           $ref: '#/components/schemas/PublicPracticeAssessmentSectionStatusEnum'
 *         result:
 *           $ref: '#/components/schemas/PublicPracticeAssessmentSectionResultEnum'
 *         score:
 *           type: number
 *         order:
 *           type: number
 *         isRequired:
 *           type: boolean
 *         passThreshold:
 *           type: number
 *         startedAt:
 *           type: string
 *           format: date-time
 *         completedAt:
 *           type: string
 *           format: date-time
 *         feedback:
 *           type: string
 *         strengths:
 *           type: array
 *           items:
 *             type: string
 *         areasForImprovement:
 *           type: array
 *           items:
 *             type: string
 *         questions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IPublicPracticeAssessmentQuestion'
 */
export interface IPublicPracticeAssessmentSection {
  id: string;
  assessmentId: string;
  title: string;
  description: string;
  type: string;
  status: PublicPracticeAssessmentSectionStatusEnum;
  result: PublicPracticeAssessmentSectionResultEnum;
  score: number;
  order: number;
  isRequired: boolean;
  passThreshold: number;
  startedAt?: Date;
  completedAt?: Date;
  feedback?: string;
  strengths: string[];
  areasForImprovement: string[];
  questions: IPublicPracticeAssessmentQuestion[];
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPublicPracticeAssessmentQuestion:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         sectionId:
 *           type: string
 *         question:
 *           type: string
 *         questionType:
 *           type: string
 *         options:
 *           type: object
 *         correctAnswer:
 *           type: string
 *         answerGiven:
 *           type: string
 *         score:
 *           type: number
 *         maxScore:
 *           type: number
 *         order:
 *           type: number
 *         isRequired:
 *           type: boolean
 *         isLastQuestion:
 *           type: boolean
 *         feedback:
 *           type: string
 *         isAnswered:
 *           type: boolean
 */
export interface IPublicPracticeAssessmentQuestion {
  id: string;
  sectionId: string;
  question: string;
  questionType: string;
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

/**
 * @openapi
 * components:
 *   schemas:
 *     IPublicPracticeAssessmentProgress:
 *       type: object
 *       properties:
 *         currentSectionId:
 *           type: string
 *         currentQuestionId:
 *           type: string
 *         lastSavedAt:
 *           type: string
 *           format: date-time
 *         progressData:
 *           type: object
 *         isCompleted:
 *           type: boolean
 */
export interface IPublicPracticeAssessmentProgress {
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
 *     IPublicPracticeAssessmentProctoring:
 *       type: object
 *       properties:
 *         warningCount:
 *           type: number
 *         suspiciousEvents:
 *           type: object
 *         tabSwitches:
 *           type: number
 *         copyPasteAttempts:
 *           type: number
 *         multiplePersonsDetected:
 *           type: boolean
 *         audioIrregularities:
 *           type: boolean
 *         screenShareViolations:
 *           type: boolean
 *         automaticallyFailed:
 *           type: boolean
 *         manualReviewRequired:
 *           type: boolean
 *         reviewerNotes:
 *           type: string
 */
export interface IPublicPracticeAssessmentProctoring {
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
 *     IPublicPracticeAssessmentVideoAnalysis:
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
export interface IPublicPracticeAssessmentVideoAnalysis {
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
 *     IGlobalPracticeAssessmentSettings:
 *       type: object
 *       description: Global settings for practice assessments (admin configurable)
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the settings
 *         name:
 *           type: string
 *           description: Name of this configuration
 *         description:
 *           type: string
 *           description: Description of this configuration
 *         isSingleton:
 *           type: boolean
 *           description: Whether this is the singleton configuration (only one can be true)
 *         greetingMessage:
 *           type: string
 *           description: Greeting message for candidates
 *         defaultAssessmentDuration:
 *           type: number
 *           description: Default assessment duration in seconds
 *         defaultPassingScore:
 *           type: number
 *           description: Score threshold to pass (0.0-1.0)
 *         requiredSections:
 *           type: array
 *           items:
 *             type: string
 *           description: Types of sections required in all assessments
 *         maximumAttempts:
 *           type: number
 *           description: Maximum attempts allowed
 *         cooldownPeriod:
 *           type: number
 *           description: Days between attempts
 *         maxSections:
 *           type: number
 *           description: Maximum number of sections allowed
 *         maxQuestionsPerSection:
 *           type: number
 *           description: Maximum number of questions per section
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
 *           description: Minimum video length in minutes
 *         aiVideoAnalysisEnabled:
 *           type: boolean
 *           description: Whether AI video analysis is enabled
 *         autoPublishOnSuccess:
 *           type: boolean
 *           description: Whether to auto-publish profile on passing
 *         autoNotifyOnComplete:
 *           type: boolean
 *           description: Whether to auto-notify candidate on completion
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
 *           description: Predefined section templates (JSON)
 *         questionTemplates:
 *           type: object
 *           description: Predefined question templates (JSON)
 *         customStyles:
 *           type: object
 *           description: UI customization options (JSON)
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
export interface IGlobalPracticeAssessmentSettings {
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
 * Update payload for global practice assessment settings
 */
export type IGlobalPracticeAssessmentSettingsUpdate = Partial<
  Omit<
    IGlobalPracticeAssessmentSettings,
    'id' | 'isSingleton' | 'createdAt' | 'updatedAt'
  >
>;

/**
 * Helper function to convert database model to domain model
 */
export function toGlobalPracticeAssessmentSettingsDomain(
  settings: any
): IGlobalPracticeAssessmentSettings {
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
