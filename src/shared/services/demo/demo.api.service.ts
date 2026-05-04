import { ApiService } from '../core/api.service';
import type {
  IDemoProfile,
  IDemoAssessment,
  IDemoQuestion,
  IDemoResults,
  IDemoVideoAnalysis,
} from '../../models/domain/demo/demo.domain';
import type {
  IDemoAssessmentStartRequest,
  IDemoAnswerSubmitRequest,
  IDemoVideoAnalysisRequest,
} from '../../models/api/demo/demo.api';
import { singleton } from '../../decorators/singleton';

/**
 * API endpoints for demo related operations
 */
const DEMO_ENDPOINTS = {
  BASE: '/demo',
  PROFILES: '/demo/profiles',
  PROFILE_BY_ID: '/demo/profiles/:profileId',
  ASSESSMENT_START: '/demo/assessment/start',
  ASSESSMENT_QUESTIONS: '/demo/assessment/:sessionId/questions',
  ASSESSMENT_SUBMIT_ANSWER: '/demo/assessment/:sessionId/submit-answer',
  ASSESSMENT_COMPLETE: '/demo/assessment/:sessionId/complete',
  ASSESSMENT_RESULTS: '/demo/assessment/:sessionId/results',
  VIDEO_ANALYZE: '/demo/video/analyze',
  PRESIGNED_URL: '/demo/presigned-url',
} as const;

@singleton
export class DemoApiService extends ApiService {
  /**
   * Get available demo profiles
   */
  public async getDemoProfiles(): Promise<IDemoProfile[]> {
    try {
      return await this.apiGet<IDemoProfile[]>(DEMO_ENDPOINTS.PROFILES);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get specific demo profile by ID
   */
  public async getDemoProfile(profileId: string): Promise<IDemoProfile> {
    try {
      return await this.apiGet<IDemoProfile>(
        DEMO_ENDPOINTS.PROFILE_BY_ID.replace(':profileId', profileId)
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Start demo assessment
   */
  public async startDemoAssessment(
    request: IDemoAssessmentStartRequest
  ): Promise<IDemoAssessment> {
    try {
      return await this.apiPost<IDemoAssessment>(
        DEMO_ENDPOINTS.ASSESSMENT_START,
        request
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get assessment questions
   */
  public async getAssessmentQuestions(
    sessionId: string
  ): Promise<IDemoQuestion[]> {
    try {
      return await this.apiGet<IDemoQuestion[]>(
        DEMO_ENDPOINTS.ASSESSMENT_QUESTIONS.replace(':sessionId', sessionId)
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Submit answer for assessment question
   */
  public async submitAnswer(
    sessionId: string,
    request: IDemoAnswerSubmitRequest
  ): Promise<{ success: boolean; nextQuestion?: IDemoQuestion }> {
    try {
      return await this.apiPost<{
        success: boolean;
        nextQuestion?: IDemoQuestion;
      }>(
        DEMO_ENDPOINTS.ASSESSMENT_SUBMIT_ANSWER.replace(
          ':sessionId',
          sessionId
        ),
        request
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Complete demo assessment
   */
  public async completeAssessment(
    sessionId: string
  ): Promise<{ success: boolean; resultsId: string }> {
    try {
      return await this.apiPost<{ success: boolean; resultsId: string }>(
        DEMO_ENDPOINTS.ASSESSMENT_COMPLETE.replace(':sessionId', sessionId)
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get assessment results
   */
  public async getAssessmentResults(sessionId: string): Promise<IDemoResults> {
    try {
      return await this.apiGet<IDemoResults>(
        DEMO_ENDPOINTS.ASSESSMENT_RESULTS.replace(':sessionId', sessionId)
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Analyze video
   */
  public async analyzeVideo(
    request: IDemoVideoAnalysisRequest
  ): Promise<IDemoVideoAnalysis> {
    try {
      return await this.apiPost<IDemoVideoAnalysis>(
        DEMO_ENDPOINTS.VIDEO_ANALYZE,
        request
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get presigned URL for video upload
   */
  public async getPresignedUrl(
    fileName: string
  ): Promise<{ uploadUrl: string; videoUrl: string }> {
    try {
      return await this.apiGet<{ uploadUrl: string; videoUrl: string }>(
        `${DEMO_ENDPOINTS.PRESIGNED_URL}?fileName=${encodeURIComponent(fileName)}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
