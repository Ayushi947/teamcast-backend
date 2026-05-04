import { ApiService } from '../core/api.service';
import type {
  ISupportInvitation,
  ISupportInvitationSend,
  ISupportInvitationAccepted,
  ISupportInvitationFilterQuery,
  ISupportInvitationAcceptParams,
  ISupportGenericInvitationExpireParams,
  ISupportGenericInvitationExpireResult,
} from '../../models/domain/support/invitation.domain';
import {
  IPaginatedResponse,
  IPaginationRequest,
} from '../../models/api/common/common.api';
import { singleton } from '../../decorators/singleton';

/**
 * API endpoints for support invitation management related operations
 */
const SUPPORT_INVITATION_ENDPOINTS = {
  BASE: '/support/invitations',
  ALL: '/support/invitations/all',
} as const;

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportInvitationApiService:
 *       type: object
 *       description: API service for managing support invitations
 */
@singleton
export class SupportInvitationApiService extends ApiService {
  /**
   * Get all support invitations with filtering and pagination
   */
  public async getSupportInvitations(
    params?: ISupportInvitationFilterQuery & IPaginationRequest
  ): Promise<IPaginatedResponse<ISupportInvitation>> {
    try {
      return await this.apiGet<IPaginatedResponse<ISupportInvitation>>(
        `${SUPPORT_INVITATION_ENDPOINTS.BASE}${params ? this.buildQueryString(params) : ''}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific support invitation by ID
   */
  public async getSupportInvitation(
    invitationId: string
  ): Promise<ISupportInvitation> {
    try {
      return await this.apiGet<ISupportInvitation>(
        `${SUPPORT_INVITATION_ENDPOINTS.BASE}/${invitationId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Send a support invitation
   */
  public async sendInvitation(
    data: ISupportInvitationSend
  ): Promise<ISupportInvitation> {
    try {
      return await this.apiPost<ISupportInvitation>(
        SUPPORT_INVITATION_ENDPOINTS.BASE,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Withdraw a support invitation
   */
  public async withdrawInvitation(
    invitationId: string
  ): Promise<ISupportInvitation> {
    try {
      return await this.apiPost<ISupportInvitation>(
        `${SUPPORT_INVITATION_ENDPOINTS.BASE}/${invitationId}/withdraw`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Resend a support invitation
   */
  public async resendInvitation(
    invitationId: string
  ): Promise<ISupportInvitation> {
    try {
      return await this.apiPost<ISupportInvitation>(
        `${SUPPORT_INVITATION_ENDPOINTS.BASE}/${invitationId}/resend`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Accept a support invitation using token
   */
  public async acceptInvitation(
    params: ISupportInvitationAcceptParams
  ): Promise<ISupportInvitationAccepted> {
    try {
      return await this.apiPost<ISupportInvitationAccepted>(
        `${SUPPORT_INVITATION_ENDPOINTS.BASE}/accept/${params.token}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Generate a copied invitation token with shorter expiry (30 minutes)
   */
  public async generateCopiedInvitationToken(invitationId: string): Promise<{
    message: string;
    token: string;
    invitationUrl: string;
    expiresInMinutes: number;
  }> {
    try {
      return await this.apiPost<{
        message: string;
        token: string;
        invitationUrl: string;
        expiresInMinutes: number;
      }>(`${SUPPORT_INVITATION_ENDPOINTS.BASE}/${invitationId}/copy`);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Auto-expire invitations - automatically checks all invitations of the specified type and expires only those that have actually expired
   */
  public async expireGenericInvitation(
    params: ISupportGenericInvitationExpireParams
  ): Promise<ISupportGenericInvitationExpireResult> {
    try {
      return await this.apiPost<ISupportGenericInvitationExpireResult>(
        `${SUPPORT_INVITATION_ENDPOINTS.BASE}/${params.invitationType}/expire`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get all support invitations
   */
  public async getAllSupportInvitations(
    params?: ISupportInvitationFilterQuery & IPaginationRequest
  ): Promise<IPaginatedResponse<ISupportInvitation>> {
    try {
      return await this.apiGet<IPaginatedResponse<ISupportInvitation>>(
        `${SUPPORT_INVITATION_ENDPOINTS.ALL}${params ? this.buildQueryString(params) : ''}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
