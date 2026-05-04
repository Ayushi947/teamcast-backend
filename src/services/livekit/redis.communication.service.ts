import { singleton } from '@/shared/decorators/singleton';
import { logger } from '@/shared/utils/logger';
import { Redis } from 'ioredis';
import { ENV } from '@/config/env';
import { v4 as uuidv4 } from 'uuid';
import {
  IRedisQuestionMessage,
  IRedisResponseMessage,
  RedisMessageType,
  QuestionStatus,
  RedisKeyPatterns,
  RedisConfig,
} from '@/shared/models/domain/livekit/redis.messages.domain';
import { ICandidateOnboardingAssessmentQuestion } from '@/shared/models/domain/candidate/onboarding.assessment.domain';

/**
 * Redis Communication Service for LiveKit Agent Integration
 *
 * Handles Redis-based communication between backend and LiveKit agents
 * for assessment question/response flow.
 */
@singleton
export class RedisLiveKitCommunicationService {
  private static instance: RedisLiveKitCommunicationService;
  private redisClient: Redis;
  private redisSub: Redis; // Separate client for subscriptions

  constructor() {
    // Main Redis client for pub/push operations (use LiveKit Redis instance)
    this.redisClient = new Redis({
      host: ENV.LIVEKIT_REDIS_HOST,
      port: ENV.LIVEKIT_REDIS_PORT,
      password: ENV.LIVEKIT_REDIS_PASSWORD,
      username: ENV.LIVEKIT_REDIS_USER,
      db: ENV.LIVEKIT_REDIS_DB,
      enableReadyCheck: true,
      lazyConnect: false,
      maxRetriesPerRequest: RedisConfig.MAX_RETRIES,
    });

    // Separate client for subscriptions (required by Redis)
    this.redisSub = new Redis({
      host: ENV.LIVEKIT_REDIS_HOST,
      port: ENV.LIVEKIT_REDIS_PORT,
      password: ENV.LIVEKIT_REDIS_PASSWORD,
      username: ENV.LIVEKIT_REDIS_USER,
      db: ENV.LIVEKIT_REDIS_DB,
      enableReadyCheck: true,
      lazyConnect: false,
      maxRetriesPerRequest: RedisConfig.MAX_RETRIES,
    });

    this.redisClient.on('error', (err) => {
      logger.error('Redis LiveKit communication error', {
        context: 'RedisLiveKitCommunicationService',
        error: err.message,
      });
    });

    this.redisClient.on('connect', () => {
      logger.info('Redis LiveKit communication connected', {
        context: 'RedisLiveKitCommunicationService',
      });
    });

    logger.info('RedisLiveKitCommunicationService initialized', {
      context: 'RedisLiveKitCommunicationService.constructor',
    });
  }

