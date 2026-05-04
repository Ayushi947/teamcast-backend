import { PrismaClient } from '@prisma/client';
import { createHmac } from 'crypto';
import { logger } from '@/shared/utils/logger';

const prisma = new PrismaClient();

/**
 * Webhook Event Types
 */
export type McpWebhookEvent =
  | 'job.created'
  | 'job.updated'
  | 'job.deleted'
  | 'invite.sent'
  | 'invite.accepted'
  | 'invite.rejected'
  | 'invite.expired'
  | 'candidates.searched'
  | 'search.executed'
  | 'application.created'
  | 'application.updated'
  | 'application.statusChanged'
  | 'assessment.started'
  | 'assessment.completed'
  | 'assessment.passed'
  | 'assessment.failed'
  | 'interview.result'
  | 'interview.invited'
  | 'interview.accepted'
  | 'interview.declined'
  | 'interview.started'
  | 'interview.completed'
  | 'interview.results_ready';

/**
 * Webhook Payload Structure
 */
interface WebhookPayload {
  event: McpWebhookEvent;
  timestamp: string;
  data: Record<string, unknown>;
  signature?: string;
}

/**
 * Webhook Delivery Result
 */
interface WebhookDeliveryResult {
  success: boolean;
  statusCode?: number;
  error?: string;
  deliveredAt?: string;
}

/**
 * MCP Webhook Service
 * Handles sending webhook notifications to configured MCP clients
 */
export class McpWebhookService {
  private static instance: McpWebhookService;

  private constructor() {}

