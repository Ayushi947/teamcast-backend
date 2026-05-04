import { Router } from 'express';
import { TourGuidanceController } from '../../controllers/tour/tour.guidance.controller';
import { TourGuidanceService } from '../../services/tour/tour.guidance.service';
import {
  requireAuth,
  requireActiveUser,
  validateRequest,
  requireRole,
} from '../../middleware';
import {
  startTourValidator,
  updateTourProgressValidator,
  tourIdValidator,
  getTourAnalyticsValidator,
} from '../../shared/validators/tour/tour.guidance.validator';
import { UserRoleEnum } from '../../shared/models/common/enums';

const router = Router();

// Initialize service and controller
const tourGuidanceService = new TourGuidanceService();
const tourGuidanceController = new TourGuidanceController(tourGuidanceService);

/**
 * @openapi
 * /tours:
 *   get:
 *     summary: Get user tours
 *     description: Get available, active, completed, and suggested tours for the current user
 *     tags:
 *       - Tour Guidance
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User tours retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GetUserToursResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  '/',
  requireAuth,
  requireActiveUser,
  tourGuidanceController.getUserTours
);

/**
 * @openapi
 * /tours/start:
 *   post:
 *     summary: Start a tour
 *     description: Start a new tour for the current user
 *     tags:
 *       - Tour Guidance
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StartTourRequest'
 *     responses:
 *       201:
 *         description: Tour started successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserTourProgressResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       409:
 *         description: Tour already in progress
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post(
  '/start',
  requireAuth,
  requireActiveUser,
  validateRequest(startTourValidator),
  tourGuidanceController.startTour
);

/**
 * @openapi
 * /tours/progress/{tourKey}:
 *   get:
 *     summary: Get tour progress by key
 *     description: Get tour progress for a specific tour key
 *     tags:
 *       - Tour Guidance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: tourKey
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The tour key
 *     responses:
 *       200:
 *         description: Tour progress retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserTourProgressResponse'
 *       404:
 *         description: Tour progress not found
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  '/progress/:tourKey',
  requireAuth,
  requireActiveUser,
  tourGuidanceController.getTourProgressByKey
);

/**
 * @openapi
 * /tours/status/{tourKey}:
 *   get:
 *     summary: Get tour status by key
 *     description: Get tour status information including completion state, current step, and progress by tour key
 *     tags:
 *       - Tour Guidance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tourKey
 *         required: true
 *         schema:
 *           type: string
 *         description: The tour key identifier
 *     responses:
 *       200:
 *         description: Tour status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TourStatusApiResponse'
 *       404:
 *         description: Tour status not found
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  '/status/:tourKey',
  requireAuth,
  requireActiveUser,
  tourGuidanceController.getTourStatusByKey
);

/**
 * @openapi
 * /tours/definition/{tourKey}:
 *   get:
 *     summary: Get tour definition by key
 *     description: Get tour definition including all steps and settings by tour key
 *     tags:
 *       - Tour Guidance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tourKey
 *         required: true
 *         schema:
 *           type: string
 *         description: The tour key identifier
 *     responses:
 *       200:
 *         description: Tour definition retrieved successfully
 *       404:
 *         description: Tour definition not found
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  '/definition/:tourKey',
  requireAuth,
  requireActiveUser,
  tourGuidanceController.getTourDefinition
);

/**
 * @openapi
 * /tours/{tourId}/step:
 *   get:
 *     summary: Get current tour step
 *     description: Get the current step information for an active tour
 *     tags:
 *       - Tour Guidance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: tourId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The tour ID
 *     responses:
 *       200:
 *         description: Tour step retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TourStepResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Tour not found or not in progress
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  '/:tourId/step',
  requireAuth,
  requireActiveUser,
  validateRequest(tourIdValidator),
  tourGuidanceController.getTourStep
);

/**
 * @openapi
 * /tours/progress:
 *   put:
 *     summary: Update tour progress
 *     description: Update progress for an active tour (complete step, skip step, etc.)
 *     tags:
 *       - Tour Guidance
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTourProgressRequest'
 *     responses:
 *       200:
 *         description: Tour progress updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserTourProgressResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Tour not found
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put(
  '/progress',
  requireAuth,
  requireActiveUser,
  validateRequest(updateTourProgressValidator),
  tourGuidanceController.updateTourProgress
);

/**
 * @openapi
 * /tours/{tourId}/pause:
 *   put:
 *     summary: Pause a tour
 *     description: Pause an active tour to resume later
 *     tags:
 *       - Tour Guidance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: tourId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The tour ID
 *     responses:
 *       200:
 *         description: Tour paused successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserTourProgressResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Tour not found
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put(
  '/:tourId/pause',
  requireAuth,
  requireActiveUser,
  validateRequest(tourIdValidator),
  tourGuidanceController.pauseTour
);

/**
 * @openapi
 * /tours/{tourId}/resume:
 *   put:
 *     summary: Resume a tour
 *     description: Resume a paused tour
 *     tags:
 *       - Tour Guidance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: tourId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The tour ID
 *     responses:
 *       200:
 *         description: Tour resumed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserTourProgressResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Tour not found
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put(
  '/:tourId/resume',
  requireAuth,
  requireActiveUser,
  validateRequest(tourIdValidator),
  tourGuidanceController.resumeTour
);

/**
 * @openapi
 * /tours/{tourId}/complete:
 *   put:
 *     summary: Complete a tour
 *     description: Mark a tour as completed
 *     tags:
 *       - Tour Guidance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: tourId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The tour ID
 *     responses:
 *       200:
 *         description: Tour completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserTourProgressResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Tour not found
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put(
  '/:tourId/complete',
  requireAuth,
  requireActiveUser,
  validateRequest(tourIdValidator),
  tourGuidanceController.completeTour
);

/**
 * @openapi
 * /tours/{tourId}/dismiss:
 *   put:
 *     summary: Dismiss a tour
 *     description: Dismiss a tour (user doesn't want to see it again)
 *     tags:
 *       - Tour Guidance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: tourId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The tour ID
 *     responses:
 *       200:
 *         description: Tour dismissed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserTourProgressResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Tour not found
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put(
  '/:tourId/dismiss',
  requireAuth,
  requireActiveUser,
  validateRequest(tourIdValidator),
  tourGuidanceController.dismissTour
);

/**
 * @openapi
 * /tours/{tourId}/skip:
 *   put:
 *     summary: Skip the entire tour
 *     description: Skip the entire tour and mark it as completed with all remaining steps skipped
 *     tags:
 *       - Tour Guidance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: tourId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The tour ID
 *       - name: stepId
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *         description: The current step ID (optional)
 *     responses:
 *       200:
 *         description: Tour skipped successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserTourProgressResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Tour not found
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put(
  '/:tourId/skip',
  requireAuth,
  requireActiveUser,
  validateRequest(tourIdValidator),
  tourGuidanceController.skipTour
);

/**
 * @openapi
 * /tours/{tourId}/reset:
 *   put:
 *     summary: Reset a tour
 *     description: Reset a tour to start from the beginning
 *     tags:
 *       - Tour Guidance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: tourId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The tour ID
 *     responses:
 *       200:
 *         description: Tour reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserTourProgressResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Tour not found
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put(
  '/:tourId/reset',
  requireAuth,
  requireActiveUser,
  validateRequest(tourIdValidator),
  tourGuidanceController.resetTour
);

/**
 * @openapi
 * /tours/analytics:
 *   get:
 *     summary: Get tour analytics
 *     description: Get tour analytics data (Admin only)
 *     tags:
 *       - Tour Guidance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - name: tourId
 *         in: query
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by tour ID
 *       - name: userId
 *         in: query
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by user ID
 *       - name: action
 *         in: query
 *         schema:
 *           type: string
 *           enum: [STARTED, STEP_COMPLETED, STEP_SKIPPED, PAUSED, RESUMED, COMPLETED, DISMISSED]
 *         description: Filter by action type
 *       - name: dateFrom
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date (YYYY-MM-DD)
 *       - name: dateTo
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Tour analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedTourAnalyticsResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  '/analytics',
  requireAuth,
  requireActiveUser,
  requireRole([UserRoleEnum.ADMIN]),
  validateRequest(getTourAnalyticsValidator),
  tourGuidanceController.getTourAnalytics
);

export default router;
