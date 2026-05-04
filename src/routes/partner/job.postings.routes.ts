import { Router } from 'express';
import { PartnerJobPostingsController } from '@/controllers/partner/job.postings.controller';
import { PartnerJobPostingsService } from '@/services/partner/job.postings.service';
import {
  requireActiveUser,
  requireAuth,
  requireUserType,
  validateRequest,
} from '@/middleware';
import { UserTypeEnum } from '@/shared/models/common/enums';
import {
  partnerJobPostingsListValidator,
  partnerJobPostingDetailsValidator,
  partnerJobApplicationCreateValidator,
} from '@/shared/validators/partner/job.postings.validator';

const router = Router();

// Initialize services and controller
const partnerJobPostingsService = new PartnerJobPostingsService();
const partnerJobPostingsController = new PartnerJobPostingsController(
  partnerJobPostingsService
);

// Partner auth middleware - applies to all job posting routes
const partnerAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.PARTNER]),
];

/**
 * @openapi
 * /partner/job-postings:
 *   get:
 *     summary: Get active job postings
 *     description: Returns all active job postings available to the partner with comprehensive filtering, searching, and sorting capabilities
 *     tags:
 *       - Partner Job Postings
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
 *         name: title
 *         schema:
 *           type: string
 *         description: Filter by job title (partial match)
 *         example: "Software Engineer"
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department
 *         example: "Engineering"
 *       - in: query
 *         name: reportingTo
 *         schema:
 *           type: string
 *         description: Filter by reporting manager
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by job location
 *         example: "San Francisco"
 *       - in: query
 *         name: jobType
 *         schema:
 *           oneOf:
 *             - $ref: '#/components/schemas/WorkTypeEnum'
 *             - type: array
 *               items:
 *                 $ref: '#/components/schemas/WorkTypeEnum'
 *         description: Filter by job type (single value or comma-separated list)
 *         example: "FULL_TIME,PART_TIME"
 *       - in: query
 *         name: industry
 *         schema:
 *           oneOf:
 *             - $ref: '#/components/schemas/CompanyIndustryEnum'
 *             - type: array
 *               items:
 *                 $ref: '#/components/schemas/CompanyIndustryEnum'
 *         description: Filter by industry (single value or comma-separated list)
 *       - in: query
 *         name: status
 *         schema:
 *           oneOf:
 *             - $ref: '#/components/schemas/JobPostingStatusEnum'
 *             - type: array
 *               items:
 *                 $ref: '#/components/schemas/JobPostingStatusEnum'
 *         description: Filter by job posting status (single value or comma-separated list)
 *       - in: query
 *         name: isRemote
 *         schema:
 *           type: boolean
 *         description: Filter by remote work availability
 *         example: true
 *       - in: query
 *         name: isFeatured
 *         schema:
 *           type: boolean
 *         description: Filter by featured jobs
 *       - in: query
 *         name: equity
 *         schema:
 *           type: boolean
 *         description: Filter by equity offering
 *       - in: query
 *         name: minExperience
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Minimum years of experience required
 *         example: 2
 *       - in: query
 *         name: maxExperience
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Maximum years of experience required
 *         example: 5
 *       - in: query
 *         name: minSalary
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Minimum salary range
 *         example: 80000
 *       - in: query
 *         name: maxSalary
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Maximum salary range
 *         example: 120000
 *       - in: query
 *         name: minTeamSize
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Minimum team size
 *       - in: query
 *         name: maxTeamSize
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Maximum team size
 *       - in: query
 *         name: minNumberOfOpenings
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Minimum number of openings
 *       - in: query
 *         name: maxNumberOfOpenings
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Maximum number of openings
 *       - in: query
 *         name: skills
 *         schema:
 *           oneOf:
 *             - type: string
 *             - type: array
 *               items:
 *                 type: string
 *         description: Filter by skills (single value or comma-separated list)
 *         example: "JavaScript,React,Node.js"
 *       - in: query
 *         name: requiredSkills
 *         schema:
 *           oneOf:
 *             - type: string
 *             - type: array
 *               items:
 *                 type: string
 *         description: Filter by required skills
 *       - in: query
 *         name: preferredSkills
 *         schema:
 *           oneOf:
 *             - type: string
 *             - type: array
 *               items:
 *                 type: string
 *         description: Filter by preferred skills
 *       - in: query
 *         name: preferredLocations
 *         schema:
 *           oneOf:
 *             - type: string
 *             - type: array
 *               items:
 *                 type: string
 *         description: Filter by preferred locations
 *       - in: query
 *         name: preferredIndustries
 *         schema:
 *           oneOf:
 *             - type: string
 *             - type: array
 *               items:
 *                 type: string
 *         description: Filter by preferred industries
 *       - in: query
 *         name: benefits
 *         schema:
 *           oneOf:
 *             - type: string
 *             - type: array
 *               items:
 *                 type: string
 *         description: Filter by benefits offered
 *       - in: query
 *         name: tags
 *         schema:
 *           oneOf:
 *             - type: string
 *             - type: array
 *               items:
 *                 type: string
 *         description: Filter by job tags
 *       - in: query
 *         name: applicationDeadlineAfter
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by application deadline after this date
 *       - in: query
 *         name: applicationDeadlineBefore
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by application deadline before this date
 *       - in: query
 *         name: availableFromAfter
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by availability date after this date
 *       - in: query
 *         name: availableFromBefore
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by availability date before this date
 *       - in: query
 *         name: createdAfter
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by creation date after this date
 *       - in: query
 *         name: createdBefore
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by creation date before this date
 *       - in: query
 *         name: updatedAfter
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by update date after this date
 *       - in: query
 *         name: updatedBefore
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by update date before this date
 *     responses:
 *       200:
 *         description: Job postings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerJobPostingsGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/',
  [...partnerAuthMiddleware, validateRequest(partnerJobPostingsListValidator)],
  partnerJobPostingsController.getJobPostings
);

/**
 * @openapi
 * /partner/job-postings/{id}:
 *   get:
 *     summary: Get job posting details
 *     description: Returns detailed job information for a specific job posting (excluding client details)
 *     tags:
 *       - Partner Job Postings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Job posting ID
 *     responses:
 *       200:
 *         description: Job posting details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerJobPostingGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job posting not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:id',
  [
    ...partnerAuthMiddleware,
    validateRequest(partnerJobPostingDetailsValidator),
  ],
  partnerJobPostingsController.getJobPostingById
);

/**
 * @openapi
 * /partner/job-postings/{id}/apply:
 *   post:
 *     summary: Apply to job posting with multiple candidates
 *     description: Allows a partner to submit multiple candidates for a job posting in a single request
 *     tags:
 *       - Partner Job Postings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Job posting ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - candidates
 *             properties:
 *               candidates:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - candidateId
 *                   properties:
 *                     candidateId:
 *                       type: string
 *                       format: uuid
 *                       description: ID of the candidate to submit
 *                     comment:
 *                       type: string
 *                       maxLength: 1000
 *                       description: Optional comment about the candidate's application
 *     responses:
 *       201:
 *         description: Applications submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Applications submitted successfully
 *                 applications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       applicationId:
 *                         type: string
 *                         format: uuid
 *                         description: ID of the created application
 *                       candidateId:
 *                         type: string
 *                         format: uuid
 *                         description: ID of the candidate
 *                       status:
 *                         type: string
 *                         enum: [SUBMITTED]
 *                         description: Status of the application
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job posting or resource not found
 *       409:
 *         description: One or more applications already exist
 *       500:
 *         description: Internal server error
 */
router.post(
  '/:id/apply',
  [
    ...partnerAuthMiddleware,
    validateRequest(partnerJobApplicationCreateValidator),
  ],
  partnerJobPostingsController.applyToJobPosting
);

export default router;
