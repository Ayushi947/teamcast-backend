import { Router } from 'express';
import multer from 'multer';
import { SupportTicketController } from '@/controllers/support-ticket/support-ticket.controller';
import { SupportTicketService } from '@/services/support-ticket/support-ticket.service';
import {
  requireAuth,
  validateRequest,
  requireRole,
  requireUserType,
  requireActiveUser,
} from '@/middleware';
import {
  createTicketValidation,
  updateTicketValidation,
  assignTicketValidation,
  changeStatusValidation,
  escalateTicketValidation,
  addRatingValidation,
  changePriorityValidation,
  addTicketCommentValidation,
} from '@/shared/validators/support-ticket/support-ticket.validator';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';

const router = Router();
const supportTicketService = new SupportTicketService();
const supportTicketController = new SupportTicketController(
  supportTicketService
);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 5, // Maximum 5 files per request
  },
});

// Auth middleware - applies to all routes
const authMiddleware = [requireAuth];

// Admin-only middleware for sensitive operations
const adminOnlyMiddleware = [
  ...authMiddleware,
  requireRole([UserRoleEnum.ADMIN, UserRoleEnum.TECHNICAL_SUPPORT]),
];

const supportMiddleware = [
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.SUPPORT]),
];

/**
 * @openapi
 * tags:
 *   name: Support Tickets
 *   description: Support ticket management endpoints
 */

