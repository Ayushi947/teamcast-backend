import { Router } from 'express';
import { JobAiAssessmentController } from '@/controllers/candidate/job.ai.assessment.controller';
import { JobAiAssessmentService } from '@/services/candidate/job.ai.assessment.service';
import {
  requireAuth,
  requireActiveUser,
  validateRequest,
  requireCandidateAccess,
} from '@/middleware';
import { JobAiAssessmentFactory } from '@/services/helpers/job.ai.assessment/job.ai.assessment.factory';
import {
  candidateJobAiAssessmentPresignedUrlByVideoUrlValidator,
  candidateJobAiAssessmentStartValidator,
} from '@/shared/validators/candidate/job.ai.assessment.validator';
import { candidateJobAiAssessmentSubmitAnswerValidator } from '@/shared/validators/candidate/job.ai.assessment.validator';
import {
  candidateJobAiAssessmentHeartbeatValidator,
  candidateJobAiAssessmentProctorValidator,
  candidateJobAiAssessmentSubmitValidator,
} from '@/shared/validators/candidate/job.ai.assessment.validator';
import { candidateJobAiAssessmentPresignedUrlValidator } from '@/shared/validators/candidate/job.ai.assessment.validator';
import { candidateJobAiAssessmentQuestionAudioPresignedUrlValidator } from '@/shared/validators/candidate/job.ai.assessment.validator';
import {
  candidateJobAiAssessmentVideoChunksGetValidator,
  candidateJobAiAssessmentChunkPlaybackUrlGetValidator,
} from '@/shared/validators/candidate/job.ai.assessment.validator';
import { StorageFactory } from '@/services/helpers/storage/storage.factory';

const router = Router({ mergeParams: true });

// Initialize services and controller
const onboardingAssessmentProvider =
  JobAiAssessmentFactory.getInstance().getProvider();
const storageProvider = StorageFactory.getInstance().getProvider();
const onboardingAssessmentService = new JobAiAssessmentService(
  onboardingAssessmentProvider,
  storageProvider
);
const onboardingAssessmentController = new JobAiAssessmentController(
  onboardingAssessmentService
);

// Candidate auth middleware - applies to all onboarding assessment routes
const candidateAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireCandidateAccess,
];

// Initialize assessment
/**
 * @openapi
 * /candidate/job-ai-assessments/{jobAiAssessmentInviteId}/initialize:
 *   post:
 *     summary: Initialize an onboarding assessment
 *     description: Initializes an onboarding assessment and returns the initialize task
 *     tags:
 *       - Candidate JobAi Assessments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateJobAiAssessmentApplicationIdParams'
 *     responses:
 *       200:
 *         description: Assessment initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateJobAiAssessmentInitializeApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Assessment not found
 */
router.post(
  '/:jobAiAssessmentInviteId/initialize',
  [...candidateAuthMiddleware],
  onboardingAssessmentController.initialize
);

// Get job ai assessment interviews
/**
 * @openapi
 * /candidate/job-ai-assessments/interviews:
 *   get:
 *     summary: Get job ai assessment interviews
 *     description: Get all job ai assessment interviews for the candidate
 *     tags:
 *       - Candidate JobAi Assessments
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Job ai assessment interviews retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateListJobAiAssessmentInterviewsApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/interviews',
  [...candidateAuthMiddleware],
  onboardingAssessmentController.listJobAiAssessmentInterviews
);

// Start assessment
/**
 * @openapi
 * /candidate/job-ai-assessments/{assessmentId}/start:
 *   post:
 *     summary: Start an onboarding assessment
 *     description: Starts an onboarding assessment and returns the first question
 *     tags:
 *       - Candidate JobAi Assessments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateJobAiAssessmentIdParams'
 *     responses:
 *       200:
 *         description: Assessment started successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateJobAiAssessmentStartApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Assessment not found
 */
router.post(
  '/:assessmentId/start',
  [
    ...candidateAuthMiddleware,
    validateRequest(candidateJobAiAssessmentStartValidator),
  ],
  onboardingAssessmentController.startAssessment
);

// Get assessment task
/**
 * @openapi
 * /candidate/job-ai-assessments/{assessmentId}/task:
 *   get:
 *     summary: Get candidate onboarding assessment initialize task
 *     description: Retrieves a specific candidate onboarding assessment initialize task
 *     tags:
 *       - Candidate JobAi Assessments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateJobAiAssessmentIdParams'
 *     responses:
 *       200:
 *         description: JobAi assessment initialize task retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateJobAiAssessmentTaskGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: JobAi assessment initialize task not found
 */
