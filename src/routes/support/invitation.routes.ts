import { Router } from 'express';
import { SupportInvitationController } from '@/controllers/support/invitation.controller';
import { SupportInvitationService } from '@/services/support/invitation.service';
import {
  requireAuth,
  requireActiveUser,
  requireRole,
  validateRequest,
  requireUserType,
} from '@/middleware';
import {
  supportInvitationSendValidator,
  supportInvitationIdValidator,
  supportInvitationListValidator,
  supportInvitationAcceptValidator,
  supportGenericInvitationExpireValidator,
} from '@/shared/validators/support/invitation.validator';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';

const router = Router();

// Initialize services and controller
const supportInvitationService = new SupportInvitationService();
const supportInvitationController = new SupportInvitationController(
  supportInvitationService
);

// Support auth middleware - applies to all invitation routes
const supportAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.SUPPORT]),
];

// Admin-only middleware - applies to all invitation management routes
const roleAdminOnlyMiddleware = [
  ...supportAuthMiddleware,
  requireRole([
    UserRoleEnum.ADMIN,
    UserRoleEnum.RECRUITER,
    UserRoleEnum.ACCOUNT_MANAGER,
    UserRoleEnum.HR,
  ]),
];

/**
 * @openapi
 * /support/invitations:
 *   post:
 *     summary: Send a support invitation
 *     description: Allows support admins to send invitations to candidates, clients, partners, or support users
 *     tags:
 *       - Support Invitations
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ISupportInvitationSend'
 *     responses:
 *       201:
 *         description: Invitation sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportInvitationSendApiResponse'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.post(
  '/',
  [...roleAdminOnlyMiddleware, validateRequest(supportInvitationSendValidator)],
  supportInvitationController.sendInvitation
);

/**
 * @openapi
 * /support/invitations:
 *   get:
 *     summary: List support invitations
 *     description: List all support invitations with optional filtering and pagination
 *     tags:
 *       - Support Invitations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *         description: Search term to filter invitations by email, name, or job title
 *       - name: email
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by email address
 *       - name: name
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by name
 *       - name: type
 *         in: query
 *         schema:
 *           type: string
 *           enum: [CANDIDATE, CLIENT, PARTNER, SUPPORT_USER]
 *         description: Filter by invitation type
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [PENDING, ACCEPTED, EXPIRED, WITHDRAWN, RESEND]
 *         description: Filter by invitation status
 *       - name: showYours
 *         in: query
 *         schema:
 *           type: boolean
 *         description: Filter by show yours
 *     responses:
 *       200:
 *         description: List of invitations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportInvitationListApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.get(
  '/',
  [...supportAuthMiddleware, validateRequest(supportInvitationListValidator)],
  supportInvitationController.listInvitations
);

/**
 * @openapi
 * /support/invitations/all:
 *   get:
 *     summary: List all support invitations (including accepted, excluding campaigns)
 *     description: List all support invitations with optional filtering, including ACCEPTED status but excluding campaign invitations
 *     tags:
 *       - Support Invitations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *         description: Search term to filter invitations by email, name, or job title
 *       - name: email
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by email address
 *       - name: name
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by name
 *       - name: type
 *         in: query
 *         schema:
 *           type: string
 *           enum: [CANDIDATE, CLIENT, PARTNER, SUPPORT_USER]
 *         description: Filter by invitation type
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [PENDING, ACCEPTED, EXPIRED, WITHDRAWN, RESEND]
 *         description: Filter by invitation status (including ACCEPTED)
 *       - name: showYours
 *         in: query
 *         schema:
 *           type: boolean
 *         description: Filter by show yours
 *     responses:
 *       200:
 *         description: List of all invitations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportInvitationListApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.get(
  '/all',
  [...supportAuthMiddleware, validateRequest(supportInvitationListValidator)],
  supportInvitationController.listAllInvitations
);

/**
 * @openapi
 * /support/invitations/{supportInvitationId}:
 *   get:
 *     summary: Get a specific support invitation
 *     description: Retrieve details of a specific support invitation by ID
 *     tags:
 *       - Support Invitations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: supportInvitationId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Support invitation ID
 *     responses:
 *       200:
 *         description: Invitation details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportInvitationGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Invitation not found
 */
router.get(
  '/:supportInvitationId',
  [...supportAuthMiddleware, validateRequest(supportInvitationIdValidator)],
  supportInvitationController.getInvitation
);

/**
 * @openapi
 * /support/invitations/{supportInvitationId}/withdraw:
 *   post:
 *     summary: Withdraw a support invitation
 *     description: Withdraw a pending support invitation (Admin only)
 *     tags:
 *       - Support Invitations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: supportInvitationId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Support invitation ID
 *     responses:
 *       200:
 *         description: Invitation withdrawn successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportInvitationWithdrawApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Invitation not found
 */
router.post(
  '/:supportInvitationId/withdraw',
  [...roleAdminOnlyMiddleware, validateRequest(supportInvitationIdValidator)],
  supportInvitationController.withdrawInvitation
);

/**
 * @openapi
 * /support/invitations/{supportInvitationId}/resend:
 *   post:
 *     summary: Resend a support invitation
 *     description: Resend a support invitation with a new token (Admin only)
 *     tags:
 *       - Support Invitations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: supportInvitationId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Support invitation ID
 *     responses:
 *       200:
 *         description: Invitation resent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportInvitationResendApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Invitation not found
 */
router.post(
  '/:supportInvitationId/resend',
  [...roleAdminOnlyMiddleware, validateRequest(supportInvitationIdValidator)],
  supportInvitationController.resendInvitation
);

/**
 * @openapi
 * /support/invitations/{invitationType}/expire:
 *   post:
 *     summary: Auto-expire invitations
 *     description: Automatically check all invitations of the specified type and expire only those that have actually expired based on their expiry date. No invitation ID required.
 *     tags:
 *       - Support Invitations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: invitationType
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           enum: [support, job-posting]
 *         description: Type of invitation to check and expire
 *     responses:
 *       200:
 *         description: Invitations checked and expired automatically
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportGenericInvitationExpireApiResponse'
 *       400:
 *         description: Invalid invitation type
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.post(
  '/:invitationType/expire',
  [
    ...roleAdminOnlyMiddleware,
    validateRequest(supportGenericInvitationExpireValidator),
  ],
  supportInvitationController.expireGenericInvitation
);

/**
 * @openapi
 * /support/invitations/accept/{token}:
 *   post:
 *     summary: Accept a support invitation
 *     description: Accept a support invitation using the invitation token (Public endpoint)
 *     tags:
 *       - Support Invitations
 *     parameters:
 *       - name: token
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Invitation token
 *     responses:
 *       200:
 *         description: Invitation accepted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportInvitationAcceptApiResponse'
 *       400:
 *         description: Invalid token or invitation expired
 *       404:
 *         description: Invitation not found
 */
router.post(
  '/accept/:token',
  [validateRequest(supportInvitationAcceptValidator)],
  supportInvitationController.acceptInvitation
);

/**
 * @openapi
 * /support/invitations/{supportInvitationId}/copy:
 *   post:
 *     summary: Generate a copied invitation token
 *     description: Generate a new invitation token with shorter expiry (30 minutes) for copying/sharing
 *     tags:
 *       - Support Invitations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: supportInvitationId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Support invitation ID
 *     responses:
 *       200:
 *         description: Copied invitation token generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportInvitationCopyApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Invitation not found
 */
router.post(
  '/:supportInvitationId/copy',
  [...roleAdminOnlyMiddleware, validateRequest(supportInvitationIdValidator)],
  supportInvitationController.generateCopiedInvitationToken
);

export default router;
