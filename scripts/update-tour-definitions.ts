/// <reference types="node" />

import { PrismaClient } from '@prisma/client';
import { logger } from '../src/shared/utils/logger';

const prisma = new PrismaClient();

// Define the tour step interface to match Prisma schema
interface ITourStep {
  id: string;
  title: string;
  content: string;
  stepType: string;
  targetSelector?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  showSkip?: boolean;
  showNext?: boolean;
  showPrevious?: boolean;
  autoAdvance?: boolean;
  autoAdvanceDelay?: number;
  isRequired?: boolean;
  prerequisites?: string[];
  actionRequired?: {
    type: 'click' | 'input' | 'navigate' | 'upload' | 'submit';
    selector?: string;
    value?: string;
    url?: string;
  };
  mediaUrl?: string;
  customData?: Record<string, any>;
}

// Define the tour definition interface
interface ITourDefinition {
  name: string;
  description?: string;
  userType: string;
  userRole?: string;
  isActive: boolean;
  priority: number;
  version: string;
  pagePattern: string;
  targetPages: string[];
  triggerConditions: {
    triggerType: string;
    conditions: Record<string, any>;
    excludeConditions: Record<string, any>;
  };
  tourSteps: ITourStep[];
  tourSettings: {
    allowSkip: boolean;
    allowPause: boolean;
    autoAdvance: boolean;
    showProgress: boolean;
    showNavigation: boolean;
    theme: string;
    restartable: boolean;
    maxDismissals: number;
    hideOnCompletion: boolean;
    allowUserWork: boolean;
  };
  tourGroup?: string; // Group identifier for skip/dismiss behavior
}

