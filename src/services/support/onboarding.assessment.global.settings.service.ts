import { PrismaClient } from '@prisma/client';
import { singleton } from '@/shared/decorators/singleton';
import {
  IGlobalOnboardingAssessmentSettings,
  IGlobalOnboardingAssessmentSettingsUpdate,
  toGlobalOnboardingAssessmentSettingsDomain,
} from '@/shared/models/domain/candidate/onboarding.assessment.domain';
import { logger } from '@/shared/utils/logger';

@singleton
export class OnboardingAssessmentGlobalSettingsService {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get global onboarding assessment settings
   */
  async getGlobalOnboardingAssessmentSettings(): Promise<IGlobalOnboardingAssessmentSettings> {
    try {
      logger.info({
        message: 'Fetching global onboarding assessment settings',
        context:
          'OnboardingAssessmentGlobalSettingsService.getGlobalOnboardingAssessmentSettings',
      });

      const globalSettingsDb =
        await this.prisma.global_onboarding_assessment_settings.findFirst({
          where: { isSingleton: true },
        });

      if (!globalSettingsDb) {
        // Return default settings if not found
        logger.warn({
          message:
            'No global onboarding assessment settings found, returning defaults',
          context:
            'OnboardingAssessmentGlobalSettingsService.getGlobalOnboardingAssessmentSettings',
        });

        return {
          id: '',
          name: 'Default Onboarding Assessment Settings',
          description: 'Default settings for onboarding assessments',
          isSingleton: true,
          greetingMessage: '',
          defaultAssessmentDuration: 3600,
          defaultPassingScore: 0.7,
          requiredSections: [],
          maximumAttempts: 3,
          cooldownPeriod: 7,
          maxSections: 6,
          maxQuestionsPerSection: 8,
          proctoringEnabled: true,
          maxWarnings: 3,
          tabSwitchLimit: 3,
          copyPasteAllowed: false,
          videoRecordingEnabled: true,
          minimumVideoLength: 10,
          aiVideoAnalysisEnabled: true,
          autoPublishOnSuccess: true,
          autoNotifyOnComplete: true,
          interviewLanguage: 'ENGLISH',
          interviewDialect: 'en-US',
          interviewVoiceGender: 'female',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      const domainSettings =
        toGlobalOnboardingAssessmentSettingsDomain(globalSettingsDb);

      logger.info({
        message: 'Retrieved global onboarding assessment settings successfully',
        context:
          'OnboardingAssessmentGlobalSettingsService.getGlobalOnboardingAssessmentSettings',
        settingsId: domainSettings.id,
      });

      return domainSettings;
    } catch (error) {
      logger.error({
        message: 'Failed to get global onboarding assessment settings',
        context:
          'OnboardingAssessmentGlobalSettingsService.getGlobalOnboardingAssessmentSettings',
        error: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Update global onboarding assessment settings
   */
  async updateGlobalOnboardingAssessmentSettings(
    data: IGlobalOnboardingAssessmentSettingsUpdate
  ): Promise<IGlobalOnboardingAssessmentSettings> {
    try {
      logger.info({
        message: 'Updating global onboarding assessment settings',
        context:
          'OnboardingAssessmentGlobalSettingsService.updateGlobalOnboardingAssessmentSettings',
        updateFields: Object.keys(data),
      });

      // Get or create the singleton global settings
      const globalSettingsDb =
        await this.prisma.global_onboarding_assessment_settings.upsert({
          where: { isSingleton: true },
          create: {
            name: 'Default Onboarding Assessment Settings',
            description: 'Default settings for onboarding assessments',
            isSingleton: true,
            greetingMessage: data.greetingMessage || '',
            defaultAssessmentDuration: data.defaultAssessmentDuration || 3600,
            defaultPassingScore: data.defaultPassingScore || 0.7,
            requiredSections: data.requiredSections || [],
            maximumAttempts: data.maximumAttempts || 3,
            cooldownPeriod: data.cooldownPeriod || 7,
            maxSections: data.maxSections || 6,
            maxQuestionsPerSection: data.maxQuestionsPerSection || 8,
            proctoringEnabled: data.proctoringEnabled ?? true,
            maxWarnings: data.maxWarnings || 3,
            tabSwitchLimit: data.tabSwitchLimit || 3,
            copyPasteAllowed: data.copyPasteAllowed ?? false,
            videoRecordingEnabled: data.videoRecordingEnabled ?? true,
            minimumVideoLength: data.minimumVideoLength || 10,
            aiVideoAnalysisEnabled: data.aiVideoAnalysisEnabled ?? true,
            autoPublishOnSuccess: data.autoPublishOnSuccess ?? true,
            autoNotifyOnComplete: data.autoNotifyOnComplete ?? true,
            interviewLanguage: data.interviewLanguage || 'ENGLISH',
            interviewDialect: data.interviewDialect || 'en-US',
            interviewVoiceGender: data.interviewVoiceGender || 'female',
            sectionTemplates: data.sectionTemplates || {},
            questionTemplates: data.questionTemplates || {},
            customStyles: data.customStyles || {},
            customInstructions: data.customInstructions || '',
          },
          update: {
            ...(data.greetingMessage !== undefined && {
              greetingMessage: data.greetingMessage,
            }),
            ...(data.defaultAssessmentDuration !== undefined && {
              defaultAssessmentDuration: data.defaultAssessmentDuration,
            }),
            ...(data.defaultPassingScore !== undefined && {
              defaultPassingScore: data.defaultPassingScore,
            }),
            ...(data.requiredSections !== undefined && {
              requiredSections: data.requiredSections,
            }),
            ...(data.maximumAttempts !== undefined && {
              maximumAttempts: data.maximumAttempts,
            }),
            ...(data.cooldownPeriod !== undefined && {
              cooldownPeriod: data.cooldownPeriod,
            }),
            ...(data.maxSections !== undefined && {
              maxSections: data.maxSections,
            }),
            ...(data.maxQuestionsPerSection !== undefined && {
              maxQuestionsPerSection: data.maxQuestionsPerSection,
            }),
            ...(data.proctoringEnabled !== undefined && {
              proctoringEnabled: data.proctoringEnabled,
            }),
            ...(data.maxWarnings !== undefined && {
              maxWarnings: data.maxWarnings,
            }),
            ...(data.tabSwitchLimit !== undefined && {
              tabSwitchLimit: data.tabSwitchLimit,
            }),
            ...(data.copyPasteAllowed !== undefined && {
              copyPasteAllowed: data.copyPasteAllowed,
            }),
            ...(data.videoRecordingEnabled !== undefined && {
              videoRecordingEnabled: data.videoRecordingEnabled,
            }),
            ...(data.minimumVideoLength !== undefined && {
              minimumVideoLength: data.minimumVideoLength,
            }),
            ...(data.aiVideoAnalysisEnabled !== undefined && {
              aiVideoAnalysisEnabled: data.aiVideoAnalysisEnabled,
            }),
            ...(data.autoPublishOnSuccess !== undefined && {
              autoPublishOnSuccess: data.autoPublishOnSuccess,
            }),
            ...(data.autoNotifyOnComplete !== undefined && {
              autoNotifyOnComplete: data.autoNotifyOnComplete,
            }),
            ...(data.interviewLanguage !== undefined && {
              interviewLanguage: data.interviewLanguage,
            }),
            ...(data.interviewDialect !== undefined && {
              interviewDialect: data.interviewDialect,
            }),
            ...(data.interviewVoiceGender !== undefined && {
              interviewVoiceGender: data.interviewVoiceGender,
            }),
            ...(data.sectionTemplates !== undefined && {
              sectionTemplates: data.sectionTemplates,
            }),
            ...(data.questionTemplates !== undefined && {
              questionTemplates: data.questionTemplates,
            }),
            ...(data.customStyles !== undefined && {
              customStyles: data.customStyles,
            }),
            ...(data.customInstructions !== undefined && {
              customInstructions: data.customInstructions,
            }),
          },
        });

      const domainSettings =
        toGlobalOnboardingAssessmentSettingsDomain(globalSettingsDb);

      logger.info({
        message: 'Updated global onboarding assessment settings successfully',
        context:
          'OnboardingAssessmentGlobalSettingsService.updateGlobalOnboardingAssessmentSettings',
        settingsId: domainSettings.id,
      });

      return domainSettings;
    } catch (error) {
      logger.error({
        message: 'Failed to update global onboarding assessment settings',
        context:
          'OnboardingAssessmentGlobalSettingsService.updateGlobalOnboardingAssessmentSettings',
        error: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }
}
