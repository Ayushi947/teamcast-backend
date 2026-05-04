import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../common/base.controller';
import { SupportPartnersService } from '@/services/support/partners.service';
import { createIApiRequest } from '@/utils/api.request';
import {
  ISupportPartnerUpdateApiRequest,
  ISupportPartnerUpdateApiResponse,
  ISupportPartnerGetApiRequest,
  ISupportPartnerGetApiResponse,
  ISupportPartnerDeleteApiRequest,
  ISupportPartnerDeleteApiResponse,
  ISupportPartnerListApiRequest,
  ISupportPartnerListApiResponse,
} from '@/shared/models/api/support/partners.api';
import { singleton } from '@/shared/decorators/singleton';

// Import existing partner services for reuse
import { PartnerJobPostingsService } from '@/services/partner/job.postings.service';
import { PartnerUserService } from '@/services/partner/user.service';
import { PartnerUserInvitationService } from '@/services/partner/user.invitation.service';
import { NotificationFactory } from '@/services/notification/notification.factory';
import {
  IPartnerJobPostingsGetApiRequest,
  IPartnerJobPostingsGetApiResponse,
} from '@/shared/models/api/partner/job.postings.api';
import {
  IPartnerUserListApiRequest,
  IPartnerUserListApiResponse,
} from '@/shared/models/api/partner/user.api';
import {
  IPartnerUserInvitationListApiRequest,
  IPartnerUserInvitationListApiResponse,
} from '@/shared/models/api/partner/user.invitation.api';

@singleton
export class SupportPartnersController extends BaseController {
  private readonly partnerJobPostingsService: PartnerJobPostingsService;
  private readonly partnerUserService: PartnerUserService;
  private readonly partnerUserInvitationService: PartnerUserInvitationService;

  constructor(private readonly supportPartnersService: SupportPartnersService) {
    super();

    // Initialize partner services for reuse
    this.partnerJobPostingsService = new PartnerJobPostingsService();

    const notificationProvider =
      new NotificationFactory().getNotificationProvider();

    this.partnerUserService = new PartnerUserService(notificationProvider);
    this.partnerUserInvitationService = new PartnerUserInvitationService();
  }

  /**
   * Update an existing partner
   */
  updateSupportPartner = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportPartnerUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const request = createIApiRequest<ISupportPartnerUpdateApiRequest>(req);
        const adminUserId = req.user?.id;
        return await this.supportPartnersService.updateSupportPartner(
          adminUserId,
          request.params.supportPartnerId,
          request.data
        );
      }
    );
  };

  /**
   * Get a partner by ID
   */
  getSupportPartner = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportPartnerGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const request = createIApiRequest<ISupportPartnerGetApiRequest>(req);
        return await this.supportPartnersService.getSupportPartner(
          request.params.supportPartnerId
        );
      }
    );
  };

  /**
   * Delete a partner
   */
  deleteSupportPartner = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportPartnerDeleteApiResponse>(
      req,
      res,
      next,
      async () => {
        const request = createIApiRequest<ISupportPartnerDeleteApiRequest>(req);
        await this.supportPartnersService.deleteSupportPartner(
          request.params.supportPartnerId
        );
        return { message: 'Partner deleted successfully' };
      }
    );
  };

  /**
   * List all partners
   */
  listSupportPartners = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportPartnerListApiResponse>(
      req,
      res,
      next,
      async () => {
        const request = createIApiRequest<ISupportPartnerListApiRequest>(req);
        return await this.supportPartnersService.listSupportPartners(
          request.filters,
          request.pagination
        );
      }
    );
  };

  // New methods for additional tabs

  listSupportPartnerJobPostings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerJobPostingsGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.params.supportPartnerId as string;
        const request =
          createIApiRequest<IPartnerJobPostingsGetApiRequest>(req);
        return await this.partnerJobPostingsService.getActiveJobPostings(
          partnerId,
          request.filters,
          request.pagination
        );
      }
    );
  };

  listSupportPartnerUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerUserListApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.params.supportPartnerId as string;
        // Add partnerId to query parameters since the validator expects it
        req.query.partnerId = partnerId;
        const request = createIApiRequest<IPartnerUserListApiRequest>(req);
        return await this.partnerUserService.listPartnerUsers(
          partnerId,
          request.filters,
          request.pagination
        );
      }
    );
  };

  listSupportPartnerInvitations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerUserInvitationListApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.params.supportPartnerId as string;
        const request =
          createIApiRequest<IPartnerUserInvitationListApiRequest>(req);
        return await this.partnerUserInvitationService.listInvitations(
          partnerId,
          req.user.id,
          request.filters,
          request.pagination
        );
      }
    );
  };
}
