import { Router } from 'express';
import { LiveKitEgressController } from '@/controllers/livekit/livekit.egress.controller';
import { OnboardingAssessmentVideoAnalysisProcessor } from '@/services/queue/processors/onboarding.assessment.video.analysis.processor';
import { JobAiAssessmentVideoAnalysisProcessor } from '@/services/queue/processors/job.ai.assessment.video.analysis.processor';
import { OnboardingAssessmentFactory } from '@/services/helpers/ai.onboarding.assessment/onboarding.assessment.factory';
import { JobAiAssessmentFactory } from '@/services/helpers/job.ai.assessment/job.ai.assessment.factory';
import { OnboardingAssessmentService } from '@/services/candidate/onboarding.assessment.service';
import { JobAiAssessmentService } from '@/services/candidate/job.ai.assessment.service';
import { StorageFactory } from '@/services/helpers/storage/storage.factory';

const router = Router();

// Initialize services and processors
const onboardingAssessmentProvider =
  OnboardingAssessmentFactory.getInstance().getProvider();
const storageProvider = StorageFactory.getInstance().getProvider();
const onboardingAssessmentService = new OnboardingAssessmentService(
  onboardingAssessmentProvider,
  storageProvider
);
const onboardingVideoAnalysisProcessor =
  new OnboardingAssessmentVideoAnalysisProcessor(
    onboardingAssessmentService,
    onboardingAssessmentProvider
  );

const jobAiAssessmentProvider =
  JobAiAssessmentFactory.getInstance().getProvider();
const jobAiAssessmentService = new JobAiAssessmentService(
  jobAiAssessmentProvider,
  storageProvider
);
const jobAiVideoAnalysisProcessor = new JobAiAssessmentVideoAnalysisProcessor(
  jobAiAssessmentService,
  jobAiAssessmentProvider
);

const egressController = new LiveKitEgressController(
  onboardingVideoAnalysisProcessor,
  jobAiVideoAnalysisProcessor
);

/**
 * @swagger
 * /api/livekit/egress/start:
 *   post:
 *     summary: Start recording a LiveKit room
 *     tags: [LiveKit Egress]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roomName
 *               - assessmentId
 *               - assessmentType
 *             properties:
 *               roomName:
 *                 type: string
 *                 description: LiveKit room name
 *               assessmentId:
 *                 type: string
 *                 description: Assessment ID
 *               assessmentType:
 *                 type: string
 *                 enum: [ONBOARDING, JOB_AI]
 *                 description: Type of assessment
 *               audioOnly:
 *                 type: boolean
 *                 default: false
 *                 description: Record audio only
 *     responses:
 *       200:
 *         description: Recording started successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/start', egressController.startRecording);

/**
 * @swagger
 * /api/livekit/egress/stop:
 *   post:
 *     summary: Stop an active recording
 *     tags: [LiveKit Egress]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - egressId
 *             properties:
 *               egressId:
 *                 type: string
 *                 description: Egress ID to stop
 *     responses:
 *       200:
 *         description: Recording stopped successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/stop', egressController.stopRecording);

/**
 * @swagger
 * /api/livekit/egress/{egressId}:
 *   get:
 *     summary: Get egress status
 *     tags: [LiveKit Egress]
 *     parameters:
 *       - in: path
 *         name: egressId
 *         required: true
 *         schema:
 *           type: string
 *         description: Egress ID
 *     responses:
 *       200:
 *         description: Egress info retrieved
 *       404:
 *         description: Egress not found
 *       500:
 *         description: Server error
 */
router.get('/:egressId', egressController.getEgressStatus);

/**
 * @swagger
 * /api/livekit/egress/transcript:
 *   post:
 *     summary: Save transcript to GCP Storage
 *     tags: [LiveKit Egress]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assessmentId
 *               - roomName
 *               - transcript
 *             properties:
 *               assessmentId:
 *                 type: string
 *               roomName:
 *                 type: string
 *               transcript:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: number
 *                     speaker:
 *                       type: string
 *                     text:
 *                       type: string
 *     responses:
 *       200:
 *         description: Transcript saved successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/transcript', egressController.saveTranscript);

export default router;
