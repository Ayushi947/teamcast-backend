import { Request, Response, NextFunction } from 'express';
import { BaseController } from '@/controllers/common/base.controller';
import { LiveKitEgressService } from '@/services/livekit/livekit.egress.service';
import { logger } from '@/shared/utils/logger';
import { WebhookReceiver } from 'livekit-server-sdk';
import { ENV } from '@/config/env';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { singleton } from '@/shared/decorators/singleton';
import { OnboardingAssessmentVideoAnalysisProcessor } from '@/services/queue/processors/onboarding.assessment.video.analysis.processor';
import { JobAiAssessmentVideoAnalysisProcessor } from '@/services/queue/processors/job.ai.assessment.video.analysis.processor';

@singleton
export class LiveKitEgressController extends BaseController {
  private egressService: LiveKitEgressService;
  private webhookReceiver: WebhookReceiver;

  constructor(
    onboardingVideoAnalysisProcessor: OnboardingAssessmentVideoAnalysisProcessor,
    jobAiVideoAnalysisProcessor: JobAiAssessmentVideoAnalysisProcessor
  ) {
    super();

    // Initialize egress service with proper dependencies
    this.egressService = new LiveKitEgressService(
      onboardingVideoAnalysisProcessor,
      jobAiVideoAnalysisProcessor
    );

    // Initialize webhook receiver for validating webhook signatures
    this.webhookReceiver = new WebhookReceiver(
      ENV.LIVEKIT_API_KEY || 'devkey',
      ENV.LIVEKIT_API_SECRET || 'secret'
    );
  }

