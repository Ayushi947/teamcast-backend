import { Router } from 'express';
import { FeatureFlagController } from '@/controllers/support/feature.flag.controller';
import { FeatureFlagService } from '@/services/support/feature.flag.service';
import {
  requireAuth,
  requireActiveUser,
  requireRole,
  requireUserType,
  validateRequest,
} from '@/middleware';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';
import {
  featureFlagCreateValidator,
  featureFlagUpdateValidator,
  featureFlagCopyToClientsValidator,
} from '@/shared/validators/support/feature.flag.validator';

const router = Router();

// Initialize service and controller
const featureFlagService = new FeatureFlagService();
const featureFlagController = new FeatureFlagController(featureFlagService);

// Admin-only middleware - applies to management routes
const adminAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireRole([UserRoleEnum.ADMIN]),
  requireUserType([UserTypeEnum.SUPPORT]),
];

/**
 * @openapi
 * /support/feature-flags/public:
 *   get:
 *     summary: Get public feature flags
 *     description: Retrieves enabled feature flags for client use
 *     tags:
 *       - Support
 *       - Feature Flags
 *     parameters:
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Client ID to get client-specific flags
 *       - in: query
 *         name: userType
 *         schema:
 *           type: string
 *           enum: [CANDIDATE, CLIENT, SUPPORT, PARTNER]
 *         description: User type to filter flags
 *     responses:
 *       200:
 *         description: Feature flags retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IFeatureFlagPublicApiResponse'
 */
router.get('/public', featureFlagController.getPublicFeatureFlags);

/**
 * @openapi
 * /support/feature-flags:
 *   get:
 *     summary: Get all feature flags
 *     description: Retrieves all feature flags (admin only)
 *     tags:
 *       - Support
 *       - Feature Flags
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Feature flags retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IFeatureFlagListApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions (admin only)
 */
router.get('/', adminAuthMiddleware, featureFlagController.getAllFeatureFlags);

/**
 * @openapi
 * /support/feature-flags/diff:
 *   get:
 *     summary: Get feature flag diff (global vs client overrides)
 *     description: Returns global flags and client-specific overrides for comparison (admin only)
 *     tags:
 *       - Support
 *       - Feature Flags
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: global and clientOverrides arrays
 */
router.get(
  '/diff',
  adminAuthMiddleware,
  featureFlagController.getFeatureFlagDiff
);

/**
 * @openapi
 * /support/feature-flags/presets:
 *   get:
 *     summary: List feature flag presets
 *     description: Returns all saved presets (e.g. "Proctoring strict") that can be applied to clients (admin only)
 *     tags:
 *       - Support
 *       - Feature Flags
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of presets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string, format: uuid }
 *                       name: { type: string }
 *                       description: { type: string, nullable: true }
 *                       flagConfigs: { type: array, items: { type: object } }
 *                       createdBy: { type: string, nullable: true }
 *                       createdAt: { type: string, format: date-time }
 *                       updatedAt: { type: string, format: date-time }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.get('/presets', adminAuthMiddleware, featureFlagController.listPresets);

/**
 * @openapi
 * /support/feature-flags/presets/{id}:
 *   get:
 *     summary: Get feature flag preset by ID
 *     description: Returns a single preset by ID (admin only)
 *     tags:
 *       - Support
 *       - Feature Flags
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Preset details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Preset not found
 */
router.get(
  '/presets/:id',
  adminAuthMiddleware,
  featureFlagController.getPresetById
);

/**
 * @openapi
 * /support/feature-flags/presets:
 *   post:
 *     summary: Create feature flag preset
 *     description: Create a new preset with a name, optional description, and snapshot of flag configs (admin only)
 *     tags:
 *       - Support
 *       - Feature Flags
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: object
 *                 required: [name, flagConfigs]
 *                 properties:
 *                   name: { type: string }
 *                   description: { type: string, nullable: true }
 *                   flagConfigs:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         key: { type: string }
 *                         name: { type: string }
 *                         enabled: { type: boolean }
 *                         category: { type: string }
 *     responses:
 *       200:
 *         description: Preset created
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/presets',
  adminAuthMiddleware,
  featureFlagController.createPreset
);

/**
 * @openapi
 * /support/feature-flags/presets/{id}:
 *   patch:
 *     summary: Update feature flag preset
 *     description: Update preset name, description, or flag configs (admin only)
 *     tags:
 *       - Support
 *       - Feature Flags
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: object
 *                 properties:
 *                   name: { type: string }
 *                   description: { type: string, nullable: true }
 *                   flagConfigs: { type: array }
 *     responses:
 *       200:
 *         description: Preset updated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Preset not found
 */
router.patch(
  '/presets/:id',
  adminAuthMiddleware,
  featureFlagController.updatePreset
);

/**
 * @openapi
 * /support/feature-flags/presets/{id}:
 *   delete:
 *     summary: Delete feature flag preset
 *     description: Permanently delete a preset (admin only)
 *     tags:
 *       - Support
 *       - Feature Flags
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Preset deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Preset not found
 */
router.delete(
  '/presets/:id',
  adminAuthMiddleware,
  featureFlagController.deletePreset
);

/**
 * @openapi
 * /support/feature-flags/presets/{presetId}/apply:
 *   post:
 *     summary: Apply preset to client
 *     description: Applies the preset's flag configs to the given client (creates or updates client-specific flags) (admin only)
 *     tags:
 *       - Support
 *       - Feature Flags
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: presetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [clientId]
 *             properties:
 *               clientId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Preset applied; returns updated feature flags for the client
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Preset or client not found
 */
