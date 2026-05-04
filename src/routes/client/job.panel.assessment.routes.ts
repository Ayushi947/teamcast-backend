import { Router } from 'express';
import { ClientJobPanelAssessmentController } from '@/controllers/client/job.panel.assessment.controller';
import { ClientTeamsMeetingController } from '@/controllers/client/teams.meeting.controller';
import { ClientJobPanelAssessmentService } from '@/services/client/job.panel.assessment.service';
import { NotificationFactory } from '@/services/notification/notification.factory';
import {
  requireAuth,
  requireActiveUser,
  requireRole,
  validateRequest,
  requireUserType,
} from '@/middleware';
import {
  panelAssessmentSlotCreateValidator,
  panelAssessmentSlotUpdateValidator,
  panelAssessmentSlotIdValidator,
  panelAssessmentSlotListValidator,
  panelAssessmentInvitationCreateValidator,
  panelAssessmentInvitationIdValidator,
  panelAssessmentInvitationListValidator,
  publicPanelAssessmentFeedbackSubmitValidator,
  panelAssessmentFeedbackSubmitInternalValidator,
  panelAssessmentFeedbackListValidator,
  panelAssessmentMeetingGenerateValidator,
  panelAssessmentMeetingUpdateValidator,
  panelAssessmentMeetingCancelValidator,
  clientPanelAssessmentMeetingDetailsGetValidator,
  publicPanelAssessmentFeedbackTokenValidator,
  panelAssessmentIdValidator,
} from '@/shared/validators/client/job.panel.assessment.validator';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';

const router = Router();

// Initialize services and controllers
const notificationProvider =
  new NotificationFactory().getNotificationProvider();
const panelAssessmentService = new ClientJobPanelAssessmentService(
  notificationProvider
);
const panelAssessmentController = new ClientJobPanelAssessmentController(
  panelAssessmentService
);
const teamsMeetingController = new ClientTeamsMeetingController(
  panelAssessmentService
);

// PUBLIC ROUTES (no authentication required) - Must be defined BEFORE authentication middleware

/**
 * @openapi
 * /client/panel-assessment/feedback/form/{feedbackToken}:
 *   get:
 *     summary: Get feedback form HTML
 *     description: Get HTML feedback form for external panel members (no authentication required)
 *     tags:
 *       - Client Panel Assessment
 *     parameters:
 *       - in: path
 *         name: feedbackToken
 *         required: true
 *         schema:
 *           type: string
 *         description: Feedback token
 *     responses:
 *       200:
 *         description: HTML feedback form
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       404:
 *         description: Feedback token not found or expired
 */
router.get(
  '/feedback/form/:feedbackToken',
  validateRequest(publicPanelAssessmentFeedbackTokenValidator),
  panelAssessmentController.getFeedbackForm
);

/**
 * @openapi
 * /client/panel-assessment/feedback/public/{feedbackToken}:
 *   post:
 *     summary: Submit public panel assessment feedback
 *     description: Submit feedback for a panel assessment (no authentication required)
 *     tags:
 *       - Client Panel Assessment
 *     parameters:
 *       - in: path
 *         name: feedbackToken
 *         required: true
 *         schema:
 *           type: string
 *         description: Feedback token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IPublicJobPanelAssessmentFeedbackSubmitApiRequest'
 *     responses:
 *       200:
 *         description: Panel assessment feedback submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPublicJobPanelAssessmentFeedbackSubmitApiResponse'
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Panel assessment not found
 */
router.post(
  '/feedback/public/:feedbackToken',
  validateRequest(publicPanelAssessmentFeedbackSubmitValidator),
  panelAssessmentController.submitPublicJobPanelAssessmentFeedback
);

/**
 * @openapi
 * /client/panel-assessment/feedback/public/{feedbackToken}:
 *   get:
 *     summary: Get feedback details by token
 *     description: Get feedback details and assessment information for external feedback form (no authentication required)
 *     tags:
 *       - Client Panel Assessment
 *     parameters:
 *       - in: path
 *         name: feedbackToken
 *         required: true
 *         schema:
 *           type: string
 *         description: Feedback token
 *     responses:
 *       200:
 *         description: Feedback details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPublicJobPanelAssessmentFeedbackGetApiResponse'
 *       404:
 *         description: Feedback token not found or expired
 */
