/**
 * MCP Client Domain Models
 * Domain models for MCP (Model Context Protocol) client management
 */

/**
 * MCP Scope Enum
 */
export type McpScopeType =
  | 'jobs:read'
  | 'jobs:write'
  | 'candidates:read'
  | 'candidates:write'
  | 'invites:read'
  | 'invites:write'
  | 'applications:read'
  | 'applications:write';

/**
 * @openapi
 * components:
 *   schemas:
 *     IMcpClient:
 *       type: object
 *       description: Domain model representing an MCP client (external AI agent)
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the MCP client
 *         clientId:
 *           type: string
 *           format: uuid
 *           description: ID of the tenant this MCP client belongs to
 *         name:
 *           type: string
 *           description: Human-readable name for the MCP client
 *         description:
 *           type: string
 *           nullable: true
 *           description: Optional description of the MCP client
 *         scopes:
 *           type: array
 *           items:
 *             type: string
 *           description: Permission scopes granted to this client
 *         isActive:
 *           type: boolean
 *           description: Whether the MCP client is active
 *         sourceSystem:
 *           type: string
 *           nullable: true
 *           description: Source system identifier (e.g., 'linkedin', 'greenhouse')
 *         contactEmail:
 *           type: string
 *           format: email
 *           nullable: true
 *           description: Contact email for this integration
 *         rateLimitPerMinute:
 *           type: integer
 *           description: Maximum requests per minute
 *         rateLimitPerHour:
 *           type: integer
 *           description: Maximum requests per hour
 *         lastUsedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Last time the client made an API request
 *         requestCount:
 *           type: integer
 *           description: Total number of requests made by this client
 *         errorCount:
 *           type: integer
 *           description: Total number of error responses
 *         webhookUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *           description: URL for webhook notifications
 *         webhookEnabled:
 *           type: boolean
 *           description: Whether webhook notifications are enabled
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the MCP client was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the MCP client was last updated
 *       required:
 *         - id
 *         - clientId
 *         - name
 *         - scopes
 *         - isActive
 *         - rateLimitPerMinute
 *         - rateLimitPerHour
 *         - requestCount
 *         - errorCount
 *         - webhookEnabled
 *         - createdAt
 *         - updatedAt
 */
