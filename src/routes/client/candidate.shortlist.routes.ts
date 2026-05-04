import { Router } from 'express';
import { ClientCandidateShortlistController } from '@/controllers/client/candidate.shortlist.controller';
import { ClientCandidateShortlistService } from '@/services/client/candidate.shortlist.service';
import {
  requireAuth,
  requireActiveUser,
  validateRequest,
  requireUserType,
  requireRole,
} from '@/middleware';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';
import {
  clientCandidateShortlistCreateValidator,
  clientCandidateShortlistUpdateValidator,
  clientCandidateShortlistGetValidator,
  clientCandidateShortlistListValidator,
  clientCandidateShortlistDeleteValidator,
  clientCandidateShortlistBulkUpdateValidator,
} from '@/shared/validators/client/candidate.shortlist.validator';

const router = Router();

// Initialize services and controller
const shortlistService = new ClientCandidateShortlistService();
const shortlistController = new ClientCandidateShortlistController(
  shortlistService
);

// Client auth middleware - applies to all shortlist routes
const clientAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.CLIENT]),
];

// Role-based middleware for different operations
const roleBasedMiddleware = [
  ...clientAuthMiddleware,
  requireRole([UserRoleEnum.ADMIN, UserRoleEnum.HR, UserRoleEnum.RECRUITER]),
];

/**
 * @openapi
 * /client/candidate-shortlists:
 *   post:
 *     summary: Add a candidate to shortlist
 *     tags:
 *       - Client Candidate Shortlist
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientCandidateShortlistCreate'
 *     responses:
 *       200:
 *         description: Candidate shortlist created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientCandidateShortlistCreateApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.post(
  '/',
  ...roleBasedMiddleware,
  validateRequest(clientCandidateShortlistCreateValidator),
  shortlistController.createCandidateShortlist
);

/**
 * @openapi
 * /client/candidate-shortlists:
 *   get:
 *     summary: Get list of shortlisted candidates
 *     tags:
 *       - Client Candidate Shortlist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: status
 *         in: query
 *         schema:
 *           $ref: '#/components/schemas/CandidateShortlistStatusEnum'
 *         description: Filter by shortlist status
 *       - name: jobPostingId
 *         in: query
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by job posting
 *       - name: candidateId
 *         in: query
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by specific candidate
 *       - name: shortlistedById
 *         in: query
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by who shortlisted the candidate
 *       - name: rating
 *         in: query
 *         schema:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *         description: Filter by minimum rating
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *         description: Search by candidate name or email
 *       - name: page
 *         in: query
 *         schema:
 *           type: number
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - name: limit
 *         in: query
 *         schema:
 *           type: number
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Shortlists retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientCandidateShortlistListApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get(
  '/',
  ...roleBasedMiddleware,
  validateRequest(clientCandidateShortlistListValidator),
  shortlistController.listCandidateShortlists
);

/**
 * @openapi
 * /client/candidate-shortlists/stats:
 *   get:
 *     summary: Get candidate shortlist statistics
 *     tags:
 *       - Client Candidate Shortlist
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Shortlist statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientCandidateShortlistStatsApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get(
  '/stats',
  ...roleBasedMiddleware,
  shortlistController.getCandidateShortlistStats
);

/**
 * @openapi
 * /client/candidate-shortlists/bulk:
 *   put:
 *     summary: Bulk update multiple candidate shortlist entries
 *     tags:
 *       - Client Candidate Shortlist
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientCandidateShortlistBulkUpdateApiRequest'
 *     responses:
 *       200:
 *         description: Shortlists updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientCandidateShortlistBulkUpdateApiResponse'
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.put(
  '/bulk',
  ...roleBasedMiddleware,
  validateRequest(clientCandidateShortlistBulkUpdateValidator),
  shortlistController.bulkUpdateCandidateShortlists
);

/**
 * @openapi
 * /client/candidate-shortlists/{shortlistId}:
 *   get:
 *     summary: Get a single candidate shortlist entry
 *     tags:
 *       - Client Candidate Shortlist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: shortlistId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the shortlist entry
 *     responses:
 *       200:
 *         description: Shortlist retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientCandidateShortlistGetApiResponse'
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Not Found
 */
router.get(
  '/:shortlistId',
  ...roleBasedMiddleware,
  validateRequest(clientCandidateShortlistGetValidator),
  shortlistController.getCandidateShortlist
);

/**
 * @openapi
 * /client/candidate-shortlists/{shortlistId}:
 *   patch:
 *     summary: Update a candidate shortlist entry
 *     tags:
 *       - Client Candidate Shortlist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: shortlistId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the shortlist entry
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientCandidateShortlistUpdate'
 *     responses:
 *       200:
 *         description: Shortlist updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientCandidateShortlistUpdateApiResponse'
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Not Found
 */
router.patch(
  '/:shortlistId',
  ...roleBasedMiddleware,
  validateRequest(clientCandidateShortlistUpdateValidator),
  shortlistController.updateCandidateShortlist
);

/**
 * @openapi
 * /client/candidate-shortlists/{shortlistId}:
 *   delete:
 *     summary: Remove a candidate from shortlist
 *     tags:
 *       - Client Candidate Shortlist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: shortlistId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the shortlist entry
 *     responses:
 *       200:
 *         description: Shortlist deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientCandidateShortlistDeleteApiResponse'
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Not Found
 */
router.delete(
  '/:shortlistId',
  ...roleBasedMiddleware,
  validateRequest(clientCandidateShortlistDeleteValidator),
  shortlistController.deleteCandidateShortlist
);

export default router;