router.get(
  '/feedback/public/:feedbackToken',
  validateRequest(publicPanelAssessmentFeedbackTokenValidator),
  panelAssessmentController.getFeedbackByToken
);

// All other routes require authentication and active user
router.use(
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.CLIENT, UserTypeEnum.SUPPORT])
);

// Panel Assessment Slot Routes

/**
 * @openapi
 * /client/panel-assessment/slots:
 *   post:
 *     summary: Create one or more panel assessment slots
 *     description: Create one or more time slots for a panel assessment. Supports creating multiple slots in a single request with automatic conflict detection.
 *     tags:
 *       - Client Panel Assessment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobApplicationId
 *               - slots
 *             properties:
 *               jobApplicationId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the job application
 *               slots:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 20
 *                 description: Array of time slots to create (1-20 slots)
 *                 items:
 *                   type: object
 *                   required:
 *                     - startDateTime
 *                     - endDateTime
 *                     - timeZone
 *                     - panelMemberEmails
 *                     - panelMemberNames
 *                     - hostEmail
 *                     - hostName
 *                   properties:
 *                     startDateTime:
 *                       type: string
 *                       format: date-time
 *                       description: Start date and time of the slot
 *                     endDateTime:
 *                       type: string
 *                       format: date-time
 *                       description: End date and time of the slot
 *                     timeZone:
 *                       type: string
 *                       description: Time zone for the slot
 *                       example: "America/New_York"
 *                     panelMemberEmails:
 *                       type: array
 *                       items:
 *                         type: string
 *                         format: email
 *                       minItems: 1
 *                       maxItems: 10
 *                       description: Array of panel member email addresses
 *                     panelMemberNames:
 *                       type: array
 *                       items:
 *                         type: string
 *                       minItems: 1
 *                       maxItems: 10
 *                       description: Array of panel member names (must match emails array length)
 *                     hostEmail:
 *                       type: string
 *                       format: email
 *                       description: Email of the meeting host
 *                     hostName:
 *                       type: string
 *                       description: Name of the meeting host
 *           examples:
 *             singleSlot:
 *               summary: Create a single slot
 *               value:
 *                 jobApplicationId: "123e4567-e89b-12d3-a456-426614174000"
 *                 slots:
 *                   - startDateTime: "2024-12-15T10:00:00Z"
 *                     endDateTime: "2024-12-15T11:00:00Z"
 *                     timeZone: "America/New_York"
 *                     panelMemberEmails: ["john@company.com", "jane@company.com"]
 *                     panelMemberNames: ["John Doe", "Jane Smith"]
 *                     hostEmail: "john@company.com"
 *                     hostName: "John Doe"
 *             multipleSlots:
 *               summary: Create multiple slots
 *               value:
 *                 jobApplicationId: "123e4567-e89b-12d3-a456-426614174000"
 *                 slots:
 *                   - startDateTime: "2024-12-15T10:00:00Z"
 *                     endDateTime: "2024-12-15T11:00:00Z"
 *                     timeZone: "America/New_York"
 *                     panelMemberEmails: ["john@company.com", "jane@company.com"]
 *                     panelMemberNames: ["John Doe", "Jane Smith"]
 *                     hostEmail: "john@company.com"
 *                     hostName: "John Doe"
 *                   - startDateTime: "2024-12-15T14:00:00Z"
 *                     endDateTime: "2024-12-15T15:00:00Z"
 *                     timeZone: "America/New_York"
 *                     panelMemberEmails: ["alice@company.com", "bob@company.com"]
 *                     panelMemberNames: ["Alice Johnson", "Bob Wilson"]
 *                     hostEmail: "alice@company.com"
 *                     hostName: "Alice Johnson"
 *     responses:
 *       201:
 *         description: Slots created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   description: Success message indicating number of slots created
 *                 data:
 *                   type: object
 *                   properties:
 *                     slots:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/IClientJobPanelAssessmentSlot'
 *                     message:
 *                       type: string
 *       400:
 *         description: Validation error or slot conflicts
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Job application not found
 */
router.post(
  '/slots',
  requireRole([UserRoleEnum.ADMIN, UserRoleEnum.HR, UserRoleEnum.RECRUITER]),
  validateRequest(panelAssessmentSlotCreateValidator),
  panelAssessmentController.createPanelAssessmentSlot.bind(
    panelAssessmentController
  )
);