router.get(
  '/:assessmentId/task',
  [...candidateAuthMiddleware],
  onboardingAssessmentController.getJobAiAssessmentTask
);

/**
 * @openapi
 * /candidate/job-ai-assessments/{assessmentId}/questions/{questionId}/submit:
 *   post:
 *     summary: Submit answer for a question
 *     description: Submits an answer for a question and returns the next question
 *     tags:
 *       - Candidate JobAi Assessments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateJobAiAssessmentIdParams'
 *       - $ref: '#/components/parameters/ICandidateJobAiAssessmentQuestionIdParams'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               answerGiven:
 *                 type: string
 *     responses:
 *       200:
 *         description: Answer submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateJobAiAssessmentSubmitAnswerApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Assessment or question not found
 */
router.post(
  '/:assessmentId/questions/:questionId/submit',
  [
    ...candidateAuthMiddleware,
    validateRequest(candidateJobAiAssessmentSubmitAnswerValidator),
  ],
  onboardingAssessmentController.submitAnswer
);

// Get assessments
/**
 * @openapi
 * /candidate/job-ai-assessments/{assessmentId}/assessments:
 *   get:
 *     summary: Get candidate onboarding assessment initialize task
 *     description: Retrieves a specific candidate onboarding assessment initialize task
 *     tags:
 *       - Candidate JobAi Assessments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateJobAiAssessmentApplicationIdParams'
 *     responses:
 *       200:
 *         description: JobAi assessment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateJobAiAssessmentGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: JobAi assessment not found
 */
router.get(
  '/:assessmentId/assessments',
  [...candidateAuthMiddleware],
  onboardingAssessmentController.getJobAiAssessments
);

// Get latest assessment
/**
 * @openapi
 * /candidate/job-ai-assessments/latest:
 *   get:
 *     summary: Get latest onboarding assessment
 *     description: Retrieves the latest onboarding assessment for the authenticated candidate
 *     tags:
 *       - Candidate JobAi Assessments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateJobAiAssessmentIdParams'
 *     responses:
 *       200:
 *         description: JobAi assessment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateJobAiAssessmentGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: JobAi assessment not found
 */
router.get(
  '/latest',
  [...candidateAuthMiddleware],
  onboardingAssessmentController.getLatestJobAiAssessment
);

/**
 * @openapi
 * /candidate/job-ai-assessments/{candidateId}/latest:
 *   get:
 *     summary: Get latest job ai assessment for a candidate
 *     description: Retrieves the latest job ai assessment for the authenticated candidate
 *     tags:
 *       - Candidate JobAi Assessments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateJobAiAssessmentCandidateIdParams'
 *     responses:
 *       200:
 *         description: JobAi assessment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateJobAiAssessmentGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: JobAi assessment not found
 */

router.get(
  '/:candidateId/latest',
  [...candidateAuthMiddleware],
  onboardingAssessmentController.getLatestJobAiAssessmentByCandidateId
);

// Get assessment
/**
 * @openapi
 * /candidate/job-ai-assessments/{assessmentId}:
 *   get:
 *     summary: Get specific onboarding assessment
 *     description: Retrieves a specific onboarding assessment for the authenticated candidate
 *     tags:
 *       - Candidate JobAi Assessments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateJobAiAssessmentIdParams'
 *     responses:
 *       200:
 *         description: JobAi assessment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateJobAiAssessmentGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: JobAi assessment not found
 */
router.get(
  '/:assessmentId',
  [...candidateAuthMiddleware],
  onboardingAssessmentController.getJobAiAssessment
);

