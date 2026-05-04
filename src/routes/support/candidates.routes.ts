import { Router } from 'express';
import { SupportCandidatesController } from '@/controllers/support/candidates.controller';
import { SupportCandidatesService } from '@/services/support/candidates.service';
import {
  requireAuth,
  requireRole,
  validateRequest,
  requireUserType,
} from '@/middleware';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';
import {
  supportCandidateListValidator,
  supportCandidateDetailValidator,
  supportCandidateUpdateValidator,
  supportCandidateIdValidator,
  supportRecommendedCandidatesValidator,
  supportCandidatePublishValidator,
  supportCandidateResetOnboardingAssessmentValidator,
  supportCandidateResendJobAiInvitationValidator,
  supportCandidateOnboardingAssessmentVideoChunksGetValidator,
  supportCandidateOnboardingAssessmentChunkPlaybackUrlGetValidator,
  supportCandidateJobAiAssessmentVideoChunksGetValidator,
  supportCandidateJobAiAssessmentChunkPlaybackUrlGetValidator,
} from '@/shared/validators/support/candidates.validator';
import { NotificationFactory } from '@/services/notification/notification.factory';
import { OnboardingAssessmentFactory } from '@/services/helpers/ai.onboarding.assessment/onboarding.assessment.factory';
import { OnboardingAssessmentService } from '@/services/candidate/onboarding.assessment.service';
import { JobAiAssessmentFactory } from '@/services/helpers/job.ai.assessment/job.ai.assessment.factory';
import { JobAiAssessmentService } from '@/services/candidate/job.ai.assessment.service';
import { StorageFactory } from '@/services/helpers/storage/storage.factory';

const router = Router();

const notificationProvider =
  new NotificationFactory().getNotificationProvider();
const onboardingAssessmentProvider =
  OnboardingAssessmentFactory.getInstance().getProvider();
const jobAiAssessmentProvider =
  JobAiAssessmentFactory.getInstance().getProvider();
const storageProvider = StorageFactory.getInstance().getProvider();
const onboardingAssessmentService = new OnboardingAssessmentService(
  onboardingAssessmentProvider,
  storageProvider
);
const jobAiAssessmentService = new JobAiAssessmentService(
  jobAiAssessmentProvider,
  storageProvider
);
const supportCandidatesService = new SupportCandidatesService(
  notificationProvider,
  onboardingAssessmentService
);
const supportCandidatesController = new SupportCandidatesController(
  supportCandidatesService,
  onboardingAssessmentService,
  jobAiAssessmentService
);

const supportAuthMiddleware = [
  requireAuth,
  requireRole([
    UserRoleEnum.ADMIN,
    UserRoleEnum.RECRUITER,
    UserRoleEnum.ACCOUNT_MANAGER,
    UserRoleEnum.HR,
    UserRoleEnum.TECHNICAL_SUPPORT,
  ]),
  requireUserType([UserTypeEnum.SUPPORT]),
];

