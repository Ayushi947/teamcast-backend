/**
 * @openapi
 * components:
 *   schemas:
 *     IVoiceSynthesizeRequest:
 *       type: object
 *       required:
 *         - text
 *         - voice
 *       properties:
 *         text:
 *           type: string
 *           description: Text to be converted to speech
 *           example: "Hello, this is a test message"
 *         voice:
 *           type: string
 *           description: Voice to be used for speech synthesis
 *           example: "en-US-Chirp3-HD-Aoede"
 *         languageCode:
 *           type: string
 *           description: Language code for the text
 *           example: "en-US"
 */

export interface IVoiceSynthesizeRequest {
  text: string;
  voice: string;
  languageCode?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IVoiceSynthesizeResponse:
 *       type: object
 *       properties:
 *         audioContent:
 *           type: string
 *           description: Base64 encoded audio content
 *           example: "base64EncodedAudioContent..."
 *         audioConfig:
 *           type: object
 *           properties:
 *             audioEncoding:
 *               type: string
 *               example: "MP3"
 *             speakingRate:
 *               type: number
 *               example: 1.0
 *             pitch:
 *               type: number
 *               example: 0
 */

export interface IVoiceSynthesizeResponse {
  audioContent: string;
  audioConfig: {
    audioEncoding: string;
    speakingRate: number;
    pitch: number;
  };
}

export enum AudioEncoding {
  MP3 = 'MP3',
  LINEAR16 = 'LINEAR16',
  FLAC = 'FLAC',
  MULAW = 'MULAW',
  AMR = 'AMR',
  AMR_WB = 'AMR_WB',
  OGG_OPUS = 'OGG_OPUS',
  WEBM_OPUS = 'WEBM_OPUS',
  SPEEX_WITH_HEADER_BYTE = 'SPEEX_WITH_HEADER_BYTE',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISpeechToTextRequest:
 *       type: object
 *       required:
 *         - audioContent
 *       properties:
 *         audioContent:
 *           type: string
 *           description: Base64 encoded audio content
 *           example: "base64EncodedAudioContent..."
 *         languageCode:
 *           type: string
 *           description: Language code for the audio
 *           example: "en-US"
 *         audioEncoding:
 *           type: string
 *           description: Audio encoding format
 *           enum: [MP3, LINEAR16, FLAC, MULAW, AMR, AMR_WB, OGG_OPUS, WEBM_OPUS, SPEEX_WITH_HEADER_BYTE]
 *           example: "MP3"
 */

export interface ISpeechToTextRequest {
  audioContent?: string; // Base64 encoded audio content (optional)
  gcsUri?: string; // Google Cloud Storage URI (optional)
  languageCode?: string;
  audioEncoding?: AudioEncoding;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISpeechToTextResponse:
 *       type: object
 *       properties:
 *         text:
 *           type: string
 *           description: Transcribed text from audio
 *           example: "Hello, this is a test message"
 *         confidence:
 *           type: number
 *           description: Confidence score of the transcription
 *           example: 0.95
 */

export interface ISpeechToTextResponse {
  text: string;
  confidence: number;
}
