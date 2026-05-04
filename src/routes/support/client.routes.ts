import { Router } from 'express';
import { SupportClientController } from '@/controllers/support/client.controller';
import { SupportClientService } from '@/services/support/client.service';
import {
  requireAuth,
  validateRequest,
  requireUserType,
  requireRole,
} from '@/middleware';
import {
  supportClientUpdateValidator,
  supportClientIdValidator,
  supportClientListValidator,
} from '@/shared/validators/support/client.validator';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';
import { clientUserListValidator } from '@/shared/validators/client/user.validator';
import {
  clientJobPostingIdValidator,
  clientJobPostingListValidator,
} from '@/shared/validators/client/job.posting.validator';
import { clientUserInvitationListValidator } from '@/shared/validators/client/user.invitation.validator';
import { ClientSubscriptionService } from '@/services/client/subscription.service';
import { ClientProfileService } from '@/services/client/profile.service';
import { PaymentFactory } from '@/services/subscription/payment.factory';
import { NodemailerProvider } from '@/services/notification/nodemailer.service';

const router = Router();

// Initialize services and controller
const notificationProvider = new NodemailerProvider();
const subscriptionService = new ClientSubscriptionService(
  new PaymentFactory(),
  notificationProvider
);
const clientProfileService = new ClientProfileService();
const supportClientService = new SupportClientService(
  notificationProvider,
  subscriptionService,
  clientProfileService
);
const supportClientController = new SupportClientController(
  supportClientService
);

// Support auth middleware - applies to all routes
const supportAuthMiddleware = [
  requireAuth,
  requireRole([
    UserRoleEnum.ADMIN,
    UserRoleEnum.RECRUITER,
    UserRoleEnum.ACCOUNT_MANAGER,
    UserRoleEnum.TECHNICAL_SUPPORT,
  ]),
  requireUserType([UserTypeEnum.SUPPORT]),
];

// Admin-only MCP key management middleware
const supportMcpKeyAdminMiddleware = [
  requireAuth,
  requireRole([UserRoleEnum.ADMIN, UserRoleEnum.TECHNICAL_SUPPORT]),
  requireUserType([UserTypeEnum.SUPPORT]),
];

/**
 * @openapi
 * /support/clients:
 *   get:
 *     summary: List support clients with filtering and pagination
 *     tags:
 *       - Support Clients
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortBy'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortOrder'
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *         description: Search term for client name or email
 *       - in: query
 *         name: companyId
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by company ID
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, SUSPENDED]
 *         description: Filter by client status
 *       - in: query
 *         name: industry
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by company industry
 *       - in: query
 *         name: size
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by company size
 *       - in: query
 *         name: hasFinancialData
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Filter by whether client has financial data
 *       - in: query
 *         name: hasSubscription
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Filter by whether client has active subscription
 *       - in: query
 *         name: createdAfter
 *         required: false
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by creation date (after)
 *       - in: query
 *         name: createdBefore
 *         required: false
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by creation date (before)
 *     responses:
 *       200:
 *         description: List of support clients
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportClientListApiResponse'
 *       400:
 *         description: Bad request - Invalid parameters
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get(
  '/',
  ...supportAuthMiddleware,
  validateRequest(supportClientListValidator),
  supportClientController.listSupportClients
);

/**
 * @openapi
 * /support/clients/{supportClientId}:
 *   get:
 *     summary: Get support client details by ID
 *     tags:
 *       - Support Clients
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: supportClientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the client
 *     responses:
 *       200:
 *         description: Client details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportClientGetApiResponse'
 *       400:
 *         description: Bad request - Invalid parameters
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Not found - Client not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:supportClientId',
  ...supportAuthMiddleware,
  validateRequest(supportClientIdValidator),
  supportClientController.getSupportClient
);

/**
 * @openapi
 * /support/clients/{supportClientId}:
 *   patch:
 *     summary: Update support client
 *     tags:
 *       - Support Clients
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: supportClientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the client
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ISupportClientUpdate'
 *     responses:
 *       200:
 *         description: Client updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportClientUpdateApiResponse'
 *       400:
 *         description: Bad request - Invalid parameters
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Not found - Client not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  '/:supportClientId',
  ...supportAuthMiddleware,
  validateRequest(supportClientUpdateValidator),
  supportClientController.updateSupportClient
);

/**
 * @openapi
 * /support/clients/{supportClientId}:
 *   delete:
 *     summary: Delete support client
 *     tags:
 *       - Support  Clients
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: supportClientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the client
 *     responses:
 *       200:
 *         description: Client deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportClientDeleteApiResponse'
 *       400:
 *         description: Bad request - Invalid parameters
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Not found - Client not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  '/:supportClientId',
  ...supportAuthMiddleware,
  validateRequest(supportClientIdValidator),
  supportClientController.deleteSupportClient
);

/**
 * @openapi
 * /support/clients/{supportClientId}/job-postings:
 *   get:
 *     summary: List client job postings
 *     tags:
 *       - Support  Clients
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: supportClientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the client
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *         description: Search in job titles
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by job posting status
 *       - in: query
 *         name: industry
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by industry
 *     responses:
 *       200:
 *         description: List of client job postings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientJobPostingListApiResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Not found - Client not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:supportClientId/job-postings',
  ...supportAuthMiddleware,
  validateRequest(clientJobPostingListValidator),
  supportClientController.listSupportClientJobPostings
);

/**
 * @openapi
 * /support/clients/job-postings/{jobPostingId}:
 *   get:
 *     summary: Get a job posting by ID
 *     tags:
 *       - Support Clients
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobPostingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the job posting
 *     responses:
 *       200:
 *         description: Job posting details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportClientJobPostingByIdApiResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Not found - Job posting not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/job-postings/:jobPostingId',
  ...supportAuthMiddleware,
  validateRequest(clientJobPostingIdValidator),
  supportClientController.getSupportClientJobPostingById
);

/**
 * @openapi
 * /support/clients/{supportClientId}/users:
 *   get:
 *     summary: List client users
 *     tags:
 *       - Support  Clients
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: supportClientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the client
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *         description: Search in user names or emails
 *       - in: query
 *         name: role
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by user role
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by user status
 *     responses:
 *       200:
 *         description: List of client users
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientUserListApiResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Not found - Client not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:supportClientId/users',
  ...supportAuthMiddleware,
  validateRequest(clientUserListValidator),
  supportClientController.listSupportClientUsers
);

/**
 * @openapi
 * /support/clients/{supportClientId}/invitations:
 *   get:
 *     summary: List client user invitations
 *     tags:
 *       - Support  Clients
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: supportClientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the client
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *         description: Search in invitation emails or names
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by invitation status
 *     responses:
 *       200:
 *         description: List of client invitations
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientUserInvitationListApiResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Not found - Client not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:supportClientId/invitations',
  ...supportAuthMiddleware,
  validateRequest(clientUserInvitationListValidator),
  supportClientController.listSupportClientInvitations
);

/**
 * @openapi
 * /support/clients/account-manager/clients:
 *   get:
 *     summary: List clients assigned to account manager
 *     tags:
 *       - Support  Clients
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *         description: Search in client names or emails
 *       - in: query
 *         name: companyId
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by company ID
 *       - in: query
 *         name: industry
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by industry
 *     responses:
 *       200:
 *         description: List of clients assigned to account manager
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportClientListApiResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */

