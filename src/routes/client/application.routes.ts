import { Router } from 'express';
import { ClientApplicationController } from '@/controllers/client/application.controller';
import { ClientApplicationService } from '@/services/client/application.service';
import {
  requireAuth,
  requireActiveUser,
  requireRole,
  validateRequest,
  requireUserType,
} from '@/middleware';
import {
  clientApplicationListValidator,
  clientApplicationIdValidator,
  clientApplicationStatusUpdateValidator,
  clientApplicationHireRequestValidator,
} from '@/shared/validators/client/application.validator';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';

const router = Router();

// Initialize services and controller
const clientApplicationService = new ClientApplicationService();
const clientApplicationController = new ClientApplicationController(
  clientApplicationService
);

// All routes require authentication and active user
router.use(
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.CLIENT])
);

// Client auth middleware - applies to all application routes
const clientAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.CLIENT]),
];

// HR/Admin middleware - applies to all application routes
const roleHrAdminOnlyMiddleware = [
  ...clientAuthMiddleware,
  requireRole([UserRoleEnum.HR, UserRoleEnum.ADMIN, UserRoleEnum.RECRUITER]),
];

/**
 * @openapi
 * /client/applications:
 *   get:
 *     summary: List client applications
 *     description: Get a list of all applications for the client (HR and Admin only)
 *     tags:
 *       - Client Job Applications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortBy'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortOrder'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSearch'
 *       - $ref: '#/components/parameters/IClientJobApplicationFilterQueryJobId'
 *       - $ref: '#/components/parameters/IClientJobApplicationFilterQueryUserId'
 *       - $ref: '#/components/parameters/IClientJobApplicationFilterQueryStatus'
 *     responses:
 *       200:
 *         description: List of client applications
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientJobApplicationListApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get(
  '/',
  [
    ...roleHrAdminOnlyMiddleware,
    validateRequest(clientApplicationListValidator),
  ],
  clientApplicationController.listClientApplications
);

/**
 * @openapi
 * /client/applications/{applicationId}:
 *   get:
 *     summary: Get client application
 *     description: Get a specific application by ID (HR and Admin only)
 *     tags:
 *       - Client Job Applications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IClientJobApplicationIdParams'
 *     responses:
 *       200:
 *         description: Application retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientJobApplicationGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Application not found
 */
router.get(
  '/:applicationId',
  [...roleHrAdminOnlyMiddleware, validateRequest(clientApplicationIdValidator)],
  clientApplicationController.getClientApplication
);

/**
 * @openapi
 * /client/applications/{applicationId}/ai-assessment:
 *   get:
 *     summary: Get AI assessment for an application
 *     description: Get the AI assessment details for a specific application (HR and Admin only)
 *     tags:
 *       - Client Job Applications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IClientJobApplicationIdParams'
 *     responses:
 *       200:
 *         description: AI assessment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientJobApplicationGetAiAssessmentApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Application or AI assessment not found
 */
router.get(
  '/:applicationId/ai-assessment',
  [...roleHrAdminOnlyMiddleware, validateRequest(clientApplicationIdValidator)],
  clientApplicationController.getClientApplicationAiAssessment
);

/**
 * @openapi
 * /client/applications/{applicationId}:
 *   patch:
 *     summary: Update application status
 *     description: Update the status of a job application (accept/reject) and send notification to candidate (HR and Admin only)
 *     tags:
 *       - Client Job Applications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IClientJobApplicationIdParams'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientJobApplicationStatusUpdate'
 *           example:
 *             status: ACCEPTED
 *             notes: "Congratulations! We would like to proceed with your application."
 *     responses:
 *       200:
 *         description: Application status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientJobApplicationUpdateApiResponse'
 *       400:
 *         description: Bad request - Invalid status transition or data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Application not found
 */
router.patch(
  '/:applicationId',
  [
    ...roleHrAdminOnlyMiddleware,
    validateRequest(clientApplicationStatusUpdateValidator),
  ],
  clientApplicationController.updateApplicationStatus
);

/**
 * @openapi
 * /client/applications/{applicationId}/hire:
 *   post:
 *     summary: Process hire request
 *     description: Process a hire request and send email notification to account manager (HR and Admin only)
 *     tags:
 *       - Client Job Applications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IClientJobApplicationIdParams'
 *     responses:
 *       200:
 *         description: Hire request processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Hire request processed successfully. Account manager has been notified."
 *       400:
 *         description: Bad request - Invalid application or missing data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Application or account manager not found
 */
router.post(
  '/:applicationId/hire',
  [
    ...roleHrAdminOnlyMiddleware,
    validateRequest(clientApplicationHireRequestValidator),
  ],
  clientApplicationController.processHireRequest
);

export default router;
