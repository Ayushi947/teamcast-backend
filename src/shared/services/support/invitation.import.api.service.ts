import { ApiService } from '../core/api.service';
import type {
  ISupportInvitationImportProgress,
  ISupportInvitationImportRecord,
  ISupportInvitationImportStatistics,
  ISupportInvitationImportFilterQuery,
  ISupportInvitationImportPerUploadStatistics,
} from '../../models/domain/support/invitation.import.domain';
import {
  IPaginatedResponse,
  IPaginationRequest,
} from '../../models/api/common/common.api';
import { singleton } from '../../decorators/singleton';

/**
 * API endpoints for support invitation import management related operations
 */
const SUPPORT_INVITATION_IMPORT_ENDPOINTS = {
  BASE: '/support/invitation-import',
  UPLOAD: '/upload',
  LIST: '/list',
  STATISTICS: '/statistics',
  PER_UPLOAD_STATISTICS: '/statistics/per-upload',
} as const;

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportInvitationImportApiService:
 *       type: object
 *       description: API service for managing support invitation imports
 */
@singleton
export class SupportInvitationImportApiService extends ApiService {
  /**
   * Upload and process Excel file with candidate data for support invitations
   */
  public async uploadInvitations(
    file: File
  ): Promise<ISupportInvitationImportProgress> {
    try {
      const formData = new FormData();

      formData.append('file', file);

      return await this.apiPost<ISupportInvitationImportProgress>(
        `${SUPPORT_INVITATION_IMPORT_ENDPOINTS.BASE}${SUPPORT_INVITATION_IMPORT_ENDPOINTS.UPLOAD}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * List imported candidates for support invitations with filtering and pagination
   */
  public async listImportedCandidates(
    params?: ISupportInvitationImportFilterQuery & IPaginationRequest
  ): Promise<IPaginatedResponse<ISupportInvitationImportRecord>> {
    try {
      return await this.apiGet<
        IPaginatedResponse<ISupportInvitationImportRecord>
      >(
        `${SUPPORT_INVITATION_IMPORT_ENDPOINTS.BASE}${SUPPORT_INVITATION_IMPORT_ENDPOINTS.LIST}${params ? this.buildQueryString(params) : ''}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get support invitation import statistics
   */
  public async getImportStatistics(filters?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ISupportInvitationImportStatistics> {
    try {
      const queryParams = filters ? this.buildQueryString(filters) : '';
      return await this.apiGet<ISupportInvitationImportStatistics>(
        `${SUPPORT_INVITATION_IMPORT_ENDPOINTS.BASE}${SUPPORT_INVITATION_IMPORT_ENDPOINTS.STATISTICS}${queryParams}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get per-upload support invitation import statistics
   */
  public async getPerUploadStatistics(filters?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ISupportInvitationImportPerUploadStatistics[]> {
    try {
      const queryParams = filters ? this.buildQueryString(filters) : '';
      return await this.apiGet<ISupportInvitationImportPerUploadStatistics[]>(
        `${SUPPORT_INVITATION_IMPORT_ENDPOINTS.BASE}${SUPPORT_INVITATION_IMPORT_ENDPOINTS.PER_UPLOAD_STATISTICS}${queryParams}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