export interface IMcpClient {
  id: string;
  clientId: string;
  name: string;
  description: string | null;
  scopes: string[];
  isActive: boolean;
  sourceSystem: string | null;
  contactEmail: string | null;
  rateLimitPerMinute: number;
  rateLimitPerHour: number;
  lastUsedAt: Date | null;
  requestCount: number;
  errorCount: number;
  webhookUrl: string | null;
  webhookEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IMcpClientWithApiKey:
 *       allOf:
 *         - $ref: '#/components/schemas/IMcpClient'
 *         - type: object
 *           properties:
 *             apiKey:
 *               type: string
 *               description: API key for authentication (only returned on creation or regeneration)
 *           required:
 *             - apiKey
 */
export interface IMcpClientWithApiKey extends IMcpClient {
  apiKey: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IMcpClientCreate:
 *       type: object
 *       description: Payload for creating a new MCP client
 *       properties:
 *         name:
 *           type: string
 *           description: Human-readable name for the MCP client
 *         description:
 *           type: string
 *           description: Optional description of the MCP client
 *         scopes:
 *           type: array
 *           items:
 *             type: string
 *           description: Permission scopes to grant
 *         sourceSystem:
 *           type: string
 *           description: Source system identifier
 *         contactEmail:
 *           type: string
 *           format: email
 *           description: Contact email for this integration
 *         rateLimitPerMinute:
 *           type: integer
 *           description: Maximum requests per minute (default 100)
 *         rateLimitPerHour:
 *           type: integer
 *           description: Maximum requests per hour (default 1000)
 *         metadata:
 *           type: object
 *           description: Additional metadata for the client
 *       required:
 *         - name
 *         - scopes
 */
export interface IMcpClientCreate {
  name: string;
  description?: string;
  scopes: McpScopeType[];
  sourceSystem?: string;
  contactEmail?: string;
  rateLimitPerMinute?: number;
  rateLimitPerHour?: number;
  metadata?: Record<string, unknown>;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IMcpClientUpdate:
 *       type: object
 *       description: Payload for updating an existing MCP client
 *       properties:
 *         name:
 *           type: string
 *           description: Human-readable name for the MCP client
 *         description:
 *           type: string
 *           description: Optional description of the MCP client
 *         scopes:
 *           type: array
 *           items:
 *             type: string
 *           description: Permission scopes to grant
 *         isActive:
 *           type: boolean
 *           description: Whether the MCP client is active
 *         sourceSystem:
 *           type: string
 *           description: Source system identifier
 *         contactEmail:
 *           type: string
 *           format: email
 *           description: Contact email for this integration
 *         rateLimitPerMinute:
 *           type: integer
 *           description: Maximum requests per minute
 *         rateLimitPerHour:
 *           type: integer
 *           description: Maximum requests per hour
 *         metadata:
 *           type: object
 *           description: Additional metadata for the client
 *         webhookUrl:
 *           type: string
 *           format: uri
 *           description: URL for webhook notifications
 *         webhookSecret:
 *           type: string
 *           description: Secret for webhook signature verification
 *         webhookEnabled:
 *           type: boolean
 *           description: Whether webhook notifications are enabled
 */
export interface IMcpClientUpdate {
  name?: string;
  description?: string;
  scopes?: McpScopeType[];
  isActive?: boolean;
  sourceSystem?: string;
  contactEmail?: string;
  rateLimitPerMinute?: number;
  rateLimitPerHour?: number;
  metadata?: Record<string, unknown>;
  webhookUrl?: string;
  webhookSecret?: string;
  webhookEnabled?: boolean;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IMcpClientWebhookConfig:
 *       type: object
 *       description: Webhook configuration for an MCP client
 *       properties:
 *         webhookUrl:
 *           type: string
 *           format: uri
 *           description: URL for webhook notifications
 *         webhookSecret:
 *           type: string
 *           description: Secret for webhook signature verification
 *         webhookEnabled:
 *           type: boolean
 *           description: Whether webhook notifications are enabled
 *       required:
 *         - webhookUrl
 */
export interface IMcpClientWebhookConfig {
  webhookUrl: string;
  webhookSecret?: string;
  webhookEnabled?: boolean;
}

/**
 * @openapi
 * components:
 *   parameters:
 *     IMcpClientFilterQueryName:
 *       in: query
 *       name: name
 *       required: false
 *       schema:
 *         type: string
 *         description: Filter by MCP client name
 *     IMcpClientFilterQueryIsActive:
 *       in: query
 *       name: isActive
 *       required: false
 *       schema:
 *         type: boolean
 *         description: Filter by active status
 *     IMcpClientFilterQuerySourceSystem:
 *       in: query
 *       name: sourceSystem
 *       required: false
 *       schema:
 *         type: string
 *         description: Filter by source system
 */
export interface IMcpClientFilterQuery {
  name?: string;
  isActive?: boolean;
  sourceSystem?: string;
}

/**
 * @openapi
 * components:
 *   parameters:
 *     IMcpClientIdParams:
 *       in: path
 *       name: mcpClientId
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *         description: ID of the MCP client
 */
export interface IMcpClientIdParams {
  mcpClientId: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IMcpClientScope:
 *       type: object
 *       description: Available MCP scope with description
 *       properties:
 *         scope:
 *           type: string
 *           description: The scope identifier
 *         description:
 *           type: string
 *           description: Human-readable description of the scope
 *       required:
 *         - scope
 *         - description
 */
export interface IMcpClientScope {
  scope: string;
  description: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IMcpWebhookTestResult:
 *       type: object
 *       description: Result of webhook test
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the test was successful
 *         message:
 *           type: string
 *           description: Result message
 *         statusCode:
 *           type: integer
 *           description: HTTP status code from webhook endpoint
 *       required:
 *         - success
 *         - message
 */
export interface IMcpWebhookTestResult {
  success: boolean;
  message: string;
  statusCode?: number;
}

/**
 * Helper function to convert database model to domain model
 */
export function toMcpClientDomain(
  mcpClient: Record<string, unknown>
): IMcpClient {
  return {
    id: mcpClient.id as string,
    clientId: mcpClient.clientId as string,
    name: mcpClient.name as string,
    description: mcpClient.description as string | null,
    scopes: mcpClient.scopes as string[],
    isActive: mcpClient.isActive as boolean,
    sourceSystem: mcpClient.sourceSystem as string | null,
    contactEmail: mcpClient.contactEmail as string | null,
    rateLimitPerMinute: mcpClient.rateLimitPerMinute as number,
    rateLimitPerHour: mcpClient.rateLimitPerHour as number,
    lastUsedAt: mcpClient.lastUsedAt as Date | null,
    requestCount: mcpClient.requestCount as number,
    errorCount: mcpClient.errorCount as number,
    webhookUrl: mcpClient.webhookUrl as string | null,
    webhookEnabled: mcpClient.webhookEnabled as boolean,
    createdAt: mcpClient.createdAt as Date,
    updatedAt: mcpClient.updatedAt as Date,
  };
}