/**
 * @openapi
 * /client/panel-assessment/slots:
 *   get:
 *     summary: List panel assessment slots
 *     description: Retrieve a list of panel assessment slots with filtering options
 *     tags:
 *       - Client Panel Assessment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - in: query
 *         name: panelAssessmentId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by panel assessment ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by slot status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter slots starting from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter slots ending before this date
 *       - in: query
 *         name: hostEmail
 *         schema:
 *           type: string
 *         description: Filter by host email
 *       - in: query
 *         name: jobApplicationId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by job application ID
 *     responses:
 *       200:
 *         description: Panel assessment slots retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientJobPanelAssessmentSlotListApiResponse'
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/slots',
  validateRequest(panelAssessmentSlotListValidator),
  panelAssessmentController.listPanelAssessmentSlots
);

/**
 * @openapi
 * /client/panel-assessment/slots/{slotId}:
 *   get:
 *     summary: Get panel assessment slot by ID
 *     description: Retrieve a specific panel assessment slot with availability information
 *     tags:
 *       - Client Panel Assessment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slotId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Panel assessment slot ID
 *     responses:
 *       200:
 *         description: Panel assessment slot retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientJobPanelAssessmentSlotGetApiResponse'
 *       404:
 *         description: Panel assessment slot not found
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/slots/:slotId',
  validateRequest(panelAssessmentSlotIdValidator),
  panelAssessmentController.getPanelAssessmentSlot
);

/**
 * @openapi
 * /client/panel-assessment/slots/{slotId}:
 *   put:
 *     summary: Update panel assessment slot
 *     description: Update an existing panel assessment slot
 *     tags:
 *       - Client Panel Assessment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slotId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Panel assessment slot ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientJobPanelAssessmentSlotUpdateApiRequest'
 *     responses:
 *       200:
 *         description: Panel assessment slot updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientJobPanelAssessmentSlotUpdateApiResponse'
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Panel assessment slot not found
 *       401:
 *         description: Unauthorized
 */
router.put(
  '/slots/:slotId',
  requireRole([UserRoleEnum.ADMIN, UserRoleEnum.HR, UserRoleEnum.RECRUITER]),
  validateRequest(panelAssessmentSlotUpdateValidator),
  panelAssessmentController.updatePanelAssessmentSlot
);

/**
 * @openapi
 * /client/panel-assessment/slots/{slotId}:
 *   delete:
 *     summary: Delete panel assessment slot
 *     description: Delete a panel assessment slot (only if not selected)
 *     tags:
 *       - Client Panel Assessment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slotId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Panel assessment slot ID
 *     responses:
 *       204:
 *         description: Panel assessment slot deleted successfully
 *       400:
 *         description: Cannot delete selected slot
 *       404:
 *         description: Panel assessment slot not found
 *       401:
 *         description: Unauthorized
 */
router.delete(
  '/slots/:slotId',
  requireRole([UserRoleEnum.ADMIN, UserRoleEnum.HR, UserRoleEnum.RECRUITER]),
  validateRequest(panelAssessmentSlotIdValidator),
  panelAssessmentController.deletePanelAssessmentSlot
);

// Panel Assessment Invitation Routes

