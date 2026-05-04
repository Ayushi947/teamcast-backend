import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { MetricsService } from '@/services/metrics/metrics.service';
import { singleton } from '@/shared/decorators/singleton';
import { logger } from '@/shared/utils/logger';

export interface WebSocketMessage {
  type: 'ping' | 'pong' | 'error' | 'connection' | 'shutdown';
  data: unknown;
}

@singleton
export class WebSocketService {
  private static instance: WebSocketService;
  public wss?: WebSocketServer; // Made public for cleanup access
  private metricsService: MetricsService;
  private pingInterval?: NodeJS.Timeout;

  constructor() {
    this.metricsService = new MetricsService();
  }

  public static getInstance(server?: Server): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
      WebSocketService.instance.initialize(server);
    }
    return WebSocketService.instance;
  }

  private initialize(server?: Server): void {
    this.wss = new WebSocketServer({
      noServer: !server, // Use noServer mode if no server provided
      ...(server && { server }), // Only add server option if provided
      perMessageDeflate: false, // Disable compression to reduce CPU/memory
      maxPayload: 1024 * 1024, // 1MB limit
    });

    // Set up ping/pong for connection health
    this.pingInterval = setInterval(() => {
      this.wss?.clients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        }
      });
    }, 30000); // Ping every 30 seconds

    this.wss.on('connection', (ws: WebSocket) => {
      this.metricsService.recordWebsocketConnection(true);
      logger.debug('New WebSocket connection established');

      // Set up connection timeout
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.terminate();
        }
      }, 60000); // 1 minute timeout for inactive connections

      ws.on('pong', () => {
        // Reset timeout on pong
        clearTimeout(connectionTimeout);
      });

      ws.on('close', () => {
        this.metricsService.recordWebsocketConnection(false);
        clearTimeout(connectionTimeout);
        logger.debug('WebSocket connection closed');
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error', { error: error.message });
        clearTimeout(connectionTimeout);
      });

      ws.on('message', (message: Buffer) => {
        try {
          // Limit message size
          if (message.length > 1024) {
            ws.close(1009, 'Message too large');
            return;
          }

          const data = JSON.parse(message.toString());
          this.metricsService.recordWebsocketMessage('message', 'in');

          // Handle ping/pong
          if (data.type === 'ping') {
            ws.send(
              JSON.stringify({
                type: 'pong',
                data: { timestamp: Date.now() },
              })
            );
          }
        } catch (error) {
          logger.error('Error processing WebSocket message', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      });
    });

    logger.info('WebSocket server initialized');
  }

  public broadcast(message: WebSocketMessage): void {
    if (!this.wss) {
      return;
    }

    const messageStr = JSON.stringify(message);
    const deadClients: WebSocket[] = [];

    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(messageStr);
          this.metricsService.recordWebsocketMessage(message.type, 'out');
        } catch (error) {
          logger.error('Error sending WebSocket message', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          deadClients.push(client);
        }
      } else {
        deadClients.push(client);
      }
    });

    // Clean up dead connections
    deadClients.forEach((client) => {
      try {
        client.terminate();
      } catch (error) {
        // Ignore cleanup errors
        logger.error('Error terminating WebSocket client', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  }

  public cleanup(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    if (this.wss) {
      this.wss.clients.forEach((client) => {
        client.terminate();
      });
      this.wss.close();
    }

    logger.info('WebSocket service cleaned up');
  }
}