/**
 * @openapi
 * /support-tickets:
 *   post:
 *     summary: Create a new support ticket
 *     tags:
 *       - Support Tickets
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - ticketType
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the support ticket
 *                 example: "Login issue with mobile app"
 *               description:
 *                 type: string
 *                 description: Detailed description of the issue
 *               category:
 *                 $ref: '#/components/schemas/SupportTicketCategoryEnum'
 *                 description: Category of support ticket (optional)
 *                 example: "TECHNICAL"
 *               subcategory:
 *                 $ref: '#/components/schemas/SupportClientTicketSubcategoryEnum'
 *                 description: Subcategory of support ticket
 *                 example: "JOB_POSTING_CREATE"
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: Due date for the ticket
 *               isBacklog:
 *                 type: string
 *                 enum: ["true", "false"]
 *                 description: Whether the ticket is in backlog
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Files to attach to the ticket (max 5 files, 10MB each)
 *     responses:
 *       201:
 *         description: Support ticket created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Support ticket created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ISupportTicket'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
  '/',
  ...authMiddleware,
  upload.array('attachments', 5),
  validateRequest(createTicketValidation),
  supportTicketController.createTicket
);

/**
 * @openapi
 * /support-tickets:
 *   get:
 *     summary: List support tickets with filtering, sorting, and pagination
 *     tags:
 *       - Support Tickets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - name: filters[status]
 *         in: query
 *         description: Filter by ticket status
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SupportTicketStatusEnum'
 *       - name: filters[priority]
 *         in: query
 *         description: Filter by ticket priority
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SupportTicketPriorityEnum'
 *       - name: filters[category]
 *         in: query
 *         description: Filter by ticket category
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SupportTicketCategoryEnum'
 *       - name: filters[ticketType]
 *         in: query
 *         description: Filter by ticket type
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SupportTicketTypeEnum'
 *       - name: filters[entityType]
 *         in: query
 *         description: Filter by entity type
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SupportTicketEntityTypeEnum'
 *       - name: filters[createdById]
 *         in: query
 *         description: Filter by creator ID
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: filters[assignedUserId]
 *         in: query
 *         description: Filter by assigned user ID
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: filters[targetId]
 *         in: query
 *         description: Filter by target ID
 *         schema:
 *           type: string
 *       - name: filters[targetType]
 *         in: query
 *         description: Filter by target type
 *         schema:
 *           type: string
 *       - name: filters[tags]
 *         in: query
 *         description: Filter by tags
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *       - name: filters[isSlaBreach]
 *         in: query
 *         description: Filter by SLA breach status
 *         schema:
 *           type: boolean
 *       - name: filters[isBacklog]
 *         in: query
 *         description: Filter by backlog status
 *         schema:
 *           type: boolean
 *       - name: filters[isDeleted]
 *         in: query
 *         description: Filter by deletion status
 *         schema:
 *           type: boolean
 *       - name: filters[createdFrom]
 *         in: query
 *         description: Filter tickets created from this date
 *         schema:
 *           type: string
 *           format: date-time
 *       - name: filters[createdTo]
 *         in: query
 *         description: Filter tickets created until this date
 *         schema:
 *           type: string
 *           format: date-time
 *       - name: filters[dueFrom]
 *         in: query
 *         description: Filter tickets due from this date
 *         schema:
 *           type: string
 *           format: date-time
 *       - name: filters[dueTo]
 *         in: query
 *         description: Filter tickets due until this date
 *         schema:
 *           type: string
 *           format: date-time
 *       - name: filters[search]
 *         in: query
 *         description: Search in title and description
 *         schema:
 *           type: string
 *       - name: sort[field]
 *         in: query
 *         description: Field to sort by
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, priority, status, title, ticketNumber, dueDate]
 *           default: createdAt
 *       - name: sort[direction]
 *         in: query
 *         description: Sort direction
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Support tickets retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Support tickets retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ISupportTicket'
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     total:
 *                       type: integer
 *                       example: 150
 *                     totalPages:
 *                       type: integer
 *                       example: 8
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', ...authMiddleware, supportTicketController.listTickets);

/**
 * @openapi
 * /support-tickets/statistics:
 *   get:
 *     summary: Get comprehensive support ticket statistics
 *     description: Retrieve detailed statistics for support tickets across all entity types with filtering options
 *     tags:
 *       - Support Tickets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: entityType
 *         in: query
 *         schema:
 *           type: string
 *           enum: [CLIENT, CANDIDATE, PARTNER, SUPPORT]
 *         description: Filter by entity type
 *       - name: category
 *         in: query
 *         schema:
 *           type: string
 *           enum: [TECHNICAL, BILLING, ACCOUNT, FEATURE, BUG, GENERAL, INTEGRATION, SECURITY]
 *         description: Filter by ticket category
 *       - name: priority
 *         in: query
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, URGENT, CRITICAL]
 *         description: Filter by priority level
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [OPEN, ASSIGNED, IN_PROGRESS, PENDING, RESOLVED, CLOSED, CANCELLED, REOPENED]
 *         description: Filter by ticket status
 *       - name: assignedUserId
 *         in: query
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by assigned user ID
 *       - name: createdById
 *         in: query
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by ticket creator ID
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter tickets created after this date
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter tickets created before this date
 *       - name: entityId
 *         in: query
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by specific entity ID
 *     responses:
 *       200:
 *         description: Support ticket statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Support ticket statistics retrieved successfully"
 *                 data:
 *                   type: object
 *                   description: Comprehensive support ticket statistics
 *                   properties:
 *                     overview:
 *                       type: object
 *                       description: High-level statistics overview
 *                       properties:
 *                         totalTickets:
 *                           type: number
 *                         openTickets:
 *                           type: number
 *                         inProgressTickets:
 *                           type: number
 *                         resolvedTickets:
 *                           type: number
 *                         closedTickets:
 *                           type: number
 *                         overDueTickets:
 *                           type: number
 *                         unassignedTickets:
 *                           type: number
 *                         highPriorityTickets:
 *                           type: number
 *                         averageResolutionTime:
 *                           type: number
 *                         averageResponseTime:
 *                           type: number
 *                         totalEntityTypes:
 *                           type: number
 *                         satisfactionScore:
 *                           type: number
 *                         escalationRate:
 *                           type: number
 *                     entityTypeBreakdown:
 *                       type: object
 *                       description: Breakdown by entity types
 *                     statusBreakdown:
 *                       type: object
 *                       description: Breakdown by status
 *                     priorityBreakdown:
 *                       type: object
 *                       description: Breakdown by priority
 *                     categoryBreakdown:
 *                       type: object
 *                       description: Breakdown by category
 *                     assignmentBreakdown:
 *                       type: object
 *                       description: Assignment breakdown
 *                     performanceMetrics:
 *                       type: object
 *                       description: Performance metrics
 *                     slaMetrics:
 *                       type: object
 *                       description: SLA metrics
 *                     trends:
 *                       type: object
 *                       description: Trend analysis
 *                     timeDistribution:
 *                       type: object
 *                       description: Time distribution analysis
 *       400:
 *         description: Bad request - Invalid filter parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid filter parameters"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions to view statistics
 *       500:
 *         description: Internal server error
 */
router.get(
  '/statistics',
  ...adminOnlyMiddleware,
  supportTicketController.getTicketStatistics
);

