import { z } from 'zod';
import {
  CommunicationChannelEnum,
  DateFormatEnum,
  TimeFormatEnum,
} from '../../models/common/enums';

/**
 * Validator for updating global settings
 */
export const globalSettingsUpdateValidator = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, { message: 'Name is required' })
      .max(255, { message: 'Name must be at most 255 characters' })
      .optional(),
    description: z
      .string()
      .max(1000, { message: 'Description must be at most 1000 characters' })
      .optional()
      .nullable(),
    defaultNotificationsEnabled: z.boolean().optional(),
    defaultEmailNotifications: z.boolean().optional(),
    defaultPushNotifications: z.boolean().optional(),
    defaultSmsNotifications: z.boolean().optional(),
    defaultInAppNotifications: z.boolean().optional(),
    defaultJobAlerts: z.boolean().optional(),
    defaultCandidateAlerts: z.boolean().optional(),
    defaultApplicationAlerts: z.boolean().optional(),
    defaultApplicationUpdates: z.boolean().optional(),
    defaultConsultantAlerts: z.boolean().optional(),
    defaultContractAlerts: z.boolean().optional(),
    defaultDarkMode: z.boolean().optional(),
    defaultLanguage: z
      .string()
      .min(2, { message: 'Language code must be at least 2 characters' })
      .max(10, { message: 'Language code must be at most 10 characters' })
      .optional(),
    defaultTimezone: z
      .string()
      .min(1, { message: 'Timezone is required' })
      .max(100, { message: 'Timezone must be at most 100 characters' })
      .optional(),
    defaultDateFormat: z
      .nativeEnum(DateFormatEnum, { message: 'Invalid date format' })
      .optional(),
    defaultTimeFormat: z
      .nativeEnum(TimeFormatEnum, { message: 'Invalid time format' })
      .optional(),
    defaultFirstDayOfWeek: z
      .number()
      .int()
      .min(0, { message: 'First day of week must be 0 or 1' })
      .max(1, { message: 'First day of week must be 0 or 1' })
      .optional(),
    defaultCommunicationChannel: z
      .nativeEnum(CommunicationChannelEnum, {
        message: 'Invalid communication channel',
      })
      .optional(),
    defaultDataSharing: z.boolean().optional(),
    defaultProfileVisibility: z.boolean().optional(),
    defaultActivityTracking: z.boolean().optional(),
    defaultShareDataWithEmployers: z.boolean().optional(),
    defaultCurrency: z
      .string()
      .length(3, { message: 'Currency code must be 3 characters' })
      .optional(),
    defaultCountry: z
      .string()
      .length(2, { message: 'Country code must be 2 characters' })
      .optional(),
    maxFileUploadSize: z
      .number()
      .int()
      .min(1, { message: 'Max file upload size must be at least 1 MB' })
      .max(25, { message: 'Max file upload size must be at most 25 MB' })
      .optional(),
    maxFilesPerUpload: z
      .number()
      .int()
      .min(1, { message: 'Max files per upload must be at least 1' })
      .max(10, { message: 'Max files per upload must be at most 10' })
      .optional(),
    sessionTimeout: z
      .number()
      .int()
      .min(5, { message: 'Session timeout must be at least 5 minutes' })
      .max(1440, { message: 'Session timeout must be at most 1440 minutes' })
      .optional(),
    maxLoginAttempts: z
      .number()
      .int()
      .min(3, { message: 'Max login attempts must be at least 3' })
      .max(20, { message: 'Max login attempts must be at most 20' })
      .optional(),
    passwordExpiryDays: z
      .number()
      .int()
      .min(30, { message: 'Password expiry must be at least 30 days' })
      .max(365, { message: 'Password expiry must be at most 365 days' })
      .optional(),
    candidateDefaultSettings: z.any().optional().nullable(),
    clientDefaultSettings: z.any().optional().nullable(),
    partnerDefaultSettings: z.any().optional().nullable(),
    customStyles: z.any().optional().nullable(),
    customBranding: z.any().optional().nullable(),
  }),
});
