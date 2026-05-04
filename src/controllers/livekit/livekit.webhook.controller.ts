import { Request, Response, NextFunction } from 'express';
import { BaseController } from '@/controllers/common/base.controller';
import { logger } from '@/shared/utils/logger';
import { singleton } from '@/shared/decorators/singleton';
import { WebhookReceiver } from 'livekit-server-sdk';
import { ENV } from '@/config/env';
import { LiveKitEgressService } from '@/services/livekit/livekit.egress.service';

@singleton
export class LiveKitWebhookController extends BaseController {
  private webhookReceiver: WebhookReceiver;

  constructor(private egressService: LiveKitEgressService) {
    super();

    // Initialize webhook receiver for signature verification
    this.webhookReceiver = new WebhookReceiver(
      ENV.LIVEKIT_API_KEY || 'devkey',
      ENV.LIVEKIT_API_SECRET || 'secret'
    );
  }

  handleWebhook = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      // Log incoming webhook details for debugging
      logger.info('🔔 LiveKit webhook received - raw request', {
        context: 'LiveKitWebhookController.handleWebhook',
        headers: {
          authorization: req.headers.authorization ? 'present' : 'missing',
          contentType: req.headers['content-type'],
          userAgent: req.headers['user-agent'],
        },
        hasRawBody: !!(req as any).rawBody,
        rawBodyLength: (req as any).rawBody?.length || 0,
        hasBody: !!req.body,
        bodyType: typeof req.body,
        bodyKeys: req.body ? Object.keys(req.body) : [],
      });

      // Verify webhook signature
      // Note: Must use rawBody (string) not req.body (parsed object) for signature verification
      const rawBody =
        (req as any).rawBody || (req.body ? JSON.stringify(req.body) : '{}');
      const authHeader = req.headers.authorization || '';

      logger.info('🔐 Attempting webhook verification', {
        context: 'LiveKitWebhookController.handleWebhook',
        rawBodyLength: rawBody.length,
        rawBodyPreview: rawBody.substring(0, 100),
        hasAuthHeader: !!authHeader,
        authHeaderPreview:
          authHeader.length > 20
            ? authHeader.substring(0, 20) + '...'
            : authHeader,
      });

      const event = await this.webhookReceiver.receive(rawBody, authHeader);

      logger.info('✅ LiveKit webhook verified and received', {
        context: 'LiveKitWebhookController.handleWebhook',
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
          break;

        default:
          logger.debug('Unhandled webhook event', { event: event.event });
      }

      res.status(200).send('OK');
    } catch (error) {
      logger.error('❌ Webhook processing failed', {
        context: 'LiveKitWebhookController.handleWebhook',
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        hasRawBody: !!(req as any).rawBody,
        hasAuthHeader: !!req.headers.authorization,
        troubleshooting: {
          possibleCauses: [
            'API key/secret mismatch between LiveKit server and backend',
            'Authorization header missing or incorrect format',
            'Raw body not preserved (check middleware)',
            'LiveKit webhook signature algorithm mismatch',
          ],
          currentConfig: {
            apiKey: ENV.LIVEKIT_API_KEY?.substring(0, 10) + '...',
            apiSecretLength: ENV.LIVEKIT_API_SECRET?.length || 0,
          },
        },
      });
      res.status(401).json({
        success: false,
        message: 'Webhook verification failed',
      });
    }
  };
}
