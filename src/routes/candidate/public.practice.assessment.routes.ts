import { Router } from 'express';
import multer from 'multer';
import { PublicPracticeAssessmentController } from '@/controllers/candidate/public.practice.assessment.controller';
import { PublicPracticeAssessmentService } from '@/services/candidate/public.practice.assessment.service';
import {
  requireAuth,
  requireActiveUser,
  requireCandidateAccess,
  validateRequest,
} from '@/middleware';
import {
  publicPracticeAssessmentCreateValidator,
  publicPracticeAssessmentGetValidator,
  publicPracticeAssessmentLinkValidator,
  publicPracticeAssessmentGetByEmailValidator,
  publicPracticeAssessmentListValidator,
  publicPracticeAssessmentParseValidator,
  publicPracticeAssessmentParseDescriptionValidator,
  publicPracticeAssessmentGetParsedJobDataValidator,
  publicPracticeAssessmentGetTaskValidator,
  publicPracticeAssessmentStartValidator,
  publicPracticeAssessmentSubmitAnswerValidator,
  publicPracticeAssessmentSubmitValidator,
  publicPracticeAssessmentUpdateTermsAcceptedValidator,
} from '@/shared/validators/candidate/public.practice.assessment.validator';
import { StorageFactory } from '@/services/helpers/storage/storage.factory';

const router = Router({ mergeParams: true });
const upload = multer({ storage: multer.memoryStorage() });

// Initialize services and controller
const storageProvider = StorageFactory.getInstance().getProvider();
const publicPracticeAssessmentService = new PublicPracticeAssessmentService(
  storageProvider
);
const publicPracticeAssessmentController =
  new PublicPracticeAssessmentController(publicPracticeAssessmentService);

// Candidate auth middleware - for routes that require authentication
const candidateAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireCandidateAccess,
];

/**
 * @openapi
 * /public/practice-assessments:
 *   post:
 *     summary: Create and initialize a public practice assessment
 *     description: Creates a practice assessment from parsed job data and starts AI initialization. No authentication required.
 *     tags:
 *       - Public Practice Assessments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IPublicPracticeAssessmentCreateWithParsedDataRequest'
 *     responses:
 *       200:
 *         description: Assessment created and initialization started
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPublicPracticeAssessmentCreateApiResponse'
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */
router.post(
  '/',
  upload.single('resumeFile'),
  validateRequest(publicPracticeAssessmentCreateValidator),
  publicPracticeAssessmentController.create
);

/**
 * @openapi
 * /public/practice-assessments/by-email:
 *   get:
 *     summary: Get public practice assessments by email
 *     description: Retrieves all public practice assessments for a given email address. Useful for linking after signup.
 *     tags:
 *       - Public Practice Assessments
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Email address to search for
 *     responses:
 *       200:
 *         description: Assessments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPublicPracticeAssessmentListByEmailApiResponse'
 *       400:
 *         description: Invalid input
 */
router.get(
  '/by-email',
  validateRequest(publicPracticeAssessmentGetByEmailValidator),
  publicPracticeAssessmentController.getByEmail
);

/**
 * @openapi
 * /public/practice-assessments/check-candidate:
 *   get:
 *     summary: Check if candidate exists by email
 *     description: Checks if a candidate exists by email and returns candidate info for pre-filling forms. No authentication required.
 *     tags:
 *       - Public Practice Assessments
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Email address to check
 *     responses:
 *       200:
 *         description: Candidate check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exists:
 *                   type: boolean
 *                 name:
 *                   type: string
 *                 hasResume:
 *                   type: boolean
 *                 resumeParsed:
 *                   type: boolean
 *                 userType:
 *                   type: string
 *       400:
 *         description: Invalid input
 */
router.get(
  '/check-candidate',
  publicPracticeAssessmentController.checkCandidateByEmail
);

/**
 * @openapi
 * /public/practice-assessments/{assessmentId}:
 *   get:
 *     summary: Get a public practice assessment by ID
 *     description: Retrieves a public practice assessment. No authentication required.
 *     tags:
 *       - Public Practice Assessments
 *     parameters:
 *       - $ref: '#/components/parameters/IPublicPracticeAssessmentIdParams'
 *     responses:
 *       200:
 *         description: Assessment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPublicPracticeAssessmentGetApiResponse'
 *       404:
 *         description: Assessment not found
 */
