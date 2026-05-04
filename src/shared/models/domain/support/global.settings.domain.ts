import {
  CommunicationChannelEnum,
  DateFormatEnum,
  TimeFormatEnum,
} from '../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     IGlobalSettings:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the global settings
 *         name:
 *           type: string
 *           description: Name of this configuration
 *         description:
 *           type: string
 *           description: Description of this configuration
 *         defaultNotificationsEnabled:
 *           type: boolean
 *           description: Default notification enabled state
 *         defaultEmailNotifications:
 *           type: boolean
 *           description: Default email notification state
 *         defaultPushNotifications:
 *           type: boolean
 *           description: Default push notification state
 *         defaultSmsNotifications:
 *           type: boolean
 *           description: Default SMS notification state
 *         defaultInAppNotifications:
 *           type: boolean
 *           description: Default in-app notification state
 *         defaultJobAlerts:
 *           type: boolean
 *           description: Default job alerts state
 *         defaultCandidateAlerts:
 *           type: boolean
 *           description: Default candidate alerts state
 *         defaultApplicationAlerts:
 *           type: boolean
 *           description: Default application alerts state
 *         defaultApplicationUpdates:
 *           type: boolean
 *           description: Default application updates state
 *         defaultConsultantAlerts:
 *           type: boolean
 *           description: Default consultant alerts state
 *         defaultContractAlerts:
 *           type: boolean
 *           description: Default contract alerts state
 *         defaultDarkMode:
 *           type: boolean
 *           description: Default dark mode state
 *         defaultLanguage:
 *           type: string
 *           description: Default language code
 *         defaultTimezone:
 *           type: string
 *           description: Default timezone
 *         defaultDateFormat:
 *           $ref: '#/components/schemas/DateFormatEnum'
 *         defaultTimeFormat:
 *           $ref: '#/components/schemas/TimeFormatEnum'
 *         defaultFirstDayOfWeek:
 *           type: integer
 *           description: Default first day of week (0 = Sunday, 1 = Monday)
 *         defaultCommunicationChannel:
 *           $ref: '#/components/schemas/CommunicationChannelEnum'
 *         defaultDataSharing:
 *           type: boolean
 *           description: Default data sharing state
 *         defaultProfileVisibility:
 *           type: boolean
 *           description: Default profile visibility state
 *         defaultActivityTracking:
 *           type: boolean
 *           description: Default activity tracking state
 *         defaultShareDataWithEmployers:
 *           type: boolean
 *           description: Default share data with employers state
 *         defaultCurrency:
 *           type: string
 *           description: Default currency code
 *         defaultCountry:
 *           type: string
 *           description: Default country code
 *         maxFileUploadSize:
 *           type: integer
 *           description: Maximum file upload size in MB
 *         maxFilesPerUpload:
 *           type: integer
 *           description: Maximum files per upload
 *         sessionTimeout:
 *           type: integer
 *           description: Session timeout in minutes
 *         maxLoginAttempts:
 *           type: integer
 *           description: Maximum login attempts allowed
 *         passwordExpiryDays:
 *           type: integer
 *           description: Password expiry in days
 *         candidateDefaultSettings:
 *           type: object
 *           description: Default settings for candidates (JSON)
 *         clientDefaultSettings:
 *           type: object
 *           description: Default settings for clients (JSON)
 *         partnerDefaultSettings:
 *           type: object
 *           description: Default settings for partners (JSON)
 *         customStyles:
 *           type: object
 *           description: Global UI customization options (JSON)
 *         customBranding:
 *           type: object
 *           description: Global branding options (JSON)
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
export interface IGlobalSettings {
  id: string;
  name: string;
  description?: string;
  defaultNotificationsEnabled: boolean;
  defaultEmailNotifications: boolean;
  defaultPushNotifications: boolean;
  defaultSmsNotifications: boolean;
  defaultInAppNotifications: boolean;
  defaultJobAlerts: boolean;
  defaultCandidateAlerts: boolean;
  defaultApplicationAlerts: boolean;
  defaultApplicationUpdates: boolean;
  defaultConsultantAlerts: boolean;
  defaultContractAlerts: boolean;
  defaultDarkMode: boolean;
  defaultLanguage: string;
  defaultTimezone: string;
  defaultDateFormat: DateFormatEnum;
  defaultTimeFormat: TimeFormatEnum;
  defaultFirstDayOfWeek: number;
  defaultCommunicationChannel: CommunicationChannelEnum;
  defaultDataSharing: boolean;
  defaultProfileVisibility: boolean;
  defaultActivityTracking: boolean;
  defaultShareDataWithEmployers: boolean;
  defaultCurrency: string;
  defaultCountry: string;
  maxFileUploadSize: number;
  maxFilesPerUpload: number;
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordExpiryDays: number;
  candidateDefaultSettings?: any;
  clientDefaultSettings?: any;
  partnerDefaultSettings?: any;
  customStyles?: any;
  customBranding?: any;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IGlobalSettingsUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Name of this configuration
 *         description:
 *           type: string
 *           description: Description of this configuration
 *         defaultNotificationsEnabled:
 *           type: boolean
 *         defaultEmailNotifications:
 *           type: boolean
 *         defaultPushNotifications:
 *           type: boolean
 *         defaultSmsNotifications:
 *           type: boolean
 *         defaultInAppNotifications:
 *           type: boolean
 *         defaultJobAlerts:
 *           type: boolean
 *         defaultCandidateAlerts:
 *           type: boolean
 *         defaultApplicationAlerts:
 *           type: boolean
 *         defaultApplicationUpdates:
 *           type: boolean
 *         defaultConsultantAlerts:
 *           type: boolean
 *         defaultContractAlerts:
 *           type: boolean
 *         defaultDarkMode:
 *           type: boolean
 *         defaultLanguage:
 *           type: string
 *         defaultTimezone:
 *           type: string
 *         defaultDateFormat:
 *           $ref: '#/components/schemas/DateFormatEnum'
 *         defaultTimeFormat:
 *           $ref: '#/components/schemas/TimeFormatEnum'
 *         defaultFirstDayOfWeek:
 *           type: integer
 *         defaultCommunicationChannel:
 *           $ref: '#/components/schemas/CommunicationChannelEnum'
 *         defaultDataSharing:
 *           type: boolean
 *         defaultProfileVisibility:
 *           type: boolean
 *         defaultActivityTracking:
 *           type: boolean
 *         defaultShareDataWithEmployers:
 *           type: boolean
 *         defaultCurrency:
 *           type: string
 *         defaultCountry:
 *           type: string
 *         maxFileUploadSize:
 *           type: integer
 *         maxFilesPerUpload:
 *           type: integer
 *         sessionTimeout:
 *           type: integer
 *         maxLoginAttempts:
 *           type: integer
 *         passwordExpiryDays:
 *           type: integer
 *         candidateDefaultSettings:
 *           type: object
 *         clientDefaultSettings:
 *           type: object
 *         partnerDefaultSettings:
 *           type: object
 *         customStyles:
 *           type: object
 *         customBranding:
 *           type: object
 */
export type IGlobalSettingsUpdate = Partial<
  Omit<IGlobalSettings, 'id' | 'createdAt' | 'updatedAt'>
>;

/**
 * Helper function to convert database model to domain model
 */
export function toGlobalSettingsDomain(settings: any): IGlobalSettings {
  return {
    id: settings.id,
    name: settings.name,
    description: settings.description,
    defaultNotificationsEnabled: settings.defaultNotificationsEnabled ?? true,
    defaultEmailNotifications: settings.defaultEmailNotifications ?? true,
    defaultPushNotifications: settings.defaultPushNotifications ?? true,
    defaultSmsNotifications: settings.defaultSmsNotifications ?? false,
    defaultInAppNotifications: settings.defaultInAppNotifications ?? true,
    defaultJobAlerts: settings.defaultJobAlerts ?? true,
    defaultCandidateAlerts: settings.defaultCandidateAlerts ?? true,
    defaultApplicationAlerts: settings.defaultApplicationAlerts ?? true,
    defaultApplicationUpdates: settings.defaultApplicationUpdates ?? true,
    defaultConsultantAlerts: settings.defaultConsultantAlerts ?? true,
    defaultContractAlerts: settings.defaultContractAlerts ?? true,
    defaultDarkMode: settings.defaultDarkMode ?? false,
    defaultLanguage: settings.defaultLanguage ?? 'en',
    defaultTimezone: settings.defaultTimezone ?? 'UTC',
    defaultDateFormat:
      (settings.defaultDateFormat as DateFormatEnum) ??
      DateFormatEnum.MM_DD_YYYY,
    defaultTimeFormat:
      (settings.defaultTimeFormat as TimeFormatEnum) ??
      TimeFormatEnum.TWELVE_HOUR,
    defaultFirstDayOfWeek: settings.defaultFirstDayOfWeek ?? 0,
    defaultCommunicationChannel:
      (settings.defaultCommunicationChannel as CommunicationChannelEnum) ??
      CommunicationChannelEnum.EMAIL,
    defaultDataSharing: settings.defaultDataSharing ?? false,
    defaultProfileVisibility: settings.defaultProfileVisibility ?? true,
    defaultActivityTracking: settings.defaultActivityTracking ?? true,
    defaultShareDataWithEmployers:
      settings.defaultShareDataWithEmployers ?? true,
    defaultCurrency: settings.defaultCurrency ?? 'USD',
    defaultCountry: settings.defaultCountry ?? 'US',
    maxFileUploadSize: settings.maxFileUploadSize ?? 10,
    maxFilesPerUpload: settings.maxFilesPerUpload ?? 5,
    sessionTimeout: settings.sessionTimeout ?? 30,
    maxLoginAttempts: settings.maxLoginAttempts ?? 5,
    passwordExpiryDays: settings.passwordExpiryDays ?? 90,
    candidateDefaultSettings: settings.candidateDefaultSettings,
    clientDefaultSettings: settings.clientDefaultSettings,
    partnerDefaultSettings: settings.partnerDefaultSettings,
    customStyles: settings.customStyles,
    customBranding: settings.customBranding,
    createdAt: settings.createdAt,
    updatedAt: settings.updatedAt,
  };
}
