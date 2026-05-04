import { Router } from 'express';
import { ClientUserInvitationController } from '@/controllers/client/user.invitation.controller';
import { ClientUserInvitationService } from '@/services/client/user.invitation.service';
import { NotificationFactory } from '@/services/notification/notification.factory';
import {
  requireAuth,
  requireActiveUser,
  requireRole,
  validateRequest,
  requireUserType,
} from '@/middleware';
import {
  clientUserInvitationSendValidator,
  invitationIdValidator,
  clientUserInvitationListValidator,
  clientUserInvitationAcceptValidator,
} from '@/shared/validators/client/user.invitation.validator';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';
import { ClientSubscriptionService } from '@/services/client/subscription.service';
import { PaymentFactory } from '@/services/subscription/payment.factory';
import { ClientUserProfileService } from '@/services/client/user.profile.service';
import { StorageFactory } from '@/services/helpers/storage/storage.factory';
import { NodemailerProvider } from '@/services/notification/nodemailer.service';

const router = Router();

// Initialize services
const notificationProvider =
  new NotificationFactory().getNotificationProvider();
const nodemailerProvider = new NodemailerProvider();
const subscriptionService = new ClientSubscriptionService(
  new PaymentFactory(),
  nodemailerProvider
);
const clientUserProfileService = new ClientUserProfileService(
  StorageFactory.getInstance().getProvider()
);
const clientUserInvitationService = new ClientUserInvitationService(
  notificationProvider,
  subscriptionService,
  clientUserProfileService
);

// Initialize controller
const clientUserInvitationController = new ClientUserInvitationController(
  clientUserInvitationService
);

/**
 * @openapi
 * /client/user-invitations/accept/{token}:
 *   post:
 *     summary: Accept a client user invitation
 *     description: Allows a user to accept an invitation to join a client organization
 *     tags:
 *       - Client User Invitations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IClientUserInvitationAcceptParams'
 *     responses:
 *       200:
 *         description: Invitation accepted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientUserInvitationAcceptApiResponse'
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Invitation not found
 */
router.post(
  '/accept/:token',
  validateRequest(clientUserInvitationAcceptValidator),
  clientUserInvitationController.acceptInvitation
);

// Client auth middleware - applies to all profile routes
const clientAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.CLIENT]),
];

// Admin-only middleware - applies to all update routes
const roleHrAdminOnlyMiddleware = [
  ...clientAuthMiddleware,
  requireRole([UserRoleEnum.HR, UserRoleEnum.ADMIN]),
];

/**
 * @openapi
 * /client/user-invitations:
 *   post:
 *     summary: Send a client user invitation
 *     description: Allows client admins or HR to send invitations to users to join their organization
 *     tags:
 *       - Client User Invitations
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientUserInvitationSend'
 *     responses:
 *       201:
 *         description: Invitation sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientUserInvitationSendApiResponse'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.post(
  '/',
  [
    ...roleHrAdminOnlyMiddleware,
    validateRequest(clientUserInvitationSendValidator),
  ],
  clientUserInvitationController.sendInvitation
);

/**
 * @openapi
 * /client/user-invitations/{clientUserInvitationId}:
 *   get:
 *     summary: Get a client user invitation
 *     description: Retrieves details of a specific client user invitation
 *     tags:
 *       - Client User Invitations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IInvitationIdParams'
 *     responses:
 *       200:
 *         description: Invitation details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientUserInvitationGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 */
router.get(
  '/:clientUserInvitationId',
  [...roleHrAdminOnlyMiddleware, validateRequest(invitationIdValidator)],
  clientUserInvitationController.getInvitation
);

/**
 * @openapi
 * /client/user-invitations/{clientUserInvitationId}:
 *   delete:
 *     summary: Withdraw a client user invitation
 *     description: Allows client admins or HR to withdraw an invitation sent to a user
 *     tags:
 *       - Client User Invitations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IInvitationIdParams'
 *     responses:
 *       200:
 *         description: Invitation withdrawn successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientUserInvitationWithdrawApiResponse'
 */
router.delete(
  '/:clientUserInvitationId',
  [...roleHrAdminOnlyMiddleware, validateRequest(invitationIdValidator)],
  clientUserInvitationController.withdrawInvitation
);

/**
 * @openapi
 * /client/user-invitations/{clientUserInvitationId}/resend:
 *   post:
 *     summary: Resend a client user invitation
 *     description: Allows client admins or HR to resend an invitation to a user
 *     tags:
 *       - Client User Invitations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IInvitationIdParams'
 *     responses:
 *       200:
 *         description: Invitation resent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientUserInvitationResendApiResponse'
 */
router.post(
  '/:clientUserInvitationId/resend',
  [...roleHrAdminOnlyMiddleware, validateRequest(invitationIdValidator)],
  clientUserInvitationController.resendInvitation
);

/**
 * @openapi
 * /client/user-invitations:
 *   get:
 *     summary: List client user invitations
 *     description: Get a paginated list of all client user invitations with comprehensive filtering, searching, and sorting capabilities
 *     tags:
 *       - Client User Invitations
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
 *         description: Filter by invitation email (partial match)
 *         example: "john@example.com"
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by invitee name (partial match)
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
 *         description: Filter by invitation role (single value or comma-separated list)
 *         example: "ADMIN,USER"
 *       - in: query
 *         name: status
 *         schema:
 *           oneOf:
 *             - $ref: '#/components/schemas/ClientUserInvitationStatusEnum'
 *             - type: array
 *               items:
 *                 $ref: '#/components/schemas/ClientUserInvitationStatusEnum'
 *         description: Filter by invitation status (single value or comma-separated list)
 *         example: "PENDING,ACCEPTED"
 *       - in: query
 *         name: createdAfter
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by creation date after this date
 *       - in: query
 *         name: createdBefore
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by creation date before this date
 *     responses:
 *       200:
 *         description: List of client user invitations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientUserInvitationListApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get(
  '/',
  [
    ...roleHrAdminOnlyMiddleware,
    validateRequest(clientUserInvitationListValidator),
  ],
  clientUserInvitationController.listInvitations
);

export default router;