router.get(
  '/:assessmentId',
  validateRequest(publicPracticeAssessmentGetValidator),
  publicPracticeAssessmentController.get
);

/**
 * @openapi
 * /public/practice-assessments/{assessmentId}/link:
 *   post:
 *     summary: Link a public practice assessment to a candidate
 *     description: Links a public practice assessment to a candidate account after signup/login. Requires authentication.
 *     tags:
 *       - Public Practice Assessments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IPublicPracticeAssessmentIdParams'
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IPublicPracticeAssessmentLinkRequest'
 *     responses:
 *       200:
 *         description: Assessment linked successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPublicPracticeAssessmentLinkApiResponse'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Assessment or candidate not found
 */
router.post(
  '/:assessmentId/link',
  [
    ...candidateAuthMiddleware,
    validateRequest(publicPracticeAssessmentLinkValidator),
  ],
  publicPracticeAssessmentController.linkToCandidate
);

/**
 * @openapi
 * /candidate/practice-assessments:
 *   get:
 *     summary: Get practice assessments for authenticated candidate
 *     description: Retrieves all practice assessments for the authenticated candidate with pagination. Requires authentication.
 *     tags:
 *       - Public Practice Assessments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, completedAt]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Successfully retrieved practice assessments
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPublicPracticeAssessmentListApiResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export const candidatePracticeAssessmentsRouter = Router({ mergeParams: true });

candidatePracticeAssessmentsRouter.get(
  '/',
  ...candidateAuthMiddleware,
  validateRequest(publicPracticeAssessmentListValidator),
  publicPracticeAssessmentController.getPracticeAssessmentsForCandidate
);

/**
 * @openapi
 * /public/practice-assessments/{assessmentId}/task:
 *   get:
 *     summary: Get public practice assessment initialization task
 *     description: Retrieves the initialization task status for polling. No authentication required.
 *     tags:
 *       - Public Practice Assessments
 *     parameters:
 *       - $ref: '#/components/parameters/IPublicPracticeAssessmentIdParams'
 *     responses:
 *       200:
 *         description: Task retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPublicPracticeAssessmentTaskGetApiResponse'
 *       404:
 *         description: Assessment or task not found
 */
router.get(
  '/:assessmentId/task',
  validateRequest(publicPracticeAssessmentGetTaskValidator),
  publicPracticeAssessmentController.getTask
);

/**
 * @openapi
 * /public/practice-assessments/{assessmentId}/initialize:
 *   post:
 *     summary: Initialize public practice assessment
 *     description: Starts the AI initialization process for the assessment. Called when user clicks "I am ready" on check page. No authentication required.
 *     tags:
 *       - Public Practice Assessments
 *     parameters:
 *       - $ref: '#/components/parameters/IPublicPracticeAssessmentIdParams'
 *     responses:
 *       200:
 *         description: Assessment initialization started successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPublicPracticeAssessmentTaskGetApiResponse'
 *       400:
 *         description: Invalid input or assessment already initialized
 *       404:
 *         description: Assessment not found
 */
router.post(
  '/:assessmentId/initialize',
  validateRequest(publicPracticeAssessmentGetTaskValidator),
  publicPracticeAssessmentController.initialize
);

/**
 * @openapi
 * /public/practice-assessments/{assessmentId}/start:
 *   post:
 *     summary: Start a public practice assessment
 *     description: Starts the assessment and returns the first question. No authentication required.
 *     tags:
 *       - Public Practice Assessments
 *     parameters:
 *       - $ref: '#/components/parameters/IPublicPracticeAssessmentIdParams'
 *     responses:
 *       200:
 *         description: Assessment started successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPublicPracticeAssessmentStartApiResponse'
 *       400:
 *         description: Assessment not ready to start
 *       404:
 *         description: Assessment not found
 */
router.post(
  '/:assessmentId/start',
  validateRequest(publicPracticeAssessmentStartValidator),
  publicPracticeAssessmentController.startAssessment
);

