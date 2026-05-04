import { Router } from 'express';
import { FeatureFlagScheduleCronController } from '@/controllers/cron/feature.flag.schedule.cron.controller';
import { FeatureFlagService } from '@/services/support/feature.flag.service';
import { validateApiKey } from '@/middleware/api.key.middleware';

const router = Router({ mergeParams: true });

// Initialize service and controller
const featureFlagService = new FeatureFlagService();
const featureFlagScheduleCronController = new FeatureFlagScheduleCronController(
  featureFlagService
);

/**
 * @openapi
 * /cron/feature-flag-schedules:
 *   post:
 *     summary: Process due feature flag schedules
 *     description: |
 *       Processes all pending feature flag schedules whose scheduled time has passed.
 *       Applies the scheduled action (ENABLE or DISABLE) to the corresponding feature flag.
 *       Call this endpoint from a cron job every minute (e.g. via external scheduler or worker).
 *     tags:
 *       - Cron Jobs
 *       - Feature Flags
 *     security:
 *       - apiKey: []
 *     responses:
 *       200:
 *         description: Schedules processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Feature flag schedules processed
 *                 data:
 *                   type: object
 *                   properties:
 *                     applied:
 *                       type: integer
 *                       description: Number of schedules applied
 *                     errors:
 *                       type: integer
 *                       description: Number of schedules that failed to apply
 *       401:
 *         description: Unauthorized - Invalid or missing API key
 *       500:
 *         description: Internal server error
 */
router.post(
  '/',
  validateApiKey,
  featureFlagScheduleCronController.processDueSchedules
);

export default router;
