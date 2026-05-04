import { Router } from 'express';
import {
  requireAuth,
  requireActiveUser,
  requireRole,
  requireUserType,
  validateRequest,
} from '@/middleware';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';
import { NotificationFactory } from '@/services/notification/notification.factory';
import { JobInviteService } from '@/services/client/job.invite.service';
import { ClientJobInviteController } from '@/controllers/client/job.invite.controller';
import {
  jobInviteCreateValidator,
  jobInviteTokenValidationValidator,
  jobInviteListValidator,
  jobInviteByJobValidator,
} from '@/shared/validators/client/job.invite.validator';

const router = Router();

const notificationFactory = new NotificationFactory();
const notificationProvider = notificationFactory.getNotificationProvider();
const jobInviteService = new JobInviteService(notificationProvider);
const clientJobInviteController = new ClientJobInviteController(
  jobInviteService
);

const clientAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.CLIENT]),
];
const roleHrAdminOnlyMiddleware = [
  ...clientAuthMiddleware,
  requireRole([UserRoleEnum.HR, UserRoleEnum.ADMIN, UserRoleEnum.RECRUITER]),
];

/**
 * @openapi
 * /client/job-invites/validate/{token}:
 *   get:
 *     summary: Validate job invite token
 *     description: Validate a job invite token and return email information (public endpoint)
 *     tags:
 *       - Client Job Invite
 *     parameters:
 *       - name: token
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The invite token to validate
 *     responses:
 *       200:
 *         description: Token validation result
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IJobInviteTokenValidationResponse'
 *       400:
 *         description: Invalid token
 *       404:
 *         description: Token not found
 */
router.get(
  '/validate/:token',
  validateRequest(jobInviteTokenValidationValidator),
  clientJobInviteController.validateInviteToken
);

/**
 * @openapi
 * /client/job-invites:
 *   post:
 *     summary: Create job invite
 *     description: Create a job invite for a candidate (HR and Admin only)
 *     tags:
 *       - Client Job Invite
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IJobInviteApiRequest'
 *     responses:
 *       200:
 *         description: Job invite created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IJobInviteApiResponse'
 */
router.post(
  '/',
  [...roleHrAdminOnlyMiddleware, validateRequest(jobInviteCreateValidator)],
  clientJobInviteController.createJobInvite
);

/**
 * @openapi
 * /client/job-invites:
 *   get:
 *     summary: Get all job invites
 *     description: Get all job invites for the authenticated client with filtering and pagination
 *     tags:
 *       - Client Job Invite
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortBy'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortOrder'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSearch'
 *       - name: status
 *         in: query
 *         required: false
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/JobInviteStatusEnum'
 *         description: Filter by invite status
 *       - name: jobId
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by specific job posting ID
 *       - name: startDate
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter invites created from this date
 *       - name: endDate
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter invites created until this date
 *     responses:
 *       200:
 *         description: Job invites retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IJobInviteListApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/',
  [...clientAuthMiddleware, validateRequest(jobInviteListValidator)],
  clientJobInviteController.getAllJobInvites
);

/**
 * @openapi
 * /client/job-invites/{jobPostingId}:
 *   get:
 *     summary: Get job invites by job posting ID
 *     description: Get all job invites for a specific job posting with filtering and pagination
 *     tags:
 *       - Client Job Invite
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: jobPostingId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The job posting ID
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortBy'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortOrder'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSearch'
 *       - name: status
 *         in: query
 *         required: false
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/JobInviteStatusEnum'
 *         description: Filter by invite status
 *       - name: startDate
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter invites created from this date
 *       - name: endDate
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter invites created until this date
 *     responses:
 *       200:
 *         description: Job invites retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IJobInviteByJobApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Job posting not found
 */
router.get(
  '/:jobPostingId',
  [...clientAuthMiddleware, validateRequest(jobInviteByJobValidator)],
  clientJobInviteController.getJobInvitesByJobPostingId
);

/**
 * @openapi
 * /client/job-invites/{jobPostingId}/imported:
 *   get:
 *     summary: Get imported candidate job invites for specific job
 *     description: Get all job invites for imported candidates for a specific job posting with filtering and pagination
 *     tags:
 *       - Client Job Invite
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: jobPostingId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The job posting ID
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortBy'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortOrder'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSearch'
 *       - name: status
 *         in: query
 *         required: false
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/JobInviteStatusEnum'
 *         description: Filter by invite status
 *       - name: startDate
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter invites created from this date
 *       - name: endDate
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter invites created until this date
 *     responses:
 *       200:
 *         description: Imported candidate job invites for specific job retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IJobImportedInviteListApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Job posting not found
 */
router.get(
  '/:jobPostingId/imported',
  [...clientAuthMiddleware, validateRequest(jobInviteByJobValidator)],
  clientJobInviteController.getImportedCandidateJobInvitesByJobId
);

export default router;
