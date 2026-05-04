import { Router } from 'express';
import { SlaPolicyController } from '@/controllers/support-ticket/sla-policy.controller';
import {
  requireAuth,
  validateRequest,
  requireUserType,
  requireRole,
} from '@/middleware';
import {
  createSlaPolicyValidation,
  updateSlaPolicyValidation,
  getSlaPolicyByIdValidation,
  deleteSlaPolicyValidation,
  listSlaPoliciesValidation,
  findMatchingSlaPolicyValidation,
} from '@/shared/validators/support-ticket/sla-policy.validator';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';

const router = Router();
const slaPolicyController = new SlaPolicyController();

// Support auth middleware - applies to all routes
const supportAuthMiddleware = [
  requireAuth,
  requireUserType([UserTypeEnum.SUPPORT]),
];

// Admin-only middleware for sensitive operations
const adminOnlyMiddleware = [
  ...supportAuthMiddleware,
  requireRole([UserRoleEnum.ADMIN, UserRoleEnum.ACCOUNT_MANAGER]),
];

/**
 * @openapi
 * components:
 *   schemas:
 *     SlaPolicyCreateRequest:
 *       type: object
 *       required:
 *         - data
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/SlaPolicyCreateData'
 *     SlaPolicyUpdateRequest:
 *       type: object
 *       required:
 *         - data
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/SlaPolicyUpdateData'
 *     SlaPolicyMatchRequest:
 *       type: object
 *       required:
 *         - data
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/SlaPolicyMatchData'
 */

