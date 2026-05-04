import { PrismaClient } from '@prisma/client';
import { logger } from '../../src/shared/utils/logger';

const prisma = new PrismaClient();

// Page-specific tour definitions for candidate onboarding
const pageSpecificTours = {
  // Resume page tour
  resume: {
    tourKey: 'candidate_onboarding_resume',
    name: 'Resume Upload Guide',
    description: 'Guide for uploading and reviewing your resume',
    userType: 'CANDIDATE',
    userRole: 'INDIVIDUAL',
    isActive: true,
    priority: 10,
    version: '1.0.0',
    pagePattern: '/app/candidate/onboard/resume',
    targetPages: ['/app/candidate/onboard/resume'],
    triggerConditions: {
      triggerType: 'ON_FIRST_VISIT',
      conditions: {
        pageUrl: '/app/candidate/onboard/resume',
        profileCompleted: false,
      },
      excludeConditions: {
        tourCompleted: ['candidate_onboarding_resume'],
      },
    },
    tourSettings: {
      allowSkip: true,
      allowPause: true,
      autoAdvance: false,
      showProgress: true,
      showNavigation: true,
      theme: 'light',
      restartable: true,
      maxDismissals: 3,
      hideOnCompletion: true,
      allowUserWork: true,
    },
    tourSteps: [
      {
        id: 'resume-welcome',
        title: 'Welcome to Teamcast! 🎉',
        content:
          "Let's start by uploading your resume. This helps us understand your background and match you with relevant opportunities.",
        stepType: 'MODAL',
        targetSelector: '[data-tour="modal-container"]',
        placement: 'center',
        showSkip: true,
        showNext: true,
        showPrevious: false,
        autoAdvance: false,
        isRequired: false,
      },
      {
        id: 'parsing-mode-step',
        title: 'Choose Parsing Mode ⚙️',
        content:
          'Select how you want us to process your resume. Generative mode provides the most comprehensive analysis with AI insights.',
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="parsing-mode-selector"]',
        placement: 'bottom',
        showSkip: true,
        showNext: true,
        showPrevious: true,
        autoAdvance: false,
        isRequired: false,
        actionRequired: {
          type: 'click',
          selector: '[data-tour="parsing-mode-selector"]',
        },
      },
      {
        id: 'resume-upload-area',
        title: 'Upload Your Resume 📄',
        content:
          'Click here to upload your resume. We support PDF files up to 5MB. Your resume will be automatically parsed to extract key information.',
        stepType: 'HIGHLIGHT',
        targetSelector: '[data-tour="resume-upload"]',
        placement: 'right',
        showSkip: true,
        showNext: true,
        showPrevious: true,
        autoAdvance: false,
        isRequired: false,
        actionRequired: {
          type: 'upload',
          selector: '[data-tour="resume-upload"]',
        },
      },
      {
        id: 'resume-skip-option',
        title: 'Skip if Needed 🔄',
        content:
          'You can also skip the resume upload for now and add your information manually. Click here if you prefer to proceed without uploading.',
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="skip-resume-upload"]',
        placement: 'right',
        showSkip: true,
        showNext: false,
        showPrevious: true,
        autoAdvance: false,
        isRequired: false,
        actionRequired: {
          type: 'click',
          selector: '[data-tour="skip-resume-upload"]',
        },
      },
    ],
  },

  // Profile page tour
  profile: {
    tourKey: 'candidate_onboarding_profile',
    name: 'Profile Setup Guide',
    description: 'Guide for completing your professional profile',
    userType: 'CANDIDATE',
    userRole: 'INDIVIDUAL',
    isActive: true,
    priority: 9,
    version: '1.0.0',
    pagePattern: '/app/candidate/onboard/profile',
    targetPages: ['/app/candidate/onboard/profile'],
    triggerConditions: {
      triggerType: 'ON_FIRST_VISIT',
      conditions: {
        pageUrl: '/app/candidate/onboard/profile',
        profileCompleted: false,
      },
      excludeConditions: {
        tourCompleted: ['candidate_onboarding_profile'],
      },
    },
    tourSettings: {
      allowSkip: true,
      allowPause: true,
      autoAdvance: false,
      showProgress: true,
      showNavigation: true,
      theme: 'light',
      restartable: true,
      maxDismissals: 3,
      hideOnCompletion: true,
      allowUserWork: true,
    },
    tourSteps: [
      {
        id: 'profile-welcome',
        title: 'Complete Your Profile',
        content:
          "Now let's complete your professional profile. This information helps employers learn more about you beyond your resume.",
        stepType: 'MODAL',
        targetSelector: '[data-tour="modal-container"]',
        placement: 'center',
        showSkip: true,
        showNext: true,
        showPrevious: false,
        autoAdvance: false,
        isRequired: false,
      },

      {
        id: 'profile-summary',
        title: 'View Your Profile Information',
        content:
          'View your contact information, professional summary, and other details.',
        stepType: 'HIGHLIGHT',
        targetSelector: '[data-tour="profile-card-section"]',
        placement: 'right',
        showSkip: true,
        showNext: true,
        showPrevious: true,
        autoAdvance: false,
        isRequired: false,
        actionRequired: {
          type: 'input',
          selector: '[data-tour="profile-card-section"]',
        },
      },
      {
        id: 'edit_profile',
        title: 'Edit Profile ✍️',
        content:
          'Edit your contact information, professional summary, and other details. This information helps employers learn more about you beyond your resume.',
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="edit-profile-button"]',
        placement: 'bottom',
        showSkip: true,
        showNext: true,
        showPrevious: true,
        autoAdvance: false,
        isRequired: false,
        actionRequired: {
          type: 'click',
          selector: '[data-tour="edit-profile-button"]',
        },
      },
      {
        id: 'profile-complete',
        title: 'Profile Section Complete! ✅',
        content:
          "Great job! You've completed the profile tour. Feel free to continue adding information or proceed to the next step in your onboarding.",
        stepType: 'MODAL',
        targetSelector: '[data-tour="modal-container"]',
        placement: 'center',
        showSkip: false,
        showNext: false,
        showPrevious: true,
        autoAdvance: false,
        isRequired: false,
      },
    ],
  },

  // Experience page tour
  experience: {
    tourKey: 'candidate_onboarding_experience',
    name: 'Experience Guide',
    description: 'Guide for adding your work experience',
    userType: 'CANDIDATE',
    userRole: 'INDIVIDUAL',
    isActive: true,
    priority: 8,
    version: '1.0.0',
    pagePattern: '/app/candidate/onboard/experience',
    targetPages: ['/app/candidate/onboard/experience'],
    triggerConditions: {
      triggerType: 'ON_FIRST_VISIT',
      conditions: {
        pageUrl: '/app/candidate/onboard/experience',
        profileCompleted: false,
      },
      excludeConditions: {
        tourCompleted: ['candidate_onboarding_experience'],
      },
    },
    tourSettings: {
      allowSkip: true,
      allowPause: true,
      autoAdvance: false,
      showProgress: true,
      showNavigation: true,
      theme: 'light',
      restartable: true,
      maxDismissals: 3,
      hideOnCompletion: true,
      allowUserWork: true,
    },
    tourSteps: [
      {
        id: 'experience-welcome',
        title: 'Add Your Work Experience',
        content:
          "Let's add your professional experience. This helps employers understand your career progression and relevant background.",
        stepType: 'MODAL',
        targetSelector: '[data-tour="modal-container"]',
        placement: 'center',
        showSkip: true,
        showNext: true,
        showPrevious: false,
        autoAdvance: false,
        isRequired: false,
      },
      {
        id: 'add-experience-button',
        title: 'Add Experience Button',
        content:
          'Click here to add your work experience. You can add multiple experiences to showcase your career progression.',
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="add-experience-button"]',
        placement: 'right',
        showSkip: true,
        showNext: true,
        showPrevious: true,
        autoAdvance: false,
        isRequired: false,
      },
      {
        id: 'experience-card-details-section',
        title: 'View Your Experience Details',
        content:
          'Each experience entry shows your role details. You can edit or add projects to showcase your work.',
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="experience-card-details-section"]',
        placement: 'right',
        showSkip: true,
        showNext: true,
        showPrevious: true,
        autoAdvance: false,
        isRequired: false,
      },
      {
        id: 'experience-complete',
        title: 'Experience Section Complete! ✅',
        content:
          "Great job! You've set up your work experience. Feel free to add more roles and projects, or proceed to the next step in your onboarding.",
        stepType: 'MODAL',
        targetSelector: '[data-tour="modal-container"]',
        placement: 'right',
        showSkip: false,
        showNext: false,
        showPrevious: true,
        autoAdvance: false,
        isRequired: false,
      },
    ],
  },

  // Education page tour
  education: {
    tourKey: 'candidate_onboarding_education',
    name: 'Education Guide',
    description: 'Guide for adding your educational background',
    userType: 'CANDIDATE',
    userRole: 'INDIVIDUAL',
    isActive: true,
    priority: 7,
    version: '1.0.0',
    pagePattern: '/app/candidate/onboard/education',
    targetPages: ['/app/candidate/onboard/education'],
    triggerConditions: {
      triggerType: 'ON_FIRST_VISIT',
      conditions: {
        pageUrl: '/app/candidate/onboard/education',
        profileCompleted: false,
      },
      excludeConditions: {
        tourCompleted: ['candidate_onboarding_education'],
      },
    },
    tourSettings: {
      allowSkip: true,
      allowPause: true,
      autoAdvance: false,
      showProgress: true,
      showNavigation: true,
      theme: 'light',
      restartable: true,
      maxDismissals: 3,
      hideOnCompletion: true,
      allowUserWork: true,
    },
    tourSteps: [
      {
        id: 'education-welcome',
        title: 'View Your Education',
        content:
          'View your educational background. Include degrees, certifications, and relevant courses that support your career goals.',
        stepType: 'MODAL',
        targetSelector: '[data-tour="modal-container"]',
        placement: 'center',
        showSkip: true,
        showNext: true,
        showPrevious: false,
        autoAdvance: false,
        isRequired: false,
      },
      {
        id: 'education-section-highlight',
        title: 'Education Section 📚',
        content:
          "This is where you'll add your degrees, universities, graduation dates, and academic achievements.",
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="education-section"]',
        placement: 'right',
        showSkip: true,
        showNext: true,
        showPrevious: true,
        autoAdvance: false,
        isRequired: false,
      },
      {
        id: 'certification-section-highlight',
        title: 'Certifications Section 🏆',
        content:
          "Don't forget to add any professional certifications, licenses, or specialized training that showcase your expertise and skills.",
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="certification-section"]',
        placement: 'right',
        showSkip: true,
        showNext: true,
        showPrevious: true,
        autoAdvance: false,
        isRequired: false,
      },
      {
        id: 'education-complete',
        title: 'Education Section Complete! ✅',
        content:
          "Great job! You've set up your education section. Feel free to add more degrees and certifications, or proceed to the next step in your onboarding.",
        stepType: 'MODAL',
        targetSelector: '[data-tour="modal-container"]',
        placement: 'center',
        showSkip: false,
        showNext: false,
        showPrevious: true,
        autoAdvance: false,
        isRequired: false,
      },
    ],
  },

  // Preferences page tour
  preferences: {
    tourKey: 'candidate_onboarding_preferences',
    name: 'Job Preferences Guide',
    description: 'Guide for setting your job preferences',
    userType: 'CANDIDATE',
    userRole: 'INDIVIDUAL',
    isActive: true,
    priority: 6,
    version: '1.0.0',
    pagePattern: '/app/candidate/onboard/preferences',
    targetPages: ['/app/candidate/onboard/preferences'],
    triggerConditions: {
      triggerType: 'ON_FIRST_VISIT',
      conditions: {
        pageUrl: '/app/candidate/onboard/preferences',
        profileCompleted: false,
      },
      excludeConditions: {
        tourCompleted: ['candidate_onboarding_preferences'],
      },
    },
    tourSettings: {
      allowSkip: true,
      allowPause: true,
      autoAdvance: false,
      showProgress: true,
      showNavigation: true,
      theme: 'light',
      restartable: true,
      maxDismissals: 3,
      hideOnCompletion: true,
      allowUserWork: true,
    },
    tourSteps: [
      {
        id: 'preferences-welcome',
        title: 'Set Your Job Preferences ⚙️',
        content:
          "Finally, let's set your job preferences to help us match you with the most relevant opportunities.",
        stepType: 'MODAL',
        targetSelector: '[data-tour="modal-container"]',
        placement: 'center',
        showSkip: true,
        showNext: true,
        showPrevious: false,
        autoAdvance: false,
        isRequired: false,
      },
      {
        id: 'professional-profile-highlight',
        title: 'Professional Profile Section 👨‍💼',
        content:
          'This section contains your professional details and achievements. Review and edit your information to showcase your expertise.',
        stepType: 'HIGHLIGHT',
        targetSelector: '[data-tour="professional-profile-section"]',
        placement: 'right',
        showSkip: true,
        showNext: true,
        showPrevious: true,
        autoAdvance: false,
        isRequired: false,
      },
      {
        id: 'job-preferences-highlight',
        title: 'Job Preferences Section 🎯',
        content:
          'Complete your job preferences to get matched with relevant opportunities. This includes locations, industries, and work types.',
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="job-preferences-section"]',
        placement: 'right',
        showSkip: true,
        showNext: true,
        showPrevious: true,
        autoAdvance: false,
        isRequired: true,
      },
      {
        id: 'preferences-complete',
        title: 'Onboarding Complete! 🎉',
        content:
          "You've successfully completed your onboarding! Your profile is now ready, and you can start exploring job opportunities. Welcome to Teamcast!",
        stepType: 'MODAL',
        targetSelector: '[data-tour="modal-container"]',
        placement: 'right',
        showSkip: false,
        showNext: false,
        showPrevious: true,
        autoAdvance: false,
        isRequired: false,
      },
    ],
  },
};

