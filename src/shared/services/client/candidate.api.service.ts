import { ApiService } from '../core/api.service';

/**
 * API endpoints for client candidate management related operations
 */
const CLIENT_CANDIDATE_ENDPOINTS = {
  ONBOARDING_VIDEO_CHUNKS:
    '/client/candidates/onboarding-assessment/:assessmentId/video-chunks',
  ONBOARDING_CHUNK_PLAYBACK_URL:
    '/client/candidates/onboarding-assessment/:assessmentId/video-chunks/:chunkId/playback-url',
  JOB_AI_VIDEO_CHUNKS:
    '/client/candidates/job-ai-assessment/:assessmentId/video-chunks',
  JOB_AI_CHUNK_PLAYBACK_URL:
    '/client/candidates/job-ai-assessment/:assessmentId/video-chunks/:chunkId/playback-url',
} as const;

export class ClientCandidateApiService extends ApiService {
  /**
   * Get video chunks for an onboarding assessment (Client/HR access)
   * Returns all relevant video chunks with optional playback URLs
   */
  public async getOnboardingVideoChunks(
    assessmentId: string,
    options?: {
      questionId?: string;
      includeAnalysis?: boolean;
      includePlaybackUrls?: boolean;
    }
  ): Promise<{
    chunks: Array<{
      id: string;
      chunkIndex: number;
      questionId: string | null;
      attemptNumber: number;
      status: string;
      createdAt: Date;
      analysis?: any;
      playbackUrl?: string;
    }>;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (options?.questionId) {
        queryParams.append('questionId', options.questionId);
      }
      if (options?.includeAnalysis !== undefined) {
        queryParams.append('includeAnalysis', String(options.includeAnalysis));
      }
      if (options?.includePlaybackUrls !== undefined) {
        queryParams.append(
          'includePlaybackUrls',
          String(options.includePlaybackUrls)
        );
      }

      const url = CLIENT_CANDIDATE_ENDPOINTS.ONBOARDING_VIDEO_CHUNKS.replace(
        ':assessmentId',
        assessmentId
      );
      const queryString = queryParams.toString();

      return await this.apiGet<{
        chunks: Array<{
          id: string;
          chunkIndex: number;
          questionId: string | null;
          attemptNumber: number;
          status: string;
          createdAt: Date;
          analysis?: any;
          playbackUrl?: string;
        }>;
      }>(`${url}${queryString ? `?${queryString}` : ''}`); // Unwrap the data property
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get playback URL for a specific video chunk (Client/HR access)
   * Returns a signed URL valid for 1 hour
   */
  public async getOnboardingChunkPlaybackUrl(
    assessmentId: string,
    chunkId: string
  ): Promise<{ playbackUrl: string; expiresIn: number }> {
    try {
      const url =
        CLIENT_CANDIDATE_ENDPOINTS.ONBOARDING_CHUNK_PLAYBACK_URL.replace(
          ':assessmentId',
          assessmentId
        ).replace(':chunkId', chunkId);

      return await this.apiGet<{ playbackUrl: string; expiresIn: number }>(url); // Unwrap the data property
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get video chunks for a job AI assessment (Client/HR access)
   * Returns all relevant video chunks with optional playback URLs
   */
  public async getJobAiAssessmentVideoChunks(
    assessmentId: string,
    options?: {
      questionId?: string;
      sectionId?: string;
      includeAnalysis?: boolean;
      includePlaybackUrls?: boolean;
    }
  ): Promise<{
    chunks: Array<{
      id: string;
      chunkIndex: number;
      questionId: string | null;
      sectionId: string | null;
      attemptNumber: number;
      status: string;
      createdAt: Date;
      analysis?: any;
      playbackUrl?: string;
    }>;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (options?.questionId) {
        queryParams.append('questionId', options.questionId);
      }
      if (options?.sectionId) {
        queryParams.append('sectionId', options.sectionId);
      }
      if (options?.includeAnalysis !== undefined) {
        queryParams.append('includeAnalysis', String(options.includeAnalysis));
      }
      if (options?.includePlaybackUrls !== undefined) {
        queryParams.append(
          'includePlaybackUrls',
          String(options.includePlaybackUrls)
        );
      }

      const url = CLIENT_CANDIDATE_ENDPOINTS.JOB_AI_VIDEO_CHUNKS.replace(
        ':assessmentId',
        assessmentId
      );
      const queryString = queryParams.toString();

      return await this.apiGet<{
        chunks: Array<{
          id: string;
          chunkIndex: number;
          questionId: string | null;
          sectionId: string | null;
          attemptNumber: number;
          status: string;
          createdAt: Date;
          analysis?: any;
          playbackUrl?: string;
        }>;
      }>(`${url}${queryString ? `?${queryString}` : ''}`); // Unwrap the data property
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get playback URL for a specific job AI assessment video chunk (Client/HR access)
   * Returns a signed URL valid for 1 hour
   */
  public async getJobAiAssessmentChunkPlaybackUrl(
    assessmentId: string,
    chunkId: string
  ): Promise<{ playbackUrl: string; expiresIn: number }> {
    try {
      const url = CLIENT_CANDIDATE_ENDPOINTS.JOB_AI_CHUNK_PLAYBACK_URL.replace(
        ':assessmentId',
        assessmentId
      ).replace(':chunkId', chunkId);

      return await this.apiGet<{ playbackUrl: string; expiresIn: number }>(url);
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