/**
 * @openapi
 * /support/candidates:
 *   get:
 *     summary: List candidates
 *     description: Get a list of all candidates (Admin only)
 *     tags:
 *       - Support Candidates
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortBy'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortOrder'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSearch'
 *       - $ref: '#/components/parameters/ISupportUserFilterQueryEmail'
 *       - $ref: '#/components/parameters/ISupportUserFilterQueryName'
 *     responses:
 *       200:
 *         description: List of candidates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportCandidateListApiResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get(
  '/',
  [...supportAuthMiddleware, validateRequest(supportCandidateListValidator)],
  supportCandidatesController.listSupportCandidates
);

/**
 * @openapi
 * /support/candidates/recommended:
 *   get:
 *     summary: Get recommended candidates
 *     description: Get a list of candidates with onboarding assessment recommendations (HIGHLY_RECOMMENDED or RECOMMENDED) that are not published
 *     tags:
 *       - Support Candidates
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortBy'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortOrder'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSearch'
 *       - $ref: '#/components/parameters/ISupportUserFilterQueryEmail'
 *       - $ref: '#/components/parameters/ISupportUserFilterQueryName'
 *     responses:
 *       200:
 *         description: List of recommended candidates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportRecommendedCandidatesListApiResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get(
  '/recommended',
  [
    ...supportAuthMiddleware,
    validateRequest(supportRecommendedCandidatesValidator),
  ],
  supportCandidatesController.getRecommendedCandidates
);

/**
 * @openapi
 * /support/candidates/{supportCandidateId}/resume/view:
 *   get:
 *     summary: Generate resume view URL
 *     description: Generates a pre-signed URL that allows support users to view a candidate's resume.
 *     tags:
 *       - Support Candidates
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier for the candidate
 *     responses:
 *       200:
 *         description: Resume view URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientResumeViewApiResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Candidate or resume not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:id/resume/view',
  [...supportAuthMiddleware, validateRequest(supportCandidateIdValidator)],
  supportCandidatesController.viewCandidateResume
);

/**
 * @openapi
 * /support/candidates/publish:
 *   post:
 *     summary: Publish candidate
 *     description: Publish a candidate with onboarding assessment recommendation and add note
 *     tags:
 *       - Support Candidates
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ISupportCandidatePublishRequest'
 *     responses:
 *       200:
 *         description: Candidate published successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportCandidatePublishApiResponse'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.post(
  '/publish',
  [...supportAuthMiddleware, validateRequest(supportCandidatePublishValidator)],
  supportCandidatesController.publishCandidate
);

/**
 * @openapi
 * /support/candidates/do-not-publish:
 *   post:
 *     summary: Do not publish candidate
 *     description: Mark a candidate as do not publish with a note (reviewed but not published)
 *     tags:
 *       - Support Candidates
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ISupportCandidatePublishRequest'
 *     responses:
 *       200:
 *         description: Candidate marked as do not publish successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportCandidatePublishApiResponse'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.post(
  '/do-not-publish',
  [...supportAuthMiddleware, validateRequest(supportCandidatePublishValidator)],
  supportCandidatesController.doNotPublishCandidate
);

/**
 * @openapi
 * /support/candidates/unpublish:
 *   post:
 *     summary: Unpublish candidate
 *     description: Unpublish a candidate and add reason for unpublishing
 *     tags:
 *       - Support Candidates
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ISupportCandidatePublishRequest'
 *     responses:
 *       200:
 *         description: Candidate unpublished successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportCandidatePublishApiResponse'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.post(
  '/unpublish',
  [...supportAuthMiddleware, validateRequest(supportCandidatePublishValidator)],
  supportCandidatesController.unpublishCandidate
);

/**
 * @openapi
 * /support/candidates/{supportCandidateId}:
 *   get:
 *     summary: Get candidate details
 *     description: Get detailed information about a specific candidate with comprehensive profile, resume, and assessment data (Admin only)
 *     tags:
 *       - Support Candidates
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier for the candidate
 *     responses:
 *       200:
 *         description: Candidate details retrieved successfully with comprehensive information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportCandidateGetApiResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Candidate not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:id',
  [...supportAuthMiddleware, validateRequest(supportCandidateDetailValidator)],
  supportCandidatesController.getSupportCandidate
);

/**
 * @openapi
 * /support/candidates/{supportCandidateId}:
 *   patch:
 *     summary: Update candidate
 *     description: Update a candidate's information including profile, preferences, and status (Admin only)
 *     tags:
 *       - Support Candidates
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier for the candidate
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ISupportCandidateUpdate'
 *     responses:
 *       200:
 *         description: Candidate updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportCandidateUpdateApiResponse'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Candidate not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  '/:id',
  [...supportAuthMiddleware, validateRequest(supportCandidateUpdateValidator)],
  supportCandidatesController.updateSupportCandidate
);

/**
 * @openapi
 * /support/candidates/{supportCandidateId}:
 *   delete:
 *     summary: Delete candidate
 *     description: Soft delete a candidate from the system (Admin only)
 *     tags:
 *       - Support Candidates
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ISupportCandidateIdParams'
 *     responses:
 *       200:
 *         description: Candidate deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportCandidateDeleteApiResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Candidate not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  '/:id',
  [...supportAuthMiddleware, validateRequest(supportCandidateIdValidator)],
  supportCandidatesController.deleteSupportCandidate
);

/**
 * @openapi
 * /support/candidates/onboarding-assessment/{supportCandidateId}/reset:
 *   patch:
 *     summary: Reset onboarding assessment
 *     description: Reset a candidate's onboarding assessment to initial state and save current state to history (Admin only)
 *     tags:
 *       - Support Candidates
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: supportCandidateId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier for the candidate
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Optional reason for resetting the assessment
 *                 example: "Assessment corrupted, candidate request"
 *     responses:
 *       200:
 *         description: Onboarding assessment reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Onboarding assessment reset successfully"
 *                 historyId:
 *                   type: string
 *                   format: uuid
 *                   description: ID of the history record created
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Candidate or assessment not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  '/onboarding-assessment/:supportCandidateId/reset',
  [
    ...supportAuthMiddleware,
    validateRequest(supportCandidateResetOnboardingAssessmentValidator),
  ],
  supportCandidatesController.resetOnboardingAssessment
);
/**
 * @openapi
 * /support/candidates/onboarding-assessment/{supportCandidateId}/resubmit:
 *   post:
 *     summary: Resubmit onboarding assessment for re-analysis
 *     description: Resubmit a completed or failed onboarding assessment for re-analysis. Deletes previous video files and triggers background processing. Rate limited to once per 10 minutes per candidate.
 *     tags:
 *       - Support Candidates
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: supportCandidateId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier for the candidate
 *     responses:
 *       200:
 *         description: Onboarding assessment resubmitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Assessment resubmitted successfully. Processing in background..."
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Candidate or assessment not found
 *       429:
 *         description: Rate limit exceeded - Please wait before resubmitting again
 *       500:
 *         description: Internal server error
 */
