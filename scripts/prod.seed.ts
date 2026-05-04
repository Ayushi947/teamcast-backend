import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
import { logger } from '../src/shared/utils/logger';
import { migrateLookups } from './shared/migrate-lookups';

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

async function createGlobalSettings() {
  // Check if global settings already exist
  const existingSettings = await prisma.global_settings.findFirst({
    where: { isSingleton: true },
  });

  if (existingSettings) {
    logger.info('Global settings already exist, skipping creation');
    return existingSettings;
  }

  // Create global settings
  const globalSettings = await prisma.global_settings.create({
    data: {
      name: 'Default Global Settings',
      description: 'Default global configuration for Teamcast platform',
      isSingleton: true,

      // Notification settings
      defaultNotificationsEnabled: true,
      defaultEmailNotifications: true,
      defaultPushNotifications: true,
      defaultSmsNotifications: false,
      defaultInAppNotifications: true,

      // Job and application alerts
      defaultJobAlerts: true,
      defaultCandidateAlerts: true,
      defaultApplicationAlerts: true,
      defaultApplicationUpdates: true,
      defaultConsultantAlerts: true,
      defaultContractAlerts: true,

      // UI preferences
      defaultDarkMode: false,
      defaultLanguage: 'en',
      defaultTimezone: 'UTC',
      defaultDateFormat: 'MM_DD_YYYY',
      defaultTimeFormat: 'TWELVE_HOUR',
      defaultFirstDayOfWeek: 0,

      // Communication preferences
      defaultCommunicationChannel: 'EMAIL',

      // Privacy settings
      defaultDataSharing: false,
      defaultProfileVisibility: true,
      defaultActivityTracking: true,
      defaultShareDataWithEmployers: true,

      // Regional settings
      defaultCurrency: 'USD',
      defaultCountry: 'US',

      // System limits
      maxFileUploadSize: 10,
      maxFilesPerUpload: 5,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      passwordExpiryDays: 90,

      // Default settings for different user types
      candidateDefaultSettings: {
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
      },
      clientDefaultSettings: {
        notificationsEnabled: true,
        emailNotifications: true,
        pushNotifications: true,
        jobAlerts: true,
        candidateAlerts: true,
        applicationAlerts: true,
      },
      partnerDefaultSettings: {
        notificationsEnabled: true,
        emailNotifications: true,
        pushNotifications: true,
        jobAlerts: true,
        candidateAlerts: true,
        applicationAlerts: true,
      },

      // Customization
      customStyles: {},
      customBranding: {},
    },
  });

  logger.info('Created global settings', { id: globalSettings.id });
  return globalSettings;
}

async function createGlobalOnboardingAssessmentSettings() {
  // Check if global onboarding assessment settings already exist
  const existingSettings =
    await prisma.global_onboarding_assessment_settings.findFirst({
      where: { isSingleton: true },
    });

  if (existingSettings) {
    logger.info(
      'Global onboarding assessment settings already exist, skipping creation'
    );
    return existingSettings;
  }

  // Create global onboarding assessment settings
  const globalOnboardingSettings =
    await prisma.global_onboarding_assessment_settings.create({
      data: {
        name: 'Default Onboarding Assessment Settings',
        description: 'Default global configuration for onboarding assessments',
        isSingleton: true,

        // Greeting message
        greetingMessage: 'Welcome to your onboarding assessment!',

        // Assessment configuration
        defaultAssessmentDuration: 3600, // 1 hour
        defaultPassingScore: 0.7,
        requiredSections: [
          'SKILLS_ASSESSMENT',
          'PERSONALITY_ASSESSMENT',
          'CULTURAL_FIT',
        ],
        maximumAttempts: 3,
        cooldownPeriod: 7,

        // Max sections and questions
        maxSections: 6,
        maxQuestionsPerSection: 8,

        // Proctoring configuration
        proctoringEnabled: true,
        maxWarnings: 3,
        tabSwitchLimit: 3,
        copyPasteAllowed: false,

        // Video analysis configuration
        videoRecordingEnabled: true,
        minimumVideoLength: 10,
        aiVideoAnalysisEnabled: true,

        // Automatic actions
        autoPublishOnSuccess: true,
        autoNotifyOnComplete: true,

        // Customization
        customInstructions:
          'Please complete the assessment carefully and honestly.',
        customStyles: {},
        sectionTemplates: {},
        questionTemplates: {},
      },
    });

  logger.info('Created global onboarding assessment settings', {
    id: globalOnboardingSettings.id,
  });
  return globalOnboardingSettings;
}

