import { Router } from 'express';
import multer from 'multer';
import { ClientSupportTicketController } from '../../controllers/support-ticket/client-support-ticket.controller';
import { requireAuth, requireUserType, requireActiveUser } from '@/middleware';
import { UserTypeEnum } from '@/shared/models/common/enums';
const router = Router();
const clientSupportTicketController = new ClientSupportTicketController();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 5, // Maximum 5 files per request
  },
});

const clientAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.CLIENT]),
];

/**
 * @openapi
 * tags:
 *   name: Client Support Tickets
 *   description: Client support ticket management endpoints
 */

/**
 * @openapi
 * /support-tickets/client:
 *   post:
 *     summary: Create a new support ticket for the client with file attachments
 *     tags:
 *       - Client Support Tickets
 *     security:
 *       - bearerAuth: []
 *
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
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *                 description: The title of the support ticket
 *               description:
 *                 type: string
 *                 description: The description of the support ticket
 *
 *               category:
 *                 type: string
 *                 description: The category of the support ticket
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                   description: The attachments of the support ticke
 *     responses:
 *       201:
 *         description: Support ticket created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClientSupportTicketCreateResponse'
 *       400:
 *         description: Bad request - Invalid input data or file type
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 *       403:
 *         description: Forbidden - User not associated with client
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForbiddenError'
 *       404:
 *         description: Client not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundError'
 *       413:
 *         description: File too large
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalServerError'
 */
router.post(
  '/',
  [upload.array('attachments', 5), requireAuth, ...clientAuthMiddleware],
  clientSupportTicketController.createSupportTicket.bind(
    clientSupportTicketController
  )
);

/**
 * @openapi
 * /support-tickets/client:
 *   get:
 *     summary: Get support tickets for the client
 *     tags:
 *       - Client Support Tickets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SupportTicketStatusEnum'
 *         description: Filter by ticket status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SupportTicketPriorityEnum'
 *         description: Filter by ticket priority
 *       - in: query
 *         name: category
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SupportTicketCategoryEnum'
 *         description: Filter by ticket category
 *       - in: query
 *         name: ticketType
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SupportTicketTypeEnum'
 *         description: Filter by ticket type
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title, description, and ticket number
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of tickets per page
 *     responses:
 *       200:
 *         description: Support tickets retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClientSupportTicketListResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 *       404:
 *         description: Client not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalServerError'
 */
router.get(
  '/',
  requireAuth,
  ...clientAuthMiddleware,
  clientSupportTicketController.getSupportTickets.bind(
    clientSupportTicketController
  )
);

export default router;
