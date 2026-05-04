import { Router } from 'express';
import { ClientJobPostingRecommendationController } from '@/controllers/client/job.posting.recommendation.controller';
import { ClientJobPostingRecommendationService } from '@/services/client/job.posting.recommendation.service';
import {
  requireAuth,
  requireActiveUser,
  requireRole,
  validateRequest,
  requireUserType,
} from '@/middleware';
import {
  jobPostingRecommendationListValidator,
  jobPostingRecommendationGetValidator,
  jobPostingRecommendationRejectValidator,
  jobPostingRecommendationMarkViewedValidator,
  jobPostingRecommendationSaveValidator,
  jobPostingRecommendationUnsaveValidator,
} from '@/shared/validators/client/job.posting.recommendation.validator';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';

const router = Router();

// Initialize services and controller
const jobPostingRecommendationService =
  new ClientJobPostingRecommendationService();
const jobPostingRecommendationController =
  new ClientJobPostingRecommendationController(jobPostingRecommendationService);

// All routes require authentication and active user
router.use(
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.CLIENT])
);

// Client auth middleware - applies to all job posting recommendation routes
const clientAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.CLIENT]),
];

// Role-based middleware for different operations
const roleHrAdminRecruiterMiddleware = [
  ...clientAuthMiddleware,
  requireRole([UserRoleEnum.ADMIN, UserRoleEnum.HR, UserRoleEnum.RECRUITER]),
];

/**
 * @openapi
 * /client/job-posting-recommendations/{jobPostingId}/recommendations:
 *   get:
 *     summary: Get job posting recommendations
 *     description: Retrieve all candidate recommendations for a job posting
 *     tags:
 *       - Client Job Posting Recommendations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobPostingId
 *         required: true'
 *     responses:
 *       200:
 *         description: Job posting recommendations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IJobPostingRecommendationListApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Job posting not found
 */
router.get(
  '/:jobPostingId/recommendations',
  [
    ...roleHrAdminRecruiterMiddleware,
    validateRequest(jobPostingRecommendationListValidator),
  ],
  jobPostingRecommendationController.getJobPostingRecommendations
);

/**
 * @openapi
 * /client/job-posting-recommendations/{jobPostingId}/{recommendationId}:
 *   get:
 *     summary: Get single job posting recommendation
 *     description: Retrieve details of a specific candidate recommendation for a job posting
 *     tags:
 *       - Client Job Posting Recommendations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobPostingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The job posting ID
 *       - in: path
 *         name: recommendationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The recommendation ID
 *     responses:
 *       200:
 *         description: Job posting recommendation retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IJobPostingRecommendationGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Job posting or recommendation not found
 */
router.get(
  '/:jobPostingId/recommendations/:recommendationId',
  [
    ...roleHrAdminRecruiterMiddleware,
    validateRequest(jobPostingRecommendationGetValidator),
  ],
  jobPostingRecommendationController.getJobPostingRecommendation
);

/**
 * @openapi
 * /client/job-posting-recommendations/{jobPostingId}/{recommendationId}/reject:
 *   post:
 *     summary: Reject job posting recommendation
 *     description: Reject a candidate recommendation with feedback
 *     tags:
 *       - Client Job Posting Recommendations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobPostingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The job posting ID
 *       - in: path
 *         name: recommendationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The recommendation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IJobRecommendationReject'
 *     responses:
 *       200:
 *         description: Job posting recommendation rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IJobPostingRecommendationRejectApiResponse'
 *       400:
 *         description: Bad request - Recommendation already rejected
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Job posting or recommendation not found
 */
router.post(
  '/:jobPostingId/recommendations/:recommendationId/reject',
  [
    ...roleHrAdminRecruiterMiddleware,
    validateRequest(jobPostingRecommendationRejectValidator),
  ],
  jobPostingRecommendationController.rejectJobPostingRecommendation
);

/**
 * @openapi
 * /client/job-posting-recommendations/{jobPostingId}/{recommendationId}/mark-viewed:
 *   post:
 *     summary: Mark recommendation as viewed
 *     description: Mark a candidate recommendation as viewed
 *     tags:
 *       - Client Job Posting Recommendations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobPostingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The job posting ID
 *       - in: path
 *         name: recommendationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The recommendation ID
 *     responses:
 *       200:
 *         description: Job posting recommendation marked as viewed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IJobPostingRecommendationMarkViewedApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Job posting or recommendation not found
 */
router.post(
  '/:jobPostingId/recommendations/:recommendationId/mark-viewed',
  [
    ...roleHrAdminRecruiterMiddleware,
    validateRequest(jobPostingRecommendationMarkViewedValidator),
  ],
  jobPostingRecommendationController.markJobPostingRecommendationAsViewed
);

/**
 * @openapi
 * /client/job-posting-recommendations/{jobPostingId}/{recommendationId}/save:
 *   post:
 *     summary: Save recommendation
 *     description: Save a candidate recommendation for later review
 *     tags:
 *       - Client Job Posting Recommendations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobPostingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The job posting ID
 *       - in: path
 *         name: recommendationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The recommendation ID
 *     responses:
 *       200:
 *         description: Job posting recommendation saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IJobPostingRecommendationSaveApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Job posting or recommendation not found
 */
router.post(
  '/:jobPostingId/recommendations/:recommendationId/save',
  [
    ...roleHrAdminRecruiterMiddleware,
    validateRequest(jobPostingRecommendationSaveValidator),
  ],
  jobPostingRecommendationController.saveJobPostingRecommendation
);

/**
 * @openapi
 * /client/job-posting-recommendations/{jobPostingId}/{recommendationId}/unsave:
 *   post:
 *     summary: Unsave recommendation
 *     description: Remove a candidate recommendation from saved list
 *     tags:
 *       - Client Job Posting Recommendations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobPostingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The job posting ID
 *       - in: path
 *         name: recommendationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The recommendation ID
 *     responses:
 *       200:
 *         description: Job posting recommendation unsaved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IJobPostingRecommendationUnsaveApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Job posting or recommendation not found
 */
router.post(
  '/:jobPostingId/recommendations/:recommendationId/unsave',
  [
    ...roleHrAdminRecruiterMiddleware,
    validateRequest(jobPostingRecommendationUnsaveValidator),
  ],
  jobPostingRecommendationController.unsaveJobPostingRecommendation
);

export default router;
