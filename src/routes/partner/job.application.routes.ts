import { Router } from 'express';
import { PartnerJobApplicationController } from '@/controllers/partner/job.application.controller';
import { PartnerJobApplicationService } from '@/services/partner/job.application.service';
import {
  requireActiveUser,
  requireAuth,
  requireUserType,
  validateRequest,
} from '@/middleware';
import { UserTypeEnum } from '@/shared/models/common/enums';
import {
  partnerJobApplicationsListValidator,
  partnerJobApplicationByIdValidator,
  partnerJobApplicationWithdrawValidator,
} from '@/shared/validators/partner/job.application.validator';

const router = Router();

// Initialize services and controller
const partnerJobApplicationService = new PartnerJobApplicationService();
const partnerJobApplicationController = new PartnerJobApplicationController(
  partnerJobApplicationService
);

// Partner auth middleware - applies to all job application routes
const partnerAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.PARTNER]),
];

/**
 * @openapi
 * /partner/job-applications:
 *   get:
 *     summary: Get partner's job applications
 *     description: Returns all job applications submitted by the partner with filtering and pagination
 *     tags:
 *       - Partner Job Applications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortBy'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortOrder'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSearch'
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/ApplicationStatusEnum'
 *         description: Filter by application status
 *       - in: query
 *         name: jobPostingId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by job posting ID
 *       - in: query
 *         name: candidateId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by candidate ID
 *       - in: query
 *         name: appliedAfter
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter applications submitted after this date
 *       - in: query
 *         name: appliedBefore
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter applications submitted before this date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 256
 *         description: Search term to match against candidate name, email, job title, or job posting title
 *     responses:
 *       200:
 *         description: Job applications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerJobApplicationListApiResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/',
  [
    ...partnerAuthMiddleware,
    validateRequest(partnerJobApplicationsListValidator),
  ],
  partnerJobApplicationController.getJobApplications
);

/**
 * @openapi
 * /partner/job-applications/{id}:
 *   get:
 *     summary: Get a specific job application by ID
 *     description: Returns detailed information about a specific job application submitted by the partner
 *     tags:
 *       - Partner Job Applications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The job application ID
 *     responses:
 *       200:
 *         description: Job application retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerJobApplicationByIdApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job application not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:id',
  [
    ...partnerAuthMiddleware,
    validateRequest(partnerJobApplicationByIdValidator),
  ],
  partnerJobApplicationController.getJobApplicationById
);

/**
 * @openapi
 * /partner/job-applications/{id}/withdraw:
 *   post:
 *     summary: Withdraw a job application
 *     description: Withdraws a job application submitted by the partner
 *     tags:
 *       - Partner Job Applications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The job application ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Optional reason for withdrawing the application
 *     responses:
 *       200:
 *         description: Job application withdrawn successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerJobApplicationWithdrawApiResponse'
 *       400:
 *         description: Bad request - Application cannot be withdrawn
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job application not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/:id/withdraw',
  [
    ...partnerAuthMiddleware,
    validateRequest(partnerJobApplicationWithdrawValidator),
  ],
  partnerJobApplicationController.withdrawJobApplication
);

export default router;