async function createGlobalJobAiAssessmentSettings() {
  // Check if global job AI assessment settings already exist
  const existingSettings =
    await prisma.global_job_ai_assessment_settings.findFirst({
      where: { isSingleton: true },
    });

  if (existingSettings) {
    logger.info(
      'Global job AI assessment settings already exist, skipping creation'
    );
    return existingSettings;
  }

  // Create global job AI assessment settings
  const globalJobAiSettings =
    await prisma.global_job_ai_assessment_settings.create({
      data: {
        name: 'Default Job AI Assessment Settings',
        description: 'Default global configuration for job AI assessments',
        isSingleton: true,

        // Greeting message
        greetingMessage: 'Welcome to your job AI assessment!',

        // Assessment configuration
        defaultAssessmentDuration: 3600, // 1 hour
        defaultPassingScore: 0.7,
        requiredSections: ['TECHNICAL_ASSESSMENT', 'BEHAVIORAL_ASSESSMENT'],
        maximumAttempts: 3,
        cooldownPeriod: 7,
        maxAssessmentDuration: 7200, // 2 hours
        assessmentBuffer: 300, // 5 minutes buffer

        // AI configuration
        useCustomPrompts: false,
        aiDifficulty: 'MEDIUM',

        // Max sections and questions
        maxSections: 5,
        maxQuestionsPerSection: 5,

        // Proctoring configuration
        proctoringEnabled: true,
        maxWarnings: 3,
        tabSwitchLimit: 3,
        copyPasteAllowed: false,

        // Video analysis configuration
        videoRecordingEnabled: true,
        minimumVideoLength: 300, // 5 minutes
        aiVideoAnalysisEnabled: true,

        // Automatic actions
        autoPublishOnSuccess: false,
        autoNotifyOnComplete: true,

        // Customization
        customInstructions:
          'Please complete the assessment carefully and showcase your skills.',
        customStyles: {},
        sectionTemplates: {},
        questionTemplates: {},
      },
    });

  logger.info('Created global job AI assessment settings', {
    id: globalJobAiSettings.id,
  });
  return globalJobAiSettings;
}

async function main() {
  try {
    // Migrate lookups first
    await migrateLookups(prisma);

    // Create global settings
    await createGlobalSettings();

    // Create global assessment settings
    await createGlobalOnboardingAssessmentSettings();
    await createGlobalJobAiAssessmentSettings();

    // Create support users from configuration
    await createSupportUsersFromConfig();

    // Check if subscription packages exist
    const packageCount = await prisma.client_subscription_package.count();

    if (packageCount === 0) {
      await createSubscriptionPackages();
      logger.info('Created subscription packages');
    } else {
      logger.info('Subscription packages already exist, skipping creation');
    }

    logger.info('Production seed completed successfully');
  } catch (e) {
    logger.error('Error seeding production data:', e);
    throw e;
  } finally {
    await prisma.$disconnect();
  }
}

interface SupportUserConfig {
  name: string;
  email: string;
}

async function createSupportUsersFromConfig() {
  const supportUsersConfig: SupportUserConfig[] = [
    {
      name: 'Admin User',
      email: 'admin@teamcast.ai',
    },
    {
      name: 'Administrator',
      email: 'hello@teamcast.ai',
    },
  ];

  for (const userConfig of supportUsersConfig) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userConfig.email },
    });

    if (!existingUser) {
      await createSupportUser(userConfig.name, userConfig.email);
      logger.info('Created support user', { email: userConfig.email });
    } else {
      logger.info('Support user already exists, skipping creation', {
        email: userConfig.email,
      });
    }
  }
}

async function createSupportUser(name: string, email: string) {
  try {
    logger.info('Creating support user', {
      name,
      email,
    });

    // Use fixed password for both users
    const userPassword = 'Password123!';
    const hashedPassword = await hashPassword(userPassword);

    // Use transaction to ensure atomicity
    const supportUser = await prisma.$transaction(async (tx) => {
      // Create user in our database
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'ADMIN',
          type: 'SUPPORT',
          profileSetup: true,
          emailVerified: new Date(), // Support users are pre-verified
          status: 'ACTIVE',
        },
      });

      // Create support user profile
      await tx.support_user.create({
        data: {
          userId: user.id,
          settings: {
            create: {
              notificationsEnabled: true,
              emailNotifications: true,
              pushNotifications: true,
              darkMode: false,
              language: 'en',
              timezone: 'UTC',
            },
          },
        },
      });

      return user;
    });

    logger.info('Support user created successfully', {
      userId: supportUser.id,
      email: supportUser.email,
      password: userPassword,
    });

    return supportUser;
  } catch (error) {
    logger.error('Failed to create support user', {
      error: error instanceof Error ? error.message : 'Unknown error',
      name,
      email,
      context: 'ProductionSeed.createSupportUser',
    });
    throw error;
  }
}

