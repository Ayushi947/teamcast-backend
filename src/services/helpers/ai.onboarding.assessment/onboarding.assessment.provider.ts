import {
  ICandidateOnboardingAssessment,
  ICandidateOnboardingAssessmentAnswerSubmitted,
  ICandidateOnboardingAssessmentQuestion,
} from '@/shared/models/domain/candidate/onboarding.assessment.domain';
import {
  OnboardingAssessmentTaskStatusEnum,
  QuestionTypeEnum,
} from '@/shared/models/common/enums';

// Add metadata type definition
interface ChatMessageMetadata {
  questionId?: string;
  sectionId?: string;
  isAnswer?: boolean;
  questionType?: QuestionTypeEnum;
  score?: number;
  maxScore?: number;
  isSectionStart?: boolean;
  sectionType?: string;
  previousQuestionId?: string;
  questionNumber?: number;
  maxQuestions?: number;
  isLastQuestion?: boolean;
  order?: number;
}

interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
  metadata?: ChatMessageMetadata;
}

export interface IAiOnboardingAssessmentTask {
  taskId: string;
  status: OnboardingAssessmentTaskStatusEnum;
  assessment: ICandidateOnboardingAssessment;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  chatHistory?: Array<ChatMessage>;
}

export interface IOnboardingAssessmentProvider {
  /**
   * Initiates the onboarding assessment initialize job
   * @param taskId The identifier of the onboarding assessment initialize task
   * @param assessment The onboarding assessment
   * @returns A promise that resolves to the onboarding assessment initialize task identifier
   */
  initializeAssessment(
    taskId: string,
    assessment: ICandidateOnboardingAssessment
  ): Promise<IAiOnboardingAssessmentTask>;

  /**
   * Does the onboarding assessment
   * @param taskId The identifier of the onboarding assessment task
   * @param assessment The onboarding assessment
   * @returns A promise that resolves to the onboarding assessment task identifier
   */
  doAssessment(taskId: string): Promise<IAiOnboardingAssessmentTask>;

  /**
   * Gets the status of a onboarding assessment task
   * @param taskId The identifier of the onboarding assessment task
   * @returns A promise that resolves to the onboarding assessment task status
   */
  getOnboardingAssessmentTask(
    taskId: string
  ): Promise<IAiOnboardingAssessmentTask>;

  /**
   * Gets the next question for the onboarding assessment
   * @param taskId The identifier of the onboarding assessment task
   * @param previousQuestionWithAnswer The last question with answer
   * @returns A promise that resolves to the next question for the onboarding assessment
   */
  getNextQuestion(
    taskId: string,
    previousQuestionWithAnswer?: ICandidateOnboardingAssessmentQuestion
  ): Promise<ICandidateOnboardingAssessmentAnswerSubmitted>;

  /**
   * Saves the answer for the onboarding assessment question
   * @param taskId The identifier of the onboarding assessment task
   * @param question The question to save the answer for
   */
  saveAnswer(
    taskId: string,
    question: ICandidateOnboardingAssessmentQuestion
  ): Promise<ICandidateOnboardingAssessmentQuestion>;

  /**
   * Process the onboarding assessment video analysis
   * @param taskId The identifier of the onboarding assessment task
   * @returns A promise that resolves to the onboarding assessment task identifier
   */
  doAssessmentVideoAnalysis(
    taskId: string
  ): Promise<IAiOnboardingAssessmentTask>;
}
