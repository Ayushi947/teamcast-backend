import { Router } from 'express';
import { ClientJobPostingController } from '@/controllers/client/job.posting.controller';
import { ClientJobPostingService } from '@/services/client/job.posting.service';
import {
  requireAuth,
  requireActiveUser,
  requireRole,
  validateRequest,
  requireUserType,
} from '@/middleware';
import {
  clientJobPostingCreateValidator,
  clientJobPostingUpdateValidator,
  clientJobPostingSkillsUpdateValidator,
  clientJobPostingStatusUpdateValidator,
  clientJobPostingIdValidator,
  clientJobPostingListValidator,
  clientJobPostingInviteValidator,
  clientJobAiAssessmentSettingsUpdateValidator,
} from '@/shared/validators/client/job.posting.validator';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';

const router = Router();
// Initialize services and controller
const clientJobPostingService = new ClientJobPostingService();
const clientJobPostingController = new ClientJobPostingController(
  clientJobPostingService
);

// Client auth middleware - applies to authenticated job posting routes
const clientAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.CLIENT, UserTypeEnum.SUPPORT]),
];

// Admin-only middleware - applies to all update routes
const roleHrAdminOnlyMiddleware = [
  ...clientAuthMiddleware,
  requireRole([UserRoleEnum.HR, UserRoleEnum.ADMIN, UserRoleEnum.RECRUITER]),
];

/**
 * @openapi
 * /client/job-postings/public/{jobPostingId}:
 *   get:
 *     summary: Get public job posting
 *     description: Get a job posting by ID (public)
 *     tags:
 *       - Client Job Postings
 *     parameters:
 *       - $ref: '#/components/parameters/IClientJobPostingIdParams'
 *     responses:
 *       200:
 *         description: Job posting retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientJobPostingGetApiResponse'
 *       404:
 *         description: Job posting not found
 *       400:
 *         description: Invalid request data
 *
 */

router.get(
  '/public/:jobPostingId',
  [validateRequest(clientJobPostingIdValidator)],
  clientJobPostingController.getPublicJobPosting
);

// All other routes require authentication and active user
router.use(
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.CLIENT, UserTypeEnum.SUPPORT])
);

/**
 * @openapi
 * /client/job-postings:
 *   post:
 *     summary: Create job posting
 *     description: Create a new job posting (HR and Admin only)
 *     tags:
 *       - Client Job Postings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientJobPostingCreate'
 *     responses:
 *       201:
 *         description: Job posting created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientJobPostingCreateApiResponse'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.post(
  '/',
  [
    ...roleHrAdminOnlyMiddleware,
    validateRequest(clientJobPostingCreateValidator),
  ],
  clientJobPostingController.createJobPosting
);

/**
 * @openapi
 * /client/job-postings:
 *   get:
 *     summary: List job postings
 *     description: Get a list of all job postings with optional filtering
 *     tags:
 *       - Client Job Postings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortBy'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortOrder'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSearch'
 *       - $ref: '#/components/parameters/IClientJobPostingFilterQuery'
 *     responses:
 *       200:
 *         description: List of job postings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientJobPostingListApiResponse'
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  [...clientAuthMiddleware, validateRequest(clientJobPostingListValidator)],
  clientJobPostingController.listJobPostings
);

/**
 * @openapi
 * /client/job-postings/{jobPostingId}:
 *   get:
 *     summary: Get job posting
 *     description: Get a job posting by ID
 *     tags:
 *       - Client Job Postings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IClientJobPostingIdParams'
 *     responses:
 *       200:
 *         description: Job posting retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientJobPostingGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job posting not found
 */
router.get(
  '/:jobPostingId',
  [...clientAuthMiddleware, validateRequest(clientJobPostingIdValidator)],
  clientJobPostingController.getJobPosting
);

