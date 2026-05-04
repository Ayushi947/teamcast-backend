import { ApiService } from '../core/api.service';
import {
  IGetUserToursResponse,
  IUserTourProgress,
  ITourStepResponse,
  IUpdateTourProgressRequest,
  ITourAnalytics,
  ITourStatusResponse,
} from '../../models/domain/tour/tour.guidance.domain';
import { singleton } from '../../decorators/singleton';
import {
  IPaginationRequest,
  IPaginatedResponse,
} from '../../models/api/common/common.api';

/**
 * API endpoints for tour guidance operations
 */
const TOUR_ENDPOINTS = {
  BASE: '/tours',
  START: '/tours/start',
  STEP: '/tours/:tourId/step',
  PROGRESS: '/tours/progress',
  STATUS: '/tours/status',
  PAUSE: '/tours/:tourId/pause',
  SKIP: '/tours/:tourId/skip',
  RESUME: '/tours/:tourId/resume',
  COMPLETE: '/tours/:tourId/complete',
  DISMISS: '/tours/:tourId/dismiss',
  RESET: '/tours/:tourId/reset',
  ANALYTICS: '/tours/analytics',
} as const;

@singleton
export class TourGuidanceApiService extends ApiService {
  /**
   * Get available, active, completed, and suggested tours for the current user
   */
  public async getUserTours(): Promise<IGetUserToursResponse> {
    try {
      return await this.apiGet<IGetUserToursResponse>(TOUR_ENDPOINTS.BASE);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Start a tour for the current user
   */
  public async startTour(
    tourKey: string,
    customSettings?: any
  ): Promise<IUserTourProgress> {
    try {
      return await this.apiPost<IUserTourProgress>(TOUR_ENDPOINTS.START, {
        tourKey,
        customSettings,
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }
  /**
   * Get tour status by key
   */
  public async getTourStatusByKey(
    tourKey: string
  ): Promise<ITourStatusResponse> {
    try {
      const url = `${TOUR_ENDPOINTS.STATUS}/${tourKey}`;
      return await this.apiGet<ITourStatusResponse>(url);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get current tour step
   */
  public async getTourStep(tourId: string): Promise<ITourStepResponse> {
    try {
      const url = TOUR_ENDPOINTS.STEP.replace(':tourId', tourId);
      return await this.apiGet<ITourStepResponse>(url);
    } catch (error) {
      throw this.handleError(error);
    }
  }
  /**
   * Get tour progress by key
   */
  public async getTourProgressByKey(
    tourKey: string
  ): Promise<IUserTourProgress> {
    try {
      const url = `${TOUR_ENDPOINTS.PROGRESS}/${tourKey}`;
      return await this.apiGet<IUserTourProgress>(url);
    } catch (error) {
      throw this.handleError(error);
    }
  }
  /**
   * Skip a tour step
   */
  public async skipTour(
    tourId: string,
    stepId?: string
  ): Promise<IUserTourProgress> {
    try {
      const url = TOUR_ENDPOINTS.SKIP.replace(':tourId', tourId);
      const queryParams = stepId ? `?stepId=${stepId}` : '';
      return await this.apiPut<IUserTourProgress>(`${url}${queryParams}`);
    } catch (error) {
      throw this.handleError(error);
    }
  }
  /**
   * Update tour progress
   */
  public async updateTourProgress(
    data: IUpdateTourProgressRequest
  ): Promise<IUserTourProgress> {
    try {
      return await this.apiPut<IUserTourProgress>(
        TOUR_ENDPOINTS.PROGRESS,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Pause a tour
   */
  public async pauseTour(tourId: string): Promise<IUserTourProgress> {
    try {
      const url = TOUR_ENDPOINTS.PAUSE.replace(':tourId', tourId);
      return await this.apiPut<IUserTourProgress>(url);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Resume a tour
   */
  public async resumeTour(tourId: string): Promise<IUserTourProgress> {
    try {
      const url = TOUR_ENDPOINTS.RESUME.replace(':tourId', tourId);
      return await this.apiPut<IUserTourProgress>(url);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Complete a tour
   */
  public async completeTour(tourId: string): Promise<IUserTourProgress> {
    try {
      const url = TOUR_ENDPOINTS.COMPLETE.replace(':tourId', tourId);
      return await this.apiPut<IUserTourProgress>(url);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Dismiss a tour
   */
  public async dismissTour(tourId: string): Promise<IUserTourProgress> {
    try {
      const url = TOUR_ENDPOINTS.DISMISS.replace(':tourId', tourId);
      return await this.apiPut<IUserTourProgress>(url);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Reset a tour
   */
  public async resetTour(tourId: string): Promise<IUserTourProgress> {
    try {
      const url = TOUR_ENDPOINTS.RESET.replace(':tourId', tourId);
      return await this.apiPut<IUserTourProgress>(url);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get tour analytics (Admin only)
   */
  public async getTourAnalytics(
    filters?: any,
    pagination?: IPaginationRequest
  ): Promise<IPaginatedResponse<ITourAnalytics>> {
    try {
      const params = {
        ...filters,
        ...this.buildPaginationParams(pagination),
      };
      const queryString = this.buildQueryString(params);
      const url = `${TOUR_ENDPOINTS.ANALYTICS}${queryString}`;
      return await this.apiGet<IPaginatedResponse<ITourAnalytics>>(url);
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
