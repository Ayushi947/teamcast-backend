import { PrismaClient } from '@prisma/client';
import { singleton } from '@/shared/decorators/singleton';
import {
  IGlobalJobAiAssessmentSettings,
  IGlobalJobAiAssessmentSettingsUpdate,
  toGlobalJobAiAssessmentSettingsDomain,
} from '@/shared/models/domain/candidate/job.ai.assessment.domain';
import { logger } from '@/shared/utils/logger';

@singleton
export class JobAiAssessmentGlobalSettingsService {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get global job AI assessment settings
   */
  async getGlobalJobAiAssessmentSettings(): Promise<IGlobalJobAiAssessmentSettings> {
    try {
      logger.info({
        message: 'Fetching global job AI assessment settings',
        context:
          'JobAiAssessmentGlobalSettingsService.getGlobalJobAiAssessmentSettings',
      });

      const globalSettingsDb =
        await this.prisma.global_job_ai_assessment_settings.findFirst({
          where: { isSingleton: true },
        });

      if (!globalSettingsDb) {
        // Return default settings if not found
        logger.warn({
          message:
            'No global job AI assessment settings found, returning defaults',
          context:
            'JobAiAssessmentGlobalSettingsService.getGlobalJobAiAssessmentSettings',
        });

        return {
          id: '',
          name: 'Default Job AI Assessment Settings',
          description: 'Default settings for job AI assessments',
          isSingleton: true,
          greetingMessage: '',
          defaultAssessmentDuration: 3600,
          defaultPassingScore: 0.7,
          requiredSections: [],
          maximumAttempts: 3,
          cooldownPeriod: 7,
          maxAssessmentDuration: 7200,
          assessmentBuffer: 300,
          useCustomPrompts: false,
          aiDifficulty: 'MEDIUM',
          maxSections: 5,
          maxQuestionsPerSection: 5,
          proctoringEnabled: true,
          maxWarnings: 3,
          tabSwitchLimit: 3,
          copyPasteAllowed: false,
          videoRecordingEnabled: true,
          minimumVideoLength: 300,
          aiVideoAnalysisEnabled: true,
          autoPublishOnSuccess: false,
          autoNotifyOnComplete: true,
          interviewLanguage: 'ENGLISH',
          interviewDialect: 'en-US',
          interviewVoiceGender: 'female',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      const domainSettings =
        toGlobalJobAiAssessmentSettingsDomain(globalSettingsDb);

      logger.info({
        message: 'Retrieved global job AI assessment settings successfully',
        context:
          'JobAiAssessmentGlobalSettingsService.getGlobalJobAiAssessmentSettings',
        settingsId: domainSettings.id,
      });

      return domainSettings;
    } catch (error) {
      logger.error({
        message: 'Failed to get global job AI assessment settings',
        context:
          'JobAiAssessmentGlobalSettingsService.getGlobalJobAiAssessmentSettings',
        error: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Update global job AI assessment settings
   */
  async updateGlobalJobAiAssessmentSettings(
    data: IGlobalJobAiAssessmentSettingsUpdate
  ): Promise<IGlobalJobAiAssessmentSettings> {
    try {
      logger.info({
        message: 'Updating global job AI assessment settings',
        context:
          'JobAiAssessmentGlobalSettingsService.updateGlobalJobAiAssessmentSettings',
        updateFields: Object.keys(data),
      });

      // Get or create the singleton global settings
      const globalSettingsDb =
        await this.prisma.global_job_ai_assessment_settings.upsert({
          where: { isSingleton: true },
          create: {
            name: 'Default Job AI Assessment Settings',
            description: 'Default settings for job AI assessments',
            isSingleton: true,
            greetingMessage: data.greetingMessage || '',
            defaultAssessmentDuration: data.defaultAssessmentDuration || 3600,
            defaultPassingScore: data.defaultPassingScore || 0.7,
            requiredSections: data.requiredSections || [],
            maximumAttempts: data.maximumAttempts || 3,
            cooldownPeriod: data.cooldownPeriod || 7,
            maxAssessmentDuration: data.maxAssessmentDuration || 7200,
            assessmentBuffer: data.assessmentBuffer || 300,
            useCustomPrompts: data.useCustomPrompts ?? false,
            aiDifficulty: data.aiDifficulty || 'MEDIUM',
            customPrompts: data.customPrompts || {},
            skillWeightings: data.skillWeightings || {},
            maxSections: data.maxSections || 5,
            maxQuestionsPerSection: data.maxQuestionsPerSection || 5,
            proctoringEnabled: data.proctoringEnabled ?? true,
            maxWarnings: data.maxWarnings || 3,
            tabSwitchLimit: data.tabSwitchLimit || 3,
            copyPasteAllowed: data.copyPasteAllowed ?? false,
            videoRecordingEnabled: data.videoRecordingEnabled ?? true,
            minimumVideoLength: data.minimumVideoLength || 300,
            aiVideoAnalysisEnabled: data.aiVideoAnalysisEnabled ?? true,
            autoPublishOnSuccess: data.autoPublishOnSuccess ?? false,
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
            ...(data.maxAssessmentDuration !== undefined && {
              maxAssessmentDuration: data.maxAssessmentDuration,
            }),
            ...(data.assessmentBuffer !== undefined && {
              assessmentBuffer: data.assessmentBuffer,
            }),
            ...(data.useCustomPrompts !== undefined && {
              useCustomPrompts: data.useCustomPrompts,
            }),
            ...(data.aiDifficulty !== undefined && {
              aiDifficulty: data.aiDifficulty,
            }),
            ...(data.customPrompts !== undefined && {
              customPrompts: data.customPrompts,
            }),
            ...(data.skillWeightings !== undefined && {
              skillWeightings: data.skillWeightings,
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
        toGlobalJobAiAssessmentSettingsDomain(globalSettingsDb);

      logger.info({
        message: 'Updated global job AI assessment settings successfully',
        context:
          'JobAiAssessmentGlobalSettingsService.updateGlobalJobAiAssessmentSettings',
        settingsId: domainSettings.id,
      });

      return domainSettings;
    } catch (error) {
      logger.error({
        message: 'Failed to update global job AI assessment settings',
        context:
          'JobAiAssessmentGlobalSettingsService.updateGlobalJobAiAssessmentSettings',
        error: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }
}