/**
 * @openapi
 * /client/job-postings/{jobPostingId}:
 *   patch:
 *     summary: Update job posting
 *     description: Update a job posting (HR and Admin only)
 *     tags:
 *       - Client Job Postings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IClientJobPostingIdParams'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientJobPostingUpdate'
 *     responses:
 *       200:
 *         description: Job posting updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientJobPostingUpdateApiResponse'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.patch(
  '/:jobPostingId',
  [
    ...roleHrAdminOnlyMiddleware,
    validateRequest(clientJobPostingUpdateValidator),
  ],
  clientJobPostingController.updateJobPosting
);

/**
 * @openapi
 * /client/job-postings/{jobPostingId}/skills:
 *   patch:
 *     summary: Update job posting skills
 *     description: Update skills for a job posting (HR and Admin only)
 *     tags:
 *       - Client Job Postings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IClientJobPostingIdParams'
 *       - $ref: '#/components/parameters/IJobPostingFilterQuery'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortBy'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortOrder'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSearch'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientJobPostingSkillsUpdate'
 *     responses:
 *       200:
 *         description: Job posting skills updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientJobPostingSkillsUpdateApiResponse'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.patch(
  '/:jobPostingId/skills',
  [
    ...roleHrAdminOnlyMiddleware,
    validateRequest(clientJobPostingSkillsUpdateValidator),
  ],
  clientJobPostingController.updateJobPostingSkills
);

/**
 * @openapi
 * /client/job-postings/{jobPostingId}/status:
 *   patch:
 *     summary: Update job posting status
 *     description: Update status of a job posting (HR and Admin only)
 *     tags:
 *       - Client Job Postings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IClientJobPostingIdParams'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientJobPostingStatusUpdate'
 *     responses:
 *       200:
 *         description: Job posting status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientJobPostingStatusUpdateApiResponse'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.patch(
  '/:jobPostingId/status',
  [
    ...roleHrAdminOnlyMiddleware,
    validateRequest(clientJobPostingStatusUpdateValidator),
  ],
  clientJobPostingController.updateJobPostingStatus
);

/**
 * @openapi
 * /client/job-postings/{jobPostingId}:
 *   delete:
 *     summary: Delete job posting
 *     description: Delete a job posting (HR and Admin only)
 *     tags:
 *       - Client Job Postings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IClientJobPostingIdParams'
 *     responses:
 *       200:
 *         description: Job posting deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientJobPostingDeleteApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Job posting not found
 */
router.delete(
  '/:jobPostingId',
  [...roleHrAdminOnlyMiddleware, validateRequest(clientJobPostingIdValidator)],
  clientJobPostingController.deleteJobPosting
);

/**
 * @openapi
 * /client/job-postings/{jobPostingId}/invite:
 *   post:
 *     summary: Invite candidate
 *     description: Invite a candidate to apply for a job posting
 *     tags:
 *       - Client Job Postings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IClientJobPostingIdParams'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientJobPostingInvite'
 *     responses:
 *       200:
 *         description: Candidate invited successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientJobPostingInviteApiResponse'
 *       400:
 *         description: Invalid request data or candidate already invited/applied
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Job posting or candidate not found
 */
router.post(
  '/:jobPostingId/invite',
  [
    ...roleHrAdminOnlyMiddleware,
    validateRequest(clientJobPostingInviteValidator),
  ],
  clientJobPostingController.inviteCandidate
);

/**
 * @openapi
 * /client/job-postings/{jobPostingId}/ai-assessment-settings:
 *   get:
 *     summary: Get job AI assessment settings
 *     description: Get AI assessment settings for a job posting
 *     tags:
 *       - Client Job Postings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IClientJobPostingIdParams'
 *     responses:
 *       200:
 *         description: AI assessment settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientJobAiAssessmentSettingsGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Job posting or settings not found
 */
router.get(
  '/:jobPostingId/ai-assessment-settings',
  [...roleHrAdminOnlyMiddleware, validateRequest(clientJobPostingIdValidator)],
  clientJobPostingController.getJobPostingAiAssessmentSettings
);

/**
 * @openapi
 * /client/job-postings/{jobPostingId}/ai-assessment-settings:
 *   patch:
 *     summary: Update job AI assessment settings
 *     description: Update AI assessment settings for a job posting (HR and Admin only)
 *     tags:
 *       - Client Job Postings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IClientJobPostingIdParams'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientJobAiAssessmentSettingsUpdate'
 *     responses:
 *       200:
 *         description: AI assessment settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientJobAiAssessmentSettingsUpdateApiResponse'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Job posting or settings not found
 */
router.patch(
  '/:jobPostingId/ai-assessment-settings',
  [
    ...roleHrAdminOnlyMiddleware,
    validateRequest(clientJobAiAssessmentSettingsUpdateValidator),
  ],
  clientJobPostingController.updateJobPostingAiAssessmentSettings
);

export default router;
