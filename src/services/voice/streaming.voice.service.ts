import { singleton } from '@/shared/decorators/singleton';
import { SpeechClient } from '@google-cloud/speech';
import { logger } from '@/shared/utils/logger';
import { gcpConfig } from '@/config/gcp';
import { Duplex } from 'stream';

export interface StreamingConfig {
  assessmentId: string;
  candidateId: string;
  sessionId?: string; // Optional - if not provided, will be generated
  languageCode?: string;
  enableAutomaticPunctuation?: boolean;
  model?:
    | 'latest_long'
    | 'latest_short'
    | 'command_and_search'
    | 'phone_call'
    | 'video'
    | 'default';
}

export interface TranscriptResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  stability: number;
  words?: Array<{
    word: string;
    confidence: number;
    startTime: number;
    endTime: number;
  }>;
}

@singleton
export class StreamingVoiceService {
  private speechClient: SpeechClient;
  private activeStreams: Map<string, any> = new Map();

  constructor() {
    this.speechClient = gcpConfig.getSpeechClient();
  }

  /**
   * Create a streaming recognition session
   * Returns a duplex stream for sending audio and receiving transcripts
   */
  createStreamingSession(config: StreamingConfig): {
    stream: Duplex;
    sessionId: string;
  } {
    // Use provided sessionId or generate one
    const sessionId =
      config.sessionId ||
      `${config.assessmentId}-${config.candidateId}-${Date.now()}`;

    logger.info('Creating streaming STT session', {
      sessionId,
      assessmentId: config.assessmentId,
      candidateId: config.candidateId,
    });

    // Configure streaming recognition with latest_long model (best accuracy for V1 API)
    const request = {
      config: {
        encoding: 'WEBM_OPUS' as any, // Browser MediaRecorder format
        sampleRateHertz: 48000,
        languageCode: config.languageCode || 'en-US',
        enableAutomaticPunctuation: config.enableAutomaticPunctuation ?? true,
        model: config.model || 'latest_long', // V1 API: latest_long provides best accuracy for interviews
        // NOTE: useEnhanced is only for older models (default, phone_call, video)
        // latest_long is already an enhanced model
        // Advanced features for better accuracy
        enableWordTimeOffsets: true, // Get timestamp for each word
        enableWordConfidence: true, // Get confidence per word
        speechContexts: [
          {
            // Boost recognition of technical terms
            phrases: [
              'JavaScript',
              'TypeScript',
              'Python',
              'Java',
              'React',
              'Node.js',
              'database',
              'API',
              'algorithm',
              'function',
              'variable',
              'array',
              'object',
              'class',
              'interface',
            ],
            boost: 10,
          },
        ],
        // Noise suppression
        audioChannelCount: 1,
        enableSeparateRecognitionPerChannel: false,
        // Metadata for better recognition
        metadata: {
          interactionType: 'DISCUSSION',
          industryNaicsCodeOfAudio: 541512, // Computer Systems Design
          microphoneDistance: 'NEARFIELD',
          originalMediaType: 'AUDIO',
          recordingDeviceType: 'PC',
        },
      },
      interimResults: true, // Get interim results while speaking
    };

    // Create bidirectional stream
    const recognizeStream = this.speechClient
      .streamingRecognize(request)
      .on('error', (error) => {
        logger.error('Streaming STT error:', {
          sessionId,
          error: error.message,
          stack: error.stack,
        });
        this.cleanupSession(sessionId);
      })
      .on('data', (data) => {
        if (data.results && data.results.length > 0) {
          const result = data.results[0];
          const alternative = result.alternatives?.[0];

          if (!alternative) {
            return;
          }

          // Extract word-level details
          const words = alternative.words?.map((word: any) => ({
            word: word.word,
            confidence: word.confidence || 0,
            startTime: word.startTime?.seconds || 0,
            endTime: word.endTime?.seconds || 0,
          }));

          const transcriptResult: TranscriptResult = {
            transcript: alternative.transcript,
            confidence: alternative.confidence || result.stability || 0,
            isFinal: result.isFinal || false,
            stability: result.stability || 0,
            words,
          };

          // Emit result with metadata
          recognizeStream.emit('transcript', transcriptResult);

          logger.debug('Transcript received', {
            sessionId,
            isFinal: transcriptResult.isFinal,
            confidence: transcriptResult.confidence,
            stability: transcriptResult.stability,
            text: transcriptResult.transcript.substring(0, 50),
          });
        }
      })
      .on('end', () => {
        logger.info('Streaming STT ended', { sessionId });
        this.cleanupSession(sessionId);
      });

    // Store session for cleanup
    this.activeStreams.set(sessionId, {
      stream: recognizeStream,
      config,
      startTime: Date.now(),
      audioChunksReceived: 0,
      transcriptsReceived: 0,
    });

    // Auto-cleanup after 30 minutes (safety measure)
    setTimeout(
      () => {
        if (this.activeStreams.has(sessionId)) {
          logger.warn('Auto-cleanup session after 30min timeout', {
            sessionId,
          });
          this.cleanupSession(sessionId);
        }
      },
      30 * 60 * 1000
    );

    return { stream: recognizeStream, sessionId };
  }

  /**
   * Send audio chunk to streaming session
   */
  sendAudioChunk(sessionId: string, audioChunk: Buffer): boolean {
    const session = this.activeStreams.get(sessionId);
    if (!session) {
      logger.warn('Session not found for audio chunk:', sessionId);
      return false;
    }

    try {
      session.stream.write(audioChunk);
      session.audioChunksReceived++;
      return true;
    } catch (error) {
      logger.error('Error sending audio chunk:', {
        sessionId,
        error: error instanceof Error ? error.message : error,
      });
      return false;
    }
  }

  /**
   * End streaming session gracefully
   */
  endSession(sessionId: string): void {
    const session = this.activeStreams.get(sessionId);
    if (session) {
      try {
        session.stream.end();
      } catch (error) {
        logger.warn('Error ending stream:', error);
      }

      const duration = Date.now() - session.startTime;

      logger.info('Streaming session ended', {
        sessionId,
        duration: `${(duration / 1000).toFixed(2)}s`,
        audioChunksReceived: session.audioChunksReceived,
        transcriptsReceived: session.transcriptsReceived,
      });

      this.cleanupSession(sessionId);
    }
  }

  /**
   * Clean up session resources
   */
  private cleanupSession(sessionId: string): void {
    const session = this.activeStreams.get(sessionId);
    if (session) {
      try {
        if (session.stream && !session.stream.destroyed) {
          session.stream.destroy();
        }
      } catch (error) {
        logger.warn('Error destroying stream:', error);
      }
      this.activeStreams.delete(sessionId);
    }
  }

  /**
   * Get active sessions count (for monitoring)
   */
  getActiveSessionsCount(): number {
    return this.activeStreams.size;
  }

  /**
   * Get session details (for debugging)
   */
  getSessionDetails(sessionId: string): any {
    const session = this.activeStreams.get(sessionId);
    if (!session) {
      return null;
    }

    return {
      sessionId,
      assessmentId: session.config.assessmentId,
      candidateId: session.config.candidateId,
      uptime: Date.now() - session.startTime,
      audioChunksReceived: session.audioChunksReceived,
      transcriptsReceived: session.transcriptsReceived,
    };
  }

  /**
   * Clean up all sessions (for graceful shutdown)
   */
  cleanup(): void {
    logger.info('Cleaning up all streaming sessions', {
      count: this.activeStreams.size,
    });

    for (const sessionId of this.activeStreams.keys()) {
      this.endSession(sessionId);
    }
  }
}
