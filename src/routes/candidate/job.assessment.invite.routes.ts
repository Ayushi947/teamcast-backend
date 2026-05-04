import { Router } from 'express';
import { CandidateJobAssessmentInviteController } from '@/controllers/candidate/job.assessment.invite.controller';
import { CandidateJobAssessmentInviteService } from '@/services/candidate/job.assessment.invite.service';
import {
  requireAuth,
  requireActiveUser,
  validateRequest,
  requireCandidateAccess,
} from '@/middleware';
import {
  candidateJobAssessmentInviteListValidator,
  candidateJobAssessmentInviteAcceptValidator,
  candidateJobAssessmentInviteDeclineValidator,
} from '@/shared/validators/candidate/job.assessment.invite.validator';

const router = Router({ mergeParams: true });

// Initialize services and controller
const jobAssessmentInviteService = new CandidateJobAssessmentInviteService();
const jobAssessmentInviteController =
  new CandidateJobAssessmentInviteController(jobAssessmentInviteService);

// Candidate auth middleware - applies to all Job assessment invite routes
const candidateAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireCandidateAccess,
];

/**
 * @openapi
 * /candidate/job-assessment-invites:
 *   get:
 *     summary: Get Job assessment invites
 *     description: Retrieves all Job assessment invites for the candidate with pagination and filtering
 *     tags:
 *       - Candidate Job Assessment Invites
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortBy'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortOrder'
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/JobAssessmentInviteStatusEnum'
 *         description: Filter by invite status
 *       - in: query
 *         name: companyName
 *         schema:
 *           type: string
 *           minLength: 1
 *         description: Filter by company name
 *       - in: query
 *         name: jobPostingTitle
 *         schema:
 *           type: string
 *           minLength: 1
 *         description: Filter by job posting title
 *       - in: query
 *         name: hasAssessment
 *         schema:
 *           type: boolean
 *         description: Filter by whether invite has assessment
 *       - in: query
 *         name: assessmentCompleted
 *         schema:
 *           type: boolean
 *         description: Filter by assessment completion status
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by date from (ISO 8601 format)
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by date to (ISO 8601 format)
 *     responses:
 *       200:
 *         description: Job assessment invites retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateJobAssessmentInviteListApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get(
  '/',
  [
    ...candidateAuthMiddleware,
    validateRequest(candidateJobAssessmentInviteListValidator),
  ],
  jobAssessmentInviteController.getInvites
);

/**
 * @openapi
 * /candidate/job-assessment-invites/{inviteId}/accept:
 *   post:
 *     summary: Accept Job assessment invite
 *     description: Accept a Job assessment invite with optional acceptance note and scheduled date
 *     tags:
 *       - Candidate Job Assessment Invites
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateJobAssessmentInviteIdParams'
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ICandidateAcceptJobAssessmentInviteRequest'
 *     responses:
 *       200:
 *         description: Job assessment invite accepted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateJobAssessmentInviteAcceptApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Invite not found
 *       400:
 *         description: Invite expired or already processed
 */
router.post(
  '/:inviteId/accept',
  [
    ...candidateAuthMiddleware,
    validateRequest(candidateJobAssessmentInviteAcceptValidator),
  ],
  jobAssessmentInviteController.acceptInvite
);

/**
 * @openapi
 * /candidate/job-assessment-invites/{inviteId}/decline:
 *   post:
 *     summary: Decline Job assessment invite
 *     description: Decline a Job assessment invite with optional reason and decline note
 *     tags:
 *       - Candidate Job Assessment Invites
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateJobAssessmentInviteIdParams'
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ICandidateDeclineJobAssessmentInviteRequest'
 *     responses:
 *       200:
 *         description: Job assessment invite declined successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateJobAssessmentInviteDeclineApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Invite not found
 *       400:
 *         description: Invite expired or already processed
 */
router.post(
  '/:inviteId/decline',
  [
    ...candidateAuthMiddleware,
    validateRequest(candidateJobAssessmentInviteDeclineValidator),
  ],
  jobAssessmentInviteController.declineInvite
);

export default router;