/**
 * @openapi
 * /public/practice-assessments/{assessmentId}/questions/{questionId}/submit:
 *   post:
 *     summary: Submit answer for a question
 *     description: Submits an answer and returns the next question. No authentication required.
 *     tags:
 *       - Public Practice Assessments
 *     parameters:
 *       - $ref: '#/components/parameters/IPublicPracticeAssessmentIdParams'
 *       - $ref: '#/components/parameters/IPublicPracticeAssessmentQuestionIdParams'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - answerGiven
 *             properties:
 *               answerGiven:
 *                 type: string
 *     responses:
 *       200:
 *         description: Answer submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPublicPracticeAssessmentSubmitAnswerApiResponse'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Assessment or question not found
 */
router.post(
  '/:assessmentId/questions/:questionId/submit',
  validateRequest(publicPracticeAssessmentSubmitAnswerValidator),
  publicPracticeAssessmentController.submitAnswer
);

/**
 * @openapi
 * /public/practice-assessments/{assessmentId}/submit:
 *   post:
 *     summary: Submit public practice assessment
 *     description: Marks the assessment as completed. No authentication required.
 *     tags:
 *       - Public Practice Assessments
 *     parameters:
 *       - $ref: '#/components/parameters/IPublicPracticeAssessmentIdParams'
 *     responses:
 *       200:
 *         description: Assessment submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPublicPracticeAssessmentSubmitApiResponse'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Assessment not found
 */
router.post(
  '/:assessmentId/submit',
  validateRequest(publicPracticeAssessmentSubmitValidator),
  publicPracticeAssessmentController.submitAssessment
);

/**
 * @openapi
 * /public/practice-assessments/{assessmentId}/heartbeat:
 *   post:
 *     summary: Send heartbeat to update assessment timer state
 *     description: Updates the assessment duration with remaining time to preserve timer state on page refresh. No authentication required.
 *     tags:
 *       - Public Practice Assessments
 *     parameters:
 *       - $ref: '#/components/parameters/IPublicPracticeAssessmentIdParams'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - duration
 *             properties:
 *               duration:
 *                 type: number
 *                 description: Remaining time in seconds
 *               status:
 *                 type: string
 *                 description: Optional status update
 *     responses:
 *       200:
 *         description: Heartbeat recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: boolean
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Assessment not found
 */
router.post(
  '/:assessmentId/heartbeat',
  validateRequest(publicPracticeAssessmentGetValidator),
  publicPracticeAssessmentController.heartbeat
);

/**
 * @openapi
 * /public/practice-assessments/parse:
 *   post:
 *     summary: Parse a job URL
 *     description: Parses a job posting URL, stores the parsed data, and returns the parsed data ID. This is the first step in creating a practice assessment.
 *     tags:
 *       - Public Practice Assessments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IPublicPracticeAssessmentParseRequest'
 *     responses:
 *       200:
 *         description: Job URL parsed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPublicPracticeAssessmentParseApiResponse'
 *       400:
 *         description: Invalid input or parsing failed
 *       500:
 *         description: Internal server error
 */
router.post(
  '/parse',
  validateRequest(publicPracticeAssessmentParseValidator),
  publicPracticeAssessmentController.parse
);

/**
 * @openapi
 * /public/practice-assessments/parse-description:
 *   post:
 *     summary: Parse a job description text
 *     description: Parses a job description text, stores the parsed data, and returns the parsed data ID. This is an alternative to parsing a job URL.
 *     tags:
 *       - Public Practice Assessments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IPublicPracticeAssessmentParseDescriptionRequest'
 *     responses:
 *       200:
 *         description: Job description parsed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPublicPracticeAssessmentParseDescriptionApiResponse'
 *       400:
 *         description: Invalid input or parsing failed
 *       500:
 *         description: Internal server error
 */
router.post(
  '/parse-description',
  validateRequest(publicPracticeAssessmentParseDescriptionValidator),
  publicPracticeAssessmentController.parseDescription
);

/**
 * @openapi
 * /public/practice-assessments/parsed-job-data/{parsedJobDataId}:
 *   get:
 *     summary: Get parsed job data by ID
 *     description: Retrieves the stored parsed job data by its ID. No authentication required.
 *     tags:
 *       - Public Practice Assessments
 *     parameters:
 *       - in: path
 *         name: parsedJobDataId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the parsed job data
 *     responses:
 *       200:
 *         description: Parsed job data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPublicPracticeAssessmentGetParsedJobDataApiResponse'
 *       404:
 *         description: Parsed job data not found
 */
