import { Router } from 'express';
import { CandidateProfileController } from '@/controllers/candidate/profile.controller';
import { CandidateProfileService } from '@/services/candidate/profile.service';
import { CandidateResumeService } from '@/services/candidate/resume.service';
import { OnboardingAssessmentService } from '@/services/candidate/onboarding.assessment.service';
import { CandidateResumeAssessmentService } from '@/services/candidate/resume.assessment.service';
import { StorageFactory } from '@/services/helpers/storage/storage.factory';
import { OnboardingAssessmentFactory } from '@/services/helpers/ai.onboarding.assessment/onboarding.assessment.factory';

const router = Router();

// Initialize services and controller
const storageService = StorageFactory.getInstance().getProvider();
const candidateProfileService = new CandidateProfileService(storageService);
const candidateResumeService = new CandidateResumeService(
  candidateProfileService,
  storageService
);
const onboardingAssessmentProvider =
  OnboardingAssessmentFactory.getInstance().getProvider();
const onboardingAssessmentService = new OnboardingAssessmentService(
  onboardingAssessmentProvider,
  storageService
);
const candidateResumeAssessmentService = new CandidateResumeAssessmentService();

// Set up service dependencies
candidateProfileService.setResumeService(candidateResumeService);
candidateProfileService.setOnboardingAssessmentService(
  onboardingAssessmentService
);
candidateProfileService.setResumeAssessmentService(
  candidateResumeAssessmentService
);

const candidateProfileController = new CandidateProfileController(
  candidateProfileService
);
candidateProfileController.setResumeService(candidateResumeService);
candidateProfileController.setOnboardingAssessmentService(
  onboardingAssessmentService
);
candidateProfileController.setResumeAssessmentService(
  candidateResumeAssessmentService
);

/**
 * @openapi
 * /candidate/profile/public/{candidateId}:
 *   get:
 *     summary: Get public candidate profile and resume by ID
 *     description: Publicly retrieves the candidate's profile and resume by candidateId. No authentication required.
 *     tags:
 *       - Candidate Profile
 *     parameters:
 *       - in: path
 *         name: candidateId
 *         required: true
 *         schema:
 *           type: string
 *         description: The candidate ID
 *     responses:
 *       200:
 *         description: Candidate profile and resume retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateProfileAndResumeApiResponse'
 *       404:
 *         description: Candidate not found
 */
router.get(
  '/:candidateId',
  candidateProfileController.getPublicProfileAndResume
);

export default router;
