import { Router } from 'express';
import { CandidateJobPostingController } from '@/controllers/candidate/job.posting.controller';
import { CandidateJobPostingService } from '@/services/candidate/job.posting.service';
import {
  requireAuth,
  requireActiveUser,
  validateRequest,
  requireCandidateAccess,
} from '@/middleware';
import {
  candidateJobPostingListValidator,
  candidateJobPostingApplyValidator,
} from '@/shared/validators/candidate/job.posting.validator';
import { NotificationFactory } from '@/services/notification/notification.factory';

const router = Router({ mergeParams: true });

const notificationProvider =
  new NotificationFactory().getNotificationProvider();

// Initialize services and controller
const jobPostingService = new CandidateJobPostingService(notificationProvider);
const jobPostingController = new CandidateJobPostingController(
  jobPostingService
);

// Candidate auth middleware - applies to all job posting routes
const candidateAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireCandidateAccess,
];

/**
 * @openapi
 * /candidate/job-postings:
 *   get:
 *     summary: Get all job postings
 *     description: Retrieves all job postings with pagination and filtering
 *     tags:
 *       - Candidate Job Postings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortBy'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortOrder'
 *       - $ref: '#/components/parameters/ICandidateJobPostingFilterQueryJobType'
 *       - $ref: '#/components/parameters/ICandidateJobPostingFilterQueryJobCommitment'
 *       - $ref: '#/components/parameters/ICandidateJobPostingFilterQueryJobSchedule'
 *       - $ref: '#/components/parameters/ICandidateJobPostingFilterQueryIndustry'
 *       - $ref: '#/components/parameters/ICandidateJobPostingFilterQueryIsRemote'
 *       - $ref: '#/components/parameters/ICandidateJobPostingFilterQueryMinExperience'
 *       - $ref: '#/components/parameters/ICandidateJobPostingFilterQueryMaxExperience'
 *       - $ref: '#/components/parameters/ICandidateJobPostingFilterQueryMinSalary'
 *       - $ref: '#/components/parameters/ICandidateJobPostingFilterQueryMaxSalary'
 *       - $ref: '#/components/parameters/ICandidateJobPostingFilterQuerySalaryCurrency'
 *       - $ref: '#/components/parameters/ICandidateJobPostingFilterQuerySkills'
 *       - $ref: '#/components/parameters/ICandidateJobPostingFilterQueryCompany'
 *     responses:
 *       200:
 *         description: Job postings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateJobPostingListGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get(
  '/',
  [
    ...candidateAuthMiddleware,
    validateRequest(candidateJobPostingListValidator),
  ],
  jobPostingController.getJobPostings
);

/**
 * @openapi
 * /candidate/job-postings/{jobPostingId}:
 *   get:
 *     summary: Get specific job posting
 *     description: Retrieves a specific job posting
 *     tags:
 *       - Candidate Job Postings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateJobPostingIdParams'
 *     responses:
 *       200:
 *         description: Job posting retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateJobPostingGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Job posting not found
 */
router.get(
  '/:jobPostingId',
  [...candidateAuthMiddleware],
  jobPostingController.getJobPosting
);

/**
 * @openapi
 * /candidate/job-postings/{jobPostingId}/apply:
 *   post:
 *     summary: Apply for a job posting
 *     description: Submits an application for a job posting
 *     tags:
 *       - Candidate Job Postings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateJobPostingIdParams'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ICandidateJobPostingApply'
 *     responses:
 *       200:
 *         description: Application submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateJobPostingApplyApiResponse'
 *       400:
 *         description: Invalid input data or already applied
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Job posting not found
 */
router.post(
  '/:jobPostingId/apply',
  [
    ...candidateAuthMiddleware,
    validateRequest(candidateJobPostingApplyValidator),
  ],
  jobPostingController.applyForJobPosting
);

export default router;