/**
 * @openapi
 * /api/support-tickets/sla-policies:
 *   post:
 *     summary: Create a new SLA policy
 *     tags:
 *       - SLA Policies
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SlaPolicyCreateRequest'
 *           example:
 *             data:
 *               name: "Client High Priority Technical Issues"
 *               description: "SLA policy for high priority technical issues from clients"
 *               entityType: "CLIENT"
 *               category: "TECHNICAL"
 *               priority: "HIGH"
 *               responseTime: 60
 *               resolutionTime: 480
 *               escalationTime: 240
 *               businessHoursOnly: true
 *               workingDaysOnly: true
 *               excludeHolidays: true
 *               isActive: true
 *               isDefault: false
 *     responses:
 *       201:
 *         description: SLA policy created successfully
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
 *                   example: "SLA policy created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/SlaPolicyApiResponse'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
  '/',
  ...adminOnlyMiddleware,
  validateRequest(createSlaPolicyValidation),
  slaPolicyController.createPolicy
);

/**
 * @openapi
 * /api/support-tickets/sla-policies:
 *   get:
 *     summary: List SLA policies with filtering, sorting, and pagination
 *     tags:
 *       - SLA Policies
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - name: filters[entityType]
 *         in: query
 *         description: Filter by entity type
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [CANDIDATE, CLIENT, PARTNER, SUPPORT]
 *       - name: filters[category]
 *         in: query
 *         description: Filter by category
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [TECHNICAL, BILLING, ACCOUNT, FEATURE, BUG, GENERAL, INTEGRATION, SECURITY]
 *       - name: filters[priority]
 *         in: query
 *         description: Filter by priority
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [LOW, MEDIUM, HIGH, URGENT, CRITICAL]
 *       - name: filters[isActive]
 *         in: query
 *         description: Filter by active status
 *         schema:
 *           type: boolean
 *       - name: filters[isDefault]
 *         in: query
 *         description: Filter by default status
 *         schema:
 *           type: boolean
 *       - name: filters[search]
 *         in: query
 *         description: Search in name and description
 *         schema:
 *           type: string
 *       - name: sort[field]
 *         in: query
 *         description: Field to sort by
 *         schema:
 *           type: string
 *           enum: [name, createdAt, updatedAt, responseTime, resolutionTime]
 *           default: name
 *       - name: sort[direction]
 *         in: query
 *         description: Sort direction
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *     responses:
 *       200:
 *         description: SLA policies retrieved successfully
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
 *                   example: "SLA policies retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         items:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/SlaPolicyApiResponse'
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             total:
 *                               type: integer
 *                               example: 25
 *                             page:
 *                               type: integer
 *                               example: 1
 *                             limit:
 *                               type: integer
 *                               example: 20
 *                             totalPages:
 *                               type: integer
 *                               example: 2
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/',
  ...supportAuthMiddleware,
  validateRequest(listSlaPoliciesValidation),
  slaPolicyController.listPolicies
);

/**
 * @openapi
 * /api/support-tickets/sla-policies/statistics:
 *   get:
 *     summary: Get SLA policy statistics
 *     tags:
 *       - SLA Policies
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: SLA policy statistics retrieved successfully
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
 *                   example: "SLA policy statistics retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalPolicies:
 *                       type: integer
 *                       example: 25
 *                     activePolicies:
 *                       type: integer
 *                       example: 20
 *                     defaultPolicies:
 *                       type: integer
 *                       example: 5
 *                     policiesByEntityType:
 *                       type: object
 *                       example:
 *                         CLIENT: 15
 *                         CANDIDATE: 8
 *                         PARTNER: 2
 *                     policiesByCategory:
 *                       type: object
 *                       example:
 *                         TECHNICAL: 12
 *                         BILLING: 5
 *                         ACCOUNT: 8
 *                     policiesByPriority:
 *                       type: object
 *                       example:
 *                         HIGH: 8
 *                         MEDIUM: 12
 *                         LOW: 5
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/statistics',
  ...supportAuthMiddleware,
  slaPolicyController.getPolicyStatistics
);

/**
 * @openapi
 * /api/support-tickets/sla-policies/match:
 *   post:
 *     summary: Find matching SLA policy for given criteria
 *     tags:
 *       - SLA Policies
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SlaPolicyMatchRequest'
 *           example:
 *             data:
 *               entityType: "CLIENT"
 *               category: "TECHNICAL"
 *               priority: "HIGH"
 *     responses:
 *       200:
 *         description: Matching SLA policy found
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
 *                   example: "Matching SLA policy found"
 *                 data:
 *                   type: object
 *                   properties:
 *                     matchedPolicy:
 *                       $ref: '#/components/schemas/SlaPolicyApiResponse'
 *                     isDefault:
 *                       type: boolean
 *                       example: false
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
  '/match',
  ...supportAuthMiddleware,
  validateRequest(findMatchingSlaPolicyValidation),
  slaPolicyController.findMatchingPolicy
);

/**
 * @openapi
 * /api/support-tickets/sla-policies/{id}:
 *   get:
 *     summary: Get an SLA policy by ID
 *     tags:
 *       - SLA Policies
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: SLA policy ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: SLA policy retrieved successfully
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
 *                   example: "SLA policy retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/SlaPolicyApiResponse'
 *       404:
 *         description: SLA policy not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:id',
  ...supportAuthMiddleware,
  validateRequest(getSlaPolicyByIdValidation),
  slaPolicyController.getPolicyById
);

/**
 * @openapi
 * /api/support-tickets/sla-policies/{id}:
 *   put:
 *     summary: Update an SLA policy
 *     tags:
 *       - SLA Policies
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: SLA policy ID
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SlaPolicyUpdateRequest'
 *     responses:
 *       200:
 *         description: SLA policy updated successfully
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
 *                   example: "SLA policy updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/SlaPolicyApiResponse'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: SLA policy not found
 *       500:
 *         description: Internal server error
 */
router.put(
  '/:id',
  ...adminOnlyMiddleware,
  validateRequest(updateSlaPolicyValidation),
  slaPolicyController.updatePolicy
);

/**
 * @openapi
 * /api/support-tickets/sla-policies/{id}:
 *   delete:
 *     summary: Delete an SLA policy
 *     tags:
 *       - SLA Policies
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: SLA policy ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: SLA policy deleted successfully
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
 *                   example: "SLA policy deleted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Bad request - Policy is in use
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: SLA policy not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  '/:id',
  ...adminOnlyMiddleware,
  validateRequest(deleteSlaPolicyValidation),
  slaPolicyController.deletePolicy
);

export default router;