router.get(
  '/parsed-job-data/:parsedJobDataId',
  validateRequest(publicPracticeAssessmentGetParsedJobDataValidator),
  publicPracticeAssessmentController.getParsedJobData
);

/**
 * @openapi
 * /public/practice-assessments/{assessmentId}/presigned-url:
 *   get:
 *     summary: Get presigned URL for video chunk upload
 *     description: Gets a presigned URL for uploading video chunks. No authentication required.
 *     tags:
 *       - Public Practice Assessments
 *     parameters:
 *       - $ref: '#/components/parameters/IPublicPracticeAssessmentIdParams'
 *       - in: query
 *         name: chunkIndex
 *         required: false
 *         schema:
 *           type: number
 *         description: Optional chunk index. If not provided, next available index is used.
 *     responses:
 *       200:
 *         description: Presigned URL retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 presignedUrl:
 *                   type: string
 *                 chunkIndex:
 *                   type: number
 *                 gcsUri:
 *                   type: string
 *                 filePath:
 *                   type: string
 *       404:
 *         description: Assessment not found
 */
router.get(
  '/:assessmentId/presigned-url',
  validateRequest(publicPracticeAssessmentGetValidator),
  publicPracticeAssessmentController.getPresignedUrl
);

/**
 * @openapi
 * /public/practice-assessments/{assessmentId}/chunks:
 *   post:
 *     summary: Record video chunk upload
 *     description: Records a video chunk upload and triggers analysis. No authentication required.
 *     tags:
 *       - Public Practice Assessments
 *     parameters:
 *       - $ref: '#/components/parameters/IPublicPracticeAssessmentIdParams'
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
 *               gcsUri:
 *                 type: string
 *               questionId:
 *                 type: string
 *               sectionId:
 *                 type: string
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
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Assessment not found
 */
router.post(
  '/:assessmentId/chunks',
  validateRequest(publicPracticeAssessmentGetValidator),
  publicPracticeAssessmentController.recordChunkUpload
);

/**
 * @openapi
 * /public/practice-assessments/{assessmentId}/terms-accepted:
 *   put:
 *     summary: Update terms acceptance status for a public practice assessment
 *     description: Updates the terms acceptance status. No authentication required.
 *     tags:
 *       - Public Practice Assessments
 *     parameters:
 *       - $ref: '#/components/parameters/IPublicPracticeAssessmentIdParams'
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
 *       400:
 *         description: Bad request - Invalid input
 *       404:
 *         description: Assessment not found
 */
router.put(
  '/:assessmentId/terms-accepted',
  validateRequest(publicPracticeAssessmentUpdateTermsAcceptedValidator),
  publicPracticeAssessmentController.updateTermsAccepted
);

/**
 * @openapi
 * /public/practice-assessments/{assessmentId}/video-chunks/presigned-url:
 *   post:
 *     summary: Get presigned URL for video chunk upload
 *     description: Generates a presigned URL for uploading a video chunk. No authentication required.
 *     tags:
 *       - Public Practice Assessments
 *     parameters:
 *       - $ref: '#/components/parameters/IPublicPracticeAssessmentIdParams'
 *       - in: query
 *         name: chunkIndex
 *         schema:
 *           type: integer
 *         description: Optional chunk index (if not provided, next index is calculated)
 *       - in: query
 *         name: sectionId
 *         schema:
 *           type: string
 *         description: Optional section ID
 *       - in: query
 *         name: questionId
 *         schema:
 *           type: string
 *         description: Optional question ID
 *     responses:
 *       200:
 *         description: Presigned URL generated successfully
 *       404:
 *         description: Assessment not found
 */
router.post(
  '/:assessmentId/video-chunks/presigned-url',
  validateRequest(publicPracticeAssessmentGetValidator),
  publicPracticeAssessmentController.getPresignedUrlForVideoChunk
);

/**
 * @openapi
 * /public/practice-assessments/{assessmentId}/video-chunks/record:
 *   post:
 *     summary: Record video chunk upload
 *     description: Records a video chunk upload and triggers analysis. No authentication required.
 *     tags:
 *       - Public Practice Assessments
 *     parameters:
 *       - $ref: '#/components/parameters/IPublicPracticeAssessmentIdParams'
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
 *                 type: integer
 *               gcsUri:
 *                 type: string
 *               questionId:
 *                 type: string
 *               sectionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Chunk recorded successfully
 *       404:
 *         description: Assessment not found
 */
