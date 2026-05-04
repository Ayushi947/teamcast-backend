import { Router } from 'express';
import { FeedbackEmailCronController } from '@/controllers/cron/feedback.email.cron.controller';
import { FeedbackEmailCronService } from '@/services/cron/feedback.email.cron.service';
import { validateApiKey } from '@/middleware/api.key.middleware';
import { validateRequest } from '@/middleware';
import {
  startFeedbackEmailTaskValidator,
  listFeedbackEmailTasksValidator,
} from '@/shared/validators/cron/feedback.email.cron.validator';

const router = Router({ mergeParams: true });

// Initialize services and controller
const feedbackEmailCronService = new FeedbackEmailCronService();
const feedbackEmailCronController = new FeedbackEmailCronController(
  feedbackEmailCronService
);

/**
 * @openapi
 * /cron/feedback-email:
 *   post:
 *     summary: Start a new feedback email task
 *     description: Starts a new background task to send feedback emails
 *     tags:
 *       - Cron Jobs
 *     security:
 *       - apiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IFeedbackEmailCronStartTask'
 *     responses:
 *       200:
 *         description: Task started successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IFeedbackEmailCronTaskStartedApiResponse'
 *       401:
 *         description: Unauthorized - Invalid API key
 */
router.post(
  '/',
  [validateApiKey, validateRequest(startFeedbackEmailTaskValidator)],
  feedbackEmailCronController.startFeedbackEmailTask
);

/**
 * @openapi
 * /cron/feedback-email/panel-assessment-status:
 *   post:
 *     summary: Update panel assessment statuses based on timing
 *     description: Starts a background task to update panel assessment statuses (MEETING_SCHEDULED, IN_PROGRESS, COMPLETED) based on current time vs scheduled slot times
 *     tags:
 *       - Cron Jobs
 *     security:
 *       - apiKey: []
 *     responses:
 *       200:
 *         description: Panel assessment status update task started successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IFeedbackEmailCronTaskStartedApiResponse'
 *       401:
 *         description: Unauthorized - Invalid API key
 */
router.post(
  '/panel-assessment-status',
  [validateApiKey],
  feedbackEmailCronController.updatePanelAssessmentStatuses
);

/**
 * @openapi
 * /cron/feedback-email/{taskId}:
 *   get:
 *     summary: Get a feedback email task
 *     description: Gets the status and details of a specific feedback email task
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
 *               $ref: '#/components/schemas/IFeedbackEmailCronTaskGetApiResponse'
 *       401:
 *         description: Unauthorized - Invalid API key
 *       404:
 *         description: Task not found
 */
router.get('/:taskId', [validateApiKey], feedbackEmailCronController.getTask);

/**
 * @openapi
 * /cron/feedback-email:
 *   get:
 *     summary: Get all feedback email tasks
 *     description: Gets a list of all feedback email tasks with pagination and filtering
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
 *       - $ref: '#/components/parameters/IFeedbackEmailCronTaskFilterQueryStatus'
 *       - $ref: '#/components/parameters/IFeedbackEmailCronTaskFilterQueryType'
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IFeedbackEmailCronTaskListApiResponse'
 *       401:
 *         description: Unauthorized - Invalid API key
 */
router.get(
  '/',
  [validateApiKey, validateRequest(listFeedbackEmailTasksValidator)],
  feedbackEmailCronController.getAllTasks
);

export default router;
