import { Router } from 'express';
import { SupportImpersonationController } from '@/controllers/support/impersonation.controller';
import { SupportImpersonationService } from '@/services/support/impersonation.service';
import { requireAuth, requireRole, requireUserType } from '@/middleware';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';
import { NotificationFactory } from '@/services/notification/notification.factory';

const router = Router();

const notificationProvider =
  new NotificationFactory().getNotificationProvider();
const supportImpersonationService = new SupportImpersonationService(
  notificationProvider
);
const supportImpersonationController = new SupportImpersonationController(
  supportImpersonationService
);

// Middleware for support users who can impersonate (Admin, Account Manager, Technical Support, and Recruiters)
// Recruiters can only impersonate candidates, while others have broader access
const supportImpersonationAuthMiddleware = [
  requireAuth,
  requireRole([
    UserRoleEnum.ADMIN,
    UserRoleEnum.ACCOUNT_MANAGER,
    UserRoleEnum.TECHNICAL_SUPPORT,
    UserRoleEnum.RECRUITER,
  ]),
  requireUserType([UserTypeEnum.SUPPORT]),
];

// Middleware for stopping impersonation (allow impersonated users to stop their own session)
const stopImpersonationAuthMiddleware = [
  requireAuth,
  // Note: We don't require specific roles here because impersonated users should be able to stop their own session
];

/**
 * @openapi
 * /support/impersonation/start:
 *   post:
 *     summary: Start impersonation
 *     description: Start impersonating a user to access their account (Admin can impersonate any user, Account Manager can only impersonate client users, Recruiters can only impersonate candidates, Technical Support can impersonate any user)
 *     tags:
 *       - Support Impersonation
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IStartImpersonation'
 *     responses:
 *       200:
 *         description: Impersonation started successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IStartImpersonationApiResponse'
 *       400:
 *         description: Invalid request data or user is inactive
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions to impersonate
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/start',
  supportImpersonationAuthMiddleware,
  supportImpersonationController.startImpersonation
);

/**
 * @openapi
 * /support/impersonation/stop:
 *   post:
 *     summary: Stop impersonation
 *     description: End the current impersonation session and return to support user
 *     tags:
 *       - Support Impersonation
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IStopImpersonation'
 *     responses:
 *       200:
 *         description: Impersonation stopped successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IStopImpersonationApiResponse'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Impersonation session not found
 */
router.post(
  '/stop',
  stopImpersonationAuthMiddleware,
  supportImpersonationController.stopImpersonation
);

export default router;