router.post(
  '/onboarding-assessment/:supportCandidateId/resubmit',
  [
    ...supportAuthMiddleware,
    validateRequest(supportCandidateResetOnboardingAssessmentValidator),
  ],
  supportCandidatesController.resubmitOnboardingAssessment
);

/**
 * @openapi
 * /support/candidates/job-assessment/{assessmentId}/reset:
 *   patch:
 *     summary: Reset job AI assessment
 *     description: Reset a job AI assessment to initial state and save current state to history (Admin only)
 *     tags:
 *       - Support Candidates
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Job AI assessment ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Optional reason for resetting the assessment
 *                 example: "Assessment corrupted, candidate request"
 *     responses:
 *       200:
 *         description: Job AI assessment reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Job AI assessment reset successfully"
 *                 historyId:
 *                   type: string
 *                   format: uuid
 *                   description: ID of the history record created
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Assessment not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  '/job-assessment/:assessmentId/reset',
  [
    ...supportAuthMiddleware,
    validateRequest(supportCandidateResetOnboardingAssessmentValidator),
  ],
  supportCandidatesController.resetJobAiAssessment
);

/**
 * @openapi
 * /support/candidates/job-assessment/{assessmentId}/resubmit:
 *   post:
 *     summary: Resubmit job assessment for re-analysis
 *     description: Resubmit a completed or failed job assessment for re-analysis. Deletes previous video files and triggers background processing. Rate limited to once per 10 minutes per assessment.
 *     tags:
 *       - Support Candidates
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Job AI assessment ID
 *     responses:
 *       200:
 *         description: Job assessment resubmitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Assessment resubmitted successfully. Processing in background...
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Job assessment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post(
  '/job-assessment/:assessmentId/resubmit',
  [
    ...supportAuthMiddleware,
    validateRequest(supportCandidateResetOnboardingAssessmentValidator),
  ],
  supportCandidatesController.resubmitJobAssessment
);

/**
 * @openapi
 * /support/candidates/job-ai-invitation/{invitationId}/resend:
 *   post:
 *     summary: Resend expired job AI assessment invitation
 *     description: Resend an expired job AI assessment invitation. Only expired invitations can be resent. The invitation status will be updated to PENDING and a new expiration date will be set (72 hours from now).
 *     tags:
 *       - Support Candidates
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invitationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Job AI assessment invitation ID
 *     responses:
 *       200:
 *         description: Invitation resent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportCandidateResendJobAiInvitationApiResponse'
 *       400:
 *         description: Invalid request - invitation is not expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Invitation not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.post(
  '/job-ai-invitation/:invitationId/resend',
  [
    ...supportAuthMiddleware,
    validateRequest(supportCandidateResendJobAiInvitationValidator),
  ],
  supportCandidatesController.resendJobAiAssessmentInvitation
);

/**
 * @openapi
 * /support/candidates/onboarding-assessment/{assessmentId}/video-chunks:
 *   get:
 *     summary: Get video chunks for an assessment (Support/Admin)
 *     description: Retrieves all relevant video chunks for the assessment, with optional filtering by question
 *     tags:
 *       - Support Candidates
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Assessment ID
 *       - in: query
 *         name: questionId
 *         schema:
 *           type: string
 *         description: Optional filter by question ID
 *       - in: query
 *         name: includeAnalysis
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include AI analysis results
 *       - in: query
 *         name: includePlaybackUrls
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include signed playback URLs
 *     responses:
 *       200:
 *         description: Video chunks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 chunks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       chunkIndex:
 *                         type: number
 *                       questionId:
 *                         type: string
 *                         nullable: true
 *                       attemptNumber:
 *                         type: number
 *                       status:
 *                         type: string
 *                       playbackUrl:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       404:
 *         description: Assessment not found
 */