router.get(
  '/account-manager/clients',
  ...supportAuthMiddleware,
  validateRequest(supportClientListValidator),
  supportClientController.getClientsByAccountManagerId
);

/**
 * @openapi
 * /support/clients/integration-providers/{integrationProviderId}:
 *   get:
 *     summary: Get integration provider details by ID
 *     tags:
 *       - Support  Clients
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: integrationProviderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the integration provider
 *     responses:
 *       200:
 *         description: Integration provider details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 type:
 *                   type: string
 *                 isActive:
 *                   type: boolean
 *                 clientIntegrations:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Bad request - Invalid parameters
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Not found - Integration provider not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/integration-providers/:integrationProviderId',
  ...supportAuthMiddleware,
  supportClientController.getIntegrationProviderDetails
);

/**
 * @openapi
 * /support/clients/{supportClientId}/integrations:
 *   get:
 *     summary: Get client integrations by client ID
 *     tags:
 *       - Support  Clients
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: supportClientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the client
 *     responses:
 *       200:
 *         description: List of client integrations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   clientId:
 *                     type: string
 *                     format: uuid
 *                   integrationProviderId:
 *                     type: string
 *                     format: uuid
 *                   integrationProviderName:
 *                     type: string
 *                   integrationProviderType:
 *                     type: string
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   status:
 *                     type: string
 *                   config:
 *                     type: object
 *                   autoSyncEnabled:
 *                     type: boolean
 *                   lastSyncAt:
 *                     type: string
 *                     format: date-time
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       400:
 *         description: Bad request - Invalid parameters
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Not found - Client not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:supportClientId/integrations',
  ...supportAuthMiddleware,
  supportClientController.getClientIntegrations
);

/**
 * @openapi
 * /support/clients/{supportClientId}/mcp-key:
 *   post:
 *     summary: Generate or rotate the primary MCP API key for a client
 *     description: Creates (or rotates) a support-managed MCP API key for the specified client tenant. The returned API key is only shown once—store it securely.
 *     tags:
 *       - Support Clients
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: supportClientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the client
 *     responses:
 *       200:
 *         description: MCP key generated/rotated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportClientGenerateMcpKeyApiResponse'
 *       400:
 *         description: Bad request - Invalid parameters
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Not found - Client not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/:supportClientId/mcp-key',
  ...supportMcpKeyAdminMiddleware,
  validateRequest(supportClientIdValidator),
  supportClientController.generateMcpKeyForClient
);

export default router;
