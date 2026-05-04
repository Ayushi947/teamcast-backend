import { WorkScheduleEnum } from '../../common/enums';
import { WorkTypeEnum } from '../../common/enums';
import { CommunicationChannelEnum } from '../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateSettings:
 *       type: object
 *       properties:
 *         notificationsEnabled:
 *           type: boolean
 *           description: Whether all notifications are enabled
 *         emailNotifications:
 *           type: boolean
 *           description: Email-specific notifications toggle
 *         pushNotifications:
 *           type: boolean
 *           description: Push notification-specific toggle
 *         jobAlerts:
 *           type: boolean
 *           description: Whether job alerts are enabled
 *         applicationUpdates:
 *           type: boolean
 *           description: Whether application updates are enabled
 *         profileVisibility:
 *           type: boolean
 *           description: Whether profile is visible to employers
 *         shareDataWithEmployers:
 *           type: boolean
 *           description: Whether data can be shared with employers
 *         darkMode:
 *           type: boolean
 *           description: UI theme preference
 *         language:
 *           type: string
 *           description: User interface language
 *         timezone:
 *           type: string
 *           description: User's preferred timezone
 *         preferredCommunicationChannel:
 *           type: string
 *           description: Preferred communication channel
 */
export interface ICandidateSettings {
  id: string;
  candidateId: string;
  globalSettingsId?: string;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  jobAlerts: boolean;
  applicationUpdates: boolean;
  profileVisibility: boolean;
  shareDataWithEmployers: boolean;
  darkMode: boolean;
  language: string;
  timezone: string;
  preferredCommunicationChannel?: CommunicationChannelEnum;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateSettingsUpdate:
 *       type: object
 *       properties:
 *         notificationsEnabled:
 *           type: boolean
 *           description: Whether all notifications are enabled
 *         emailNotifications:
 *           type: boolean
 *           description: Email-specific notifications toggle
 *         pushNotifications:
 *           type: boolean
 *           description: Push notification-specific toggle
 *         jobAlerts:
 *           type: boolean
 *           description: Whether job alerts are enabled
 *         applicationUpdates:
 *           type: boolean
 *           description: Whether application updates are enabled
 *         profileVisibility:
 *           type: boolean
 *           description: Whether profile is visible to employers
 *         shareDataWithEmployers:
 *           type: boolean
 *           description: Whether data can be shared with employers
 *         darkMode:
 *           type: boolean
 *           description: UI theme preference
 *         language:
 *           type: string
 *           description: User interface language
 *         timezone:
 *           type: string
 *           description: User's preferred timezone
 *         preferredCommunicationChannel:
 *           type: string
 *           description: Preferred communication channel
 */

export type ICandidateSettingsUpdate = Partial<ICandidateSettings>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidatePreferences:
 *       type: object
 *       properties:
 *         preferredIndustries:
 *           type: array
 *           items:
 *             type: string
 *           description: Preferred industries for job search
 *         preferredLocations:
 *           type: array
 *           items:
 *             type: string
 *           description: Preferred job locations
 *         preferredWorkTypes:
 *           type: array
 *           items:
 *             type: string
 *           description: Preferred work types
 *         preferredJobTitles:
 *           type: array
 *           items:
 *             type: string
 *           description: Preferred job titles
 *         preferredJobCommitments:
 *           type: array
 *           items:
 *             type: string
 *           description: Preferred job commitments
 *         preferredJobSchedules:
 *           type: array
 *           items:
 *             ref: '#/components/schemas/WorkScheduleEnum'
 *           description: Preferred job schedules
 *         preferredSalaryMin:
 *           type: number
 *           description: Minimum preferred salary
 *         preferredSalaryMax:
 *           type: number
 *           description: Maximum preferred salary
 *         preferredSalaryCurrency:
 *           type: string
 *           description: Preferred salary currency
 *         preferredEquity:
 *           type: boolean
 *           description: Whether equity is preferred
 *         preferredBenefits:
 *           type: array
 *           items:
 *             type: string
 *           description: Preferred benefits
 *         preferredResponsibilities:
 *           type: array
 *           items:
 *             type: string
 *           description: Preferred job responsibilities
 *         preferredTags:
 *           type: array
 *           items:
 *             type: string
 *           description: Preferred job tags
 */
export interface ICandidatePreferences {
  id: string;
  candidateId: string;
  preferredIndustries: string[];
  preferredLocations: string[];
  preferredWorkTypes: WorkTypeEnum[];
  preferredJobTitles?: string[];
  preferredJobCommitments?: string[];
  preferredJobSchedules?: WorkScheduleEnum[];
  preferredSalaryMin?: number;
  preferredSalaryMax?: number;
  preferredSalaryCurrency?: string;
  preferredEquity?: boolean;
  preferredBenefits?: string[];
  preferredResponsibilities?: string[];
  preferredTags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidatePreferences:
 *       type: object
 *       properties:
 *         preferredIndustries:
 *           type: array
 *           items:
 *             type: string
 *           description: Preferred industries for job search
 *         preferredLocations:
 *           type: array
 *           items:
 *             type: string
 *           description: Preferred job locations
 *         preferredWorkTypes:
 *           type: array
 *           items:
 *             type: string
 *           description: Preferred work types
 *         preferredJobTitles:
 *           type: array
 *           items:
 *             type: string
 *           description: Preferred job titles
 *         preferredJobCommitments:
 *           type: array
 *           items:
 *             type: string
 *           description: Preferred job commitments
 *         preferredJobSchedules:
 *           type: array
 *           items:
 *             ref: '#/components/schemas/WorkScheduleEnum'
 *           description: Preferred job schedules
 *         preferredSalaryMin:
 *           type: number
 *           description: Minimum preferred salary
 *         preferredSalaryMax:
 *           type: number
 *           description: Maximum preferred salary
 *         preferredSalaryCurrency:
 *           type: string
 *           description: Preferred salary currency
 *         preferredEquity:
 *           type: boolean
 *           description: Whether equity is preferred
 *         preferredBenefits:
 *           type: array
 *           items:
 *             type: string
 *           description: Preferred benefits
 *         preferredResponsibilities:
 *           type: array
 *           items:
 *             type: string
 *           description: Preferred job responsibilities
 *         preferredTags:
 *           type: array
 *           items:
 *             type: string
 *           description: Preferred job tags
 */
export type ICandidatePreferencesUpdate = Partial<ICandidatePreferences>;

// Helper functions to convert database models to domain models
export function toCandidateSettingsDomain(settings: any): ICandidateSettings {
  return {
    id: settings.id,
    candidateId: settings.candidateId,
    globalSettingsId: settings.globalSettingsId,
    notificationsEnabled: settings.notificationsEnabled ?? true,
    emailNotifications: settings.emailNotifications ?? true,
    pushNotifications: settings.pushNotifications ?? true,
    jobAlerts: settings.jobAlerts ?? true,
    applicationUpdates: settings.applicationUpdates ?? true,
    profileVisibility: settings.profileVisibility ?? true,
    shareDataWithEmployers: settings.shareDataWithEmployers ?? true,
    darkMode: settings.darkMode ?? false,
    language: settings.language ?? 'en',
    timezone: settings.timezone ?? 'UTC',
    preferredCommunicationChannel: settings.preferredCommunicationChannel,
    createdAt: settings.createdAt,
    updatedAt: settings.updatedAt,
  };
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidatePreferencesUpdate:
 *       type: object
 *       properties:
 *         preferredIndustries:
 *           type: array
 *           items:
 *             type: string
 *           description: Preferred industries for job search
 *         preferredLocations:
 *           type: array
 *           items:
 *             type: string
 *           description: Preferred job locations
 *         preferredWorkTypes:
 *           type: array
 *           items:
 *             type: string
 *           description: Preferred work types
 *         preferredJobTitles:
 *           type: array
 *           items:
 *             type: string
 *           description: Preferred job titles
 *         preferredJobCommitments:
 *           type: array
 *           items:
 *             type: string
 *           description: Preferred job commitments
 *         preferredJobSchedules:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/WorkScheduleEnum'
 *           description: Preferred job schedules
 *         preferredSalaryMin:
 *           type: number
 *           description: Minimum preferred salary
 *         preferredSalaryMax:
 *           type: number
 *           description: Maximum preferred salary
 *         preferredSalaryCurrency:
 *           type: string
 *           description: Preferred salary currency
 *         preferredEquity:
 *           type: boolean
 *           description: Whether equity is preferred
 *         preferredBenefits:
 *           type: array
 *           items:
 *             type: string
 *           description: Preferred benefits
 *         preferredResponsibilities:
 *           type: array
 *           items:
 *             type: string
 *           description: Preferred job responsibilities
 *         preferredTags:
 *           type: array
 *           items:
 *             type: string
 *           description: Preferred job tags
 */

/**
 * Converts database model to candidate preferences domain model
 * @param preferences - Database preferences object
 * @returns Formatted candidate preferences domain object
 */
export function toCandidatePreferencesDomain(
  preferences: any
): ICandidatePreferences {
  return {
    id: preferences.id,
    candidateId: preferences.candidateId,
    preferredIndustries: preferences.preferredIndustries ?? [],
    preferredLocations: preferences.preferredLocations ?? [],
    preferredWorkTypes: preferences.preferredWorkTypes ?? [],
    preferredJobTitles: preferences.preferredJobTitles ?? [],
    preferredJobCommitments: preferences.preferredJobCommitments ?? [],
    preferredJobSchedules: preferences.preferredJobSchedules ?? [],
    preferredSalaryMin: preferences.preferredSalaryMin,
    preferredSalaryMax: preferences.preferredSalaryMax,
    preferredSalaryCurrency: preferences.preferredSalaryCurrency ?? 'INR',
    preferredEquity: preferences.preferredEquity ?? false,
    preferredBenefits: preferences.preferredBenefits ?? [],
    preferredResponsibilities: preferences.preferredResponsibilities ?? [],
    preferredTags: preferences.preferredTags ?? [],
    createdAt: preferences.createdAt,
    updatedAt: preferences.updatedAt,
  };
}
