import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../common/base.controller';
import { SupportClientService } from '@/services/support/client.service';
import { createIApiRequest } from '@/utils/api.request';
import {
  ISupportClientUpdateApiRequest,
  ISupportClientUpdateApiResponse,
  ISupportClientGetApiRequest,
  ISupportClientGetApiResponse,
  ISupportClientDeleteApiRequest,
  ISupportClientDeleteApiResponse,
  ISupportClientListApiRequest,
  ISupportClientListApiResponse,
  ISupportClientVerifyApiRequest,
  ISupportClientVerifyApiResponse,
  ISupportClientJobPostingByIdApiResponse,
  ISupportClientJobPostingByIdApiRequest,
  ISupportClientGenerateMcpKeyApiRequest,
  ISupportClientGenerateMcpKeyApiResponse,
} from '@/shared/models/api/support/client.api';
import { singleton } from '@/shared/decorators/singleton';
// Import existing client services for reuse
import { ClientJobPostingService } from '@/services/client/job.posting.service';
import { ClientUserService } from '@/services/client/user.service';
import { ClientUserInvitationService } from '@/services/client/user.invitation.service';
import { ClientSubscriptionService } from '@/services/client/subscription.service';
import { PaymentFactory } from '@/services/subscription/payment.factory';
import { ClientUserProfileService } from '@/services/client/user.profile.service';
import { StorageFactory } from '@/services/helpers/storage/storage.factory';
import { NodemailerProvider } from '@/services/notification/nodemailer.service';
import {
  IClientJobPostingListApiRequest,
  IClientJobPostingListApiResponse,
} from '@/shared/models/api/client/job.posting.api';
import {
  IClientUserListApiRequest,
  IClientUserListApiResponse,
} from '@/shared/models/api/client/user.api';
import {
  IClientUserInvitationListApiRequest,
  IClientUserInvitationListApiResponse,
} from '@/shared/models/api/client/user.invitation.api';
import { AppError } from '@/utils/app.error';

@singleton
export class SupportClientController extends BaseController {
  private readonly clientJobPostingService: ClientJobPostingService;
  private readonly clientUserService: ClientUserService;
  private readonly clientUserInvitationService: ClientUserInvitationService;

  constructor(private readonly supportClientService: SupportClientService) {
    super();

    // Initialize client services for reuse
    const notificationProvider = new NodemailerProvider();
    const paymentFactory = new PaymentFactory();
    const storageService = StorageFactory.getInstance().getProvider();

    this.clientJobPostingService = new ClientJobPostingService();

    const clientSubscriptionService = new ClientSubscriptionService(
      paymentFactory,
      notificationProvider
    );
    const clientUserProfileService = new ClientUserProfileService(
      storageService
    );
    const clientUserInvitationService = new ClientUserInvitationService(
      notificationProvider,
      clientSubscriptionService,
      clientUserProfileService
    );

    this.clientUserService = new ClientUserService(
      clientUserInvitationService,
      clientSubscriptionService
    );
    this.clientUserInvitationService = clientUserInvitationService;
  }

  /**
   * Update an existing client
   */
  updateSupportClient = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportClientUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const updateRequest =
          createIApiRequest<ISupportClientUpdateApiRequest>(req);
        const supportClientId = updateRequest.params.supportClientId;

