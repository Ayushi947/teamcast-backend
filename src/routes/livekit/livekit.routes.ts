import express from 'express';
import { LiveKitController } from '@/controllers/livekit/livekit.controller';
import { LiveKitHttpPollingController } from '@/controllers/livekit/http.polling.controller';
import { LiveKitService } from '@/services/livekit/livekit.service';
import { OnboardingAssessmentService } from '@/services/candidate/onboarding.assessment.service';
import { JobAiAssessmentService } from '@/services/candidate/job.ai.assessment.service';
import { RedisLiveKitCommunicationService } from '@/services/livekit/redis.communication.service';
import { OnboardingAssessmentFactory } from '@/services/helpers/ai.onboarding.assessment/onboarding.assessment.factory';
import { JobAiAssessmentFactory } from '@/services/helpers/job.ai.assessment/job.ai.assessment.factory';
import { StorageFactory } from '@/services/helpers/storage/storage.factory';
import { OnboardingAssessmentVideoAnalysisProcessor } from '@/services/queue/processors/onboarding.assessment.video.analysis.processor';
import { JobAiAssessmentVideoAnalysisProcessor } from '@/services/queue/processors/job.ai.assessment.video.analysis.processor';
import {
  liveKitRoomValidator,
  liveKitTokenValidator,
  liveKitRoomStatusValidator,
} from '@/shared/validators/livekit/livekit.validators';
import {
  validateRequest,
  requireAuth,
  requireActiveUser,
  requireCandidateAccess,
} from '@/middleware';
import egressRoutes from './livekit.egress.routes';
import webhookRoutes from './livekit.webhook.routes';

const router = express.Router();

// Initialize services and processors
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

const onboardingVideoAnalysisProcessor =
  new OnboardingAssessmentVideoAnalysisProcessor(
    onboardingAssessmentService,
    onboardingAssessmentProvider
  );
const jobAiVideoAnalysisProcessor = new JobAiAssessmentVideoAnalysisProcessor(
  jobAiAssessmentService,
  jobAiAssessmentProvider
);

// Services
const liveKitService = new LiveKitService(
  onboardingVideoAnalysisProcessor,
  jobAiVideoAnalysisProcessor
);
const redisLiveKitService = new RedisLiveKitCommunicationService();

// Controllers
const liveKitController = new LiveKitController(
  liveKitService,
  onboardingAssessmentService,
  redisLiveKitService
);

// HTTP Polling Controller (robust alternative to Redis pub/sub)
// Requires same providers as OnboardingAssessmentService for AI question generation
const httpPollingController = new LiveKitHttpPollingController(
  onboardingAssessmentProvider,
  storageProvider
);

/**
 * @openapi
 * /livekit/room:
 *   post:
 *     summary: Create LiveKit room for assessment
 *     description: Creates a LiveKit room and generates access token for candidate
 *     tags:
 *       - LiveKit
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ILiveKitRoomRequest'
 *     responses:
 *       200:
 *         description: LiveKit room created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ILiveKitRoomApiResponse'
 */
router.post(
  '/room',
  requireAuth,
  requireActiveUser,
  requireCandidateAccess,
  validateRequest(liveKitRoomValidator),
  liveKitController.createRoom
);

/**
 * @openapi
 * /livekit/token:
 *   post:
 *     summary: Generate LiveKit access token
 *     description: Generates a new access token for an existing room
 *     tags:
 *       - LiveKit
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ILiveKitTokenRequest'
 *     responses:
 *       200:
 *         description: Access token generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ILiveKitTokenApiResponse'
 */
router.post(
  '/token',
  requireAuth,
  requireActiveUser,
  requireCandidateAccess,
  validateRequest(liveKitTokenValidator),
  liveKitController.generateToken
);

/**
 * @openapi
 * /livekit/room/{roomName}/status:
 *   get:
 *     summary: Get LiveKit room status
 *     description: Retrieves status information for a LiveKit room
 *     tags:
 *       - LiveKit
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the LiveKit room
 *     responses:
 *       200:
 *         description: Room status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ILiveKitRoomStatusApiResponse'
 */
router.get(
  '/room/:roomName/status',
  requireAuth,
  requireActiveUser,
  requireCandidateAccess,
  validateRequest(liveKitRoomStatusValidator),
  liveKitController.getRoomStatus
);

/**
 * Start Redis-based assessment (backend-driven questions)
 */
router.post(
  '/assessment/start',
  requireAuth,
  requireActiveUser,
  requireCandidateAccess,
  liveKitController.startRedisAssessment
);

/**
 * Store transcript chunk (called by LiveKit agent service)
 */
router.post('/transcript', liveKitController.storeTranscript);

/**
 * Get recent transcript chunks for section tracking
 */
router.get(
  '/assessment/:assessmentId/:assessmentType/transcripts/recent',
  liveKitController.getRecentTranscripts
);

/**
 * Update section progress for interview resume capability
 */
router.post('/section-progress', liveKitController.updateSectionProgress);

/**
 * Terminate assessment (called by LiveKit agent when violations detected)
 */
router.post('/assessment/terminate', liveKitController.terminateAssessment);

/**
 * Complete assessment (called by LiveKit agent when all questions answered)
 */
router.post('/assessment/complete', liveKitController.completeAssessment);

// Mount egress routes (/api/livekit/egress/*)
router.use('/egress', egressRoutes);

// Mount webhook routes (/api/livekit/webhook)
// This handles egress_ended, room_finished, etc.
router.use('/webhook', webhookRoutes);

/**
 * =================================================================
 * HTTP POLLING ROUTES - Robust Alternative to Redis Pub/Sub
 * =================================================================
 * Agent uses simple HTTP polling instead of Redis channels
 */

// Agent polls for next question
router.get(
  '/assessment/:assessmentId/next-question',
  httpPollingController.getNextQuestion
);

// Agent submits answer
router.post(
  '/assessment/:assessmentId/answer',
  httpPollingController.submitAnswer
);

export default router;