// Heartbeat
/**
 * @openapi
 * /candidate/job-ai-assessments/{assessmentId}/heartbeat:
 *   patch:
 *     summary: Heartbeat (status update) for onboarding assessment
 *     description: Updates the duration and/or status of the assessment (heartbeat)
 *     tags:
 *       - Candidate JobAi Assessments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateJobAiAssessmentIdParams'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               duration:
 *                 type: number
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Assessment heartbeat updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateJobAiAssessmentHeartbeatApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.patch(
  '/:assessmentId/heartbeat',
  [
    ...candidateAuthMiddleware,
    validateRequest(candidateJobAiAssessmentHeartbeatValidator),
  ],
  onboardingAssessmentController.heartbeat
);

// Proctor
/**
 * @openapi
 * /candidate/job-ai-assessments/{assessmentId}/proctor:
 *   post:
 *     summary: Proctoring event for onboarding assessment
 *     description: Increments a proctoring event type and returns updated proctoring object
 *     tags:
 *       - Candidate JobAi Assessments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateJobAiAssessmentIdParams'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 $ref: '#/components/schemas/ProctorTypeEnum'
 *     responses:
 *       200:
 *         description: Proctoring event updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateJobAiAssessmentProctorApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/:assessmentId/proctor',
  [
    ...candidateAuthMiddleware,
    validateRequest(candidateJobAiAssessmentProctorValidator),
  ],
  onboardingAssessmentController.proctor
);

// Submit assessment
/**
 * @openapi
 * /candidate/job-ai-assessments/{assessmentId}/submit:
 *   post:
 *     summary: Submit onboarding assessment
 *     description: Marks the assessment as completed and starts AI review
 *     tags:
 *       - Candidate JobAi Assessments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateJobAiAssessmentIdParams'
 *     responses:
 *       200:
 *         description: Assessment submitted and AI review started
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateJobAiAssessmentSubmitApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/:assessmentId/submit',
  [
    ...candidateAuthMiddleware,
    validateRequest(candidateJobAiAssessmentSubmitValidator),
  ],
  onboardingAssessmentController.submitAssessment
);

// Get presigned URL
/**
 * @openapi
 * /candidate/job-ai-assessments/{assessmentId}/presigned-url:
 *   get:
 *     summary: Get presigned URL for video upload
 *     description: Gets a presigned URL for uploading video chunks
 *     tags:
 *       - Candidate JobAi Assessments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateJobAiAssessmentIdParams'
 *     responses:
 *       200:
 *         description: Presigned URL retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateJobAiAssessmentPresignedUrlApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/:assessmentId/presigned-url',
  [
    ...candidateAuthMiddleware,
    validateRequest(candidateJobAiAssessmentPresignedUrlValidator),
  ],
  onboardingAssessmentController.getPresignedUrl
);

/**
 * @openapi
 * /candidate/job-ai-assessments/{assessmentId}/presigned-url/public:
 *   get:
 *     summary: Get presigned URL for video upload (public endpoint)
 *     description: Gets a presigned URL for uploading video chunks using only assessmentId
 *     tags:
 *       - Candidate JobAi Assessments
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateJobAiAssessmentIdParams'
 *     responses:
 *       200:
 *         description: Presigned URL retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateJobAiAssessmentPresignedUrlApiResponse'
 *       404:
 *         description: Assessment not found
 */
router.get(
  '/:assessmentId/presigned-url/public',
  [validateRequest(candidateJobAiAssessmentPresignedUrlValidator)],
  onboardingAssessmentController.getPresignedUrlByAssessmentId
);

/**
 * @openapi
 * /candidate/job-ai-assessments/presigned-url/by-video-url:
 *   get:
 *     summary: Get presigned URL for video upload by GCP video URL (public endpoint)
 *     description: Gets a presigned URL for uploading video chunks using a GCP video URL
 *     tags:
 *       - Candidate JobAi Assessments
 *     parameters:
 *       - in: query
 *         name: videoUrl
 *         required: true
 *         schema:
 *           type: string
 *         description: The GCP video URL
 *     responses:
 *       200:
 *         description: Presigned URL retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateJobAiAssessmentPresignedUrlApiResponse'
 *       400:
 *         description: Video URL is required
 *       404:
 *         description: Video URL not found or invalid
 */
router.get(
  '/presigned-url/by-video-url',
  [validateRequest(candidateJobAiAssessmentPresignedUrlByVideoUrlValidator)],
  onboardingAssessmentController.getPresignedUrlByVideoUrl
);

// Get question audio presigned URL

