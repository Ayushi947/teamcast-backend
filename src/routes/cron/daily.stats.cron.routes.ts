import { Router } from 'express';
import { DailyStatsCronController } from '@/controllers/cron/daily.stats.cron.controller';
import { DailyStatsCronService } from '@/services/cron/daily.stats.cron.service';
import { DailyStatsProcessor } from '@/services/queue/processors/daily.stats.processor';
import { validateApiKey } from '@/middleware/api.key.middleware';
import { validateRequest } from '@/middleware';
import {
  startDailyStatsTaskValidator,
  listDailyStatsTasksValidator,
} from '@/shared/validators/cron/daily.stats.cron.validator';

const router = Router({ mergeParams: true });

// Initialize services and controller
const dailyStatsCronService = new DailyStatsCronService();
const dailyStatsProcessor = new DailyStatsProcessor(dailyStatsCronService);
const dailyStatsCronController = new DailyStatsCronController(
  dailyStatsCronService,
  dailyStatsProcessor
);

/**
 * @openapi
 * /cron/daily-stats:
 *   post:
 *     summary: Start a daily stats cron task
 *     description: Starts a new background task to process and send daily stats emails to clients
 *     tags:
 *       - Cron Jobs
 *     security:
 *       - apiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IDailyStatsCronStartTask'
 *     responses:
 *       200:
 *         description: Task started successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IDailyStatsCronTaskStartedApiResponse'
 *       401:
 *         description: Unauthorized - Invalid API key
 *       500:
 *         description: Internal server error
 */
router.post(
  '/',
  [validateApiKey, validateRequest(startDailyStatsTaskValidator)],
  dailyStatsCronController.startDailyStatsTask
);

/**
 * @openapi
 * /cron/daily-stats/{taskId}:
 *   get:
 *     summary: Get a specific daily stats cron task
 *     description: Gets the status and details of a specific daily stats task
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
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IDailyStatsCronTaskGetApiResponse'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Task not found
 *       500:
 *         description: Internal server error
 */
router.get('/:taskId', [validateApiKey], dailyStatsCronController.getTask);

/**
 * @openapi
 * /cron/daily-stats:
 *   get:
 *     summary: List daily stats cron tasks
 *     description: Gets a list of all daily stats tasks with pagination and filtering
 *     tags:
 *       - Cron Jobs
 *     security:
 *       - apiKey: []
 *     parameters:
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/DailyStatsCronTaskStatus'
 *         description: Filter by task status
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IDailyStatsCronTaskListApiResponse'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/',
  [validateApiKey, validateRequest(listDailyStatsTasksValidator)],
  dailyStatsCronController.getAllTasks
);

export default router;
