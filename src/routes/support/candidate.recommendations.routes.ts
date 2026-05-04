import { Router } from 'express';
import { CandidateRecommendationsController } from '@/controllers/support/candidate.recommendations.controller';
import {
  requireActiveUser,
  requireAuth,
  requireUserType,
  validateRequest,
} from '@/middleware';
import { UserTypeEnum } from '@/shared/models/common/enums';
import { CandidateRecommendationsService } from '@/services/support/candidate.recommendations.service';
import {
  createCandidateRecommendationSchema,
  getCandidateRecommendedJobsSchema,
} from '@/shared/validators/support/candidate.recommendations.validator';

const router = Router();

const candidateRecommendationsService = new CandidateRecommendationsService();
const candidateRecommendationsController =
  new CandidateRecommendationsController(candidateRecommendationsService);

const supportAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.SUPPORT]),
];

/**
 * @openapi
 * /support/candidate-recommendations:
 *   post:
 *     summary: Create a candidate recommendation
 *     description: Creates a candidate recommendation for a given candidate and job posting
 *     tags:
 *       - Support
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ICreateCandidateRecommendationRequest'
 *     responses:
 *       '200':
 *         description: Candidate recommendation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICreateCandidateRecommendationResponse'
 *       '400':
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IErrorResponse'
 *       '401':
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IErrorResponse'
 *       '403':
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IErrorResponse'
 *       '404':
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IErrorResponse'
 *       '500':
 *         description: Internal server error
 *         content:
 */

router.post(
  '/',
  supportAuthMiddleware,
  validateRequest(createCandidateRecommendationSchema),
  candidateRecommendationsController.createCandidateRecommendation
);

/**
 * @openapi
 * /support/candidate-recommendations/recommended-jobs/candidate/{candidateId}:
 *   get:
 *     summary: Get candidate recommended jobs
 *     description: Returns recommended jobs for a candidate
 *     tags:
 *       - Support
 *     parameters:
 *       - in: path
 *         name: candidateId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '200':
 *         description: Recommended jobs fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportJobPostingListResponse'
 *       '400':
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IErrorResponse'
 *       '401':
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IErrorResponse'
 *       '404':
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IErrorResponse'
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IErrorResponse'
 */

router.get(
  '/recommended-jobs/candidate/:candidateId',
  supportAuthMiddleware,
  validateRequest(getCandidateRecommendedJobsSchema),
  candidateRecommendationsController.getCandidateRecommendedJobs
);

export default router;