router.get(
  '/onboarding-assessment/:assessmentId/video-chunks',
  [
    ...supportAuthMiddleware,
    validateRequest(
      supportCandidateOnboardingAssessmentVideoChunksGetValidator
    ),
  ],
  supportCandidatesController.getOnboardingVideoChunks
);

/**
 * @openapi
 * /support/candidates/onboarding-assessment/{assessmentId}/video-chunks/{chunkId}/playback-url:
 *   get:
 *     summary: Get playback URL for a specific chunk (Support/Admin)
 *     description: Generates a signed URL for playing back a specific video chunk
 *     tags:
 *       - Support Candidates
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Assessment ID
 *       - in: path
 *         name: chunkId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chunk ID
 *     responses:
 *       200:
 *         description: Playback URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 playbackUrl:
 *                   type: string
 *                   description: Signed URL for playback
 *                 expiresIn:
 *                   type: number
 *                   description: URL expiration time in seconds
 *       404:
 *         description: Chunk not found
 */
router.get(
  '/onboarding-assessment/:assessmentId/video-chunks/:chunkId/playback-url',
  [
    ...supportAuthMiddleware,
    validateRequest(
      supportCandidateOnboardingAssessmentChunkPlaybackUrlGetValidator
    ),
  ],
  supportCandidatesController.getOnboardingChunkPlaybackUrl
);

/**
 * @openapi
 * /support/candidates/job-ai-assessment/{assessmentId}/video-chunks:
 *   get:
 *     summary: Get video chunks for a job AI assessment (Support/Admin)
 *     description: Retrieves all video chunks for a job AI assessment with optional filtering
 *     tags:
 *       - Support Candidates
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job AI assessment ID
 *       - in: query
 *         name: questionId
 *         schema:
 *           type: string
 *         description: Filter by question ID
 *       - in: query
 *         name: sectionId
 *         schema:
 *           type: string
 *         description: Filter by section ID
 *       - in: query
 *         name: includeAnalysis
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Include chunk analysis data
 *       - in: query
 *         name: includePlaybackUrls
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Include signed playback URLs (default true)
 *     responses:
 *       200:
 *         description: Video chunks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 chunks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       chunkIndex:
 *                         type: number
 *                       questionId:
 *                         type: string
 *                         nullable: true
 *                       sectionId:
 *                         type: string
 *                         nullable: true
 *                       attemptNumber:
 *                         type: number
 *                       status:
 *                         type: string
 *                       playbackUrl:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       404:
 *         description: Assessment not found
 */
router.get(
  '/job-ai-assessment/:assessmentId/video-chunks',
  [
    ...supportAuthMiddleware,
    validateRequest(supportCandidateJobAiAssessmentVideoChunksGetValidator),
  ],
  supportCandidatesController.getJobAiAssessmentVideoChunks
);

/**
 * @openapi
 * /support/candidates/job-ai-assessment/{assessmentId}/video-chunks/{chunkId}/playback-url:
 *   get:
 *     summary: Get playback URL for a specific job AI chunk (Support/Admin)
 *     description: Generates a signed URL for playing back a specific video chunk from a job AI assessment
 *     tags:
 *       - Support Candidates
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job AI assessment ID
 *       - in: path
 *         name: chunkId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chunk ID
 *     responses:
 *       200:
 *         description: Playback URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 playbackUrl:
 *                   type: string
 *                   description: Signed URL for playback
 *                 expiresIn:
 *                   type: number
 *                   description: URL expiration time in seconds
 *       404:
 *         description: Chunk not found
 */
router.get(
  '/job-ai-assessment/:assessmentId/video-chunks/:chunkId/playback-url',
  [
    ...supportAuthMiddleware,
    validateRequest(
      supportCandidateJobAiAssessmentChunkPlaybackUrlGetValidator
    ),
  ],
  supportCandidatesController.getJobAiAssessmentChunkPlaybackUrl
);