  /**
   * Publish question to Redis for LiveKit agent consumption
   */
  async publishQuestion(
    assessmentId: string,
    question: ICandidateOnboardingAssessmentQuestion,
    sequence: number,
    isFirstQuestion: boolean,
    isLastQuestion: boolean,
    previousQuestionId?: string
  ): Promise<void> {
    const messageId = uuidv4();
    const questionId = question.id;

    try {
      // Check if question already exists in queue (idempotency)
      const queueKey = RedisKeyPatterns.questionQueue(assessmentId);
      const existingMessages = await this.redisClient.lrange(queueKey, 0, -1);

      for (const msg of existingMessages) {
        try {
          const parsed = JSON.parse(msg);
          if (parsed.questionId === questionId) {
            logger.info(
              'Question already in queue, skipping duplicate publish',
              {
                context: 'RedisLiveKitCommunicationService.publishQuestion',
                assessmentId,
                questionId,
              }
            );
            return; // Idempotent - question already published
          }
        } catch (_e) {
          // Ignore parse errors
        }
      }

      // Create state entry
      const stateKey = RedisKeyPatterns.questionState(assessmentId, questionId);
      await this.redisClient.hset(stateKey, {
        questionId,
        sectionId: question.sectionId,
        status: QuestionStatus.PENDING,
        sentAt: '',
        deliveredAt: '',
        spokenAt: '',
        answeredAt: '',
        completedAt: '',
        retryCount: '0',
        lastError: '',
        lastActivityAt: new Date().toISOString(),
      });
      await this.redisClient.expire(stateKey, RedisConfig.STATE_TTL);

      // Create question message
      const questionMessage: IRedisQuestionMessage = {
        messageId,
        messageType: RedisMessageType.QUESTION,
        assessmentId,
        questionId,
        sectionId: question.sectionId,
        question: question.question,
        questionType: question.questionType,
        options: question.options || {},
        sequence,
        isFirstQuestion,
        isLastQuestion,
        previousQuestionId: previousQuestionId || null,
        expectedResponseBy: new Date(
          Date.now() + RedisConfig.RESPONSE_TIMEOUT
        ).toISOString(),
        retryCount: 0,
        timestamp: new Date().toISOString(),
      };

      // Push to queue
      await this.redisClient.lpush(queueKey, JSON.stringify(questionMessage));
      await this.redisClient.expire(queueKey, RedisConfig.MESSAGE_TTL);

      // Update state to SENT
      await this.redisClient.hset(stateKey, {
        status: QuestionStatus.SENT,
        sentAt: new Date().toISOString(),
      });

      // Publish notification
      const notifyChannel = RedisKeyPatterns.questionNotify(assessmentId);
      await this.redisClient.publish(
        notifyChannel,
        JSON.stringify({
          messageId,
          questionId,
          timestamp: new Date().toISOString(),
        })
      );

      logger.info('Published question to Redis', {
        context: 'RedisLiveKitCommunicationService.publishQuestion',
        assessmentId,
        questionId,
        sequence,
      });
    } catch (error) {
      logger.error('Error publishing question to Redis', {
        context: 'RedisLiveKitCommunicationService.publishQuestion',
        assessmentId,
        questionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Subscribe to candidate responses from LiveKit agent
   */
  async subscribeToResponses(
    assessmentId: string,
    callback: (response: IRedisResponseMessage) => Promise<void>
  ): Promise<void> {
    const notifyChannel = RedisKeyPatterns.responseNotify(assessmentId);

    try {
      await this.redisSub.subscribe(notifyChannel);

      this.redisSub.on('message', async (channel, message) => {
        if (channel === notifyChannel) {
          try {
            const notification = JSON.parse(message);
            logger.debug('Received response notification', {
              context: 'RedisLiveKitCommunicationService.subscribeToResponses',
              assessmentId,
              notification,
            });

            // Get the actual response from queue
            const response = await this.getResponse(assessmentId);
            if (response) {
              await callback(response);
            }
          } catch (error) {
            logger.error('Error processing response notification', {
              context: 'RedisLiveKitCommunicationService.subscribeToResponses',
              assessmentId,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      });

      logger.info('Subscribed to responses', {
        context: 'RedisLiveKitCommunicationService.subscribeToResponses',
        assessmentId,
        channel: notifyChannel,
      });
    } catch (error) {
      logger.error('Error subscribing to responses', {
        context: 'RedisLiveKitCommunicationService.subscribeToResponses',
        assessmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get response from queue (blocking pop)
   */
  async getResponse(
    assessmentId: string,
    timeout: number = RedisConfig.BRPOP_TIMEOUT
  ): Promise<IRedisResponseMessage | null> {
    const queueKey = RedisKeyPatterns.responseQueue(assessmentId);

    try {
      const result = await this.redisClient.brpop(queueKey, timeout);

      if (result) {
        const [, messageJson] = result;
        const response: IRedisResponseMessage = JSON.parse(messageJson);

        logger.info('Retrieved response from queue', {
          context: 'RedisLiveKitCommunicationService.getResponse',
          assessmentId,
          questionId: response.questionId,
        });

        return response;
      }

      return null;
    } catch (error) {
      logger.error('Error getting response from queue', {
        context: 'RedisLiveKitCommunicationService.getResponse',
        assessmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Wait for acknowledgment with timeout
   */
  async waitForAck(
    assessmentId: string,
    questionId: string,
    expectedStatus: QuestionStatus,
    timeoutMs: number = RedisConfig.ACK_TIMEOUT
  ): Promise<boolean> {
    const startTime = Date.now();
    const stateKey = RedisKeyPatterns.questionState(assessmentId, questionId);

    while (Date.now() - startTime < timeoutMs) {
      try {
        const state = await this.redisClient.hgetall(stateKey);

        if (state.status === expectedStatus) {
          logger.debug('Received expected ACK', {
            context: 'RedisLiveKitCommunicationService.waitForAck',
            questionId,
            status: expectedStatus,
          });
          return true;
        }

        // Check for errors
        if (state.lastError) {
          logger.error('Question delivery failed', {
            context: 'RedisLiveKitCommunicationService.waitForAck',
            questionId,
            error: state.lastError,
          });
          return false;
        }

        // Poll every 500ms
        await new Promise((resolve) =>
          setTimeout(resolve, RedisConfig.POLL_INTERVAL)
        );
      } catch (error) {
        logger.error('Error waiting for ACK', {
          context: 'RedisLiveKitCommunicationService.waitForAck',
          questionId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return false;
      }
    }

    logger.warn('ACK timeout', {
      context: 'RedisLiveKitCommunicationService.waitForAck',
      questionId,
      expectedStatus,
      timeoutMs,
    });

    return false;
  }

  /**
   * Check if question is completed
   */
  async isQuestionCompleted(
    assessmentId: string,
    questionId: string
  ): Promise<boolean> {
    const stateKey = RedisKeyPatterns.questionState(assessmentId, questionId);

    try {
      const state = await this.redisClient.hgetall(stateKey);
      if (!state || Object.keys(state).length === 0) {
        return false;
      }

      return (
        state.status === QuestionStatus.COMPLETED ||
        state.status === QuestionStatus.ANSWERED
      );
    } catch (error) {
      logger.error('Error checking question completion', {
        context: 'RedisLiveKitCommunicationService.isQuestionCompleted',
        questionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Initialize assessment progress tracking
   */
  async initializeAssessmentProgress(
    assessmentId: string,
    totalQuestions: number,
    participantId?: string
  ): Promise<void> {
    const progressKey = RedisKeyPatterns.assessmentProgress(assessmentId);

    try {
      await this.redisClient.hset(progressKey, {
        assessmentId,
        participantId: participantId || '',
        currentQuestionId: '',
        currentSectionId: '',
        totalQuestions: totalQuestions.toString(),
        completedQuestions: '0',
        currentQuestionStatus: QuestionStatus.PENDING,
        lastActivityAt: new Date().toISOString(),
      });
      await this.redisClient.expire(progressKey, RedisConfig.STATE_TTL);

      logger.info('Initialized assessment progress', {
        context:
          'RedisLiveKitCommunicationService.initializeAssessmentProgress',
        assessmentId,
        totalQuestions,
      });
    } catch (error) {
      logger.error('Error initializing assessment progress', {
        context:
          'RedisLiveKitCommunicationService.initializeAssessmentProgress',
        assessmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Update assessment progress
   */
  async updateAssessmentProgress(
    assessmentId: string,
    currentQuestionId: string,
    currentSectionId: string,
    completedQuestions: number
  ): Promise<void> {
    const progressKey = RedisKeyPatterns.assessmentProgress(assessmentId);

    try {
      await this.redisClient.hset(progressKey, {
        currentQuestionId,
        currentSectionId,
        completedQuestions: completedQuestions.toString(),
        lastActivityAt: new Date().toISOString(),
      });

      logger.debug('Updated assessment progress', {
        context: 'RedisLiveKitCommunicationService.updateAssessmentProgress',
        assessmentId,
        currentQuestionId,
        completedQuestions,
      });
    } catch (error) {
      logger.error('Error updating assessment progress', {
        context: 'RedisLiveKitCommunicationService.updateAssessmentProgress',
        assessmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Don't throw - progress update failures shouldn't block flow
    }
  }

  /**
   * Unsubscribe from response notifications for an assessment
   */
  async unsubscribeFromResponses(assessmentId: string): Promise<void> {
    const notifyChannel = RedisKeyPatterns.responseNotify(assessmentId);

    try {
      await this.redisSub.unsubscribe(notifyChannel);

      logger.info('Unsubscribed from responses', {
        context: 'RedisLiveKitCommunicationService.unsubscribeFromResponses',
        assessmentId,
        channel: notifyChannel,
      });
    } catch (error) {
      logger.error('Error unsubscribing from responses', {
        context: 'RedisLiveKitCommunicationService.unsubscribeFromResponses',
        assessmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Don't throw - unsubscribe failures shouldn't block flow
    }
  }

  /**
   * Cleanup assessment data from Redis
   */
  async cleanupAssessment(assessmentId: string): Promise<void> {
    try {
      // Unsubscribe from notifications first
      await this.unsubscribeFromResponses(assessmentId);

      const pattern = `assessment:${assessmentId}:*`;
      const keys = await this.redisClient.keys(pattern);

      if (keys.length > 0) {
        await this.redisClient.del(...keys);
      }

      logger.info('Cleaned up assessment data', {
        context: 'RedisLiveKitCommunicationService.cleanupAssessment',
        assessmentId,
        keysDeleted: keys.length,
      });
    } catch (error) {
      logger.error('Error cleaning up assessment', {
        context: 'RedisLiveKitCommunicationService.cleanupAssessment',
        assessmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Don't throw - cleanup failures shouldn't block flow
    }
  }

  /**
   * Disconnect Redis clients
   */
  /**
   * Mark assessment as pending start (waiting for initialization to complete)
   */
  async markAssessmentPendingStart(assessmentId: string): Promise<void> {
    try {
      const key = `assessment:${assessmentId}:pending_start`;
      // Set with 10 minute TTL (assessment should initialize within this time)
      await this.redisClient.setex(key, 600, 'true');
      logger.info('Marked assessment as pending start', {
        context: 'RedisLiveKitCommunicationService.markAssessmentPendingStart',
        assessmentId,
      });
    } catch (error) {
      logger.error('Error marking assessment as pending start', {
        context: 'RedisLiveKitCommunicationService.markAssessmentPendingStart',
        assessmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Check if assessment is pending start
   */
  async isAssessmentPendingStart(assessmentId: string): Promise<boolean> {
    try {
      const key = `assessment:${assessmentId}:pending_start`;
      const exists = await this.redisClient.exists(key);
      return exists === 1;
    } catch (error) {
      logger.error('Error checking assessment pending start', {
        context: 'RedisLiveKitCommunicationService.isAssessmentPendingStart',
        assessmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Clear pending start flag for assessment
   */
  async clearAssessmentPendingStart(assessmentId: string): Promise<void> {
    try {
      const key = `assessment:${assessmentId}:pending_start`;
      await this.redisClient.del(key);
      logger.info('Cleared assessment pending start flag', {
        context: 'RedisLiveKitCommunicationService.clearAssessmentPendingStart',
        assessmentId,
      });
    } catch (error) {
      logger.error('Error clearing assessment pending start', {
        context: 'RedisLiveKitCommunicationService.clearAssessmentPendingStart',
        assessmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.redisClient.quit();
      await this.redisSub.quit();
      logger.info('Redis LiveKit communication disconnected', {
        context: 'RedisLiveKitCommunicationService.disconnect',
      });
    } catch (error) {
      logger.error('Error disconnecting Redis', {
        context: 'RedisLiveKitCommunicationService.disconnect',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
