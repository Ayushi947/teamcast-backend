import { Request, Response, NextFunction } from 'express';
import { SupportInvitationService } from '@/services/support/invitation.service';
import {
  ISupportInvitationSendApiRequest,
  ISupportInvitationSendApiResponse,
  ISupportInvitationWithdrawApiResponse,
  ISupportInvitationResendApiResponse,
  ISupportInvitationAcceptApiResponse,
  ISupportInvitationListApiResponse,
  ISupportInvitationGetApiResponse,
  ISupportInvitationGetApiRequest,
  ISupportInvitationWithdrawApiRequest,
  ISupportInvitationResendApiRequest,
  ISupportInvitationAcceptApiRequest,
  ISupportInvitationListApiRequest,
  ISupportInvitationCopyApiRequest,
  ISupportInvitationCopyApiResponse,
  ISupportGenericInvitationExpireApiRequest,
  ISupportGenericInvitationExpireApiResponse,
} from '@/shared/models/api/support/invitation.api';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import { ENV } from '@/config/env';

export class SupportInvitationController extends BaseController {
  constructor(
    private readonly supportInvitationService: SupportInvitationService
  ) {
    super();
  }

  /**
   * Send an invitation to join the platform
   */
  sendInvitation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportInvitationSendApiResponse>(
      req,
      res,
      next,
      async () => {
        const userId = req.user.id;
        // Get the invitation data from the request body
        const invitationRequest =
          createIApiRequest<ISupportInvitationSendApiRequest>(req);

        return await this.supportInvitationService.sendInvitation(
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
    this.handleRequest<ISupportInvitationGetApiResponse>(
      req,
      res,
      next,
      async () => {
        // Get the invitation id from the request params
        const invitationGetRequest =
          createIApiRequest<ISupportInvitationGetApiRequest>(req);

        return await this.supportInvitationService.getInvitation(
          invitationGetRequest.params.supportInvitationId
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
    this.handleRequest<ISupportInvitationWithdrawApiResponse>(
      req,
      res,
      next,
      async () => {
        const userId = req.user.id;
        // Get the invitation id from the request params
        const invitationWithdrawRequest =
          createIApiRequest<ISupportInvitationWithdrawApiRequest>(req);

        return await this.supportInvitationService.withdrawInvitation(
          userId,
          invitationWithdrawRequest.params.supportInvitationId
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
    this.handleRequest<ISupportInvitationResendApiResponse>(
      req,
      res,
      next,
      async () => {
        const userId = req.user.id;
        // Get the invitation id from the request params
        const invitationResendRequest =
          createIApiRequest<ISupportInvitationResendApiRequest>(req);

        return await this.supportInvitationService.resendInvitation(
          userId,
          invitationResendRequest.params.supportInvitationId
        );
      }
    );
  };

  /**
   * Generic expire invitation method that automatically checks and expires all invitations that have actually expired
   */
  expireGenericInvitation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportGenericInvitationExpireApiResponse>(
      req,
      res,
      next,
      async () => {
        const userId = req.user.id;
        // Get the invitation type from the request params using the proper interface
        const invitationExpireRequest =
          createIApiRequest<ISupportGenericInvitationExpireApiRequest>(req);
        const { invitationType } = invitationExpireRequest.params;

        if (
          !invitationType ||
          !['support', 'job-posting'].includes(invitationType)
        ) {
          throw new Error(
            'Invalid invitation type. Must be "support" or "job-posting"'
          );
        }

        const result =
          await this.supportInvitationService.expireGenericInvitation(
            userId,
            invitationType as 'support' | 'job-posting'
          );

        return {
          success: true,
          message: 'Auto-expire operation completed',
          data: result,
        };
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
    this.handleRequest<ISupportInvitationAcceptApiResponse>(
      req,
      res,
      next,
      async () => {
        // Get the token from the request params
        const invitationAcceptRequest =
          createIApiRequest<ISupportInvitationAcceptApiRequest>(req);
        const token = invitationAcceptRequest.params.token;

        if (!token) {
          throw new Error('Token is required');
        }
        return await this.supportInvitationService.acceptInvitation(token);
      }
    );
  };

  /**
   * Generate a copied invitation token
   */
  generateCopiedInvitationToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportInvitationCopyApiResponse>(
      req,
      res,
      next,
      async () => {
        // Get the invitation id from the request params
        const invitationCopyRequest =
          createIApiRequest<ISupportInvitationCopyApiRequest>(req);

        const token =
          await this.supportInvitationService.generateCopiedInvitationToken(
            invitationCopyRequest.params.supportInvitationId
          );

        // Get the invitation to extract the type for the URL
        const invitation = await this.supportInvitationService.getInvitation(
          invitationCopyRequest.params.supportInvitationId
        );

        return {
          message: 'Copied invitation token generated successfully',
          token,
          invitationUrl: `${ENV.FRONTEND_URL}/app/support/invitation/accept/${token}?type=${invitation.type.toLowerCase()}`,
          expiresInMinutes: 30,
        };
      }
    );
  };

  /**
   * List invitations
   */
  listInvitations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportInvitationListApiResponse>(
      req,
      res,
      next,
      async () => {
        const userId = req.user.supportUserId;

        if (!userId) {
          throw new Error('Support user not found');
        }

        const request =
          createIApiRequest<ISupportInvitationListApiRequest>(req);

        const result = await this.supportInvitationService.listInvitations(
          userId,
          request.filters,
          request.pagination
        );
        return result;
      }
    );
  };

  /**
   * List all invitations (including accepted, excluding campaigns)
   */
  listAllInvitations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportInvitationListApiResponse>(
      req,
      res,
      next,
      async () => {
        const userId = req.user.supportUserId;

        if (!userId) {
          throw new Error('Support user not found');
        }

        const request =
          createIApiRequest<ISupportInvitationListApiRequest>(req);

        const result = await this.supportInvitationService.listAllInvitations(
          userId,
          request.filters,
          request.pagination
        );
        return result;
      }
    );
  };
}
