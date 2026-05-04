import { Router } from 'express';
import { RagCronController } from '@/controllers/cron/rag.cron';
import { RagCronService } from '@/services/cron/rag.cron.service';
import { validateApiKey } from '@/middleware/api.key.middleware';
import { validateRequest } from '@/middleware';
import {
  startRagTaskValidator,
  listRagTasksValidator,
} from '@/shared/validators/cron/rag.cron.validator';

const router = Router({ mergeParams: true });

// Initialize services and controller
const ragCronService = new RagCronService();
const ragCronController = new RagCronController(ragCronService);

/**
 * @openapi
 * /cron/rag:
 *   post:
 *     summary: Start a new RAG task
 *     description: Starts a new background task to process dirty entities
 *     tags:
 *       - Cron Jobs
 *     security:
 *       - apiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IRagCronStartTask'
 *     responses:
 *       200:
 *         description: Task started successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IRagCronTaskStartedApiResponse'
 *       401:
 *         description: Unauthorized - Invalid API key
 */
router.post(
  '/',
  [validateApiKey, validateRequest(startRagTaskValidator)],
  ragCronController.startRagTask
);

/**
 * @openapi
 * /cron/rag/{taskId}:
 *   get:
 *     summary: Get a RAG task
 *     description: Gets the status and details of a specific RAG task
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
 *         description: ID of the task to retrieve
 *     responses:
 *       200:
 *         description: Task retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IRagCronTaskGetApiResponse'
 *       401:
 *         description: Unauthorized - Invalid API key
 *       404:
 *         description: Task not found
 */
router.get('/:taskId', [validateApiKey], ragCronController.getTask);

/**
 * @openapi
 * /cron/rag:
 *   get:
 *     summary: Get all RAG tasks
 *     description: Gets a list of all RAG tasks with pagination and filtering
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
 *       - $ref: '#/components/parameters/IRagCronTaskFilterQueryStatus'
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IRagCronTaskListApiResponse'
 *       401:
 *         description: Unauthorized - Invalid API key
 */
router.get(
  '/',
  [validateApiKey, validateRequest(listRagTasksValidator)],
  ragCronController.getAllTasks
);

export default router;