router.post(
  '/:assessmentId/video-chunks/record',
  validateRequest(publicPracticeAssessmentGetValidator),
  publicPracticeAssessmentController.recordVideoChunkUpload
);

/**
 * @openapi
 * /public/practice-assessments/{assessmentId}/video-chunks:
 *   get:
 *     summary: Get video chunks for an assessment
 *     description: Retrieves all video chunks for an assessment. No authentication required.
 *     tags:
 *       - Public Practice Assessments
 *     parameters:
 *       - $ref: '#/components/parameters/IPublicPracticeAssessmentIdParams'
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
 *           type: boolean
 *         description: Include analysis data
 *       - in: query
 *         name: includePlaybackUrls
 *         schema:
 *           type: boolean
 *         description: Include playback URLs
 *     responses:
 *       200:
 *         description: Video chunks retrieved successfully
 *       404:
 *         description: Assessment not found
 */
router.get(
  '/:assessmentId/video-chunks',
  validateRequest(publicPracticeAssessmentGetValidator),
  publicPracticeAssessmentController.getVideoChunks
);

/**
 * @openapi
 * /public/practice-assessments/{assessmentId}/proctoring:
 *   post:
 *     summary: Record proctoring event
 *     description: Records a proctoring event (tab switch, copy/paste, etc.). No authentication required.
 *     tags:
 *       - Public Practice Assessments
 *     parameters:
 *       - $ref: '#/components/parameters/IPublicPracticeAssessmentIdParams'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [TAB_SWITCHED, COPY_PASTE, MULTIPLE_PERSONS_DETECTED, NO_FACE_DETECTED, AUDIO_IRREGULARITY, SCREEN_SHARE_VIOLATION, WARNING]
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Proctoring event recorded successfully
 *       404:
 *         description: Assessment not found
 */
router.post(
  '/:assessmentId/proctoring',
  validateRequest(publicPracticeAssessmentGetValidator),
  publicPracticeAssessmentController.recordProctoringEvent
);

/**
 * @openapi
 * /public/practice-assessments/{assessmentId}/proctoring:
 *   get:
 *     summary: Get proctoring data for an assessment
 *     description: Retrieves proctoring data for an assessment. No authentication required.
 *     tags:
 *       - Public Practice Assessments
 *     parameters:
 *       - $ref: '#/components/parameters/IPublicPracticeAssessmentIdParams'
 *     responses:
 *       200:
 *         description: Proctoring data retrieved successfully
 *       404:
 *         description: Assessment not found
 */
router.get(
  '/:assessmentId/proctoring',
  validateRequest(publicPracticeAssessmentGetValidator),
  publicPracticeAssessmentController.getProctoringData
);

/**
 * @openapi
 * /public/practice-assessments/{assessmentId}/video-analysis/trigger:
 *   post:
 *     summary: Trigger video analysis
 *     description: Triggers background video analysis for an assessment. No authentication required.
 *     tags:
 *       - Public Practice Assessments
 *     parameters:
 *       - $ref: '#/components/parameters/IPublicPracticeAssessmentIdParams'
 *     responses:
 *       200:
 *         description: Video analysis triggered successfully
 *       404:
 *         description: Assessment not found
 */
router.post(
  '/:assessmentId/video-analysis/trigger',
  validateRequest(publicPracticeAssessmentGetValidator),
  publicPracticeAssessmentController.triggerVideoAnalysis
);

/**
 * @openapi
 * /public/practice-assessments/{assessmentId}/video-analysis:
 *   get:
 *     summary: Get video analysis results
 *     description: Retrieves video analysis results for an assessment. No authentication required.
 *     tags:
 *       - Public Practice Assessments
 *     parameters:
 *       - $ref: '#/components/parameters/IPublicPracticeAssessmentIdParams'
 *     responses:
 *       200:
 *         description: Video analysis retrieved successfully
 *       404:
 *         description: Assessment not found
 */
router.get(
  '/:assessmentId/video-analysis',
  validateRequest(publicPracticeAssessmentGetValidator),
  publicPracticeAssessmentController.getVideoAnalysis
);

export default router;
