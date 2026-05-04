import { ICandidateJobAiAssessmentQuestion } from '@/shared/models/domain/candidate/job.ai.assessment.domain';
import {
  JobAiAssessmentTaskStatusEnum,
  QuestionTypeEnum,
} from '@/shared/models/common/enums';
import { IPublicPracticeAssessment } from '@/shared/models/domain/candidate/public.practice.assessment.domain';

// Metadata type definition for chat messages
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

/**
 * Practice Assessment Task interface
 * Focused on job description (65%) and resume (35%) assessment
 */
export interface IPracticeAssessmentTask {
  taskId: string;
  status: JobAiAssessmentTaskStatusEnum;
  assessment: IPublicPracticeAssessment;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  chatHistory?: Array<ChatMessage>;
}

/**
 * Answer submitted response for practice assessment
 */
export interface IPracticeAssessmentAnswerSubmitted {
  nextQuestion: ICandidateJobAiAssessmentQuestion | null;
  shouldEndAssessment: boolean;
  isCompleted?: boolean;
}

/**
 * Practice Assessment Provider Interface
 * Focused on job description (65%) and resume (35%) assessment
 * No onboarding assessment data required
 */
export interface IPracticeAssessmentProvider {
  /**
   * Initializes the practice assessment
   * @param taskId The identifier of the practice assessment task
   * @param resumeText Candidate's resume text (35% weight)
   * @param jobDescriptionText Job description text (65% weight)
   * @param settings Assessment settings
   * @returns A promise that resolves to the practice assessment task
   */
  initializeAssessment(
    taskId: string,
    resumeText: string,
    jobDescriptionText: string,
    settings: {
      maxSections?: number;
      maxQuestionsPerSection?: number;
      requiredSections?: string[];
      defaultPassingScore?: number;
      defaultAssessmentDuration?: number;
    }
  ): Promise<IPracticeAssessmentTask>;

  /**
   * Evaluates the practice assessment
   * @param taskId The identifier of the practice assessment task
   * @returns A promise that resolves to the practice assessment task with results
   */
  doAssessment(taskId: string): Promise<IPracticeAssessmentTask>;

  /**
   * Gets the status of a practice assessment task
   * @param taskId The identifier of the practice assessment task
   * @returns A promise that resolves to the practice assessment task
   */
  getPracticeAssessmentTask(taskId: string): Promise<IPracticeAssessmentTask>;

  /**
   * Gets the next question for the practice assessment
   * @param taskId The identifier of the practice assessment task
   * @param previousQuestionWithAnswer The last question with answer
   * @returns A promise that resolves to the next question
   */
  getNextQuestion(
    taskId: string,
    previousQuestionWithAnswer?: ICandidateJobAiAssessmentQuestion
  ): Promise<IPracticeAssessmentAnswerSubmitted>;

  /**
   * Saves the answer for a practice assessment question
   * @param taskId The identifier of the practice assessment task
   * @param question The question to save the answer for
   */
  saveAnswer(
    taskId: string,
    question: ICandidateJobAiAssessmentQuestion
  ): Promise<ICandidateJobAiAssessmentQuestion>;

  /**
   * Process the practice assessment video analysis
   * @param taskId The identifier of the practice assessment task
   * @returns A promise that resolves to the practice assessment task
   */
  doAssessmentVideoAnalysis(taskId: string): Promise<IPracticeAssessmentTask>;
}