        // Call service method with domain model
        return await this.supportClientService.updateSupportClient(
          supportClientId,
          updateRequest.data
        );
      }
    );
  };

  /**
   * Get a client by ID
   */
  getSupportClient = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportClientGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const getRequest = createIApiRequest<ISupportClientGetApiRequest>(req);
        return await this.supportClientService.getSupportClient(
          getRequest.params.supportClientId
        );
      }
    );
  };

  /**
   * Delete a client
   */
  deleteSupportClient = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportClientDeleteApiResponse>(
      req,
      res,
      next,
      async () => {
        // Get the client ID from the request parameters
        const deleteRequest =
          createIApiRequest<ISupportClientDeleteApiRequest>(req);
        await this.supportClientService.deleteSupportClient(
          deleteRequest.params.supportClientId
        );
        return true;
      }
    );
  };

  /**
   * List all clients with optional filtering
   */
  listSupportClients = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportClientListApiResponse>(
      req,
      res,
      next,
      async () => {
        const request = createIApiRequest<ISupportClientListApiRequest>(req);
        return await this.supportClientService.listSupportClients(
          request.filters,
          request.pagination
        );
      }
    );
  };

  // New methods for additional tabs

  listSupportClientJobPostings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientJobPostingListApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.params.supportClientId as string;
        const request = createIApiRequest<IClientJobPostingListApiRequest>(req);
        return await this.clientJobPostingService.listJobPostings(
          clientId,
          request.filters,
          request.pagination
        );
      }
    );
  };

  getSupportClientJobPostingById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportClientJobPostingByIdApiResponse>(
      req,
      res,
      next,
      async () => {
        const request =
          createIApiRequest<ISupportClientJobPostingByIdApiRequest>(req);
        return await this.supportClientService.getSupportClientJobPostingById(
          request.params.jobPostingId
        );
      }
    );
  };

  listSupportClientUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientUserListApiResponse>(req, res, next, async () => {
      const clientId = req.params.supportClientId as string;
      const request = createIApiRequest<IClientUserListApiRequest>(req);
      return await this.clientUserService.listClientUsers(
        clientId,
        request.filters,
        request.pagination
      );
    });
  };

  listSupportClientInvitations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientUserInvitationListApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.params.supportClientId as string;
        const request =
          createIApiRequest<IClientUserInvitationListApiRequest>(req);
        return await this.clientUserInvitationService.listInvitations(
          clientId,
          req.user.id,
          request.filters,
          request.pagination
        );
      }
    );
  };

  /**
   * Verify a client
   */
  verifyClient = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportClientVerifyApiResponse>(
      req,
      res,
      next,
      async () => {
        const adminUserId = req.user.id;
        const verifyRequest =
          createIApiRequest<ISupportClientVerifyApiRequest>(req);
        const clientId = verifyRequest.params.supportClientId;

        return await this.supportClientService.verifyClient(
          clientId,
          adminUserId,
          verifyRequest.data.remarks
        );
      }
    );
  };

  getClientsByAccountManagerId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportClientListApiResponse>(
      req,
      res,
      next,
      async () => {
        const request = createIApiRequest<ISupportClientListApiRequest>(req);
        const accountManagerId = req.user.supportUserId;

        if (!accountManagerId) {
          throw new AppError('Account manager not found', 404);
        }

        return await this.supportClientService.getClientsByAccountManagerId(
          accountManagerId,
          request.pagination,
          request.filters
        );
      }
    );
  };

  /**
   * Get integration provider details by ID
   */
  getIntegrationProviderDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<any>(req, res, next, async () => {
      const integrationProviderId = req.params.integrationProviderId as string;

      if (!integrationProviderId) {
        throw new AppError('Integration provider ID is required', 400);
      }

      return await this.supportClientService.getIntegrationProviderDetails(
        integrationProviderId
      );
    });
  };

  /**
   * Get client integrations by client ID
   */
  getClientIntegrations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<any>(req, res, next, async () => {
      const clientId = req.params.supportClientId as string;

      if (!clientId) {
        throw new AppError('Client ID is required', 400);
      }

      return await this.supportClientService.getClientIntegrations(clientId);
    });
  };

  /**
   * Generate/rotate the primary MCP API key for a client (support-managed)
   */
  generateMcpKeyForClient = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportClientGenerateMcpKeyApiResponse>(
      req,
      res,
      next,
      async () => {
        const request =
          createIApiRequest<ISupportClientGenerateMcpKeyApiRequest>(req);
        const clientId = request.params.supportClientId;
        const supportUserId = req.user.id;

        return await this.supportClientService.generateOrRotateClientMcpKey(
          clientId,
          supportUserId
        );
      }
    );
  };
}
