import { Router } from 'express';
import { requireAuth, requireActiveUser, requireUserType } from '@/middleware';
import { UserTypeEnum } from '@/shared/models/common/enums';
import { ClientJobPostingAssessmentService } from '@/services/client/job.posting.assessment.service';
import { JobPostingAssessmentController } from '@/controllers/client/job.posting.assessment.controller';

const router = Router({ mergeParams: true });

const jobPostingAssessmentService = new ClientJobPostingAssessmentService();
const jobPostingAssessmentController = new JobPostingAssessmentController(
  jobPostingAssessmentService
);

// Client auth middleware - applies to all job posting assessment routes
const clientAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.CLIENT]),
];

/**
 * @openapi
 * /client/job-posting-assessments/{jobPostingId}/start:
 *   post:
 *     summary: Start job posting assessment
 *     description: Start a new job posting assessment task
 *     tags:
 *       - Client Job Posting Assessment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IJobPostingIdParams'
 *     responses:
 *       200:
 *         description: Assessment task started successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IJobPostingAssessmentStartApiResponse'
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Job posting not found
 */
router.post(
  '/:jobPostingId/start',
  [...clientAuthMiddleware],
  jobPostingAssessmentController.startAssessment
);

/**
 * @openapi
 * /client/job-posting-assessments/{jobPostingId}/task:
 *   get:
 *     summary: Get job posting assessment task status
 *     description: Get the status of a job posting assessment task for the specified job posting
 *     tags:
 *       - Client Job Posting Assessment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IJobPostingIdParams'
 *     responses:
 *       200:
 *         description: Task status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IJobPostingAssessmentTaskGetApiResponse'
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Task not found
 */
router.get(
  '/:jobPostingId/task',
  [...clientAuthMiddleware],
  jobPostingAssessmentController.getAssessmentTaskForJobPosting
);

/**
 * @openapi
 * /client/job-posting-assessments/task/{taskId}:
 *   get:
 *     summary: Get job posting assessment task status by task ID
 *     description: Get the status of a job posting assessment task by its ID
 *     tags:
 *       - Client Job Posting Assessment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IJobPostingAssessmentTaskIdParams'
 *     responses:
 *       200:
 *         description: Task status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IJobPostingAssessmentTaskGetApiResponse'
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Task not found
 */
router.get(
  '/task/:taskId',
  [...clientAuthMiddleware],
  jobPostingAssessmentController.getAssessmentTask
);

/**
 * @openapi
 * /client/job-posting-assessments/{jobPostingId}/latest:
 *   get:
 *     summary: Get latest job posting assessment results
 *     description: Get the latest results of a job posting assessment for the specified job posting
 *     tags:
 *       - Client Job Posting Assessment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IJobPostingIdParams'
 *     responses:
 *       200:
 *         description: Assessment results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IJobPostingAssessmentGetLatestApiResponse'
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Assessment not found
 */
router.get(
  '/:jobPostingId/latest',
  [...clientAuthMiddleware],
  jobPostingAssessmentController.getLatestAssessmentForJobPosting
);

/**
 * @openapi
 * /client/job-posting-assessments/{jobPostingId}/all:
 *   get:
 *     summary: Get all job posting assessment results
 *     description: Get all results of a job posting assessment for the specified job posting
 *     tags:
 *       - Client Job Posting Assessment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IJobPostingIdParams'
 *     responses:
 *       200:
 *         description: Assessment results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IJobPostingAssessmentGetAllApiResponse'
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get(
  '/:jobPostingId/all',
  [...clientAuthMiddleware],
  jobPostingAssessmentController.getAllAssessmentsForJobPosting
);

/**
 * @openapi
 * /client/job-posting-assessments/{assessmentId}:
 *   get:
 *     summary: Get job posting assessment results by assessment ID
 *     description: Get the results of a job posting assessment by its ID
 *     tags:
 *       - Client Job Posting Assessment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IJobPostingAssessmentIdParams'
 *     responses:
 *       200:
 *         description: Assessment results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IJobPostingAssessmentGetApiResponse'
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Assessment not found
 */
router.get(
  '/:assessmentId',
  [...clientAuthMiddleware],
  jobPostingAssessmentController.getAssessment
);

export default router;
