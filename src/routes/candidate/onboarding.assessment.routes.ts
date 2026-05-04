import { Router } from 'express';
import { OnboardingAssessmentController } from '@/controllers/candidate/onboarding.assessment.controller';
import { OnboardingAssessmentService } from '@/services/candidate/onboarding.assessment.service';
import {
  requireAuth,
  requireActiveUser,
  validateRequest,
  requireCandidateAccess,
} from '@/middleware';
import {
  candidateOnboardingAssessmentListValidator,
  candidateOnboardingAssessmentStartValidator,
  candidateOnboardingAssessmentSubmitAnswerValidator,
  candidateOnboardingAssessmentHeartbeatValidator,
  candidateOnboardingAssessmentProctorValidator,
  candidateOnboardingAssessmentSubmitValidator,
  candidateOnboardingAssessmentPresignedUrlValidator,
  candidateOnboardingAssessmentQuestionAudioPresignedUrlValidator,
  candidateOnboardingAssessmentVideoChunksGetValidator,
  candidateOnboardingAssessmentChunkPlaybackUrlGetValidator,
} from '@/shared/validators/candidate/onboarding.assessment.validator';
import { OnboardingAssessmentFactory } from '@/services/helpers/ai.onboarding.assessment/onboarding.assessment.factory';
import { StorageFactory } from '@/services/helpers/storage/storage.factory';

const router = Router({ mergeParams: true });

// Initialize services and controller
const onboardingAssessmentProvider =
  OnboardingAssessmentFactory.getInstance().getProvider();
const storageProvider = StorageFactory.getInstance().getProvider();
const onboardingAssessmentService = new OnboardingAssessmentService(
  onboardingAssessmentProvider,
  storageProvider
);
const onboardingAssessmentController = new OnboardingAssessmentController(
  onboardingAssessmentService
);

// Candidate auth middleware - applies to all onboarding assessment routes
const candidateAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireCandidateAccess,
];

/**
 * @openapi
 * /candidate/onboarding-assessments/initialize:
 *   post:
 *     summary: Initialize onboarding assessment initialize task
 *     description: Creates a new onboarding assessment initialize task or returns existing one if not completed/failed
 *     tags:
 *       - Candidate Onboarding Assessments
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Onboarding assessment initialize task initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateOnboardingAssessmentInitializeApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.post(
  '/initialize',
  [...candidateAuthMiddleware],
  onboardingAssessmentController.initialize
);

/**
 * @openapi
 * /candidate/onboarding-assessments/{assessmentId}/start:
 *   post:
 *     summary: Start an onboarding assessment
 *     description: Starts an onboarding assessment and returns the first question
 *     tags:
 *       - Candidate Onboarding Assessments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateOnboardingAssessmentIdParams'
 *     responses:
 *       200:
 *         description: Assessment started successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateOnboardingAssessmentStartApiResponse'
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
    validateRequest(candidateOnboardingAssessmentStartValidator),
  ],
  onboardingAssessmentController.startAssessment
);

/**
 * @openapi
 * /candidate/onboarding-assessments/{assessmentId}/task:
 *   get:
 *     summary: Get candidate onboarding assessment initialize task
 *     description: Retrieves a specific candidate onboarding assessment initialize task
 *     tags:
 *       - Candidate Onboarding Assessments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateOnboardingAssessmentIdParams'
 *     responses:
 *       200:
 *         description: Onboarding assessment initialize task retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateOnboardingAssessmentTaskGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Onboarding assessment initialize task not found
 */
router.get(
  '/:assessmentId/task',
  [...candidateAuthMiddleware],
  onboardingAssessmentController.getOnboardingAssessmentTask
);

