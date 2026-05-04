import { ICandidateJobApplicationFilterQuery } from '../../models/api/candidate/application.api';
import { ApiService } from '../core/api.service';
import {
  IPaginatedResponse,
  IPaginationRequest,
} from '../../models/api/common/common.api';
import {
  ICandidateJobApplication,
  ICandidateJobApplicationAccept,
  ICandidateJobApplicationAiAssessment,
  ICandidateJobApplicationReject,
  ICandidateJobApplicationUpdate,
  ICandidateJobApplicationWithdraw,
} from '../../models/domain/candidate/application.domain';
import { singleton } from '../../decorators/singleton';
/**
 * API endpoints for job application related operations
 */
const APPLICATION_ENDPOINTS = {
  BASE: '/candidate/applications',
} as const;

/**
 * Service for handling job application related API operations
 */
@singleton
export class CandidateJobApplicationApiService extends ApiService {
  /**
   * Retrieves a list of job applications with optional filtering and pagination
   * @param filter - Optional filter and pagination parameters
   * @returns Promise resolving to paginated job applications
   * @throws Error if the API request fails
   */
  public async getApplications(
    filters?: ICandidateJobApplicationFilterQuery & IPaginationRequest
  ): Promise<IPaginatedResponse<ICandidateJobApplication>> {
    try {
      return await this.apiGet<IPaginatedResponse<ICandidateJobApplication>>(
        `${APPLICATION_ENDPOINTS.BASE}${filters ? this.buildQueryString(filters) : ''}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Retrieves a specific job application by ID
   * @param applicationId - The ID of the application to retrieve
   * @returns Promise resolving to the application details
   * @throws Error if the API request fails
   */
  public async getApplication(
    applicationId: string
  ): Promise<ICandidateJobApplication> {
    try {
      return await this.apiGet<ICandidateJobApplication>(
        `${APPLICATION_ENDPOINTS.BASE}/${applicationId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Updates a specific job application
   * @param applicationId - The ID of the application to update
   * @param data - The update data
   * @returns Promise resolving to the updated application details
   * @throws Error if the API request fails
   */
  public async updateApplication(
    applicationId: string,
    data: ICandidateJobApplicationUpdate
  ): Promise<ICandidateJobApplication> {
    try {
      return await this.apiPatch<ICandidateJobApplication>(
        `${APPLICATION_ENDPOINTS.BASE}/${applicationId}`,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Accepts a specific job application
   * @param applicationId - The ID of the application to accept
   * @param data - The acceptance data
   * @returns Promise resolving to the accepted application details
   * @throws Error if the API request fails
   */
  public async acceptApplication(
    applicationId: string,
    data: ICandidateJobApplicationAccept
  ): Promise<ICandidateJobApplication> {
    try {
      return await this.apiPost<ICandidateJobApplication>(
        `${APPLICATION_ENDPOINTS.BASE}/${applicationId}/accept`,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Rejects a specific job application
   * @param applicationId - The ID of the application to reject
   * @param data - The rejection data
   * @returns Promise resolving to the rejected application details
   * @throws Error if the API request fails
   */
  public async rejectApplication(
    applicationId: string,
    data: ICandidateJobApplicationReject
  ): Promise<ICandidateJobApplication> {
    try {
      return await this.apiPost<ICandidateJobApplication>(
        `${APPLICATION_ENDPOINTS.BASE}/${applicationId}/reject`,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Withdraws a specific job application
   * @param applicationId - The ID of the application to withdraw
   * @param data - The withdrawal data
   * @returns Promise resolving to the withdrawn application details
   * @throws Error if the API request fails
   */
  public async withdrawApplication(
    applicationId: string,
    data: ICandidateJobApplicationWithdraw
  ): Promise<ICandidateJobApplication> {
    try {
      return await this.apiPost<ICandidateJobApplication>(
        `${APPLICATION_ENDPOINTS.BASE}/${applicationId}/withdraw`,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Retrieves AI assessment for a specific job application
   * @param applicationId - The ID of the application
   * @returns Promise resolving to the AI assessment details
   * @throws Error if the API request fails
   */
  public async getApplicationAiAssessment(
    applicationId: string
  ): Promise<ICandidateJobApplicationAiAssessment> {
    try {
      return await this.apiGet<ICandidateJobApplicationAiAssessment>(
        `${APPLICATION_ENDPOINTS.BASE}/${applicationId}/ai-assessment`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
