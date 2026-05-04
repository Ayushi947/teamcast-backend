import { Router } from 'express';
import { CandidateProfileController } from '@/controllers/candidate/profile.controller';
import { CandidateProfileService } from '@/services/candidate/profile.service';
import { StorageFactory } from '@/services/helpers/storage/storage.factory';
import {
  requireAuth,
  requireActiveUser,
  validateRequest,
  requireCandidateAccess,
} from '@/middleware';
import {
  candidateProfileBasicUpdateValidator,
  candidateProfileByEmailIDValidator,
  candidateProfilePasswordChangeValidator,
} from '@/shared/validators/candidate/profile.validator';
import multer from 'multer';

/**
 * This router is used for both:
 * 2. /candidate/profile - Direct access to current candidate's profile
 */
const router = Router({ mergeParams: true });

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for profile photos
  },
});

// Initialize services and controller
const storageService = StorageFactory.getInstance().getProvider();
const candidateProfileService = new CandidateProfileService(storageService);
const candidateProfileController = new CandidateProfileController(
  candidateProfileService
);

// Candidate auth middleware - applies to all profile routes
const candidateAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireCandidateAccess,
];

/**
 * @openapi
 * /candidate/profile:
 *   get:
 *     summary: Get candidate profile
 *     description: Retrieves the profile information for the specified candidate. The authenticated user must be either the same candidate or an admin.
 *     tags:
 *       - Candidate Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Candidate profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateProfileGetApiResponse'
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Candidate profile not found
 */
router.get(
  '/',
  [...candidateAuthMiddleware],
  candidateProfileController.getProfile
);

/**
 * @openapi
 * /candidate/profile/email/{email}:
 *   get:
 *     summary: Get candidate profile by email ID
 *     description: Retrieves the profile information for the specified candidate by email ID.
 *     tags:
 *       - Candidate Profile
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: email
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *     responses:
 *       200:
 *         description: Candidate profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateProfileGetApiResponse'
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Candidate profile not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IErrorResponse'
 */
router.get(
  '/email/:email',
  [...candidateAuthMiddleware],
  validateRequest(candidateProfileByEmailIDValidator),
  candidateProfileController.getProfileByEmailID
);

/**
 * @openapi
 * /candidate/profile/basic:
 *   patch:
 *     summary: Update basic profile
 *     description: Updates basic profile information like name, job title, and job search status. The authenticated user must be either the same candidate or an admin.
 *     tags:
 *       - Candidate Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ICandidateProfileBasicUpdate'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateProfileBasicUpdateApiResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.patch(
  '/basic',
  [
    ...candidateAuthMiddleware,
    validateRequest(candidateProfileBasicUpdateValidator),
  ],
  candidateProfileController.updateBasicProfile
);

/**
 * @openapi
 * /candidate/profile/password:
 *   patch:
 *     summary: Change password
 *     description: Changes the candidate's password with current and new password verification. The authenticated user must be either the same candidate or an admin.
 *     tags:
 *       - Candidate Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ICandidateProfilePasswordChange'
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateProfilePasswordChangeApiResponse'
 *       400:
 *         description: Invalid current password or new password does not meet requirements
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.patch(
  '/password',
  [
    ...candidateAuthMiddleware,
    validateRequest(candidateProfilePasswordChangeValidator),
  ],
  candidateProfileController.changePassword
);

/**
 * @openapi
 * /candidate/profile/photo:
 *   patch:
 *     summary: Update profile photo
 *     description: Updates the candidate's profile photo by uploading directly to storage
 *     tags:
 *       - Candidate Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The profile photo file to upload
 *     responses:
 *       200:
 *         description: Profile photo updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateProfilePhotoUrlApiResponse'
 *       400:
 *         description: Invalid request data or file
 *       401:
 *         description: Unauthorized
 *       413:
 *         description: File too large
 */
router.patch(
  '/photo',
  [...candidateAuthMiddleware, upload.single('file')],
  candidateProfileController.uploadProfilePhoto.bind(candidateProfileController)
);

/**
 * @openapi
 * /candidate/profile/photo/presigned-url:
 *   get:
 *     summary: Get profile photo presigned URL
 *     description: Gets a presigned URL for the profile photo.
 *      The authenticated user must be either the same candidate or an admin.
 *      The presigned url have read permission.
 *     tags:
 *       - Candidate Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Presigned URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateProfilePhotoUrlApiResponse'
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Profile photo not found
 */
router.get(
  '/photo/presigned-url',
  [...candidateAuthMiddleware],
  candidateProfileController.getProfilePhotoPresignedUrl
);

/**
 * @openapi
 * /candidate/profile/photo:
 *   delete:
 *     summary: Soft delete profile photo
 *     description: Soft deletes the candidate's profile photo.
 *     tags:
 *       - Candidate Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile photo deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Candidate not found
 */
router.delete(
  '/photo',
  [...candidateAuthMiddleware],
  candidateProfileController.deleteProfilePhoto
);

export default router;
