import { ApiService } from '../core/api.service';
import type {
  IPartnerUserInvitationSend,
  IPartnerUserInvitationFilterQuery,
  IPartnerUserInvitation,
} from '../../models/domain/partner/user.invitation.domain';
import {
  IPaginatedResponse,
  IPaginationRequest,
} from '../../models/api/common/common.api';
import { singleton } from '../../decorators/singleton';

/**
 * API endpoints for partner user invitation related operations
 */
const USER_INVITATION_ENDPOINTS = {
  BASE: '/partner/user-invitations',
  ACCEPT: '/partner/user-invitations/accept',
} as const;

@singleton
export class PartnerUserInvitationApiService extends ApiService {
  /**
   * Get list of partner user invitations
   */
  public async getUserInvitations(
    params?: IPartnerUserInvitationFilterQuery & IPaginationRequest
  ): Promise<IPaginatedResponse<IPartnerUserInvitation>> {
    try {
      return await this.apiGet<IPaginatedResponse<IPartnerUserInvitation>>(
        `${USER_INVITATION_ENDPOINTS.BASE}${params ? this.buildQueryString(params) : ''}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Send invitation to a user
   */
  public async sendUserInvitation(
    data: IPartnerUserInvitationSend
  ): Promise<IPartnerUserInvitation> {
    try {
      return await this.apiPost<IPartnerUserInvitation>(
        USER_INVITATION_ENDPOINTS.BASE,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific invitation by ID
   */
  public async getUserInvitation(
    invitationId: string
  ): Promise<IPartnerUserInvitation> {
    try {
      return await this.apiGet<IPartnerUserInvitation>(
        `${USER_INVITATION_ENDPOINTS.BASE}/${invitationId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Withdraw an invitation
   */
  public async withdrawUserInvitation(
    invitationId: string
  ): Promise<IPartnerUserInvitation> {
    try {
      return await this.apiPatch<IPartnerUserInvitation>(
        `${USER_INVITATION_ENDPOINTS.BASE}/${invitationId}/withdraw`,
        {}
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Resend an invitation
   */
  public async resendUserInvitation(
    invitationId: string
  ): Promise<IPartnerUserInvitation> {
    try {
      return await this.apiPost<IPartnerUserInvitation>(
        `${USER_INVITATION_ENDPOINTS.BASE}/${invitationId}/resend`,
        {}
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Accept an invitation using a token (public endpoint)
   */
  public async acceptUserInvitation(
    token: string
  ): Promise<{ user: any; authToken: any }> {
    try {
      return await this.apiPost<{ user: any; authToken: any }>(
        `${USER_INVITATION_ENDPOINTS.ACCEPT}/${token}`,
        {}
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