/**
 * @openapi
 * /candidate/onboarding-assessments/{assessmentId}/questions/{questionId}/submit:
 *   post:
 *     summary: Submit answer for a question
 *     description: Submits an answer for a question and returns the next question
 *     tags:
 *       - Candidate Onboarding Assessments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateOnboardingAssessmentIdParams'
 *       - $ref: '#/components/parameters/ICandidateOnboardingAssessmentQuestionIdParams'
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
 *               $ref: '#/components/schemas/ICandidateOnboardingAssessmentSubmitAnswerApiResponse'
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
    validateRequest(candidateOnboardingAssessmentSubmitAnswerValidator),
  ],
  onboardingAssessmentController.submitAnswer
);

/**
 * @openapi
 * /candidate/onboarding-assessments:
 *   get:
 *     summary: Get all onboarding assessments
 *     description: Retrieves all onboarding assessments for the authenticated candidate with pagination and filtering
 *     tags:
 *       - Candidate Onboarding Assessments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortBy'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortOrder'
 *       - $ref: '#/components/parameters/ICandidateOnboardingAssessmentFilterQueryStatus'
 *     responses:
 *       200:
 *         description: Onboarding assessments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateOnboardingAssessmentListGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get(
  '/',
  [
    ...candidateAuthMiddleware,
    validateRequest(candidateOnboardingAssessmentListValidator),
  ],
  onboardingAssessmentController.getOnboardingAssessments
);

/**
 * @openapi
 * /candidate/onboarding-assessments/latest:
 *   get:
 *     summary: Get latest onboarding assessment
 *     description: Retrieves the latest onboarding assessment for the authenticated candidate
 *     tags:
 *       - Candidate Onboarding Assessments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateOnboardingAssessmentIdParams'
 *     responses:
 *       200:
 *         description: Onboarding assessment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateOnboardingAssessmentGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Onboarding assessment not found
 */
router.get(
  '/latest',
  [...candidateAuthMiddleware],
  onboardingAssessmentController.getLatestOnboardingAssessment
);

/**
 * @openapi
 * /candidate/onboarding-assessments/{candidateId}/latest:
 *   get:
 *     summary: Get latest onboarding assessment for a candidate
 *     description: Retrieves the latest onboarding assessment for a specific candidate
 *     tags:
 *       - Candidate Onboarding Assessments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IAssessmentCandidateIdParams'
 *     responses:
 *       200:
 *         description: Onboarding assessment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateOnboardingAssessmentGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Onboarding assessment not found
 *
 */
router.get(
  '/:candidateId/latest',
  [...candidateAuthMiddleware],
  onboardingAssessmentController.getLatestOnboardingAssessmentByCandidateId
);

/**
 * @openapi
 * /candidate/onboarding-assessments/{assessmentId}:
 *   get:
 *     summary: Get specific onboarding assessment
 *     description: Retrieves a specific onboarding assessment for the authenticated candidate
 *     tags:
 *       - Candidate Onboarding Assessments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateOnboardingAssessmentIdParams'
 *     responses:
 *       200:
 *         description: Onboarding assessment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateOnboardingAssessmentGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Onboarding assessment not found
 */
router.get(
  '/:assessmentId',
  [...candidateAuthMiddleware],
  onboardingAssessmentController.getOnboardingAssessment
);

