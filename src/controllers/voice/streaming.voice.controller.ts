import { Request } from 'express';
import { WebSocket } from 'ws';
import { StreamingVoiceService } from '@/services/voice/streaming.voice.service';
import { logger } from '@/shared/utils/logger';
import jwt from 'jsonwebtoken';
import { ENV } from '@/config/env';

export class StreamingVoiceController {
  private streamingVoiceService: StreamingVoiceService;

  constructor() {
    this.streamingVoiceService = new StreamingVoiceService();
  }

  /**
   * Handle WebSocket connection for streaming STT
   */
  handleWebSocket = (ws: WebSocket, req: Request): void => {
    let streamingSession: any = null;
    let sessionId: string | null = null;
    let assessmentId: string | null = null;
    let candidateId: string | null = null;

    logger.info('New WebSocket connection attempt', {
      url: req.url,
      headers: req.headers,
    });

    // Parse query parameters
    try {
      const url = new URL(req.url || '', `ws://${req.headers.host}`);
      const token = url.searchParams.get('token');
      assessmentId = url.searchParams.get('assessmentId');

      if (!assessmentId) {
        logger.warn('Missing assessmentId in WebSocket connection');
        ws.close(4001, 'Missing assessmentId');
        return;
      }

      // Token is optional - for public practice assessments
      if (token) {
        // Verify JWT token if provided
        try {
          const decoded: any = jwt.verify(token, ENV.JWT_SECRET);
          candidateId = decoded.userId || decoded.candidateId || decoded.id;

          logger.info('WebSocket authenticated successfully', {
            candidateId,
            assessmentId,
          });
        } catch (authError) {
          logger.error('Authentication failed for WebSocket', {
            error: authError instanceof Error ? authError.message : authError,
          });
          ws.close(4002, 'Authentication failed');
          return;
        }
      } else {
        candidateId = `public-${assessmentId}`;
        logger.info('WebSocket connection for public assessment (no auth)', {
          candidateId,
          assessmentId,
        });
      }

      // Generate sessionId but don't create stream yet (will create on 'start' message)
      sessionId = `${assessmentId}-${candidateId}-${Date.now()}`;

      // Helper function to create the streaming session
      const createStream = () => {
        if (streamingSession) {
          logger.warn('Stream already exists, skipping creation', {
            sessionId,
          });
          return;
        }

        const sessionResult = this.streamingVoiceService.createStreamingSession(
          {
            assessmentId: assessmentId!,
            candidateId: candidateId!,
            sessionId: sessionId!, // Pass the sessionId to the service
            model: 'latest_long', // V1 API: Use latest_long for best accuracy
            enableAutomaticPunctuation: true,
          }
        );
        streamingSession = sessionResult.stream;
        sessionId = sessionResult.sessionId; // Use the returned sessionId

        logger.info('Google Speech stream created', { sessionId });

        // Forward transcripts to WebSocket client
        streamingSession.on('transcript', (result: any) => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(
                JSON.stringify({
                  type: 'transcript',
                  data: result,
                  timestamp: Date.now(),
                })
              );

              logger.debug('Transcript sent to client', {
                sessionId,
                isFinal: result.isFinal,
                confidence: result.confidence,
              });
            } catch (error) {
              logger.error('Error sending transcript to client:', error);
            }
          }
        });

        streamingSession.on('error', (error: Error) => {
          logger.error('Stream error:', {
            sessionId,
            error: error.message,
            stack: error.stack,
          });

          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: 'error',
                message: error.message,
                timestamp: Date.now(),
              })
            );
          }
        });

        streamingSession.on('end', () => {
          logger.info('Stream ended', { sessionId });

          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: 'stream_ended',
                timestamp: Date.now(),
              })
            );
          }
        });
      };

      // Handle incoming messages from client
      ws.on('message', (message: Buffer) => {
        try {
          // Check if it's JSON control message or binary audio data
          if (message[0] === 0x7b) {
            // '{' - JSON message
            const data = JSON.parse(message.toString());

            if (data.type === 'start') {
              logger.info('Client requested streaming start', { sessionId });

              // Create the Google Speech stream NOW (when audio is about to start)
              createStream();

              // Send ready response
              ws.send(
                JSON.stringify({
                  type: 'ready',
                  sessionId,
                  timestamp: Date.now(),
                })
              );
            } else if (data.type === 'stop') {
              logger.info('Client stopped streaming', { sessionId });
              if (sessionId) {
                this.streamingVoiceService.endSession(sessionId);
                streamingSession = null; // CRITICAL: Reset to allow new stream creation
              }
            } else if (data.type === 'ping') {
              // Heartbeat
              ws.send(
                JSON.stringify({
                  type: 'pong',
                  timestamp: Date.now(),
                })
              );
            }
          } else {
            // Binary audio data - only process if stream exists
            if (streamingSession && sessionId) {
              const success = this.streamingVoiceService.sendAudioChunk(
                sessionId,
                message
              );

              if (!success) {
                logger.warn('Failed to send audio chunk', { sessionId });
              }
            } else {
              logger.warn('Received audio before stream was created', {
                sessionId,
              });
            }
          }
        } catch (error) {
          logger.error('Error processing WebSocket message:', {
            sessionId,
            error: error instanceof Error ? error.message : error,
          });
        }
      });

      ws.on('close', (code, reason) => {
        logger.info('WebSocket closed', {
          sessionId,
          code,
          reason: reason.toString(),
        });

        if (sessionId) {
          this.streamingVoiceService.endSession(sessionId);
        }
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error:', {
          sessionId,
          error: error.message,
        });
      });

      // Send initial ready message
      ws.send(
        JSON.stringify({
          type: 'connected',
          sessionId,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      logger.error('Error setting up WebSocket:', {
        error: error instanceof Error ? error.message : error,
      });
      ws.close(4000, 'Internal server error');
    }
  };

  /**
   * Get active sessions (for monitoring/debugging)
   */
  getActiveSessions = (): number => {
    return this.streamingVoiceService.getActiveSessionsCount();
  };
}
