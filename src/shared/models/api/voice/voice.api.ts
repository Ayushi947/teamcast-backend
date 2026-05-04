import {
  IVoiceSynthesizeRequest,
  IVoiceSynthesizeResponse,
  ISpeechToTextRequest,
  ISpeechToTextResponse,
} from '../../domain/voice/voice.domain';
import { IApiRequest, IApiResponse } from '../common/common.api';

export type IVoiceApiRequest = IApiRequest<IVoiceSynthesizeRequest>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IVoiceApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IVoiceSynthesizeResponse'
 */
export type IVoiceApiResponse = IApiResponse<IVoiceSynthesizeResponse>;

export type ISpeechToTextApiRequest = IApiRequest<ISpeechToTextRequest>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISpeechToTextApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISpeechToTextResponse'
 */
export type ISpeechToTextApiResponse = IApiResponse<ISpeechToTextResponse>;