/**
 * @openapi
 * /candidate/onboarding-assessments/{assessmentId}/heartbeat:
 *   patch:
 *     summary: Heartbeat (status update) for onboarding assessment
 *     description: Updates the duration and/or status of the assessment (heartbeat)
 *     tags:
 *       - Candidate Onboarding Assessments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateOnboardingAssessmentIdParams'
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
 *               $ref: '#/components/schemas/ICandidateOnboardingAssessmentHeartbeatApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.patch(
  '/:assessmentId/heartbeat',
  [
    ...candidateAuthMiddleware,
    validateRequest(candidateOnboardingAssessmentHeartbeatValidator),
  ],
  onboardingAssessmentController.heartbeat
);

/**
 * @openapi
 * /candidate/onboarding-assessments/{assessmentId}/proctor:
 *   post:
 *     summary: Proctoring event for onboarding assessment
 *     description: Increments a proctoring event type and returns updated proctoring object
 *     tags:
 *       - Candidate Onboarding Assessments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateOnboardingAssessmentIdParams'
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
 *               $ref: '#/components/schemas/ICandidateOnboardingAssessmentProctorApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/:assessmentId/proctor',
  [
    ...candidateAuthMiddleware,
    validateRequest(candidateOnboardingAssessmentProctorValidator),
  ],
  onboardingAssessmentController.proctor
);

/**
 * @openapi
 * /candidate/onboarding-assessments/{assessmentId}/submit:
 *   post:
 *     summary: Submit onboarding assessment
 *     description: Marks the assessment as completed and starts AI review
 *     tags:
 *       - Candidate Onboarding Assessments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateOnboardingAssessmentIdParams'
 *     responses:
 *       200:
 *         description: Assessment submitted and AI review started
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateOnboardingAssessmentSubmitApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/:assessmentId/submit',
  [
    ...candidateAuthMiddleware,
    validateRequest(candidateOnboardingAssessmentSubmitValidator),
  ],
  onboardingAssessmentController.submitAssessment
);

// TODO: Remove this route after testing
/**
 * @openapi
 * /candidate/onboarding-assessments/process-failed-assessments:
 *   post:
 *     summary: Process failed assessments
 *     description: Processes failed assessments
 *     tags:
 *       - Candidate Onboarding Assessments
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Failed assessments processed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/process-failed-assessments',
  [...candidateAuthMiddleware],
  onboardingAssessmentController.processFailedAssessments
);

/**
 * @openapi
 * /candidate/onboarding-assessments/{assessmentId}/re-submit:
 *   post:
 *     summary: Re-submit an onboarding assessment
 *     description: Re-submits an onboarding assessment
 *     tags:
 *       - Candidate Onboarding Assessments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateOnboardingAssessmentIdParams'
 *     responses:
 *       200:
 *         description: Assessment re-submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateOnboardingAssessmentReSubmitApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/:assessmentId/re-submit',
  [...candidateAuthMiddleware],
  onboardingAssessmentController.reSubmitAssessment
);

/**
 * @openapi
 * /candidate/onboarding-assessments/{assessmentId}/presigned-url:
 *   get:
 *     summary: Get presigned URL for video upload
 *     description: Gets a presigned URL for uploading video chunks
 *     tags:
 *       - Candidate Onboarding Assessments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateOnboardingAssessmentIdParams'
 *     responses:
 *       200:
 *         description: Presigned URL retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateOnboardingAssessmentPresignedUrlApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/:assessmentId/presigned-url',
  [
    ...candidateAuthMiddleware,
    validateRequest(candidateOnboardingAssessmentPresignedUrlValidator),
  ],
  onboardingAssessmentController.getPresignedUrl
);

/**
 * @openapi
 * /candidate/onboarding-assessments/{assessmentId}/video-chunk:
 *   post:
 *     summary: Record video chunk upload and trigger analysis
 *     description: Called after frontend uploads chunk to GCS to record it and trigger analysis
 *     tags:
 *       - Candidate Onboarding Assessments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateOnboardingAssessmentIdParams'
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

/**
 * @openapi
 * /candidate/onboarding-assessments/{assessmentId}/video-chunks:
 *   get:
 *     summary: Get video chunks for an assessment
 *     description: Retrieves all relevant video chunks for the assessment, optionally filtered by question
 *     tags:
 *       - Candidate Onboarding Assessments
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
  '/:assessmentId/video-chunks',
  [
    ...candidateAuthMiddleware,
    validateRequest(candidateOnboardingAssessmentVideoChunksGetValidator),
  ],
  onboardingAssessmentController.getVideoChunks
);

/**
 * @openapi
 * /candidate/onboarding-assessments/{assessmentId}/video-chunks/{chunkId}/playback-url:
 *   get:
 *     summary: Get playback URL for a specific chunk
 *     description: Generates a signed URL for playing back a specific video chunk
 *     tags:
 *       - Candidate Onboarding Assessments
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
  '/:assessmentId/video-chunks/:chunkId/playback-url',
  [
    ...candidateAuthMiddleware,
    validateRequest(candidateOnboardingAssessmentChunkPlaybackUrlGetValidator),
  ],
  onboardingAssessmentController.getChunkPlaybackUrl
);

/**
 * @openapi
 * /candidate/onboarding-assessments/{assessmentId}/video-analysis/reprocess:
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
 *       - Candidate Onboarding Assessments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateOnboardingAssessmentIdParams'
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
 *                   $ref: '#/components/schemas/ICandidateOnboardingAssessmentVideoAnalysis'
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
 * /candidate/onboarding-assessments/{assessmentId}/presigned-url/public:
 *   get:
 *     summary: Get presigned URL for video upload (public endpoint)
 *     description: Gets a presigned URL for uploading video chunks using only assessmentId
 *     tags:
 *       - Candidate Onboarding Assessments
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateOnboardingAssessmentIdParams'
 *     responses:
 *       200:
 *         description: Presigned URL retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateOnboardingAssessmentPresignedUrlApiResponse'
 *       404:
 *         description: Assessment not found
 */
