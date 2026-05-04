import { Router } from 'express';
import { CandidateRecommendationController } from '../../controllers/candidate/recommendation.controller';
import {
  requireAuth,
  requireActiveUser,
  requireCandidateAccess,
  requireUserType,
} from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.request.middleware';
import { UserTypeEnum } from '../../shared/models/common/enums';
import {
  candidateRecommendationListQueryValidator,
  candidateRecommendationParamsValidator,
  rejectCandidateRecommendationValidator,
} from '../../shared/validators/candidate/recommendation.validator';

const router = Router();
const candidateRecommendationController =
  new CandidateRecommendationController();

// All routes require authentication and active user
router.use(requireAuth, requireActiveUser, requireCandidateAccess);

// Candidate auth middleware - applies to all recommendation routes
const candidateAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireCandidateAccess,
];

/**
 * @openapi
 * /candidate/{candidateId}/recommendations:
 *   get:
 *     summary: Get candidate recommendations
 *     description: Retrieve paginated list of job recommendations for a candidate with filtering and pagination
 *     tags:
 *       - Candidate Recommendations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: candidateId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The candidate ID
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortBy'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortOrder'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSearch'
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/CandidateRecommendationStatusEnum'
 *         description: Filter by recommendation status
 *       - in: query
 *         name: minScore
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 1
 *         description: Filter by minimum match score
 *       - in: query
 *         name: maxScore
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 1
 *         description: Filter by maximum match score
 *       - in: query
 *         name: isViewed
 *         schema:
 *           type: boolean
 *         description: Filter by viewed status
 *       - in: query
 *         name: isSaved
 *         schema:
 *           type: boolean
 *         description: Filter by saved status
 *       - in: query
 *         name: hasApplied
 *         schema:
 *           type: boolean
 *         description: Filter by application status
 *       - in: query
 *         name: jobPostingId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by specific job posting ID
 *       - in: query
 *         name: industry
 *         schema:
 *           type: string
 *         description: Filter by job industry
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by job location
 *       - in: query
 *         name: jobType
 *         schema:
 *           type: string
 *         description: Filter by job type
 *       - in: query
 *         name: createdAfter
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter recommendations created after this date
 *       - in: query
 *         name: createdBefore
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter recommendations created before this date
 *     responses:
 *       200:
 *         description: Candidate recommendations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateRecommendationListApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Candidate not found
 */
router.get(
  '/',
  [
    ...candidateAuthMiddleware,
    validateRequest(candidateRecommendationListQueryValidator),
  ],
  candidateRecommendationController.getCandidateRecommendations
);

/**
 * @openapi
 * /candidate/recommendations/{recommendationId}:
 *   get:
 *     summary: Get single candidate recommendation
 *     description: Retrieve details of a specific job recommendation for a candidate
 *     tags:
 *       - Candidate Recommendations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: candidateId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The candidate ID
 *       - in: path
 *         name: recommendationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The recommendation ID
 *     responses:
 *       200:
 *         description: Candidate recommendation retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateRecommendationApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Candidate or recommendation not found
 */
router.get(
  '/recommendations/:recommendationId',
  [
    ...candidateAuthMiddleware,
    validateRequest(candidateRecommendationParamsValidator),
  ],
  candidateRecommendationController.getCandidateRecommendation
);

/**
 * @openapi
 * /candidate/recommendations/{recommendationId}/reject:
 *   post:
 *     summary: Reject candidate recommendation
 *     description: Reject a job recommendation with feedback
 *     tags:
 *       - Candidate Recommendations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: candidateId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The candidate ID
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
 *             $ref: '#/components/schemas/IRejectCandidateRecommendationApiRequest'
 *     responses:
 *       200:
 *         description: Candidate recommendation rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IRejectCandidateRecommendationApiResponse'
 *       400:
 *         description: Bad request - Recommendation already rejected
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Candidate or recommendation not found
 */
router.post(
  '/recommendations/:recommendationId/reject',
  [
    ...candidateAuthMiddleware,
    validateRequest(rejectCandidateRecommendationValidator),
  ],
  candidateRecommendationController.rejectCandidateRecommendation
);

/**
 * @openapi
 * /candidate/{candidateId}/recommendations/{recommendationId}/view:
 *   post:
 *     summary: Mark recommendation as viewed
 *     description: Mark a job recommendation as viewed by the candidate
 *     tags:
 *       - Candidate Recommendations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: candidateId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The candidate ID
 *       - in: path
 *         name: recommendationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The recommendation ID
 *     responses:
 *       200:
 *         description: Candidate recommendation marked as viewed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IMarkCandidateRecommendationViewedApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Candidate or recommendation not found
 */
router.post(
  '/:candidateId/recommendations/:recommendationId/view',
  [
    ...candidateAuthMiddleware,
    requireUserType([UserTypeEnum.CANDIDATE]),
    validateRequest(candidateRecommendationParamsValidator),
  ],
  candidateRecommendationController.markCandidateRecommendationAsViewed
);

/**
 * @openapi
 * /candidate/{candidateId}/recommendations/{recommendationId}/save:
 *   post:
 *     summary: Save recommendation
 *     description: Save a job recommendation for later review
 *     tags:
 *       - Candidate Recommendations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: candidateId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The candidate ID
 *       - in: path
 *         name: recommendationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The recommendation ID
 *     responses:
 *       200:
 *         description: Candidate recommendation saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISaveCandidateRecommendationApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Candidate or recommendation not found
 */
router.post(
  '/:candidateId/recommendations/:recommendationId/save',
  [
    ...candidateAuthMiddleware,
    requireUserType([UserTypeEnum.CANDIDATE]),
    validateRequest(candidateRecommendationParamsValidator),
  ],
  candidateRecommendationController.saveCandidateRecommendation
);

/**
 * @openapi
 * /candidate/{candidateId}/recommendations/{recommendationId}/unsave:
 *   post:
 *     summary: Unsave recommendation
 *     description: Remove a job recommendation from saved items
 *     tags:
 *       - Candidate Recommendations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: candidateId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The candidate ID
 *       - in: path
 *         name: recommendationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The recommendation ID
 *     responses:
 *       200:
 *         description: Candidate recommendation unsaved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IUnsaveCandidateRecommendationApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Candidate or recommendation not found
 */
router.post(
  '/:candidateId/recommendations/:recommendationId/unsave',
  [
    ...candidateAuthMiddleware,
    requireUserType([UserTypeEnum.CANDIDATE]),
    validateRequest(candidateRecommendationParamsValidator),
  ],
  candidateRecommendationController.unsaveCandidateRecommendation
);

export default router;
