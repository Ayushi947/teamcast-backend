/**
 * MCP Client API Models
 * API request/response types for MCP client management
 */

import {
  IApiRequest,
  IApiResponse,
  IApiPaginatedRequest,
  IPaginatedResponse,
} from '../common/common.api';
import {
  IMcpClient,
  IMcpClientWithApiKey,
  IMcpClientCreate,
  IMcpClientUpdate,
  IMcpClientFilterQuery,
  IMcpClientIdParams,
  IMcpClientWebhookConfig,
  IMcpClientScope,
  IMcpWebhookTestResult,
} from '../../domain/client/mcp.client.domain';

// ============================================================================
// Create MCP Client
// ============================================================================

export type IMcpClientCreateApiRequest = IApiRequest<IMcpClientCreate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IMcpClientCreateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IMcpClientWithApiKey'
 */
export type IMcpClientCreateApiResponse = IApiResponse<IMcpClientWithApiKey>;

// ============================================================================
// Update MCP Client
// ============================================================================

export type IMcpClientUpdateApiRequest = IApiRequest<
  IMcpClientUpdate,
  void,
  IMcpClientIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IMcpClientUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IMcpClient'
 */
export type IMcpClientUpdateApiResponse = IApiResponse<IMcpClient>;

// ============================================================================
// Get MCP Client
// ============================================================================

export type IMcpClientGetApiRequest = IApiRequest<
  void,
  void,
  IMcpClientIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IMcpClientGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IMcpClient'
 */
export type IMcpClientGetApiResponse = IApiResponse<IMcpClient>;

// ============================================================================
// Delete MCP Client
// ============================================================================

export type IMcpClientDeleteApiRequest = IApiRequest<
  void,
  void,
  IMcpClientIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IMcpClientDeleteApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: boolean
 */
export type IMcpClientDeleteApiResponse = IApiResponse<boolean>;

// ============================================================================
// List MCP Clients
// ============================================================================

export type IMcpClientListApiRequest = IApiPaginatedRequest<
  void,
  IMcpClientFilterQuery,
  void
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IMcpClientListApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IMcpClient'
 */
export type IMcpClientListApiResponse = IApiResponse<IMcpClient[]>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IMcpClientPaginatedListApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPaginatedResponse'
 */
export type IMcpClientPaginatedListApiResponse = IApiResponse<
  IPaginatedResponse<IMcpClient>
>;

// ============================================================================
// Regenerate API Key
// ============================================================================

export type IMcpClientRegenerateApiKeyRequest = IApiRequest<
  void,
  void,
  IMcpClientIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IMcpClientRegenerateApiKeyResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IMcpClientWithApiKey'
 */
export type IMcpClientRegenerateApiKeyResponse =
  IApiResponse<IMcpClientWithApiKey>;

// ============================================================================
// Configure Webhook
// ============================================================================

export type IMcpClientConfigureWebhookRequest = IApiRequest<
  IMcpClientWebhookConfig,
  void,
  IMcpClientIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IMcpClientConfigureWebhookResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IMcpClient'
 */
export type IMcpClientConfigureWebhookResponse = IApiResponse<IMcpClient>;

// ============================================================================
// Test Webhook
// ============================================================================

export type IMcpClientTestWebhookRequest = IApiRequest<
  void,
  void,
  IMcpClientIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IMcpClientTestWebhookResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IMcpWebhookTestResult'
 */
export type IMcpClientTestWebhookResponse = IApiResponse<IMcpWebhookTestResult>;

// ============================================================================
// Get Available Scopes
// ============================================================================

export type IMcpClientGetScopesRequest = IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IMcpClientGetScopesResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IMcpClientScope'
 */
export type IMcpClientGetScopesResponse = IApiResponse<IMcpClientScope[]>;
