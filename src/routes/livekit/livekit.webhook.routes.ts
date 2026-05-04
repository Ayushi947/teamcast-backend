import { Router } from 'express';
import { LiveKitWebhookController } from '@/controllers/livekit/livekit.webhook.controller';
import { LiveKitEgressService } from '@/services/livekit/livekit.egress.service';
import { OnboardingAssessmentVideoAnalysisProcessor } from '@/services/queue/processors/onboarding.assessment.video.analysis.processor';
import { JobAiAssessmentVideoAnalysisProcessor } from '@/services/queue/processors/job.ai.assessment.video.analysis.processor';
import { OnboardingAssessmentFactory } from '@/services/helpers/ai.onboarding.assessment/onboarding.assessment.factory';
import { JobAiAssessmentFactory } from '@/services/helpers/job.ai.assessment/job.ai.assessment.factory';
import { OnboardingAssessmentService } from '@/services/candidate/onboarding.assessment.service';
import { JobAiAssessmentService } from '@/services/candidate/job.ai.assessment.service';
import { StorageFactory } from '@/services/helpers/storage/storage.factory';

const router = Router();

// Initialize services and controller
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

const egressService = new LiveKitEgressService(
  onboardingVideoAnalysisProcessor,
  jobAiVideoAnalysisProcessor
);

const webhookController = new LiveKitWebhookController(egressService);

/**
 * @openapi
 * /livekit/webhook:
 *   post:
 *     summary: Handle LiveKit webhook events
 *     description: Receives and processes LiveKit webhook events including egress_ended, room_started, room_finished, etc.
 *     tags:
 *       - LiveKit Webhooks
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: LiveKit webhook event payload
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       401:
 *         description: Webhook verification failed
 */
router.post(
  '/',
  // Note: Raw body preservation is handled by global middleware in app.ts
  webhookController.handleWebhook
);

export default router;
