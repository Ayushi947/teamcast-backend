import { Router } from 'express';
import { CandidatePanelAssessmentController } from '@/controllers/candidate/job.panel.assessment.controller';
import { NotificationFactory } from '@/services/notification/notification.factory';

import {
  requireAuth,
  requireActiveUser,
  validateRequest,
  requireCandidateAccess,
} from '@/middleware';
import {
  candidatePanelAssessmentInvitationResponseValidator,
  candidatePanelAssessmentInvitationGetValidator,
  candidatePanelAssessmentSlotsGetValidator,
} from '@/shared/validators/candidate/job.panel.assessment.validator';
import { CandidatePanelAssessmentService } from '@/services/candidate/job.panel.assessment.service';

const router = Router();

// Initialize notification provider
const notificationProvider =
  new NotificationFactory().getNotificationProvider();

// Initialize service and controller
const panelAssessmentService = new CandidatePanelAssessmentService(
  notificationProvider
);
const controller = new CandidatePanelAssessmentController(
  panelAssessmentService
);

// Candidate auth middleware - applies to all panel assessment routes
const candidateAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireCandidateAccess,
];

/**
 * @openapi
 * /candidate/panel-assessment/invitations/{invitationId}:
 *   get:
 *     summary: Get panel assessment invitation details
 *     tags:
 *       - Candidate Panel Assessment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invitationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Panel assessment invitation ID
 *     responses:
 *       200:
 *         description: Panel assessment invitation retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidatePanelAssessmentInvitationGetApiResponse'
 *       400:
 *         description: Invalid input data or already applied
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Job posting not found
 */
router.get(
  '/invitations/:invitationId',
  [
    ...candidateAuthMiddleware,
    validateRequest(candidatePanelAssessmentInvitationGetValidator),
  ],
  controller.getInvitation
);

/**
 * @openapi
 * /candidate/panel-assessment/invitations/{invitationId}/respond:
 *   post:
 *     summary: Respond to panel assessment invitation
 *     description: Candidate can accept or reject a panel assessment invitation. When accepting, a slot must be selected.
 *     tags:
 *       - Candidate Panel Assessment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invitationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Panel assessment invitation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [accept, reject]
 *                 description: Action taken by the candidate
 *               selectedSlotId:
 *                 type: string
 *                 format: uuid
 *                 description: Selected slot ID (required when accepting)
 *           examples:
 *             accept:
 *               summary: Accept invitation with slot selection
 *               value:
 *                 action: "accept"
 *                 selectedSlotId: "123e4567-e89b-12d3-a456-426614174000"
 *             reject:
 *               summary: Reject invitation
 *               value:
 *                 action: "reject"
 *     responses:
 *       200:
 *         description: Panel assessment invitation retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidatePanelAssessmentInvitationGetApiResponse'
 *       400:
 *         description: Invalid input data or already applied
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Job posting not found
 */
router.post(
  '/invitations/:invitationId/respond',
  [
    ...candidateAuthMiddleware,
    validateRequest(candidatePanelAssessmentInvitationResponseValidator),
  ],
  controller.respondToInvitation
);

/**
 * @openapi
 * /candidate/panel-assessment/{panelAssessmentId}/slots:
 *   get:
 *     summary: Get available slots for panel assessment
 *     description: Get all available time slots for a specific panel assessment that the candidate can choose from
 *     tags:
 *       - Candidate Panel Assessment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: panelAssessmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Panel assessment ID
 *     responses:
 *       200:
 *         description: Panel assessment invitation retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidatePanelAssessmentInvitationGetApiResponse'
 *       400:
 *         description: Invalid input data or already applied
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Job posting not found
 */
router.get(
  '/:panelAssessmentId/slots',
  [
    ...candidateAuthMiddleware,
    validateRequest(candidatePanelAssessmentSlotsGetValidator),
  ],
  controller.getAvailableSlots
);

/**
 * @openapi
 * /candidate/panel-assessment/interviews:
 *   get:
 *     summary: Get scheduled interviews for candidate
 *     description: Get all scheduled interviews for the candidate
 *     tags:
 *       - Candidate Panel Assessment
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Scheduled interviews retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateListScheduledInterviewsApiResponse'
 *       400:
 *         description: Invalid input data or already applied
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Job posting not found
 */
router.get(
  '/interviews',
  ...candidateAuthMiddleware,
  controller.listScheduledInterviews
);

export default router;
