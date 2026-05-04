import { singleton } from '@/shared/decorators/singleton';
import { PrismaClient } from '@prisma/client';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';
import {
  IClientIntegration,
  IClientIntegrationCreate,
  IClientIntegrationUpdate,
  IClientIntegrationFilterQuery,
  IIntegrationProvider,
  IIntegrationSyncTask,
  IIntegrationWebhook,
  IIntegrationAuditLog,
  toIClientIntegration,
  toIIntegrationProvider,
  toIIntegrationSyncTask,
  toIIntegrationWebhook,
  toIIntegrationAuditLog,
} from '@/shared/models/domain/client/integration.domain';
import { IntegrationStatus } from '@/shared/models/common/enums';
import {
  IPaginatedResponse,
  IPaginationRequest,
} from '@/shared/models/api/common/common.api';
import {
  buildQueryConditions,
  ISearchConfig,
  IFilterConfig,
  ISortConfig,
} from '@/utils/pagination';
import { IntegrationsFactory } from '@/services/helpers/integration/integration.factory';

@singleton
export class ClientIntegrationService {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  private readonly searchConfig: ISearchConfig = {
    searchableFields: ['name', 'description'],
  };

  private readonly filterConfig: IFilterConfig = {
    allowedFields: ['name', 'status', 'providerId'],
    arrayFields: [],
    enumFields: ['status'],
    enumRelationFields: {},
  };

  private readonly sortConfig: ISortConfig = {
    allowedFields: [
      'name',
      'status',
      'autoSyncEnabled',
      'lastSyncAt',
      'createdAt',
      'updatedAt',
    ],
    defaultSort: { field: 'createdAt', order: 'desc' },
  };