router.get(
  '/:assessmentId/presigned-url/public',
  [validateRequest(candidateOnboardingAssessmentPresignedUrlValidator)],
  onboardingAssessmentController.getPresignedUrlByAssessmentId
);

/**
 * @openapi
 * /candidate/onboarding-assessments/{assessmentId}/questions/{questionId}/audio-presigned-url:
 *   get:
 *     summary: Get presigned URL for question response audio upload
 *     description: Gets a presigned URL for uploading question response audio
 *     tags:
 *       - Candidate Onboarding Assessments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateOnboardingAssessmentIdParams'
 *       - $ref: '#/components/parameters/ICandidateOnboardingAssessmentQuestionIdParams'
 *     responses:
 *       200:
 *         description: Presigned URL retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateOnboardingAssessmentQuestionAudioPresignedUrlApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/:assessmentId/questions/:questionId/audio-presigned-url',
  [
    ...candidateAuthMiddleware,
    validateRequest(
      candidateOnboardingAssessmentQuestionAudioPresignedUrlValidator
    ),
  ],
  onboardingAssessmentController.getQuestionAudioPresignedUrl
);

/**
 * @openapi
 * /candidate/onboarding-assessments/{assessmentId}/questions/{questionId}/audio-presigned-url/public:
 *   get:
 *     summary: Get presigned URL for question response audio upload (public endpoint)
 *     description: Gets a presigned URL for uploading question response audio using only assessmentId and questionId
 *     tags:
 *       - Candidate Onboarding Assessments
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateOnboardingAssessmentIdParams'
 *       - $ref: '#/components/parameters/ICandidateOnboardingAssessmentQuestionIdParams'
 *     responses:
 *       200:
 *         description: Presigned URL retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateOnboardingAssessmentQuestionAudioPresignedUrlApiResponse'
 *       404:
 *         description: Assessment or question not found
 */
router.get(
  '/:assessmentId/questions/:questionId/audio-presigned-url/public',
  [
    validateRequest(
      candidateOnboardingAssessmentQuestionAudioPresignedUrlValidator
    ),
  ],
  onboardingAssessmentController.getQuestionAudioPresignedUrlByAssessmentId
);

/**
 * @openapi
 * /candidate/onboarding-assessments/terms-accepted:
 *   put:
 *     summary: Update terms acceptance status
 *     description: Updates the terms acceptance status for a candidate
 *     tags:
 *       - Candidate Onboarding Assessments
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - termsAccepted
 *             properties:
 *               termsAccepted:
 *                 type: boolean
 *                 description: Whether terms have been accepted
 *     responses:
 *       200:
 *         description: Terms acceptance status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Terms acceptance status updated successfully
 *       400:
 *         description: Bad request - Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: No assessment found for candidate
 */
router.put(
  '/terms-accepted',
  [...candidateAuthMiddleware],
  onboardingAssessmentController.updateTermsAccepted
);

/**
 * @openapi
 * /candidate/onboarding-assessments/{assessmentId}/sync-chunks:
 *   post:
 *     summary: Sync GCS video chunks with database for an onboarding assessment
 *     description: |
 *       Lists all video chunks in GCS for the assessment, creates missing database records, and optionally triggers analysis.
 *       Useful for recovering from data inconsistencies.
 *     tags:
 *       - Candidate Onboarding Assessments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateOnboardingAssessmentIdParams'
 *       - in: query
 *         name: triggerAnalysis
 *         schema:
 *           type: boolean
 *         description: If true, triggers analysis for newly created chunks.
 *       - in: query
 *         name: dryRun
 *         schema:
 *           type: boolean
 *         description: If true, performs a dry run without making any changes.
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
 *                 existingDbChunks:
 *                   type: number
 *                 missingDbChunks:
 *                   type: number
 *                 createdChunks:
 *                   type: number
 *                 failedChunks:
 *                   type: number
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
 *                         enum: [created, existing, failed, skipped]
 *                       error:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Assessment not found
 */
router.post(
  '/:assessmentId/sync-chunks',
  [...candidateAuthMiddleware],
  onboardingAssessmentController.syncGcsChunksWithDatabase
);

export default router;