/**
 * @openapi
 * /candidate/job-ai-assessments/{assessmentId}/questions/{questionId}/audio-presigned-url:
 *   get:
 *     summary: Get presigned URL for question response audio upload
 *     description: Gets a presigned URL for uploading question response audio
 *     tags:
 *       - Candidate JobAi Assessments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateJobAiAssessmentIdParams'
 *       - $ref: '#/components/parameters/ICandidateJobAiAssessmentQuestionIdParams'
 *     responses:
 *       200:
 *         description: Presigned URL retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateJobAiAssessmentQuestionAudioPresignedUrlApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/:assessmentId/questions/:questionId/audio-presigned-url',
  [
    ...candidateAuthMiddleware,
    validateRequest(candidateJobAiAssessmentQuestionAudioPresignedUrlValidator),
  ],
  onboardingAssessmentController.getQuestionAudioPresignedUrl
);

/**
 * @openapi
 * /candidate/job-ai-assessments/{assessmentId}/questions/{questionId}/audio-presigned-url/public:
 *   get:
 *     summary: Get presigned URL for question response audio upload (public endpoint)
 *     description: Gets a presigned URL for uploading question response audio using only assessmentId and questionId
 *     tags:
 *       - Candidate JobAi Assessments
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateJobAiAssessmentIdParams'
 *       - $ref: '#/components/parameters/ICandidateJobAiAssessmentQuestionIdParams'
 *     responses:
 *       200:
 *         description: Presigned URL retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateJobAiAssessmentQuestionAudioPresignedUrlApiResponse'
 *       404:
 *         description: Assessment or question not found
 */
router.get(
  '/:assessmentId/questions/:questionId/audio-presigned-url/public',
  [validateRequest(candidateJobAiAssessmentQuestionAudioPresignedUrlValidator)],
  onboardingAssessmentController.getQuestionAudioPresignedUrlByAssessmentId
);

/**
 * @openapi
 * /candidate/job-ai-assessments/{assessmentId}/video-chunk:
 *   post:
 *     summary: Record video chunk upload and trigger analysis
 *     description: Called after frontend uploads chunk to GCS to record it and trigger analysis. Includes sectionId for job AI assessments.
 *     tags:
 *       - Candidate JobAi Assessments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateJobAiAssessmentIdParams'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - chunkIndex
 *               - gcsUri
 *             properties:
 *               chunkIndex:
 *                 type: number
 *                 description: Index of the chunk (0-based)
 *               gcsUri:
 *                 type: string
 *                 description: GCS URI of the uploaded chunk (gs://bucket/path)
 *               questionId:
 *                 type: string
 *                 description: Optional question ID this chunk belongs to
 *               sectionId:
 *                 type: string
 *                 description: Optional section ID this chunk belongs to (for job AI assessments)
 *     responses:
 *       200:
 *         description: Chunk recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 chunkId:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/:assessmentId/video-chunk',
  [...candidateAuthMiddleware],
  onboardingAssessmentController.recordChunkUpload
);

// Get job ai assessment invitation URL
/**
 * @openapi
 * /candidate/job-ai-assessments/{invitationId}/invitation-url:
 *   get:
 *     summary: Get job ai assessment invitation URL
 *     description: Get the invitation URL for a job ai assessment
 *     tags:
 *       - Candidate JobAi Assessments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateJobAiAssessmentInvitationUrlParams'
 *     responses:
 *       200:
 *         description: Job ai assessment invitation URL retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateJobAiAssessmentInvitationUrlApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/:invitationId/invitation-url',
  [...candidateAuthMiddleware],
  onboardingAssessmentController.getJobAiAssessmentInvitationUrl
);

/**
 * @openapi
 * /candidate/job-ai-assessments/{assessmentId}/re-submit:
 *   post:
 *     summary: Re-submit a job AI assessment
 *     description: Re-submits a job AI assessment for re-analysis
 *     tags:
 *       - Candidate JobAi Assessments
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
 *         description: Assessment re-submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Assessment re-submitted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/:assessmentId/re-submit',
  [...candidateAuthMiddleware],
  onboardingAssessmentController.reSubmitJobAiAssessment
);

/**
 * @openapi
 * /candidate/job-ai-assessments/{assessmentId}/video-chunks:
 *   get:
 *     summary: Get video chunks for a job AI assessment
 *     description: Retrieves all video chunks for the assessment with optional filtering by questionId or sectionId
 *     tags:
 *       - Candidate JobAi Assessments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateJobAiAssessmentIdParams'
 *       - in: query
 *         name: questionId
 *         schema:
 *           type: string
 *         description: Filter chunks by question ID
 *       - in: query
 *         name: sectionId
 *         schema:
 *           type: string
 *         description: Filter chunks by section ID
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
 *         description: Include signed playback URLs
 *     responses:
 *       200:
 *         description: Video chunks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateJobAiAssessmentVideoChunksGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Assessment not found
 */
