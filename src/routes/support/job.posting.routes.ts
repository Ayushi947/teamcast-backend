import { SupportJobPostingController } from '@/controllers/support/job.posting.controller';
import { requireActiveUser, requireAuth, requireUserType } from '@/middleware';
import { SupportJobPostingService } from '@/services/support/job.posting.service';
import { UserTypeEnum } from '@/shared/models/common/enums';
import { Router } from 'express';

const router = Router();

// Initialize services and controller
const supportJobPostingService = new SupportJobPostingService();
const supportJobPostingController = new SupportJobPostingController(
  supportJobPostingService
);

const supportAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.SUPPORT]),
];

/**
 * @openapi
 * /support/job-postings/account-manager:
 *   get:
 *     summary: Get all job postings by account manager ID
 *     description: Retrieves all job postings assigned to the account manager
 *     tags:
 *       - Support Job Postings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Job postings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportJobPostingListApiResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  '/account-manager',
  supportAuthMiddleware,
  supportJobPostingController.getJobPostingsByAccountManagerId
);

/**
 * @openapi
 * /support/job-postings:
 *   get:
 *     summary: Get all job postings by account manager ID
 *     description: Retrieves all job postings assigned to the support user's account manager
 *     tags:
 *       - Support Job Postings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Job postings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportJobPostingListApiResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - User does not have required permissions
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
 *                   example: "Forbidden - Insufficient permissions"
 *                 code:
 *                   type: string
 *                   example: "ERR_2001"
 *       500:
 *         description: Internal server error
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
 *                   example: "Internal server error"
 *                 code:
 *                   type: string
 *                   example: "ERR_6001"
 */
router.get(
  '/',
  supportAuthMiddleware,
  supportJobPostingController.getAllJobPostingsBySupportUserId
);

export default router;