/**
 * @openapi
 * /client/panel-assessment/invitations:
 *   post:
 *     summary: Create panel assessment invitation
 *     description: Send a panel assessment invitation to a candidate
 *     tags:
 *       - Client Panel Assessment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientJobPanelAssessmentInvitationCreateApiRequest'
 *     responses:
 *       201:
 *         description: Panel assessment invitation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientJobPanelAssessmentInvitationCreateApiResponse'
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Job application not found
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/invitations',
  requireRole([UserRoleEnum.ADMIN, UserRoleEnum.HR, UserRoleEnum.RECRUITER]),
  validateRequest(panelAssessmentInvitationCreateValidator),
  panelAssessmentController.createPanelAssessmentInvitation
);

/**
 * @openapi
 * /client/panel-assessment/invitations:
 *   get:
 *     summary: List panel assessment invitations
 *     description: Retrieve a list of panel assessment invitations with filtering options
 *     tags:
 *       - Client Panel Assessment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - in: query
 *         name: candidateId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by candidate ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by invitation status
 *       - in: query
 *         name: panelAssessmentId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by panel assessment ID
 *       - in: query
 *         name: jobApplicationId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by job application ID
 *     responses:
 *       200:
 *         description: Panel assessment invitations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientJobPanelAssessmentInvitationListApiResponse'
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/invitations',
  requireRole([UserRoleEnum.ADMIN, UserRoleEnum.HR, UserRoleEnum.RECRUITER]),
  validateRequest(panelAssessmentInvitationListValidator),
  panelAssessmentController.listPanelAssessmentInvitations
);

/**
 * @openapi
 * /client/panel-assessment/invitations/{invitationId}:
 *   get:
 *     summary: Get panel assessment invitation by ID
 *     description: Retrieve a specific panel assessment invitation
 *     tags:
 *       - Client Panel Assessment
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
 *               $ref: '#/components/schemas/IClientJobPanelAssessmentInvitationGetApiResponse'
 *       404:
 *         description: Panel assessment invitation not found
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/invitations/:invitationId',
  requireRole([UserRoleEnum.ADMIN, UserRoleEnum.HR, UserRoleEnum.RECRUITER]),
  validateRequest(panelAssessmentInvitationIdValidator),
  panelAssessmentController.getPanelAssessmentInvitation
);

/**
 * @openapi
 * /client/panel-assessment/invitations/{invitationId}/cancel:
 *   post:
 *     summary: Cancel panel assessment invitation
 *     description: Cancel a pending panel assessment invitation
 *     tags:
 *       - Client Panel Assessment
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
 *         description: Panel assessment invitation cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientJobPanelAssessmentInvitationCancelApiResponse'
 *       400:
 *         description: Cannot cancel accepted invitation
 *       404:
 *         description: Panel assessment invitation not found
 *       401:
 *         description: Unauthorized
 */
router.delete(
  '/invitations/:invitationId',
  requireRole([UserRoleEnum.ADMIN, UserRoleEnum.HR, UserRoleEnum.RECRUITER]),
  validateRequest(panelAssessmentInvitationIdValidator),
  panelAssessmentController.cancelPanelAssessmentInvitation
);

// Panel Assessment Feedback Routes

// Internal feedback submission (authenticated panel members)

/**
 * @openapi
 * /client/panel-assessment/feedback/internal/{panelAssessmentId}:
 *   post:
 *     summary: Submit internal panel assessment feedback
 *     description: Submit feedback for a panel assessment (authenticated panel members)
 *     tags:
 *       - Client Panel Assessment
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientJobPanelAssessmentFeedbackSubmitInternalApiRequest'
 *           example:
 *             detailedFeedback: "The candidate showed excellent problem-solving abilities."
 *             decision: "HIRE"
 *             recommendation: "RECOMMENDED"
 *             panelMemberEmail: "ajayforcomputerscience@gmail.com"
 *     responses:
 *       200:
 *         description: Panel assessment feedback submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientJobPanelAssessmentFeedbackSubmitInternalApiResponse'
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Panel assessment not found
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/feedback/internal/:panelAssessmentId',
  requireRole([UserRoleEnum.ADMIN, UserRoleEnum.HR, UserRoleEnum.RECRUITER]),
  validateRequest(panelAssessmentFeedbackSubmitInternalValidator),
  panelAssessmentController.submitInternalJobPanelAssessmentFeedback
);

/**
 * @openapi
 * /client/panel-assessment/feedback:
 *   get:
 *     summary: List panel assessment feedback
 *     description: Retrieve a list of panel assessment feedback with filtering options
 *     tags:
 *       - Client Panel Assessment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - in: query
 *         name: panelAssessmentId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by panel assessment ID
 *     responses:
 *       200:
 *         description: Panel assessment feedback retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientJobPanelAssessmentFeedbackListApiResponse'
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/feedback',
  requireRole([UserRoleEnum.ADMIN, UserRoleEnum.HR, UserRoleEnum.RECRUITER]),
  validateRequest(panelAssessmentFeedbackListValidator),
  panelAssessmentController.listJobPanelAssessmentFeedback
);

// Teams Meeting Routes

/**
 * @openapi
 * /client/panel-assessment/invitations/{invitationId}/meeting:
 *   post:
 *     summary: Generate meeting link for panel assessment
 *     description: Creates a meeting (Teams or external platform) for the accepted panel assessment invitation and sends the link to all participants
 *     tags:
 *       - Client Panel Assessment
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
 *             $ref: '#/components/schemas/IGenerateMeetingLinkRequest'
 *     responses:
 *       200:
 *         description: Meeting link generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IGenerateMeetingLinkApiResponse'
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Panel assessment not found
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/invitations/:invitationId/meeting',
  requireRole([UserRoleEnum.ADMIN, UserRoleEnum.HR, UserRoleEnum.RECRUITER]),
  validateRequest(panelAssessmentMeetingGenerateValidator),
  teamsMeetingController.generateMeetingLink
);

/**
 * @openapi
 * /client/panel-assessment/invitations/{invitationId}/meeting:
 *   put:
 *     summary: Update meeting for panel assessment
 *     description: Updates an existing meeting for the panel assessment invitation
 *     tags:
 *       - Client Panel Assessment
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
 *             $ref: '#/components/schemas/IUpdateMeetingRequest'
 *     responses:
 *       200:
 *         description: Meeting updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IUpdateMeetingApiResponse'
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Panel assessment not found
 *       401:
 *         description: Unauthorized
 */
