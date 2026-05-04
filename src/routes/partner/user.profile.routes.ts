import { Router } from 'express';
import { PartnerUserProfileController } from '@/controllers/partner/user.profile.controller';
import { PartnerUserProfileService } from '@/services/partner/user.profile.service';
import {
  requireAuth,
  requireActiveUser,
  validateRequest,
  requireUserType,
  requireSameUserOrAdminForPartner,
} from '@/middleware';
import {
  partnerUserProfileBasicUpdateValidator,
  partnerUserProfilePasswordChangeValidator,
  partnerUserSettingsUpdateValidator,
} from '@/shared/validators/partner/user.profile.validator';
import { UserTypeEnum } from '@/shared/models/common/enums';
import { StorageFactory } from '@/services/helpers/storage/storage.factory';
import multer from 'multer';

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
const partnerUserProfileService = new PartnerUserProfileService(storageService);
const partnerUserProfileController = new PartnerUserProfileController(
  partnerUserProfileService
);

// Partner auth middleware - applies to all profile routes
const partnerAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.PARTNER]),
];

const sameUserOrAdminMiddleware = [
  ...partnerAuthMiddleware,
  requireSameUserOrAdminForPartner,
];

/**
 * @openapi
 * /partner/user-profile/{partnerUserId}:
 *   get:
 *     summary: Get partner user profile
 *     description: Retrieves the profile information for the specified partner user. The authenticated user must be either the same user or a partner admin.
 *     tags:
 *       - Partner User Profile
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: partnerUserId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The partner user ID
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerUserProfileGetApiResponse'
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: User profile not found
 */
router.get(
  '/',
  [...sameUserOrAdminMiddleware],
  partnerUserProfileController.getProfile
);

/**
 * @openapi
 * /partner/user-profile/{partnerUserId}/basic:
 *   patch:
 *     summary: Update basic profile
 *     description: Updates basic profile information like name and job title. The authenticated user must be either the same user or a partner admin.
 *     tags:
 *       - Partner User Profile
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: partnerUserId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The partner user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IPartnerUserProfileBasicUpdate'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerUserProfileBasicUpdateApiResponse'
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
    ...sameUserOrAdminMiddleware,
    validateRequest(partnerUserProfileBasicUpdateValidator),
  ],
  partnerUserProfileController.updateBasicProfile
);

/**
 * @openapi
 * /partner/user-profile/{partnerUserId}/password:
 *   patch:
 *     summary: Change password
 *     description: Changes the user's password with current and new password verification. The authenticated user must be either the same user or a partner admin.
 *     tags:
 *       - Partner User Profile
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: partnerUserId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The partner user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IPartnerUserProfilePasswordChange'
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerUserProfilePasswordChangeApiResponse'
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
    ...sameUserOrAdminMiddleware,
    validateRequest(partnerUserProfilePasswordChangeValidator),
  ],
  partnerUserProfileController.changePassword
);

/**
 * @openapi
 * /partner/user-profile/{partnerUserId}/photo/upload-url:
 *   get:
 *     summary: Get profile photo upload URL
 *     description: Gets a pre-signed URL for uploading a profile photo to GCP storage.
 *       The authenticated user must be either the same user or a partner admin.
 *       The presigned url have write permission.
 *     tags:
 *       - Partner User Profile
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: partnerUserId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The partner user ID
 *     responses:
 *       200:
 *         description: Upload URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerUserProfilePhotoUrlApiResponse'
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get(
  '/photo/upload-url',
  [...sameUserOrAdminMiddleware],
  partnerUserProfileController.getProfilePhotoUploadUrl
);

/**
 * @openapi
 * /partner/user-profile/{partnerUserId}/photo/upload:
 *   patch:
 *     summary: Update profile photo
 *     description: Updates the partner user's profile photo by uploading directly to storage
 *     tags:
 *       - Partner User Profile
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: partnerUserId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The partner user ID
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
 *               $ref: '#/components/schemas/IPartnerUserProfilePhotoUrlApiResponse'
 *       400:
 *         description: Invalid request data or file
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       413:
 *         description: File too large
 */
router.patch(
  '/photo/upload',
  [...sameUserOrAdminMiddleware, upload.single('file')],
  partnerUserProfileController.uploadProfilePhoto.bind(
    partnerUserProfileController
  )
);

/**
 * @openapi
 * /partner/user-profile/{partnerUserId}/photo/presigned-url:
 *   get:
 *     summary: Get profile photo presigned URL
 *     description: Gets a presigned URL for the profile photo.
 *      The authenticated user must be either the same user or a partner admin.
 *      The presigned url have read permission.
 *     tags:
 *       - Partner User Profile
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: partnerUserId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The partner user ID
 *     responses:
 *       200:
 *         description: Presigned URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerUserProfilePhotoUrlApiResponse'
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Profile photo not found
 */
router.get(
  '/photo/presigned-url',
  [...sameUserOrAdminMiddleware],
  partnerUserProfileController.getProfilePhotoPresignedUrl
);

/**
 * @openapi
 * /partner/user-profile/{partnerUserId}/settings:
 *   get:
 *     summary: Get partner user settings
 *     description: Retrieves the settings for the specified partner user. The authenticated user must be either the same user or a partner admin.
 *     tags:
 *       - Partner User Profile
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: partnerUserId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The partner user ID
 *     responses:
 *       200:
 *         description: User settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerUserSettingsGetApiResponse'
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: User settings not found
 */
router.get(
  '/settings',
  [...sameUserOrAdminMiddleware],
  partnerUserProfileController.getSettings
);

/**
 * @openapi
 * /partner/user-profile/{partnerUserId}/settings:
 *   patch:
 *     summary: Update partner user settings
 *     description: Updates the settings for the specified partner user. The authenticated user must be either the same user or a partner admin.
 *     tags:
 *       - Partner User Profile
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: partnerUserId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The partner user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IPartnerUserSettingsUpdate'
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerUserSettingsUpdateApiResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.patch(
  '/settings',
  [
    ...sameUserOrAdminMiddleware,
    validateRequest(partnerUserSettingsUpdateValidator),
  ],
  partnerUserProfileController.updateSettings
);

export default router;