/**
 * @openapi
 * /support-tickets/{id}:
 *   get:
 *     summary: Get a support ticket by ID
 *     tags:
 *       - Support Tickets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Support ticket ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Support ticket retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Support ticket retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/ISupportTicket'
 *       404:
 *         description: Support ticket not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/:id', ...authMiddleware, supportTicketController.getTicketById);

/**
 * @openapi
 * /support-tickets/{id}/comments:
 *   get:
 *     summary: Get comments for a support ticket
 *     tags:
 *       - Support Tickets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Support ticket ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Ticket comments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Comments retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ISupportTicketComment'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Support ticket not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:id/comments',
  ...authMiddleware,
  supportTicketController.getTicketComments
);

/**
 * @openapi
 * /support-tickets/{id}/comments:
 *   post:
 *     summary: Add a comment to a support ticket
 *     tags:
 *       - Support Tickets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Support ticket ID
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ISupportTicketCommentCreateRequest'
 *     responses:
 *       200:
 *         description: Comment added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Comment added successfully"
 *                 data:
 *                   $ref: '#/components/schemas/ISupportTicketComment'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Support ticket not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/:id/comments',
  ...authMiddleware,
  validateRequest(addTicketCommentValidation),
  supportTicketController.addTicketComment
);

/**
 * @openapi
 * /support-tickets/created-by/{userId}:
 *   get:
 *     summary: Get all tickets for a specific user
 *     description: Get a list of all tickets for a specific user with filtering and pagination
 *     tags:
 *       - Support Tickets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         description: ID of the user to get tickets for
 *         schema:
 *           type: string
 *           format: uuid
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortBy'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortOrder'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSearch'
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
 *       - in: query
 *         name: dueFrom
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter tickets due from this date
 *       - in: query
 *         name: dueTo
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter tickets due until this date
 *       - in: query
 *         name: isSlaBreach
 *         schema:
 *           type: boolean
 *         description: Filter by SLA breach status
 *       - in: query
 *         name: isBacklog
 *         schema:
 *           type: boolean
 *         description: Filter by backlog status
 *     responses:
 *       200:
 *         description: Successfully retrieved user tickets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User tickets retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ISupportTicket'
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     total:
 *                       type: integer
 *                       example: 45
 *                     totalPages:
 *                       type: integer
 *                       example: 3
 *       400:
 *         description: Bad request - Invalid request parameters
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
  '/created-by/:userId',
  [requireAuth],
  supportTicketController.getTicketsByUserId
);

/**
 * @openapi
 * /support-tickets/assigned-to/{assignedUserId}:
 *   get:
 *     summary: Get all tickets assigned to a specific support user
 *     description: Get a list of all tickets assigned to a specific support user with filtering and pagination
 *     tags:
 *       - Support Tickets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: assignedUserId
 *         in: path
 *         required: true
 *         description: ID of the support user to get assigned tickets for
 *         schema:
 *           type: string
 *           format: uuid
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortBy'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortOrder'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSearch'
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
 *         name: createdById
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by creator user ID
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
 *       - in: query
 *         name: dueFrom
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter tickets due from this date
 *       - in: query
 *         name: dueTo
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter tickets due until this date
 *       - in: query
 *         name: isSlaBreach
 *         schema:
 *           type: boolean
 *         description: Filter by SLA breach status
 *       - in: query
 *         name: isBacklog
 *         schema:
 *           type: boolean
 *         description: Filter by backlog status
 *     responses:
 *       200:
 *         description: Successfully retrieved assigned tickets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Assigned tickets retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ISupportTicket'
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     total:
 *                       type: integer
 *                       example: 45
 *                     totalPages:
 *                       type: integer
 *                       example: 3
 *       400:
 *         description: Bad request - Invalid request parameters
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Support user not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/assigned-to/:assignedUserId',
  [requireAuth],
  supportTicketController.getTicketsAssignedToUserId
);

/**
 * @openapi
 * /support-tickets/{id}:
 *   put:
 *     summary: Update a support ticket
 *     tags:
 *       - Support Tickets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Support ticket ID
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SupportTicketUpdateData'
 *     responses:
 *       200:
 *         description: Support ticket updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Support ticket updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/ISupportTicket'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Support ticket not found
 *       500:
 *         description: Internal server error
 */
