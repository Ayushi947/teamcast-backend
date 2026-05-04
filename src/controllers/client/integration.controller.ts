import { Request, Response, NextFunction } from 'express';
import { ClientIntegrationService } from '@/services/client/integration.service';
import { logger } from '@/shared/utils/logger';
import {
  IClientIntegrationCreateApiRequest,
  IClientIntegrationCreateApiResponse,
  IClientIntegrationGetApiRequest,
  IClientIntegrationGetApiResponse,
  IClientIntegrationUpdateApiRequest,
  IClientIntegrationUpdateApiResponse,
  IClientIntegrationDeleteApiRequest,
  IClientIntegrationDeleteApiResponse,
  IClientIntegrationListApiRequest,
  IClientIntegrationListApiResponse,
  IClientIntegrationTestConnectionApiRequest,
  IClientIntegrationTestConnectionApiResponse,
  IIntegrationProviderListApiRequest,
  IIntegrationProviderListApiResponse,
  IIntegrationProviderGetApiRequest,
  IIntegrationProviderGetApiResponse,
  IIntegrationSyncTaskListApiRequest,
  IIntegrationSyncTaskListApiResponse,
  IIntegrationWebhookListApiRequest,
  IIntegrationWebhookListApiResponse,
  IIntegrationAuditLogListApiRequest,
  IIntegrationAuditLogListApiResponse,
} from '@/shared/models/api/client/integration.api';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';

export class ClientIntegrationController extends BaseController {
  constructor(
    private readonly clientIntegrationService: ClientIntegrationService
  ) {
    super();
  }