// Updated tour definitions with new content but preserving existing IDs
const updatedTourDefinitions: Record<string, ITourDefinition> = {
  // Resume page tour
  candidate_onboarding_resume: {
    name: 'Resume Upload Guide',
    description:
      'Guide for uploading and reviewing your resume with improved UX',
    userType: 'CANDIDATE',
    userRole: 'INDIVIDUAL',
    isActive: true,
    priority: 10,
    version: '1.1.0',
    pagePattern: '/app/candidate/onboard/resume',
    targetPages: ['/app/candidate/onboard/resume'],
    tourGroup: 'candidate_onboarding', // Group all candidate onboarding tours together
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
        id: 'parsing-mode-step',
        title: 'Choose Parsing Mode ⚙️',
        content:
          'Select how you want us to process your resume. Generative mode provides the most comprehensive analysis with AI insights.',
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="parsing-mode-selector"]',
        placement: 'bottom',
        showSkip: true,
        showNext: true,
        showPrevious: false,
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
        stepType: 'TOOLTIP',
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
  candidate_onboarding_profile: {
    name: 'Profile Setup Guide',
    description:
      'Guide for completing your professional profile with better navigation',
    userType: 'CANDIDATE',
    userRole: 'INDIVIDUAL',
    isActive: true,
    priority: 9,
    version: '1.1.0',
    pagePattern: '/app/candidate/onboard/profile',
    targetPages: ['/app/candidate/onboard/profile'],
    tourGroup: 'candidate_onboarding', // Group all candidate onboarding tours together
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
        id: 'profile-summary',
        title: 'View Your Profile Information',
        content:
          'View your contact information, professional summary, and other details.',
        stepType: 'HIGHLIGHT',
        targetSelector: '[data-tour="profile-card-section"]',
        placement: 'right',
        showSkip: true,
        showNext: true,
        showPrevious: false,
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
        showNext: false,
        showPrevious: true,
        autoAdvance: false,
        isRequired: false,
        actionRequired: {
          type: 'click',
          selector: '[data-tour="edit-profile-button"]',
        },
      },
    ],
  },

  // Experience page tour
  candidate_onboarding_experience: {
    name: 'Experience Guide',
    description:
      'Guide for adding your work experience with improved project highlighting',
    userType: 'CANDIDATE',
    userRole: 'INDIVIDUAL',
    isActive: true,
    priority: 8,
    version: '1.1.0',
    pagePattern: '/app/candidate/onboard/experience',
    targetPages: ['/app/candidate/onboard/experience'],
    tourGroup: 'candidate_onboarding', // Group all candidate onboarding tours together
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
        id: 'add-experience-button',
        title: 'Add Experience Button',
        content:
          'Click here to add your work experience. You can add multiple experiences to showcase your career progression.',
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="add-experience-button"]',
        placement: 'right',
        showSkip: true,
        showNext: true,
        showPrevious: false,
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
        showNext: false,
        showPrevious: true,
        autoAdvance: false,
        isRequired: false,
      },
    ],
  },

  // Education page tour
  candidate_onboarding_education: {
    name: 'Education Guide',
    description:
      'Guide for adding your educational background with certification focus',
    userType: 'CANDIDATE',
    userRole: 'INDIVIDUAL',
    isActive: true,
    priority: 7,
    version: '1.1.0',
    pagePattern: '/app/candidate/onboard/education',
    targetPages: ['/app/candidate/onboard/education'],
    tourGroup: 'candidate_onboarding', // Group all candidate onboarding tours together
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
        id: 'education-section-highlight',
        title: 'Education Section 📚',
        content:
          "This is where you'll add your degrees, universities, graduation dates, and academic achievements.",
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="education-section"]',
        placement: 'right',
        showSkip: true,
        showNext: true,
        showPrevious: false,
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
        showNext: false,
        showPrevious: true,
        autoAdvance: false,
        isRequired: false,
      },
    ],
  },

  // Preferences page tour
  candidate_onboarding_preferences: {
    name: 'Job Preferences Guide',
    description:
      'Guide for setting your job preferences with better section highlighting',
    userType: 'CANDIDATE',
    userRole: 'INDIVIDUAL',
    isActive: true,
    priority: 6,
    version: '1.1.0',
    pagePattern: '/app/candidate/onboard/preferences',
    targetPages: ['/app/candidate/onboard/preferences'],
    tourGroup: 'candidate_onboarding', // Group all candidate onboarding tours together
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
        id: 'professional-profile-highlight',
        title: 'Professional Profile Section 👨‍💼',
        content:
          'This section contains your professional details and achievements. Review and edit your information to showcase your expertise.',
        stepType: 'HIGHLIGHT',
        targetSelector: '[data-tour="professional-profile-section"]',
        placement: 'right',
        showSkip: true,
        showNext: true,
        showPrevious: false,
        autoAdvance: false,
        isRequired: false,
      },
      {
        id: 'job-preferences-highlight',
        title: 'Job Preferences Section 🎯',
        content:
          'Complete your job preferences to get matched with relevant opportunities. This includes locations, industries, and work types.',
        stepType: 'HIGHLIGHT',
        targetSelector: '[data-tour="job-preferences-section"]',
        placement: 'right',
        showSkip: true,
        showNext: false,
        showPrevious: true,
        autoAdvance: false,
        isRequired: true,
      },
    ],
  },

  /////////////////////////////////
  ////Candidate-Dashbaord-Tour/////
  //////////////////////////////////
  candidate_dashboard_tour: {
    name: 'Candidate Dashboard Tour',
    description:
      'A guided walkthrough of the candidate dashboard to help you get started.',
    userType: 'CANDIDATE',
    userRole: 'INDIVIDUAL',
    isActive: true,
    priority: 1,
    version: '1.1.0',
    pagePattern: '/app/candidate/dashboard',
    targetPages: ['/app/candidate/dashboard'],
    triggerConditions: {
      triggerType: 'ON_FIRST_VISIT',
      conditions: {
        pageUrl: '/app/candidate/dashboard',
        profileCompleted: false,
      },
      excludeConditions: {
        tourCompleted: ['candidate_dashboard_tour'],
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
        id: 'complete-assessment-highlight',
        title: '📑 Complete Your Assessment',
        content:
          'Start by completing your assessment. This helps us match you with the most relevant opportunities.',
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="complete-assessment-button"]',
        placement: 'right',
        showSkip: true,
        showNext: true,
        showPrevious: false,
      },
      {
        id: 'dashboard-analytics-highlight',
        title: '📊 Track Your Analytics',
        content:
          'Here you can view your total applications, applications in progress, success rate, and shortlisted counts. Stay informed on your progress at a glance.',
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="dashboard-analytics-section"]',
        placement: 'bottom',
        showSkip: true,
        showNext: true,
        showPrevious: true,
      },
      {
        id: 'recommended-jobs-highlight',
        title: '💼 Recommended Jobs',
        content:
          'Discover tailored job recommendations here. Review and apply to opportunities that best fit your profile.',
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="recommended-jobs-container"]',
        placement: 'right',
        showSkip: true,
        showNext: true,
        showPrevious: true,
      },
      {
        id: 'applications-status-highlight',
        title: '📂 Application Status & Activities',
        content:
          'Track all your application statuses and recent activities here. Stay updated on every step of your journey.',
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="application-status-section"]',
        placement: 'left',
        showSkip: true,
        showNext: true,
        showPrevious: true,
      },
      {
        id: 'profile-overview-highlight',
        title: '👤 Profile Overview',
        content:
          'Your profile summary lives here — including experience, education, skills, degrees, and certifications. Keep it updated to maximize visibility.',
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="profile-overview-section"]',
        placement: 'top',
        showSkip: true,
        showNext: true,
        showPrevious: true,
      },
      {
        id: 'assessment-results-highlight',
        title: '📝 Assessment Results',
        content:
          'View your Résumé Assessment and Onboarding Assessment results here. These insights help you understand strengths and areas for improvement.',
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="assessment-results-section"]',
        placement: 'top',
        showSkip: true,
        showNext: true,
        showPrevious: true,
      },
      {
        id: 'resume-page-tooltip',
        title: '📄 Enhance Your Résumé',
        content:
          'Click here in the sidebar to access your résumé page. Update your details, add certifications, and showcase your achievements.',
        stepType: 'SIDEBAR_TOOLTIP',
        targetSelector: '[data-tour="sidebar-resume-link"]',
        placement: 'right',
        showSkip: true,
        showNext: true,
        showPrevious: true,
      },
      {
        id: 'applications-page-tooltip',
        title: '📄 Applications',
        content:
          'Click here in the sidebar to access your applications page. View all your applications, including those in progress and completed.',
        stepType: 'SIDEBAR_TOOLTIP',
        targetSelector: '[data-tour="sidebar-applications-link"]',
        placement: 'right',
        showSkip: true,
        showNext: true,
        showPrevious: true,
      },
      {
        id: 'jobs-page-tooltip',
        title: '🎯 Recommended Jobs',
        content:
          'Click here in the sidebar to access your jobs page. Get Reccomended Jobs that are curated for you based on your profile.',
        stepType: 'SIDEBAR_TOOLTIP',
        targetSelector: '[data-tour="sidebar-jobs-link"]',
        placement: 'right',
        showSkip: true,
        showNext: true,
        showPrevious: true,
      },
      {
        id: 'invites-page-tooltip',
        title: '📬 Job Invites',
        content:
          'Click here in the sidebar to access your invite friends page. Share your referral link with your friends to earn rewards.',
        stepType: 'SIDEBAR_TOOLTIP',
        targetSelector: '[data-tour="sidebar-job-invites-link"]',
        placement: 'right',
        showSkip: true,
        showNext: true,
        showPrevious: true,
      },
      {
        id: 'interviews-page-tooltip',
        title: '📅 Interviews',
        content:
          'Click here in the sidebar to access your interviews page. View all your interviews, including Scheduled and Completed.',
        stepType: 'SIDEBAR_TOOLTIP',
        targetSelector: '[data-tour="sidebar-interviews-link"]',
        placement: 'right',
        showSkip: true,
        showNext: true,
        showPrevious: true,
      },
      {
        id: 'chat-page-tooltip',
        title: '💬 Chat with Client and Connection',
        content:
          'Click here in the sidebar to access your chat page. Chat with your client and connection to get help with your profile, jobs, and more.',
        stepType: 'SIDEBAR_TOOLTIP',
        targetSelector: '[data-tour="sidebar-chat-link"]',
        placement: 'right',
        showSkip: true,
        showNext: false,
        showPrevious: true,
      },
    ],
  },

  /////////////////////////////////
  ////Candidate-Resume-Page-Tour-Guide/////
  //////////////////////////////////
  candidate_resume_page_tour_guide: {
    name: 'Resume Page Tour Guide',
    description:
      'A comprehensive guided walkthrough of the resume page interface to help candidates understand how to navigate and manage their profile effectively.',
    userType: 'CANDIDATE',
    userRole: 'INDIVIDUAL',
    isActive: true,
    priority: 1,
    version: '1.1.0',
    pagePattern: '/app/candidate/resume',
    targetPages: ['/app/candidate/resume'],
    triggerConditions: {
      triggerType: 'ON_FIRST_VISIT',
      conditions: {
        pageUrl: '/app/candidate/resume',
        profileCompleted: false,
      },
      excludeConditions: {
        tourCompleted: ['candidate_resume_page_tour_guide'],
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
        id: 'profile-photo-section-highlight',
        title: '📋 Profile Photo Section',
        content:
          'Profile Photo is Required to complete the Resume assessment. Make sure to upload a clear, professional photo.',
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="profile-photo-section"]',
        placement: 'bottom',
        showSkip: true,
        showNext: true,
        showPrevious: false,
        autoAdvance: false,
        isRequired: true,
      },
      {
        id: 'professional-summary-section-highlight',
        title: '📝 Professional Summary Section',
        content:
          'This section displays your professional summary. You can edit it to better reflect your career goals and expertise.',
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="professional-summary-section"]',
        placement: 'bottom',
        showSkip: true,
        showNext: true,
        showPrevious: true,
        autoAdvance: false,
        isRequired: false,
      },
      {
        id: 'professional-summary-edit-button-highlight',
        title: '✏️ Edit Professional Summary',
        content:
          'Click this button to edit your professional summary. Keep it updated to showcase your skills and experience effectively.',
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="professional-summary-edit-button"]',
        placement: 'bottom',
        showSkip: true,
        showNext: true,
        showPrevious: true,
        autoAdvance: false,
        isRequired: false,
      },
      {
        id: 'resume-assessment-section-highlight',
        title: '📊 Resume Assessment Section',
        content:
          'This section shows your resume assessment status and results. Complete the assessment to get detailed insights about your profile.',
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="resume-assessment-section"]',
        placement: 'bottom',
        showSkip: true,
        showNext: true,
        showPrevious: true,
        autoAdvance: false,
        isRequired: false,
      },
      {
        id: 'resume-assessment-start-button-highlight',
        title: '🚀 Start Resume Assessment',
        content:
          'Click here to start your resume assessment. This will be enabled once you have uploaded a profile photo and completed at least 80% of your profile.',
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="resume-assessment-start-button"]',
        placement: 'top',
        showSkip: true,
        showNext: true,
        showPrevious: true,
        autoAdvance: false,
        isRequired: false,
      },
      {
        id: 'screening-assessment-section-highlight',
        title: '🎯 Screening Assessment Section',
        content:
          'This section shows your screening assessment status. This assessment evaluates your skills and experience to match you with relevant opportunities.',
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="screening-assessment-section"]',
        placement: 'right',
        showSkip: true,
        showNext: true,
        showPrevious: true,
        autoAdvance: false,
        isRequired: false,
      },
      {
        id: 'screening-assessment-start-button-highlight',
        title: '🚀 Start Screening Assessment',
        content:
          'Click here to start your screening assessment. This will be available after you complete the resume assessment.',
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="screening-assessment-start-button"]',
        placement: 'top',
        showSkip: true,
        showNext: true,
        showPrevious: true,
        autoAdvance: false,
        isRequired: false,
      },
      {
        id: 'professional-details-section-highlight',
        title: '👔 Professional Details Section',
        content:
          'This section contains your detailed professional information including experience, education, and certifications.',
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="professional-details-section"]',
        placement: 'top',
        showSkip: true,
        showNext: false,
        showPrevious: true,
        autoAdvance: false,
        isRequired: false,
      },
    ],
  },

  /////////////////////////////////
  ////Candidate-Onboarding-Assessment-Check-Tour/////
  //////////////////////////////////
  candidate_onboarding_assessment_check_tour: {
    name: 'Onboarding Assessment Check Tour',
    description:
      'A guided walkthrough of the onboarding assessment system check page to help candidates understand the assessment process and system requirements.',
    userType: 'CANDIDATE',
    userRole: 'INDIVIDUAL',
    isActive: true,
    priority: 1,
    version: '1.2.0',
    pagePattern: '/app/candidate/assessments/onboarding/check',
    targetPages: ['/app/candidate/assessments/onboarding/check'],
    triggerConditions: {
      triggerType: 'ON_FIRST_VISIT',
      conditions: {
        pageUrl: '/app/candidate/assessments/onboarding/check',
        profileCompleted: false,
      },
      excludeConditions: {
        tourCompleted: ['candidate_onboarding_assessment_check_tour'],
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
        id: 'assessment-title-highlight',
        title: '📋 Assessment Title & Description',
        content:
          'This is your "Screening Interview" - an assessment designed to evaluate your skills and experience to match you with the best opportunities.',
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="assessment-title-section"]',
        placement: 'right',
        showSkip: true,
        showNext: true,
        showPrevious: false,
        autoAdvance: false,
        isRequired: false,
      },
      {
        id: 'terms-and-conditions-section',
        title: '📜 Terms and Conditions',
        content:
          'Please read and accept the terms and conditions before starting your assessment. This includes consent for recording and data usage.',
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="terms-and-conditions-section"]',
        placement: 'left',
        showSkip: true,
        showNext: true,
        showPrevious: true,
        autoAdvance: false,
        isRequired: false,
      },
      {
        id: 'system-check-summary-section',
        title: '✅ System Check Summary',
        content:
          'This section shows the status of all system requirements. All Checks Must be passsed to begin the Assessment!.',
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="system-check-summary-section"]',
        placement: 'right',
        showSkip: true,
        showNext: true,
        showPrevious: true,
        autoAdvance: false,
        isRequired: true,
      },
      {
        id: 'accept-terms-and-conditions-section',
        title: '⚙️ Accept Terms and Conditions',
        content:
          'Please read and accept the terms and conditions before starting your assessment. This includes consent for recording and data usage.',
        stepType: 'HIGHLIGHT',
        targetSelector: '[data-tour="accept-terms-and-conditions-button"]',
        placement: 'bottom',
        showSkip: true,
        showNext: false,
        showPrevious: true,
        autoAdvance: false,
        isRequired: true,
      },
    ],
  },

  /////////////////////////////////
  ////Candidate-Onboarding-Assessment-Tour-Guide/////
  //////////////////////////////////
  candidate_onboarding_assessment_tour_guide: {
    name: 'Onboarding Assessment Tour Guide',
    description:
      'A comprehensive guided walkthrough of the onboarding assessment interface to help candidates understand how to navigate and complete their assessment effectively.',
    userType: 'CANDIDATE',
    userRole: 'INDIVIDUAL',
    isActive: true,
    priority: 1,
    version: '1.0.0',
    pagePattern: '/app/candidate/assessments/onboarding/tour-guide',
    targetPages: ['/app/candidate/assessments/onboarding/tour-guide'],
    triggerConditions: {
      triggerType: 'ON_FIRST_VISIT',
      conditions: {
        pageUrl: '/app/candidate/assessments/onboarding/tour-guide',
        profileCompleted: false,
      },
      excludeConditions: {
        tourCompleted: ['candidate_onboarding_assessment_tour_guide'],
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
        id: 'section-navigation-highlight',
        title: '📋 Section Navigation',
        content:
          "This area shows your current section and progress. You can see which section you're on and what's coming next. The numbered circles indicate your progress through the assessment.",
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="section-navigation"]',
        placement: 'bottom',
        showSkip: true,
        showNext: true,
        showPrevious: false,
        autoAdvance: false,
        isRequired: false,
      },
      {
        id: 'proctoring-status-highlight',
        title: '🔒 Proctoring Status',
        content:
          'Proctoring is enabled. It will detect tab switching, screen sharing, and more. It will not be visible in the UI, but you will be automatically monitored by a proctor during the assessment.',
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="proctoring-status-section"]',
        placement: 'bottom',
        showSkip: true,
        showNext: true,
        showPrevious: true,
        autoAdvance: false,
        isRequired: false,
      },
      {
        id: 'end-assessment-button-highlight',
        title: '⏹️ End Assessment Button',
        content:
          'This button allows you to end your assessment early if needed. Use it only if you must stop the assessment - your progress will be saved automatically.',
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="end-assessment-button"]',
        placement: 'bottom',
        showSkip: true,
        showNext: true,
        showPrevious: true,
        autoAdvance: false,
        isRequired: false,
      },
      {
        id: 'duration-section-highlight',
        title: '⏰ Assessment Timer',
        content:
          'This timer shows how much time you have remaining. It will turn red and pulse when time is running low. Keep an eye on it to manage your time effectively across all questions.',
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="duration-section"]',
        placement: 'bottom',
        showSkip: true,
        showNext: true,
        showPrevious: true,
        autoAdvance: false,
        isRequired: false,
      },
      {
        id: 'current-question-section-highlight',
        title: '❓ Current Question Display',
        content:
          'This area shows the current question you need to answer. Read the question carefully and understand what is being asked before proceeding to answer.',
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="current-question-section"]',
        placement: 'right',
        showSkip: true,
        showNext: true,
        showPrevious: true,
        autoAdvance: false,
        isRequired: false,
      },
      {
        id: 'speech-recognition-status-highlight',
        title: '🎤 Voice Response Interface',
        content:
          "For voice-based questions, you'll see this interface. It shows your transcript and allows you to record your spoken responses. Make sure to speak clearly and at a good pace.",
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="speech-recognition-status"]',
        placement: 'right',
        showSkip: true,
        showNext: true,
        showPrevious: true,
        autoAdvance: false,
        isRequired: false,
      },
      {
        id: 'continue-to-next-question-button-highlight',
        title: '➡️ Continue Button',
        content:
          "Once you've completed your answer, click this button to submit and move to the next question. Make sure you're satisfied with your response before proceeding.",
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="continue-to-next-question-button"]',
        placement: 'top',
        showSkip: true,
        showNext: true,
        showPrevious: true,
        autoAdvance: false,
        isRequired: false,
      },
      {
        id: 'video-card-highlight',
        title: '🧑‍💻 Face Detection',
        content:
          'Please keep your Face Visible and in Clear Background. It will be used For face Detection, if you move your face out of the frame, you will be Warned.',
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="video-card"]',
        placement: 'top',
        showSkip: true,
        showNext: false,
        showPrevious: true,
        autoAdvance: false,
        isRequired: false,
      },
    ],
  },

  /////////////////////////////////
  ////Client-job-basic-info-tour/////
  //////////////////////////////////
  client_job_basic_info_tour: {
    name: 'Essential Job Details',
    description:
      'Craft the foundation of your job posting with compelling details that attract the right candidates.',
    userType: 'CLIENT',
    userRole: 'ADMIN',
    isActive: true,
    priority: 3,
    version: '1.1.0',
    pagePattern: '/app/client/recruiter/sourcing',
    targetPages: ['/app/client/recruiter/sourcing'],
    triggerConditions: {
      triggerType: 'ON_SECTION_VISIT',
      conditions: {
        pageUrl: '/app/client/recruiter/sourcing',
        dialogSection: 'basic-info',
        profileCompleted: false,
      },
      excludeConditions: {
        tourCompleted: ['client_job_basic_info_tour'],
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
        id: 'basic-info',
        title: '🎯 Job Title',
        content:
          'Write a clear, specific job title. Use "Senior Frontend Developer" instead of just "Developer".',
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="basic-info-section"]',
        placement: 'right',
        showSkip: true,
        showNext: true,
        showPrevious: false,
        autoAdvance: false,
        isRequired: true,
        actionRequired: {
          type: 'input',
          selector: '[data-tour="basic-info-section"]',
        },
      },
      {
        id: 'job-specification',
        title: '📖 Job Details',
        content:
          'Describe the role, responsibilities, and what makes this opportunity special. Include company culture and growth opportunities.',
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="job-specification-section"]',
        placement: 'right',
        showSkip: true,
        showNext: true,
        showPrevious: true,
        autoAdvance: false,
        isRequired: true,
        actionRequired: {
          type: 'input',
          selector: '[data-tour="job-specification-section"]',
        },
      },
      {
        id: 'job-compensation',
        title: '💰 Compensation',
        content:
          'Set clear salary range, benefits, and perks. Transparency attracts better candidates.',
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="compensation-section"]',
        placement: 'right',
        showSkip: true,
        showNext: true,
        showPrevious: true,
        autoAdvance: false,
        isRequired: true,
        actionRequired: {
          type: 'input',
          selector: '[data-tour="compensation-section"]',
        },
      },
      {
        id: 'job-skills',
        title: '🛠️ Define Required Skills',
        content:
          'List core technologies, frameworks, and experience levels. Be specific to help AI match the right candidates.',
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="skills-section"]',
        placement: 'right',
        showSkip: true,
        showNext: true,
        showPrevious: true,
        autoAdvance: false,
        isRequired: true,
        actionRequired: {
          type: 'input',
          selector: '[data-tour="skills-section"]',
        },
      },
      {
        id: 'preferred-qualifications',
        title: '⭐ Preferred Qualifications',
        content:
          'Add nice-to-have skills like advanced certifications, leadership experience, or specialized knowledge.',
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="preferred-qualifications-section"]',
        placement: 'right',
        showSkip: true,
        showNext: true,
        showPrevious: true,
        autoAdvance: false,
        isRequired: true,
        actionRequired: {
          type: 'input',
          selector: '[data-tour="preferred-qualifications-section"]',
        },
      },
      {
        id: 'ai-assessment-settings',
        title: '🤖 Configure Your AI Assessment',
        content:
          'Configure automated screening, bias reduction, and security measures. Start with defaults and customize as needed.',
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="ai-assessment-settings-section"]',
        placement: 'right',
        showSkip: true,
        showNext: true,
        showPrevious: true,
        autoAdvance: false,
        isRequired: true,
        actionRequired: {
          type: 'input',
          selector: '[data-tour="ai-assessment-settings-section"]',
        },
      },
      {
        id: 'next-button',
        title: '🚀 Next Button',
        content:
          'Click the Next button to proceed to the next section. Please ensure all required fields in this section are completed before continuing.',
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="next-button"]',
        placement: 'left',
        showSkip: true,
        showNext: false,
        showPrevious: true,
        autoAdvance: false,
        isRequired: true,
        actionRequired: {
          type: 'input',
          selector: '[data-tour="next-button"]',
        },
      },
    ],
  },
  /////////////////////////////////
  ////Client-job-sourcing-page-tour/////
  //////////////////////////////////
  client_job_sourcing_page_tour: {
    name: 'Essential Job Details',
    description:
      'Craft the foundation of your job posting with compelling details that attract the right candidates.',
    userType: 'CLIENT',
    userRole: 'ADMIN',
    isActive: true,
    priority: 3,
    version: '1.1.0',
    pagePattern: '/app/client/recruiter/sourcing',
    targetPages: ['/app/client/recruiter/sourcing'],
    triggerConditions: {
      triggerType: 'ON_SECTION_VISIT',
      conditions: {
        pageUrl: '/app/client/recruiter/sourcing',
      },
      excludeConditions: {
        tourCompleted: ['client_job_sourcing_page_tour'],
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
        id: 'publish-job-button',
        title: '🚀 Publish Job Button',
        content:
          'Click the **Publish Job** button to make your job posting visible to candidates. Before publishing, ensure your job description is complete, accurate, and free of missing details.',
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="publish-job-button"]',
        placement: 'right',
        showSkip: true,
        showNext: true,
        showPrevious: false,
        autoAdvance: false,
        isRequired: true,
        actionRequired: {
          type: 'input',
          selector: '[data-tour="publish-job-button"]',
        },
      },
      {
        id: 'job-card',
        title: '🚀 Job Card',
        content:
          'Click the **Job Card** to view all details of your job posting. You can track and manage the entire job process from here.',
        stepType: 'HIGHLIGHT',
        targetSelector: '[data-tour="job-card"]',
        placement: 'top',
        showSkip: true,
        showNext: false,
        showPrevious: false,
        autoAdvance: false,
        isRequired: true,
        actionRequired: {
          type: 'click',
          selector: '[data-tour="job-card"]',
        },
      },
    ],
  },
  /////////////////////////////////
  ////Client-job-details-page-tour/////
  //////////////////////////////////
  client_job_details_page_tour: {
    name: 'Job Details Management',
    description:
      'Navigate through different tabs to manage your hiring pipeline effectively.',
    userType: 'CLIENT',
    userRole: 'ADMIN',
    isActive: true,
    priority: 4,
    version: '1.1.0',
    pagePattern: '/app/client/recruiter/sourcing',
    targetPages: ['/app/client/recruiter/sourcing'],
    triggerConditions: {
      triggerType: 'ON_FIRST_VISIT',
      conditions: {
        pageUrl: '/app/client/recruiter/sourcing',
        hasSelectedJob: true,
      },
      excludeConditions: {
        tourCompleted: ['client_job_details_page_tour'],
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
        id: 'sourced-candidates-section',
        title: '📋 Sourced Candidates',
        content:
          'This section displays candidates who are integrated or sourced from different platforms other than Teamcast AI. These candidates come from external job boards, LinkedIn, or other recruitment platforms.',
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="sourced-candidates-tab"]',
        placement: 'bottom',
        showSkip: true,
        showNext: true,
        showPrevious: false,
        autoAdvance: false,
        isRequired: false,
      },
      {
        id: 'recommendations-section',
        title: '🎯 AI Recommendations',
        content:
          'This section displays recommended candidates that match best to your job posting requirements by skills, preferred location, experience, and other criteria. These are AI-powered matches based on your job specifications.',
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="recommendations-tab"]',
        placement: 'bottom',
        showSkip: true,
        showNext: true,
        showPrevious: true,
        autoAdvance: false,
        isRequired: false,
      },
      {
        id: 'in-progress-tab',
        title: '🎯 In Progress Tab',
        content:
          'The In Progress tab displays candidates who are currently being reviewed by the hiring team. You can view their profiles, track their progress, and manage their interview process.',
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="in-progress-tab"]',
        placement: 'bottom',
        showSkip: true,
        showNext: true,
        showPrevious: true,
        autoAdvance: false,
        isRequired: false,
      },
      {
        id: 'hired-tab',
        title: '🔄 Hired Tab',
        content:
          'The Hired tab displays candidates who have been hired for this job. You can view their profiles, track their progress, and manage their onboarding.',
        stepType: 'TOOLTIP',
        targetSelector: '[data-tour="hired-tab"]',
        placement: 'bottom',
        showSkip: true,
        showNext: false,
        showPrevious: true,
        autoAdvance: false,
        isRequired: false,
      },
    ],
  },
};

