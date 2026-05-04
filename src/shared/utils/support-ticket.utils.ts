/**
 * Support Ticket Utilities
 *
 * This module provides comprehensive utilities for managing support ticket
 * categories, subcategories, and entity type determination for clients.
 *
 * The system automatically determines if an issue is related to a new entity
 * creation or an existing entity based on the category and subcategory.
 */

import {
  SupportTicketTypeEnum,
  SupportTicketEntityTypeEnum,
  SupportTicketPriorityEnum,
  SupportTicketStatusEnum,
  SupportClientTicketCategoryEnum,
  SupportClientTicketSubcategoryEnum,
  SupportCandidateTicketCategoryEnum,
  SupportCandidateTicketSubcategoryEnum,
} from '../models/common/enums';

// ========================================
// RE-EXPORTED ENUMS FOR CONVENIENCE
// ========================================

export function formatEnumValue(value: string): string {
  if (!value) return value;

  const words = value.split(/[_\-\s]+/);

  return words
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Support ticket types based on backend schema
 */
export const SupportTicketType = SupportTicketTypeEnum;

/**
 * Support ticket entity types based on backend schema
 */
export const SupportTicketEntityType = SupportTicketEntityTypeEnum;

/**
 * Support ticket priority levels based on backend schema
 */
export const SupportTicketPriority = SupportTicketPriorityEnum;

/**
 * Support ticket status based on backend schema
 */
export const SupportTicketStatus = SupportTicketStatusEnum;

// ========================================
// CLIENT-SPECIFIC CATEGORIES
// ========================================

/**
 * Client support ticket categories
 */
export const ClientTicketCategory = SupportClientTicketCategoryEnum;

/**
 * Client support ticket subcategories
 */
export const ClientTicketSubcategory = SupportClientTicketSubcategoryEnum;

// ========================================
// CANDIDATE-SPECIFIC CATEGORIES
// ========================================

/**
 * Candidate support ticket categories
 */
export const CandidateTicketCategory = SupportCandidateTicketCategoryEnum;

/**
 * Candidate support ticket subcategories
 */
export const CandidateTicketSubcategory = SupportCandidateTicketSubcategoryEnum;

// ========================================
// CATEGORY TO SUBCATEGORY MAPPING
// ========================================

/**
 * Maps each category to its available subcategories
 */
export const CategoryToSubCategory: Record<
  keyof typeof ClientTicketCategory,
  (keyof typeof ClientTicketSubcategory)[]
> = {
  [ClientTicketCategory.JOB_POSTING]: [
    ClientTicketSubcategory.JOB_POSTING_CREATE,
    ClientTicketSubcategory.JOB_POSTING_UPDATE,
    ClientTicketSubcategory.JOB_POSTING_DELETE,
    ClientTicketSubcategory.JOB_POSTING_PUBLISH,
    ClientTicketSubcategory.JOB_POSTING_UNPUBLISH,
    ClientTicketSubcategory.JOB_POSTING_ARCHIVE,
    ClientTicketSubcategory.JOB_POSTING_AI_REVIEW_FAILED,
    ClientTicketSubcategory.JOB_POSTING_AI_REVIEW_SUCCESS,
    ClientTicketSubcategory.JOB_POSTING_MANUAL_REVIEW,
    ClientTicketSubcategory.JOB_POSTING_TEMPLATE_ISSUE,
    ClientTicketSubcategory.JOB_POSTING_DUPLICATE,
    ClientTicketSubcategory.JOB_POSTING_PERMISSIONS,
    ClientTicketSubcategory.JOB_POSTING_INTEGRATION,
    ClientTicketSubcategory.JOB_POSTING_JOB_BOARD_PUBLISH,
    ClientTicketSubcategory.JOB_POSTING_ATS,
  ],

  [ClientTicketCategory.JOB_APPLICATION]: [
    ClientTicketSubcategory.JOB_APPLICATION_VIEW,
    ClientTicketSubcategory.JOB_APPLICATION_STATUS_UPDATE,
    ClientTicketSubcategory.JOB_APPLICATION_SHORTLIST,
    ClientTicketSubcategory.JOB_APPLICATION_REJECT,
    ClientTicketSubcategory.JOB_APPLICATION_BULK_ACTIONS,
    ClientTicketSubcategory.JOB_APPLICATION_EXPORT,
    ClientTicketSubcategory.JOB_APPLICATION_NOTES,
    ClientTicketSubcategory.JOB_APPLICATION_CANDIDATE_PROFILE,
    ClientTicketSubcategory.JOB_APPLICATION_RESUME_ACCESS,
  ],

  [ClientTicketCategory.JOB_INTERVIEW]: [
    ClientTicketSubcategory.JOB_INTERVIEW_SCHEDULE,
    ClientTicketSubcategory.JOB_INTERVIEW_RESCHEDULE,
    ClientTicketSubcategory.JOB_INTERVIEW_CANCEL,
    ClientTicketSubcategory.JOB_INTERVIEW_AI_ASSESSMENT,
    ClientTicketSubcategory.JOB_INTERVIEW_PANEL_ASSESSMENT,
    ClientTicketSubcategory.JOB_INTERVIEW_VIDEO_CALL,
    ClientTicketSubcategory.JOB_INTERVIEW_IN_PERSON,
    ClientTicketSubcategory.JOB_INTERVIEW_FEEDBACK,
    ClientTicketSubcategory.JOB_INTERVIEW_RECORDING,
    ClientTicketSubcategory.JOB_INTERVIEW_TECHNICAL_ISSUE,
  ],

  [ClientTicketCategory.JOB_ONBOARDING]: [
    ClientTicketSubcategory.JOB_ONBOARDING_SETUP,
    ClientTicketSubcategory.JOB_ONBOARDING_DOCUMENTS,
    ClientTicketSubcategory.JOB_ONBOARDING_CHECKLIST,
    ClientTicketSubcategory.JOB_ONBOARDING_PROGRESS,
    ClientTicketSubcategory.JOB_ONBOARDING_COMPLETION,
  ],

  [ClientTicketCategory.CANDIDATE_RECOMMENDATION]: [
    ClientTicketSubcategory.CANDIDATE_RECOMMENDATION_ALGORITHM,
    ClientTicketSubcategory.CANDIDATE_RECOMMENDATION_FILTERS,
    ClientTicketSubcategory.CANDIDATE_RECOMMENDATION_ACCURACY,
    ClientTicketSubcategory.CANDIDATE_RECOMMENDATION_FEEDBACK,
    ClientTicketSubcategory.CANDIDATE_RECOMMENDATION_CUSTOMIZATION,
    ClientTicketSubcategory.CANDIDATE_RECOMMENDATION_MATCHING,
  ],

  [ClientTicketCategory.USER_INVITATION]: [
    ClientTicketSubcategory.USER_INVITATION_SEND,
    ClientTicketSubcategory.USER_INVITATION_RESEND,
    ClientTicketSubcategory.USER_INVITATION_WITHDRAW,
    ClientTicketSubcategory.USER_INVITATION_EXPIRE,
    ClientTicketSubcategory.USER_INVITATION_ACCEPT,
    ClientTicketSubcategory.USER_INVITATION_DECLINE,
    ClientTicketSubcategory.USER_INVITATION_BULK_SEND,
    ClientTicketSubcategory.USER_INVITATION_TEMPLATE,
    ClientTicketSubcategory.USER_INVITATION_PERMISSIONS,
  ],

  [ClientTicketCategory.USER_MANAGEMENT]: [
    ClientTicketSubcategory.USER_CREATE,
    ClientTicketSubcategory.USER_UPDATE,
    ClientTicketSubcategory.USER_DEACTIVATE,
    ClientTicketSubcategory.USER_ACTIVATE,
    ClientTicketSubcategory.USER_DELETE,
    ClientTicketSubcategory.USER_ROLE_CHANGE,
    ClientTicketSubcategory.USER_PERMISSIONS,
    ClientTicketSubcategory.USER_ACCESS_CONTROL,
    ClientTicketSubcategory.USER_BULK_ACTIONS,
    ClientTicketSubcategory.USER_IMPORT,
  ],

  [ClientTicketCategory.SUBSCRIPTION_BILLING]: [
    ClientTicketSubcategory.SUBSCRIPTION_UPGRADE,
    ClientTicketSubcategory.SUBSCRIPTION_DOWNGRADE,
    ClientTicketSubcategory.SUBSCRIPTION_CANCEL,
    ClientTicketSubcategory.SUBSCRIPTION_RENEW,
    ClientTicketSubcategory.SUBSCRIPTION_TRIAL,
    ClientTicketSubcategory.SUBSCRIPTION_PAYMENT_FAILED,
    ClientTicketSubcategory.SUBSCRIPTION_PAYMENT_METHOD,
    ClientTicketSubcategory.SUBSCRIPTION_BILLING_CYCLE,
    ClientTicketSubcategory.SUBSCRIPTION_CREDITS_PURCHASE,
    ClientTicketSubcategory.SUBSCRIPTION_CREDITS_USAGE,
    ClientTicketSubcategory.SUBSCRIPTION_LIMITS,
    ClientTicketSubcategory.SUBSCRIPTION_INVOICE,
    ClientTicketSubcategory.SUBSCRIPTION_REFUND,
    ClientTicketSubcategory.SUBSCRIPTION_PRICING,
  ],

  [ClientTicketCategory.AI_ASSESSMENT]: [
    ClientTicketSubcategory.AI_ASSESSMENT_CREATE,
    ClientTicketSubcategory.AI_ASSESSMENT_CONFIGURE,
    ClientTicketSubcategory.AI_ASSESSMENT_INVITE_CANDIDATE,
    ClientTicketSubcategory.AI_ASSESSMENT_RESULTS,
    ClientTicketSubcategory.AI_ASSESSMENT_VIDEO_ANALYSIS,
    ClientTicketSubcategory.AI_ASSESSMENT_PROCTORING,
    ClientTicketSubcategory.AI_ASSESSMENT_DIFFICULTY,
    ClientTicketSubcategory.AI_ASSESSMENT_SCORING,
    ClientTicketSubcategory.AI_ASSESSMENT_FEEDBACK,
    ClientTicketSubcategory.AI_ASSESSMENT_TECHNICAL_ISSUE,
    ClientTicketSubcategory.AI_ASSESSMENT_REPORTING,
  ],

  [ClientTicketCategory.PANEL_ASSESSMENT]: [
    ClientTicketSubcategory.PANEL_ASSESSMENT_SLOT_CREATION,
    ClientTicketSubcategory.PANEL_ASSESSMENT_CONFIGURE,
    ClientTicketSubcategory.PANEL_ASSESSMENT_INVITE_CANDIDATE,
    ClientTicketSubcategory.PANEL_ASSESSMENT_FEEDBACK,
    ClientTicketSubcategory.PANEL_ASSESSMENT_MEETING_CREATION,
    ClientTicketSubcategory.PANEL_ASSESSMENT_MEETING_LINK_GENERATION,
  ],

  [ClientTicketCategory.COMPANY_PROFILE]: [
    ClientTicketSubcategory.COMPANY_PROFILE_UPDATE,
    ClientTicketSubcategory.COMPANY_VERIFICATION,
    ClientTicketSubcategory.COMPANY_LOGO,
    ClientTicketSubcategory.COMPANY_DESCRIPTION,
    ClientTicketSubcategory.COMPANY_CULTURE,
    ClientTicketSubcategory.COMPANY_BENEFITS,
    ClientTicketSubcategory.COMPANY_SOCIAL_MEDIA,
    ClientTicketSubcategory.COMPANY_ADDRESS,
    ClientTicketSubcategory.COMPANY_CONTACT_INFO,
    ClientTicketSubcategory.COMPANY_DOCUMENTS,
  ],

  [ClientTicketCategory.TECHNICAL_ISSUE]: [
    ClientTicketSubcategory.TECHNICAL_ISSUE_LOGIN,
    ClientTicketSubcategory.TECHNICAL_ISSUE_PERFORMANCE,
    ClientTicketSubcategory.TECHNICAL_ISSUE_UI_BUG,
    ClientTicketSubcategory.TECHNICAL_ISSUE_MOBILE_APP,
    ClientTicketSubcategory.TECHNICAL_ISSUE_BROWSER,
    ClientTicketSubcategory.TECHNICAL_ISSUE_VIDEO_CALL,
    ClientTicketSubcategory.TECHNICAL_ISSUE_FILE_UPLOAD,
    ClientTicketSubcategory.TECHNICAL_ISSUE_NOTIFICATION,
    ClientTicketSubcategory.TECHNICAL_ISSUE_DATA_SYNC,
    ClientTicketSubcategory.TECHNICAL_ISSUE_SEARCH,
  ],

  [ClientTicketCategory.ACCOUNT_SETTINGS]: [
    ClientTicketSubcategory.ACCOUNT_SETTINGS_PROFILE,
    ClientTicketSubcategory.ACCOUNT_SETTINGS_PASSWORD,
    ClientTicketSubcategory.ACCOUNT_SETTINGS_EMAIL,
    ClientTicketSubcategory.ACCOUNT_SETTINGS_PHONE,
    ClientTicketSubcategory.ACCOUNT_SETTINGS_TIMEZONE,
    ClientTicketSubcategory.ACCOUNT_SETTINGS_LANGUAGE,
    ClientTicketSubcategory.ACCOUNT_SETTINGS_PREFERENCES,
    ClientTicketSubcategory.ACCOUNT_SETTINGS_PRIVACY,
    ClientTicketSubcategory.ACCOUNT_SETTINGS_SECURITY,
    ClientTicketSubcategory.ACCOUNT_SETTINGS_TWO_FACTOR,
  ],

  [ClientTicketCategory.NOTIFICATION_SETTINGS]: [
    ClientTicketSubcategory.NOTIFICATION_SETTINGS_EMAIL,
    ClientTicketSubcategory.NOTIFICATION_SETTINGS_PUSH,
    ClientTicketSubcategory.NOTIFICATION_SETTINGS_SMS,
    ClientTicketSubcategory.NOTIFICATION_SETTINGS_IN_APP,
    ClientTicketSubcategory.NOTIFICATION_SETTINGS_FREQUENCY,
    ClientTicketSubcategory.NOTIFICATION_SETTINGS_TEMPLATES,
    ClientTicketSubcategory.NOTIFICATION_SETTINGS_DIGEST,
    ClientTicketSubcategory.NOTIFICATION_SETTINGS_ALERTS,
  ],

  [ClientTicketCategory.DATA_EXPORT_IMPORT]: [
    ClientTicketSubcategory.DATA_EXPORT_IMPORT_CANDIDATES,
    ClientTicketSubcategory.DATA_EXPORT_IMPORT_JOBS,
    ClientTicketSubcategory.DATA_EXPORT_IMPORT_APPLICATIONS,
    ClientTicketSubcategory.DATA_EXPORT_IMPORT_USERS,
    ClientTicketSubcategory.DATA_EXPORT_IMPORT_ASSESSMENTS,
    ClientTicketSubcategory.DATA_EXPORT_IMPORT_CSV,
    ClientTicketSubcategory.DATA_EXPORT_IMPORT_JSON,
    ClientTicketSubcategory.DATA_EXPORT_IMPORT_XML,
    ClientTicketSubcategory.DATA_EXPORT_IMPORT_FORMAT,
    ClientTicketSubcategory.DATA_EXPORT_IMPORT_VALIDATION,
  ],

  [ClientTicketCategory.SECURITY_AUTHENTICATION]: [
    ClientTicketSubcategory.SECURITY_AUTHENTICATION_LOGIN,
    ClientTicketSubcategory.SECURITY_AUTHENTICATION_LOGOUT,
    ClientTicketSubcategory.SECURITY_AUTHENTICATION_PASSWORD_RESET,
    ClientTicketSubcategory.SECURITY_AUTHENTICATION_ACCOUNT_LOCK,
    ClientTicketSubcategory.SECURITY_AUTHENTICATION_SUSPICIOUS_ACTIVITY,
    ClientTicketSubcategory.SECURITY_AUTHENTICATION_ACCESS_DENIED,
    ClientTicketSubcategory.SECURITY_AUTHENTICATION_SESSION_EXPIRE,
    ClientTicketSubcategory.SECURITY_AUTHENTICATION_SSO,
    ClientTicketSubcategory.SECURITY_AUTHENTICATION_OAUTH,
  ],

  [ClientTicketCategory.API_ACCESS]: [
    ClientTicketSubcategory.API_ACCESS_KEY_GENERATION,
    ClientTicketSubcategory.API_ACCESS_KEY_REVOKE,
    ClientTicketSubcategory.API_ACCESS_RATE_LIMIT,
    ClientTicketSubcategory.API_ACCESS_DOCUMENTATION,
    ClientTicketSubcategory.API_ACCESS_WEBHOOK,
    ClientTicketSubcategory.API_ACCESS_AUTHENTICATION,
    ClientTicketSubcategory.API_ACCESS_PERMISSIONS,
    ClientTicketSubcategory.API_ACCESS_LOGS,
  ],

  [ClientTicketCategory.REPORTING_ANALYTICS]: [
    ClientTicketSubcategory.REPORTING_ANALYTICS_DASHBOARD,
    ClientTicketSubcategory.REPORTING_ANALYTICS_JOBS,
    ClientTicketSubcategory.REPORTING_ANALYTICS_CANDIDATES,
    ClientTicketSubcategory.REPORTING_ANALYTICS_APPLICATIONS,
    ClientTicketSubcategory.REPORTING_ANALYTICS_ASSESSMENTS,
    ClientTicketSubcategory.REPORTING_ANALYTICS_PERFORMANCE,
    ClientTicketSubcategory.REPORTING_ANALYTICS_EXPORT,
    ClientTicketSubcategory.REPORTING_ANALYTICS_CUSTOM,
    ClientTicketSubcategory.REPORTING_ANALYTICS_SCHEDULED,
  ],

  [ClientTicketCategory.FEATURE_REQUEST]: [
    ClientTicketSubcategory.FEATURE_REQUEST_NEW_FEATURE,
    ClientTicketSubcategory.FEATURE_REQUEST_ENHANCEMENT,
    ClientTicketSubcategory.FEATURE_REQUEST_INTEGRATION,
    ClientTicketSubcategory.FEATURE_REQUEST_MOBILE,
    ClientTicketSubcategory.FEATURE_REQUEST_API,
    ClientTicketSubcategory.FEATURE_REQUEST_UI_UX,
    ClientTicketSubcategory.FEATURE_REQUEST_WORKFLOW,
    ClientTicketSubcategory.FEATURE_REQUEST_AUTOMATION,
  ],

  [ClientTicketCategory.GENERAL_INQUIRY]: [
    ClientTicketSubcategory.GENERAL_INQUIRY_HOW_TO,
    ClientTicketSubcategory.GENERAL_INQUIRY_BEST_PRACTICES,
    ClientTicketSubcategory.GENERAL_INQUIRY_TRAINING,
    ClientTicketSubcategory.GENERAL_INQUIRY_DEMO,
    ClientTicketSubcategory.GENERAL_INQUIRY_PRICING,
    ClientTicketSubcategory.GENERAL_INQUIRY_COMPARISON,
    ClientTicketSubcategory.GENERAL_INQUIRY_SUPPORT,
    ClientTicketSubcategory.GENERAL_INQUIRY_FEEDBACK,
  ],

  [ClientTicketCategory.OTHER]: [ClientTicketSubcategory.OTHER],
};

/**
 * Maps each candidate category to its available subcategories
 */
export const CandidateCategoryToSubCategory: Record<
  keyof typeof CandidateTicketCategory,
  (keyof typeof CandidateTicketSubcategory)[]
> = {
  [CandidateTicketCategory.PROFILE_MANAGEMENT]: [
    CandidateTicketSubcategory.PROFILE_CREATE,
    CandidateTicketSubcategory.PROFILE_UPDATE,
    CandidateTicketSubcategory.PROFILE_VERIFICATION,
    CandidateTicketSubcategory.PROFILE_DEACTIVATE,
    CandidateTicketSubcategory.PROFILE_ACTIVATE,
    CandidateTicketSubcategory.PROFILE_DELETE,
    CandidateTicketSubcategory.PROFILE_PRIVACY,
    CandidateTicketSubcategory.PROFILE_VISIBILITY,
    CandidateTicketSubcategory.PROFILE_COMPLETION,
    CandidateTicketSubcategory.PROFILE_SKILLS,
    CandidateTicketSubcategory.PROFILE_EXPERIENCE,
    CandidateTicketSubcategory.PROFILE_EDUCATION,
    CandidateTicketSubcategory.PROFILE_CERTIFICATION,
    CandidateTicketSubcategory.PROFILE_PROJECTS,
  ],

  [CandidateTicketCategory.JOB_APPLICATION]: [
    CandidateTicketSubcategory.JOB_APPLICATION_SUBMIT,
    CandidateTicketSubcategory.JOB_APPLICATION_STATUS,
    CandidateTicketSubcategory.JOB_APPLICATION_WITHDRAW,
    CandidateTicketSubcategory.JOB_APPLICATION_TRACKING,
    CandidateTicketSubcategory.JOB_APPLICATION_REFERENCES,
    CandidateTicketSubcategory.JOB_APPLICATION_FOLLOW_UP,
  ],

  [CandidateTicketCategory.ASSESSMENT]: [
    CandidateTicketSubcategory.ASSESSMENT_INVITATION,
    CandidateTicketSubcategory.ASSESSMENT_ACCESS,
    CandidateTicketSubcategory.ASSESSMENT_COMPLETION,
    CandidateTicketSubcategory.ASSESSMENT_RESULTS,
    CandidateTicketSubcategory.ASSESSMENT_FEEDBACK,
    CandidateTicketSubcategory.ASSESSMENT_RETRY,
    CandidateTicketSubcategory.ASSESSMENT_TECHNICAL_ISSUE,
    CandidateTicketSubcategory.ASSESSMENT_SCHEDULING,
    CandidateTicketSubcategory.ASSESSMENT_PROCTORING,
    CandidateTicketSubcategory.ASSESSMENT_VIDEO_ISSUE,
    CandidateTicketSubcategory.ASSESSMENT_AUDIO_ISSUE,
    CandidateTicketSubcategory.ASSESSMENT_PERFORMANCE,
  ],

  [CandidateTicketCategory.ONBOARDING]: [
    CandidateTicketSubcategory.ONBOARDING_SETUP,
    CandidateTicketSubcategory.ONBOARDING_PROGRESS,
    CandidateTicketSubcategory.ONBOARDING_COMPLETION,
    CandidateTicketSubcategory.ONBOARDING_ISSUES,
    CandidateTicketSubcategory.ONBOARDING_ACCESS,
    CandidateTicketSubcategory.ONBOARDING_GUIDANCE,
  ],

  [CandidateTicketCategory.RESUME]: [
    CandidateTicketSubcategory.RESUME_UPLOAD,
    CandidateTicketSubcategory.RESUME_UPDATE,
    CandidateTicketSubcategory.RESUME_DELETE,
    CandidateTicketSubcategory.RESUME_PARSING,
  ],

  [CandidateTicketCategory.NOTIFICATION_SETTINGS]: [
    CandidateTicketSubcategory.NOTIFICATION_SETTINGS_EMAIL,
    CandidateTicketSubcategory.NOTIFICATION_SETTINGS_SMS,
    CandidateTicketSubcategory.NOTIFICATION_SETTINGS_IN_APP,
    CandidateTicketSubcategory.NOTIFICATION_SETTINGS_FREQUENCY,
    CandidateTicketSubcategory.NOTIFICATION_SETTINGS_DIGEST,
    CandidateTicketSubcategory.NOTIFICATION_SETTINGS_ALERTS,
  ],

  [CandidateTicketCategory.TECHNICAL_ISSUE]: [
    CandidateTicketSubcategory.TECHNICAL_ISSUE_LOGIN,
    CandidateTicketSubcategory.TECHNICAL_ISSUE_PERFORMANCE,
    CandidateTicketSubcategory.TECHNICAL_ISSUE_UI_BUG,
    CandidateTicketSubcategory.TECHNICAL_ISSUE_MOBILE_APP,
    CandidateTicketSubcategory.TECHNICAL_ISSUE_BROWSER,
    CandidateTicketSubcategory.TECHNICAL_ISSUE_FILE_UPLOAD,
    CandidateTicketSubcategory.TECHNICAL_ISSUE_NOTIFICATION,
    CandidateTicketSubcategory.TECHNICAL_ISSUE_SEARCH,
  ],

  [CandidateTicketCategory.SECURITY_AUTHENTICATION]: [
    CandidateTicketSubcategory.SECURITY_AUTHENTICATION_LOGIN,
    CandidateTicketSubcategory.SECURITY_AUTHENTICATION_LOGOUT,
    CandidateTicketSubcategory.SECURITY_AUTHENTICATION_PASSWORD_RESET,
    CandidateTicketSubcategory.SECURITY_AUTHENTICATION_ACCESS_DENIED,
    CandidateTicketSubcategory.SECURITY_AUTHENTICATION_SESSION_EXPIRE,
  ],

  [CandidateTicketCategory.OTHER]: [CandidateTicketSubcategory.OTHER],
};

// ========================================
// ENTITY TYPE DETERMINATION
// ========================================

/**
 * Subcategories that indicate NEW_ENTITY ticket type
 * These are issues related to creating new entities
 */
export const NEW_ENTITY_SUBCATEGORIES: (keyof typeof ClientTicketSubcategory)[] =
  [
    // Job Posting Creation
    ClientTicketSubcategory.JOB_POSTING_CREATE,

    // Job Application Creation
    ClientTicketSubcategory.JOB_APPLICATION_VIEW,

    // Interview Creation
    ClientTicketSubcategory.JOB_INTERVIEW_SCHEDULE,

    // Onboarding Creation
    ClientTicketSubcategory.JOB_ONBOARDING_SETUP,

    // User Invitation Creation
    ClientTicketSubcategory.USER_INVITATION_SEND,

    // AI Assessment Creation
    ClientTicketSubcategory.AI_ASSESSMENT_CREATE,

    // Panel Assessment Creation
    ClientTicketSubcategory.JOB_INTERVIEW_PANEL_ASSESSMENT,

    // Integration Setup
    ClientTicketSubcategory.INTEGRATION_SETUP,

    // API Key Generation
    ClientTicketSubcategory.API_ACCESS_KEY_GENERATION,

    // Feature Requests
    ClientTicketSubcategory.FEATURE_REQUEST_NEW_FEATURE,
    ClientTicketSubcategory.FEATURE_REQUEST_ENHANCEMENT,
    ClientTicketSubcategory.FEATURE_REQUEST_AUTOMATION,

    //Bulk Actions
    ClientTicketSubcategory.USER_BULK_ACTIONS,
    ClientTicketSubcategory.USER_INVITATION_BULK_SEND,

    //User Import
    ClientTicketSubcategory.USER_IMPORT,
  ];

/**
 * Candidate subcategories that indicate NEW_ENTITY ticket type
 * These are issues related to creating new entities
 */
export const CANDIDATE_NEW_ENTITY_SUBCATEGORIES: (keyof typeof CandidateTicketSubcategory)[] =
  [
    // Profile Creation
    CandidateTicketSubcategory.PROFILE_CREATE,

    // Job Application Creation
    CandidateTicketSubcategory.JOB_APPLICATION_SUBMIT,

    // Assessment Creation
    CandidateTicketSubcategory.ASSESSMENT_INVITATION,

    // Onboarding Creation
    CandidateTicketSubcategory.ONBOARDING_SETUP,

    // Resume/Portfolio Creation
    CandidateTicketSubcategory.RESUME_UPLOAD,
  ];

/**
 * Determines if a ticket should be classified as NEW_ENTITY or EXISTING_ENTITY
 * based on the category and subcategory
 *
 * @param category - The ticket category
 * @param subcategory - The ticket subcategory
 * @returns SupportTicketType.NEW_ENTITY or SupportTicketType.EXISTING_ENTITY
 */
export function determineTicketType(
  subcategory: keyof typeof ClientTicketSubcategory
): keyof typeof SupportTicketType {
  // Check if the subcategory indicates a new entity creation
  if (NEW_ENTITY_SUBCATEGORIES.includes(subcategory)) {
    return SupportTicketType.NEW_ENTITY;
  }

  // Default to existing entity for all other cases
  return SupportTicketType.EXISTING_ENTITY;
}

/**
 * Determines the ticket type based on category and subcategory
 * This is the main function that should be used to automatically
 * determine if a ticket is for a new entity or existing entity
 *
 * @param category - The ticket category
 * @param subcategory - The ticket subcategory
 * @returns The determined ticket type
 */
export function getTicketType(
  subcategory: keyof typeof ClientTicketSubcategory
): keyof typeof SupportTicketType {
  return determineTicketType(subcategory);
}

/**
 * Determines if a candidate ticket should be classified as NEW_ENTITY or EXISTING_ENTITY
 * based on the subcategory
 *
 * @param subcategory - The candidate ticket subcategory
 * @returns SupportTicketType.NEW_ENTITY or SupportTicketType.EXISTING_ENTITY
 */
export function determineCandidateTicketType(
  subcategory: keyof typeof CandidateTicketSubcategory
): keyof typeof SupportTicketType {
  // Check if the subcategory indicates a new entity creation
  if (CANDIDATE_NEW_ENTITY_SUBCATEGORIES.includes(subcategory)) {
    return SupportTicketType.NEW_ENTITY;
  }

  // Default to existing entity for all other cases
  return SupportTicketType.EXISTING_ENTITY;
}

/**
 * Determines the candidate ticket type based on subcategory
 * This is the main function that should be used to automatically
 * determine if a candidate ticket is for a new entity or existing entity
 *
 * @param subcategory - The candidate ticket subcategory
 * @returns The determined ticket type
 */
export function getCandidateTicketType(
  subcategory: keyof typeof CandidateTicketSubcategory
): keyof typeof SupportTicketType {
  return determineCandidateTicketType(subcategory);
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Gets all available subcategories for a given category
 *
 * @param category - The ticket category
 * @returns Array of available subcategories
 */
export function getSubcategoriesForCategory(
  category: keyof typeof ClientTicketCategory
): (keyof typeof ClientTicketSubcategory)[] {
  return CategoryToSubCategory[category] || [];
}

/**
 * Gets the category for a given subcategory
 *
 * @param subcategory - The ticket subcategory
 * @returns The category that contains this subcategory
 */
export function getCategoryForSubcategory(
  subcategory: keyof typeof ClientTicketSubcategory
): keyof typeof ClientTicketCategory | null {
  for (const [category, subcategories] of Object.entries(
    CategoryToSubCategory
  )) {
    if (subcategories.includes(subcategory)) {
      return category as keyof typeof ClientTicketCategory;
    }
  }
  return null;
}

/**
 * Checks if a subcategory is valid for a given category
 *
 * @param category - The ticket category
 * @param subcategory - The ticket subcategory
 * @returns True if the subcategory is valid for the category
 */
export function isValidSubcategoryForCategory(
  category: keyof typeof ClientTicketCategory,
  subcategory: keyof typeof ClientTicketSubcategory
): boolean {
  const validSubcategories = getSubcategoriesForCategory(category);
  return validSubcategories.includes(subcategory);
}

/**
 * Gets all available categories for client tickets
 *
 * @returns Array of all client ticket categories
 */
export function getAllClientCategories(): (keyof typeof ClientTicketCategory)[] {
  return Object.values(ClientTicketCategory);
}

/**
 * Gets all available subcategories for client tickets
 *
 * @returns Array of all client ticket subcategories
 */
export function getAllClientSubcategories(): (keyof typeof ClientTicketSubcategory)[] {
  return Object.values(ClientTicketSubcategory);
}

/**
 * Gets all available subcategories for a given candidate category
 *
 * @param category - The candidate ticket category
 * @returns Array of available subcategories
 */
export function getCandidateSubcategoriesForCategory(
  category: keyof typeof CandidateTicketCategory
): (keyof typeof CandidateTicketSubcategory)[] {
  return CandidateCategoryToSubCategory[category] || [];
}

/**
 * Gets the category for a given candidate subcategory
 *
 * @param subcategory - The candidate ticket subcategory
 * @returns The category that contains this subcategory
 */
export function getCandidateCategoryForSubcategory(
  subcategory: keyof typeof CandidateTicketSubcategory
): keyof typeof CandidateTicketCategory | null {
  for (const [category, subcategories] of Object.entries(
    CandidateCategoryToSubCategory
  )) {
    if (subcategories.includes(subcategory)) {
      return category as keyof typeof CandidateTicketCategory;
    }
  }
  return null;
}

/**
 * Checks if a subcategory is valid for a given candidate category
 *
 * @param category - The candidate ticket category
 * @param subcategory - The candidate ticket subcategory
 * @returns True if the subcategory is valid for the category
 */
export function isValidCandidateSubcategoryForCategory(
  category: keyof typeof CandidateTicketCategory,
  subcategory: keyof typeof CandidateTicketSubcategory
): boolean {
  const validSubcategories = getCandidateSubcategoriesForCategory(category);
  return validSubcategories.includes(subcategory);
}

/**
 * Gets all available categories for candidate tickets
 *
 * @returns Array of all candidate ticket categories
 */
export function getAllCandidateCategories(): (keyof typeof CandidateTicketCategory)[] {
  return Object.values(CandidateTicketCategory);
}

/**
 * Gets all available subcategories for candidate tickets
 *
 * @returns Array of all candidate ticket subcategories
 */
export function getAllCandidateSubcategories(): (keyof typeof CandidateTicketSubcategory)[] {
  return Object.values(CandidateTicketSubcategory);
}

/**
 * Gets the display label for a category
 *
 * @param category - The ticket category
 * @returns Human-readable label for the category
 */
export function getCategoryLabel(
  category: keyof typeof ClientTicketCategory
): string {
  const labels: Record<keyof typeof ClientTicketCategory, string> = {
    [ClientTicketCategory.JOB_POSTING]: 'Job Posting',
    [ClientTicketCategory.JOB_APPLICATION]: 'Job Application',
    [ClientTicketCategory.JOB_INTERVIEW]: 'Job Interview',
    [ClientTicketCategory.JOB_ONBOARDING]: 'Job Onboarding',
    [ClientTicketCategory.CANDIDATE_RECOMMENDATION]: 'Candidate Recommendation',
    [ClientTicketCategory.USER_INVITATION]: 'User Invitation',
    [ClientTicketCategory.USER_MANAGEMENT]: 'User Management',
    [ClientTicketCategory.SUBSCRIPTION_BILLING]: 'Subscription & Billing',
    [ClientTicketCategory.AI_ASSESSMENT]: 'AI Assessment',
    [ClientTicketCategory.PANEL_ASSESSMENT]: 'Panel Assessment',
    [ClientTicketCategory.COMPANY_PROFILE]: 'Company Profile',
    [ClientTicketCategory.TECHNICAL_ISSUE]: 'Technical Issue',
    [ClientTicketCategory.ACCOUNT_SETTINGS]: 'Account Settings',
    [ClientTicketCategory.NOTIFICATION_SETTINGS]: 'Notification Settings',
    [ClientTicketCategory.DATA_EXPORT_IMPORT]: 'Data Export/Import',
    [ClientTicketCategory.SECURITY_AUTHENTICATION]: 'Security & Authentication',
    [ClientTicketCategory.API_ACCESS]: 'API Access',
    [ClientTicketCategory.REPORTING_ANALYTICS]: 'Reporting & Analytics',
    [ClientTicketCategory.FEATURE_REQUEST]: 'Feature Request',
    [ClientTicketCategory.GENERAL_INQUIRY]: 'General Inquiry',
    [ClientTicketCategory.OTHER]: 'Other',
  };

  return labels[category] || category;
}

/**
 * Gets the display label for a subcategory
 *
 * @param subcategory - The ticket subcategory
 * @returns Human-readable label for the subcategory
 */
export function getSubcategoryLabel(
  subcategory: keyof typeof ClientTicketSubcategory
): string {
  // Convert enum key to human-readable label
  return subcategory
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .replace(/\b(Id|Url|Api|Sms|Ui|Ux|Hris|Ats|Sso|Oauth)\b/g, (match) =>
      match.toUpperCase()
    );
}

/**
 * Gets the description for a category
 *
 * @param category - The ticket category
 * @returns Description for the category
 */
export function getCategoryDescription(
  category: keyof typeof ClientTicketCategory
): string {
  const descriptions: Record<keyof typeof ClientTicketCategory, string> = {
    [ClientTicketCategory.JOB_POSTING]:
      'Issues with creating, updating, or publishing job posts',
    [ClientTicketCategory.JOB_APPLICATION]:
      'Managing applications and candidate reviews',
    [ClientTicketCategory.JOB_INTERVIEW]:
      'Interview scheduling, management, and feedback',
    [ClientTicketCategory.JOB_ONBOARDING]:
      'Onboarding process and assessment setup',
    [ClientTicketCategory.CANDIDATE_RECOMMENDATION]:
      'AI-powered candidate matching and recommendations',
    [ClientTicketCategory.USER_INVITATION]:
      'User invitation and onboarding process',
    [ClientTicketCategory.USER_MANAGEMENT]:
      'User accounts, roles, and permissions',
    [ClientTicketCategory.SUBSCRIPTION_BILLING]:
      'Payment, invoicing, and plan changes',
    [ClientTicketCategory.AI_ASSESSMENT]:
      'AI-powered candidate evaluation tools',
    [ClientTicketCategory.PANEL_ASSESSMENT]:
      'Panel-based assessment management',
    [ClientTicketCategory.COMPANY_PROFILE]: 'Company information and branding',
    [ClientTicketCategory.TECHNICAL_ISSUE]:
      'Bugs, performance, and technical problems',
    [ClientTicketCategory.ACCOUNT_SETTINGS]:
      'Account configuration and preferences',
    [ClientTicketCategory.NOTIFICATION_SETTINGS]:
      'Notification preferences and delivery',
    [ClientTicketCategory.DATA_EXPORT_IMPORT]: 'Data import/export operations',
    [ClientTicketCategory.SECURITY_AUTHENTICATION]:
      'Login, authentication, and security',
    [ClientTicketCategory.API_ACCESS]: 'API key management and access control',
    [ClientTicketCategory.REPORTING_ANALYTICS]:
      'Reports, analytics, and insights',
    [ClientTicketCategory.FEATURE_REQUEST]:
      'Suggest new features or improvements',
    [ClientTicketCategory.GENERAL_INQUIRY]: 'General questions and support',
    [ClientTicketCategory.OTHER]:
      'Other issues not covered by specific categories',
  };

  return descriptions[category] || '';
}

/**
 * Gets the icon for a category
 *
 * @param category - The ticket category
 * @returns Icon emoji for the category
 */
export function getCategoryIcon(
  category: keyof typeof ClientTicketCategory
): string {
  const icons: Record<keyof typeof ClientTicketCategory, string> = {
    [ClientTicketCategory.JOB_POSTING]: '📋',
    [ClientTicketCategory.JOB_APPLICATION]: '📝',
    [ClientTicketCategory.JOB_INTERVIEW]: '🤝',
    [ClientTicketCategory.JOB_ONBOARDING]: '🚀',
    [ClientTicketCategory.CANDIDATE_RECOMMENDATION]: '🎯',
    [ClientTicketCategory.USER_INVITATION]: '📧',
    [ClientTicketCategory.USER_MANAGEMENT]: '👤',
    [ClientTicketCategory.SUBSCRIPTION_BILLING]: '💳',
    [ClientTicketCategory.AI_ASSESSMENT]: '🤖',
    [ClientTicketCategory.PANEL_ASSESSMENT]: '👥',
    [ClientTicketCategory.COMPANY_PROFILE]: '🏢',
    [ClientTicketCategory.TECHNICAL_ISSUE]: '⚙️',
    [ClientTicketCategory.ACCOUNT_SETTINGS]: '⚙️',
    [ClientTicketCategory.NOTIFICATION_SETTINGS]: '🔔',
    [ClientTicketCategory.DATA_EXPORT_IMPORT]: '📊',
    [ClientTicketCategory.SECURITY_AUTHENTICATION]: '🔒',
    [ClientTicketCategory.API_ACCESS]: '🔑',
    [ClientTicketCategory.REPORTING_ANALYTICS]: '📈',
    [ClientTicketCategory.FEATURE_REQUEST]: '💡',
    [ClientTicketCategory.GENERAL_INQUIRY]: '❓',
    [ClientTicketCategory.OTHER]: '📋',
  };

  return icons[category] || '📋';
}

/**
 * Gets the display label for a candidate category
 *
 * @param category - The candidate ticket category
 * @returns Human-readable label for the category
 */
export function getCandidateCategoryLabel(
  category: keyof typeof CandidateTicketCategory
): string {
  const labels: Record<keyof typeof CandidateTicketCategory, string> = {
    [CandidateTicketCategory.PROFILE_MANAGEMENT]: 'Profile',
    [CandidateTicketCategory.JOB_APPLICATION]: 'Job Application',
    [CandidateTicketCategory.ASSESSMENT]: 'Assessment',
    [CandidateTicketCategory.ONBOARDING]: 'Onboarding',
    [CandidateTicketCategory.RESUME]: 'Resume',
    [CandidateTicketCategory.NOTIFICATION_SETTINGS]: '',
    [CandidateTicketCategory.TECHNICAL_ISSUE]: '',
    [CandidateTicketCategory.SECURITY_AUTHENTICATION]: 'Security',
    [CandidateTicketCategory.OTHER]: 'Other',
  };

  return labels[category] || category;
}

/**
 * Gets the display label for a candidate subcategory
 *
 * @param subcategory - The candidate ticket subcategory
 * @returns Human-readable label for the subcategory
 */
export function getCandidateSubcategoryLabel(
  subcategory: keyof typeof CandidateTicketSubcategory
): string {
  // Convert enum key to human-readable label
  return subcategory
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .replace(/\b(Id|Url|Api|Sms|Ui|Ux|Hris|Ats|Sso|Oauth)\b/g, (match) =>
      match.toUpperCase()
    );
}

/**
 * Gets the description for a candidate category
 *
 * @param category - The candidate ticket category
 * @returns Description for the category
 */
export function getCandidateCategoryDescription(
  category: keyof typeof CandidateTicketCategory
): string {
  const descriptions: Record<keyof typeof CandidateTicketCategory, string> = {
    [CandidateTicketCategory.PROFILE_MANAGEMENT]:
      'Issues with creating, updating, or managing your candidate profile',
    [CandidateTicketCategory.JOB_APPLICATION]:
      'Managing job applications, tracking status, and communication',
    [CandidateTicketCategory.ASSESSMENT]:
      'Assessment invitations, completion, results, and technical issues',
    [CandidateTicketCategory.ONBOARDING]:
      'Onboarding process, tasks, documents, and guidance',
    [CandidateTicketCategory.RESUME]: 'Resume management, uploads, and parsing',
    [CandidateTicketCategory.NOTIFICATION_SETTINGS]:
      'Notification preferences and delivery settings',
    [CandidateTicketCategory.TECHNICAL_ISSUE]:
      'Bugs, performance, and technical problems',
    [CandidateTicketCategory.SECURITY_AUTHENTICATION]:
      'Login, authentication, and security concerns',
    [CandidateTicketCategory.OTHER]:
      'Other issues not covered by specific categories',
  };

  return descriptions[category] || '';
}

/**
 * Gets the icon for a candidate category
 *
 * @param category - The candidate ticket category
 * @returns Icon emoji for the category
 */
export function getCandidateCategoryIcon(
  category: keyof typeof CandidateTicketCategory
): string {
  const icons: Record<keyof typeof CandidateTicketCategory, string> = {
    [CandidateTicketCategory.PROFILE_MANAGEMENT]: '👤',
    [CandidateTicketCategory.JOB_APPLICATION]: '📝',
    [CandidateTicketCategory.ASSESSMENT]: '📊',
    [CandidateTicketCategory.ONBOARDING]: '🚀',
    [CandidateTicketCategory.RESUME]: '📄',
    [CandidateTicketCategory.NOTIFICATION_SETTINGS]: '🔔',
    [CandidateTicketCategory.TECHNICAL_ISSUE]: '🔧',
    [CandidateTicketCategory.SECURITY_AUTHENTICATION]: '🔒',
    [CandidateTicketCategory.OTHER]: '📋',
  };

  return icons[category] || '📋';
}

/**
 * Generates an automatic subject for a support ticket based on category, subcategory, and target type
 *
 * @param category - The ticket category
 * @param subcategory - The ticket subcategory
 * @param targetType - The target entity type (optional)
 * @param targetName - The target entity name (optional)
 * @returns A generated subject line
 */
export function generateTicketSubject(
  category: keyof typeof ClientTicketCategory,
  subcategory: keyof typeof ClientTicketSubcategory,
  targetType?: string,
  targetName?: string
): string {
  const categoryLabel = getCategoryLabel(category);
  const subcategoryLabel = getSubcategoryLabel(subcategory);

  // Base subject template
  let subject = `${subcategoryLabel} - ${categoryLabel}`;

  // Add target information if available
  if (targetType && targetName) {
    subject = `${subcategoryLabel} for ${targetName} (${targetType})`;
  } else if (targetType) {
    subject = `${subcategoryLabel} - ${targetType} Issue`;
  }

  return subject;
}

/**
 * Generates an automatic subject for a candidate support ticket based on category, subcategory, and target type
 *
 * @param category - The candidate ticket category
 * @param subcategory - The candidate ticket subcategory
 * @param targetType - The target entity type (optional)
 * @param targetName - The target entity name (optional)
 * @returns A generated subject line
 */
export function generateCandidateTicketSubject(
  category: keyof typeof CandidateTicketCategory,
  subcategory: keyof typeof CandidateTicketSubcategory,
  targetType?: string,
  targetName?: string
): string {
  const categoryLabel = getCandidateCategoryLabel(category);
  const subcategoryLabel = getCandidateSubcategoryLabel(subcategory);

  // Base subject template
  let subject = `${subcategoryLabel} - ${categoryLabel}`;

  // Add target information if available
  if (targetType && targetName) {
    subject = `${subcategoryLabel} for ${targetName} (${targetType})`;
  } else if (targetType) {
    subject = `${subcategoryLabel} - ${targetType} Issue`;
  }

  return subject;
}

/**
 * Generates a more descriptive subject with action words based on candidate subcategory
 *
 * @param category - The candidate ticket category
 * @param subcategory - The candidate ticket subcategory
 * @param targetType - The target entity type (optional)
 * @param targetName - The target entity name (optional)
 * @returns A more descriptive subject line
 */
export function generateDescriptiveCandidateTicketSubject(
  category: keyof typeof CandidateTicketCategory,
  subcategory: keyof typeof CandidateTicketSubcategory,
  targetType?: string,
  targetName?: string
): string {
  const categoryLabel = getCandidateCategoryLabel(category);
  const subcategoryLabel = getCandidateSubcategoryLabel(subcategory);

  // Action words mapping for different candidate subcategories
  const actionWords: Record<keyof typeof CandidateTicketSubcategory, string> = {
    // Profile Management actions
    [CandidateTicketSubcategory.PROFILE_CREATE]: 'Create',
    [CandidateTicketSubcategory.PROFILE_UPDATE]: 'Update',
    [CandidateTicketSubcategory.PROFILE_VERIFICATION]: 'Verify',
    [CandidateTicketSubcategory.PROFILE_DEACTIVATE]: 'Deactivate',
    [CandidateTicketSubcategory.PROFILE_ACTIVATE]: 'Activate',
    [CandidateTicketSubcategory.PROFILE_DELETE]: 'Delete',
    [CandidateTicketSubcategory.PROFILE_PRIVACY]: 'Update Privacy Settings for',
    [CandidateTicketSubcategory.PROFILE_VISIBILITY]: 'Update Visibility for',
    [CandidateTicketSubcategory.PROFILE_COMPLETION]: 'Complete',
    [CandidateTicketSubcategory.PROFILE_SKILLS]: 'Update Skills for',
    [CandidateTicketSubcategory.PROFILE_EXPERIENCE]: 'Update Experience for',
    [CandidateTicketSubcategory.PROFILE_EDUCATION]: 'Update Education for',
    [CandidateTicketSubcategory.PROFILE_CERTIFICATION]:
      'Update Certification for',
    [CandidateTicketSubcategory.PROFILE_PROJECTS]: 'Update Projects for',

    // Job Application actions
    [CandidateTicketSubcategory.JOB_APPLICATION_SUBMIT]: 'Submit',
    [CandidateTicketSubcategory.JOB_APPLICATION_STATUS]: 'Track Status of',
    [CandidateTicketSubcategory.JOB_APPLICATION_WITHDRAW]: 'Withdraw',
    [CandidateTicketSubcategory.JOB_APPLICATION_TRACKING]: 'Track',
    [CandidateTicketSubcategory.JOB_APPLICATION_REFERENCES]:
      'Manage References for',
    [CandidateTicketSubcategory.JOB_APPLICATION_FOLLOW_UP]: 'Follow Up on',

    // Assessment actions
    [CandidateTicketSubcategory.ASSESSMENT_INVITATION]: 'Invitation for',
    [CandidateTicketSubcategory.ASSESSMENT_ACCESS]: 'Access',
    [CandidateTicketSubcategory.ASSESSMENT_COMPLETION]: 'Complete',
    [CandidateTicketSubcategory.ASSESSMENT_RESULTS]: 'Review Results for',
    [CandidateTicketSubcategory.ASSESSMENT_FEEDBACK]: 'Get Feedback for',
    [CandidateTicketSubcategory.ASSESSMENT_RETRY]: 'Retry',
    [CandidateTicketSubcategory.ASSESSMENT_TECHNICAL_ISSUE]:
      'Fix Technical Issue for',
    [CandidateTicketSubcategory.ASSESSMENT_SCHEDULING]: 'Schedule',
    [CandidateTicketSubcategory.ASSESSMENT_PROCTORING]: 'Proctor',
    [CandidateTicketSubcategory.ASSESSMENT_VIDEO_ISSUE]: 'Fix Video Issue for',
    [CandidateTicketSubcategory.ASSESSMENT_AUDIO_ISSUE]: 'Fix Audio Issue for',
    [CandidateTicketSubcategory.ASSESSMENT_PERFORMANCE]:
      'Performance Issue for',

    // Onboarding actions
    [CandidateTicketSubcategory.ONBOARDING_SETUP]: 'Setup',
    [CandidateTicketSubcategory.ONBOARDING_PROGRESS]: 'Track Progress for',
    [CandidateTicketSubcategory.ONBOARDING_COMPLETION]: 'Complete',
    [CandidateTicketSubcategory.ONBOARDING_ISSUES]: 'Resolve Issues with',
    [CandidateTicketSubcategory.ONBOARDING_ACCESS]: 'Access',
    [CandidateTicketSubcategory.ONBOARDING_GUIDANCE]: 'Get Guidance for',

    // Resume Portfolio actions
    [CandidateTicketSubcategory.RESUME_UPLOAD]: 'Upload',
    [CandidateTicketSubcategory.RESUME_UPDATE]: 'Update',
    [CandidateTicketSubcategory.RESUME_DELETE]: 'Delete',
    [CandidateTicketSubcategory.RESUME_PARSING]: 'Parse',

    // Notification Settings actions
    [CandidateTicketSubcategory.NOTIFICATION_SETTINGS_EMAIL]:
      'Configure Email Notifications',
    [CandidateTicketSubcategory.NOTIFICATION_SETTINGS_SMS]:
      'Configure SMS Notifications',
    [CandidateTicketSubcategory.NOTIFICATION_SETTINGS_IN_APP]:
      'Configure In-App Notifications',
    [CandidateTicketSubcategory.NOTIFICATION_SETTINGS_FREQUENCY]:
      'Update Notification Frequency',
    [CandidateTicketSubcategory.NOTIFICATION_SETTINGS_DIGEST]:
      'Configure Digest',
    [CandidateTicketSubcategory.NOTIFICATION_SETTINGS_ALERTS]:
      'Configure Alerts',

    // Technical Issue actions
    [CandidateTicketSubcategory.TECHNICAL_ISSUE_LOGIN]: 'Fix Login Issue',
    [CandidateTicketSubcategory.TECHNICAL_ISSUE_PERFORMANCE]:
      'Fix Performance Issue',
    [CandidateTicketSubcategory.TECHNICAL_ISSUE_UI_BUG]: 'Fix UI Bug',
    [CandidateTicketSubcategory.TECHNICAL_ISSUE_MOBILE_APP]:
      'Fix Mobile App Issue',
    [CandidateTicketSubcategory.TECHNICAL_ISSUE_BROWSER]:
      'Fix Browser Compatibility',
    [CandidateTicketSubcategory.TECHNICAL_ISSUE_VIDEO_CALL]:
      'Fix Video Call Issue',
    [CandidateTicketSubcategory.TECHNICAL_ISSUE_FILE_UPLOAD]:
      'Fix File Upload Issue',
    [CandidateTicketSubcategory.TECHNICAL_ISSUE_NOTIFICATION]:
      'Fix Notification Issue',
    [CandidateTicketSubcategory.TECHNICAL_ISSUE_SEARCH]: 'Fix Search Issue',

    // Security Authentication actions
    [CandidateTicketSubcategory.SECURITY_AUTHENTICATION_LOGIN]:
      'Fix Login Issue',
    [CandidateTicketSubcategory.SECURITY_AUTHENTICATION_LOGOUT]:
      'Fix Logout Issue',
    [CandidateTicketSubcategory.SECURITY_AUTHENTICATION_PASSWORD_RESET]:
      'Reset Password',
    [CandidateTicketSubcategory.SECURITY_AUTHENTICATION_ACCESS_DENIED]:
      'Fix Access Denied Issue',
    [CandidateTicketSubcategory.SECURITY_AUTHENTICATION_SESSION_EXPIRE]:
      'Fix Session Expire Issue',

    // Other actions
    [CandidateTicketSubcategory.OTHER]: 'Other Issue',
  };

  const actionWord = actionWords[subcategory] || subcategoryLabel;

  // Build subject based on available information
  if (targetName && targetType) {
    return `Issue in ${actionWord} ${formatEnumValue(category)} (${targetName})`;
  } else if (targetType) {
    return `Issue in ${actionWord} ${formatEnumValue(targetType)}`;
  } else {
    return `Issue in ${actionWord} ${categoryLabel}`;
  }
}

/**
 * Generates a more descriptive subject with action words based on subcategory
 *
 * @param category - The ticket category
 * @param subcategory - The ticket subcategory
 * @param targetType - The target entity type (optional)
 * @param targetName - The target entity name (optional)
 * @returns A more descriptive subject line
 */
export function generateDescriptiveTicketSubject(
  category: keyof typeof ClientTicketCategory,
  subcategory: keyof typeof ClientTicketSubcategory,
  targetType?: string,
  targetName?: string
): string {
  const categoryLabel = getCategoryLabel(category);
  const subcategoryLabel = getSubcategoryLabel(subcategory);

  // Action words mapping for different subcategories
  const actionWords: Record<keyof typeof ClientTicketSubcategory, string> = {
    // Job Posting actions
    [ClientTicketSubcategory.JOB_POSTING_CREATE]: 'Create',
    [ClientTicketSubcategory.JOB_POSTING_UPDATE]: 'Update',
    [ClientTicketSubcategory.JOB_POSTING_DELETE]: 'Delete',
    [ClientTicketSubcategory.JOB_POSTING_PUBLISH]: 'Publish',
    [ClientTicketSubcategory.JOB_POSTING_UNPUBLISH]: 'Unpublish',
    [ClientTicketSubcategory.JOB_POSTING_ARCHIVE]: 'Archive',
    [ClientTicketSubcategory.JOB_POSTING_AI_REVIEW_FAILED]:
      'Fix AI Review Issue for',
    [ClientTicketSubcategory.JOB_POSTING_AI_REVIEW_SUCCESS]:
      'AI Review Success for',
    [ClientTicketSubcategory.JOB_POSTING_MANUAL_REVIEW]:
      'Request Manual Review for',
    [ClientTicketSubcategory.JOB_POSTING_TEMPLATE_ISSUE]:
      'Fix Template Issue for',
    [ClientTicketSubcategory.JOB_POSTING_DUPLICATE]: 'Handle Duplicate',
    [ClientTicketSubcategory.JOB_POSTING_PERMISSIONS]: 'Update Permissions for',
    [ClientTicketSubcategory.JOB_POSTING_INTEGRATION]: 'Sync Integration for',
    [ClientTicketSubcategory.JOB_POSTING_JOB_BOARD_PUBLISH]:
      'Publish to Job Board',
    [ClientTicketSubcategory.JOB_POSTING_ATS]: 'Sync with ATS',

    // Job Application actions
    [ClientTicketSubcategory.JOB_APPLICATION_VIEW]: 'View',
    [ClientTicketSubcategory.JOB_APPLICATION_STATUS_UPDATE]:
      'Update Status for',
    [ClientTicketSubcategory.JOB_APPLICATION_SHORTLIST]: 'Shortlist',
    [ClientTicketSubcategory.JOB_APPLICATION_REJECT]: 'Reject',
    [ClientTicketSubcategory.JOB_APPLICATION_BULK_ACTIONS]: 'Bulk Actions for',
    [ClientTicketSubcategory.JOB_APPLICATION_EXPORT]: 'Export',
    [ClientTicketSubcategory.JOB_APPLICATION_NOTES]: 'Add Notes to',
    [ClientTicketSubcategory.JOB_APPLICATION_COMMUNICATION]: 'Communicate with',
    [ClientTicketSubcategory.JOB_APPLICATION_CANDIDATE_PROFILE]:
      'View Profile for',
    [ClientTicketSubcategory.JOB_APPLICATION_RESUME_ACCESS]:
      'Access Resume for',

    // Job Interview actions
    [ClientTicketSubcategory.JOB_INTERVIEW_SCHEDULE]: 'Schedule',
    [ClientTicketSubcategory.JOB_INTERVIEW_RESCHEDULE]: 'Reschedule',
    [ClientTicketSubcategory.JOB_INTERVIEW_CANCEL]: 'Cancel',
    [ClientTicketSubcategory.JOB_INTERVIEW_AI_ASSESSMENT]: 'AI Assessment for',
    [ClientTicketSubcategory.JOB_INTERVIEW_PANEL_ASSESSMENT]:
      'Panel Assessment for',
    [ClientTicketSubcategory.JOB_INTERVIEW_VIDEO_CALL]: 'Video Call for',
    [ClientTicketSubcategory.JOB_INTERVIEW_IN_PERSON]:
      'In-Person Interview for',
    [ClientTicketSubcategory.JOB_INTERVIEW_FEEDBACK]: 'Provide Feedback for',
    [ClientTicketSubcategory.JOB_INTERVIEW_RECORDING]: 'Record Interview for',
    [ClientTicketSubcategory.JOB_INTERVIEW_TECHNICAL_ISSUE]:
      'Fix Technical Issue for',

    // Job Onboarding actions
    [ClientTicketSubcategory.JOB_ONBOARDING_SETUP]: 'Setup',
    [ClientTicketSubcategory.JOB_ONBOARDING_DOCUMENTS]: 'Manage Documents for',
    [ClientTicketSubcategory.JOB_ONBOARDING_CHECKLIST]: 'Update Checklist for',
    [ClientTicketSubcategory.JOB_ONBOARDING_TASKS]: 'Manage Tasks for',
    [ClientTicketSubcategory.JOB_ONBOARDING_PROGRESS]: 'Track Progress for',
    [ClientTicketSubcategory.JOB_ONBOARDING_COMPLETION]: 'Complete',

    // Candidate Recommendation actions
    [ClientTicketSubcategory.CANDIDATE_RECOMMENDATION_ALGORITHM]: 'Algorithm',
    [ClientTicketSubcategory.CANDIDATE_RECOMMENDATION_FILTERS]:
      'Update Filters',
    [ClientTicketSubcategory.CANDIDATE_RECOMMENDATION_ACCURACY]: 'Accuracy of',
    [ClientTicketSubcategory.CANDIDATE_RECOMMENDATION_FEEDBACK]: 'Feedback for',
    [ClientTicketSubcategory.CANDIDATE_RECOMMENDATION_CUSTOMIZATION]:
      'Customize',
    [ClientTicketSubcategory.CANDIDATE_RECOMMENDATION_MATCHING]: 'Match',

    // User Invitation actions
    [ClientTicketSubcategory.USER_INVITATION_SEND]: 'Send Invitation for',
    [ClientTicketSubcategory.USER_INVITATION_RESEND]: 'Resend Invitation for',
    [ClientTicketSubcategory.USER_INVITATION_WITHDRAW]:
      'Withdraw Invitation for',
    [ClientTicketSubcategory.USER_INVITATION_EXPIRE]:
      'Handle Expired Invitation for',
    [ClientTicketSubcategory.USER_INVITATION_ACCEPT]: 'Accept Invitation for',
    [ClientTicketSubcategory.USER_INVITATION_DECLINE]: 'Decline Invitation for',
    [ClientTicketSubcategory.USER_INVITATION_BULK_SEND]:
      'Bulk Send Invitations',
    [ClientTicketSubcategory.USER_INVITATION_TEMPLATE]: 'Update Template for',
    [ClientTicketSubcategory.USER_INVITATION_PERMISSIONS]:
      'Update Permissions for',

    // User Management actions
    [ClientTicketSubcategory.USER_CREATE]: 'Create',
    [ClientTicketSubcategory.USER_UPDATE]: 'Update',
    [ClientTicketSubcategory.USER_DEACTIVATE]: 'Deactivate',
    [ClientTicketSubcategory.USER_ACTIVATE]: 'Activate',
    [ClientTicketSubcategory.USER_DELETE]: 'Delete',
    [ClientTicketSubcategory.USER_ROLE_CHANGE]: 'Change Role for',
    [ClientTicketSubcategory.USER_PERMISSIONS]: 'Update Permissions for',
    [ClientTicketSubcategory.USER_ACCESS_CONTROL]: 'Update Access Control for',
    [ClientTicketSubcategory.USER_BULK_ACTIONS]: 'Bulk Actions for',
    [ClientTicketSubcategory.USER_IMPORT]: 'Import',

    // Subscription & Billing actions
    [ClientTicketSubcategory.SUBSCRIPTION_UPGRADE]: 'Upgrade',
    [ClientTicketSubcategory.SUBSCRIPTION_DOWNGRADE]: 'Downgrade',
    [ClientTicketSubcategory.SUBSCRIPTION_CANCEL]: 'Cancel',
    [ClientTicketSubcategory.SUBSCRIPTION_RENEW]: 'Renew',
    [ClientTicketSubcategory.SUBSCRIPTION_TRIAL]: 'Trial',
    [ClientTicketSubcategory.SUBSCRIPTION_PAYMENT_FAILED]: 'Fix Payment Issue',
    [ClientTicketSubcategory.SUBSCRIPTION_PAYMENT_METHOD]:
      'Update Payment Method',
    [ClientTicketSubcategory.SUBSCRIPTION_BILLING_CYCLE]:
      'Update Billing Cycle',
    [ClientTicketSubcategory.SUBSCRIPTION_CREDITS_PURCHASE]: 'Purchase Credits',
    [ClientTicketSubcategory.SUBSCRIPTION_CREDITS_USAGE]: 'Track Credits Usage',
    [ClientTicketSubcategory.SUBSCRIPTION_LIMITS]: 'Update Limits',
    [ClientTicketSubcategory.SUBSCRIPTION_INVOICE]: 'Handle Invoice',
    [ClientTicketSubcategory.SUBSCRIPTION_REFUND]: 'Process Refund',
    [ClientTicketSubcategory.SUBSCRIPTION_PRICING]: 'Update Pricing',

    // AI Assessment actions
    [ClientTicketSubcategory.AI_ASSESSMENT_CREATE]: 'Create',
    [ClientTicketSubcategory.AI_ASSESSMENT_CONFIGURE]: 'Configure',
    [ClientTicketSubcategory.AI_ASSESSMENT_INVITE_CANDIDATE]:
      'Invite Candidate to',
    [ClientTicketSubcategory.AI_ASSESSMENT_RESULTS]: 'Review Results for',
    [ClientTicketSubcategory.AI_ASSESSMENT_VIDEO_ANALYSIS]: 'Analyze Video for',
    [ClientTicketSubcategory.AI_ASSESSMENT_PROCTORING]: 'Proctor',
    [ClientTicketSubcategory.AI_ASSESSMENT_DIFFICULTY]: 'Adjust Difficulty for',
    [ClientTicketSubcategory.AI_ASSESSMENT_SCORING]: 'Score',
    [ClientTicketSubcategory.AI_ASSESSMENT_FEEDBACK]: 'Provide Feedback for',
    [ClientTicketSubcategory.AI_ASSESSMENT_TECHNICAL_ISSUE]:
      'Fix Technical Issue for',
    [ClientTicketSubcategory.AI_ASSESSMENT_REPORTING]: 'Generate Report for',

    // Panel Assessment actions
    [ClientTicketSubcategory.PANEL_ASSESSMENT_SLOT_CREATION]: 'Create Slot for',
    [ClientTicketSubcategory.PANEL_ASSESSMENT_CONFIGURE]: 'Configure',
    [ClientTicketSubcategory.PANEL_ASSESSMENT_INVITE_CANDIDATE]:
      'Invite Candidate for',
    [ClientTicketSubcategory.PANEL_ASSESSMENT_FEEDBACK]: 'Provide Feedback for',
    [ClientTicketSubcategory.PANEL_ASSESSMENT_MEETING_CREATION]:
      'Create Meeting for',
    [ClientTicketSubcategory.PANEL_ASSESSMENT_MEETING_LINK_GENERATION]:
      'Generating Meeting Link for',

    // Company Profile actions
    [ClientTicketSubcategory.COMPANY_PROFILE_UPDATE]: 'Update',
    [ClientTicketSubcategory.COMPANY_VERIFICATION]: 'Verify',
    [ClientTicketSubcategory.COMPANY_LOGO]: 'Update Logo for',
    [ClientTicketSubcategory.COMPANY_DESCRIPTION]: 'Update Description for',
    [ClientTicketSubcategory.COMPANY_CULTURE]: 'Update Culture for',
    [ClientTicketSubcategory.COMPANY_BENEFITS]: 'Update Benefits for',
    [ClientTicketSubcategory.COMPANY_SOCIAL_MEDIA]: 'Update Social Media for',
    [ClientTicketSubcategory.COMPANY_ADDRESS]: 'Update Address for',
    [ClientTicketSubcategory.COMPANY_CONTACT_INFO]: 'Update Contact Info for',
    [ClientTicketSubcategory.COMPANY_DOCUMENTS]: 'Manage Documents for',

    // Integration actions
    [ClientTicketSubcategory.INTEGRATION_JOB_BOARD]: 'Job Board Integration',
    [ClientTicketSubcategory.INTEGRATION_ATS]: 'ATS Integration',
    [ClientTicketSubcategory.INTEGRATION_HRIS]: 'HRIS Integration',
    [ClientTicketSubcategory.INTEGRATION_CALENDAR]: 'Calendar Integration',
    [ClientTicketSubcategory.INTEGRATION_EMAIL]: 'Email Integration',
    [ClientTicketSubcategory.INTEGRATION_SLACK]: 'Slack Integration',
    [ClientTicketSubcategory.INTEGRATION_TEAMS]: 'Teams Integration',
    [ClientTicketSubcategory.INTEGRATION_WEBHOOK]: 'Webhook Integration',
    [ClientTicketSubcategory.INTEGRATION_API]: 'API Integration',
    [ClientTicketSubcategory.INTEGRATION_SETUP]: 'Setup',
    [ClientTicketSubcategory.INTEGRATION_SYNC]: 'Sync',
    [ClientTicketSubcategory.INTEGRATION_ERROR]: 'Fix Integration Error for',

    // Technical Issues
    [ClientTicketSubcategory.TECHNICAL_ISSUE_LOGIN]: 'Fix Login Issue',
    [ClientTicketSubcategory.TECHNICAL_ISSUE_PERFORMANCE]:
      'Fix Performance Issue',
    [ClientTicketSubcategory.TECHNICAL_ISSUE_UI_BUG]: 'Fix UI Bug',
    [ClientTicketSubcategory.TECHNICAL_ISSUE_MOBILE_APP]:
      'Fix Mobile App Issue',
    [ClientTicketSubcategory.TECHNICAL_ISSUE_BROWSER]:
      'Fix Browser Compatibility',
    [ClientTicketSubcategory.TECHNICAL_ISSUE_VIDEO_CALL]:
      'Fix Video Call Issue',
    [ClientTicketSubcategory.TECHNICAL_ISSUE_FILE_UPLOAD]:
      'Fix File Upload Issue',
    [ClientTicketSubcategory.TECHNICAL_ISSUE_NOTIFICATION]:
      'Fix Notification Issue',
    [ClientTicketSubcategory.TECHNICAL_ISSUE_DATA_SYNC]: 'Fix Data Sync Issue',
    [ClientTicketSubcategory.TECHNICAL_ISSUE_SEARCH]: 'Fix Search Issue',

    // Account Settings
    [ClientTicketSubcategory.ACCOUNT_SETTINGS_PROFILE]: 'Update Profile',
    [ClientTicketSubcategory.ACCOUNT_SETTINGS_PASSWORD]: 'Change Password',
    [ClientTicketSubcategory.ACCOUNT_SETTINGS_EMAIL]: 'Update Email',
    [ClientTicketSubcategory.ACCOUNT_SETTINGS_PHONE]: 'Update Phone',
    [ClientTicketSubcategory.ACCOUNT_SETTINGS_TIMEZONE]: 'Update Timezone',
    [ClientTicketSubcategory.ACCOUNT_SETTINGS_LANGUAGE]: 'Update Language',
    [ClientTicketSubcategory.ACCOUNT_SETTINGS_PREFERENCES]:
      'Update Preferences',
    [ClientTicketSubcategory.ACCOUNT_SETTINGS_PRIVACY]:
      'Update Privacy Settings',
    [ClientTicketSubcategory.ACCOUNT_SETTINGS_SECURITY]:
      'Update Security Settings',
    [ClientTicketSubcategory.ACCOUNT_SETTINGS_TWO_FACTOR]:
      'Setup Two-Factor Auth',

    // Notifications
    [ClientTicketSubcategory.NOTIFICATION_SETTINGS_EMAIL]:
      'Configure Email Notifications',
    [ClientTicketSubcategory.NOTIFICATION_SETTINGS_PUSH]:
      'Configure Push Notifications',
    [ClientTicketSubcategory.NOTIFICATION_SETTINGS_SMS]:
      'Configure SMS Notifications',
    [ClientTicketSubcategory.NOTIFICATION_SETTINGS_IN_APP]:
      'Configure In-App Notifications',
    [ClientTicketSubcategory.NOTIFICATION_SETTINGS_FREQUENCY]:
      'Update Notification Frequency',
    [ClientTicketSubcategory.NOTIFICATION_SETTINGS_TEMPLATES]:
      'Update Templates',
    [ClientTicketSubcategory.NOTIFICATION_SETTINGS_DIGEST]: 'Configure Digest',
    [ClientTicketSubcategory.NOTIFICATION_SETTINGS_ALERTS]: 'Configure Alerts',

    // Data Operations
    [ClientTicketSubcategory.DATA_EXPORT_IMPORT_CANDIDATES]:
      'Export/Import Candidates',
    [ClientTicketSubcategory.DATA_EXPORT_IMPORT_JOBS]: 'Export/Import Jobs',
    [ClientTicketSubcategory.DATA_EXPORT_IMPORT_APPLICATIONS]:
      'Export/Import Applications',
    [ClientTicketSubcategory.DATA_EXPORT_IMPORT_USERS]: 'Export/Import Users',
    [ClientTicketSubcategory.DATA_EXPORT_IMPORT_ASSESSMENTS]:
      'Export/Import Assessments',
    [ClientTicketSubcategory.DATA_EXPORT_IMPORT_CSV]: 'CSV Export/Import',
    [ClientTicketSubcategory.DATA_EXPORT_IMPORT_JSON]: 'JSON Export/Import',
    [ClientTicketSubcategory.DATA_EXPORT_IMPORT_XML]: 'XML Export/Import',
    [ClientTicketSubcategory.DATA_EXPORT_IMPORT_FORMAT]: 'Format',
    [ClientTicketSubcategory.DATA_EXPORT_IMPORT_VALIDATION]: 'Validate',

    // Security & Authentication
    [ClientTicketSubcategory.SECURITY_AUTHENTICATION_LOGIN]: 'Fix Login Issue',
    [ClientTicketSubcategory.SECURITY_AUTHENTICATION_LOGOUT]:
      'Fix Logout Issue',
    [ClientTicketSubcategory.SECURITY_AUTHENTICATION_PASSWORD_RESET]:
      'Reset Password',
    [ClientTicketSubcategory.SECURITY_AUTHENTICATION_ACCOUNT_LOCK]:
      'Unlock Account',
    [ClientTicketSubcategory.SECURITY_AUTHENTICATION_SUSPICIOUS_ACTIVITY]:
      'Investigate Suspicious Activity',
    [ClientTicketSubcategory.SECURITY_AUTHENTICATION_ACCESS_DENIED]:
      'Fix Access Denied Issue',
    [ClientTicketSubcategory.SECURITY_AUTHENTICATION_SESSION_EXPIRE]:
      'Fix Session Expire Issue',
    [ClientTicketSubcategory.SECURITY_AUTHENTICATION_SSO]: 'SSO Configuration',
    [ClientTicketSubcategory.SECURITY_AUTHENTICATION_OAUTH]:
      'OAuth Configuration',

    // API Access
    [ClientTicketSubcategory.API_ACCESS_KEY_GENERATION]: 'Generate',
    [ClientTicketSubcategory.API_ACCESS_KEY_REVOKE]: 'Revoke',
    [ClientTicketSubcategory.API_ACCESS_RATE_LIMIT]: 'Adjust Rate Limits',
    [ClientTicketSubcategory.API_ACCESS_DOCUMENTATION]: 'Request Documentation',
    [ClientTicketSubcategory.API_ACCESS_WEBHOOK]: 'Configure Webhook',
    [ClientTicketSubcategory.API_ACCESS_AUTHENTICATION]:
      'Configure Authentication',
    [ClientTicketSubcategory.API_ACCESS_PERMISSIONS]: 'Update Permissions',
    [ClientTicketSubcategory.API_ACCESS_LOGS]: 'View Logs',

    // Reporting & Analytics
    [ClientTicketSubcategory.REPORTING_ANALYTICS_DASHBOARD]:
      'Access Analytics Dashboard',
    [ClientTicketSubcategory.REPORTING_ANALYTICS_JOBS]: 'Job Analytics',
    [ClientTicketSubcategory.REPORTING_ANALYTICS_CANDIDATES]:
      'Candidate Analytics',
    [ClientTicketSubcategory.REPORTING_ANALYTICS_APPLICATIONS]:
      'Application Analytics',
    [ClientTicketSubcategory.REPORTING_ANALYTICS_ASSESSMENTS]:
      'Assessment Analytics',
    [ClientTicketSubcategory.REPORTING_ANALYTICS_PERFORMANCE]:
      'Performance Analytics',
    [ClientTicketSubcategory.REPORTING_ANALYTICS_EXPORT]: 'Export Report',
    [ClientTicketSubcategory.REPORTING_ANALYTICS_CUSTOM]: 'Custom Report',
    [ClientTicketSubcategory.REPORTING_ANALYTICS_SCHEDULED]: 'Scheduled Report',

    // Feature Requests
    [ClientTicketSubcategory.FEATURE_REQUEST_NEW_FEATURE]:
      'Request New Feature',
    [ClientTicketSubcategory.FEATURE_REQUEST_ENHANCEMENT]: 'Enhance Feature',
    [ClientTicketSubcategory.FEATURE_REQUEST_INTEGRATION]:
      'Integration Feature',
    [ClientTicketSubcategory.FEATURE_REQUEST_MOBILE]: 'Mobile Feature',
    [ClientTicketSubcategory.FEATURE_REQUEST_API]: 'API Feature',
    [ClientTicketSubcategory.FEATURE_REQUEST_UI_UX]: 'UI/UX Feature',
    [ClientTicketSubcategory.FEATURE_REQUEST_WORKFLOW]: 'Workflow Feature',
    [ClientTicketSubcategory.FEATURE_REQUEST_AUTOMATION]: 'Automation Feature',

    // General Inquiry
    [ClientTicketSubcategory.GENERAL_INQUIRY_HOW_TO]: 'How To',
    [ClientTicketSubcategory.GENERAL_INQUIRY_BEST_PRACTICES]: 'Best Practices',
    [ClientTicketSubcategory.GENERAL_INQUIRY_TRAINING]: 'Training Request',
    [ClientTicketSubcategory.GENERAL_INQUIRY_DEMO]: 'Demo Request',
    [ClientTicketSubcategory.GENERAL_INQUIRY_PRICING]: 'Pricing Inquiry',
    [ClientTicketSubcategory.GENERAL_INQUIRY_COMPARISON]: 'Comparison',
    [ClientTicketSubcategory.GENERAL_INQUIRY_SUPPORT]: 'Support Request',
    [ClientTicketSubcategory.GENERAL_INQUIRY_FEEDBACK]: 'Feedback',

    // Other
    [ClientTicketSubcategory.OTHER]: 'Other Issue',
  };

  const actionWord = actionWords[subcategory] || subcategoryLabel;

  // Build subject based on available information
  if (targetName && targetType) {
    return `Issue in ${actionWord} ${formatEnumValue(category)} (${targetName})`;
  } else if (targetType) {
    return `Issue in ${actionWord} ${formatEnumValue(targetType)}`;
  } else {
    return `Issue in ${actionWord} ${categoryLabel}`;
  }
}
