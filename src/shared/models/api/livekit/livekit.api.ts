import {
  ILiveKitConnectionDetails,
  ILiveKitRoomRequest,
  ILiveKitRoomResponse,
  ILiveKitRoomStatus,
  ILiveKitTokenRequest,
  ILiveKitTokenResponse,
} from '../../domain/livekit/livekit.domain';
import { IApiRequest, IApiResponse } from '../common/common.api';

/**
 * API request for creating LiveKit room
 */
export type ILiveKitRoomApiRequest = IApiRequest<ILiveKitRoomRequest>;

/**
 * API response for creating LiveKit room
 * @openapi
 * components:
 *   schemas:
 *     ILiveKitRoomApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ILiveKitRoomResponse'
 */
export type ILiveKitRoomApiResponse = IApiResponse<ILiveKitRoomResponse>;

/**
 * API request for generating LiveKit token
 */
export type ILiveKitTokenApiRequest = IApiRequest<ILiveKitTokenRequest>;

/**
 * API response for generating LiveKit token
 * @openapi
 * components:
 *   schemas:
 *     ILiveKitTokenApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ILiveKitTokenResponse'
 */
export type ILiveKitTokenApiResponse = IApiResponse<ILiveKitTokenResponse>;

/**
 * API request for getting room status
 */
export interface ILiveKitRoomStatusRequest {
  roomName: string;
}

export type ILiveKitRoomStatusApiRequest =
  IApiRequest<ILiveKitRoomStatusRequest>;

/**
 * API response for room status
 * @openapi
 * components:
 *   schemas:
 *     ILiveKitRoomStatusApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ILiveKitRoomStatus'
 */
export type ILiveKitRoomStatusApiResponse = IApiResponse<ILiveKitRoomStatus>;

/**
 * API response for connection details
 * @openapi
 * components:
 *   schemas:
 *     ILiveKitConnectionDetailsApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ILiveKitConnectionDetails'
 */
export type ILiveKitConnectionDetailsApiResponse =
  IApiResponse<ILiveKitConnectionDetails>;