/**
 * Gracefully closes the database connection and handles process exit
 */
async function gracefulExit(exitCode: number = 0): Promise<never> {
  try {
    logger.info('Closing database connection...');
    await prisma.$disconnect();
    logger.info('Database connection closed successfully');
  } catch (error) {
    logger.error('Error closing database connection:', error);
  } finally {
    process.exit(exitCode);
  }
}

/**
 * Main function to upsert tour definitions
 */
async function upsertTourDefinitions() {
  try {
    logger.info('Starting tour definitions upsert...');

    let upsertedCount = 0;
    let errorCount = 0;

    for (const [tourKey, tourData] of Object.entries(updatedTourDefinitions)) {
      try {
        logger.info(`Processing tour: ${tourKey}`);

        // Upsert tour definition (create if not exists, update if exists)
        const upsertedTour = await prisma.tour_definition.upsert({
          where: { tourKey },
          update: {
            name: tourData.name,
            description: tourData.description,
            userType: tourData.userType as any,
            userRole: tourData.userRole as any,
            isActive: tourData.isActive,
            priority: tourData.priority,
            version: tourData.version,
            pagePattern: tourData.pagePattern,
            targetPages: tourData.targetPages,
            triggerConditions: tourData.triggerConditions as any,
            tourSteps: tourData.tourSteps as any,
            tourSettings: tourData.tourSettings as any,
            tourGroup: tourData.tourGroup || null,
            updatedAt: new Date(),
          },
          create: {
            tourKey,
            name: tourData.name,
            description: tourData.description,
            userType: tourData.userType as any,
            userRole: tourData.userRole as any,
            isActive: tourData.isActive,
            priority: tourData.priority,
            version: tourData.version,
            pagePattern: tourData.pagePattern,
            targetPages: tourData.targetPages,
            triggerConditions: tourData.triggerConditions as any,
            tourSteps: tourData.tourSteps as any,
            tourSettings: tourData.tourSettings as any,
            tourGroup: tourData.tourGroup || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        logger.info(`Tour ${tourKey} upserted successfully!`, {
          id: upsertedTour.id,
          name: upsertedTour.name,
          version: upsertedTour.version,
          stepCount: (upsertedTour.tourSteps as any).length,
        });

        upsertedCount++;
      } catch (error) {
        logger.error(`Error upserting tour ${tourKey}:`, error);
        errorCount++;
      }
    }

    // Summary
    logger.info('Tour definitions upsert completed!', {
      upserted: upsertedCount,
      errors: errorCount,
      total: Object.keys(updatedTourDefinitions).length,
    });

    return {
      success: true,
      upserted: upsertedCount,
      errors: errorCount,
    };
  } catch (error) {
    logger.error('Error during tour definitions update:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Determines if this module is being executed directly
 * Works with both CommonJS and ES modules
 */
function isMainModule(): boolean {
  // For CommonJS
  if (typeof require !== 'undefined' && require.main) {
    return require.main === module;
  }

  return false;
}

// Execute the upsert if this file is run directly
if (isMainModule()) {
  upsertTourDefinitions()
    .then((result) => {
      if (result.success) {
        logger.info('Tour definitions upsert completed successfully!', result);
        return gracefulExit(0);
      } else {
        logger.error('Tour definitions upsert failed!', result);
        return gracefulExit(1);
      }
    })
    .catch((error) => {
      logger.error('Unexpected error during upsert:', error);
      return gracefulExit(1);
    });
}

export { upsertTourDefinitions };