/**
 * @openapi
 * /support/candidates/fix-video-chunks:
 *   post:
 *     summary: Fix video chunks for affected assessments
 *     description: Marks old video chunks (created before assessment startedAt) as irrelevant for assessments that were reset before the fix was implemented. Supports both job AI and onboarding assessments. Can be run in dry-run mode to preview changes.
 *     tags:
 *       - Support Candidates
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: assessmentId
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Optional specific assessment ID to fix. If not provided, fixes all affected assessments.
 *       - in: query
 *         name: assessmentType
 *         required: false
 *         schema:
 *           type: string
 *           enum: [job, onboarding, both]
 *           default: both
 *         description: Type of assessments to fix (job AI, onboarding, or both)
 *       - in: query
 *         name: dryRun
 *         required: false
 *         schema:
 *           type: boolean
 *           default: false
 *         description: If true, only previews what would be fixed without making changes
 *     responses:
 *       200:
 *         description: Video chunks fix completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Fixed 5 assessment(s) and marked 23 chunk(s) as irrelevant."
 *                 jobAiAssessmentsFixed:
 *                   type: number
 *                   description: Number of job AI assessments that were fixed
 *                 onboardingAssessmentsFixed:
 *                   type: number
 *                   description: Number of onboarding assessments that were fixed
 *                 jobAiChunksMarkedIrrelevant:
 *                   type: number
 *                   description: Total number of job AI chunks marked as irrelevant
 *                 onboardingChunksMarkedIrrelevant:
 *                   type: number
 *                   description: Total number of onboarding chunks marked as irrelevant
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       assessmentId:
 *                         type: string
 *                         format: uuid
 *                       assessmentType:
 *                         type: string
 *                         enum: [job, onboarding]
 *                       chunksMarkedIrrelevant:
 *                         type: number
 *                       candidateId:
 *                         type: string
 *                         format: uuid
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.post(
  '/fix-video-chunks',
  [...supportAuthMiddleware],
  supportCandidatesController.fixVideoChunksForAssessment
);

/**
 * @openapi
 * /support/candidates/backfill-video-chunk-durations:
 *   post:
 *     summary: Backfill video chunk durations for existing chunks
 *     description: Extracts duration from video files and stores it in the database for chunks that don't have duration. This fixes the issue where some candidates' videos show 0.00 duration. Supports both job AI and onboarding assessments. Can be run in dry-run mode to preview changes.
 *     tags:
 *       - Support Candidates
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: assessmentId
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Optional specific assessment ID to process. If not provided, processes all chunks without duration.
 *       - in: query
 *         name: candidateId
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Optional candidate ID to process all assessments for a specific candidate.
 *       - in: query
 *         name: assessmentType
 *         required: false
 *         schema:
 *           type: string
 *           enum: [job, onboarding, both]
 *           default: both
 *         description: Type of assessments to process (job AI, onboarding, or both)
 *       - in: query
 *         name: batchSize
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of chunks to process in parallel per batch
 *       - in: query
 *         name: dryRun
 *         required: false
 *         schema:
 *           type: boolean
 *           default: false
 *         description: If true, only previews what would be processed without making changes
 *     responses:
 *       200:
 *         description: Video chunk duration backfill completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Processed 25 chunk(s): 23 succeeded, 2 failed."
 *                 jobAiChunksProcessed:
 *                   type: number
 *                   description: Total number of job AI chunks processed
 *                 jobAiChunksSucceeded:
 *                   type: number
 *                   description: Number of job AI chunks that successfully got duration extracted
 *                 jobAiChunksFailed:
 *                   type: number
 *                   description: Number of job AI chunks that failed to extract duration
 *                 onboardingChunksProcessed:
 *                   type: number
 *                   description: Total number of onboarding chunks processed
 *                 onboardingChunksSucceeded:
 *                   type: number
 *                   description: Number of onboarding chunks that successfully got duration extracted
 *                 onboardingChunksFailed:
 *                   type: number
 *                   description: Number of onboarding chunks that failed to extract duration
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       assessmentId:
 *                         type: string
 *                         format: uuid
 *                       assessmentType:
 *                         type: string
 *                         enum: [job, onboarding]
 *                       chunkId:
 *                         type: string
 *                         format: uuid
 *                       chunkIndex:
 *                         type: number
 *                       success:
 *                         type: boolean
 *                       duration:
 *                         type: number
 *                         description: Duration in seconds (only present if success is true)
 *                       error:
 *                         type: string
 *                         description: Error message (only present if success is false)
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.post(
  '/backfill-video-chunk-durations',
  [...supportAuthMiddleware],
  supportCandidatesController.backfillVideoChunkDurations
);

export default router;
