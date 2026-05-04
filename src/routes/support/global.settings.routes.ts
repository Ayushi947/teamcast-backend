import { Router } from 'express';
import { GlobalSettingsController } from '@/controllers/support/global.settings.controller';
import { GlobalSettingsService } from '@/services/support/global.settings.service';
import {
  requireAuth,
  requireActiveUser,
  requireRole,
  requireUserType,
  validateRequest,
} from '@/middleware';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';
import { globalSettingsUpdateValidator } from '@/shared/validators/support/global.settings.validator';

const router = Router();

// Initialize service and controller
const globalSettingsService = new GlobalSettingsService();
const globalSettingsController = new GlobalSettingsController(
  globalSettingsService
);

// Admin-only middleware - applies to all routes
const adminAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireRole([UserRoleEnum.ADMIN]),
  requireUserType([UserTypeEnum.SUPPORT]),
];

/**
 * @openapi
 * /support/global-settings:
 *   get:
 *     summary: Get global settings
 *     description: Retrieves the global application settings (admin only)
 *     tags:
 *       - Support
 *       - Global Settings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Global settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IGlobalSettingsGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions (admin only)
 */
router.get(
  '/',
  adminAuthMiddleware,
  globalSettingsController.getGlobalSettings
);

/**
 * @openapi
 * /support/global-settings:
 *   patch:
 *     summary: Update global settings
 *     description: Updates the global application settings (admin only)
 *     tags:
 *       - Support
 *       - Global Settings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IGlobalSettingsUpdateApiRequest'
 *     responses:
 *       200:
 *         description: Global settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IGlobalSettingsUpdateApiResponse'
 *       400:
 *         description: Bad request - Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions (admin only)
 */
router.patch(
  '/',
  adminAuthMiddleware,
  validateRequest(globalSettingsUpdateValidator),
  globalSettingsController.updateGlobalSettings
);

export default router;
