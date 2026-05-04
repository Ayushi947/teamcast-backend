import { Router } from 'express';
import multer from 'multer';
import { CandidateSupportTicketController } from '@/controllers/support-ticket/candidate-support-ticket.controller';
import { requireAuth, requireUserType } from '@/middleware/auth.middleware';
import { UserTypeEnum } from '@/shared/models/common/enums';
import { validateRequest } from '@/middleware';
import { candidateSupportTicketListValidator } from '@/shared/validators/support-ticket/candidate-support-ticket.validator';

const router = Router();
const candidateSupportTicketController = new CandidateSupportTicketController();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 10, // Maximum 10 files per request
  },
});

const candidateMiddleWare = [
  requireAuth,
  requireUserType([UserTypeEnum.CANDIDATE]),
];

/**
 * @openapi
 * /support-tickets/candidates/{candidateId}/tickets:
 *   post:
 *     summary: Create a new support ticket for a candidate
 *     description: Creates a new support ticket for a candidate with optional file attachments
 *     tags:
 *       - Candidate Support Tickets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: candidateId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the candidate creating the ticket
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - data
 *             properties:
 *               data:
 *                 type: string
 *                 description: JSON string containing ticket data
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Optional files to attach to the ticket
 *     responses:
 *       201:
 *         description: Support ticket created successfully
 *       400:
 *         description: Bad request - invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - user not authorized for this candidate
 *       404:
 *         description: Candidate not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/:candidateId/tickets',
  candidateMiddleWare,
  upload.array('attachments', 5),
  candidateSupportTicketController.createCandidateSupportTicket.bind(
    candidateSupportTicketController
  )
);

/**
 * @openapi
 * /support-tickets/candidates/{candidateId}/tickets:
 *   get:
 *     summary: Get support tickets for a candidate
 *     description: Retrieves a paginated list of support tickets for a specific candidate
 *     tags:
 *       - Candidate Support Tickets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: candidateId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the candidate
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - in: query
 *         name: status
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SupportTicketStatusEnum'
 *         style: form
 *         explode: true
 *         description: Filter by ticket status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SupportTicketPriorityEnum'
 *         style: form
 *         explode: true
 *         description: Filter by ticket priority
 *       - in: query
 *         name: category
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SupportTicketCategoryEnum'
 *         style: form
 *         explode: true
 *         description: Filter by ticket category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in ticket titles and descriptions
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
 *         description: Support tickets retrieved successfully
 *       400:
 *         description: Bad request - invalid query parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - user not authorized for this candidate
 *       404:
 *         description: Candidate not found
 *       500:
 *         description: Internal server error
 */
router.get(
  ' /:candidateId/tickets',
  candidateMiddleWare,
  validateRequest(candidateSupportTicketListValidator),
  candidateSupportTicketController.getCandidateSupportTickets.bind(
    candidateSupportTicketController
  )
);

export default router;
