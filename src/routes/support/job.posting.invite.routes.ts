import { SupportJobPostingInviteController } from '@/controllers/support/job.posting.invite.controller';
import { requireAuth, requireRole, requireUserType } from '@/middleware';
import { SupportJobPostingInviteService } from '@/services/support/job.posting.invite.service';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';
import { Router } from 'express';
import { NotificationFactory } from '@/services/notification/notification.factory';
import {
  supportJobPostingInviteListValidator,
  supportJobPostingInviteCreateValidator,
  supportJobPostingInviteResendValidator,
  supportJobPostingInviteWithdrawValidator,
} from '@/shared/validators/support/job.posting.invite.validator';
import { validateRequest } from '@/middleware';

const router = Router();

// Initialize services and controller
const notificationFactory = new NotificationFactory();
const notificationProvider = notificationFactory.getNotificationProvider();
const supportJobPostingInviteService = new SupportJobPostingInviteService(
  notificationProvider
);
const supportJobPostingInviteController = new SupportJobPostingInviteController(
  supportJobPostingInviteService
);

const supportAuthMiddleware = [
  requireAuth,
  requireRole([
    UserRoleEnum.ADMIN,
    UserRoleEnum.RECRUITER,
    UserRoleEnum.ACCOUNT_MANAGER,
  ]),
  requireUserType([UserTypeEnum.SUPPORT]),
];

/**
 * @openapi
 * /support/job-posting-invites:
 *   get:
 *     summary: Get all job posting invites by support user ID with pagination and filtering
 *     description: Retrieves all job posting invites sent by the authenticated support user with detailed job posting information. Supports pagination, search, and filtering by status, email, name, and job ID.
 *     tags:
 *       - Support Job Posting Invites
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortBy'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortOrder'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSearch'
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           $ref: '#/components/schemas/JobInviteStatusEnum'
 *         description: Filter by invite status
 *       - in: query
 *         name: email
 *         required: false
 *         schema:
 *           type: string
 *           format: email
 *         description: Filter by candidate email
 *       - in: query
 *         name: name
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by candidate name
 *       - in: query
 *         name: jobId
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by job posting ID
 *     responses:
 *       200:
 *         description: Job posting invites retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/IPaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ISupportJobPostingInviteDetail'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  '/',
  [
    ...supportAuthMiddleware,
    validateRequest(supportJobPostingInviteListValidator),
  ],
  supportJobPostingInviteController.getJobPostingInvitesBySupportUserId
);

/**
 * @openapi
 * /support/job-posting-invites:
 *   post:
 *     summary: Create job posting invites
 *     description: Creates job posting invites for candidates with detailed job information
 *     tags:
 *       - Support Job Posting Invites
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ISupportJobInviteApiRequest'
 *     responses:
 *       200:
 *         description: Job posting invites created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportJobInviteApiResponse'
 *       400:
 *         description: Bad request - Invalid data provided
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
 *                   example: "Invalid request data"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Job posting not found
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
 *                   example: "Job posting not found"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  '/',
  [
    ...supportAuthMiddleware,
    validateRequest(supportJobPostingInviteCreateValidator),
  ],
  supportJobPostingInviteController.createSupportJobPostingInvite
);

/**
 * @openapi
 * /support/job-posting-invites/{invitationId}/resend:
 *   post:
 *     summary: Resend a job posting invite
 *     description: Resends a job posting invite to a candidate
 *     tags:
 *       - Support Job Posting Invites
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ISupportJobPostingInviteIdParams'
 *     responses:
 *       200:
 *         description: Job posting invite resend successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportJobInviteSimpleResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  '/:invitationId/resend',
  [
    ...supportAuthMiddleware,
    validateRequest(supportJobPostingInviteResendValidator),
  ],
  supportJobPostingInviteController.resendInvitation
);

/**
 * @openapi
 * /support/job-posting-invites/{invitationId}/withdraw:
 *   post:
 *     summary: Withdraw a job posting invite
 *     description: Withdraws a job posting invite
 *     tags:
 *       - Support Job Posting Invites
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ISupportJobPostingInviteIdParams'
 *     responses:
 *       200:
 *         description: Job posting invite withdrawn successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportJobInviteSimpleResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

router.post(
  '/:invitationId/withdraw',
  [
    ...supportAuthMiddleware,
    validateRequest(supportJobPostingInviteWithdrawValidator),
  ],
  supportJobPostingInviteController.withdrawInvitation
);

/**
 * @openapi
 * /support/job-posting-invites/{jobId}/imported-candidates:
 *   get:
 *     summary: Get imported candidates for a specific job posting
 *     description: Retrieves all imported candidates (from Excel uploads) for a specific job posting. This endpoint is only available to support users.
 *     tags:
 *       - Support Job Posting Invites
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Job posting ID
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortBy'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortOrder'
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           $ref: '#/components/schemas/JobInviteStatusEnum'
 *         description: Filter by invite status
 *       - in: query
 *         name: email
 *         required: false
 *         schema:
 *           type: string
 *           format: email
 *         description: Filter by candidate email
 *       - in: query
 *         name: name
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by candidate name
 *     responses:
 *       200:
 *         description: Imported candidates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/IPaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ISupportJobPostingInviteDetail'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  '/:jobId/imported-candidates',
  [
    ...supportAuthMiddleware,
    validateRequest(supportJobPostingInviteListValidator),
  ],
  supportJobPostingInviteController.getImportedCandidates
);

export default router;
