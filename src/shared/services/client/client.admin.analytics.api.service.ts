import { ApiService } from '../core/api.service';
import {
  IClientAnalytics,
  IJobPostingAnalytics,
  IAiAssessmentAnalytics,
  IPanelAssessmentAnalytics,
  ICandidateAnalytics,
  ITeamMemberAnalytics,
  ICandidateOnboardingAnalytics,
} from '../../models/domain/client/client.admin.analytics.domain';
import { singleton } from '../../decorators/singleton';
import { IDateRangeFilter } from '../../models/api/common/common.api';

/**
 * @openapi
 * tags:
 *   name: Client Admin Analytics
 *   description: Client admin analytics endpoints
 */

/**
 * API endpoints for client admin analytics related operations
 */
const ANALYTICS_ENDPOINTS = {
  BASE: '/client/admin/analytics',
  JOB_POSTINGS: '/client/admin/analytics/job-postings',
  AI_ASSESSMENTS: '/client/admin/analytics/ai-assessments',
  PANEL_ASSESSMENTS: '/client/admin/analytics/panel-assessments',
  CANDIDATES: '/client/admin/analytics/candidates',
  TEAM_MEMBERS: '/client/admin/analytics/team-members',
  ONBOARDING: '/client/admin/analytics/onboarding',
  DASHBOARD: '/client/admin/analytics',
} as const;

/**
 * Service for handling client admin analytics related API operations
 */