router.put(
  '/:id',
  ...authMiddleware,
  validateRequest(updateTicketValidation),
  supportTicketController.updateTicket
);

/**
 * @openapi
 * /support-tickets/{id}:
 *   delete:
 *     summary: Delete a support ticket
 *     tags:
 *       - Support Tickets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Support ticket ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Support ticket deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Support ticket deleted successfully"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Support ticket not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  '/:id',
  ...adminOnlyMiddleware,
  supportTicketController.deleteTicket
);

/**
 * @openapi
 * /support-tickets/{id}/assign:
 *   patch:
 *     summary: Assign a support ticket to a user
 *     tags:
 *       - Support Tickets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Support ticket ID
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assignedUserId
 *             properties:
 *               assignedUserId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the user to assign the ticket to
 *               assignmentNote:
 *                 type: string
 *                 description: Note explaining why the ticket was assigned/reassigned
 *                 example: "Assigned to technical team due to complex integration issue"
 *     responses:
 *       200:
 *         description: Support ticket assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Support ticket assigned successfully"
 *                 data:
 *                   $ref: '#/components/schemas/ISupportTicket'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Support ticket not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  '/:id/assign',
  ...authMiddleware,
  requireRole([UserRoleEnum.ADMIN, UserRoleEnum.ACCOUNT_MANAGER]),
  validateRequest(assignTicketValidation),
  supportTicketController.assignTicket
);

/**
 * @openapi
 * /support-tickets/{id}/status:
 *   patch:
 *     summary: Change support ticket status
 *     tags:
 *       - Support Tickets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Support ticket ID
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 $ref: '#/components/schemas/SupportTicketStatusEnum'
 *                 description: New status for the ticket
 *               reason:
 *                 type: string
 *                 description: Reason for status change
 *     responses:
 *       200:
 *         description: Support ticket status changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Support ticket status changed successfully"
 *                 data:
 *                   $ref: '#/components/schemas/ISupportTicket'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Support ticket not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  '/:id/status',
  ...authMiddleware,
  requireRole([UserRoleEnum.ADMIN, UserRoleEnum.ACCOUNT_MANAGER]),
  validateRequest(changeStatusValidation),
  supportTicketController.changeStatus
);

/**
 * @openapi
 * /support-tickets/{id}/priority:
 *   patch:
 *     summary: Change support ticket priority
 *     tags:
 *       - Support Tickets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Support ticket ID
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - priority
 *             properties:
 *               priority:
 *                 $ref: '#/components/schemas/SupportTicketPriorityEnum'
 *                 description: New priority for the ticket
 *     responses:
 *       200:
 *         description: Support ticket priority changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Support ticket priority changed successfully"
 *                 data:
 *                   $ref: '#/components/schemas/ISupportTicket'
 */
router.patch(
  '/:id/priority',
  ...authMiddleware,
  requireRole([UserRoleEnum.ADMIN, UserRoleEnum.ACCOUNT_MANAGER]),
  validateRequest(changePriorityValidation),
  supportTicketController.changePriority
);

