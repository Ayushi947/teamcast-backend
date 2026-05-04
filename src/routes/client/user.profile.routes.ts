import { Router } from 'express';
import { ClientUserProfileController } from '@/controllers/client/user.profile.controller';
import { ClientUserProfileService } from '@/services/client/user.profile.service';
import {
  requireAuth,
  requireActiveUser,
  validateRequest,
  requireUserType,
  requireSameUserOrAdminForClient,
} from '@/middleware';
import {
  clientUserProfileBasicUpdateValidator,
  clientUserProfilePasswordChangeValidator,
  clientUserProfilePhotoUpdateValidator,
  clientUserSettingsUpdateValidator,
} from '@/shared/validators/client/user.profile.validator';
import { UserTypeEnum } from '@/shared/models/common/enums';
import { StorageFactory } from '@/services/helpers/storage/storage.factory';

const router = Router({ mergeParams: true });

// Initialize services and controller
const storageService = StorageFactory.getInstance().getProvider();
const clientUserProfileService = new ClientUserProfileService(storageService);
const clientUserProfileController = new ClientUserProfileController(
  clientUserProfileService
);

// Client auth middleware - applies to all profile routes
const clientAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.CLIENT]),
];

const sameUserOrAdminMiddleware = [
  ...clientAuthMiddleware,
  requireSameUserOrAdminForClient,
];

/**
 * @openapi
 * /client/user-profile/{clientUserId}:
 *   get:
 *     summary: Get client user profile
 *     description: Retrieves the profile information for the specified client user. The authenticated user must be either the same user or a client admin.
 *     tags:
 *       - Client User Profile
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IClientUserIDParams'
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientUserProfileGetApiResponse'
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
  clientUserProfileController.getProfile
);

/**
 * @openapi
 * /client/user-profile/{clientUserId}/basic:
 *   patch:
 *     summary: Update basic profile
 *     description: Updates basic profile information like name and job title. The authenticated user must be either the same user or a client admin.
 *     tags:
 *       - Client User Profile
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IClientUserIDParams'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientUserProfileBasicUpdate'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientUserProfileBasicUpdateApiResponse'
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
    validateRequest(clientUserProfileBasicUpdateValidator),
  ],
  clientUserProfileController.updateBasicProfile
);

/**
 * @openapi
 * /client/user-profile/{clientUserId}/password:
 *   patch:
 *     summary: Change password
 *     description: Changes the user's password with current and new password verification. The authenticated user must be either the same user or a client admin.
 *     tags:
 *       - Client User Profile
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IClientUserIDParams'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientUserProfilePasswordChange'
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientUserProfilePasswordChangeApiResponse'
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
    validateRequest(clientUserProfilePasswordChangeValidator),
  ],
  clientUserProfileController.changePassword
);

/**
 * @openapi
 * /client/user-profile/{clientUserId}/photo/upload-url:
 *   get:
 *     summary: Get profile photo upload URL
 *     description: Gets a pre-signed URL for uploading a profile photo to GCP storage.
 *       The authenticated user must be either the same user or a client admin.
 *       The presigned url have write permission.
 *     tags:
 *       - Client User Profile
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IClientUserIDParams'
 *     responses:
 *       200:
 *         description: Upload URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientUserProfilePhotoUrlApiResponse'
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get(
  '/photo/upload-url',
  [...sameUserOrAdminMiddleware],
  clientUserProfileController.getProfilePhotoUploadUrl
);

/**
 * @openapi
 * /client/user-profile/{clientUserId}/photo:
 *   patch:
 *     summary: Update profile photo
 *     description: Updates the profile photo reference after upload to GCP storage.
 *      The authenticated user must be either the same user or a client admin.
 *      The presigned url have read permission.
 *     tags:
 *       - Client User Profile
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IClientUserIDParams'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientUserProfilePhotoUpdate'
 *     responses:
 *       200:
 *         description: Profile photo updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientUserProfilePhotoUpdateApiResponse'
 *       400:
 *         description: Invalid file name
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.patch(
  '/photo',
  [
    ...sameUserOrAdminMiddleware,
    validateRequest(clientUserProfilePhotoUpdateValidator),
  ],
  clientUserProfileController.updateProfilePhoto
);

/**
 * @openapi
 * /client/user-profile/{clientUserId}/photo/presigned-url:
 *   get:
 *     summary: Get profile photo presigned URL
 *     description: Gets a presigned URL for the profile photo.
 *      The authenticated user must be either the same user or a client admin.
 *      The presigned url have read permission.
 *     tags:
 *       - Client User Profile
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IClientUserIDParams'
 *     responses:
 *       200:
 *         description: Presigned URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientUserProfilePhotoUrlApiResponse'
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
  clientUserProfileController.getProfilePhotoPresignedUrl
);

/**
 * @openapi
 * /client/user-profile/settings:
 *   get:
 *     summary: Get client user settings
 *     description: Retrieves the settings for the authenticated client user. The authenticated user must be either the same user or a client admin.
 *     tags:
 *       - Client User Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientUserSettingsGetApiResponse'
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
  clientUserProfileController.getSettings
);

/**
 * @openapi
 * /client/user-profile/{clientUserId}/settings:
 *   patch:
 *     summary: Update client user settings
 *     description: Updates the settings for the specified client user. The authenticated user must be either the same user or a client admin.
 *     tags:
 *       - Client User Profile
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IClientUserIDParams'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientUserSettingsUpdateApiRequest'
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientUserSettingsUpdateApiResponse'
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
    validateRequest(clientUserSettingsUpdateValidator),
  ],
  clientUserProfileController.updateSettings
);

export default router;
