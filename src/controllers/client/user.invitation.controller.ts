import { Request, Response, NextFunction } from 'express';
import { ClientUserInvitationService } from '@/services/client/user.invitation.service';
import { logger } from '@/shared/utils/logger';
import {
  IClientUserInvitationSendApiRequest,
  IClientUserInvitationSendApiResponse,
  IClientUserInvitationWithdrawApiResponse,
  IClientUserInvitationResendApiResponse,
  IClientUserInvitationAcceptApiResponse,
  IClientUserInvitationListApiResponse,
  IClientUserInvitationGetApiResponse,
  IClientUserInvitationGetApiRequest,
  IClientUserInvitationWithdrawApiRequest,
  IClientUserInvitationResendApiRequest,
  IClientUserInvitationAcceptApiRequest,
  IClientUserInvitationListApiRequest,
} from '@/shared/models/api/client/user.invitation.api';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';

export class ClientUserInvitationController extends BaseController {
  constructor(
    private readonly clientUserInvitationService: ClientUserInvitationService
  ) {
    super();
  }

  /**
   * Send an invitation to a user to join a client team
   */
  sendInvitation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientUserInvitationSendApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const userId = req.user.id;
        // Get the invitation data from the request body
        const invitationRequest =
          createIApiRequest<IClientUserInvitationSendApiRequest>(req);

        logger.info({
          message: 'Sending client user invitation',
          context: 'ClientUserInvitationController.sendInvitation',
          clientId,
          email: invitationRequest.data.email,
          role: invitationRequest.data.role,
        });
        return await this.clientUserInvitationService.sendInvitation(
          clientId,
          userId,
          invitationRequest.data
        );
      }
    );
  };

  /**
   * Get an invitation by ID
   */
  getInvitation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientUserInvitationGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;

        // Get the invitation id from the request params
        const invitationGetRequest =
          createIApiRequest<IClientUserInvitationGetApiRequest>(req);

        logger.info({
          message: 'Getting client user invitation',
          context: 'ClientUserInvitationController.getInvitation',
          clientId,
          invitationId: invitationGetRequest.params.clientUserInvitationId,
        });
        return await this.clientUserInvitationService.getInvitation(
          clientId,
          invitationGetRequest.params.clientUserInvitationId
        );
      }
    );
  };

  /**
   * Withdraw an invitation
   */
  withdrawInvitation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientUserInvitationWithdrawApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const userId = req.user.id;

        // Get the invitation id from the request params
        const invitationWithdrawRequest =
          createIApiRequest<IClientUserInvitationWithdrawApiRequest>(req);

        logger.info({
          message: 'Withdrawing client user invitation',
          context: 'ClientUserInvitationController.withdrawInvitation',
          clientId,
          invitationId: invitationWithdrawRequest.params.clientUserInvitationId,
        });
        return await this.clientUserInvitationService.withdrawInvitation(
          clientId,
          userId,
          invitationWithdrawRequest.params.clientUserInvitationId
        );
      }
    );
  };

  /**
   * Resend an invitation
   */
  resendInvitation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientUserInvitationResendApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const userId = req.user.id;
        // Get the invitation id from the request params
        const invitationResendRequest =
          createIApiRequest<IClientUserInvitationResendApiRequest>(req);
        logger.info({
          message: 'Resending client user invitation',
          context: 'ClientUserInvitationController.resendInvitation',
          clientId,
          invitationId: invitationResendRequest.params.clientUserInvitationId,
        });
        const result = await this.clientUserInvitationService.resendInvitation(
          clientId,
          userId,
          invitationResendRequest.params.clientUserInvitationId
        );
        return result;
      }
    );
  };

  /**
   * Accept an invitation
   * This is a public endpoint accessed via a token
   */
  acceptInvitation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientUserInvitationAcceptApiResponse>(
      req,
      res,
      next,
      async () => {
        // Get the token from the request params
        const invitationAcceptRequest =
          createIApiRequest<IClientUserInvitationAcceptApiRequest>(req);
        const token = invitationAcceptRequest.params.token;

        if (!token) {
          throw new Error('Token is required');
        }
        logger.info({
          message: 'Accepting client user invitation',
          context: 'ClientUserInvitationController.acceptInvitation',
          tokenPrefix: token.substring(0, 8) + '...', // Log partial token for debugging
        });
        return await this.clientUserInvitationService.acceptInvitation(token);
      }
    );
  };

  /**
   * List invitations for a client
   */
  listInvitations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientUserInvitationListApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const userId = req.user.id;
        // Extract filter parameters
        const listInvitationsRequest =
          createIApiRequest<IClientUserInvitationListApiRequest>(req);

        logger.info({
          message: 'Listing client user invitations',
          context: 'ClientUserInvitationController.listInvitations',
          clientId,
          filter: listInvitationsRequest.filters,
        });
        const result = await this.clientUserInvitationService.listInvitations(
          clientId,
          userId,
          listInvitationsRequest.filters,
          listInvitationsRequest.pagination
        );
        return result;
      }
    );
  };
}
