import { Router } from 'express';

import {
  requireAuth,
  requireActiveUser,
  requireRole,
  validateRequest,
  requireUserType,
} from '@/middleware';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';

import { NotificationFactory } from '@/services/notification/notification.factory';
import { JobAiAssessmentInviteService } from '@/services/client/job.ai.assessment.invite.service';
import { ClientJobAiAssessmentInviteController } from '@/controllers/client/job.ai.assessment.invite.controller';
import {
  jobAiAssessmentInviteCreateValidator,
  jobAiAssessmentInviteGenerateUrlValidator,
} from '@/shared/validators/client/job.ai.assesment.validator';

const router = Router();

// Initialize notification provider
const notificationFactory = new NotificationFactory();
const notificationProvider = notificationFactory.getNotificationProvider();

// Initialize services and controller
const jobAiAssessmentInviteService = new JobAiAssessmentInviteService(
  notificationProvider
);
const clientJobAiAssessmentInviteController =
  new ClientJobAiAssessmentInviteController(jobAiAssessmentInviteService);

// All routes require authentication and active user
router.use(
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.CLIENT])
);

// Client auth middleware - applies to all JD assessment invite routes
const clientAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.CLIENT]),
];

// Admin-only middleware - applies to all create/cancel routes
const roleHrAdminOnlyMiddleware = [
  ...clientAuthMiddleware,
  requireRole([UserRoleEnum.HR, UserRoleEnum.ADMIN, UserRoleEnum.RECRUITER]),
];

/**
 * @openapi
 * /client/job-ai-assessment-invites:
 *   post:
 *     summary: Create job AI assessment invite
 *     description: Create a job AI assessment invite for a candidate (HR and Admin only)
 *     tags:
 *       - Client Job AI Assessment Invites
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IJobAiAssessmentInviteApiRequest'
 *     responses:
 *       200:
 *         description: Job AI assessment invite created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IJobAiAssessmentInviteCreateApiResponse'
 */
router.post(
  '/',
  [
    ...roleHrAdminOnlyMiddleware,
    validateRequest(jobAiAssessmentInviteCreateValidator),
  ],
  clientJobAiAssessmentInviteController.createJobAiAssessmentInvite
);

/**
 * @openapi
 * /client/job-ai-assessment-invites/generate-url:
 *   post:
 *     summary: Generate invitation URL
 *     description: Generate an invitation URL for a job AI assessment invite
 *     tags:
 *       - Client Job AI Assessment Invites
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IJobAiAssessmentInviteApiRequest'
 *     responses:
 *       200:
 *         description: Invitation URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IJobAiAssessmentApplicationUrlGenerateApiResponse'
 */
router.post(
  '/generate-url',
  [
    ...clientAuthMiddleware,
    validateRequest(jobAiAssessmentInviteGenerateUrlValidator),
  ],
  clientJobAiAssessmentInviteController.generateInvitationUrl
);

/**
 * @openapi
 * /client/job-ai-assessment-invites/interviews:
 *   get:
 *     summary: List job AI assessment interviews
 *     description: List job AI assessment interviews for a client
 *     tags:
 *       - Client Job AI Assessment Invites
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Job AI assessment interviews retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IJobAiAssessmentInterviewsApiResponse'
 */
router.get(
  '/interviews',
  clientAuthMiddleware,
  clientJobAiAssessmentInviteController.listJobAiAssessmentInterviews
);

/**
 * @openapi
 * /client/job-ai-assessment-invites/{invitationId}/details:
 *   get:
 *     summary: Get scheduled interview details
 *     description: Get details of a specific scheduled interview
 *     tags:
 *       - Client Job AI Assessment Invites
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invitationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Job AI assessment invitation ID
 *     responses:
 *       200:
 *         description: Scheduled interview details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IScheduledJobAssessmentDetails'
 *       400:
 *         description: Invalid input data or already applied
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Meeting details not found
 */
router.get(
  '/:invitationId/details',
  [requireRole([UserRoleEnum.ADMIN, UserRoleEnum.HR, UserRoleEnum.RECRUITER])],
  clientJobAiAssessmentInviteController.getJobAiAssessmentDetails
);

/**
 * @openapi
 * /client/job-ai-assessment-invites/{candidateId}/interviews:
 *   get:
 *     summary: Get job AI assessment invite for candidate
 *     description: Get job AI assessment invite for a candidate
 *     tags:
 *       - Client Job AI Assessment Invites
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: candidateId
 *         in: path
 *         required: true
 *         description: The ID of the candidate
 *     responses:
 *       200:
 *         description: Job AI assessment invite retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IJobAiAssessmentInvite'
 */
router.get(
  '/:candidateId/interviews',
  clientAuthMiddleware,
  clientJobAiAssessmentInviteController.getJobAiAssessmentInviteForCandidateId
);

export default router;
