import { Router } from 'express';
import { CandidateRecommendationCronController } from '@/controllers/cron/candidate.recommendation.cron.controller';
import { CandidateRecommendationCronService } from '@/services/cron/candidate.recommendation.cron.service';
import { validateApiKey } from '@/middleware/api.key.middleware';
import { validateRequest } from '@/middleware';
import {
  startCandidateRecommendationTaskValidator,
  getCandidateRecommendationTaskValidator,
  listCandidateRecommendationTasksValidator,
  findCandidateRecommendationsValidator,
} from '@/shared/validators/cron/candidate.recommendation.cron.validator';

const router = Router({ mergeParams: true });

// Initialize services and controller
const candidateRecommendationCronService =
  new CandidateRecommendationCronService();
const candidateRecommendationCronController =
  new CandidateRecommendationCronController(candidateRecommendationCronService);

/**
 * @openapi
 * /cron/candidate-recommendation:
 *   post:
 *     summary: Start a new candidate recommendation task
 *     description: Starts a new background task to find job recommendations for candidates
 *     tags:
 *       - Cron Jobs
 *     security:
 *       - apiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ICandidateRecommendationCronStartTask'
 *     responses:
 *       200:
 *         description: Task started successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateRecommendationCronTaskStartedApiResponse'
 *       401:
 *         description: Unauthorized - Invalid API key
 */
router.post(
  '/',
  [validateApiKey, validateRequest(startCandidateRecommendationTaskValidator)],
  candidateRecommendationCronController.startCandidateRecommendationTask
);

/**
 * @openapi
 * /cron/candidate-recommendation/{taskId}:
 *   get:
 *     summary: Get a candidate recommendation task
 *     description: Gets the status and details of a specific candidate recommendation task
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
 *               $ref: '#/components/schemas/ICandidateRecommendationCronTaskGetApiResponse'
 *       401:
 *         description: Unauthorized - Invalid API key
 *       404:
 *         description: Task not found
 */
router.get(
  '/:taskId',
  [validateApiKey, validateRequest(getCandidateRecommendationTaskValidator)],
  candidateRecommendationCronController.getTask
);

/**
 * @openapi
 * /cron/candidate-recommendation:
 *   get:
 *     summary: Get all candidate recommendation tasks
 *     description: Gets a list of all candidate recommendation tasks with pagination and filtering
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
 *           $ref: '#/components/schemas/CandidateRecommendationCronTaskStatus'
 *         description: Filter by task status
 *       - in: query
 *         name: candidateId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by candidate ID
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateRecommendationCronTaskListApiResponse'
 *       401:
 *         description: Unauthorized - Invalid API key
 */
router.get(
  '/',
  [validateApiKey, validateRequest(listCandidateRecommendationTasksValidator)],
  candidateRecommendationCronController.getAllTasks
);

/**
 * @openapi
 * /cron/candidate-recommendation/find-initial:
 *   post:
 *     summary: Find initial recommendations for a candidate
 *     description: Finds initial job recommendations for a specific candidate
 *     tags:
 *       - Cron Jobs
 *     security:
 *       - apiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ICandidateRecommendationCronFindRecommendationsRequest'
 *     responses:
 *       200:
 *         description: Recommendations found successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateRecommendationCronFindRecommendationsApiResponse'
 *       401:
 *         description: Unauthorized - Invalid API key
 *       404:
 *         description: Candidate not found
 */
router.post(
  '/find-initial',
  [validateApiKey, validateRequest(findCandidateRecommendationsValidator)],
  candidateRecommendationCronController.findInitialRecommendations
);

/**
 * @openapi
 * /cron/candidate-recommendation/find:
 *   post:
 *     summary: Find new recommendations for a candidate
 *     description: Finds new job recommendations for a specific candidate based on sync timestamp
 *     tags:
 *       - Cron Jobs
 *     security:
 *       - apiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ICandidateRecommendationCronFindRecommendationsRequest'
 *     responses:
 *       200:
 *         description: New recommendations found successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateRecommendationCronFindRecommendationsApiResponse'
 *       401:
 *         description: Unauthorized - Invalid API key
 *       404:
 *         description: Candidate not found
 */
router.post(
  '/find',
  [validateApiKey, validateRequest(findCandidateRecommendationsValidator)],
  candidateRecommendationCronController.findRecommendations
);

export default router;
