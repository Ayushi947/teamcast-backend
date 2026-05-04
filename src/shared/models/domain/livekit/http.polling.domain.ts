/**
 * HTTP Polling Domain Models for LiveKit Agent Communication
 *
 * Simple, robust alternative to Redis pub/sub
 */

export enum QuestionPollStatus {
  READY = 'READY', // Question ready to be asked
  GENERATING = 'GENERATING', // Backend generating next question
  COMPLETED = 'COMPLETED', // Assessment complete, no more questions
  ERROR = 'ERROR', // Error occurred
}

/**
 * Response when agent polls for next question
 */
export interface INextQuestionPollResponse {
  status: QuestionPollStatus;
  questionId?: string;
  question?: string;
  questionType?: string;
  sequence?: number;
  isFirstQuestion?: boolean;
  isLastQuestion?: boolean;
  expectedResponseBy?: string; // ISO8601 timeout
  errorMessage?: string;
  sectionId?: string;
  sectionTitle?: string;
}

/**
 * Request when agent submits an answer
 */
export interface ISubmitAnswerRequest {
  assessmentId: string;
  questionId: string;
  answer: string;
  transcript?: string;
  audioMetadata?: {
    duration: number;
    confidence: number;
    completedAt: string;
  };
}

/**
 * Response after submitting answer
 */
export interface ISubmitAnswerResponse {
  success: boolean;
  message: string;
  nextQuestionGenerating: boolean;
  validationError?: {
    intent: string;
    reason: string;
    shouldRetry: boolean;
  };
}
