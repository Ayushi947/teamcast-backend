import { Router } from 'express';
import { ClientUserController } from '@/controllers/client/user.controller';
import { ClientUserService } from '@/services/client/user.service';
import { NotificationFactory } from '@/services/notification/notification.factory';
import {
  requireAuth,
  requireActiveUser,
  requireRole,
  validateRequest,
  requireUserType,
} from '@/middleware';
import {
  clientUserCreateValidator,
  clientUserUpdateValidator,
  clientUserIdValidator,
  clientUserListValidator,
  clientUserActivateDeactivateValidator,
} from '@/shared/validators/client/user.validator';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';
import { ClientSubscriptionService } from '@/services/client/subscription.service';
import { ClientUserInvitationService } from '@/services/client/user.invitation.service';
import { PaymentFactory } from '@/services/subscription/payment.factory';
import { StorageFactory } from '@/services/helpers/storage/storage.factory';
import { ClientUserProfileService } from '@/services/client/user.profile.service';
import { NodemailerProvider } from '@/services/notification/nodemailer.service';

const router = Router();

// Initialize services and controller
const notificationProvider =
  new NotificationFactory().getNotificationProvider();
const paymentFactory = new PaymentFactory();
const storageService = StorageFactory.getInstance().getProvider();
const nodemailerProvider = new NodemailerProvider();
const subscriptionService = new ClientSubscriptionService(
  paymentFactory,
  nodemailerProvider
);
const clientUserProfileService = new ClientUserProfileService(storageService);
const clientUserInvitationService = new ClientUserInvitationService(
  notificationProvider,
  subscriptionService,
  clientUserProfileService
);

const clientUserService = new ClientUserService(
  clientUserInvitationService,
  subscriptionService
);
const clientUserController = new ClientUserController(clientUserService);

// All routes require authentication and active user
router.use(
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.CLIENT])
);

// Client auth middleware - applies to all profile routes
const clientAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.CLIENT]),
];

const roleAdminOnlyMiddleware = [
  ...clientAuthMiddleware,
  requireRole([UserRoleEnum.ADMIN]),
];

// Admin-only middleware - applies to all update routes
const roleHrAdminOnlyMiddleware = [
  ...clientAuthMiddleware,
  requireRole([UserRoleEnum.HR, UserRoleEnum.ADMIN]),
];

/**
 * @openapi
 * /client/users:
 *   post:
 *     summary: Create client user
 *     description: Create a new user for the client organization (Admin only)
 *     tags:
 *       - Client Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientUserCreate'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientUserCreateApiResponse'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       409:
 *         description: User with this email already exists
 */
router.post(
  '/',
  [...roleAdminOnlyMiddleware, validateRequest(clientUserCreateValidator)],
  clientUserController.createClientUser
);

/**
 * @openapi
 * /client/users:
 *   get:
 *     summary: List client users
 *     description: Get a paginated list of all client users with comprehensive filtering, searching, and sorting capabilities (Admin and HR only)
 *     tags:
 *       - Client Users
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
 *         name: email
 *         schema:
 *           type: string
 *           format: email
 *         description: Filter by user email (partial match)
 *         example: "john@example.com"
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by user name (partial match)
 *         example: "John Doe"
 *       - in: query
 *         name: jobTitle
 *         schema:
 *           type: string
 *         description: Filter by job title (partial match)
 *         example: "Software Engineer"
 *       - in: query
 *         name: role
 *         schema:
 *           oneOf:
 *             - $ref: '#/components/schemas/UserRoleEnum'
 *             - type: array
 *               items:
 *                 $ref: '#/components/schemas/UserRoleEnum'
 *         description: Filter by user role (single value or comma-separated list)
 *         example: "ADMIN,USER"
 *       - in: query
 *         name: status
 *         schema:
 *           oneOf:
 *             - $ref: '#/components/schemas/UserStatusEnum'
 *             - type: array
 *               items:
 *                 $ref: '#/components/schemas/UserStatusEnum'
 *         description: Filter by user status (single value or comma-separated list)
 *         example: "ACTIVE,INACTIVE"
 *       - in: query
 *         name: createdAfter
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by creation date after this date
 *         example: "2024-01-01T00:00:00Z"
 *       - in: query
 *         name: createdBefore
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by creation date before this date
 *         example: "2024-12-31T23:59:59Z"
 *       - in: query
 *         name: updatedAfter
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by update date after this date
 *       - in: query
 *         name: updatedBefore
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by update date before this date
 *     responses:
 *       200:
 *         description: List of client users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientUserListApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get(
  '/',
  [...roleHrAdminOnlyMiddleware, validateRequest(clientUserListValidator)],
  clientUserController.listClientUsers
);

/**
 * @openapi
 * /client/users/{clientUserId}:
 *   get:
 *     summary: Get client user
 *     description: Get a client user by ID
 *     tags:
 *       - Client Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IClientUserIdParams'
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientUserGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: User not found
 */
router.get(
  '/:clientUserId',
  validateRequest(clientUserIdValidator),
  clientUserController.getClientUser
);

/**
 * @openapi
 * /client/users/{clientUserId}/status:
 *   patch:
 *     summary: Activate or deactivate client user
 *     description: Change the status of a client user to activate or deactivate them (Admin only)
 *     tags:
 *       - Client Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IClientUserIdParams'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientUserActivateDeactivate'
 *     responses:
 *       200:
 *         description: User status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientUserActivateDeactivateApiResponse'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.patch(
  '/:clientUserId/status',
  [
    ...roleAdminOnlyMiddleware,
    validateRequest(clientUserActivateDeactivateValidator),
  ],
  clientUserController.activateDeactivateClientUser
);

/**
 * @openapi
 * /client/users/{clientUserId}:
 *   patch:
 *     summary: Update client user
 *     description: Update a client user (Admin only)
 *     tags:
 *       - Client Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IClientUserIdParams'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientUserUpdate'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientUserUpdateApiResponse'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.patch(
  '/:clientUserId',
  [...roleAdminOnlyMiddleware, validateRequest(clientUserUpdateValidator)],
  clientUserController.updateClientUser
);

/**
 * @openapi
 * /client/users/{clientUserId}:
 *   delete:
 *     summary: Delete client user
 *     description: Delete a client user (Admin only)
 *     tags:
 *       - Client Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IClientUserIdParams'
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientUserDeleteApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: User not found
 */
router.delete(
  '/:clientUserId',
  [...roleAdminOnlyMiddleware, validateRequest(clientUserIdValidator)],
  clientUserController.deleteClientUser
);

export default router;
