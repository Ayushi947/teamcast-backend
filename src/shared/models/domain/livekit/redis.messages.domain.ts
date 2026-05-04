/**
 * Redis Message Types for LiveKit Agent Communication
 *
 * These types define the message format for Redis-based communication
 * between the backend and LiveKit agents during live assessments.
 */

export enum RedisMessageType {
  QUESTION = 'QUESTION',
  RESPONSE = 'RESPONSE',
  ACK = 'ACK',
  ERROR = 'ERROR',
  HEARTBEAT = 'HEARTBEAT',
}

export enum QuestionStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  SPEAKING = 'SPEAKING',
  SPOKEN = 'SPOKEN',
  LISTENING = 'LISTENING',
  ANSWERED = 'ANSWERED',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export enum RedisErrorType {
  TIMEOUT = 'TIMEOUT',
  DELIVERY_FAILED = 'DELIVERY_FAILED',
  STT_ERROR = 'STT_ERROR',
  TTS_ERROR = 'TTS_ERROR',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
}

/**
 * Base message interface
 */
export interface IRedisBaseMessage {
  messageId: string;
  messageType: RedisMessageType;
  assessmentId: string;
  timestamp: string; // ISO8601
}

/**
 * Question message sent from backend to agent
 */
export interface IRedisQuestionMessage extends IRedisBaseMessage {
  messageType: RedisMessageType.QUESTION;
  questionId: string;
  sectionId: string;
  question: string;
  questionType: string; // TEXT | MULTIPLE_CHOICE | CODE | BOOLEAN
  options?: Record<string, any>;
  sequence: number; // Question number in assessment
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  previousQuestionId?: string | null;
  expectedResponseBy: string; // ISO8601 - timeout threshold
  retryCount: number;
}

/**
 * Response message sent from agent to backend
 */
export interface IRedisResponseMessage extends IRedisBaseMessage {
  messageType: RedisMessageType.RESPONSE;
  participantId: string;
  questionId: string;
  answer: string;
  transcriptText?: string;
  audioMetadata?: {
    duration: number;
    confidence: number;
    completedAt: string; // ISO8601
  };
  acknowledgment: {
    received: boolean;
    processedBy: string; // 'agent' | 'backend'
    processedAt: string; // ISO8601
  };
}

/**
 * Acknowledgment message
 */
export interface IRedisAckMessage extends IRedisBaseMessage {
  messageType: RedisMessageType.ACK;
  referenceMessageId: string; // Original message being acknowledged
  referenceQuestionId?: string;
  status: QuestionStatus;
  metadata?: Record<string, any>;
}

/**
 * Error message
 */
export interface IRedisErrorMessage extends IRedisBaseMessage {
  messageType: RedisMessageType.ERROR;
  questionId?: string;
  errorType: RedisErrorType;
  errorMessage: string;
  retryCount: number;
  willRetry: boolean;
  stackTrace?: string;
}

/**
 * Heartbeat message for connection health monitoring
 */
export interface IRedisHeartbeatMessage extends IRedisBaseMessage {
  messageType: RedisMessageType.HEARTBEAT;
  participantId?: string;
  source: 'backend' | 'agent';
  metadata?: {
    currentQuestionId?: string;
    currentStatus?: QuestionStatus;
  };
}

/**
 * Union type of all message types
 */
export type IRedisMessage =
  | IRedisQuestionMessage
  | IRedisResponseMessage
  | IRedisAckMessage
  | IRedisErrorMessage
  | IRedisHeartbeatMessage;

/**
 * Question state stored in Redis
 */
export interface IRedisQuestionState {
  questionId: string;
  sectionId: string;
  status: QuestionStatus;
  sentAt?: string; // ISO8601
  deliveredAt?: string;
  spokenAt?: string;
  answeredAt?: string;
  completedAt?: string;
  retryCount: number;
  lastError?: string;
  lastActivityAt: string; // ISO8601
}

/**
 * Assessment progress stored in Redis
 */
export interface IRedisAssessmentProgress {
  assessmentId: string;
  participantId?: string;
  currentQuestionId?: string;
  currentSectionId?: string;
  totalQuestions: number;
  completedQuestions: number;
  currentQuestionStatus: QuestionStatus;
  lastActivityAt: string; // ISO8601
}

/**
 * Redis key patterns for assessment communication
 */
export const RedisKeyPatterns = {
  // Question queue
  questionQueue: (assessmentId: string) =>
    `assessment:${assessmentId}:questions`,
  questionNotify: (assessmentId: string) =>
    `assessment:${assessmentId}:question_notify`,

  // Response queue
  responseQueue: (assessmentId: string) =>
    `assessment:${assessmentId}:responses`,
  responseNotify: (assessmentId: string) =>
    `assessment:${assessmentId}:response_notify`,

  // State management
  questionState: (assessmentId: string, questionId: string) =>
    `assessment:${assessmentId}:question:${questionId}:state`,
  assessmentProgress: (assessmentId: string) =>
    `assessment:${assessmentId}:progress`,
  assessmentParticipant: (assessmentId: string) =>
    `assessment:${assessmentId}:participant`,

  // Completed questions tracking
  completedQuestions: (assessmentId: string) =>
    `assessment:${assessmentId}:questions:completed`,

  // ACK channels
  ackChannel: (assessmentId: string) => `assessment:${assessmentId}:ack`,

  // Error tracking
  errorChannel: (assessmentId: string) => `assessment:${assessmentId}:error`,

  // Heartbeat
  heartbeatChannel: (assessmentId: string) =>
    `assessment:${assessmentId}:heartbeat`,
} as const;

/**
 * Configuration constants
 */
export const RedisConfig = {
  // Message TTL (time to live) in seconds
  MESSAGE_TTL: 3600, // 1 hour
  STATE_TTL: 7200, // 2 hours

  // Timeouts in milliseconds
  ACK_TIMEOUT: 30000, // 30 seconds
  RESPONSE_TIMEOUT: 180000, // 3 minutes
  DELIVERY_TIMEOUT: 10000, // 10 seconds

  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000, // 2 seconds

  // Polling intervals
  POLL_INTERVAL: 500, // 500ms for ACK polling
  WATCHDOG_INTERVAL: 30000, // 30 seconds for stuck question detection

  // Queue configuration
  BRPOP_TIMEOUT: 10, // 10 seconds blocking timeout for BRPOP
} as const;
