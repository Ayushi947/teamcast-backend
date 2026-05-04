import { Router } from 'express';
import { WorkableIntegrationController } from '@/controllers/integration/ats/workable/workable.integration.controller';
import { WorkableIntegrationService } from '@/services/integration/ats/workable/workable.integration.service';
import {
  requireAuth,
  requireActiveUser,
  requireRole,
  requireUserType,
  validateRequest,
} from '@/middleware';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';
import {
  workableConnectionRequestValidator,
  workableCandidateImportValidator,
  workableJobImportValidator,
  workableJobSelectionValidator,
  workableValidateConnectionValidator,
} from '@/shared/validators/integration/ats/workable/workable.integration.validator';

const router = Router();

// Initialize service and controller
const workableIntegrationService = new WorkableIntegrationService();
const workableIntegrationController = new WorkableIntegrationController(
  workableIntegrationService
);

// Client auth middleware - applies to all workable integration routes
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
 * /client/workable/connect:
 *   post:
 *     summary: Connect Workable ATS
 *     description: Creates a new Workable integration by connecting with API credentials
 *     tags:
 *       - Workable Integration
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IWorkableConnectionRequest'
 *           example:
 *             subdomain: "mycompany"
 *             apiKey: "your_workable_api_key_here"
 *             name: "Company Workable Integration"
 *             description: "Main ATS integration for candidate import"
 *     responses:
 *       201:
 *         description: Workable integration created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IWorkableConnectApiResponse'
 *             example:
 *               success: true
 *               data:
 *                 integrationId: "123e4567-e89b-12d3-a456-426614174000"
 *                 status: "ACTIVE"
 *                 message: "Workable integration created successfully"
 *                 connectionTest:
 *                   success: true
 *                   message: "Connection test successful"
 *       400:
 *         description: Invalid request or integration already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Workable provider not found
 */
router.post(
  '/connect',
  roleHrAdminOnlyMiddleware,
  validateRequest(workableConnectionRequestValidator),
  workableIntegrationController.connectWorkable
);

/**
 * @openapi
 * /client/workable/{integrationId}/validate:
 *   post:
 *     summary: Validate Workable connection
 *     description: Tests if the existing Workable integration credentials are still valid
 *     tags:
 *       - Workable Integration
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the Workable integration
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Connection validation completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IWorkableValidateApiResponse'
 *             example:
 *               success: true
 *               data:
 *                 isValid: true
 *                 message: "Connection is valid"
 *                 details:
 *                   subdomain: "mycompany"
 *                   apiEndpoint: "https://mycompany.workable.com/spi/v3"
 *       400:
 *         description: Invalid request or not a Workable integration
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Integration not found
 */
router.post(
  '/:integrationId/validate',
  roleHrAdminOnlyMiddleware,
  validateRequest(workableValidateConnectionValidator),
  workableIntegrationController.validateConnection
);

/**
 * @openapi
 * /client/workable/{integrationId}/import-candidates:
 *   post:
 *     summary: Import candidates from Workable
 *     description: Imports candidates from Workable ATS into the TeamCast platform
 *     tags:
 *       - Workable Integration
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the Workable integration
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IWorkableCandidateImportRequest'
 *           example:
 *             limit: 50
 *             offset: 0
 *             state: "active"
 *             externalJobId: "12345"
 *     responses:
 *       200:
 *         description: Candidate import completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IWorkableImportCandidatesApiResponse'
 *             example:
 *               success: true
 *               data:
 *                 success: true
 *                 message: "Import completed: 25 imported, 5 skipped, 0 errors"
 *                 importedCount: 25
 *                 skippedCount: 5
 *                 errorCount: 0
 *                 candidates: []
 *                 errors: []
 *       400:
 *         description: Invalid request or invalid credentials
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Workable integration not found
 *       500:
 *         description: Import failed
 */
router.post(
  '/:integrationId/import-candidates',
  roleHrAdminOnlyMiddleware,
  validateRequest(workableCandidateImportValidator),
  workableIntegrationController.importCandidates
);

/**
 * @openapi
 * /client/workable/{integrationId}/import-jobs:
 *   post:
 *     summary: Import jobs from Workable (Async with AI Parsing)
 *     description: |
 *       Imports job postings from Workable ATS into the TeamCast platform using AI job parsing.
 *       For sync=true, returns a task ID for tracking progress.
 *       For sync=false, returns available jobs for manual selection.
 *     tags:
 *       - Workable Integration
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the Workable integration
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *       - in: query
 *         name: async
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Whether to process jobs asynchronously (recommended for AI parsing)
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IWorkableJobImportRequest'
 *           examples:
 *             async_import:
 *               summary: Async import with AI parsing (recommended)
 *               value:
 *                 limit: 50
 *                 offset: 0
 *                 state: "published"
 *                 sync: true
 *             manual_selection:
 *               summary: Get jobs for manual selection
 *               value:
 *                 limit: 50
 *                 offset: 0
 *                 state: "published"
 *                 sync: false
 *     responses:
 *       200:
 *         description: Job import initiated or completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IWorkableImportJobsApiResponse'
 *             examples:
 *               async_import_result:
 *                 summary: Async import initiated
 *                 value:
 *                   success: true
 *                   data:
 *                     success: true
 *                     message: "Job import started with AI parsing"
 *                     taskId: "import-task-123"
 *                     isAsync: true
 *                     importedCount: 0
 *                     skippedCount: 0
 *                     errorCount: 0
 *                     jobs: []
 *                     availableJobs: []
 *                     errors: []
 *               manual_selection_result:
 *                 summary: Manual selection result
 *                 value:
 *                   success: true
 *                   data:
 *                     success: true
 *                     message: "Found 15 jobs available for selection"
 *                     importedCount: 0
 *                     skippedCount: 0
 *                     errorCount: 0
 *                     jobs: []
 *                     availableJobs: []
 *                     errors: []
 *       400:
 *         description: Invalid request or invalid credentials
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Workable integration not found
 *       500:
 *         description: Import failed
 */
router.post(
  '/:integrationId/import-jobs',
  roleHrAdminOnlyMiddleware,
  validateRequest(workableJobImportValidator),
  workableIntegrationController.importJobs
);

/**
 * @openapi
 * /client/workable/{integrationId}/import-selected-jobs:
 *   post:
 *     summary: Import selected jobs from Workable (Async with AI Parsing)
 *     description: |
 *       Imports specific job postings from Workable ATS based on selected job IDs using AI job parsing.
 *     tags:
 *       - Workable Integration
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the Workable integration
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *       - in: query
 *         name: async
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Whether to process jobs asynchronously (recommended for AI parsing)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IWorkableJobSelectionRequest'
 *           example:
 *             selectedJobIds: ["12345", "67890", "11111"]
 *     responses:
 *       200:
 *         description: Selected jobs import initiated or completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IWorkableImportSelectedJobsApiResponse'
 *             examples:
 *               async_import_result:
 *                 summary: Async import initiated
 *                 value:
 *                   success: true
 *                   data:
 *                     success: true
 *                     message: "Selected jobs import started with AI parsing"
 *                     taskId: "import-task-456"
 *                     isAsync: true
 *                     importedCount: 0
 *                     skippedCount: 0
 *                     errorCount: 0
 *                     jobs: []
 *                     errors: []
 *       400:
 *         description: Invalid request, invalid job IDs, or invalid credentials
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Workable integration not found
 *       500:
 *         description: Import failed
 */
router.post(
  '/:integrationId/import-selected-jobs',
  roleHrAdminOnlyMiddleware,
  validateRequest(workableJobSelectionValidator),
  workableIntegrationController.importSelectedJobs
);

export default router;
