import { Router } from 'express';
import { ClientIntegrationController } from '@/controllers/client/integration.controller';
import { ClientIntegrationService } from '@/services/client/integration.service';
import {
  requireAuth,
  requireActiveUser,
  requireRole,
  requireUserType,
} from '@/middleware';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';

const router = Router();

// Initialize service and controller
const clientIntegrationService = new ClientIntegrationService();
const clientIntegrationController = new ClientIntegrationController(
  clientIntegrationService
);

// Client auth middleware - applies to all integration routes
const clientAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.CLIENT]),
];

// Admin-only middleware - applies to all management routes
const roleHrAdminOnlyMiddleware = [
  ...clientAuthMiddleware,
  requireRole([UserRoleEnum.HR, UserRoleEnum.ADMIN]),
];

/**
 * @openapi
 * /client/integrations/providers:
 *   get:
 *     summary: Get list of available integration providers
 *     description: Retrieves a paginated list of all available integration providers
 *     tags:
 *       - Client Integrations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortBy'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortOrder'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSearch'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSearchColumns'
 *     responses:
 *       200:
 *         description: List of integration providers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IIntegrationProviderListApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.get(
  '/providers',
  clientAuthMiddleware,
  clientIntegrationController.getIntegrationProviders
);

/**
 * @openapi
 * /client/integrations/providers/{integrationId}:
 *   get:
 *     summary: Get a specific integration provider
 *     description: Retrieves details of a specific integration provider
 *     tags:
 *       - Client Integrations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the integration provider
 *     responses:
 *       200:
 *         description: Integration provider details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IIntegrationProviderGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Integration provider not found
 */
router.get(
  '/providers/:integrationId',
  clientAuthMiddleware,
  clientIntegrationController.getIntegrationProvider
);

/**
 * @openapi
 * /client/integrations:
 *   post:
 *     summary: Create a new client integration
 *     description: Allows client admins or HR to create a new integration with a provider
 *     tags:
 *       - Client Integrations
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientIntegrationCreate'
 *     responses:
 *       201:
 *         description: Integration created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientIntegrationCreateApiResponse'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.post(
  '/',
  roleHrAdminOnlyMiddleware,
  clientIntegrationController.createClientIntegration
);

/**
 * @openapi
 * /client/integrations/{clientIntegrationId}:
 *   get:
 *     summary: Get a specific client integration
 *     description: Retrieves details of a specific client integration
 *     tags:
 *       - Client Integrations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientIntegrationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the client integration
 *     responses:
 *       200:
 *         description: Client integration details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientIntegrationGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Client integration not found
 */
router.get(
  '/:clientIntegrationId',
  roleHrAdminOnlyMiddleware,
  clientIntegrationController.getClientIntegration
);

/**
 * @openapi
 * /client/integrations/{clientIntegrationId}:
 *   put:
 *     summary: Update a client integration
 *     description: Allows client admins or HR to update an existing integration
 *     tags:
 *       - Client Integrations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientIntegrationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the client integration
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientIntegrationUpdate'
 *     responses:
 *       200:
 *         description: Integration updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientIntegrationUpdateApiResponse'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Client integration not found
 */
router.put(
  '/:clientIntegrationId',
  roleHrAdminOnlyMiddleware,
  clientIntegrationController.updateClientIntegration
);

/**
 * @openapi
 * /client/integrations/{clientIntegrationId}:
 *   delete:
 *     summary: Delete a client integration
 *     description: Allows client admins or HR to delete an existing integration
 *     tags:
 *       - Client Integrations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientIntegrationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the client integration
 *     responses:
 *       200:
 *         description: Integration deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientIntegrationDeleteApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Client integration not found
 */
router.delete(
  '/:clientIntegrationId',
  roleHrAdminOnlyMiddleware,
  clientIntegrationController.deleteClientIntegration
);

/**
 * @openapi
 * /client/integrations:
 *   get:
 *     summary: List client integrations
 *     description: Get a paginated list of all client integrations with comprehensive filtering, searching, and sorting capabilities
 *     tags:
 *       - Client Integrations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortBy'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortOrder'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSearch'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSearchColumns'
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by integration name (partial match)
 *         example: "LinkedIn Integration"
 *       - in: query
 *         name: status
 *         schema:
 *           oneOf:
 *             - $ref: '#/components/schemas/IntegrationStatus'
 *             - type: array
 *               items:
 *                 $ref: '#/components/schemas/IntegrationStatus'
 *         description: Filter by integration status (single value or comma-separated list)
 *         example: "ACTIVE,INACTIVE"
 *       - in: query
 *         name: providerId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by provider ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: List of client integrations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientIntegrationListApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get(
  '/',
  roleHrAdminOnlyMiddleware,
  clientIntegrationController.listClientIntegrations
);

/**
 * @openapi
 * /client/integrations/{clientIntegrationId}/sync-tasks:
 *   get:
 *     summary: Get sync tasks for a client integration
 *     description: Retrieves a paginated list of sync tasks for a specific client integration
 *     tags:
 *       - Client Integrations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientIntegrationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the client integration
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *     responses:
 *       200:
 *         description: Sync tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IIntegrationSyncTaskListApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Client integration not found
 */
router.get(
  '/:clientIntegrationId/sync-tasks',
  roleHrAdminOnlyMiddleware,
  clientIntegrationController.getIntegrationSyncTasks
);

/**
 * @openapi
 * /client/integrations/{clientIntegrationId}/webhooks:
 *   get:
 *     summary: Get webhooks for a client integration
 *     description: Retrieves a paginated list of webhooks for a specific client integration
 *     tags:
 *       - Client Integrations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientIntegrationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the client integration
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *     responses:
 *       200:
 *         description: Webhooks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IIntegrationWebhookListApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Client integration not found
 */
router.get(
  '/:clientIntegrationId/webhooks',
  roleHrAdminOnlyMiddleware,
  clientIntegrationController.getIntegrationWebhooks
);

/**
 * @openapi
 * /client/integrations/{clientIntegrationId}/test-connection:
 *   post:
 *     summary: Test connection for a client integration
 *     description: Tests the connection to the external integration provider using stored credentials
 *     tags:
 *       - Client Integrations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientIntegrationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the client integration
 *     responses:
 *       200:
 *         description: Connection test completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientIntegrationTestConnectionApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Client integration not found
 *       500:
 *         description: Connection test failed
 */
router.post(
  '/:clientIntegrationId/test-connection',
  roleHrAdminOnlyMiddleware,
  clientIntegrationController.testIntegrationConnection
);

/**
 * @openapi
 * /client/integrations/{clientIntegrationId}/audit-logs:
 *   get:
 *     summary: Get audit logs for a client integration
 *     description: Retrieves a paginated list of audit logs for a specific client integration
 *     tags:
 *       - Client Integrations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientIntegrationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the client integration
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IIntegrationAuditLogListApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Client integration not found
 */
router.get(
  '/:clientIntegrationId/audit-logs',
  roleHrAdminOnlyMiddleware,
  clientIntegrationController.getIntegrationAuditLogs
);

export default router;