  /**
   * Start recording a LiveKit room
   * POST /api/livekit/egress/start
   */
  startRecording = async (req: Request, res: Response, next: NextFunction) => {
    await this.handleRequest(req, res, next, async () => {
      const { roomName, assessmentId, assessmentType, audioOnly } = req.body;

      logger.info('Start recording request', {
        roomName,
        assessmentId,
        assessmentType,
        audioOnly,
      });

      // Validate required fields
      if (!roomName || !assessmentId || !assessmentType) {
        throw new AppError(
          'Missing required fields: roomName, assessmentId, assessmentType',
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      const result = await this.egressService.startRoomRecording({
        roomName,
        assessmentId,
        assessmentType,
        audioOnly: audioOnly || false,
      });

      return result;
    });
  };

  /**
   * Stop an active recording
   * POST /api/livekit/egress/stop
   */
  stopRecording = async (req: Request, res: Response, next: NextFunction) => {
    await this.handleRequest(req, res, next, async () => {
      const { egressId } = req.body;

      logger.info('Stop recording request', { egressId });

      if (!egressId) {
        throw new AppError(
          'Missing required field: egressId',
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      await this.egressService.stopRecording(egressId);

      return { egressId };
    });
  };

  /**
   * Get egress status
   * GET /api/livekit/egress/:egressId
   */
  getEgressStatus = async (req: Request, res: Response, next: NextFunction) => {
    await this.handleRequest(req, res, next, async () => {
      const { egressId } = req.params;

      logger.info('Get egress status request', { egressId });

      if (!egressId) {
        throw new AppError(
          'Missing egress ID',
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      const info = await this.egressService.getEgressInfo(egressId);

      return info;
    });
  };

  /**
   * Save transcript to GCP
   * POST /api/livekit/egress/transcript
   */
  saveTranscript = async (req: Request, res: Response, next: NextFunction) => {
    await this.handleRequest(req, res, next, async () => {
      const { assessmentId, roomName, transcript } = req.body;

      logger.info('Save transcript request', {
        assessmentId,
        roomName,
        transcriptLength: transcript?.length || 0,
      });

      if (!assessmentId || !roomName || !transcript) {
        throw new AppError(
          'Missing required fields: assessmentId, roomName, transcript',
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      const filePath = await this.egressService.saveTranscript(
        assessmentId,
        roomName,
        transcript
      );

      return { filePath };
    });
  };

  /**
   * Handle LiveKit webhooks (egress_ended, etc.)
   * POST /api/livekit/webhook
   */
  handleWebhook = async (req: Request, res: Response, _next: NextFunction) => {
    try {
      // Verify webhook signature
      const event = await this.webhookReceiver.receive(
        req.body,
        req.headers.authorization || ''
      );

      logger.info('LiveKit webhook received', {
        event: event.event,
        id: event.id,
        createdAt: event.createdAt,
      });

      // Handle different webhook events
      switch (event.event) {
        case 'egress_started':
          logger.info('Egress started', {
            egressId: event.egressInfo?.egressId,
            roomName: event.egressInfo?.roomName,
          });
          break;

        case 'egress_updated':
          logger.info('Egress updated', {
            egressId: event.egressInfo?.egressId,
            status: event.egressInfo?.status,
          });
          break;

        case 'egress_ended':
          logger.info('Egress ended', {
            egressId: event.egressInfo?.egressId,
            roomName: event.egressInfo?.roomName,
            error: event.egressInfo?.error,
          });

          // Process egress completion
          await this.egressService.handleEgressEnded(event.egressInfo);
          break;

        case 'room_started':
          logger.info('Room started', {
            roomName: event.room?.name,
          });
          break;

        case 'room_finished':
          logger.info('Room finished', {
            roomName: event.room?.name,
          });

          // Automatically stop any active recordings for this room
          if (event.room?.name) {
            try {
              await this.egressService.stopRecordingByRoomName(event.room.name);
              logger.info('Automatic recording stopped for closed room', {
                roomName: event.room.name,
              });
            } catch (error) {
              logger.warn('Failed to stop recording for closed room', {
                error: error instanceof Error ? error.message : String(error),
                roomName: event.room.name,
              });
            }
          }
          break;

        case 'participant_joined':
          logger.info('Participant joined', {
            roomName: event.room?.name,
            participantIdentity: event.participant?.identity,
          });

          // Start recording when first non-agent participant joins
          if (event.room?.name && event.participant?.identity) {
            const roomName = event.room.name;
            const identity = event.participant.identity;

            // Check if this is a candidate (not an agent)
            // Agent identities typically don't match assessment ID patterns
            if (identity.includes('-') && !identity.startsWith('agent-')) {
              try {
                // Extract assessment info from room name (format: "onboarding-{assessmentId}" or "job-ai-{assessmentId}")
                const assessmentId = roomName.split('-').slice(1).join('-');
                const assessmentType = roomName.startsWith('onboarding-')
                  ? 'ONBOARDING'
                  : 'JOB_AI';

                logger.info('Starting recording for participant', {
                  roomName,
                  assessmentId,
                  assessmentType,
                  participantIdentity: identity,
                });

                await this.egressService.startRoomRecording({
                  roomName,
                  assessmentId,
                  assessmentType: assessmentType as 'ONBOARDING' | 'JOB_AI',
                  audioOnly: false,
                });

                logger.info(
                  'Recording started successfully after participant joined',
                  {
                    roomName,
                    assessmentId,
                  }
                );
              } catch (recordingError) {
                logger.error(
                  'Failed to start recording after participant joined',
                  {
                    error:
                      recordingError instanceof Error
                        ? recordingError.message
                        : recordingError,
                    roomName,
                  }
                );
              }
            }
          }
          break;

        case 'participant_left':
          logger.info('Participant left', {
            roomName: event.room?.name,
            participantIdentity: event.participant?.identity,
          });
          break;

        default:
          logger.info('Unhandled webhook event', { event: event.event });
      }

      // Always return 200 OK to acknowledge webhook receipt
      res.status(200).json({
        success: true,
        message: 'Webhook processed',
      });
    } catch (error) {
      logger.error('Webhook verification failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      // Return 401 for authentication failures
      res.status(401).json({
        success: false,
        message: 'Webhook verification failed',
      });
    }
  };
}
