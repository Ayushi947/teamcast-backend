import { Router } from 'express';
import { IndeedController } from '@/controllers/integration/jobboard/indeed/indeed.controller';
import { IndeedService } from '@/services/integration/jobboard/indeed/indeed.service';
import {
  requireAuth,
  requireActiveUser,
  requireRole,
  requireUserType,
} from '@/middleware';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';
import { validateRequest } from '@/middleware';
import {
  indeedInitiateValidator,
  indeedCallbackValidator,
  indeedJobPublishValidator,
  indeedJobUpdateValidator,
  indeedJobDeleteValidator,
  indeedCandidateImportValidator,
  indeedRefreshTokenValidator,
  indeedTestConnectionValidator,
} from '@/shared/validators/integration/jobboard/indeed.validator';

const router = Router();

// Initialize service and controller
const indeedService = new IndeedService();
const indeedController = new IndeedController(indeedService);

// Client auth middleware - applies to all Indeed integration routes
const clientAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.CLIENT]),
];

// Admin-only middleware - applies to management routes
const roleHrAdminOnlyMiddleware = [
  ...clientAuthMiddleware,
  requireRole([UserRoleEnum.HR, UserRoleEnum.ADMIN]),
];

/**
 * @openapi
 * /client/integrations/indeed/initiate:
 *   post:
 *     summary: Initiate Indeed integration
 *     description: Creates a client integration and generates OAuth authorization URL for Indeed integration setup
 *     tags:
 *       - Indeed Integration
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               integrationName:
 *                 type: string
 *                 description: Optional name for the integration
 *                 example: "Indeed Integration"
 *     responses:
 *       200:
 *         description: Integration initiated and OAuth URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Integration initiated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     clientIntegrationId:
 *                       type: string
 *                       format: uuid
 *                       description: ID of the created client integration
 *                     authUrl:
 *                       type: string
 *                       description: OAuth authorization URL
 *                     state:
 *                       type: string
 *                       description: State parameter for OAuth security
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       400:
 *         description: Client already has an active Indeed integration
 */
router.post(
  '/initiate',
  roleHrAdminOnlyMiddleware,
  validateRequest(indeedInitiateValidator),
  indeedController.initiateIntegration
);

/**
 * @openapi
 * /client/integrations/indeed/callback:
 *   get:
 *     summary: Handle OAuth callback from Indeed
 *     description: Processes OAuth callback and exchanges authorization code for tokens
 *     tags:
 *       - Indeed Integration
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Authorization code from Indeed
 *       - in: query
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *         description: State parameter for security
 *       - in: query
 *         name: error
 *         required: false
 *         schema:
 *           type: string
 *         description: Error from OAuth provider
 *     responses:
 *       200:
 *         description: OAuth callback handled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "OAuth callback handled successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     clientIntegrationId:
 *                       type: string
 *                       format: uuid
 *                       description: ID of the activated client integration
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                         refreshToken:
 *                           type: string
 *                         expiresIn:
 *                           type: number
 *       400:
 *         description: Invalid OAuth parameters
 *       404:
 *         description: Integration not found for the provided state
 */
router.get(
  '/callback',
  validateRequest(indeedCallbackValidator),
  indeedController.handleCallback
);

/**
 * @openapi
 * /client/integrations/{clientIntegrationId}/indeed/refresh-token:
 *   post:
 *     summary: Refresh Indeed access token
 *     description: Refreshes the access token using the refresh token
 *     tags:
 *       - Indeed Integration
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
 *         description: Access token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IIndeedRefreshTokenApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Client integration not found
 */
router.post(
  '/:clientIntegrationId/refresh-token',
  roleHrAdminOnlyMiddleware,
  validateRequest(indeedRefreshTokenValidator),
  indeedController.refreshToken
);

/**
 * @openapi
 * /client/integrations/{clientIntegrationId}/indeed/jobs/{jobPostingId}/publish:
 *   post:
 *     summary: Publish job to Indeed
 *     description: Publishes a job posting to Indeed job board
 *     tags:
 *       - Indeed Integration
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
 *       - in: path
 *         name: jobPostingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the job posting
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IJobPostingPublish'
 *     responses:
 *       200:
 *         description: Job published to Indeed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IIndeedJobPublishApiResponse'
 *       400:
 *         description: Invalid job data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Client integration or job posting not found
 */
router.post(
  '/:clientIntegrationId/jobs/:jobPostingId/publish',
  roleHrAdminOnlyMiddleware,
  validateRequest(indeedJobPublishValidator),
  indeedController.publishJob
);

/**
 * @openapi
 * /client/integrations/{clientIntegrationId}/indeed/jobs/{jobPostingId}:
 *   put:
 *     summary: Update job on Indeed
 *     description: Updates an existing job posting on Indeed
 *     tags:
 *       - Indeed Integration
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
 *       - in: path
 *         name: jobPostingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the job posting
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               location:
 *                 type: string
 *               company:
 *                 type: string
 *               requirements:
 *                 type: array
 *                 items:
 *                   type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               salaryMin:
 *                 type: number
 *               salaryMax:
 *                 type: number
 *               employmentType:
 *                 type: string
 *               workLocation:
 *                 type: string
 *               applicationUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Job updated on Indeed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IIndeedJobUpdateApiResponse'
 *       400:
 *         description: Invalid job data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job posting integration not found
 */
router.put(
  '/:clientIntegrationId/jobs/:jobPostingId',
  roleHrAdminOnlyMiddleware,
  validateRequest(indeedJobUpdateValidator),
  indeedController.updateJob
);

/**
 * @openapi
 * /client/integrations/{clientIntegrationId}/indeed/jobs/{jobPostingId}:
 *   delete:
 *     summary: Delete job from Indeed
 *     description: Deletes a job posting from Indeed
 *     tags:
 *       - Indeed Integration
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
 *       - in: path
 *         name: jobPostingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the job posting
 *     responses:
 *       200:
 *         description: Job deleted from Indeed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IIndeedJobDeleteApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job posting integration not found
 */
router.delete(
  '/:clientIntegrationId/jobs/:jobPostingId',
  roleHrAdminOnlyMiddleware,
  validateRequest(indeedJobDeleteValidator),
  indeedController.deleteJob
);

/**
 * @openapi
 * /client/integrations/{clientIntegrationId}/indeed/candidates/{jobPostingIntegrationId}/import:
 *   post:
 *     summary: Import candidates from Indeed
 *     description: Imports candidates who applied to a job on Indeed
 *     tags:
 *       - Indeed Integration
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
 *       - in: path
 *         name: jobPostingIntegrationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the job posting integration
 *     responses:
 *       200:
 *         description: Candidates imported from Indeed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IIndeedCandidateImportApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job posting integration not found
 */
router.post(
  '/:clientIntegrationId/candidates/:jobPostingIntegrationId/import',
  roleHrAdminOnlyMiddleware,
  validateRequest(indeedCandidateImportValidator),
  indeedController.importCandidates
);

/**
 * @openapi
 * /client/integrations/{clientIntegrationId}/indeed/test-connection:
 *   post:
 *     summary: Test connection to Indeed
 *     description: Tests the connection to Indeed API using stored credentials
 *     tags:
 *       - Indeed Integration
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
 *         description: Connection test completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IIndeedTestConnectionApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Client integration not found
 */
router.post(
  '/:clientIntegrationId/test-connection',
  roleHrAdminOnlyMiddleware,
  validateRequest(indeedTestConnectionValidator),
  indeedController.testConnection
);

export default router;
