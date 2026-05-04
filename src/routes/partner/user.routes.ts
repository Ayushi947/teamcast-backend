import { PartnerUserController } from '@/controllers/partner/user.controller';
import { PartnerUserService } from '@/services/partner/user.service';
import { NotificationFactory } from '@/services/notification/notification.factory';
import {
  requireActiveUser,
  requireAuth,
  requireRole,
  requireUserType,
  validateRequest,
} from '@/middleware';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';
import {
  partnerUserActivateDeactivateValidator,
  partnerUserCreateValidator,
  partnerUserIdValidator,
  partnerUserListValidator,
  partnerUserUpdateValidator,
} from '@/shared/validators/partner/user.validator';
import { Router } from 'express';

const router = Router();

// Initialize services
const notificationProvider =
  new NotificationFactory().getNotificationProvider();
const partnerUserService = new PartnerUserService(notificationProvider);

// Initialize controller
const partnerUserController = new PartnerUserController(partnerUserService);

const partnerAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.PARTNER]),
];

const roleAdminOnlyMiddleware = [
  ...partnerAuthMiddleware,
  requireRole([UserRoleEnum.ADMIN]),
];

/**
 * @openapi
 * /partner/users:
 *   post:
 *     summary: Create partner user
 *     description: Create a new user for the partner organization (Admin only)
 *     tags:
 *       - Partner Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IPartnerUserCreate'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerUserCreateApiResponse'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */

router.post(
  '/',
  [...roleAdminOnlyMiddleware, validateRequest(partnerUserCreateValidator)],
  partnerUserController.createPartnerUser
);

/**
 * @openapi
 * /partner/users:
 *   get:
 *     summary: List partner users
 *     description: Get a paginated list of all partner users with comprehensive filtering, searching, and sorting capabilities (Admin only)
 *     tags:
 *       - Partner Users
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
 *         name: hasProfilePicture
 *         schema:
 *           type: boolean
 *         description: Filter by whether user has a profile picture
 *         example: true
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
 *         description: List of partner users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerUserListApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */

router.get(
  '/',
  [...roleAdminOnlyMiddleware, validateRequest(partnerUserListValidator)],
  partnerUserController.listPartnerUsers
);

/**
 * @openapi
 * /partner/users/{partnerUserId}:
 *   get:
 *     summary: Get partner user
 *     description: Get a partner user by ID (Admin only)
 *     tags:
 *       - Partner Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IPartnerUserIdParams'
 *     responses:
 *       200:
 *         description: Partner user retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerUserGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Partner user not found
 */

router.get(
  '/:partnerUserId',
  [...roleAdminOnlyMiddleware, validateRequest(partnerUserIdValidator)],
  partnerUserController.getPartnerUser
);

/**
 * @openapi
 * /partner/users/{partnerUserId}/status:
 *   patch:
 *     summary: Activate/Deactivate partner user
 *     description: Activate or deactivate a partner user (Admin only)
 *     tags:
 *       - Partner Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IPartnerUserIdParams'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IPartnerUserActivateDeactivate'
 *     responses:
 *       200:
 *         description: Partner user status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerUserActivateDeactivateApiResponse'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */

router.patch(
  '/:partnerUserId/status',
  [
    ...roleAdminOnlyMiddleware,
    validateRequest(partnerUserActivateDeactivateValidator),
  ],
  partnerUserController.activateDeactivatePartnerUser
);

/**
 * @openapi
 * /partner/users/{partnerUserId}:
 *   patch:
 *     summary: Update partner user
 *     description: Update a partner user (Admin only)
 *     tags:
 *       - Partner Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IPartnerUserIdParams'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IPartnerUserUpdate'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerUserUpdateApiResponse'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */

router.patch(
  '/:partnerUserId',
  [...roleAdminOnlyMiddleware, validateRequest(partnerUserUpdateValidator)],
  partnerUserController.updatePartnerUser
);

/**
 * @openapi
 * /partner/users/{partnerUserId}:
 *   delete:
 *     summary: Delete partner user
 *     description: Delete a partner user (Admin only)
 *     tags:
 *       - Partner Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IPartnerUserIdParams'
 *     responses:
 *       200:
 *         description: Partner user deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerUserDeleteApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Partner user not found
 */

router.delete(
  '/:partnerUserId',
  [...roleAdminOnlyMiddleware, validateRequest(partnerUserIdValidator)],
  partnerUserController.deletePartnerUser
);

export default router;
