import { z } from 'zod';
import {
  CommunicationChannelEnum,
  WorkScheduleEnum,
  WorkTypeEnum,
} from '../../models/common/enums';

// Settings validator
export const candidateSettingsSchema = z.object({
  notificationsEnabled: z.boolean(),
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  jobAlerts: z.boolean(),
  applicationUpdates: z.boolean(),
  profileVisibility: z.boolean(),
  shareDataWithEmployers: z.boolean(),
  darkMode: z.boolean(),
  language: z.string().min(2).max(10),
  timezone: z.string(),
  preferredCommunicationChannel: z
    .nativeEnum(CommunicationChannelEnum)
    .optional(),
});

export const candidateSettingsUpdateValidator = z.object({
  body: candidateSettingsSchema,
});

// Preferences validator
export const candidatePreferencesSchema = z.object({
  preferredIndustries: z.array(z.string()),
  preferredLocations: z.array(z.string()),
  preferredWorkTypes: z.array(z.nativeEnum(WorkTypeEnum)),
  preferredJobTitles: z.array(z.string()).optional(),
  preferredJobCommitments: z.array(z.string()).optional(),
  preferredJobSchedules: z.array(z.nativeEnum(WorkScheduleEnum)).optional(),
  preferredSalaryMin: z.number().optional(),
  preferredSalaryMax: z.number().optional(),
  preferredSalaryCurrency: z.string().optional(),
  preferredEquity: z.boolean().optional(),
  preferredBenefits: z.array(z.string()).optional(),
  preferredResponsibilities: z.array(z.string()).optional(),
  preferredTags: z.array(z.string()).optional(),
});

export const candidatePreferencesUpdateValidator = z.object({
  body: candidatePreferencesSchema,
});
