import { Router } from 'express';
import { ApplicationController } from '@/controllers/candidate/application.controller';
import { CandidateApplicationService } from '@/services/candidate/application.service';
import {
  requireAuth,
  requireActiveUser,
  validateRequest,
  requireCandidateAccess,
} from '@/middleware';
import {
  candidateJobApplicationUpdateValidator,
  candidateJobApplicationListValidator,
  candidateJobApplicationAcceptValidator,
  candidateJobApplicationRejectValidator,
  candidateJobApplicationWithdrawValidator,
} from '@/shared/validators/candidate/application.validator';

const router = Router({ mergeParams: true });

// Initialize services and controller
const applicationService = new CandidateApplicationService();
const applicationController = new ApplicationController(applicationService);

// Candidate auth middleware - applies to all application routes
const candidateAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireCandidateAccess,
];

/**
 * @openapi
 * /candidate/applications:
 *   get:
 *     summary: Get all job applications
 *     description: Retrieves all job applications for the authenticated candidate with comprehensive filtering, searching, and sorting capabilities
 *     tags:
 *       - Candidate Job Applications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortBy'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortOrder'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSearch'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSearchColumns'
 *       - $ref: '#/components/parameters/ICandidateJobApplicationFilterQueryStatus'
 *       - $ref: '#/components/parameters/ICandidateJobApplicationFilterQueryJobTitle'
 *       - $ref: '#/components/parameters/ICandidateJobApplicationFilterQueryCompany'
 *       - $ref: '#/components/parameters/ICandidateJobApplicationFilterQueryIndustry'
 *       - $ref: '#/components/parameters/ICandidateJobApplicationFilterQueryLocation'
 *       - $ref: '#/components/parameters/ICandidateJobApplicationFilterQueryJobType'
 *       - $ref: '#/components/parameters/ICandidateJobApplicationFilterQueryMinSalary'
 *       - $ref: '#/components/parameters/ICandidateJobApplicationFilterQueryMaxSalary'
 *       - $ref: '#/components/parameters/ICandidateJobApplicationFilterQuerySalaryCurrency'
 *       - $ref: '#/components/parameters/ICandidateJobApplicationFilterQueryAppliedAfter'
 *       - $ref: '#/components/parameters/ICandidateJobApplicationFilterQueryAppliedBefore'
 *       - $ref: '#/components/parameters/ICandidateJobApplicationFilterQueryCreatedAfter'
 *       - $ref: '#/components/parameters/ICandidateJobApplicationFilterQueryCreatedBefore'
 *       - $ref: '#/components/parameters/ICandidateJobApplicationFilterQueryUpdatedAfter'
 *       - $ref: '#/components/parameters/ICandidateJobApplicationFilterQueryUpdatedBefore'
 *     responses:
 *       200:
 *         description: Applications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateJobApplicationListGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get(
  '/',
  [
    ...candidateAuthMiddleware,
    validateRequest(candidateJobApplicationListValidator),
  ],
  applicationController.getApplications
);

/**
 * @openapi
 * /candidate/applications/{applicationId}:
 *   get:
 *     summary: Get specific job application
 *     description: Retrieves a specific job application for the authenticated candidate
 *     tags:
 *       - Candidate Job Applications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateJobApplicationIdParams'
 *     responses:
 *       200:
 *         description: Application retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateJobApplicationGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Application not found
 */
router.get(
  '/:applicationId',
  [...candidateAuthMiddleware],
  applicationController.getApplication
);

/**
 * @openapi
 * /candidate/applications/{applicationId}:
 *   patch:
 *     summary: Update job application
 *     description: Updates a job application (accept/reject invitation or update details)
 *     tags:
 *       - Candidate Job Applications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateJobApplicationIdParams'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ICandidateJobApplicationUpdate'
 *     responses:
 *       200:
 *         description: Application updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateJobApplicationUpdateApiResponse'
 *       400:
 *         description: Invalid input data or invalid status transition
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
    ...candidateAuthMiddleware,
    validateRequest(candidateJobApplicationUpdateValidator),
  ],
  applicationController.updateApplication
);

/**
 * @openapi
 * /candidate/applications/{applicationId}/accept:
 *   post:
 *     summary: Accept job application
 *     description: Accept an invited job application
 *     tags:
 *       - Candidate Job Applications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateJobApplicationIdParams'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ICandidateJobApplicationAccept'
 *     responses:
 *       200:
 *         description: Application accepted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateJobApplicationAcceptApiResponse'
 *       400:
 *         description: Invalid input data or invalid status transition
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Application not found
 */
router.post(
  '/:applicationId/accept',
  [
    ...candidateAuthMiddleware,
    validateRequest(candidateJobApplicationAcceptValidator),
  ],
  applicationController.acceptApplication
);

/**
 * @openapi
 * /candidate/applications/{applicationId}/reject:
 *   post:
 *     summary: Reject job application
 *     description: Reject an invited job application
 *     tags:
 *       - Candidate Job Applications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateJobApplicationIdParams'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ICandidateJobApplicationReject'
 *     responses:
 *       200:
 *         description: Application rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateJobApplicationRejectApiResponse'
 *       400:
 *         description: Invalid input data or invalid status transition
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Application not found
 */
router.post(
  '/:applicationId/reject',
  [
    ...candidateAuthMiddleware,
    validateRequest(candidateJobApplicationRejectValidator),
  ],
  applicationController.rejectApplication
);

/**
 * @openapi
 * /candidate/applications/{applicationId}/withdraw:
 *   post:
 *     summary: Withdraw job application
 *     description: Withdraw an in-progress job application
 *     tags:
 *       - Candidate Job Applications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateJobApplicationIdParams'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ICandidateJobApplicationWithdraw'
 *     responses:
 *       200:
 *         description: Application withdrawn successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateJobApplicationWithdrawApiResponse'
 *       400:
 *         description: Invalid input data or invalid status transition
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Application not found
 */
router.post(
  '/:applicationId/withdraw',
  [
    ...candidateAuthMiddleware,
    validateRequest(candidateJobApplicationWithdrawValidator),
  ],
  applicationController.withdrawApplication
);

/**
 * @openapi
 * /candidate/applications/{applicationId}/ai-assessment:
 *   get:
 *     summary: Get AI assessment for an application
 *     description: Get the AI assessment details for a specific application (Candidate only)
 *     tags:
 *       - Candidate Job Applications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateJobApplicationIdParams'
 *     responses:
 *       200:
 *         description: AI assessment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateJobApplicationGetAiAssessmentApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Application or AI assessment not found
 */
router.get(
  '/:applicationId/ai-assessment',
  [...candidateAuthMiddleware],
  applicationController.getCandidateApplicationAiAssessment
);

export default router;
