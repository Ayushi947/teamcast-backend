import { Request, Response, NextFunction } from 'express';
import { LiveKitService } from '@/services/livekit/livekit.service';
import { OnboardingAssessmentService } from '@/services/candidate/onboarding.assessment.service';
import { RedisLiveKitCommunicationService } from '@/services/livekit/redis.communication.service';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import {
  ILiveKitRoomApiRequest,
  ILiveKitRoomApiResponse,
  ILiveKitTokenApiRequest,
  ILiveKitTokenApiResponse,
  ILiveKitRoomStatusApiRequest,
  ILiveKitRoomStatusApiResponse,
} from '@/shared/models/api/livekit/livekit.api';
import { singleton } from '@/shared/decorators/singleton';
import { ErrorCode } from '@/utils/error.codes';
import { AppError } from '@/utils/app.error';
import { logger } from '@/shared/utils/logger';
import { AssessmentTerminationReasonEnum } from '@/shared/models/common/enums';

@singleton
export class LiveKitController extends BaseController {
  constructor(
    private readonly liveKitService: LiveKitService,
    private readonly onboardingAssessmentService: OnboardingAssessmentService,
    private readonly redisLiveKitService: RedisLiveKitCommunicationService
  ) {
    super();
  }

  /**
   * Create LiveKit room for assessment
   */
  createRoom = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ILiveKitRoomApiResponse>(req, res, next, async () => {
      const candidateId = req.user?.candidateId;
      if (!candidateId) {
        throw new AppError(
          'Candidate ID is required',
          400,
          ErrorCode.CANDIDATE_ID_REQUIRED
        );
      }

      const { data } = createIApiRequest<ILiveKitRoomApiRequest>(req);

      const serviceRequest = {
        ...data,
        candidateId,
        roomConfig: {
          ...data.roomConfig,
          useHttpPolling: data.roomConfig?.useHttpPolling ?? true, // ✅ FORCE HTTP polling (ONLY mode allowed)
          useRedisMode: false, // ❌ Redis mode DISABLED (not allowed)
        },
      };

      logger.info('[LiveKitController] Sending to service:', serviceRequest);

      const roomResponse =
        await this.liveKitService.createAssessmentRoom(serviceRequest);

      // If HTTP polling is enabled and this is an onboarding assessment, ensure progress state is initialized
      if (
        serviceRequest.roomConfig?.useHttpPolling &&
        serviceRequest.assessmentType === 'ONBOARDING'
      ) {
        try {
          // Get the assessment to check its status
          const assessment =
            await this.onboardingAssessmentService.getOnboardingAssessment(
              candidateId,
              serviceRequest.assessmentId
            );

          // Handle different assessment statuses
          if (assessment.status === 'AI_INITIALIZATION_COMPLETED') {
            // Assessment is ready to start - initialize progress state
            logger.info(
              '[LiveKitController] Starting HTTP polling assessment',
              {
                assessmentId: serviceRequest.assessmentId,
                candidateId,
              }
            );

            await this.onboardingAssessmentService.startAssessmentWithLiveKit(
              candidateId,
              serviceRequest.assessmentId
            );

            logger.info(
              '[LiveKitController] HTTP polling assessment started - agent will poll for questions'
            );
          } else if (assessment.status === 'CANDIDATE_ASSESSMENT_IN_PROGRESS') {
            // Assessment already started - progress state already set
            logger.info(
              '[LiveKitController] Assessment already in progress, agent will resume from current question',
              {
                assessmentId: serviceRequest.assessmentId,
                candidateId,
                currentQuestionId: assessment.progressState?.currentQuestionId,
              }
            );

            // ✅ CRITICAL: Dispatch agent for reconnection scenario
            // Agent might not be in room if candidate disconnected and reconnected
            const roomName = `onboarding-${serviceRequest.assessmentId}`;
            await this.liveKitService.dispatchAgentToRoom(roomName, {
              assessmentId: serviceRequest.assessmentId,
              assessmentType: serviceRequest.assessmentType,
            });

            logger.info(
              '[LiveKitController] Agent dispatched - will poll for current question via HTTP'
            );
          } else {
            // Assessment not ready yet - mark as pending
            logger.info(
              '[LiveKitController] Assessment not ready yet, marking as pending start',
              {
                assessmentId: serviceRequest.assessmentId,
                currentStatus: assessment.status,
              }
            );

            await this.redisLiveKitService.markAssessmentPendingStart(
              serviceRequest.assessmentId
            );
          }
        } catch (error) {
          logger.error(
            '[LiveKitController] Failed to handle Redis assessment',
            {
              error: error instanceof Error ? error.message : error,
              assessmentId: serviceRequest.assessmentId,
            }
          );
          // Don't fail the room creation, just log the error
        }
      }

      return roomResponse;
    });
  };

  /**
   * Generate LiveKit access token
   */
  generateToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ILiveKitTokenApiResponse>(req, res, next, async () => {
      const { data } = createIApiRequest<ILiveKitTokenApiRequest>(req);
      const tokenData = await this.liveKitService.generateToken(data);
      return {
        token: tokenData.token,
        expiresAt: tokenData.expiresAt,
      };
    });
  };

  /**
   * Get room status
   */
  getRoomStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ILiveKitRoomStatusApiResponse>(
      req,
      res,
      next,
      async () => {
        const { params } = createIApiRequest<ILiveKitRoomStatusApiRequest>(req);
        const roomName = params.roomName || req.params.roomName;

        if (!roomName) {
          throw new AppError(
            'Room name is required',
            400,
            ErrorCode.VALIDATION_ERROR
          );
        }

        return await this.liveKitService.getRoomStatus(roomName);
      }
    );
  };

  /**
   * Store transcript chunk from LiveKit agent
   */
  storeTranscript = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const { assessmentId, assessmentType, chunk } = req.body;

      if (!assessmentId || !assessmentType || !chunk) {
        throw new AppError(
          'Missing required fields',
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      // Normalize assessment type to uppercase
      const normalizedType = assessmentType.toUpperCase() as
        | 'ONBOARDING'
        | 'JOB_AI';

      // Validate assessment type
      if (normalizedType !== 'ONBOARDING' && normalizedType !== 'JOB_AI') {
        throw new AppError(
          `Invalid assessment type: ${assessmentType}`,
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      await this.liveKitService.storeTranscriptChunk(
        assessmentId,
        normalizedType,
        chunk
      );
      return { success: true };
    });
  };

  /**
   * Get recent transcript chunks (for frontend section tracking)
   */
  getRecentTranscripts = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const { assessmentId, assessmentType } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!assessmentId || !assessmentType) {
        throw new AppError(
          'Missing required parameters',
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      // Normalize assessment type to uppercase
      const normalizedType = assessmentType.toUpperCase() as
        | 'ONBOARDING'
        | 'JOB_AI';

      // Validate assessment type
      if (normalizedType !== 'ONBOARDING' && normalizedType !== 'JOB_AI') {
        throw new AppError(
          `Invalid assessment type: ${assessmentType}`,
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      const transcripts = await this.liveKitService.getRecentTranscripts(
        assessmentId,
        normalizedType,
        limit
      );

      return { transcripts };
    });
  };

  /**
   * Update section progress for interview resume capability
   */
  updateSectionProgress = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const { assessmentId, assessmentType, currentSectionId, questionsAsked } =
        req.body;

      if (
        !assessmentId ||
        !assessmentType ||
        !currentSectionId ||
        questionsAsked === undefined
      ) {
        throw new AppError(
          'Missing required fields',
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      // Normalize assessment type to uppercase
      const normalizedType = assessmentType.toUpperCase() as
        | 'ONBOARDING'
        | 'JOB_AI';

      // Validate assessment type
      if (normalizedType !== 'ONBOARDING' && normalizedType !== 'JOB_AI') {
        throw new AppError(
          `Invalid assessment type: ${assessmentType}`,
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      await this.liveKitService.updateSectionProgress(
        assessmentId,
        normalizedType,
        currentSectionId,
        questionsAsked
      );
      return { success: true };
    });
  };

  /**
   * Terminate assessment (called by LiveKit agent when violations/foul language detected)
   */
  terminateAssessment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const { assessmentId, reason, assessmentType } = req.body;

      if (!assessmentId || !reason) {
        throw new AppError(
          'Missing required fields: assessmentId and reason',
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      // Validate reason is a valid termination reason
      const validReasons = Object.values(AssessmentTerminationReasonEnum);
      if (!validReasons.includes(reason)) {
        throw new AppError(
          `Invalid termination reason: ${reason}`,
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      logger.info('Termination request received from agent', {
        context: 'LiveKitController.terminateAssessment',
        assessmentId,
        reason,
        assessmentType,
      });

      // Normalize assessment type to uppercase (default to ONBOARDING if not provided)
      const normalizedType = assessmentType?.toUpperCase() || 'ONBOARDING';

      // Call appropriate service based on assessment type
      if (normalizedType === 'ONBOARDING') {
        await this.onboardingAssessmentService.terminateAssessment(
          assessmentId,
          reason
        );
      } else if (normalizedType === 'JOB_AI') {
        // TODO: Add job AI assessment termination when implementing for job AI
        logger.warn('Job AI assessment termination not yet implemented', {
          assessmentId,
          reason,
        });
        throw new AppError(
          'Job AI assessment termination not yet implemented',
          501,
          ErrorCode.NOT_IMPLEMENTED
        );
      } else {
        throw new AppError(
          `Invalid assessment type: ${assessmentType}`,
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      return {
        success: true,
        message: 'Assessment terminated successfully',
        assessmentId,
        reason,
      };
    });
  };

  /**
   * Complete assessment (called by LiveKit agent when all questions answered)
   */
  completeAssessment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const { assessmentId, assessmentType } = req.body;

      if (!assessmentId) {
        throw new AppError(
          'Missing required field: assessmentId',
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      // Normalize assessment type to uppercase
      const normalizedType = (assessmentType || 'ONBOARDING').toUpperCase() as
        | 'ONBOARDING'
        | 'JOB_AI';

      // Validate assessment type
      if (normalizedType !== 'ONBOARDING' && normalizedType !== 'JOB_AI') {
        throw new AppError(
          `Invalid assessment type: ${assessmentType}`,
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      if (normalizedType === 'ONBOARDING') {
        await this.onboardingAssessmentService.completeAssessment(assessmentId);

        logger.info({
          message: 'Assessment completed successfully',
          context: 'LiveKitController.completeAssessment',
          assessmentId,
        });

        return {
          success: true,
          message: 'Assessment completed successfully',
          assessmentId,
        };
      } else {
        // JOB_AI not yet implemented
        throw new AppError(
          'JOB_AI assessment completion not yet implemented',
          501,
          ErrorCode.NOT_IMPLEMENTED
        );
      }
    });
  };

  /**
   * Webhook handler for LiveKit session completion
   */
  /**
   * Start Redis-based assessment (for LiveKit with backend question flow)
   */
  startRedisAssessment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const candidateId = req.user?.candidateId;
      if (!candidateId) {
        throw new AppError(
          'Candidate ID is required',
          400,
          ErrorCode.CANDIDATE_ID_REQUIRED
        );
      }

      const { assessmentId } = req.body;

      if (!assessmentId) {
        throw new AppError(
          'Assessment ID is required',
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      logger.info('Starting Redis-based assessment', {
        context: 'LiveKitController.startRedisAssessment',
        candidateId,
        assessmentId,
      });

      // Start assessment and publish first question to Redis
      await this.onboardingAssessmentService.startAssessmentWithLiveKit(
        candidateId,
        assessmentId
      );

      return {
        success: true,
        message: 'Assessment started, first question published to Redis',
        assessmentId,
      };
    });
  };

  handleWebhook = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const { event, room } = req.body;

      // Handle room.finished event
      if (event === 'room_finished' && room?.name) {
        await this.liveKitService.handleSessionComplete(room.name);
      }

      return { success: true };
    });
  };
}
