import { PrismaClient } from '@prisma/client';
import { singleton } from '@/shared/decorators/singleton';
import {
  IGlobalSettings,
  IGlobalSettingsUpdate,
  toGlobalSettingsDomain,
} from '@/shared/models/domain/support/global.settings.domain';
import { logger } from '@/shared/utils/logger';

@singleton
export class GlobalSettingsService {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get global settings (singleton - only one record with isSingleton = true)
   */
  async getGlobalSettings(): Promise<IGlobalSettings> {
    try {
      logger.info({
        message: 'Fetching global settings',
        context: 'GlobalSettingsService.getGlobalSettings',
      });

      const settings = await this.prisma.global_settings.findFirst({
        where: { isSingleton: true },
      });

      if (!settings) {
        // If no singleton exists, create default settings
        logger.warn({
          message: 'No global settings found, creating default settings',
          context: 'GlobalSettingsService.getGlobalSettings',
        });

        const defaultSettings = await this.prisma.global_settings.create({
          data: {
            name: 'Default Global Settings',
            description: 'Default global settings configuration',
            isSingleton: true,
          },
        });

        const domainSettings = toGlobalSettingsDomain(defaultSettings);
        logger.info({
          message: 'Created and returning default global settings',
          context: 'GlobalSettingsService.getGlobalSettings',
          settingsId: domainSettings.id,
        });
        return domainSettings;
      }

      const domainSettings = toGlobalSettingsDomain(settings);
      logger.info({
        message: 'Retrieved global settings successfully',
        context: 'GlobalSettingsService.getGlobalSettings',
        settingsId: domainSettings.id,
        hasData: !!domainSettings,
      });
      return domainSettings;
    } catch (error) {
      logger.error({
        message: 'Failed to get global settings',
        context: 'GlobalSettingsService.getGlobalSettings',
        error: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Update global settings
   */
  async updateGlobalSettings(
    updateData: IGlobalSettingsUpdate
  ): Promise<IGlobalSettings> {
    try {
      // Find the singleton settings
      const existingSettings = await this.prisma.global_settings.findFirst({
        where: { isSingleton: true },
      });

      if (!existingSettings) {
        // If no singleton exists, create it with the update data
        logger.warn({
          message:
            'No global settings found, creating new settings with provided data',
          context: 'GlobalSettingsService.updateGlobalSettings',
        });

        // Prepare data with proper enum casting
        const createData: any = {
          name: updateData.name || 'Default Global Settings',
          isSingleton: true,
        };

        if (updateData.description !== undefined) {
          createData.description = updateData.description;
        }

        // Handle enum fields properly
        if (updateData.defaultDateFormat !== undefined) {
          createData.defaultDateFormat = updateData.defaultDateFormat as any;
        }
        if (updateData.defaultTimeFormat !== undefined) {
          createData.defaultTimeFormat = updateData.defaultTimeFormat as any;
        }
        if (updateData.defaultCommunicationChannel !== undefined) {
          createData.defaultCommunicationChannel =
            updateData.defaultCommunicationChannel as any;
        }

        // Add all other fields (only defined values)
        const {
          name: _name,
          description: _description,
          isSingleton: _isSingleton,
          defaultDateFormat: _dateFormat,
          defaultTimeFormat: _timeFormat,
          defaultCommunicationChannel: _commChannel,
          ...restFields
        } = updateData as any;

        // Only include fields that are defined (not undefined)
        Object.keys(restFields).forEach((key) => {
          if (restFields[key] !== undefined) {
            createData[key] = restFields[key];
          }
        });

        const newSettings = await this.prisma.global_settings.create({
          data: createData,
        });

        return toGlobalSettingsDomain(newSettings);
      }

      // Update existing settings
      // Prepare update data with proper enum casting
      const updatePayload: any = {};

      // Handle name and description
      if (updateData.name !== undefined) {
        updatePayload.name = updateData.name;
      }
      if (updateData.description !== undefined) {
        updatePayload.description = updateData.description;
      }

      // Handle enum fields properly - cast to any to avoid type issues
      if (updateData.defaultDateFormat !== undefined) {
        updatePayload.defaultDateFormat = updateData.defaultDateFormat as any;
      }
      if (updateData.defaultTimeFormat !== undefined) {
        updatePayload.defaultTimeFormat = updateData.defaultTimeFormat as any;
      }
      if (updateData.defaultCommunicationChannel !== undefined) {
        updatePayload.defaultCommunicationChannel =
          updateData.defaultCommunicationChannel as any;
      }

      // Add all other fields (excluding name, description, isSingleton, and enum fields)
      const {
        name: _name,
        description: _description,
        isSingleton: _isSingleton,
        defaultDateFormat: _dateFormat,
        defaultTimeFormat: _timeFormat,
        defaultCommunicationChannel: _commChannel,
        ...restFields
      } = updateData as any;

      // Only include fields that are defined (not undefined)
      Object.keys(restFields).forEach((key) => {
        if (restFields[key] !== undefined) {
          updatePayload[key] = restFields[key];
        }
      });

      const updatedSettings = await this.prisma.global_settings.update({
        where: { id: existingSettings.id },
        data: updatePayload,
      });

      logger.info({
        message: 'Global settings updated successfully',
        context: 'GlobalSettingsService.updateGlobalSettings',
        settingsId: updatedSettings.id,
      });

      return toGlobalSettingsDomain(updatedSettings);
    } catch (error) {
      logger.error({
        message: 'Failed to update global settings',
        context: 'GlobalSettingsService.updateGlobalSettings',
        error: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        updateData,
      });
      throw error;
    }
  }
}
