import { Router } from 'express';
import { ActivityLogController } from '@/controllers/activity/activity.log.controller';
import { ActivityLogService } from '@/services/activity/activity.log.service';
import {
  activityLogCreateSchema,
  activityLogFiltersSchema,
} from '@/shared/validators/activity/activity.log.validator';
import { requireAuth, validateRequest } from '@/middleware';

const router = Router();

// Initialize service and controller
const activityLogService = new ActivityLogService();
const activityLogController = new ActivityLogController(activityLogService);

/**
 * @openapi
 * /activity:
 *   post:
 *     summary: Create an activity log
 *     description: Record a user activity for tracking and audit purposes
 *     tags:
 *       - Activity Logs
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IActivityLogCreate'
 *     responses:
 *       201:
 *         description: Activity log created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IActivityLogCreateApiResponse'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
  '/',
  requireAuth,
  validateRequest(activityLogCreateSchema),
  activityLogController.createActivityLog
);

/**
 * @openapi
 * /activity:
 *   get:
 *     summary: Get activity logs
 *     description: Retrieve activity logs with optional filtering and pagination
 *     tags:
 *       - Activity Logs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by user ID
 *       - in: query
 *         name: module
 *         schema:
 *           type: ActivityModuleEnum
 *         description: Filter by module
 *         example: candidate
 *       - in: query
 *         name: action
 *         schema:
 *           oneOf:
 *             - type: string
 *               description: Single action filter
 *               example: LOGIN
 *             - type: array
 *               items:
 *                 type: string
 *               description: Multiple actions filter
 *               example: ["LOGIN", "LOGOUT", "UPDATE_PROFILE"]
 *         description: Filter by single action or multiple actions
 *         style: form
 *         explode: true
 *       - in: query
 *         name: entityId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by entity ID
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *         description: Filter by entity type
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter logs from this date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter logs until this date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Activity logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IActivityLogGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/',
  requireAuth,
  validateRequest(activityLogFiltersSchema),
  activityLogController.getActivityLogs
);

/**
 * @openapi
 * /activity/{id}:
 *   get:
 *     summary: Get activity log by ID
 *     description: Retrieve a specific activity log by its ID
 *     tags:
 *       - Activity Logs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Activity log ID
 *     responses:
 *       200:
 *         description: Activity log retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/IApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/IActivityLog'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Activity log not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', requireAuth, activityLogController.getActivityLogById);

/**
 * @openapi
 * /activity/user/{userId}:
 *   get:
 *     summary: Get user activity logs
 *     description: Retrieve activity logs for a specific user
 *     tags:
 *       - Activity Logs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: User activity logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IActivityLogGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - can only access own logs unless admin
 *       500:
 *         description: Internal server error
 */
router.get(
  '/user/:userId',
  requireAuth,
  activityLogController.getUserActivityLogs
);

/**
 * @openapi
 * /activity/{id}:
 *   delete:
 *     summary: Delete activity log
 *     description: Delete a specific activity log (Admin only)
 *     tags:
 *       - Activity Logs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Activity log ID
 *     responses:
 *       200:
 *         description: Activity log deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/IApiResponse'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Activity log deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Activity log not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', requireAuth, activityLogController.deleteActivityLog);

export default router;