  static getInstance(): McpWebhookService {
    if (!McpWebhookService.instance) {
      McpWebhookService.instance = new McpWebhookService();
    }
    return McpWebhookService.instance;
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  private generateSignature(payload: string, secret: string): string {
    return createHmac('sha256', secret).update(payload).digest('hex');
  }

  /**
   * Send webhook to a specific URL
   */
  private async sendWebhook(
    url: string,
    payload: WebhookPayload,
    secret?: string
  ): Promise<WebhookDeliveryResult> {
    try {
      const payloadString = JSON.stringify(payload);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-MCP-Event': payload.event,
        'X-MCP-Timestamp': payload.timestamp,
      };

      // Add signature if secret is provided
      if (secret) {
        const signature = this.generateSignature(payloadString, secret);
        headers['X-MCP-Signature'] = `sha256=${signature}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: payloadString,
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        return {
          success: false,
          statusCode: response.status,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return {
        success: true,
        statusCode: response.status,
        deliveredAt: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      logger.error('Webhook delivery failed', {
        context: 'McpWebhookService.sendWebhook',
        url,
        event: payload.event,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Trigger webhook for a specific MCP client
   */
  async triggerWebhook(
    mcpClientId: string,
    event: McpWebhookEvent,
    data: Record<string, unknown>
  ): Promise<WebhookDeliveryResult | null> {
    try {
      // Get MCP client with webhook configuration
      const mcpClient = await prisma.mcp_client.findUnique({
        where: { id: mcpClientId },
        select: {
          id: true,
          webhookUrl: true,
          webhookSecret: true,
          webhookEnabled: true,
          isActive: true,
        },
      });

      // Skip if client doesn't exist, is inactive, or webhooks are disabled
      if (!mcpClient || !mcpClient.isActive || !mcpClient.webhookEnabled) {
        return null;
      }

      // Skip if no webhook URL configured
      if (!mcpClient.webhookUrl) {
        return null;
      }

      const payload: WebhookPayload = {
        event,
        timestamp: new Date().toISOString(),
        data: {
          ...data,
          mcpClientId,
        },
      };

      const result = await this.sendWebhook(
        mcpClient.webhookUrl,
        payload,
        mcpClient.webhookSecret || undefined
      );

      // Log the delivery attempt
      logger.info('Webhook triggered', {
        context: 'McpWebhookService.triggerWebhook',
        mcpClientId,
        event,
        success: result.success,
        statusCode: result.statusCode,
      });

      return result;
    } catch (error) {
      logger.error('Failed to trigger webhook', {
        context: 'McpWebhookService.triggerWebhook',
        mcpClientId,
        event,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Trigger webhooks for all MCP clients belonging to a tenant
   * Useful for tenant-wide events
   */
  async triggerWebhooksForTenant(
    tenantId: string,
    event: McpWebhookEvent,
    data: Record<string, unknown>
  ): Promise<Map<string, WebhookDeliveryResult>> {
    const results = new Map<string, WebhookDeliveryResult>();

    try {
      // Get all active MCP clients with webhooks enabled for this tenant
      const mcpClients = await prisma.mcp_client.findMany({
        where: {
          clientId: tenantId,
          isActive: true,
          webhookEnabled: true,
          webhookUrl: { not: null },
        },
        select: {
          id: true,
          webhookUrl: true,
          webhookSecret: true,
        },
      });

      // Send webhooks in parallel
      const deliveryPromises = mcpClients.map(async (client) => {
        const payload: WebhookPayload = {
          event,
          timestamp: new Date().toISOString(),
          data: {
            ...data,
            tenantId,
            mcpClientId: client.id,
          },
        };

        const result = await this.sendWebhook(
          client.webhookUrl!,
          payload,
          client.webhookSecret || undefined
        );

        results.set(client.id, result);
      });

      await Promise.allSettled(deliveryPromises);

      logger.info('Tenant webhooks triggered', {
        context: 'McpWebhookService.triggerWebhooksForTenant',
        tenantId,
        event,
        clientCount: mcpClients.length,
        successCount: Array.from(results.values()).filter((r) => r.success)
          .length,
      });

      return results;
    } catch (error) {
      logger.error('Failed to trigger tenant webhooks', {
        context: 'McpWebhookService.triggerWebhooksForTenant',
        tenantId,
        event,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return results;
    }
  }

  /**
   * Test webhook configuration for a client
   */
  async testWebhook(mcpClientId: string): Promise<WebhookDeliveryResult> {
    const testData = {
      test: true,
      message: 'This is a test webhook from Teamcast MCP Server',
    };

    const result = await this.triggerWebhook(
      mcpClientId,
      'search.executed',
      testData
    );

    if (!result) {
      return {
        success: false,
        error: 'Webhook not configured or disabled',
      };
    }

    return result;
  }

  /**
   * Notify source MCP client about interview/assessment results
   * Called when an assessment is completed for a candidate sent via MCP
   */
  async notifyInterviewResult(
    jobApplicationId: string,
    event:
      | 'assessment.started'
      | 'assessment.completed'
      | 'assessment.passed'
      | 'assessment.failed'
      | 'application.statusChanged',
    additionalData?: Record<string, unknown>
  ): Promise<WebhookDeliveryResult | null> {
    try {
      // Find the job invite linked to this application
      const jobInvite = await prisma.job_invite.findFirst({
        where: {
          jobApplicationId,
          sourceMcpClientId: { not: null },
        },
        select: {
          id: true,
          email: true,
          name: true,
          sourceMcpClientId: true,
          externalCandidateId: true,
          externalBatchId: true,
          jobId: true,
          jobApplication: {
            select: {
              id: true,
              status: true,
              jobPosting: {
                select: {
                  id: true,
                  title: true,
                },
              },
              aiAssessment: {
                select: {
                  id: true,
                  status: true,
                  result: true,
                  score: true,
                  recommendation: true,
                  completedAt: true,
                  strengths: true,
                  areasForImprovement: true,
                  overallFeedback: true,
                },
              },
            },
          },
        },
      });

      // No MCP client tracking for this invite
      if (!jobInvite || !jobInvite.sourceMcpClientId) {
        return null;
      }

      const application = jobInvite.jobApplication;
      const assessment = application?.aiAssessment;

      const webhookData: Record<string, unknown> = {
        inviteId: jobInvite.id,
        externalCandidateId: jobInvite.externalCandidateId,
        externalBatchId: jobInvite.externalBatchId,
        candidate: {
          email: jobInvite.email,
          name: jobInvite.name,
        },
        jobPosting: application?.jobPosting
          ? {
              id: application.jobPosting.id,
              title: application.jobPosting.title,
            }
          : { id: jobInvite.jobId },
        application: application
          ? {
              id: application.id,
              status: application.status,
            }
          : null,
        assessment: assessment
          ? {
              id: assessment.id,
              status: assessment.status,
              result: assessment.result,
              score: assessment.score,
              recommendation: assessment.recommendation,
              completedAt: assessment.completedAt?.toISOString(),
              strengths: assessment.strengths,
              areasForImprovement: assessment.areasForImprovement,
              overallFeedback: assessment.overallFeedback,
            }
          : null,
        ...additionalData,
      };

      return await this.triggerWebhook(
        jobInvite.sourceMcpClientId,
        event,
        webhookData
      );
    } catch (error) {
      logger.error('Failed to notify interview result', {
        context: 'McpWebhookService.notifyInterviewResult',
        jobApplicationId,
        event,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Notify source MCP client about application status change
   */
  async notifyApplicationStatusChange(
    jobApplicationId: string,
    oldStatus: string,
    newStatus: string
  ): Promise<WebhookDeliveryResult | null> {
    return this.notifyInterviewResult(
      jobApplicationId,
      'application.statusChanged',
      { oldStatus, newStatus }
    );
  }
}

// Export singleton instance getter
export const mcpWebhookService = McpWebhookService.getInstance();
