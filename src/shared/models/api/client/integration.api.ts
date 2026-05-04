import {
  IClientIntegration,
  IClientIntegrationCreate,
  IClientIntegrationUpdate,
  IClientIntegrationFilterQuery,
  IIntegrationIdParams,
  IClientIntegrationIdParams,
  IIntegrationProvider,
  IIntegrationSyncTask,
  IIntegrationWebhook,
  IIntegrationAuditLog,
} from '../../domain/client/integration.domain';
import {
  IApiPaginatedRequest,
  IApiRequest,
  IApiResponse,
  IPaginatedResponse,
} from '../common/common.api';

// Provider API Models
export type IIntegrationProviderListApiRequest = IApiPaginatedRequest<
  void,
  void,
  void
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IIntegrationProviderListApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPaginatedResponse'
 *               items:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/IIntegrationProvider'
 */
export type IIntegrationProviderListApiResponse = IApiResponse<
  IPaginatedResponse<IIntegrationProvider>
>;

export type IIntegrationProviderGetApiRequest = IApiRequest<
  void,
  void,
  IIntegrationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IIntegrationProviderGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IIntegrationProvider'
 */
export type IIntegrationProviderGetApiResponse =
  IApiResponse<IIntegrationProvider>;

// Client Integration API Models
export type IClientIntegrationCreateApiRequest =
  IApiRequest<IClientIntegrationCreate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientIntegrationCreateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientIntegration'
 */
export type IClientIntegrationCreateApiResponse =
  IApiResponse<IClientIntegration>;

export type IClientIntegrationGetApiRequest = IApiRequest<
  void,
  void,
  IClientIntegrationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientIntegrationGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientIntegration'
 */
export type IClientIntegrationGetApiResponse = IApiResponse<IClientIntegration>;

export type IClientIntegrationUpdateApiRequest = IApiRequest<
  IClientIntegrationUpdate,
  void,
  IClientIntegrationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientIntegrationUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientIntegration'
 */
export type IClientIntegrationUpdateApiResponse =
  IApiResponse<IClientIntegration>;

export type IClientIntegrationDeleteApiRequest = IApiRequest<
  void,
  void,
  IClientIntegrationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientIntegrationDeleteApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: boolean
 *               description: Whether the integration was successfully deleted
 */
export type IClientIntegrationDeleteApiResponse = IApiResponse<boolean>;

export type IClientIntegrationListApiRequest = IApiPaginatedRequest<
  void,
  IClientIntegrationFilterQuery,
  void
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientIntegrationListApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPaginatedResponse'
 *               items:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/IClientIntegration'
 */
export type IClientIntegrationListApiResponse = IApiResponse<
  IPaginatedResponse<IClientIntegration>
>;

// Sync Task API Models
export type IIntegrationSyncTaskListApiRequest = IApiPaginatedRequest<
  void,
  void,
  IClientIntegrationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IIntegrationSyncTaskListApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPaginatedResponse'
 *               items:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/IIntegrationSyncTask'
 */
export type IIntegrationSyncTaskListApiResponse = IApiResponse<
  IPaginatedResponse<IIntegrationSyncTask>
>;

// Webhook API Models
export type IIntegrationWebhookListApiRequest = IApiPaginatedRequest<
  void,
  void,
  IClientIntegrationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IIntegrationWebhookListApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPaginatedResponse'
 *               items:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/IIntegrationWebhook'
 */
export type IIntegrationWebhookListApiResponse = IApiResponse<
  IPaginatedResponse<IIntegrationWebhook>
>;

// Audit Log API Models
export type IIntegrationAuditLogListApiRequest = IApiPaginatedRequest<
  void,
  void,
  IClientIntegrationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IIntegrationAuditLogListApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPaginatedResponse'
 *               items:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/IIntegrationAuditLog'
 */
export type IIntegrationAuditLogListApiResponse = IApiResponse<
  IPaginatedResponse<IIntegrationAuditLog>
>;

// Test Connection API Models
export type IClientIntegrationTestConnectionApiRequest = IApiRequest<
  void,
  void,
  IClientIntegrationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientIntegrationTestConnectionApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Whether the connection test was successful
 *                 message:
 *                   type: string
 *                   description: Result message from the connection test
 */
export type IClientIntegrationTestConnectionApiResponse = IApiResponse<{
  success: boolean;
  message: string;
}>;
