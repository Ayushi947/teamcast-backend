import { PartnerCandidateController } from '@/controllers/partner/candidate.controller';
import { PartnerCandidateService } from '@/services/partner/candidate.service';
import {
  requireActiveUser,
  requireAuth,
  requireUserType,
  validateRequest,
} from '@/middleware';
import { UserTypeEnum } from '@/shared/models/common/enums';
import {
  partnerCandidateUpdateValidator,
  partnerCandidateIdValidator,
  partnerCandidateListValidator,
  partnerCandidateDeleteValidator,
  partnerCandidateRecommendationsValidator,
  partnerCandidateRecommendationUpdateValidator,
} from '@/shared/validators/partner/candidate.validator';
import { Router } from 'express';

const router = Router();

// Initialize services
const partnerCandidateService = new PartnerCandidateService();

// Initialize controller
const partnerCandidateController = new PartnerCandidateController(
  partnerCandidateService
);

const partnerAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.PARTNER]),
];

/**
 * @openapi
 * /partner/candidates:
 *   get:
 *     summary: List partner candidates
 *     description: Get a list of all candidates managed by the partner with enhanced search and filtering capabilities
 *     tags:
 *       - Partner Candidates
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortBy'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortOrder'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSearch'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSearchColumns'
 *       - in: query
 *         name: email
 *         required: false
 *         schema:
 *           type: string
 *           format: email
 *           description: Filter by candidate email
 *       - in: query
 *         name: name
 *         required: false
 *         schema:
 *           type: string
 *           description: Filter by candidate name
 *       - in: query
 *         name: jobTitle
 *         required: false
 *         schema:
 *           type: string
 *           description: Filter by job title
 *       - in: query
 *         name: company
 *         required: false
 *         schema:
 *           type: string
 *           description: Filter by current company
 *       - in: query
 *         name: industry
 *         required: false
 *         schema:
 *           type: string
 *           description: Filter by industry
 *       - in: query
 *         name: location
 *         required: false
 *         schema:
 *           type: string
 *           description: Filter by location
 *       - in: query
 *         name: skills
 *         required: false
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *           description: Filter by skills
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           $ref: '#/components/schemas/CandidateStatusEnum'
 *           description: Filter by candidate status
 *       - in: query
 *         name: assessmentStage
 *         required: false
 *         schema:
 *           $ref: '#/components/schemas/CandidateAssessmentStageEnum'
 *           description: Filter by candidate assessment stage
 *       - in: query
 *         name: jobSearchStatus
 *         required: false
 *         schema:
 *           $ref: '#/components/schemas/CandidateJobSearchStatusEnum'
 *           description: Filter by candidate job search status
 *       - in: query
 *         name: isPublished
 *         required: false
 *         schema:
 *           type: boolean
 *           description: Filter by whether candidate profile is published
 *       - in: query
 *         name: minExperience
 *         required: false
 *         schema:
 *           type: integer
 *           description: Minimum years of experience
 *       - in: query
 *         name: maxExperience
 *         required: false
 *         schema:
 *           type: integer
 *           description: Maximum years of experience
 *     responses:
 *       200:
 *         description: List of partner candidates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerCandidateListApiResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get(
  '/',
  [...partnerAuthMiddleware, validateRequest(partnerCandidateListValidator)],
  partnerCandidateController.listPartnerCandidates
);

/**
 * @openapi
 * /partner/candidates/{candidateId}:
 *   get:
 *     summary: Get partner candidate with detailed information
 *     description: Get a candidate by ID with comprehensive information including resume, preferences, settings, and assessment data
 *     tags:
 *       - Partner Candidates
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: candidateId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier for the candidate
 *     responses:
 *       200:
 *         description: Partner candidate retrieved successfully with detailed information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerCandidateGetApiResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Candidate not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:candidateId',
  [...partnerAuthMiddleware, validateRequest(partnerCandidateIdValidator)],
  partnerCandidateController.getPartnerCandidate
);

/**
 * @openapi
 * /partner/candidates/{candidateId}:
 *   patch:
 *     summary: Update partner candidate
 *     description: Update a candidate that is managed by the partner
 *     tags:
 *       - Partner Candidates
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: candidateId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier for the candidate
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IPartnerCandidateUpdate'
 *     responses:
 *       200:
 *         description: Candidate updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerCandidateUpdateApiResponse'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Candidate not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  '/:candidateId',
  [...partnerAuthMiddleware, validateRequest(partnerCandidateUpdateValidator)],
  partnerCandidateController.updatePartnerCandidate
);

/**
 * @openapi
 * /partner/candidates/{candidateId}:
 *   delete:
 *     summary: Soft delete partner candidate
 *     description: Soft delete a candidate that is managed by the partner
 *     tags:
 *       - Partner Candidates
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: candidateId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier for the candidate
 *     responses:
 *       200:
 *         description: Candidate soft deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerCandidateDeleteApiResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Candidate not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  '/:candidateId',
  [...partnerAuthMiddleware, validateRequest(partnerCandidateDeleteValidator)],
  partnerCandidateController.deletePartnerCandidate
);

/**
 * @openapi
 * /partner/candidates/recommendations/{jobPostingId}:
 *   get:
 *     summary: Get recommended candidates for a job posting
 *     description: Get a list of partner candidates who have active recommendations for a specific job posting, ordered by match score
 *     tags:
 *       - Partner Candidates
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobPostingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier for the job posting
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortBy'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortOrder'
 *     responses:
 *       200:
 *         description: List of recommended candidates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerCandidateRecommendationsApiResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Job posting not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/recommendations/:jobPostingId',
  [
    ...partnerAuthMiddleware,
    validateRequest(partnerCandidateRecommendationsValidator),
  ],
  partnerCandidateController.getRecommendedCandidatesForJobPosting
);

/**
 * @openapi
 * /partner/candidates/{candidateId}/recommendations/{jobPostingId}:
 *   patch:
 *     summary: Update recommendation status
 *     description: Update the interaction status of a candidate recommendation (viewed, saved, applied)
 *     tags:
 *       - Partner Candidates
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: candidateId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier for the candidate
 *       - in: path
 *         name: jobPostingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier for the job posting
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isViewed:
 *                 type: boolean
 *                 description: Mark recommendation as viewed
 *               isSaved:
 *                 type: boolean
 *                 description: Mark recommendation as saved
 *               hasApplied:
 *                 type: boolean
 *                 description: Mark that candidate has applied
 *     responses:
 *       200:
 *         description: Recommendation status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerCandidateRecommendationUpdateApiResponse'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Candidate or recommendation not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  '/:candidateId/recommendations/:jobPostingId',
  [
    ...partnerAuthMiddleware,
    validateRequest(partnerCandidateRecommendationUpdateValidator),
  ],
  partnerCandidateController.updateCandidateRecommendationStatus
);

export default router;