router.post(
  '/presets/:presetId/apply',
  adminAuthMiddleware,
  featureFlagController.applyPresetToClient
);

/**
 * @openapi
 * /support/feature-flags/schedules:
 *   post:
 *     summary: Create feature flag schedule
 *     description: Schedule a feature flag to be enabled or disabled at a specific date/time (admin only)
 *     tags:
 *       - Support
 *       - Feature Flags
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: object
 *                 required: [featureFlagId, scheduledAt, action]
 *                 properties:
 *                   featureFlagId:
 *                     type: string
 *                     format: uuid
 *                   clientId:
 *                     type: string
 *                     format: uuid
 *                     nullable: true
 *                     description: Omit for global flag
 *                   scheduledAt:
 *                     type: string
 *                     format: date-time
 *                   action:
 *                     type: string
 *                     enum: [ENABLE, DISABLE]
 *     responses:
 *       200:
 *         description: Schedule created
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Feature flag not found
 */
router.post(
  '/schedules',
  adminAuthMiddleware,
  featureFlagController.createSchedule
);

/**
 * @openapi
 * /support/feature-flags/schedules:
 *   get:
 *     summary: List feature flag schedules
 *     description: List scheduled flag changes with optional filters (admin only)
 *     tags:
 *       - Support
 *       - Feature Flags
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: featureFlagId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPLIED, CANCELLED]
 *     responses:
 *       200:
 *         description: List of schedules
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/schedules',
  adminAuthMiddleware,
  featureFlagController.listSchedules
);

/**
 * @openapi
 * /support/feature-flags/schedules/{id}/cancel:
 *   post:
 *     summary: Cancel a scheduled feature flag change
 *     description: Cancels a PENDING schedule (admin only)
 *     tags:
 *       - Support
 *       - Feature Flags
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Schedule cancelled
 *       400:
 *         description: Bad request - Only PENDING schedules can be cancelled
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Schedule not found
 */
router.post(
  '/schedules/:id/cancel',
  adminAuthMiddleware,
  featureFlagController.cancelSchedule
);

/**
 * @openapi
 * /support/feature-flags/{id}:
 *   get:
 *     summary: Get feature flag by ID
 *     description: Retrieves a specific feature flag (admin only)
 *     tags:
 *       - Support
 *       - Feature Flags
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Feature flag ID
 *     responses:
 *       200:
 *         description: Feature flag retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IFeatureFlagGetApiResponse'
 *       404:
 *         description: Feature flag not found
 */
router.get(
  '/:id',
  adminAuthMiddleware,
  featureFlagController.getFeatureFlagById
);

/**
 * @openapi
 * /support/feature-flags/{id}/copy-to-clients:
 *   post:
 *     summary: Copy feature flag to selected clients
 *     description: Creates client-specific overrides for the given flag on each selected client (admin only)
 *     tags:
 *       - Support
 *       - Feature Flags
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Feature flag ID to copy
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clientIds
 *             properties:
 *               clientIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Copy result with created flags and skipped client IDs
 *       404:
 *         description: Feature flag not found
 */
router.post(
  '/:id/copy-to-clients',
  adminAuthMiddleware,
  validateRequest(featureFlagCopyToClientsValidator),
  featureFlagController.copyFeatureFlagToClients
);

/**
 * @openapi
 * /support/feature-flags:
 *   post:
 *     summary: Create a new feature flag
 *     description: Creates a new feature flag (admin only)
 *     tags:
 *       - Support
 *       - Feature Flags
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IFeatureFlagCreateApiRequest'
 *     responses:
 *       201:
 *         description: Feature flag created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IFeatureFlagCreateApiResponse'
 *       400:
 *         description: Bad request - Invalid input data
 */
router.post(
  '/',
  adminAuthMiddleware,
  validateRequest(featureFlagCreateValidator),
  featureFlagController.createFeatureFlag
);

/**
 * @openapi
 * /support/feature-flags/{id}:
 *   patch:
 *     summary: Update a feature flag
 *     description: Updates an existing feature flag (admin only)
 *     tags:
 *       - Support
 *       - Feature Flags
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Feature flag ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IFeatureFlagUpdateApiRequest'
 *     responses:
 *       200:
 *         description: Feature flag updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IFeatureFlagUpdateApiResponse'
 *       404:
 *         description: Feature flag not found
 */
router.patch(
  '/:id',
  adminAuthMiddleware,
  validateRequest(featureFlagUpdateValidator),
  featureFlagController.updateFeatureFlag
);

/**
 * @openapi
 * /support/feature-flags/{id}:
 *   delete:
 *     summary: Delete a feature flag
 *     description: Deletes a feature flag (admin only)
 *     tags:
 *       - Support
 *       - Feature Flags
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Feature flag ID
 *     responses:
 *       200:
 *         description: Feature flag deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IFeatureFlagDeleteApiResponse'
 *       404:
 *         description: Feature flag not found
 */
router.delete(
  '/:id',
  adminAuthMiddleware,
  featureFlagController.deleteFeatureFlag
);

/**
 * @openapi
 * /support/feature-flags/bulk/toggle:
 *   post:
 *     summary: Bulk toggle feature flags
 *     description: Enable or disable multiple feature flags at once (admin only)
 *     tags:
 *       - Support
 *       - Feature Flags
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *               - enabled
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               enabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Feature flags toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IFeatureFlagListApiResponse'
 */
router.post(
  '/bulk/toggle',
  adminAuthMiddleware,
  featureFlagController.bulkToggleFeatureFlags
);

export default router;