export async function createPageSpecificOnboardingTours() {
  try {
    logger.info(
      'Creating page-specific candidate onboarding tour definitions...'
    );

    for (const [pageName, tourData] of Object.entries(pageSpecificTours)) {
      logger.info(`Processing ${pageName} tour...`);

      // Check if tour already exists
      const existingTour = await prisma.tour_definition.findUnique({
        where: { tourKey: tourData.tourKey },
      });

      // Convert string enums to Prisma enums
      const prismaTourData = {
        ...tourData,
        userType: tourData.userType as any,
        userRole: tourData.userRole as any,
      };

      if (existingTour) {
        logger.info(`Tour ${tourData.tourKey} already exists, updating...`);
        await prisma.tour_definition.update({
          where: { tourKey: tourData.tourKey },
          data: prismaTourData,
        });
        logger.info(`Tour ${tourData.tourKey} updated successfully!`);
      } else {
        logger.info(`Creating new tour ${tourData.tourKey}...`);
        await prisma.tour_definition.create({
          data: prismaTourData,
        });
        logger.info(`Tour ${tourData.tourKey} created successfully!`);
      }
    }

    // Deactivate the old monolithic tour
    const oldTour = await prisma.tour_definition.findUnique({
      where: { tourKey: 'candidate_onboarding' },
    });

    if (oldTour) {
      logger.info('Deactivating old monolithic tour...');
      await prisma.tour_definition.update({
        where: { tourKey: 'candidate_onboarding' },
        data: { isActive: false },
      });
      logger.info('Old tour deactivated successfully!');
    }

    return true;
  } catch (error) {
    logger.error('Error creating page-specific tour definitions:', error);
    return false;
  }
}
