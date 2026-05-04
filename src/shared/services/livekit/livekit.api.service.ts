import { ApiService } from '../core/api.service';
import {
  ILiveKitRoomRequest,
  ILiveKitRoomResponse,
  ILiveKitTokenRequest,
  ILiveKitTokenResponse,
  ILiveKitRoomStatus,
} from '../../models/domain/livekit/livekit.domain';

/**
 * API endpoints for LiveKit operations
 */
const LIVEKIT_ENDPOINTS = {
  CREATE_ROOM: '/livekit/room',
  GENERATE_TOKEN: '/livekit/token',
  ROOM_STATUS: (roomName: string) => `/livekit/room/${roomName}/status`,
  TERMINATE_ASSESSMENT: '/livekit/assessment/terminate',
  RECENT_TRANSCRIPTS: (assessmentId: string, assessmentType: string) =>
    `/livekit/assessment/${assessmentId}/${assessmentType}/transcripts/recent`,
} as const;

export class LiveKitApiService extends ApiService {
  /**
   * Create LiveKit room for assessment
   */
  public async createRoom(
    data: ILiveKitRoomRequest
  ): Promise<ILiveKitRoomResponse> {
    try {
      return await this.apiPost<ILiveKitRoomResponse>(
        LIVEKIT_ENDPOINTS.CREATE_ROOM,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Generate LiveKit access token
   */
  public async generateToken(
    data: ILiveKitTokenRequest
  ): Promise<ILiveKitTokenResponse> {
    try {
      return await this.apiPost<ILiveKitTokenResponse>(
        LIVEKIT_ENDPOINTS.GENERATE_TOKEN,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get room status
   */
  public async getRoomStatus(roomName: string): Promise<ILiveKitRoomStatus> {
    try {
      return await this.apiGet<ILiveKitRoomStatus>(
        LIVEKIT_ENDPOINTS.ROOM_STATUS(roomName)
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Terminate assessment
   */
  public async terminateAssessment(data: {
    assessmentId: string;
    assessmentType: 'ONBOARDING' | 'JOB_AI';
    reason: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      return await this.apiPost<{ success: boolean; message: string }>(
        LIVEKIT_ENDPOINTS.TERMINATE_ASSESSMENT,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get recent transcript chunks (for frontend section tracking)
   */
  public async getRecentTranscripts(
    assessmentId: string,
    assessmentType: 'ONBOARDING' | 'JOB_AI',
    limit: number = 10
  ): Promise<{
    transcripts: Array<{
      timestamp: number;
      speaker: 'agent' | 'candidate';
      text: string;
      sectionTitle?: string;
      sectionId?: string;
    }>;
  }> {
    try {
      return await this.apiGet<{
        transcripts: Array<{
          timestamp: number;
          speaker: 'agent' | 'candidate';
          text: string;
          sectionTitle?: string;
          sectionId?: string;
        }>;
      }>(
        `${LIVEKIT_ENDPOINTS.RECENT_TRANSCRIPTS(assessmentId, assessmentType.toLowerCase())}?limit=${limit}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
