import { PrismaClient } from '@prisma/client';
import { randomBytes, createHash } from 'crypto';
import { logger } from '@/shared/utils/logger';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { MCP_SCOPES, McpScope } from '@/mcp/config/mcp.config';
import type {
  IMcpClient,
  IMcpClientCreate,
  IMcpClientUpdate,
  IMcpClientWithApiKey,
} from '@/shared/models/domain/client/mcp.client.domain';

// Re-export domain types for backward compatibility
export type {
  IMcpClient,
  IMcpClientCreate,
  IMcpClientUpdate,
  IMcpClientWithApiKey,
};

const prisma = new PrismaClient();

/**
 * MCP Client Management Service
 * Handles CRUD operations for MCP clients (external AI agents)
 */
export class McpClientService {
  /**
   * Generate a secure API key
   */
  private generateApiKey(): string {
    const prefix = 'mcp_';
    const key = randomBytes(32).toString('hex');
    return `${prefix}${key}`;
  }

  /**
   * Hash an API key for storage verification
   */
  private hashApiKey(apiKey: string): string {
    return createHash('sha256').update(apiKey).digest('hex');
  }

  /**
   * Create a new MCP client
   */
  async createMcpClient(
    clientId: string,
    input: IMcpClientCreate,
    createdById?: string
  ): Promise<IMcpClientWithApiKey> {
    logger.info('Creating MCP client', {
      context: 'McpClientService.createMcpClient',
      clientId,
      name: input.name,
    });

    // Verify the client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new AppError('Client not found', 404, ErrorCode.NOT_FOUND);
    }

    // Validate scopes
    const validScopes = Object.values(MCP_SCOPES);
    const invalidScopes = input.scopes.filter(
      (scope) => !validScopes.includes(scope as McpScope)
    );

    if (invalidScopes.length > 0) {
      throw new AppError(
        `Invalid scopes: ${invalidScopes.join(', ')}`,
        400,
        ErrorCode.INVALID_REQUEST
      );
    }

    // Generate API key
    const apiKey = this.generateApiKey();
    const apiKeyHash = this.hashApiKey(apiKey);

    // Create the MCP client
    const mcpClient = await prisma.mcp_client.create({
      data: {
        clientId,
        name: input.name,
        description: input.description,
        apiKey,
        apiKeyHash,
        scopes: input.scopes,
        sourceSystem: input.sourceSystem,
        contactEmail: input.contactEmail,
        rateLimitPerMinute: input.rateLimitPerMinute || 100,
        rateLimitPerHour: input.rateLimitPerHour || 1000,
        metadata: input.metadata as object,
        createdById,
      },
    });

    logger.info('MCP client created', {
      context: 'McpClientService.createMcpClient',
      mcpClientId: mcpClient.id,
      name: mcpClient.name,
    });

