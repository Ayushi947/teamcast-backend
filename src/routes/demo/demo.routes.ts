import { Router } from 'express';
import { DemoController } from '@/controllers/demo/demo.controller';
import { validateRequest } from '@/middleware';
import {
  demoAssessmentStartValidator,
  demoAnswerSubmitValidator,
  demoVideoAnalysisValidator,
} from '@/shared/validators/demo/demo.validator';
import { DemoService } from '@/services/demo/demo.service';

const router = Router({ mergeParams: true });

// Initialize services and controller using singleton pattern
const demoService = new DemoService();
const demoController = new DemoController(demoService);

/**
 * @openapi
 * /demo/profiles:
 *   get:
 *     summary: Get available demo profiles
 *     description: Returns all available demo profiles for AI interviewer demonstration
 *     tags:
 *       - Demo
 *     responses:
 *       200:
 *         description: Demo profiles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IDemoProfilesApiResponse'
 */
router.get('/profiles', demoController.getDemoProfiles);

/**
 * @openapi
 * /demo/profiles/{profileId}:
 *   get:
 *     summary: Get specific demo profile
 *     description: Returns detailed information for a specific demo profile
 *     tags:
 *       - Demo
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *         description: The demo profile ID
 *     responses:
 *       200:
 *         description: Demo profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IDemoProfileApiResponse'
 *       404:
 *         description: Profile not found
 */
router.get('/profiles/:profileId', demoController.getDemoProfile);

/**
 * @openapi
 * /demo/assessment/start:
 *   post:
 *     summary: Start demo assessment
 *     description: Initializes a new demo assessment session
 *     tags:
 *       - Demo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IDemoAssessmentStartRequest'
 *     responses:
 *       200:
 *         description: Demo assessment started successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IDemoAssessmentStartApiResponse'
 *       400:
 *         description: Invalid request data
 */
router.post(
  '/assessment/start',
  [validateRequest(demoAssessmentStartValidator)],
  demoController.startDemoAssessment
);

/**
 * @openapi
 * /demo/assessment/{sessionId}/questions:
 *   get:
 *     summary: Get assessment questions
 *     description: Returns questions for the demo assessment session
 *     tags:
 *       - Demo
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The demo assessment session ID
 *     responses:
 *       200:
 *         description: Assessment questions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IDemoAssessmentQuestionsApiResponse'
 *       404:
 *         description: Session not found
 */
router.get(
  '/assessment/:sessionId/questions',
  demoController.getAssessmentQuestions
);

/**
 * @openapi
 * /demo/assessment/{sessionId}/submit-answer:
 *   post:
 *     summary: Submit answer for assessment question
 *     description: Submits an answer for a specific assessment question
 *     tags:
 *       - Demo
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The demo assessment session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IDemoAnswerSubmitRequest'
 *     responses:
 *       200:
 *         description: Answer submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IDemoAnswerSubmitApiResponse'
 *       400:
 *         description: Invalid answer data
 */
router.post(
  '/assessment/:sessionId/submit-answer',
  [validateRequest(demoAnswerSubmitValidator)],
  demoController.submitAnswer
);

/**
 * @openapi
 * /demo/assessment/{sessionId}/complete:
 *   post:
 *     summary: Complete demo assessment
 *     description: Completes the demo assessment and generates results
 *     tags:
 *       - Demo
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The demo assessment session ID
 *     responses:
 *       200:
 *         description: Assessment completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IDemoAssessmentCompleteApiResponse'
 *       404:
 *         description: Session not found
 */
router.post(
  '/assessment/:sessionId/complete',
  demoController.completeAssessment
);

/**
 * @openapi
 * /demo/assessment/{sessionId}/results:
 *   get:
 *     summary: Get demo assessment results
 *     description: Returns comprehensive results for the completed demo assessment
 *     tags:
 *       - Demo
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The demo assessment session ID
 *     responses:
 *       200:
 *         description: Assessment results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IDemoAssessmentResultsApiResponse'
 *       404:
 *         description: Session not found
 */
router.get(
  '/assessment/:sessionId/results',
  demoController.getAssessmentResults
);

/**
 * @openapi
 * /demo/video/analyze:
 *   post:
 *     summary: Analyze demo video
 *     description: Analyzes uploaded video for demo assessment
 *     tags:
 *       - Demo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IDemoVideoAnalysisRequest'
 *     responses:
 *       200:
 *         description: Video analysis completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IDemoVideoAnalysisApiResponse'
 *       400:
 *         description: Invalid video data
 */
router.post(
  '/video/analyze',
  [validateRequest(demoVideoAnalysisValidator)],
  demoController.analyzeVideo
);

/**
 * @openapi
 * /demo/presigned-url:
 *   get:
 *     summary: Get presigned URL for demo video upload
 *     description: Gets a presigned URL for uploading demo assessment videos
 *     tags:
 *       - Demo
 *     parameters:
 *       - in: query
 *         name: fileName
 *         required: true
 *         schema:
 *           type: string
 *         description: The video file name
 *     responses:
 *       200:
 *         description: Presigned URL retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IDemoPresignedUrlApiResponse'
 *       400:
 *         description: File name is required
 */
router.get('/presigned-url', demoController.getPresignedUrl);

export default router;
