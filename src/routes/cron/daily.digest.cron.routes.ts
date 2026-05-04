import { Router } from 'express';
import { DailyDigestCronController } from '@/controllers/cron/daily.digest.cron.controller';
import { DailyDigestCronService } from '@/services/cron/daily.digest.cron.service';
import { DailyDigestProcessor } from '@/services/queue/processors/daily.digest.processor';
import { validateApiKey } from '@/middleware/api.key.middleware';
import { validateRequest } from '@/middleware';
import {
  startDailyDigestTaskValidator,
  listDailyDigestTasksValidator,
} from '@/shared/validators/cron/daily.digest.cron.validator';

const router = Router({ mergeParams: true });

// Initialize services and controller
const dailyDigestCronService = new DailyDigestCronService();
const dailyDigestProcessor = new DailyDigestProcessor(dailyDigestCronService);
const dailyDigestCronController = new DailyDigestCronController(
  dailyDigestCronService,
  dailyDigestProcessor
);

/**
 * @openapi
 * /cron/daily-digest:
 *   post:
 *     summary: Start a daily digest cron task
 *     description: Starts a new background task to process and send daily digest emails to clients
 *     tags:
 *       - Cron Jobs
 *     security:
 *       - apiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IDailyDigestCronStartTask'
 *     responses:
 *       200:
 *         description: Task started successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IDailyDigestCronTaskStartedApiResponse'
 *       401:
 *         description: Unauthorized - Invalid API key
 *       500:
 *         description: Internal server error
 */
router.post(
  '/',
  [validateApiKey, validateRequest(startDailyDigestTaskValidator)],
  dailyDigestCronController.startDailyDigestTask
);

/**
 * @openapi
 * /cron/daily-digest/{taskId}:
 *   get:
 *     summary: Get a specific daily digest cron task
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
 *               $ref: '#/components/schemas/IDailyDigestCronTaskGetApiResponse'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Task not found
 *       500:
 *         description: Internal server error
 */
router.get('/:taskId', [validateApiKey], dailyDigestCronController.getTask);

/**
 * @openapi
 * /cron/daily-digest:
 *   get:
 *     summary: List daily digest cron tasks
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
 *           $ref: '#/components/schemas/DailyDigestCronTaskStatus'
 *         description: Filter by task status
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IDailyDigestCronTaskListApiResponse'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/',
  [validateApiKey, validateRequest(listDailyDigestTasksValidator)],
  dailyDigestCronController.getAllTasks
);

export default router;
