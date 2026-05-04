import { Router } from 'express';
import { SupportApplicationController } from '@/controllers/support/application.controller';
import { SupportApplicationService } from '@/services/support/application.service';
import {
  requireAuth,
  requireActiveUser,
  requireRole,
  validateRequest,
  requireUserType,
} from '@/middleware';
import {
  supportApplicationListValidator,
  supportApplicationIdValidator,
  supportApplicationStatisticsValidator,
} from '@/shared/validators/support/application.validator';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';

const router = Router();

// Initialize services and controller
const supportApplicationService = new SupportApplicationService();
const supportApplicationController = new SupportApplicationController(
  supportApplicationService
);

// Support auth middleware - applies to all application routes
const supportAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.SUPPORT]),
];

// Recruiter and Account Manager middleware - applies to all application routes
const roleRecruiterAccountManagerMiddleware = [
  ...supportAuthMiddleware,
  requireRole([
    UserRoleEnum.RECRUITER,
    UserRoleEnum.ACCOUNT_MANAGER,
    UserRoleEnum.ADMIN,
  ]),
];

/**
 * @openapi
 * /support/applications:
 *   get:
 *     summary: List support applications
 *     description: Get a list of all accepted applications for support (Recruiter and Account Manager only)
 *     tags:
 *       - Support Job Applications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortBy'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortOrder'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSearch'
 *       - $ref: '#/components/parameters/ISupportJobApplicationFilterQueryJobId'
 *       - $ref: '#/components/parameters/ISupportJobApplicationFilterQueryCandidateId'
 *       - $ref: '#/components/parameters/ISupportJobApplicationFilterQueryClientId'
 *       - $ref: '#/components/parameters/ISupportJobApplicationFilterQueryPartnerId'
 *       - $ref: '#/components/parameters/ISupportJobApplicationFilterQueryDateFrom'
 *       - $ref: '#/components/parameters/ISupportJobApplicationFilterQueryDateTo'
 *     responses:
 *       200:
 *         description: List of accepted applications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportJobApplicationListApiResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get(
  '/',
  [
    ...roleRecruiterAccountManagerMiddleware,
    validateRequest(supportApplicationListValidator),
  ],
  supportApplicationController.listSupportApplications
);

/**
 * @openapi
 * /support/applications/{applicationId}:
 *   get:
 *     summary: Get support application
 *     description: Get a specific accepted application by ID (Recruiter and Account Manager only)
 *     tags:
 *       - Support Job Applications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ISupportJobApplicationIdParams'
 *     responses:
 *       200:
 *         description: Application retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportJobApplicationGetApiResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Application not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:applicationId',
  [
    ...roleRecruiterAccountManagerMiddleware,
    validateRequest(supportApplicationIdValidator),
  ],
  supportApplicationController.getSupportApplication
);

/**
 * @openapi
 * /support/applications/{applicationId}/ai-assessment:
 *   get:
 *     summary: Get AI assessment for an application
 *     description: Get the AI assessment details for a specific accepted application (Recruiter and Account Manager only)
 *     tags:
 *       - Support Job Applications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ISupportJobApplicationIdParams'
 *     responses:
 *       200:
 *         description: AI assessment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportJobApplicationGetAiAssessmentApiResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Application or AI assessment not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:applicationId/ai-assessment',
  [
    ...roleRecruiterAccountManagerMiddleware,
    validateRequest(supportApplicationIdValidator),
  ],
  supportApplicationController.getSupportApplicationAiAssessment
);

/**
 * @openapi
 * /support/applications/statistics/conversion:
 *   get:
 *     summary: Get conversion statistics
 *     description: Get conversion statistics for support dashboard (Recruiter and Account Manager only)
 *     tags:
 *       - Support Job Applications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ISupportJobApplicationStatisticsQueryDateFrom'
 *       - $ref: '#/components/parameters/ISupportJobApplicationStatisticsQueryDateTo'
 *     responses:
 *       200:
 *         description: Conversion statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportJobApplicationStatisticsApiResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get(
  '/statistics/conversion',
  [
    ...roleRecruiterAccountManagerMiddleware,
    validateRequest(supportApplicationStatisticsValidator),
  ],
  supportApplicationController.getConversionStatistics
);

export default router;
