import { Router } from 'express';
import { AccountManagerTicketController } from '@/controllers/support-ticket/account-manager-ticket.controller';
import {
  requireAuth,
  requireUserType,
  requireRole,
  validateRequest,
} from '@/middleware';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';
import {
  accountManagerTicketAssignmentValidator,
  accountManagerTicketPriorityChangeValidator,
  accountManagerTicketStatusChangeValidator,
  accountManagerTicketCommentValidator,
} from '@/shared/validators/support-ticket/account-manager-ticket.validator';

const router = Router();
const accountManagerTicketController = new AccountManagerTicketController();

// Account manager auth middleware - applies to all routes
const accountManagerAuthMiddleware = [
  requireAuth,
  requireUserType([UserTypeEnum.SUPPORT]),
  requireRole([UserRoleEnum.ACCOUNT_MANAGER]),
];

/**
 * @openapi
 * components:
 *   schemas:
 *     AccountManagerTicketListRequest:
 *       type: object
 *       properties:
 *         filters:
 *           $ref: '#/components/schemas/IAccountManagerTicketFilter'
 *         pagination:
 *           $ref: '#/components/schemas/IPaginationRequest'
 *     AccountManagerTicketAssignmentRequest:
 *       type: object
 *       required:
 *         - data
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/AccountManagerTicketAssignmentRequest'
 *     AccountManagerTicketPriorityChangeRequest:
 *       type: object
 *       required:
 *         - data
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/AccountManagerTicketPriorityChangeRequest'
 *     AccountManagerTicketCommentRequest:
 *       type: object
 *       required:
 *         - data
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/AccountManagerTicketCommentRequest'
 */

