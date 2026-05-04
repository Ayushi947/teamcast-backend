import { singleton } from '@/shared/decorators/singleton';
import {
  IVoiceSynthesizeRequest,
  IVoiceSynthesizeResponse,
  ISpeechToTextRequest,
  ISpeechToTextResponse,
  AudioEncoding,
} from '@/shared/models/domain/voice/voice.domain';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { SpeechClient, protos } from '@google-cloud/speech';
import { logger } from '@/shared/utils/logger';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { gcpConfig } from '@/config/gcp';

@singleton
export class VoiceService {
  private textToSpeechClient: TextToSpeechClient;
  private speechClient: SpeechClient;

  constructor() {
    this.textToSpeechClient = gcpConfig.getTextToSpeechClient();
    this.speechClient = gcpConfig.getSpeechClient();
  }

  /**
   * Synthesizes text to speech using Google Cloud Text-to-Speech
   * @param request Voice synthesis request
   * @returns Voice synthesis response
   */
  async synthesizeSpeech(
    request: IVoiceSynthesizeRequest
  ): Promise<IVoiceSynthesizeResponse> {
    logger.info('Starting text to speech synthesis', {
      textLength: request.text.length,
      voice: request.voice,
      context: 'VoiceService.synthesizeSpeech',
    });

    try {
      const [response] = await this.textToSpeechClient.synthesizeSpeech({
        input: { text: request.text },
        voice: {
          languageCode: request.languageCode || 'en-US',
          name: request.voice || 'en-US-Chirp3-HD-Aoede',
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 1.0,
          pitch: 0,
        },
      });

      if (!response.audioContent) {
        throw new AppError(
          'Failed to generate audio content',
          500,
          ErrorCode.INTERNAL_SERVER_ERROR
        );
      }

      const audioContent = Buffer.from(
        response.audioContent as Uint8Array
      ).toString('base64');

      logger.info('Text to speech synthesis completed successfully', {
        textLength: request.text.length,
        voice: request.voice,
        context: 'VoiceService.synthesizeSpeech',
      });

      return {
        audioContent,
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 1.0,
          pitch: 0,
        },
      };
    } catch (error) {
      logger.error('Error in text to speech synthesis', {
        error,
        context: 'VoiceService.synthesizeSpeech',
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        'Failed to synthesize speech',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Transcribes speech to text using Google Cloud Speech-to-Text
   * @param request Speech to text request
   * @returns Speech to text response
   */
  async transcribeSpeech(
    request: ISpeechToTextRequest
  ): Promise<ISpeechToTextResponse> {
    logger.info('Starting speech to text transcription', {
      hasAudioContent: !!request.audioContent,
      hasGcsUri: !!request.gcsUri,
      context: 'VoiceService.transcribeSpeech',
    });

    try {
      // For audio longer than 1 minute, use longRunningRecognize
      const [operation] = await this.speechClient.longRunningRecognize({
        audio: request.gcsUri
          ? { uri: request.gcsUri }
          : { content: Buffer.from(request.audioContent!, 'base64') },
        config: {
          encoding: (request.audioEncoding ||
            AudioEncoding.MP3) as unknown as protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding,
          languageCode: request.languageCode || 'en-US',
          audioChannelCount: 1,
          enableAutomaticPunctuation: true,
          model: 'default',
          useEnhanced: true,
        },
      });

      // Wait for operation to complete
      const [response] = await operation.promise();

      if (!response.results || response.results.length === 0) {
        throw new AppError(
          'No transcription results found',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      const transcription = response.results[0].alternatives?.[0];
      if (!transcription || !transcription.transcript) {
        throw new AppError(
          'Failed to transcribe audio',
          500,
          ErrorCode.INTERNAL_SERVER_ERROR
        );
      }

      logger.info('Speech to text transcription completed successfully', {
        textLength: transcription.transcript.length,
        confidence: transcription.confidence,
        context: 'VoiceService.transcribeSpeech',
      });

      return {
        text: transcription.transcript,
        confidence: transcription.confidence || 0,
      };
    } catch (error) {
      logger.error('Error in speech to text transcription', {
        error,
        context: 'VoiceService.transcribeSpeech',
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        'Failed to transcribe speech',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }
}
