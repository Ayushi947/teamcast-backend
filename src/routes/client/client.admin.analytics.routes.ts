import express from 'express';
import { ClientAdminAnalyticsController } from '@/controllers/client/client.admin.analytics.controller';
import { requireAuth, requireActiveUser } from '@/middleware';
import { requireUserType } from '@/middleware/auth.middleware';
import { UserTypeEnum } from '@/shared/models/common/enums';

const router = express.Router();

/**
 * @openapi
 * tags:
 *   name: Client Admin Dashboard Analytics
 *   description: Client Admin Dashboard analytics endpoints
 */

/**
 * @openapi
 * /client/admin/analytics:
 *   get:
 *     summary: Get client admin analytics data
 *     description: Retrieves analytics data for the authenticated client
 *     tags:
 *       - Client Admin Dashboard Analytics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Client analytics data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClientAdminAnalyticsResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - User does not have access to this client
 *       500:
 *         description: Server error
 */

// Apply auth middleware to all routes
router.use(requireAuth);
router.use(requireActiveUser);
router.use(requireUserType([UserTypeEnum.CLIENT]));

// Initialize controller as a singleton
const clientAdminAnalyticsController = new ClientAdminAnalyticsController();

// GET /api/client/admin/analytics
router.get('/', (req, res) =>
  clientAdminAnalyticsController.getClientAnalytics(req, res)
);

export default router;
