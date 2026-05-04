import { Router } from 'express';
import { LiveKitHttpPollingController } from '@/controllers/livekit/http.polling.controller';
import { OnboardingAssessmentFactory } from '@/services/helpers/ai.onboarding.assessment/onboarding.assessment.factory';
import { StorageFactory } from '@/services/helpers/storage/storage.factory';

const router = Router();

// Initialize providers for AI question generation
const onboardingAssessmentProvider =
  OnboardingAssessmentFactory.getInstance().getProvider();
const storageProvider = StorageFactory.getInstance().getProvider();

// Initialize controller with required dependencies
const controller = new LiveKitHttpPollingController(
  onboardingAssessmentProvider,
  storageProvider
);

/**
 * HTTP Polling Routes for LiveKit Agent Communication
 *
 * Simple, robust alternative to Redis pub/sub
 */

// Agent polls for next question
router.get(
  '/assessment/:assessmentId/next-question',
  controller.getNextQuestion
);

// Agent submits answer
router.post('/assessment/:assessmentId/answer', controller.submitAnswer);

export default router;