/**
 * @openapi
 * /support-tickets/account-manager:
 *   get:
 *     summary: Get all tickets for clients assigned to an account manager
 *     description: Get a list of all tickets for clients assigned to the authenticated account manager with filtering and pagination
 *     tags:
 *       - Account Manager Tickets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortBy'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortOrder'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSearch'
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by client ID
 *       - in: query
 *         name: priority
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SupportTicketPriorityEnum'
 *         style: form
 *         explode: true
 *         description: Filter by priority levels
 *       - in: query
 *         name: category
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SupportTicketCategoryEnum'
 *         style: form
 *         explode: true
 *         description: Filter by categories
 *       - in: query
 *         name: ticketType
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SupportTicketTypeEnum'
 *         style: form
 *         explode: true
 *         description: Filter by ticket types
 *       - in: query
 *         name: assignedUserId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by assigned user ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SupportTicketStatusEnum'
 *         style: form
 *         explode: true
 *         description: Filter by status
 *       - in: query
 *         name: createdFrom
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter tickets created from this date
 *       - in: query
 *         name: createdTo
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter tickets created until this date
 *     responses:
 *       200:
 *         description: Successfully retrieved account manager tickets
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AccountManagerTicketListApiResponse'
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
  '/',
  accountManagerAuthMiddleware,
  accountManagerTicketController.getAccountManagerTickets
);

/**
 * @openapi
 * /support-tickets/account-manager/assign:
 *   post:
 *     summary: Assign or reassign a ticket to a support user
 *     tags:
 *       - Account Manager Tickets
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AccountManagerTicketAssignmentRequest'
 *     responses:
 *       200:
 *         description: Successfully assigned ticket
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AccountManagerTicketAssignmentApiResponse'
 *       400:
 *         description: Bad request - Invalid request body
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.post(
  '/assign',
  [
    ...accountManagerAuthMiddleware,
    validateRequest(accountManagerTicketAssignmentValidator),
  ],
  accountManagerTicketController.assignTicket
);

/**
 * @openapi
 * /support-tickets/account-manager/priority:
 *   post:
 *     summary: Change ticket priority with internal note
 *     tags:
 *       - Account Manager Tickets
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AccountManagerTicketPriorityChangeRequest'
 *     responses:
 *       200:
 *         description: Successfully changed ticket priority
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AccountManagerTicketPriorityChangeApiResponse'
 *       400:
 *         description: Bad request - Invalid request body
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.post(
  '/priority',
  [
    ...accountManagerAuthMiddleware,
    validateRequest(accountManagerTicketPriorityChangeValidator),
  ],
  accountManagerTicketController.changeTicketPriority
);

/**
 * @openapi
 * /support-tickets/account-manager/status:
 *   post:
 *     summary: Change ticket status with internal note
 *     tags:
 *       - Account Manager Tickets
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AccountManagerTicketStatusChangeRequest'
 *     responses:
 *       200:
 *         description: Successfully changed ticket status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AccountManagerTicketStatusChangeApiResponse'
 *       400:
 *         description: Bad request - Invalid request body
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.post(
  '/status',
  [
    ...accountManagerAuthMiddleware,
    validateRequest(accountManagerTicketStatusChangeValidator),
  ],
  accountManagerTicketController.changeTicketStatus
);

/**
 * @openapi
 * /support-tickets/account-manager/comment:
 *   post:
 *     summary: Add comment to ticket
 *     tags:
 *       - Account Manager Tickets
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AccountManagerTicketCommentRequest'
 *     responses:
 *       200:
 *         description: Successfully added comment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AccountManagerTicketCommentApiResponse'
 *       400:
 *         description: Bad request - Invalid request body
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.post(
  '/comment',
  [
    ...accountManagerAuthMiddleware,
    validateRequest(accountManagerTicketCommentValidator),
  ],
  accountManagerTicketController.addTicketComment
);

/**
 * @openapi
 * /support-tickets/account-manager/statistics:
 *   get:
 *     summary: Get comprehensive ticket statistics for account manager
 *     description: Get detailed statistics and analytics for all tickets of clients assigned to the account manager, including overview metrics, breakdowns by various dimensions, performance metrics, SLA compliance, trends, and time distribution
 *     tags:
 *       - Account Manager Tickets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter statistics for specific client
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for statistics calculation (ISO 8601 format)
 *         example: "2024-01-01T00:00:00Z"
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for statistics calculation (ISO 8601 format)
 *         example: "2024-12-31T23:59:59Z"
 *       - in: query
 *         name: includeResolved
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include resolved tickets in statistics
 *       - in: query
 *         name: includeClosed
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include closed tickets in statistics
 *     responses:
 *       200:
 *         description: Successfully retrieved comprehensive ticket statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AccountManagerTicketStatisticsApiResponse'
 *             example:
 *               success: true
 *               data:
 *                 overview:
 *                   totalTickets: 150
 *                   openTickets: 25
 *                   inProgressTickets: 15
 *                   resolvedTickets: 95
 *                   closedTickets: 15
 *                   overDueTickets: 5
 *                   unassignedTickets: 8
 *                   highPriorityTickets: 12
 *                   averageResolutionTime: 24.5
 *                   averageResponseTime: 2.3
 *                   totalClients: 10
 *                   satisfactionScore: 4.2
 *                 statusBreakdown:
 *                   open: 25
 *                   assigned: 10
 *                   inProgress: 15
 *                   pending: 5
 *                   resolved: 95
 *                   closed: 15
 *                   cancelled: 3
 *                   reopened: 2
 *                 priorityBreakdown:
 *                   low: 45
 *                   medium: 65
 *                   high: 30
 *                   urgent: 8
 *                   critical: 2
 *                 categoryBreakdown:
 *                   technical: 35
 *                   billing: 25
 *                   account: 20
 *                   feature: 30
 *                   bug: 15
 *                   general: 15
 *                   integration: 8
 *                   security: 2
 *                 clientBreakdown:
 *                   totalClients: 10
 *                   clients:
 *                     - clientId: "client-1"
 *                       clientName: "Acme Corp"
 *                       totalTickets: 35
 *                       openTickets: 5
 *                       highPriorityTickets: 3
 *                       averageResolutionTime: 18.5
 *                       satisfactionScore: 4.5
 *                       lastTicketDate: "2024-01-15T10:30:00Z"
 *                 assignmentBreakdown:
 *                   unassignedTickets: 8
 *                   totalSupportUsers: 5
 *                   assignments:
 *                     - userId: "support-1"
 *                       userName: "John Support"
 *                       userEmail: "john@company.com"
 *                       totalTickets: 35
 *                       openTickets: 5
 *                       inProgressTickets: 3
 *                       resolvedTickets: 27
 *                       averageResolutionTime: 22.5
 *                       workload: "MEDIUM"
 *                 performanceMetrics:
 *                   averageFirstResponseTime: 2.3
 *                   averageResolutionTime: 24.5
 *                   medianResolutionTime: 18.0
 *                   resolutionRate: 85.5
 *                   firstCallResolutionRate: 65.2
 *                   reopenRate: 1.3
 *                   escalationRate: 5.2
 *                   customerSatisfactionScore: 4.2
 *                   totalResponseCount: 485
 *                   averageResponsesPerTicket: 3.2
 *                 slaMetrics:
 *                   totalTicketsWithSla: 120
 *                   ticketsWithinSla: 102
 *                   ticketsBreachingSla: 18
 *                   slaComplianceRate: 85.0
 *                   averageSlaBreachTime: 4.5
 *                   ticketsAtRisk: 3
 *                   slaBreakdownByPriority:
 *                     critical:
 *                       total: 2
 *                       compliant: 1
 *                       breached: 1
 *                 trends:
 *                   last7Days:
 *                     - date: "2024-01-15"
 *                       created: 5
 *                       resolved: 8
 *                       closed: 2
 *                   monthlyGrowthRate: 12.5
 *                   resolutionTrend: "IMPROVING"
 *                   averageTicketsPerDay: 3.2
 *                   peakDayOfWeek: "Tuesday"
 *                   peakHourOfDay: 10
 *                 timeDistribution:
 *                   byHour:
 *                     - hour: 9
 *                       count: 15
 *                     - hour: 10
 *                       count: 22
 *                   businessHours:
 *                     total: 120
 *                     percentage: 80.0
 *                   afterHours:
 *                     total: 30
 *                     percentage: 20.0
 *               message: "Ticket statistics retrieved successfully"
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
  '/statistics',
  accountManagerAuthMiddleware,
  accountManagerTicketController.getTicketStatistics
);

export default router;
