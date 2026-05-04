import { IPaginationRequest } from '../../models/api/common/common.api';
import {
  IPartnerJobApplicationFilterQuery,
  IPartnerJobApplicationDetails,
  IPartnerJobApplicationWithdraw,
} from '../../models/domain/partner/job.application.domain';
import { singleton } from '../../decorators/singleton';
import { ApiService } from '../core/api.service';
import { IPaginatedResponse } from '../../models/api/common/common.api';
import { ApplicationStatusEnum } from '../../models/common/enums';

const PARTNER_JOB_APPLICATIONS_ENDPOINTS = {
  BASE: '/partner/job-applications',
  WITHDRAW: '/partner/job-applications/:id/withdraw',
} as const;

@singleton
export class PartnerJobApplicationsApiService extends ApiService {
  /**
   * Retrieves a list of job applications submitted by the partner with optional filtering and pagination
   * @param filter - Optional filter and pagination parameters
   * @returns Promise resolving to paginated job applications list
   * @throws Error if the API request fails
   */
  public async getJobApplications(
    filter?: IPartnerJobApplicationFilterQuery & IPaginationRequest
  ): Promise<IPaginatedResponse<IPartnerJobApplicationDetails>> {
    return await this.apiGet<IPaginatedResponse<IPartnerJobApplicationDetails>>(
      `${PARTNER_JOB_APPLICATIONS_ENDPOINTS.BASE}${
        filter ? this.buildQueryString(filter) : ''
      }`
    );
  }

  /**
   * Retrieves a specific job application by ID
   * @param applicationId - The ID of the job application to retrieve
   * @returns Promise resolving to the job application details
   * @throws Error if the API request fails
   */
  public async getJobApplicationById(
    applicationId: string
  ): Promise<IPartnerJobApplicationDetails> {
    return await this.apiGet<IPartnerJobApplicationDetails>(
      `${PARTNER_JOB_APPLICATIONS_ENDPOINTS.BASE}/${applicationId}`
    );
  }

  /**
   * Withdraws a job application
   * @param applicationId - The ID of the job application to withdraw
   * @param withdrawData - Optional withdrawal reason
   * @returns Promise resolving to withdrawal result
   * @throws Error if the API request fails
   */
  public async withdrawJobApplication(
    applicationId: string,
    withdrawData?: IPartnerJobApplicationWithdraw
  ): Promise<{
    message: string;
    applicationId: string;
    status: ApplicationStatusEnum;
  }> {
    return await this.apiPost<{
      message: string;
      applicationId: string;
      status: ApplicationStatusEnum;
    }>(
      `${PARTNER_JOB_APPLICATIONS_ENDPOINTS.WITHDRAW.replace(':id', applicationId)}`,
      withdrawData
    );
  }
}