/**
 * @openapi
 * /support-tickets/{id}/escalate:
 *   post:
 *     summary: Escalate a support ticket
 *     tags:
 *       - Support Tickets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Support ticket ID
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - escalatedToUserId
 *               - escalationReason
 *             properties:
 *               escalatedToUserId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the user to escalate to
 *               escalationReason:
 *                 $ref: '#/components/schemas/SupportTicketEscalationReasonEnum'
 *                 description: Reason for escalation
 *     responses:
 *       200:
 *         description: Support ticket escalated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Support ticket escalated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/ISupportTicket'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Support ticket not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/:id/escalate',
  ...adminOnlyMiddleware,
  validateRequest(escalateTicketValidation),
  supportTicketController.escalateTicket
);

/**
 * @openapi
 * /support-tickets/{id}/rating:
 *   post:
 *     summary: Add customer rating and feedback
 *     tags:
 *       - Support Tickets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Support ticket ID
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Customer rating (1-5)
 *               feedback:
 *                 type: string
 *                 description: Customer feedback
 *     responses:
 *       200:
 *         description: Customer rating added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Customer rating added successfully"
 *                 data:
 *                   $ref: '#/components/schemas/ISupportTicket'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Support ticket not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/:id/rating',
  ...authMiddleware,
  validateRequest(addRatingValidation),
  supportTicketController.addCustomerRating
);

// RCA Routes
/**
 * @openapi
 * /support-tickets/{id}/rca:
 *   post:
 *     summary: Add Root Cause Analysis (RCA) to a support ticket
 *     description: Add detailed root cause analysis including contributing factors and preventive measures
 *     tags:
 *       - Support Tickets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Support ticket ID
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data
 *             properties:
 *               data:
 *                 $ref: '#/components/schemas/ISupportTicketRcaRequest'
 *     responses:
 *       200:
 *         description: Root Cause Analysis added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Root Cause Analysis added successfully"
 *                 data:
 *                   $ref: '#/components/schemas/ISupportTicketRcaResponse'
 *       400:
 *         description: Bad request - Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid input data"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Only support users can add RCA
 *       404:
 *         description: Support ticket not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/:id/rca',
  ...supportMiddleware,
  supportTicketController.addRootCauseAnalysis
);

/**
 * @openapi
 * /support-tickets/{id}/rca:
 *   put:
 *     summary: Update Root Cause Analysis (RCA) for a support ticket
 *     description: Update existing root cause analysis with new information
 *     tags:
 *       - Support Tickets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Support ticket ID
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data
 *             properties:
 *               data:
 *                 $ref: '#/components/schemas/ISupportTicketRcaRequest'
 *     responses:
 *       200:
 *         description: Root Cause Analysis updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Root Cause Analysis updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/ISupportTicketRcaResponse'
 *       400:
 *         description: Bad request - Invalid input data
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Only RCA creator or admin can update
 *       404:
 *         description: Support ticket not found
 *       500:
 *         description: Internal server error
 */
router.put(
  '/:id/rca',
  ...supportMiddleware,
  supportTicketController.updateRootCauseAnalysis
);

/**
 * @openapi
 * /support-tickets/{id}/rca:
 *   get:
 *     summary: Get Root Cause Analysis (RCA) for a support ticket
 *     description: Retrieve the root cause analysis details for a specific support ticket
 *     tags:
 *       - Support Tickets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Support ticket ID
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Root Cause Analysis retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Root Cause Analysis retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/ISupportTicketRcaResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       404:
 *         description: Support ticket or RCA not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:id/rca',
  ...supportMiddleware,
  supportTicketController.getRootCauseAnalysis
);

// Resolution Routes
/**
 * @openapi
 * /support-tickets/{id}/resolution:
 *   post:
 *     summary: Add resolution notes to a support ticket
 *     description: Add detailed resolution notes explaining how the issue was resolved
 *     tags:
 *       - Support Tickets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Support ticket ID
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data
 *             properties:
 *               data:
 *                 $ref: '#/components/schemas/ISupportTicketResolutionRequest'
 *     responses:
 *       200:
 *         description: Resolution notes added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Resolution notes added successfully"
 *                 data:
 *                   $ref: '#/components/schemas/ISupportTicketResolutionResponse'
 *       400:
 *         description: Bad request - Invalid input data
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Only support users can add resolution notes
 *       404:
 *         description: Support ticket not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/:id/resolution',
  ...supportMiddleware,
  supportTicketController.addResolutionNotes
);

/**
 * @openapi
 * /support-tickets/{id}/resolution:
 *   put:
 *     summary: Update resolution notes for a support ticket
 *     description: Update existing resolution notes with additional information
 *     tags:
 *       - Support Tickets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Support ticket ID
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data
 *             properties:
 *               data:
 *                 $ref: '#/components/schemas/ISupportTicketResolutionRequest'
 *     responses:
 *       200:
 *         description: Resolution notes updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Resolution notes updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/ISupportTicketResolutionResponse'
 *       400:
 *         description: Bad request - Invalid input data
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Only assigned support user or admin can update
 *       404:
 *         description: Support ticket not found
 *       500:
 *         description: Internal server error
 */
router.put(
  '/:id/resolution',
  ...supportMiddleware,
  supportTicketController.updateResolutionNotes
);

/**
 * @openapi
 * /support-tickets/{id}/resolution:
 *   get:
 *     summary: Get resolution notes for a support ticket
 *     description: Retrieve the resolution notes for a specific support ticket
 *     tags:
 *       - Support Tickets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Support ticket ID
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Resolution notes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Resolution notes retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/ISupportTicketResolutionResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       404:
 *         description: Support ticket or resolution notes not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:id/resolution',
  ...authMiddleware,
  supportTicketController.getResolutionNotes
);

export default router;
