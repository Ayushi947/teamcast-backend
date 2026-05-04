import { ApiService } from '../core/api.service';

import type {
  IClientUserInvitationSend,
  IClientUserInvitationFilterQuery,
  IClientUserInvitationAcceptParams,
  IClientUserInvitation,
  IClientUserInvitationAccepted,
} from '../../models/domain/client/user.invitation.domain';
import {
  IPaginatedResponse,
  IPaginationRequest,
} from '../../models/api/common/common.api';
import { singleton } from '../../decorators/singleton';

/**
 * API endpoints for user invitation related operations
 */
const USER_INVITATION_ENDPOINTS = {
  BASE: '/client/user-invitations',
  ACCEPT: '/client/user-invitations/accept',
} as const;

@singleton
export class ClientUserInvitationApiService extends ApiService {
  /**
   * Get list of user invitations
   */
  public async getUserInvitations(
    params?: IClientUserInvitationFilterQuery & IPaginationRequest
  ): Promise<IPaginatedResponse<IClientUserInvitation>> {
    try {
      return await this.apiGet<IPaginatedResponse<IClientUserInvitation>>(
        `${USER_INVITATION_ENDPOINTS.BASE}${params ? this.buildQueryString(params) : ''}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific user invitation
   */
  public async getUserInvitation(
    invitationId: string
  ): Promise<IClientUserInvitation> {
    try {
      return await this.apiGet<IClientUserInvitation>(
        `${USER_INVITATION_ENDPOINTS.BASE}/${invitationId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Send a new user invitation
   */
  public async sendUserInvitation(
    data: IClientUserInvitationSend
  ): Promise<IClientUserInvitation> {
    try {
      return await this.apiPost<IClientUserInvitation>(
        USER_INVITATION_ENDPOINTS.BASE,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Withdraw a user invitation
   */
  public async withdrawUserInvitation(invitationId: string): Promise<boolean> {
    try {
      return await this.apiDelete<boolean>(
        `${USER_INVITATION_ENDPOINTS.BASE}/${invitationId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Resend a user invitation
   */
  public async resendUserInvitation(
    invitationId: string
  ): Promise<IClientUserInvitation> {
    try {
      return await this.apiPost<IClientUserInvitation>(
        `${USER_INVITATION_ENDPOINTS.BASE}/${invitationId}/resend`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Accept a user invitation
   */
  public async acceptUserInvitation(
    params: IClientUserInvitationAcceptParams
  ): Promise<IClientUserInvitationAccepted> {
    try {
      if (!params.token) throw new Error('Token is required');
      return await this.apiPost<IClientUserInvitationAccepted>(
        `${USER_INVITATION_ENDPOINTS.ACCEPT}/${params.token}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
