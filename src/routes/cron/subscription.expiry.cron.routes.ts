import { Router } from 'express';
import { SubscriptionExpiryCronController } from '@/controllers/cron/subscription.expiry.cron.controller';
import { SubscriptionExpiryCronService } from '@/services/cron/subscription.expiry.cron.service';

/**
 * @openapi
 * tags:
 *   name: Subscription Expiry Cron
 *   description: Subscription expiry cron job management
 */

const router = Router();
const subscriptionExpiryCronService = new SubscriptionExpiryCronService();
const subscriptionExpiryCronController = new SubscriptionExpiryCronController(
  subscriptionExpiryCronService
);

/**
 * @openapi
 * /cron/subscription-expiry-cron:
 *   post:
 *     summary: Start a new subscription expiry task
 *     tags:
 *       - Cron Jobs
 *     security:
 *       - apiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ISubscriptionExpiryCronStartTaskApiRequest'
 *     responses:
 *       200:
 *         description: Task started successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISubscriptionExpiryCronTaskStartedApiResponse'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/', subscriptionExpiryCronController.startSubscriptionExpiryTask);

/**
 * @openapi
 * /cron/subscription-expiry-cron:
 *   get:
 *     summary: Get all subscription expiry tasks
 *     tags:
 *       - Cron Jobs
 *     security:
 *       - apiKey: []
 *     parameters:
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - in: query
 *         name: type
 *         schema:
 *           $ref: '#/components/schemas/SubscriptionExpiryTaskType'
 *         description: Filter by task type
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/SubscriptionExpiryTaskCronStatus'
 *         description: Filter by task status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter tasks started after this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter tasks started before this date
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISubscriptionExpiryCronTaskListApiResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', subscriptionExpiryCronController.getAllTasks);

/**
 * @openapi
 * /cron/subscription-expiry-cron/{taskId}:
 *   get:
 *     summary: Get a subscription expiry task by ID
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
 *               $ref: '#/components/schemas/ISubscriptionExpiryCronTaskGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Task not found
 *       500:
 *         description: Internal server error
 */
router.get('/:taskId', subscriptionExpiryCronController.getTask);

/**
 * @openapi
 * /cron/subscription-expiry-cron/{taskId}/cancel:
 *   post:
 *     summary: Cancel a subscription expiry task
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
 *         description: Task cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISubscriptionExpiryCronTaskGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Task not found
 *       500:
 *         description: Internal server error
 */
router.post('/:taskId/cancel', subscriptionExpiryCronController.cancelTask);

/**
 * @openapi
 * /cron/subscription-expiry-cron{taskId}:
 *   delete:
 *     summary: Delete a subscription expiry task
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
 *         description: Task deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Task not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:taskId', subscriptionExpiryCronController.deleteTask);

export default router;
