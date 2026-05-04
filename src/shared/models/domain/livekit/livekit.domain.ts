/**
 * LiveKit domain models for voice/video interview integration
 */

/**
 * LiveKit connection details for participant
 */
export interface ILiveKitConnectionDetails {
  roomName: string;
  participantToken: string;
  participantName: string;
  serverUrl: string;
  expiresAt: Date;
}

/**
 * LiveKit room configuration
 */
export interface ILiveKitRoomConfig {
  roomName?: string;
  maxParticipants?: number;
  emptyTimeout?: number; // seconds
  useHttpPolling?: boolean; // Enable HTTP polling mode (robust, default)
  useRedisMode?: boolean; // Enable Redis-based question/answer flow (legacy fallback)
  agentMode?: string; // Agent mode: 'pipeline' or 'realtime'
  metadata?: Record<string, any>;
  agents?: ILiveKitAgentConfig[];
}

/**
 * LiveKit agent configuration
 */
export interface ILiveKitAgentConfig {
  agentName: string;
  metadata?: Record<string, any>;
}

/**
 * LiveKit room creation request
 */
export interface ILiveKitRoomRequest {
  assessmentId: string;
  assessmentType: 'ONBOARDING' | 'JOB_AI';
  candidateId: string;
  roomConfig?: Partial<ILiveKitRoomConfig>;
}

/**
 * LiveKit room response
 */
export interface ILiveKitRoomResponse {
  connectionDetails: ILiveKitConnectionDetails;
  roomConfig: ILiveKitRoomConfig;
}

/**
 * LiveKit token generation request
 */
export interface ILiveKitTokenRequest {
  roomName: string;
  participantName: string;
  participantIdentity?: string;
  metadata?: Record<string, any>;
}

/**
 * LiveKit token response
 */
export interface ILiveKitTokenResponse {
  token: string;
  expiresAt: Date;
}

/**
 * LiveKit room status
 */
export interface ILiveKitRoomStatus {
  roomName: string;
  numParticipants: number;
  isActive: boolean;
  createdAt: Date;
  metadata?: Record<string, any>;
}
