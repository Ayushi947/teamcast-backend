import { Router } from 'express';
import { CandidateProfileController } from '@/controllers/candidate/profile.controller';
import { CandidateProfileService } from '@/services/candidate/profile.service';
import { StorageFactory } from '@/services/helpers/storage/storage.factory';
import { requireAuth, requireActiveUser } from '@/middleware';

const router = Router();

// Initialize services and controller
const storageService = StorageFactory.getInstance().getProvider();
const candidateProfileService = new CandidateProfileService(storageService);
const candidateProfileController = new CandidateProfileController(
  candidateProfileService
);

// Basic auth middleware - any authenticated user can access
const authMiddleware = [requireAuth, requireActiveUser];

/**
 * @openapi
 * /candidate/profile/{candidateId}:
 *   get:
 *     summary: Get candidate profile by ID
 *     description: Retrieves the full candidate profile by ID
 *     tags:
 *       - Candidate Profile
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: candidateId
 *         required: true
 *         schema:
 *           type: string
 *         description: The candidate ID
 *     responses:
 *       200:
 *         description: Candidate profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateProfileGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Candidate profile not found
 */
router.get(
  '/:candidateId',
  authMiddleware,
  candidateProfileController.getProfileById
);

export default router;
