import { logger } from '../../src/shared/utils/logger';
import { prisma } from './prisma.client';

/**
 * Seed global practice assessment settings
 */
export const seedPracticeAssessmentSettings = async () => {
  try {
    logger.info('Starting global practice assessment settings seed...');

    // Clear existing practice assessment settings
    await prisma.global_practice_assessment_settings.deleteMany();

    // Create default practice assessment settings with provided values
    const practiceAssessmentSettings =
      await prisma.global_practice_assessment_settings.create({
        data: {
          id: '18d0d7e0-713f-42e1-9187-71867a4580ee',
          name: 'Default Practice Assessment Settings',
          description: 'Default settings for practice assessments',
          isSingleton: true,
          greetingMessage:
            'Please answer all questions based on the job description provided. Take your time and provide thoughtful responses.',
          defaultAssessmentDuration: 1800, // 30 minutes in seconds
          defaultPassingScore: 0.6,
          requiredSections: ['TECHNICAL', 'BEHAVIORAL'],
          maximumAttempts: 7,
          cooldownPeriod: 7,
          maxSections: 4,
          maxQuestionsPerSection: 5,
          proctoringEnabled: true,
          maxWarnings: 2,
          tabSwitchLimit: 3,
          copyPasteAllowed: false,
          videoRecordingEnabled: true,
          minimumVideoLength: 300, // in seconds
          aiVideoAnalysisEnabled: true,
          autoPublishOnSuccess: false,
          autoNotifyOnComplete: true,
          interviewLanguage: 'ENGLISH',
          interviewDialect: 'en-US',
          interviewVoiceGender: 'female',
          sectionTemplates: undefined,
          questionTemplates: undefined,
          customStyles: undefined,
          customInstructions: undefined,
          createdAt: new Date('2025-12-22T00:48:59.158Z'),
          updatedAt: new Date('2025-12-22T01:31:21.364Z'),
        },
      });

    logger.info('Global practice assessment settings seeded successfully', {
      id: practiceAssessmentSettings.id,
      name: practiceAssessmentSettings.name,
    });

    return practiceAssessmentSettings;
  } catch (error) {
    logger.error('Error seeding global practice assessment settings:', error);
    throw error;
  }
};
