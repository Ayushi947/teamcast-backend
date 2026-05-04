import { PrismaClient } from '@prisma/client';
import { singleton } from '@/shared/decorators/singleton';
import {
  ICandidateSettings,
  ICandidatePreferences,
  toCandidateSettingsDomain,
  toCandidatePreferencesDomain,
  ICandidateSettingsUpdate,
  ICandidatePreferencesUpdate,
} from '@/shared/models/domain/candidate/profile.settings.domain';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';
import { CommunicationChannelEnum } from '@/shared/models/common/enums';

@singleton
export class CandidateProfileSettingsService {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getDefaultSettings(candidateId: string): Promise<ICandidateSettings> {
    const globalSettings = await this.prisma.global_settings.findFirst({
      where: { isSingleton: true },
    });

    if (!globalSettings) {
      // Fallback to hardcoded defaults if no global settings exist
      return {
        id: '',
        candidateId,
        notificationsEnabled: true,
        emailNotifications: true,
        pushNotifications: true,
        jobAlerts: true,
        applicationUpdates: true,
        profileVisibility: true,
        shareDataWithEmployers: true,
        darkMode: false,
        language: 'en',
        timezone: 'UTC',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // Use global settings as defaults
    return {
      id: '',
      candidateId,
      notificationsEnabled: globalSettings.defaultNotificationsEnabled,
      emailNotifications: globalSettings.defaultEmailNotifications,
      pushNotifications: globalSettings.defaultPushNotifications,
      jobAlerts: globalSettings.defaultJobAlerts,
      applicationUpdates: globalSettings.defaultApplicationUpdates,
      profileVisibility: globalSettings.defaultProfileVisibility,
      shareDataWithEmployers: globalSettings.defaultShareDataWithEmployers,
      darkMode: globalSettings.defaultDarkMode,
      language: globalSettings.defaultLanguage,
      timezone: globalSettings.defaultTimezone,
      preferredCommunicationChannel:
        globalSettings.defaultCommunicationChannel as CommunicationChannelEnum,
      globalSettingsId: globalSettings.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Get candidate settings
   */
  async getSettings(candidateId: string): Promise<ICandidateSettings> {
    try {
      const candidate = await this.prisma.candidate.findUnique({
        where: { id: candidateId },
        include: { settings: true },
      });

      if (!candidate) {
        throw new AppError('Candidate not found', 404, ErrorCode.NOT_FOUND);
      }

      if (!candidate.settings) {
        // Create default settings if they don't exist
        const defaultSettings = await this.getDefaultSettings(candidateId);
        const newSettings = await this.prisma.candidate_settings.create({
          data: defaultSettings,
        });
        return toCandidateSettingsDomain(newSettings);
      }

      return toCandidateSettingsDomain(candidate.settings);
    } catch (error) {
      logger.error({
        message: 'Failed to get candidate settings',
        context: 'CandidateProfileSettingsService.getSettings',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
      });
      throw error;
    }
  }

  /**
   * Update candidate settings
   */
  async updateSettings(
    candidateId: string,
    settings: ICandidateSettingsUpdate
  ): Promise<ICandidateSettings> {
    try {
      const candidate = await this.prisma.candidate.findUnique({
        where: { id: candidateId },
        include: { settings: true },
      });

      if (!candidate) {
        throw new AppError('Candidate not found', 404, ErrorCode.NOT_FOUND);
      }

      const updatedSettings = await this.prisma.candidate_settings.upsert({
        where: { candidateId },
        create: {
          candidateId,
          ...settings,
        },
        update: settings,
      });

      return toCandidateSettingsDomain(updatedSettings);
    } catch (error) {
      logger.error({
        message: 'Failed to update candidate settings',
        context: 'CandidateProfileSettingsService.updateSettings',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        settings,
      });
      throw error;
    }
  }

  /**
   * Get candidate preferences
   */
  async getPreferences(candidateId: string): Promise<ICandidatePreferences> {
    try {
      const candidate = await this.prisma.candidate.findUnique({
        where: { id: candidateId },
        include: { preferences: true },
      });

      if (!candidate) {
        throw new AppError('Candidate not found', 404, ErrorCode.NOT_FOUND);
      }

      if (!candidate.preferences) {
        // Create default preferences if they don't exist
        const defaultPreferences =
          await this.prisma.candidate_preferences.create({
            data: {
              candidateId,
              preferredIndustries: [],
              preferredLocations: [],
              preferredWorkTypes: [],
              preferredJobTitles: [],
              preferredJobCommitments: [],
              preferredJobSchedules: [],
              preferredBenefits: [],
              preferredResponsibilities: [],
              preferredTags: [],
            },
          });
        return toCandidatePreferencesDomain(defaultPreferences);
      }

      return toCandidatePreferencesDomain(candidate.preferences);
    } catch (error) {
      logger.error({
        message: 'Failed to get candidate preferences',
        context: 'CandidateProfileSettingsService.getPreferences',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
      });
      throw error;
    }
  }

  /**
   * Update candidate preferences
   */
  async updatePreferences(
    candidateId: string,
    preferences: ICandidatePreferencesUpdate
  ): Promise<ICandidatePreferences> {
    try {
      const candidate = await this.prisma.candidate.findUnique({
        where: { id: candidateId },
        include: { preferences: true },
      });

      if (!candidate) {
        throw new AppError('Candidate not found', 404, ErrorCode.NOT_FOUND);
      }

      const updatedPreferences = await this.prisma.candidate_preferences.upsert(
        {
          where: { candidateId },
          create: {
            candidateId,
            ...preferences,
          },
          update: preferences,
        }
      );

      return toCandidatePreferencesDomain(updatedPreferences);
    } catch (error) {
      logger.error({
        message: 'Failed to update candidate preferences',
        context: 'CandidateProfileSettingsService.updatePreferences',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        preferences,
      });
      throw error;
    }
  }
}
