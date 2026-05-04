import { ApiService } from '../core/api.service';
import { singleton } from '../../decorators/singleton';
import {
  ISubscriptionUsageSummary,
  ISubscriptionLimitCheck,
  ISubscriptionLimitCheckView,
  ISubscriptionLimitCheckAdd,
} from '../../models/domain/client/subscription.limits.domain';

/**
 * API endpoints for subscription limits operations
 */
const LIMITS_ENDPOINTS = {
  USAGE_SUMMARY: '/client/subscription/usage',
  JOB_POSTINGS_LIMIT: '/client/subscription/limits/job-postings',
  CANDIDATE_VIEWS_LIMIT: '/client/subscription/limits/candidate-views',
  AI_ASSESSMENTS_LIMIT: '/client/subscription/limits/ai-assessments',
  SEATS_LIMIT: '/client/subscription/limits/seats',
} as const;

@singleton
export class SubscriptionLimitsApiService extends ApiService {
  /**
   * Get usage summary for the current client
   */
  public async getUsageSummary(): Promise<ISubscriptionUsageSummary> {
    try {
      return await this.apiGet<ISubscriptionUsageSummary>(
        LIMITS_ENDPOINTS.USAGE_SUMMARY
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Check job posting limit for the current client
   */
  public async checkJobPostingLimit(): Promise<ISubscriptionLimitCheck> {
    try {
      return await this.apiGet<ISubscriptionLimitCheck>(
        LIMITS_ENDPOINTS.JOB_POSTINGS_LIMIT
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Check candidate view limit for the current client
   */
  public async checkCandidateViewLimit(): Promise<ISubscriptionLimitCheckView> {
    try {
      return await this.apiGet<ISubscriptionLimitCheckView>(
        LIMITS_ENDPOINTS.CANDIDATE_VIEWS_LIMIT
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Check AI assessment limit for the current client
   */
  public async checkAiAssessmentLimit(): Promise<ISubscriptionLimitCheck> {
    try {
      return await this.apiGet<ISubscriptionLimitCheck>(
        LIMITS_ENDPOINTS.AI_ASSESSMENTS_LIMIT
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Check seats (team members) limit for the current client
   */
  public async checkSeatsLimit(): Promise<ISubscriptionLimitCheckAdd> {
    try {
      return await this.apiGet<ISubscriptionLimitCheckAdd>(
        LIMITS_ENDPOINTS.SEATS_LIMIT
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
