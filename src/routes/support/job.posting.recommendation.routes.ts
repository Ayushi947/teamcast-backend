import { Router } from 'express';
import { SupportJobPostingRecommendationController } from '@/controllers/support/job.posting.recommendation.controller';
import { SupportJobPostingRecommendationService } from '@/services/support/job.posting.recommendation.service';
import {
  requireActiveUser,
  requireAuth,
  requireRole,
  requireUserType,
  validateRequest,
} from '@/middleware';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';

import {
  supportJobRecommendationPreviewValidator,
  supportStoreRecommendationsValidator,
  supportStoredJobRecommendationListValidator,
  supportRefreshRecommendationsValidator,
} from '@/shared/validators/support/job.posting.recommendation.validator';

const router = Router();

// Initialize services and controller
const supportJobPostingRecommendationService =
  new SupportJobPostingRecommendationService();
const supportJobPostingRecommendationController =
  new SupportJobPostingRecommendationController(
    supportJobPostingRecommendationService
  );
router.use(
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.SUPPORT])
);

const supportAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireRole([
    UserRoleEnum.ADMIN,
    UserRoleEnum.RECRUITER,
    UserRoleEnum.ACCOUNT_MANAGER,
  ]),
];

/**
 * @openapi
 * /support/job-postings/{jobPostingId}/recommendations/preview:
 *   get:
 *     summary: Get job recommendation preview for recruiter review
 *     description: Retrieves candidate recommendations for a job posting. When candidateSearch is provided, searches by candidate name/email in embeddings first, otherwise falls back to AI-generated recommendations. Results are not stored and include pagination support. The candidateSearch parameter takes priority over AI recommendations and provides exact/partial matches by name or email. Additional search filters (search parameter) are applied after finding candidates.
 *     tags:
 *       - Support Job Recommendations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobPostingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the job posting
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortBy'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortOrder'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSearch'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSearchColumns'
 *       - in: query
 *         name: prevSyncDateTime
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Previous sync timestamp for incremental updates
 *       - in: query
 *         name: candidateSearch
 *         schema:
 *           type: string
 *         description: Search for candidates by name or email in embeddings before falling back to AI recommendations. Takes priority over AI recommendations. Supports exact and partial matches. When provided, this search is performed first, then additional search filters are applied.
 *     responses:
 *       200:
 *         description: Job recommendation preview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportJobRecommendationPreviewApiResponse'
 *     examples:
 *       ai_recommendations:
 *         summary: Get AI-generated recommendations
 *         description: Retrieve AI-generated candidate recommendations for a job posting
 *         value:
 *           jobPostingId: "123e4567-e89b-12d3-a456-426614174000"
 *           query:
 *             page: 1
 *             limit: 25
 *             search: "developer"
 *       candidate_search:
 *         summary: Search by candidate name/email
 *         description: Search for specific candidates by name or email in embeddings
 *         value:
 *           jobPostingId: "123e4567-e89b-12d3-a456-426614174000"
 *           query:
 *             page: 1
 *             limit: 25
 *             candidateSearch: "john.doe@example.com"
 *       combined_search:
 *         summary: Combined search with candidate name/email priority
 *         description: Search by candidate name/email first, then apply additional filters
 *         value:
 *           jobPostingId: "123e4567-e89b-12d3-a456-426614174000"
 *           query:
 *             page: 1
 *             limit: 25
 *             candidateSearch: "john"
 *             search: "developer"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Job posting not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  '/:jobPostingId/recommendations/preview',
  supportAuthMiddleware,
  validateRequest(supportJobRecommendationPreviewValidator),
  supportJobPostingRecommendationController.getRecommendationsPreview
);

/**
 * @openapi
 * /support/job-postings/{jobPostingId}/recommendations/store:
 *   post:
 *     summary: Store selected recommendations to database
 *     description: Stores the recruiter's selected candidate recommendations to the database
 *     tags:
 *       - Support Job Recommendations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobPostingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the job posting
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ISupportStoreRecommendationsRequest'
 *     responses:
 *       200:
 *         description: Selected recommendations stored successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportStoreRecommendationsApiResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  '/:jobPostingId/recommendations/store',
  supportAuthMiddleware,
  validateRequest(supportStoreRecommendationsValidator),
  supportJobPostingRecommendationController.storeSelectedRecommendations
);

/**
 * @openapi
 * /support/job-postings/{jobPostingId}/recommendations:
 *   get:
 *     summary: Get stored recommendations for a job posting
 *     description: Retrieves previously stored candidate recommendations for a job posting
 *     tags:
 *       - Support Job Recommendations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobPostingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the job posting
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortBy'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortOrder'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSearch'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSearchColumns'
 *     responses:
 *       200:
 *         description: Stored recommendations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportStoredJobRecommendationListApiResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Job posting not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  '/:jobPostingId/recommendations',
  supportAuthMiddleware,
  validateRequest(supportStoredJobRecommendationListValidator),
  supportJobPostingRecommendationController.getStoredRecommendations
);

/**
 * @openapi
 * /support/job-postings/{jobPostingId}/recommendations/refresh:
 *   post:
 *     summary: Refresh job recommendations
 *     description: Generates fresh AI recommendations for a job posting
 *     tags:
 *       - Support Job Recommendations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobPostingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the job posting
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               page:
 *                 type: number
 *                 minimum: 1
 *                 default: 1
 *                 description: Page number for pagination
 *               limit:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 100
 *                 default: 25
 *                 description: Maximum number of recommendations to return
 *               sortBy:
 *                 type: string
 *                 description: Field to sort by
 *               sortOrder:
 *                 type: string
 *                 enum: ["asc", "desc"]
 *                 description: Sort order
 *     responses:
 *       200:
 *         description: Job recommendations refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportRefreshRecommendationsApiResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Job posting not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  '/:jobPostingId/recommendations/refresh',
  supportAuthMiddleware,
  validateRequest(supportRefreshRecommendationsValidator),
  supportJobPostingRecommendationController.refreshRecommendations
);

export default router;
