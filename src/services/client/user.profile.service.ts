import { PrismaClient } from '@prisma/client';
import { singleton } from '@/shared/decorators/singleton';
import {
  IClientUserProfile,
  IClientUserProfileBasicUpdate,
  IClientUserProfilePasswordChange,
  IClientUserProfilePhotoUpdate,
  IClientUserProfilePhotoUrl,
  IClientUserSettings,
  IClientUserSettingsUpdate,
  toClientUserProfileDomain,
  toClientUserSettingsDomain,
} from '@/shared/models/domain/client/user.profile.domain';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';
import { IStorageProvider } from '../helpers/storage/storage.interface';
import { CommunicationChannelEnum } from '@/shared/models/common/enums';
import { getBucketFolderPathToClientUserPhoto } from '@/utils/presigned.urls';
import { comparePassword, hashPassword } from '@/utils/password';

@singleton
export class ClientUserProfileService {
  private readonly prisma: PrismaClient;

  constructor(private readonly storageService: IStorageProvider) {
    this.prisma = new PrismaClient();
  }

  /**
   * Get a client user's profile
   */
  async getProfile(
    clientUserId: string,
    clientId: string
  ): Promise<IClientUserProfile> {
    try {
      // Find the client user by ID
      const clientUser = await this.prisma.client_user.findUnique({
        where: {
          id: clientUserId,
        },
        include: {
          user: true,
        },
      });

      if (!clientUser) {
        throw new AppError('Client user not found', 404, ErrorCode.NOT_FOUND);
      }

      // Check if the client user belongs to the specified client
      if (clientUser.clientId !== clientId) {
        throw new AppError(
          'Client user does not belong to this client',
          403,
          ErrorCode.FORBIDDEN
        );
      }

      // Generate a presigned URL for the profile picture if it exists
      if (clientUser.user.image && !clientUser.user.image.startsWith('http')) {
        const presignedUrl = await this.storageService.generatePreSignedUrl(
          clientUser.user.image,
          'read'
        );
        clientUser.user.image = presignedUrl; // Replace the storage path with the presigned URL
      }

      // Convert to domain model
      return toClientUserProfileDomain(clientUser.user, clientUser);
    } catch (error) {
      logger.error({
        message: 'Failed to get user profile',
        context: 'ClientUserProfileService.getProfile',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientUserId,
        clientId,
      });
      throw error;
    }
  }

  /**
   * Update a client user's basic profile information
   */
  async updateBasicProfile(
    clientUserId: string,
    clientId: string,
    profileData: IClientUserProfileBasicUpdate
  ): Promise<IClientUserProfile> {
    try {
      // Find the client user by ID
      const clientUser = await this.prisma.client_user.findUnique({
        where: {
          id: clientUserId,
        },
        include: {
          user: true,
        },
      });

      if (!clientUser) {
        throw new AppError('Client user not found', 404, ErrorCode.NOT_FOUND);
      }

      // Check if the client user belongs to the specified client
      if (clientUser.clientId !== clientId) {
        throw new AppError(
          'Client user does not belong to this client',
          403,
          ErrorCode.FORBIDDEN
        );
      }

      // Update the user
      const updatedUser = await this.prisma.user.update({
        where: { id: clientUser.userId },
        data: {
          name: profileData.name,
          jobTitle: profileData.jobTitle,
        },
      });

      // Convert to domain model
      return toClientUserProfileDomain(updatedUser, clientUser);
    } catch (error) {
      logger.error({
        message: 'Failed to update user profile',
        context: 'ClientUserProfileService.updateBasicProfile',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientUserId,
        clientId,
        profileData,
      });
      throw error;
    }
  }

