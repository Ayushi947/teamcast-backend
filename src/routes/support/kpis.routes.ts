import { Router } from 'express';
import {
  requireAuth,
  requireRole,
  validateRequest,
  requireUserType,
} from '@/middleware';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';
import { SupportKpisController } from '@/controllers/support/kpis.controller';
import {
  supportCandidateKpisValidator,
  supportFilterOptionsValidator,
} from '@/shared/validators/support/kpis.validator';
import { SupportKpisService } from '@/services/support/kpis.service';

const router = Router();

const supportKpisService = new SupportKpisService();
const supportKpisController = new SupportKpisController(supportKpisService);

const supportAuthMiddleware = [
  requireAuth,
  requireRole([UserRoleEnum.ADMIN, UserRoleEnum.ACCOUNT_MANAGER]),
  requireUserType([UserTypeEnum.SUPPORT]),
];

/**
 * @openapi
 * /support/kpis/candidates:
 *   get:
 *     summary: Get candidate KPIs with enhanced multi-filter support
 *     description: Retrieve comprehensive candidate KPIs with support for traditional filters and ID-based filters
 *     tags:
 *       - Support KPIs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ISupportCandidateKpisFilterQueryStartDate'
 *       - $ref: '#/components/parameters/ISupportCandidateKpisFilterQueryEndDate'
 *       - $ref: '#/components/parameters/ISupportCandidateKpisFilterQueryFilterBy'
 *     responses:
 *       200:
 *         description: Successfully retrieved candidate KPIs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportCandidateKpisApiResponse'
 *       400:
 *         description: Invalid filter parameters
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       500:
 *         description: Internal server error
 */
router.get(
  '/candidates',
  supportAuthMiddleware,
  validateRequest(supportCandidateKpisValidator),
  supportKpisController.getCandidateKpis.bind(supportKpisController)
);

/**
 * @openapi
 * /support/kpis/candidates/filter-options:
 *   get:
 *     summary: Get comprehensive filter options for candidate KPIs
 *     description: Retrieve all available filter options with hierarchical relationships for the candidate KPIs endpoint
 *     tags:
 *       - Support KPIs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved filter options
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportCandidateKpisFilterOptionsApiResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       500:
 *         description: Internal server error
 */
router.get(
  '/candidates/filter-options',
  supportAuthMiddleware,
  validateRequest(supportFilterOptionsValidator),
  supportKpisController.getFilterOptions.bind(supportKpisController)
);

/**
 * @openapi
 * /support/kpis/candidates/export:
 *   get:
 *     summary: Export candidate KPIs data as CSV
 *     description: Export filtered candidate data as CSV with important fields for performance analysis
 *     tags:
 *       - Support KPIs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ISupportCandidateKpisFilterQueryStartDate'
 *       - $ref: '#/components/parameters/ISupportCandidateKpisFilterQueryEndDate'
 *       - $ref: '#/components/parameters/ISupportCandidateKpisFilterQueryFilterBy'
 *     responses:
 *       200:
 *         description: Successfully exported candidate KPIs data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportCandidateKpisExportApiResponse'
 *       400:
 *         description: Invalid filter parameters
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       500:
 *         description: Internal server error
 */
router.get(
  '/candidates/export',
  supportAuthMiddleware,
  validateRequest(supportCandidateKpisValidator),
  supportKpisController.exportCandidateKpis.bind(supportKpisController)
);

export default router;
