import { Router } from 'express';
import { IntegrationCommonController } from '@/controllers/integration/common/integration.common.controller';
import { IntegrationDataTrackingService } from '@/services/integration/common/integration.data.tracking.service';
import { IntegrationDisconnectService } from '@/services/integration/common/integration.disconnect.service';
import {
  requireAuth,
  requireActiveUser,
  requireRole,
  requireUserType,
  validateRequest,
} from '@/middleware';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';
import { IntegrationCommonValidators } from '@/shared/validators/integration/common/integration.common.validator';

const router = Router();

// Initialize services and controller
const dataTrackingService = new IntegrationDataTrackingService();
const disconnectService = new IntegrationDisconnectService();
const integrationCommonController = new IntegrationCommonController(
  dataTrackingService,
  disconnectService
);

// Client auth middleware - applies to all common integration routes
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
 * /client/integrations/common/data-summary:
 *   get:
 *     summary: Get integration data summary
 *     description: Retrieves a summary of all integration data for the client
 *     tags:
 *       - Integration Data Tracking
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Integration data summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IIntegrationDataSummaryApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.get(
  '/data-summary',
  [
    ...roleHrAdminOnlyMiddleware,
    validateRequest(IntegrationCommonValidators.dataSummary),
  ],
  integrationCommonController.getIntegrationDataSummary
);

/**
 * @openapi
 * /client/integrations/common/data-details/{integrationId}:
 *   get:
 *     summary: Get detailed integration data
 *     description: Retrieves detailed data for a specific integration
 *     tags:
 *       - Integration Data Tracking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the integration
 *     responses:
 *       200:
 *         description: Integration data details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IIntegrationDataDetailsApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Integration not found
 */
router.get(
  '/data-details/:integrationId',
  [
    ...roleHrAdminOnlyMiddleware,
    validateRequest(IntegrationCommonValidators.dataDetails),
  ],
  integrationCommonController.getIntegrationDataDetails
);

/**
 * @openapi
 * /client/integrations/common/job-import-source/{jobId}:
 *   get:
 *     summary: Get job import source
 *     description: Retrieves information about which integration imported a specific job
 *     tags:
 *       - Integration Data Tracking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the job
 *     responses:
 *       200:
 *         description: Job import source retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IJobImportSourceApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.get(
  '/job-import-source/:jobId',
  [
    ...roleHrAdminOnlyMiddleware,
    validateRequest(IntegrationCommonValidators.jobImportSource),
  ],
  integrationCommonController.getJobImportSource
);

/**
 * @openapi
 * /client/integrations/common/candidate-import-source/{candidateId}:
 *   get:
 *     summary: Get candidate import source
 *     description: Retrieves information about which integration(s) imported a specific candidate
 *     tags:
 *       - Integration Data Tracking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: candidateId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the candidate
 *     responses:
 *       200:
 *         description: Candidate import source retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateImportSourceApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.get(
  '/candidate-import-source/:candidateId',
  [
    ...roleHrAdminOnlyMiddleware,
    validateRequest(IntegrationCommonValidators.candidateImportSource),
  ],
  integrationCommonController.getCandidateImportSource
);

/**
 * @openapi
 * /client/integrations/common/usage-statistics:
 *   get:
 *     summary: Get data usage statistics
 *     description: Retrieves usage statistics across all integrations for the client
 *     tags:
 *       - Integration Data Tracking
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data usage statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IDataUsageStatisticsApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.get(
  '/usage-statistics',
  [
    ...roleHrAdminOnlyMiddleware,
    validateRequest(IntegrationCommonValidators.usageStatistics),
  ],
  integrationCommonController.getDataUsageStatistics
);

/**
 * @openapi
 * /client/integrations/common/disconnect/{integrationId}:
 *   post:
 *     summary: Disconnect an integration
 *     description: Disconnects an integration with options for data cleanup
 *     tags:
 *       - Integration Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the integration
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IIntegrationDisconnectRequest'
 *     responses:
 *       200:
 *         description: Integration disconnected successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IIntegrationDisconnectApiResponse'
 *       400:
 *         description: Bad request - integration is currently syncing
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Integration not found
 */
router.post(
  '/disconnect/:integrationId',
  [
    ...roleHrAdminOnlyMiddleware,
    validateRequest(IntegrationCommonValidators.disconnect),
  ],
  integrationCommonController.disconnectIntegration
);

/**
 * @openapi
 * /client/integrations/common/bulk-disconnect:
 *   post:
 *     summary: Bulk disconnect multiple integrations
 *     description: Disconnects multiple integrations at once with options for data cleanup
 *     tags:
 *       - Integration Management
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - integrationIds
 *               - disconnectOptions
 *             properties:
 *               integrationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Array of integration IDs to disconnect
 *               disconnectOptions:
 *                 $ref: '#/components/schemas/IIntegrationDisconnectRequest'
 *     responses:
 *       200:
 *         description: Bulk disconnect completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IIntegrationBulkDisconnectApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.post(
  '/bulk-disconnect',
  [
    ...roleHrAdminOnlyMiddleware,
    validateRequest(IntegrationCommonValidators.bulkDisconnect),
  ],
  integrationCommonController.bulkDisconnectIntegrations
);

/**
 * @openapi
 * /client/integrations/common/disconnect-preview/{integrationId}:
 *   get:
 *     summary: Get disconnect preview
 *     description: Previews what data would be affected by disconnecting an integration
 *     tags:
 *       - Integration Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the integration
 *     responses:
 *       200:
 *         description: Disconnect preview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IIntegrationDisconnectPreviewApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Integration not found
 */
router.get(
  '/disconnect-preview/:integrationId',
  [
    ...roleHrAdminOnlyMiddleware,
    validateRequest(IntegrationCommonValidators.disconnectPreview),
  ],
  integrationCommonController.getDisconnectPreview
);

export default router;
