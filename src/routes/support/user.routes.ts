import { Router } from 'express';
import { SupportUserController } from '@/controllers/support/user.controller';
import { SupportUserService } from '@/services/support/user.service';
import { NotificationFactory } from '@/services/notification/notification.factory';
import {
  requireAuth,
  requireActiveUser,
  requireRole,
  validateRequest,
  requireUserType,
} from '@/middleware';
import {
  supportUserUpdateValidator,
  supportUserIdValidator,
  supportUserListValidator,
  supportUserActivateDeactivateValidator,
  supportUserChangePasswordValidator,
} from '@/shared/validators/support/user.validator';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';
import { StorageFactory } from '@/services/helpers/storage/storage.factory';
import multer from 'multer';

const router = Router();

// Initialize services and controller
const notificationProvider =
  new NotificationFactory().getNotificationProvider();
const supportUserService = new SupportUserService(
  notificationProvider,
  StorageFactory.getInstance().getProvider()
);
const supportUserController = new SupportUserController(supportUserService);

// Configure multer for file uploads with memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for profile photos
  },
});

// All routes require authentication and active user
router.use(
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.SUPPORT])
);

// Support auth middleware - applies to all profile routes
const supportAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.SUPPORT]),
];

const roleAdminOnlyMiddleware = [
  ...supportAuthMiddleware,
  requireRole([
    UserRoleEnum.ADMIN,
    UserRoleEnum.ACCOUNT_MANAGER,
    UserRoleEnum.TECHNICAL_SUPPORT,
  ]),
];

/**
 * @openapi
 * /support/users:
 *   get:
 *     summary: List support users
 *     description: Get a list of all support users (Admin only)
 *     tags:
 *       - Support Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortBy'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortOrder'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSearch'
 *       - $ref: '#/components/parameters/ISupportUserFilterQueryEmail'
 *       - $ref: '#/components/parameters/ISupportUserFilterQueryName'
 *       - $ref: '#/components/parameters/ISupportUserFilterQueryRole'
 *       - $ref: '#/components/parameters/ISupportUserFilterQueryStatus'
 *     responses:
 *       200:
 *         description: List of support users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportUserListApiResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get(
  '/',
  [...roleAdminOnlyMiddleware, validateRequest(supportUserListValidator)],
  supportUserController.listSupportUsers
);

/**
 * @openapi
 * /support/users/{supportUserId}:
 *   get:
 *     summary: Get support user
 *     description: Get detailed information about a specific support user by ID with comprehensive profile data
 *     tags:
 *       - Support Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ISupportUserIdParams'
 *     responses:
 *       200:
 *         description: User retrieved successfully with comprehensive information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportUserGetApiResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:supportUserId',
  validateRequest(supportUserIdValidator),
  supportUserController.getSupportUser
);

/**
 * @openapi
 * /support/users/{supportUserId}/status:
 *   patch:
 *     summary: Activate or deactivate support user
 *     description: Change the status of a support user to activate or deactivate them (Admin only)
 *     tags:
 *       - Support Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ISupportUserIdParams'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ISupportUserActivateDeactivate'
 *     responses:
 *       200:
 *         description: User status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportUserActivateDeactivateApiResponse'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.patch(
  '/:supportUserId/status',
  [
    ...roleAdminOnlyMiddleware,
    validateRequest(supportUserActivateDeactivateValidator),
  ],
  supportUserController.activateDeactivateSupportUser
);

/**
 * @openapi
 * /support/users/{supportUserId}:
 *   patch:
 *     summary: Update support user
 *     description: Update a support user's information including profile, role, and settings (Admin only)
 *     tags:
 *       - Support Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ISupportUserIdParams'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ISupportUserUpdate'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportUserUpdateApiResponse'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  '/:supportUserId',
  [...roleAdminOnlyMiddleware, validateRequest(supportUserUpdateValidator)],
  supportUserController.updateSupportUser
);

/**
 * @openapi
 * /support/users/{supportUserId}:
 *   delete:
 *     summary: Delete support user
 *     description: Soft delete a support user from the system (Admin only)
 *     tags:
 *       - Support Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ISupportUserIdParams'
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportUserDeleteApiResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  '/:supportUserId',
  [...roleAdminOnlyMiddleware, validateRequest(supportUserIdValidator)],
  supportUserController.deleteSupportUser
);

/**
 * @openapi
 * /support/users/{supportUserId}/password:
 *   patch:
 *     summary: Change support user password
 *     description: Change the password of a support user (Admin only)
 *     tags:
 *       - Support Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ISupportUserIdParams'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ISupportUserPasswordChange'
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportUserChangePasswordApiResponse'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  '/:supportUserId/password',
  [
    ...supportAuthMiddleware,
    validateRequest(supportUserChangePasswordValidator),
  ],
  supportUserController.changePassword
);

/**
 * @openapi
 * /support/users/analytics/recruiters:
 *   post:
 *     summary: Get recruiters analytics
 *     description: Get analytics for all recruiters (Admin only)
 *     tags:
 *       - Support Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ISupportUserRecruiterAnalyticsApiRequest'
 *     responses:
 *       200:
 *         description: Recruiters analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportUserRecruiterAnalyticsApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.post(
  '/analytics/recruiters',
  [...roleAdminOnlyMiddleware],
  supportUserController.getAcoountManagerRecruitersAnalytics
);

/**
 * @openapi
 * /support/users/profile/photo:
 *   post:
 *     summary: Update support user profile photo
 *     description: Update the profile photo of a support user
 *     tags:
 *       - Support Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile photo updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportUserProfilePhotoUrlApiResponse'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.post(
  '/profile/photo',
  [...supportAuthMiddleware, upload.single('file')],
  supportUserController.updateProfilePhoto
);

export default router;
