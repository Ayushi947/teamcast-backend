import { Router } from 'express';
import { ClientCandidatesController } from '@/controllers/client/candidates.controller';
import { OnboardingAssessmentService } from '@/services/candidate/onboarding.assessment.service';
import { JobAiAssessmentService } from '@/services/candidate/job.ai.assessment.service';
import { OnboardingAssessmentFactory } from '@/services/helpers/ai.onboarding.assessment/onboarding.assessment.factory';
import { JobAiAssessmentFactory } from '@/services/helpers/job.ai.assessment/job.ai.assessment.factory';
import { StorageFactory } from '@/services/helpers/storage/storage.factory';
import {
  requireAuth,
  requireActiveUser,
  requireUserType,
  validateRequest,
  requireRole,
} from '@/middleware';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';
import {
  clientCandidateOnboardingAssessmentVideoChunksGetValidator,
  clientCandidateOnboardingAssessmentChunkPlaybackUrlGetValidator,
  clientCandidateJobAiAssessmentVideoChunksGetValidator,
  clientCandidateJobAiAssessmentChunkPlaybackUrlGetValidator,
} from '@/shared/validators/client/candidates.validator';

const router = Router();

// Initialize services and controller
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
const clientCandidatesController = new ClientCandidatesController(
  onboardingAssessmentService,
  jobAiAssessmentService
);

// Client auth middleware - applies to all candidate routes
const clientAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.CLIENT]),
];

// Role-based middleware for different operations
const roleBasedMiddleware = [
  ...clientAuthMiddleware,
  requireRole([UserRoleEnum.ADMIN, UserRoleEnum.HR, UserRoleEnum.RECRUITER]),
];
/**
 * @openapi
 * /client/candidates/onboarding-assessment/{assessmentId}/video-chunks:
 *   get:
 *     summary: Get video chunks for an onboarding assessment (Client/HR)
 *     description: Retrieves all relevant video chunks for the assessment, with optional filtering by question
 *     tags:
 *       - Client Candidates
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
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     chunks:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           chunkIndex:
 *                             type: number
 *                           questionId:
 *                             type: string
 *                             nullable: true
 *                           attemptNumber:
 *                             type: number
 *                           status:
 *                             type: string
 *                           playbackUrl:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Assessment not found
 */
router.get(
  '/onboarding-assessment/:assessmentId/video-chunks',
  [
    ...roleBasedMiddleware,
    validateRequest(clientCandidateOnboardingAssessmentVideoChunksGetValidator),
  ],
  clientCandidatesController.getOnboardingVideoChunks
);

/**
 * @openapi
 * /client/candidates/onboarding-assessment/{assessmentId}/video-chunks/{chunkId}/playback-url:
 *   get:
 *     summary: Get playback URL for a specific chunk (Client/HR)
 *     description: Generates a signed URL for playing back a specific video chunk
 *     tags:
 *       - Client Candidates
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
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     playbackUrl:
 *                       type: string
 *                       description: Signed URL for playback
 *                     expiresIn:
 *                       type: number
 *                       description: URL expiration time in seconds
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Chunk not found
 */
router.get(
  '/onboarding-assessment/:assessmentId/video-chunks/:chunkId/playback-url',
  [
    ...roleBasedMiddleware,
    validateRequest(
      clientCandidateOnboardingAssessmentChunkPlaybackUrlGetValidator
    ),
  ],
  clientCandidatesController.getOnboardingChunkPlaybackUrl
);

/**
 * @openapi
 * /client/candidates/job-ai-assessment/{assessmentId}/video-chunks:
 *   get:
 *     summary: Get video chunks for a job AI assessment (Client/HR)
 *     description: Retrieves all relevant video chunks for the job AI assessment, with optional filtering by question or section
 *     tags:
 *       - Client Candidates
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job AI Assessment ID
 *       - in: query
 *         name: questionId
 *         schema:
 *           type: string
 *         description: Optional filter by question ID
 *       - in: query
 *         name: sectionId
 *         schema:
 *           type: string
 *         description: Optional filter by section ID
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
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     chunks:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           chunkIndex:
 *                             type: number
 *                           questionId:
 *                             type: string
 *                             nullable: true
 *                           sectionId:
 *                             type: string
 *                             nullable: true
 *                           attemptNumber:
 *                             type: number
 *                           status:
 *                             type: string
 *                           playbackUrl:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Assessment not found
 */
router.get(
  '/job-ai-assessment/:assessmentId/video-chunks',
  [
    ...roleBasedMiddleware,
    validateRequest(clientCandidateJobAiAssessmentVideoChunksGetValidator),
  ],
  clientCandidatesController.getJobAiAssessmentVideoChunks
);

/**
 * @openapi
 * /client/candidates/job-ai-assessment/{assessmentId}/video-chunks/{chunkId}/playback-url:
 *   get:
 *     summary: Get playback URL for a specific job AI assessment chunk (Client/HR)
 *     description: Generates a signed URL for playing back a specific video chunk from a job AI assessment
 *     tags:
 *       - Client Candidates
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job AI Assessment ID
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
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     playbackUrl:
 *                       type: string
 *                       description: Signed URL for playback
 *                     expiresIn:
 *                       type: number
 *                       description: URL expiration time in seconds
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Chunk not found
 */
router.get(
  '/job-ai-assessment/:assessmentId/video-chunks/:chunkId/playback-url',
  [
    ...roleBasedMiddleware,
    validateRequest(clientCandidateJobAiAssessmentChunkPlaybackUrlGetValidator),
  ],
  clientCandidatesController.getJobAiAssessmentChunkPlaybackUrl
);

export default router;
