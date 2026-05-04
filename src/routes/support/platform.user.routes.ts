import { Router } from 'express';
import { PlatformUserController } from '@/controllers/support/platform.user.controller';
import { PlatformUserService } from '@/services/support/platform.user.service';
import {
  requireAuth,
  requireActiveUser,
  requireRole,
  requireUserType,
  validateRequest,
} from '@/middleware';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';
import {
  platformUserIdParamsValidator,
  platformUserEmailQueryValidator,
  platformUserDeleteQueryValidator,
} from '@/shared/validators/support/platform.user.validator';

const router = Router();

const platformUserService = new PlatformUserService();
const platformUserController = new PlatformUserController(platformUserService);

const supportAdminOnlyMiddleware = [
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.SUPPORT]),
  requireRole([UserRoleEnum.ADMIN]),
];

/**
 * @openapi
 * /support/platform-users/by-email:
 *   delete:
 *     summary: Delete platform user by email
 *     description: |
 *       Permanently delete a platform user by email (support admin only).
 *       Use when e.g. an invited user accidentally self-signed up with the wrong account type,
 *       so the invite link is useless and the client can re-invite after deletion.
 *     tags:
 *       - Support
 *       - Platform Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       403:
 *         description: Forbidden - Cannot delete self or support users
 *       404:
 *         description: User not found
 *       409:
 *         description: User has dependent data and cannot be deleted
 */
router.delete(
  '/by-email',
  supportAdminOnlyMiddleware,
  validateRequest(platformUserEmailQueryValidator),
  platformUserController.deleteUserByEmail
);

/**
 * @openapi
 * /support/platform-users/{userId}:
 *   delete:
 *     summary: Delete platform user by ID
 *     description: |
 *       Permanently delete a platform user by ID (support admin only).
 *       Use when e.g. an invited user accidentally self-signed up with the wrong account type.
 *     tags:
 *       - Support
 *       - Platform Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       403:
 *         description: Forbidden - Cannot delete self or support users
 *       404:
 *         description: User not found
 *       409:
 *         description: User has dependent data and cannot be deleted
 */
router.delete(
  '/:userId',
  supportAdminOnlyMiddleware,
  validateRequest(
    platformUserIdParamsValidator.merge(platformUserDeleteQueryValidator)
  ),
  platformUserController.deleteUserById
);

export default router;