  /**
   * Change a client user's password
   */
  async changePassword(
    clientUserId: string,
    clientId: string,
    passwordData: IClientUserProfilePasswordChange
  ): Promise<void> {
    try {
      // Find the client user by ID
      const clientUser = await this.prisma.client_user.findUnique({
        where: {
          id: clientUserId,
        },
        include: {
          user: true,
        },
      });

      if (!clientUser) {
        throw new AppError('Client user not found', 404, ErrorCode.NOT_FOUND);
      }

      // Check if the client user belongs to the specified client
      if (clientUser.clientId !== clientId) {
        throw new AppError(
          'Client user does not belong to this client',
          403,
          ErrorCode.FORBIDDEN
        );
      }

      // Check if the current password is correct
      const isCurrentPasswordValid = await comparePassword(
        passwordData.currentPassword,
        clientUser.user?.password || ''
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
          where: { id: clientUser.userId },
          data: { password: await hashPassword(passwordData.newPassword) },
        });
      } catch (error) {
        logger.error('Failed to change password', {
          error,
          clientUserId,
          clientId,
          context: 'ClientUserProfileService.changePassword',
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
        context: 'ClientUserProfileService.changePassword',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientUserId,
        clientId,
      });
      throw error;
    }
  }

  /**
   * Get a pre-signed URL for uploading profile photo
   */
  async getProfilePhotoUploadUrl(
    clientUserId: string,
    clientId: string
  ): Promise<IClientUserProfilePhotoUrl> {
    try {
      // Find the client user by ID
      const clientUser = await this.prisma.client_user.findUnique({
        where: {
          id: clientUserId,
        },
        include: {
          user: true,
        },
      });

      if (!clientUser) {
        throw new AppError('Client user not found', 404, ErrorCode.NOT_FOUND);
      }

      // Check if the client user belongs to the specified client
      if (clientUser.clientId !== clientId) {
        throw new AppError(
          'Client user does not belong to this client',
          403,
          ErrorCode.FORBIDDEN
        );
      }

      // Generate a unique filename for the upload
      const fileName = `${clientUserId}-${Date.now()}.jpg`;
      const { folderPath } = getBucketFolderPathToClientUserPhoto(
        clientId,
        clientUserId
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
        context: 'ClientUserProfileService.getProfilePhotoUploadUrl',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientUserId,
        clientId,
      });
      throw error;
    }
  }

  /**
   * Get a pre-signed URL for uploading profile photo
   */
  async updateProfilePhoto(
    clientUserId: string,
    clientId: string,
    profilePhoto: IClientUserProfilePhotoUpdate
  ): Promise<IClientUserProfilePhotoUrl> {
    try {
      // Find the client user by ID
      const clientUser = await this.prisma.client_user.findUnique({
        where: {
          id: clientUserId,
        },
        include: {
          user: true,
        },
      });

      if (!clientUser) {
        throw new AppError('Client user not found', 404, ErrorCode.NOT_FOUND);
      }

      // Check if the client user belongs to the specified client
      if (clientUser.clientId !== clientId) {
        throw new AppError(
          'Client user does not belong to this client',
          403,
          ErrorCode.FORBIDDEN
        );
      }

      const fileName = `${clientUserId}-${Date.now()}.jpg`;
      // Generate a unique filename for the upload
      const { folderPath } = getBucketFolderPathToClientUserPhoto(
        clientId,
        clientUserId
      );
      const filePath = `${folderPath}/${fileName}`;

      // Update the user's profile photo
      await this.prisma.user.update({
        where: { id: clientUser.userId },
        data: { image: filePath },
      });

      const presignedUrl = await this.storageService.generatePreSignedUrl(
        filePath,
        'read'
      );

      return {
        fileName: profilePhoto.fileName,
        presignedUrl: presignedUrl,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to get profile photo upload URL',
        context: 'ClientUserProfileService.getProfilePhotoUploadUrl',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientUserId,
        clientId,
      });
      throw error;
    }
  }

  /**
   * get the presigned url for the profile photo
   */
  async getProfilePhotoPresignedUrl(
    clientUserId: string,
    clientId: string
  ): Promise<IClientUserProfilePhotoUrl> {
    try {
      // Find the client user by ID
      const clientUser = await this.prisma.client_user.findUnique({
        where: {
          id: clientUserId,
        },
        include: {
          user: true,
        },
      });

      if (!clientUser) {
        throw new AppError('Client user not found', 404, ErrorCode.NOT_FOUND);
      }

      if (clientUser.clientId !== clientId) {
        throw new AppError(
          'Client user does not belong to this client',
          403,
          ErrorCode.FORBIDDEN
        );
      }

      if (!clientUser.user.image) {
        throw new AppError(
          'Client user does not have a profile photo',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      const presignedUrl = await this.storageService.generatePreSignedUrl(
        clientUser.user.image,
        'read'
      );

      return {
        fileName: clientUser.user.image,
        presignedUrl,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to get profile photo presigned URL',
        context: 'ClientUserProfileService.getProfilePhotoPresignedUrl',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientUserId,
        clientId,
      });
      throw error;
    }
  }

  /**
   * Get client user settings
   */
  async getSettings(
    clientUserId: string,
    clientId: string
  ): Promise<IClientUserSettings> {
    try {
      // Find the client user by ID
      const clientUser = await this.prisma.client_user.findUnique({
        where: {
          id: clientUserId,
        },
        include: {
          settings: true,
        },
      });

      if (!clientUser) {
        throw new AppError('Client user not found', 404, ErrorCode.NOT_FOUND);
      }

      // Check if the client user belongs to the specified client
      if (clientUser.clientId !== clientId) {
        throw new AppError(
          'Client user does not belong to this client',
          403,
          ErrorCode.FORBIDDEN
        );
      }

      // If settings don't exist, create them from global settings
      if (!clientUser.settings) {
        const newSettings =
          await this.getClientUserDefaultSettings(clientUserId);
        const createdSettings = await this.prisma.client_user_settings.create({
          data: {
            clientUserId: newSettings.clientUserId,
            globalSettingsId: newSettings.globalSettingsId,
            notificationsEnabled: newSettings.notificationsEnabled,
            emailNotifications: newSettings.emailNotifications,
            pushNotifications: newSettings.pushNotifications,
            darkMode: newSettings.darkMode,
            language: newSettings.language,
            timezone: newSettings.timezone,
            preferredCommunicationChannel:
              newSettings.preferredCommunicationChannel,
          },
        });

        // Convert to domain model and return
        return toClientUserSettingsDomain(createdSettings);
      }

      // Convert to domain model
      return toClientUserSettingsDomain(clientUser.settings);
    } catch (error) {
      logger.error({
        message: 'Failed to get user settings',
        context: 'ClientUserProfileService.getSettings',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientUserId,
        clientId,
      });
      throw error;
    }
  }

  /**
   * Update client user settings
   */
  async updateSettings(
    clientUserId: string,
    clientId: string,
    settingsData: IClientUserSettingsUpdate
  ): Promise<IClientUserSettings> {
    try {
      // Find the client user by ID
      const clientUser = await this.prisma.client_user.findUnique({
        where: {
          id: clientUserId,
        },
        include: {
          settings: true,
        },
      });

      if (!clientUser) {
        throw new AppError('Client user not found', 404, ErrorCode.NOT_FOUND);
      }

      // Check if the client user belongs to the specified client
      if (clientUser.clientId !== clientId) {
        throw new AppError(
          'Client user does not belong to this client',
          403,
          ErrorCode.FORBIDDEN
        );
      }

      // If settings don't exist, create them from global settings first
      if (!clientUser.settings) {
        const newSettings =
          await this.getClientUserDefaultSettings(clientUserId);
        await this.prisma.client_user_settings.create({
          data: {
            clientUserId: newSettings.clientUserId,
            globalSettingsId: newSettings.globalSettingsId,
            notificationsEnabled: newSettings.notificationsEnabled,
            emailNotifications: newSettings.emailNotifications,
            pushNotifications: newSettings.pushNotifications,
            darkMode: newSettings.darkMode,
            language: newSettings.language,
            timezone: newSettings.timezone,
            preferredCommunicationChannel:
              newSettings.preferredCommunicationChannel,
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
      const updatedSettings = await this.prisma.client_user_settings.update({
        where: { clientUserId },
        data: updateData,
      });

      // Convert to domain model
      return toClientUserSettingsDomain(updatedSettings);
    } catch (error) {
      logger.error({
        message: 'Failed to update user settings',
        context: 'ClientUserProfileService.updateSettings',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientUserId,
        clientId,
        settingsData,
      });
      throw error;
    }
  }

  /**
   * Create settings from global settings
   * This is a helper method that can be used when creating a new client user
   * or when settings don't exist
   */
  async getClientUserDefaultSettings(
    clientUserId: string
  ): Promise<IClientUserSettings> {
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
        clientUserId,
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
        context: 'ClientUserProfileService.createSettingsFromGlobal',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientUserId,
      });
      throw error;
    }
  }
}
