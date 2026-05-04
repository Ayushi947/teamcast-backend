import { PrismaClient } from '@prisma/client';
import { singleton } from '@/shared/decorators/singleton';
import {
  IPartnerUserProfile,
  IPartnerUserProfileBasicUpdate,
  IPartnerUserProfilePasswordChange,
  IPartnerUserProfilePhotoUrl,
  IPartnerUserSettings,
  IPartnerUserSettingsUpdate,
  toPartnerUserProfileDomain,
  toPartnerUserSettingsDomain,
} from '@/shared/models/domain/partner/user.profile.domain';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';
import { IStorageProvider } from '../helpers/storage/storage.interface';
import { CommunicationChannelEnum } from '@/shared/models/common/enums';
import {
  getBucketFolderPathToPartnerUserPhoto,
  getBucketFolderPathToPartnerUserProfilePhoto,
} from '@/utils/presigned.urls';
import { comparePassword, hashPassword } from '@/utils/password';

@singleton
export class PartnerUserProfileService {
  private readonly prisma: PrismaClient;

  constructor(private readonly storageService: IStorageProvider) {
    this.prisma = new PrismaClient();
  }

  /**
   * Get a partner user's profile
   */
  async getProfile(
    partnerUserId: string,
    partnerId: string
  ): Promise<IPartnerUserProfile> {
    try {
      // Find the partner user by ID
      const partnerUser = await this.prisma.partner_user.findUnique({
        where: {
          id: partnerUserId,
        },
        include: {
          user: true,
        },
      });

      if (!partnerUser) {
        throw new AppError('Partner user not found', 404, ErrorCode.NOT_FOUND);
      }

      // Check if the partner user belongs to the specified partner
      if (partnerUser.partnerId !== partnerId) {
        throw new AppError(
          'Partner user does not belong to this partner',
          403,
          ErrorCode.FORBIDDEN
        );
      }

      // Generate a presigned URL for the profile picture if it exists
      if (
        partnerUser.user.image &&
        !partnerUser.user.image.startsWith('http')
      ) {
        const presignedUrl = await this.storageService.generatePreSignedUrl(
          partnerUser.user.image,
          'read'
        );
        partnerUser.user.image = presignedUrl; // Replace the storage path with the presigned URL
      }

      // Convert to domain model
      return toPartnerUserProfileDomain(partnerUser.user, partnerUser);
    } catch (error) {
      logger.error({
        message: 'Failed to get user profile',
        context: 'PartnerUserProfileService.getProfile',
        error: error instanceof Error ? error.message : 'Unknown error',
        partnerUserId,
        partnerId,
      });
      throw error;
    }
  }

  /**
   * Update a partner user's basic profile information
   */
  async updateBasicProfile(
    partnerUserId: string,
    partnerId: string,
    profileData: IPartnerUserProfileBasicUpdate
  ): Promise<IPartnerUserProfile> {
    try {
      // Find the partner user by ID
      const partnerUser = await this.prisma.partner_user.findUnique({
        where: {
          id: partnerUserId,
        },
        include: {
          user: true,
        },
      });

      if (!partnerUser) {
        throw new AppError('Partner user not found', 404, ErrorCode.NOT_FOUND);
      }

      // Check if the partner user belongs to the specified partner
      if (partnerUser.partnerId !== partnerId) {
        throw new AppError(
          'Partner user does not belong to this partner',
          403,
          ErrorCode.FORBIDDEN
        );
      }

      // Update the user
      const updatedUser = await this.prisma.user.update({
        where: { id: partnerUser.userId },
        data: {
          name: profileData.name,
          jobTitle: profileData.jobTitle,
        },
      });

      // Convert to domain model
      return toPartnerUserProfileDomain(updatedUser, partnerUser);
    } catch (error) {
      logger.error({
        message: 'Failed to update user profile',
        context: 'PartnerUserProfileService.updateBasicProfile',
        error: error instanceof Error ? error.message : 'Unknown error',
        partnerUserId,
        partnerId,
        profileData,
      });
      throw error;
    }
  }

  /**
   * Change a partner user's password
   */
  async changePassword(
    partnerUserId: string,
    partnerId: string,
    passwordData: IPartnerUserProfilePasswordChange
  ): Promise<void> {
    try {
      // Find the partner user by ID
      const partnerUser = await this.prisma.partner_user.findUnique({
        where: {
          id: partnerUserId,
        },
        include: {
          user: true,
        },
      });

      if (!partnerUser) {
        throw new AppError('Partner user not found', 404, ErrorCode.NOT_FOUND);
      }

      // Check if the partner user belongs to the specified partner
      if (partnerUser.partnerId !== partnerId) {
        throw new AppError(
          'Partner user does not belong to this partner',
          403,
          ErrorCode.FORBIDDEN
        );
      }

      // Check if the current password is correct
      const isCurrentPasswordValid = await comparePassword(
        passwordData.currentPassword,
        partnerUser.user?.password || ''
      );

      if (!isCurrentPasswordValid) {
        throw new AppError(
          'Current password is incorrect',
          400,
          ErrorCode.PASSWORD_CHANGE_FAILED
        );
      }

      try {
        await this.prisma.user.update({
          where: { id: partnerUser.userId },
          data: { password: await hashPassword(passwordData.newPassword) },
        });
      } catch (error) {
        logger.error('Failed to change password', {
          error,
          partnerUserId,
          partnerId,
          context: 'PartnerUserProfileService.changePassword',
        });
        throw new AppError(
          'Failed to change password. Please try again.',
          500,
          ErrorCode.PASSWORD_CHANGE_FAILED
        );
      }
    } catch (error) {
      logger.error({
        message: 'Failed to change password',
        context: 'PartnerUserProfileService.changePassword',
        error: error instanceof Error ? error.message : 'Unknown error',
        partnerUserId,
        partnerId,
      });
      throw error;
    }
  }