@singleton
export class ClientAdminAnalyticsApiService extends ApiService {
  /**
   * @openapi
   * /client/admin/analytics:
   *   get:
   *     summary: Get complete analytics data for the client
   *     description: Retrieves all analytics data for the authenticated client
   *     tags:
   *       - Client Admin Analytics
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Client analytics data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ClientAdminAnalyticsResponse'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       403:
   *         description: Forbidden - User does not have access to this client
   *       500:
   *         description: Server error
   *
   * Retrieves complete analytics data for the client
   * @returns Promise resolving to the analytics details
   * @throws Error if the API request fails
   */
  public async getClientAnalytics(): Promise<IClientAnalytics> {
    try {
      return await this.apiGet<IClientAnalytics>(ANALYTICS_ENDPOINTS.BASE);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * @openapi
   * /client/admin/analytics/job-postings:
   *   get:
   *     summary: Get job posting analytics for the client
   *     description: Retrieves job posting analytics data for the authenticated client
   *     tags:
   *       - Client Admin Analytics
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Start date for filtering data
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: End date for filtering data
   *     responses:
   *       200:
   *         description: Job posting analytics data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/JobPostingAnalyticsResponse'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       403:
   *         description: Forbidden - User does not have access to this client
   *       500:
   *         description: Server error
   *
   * Retrieves job posting analytics for the client
   * @param dateRange Optional date range filter
   * @returns Promise resolving to job posting analytics
   * @throws Error if the API request fails
   */
  public async getJobPostingAnalytics(
    dateRange?: IDateRangeFilter
  ): Promise<IJobPostingAnalytics> {
    try {
      const queryParams = dateRange ? this.buildQueryString(dateRange) : '';
      return await this.apiGet<IJobPostingAnalytics>(
        `${ANALYTICS_ENDPOINTS.JOB_POSTINGS}${queryParams}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * @openapi
   * /client/admin/analytics/ai-assessments:
   *   get:
   *     summary: Get AI assessment analytics for the client
   *     description: Retrieves AI assessment analytics data for the authenticated client
   *     tags:
   *       - Client Admin Analytics
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Start date for filtering data
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: End date for filtering data
   *     responses:
   *       200:
   *         description: AI assessment analytics data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AiAssessmentAnalyticsResponse'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       403:
   *         description: Forbidden - User does not have access to this client
   *       500:
   *         description: Server error
   *
   * Retrieves AI assessment analytics for the client
   * @param dateRange Optional date range filter
   * @returns Promise resolving to AI assessment analytics
   * @throws Error if the API request fails
   */
  public async getAiAssessmentAnalytics(
    dateRange?: IDateRangeFilter
  ): Promise<IAiAssessmentAnalytics> {
    try {
      const queryParams = dateRange ? this.buildQueryString(dateRange) : '';
      return await this.apiGet<IAiAssessmentAnalytics>(
        `${ANALYTICS_ENDPOINTS.AI_ASSESSMENTS}${queryParams}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * @openapi
   * /client/admin/analytics/panel-assessments:
   *   get:
   *     summary: Get panel assessment analytics for the client
   *     description: Retrieves panel assessment analytics data for the authenticated client
   *     tags:
   *       - Client Admin Analytics
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Start date for filtering data
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: End date for filtering data
   *     responses:
   *       200:
   *         description: Panel assessment analytics data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/PanelAssessmentAnalyticsResponse'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       403:
   *         description: Forbidden - User does not have access to this client
   *       500:
   *         description: Server error
   *
   * Retrieves panel assessment analytics for the client
   * @param dateRange Optional date range filter
   * @returns Promise resolving to panel assessment analytics
   * @throws Error if the API request fails
   */
  public async getPanelAssessmentAnalytics(
    dateRange?: IDateRangeFilter
  ): Promise<IPanelAssessmentAnalytics> {
    try {
      const queryParams = dateRange ? this.buildQueryString(dateRange) : '';
      return await this.apiGet<IPanelAssessmentAnalytics>(
        `${ANALYTICS_ENDPOINTS.PANEL_ASSESSMENTS}${queryParams}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * @openapi
   * /client/admin/analytics/candidates:
   *   get:
   *     summary: Get candidate analytics for the client
   *     description: Retrieves candidate analytics data for the authenticated client
   *     tags:
   *       - Client Admin Analytics
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Start date for filtering data
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: End date for filtering data
   *     responses:
   *       200:
   *         description: Candidate analytics data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/CandidateAnalyticsResponse'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       403:
   *         description: Forbidden - User does not have access to this client
   *       500:
   *         description: Server error
   *
   * Retrieves candidate analytics for the client
   * @param dateRange Optional date range filter
   * @returns Promise resolving to candidate analytics
   * @throws Error if the API request fails
   */
  public async getCandidateAnalytics(
    dateRange?: IDateRangeFilter
  ): Promise<ICandidateAnalytics> {
    try {
      const queryParams = dateRange ? this.buildQueryString(dateRange) : '';
      return await this.apiGet<ICandidateAnalytics>(
        `${ANALYTICS_ENDPOINTS.CANDIDATES}${queryParams}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * @openapi
   * /client/admin/analytics/team-members:
   *   get:
   *     summary: Get team member analytics for the client
   *     description: Retrieves team member analytics data for the authenticated client
   *     tags:
   *       - Client Admin Analytics
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Start date for filtering data
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: End date for filtering data
   *     responses:
   *       200:
   *         description: Team member analytics data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/TeamMemberAnalyticsResponse'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       403:
   *         description: Forbidden - User does not have access to this client
   *       500:
   *         description: Server error
   *
   * Retrieves team member analytics for the client
   * @param dateRange Optional date range filter
   * @returns Promise resolving to team member analytics
   * @throws Error if the API request fails
   */
  public async getTeamMemberAnalytics(
    dateRange?: IDateRangeFilter
  ): Promise<ITeamMemberAnalytics> {
    try {
      const queryParams = dateRange ? this.buildQueryString(dateRange) : '';
      return await this.apiGet<ITeamMemberAnalytics>(
        `${ANALYTICS_ENDPOINTS.TEAM_MEMBERS}${queryParams}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * @openapi
   * /client/admin/analytics/onboarding:
   *   get:
   *     summary: Get candidate onboarding analytics for the client
   *     description: Retrieves candidate onboarding analytics data for the authenticated client
   *     tags:
   *       - Client Admin Analytics
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Start date for filtering data
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: End date for filtering data
   *     responses:
   *       200:
   *         description: Candidate onboarding analytics data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/CandidateOnboardingAnalyticsResponse'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       403:
   *         description: Forbidden - User does not have access to this client
   *       500:
   *         description: Server error
   *
   * Retrieves candidate onboarding analytics for the client
   * @param dateRange Optional date range filter
   * @returns Promise resolving to candidate onboarding analytics
   * @throws Error if the API request fails
   */
  public async getCandidateOnboardingAnalytics(
    dateRange?: IDateRangeFilter
  ): Promise<ICandidateOnboardingAnalytics> {
    try {
      const queryParams = dateRange ? this.buildQueryString(dateRange) : '';
      return await this.apiGet<ICandidateOnboardingAnalytics>(
        `${ANALYTICS_ENDPOINTS.ONBOARDING}${queryParams}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * @openapi
   * /client/admin/analytics/dashboard:
   *   get:
   *     summary: Get dashboard analytics for the client
   *     description: Retrieves summary analytics data for the client dashboard
   *     tags:
   *       - Client Admin Analytics
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Dashboard analytics data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ClientAdminAnalyticsResponse'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       403:
   *         description: Forbidden - User does not have access to this client
   *       500:
   *         description: Server error
   *
   * Retrieves dashboard analytics data for the client
   * This is a summary of key metrics for the dashboard
   * @returns Promise resolving to dashboard analytics
   * @throws Error if the API request fails
   */
  public async getDashboardAnalytics(): Promise<IClientAnalytics> {
    try {
      return await this.apiGet<IClientAnalytics>(ANALYTICS_ENDPOINTS.DASHBOARD);
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