  /**
   * Get list of available integration providers
   */
  getIntegrationProviders = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IIntegrationProviderListApiResponse>(
      req,
      res,
      next,
      async () => {
        const providerListRequest =
          createIApiRequest<IIntegrationProviderListApiRequest>(req);

        logger.info({
          message: 'Getting integration providers',
          context: 'ClientIntegrationController.getIntegrationProviders',
          pagination: providerListRequest.pagination,
        });

        return await this.clientIntegrationService.getIntegrationProviders(
          providerListRequest.pagination
        );
      }
    );
  };

  /**
   * Get a specific integration provider
   */
  getIntegrationProvider = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IIntegrationProviderGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const providerGetRequest =
          createIApiRequest<IIntegrationProviderGetApiRequest>(req);

        logger.info({
          message: 'Getting integration provider',
          context: 'ClientIntegrationController.getIntegrationProvider',
          providerId: providerGetRequest.params.integrationId,
        });

        return await this.clientIntegrationService.getIntegrationProvider(
          providerGetRequest.params.integrationId
        );
      }
    );
  };

  /**
   * Create a new client integration
   */
  createClientIntegration = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientIntegrationCreateApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const integrationCreateRequest =
          createIApiRequest<IClientIntegrationCreateApiRequest>(req);

        logger.info({
          message: 'Creating client integration',
          context: 'ClientIntegrationController.createClientIntegration',
          clientId,
          integrationData: {
            providerId: integrationCreateRequest.data.providerId,
            name: integrationCreateRequest.data.name,
          },
        });

        return await this.clientIntegrationService.createClientIntegration(
          clientId,
          integrationCreateRequest.data
        );
      }
    );
  };

  /**
   * Get a specific client integration
   */
  getClientIntegration = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientIntegrationGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const integrationGetRequest =
          createIApiRequest<IClientIntegrationGetApiRequest>(req);

        logger.info({
          message: 'Getting client integration',
          context: 'ClientIntegrationController.getClientIntegration',
          clientId,
          integrationId: integrationGetRequest.params.clientIntegrationId,
        });

        return await this.clientIntegrationService.getClientIntegration(
          clientId,
          integrationGetRequest.params.clientIntegrationId
        );
      }
    );
  };

  /**
   * Update a client integration
   */
  updateClientIntegration = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientIntegrationUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const integrationUpdateRequest =
          createIApiRequest<IClientIntegrationUpdateApiRequest>(req);

        logger.info({
          message: 'Updating client integration',
          context: 'ClientIntegrationController.updateClientIntegration',
          clientId,
          integrationId: integrationUpdateRequest.params.clientIntegrationId,
          updateData: integrationUpdateRequest.data,
        });

        return await this.clientIntegrationService.updateClientIntegration(
          clientId,
          integrationUpdateRequest.params.clientIntegrationId,
          integrationUpdateRequest.data
        );
      }
    );
  };

  /**
   * Delete a client integration
   */
  deleteClientIntegration = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientIntegrationDeleteApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const integrationDeleteRequest =
          createIApiRequest<IClientIntegrationDeleteApiRequest>(req);

        logger.info({
          message: 'Deleting client integration',
          context: 'ClientIntegrationController.deleteClientIntegration',
          clientId,
          integrationId: integrationDeleteRequest.params.clientIntegrationId,
        });

        return await this.clientIntegrationService.deleteClientIntegration(
          clientId,
          integrationDeleteRequest.params.clientIntegrationId
        );
      }
    );
  };

  /**
   * List all client integrations
   */
  listClientIntegrations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientIntegrationListApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const integrationListRequest =
          createIApiRequest<IClientIntegrationListApiRequest>(req);

        logger.info({
          message: 'Listing client integrations',
          context: 'ClientIntegrationController.listClientIntegrations',
          clientId,
          filter: integrationListRequest.filters,
          pagination: integrationListRequest.pagination,
        });

        return await this.clientIntegrationService.listClientIntegrations(
          clientId,
          integrationListRequest.filters,
          integrationListRequest.pagination
        );
      }
    );
  };

  /**
   * Get sync tasks for a client integration
   */
  getIntegrationSyncTasks = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IIntegrationSyncTaskListApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const syncTaskListRequest =
          createIApiRequest<IIntegrationSyncTaskListApiRequest>(req);

        logger.info({
          message: 'Getting integration sync tasks',
          context: 'ClientIntegrationController.getIntegrationSyncTasks',
          clientId,
          integrationId: syncTaskListRequest.params.clientIntegrationId,
          pagination: syncTaskListRequest.pagination,
        });

        return await this.clientIntegrationService.getIntegrationSyncTasks(
          clientId,
          syncTaskListRequest.params.clientIntegrationId,
          syncTaskListRequest.pagination
        );
      }
    );
  };

  /**
   * Get webhooks for a client integration
   */
  getIntegrationWebhooks = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IIntegrationWebhookListApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const webhookListRequest =
          createIApiRequest<IIntegrationWebhookListApiRequest>(req);

        logger.info({
          message: 'Getting integration webhooks',
          context: 'ClientIntegrationController.getIntegrationWebhooks',
          clientId,
          integrationId: webhookListRequest.params.clientIntegrationId,
          pagination: webhookListRequest.pagination,
        });

        return await this.clientIntegrationService.getIntegrationWebhooks(
          clientId,
          webhookListRequest.params.clientIntegrationId,
          webhookListRequest.pagination
        );
      }
    );
  };

  /**
   * Test connection for a client integration
   */
  testIntegrationConnection = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientIntegrationTestConnectionApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const testConnectionRequest =
          createIApiRequest<IClientIntegrationTestConnectionApiRequest>(req);

        logger.info({
          message: 'Testing integration connection',
          context: 'ClientIntegrationController.testIntegrationConnection',
          clientId,
          integrationId: testConnectionRequest.params.clientIntegrationId,
        });

        return await this.clientIntegrationService.testIntegrationConnection(
          clientId,
          testConnectionRequest.params.clientIntegrationId
        );
      }
    );
  };

  /**
   * Get audit logs for a client integration
   */
  getIntegrationAuditLogs = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IIntegrationAuditLogListApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const auditLogListRequest =
          createIApiRequest<IIntegrationAuditLogListApiRequest>(req);

        logger.info({
          message: 'Getting integration audit logs',
          context: 'ClientIntegrationController.getIntegrationAuditLogs',
          clientId,
          integrationId: auditLogListRequest.params.clientIntegrationId,
          pagination: auditLogListRequest.pagination,
        });

        return await this.clientIntegrationService.getIntegrationAuditLogs(
          clientId,
          auditLogListRequest.params.clientIntegrationId,
          auditLogListRequest.pagination
        );
      }
    );
  };
}