router.put(
  '/invitations/:invitationId/meeting',
  requireRole([UserRoleEnum.ADMIN, UserRoleEnum.HR, UserRoleEnum.RECRUITER]),
  validateRequest(panelAssessmentMeetingUpdateValidator),
  teamsMeetingController.updateMeeting
);

/**
 * @openapi
 * /client/panel-assessment/invitations/{invitationId}/meeting:
 *   delete:
 *     summary: Cancel meeting for panel assessment
 *     description: Cancels an existing meeting for the panel assessment invitation
 *     tags:
 *       - Client Panel Assessment
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
 *             $ref: '#/components/schemas/ICancelMeetingRequest'
 *     responses:
 *       200:
 *         description: Meeting cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICancelMeetingApiResponse'
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Panel assessment not found
 *       401:
 *         description: Unauthorized
 */
router.delete(
  '/invitations/:invitationId/meeting',
  requireRole([UserRoleEnum.ADMIN, UserRoleEnum.HR, UserRoleEnum.RECRUITER]),
  validateRequest(panelAssessmentMeetingCancelValidator),
  teamsMeetingController.cancelMeeting
);

/**
 * @openapi
 * /client/panel-assessment/schedule-interviews:
 *   get:
 *     summary: List scheduled interviews
 *     description: Retrieve a list of scheduled interviews
 *     tags:
 *       - Client Panel Assessment
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Scheduled interviews retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientListSceduledInterviewsApiResponse'
 *       401:
 *         description: Unauthorized
 */

router.get(
  '/schedule-interviews',
  requireRole([
    UserRoleEnum.ADMIN,
    UserRoleEnum.HR,
    UserRoleEnum.RECRUITER,
    UserRoleEnum.ACCOUNT_MANAGER,
  ]),
  requireUserType([UserTypeEnum.CLIENT, UserTypeEnum.SUPPORT]),
  panelAssessmentController.listScheduledInterviews
);

/**
 * @openapi
 * /candidate/panel-assessment/interviews/{invitationId}:
 *   get:
 *     summary: Get scheduled interview details
 *     description: Get details of a specific scheduled interview
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
 *         description: Scheduled interview details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IScheduledPanelAssessmentMeetingDetails'
 *       400:
 *         description: Invalid input data or already applied
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Meeting details not found
 */
router.get(
  '/:invitationId/meeting-details',
  [
    requireRole([UserRoleEnum.ADMIN, UserRoleEnum.HR, UserRoleEnum.RECRUITER]),
    validateRequest(clientPanelAssessmentMeetingDetailsGetValidator),
  ],
  panelAssessmentController.getPanelAssessmentMeetingDetails
);

/**
 * @openapi
 * /client/panel-assessment/{panelAssessmentId}/complete:
 *   post:
 *     summary: Mark panel assessment as completed
 *     description: Mark a panel assessment as completed
 *     tags:
 *       - Client Panel Assessment
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
 *         description: Panel assessment marked as completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/IClientJobPanelAssessment'
 *       400:
 *         description: Invalid request data or assessment already completed
 *       404:
 *         description: Panel assessment not found
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/:panelAssessmentId/complete',
  requireRole([UserRoleEnum.ADMIN, UserRoleEnum.HR, UserRoleEnum.RECRUITER]),
  validateRequest(panelAssessmentIdValidator),
  panelAssessmentController.markPanelAssessmentAsCompleted
);

export default router;
