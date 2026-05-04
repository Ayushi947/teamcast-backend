import { Router } from 'express';
import { SupportTicketActivityController } from '@/controllers/support-ticket/support-ticket-activity.controller';
import { requireAuth, requireUserType, requireRole } from '@/middleware';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';

const router = Router();
const supportTicketActivityController = new SupportTicketActivityController();

// Support admin auth middleware - applies to all routes
const supportAdminAuthMiddleware = [
  requireAuth,
  requireUserType([UserTypeEnum.SUPPORT]),
  requireRole([
    UserRoleEnum.ADMIN,
    UserRoleEnum.ACCOUNT_MANAGER,
    UserRoleEnum.TECHNICAL_SUPPORT,
  ]),
];

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketActivityLogsResponse:
 *       type: object
 *       properties:
 *         logs:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ISupportTicketAuditLog'
 *         pagination:
 *           $ref: '#/components/schemas/IPaginationResponse'
 *     SupportTicketActivitySummaryResponse:
 *       type: object
 *       properties:
 *         totalActions:
 *           type: number
 *         actionsByType:
 *           type: object
 *           additionalProperties:
 *             type: number
 *         actionsByUser:
 *           type: object
 *           additionalProperties:
 *             type: number
 *         actionsByField:
 *           type: object
 *           additionalProperties:
 *             type: number
 *         recentActivity:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ISupportTicketAuditLog'
 *         topUsers:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               name:
 *                 type: string
 *               actionCount:
 *                 type: number
 *         topActions:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *               count:
 *                 type: number
 *         timeline:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *               count:
 *                 type: number
 */

/**
 * @openapi
 * /support-tickets/{ticketId}/activity-logs:
 *   get:
 *     summary: Get activity logs for a specific ticket
 *     description: Retrieve activity logs for a specific support ticket with filtering and pagination
 *     tags:
 *       - Support Ticket Activity
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the ticket
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - in: query
 *         name: action
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         style: form
 *         explode: true
 *         description: Filter by action types
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         style: form
 *         explode: true
 *         description: Filter by entity types
 *       - in: query
 *         name: performedById
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by user who performed the action
 *       - in: query
 *         name: createdFrom
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by creation date from
 *       - in: query
 *         name: createdTo
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by creation date to
 *     responses:
 *       200:
 *         description: Activity logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SupportTicketActivityLogsResponse'
 *       400:
 *         description: Bad request - Invalid request body
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:ticketId/activity-logs',
  requireAuth,
  supportTicketActivityController.getTicketActivityLogs
);

/**
 * @openapi
 * /support-tickets/activity-logs:
 *   get:
 *     summary: Get all activity logs with comprehensive filtering
 *     description: Retrieve all activity logs across all tickets with advanced filtering, sorting, and pagination
 *     tags:
 *       - Support Ticket Activity
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortBy'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortOrder'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSearch'
 *       - in: query
 *         name: ticketId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by specific ticket ID
 *       - in: query
 *         name: action
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         style: form
 *         explode: true
 *         description: Filter by action types
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         style: form
 *         explode: true
 *         description: Filter by entity types
 *       - in: query
 *         name: performedById
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by user who performed the action
 *       - in: query
 *         name: fieldChanged
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         style: form
 *         explode: true
 *         description: Filter by fields that were changed
 *       - in: query
 *         name: createdFrom
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by creation date from
 *       - in: query
 *         name: createdTo
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by creation date to
 *     responses:
 *       200:
 *         description: Activity logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SupportTicketActivityLogsResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get(
  '/activity-logs',
  supportAdminAuthMiddleware,
  supportTicketActivityController.getAllActivityLogs
);

/**
 * @openapi
 * /support-tickets/activity-summary:
 *   get:
 *     summary: Get activity summary for support admin dashboard
 *     description: Retrieve aggregated activity statistics and summary data for the support admin dashboard
 *     tags:
 *       - Support Ticket Activity
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by date from
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by date to
 *       - in: query
 *         name: performedById
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by user who performed the action
 *       - in: query
 *         name: action
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         style: form
 *         explode: true
 *         description: Filter by action types
 *     responses:
 *       200:
 *         description: Activity summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SupportTicketActivitySummaryResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get(
  '/activity-summary',
  supportAdminAuthMiddleware,
  supportTicketActivityController.getActivitySummary
);

/**
 * @openapi
 * /support-tickets/users/{userId}/activity-logs:
 *   get:
 *     summary: Get user activity logs
 *     description: Retrieve activity logs for a specific user with summary statistics
 *     tags:
 *       - Support Ticket Activity
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the user
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - in: query
 *         name: action
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         style: form
 *         explode: true
 *         description: Filter by action types
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         style: form
 *         explode: true
 *         description: Filter by entity types
 *       - in: query
 *         name: createdFrom
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by creation date from
 *       - in: query
 *         name: createdTo
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by creation date to
 *     responses:
 *       200:
 *         description: User activity logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ISupportTicketAuditLog'
 *                 pagination:
 *                   $ref: '#/components/schemas/IPaginationResponse'
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalActions:
 *                       type: number
 *                     actionsByType:
 *                       type: object
 *                       additionalProperties:
 *                         type: number
 *                     actionsByField:
 *                       type: object
 *                       additionalProperties:
 *                         type: number
 *                     recentActivity:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ISupportTicketAuditLog'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get(
  '/users/:userId/activity-logs',
  supportAdminAuthMiddleware,
  supportTicketActivityController.getUserActivityLogs
);

export default router;