async function createSubscriptionPackages() {
  // Delete existing client packages and create new ones
  await prisma.client_subscription_package.deleteMany();
  const clientPackages = [
    {
      name: 'Starter',
      description: 'Perfect for small teams and startups',
      price: 199,
      billingCycle: 'MONTHLY',
      maxJobPostings: 5,
      maxCandidateViews: 75,
      maxAiAssessments: 15,
      maxSeats: 3,
      unlimitedCandidateViews: false,
      additionalFeatures: JSON.stringify({
        aiPoweredCandidateMatching: true,
        emailSupport: true,
        basicPerformanceInsights: true,
        automatedInterviewScheduling: true,
        includesAIRecommendations: true,
        prioritySupport: false,
        customBranding: false,
      }),
      isDefault: true,
      isActive: true,
    },
    {
      name: 'Professional',
      description: 'Ideal for growing companies',
      price: 499,
      billingCycle: 'MONTHLY',
      maxJobPostings: 20,
      maxCandidateViews: 250,
      maxAiAssessments: 50,
      maxSeats: 10,
      unlimitedCandidateViews: false,
      additionalFeatures: JSON.stringify({
        advancedAIMatchingWithCustomCriteria: true,
        prioritySupportViaEmailAndLiveChat: true,
        comprehensiveAnalytics: true,
        smartInterviewSchedulingWithCalendarSync: true,
        seamlessATSAndJobBoardConnections: true,
        includesAIRecommendations: true,
        customBranding: false,
      }),
      isDefault: false,
      isActive: true,
    },
    {
      name: 'Enterprise',
      description: 'For large organizations with custom needs',
      price: 0, // Pricing is custom, set to 0 to indicate "Contact Sales"
      billingCycle: 'MONTHLY',
      maxJobPostings: -1, // Unlimited
      maxCandidateViews: -1, // Unlimited
      maxAiAssessments: -1, // Unlimited
      maxSeats: -1, // Unlimited
      unlimitedCandidateViews: true,
      additionalFeatures: JSON.stringify({
        customAIMatchingAlgorithms: true,
        dedicatedSupport24_7: true,
        seamlessATSAndJobBoardConnections: true,
        customAnalyticsAndWhiteLabelReporting: true,
        advancedInterviewToolsWithCustomWorkflows: true,
        completeTeamManagementAndCollaboration: true,
        fullAPIAccess: true,
        customIntegrations: true,
        dedicatedAccountManager: true,
        includesAIRecommendations: true,
        customBranding: true,
      }),
      isDefault: false,
      isActive: true,
    },
  ];

  // Append or update candidate packages
  const candidatePackages = [
    {
      name: 'Free',
      description: 'Basic access for job seekers',
      price: 0,
      billingCycle: 'MONTHLY',
      maxAssessmentsPerMonth: 3,
      maxPracticeAssessments: 1,
      accessToAllSkills: false,
      personalizedFeedback: false,
      careerCoaching: false,
      features: JSON.stringify({
        resumeBuilding: true,
        jobRecommendations: true,
        skillAssessments: 'Basic',
      }),
      isDefault: true,
      isActive: true,
    },
    {
      name: 'Pro',
      description: 'Enhanced tools for serious job seekers',
      price: 19.99,
      billingCycle: 'MONTHLY',
      maxAssessmentsPerMonth: 10,
      maxPracticeAssessments: 5,
      accessToAllSkills: true,
      personalizedFeedback: true,
      careerCoaching: false,
      features: JSON.stringify({
        resumeBuilding: true,
        jobRecommendations: true,
        skillAssessments: 'Advanced',
        priorityApplications: true,
        interviewPrep: true,
      }),
      isDefault: false,
      isActive: true,
    },
    {
      name: 'Premium',
      description: 'Complete career acceleration package',
      price: 49.99,
      billingCycle: 'MONTHLY',
      maxAssessmentsPerMonth: 30,
      maxPracticeAssessments: 15,
      accessToAllSkills: true,
      personalizedFeedback: true,
      careerCoaching: true,
      features: JSON.stringify({
        resumeBuilding: true,
        jobRecommendations: true,
        skillAssessments: 'Expert',
        priorityApplications: true,
        interviewPrep: true,
        careerCoaching: true,
        salaryNegotiation: true,
        exclusiveEvents: true,
      }),
      isDefault: false,
      isActive: true,
    },
  ];

  // Create client subscription packages
  for (const pkg of clientPackages) {
    await prisma.client_subscription_package.create({
      data: pkg,
    });
  }

  // Append candidate packages without deleting existing ones
  for (const pkg of candidatePackages) {
    // Check if package with this name already exists
    const existingPackage =
      await prisma.candidate_subscription_package.findFirst({
        where: { name: pkg.name },
      });

    if (!existingPackage) {
      // Create new package if it doesn't exist
      await prisma.candidate_subscription_package.create({
        data: pkg,
      });
      logger.info(`Created new candidate package: ${pkg.name}`);
    } else {
      // Update existing package
      await prisma.candidate_subscription_package.updateMany({
        where: { name: pkg.name },
        data: pkg,
      });
      logger.info(`Updated existing candidate package: ${pkg.name}`);
    }
  }

  logger.info('Subscription packages processed successfully');
}

main().catch((e) => {
  logger.error('Error seeding production data:', e);
  process.exit(1);
});