router.get(
  '/:assessmentId/video-chunks',
  [
    ...candidateAuthMiddleware,
    validateRequest(candidateJobAiAssessmentVideoChunksGetValidator),
  ],
  onboardingAssessmentController.getVideoChunks
);

/**
 * @openapi
 * /candidate/job-ai-assessments/{assessmentId}/video-chunks/{chunkId}/playback-url:
 *   get:
 *     summary: Get playback URL for a specific video chunk
 *     description: Retrieves a signed playback URL for a specific video chunk
 *     tags:
 *       - Candidate JobAi Assessments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateJobAiAssessmentIdParams'
 *       - in: path
 *         name: chunkId
 *         required: true
 *         schema:
 *           type: string
 *         description: Video chunk ID
 *     responses:
 *       200:
 *         description: Playback URL retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateJobAiAssessmentChunkPlaybackUrlGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Assessment or chunk not found
 */
router.get(
  '/:assessmentId/video-chunks/:chunkId/playback-url',
  [
    ...candidateAuthMiddleware,
    validateRequest(candidateJobAiAssessmentChunkPlaybackUrlGetValidator),
  ],
  onboardingAssessmentController.getChunkPlaybackUrl
);

/**
 * @openapi
 * /candidate/job-ai-assessments/{assessmentId}/video-analysis/reprocess:
 *   post:
 *     summary: Reprocess video analysis for an assessment
 *     description: |
 *       Reprocesses the final video analysis by re-synthesizing from existing video chunks.
 *       This endpoint performs comprehensive verification to ensure fairness:
 *       - Verifies all chunks are successfully analyzed
 *       - Checks for no failed chunks
 *       - Ensures no gaps in chunk sequence
 *       - Validates minimum chunk coverage
 *       This ensures candidates receive fair and accurate assessments based on complete data.
 *     tags:
 *       - Candidate JobAi Assessments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateJobAiAssessmentIdParams'
 *     responses:
 *       200:
 *         description: Video analysis reprocessed successfully
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
 *                   example: Video analysis reprocessed successfully with verified chunk coverage
 *                 data:
 *                   $ref: '#/components/schemas/ICandidateJobAiAssessmentVideoAnalysis'
 *       400:
 *         description: Bad request - verification failed (missing chunks, failed chunks, etc.)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Assessment not found
 */
router.post(
  '/:assessmentId/video-analysis/reprocess',
  [...candidateAuthMiddleware],
  onboardingAssessmentController.reprocessVideoAnalysis
);

/**
 * @openapi
 * /candidate/job-ai-assessments/{assessmentId}/sync-chunks:
 *   post:
 *     summary: Sync GCS chunks with database
 *     description: |
 *       Manually syncs chunks in GCS storage with database records.
 *       Finds chunks in GCS that don't have DB records and creates them.
 *       Useful for recovering from data inconsistencies.
 *     tags:
 *       - Candidate JobAi Assessments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateJobAiAssessmentIdParams'
 *       - in: query
 *         name: triggerAnalysis
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Whether to trigger analysis for newly created chunks
 *       - in: query
 *         name: dryRun
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: If true, only report what would be done without making changes
 *     responses:
 *       200:
 *         description: Chunks synced successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalGcsChunks:
 *                   type: number
 *                   description: Total chunks found in GCS
 *                 existingDbChunks:
 *                   type: number
 *                   description: Chunks that already exist in DB
 *                 missingDbChunks:
 *                   type: number
 *                   description: Chunks in GCS but not in DB
 *                 createdChunks:
 *                   type: number
 *                   description: Chunks created in DB
 *                 failedChunks:
 *                   type: number
 *                   description: Chunks that failed to create
 *                 chunks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       chunkIndex:
 *                         type: number
 *                       fileName:
 *                         type: string
 *                       gcsUri:
 *                         type: string
 *                       fileSize:
 *                         type: number
 *                       status:
 *                         type: string
 *                         enum: [existing, created, failed, skipped]
 *                       error:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Assessment not found
 */
router.post(
  '/:assessmentId/sync-chunks',
  [...candidateAuthMiddleware],
  onboardingAssessmentController.syncGcsChunksWithDatabase
);

export default router;
