import { ApiService } from '../core/api.service';
import type {
  ISupportPartnerUpdate,
  ISupportPartner,
  ISupportPartnerFilterQueryCompanyId,
} from '../../models/domain/support/partners.domain';
import {
  IPaginatedResponse,
  IPaginationRequest,
} from '../../models/api/common/common.api';

/**
 * API endpoints for support partner management related operations
 */
const SUPPORT_PARTNER_MANAGEMENT_ENDPOINTS = {
  BASE: '/support/partners',
  JOB_POSTINGS: '/job-postings',
  USERS: '/users',
  INVITES: '/invitations',
} as const;

export class SupportPartnerManagementApiService extends ApiService {
  /**
   * Get list of support partners
   */
  public async listSupportPartners(
    filter: ISupportPartnerFilterQueryCompanyId & IPaginationRequest
  ): Promise<IPaginatedResponse<ISupportPartner>> {
    try {
      return await this.apiGet<IPaginatedResponse<ISupportPartner>>(
        `${SUPPORT_PARTNER_MANAGEMENT_ENDPOINTS.BASE}${filter ? this.buildQueryString(filter) : ''}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific support partner
   */
  public async getSupportPartner(
    supportPartnerId: string
  ): Promise<ISupportPartner> {
    try {
      return await this.apiGet<ISupportPartner>(
        `${SUPPORT_PARTNER_MANAGEMENT_ENDPOINTS.BASE}/${supportPartnerId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update a support partner
   */
  public async updateSupportPartner(
    supportPartnerId: string,
    data: ISupportPartnerUpdate
  ): Promise<ISupportPartner> {
    try {
      return await this.apiPatch<ISupportPartner>(
        `${SUPPORT_PARTNER_MANAGEMENT_ENDPOINTS.BASE}/${supportPartnerId}`,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete a support partner
   */
  public async deleteSupportPartner(
    supportPartnerId: string
  ): Promise<boolean> {
    try {
      return await this.apiDelete<boolean>(
        `${SUPPORT_PARTNER_MANAGEMENT_ENDPOINTS.BASE}/${supportPartnerId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * List job postings for a specific support partner
   */
  public async listSupportPartnerJobPostings(
    partnerId: string,
    pagination: IPaginationRequest
  ): Promise<IPaginatedResponse<any>> {
    try {
      return await this.apiGet<IPaginatedResponse<any>>(
        `${SUPPORT_PARTNER_MANAGEMENT_ENDPOINTS.BASE}/${partnerId}${SUPPORT_PARTNER_MANAGEMENT_ENDPOINTS.JOB_POSTINGS}${pagination ? this.buildQueryString(pagination) : ''}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * List users for a specific support partner
   */
  public async listSupportPartnerUsers(
    partnerId: string,
    pagination: IPaginationRequest
  ): Promise<IPaginatedResponse<any>> {
    try {
      return await this.apiGet<IPaginatedResponse<any>>(
        `${SUPPORT_PARTNER_MANAGEMENT_ENDPOINTS.BASE}/${partnerId}${SUPPORT_PARTNER_MANAGEMENT_ENDPOINTS.USERS}${pagination ? this.buildQueryString(pagination) : ''}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * List invitations for a specific support partner
   */
  public async listSupportPartnerInvites(
    partnerId: string,
    pagination: IPaginationRequest
  ): Promise<IPaginatedResponse<any>> {
    try {
      return await this.apiGet<IPaginatedResponse<any>>(
        `${SUPPORT_PARTNER_MANAGEMENT_ENDPOINTS.BASE}/${partnerId}${SUPPORT_PARTNER_MANAGEMENT_ENDPOINTS.INVITES}${pagination ? this.buildQueryString(pagination) : ''}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
