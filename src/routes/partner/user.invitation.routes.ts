import { Router } from 'express';
import { PartnerUserInvitationController } from '@/controllers/partner/user.invitation.controller';
import { PartnerUserInvitationService } from '@/services/partner/user.invitation.service';
import {
  requireAuth,
  requireActiveUser,
  requireRole,
  validateRequest,
  requireUserType,
} from '@/middleware';
import {
  partnerUserInvitationSendValidator,
  partnerInvitationIdValidator,
  partnerUserInvitationListValidator,
  partnerUserInvitationAcceptValidator,
} from '@/shared/validators/partner/user.invitation.validator';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';

const router = Router();

// Initialize services
const partnerUserInvitationService = new PartnerUserInvitationService();

// Initialize controller
const partnerUserInvitationController = new PartnerUserInvitationController(
  partnerUserInvitationService
);

/**
 * @openapi
 * /partner/user-invitations:
 *   post:
 *     summary: Send a partner user invitation
 *     description: Allows partner admins or HR to send invitations to users to join their organization
 *     tags:
 *       - Partner User Invitations
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IPartnerUserInvitationSend'
 *     responses:
 *       201:
 *         description: Invitation sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerUserInvitationSendApiResponse'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */

// Partner auth middleware - applies to all invitation routes
const partnerAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.PARTNER]),
];

// HR/Admin middleware - applies to invitation management routes
const roleHrAdminOnlyMiddleware = [
  ...partnerAuthMiddleware,
  requireRole([UserRoleEnum.HR, UserRoleEnum.ADMIN]),
];

router.post(
  '/',
  [
    ...roleHrAdminOnlyMiddleware,
    validateRequest(partnerUserInvitationSendValidator),
  ],
  partnerUserInvitationController.sendInvitation
);

/**
 * @openapi
 * /partner/user-invitations:
 *   get:
 *     summary: List partner user invitations
 *     description: Get a paginated list of all partner user invitations with comprehensive filtering, searching, and sorting capabilities
 *     tags:
 *       - Partner User Invitations
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
 *             - $ref: '#/components/schemas/PartnerUserInvitationStatusEnum'
 *             - type: array
 *               items:
 *                 $ref: '#/components/schemas/PartnerUserInvitationStatusEnum'
 *         description: Filter by invitation status (single value or comma-separated list)
 *         example: "PENDING,ACCEPTED"
 *       - in: query
 *         name: invitedAfter
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by invitation date after this date
 *         example: "2024-01-01T00:00:00Z"
 *       - in: query
 *         name: invitedBefore
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by invitation date before this date
 *         example: "2024-12-31T23:59:59Z"
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
 *         description: List of partner user invitations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerUserInvitationListApiResponse'
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
    validateRequest(partnerUserInvitationListValidator),
  ],
  partnerUserInvitationController.listInvitations
);

/**
 * @openapi
 * /partner/user-invitations/{partnerUserInvitationId}:
 *   get:
 *     summary: Get partner user invitation
 *     description: Get a specific partner user invitation by ID
 *     tags:
 *       - Partner User Invitations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IPartnerInvitationIdParams'
 *     responses:
 *       200:
 *         description: Invitation retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerUserInvitationGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Invitation not found
 */
router.get(
  '/:partnerUserInvitationId',
  [...roleHrAdminOnlyMiddleware, validateRequest(partnerInvitationIdValidator)],
  partnerUserInvitationController.getInvitation
);

/**
 * @openapi
 * /partner/user-invitations/{partnerUserInvitationId}/withdraw:
 *   patch:
 *     summary: Withdraw partner user invitation
 *     description: Withdraw a pending partner user invitation
 *     tags:
 *       - Partner User Invitations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IPartnerInvitationIdParams'
 *     responses:
 *       200:
 *         description: Invitation withdrawn successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerUserInvitationWithdrawApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Invitation not found
 */
router.patch(
  '/:partnerUserInvitationId/withdraw',
  [...roleHrAdminOnlyMiddleware, validateRequest(partnerInvitationIdValidator)],
  partnerUserInvitationController.withdrawInvitation
);

/**
 * @openapi
 * /partner/user-invitations/{partnerUserInvitationId}/resend:
 *   post:
 *     summary: Resend partner user invitation
 *     description: Resend a partner user invitation email
 *     tags:
 *       - Partner User Invitations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IPartnerInvitationIdParams'
 *     responses:
 *       200:
 *         description: Invitation resent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerUserInvitationResendApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Invitation not found
 */
router.post(
  '/:partnerUserInvitationId/resend',
  [...roleHrAdminOnlyMiddleware, validateRequest(partnerInvitationIdValidator)],
  partnerUserInvitationController.resendInvitation
);

/**
 * @openapi
 * /partner/user-invitations/accept/{token}:
 *   post:
 *     summary: Accept partner user invitation
 *     description: Accept a partner user invitation using a token (public endpoint)
 *     tags:
 *       - Partner User Invitations
 *     parameters:
 *       - $ref: '#/components/parameters/IPartnerUserInvitationAcceptParams'
 *     responses:
 *       200:
 *         description: Invitation accepted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerUserInvitationAcceptApiResponse'
 *       400:
 *         description: Invalid token or invitation expired
 *       404:
 *         description: Invitation not found
 */
router.post(
  '/accept/:token',
  [validateRequest(partnerUserInvitationAcceptValidator)],
  partnerUserInvitationController.acceptInvitation
);

export default router;