  /**
   * Get list of available integration providers
   */
  async getIntegrationProviders(
    paginationRequest: IPaginationRequest
  ): Promise<IPaginatedResponse<IIntegrationProvider>> {
    try {
      const queryConditions = buildQueryConditions({}, paginationRequest, {
        search: this.searchConfig,
        filter: this.filterConfig,
        sort: this.sortConfig,
      });

      const total = await this.prisma.integration_provider.count({
        where: {
          isActive: true,
          ...queryConditions.where,
        },
      });

      const providers = await this.prisma.integration_provider.findMany({
        where: {
          isActive: true,
          ...queryConditions.where,
        },
        skip: queryConditions.skip,
        take: queryConditions.take,
        orderBy: queryConditions.orderBy,
      });

      return {
        items: providers.map(toIIntegrationProvider),
        pagination: {
          total,
          page: queryConditions.pagination.page,
          limit: queryConditions.pagination.limit,
          totalPages: Math.ceil(total / queryConditions.pagination.limit),
        },
      };
    } catch (error) {
      logger.error({
        message: 'Failed to get integration providers',
        context: 'ClientIntegrationService.getIntegrationProviders',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get a specific integration provider
   */
  async getIntegrationProvider(
    providerId: string
  ): Promise<IIntegrationProvider> {
    try {
      const provider = await this.prisma.integration_provider.findFirst({
        where: {
          id: providerId,
          isActive: true,
        },
      });

      if (!provider) {
        throw new AppError(
          'Integration provider not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      return toIIntegrationProvider(provider);
    } catch (error) {
      logger.error({
        message: 'Failed to get integration provider',
        context: 'ClientIntegrationService.getIntegrationProvider',
        error: error instanceof Error ? error.message : 'Unknown error',
        providerId,
      });
      throw error;
    }
  }

  /**
   * Create a new client integration
   */
  async createClientIntegration(
    clientId: string,
    integrationData: IClientIntegrationCreate
  ): Promise<IClientIntegration> {
    try {
      // Check if provider exists and is active
      const provider = await this.prisma.integration_provider.findFirst({
        where: {
          id: integrationData.providerId,
          isActive: true,
        },
      });

      if (!provider) {
        throw new AppError(
          'Integration provider not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Check if integration already exists for this client and provider
      const existingIntegration =
        await this.prisma.client_integration.findUnique({
          where: {
            clientId_providerId: {
              clientId,
              providerId: integrationData.providerId,
            },
          },
        });

      if (existingIntegration) {
        throw new AppError(
          'Integration already exists for this provider',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      const integration = await this.prisma.client_integration.create({
        data: {
          clientId,
          providerId: integrationData.providerId,
          name: integrationData.name,
          description: integrationData.description,
          credentials: integrationData.credentials,
          config: integrationData.config,
          autoSyncEnabled: integrationData.autoSyncEnabled || false,
          syncInterval: integrationData.syncInterval,
          status: IntegrationStatus.INACTIVE,
        },
      });

      return toIClientIntegration(integration);
    } catch (error) {
      logger.error({
        message: 'Failed to create client integration',
        context: 'ClientIntegrationService.createClientIntegration',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        integrationData: {
          providerId: integrationData.providerId,
          name: integrationData.name,
        },
      });
      throw error;
    }
  }

  /**
   * Get a specific client integration
   */
  async getClientIntegration(
    clientId: string,
    integrationId: string
  ): Promise<IClientIntegration> {
    try {
      const integration = await this.prisma.client_integration.findFirst({
        where: {
          id: integrationId,
          clientId,
        },
        include: {
          provider: true,
        },
      });

      if (!integration) {
        throw new AppError(
          'Client integration not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      return toIClientIntegration(integration);
    } catch (error) {
      logger.error({
        message: 'Failed to get client integration',
        context: 'ClientIntegrationService.getClientIntegration',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        integrationId,
      });
      throw error;
    }
  }

  /**
   * Update a client integration
   */
  async updateClientIntegration(
    clientId: string,
    integrationId: string,
    updateData: IClientIntegrationUpdate
  ): Promise<IClientIntegration> {
    try {
      // Verify the integration belongs to the client
      const existingIntegration =
        await this.prisma.client_integration.findFirst({
          where: {
            id: integrationId,
            clientId,
          },
        });

      if (!existingIntegration) {
        throw new AppError(
          'Client integration not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      const integration = await this.prisma.client_integration.update({
        where: { id: integrationId },
        data: {
          name: updateData.name,
          description: updateData.description,
          status: updateData.status,
          credentials: updateData.credentials,
          config: updateData.config,
          autoSyncEnabled: updateData.autoSyncEnabled,
          syncInterval: updateData.syncInterval,
        },
      });

      return toIClientIntegration(integration);
    } catch (error) {
      logger.error({
        message: 'Failed to update client integration',
        context: 'ClientIntegrationService.updateClientIntegration',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        integrationId,
        updateData,
      });
      throw error;
    }
  }

  /**
   * Delete a client integration
   */
  async deleteClientIntegration(
    clientId: string,
    integrationId: string
  ): Promise<boolean> {
    try {
      // Verify the integration belongs to the client
      const existingIntegration =
        await this.prisma.client_integration.findFirst({
          where: {
            id: integrationId,
            clientId,
          },
        });

      if (!existingIntegration) {
        throw new AppError(
          'Client integration not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      await this.prisma.client_integration.delete({
        where: { id: integrationId },
      });

      return true;
    } catch (error) {
      logger.error({
        message: 'Failed to delete client integration',
        context: 'ClientIntegrationService.deleteClientIntegration',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        integrationId,
      });
      throw error;
    }
  }

  /**
   * List all client integrations with optional filtering
   */
  async listClientIntegrations(
    clientId: string,
    filter: IClientIntegrationFilterQuery,
    paginationRequest: IPaginationRequest
  ): Promise<IPaginatedResponse<IClientIntegration>> {
    try {
      const queryConditions = buildQueryConditions(filter, paginationRequest, {
        search: this.searchConfig,
        filter: this.filterConfig,
        sort: this.sortConfig,
      });

      const baseWhere = {
        clientId,
      };

      const total = await this.prisma.client_integration.count({
        where: {
          ...baseWhere,
          ...queryConditions.where,
        },
      });

      const integrations = await this.prisma.client_integration.findMany({
        where: {
          ...baseWhere,
          ...queryConditions.where,
        },
        include: {
          provider: true,
        },
        skip: queryConditions.skip,
        take: queryConditions.take,
        orderBy: queryConditions.orderBy,
      });

      return {
        items: integrations.map(toIClientIntegration),
        pagination: {
          total,
          page: queryConditions.pagination.page,
          limit: queryConditions.pagination.limit,
          totalPages: Math.ceil(total / queryConditions.pagination.limit),
        },
      };
    } catch (error) {
      logger.error({
        message: 'Failed to list client integrations',
        context: 'ClientIntegrationService.listClientIntegrations',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        filter,
        paginationRequest,
      });
      throw error;
    }
  }

  /**
   * Get sync tasks for a client integration
   */
  async getIntegrationSyncTasks(
    clientId: string,
    integrationId: string,
    paginationRequest: IPaginationRequest
  ): Promise<IPaginatedResponse<IIntegrationSyncTask>> {
    try {
      // Verify the integration belongs to the client
      const integration = await this.prisma.client_integration.findFirst({
        where: {
          id: integrationId,
          clientId,
        },
      });

      if (!integration) {
        throw new AppError(
          'Client integration not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      const total = await this.prisma.integration_sync_task.count({
        where: {
          clientIntegrationId: integrationId,
        },
      });

      const page = paginationRequest.page || 1;
      const limit = paginationRequest.limit || 10;

      const tasks = await this.prisma.integration_sync_task.findMany({
        where: {
          clientIntegrationId: integrationId,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        items: tasks.map(toIIntegrationSyncTask),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error({
        message: 'Failed to get integration sync tasks',
        context: 'ClientIntegrationService.getIntegrationSyncTasks',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        integrationId,
      });
      throw error;
    }
  }

  /**
   * Get webhooks for a client integration
   */
  async getIntegrationWebhooks(
    clientId: string,
    integrationId: string,
    paginationRequest: IPaginationRequest
  ): Promise<IPaginatedResponse<IIntegrationWebhook>> {
    try {
      // Verify the integration belongs to the client
      const integration = await this.prisma.client_integration.findFirst({
        where: {
          id: integrationId,
          clientId,
        },
      });

      if (!integration) {
        throw new AppError(
          'Client integration not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      const total = await this.prisma.integration_webhook.count({
        where: {
          clientIntegrationId: integrationId,
        },
      });

      const page = paginationRequest.page || 1;
      const limit = paginationRequest.limit || 10;

      const webhooks = await this.prisma.integration_webhook.findMany({
        where: {
          clientIntegrationId: integrationId,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        items: webhooks.map(toIIntegrationWebhook),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error({
        message: 'Failed to get integration webhooks',
        context: 'ClientIntegrationService.getIntegrationWebhooks',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        integrationId,
      });
      throw error;
    }
  }

  /**
   * Get audit logs for a client integration
   */
  async getIntegrationAuditLogs(
    clientId: string,
    integrationId: string,
    paginationRequest: IPaginationRequest
  ): Promise<IPaginatedResponse<IIntegrationAuditLog>> {
    try {
      // Verify the integration belongs to the client
      const integration = await this.prisma.client_integration.findFirst({
        where: {
          id: integrationId,
          clientId,
        },
      });

      if (!integration) {
        throw new AppError(
          'Client integration not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      const total = await this.prisma.integration_audit_log.count({
        where: {
          clientIntegrationId: integrationId,
        },
      });

      const page = paginationRequest.page || 1;
      const limit = paginationRequest.limit || 10;

      const auditLogs = await this.prisma.integration_audit_log.findMany({
        where: {
          clientIntegrationId: integrationId,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        items: auditLogs.map(toIIntegrationAuditLog),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error({
        message: 'Failed to get integration audit logs',
        context: 'ClientIntegrationService.getIntegrationAuditLogs',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        integrationId,
      });
      throw error;
    }
  }

  /**
   * Test connection for a client integration
   */
  async testIntegrationConnection(
    clientId: string,
    integrationId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Verify the integration belongs to the client
      const integration = await this.prisma.client_integration.findFirst({
        where: {
          id: integrationId,
          clientId,
        },
        include: {
          provider: true,
        },
      });

      if (!integration) {
        throw new AppError(
          'Client integration not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Get the integration provider
      const integrationsFactory = IntegrationsFactory.getInstance();
      const provider = integrationsFactory.getProvider(
        integration.provider.name
      );

      // Test the connection using the provider's credentials
      const connectionResult = await provider.testConnection(
        (integration.credentials as Record<string, any>) || {}
      );

      // Update the integration status based on the test result
      const newStatus = connectionResult
        ? IntegrationStatus.ACTIVE
        : IntegrationStatus.ERROR;
      const lastError = connectionResult ? null : 'Connection test failed';

      await this.prisma.client_integration.update({
        where: { id: integrationId },
        data: {
          status: newStatus,
          lastError,
          lastErrorAt: connectionResult ? null : new Date(),
          errorCount: connectionResult ? 0 : integration.errorCount + 1,
        },
      });

      return {
        success: connectionResult,
        message: connectionResult
          ? 'Connection test successful'
          : 'Connection test failed',
      };
    } catch (error) {
      logger.error({
        message: 'Failed to test integration connection',
        context: 'ClientIntegrationService.testIntegrationConnection',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        integrationId,
      });

      // Update integration status to error
      await this.prisma.client_integration.update({
        where: { id: integrationId },
        data: {
          status: IntegrationStatus.ERROR,
          lastError: error instanceof Error ? error.message : 'Unknown error',
          lastErrorAt: new Date(),
          errorCount: 1,
        },
      });

      throw error;
    }
  }
}
