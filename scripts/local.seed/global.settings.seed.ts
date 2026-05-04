import { logger } from '../../src/shared/utils/logger';
import { prisma } from './prisma.client';

// Function to seed global settings
export const seedGlobalSettings = async () => {
  try {
    logger.info('Starting global settings seed...');

    // Clear existing global settings
    await prisma.global_settings.deleteMany();
    await prisma.global_onboarding_assessment_settings.deleteMany();
    await prisma.global_job_ai_assessment_settings.deleteMany();

    // Create default global settings
    const globalSettings = await prisma.global_settings.create({
      data: {
        name: 'Default Global Settings',
        description: 'Default configuration for the entire application',
        isSingleton: true,
        defaultNotificationsEnabled: true,
        defaultEmailNotifications: true,
        defaultPushNotifications: true,
        defaultSmsNotifications: false,
        defaultInAppNotifications: true,
        defaultJobAlerts: true,
        defaultCandidateAlerts: true,
        defaultApplicationAlerts: true,
        defaultApplicationUpdates: true,
        defaultConsultantAlerts: true,
        defaultContractAlerts: true,
        defaultDarkMode: false,
        defaultLanguage: 'en',
        defaultTimezone: 'UTC',
        defaultDateFormat: 'MM_DD_YYYY',
        defaultTimeFormat: 'TWELVE_HOUR',
        defaultFirstDayOfWeek: 0,
        defaultCommunicationChannel: 'EMAIL',
        defaultDataSharing: false,
        defaultProfileVisibility: true,
        defaultActivityTracking: true,
        defaultShareDataWithEmployers: true,
        defaultCurrency: 'USD',
        defaultCountry: 'US',
        maxFileUploadSize: 10,
        maxFilesPerUpload: 5,
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        passwordExpiryDays: 90,
        candidateDefaultSettings: {},
        clientDefaultSettings: {},
        partnerDefaultSettings: {},
        customStyles: {},
        customBranding: {},
      },
    });
    // Create default onboarding assessment settings
    const onboardingSettings =
      await prisma.global_onboarding_assessment_settings.create({
        data: {
          name: 'Default Onboarding Assessment Settings',
          description: 'Default configuration for onboarding assessments',
          isSingleton: true,
          greetingMessage: 'Welcome to the onboarding assessment!',
          defaultAssessmentDuration: 60 * 60,
          defaultPassingScore: 0.7,
          requiredSections: [
            'INTRODUCTION',
            'PSYCHOMETRIC_ASSESSMENT',
            'ASPIRATIONS',
          ],
          maximumAttempts: 3,
          cooldownPeriod: 7,
          proctoringEnabled: true,
          maxWarnings: 3,
          tabSwitchLimit: 3,
          copyPasteAllowed: false,
          videoRecordingEnabled: true,
          minimumVideoLength: 10,
          aiVideoAnalysisEnabled: true,
          autoPublishOnSuccess: true,
          autoNotifyOnComplete: true,
          sectionTemplates: {},
          questionTemplates: {},
          customStyles: {},
          customInstructions:
            'Please complete all sections of the assessment honestly and to the best of your ability.',
        },
      });

    // Create default job ai assessment settings
    const jobAiAssessmentSettings =
      await prisma.global_job_ai_assessment_settings.create({
        data: {
          name: 'Default Job AI Assessment Settings',
          description: 'Default configuration for job ai-based assessments',
          isSingleton: true,
          greetingMessage: 'Welcome to your job ai-based assessment!',
          defaultAssessmentDuration: 60 * 60,
          defaultPassingScore: 0.7,
          requiredSections: ['job_knowledge'],
          maximumAttempts: 3,
          cooldownPeriod: 7,
          maxSections: 3,
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
          sectionTemplates: {},
          questionTemplates: {},
          customStyles: {},
          customInstructions:
            'Please answer all questions based on the job description provided. Take your time and provide thoughtful responses.',
        },
      });

    logger.info('Global settings seeded successfully');
    return {
      globalSettings,
      onboardingSettings,
      jobAiAssessmentSettings,
    };
  } catch (error) {
    logger.error('Error seeding global settings:', error);
    throw error;
  }
};
