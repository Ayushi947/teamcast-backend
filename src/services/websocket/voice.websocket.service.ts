import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { StreamingVoiceController } from '@/controllers/voice/streaming.voice.controller';
import { logger } from '@/shared/utils/logger';

export class VoiceWebSocketService {
  private static instance: VoiceWebSocketService | null = null;
  private wss: WebSocketServer | null = null;
  private controller: StreamingVoiceController;
  private upgradeHandlerBound: boolean = false;

  private constructor() {
    this.controller = new StreamingVoiceController();
  }

  public static getInstance(): VoiceWebSocketService {
    if (!VoiceWebSocketService.instance) {
      VoiceWebSocketService.instance = new VoiceWebSocketService();
    }
    return VoiceWebSocketService.instance;
  }

  public initialize(server: Server): void {
    // Prevent double initialization
    if (this.wss || this.upgradeHandlerBound) {
      logger.warn('VoiceWebSocketService already initialized, skipping');
      return;
    }

    // Create WebSocket server in noServer mode
    this.wss = new WebSocketServer({
      noServer: true,
      perMessageDeflate: false,
      maxPayload: 10 * 1024 * 1024, // 10MB for audio chunks
    });

    this.wss.on('error', (error) => {
      logger.error('Voice WebSocket Server error:', error);
    });

    // Handle upgrade event ONCE
    const upgradeHandler = (request: any, socket: any, head: any) => {
      try {
        const url = new URL(
          request.url || '',
          `http://${request.headers.host}`
        );

        if (url.pathname === '/api/voice/stream') {
          this.wss!.handleUpgrade(request, socket, head, (ws) => {
            logger.info('New streaming voice WebSocket connection', {
              path: request.url,
              ip: socket.remoteAddress,
            });
            this.controller.handleWebSocket(ws, request);
          });
        }
      } catch (error) {
        logger.error('Error handling WebSocket upgrade:', error);
        socket.destroy();
      }
    };

    // Add the upgrade listener
    server.on('upgrade', upgradeHandler);
    this.upgradeHandlerBound = true;

    logger.info('Voice WebSocket service initialized on /api/voice/stream');
  }

  public close(): void {
    if (this.wss) {
      logger.info('Closing voice WebSocket connections');
      this.wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.close(1001, 'Server shutting down');
        }
      });
      this.wss.close();
      this.wss = null;
    }
    this.upgradeHandlerBound = false;
  }

  public getActiveConnectionsCount(): number {
    return this.wss?.clients.size || 0;
  }
}
