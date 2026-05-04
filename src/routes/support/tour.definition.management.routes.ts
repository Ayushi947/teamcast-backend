import { Router } from 'express';
import { TourDefinitionManagementController } from '@/controllers/support/tour.definition.management.controller';
import { TourDefinitionManagementService } from '@/services/support/tour.definition.management.service';
import {
  requireActiveUser,
  requireAuth,
  requireRole,
  requireUserType,
} from '@/middleware';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';

const router = Router();

const tourDefinitionManagementService = new TourDefinitionManagementService();
const tourDefinitionManagementController =
  new TourDefinitionManagementController(tourDefinitionManagementService);

const adminAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireRole([UserRoleEnum.ADMIN]),
  requireUserType([UserTypeEnum.SUPPORT]),
];

/**
 * @openapi
 * /support/tour-definitions:
 *   get:
 *     summary: Get all tour definitions with pagination and filters
 *     description: Retrieves all tour definitions with optional filtering and pagination (Admin only)
 *     tags:
 *       - Support - Tour Definitions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - name: userType
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by user type
 *       - name: userRole
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by user role
 *       - name: isActive
 *         in: query
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - name: tourGroup
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by tour group
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *         description: Search in name, tourKey, or description
 *     responses:
 *       200:
 *         description: Tour definitions retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get(
  '/',
  adminAuthMiddleware,
  tourDefinitionManagementController.getAllTourDefinitions
);

/**
 * @openapi
 * /support/tour-definitions/groups:
 *   get:
 *     summary: Get all unique tour groups
 *     description: Retrieves all unique tour group identifiers (Admin only)
 *     tags:
 *       - Support - Tour Definitions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tour groups retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get(
  '/groups',
  adminAuthMiddleware,
  tourDefinitionManagementController.getTourGroups
);

/**
 * @openapi
 * /support/tour-definitions/{tourId}:
 *   get:
 *     summary: Get tour definition by ID
 *     description: Retrieves a single tour definition by its ID (Admin only)
 *     tags:
 *       - Support - Tour Definitions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: tourId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Tour definition ID
 *     responses:
 *       200:
 *         description: Tour definition retrieved successfully
 *       404:
 *         description: Tour definition not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get(
  '/:tourId',
  adminAuthMiddleware,
  tourDefinitionManagementController.getTourDefinitionById
);

/**
 * @openapi
 * /support/tour-definitions/key/{tourKey}:
 *   get:
 *     summary: Get tour definition by tour key
 *     description: Retrieves a single tour definition by its tour key (Admin only)
 *     tags:
 *       - Support - Tour Definitions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: tourKey
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Tour key identifier
 *     responses:
 *       200:
 *         description: Tour definition retrieved successfully
 *       404:
 *         description: Tour definition not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get(
  '/key/:tourKey',
  adminAuthMiddleware,
  tourDefinitionManagementController.getTourDefinitionByKey
);

/**
 * @openapi
 * /support/tour-definitions:
 *   post:
 *     summary: Create a new tour definition
 *     description: Creates a new tour definition (Admin only)
 *     tags:
 *       - Support - Tour Definitions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data
 *             properties:
 *               data:
 *                 type: object
 *                 required:
 *                   - tourKey
 *                   - name
 *                   - userType
 *                   - isActive
 *                   - priority
 *                   - version
 *                   - triggerConditions
 *                   - tourSteps
 *                   - tourSettings
 *     responses:
 *       201:
 *         description: Tour definition created successfully
 *       400:
 *         description: Bad request
 *       409:
 *         description: Tour definition with this key already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.post(
  '/',
  adminAuthMiddleware,
  tourDefinitionManagementController.createTourDefinition
);

/**
 * @openapi
 * /support/tour-definitions/{tourId}:
 *   put:
 *     summary: Update a tour definition
 *     description: Updates an existing tour definition (Admin only)
 *     tags:
 *       - Support - Tour Definitions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: tourId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Tour definition ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data
 *             properties:
 *               data:
 *                 type: object
 *                 description: Partial tour definition data to update
 *     responses:
 *       200:
 *         description: Tour definition updated successfully
 *       404:
 *         description: Tour definition not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.put(
  '/:tourId',
  adminAuthMiddleware,
  tourDefinitionManagementController.updateTourDefinition
);

/**
 * @openapi
 * /support/tour-definitions/{tourId}:
 *   delete:
 *     summary: Delete a tour definition
 *     description: Deletes a tour definition (Admin only)
 *     tags:
 *       - Support - Tour Definitions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: tourId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Tour definition ID
 *     responses:
 *       200:
 *         description: Tour definition deleted successfully
 *       404:
 *         description: Tour definition not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.delete(
  '/:tourId',
  adminAuthMiddleware,
  tourDefinitionManagementController.deleteTourDefinition
);

/**
 * @openapi
 * /support/tour-definitions/{tourId}/toggle-status:
 *   put:
 *     summary: Toggle tour definition active status
 *     description: Toggles the active status of a tour definition (Admin only)
 *     tags:
 *       - Support - Tour Definitions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: tourId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Tour definition ID
 *     responses:
 *       200:
 *         description: Tour definition status toggled successfully
 *       404:
 *         description: Tour definition not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.put(
  '/:tourId/toggle-status',
  adminAuthMiddleware,
  tourDefinitionManagementController.toggleTourDefinitionStatus
);

export default router;
