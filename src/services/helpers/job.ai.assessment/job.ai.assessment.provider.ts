import {
  ICandidateJobAiAssessment,
  ICandidateJobAiAssessmentAnswerSubmitted,
  ICandidateJobAiAssessmentQuestion,
} from '@/shared/models/domain/candidate/job.ai.assessment.domain';
import {
  JobAiAssessmentTaskStatusEnum,
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

export interface IAiJobAiAssessmentTask {
  taskId: string;
  status: JobAiAssessmentTaskStatusEnum;
  assessment: ICandidateJobAiAssessment;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  chatHistory?: Array<ChatMessage>;
}

export interface IJobAiAssessmentProvider {
  /**
   * Initiates the job.ai assessment initialize job
   * @param taskId The identifier of the job.ai assessment initialize task
   * @param assessment The job.ai assessment
   * @returns A promise that resolves to the job.ai assessment initialize task identifier
   */
  initializeAssessment(
    taskId: string,
    assessment: ICandidateJobAiAssessment
  ): Promise<IAiJobAiAssessmentTask>;

  /**
   * Does the job.ai assessment
   * @param taskId The identifier of the job.ai assessment task
   * @param assessment The job.ai assessment
   * @returns A promise that resolves to the job.ai assessment task identifier
   */
  doAssessment(taskId: string): Promise<IAiJobAiAssessmentTask>;

  /**
   * Gets the status of a job.ai assessment task
   * @param taskId The identifier of the job.ai assessment task
   * @returns A promise that resolves to the job.ai assessment task status
   */
  getJobAiAssessmentTask(taskId: string): Promise<IAiJobAiAssessmentTask>;

  /**
   * Gets the next question for the job.ai assessment
   * @param taskId The identifier of the job.ai assessment task
   * @param previousQuestionWithAnswer The last question with answer
   * @returns A promise that resolves to the next question for the job.ai assessment
   */
  getNextQuestion(
    taskId: string,
    previousQuestionWithAnswer?: ICandidateJobAiAssessmentQuestion
  ): Promise<ICandidateJobAiAssessmentAnswerSubmitted>;

  /**
   * Saves the answer for the job.ai assessment question
   * @param taskId The identifier of the job.ai assessment task
   * @param question The question to save the answer for
   */
  saveAnswer(
    taskId: string,
    question: ICandidateJobAiAssessmentQuestion
  ): Promise<ICandidateJobAiAssessmentQuestion>;

  /**
   * Process the job.ai assessment video analysis
   * @param taskId The identifier of the job.ai assessment task
   * @returns A promise that resolves to the job.ai assessment task identifier
   */
  doAssessmentVideoAnalysis(taskId: string): Promise<IAiJobAiAssessmentTask>;
}
