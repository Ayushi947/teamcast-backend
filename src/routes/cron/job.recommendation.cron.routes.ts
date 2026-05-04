import { Router } from 'express';
import { JobRecommendationCronController } from '@/controllers/cron/job.recommendation.cron.controller';
import { JobRecommendationCronService } from '@/services/cron/job.recommendation.cron.service';
import { validateApiKey } from '@/middleware/api.key.middleware';
import { validateRequest } from '@/middleware';
import {
  startJobRecommendationTaskValidator,
  getJobRecommendationTaskValidator,
  listJobRecommendationTasksValidator,
  findJobRecommendationsValidator,
} from '@/shared/validators/cron/job.recommendation.cron.validator';

const router = Router({ mergeParams: true });

// Initialize services and controller
const jobRecommendationCronService = new JobRecommendationCronService();
const jobRecommendationCronController = new JobRecommendationCronController(
  jobRecommendationCronService
);

/**
 * @openapi
 * /cron/job-recommendation:
 *   post:
 *     summary: Start a new job recommendation task
 *     description: Starts a new background task to find candidate recommendations for jobs
 *     tags:
 *       - Cron Jobs
 *     security:
 *       - apiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IJobRecommendationCronStartTask'
 *     responses:
 *       200:
 *         description: Task started successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IJobRecommendationCronTaskStartedApiResponse'
 *       401:
 *         description: Unauthorized - Invalid API key
 */
router.post(
  '/',
  [validateApiKey, validateRequest(startJobRecommendationTaskValidator)],
  jobRecommendationCronController.startJobRecommendationTask
);

/**
 * @openapi
 * /cron/job-recommendation/{taskId}:
 *   get:
 *     summary: Get a job recommendation task
 *     description: Gets the status and details of a specific job recommendation task
 *     tags:
 *       - Cron Jobs
 *     security:
 *       - apiKey: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the task to retrieve
 *     responses:
 *       200:
 *         description: Task retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IJobRecommendationCronTaskGetApiResponse'
 *       401:
 *         description: Unauthorized - Invalid API key
 *       404:
 *         description: Task not found
 */
router.get(
  '/:taskId',
  [validateApiKey, validateRequest(getJobRecommendationTaskValidator)],
  jobRecommendationCronController.getTask
);

/**
 * @openapi
 * /cron/job-recommendation:
 *   get:
 *     summary: Get all job recommendation tasks
 *     description: Gets a list of all job recommendation tasks with pagination and filtering
 *     tags:
 *       - Cron Jobs
 *     security:
 *       - apiKey: []
 *     parameters:
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortBy'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortOrder'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSearch'
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/JobRecommendationCronTaskStatus'
 *         description: Filter by task status
 *       - in: query
 *         name: jobPostingId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by job posting ID
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IJobRecommendationCronTaskListApiResponse'
 *       401:
 *         description: Unauthorized - Invalid API key
 */
router.get(
  '/',
  [validateApiKey, validateRequest(listJobRecommendationTasksValidator)],
  jobRecommendationCronController.getAllTasks
);

/**
 * @openapi
 * /cron/job-recommendation/find-initial:
 *   post:
 *     summary: Find initial recommendations for a job
 *     description: Finds initial candidate recommendations for a specific job posting
 *     tags:
 *       - Cron Jobs
 *     security:
 *       - apiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IJobRecommendationCronFindRecommendationsRequest'
 *     responses:
 *       200:
 *         description: Recommendations found successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IJobRecommendationCronFindRecommendationsApiResponse'
 *       401:
 *         description: Unauthorized - Invalid API key
 *       404:
 *         description: Job posting not found
 */
router.post(
  '/find-initial',
  [validateApiKey, validateRequest(findJobRecommendationsValidator)],
  jobRecommendationCronController.findInitialRecommendations
);

/**
 * @openapi
 * /cron/job-recommendation/find:
 *   post:
 *     summary: Find new recommendations for a job
 *     description: Finds new candidate recommendations for a specific job posting based on sync timestamp
 *     tags:
 *       - Cron Jobs
 *     security:
 *       - apiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IJobRecommendationCronFindRecommendationsRequest'
 *     responses:
 *       200:
 *         description: New recommendations found successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IJobRecommendationCronFindRecommendationsApiResponse'
 *       401:
 *         description: Unauthorized - Invalid API key
 *       404:
 *         description: Job posting not found
 */
router.post(
  '/find',
  [validateApiKey, validateRequest(findJobRecommendationsValidator)],
  jobRecommendationCronController.findRecommendations
);

export default router;