    return {
      id: mcpClient.id,
      clientId: mcpClient.clientId,
      name: mcpClient.name,
      description: mcpClient.description,
      scopes: mcpClient.scopes,
      isActive: mcpClient.isActive,
      sourceSystem: mcpClient.sourceSystem,
      contactEmail: mcpClient.contactEmail,
      rateLimitPerMinute: mcpClient.rateLimitPerMinute,
      rateLimitPerHour: mcpClient.rateLimitPerHour,
      lastUsedAt: mcpClient.lastUsedAt,
      requestCount: mcpClient.requestCount,
      errorCount: mcpClient.errorCount,
      webhookUrl: mcpClient.webhookUrl,
      webhookEnabled: mcpClient.webhookEnabled,
      createdAt: mcpClient.createdAt,
      updatedAt: mcpClient.updatedAt,
      apiKey, // Only returned on creation
    };
  }

  /**
   * Get all MCP clients for a tenant
   */
  async getMcpClients(clientId: string): Promise<IMcpClient[]> {
    const mcpClients = await prisma.mcp_client.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    });

    return mcpClients.map((client) => ({
      id: client.id,
      clientId: client.clientId,
      name: client.name,
      description: client.description,
      scopes: client.scopes,
      isActive: client.isActive,
      sourceSystem: client.sourceSystem,
      contactEmail: client.contactEmail,
      rateLimitPerMinute: client.rateLimitPerMinute,
      rateLimitPerHour: client.rateLimitPerHour,
      lastUsedAt: client.lastUsedAt,
      requestCount: client.requestCount,
      errorCount: client.errorCount,
      webhookUrl: client.webhookUrl,
      webhookEnabled: client.webhookEnabled,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    }));
  }

  /**
   * Get a specific MCP client
   */
  async getMcpClient(
    clientId: string,
    mcpClientId: string
  ): Promise<IMcpClient> {
    const mcpClient = await prisma.mcp_client.findFirst({
      where: {
        id: mcpClientId,
        clientId,
      },
    });

    if (!mcpClient) {
      throw new AppError('MCP client not found', 404, ErrorCode.NOT_FOUND);
    }

    return {
      id: mcpClient.id,
      clientId: mcpClient.clientId,
      name: mcpClient.name,
      description: mcpClient.description,
      scopes: mcpClient.scopes,
      isActive: mcpClient.isActive,
      sourceSystem: mcpClient.sourceSystem,
      contactEmail: mcpClient.contactEmail,
      rateLimitPerMinute: mcpClient.rateLimitPerMinute,
      rateLimitPerHour: mcpClient.rateLimitPerHour,
      lastUsedAt: mcpClient.lastUsedAt,
      requestCount: mcpClient.requestCount,
      errorCount: mcpClient.errorCount,
      webhookUrl: mcpClient.webhookUrl,
      webhookEnabled: mcpClient.webhookEnabled,
      createdAt: mcpClient.createdAt,
      updatedAt: mcpClient.updatedAt,
    };
  }

  /**
   * Update an MCP client
   */
  async updateMcpClient(
    clientId: string,
    mcpClientId: string,
    input: IMcpClientUpdate
  ): Promise<IMcpClient> {
    // Verify the MCP client exists and belongs to this tenant
    const existing = await prisma.mcp_client.findFirst({
      where: {
        id: mcpClientId,
        clientId,
      },
    });

    if (!existing) {
      throw new AppError('MCP client not found', 404, ErrorCode.NOT_FOUND);
    }

    // Validate scopes if provided
    if (input.scopes) {
      const validScopes = Object.values(MCP_SCOPES);
      const invalidScopes = input.scopes.filter(
        (scope) => !validScopes.includes(scope as McpScope)
      );

      if (invalidScopes.length > 0) {
        throw new AppError(
          `Invalid scopes: ${invalidScopes.join(', ')}`,
          400,
          ErrorCode.INVALID_REQUEST
        );
      }
    }

    const mcpClient = await prisma.mcp_client.update({
      where: { id: mcpClientId },
      data: {
        name: input.name,
        description: input.description,
        scopes: input.scopes,
        isActive: input.isActive,
        sourceSystem: input.sourceSystem,
        contactEmail: input.contactEmail,
        rateLimitPerMinute: input.rateLimitPerMinute,
        rateLimitPerHour: input.rateLimitPerHour,
        metadata: input.metadata as object,
        webhookUrl: input.webhookUrl,
        webhookSecret: input.webhookSecret,
        webhookEnabled: input.webhookEnabled,
      },
    });

    logger.info('MCP client updated', {
      context: 'McpClientService.updateMcpClient',
      mcpClientId: mcpClient.id,
    });

    return {
      id: mcpClient.id,
      clientId: mcpClient.clientId,
      name: mcpClient.name,
      description: mcpClient.description,
      scopes: mcpClient.scopes,
      isActive: mcpClient.isActive,
      sourceSystem: mcpClient.sourceSystem,
      contactEmail: mcpClient.contactEmail,
      rateLimitPerMinute: mcpClient.rateLimitPerMinute,
      rateLimitPerHour: mcpClient.rateLimitPerHour,
      lastUsedAt: mcpClient.lastUsedAt,
      requestCount: mcpClient.requestCount,
      errorCount: mcpClient.errorCount,
      webhookUrl: mcpClient.webhookUrl,
      webhookEnabled: mcpClient.webhookEnabled,
      createdAt: mcpClient.createdAt,
      updatedAt: mcpClient.updatedAt,
    };
  }

  /**
   * Regenerate API key for an MCP client
   */
  async regenerateApiKey(
    clientId: string,
    mcpClientId: string
  ): Promise<IMcpClientWithApiKey> {
    // Verify the MCP client exists and belongs to this tenant
    const existing = await prisma.mcp_client.findFirst({
      where: {
        id: mcpClientId,
        clientId,
      },
    });

    if (!existing) {
      throw new AppError('MCP client not found', 404, ErrorCode.NOT_FOUND);
    }

    // Generate new API key
    const apiKey = this.generateApiKey();
    const apiKeyHash = this.hashApiKey(apiKey);

    const mcpClient = await prisma.mcp_client.update({
      where: { id: mcpClientId },
      data: {
        apiKey,
        apiKeyHash,
      },
    });

    logger.info('MCP client API key regenerated', {
      context: 'McpClientService.regenerateApiKey',
      mcpClientId: mcpClient.id,
    });

    return {
      id: mcpClient.id,
      clientId: mcpClient.clientId,
      name: mcpClient.name,
      description: mcpClient.description,
      scopes: mcpClient.scopes,
      isActive: mcpClient.isActive,
      sourceSystem: mcpClient.sourceSystem,
      contactEmail: mcpClient.contactEmail,
      rateLimitPerMinute: mcpClient.rateLimitPerMinute,
      rateLimitPerHour: mcpClient.rateLimitPerHour,
      lastUsedAt: mcpClient.lastUsedAt,
      requestCount: mcpClient.requestCount,
      errorCount: mcpClient.errorCount,
      webhookUrl: mcpClient.webhookUrl,
      webhookEnabled: mcpClient.webhookEnabled,
      createdAt: mcpClient.createdAt,
      updatedAt: mcpClient.updatedAt,
      apiKey, // New API key
    };
  }

  /**
   * Delete an MCP client
   */
  async deleteMcpClient(clientId: string, mcpClientId: string): Promise<void> {
    // Verify the MCP client exists and belongs to this tenant
    const existing = await prisma.mcp_client.findFirst({
      where: {
        id: mcpClientId,
        clientId,
      },
    });

    if (!existing) {
      throw new AppError('MCP client not found', 404, ErrorCode.NOT_FOUND);
    }

    await prisma.mcp_client.delete({
      where: { id: mcpClientId },
    });

    logger.info('MCP client deleted', {
      context: 'McpClientService.deleteMcpClient',
      mcpClientId,
    });
  }

  /**
   * Get MCP client activity logs
   */
  async getMcpClientActivityLogs(
    clientId: string,
    mcpClientId: string,
    options: {
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ) {
    // Verify the MCP client belongs to this tenant
    const mcpClient = await prisma.mcp_client.findFirst({
      where: {
        id: mcpClientId,
        clientId,
      },
    });

    if (!mcpClient) {
      throw new AppError('MCP client not found', 404, ErrorCode.NOT_FOUND);
    }

    const { limit = 50, offset = 0, startDate, endDate } = options;

    const whereClause: Record<string, unknown> = {
      mcpClientId,
    };

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        (whereClause.createdAt as Record<string, unknown>).gte = startDate;
      }
      if (endDate) {
        (whereClause.createdAt as Record<string, unknown>).lte = endDate;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.mcp_activity_log.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.mcp_activity_log.count({ where: whereClause }),
    ]);

    return {
      logs,
      total,
      limit,
      offset,
    };
  }

  /**
   * Get available scopes
   */
  getAvailableScopes(): { scope: string; description: string }[] {
    return [
      { scope: MCP_SCOPES.JOBS_READ, description: 'Read job postings' },
      {
        scope: MCP_SCOPES.JOBS_WRITE,
        description: 'Create and update job postings',
      },
      {
        scope: MCP_SCOPES.CANDIDATES_READ,
        description: 'Read candidate profiles',
      },
      {
        scope: MCP_SCOPES.CANDIDATES_WRITE,
        description: 'Update candidate data',
      },
      { scope: MCP_SCOPES.INVITES_READ, description: 'Read job invites' },
      { scope: MCP_SCOPES.INVITES_WRITE, description: 'Send job invites' },
      { scope: MCP_SCOPES.APPLICATIONS_READ, description: 'Read applications' },
      {
        scope: MCP_SCOPES.APPLICATIONS_WRITE,
        description: 'Update applications',
      },
    ];
  }

  /**
   * Configure webhook for an MCP client
   */
  async configureWebhook(
    clientId: string,
    mcpClientId: string,
    config: {
      webhookUrl: string;
      webhookSecret?: string;
      webhookEnabled?: boolean;
    }
  ): Promise<IMcpClient> {
    // Verify the MCP client exists and belongs to this tenant
    const existing = await prisma.mcp_client.findFirst({
      where: {
        id: mcpClientId,
        clientId,
      },
    });

    if (!existing) {
      throw new AppError('MCP client not found', 404, ErrorCode.NOT_FOUND);
    }

    // Generate a webhook secret if enabling and no secret provided
    const webhookSecret =
      config.webhookSecret ||
      (config.webhookEnabled && !existing.webhookSecret
        ? randomBytes(32).toString('hex')
        : undefined);

    const mcpClient = await prisma.mcp_client.update({
      where: { id: mcpClientId },
      data: {
        webhookUrl: config.webhookUrl,
        webhookSecret,
        webhookEnabled: config.webhookEnabled ?? true,
      },
    });

    logger.info('MCP client webhook configured', {
      context: 'McpClientService.configureWebhook',
      mcpClientId: mcpClient.id,
      webhookEnabled: mcpClient.webhookEnabled,
    });

    return {
      id: mcpClient.id,
      clientId: mcpClient.clientId,
      name: mcpClient.name,
      description: mcpClient.description,
      scopes: mcpClient.scopes,
      isActive: mcpClient.isActive,
      sourceSystem: mcpClient.sourceSystem,
      contactEmail: mcpClient.contactEmail,
      rateLimitPerMinute: mcpClient.rateLimitPerMinute,
      rateLimitPerHour: mcpClient.rateLimitPerHour,
      lastUsedAt: mcpClient.lastUsedAt,
      requestCount: mcpClient.requestCount,
      errorCount: mcpClient.errorCount,
      webhookUrl: mcpClient.webhookUrl,
      webhookEnabled: mcpClient.webhookEnabled,
      createdAt: mcpClient.createdAt,
      updatedAt: mcpClient.updatedAt,
    };
  }

  /**
   * Test webhook configuration by sending a test event
   */
  async testWebhook(
    clientId: string,
    mcpClientId: string
  ): Promise<{ success: boolean; message: string; statusCode?: number }> {
    // Verify the MCP client exists and belongs to this tenant
    const mcpClient = await prisma.mcp_client.findFirst({
      where: {
        id: mcpClientId,
        clientId,
      },
    });

    if (!mcpClient) {
      throw new AppError('MCP client not found', 404, ErrorCode.NOT_FOUND);
    }

    if (!mcpClient.webhookUrl) {
      throw new AppError(
        'Webhook URL not configured',
        400,
        ErrorCode.INVALID_REQUEST
      );
    }

    // Import webhook service dynamically to avoid circular dependency
    const { McpWebhookService } = await import(
      '@/mcp/services/mcp.webhook.service'
    );
    const result =
      await McpWebhookService.getInstance().testWebhook(mcpClientId);

    return {
      success: result.success,
      message: result.success
        ? 'Test webhook delivered successfully'
        : result.error || 'Failed to deliver test webhook',
      statusCode: result.statusCode,
    };
  }
}

export const mcpClientService = new McpClientService();
