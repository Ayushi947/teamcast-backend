import { Request, Response, NextFunction } from 'express';
import { PartnerUserInvitationService } from '@/services/partner/user.invitation.service';
import { singleton } from '@/shared/decorators/singleton';
import {
  IPartnerUserInvitationSendApiRequest,
  IPartnerUserInvitationSendApiResponse,
  IPartnerUserInvitationListApiRequest,
  IPartnerUserInvitationListApiResponse,
  IPartnerUserInvitationGetApiRequest,
  IPartnerUserInvitationGetApiResponse,
  IPartnerUserInvitationWithdrawApiRequest,
  IPartnerUserInvitationWithdrawApiResponse,
  IPartnerUserInvitationResendApiRequest,
  IPartnerUserInvitationResendApiResponse,
  IPartnerUserInvitationAcceptApiRequest,
  IPartnerUserInvitationAcceptApiResponse,
} from '@/shared/models/api/partner/user.invitation.api';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';

@singleton
export class PartnerUserInvitationController extends BaseController {
  constructor(
    private readonly partnerUserInvitationService: PartnerUserInvitationService
  ) {
    super();
  }

  /**
   * Send an invitation to a user to join a partner team
   */
  sendInvitation = (req: Request, res: Response, next: NextFunction): void => {
    this.handleRequest<IPartnerUserInvitationSendApiResponse>(
      req,
      res,
      next,
      async () => {
        const userId = req.user.id;

        // Get the invitation data from the request body
        const invitationRequest =
          createIApiRequest<IPartnerUserInvitationSendApiRequest>(req);

        // Call service method with domain model
        return await this.partnerUserInvitationService.sendInvitation(
          invitationRequest.data.partnerId,
          userId,
          invitationRequest.data
        );
      }
    );
  };

  /**
   * List invitations for a partner
   */
  listInvitations = (req: Request, res: Response, next: NextFunction): void => {
    this.handleRequest<IPartnerUserInvitationListApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.user.partnerId as string;
        const userId = req.user.id;

        // Extract filter parameters
        const listInvitationsRequest =
          createIApiRequest<IPartnerUserInvitationListApiRequest>(req);

        // Call service method with domain models
        return await this.partnerUserInvitationService.listInvitations(
          partnerId,
          userId,
          listInvitationsRequest.filters || {},
          listInvitationsRequest.pagination || { page: 1, limit: 10 }
        );
      }
    );
  };

  /**
   * Get a specific invitation by ID
   */
  getInvitation = (req: Request, res: Response, next: NextFunction): void => {
    this.handleRequest<IPartnerUserInvitationGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.user.partnerId as string;
        const getInvitationRequest =
          createIApiRequest<IPartnerUserInvitationGetApiRequest>(req);

        return await this.partnerUserInvitationService.getInvitation(
          partnerId,
          getInvitationRequest.params.partnerUserInvitationId
        );
      }
    );
  };

  /**
   * Withdraw an invitation
   */
  withdrawInvitation = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    this.handleRequest<IPartnerUserInvitationWithdrawApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.user.partnerId as string;
        const withdrawInvitationRequest =
          createIApiRequest<IPartnerUserInvitationWithdrawApiRequest>(req);

        return await this.partnerUserInvitationService.withdrawInvitation(
          partnerId,
          withdrawInvitationRequest.params.partnerUserInvitationId
        );
      }
    );
  };

  /**
   * Resend an invitation
   */
  resendInvitation = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    this.handleRequest<IPartnerUserInvitationResendApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.user.partnerId as string;
        const userId = req.user.id;
        const resendInvitationRequest =
          createIApiRequest<IPartnerUserInvitationResendApiRequest>(req);

        return await this.partnerUserInvitationService.resendInvitation(
          partnerId,
          userId,
          resendInvitationRequest.params.partnerUserInvitationId
        );
      }
    );
  };

  /**
   * Accept an invitation using a token
   */
  acceptInvitation = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    this.handleRequest<IPartnerUserInvitationAcceptApiResponse>(
      req,
      res,
      next,
      async () => {
        const acceptInvitationRequest =
          createIApiRequest<IPartnerUserInvitationAcceptApiRequest>(req);

        return await this.partnerUserInvitationService.acceptInvitation(
          acceptInvitationRequest.params.token || ''
        );
      }
    );
  };
}
