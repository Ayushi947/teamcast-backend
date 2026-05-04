import { ApiService } from '../core/api.service';

import {
  IPaginationRequest,
  IPaginatedResponse,
} from '../../models/api/common/common.api';
import {
  IClientJobApplication,
  IClientJobApplicationAiAssessment,
  IClientJobApplicationFilterQuery,
} from '../../models/domain/client/application.domain';
import { singleton } from '../../decorators/singleton';
import { ApplicationStatusEnum } from '../../models/common/enums';
/**
 * API endpoints for job application related operations
 */
const APPLICATION_ENDPOINTS = {
  BASE: '/client/applications',
  UPDATE_STATUS: '/client/applications/:applicationId',
  HIRE_REQUEST: '/client/applications/:applicationId/hire',
} as const;

@singleton
export class ClientJobApplicationApiService extends ApiService {
  /**
   * Get list of job applications
   */
  public async getJobApplications(
    filters?: IClientJobApplicationFilterQuery & IPaginationRequest
  ): Promise<IPaginatedResponse<IClientJobApplication>> {
    try {
      return await this.apiGet<IPaginatedResponse<IClientJobApplication>>(
        `${APPLICATION_ENDPOINTS.BASE}${filters ? this.buildQueryString(filters) : ''}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific job application
   */
  public async getJobApplication(
    applicationId: string
  ): Promise<IClientJobApplication> {
    try {
      return await this.apiGet<IClientJobApplication>(
        `${APPLICATION_ENDPOINTS.BASE}/${applicationId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get AI assessment for a job application
   * Returns null if no assessment exists yet (candidate hasn't completed assessment)
   */
  public async getJobApplicationAiAssessment(
    applicationId: string
  ): Promise<IClientJobApplicationAiAssessment | null> {
    try {
      return await this.apiGet<IClientJobApplicationAiAssessment | null>(
        `${APPLICATION_ENDPOINTS.BASE}/${applicationId}/ai-assessment`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update the status of a job application
   */
  public async updateJobApplicationStatus(
    applicationId: string,
    status: ApplicationStatusEnum,
    notes?: string
  ): Promise<IClientJobApplication> {
    try {
      const url = APPLICATION_ENDPOINTS.UPDATE_STATUS.replace(
        ':applicationId',
        applicationId
      );
      return await this.apiPatch<IClientJobApplication>(url, { status, notes });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Process hire request and send email to account manager
   */
  public async processHireRequest(
    applicationId: string
  ): Promise<{ message: string }> {
    try {
      const url = APPLICATION_ENDPOINTS.HIRE_REQUEST.replace(
        ':applicationId',
        applicationId
      );
      return await this.apiPost<{ message: string }>(url);
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