  /**
   * Get a pre-signed URL for uploading profile photo
   */
  async getProfilePhotoUploadUrl(
    partnerUserId: string,
    partnerId: string
  ): Promise<IPartnerUserProfilePhotoUrl> {
    try {
      // Find the partner user by ID
      const partnerUser = await this.prisma.partner_user.findUnique({
        where: {
          id: partnerUserId,
        },
        include: {
          user: true,
        },
      });

      if (!partnerUser) {
        throw new AppError('Partner user not found', 404, ErrorCode.NOT_FOUND);
      }

      // Check if the partner user belongs to the specified partner
      if (partnerUser.partnerId !== partnerId) {
        throw new AppError(
          'Partner user does not belong to this partner',
          403,
          ErrorCode.FORBIDDEN
        );
      }

      // Generate a unique filename for the upload
      const fileName = `${partnerUserId}-${Date.now()}.jpg`;
      const { folderPath } = getBucketFolderPathToPartnerUserPhoto(
        partnerId,
        partnerUserId
      );

      // Get the upload URL
      const presignedUrl = await this.storageService.generatePreSignedUrl(
        folderPath,
        'write'
      );

      return {
        fileName,
        presignedUrl,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to get profile photo upload URL',
        context: 'PartnerUserProfileService.getProfilePhotoUploadUrl',
        error: error instanceof Error ? error.message : 'Unknown error',
        partnerUserId,
        partnerId,
      });
      throw error;
    }
  }

  /**
   * Update profile photo with direct file upload
   */
  async updateProfilePhoto(
    partnerUserId: string,
    partnerId: string,
    file: Buffer
  ): Promise<IPartnerUserProfilePhotoUrl> {
    try {
      // Find the partner user by ID
      const partnerUser = await this.prisma.partner_user.findUnique({
        where: {
          id: partnerUserId,
        },
        include: {
          user: true,
        },
      });

      if (!partnerUser) {
        throw new AppError('Partner user not found', 404, ErrorCode.NOT_FOUND);
      }

      // Check if the partner user belongs to the specified partner
      if (partnerUser.partnerId !== partnerId) {
        throw new AppError(
          'Partner user does not belong to this partner',
          403,
          ErrorCode.FORBIDDEN
        );
      }

      // Generate a unique filename for the upload
      const uniqueFileName = `${partnerUserId}-${Date.now()}.jpg`;
      const { folderPath } =
        getBucketFolderPathToPartnerUserProfilePhoto(partnerUserId);
      const filePath = `${folderPath}/${uniqueFileName}`;

      // Upload file directly to storage
      const uploadedUrl = await this.storageService.uploadFile(file, filePath);

      // Update the user's profile photo
      await this.prisma.user.update({
        where: { id: partnerUser.userId },
        data: { image: uploadedUrl },
      });

      // Generate a read URL for the uploaded photo
      const presignedUrl = await this.storageService.generatePreSignedUrl(
        uploadedUrl,
        'read'
      );

      return {
        fileName: uniqueFileName,
        presignedUrl,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to update profile photo',
        context: 'PartnerUserProfileService.updateProfilePhoto',
        error: error instanceof Error ? error.message : 'Unknown error',
        partnerUserId,
        partnerId,
      });
      throw error;
    }
  }

  /**
   * Get the presigned url for the profile photo
   */
  async getProfilePhotoPresignedUrl(
    partnerUserId: string,
    partnerId: string
  ): Promise<IPartnerUserProfilePhotoUrl> {
    try {
      // Find the partner user by ID
      const partnerUser = await this.prisma.partner_user.findUnique({
        where: {
          id: partnerUserId,
        },
        include: {
          user: true,
        },
      });

      if (!partnerUser) {
        throw new AppError('Partner user not found', 404, ErrorCode.NOT_FOUND);
      }

      if (partnerUser.partnerId !== partnerId) {
        throw new AppError(
          'Partner user does not belong to this partner',
          403,
          ErrorCode.FORBIDDEN
        );
      }

      if (!partnerUser.user.image) {
        throw new AppError(
          'Partner user does not have a profile photo',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      const presignedUrl = await this.storageService.generatePreSignedUrl(
        partnerUser.user.image,
        'read'
      );

      return {
        fileName: partnerUser.user.image,
        presignedUrl,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to get profile photo presigned URL',
        context: 'PartnerUserProfileService.getProfilePhotoPresignedUrl',
        error: error instanceof Error ? error.message : 'Unknown error',
        partnerUserId,
        partnerId,
      });
      throw error;
    }
  }

  /**
   * Get partner user settings
   */
  async getSettings(
    partnerUserId: string,
    partnerId: string
  ): Promise<IPartnerUserSettings> {
    try {
      // Find the partner user by ID
      const partnerUser = await this.prisma.partner_user.findUnique({
        where: {
          id: partnerUserId,
        },
        include: {
          settings: true,
        },
      });

      if (!partnerUser) {
        throw new AppError('Partner user not found', 404, ErrorCode.NOT_FOUND);
      }

      // Check if the partner user belongs to the specified partner
      if (partnerUser.partnerId !== partnerId) {
        throw new AppError(
          'Partner user does not belong to this partner',
          403,
          ErrorCode.FORBIDDEN
        );
      }

      // If settings don't exist, create them from global settings
      if (!partnerUser.settings) {
        const newSettings =
          await this.getPartnerUserDefaultSettings(partnerUserId);
        await this.prisma.partner_user_settings.create({
          data: {
            ...newSettings,
          },
        });
      }

      // Convert to domain model
      return toPartnerUserSettingsDomain(partnerUser.settings);
    } catch (error) {
      logger.error({
        message: 'Failed to get user settings',
        context: 'PartnerUserProfileService.getSettings',
        error: error instanceof Error ? error.message : 'Unknown error',
        partnerUserId,
        partnerId,
      });
      throw error;
    }
  }

  /**
   * Update partner user settings
   */
  async updateSettings(
    partnerUserId: string,
    partnerId: string,
    settingsData: IPartnerUserSettingsUpdate
  ): Promise<IPartnerUserSettings> {
    try {
      // Find the partner user by ID
      const partnerUser = await this.prisma.partner_user.findUnique({
        where: {
          id: partnerUserId,
        },
        include: {
          settings: true,
        },
      });

      if (!partnerUser) {
        throw new AppError('Partner user not found', 404, ErrorCode.NOT_FOUND);
      }

      // Check if the partner user belongs to the specified partner
      if (partnerUser.partnerId !== partnerId) {
        throw new AppError(
          'Partner user does not belong to this partner',
          403,
          ErrorCode.FORBIDDEN
        );
      }

      // If settings don't exist, create them from global settings
      if (!partnerUser.settings) {
        const newSettings =
          await this.getPartnerUserDefaultSettings(partnerUserId);
        await this.prisma.partner_user_settings.create({
          data: {
            ...newSettings,
          },
        });
      }

      // Convert preferredCommunicationChannel to enum if provided
      const updateData = {
        ...settingsData,
        preferredCommunicationChannel:
          settingsData.preferredCommunicationChannel
            ? (settingsData.preferredCommunicationChannel as any)
            : undefined,
      };

      // Update the settings
      const updatedSettings = await this.prisma.partner_user_settings.update({
        where: { partnerUserId },
        data: updateData,
      });

      // Convert to domain model
      return toPartnerUserSettingsDomain(updatedSettings);
    } catch (error) {
      logger.error({
        message: 'Failed to update user settings',
        context: 'PartnerUserProfileService.updateSettings',
        error: error instanceof Error ? error.message : 'Unknown error',
        partnerUserId,
        partnerId,
        settingsData,
      });
      throw error;
    }
  }

  /**
   * Create settings from global settings
   * This is a helper method that can be used when creating a new partner user
   * or when settings don't exist
   */
  async getPartnerUserDefaultSettings(
    partnerUserId: string
  ): Promise<IPartnerUserSettings> {
    try {
      // Get the global settings
      const globalSettings = await this.prisma.global_settings.findFirst({
        where: { isSingleton: true },
      });

      if (!globalSettings) {
        throw new AppError(
          'Global settings not found',
          500,
          ErrorCode.INTERNAL_SERVER_ERROR
        );
      }

      // Create new settings with global defaults
      return {
        partnerUserId,
        globalSettingsId: globalSettings.id,
        notificationsEnabled: globalSettings.defaultNotificationsEnabled,
        emailNotifications: globalSettings.defaultEmailNotifications,
        pushNotifications: globalSettings.defaultPushNotifications,
        darkMode: globalSettings.defaultDarkMode,
        language: globalSettings.defaultLanguage,
        timezone: globalSettings.defaultTimezone,
        preferredCommunicationChannel:
          globalSettings.defaultCommunicationChannel as CommunicationChannelEnum,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to create settings from global',
        context: 'PartnerUserProfileService.getPartnerUserDefaultSettings',
        error: error instanceof Error ? error.message : 'Unknown error',
        partnerUserId,
      });
      throw error;
    }
  }
}
