import { CommunicationChannelEnum } from '../../models/common/enums';
import { z } from 'zod';

export const partnerUserProfileBasicUpdateValidator = z.object({
  params: z.object({
    partnerUserId: z
      .string()
      .uuid({ message: 'Invalid partner user ID format' }),
  }),
  body: z.object({
    name: z
      .string()
      .min(2, { message: 'Name must be at least 2 characters long' })
      .max(100, { message: 'Name must be at most 100 characters long' })
      .optional(),
    jobTitle: z
      .string()
      .min(2, { message: 'Job title must be at least 2 characters long' })
      .max(100, { message: 'Job title must be at most 100 characters long' })
      .optional(),
  }),
});

export const partnerUserProfilePasswordChangeValidator = z.object({
  params: z.object({
    partnerUserId: z
      .string()
      .uuid({ message: 'Invalid partner user ID format' }),
  }),
  body: z.object({
    currentPassword: z
      .string()
      .min(1, { message: 'Current password is required' }),
    newPassword: z
      .string()
      .min(8, { message: 'New password must be at least 8 characters long' })
      .max(128, { message: 'New password must be at most 128 characters long' })
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
        message:
          'New password must contain at least one lowercase letter, one uppercase letter, and one number',
      }),
  }),
});

export const partnerUserProfilePhotoUpdateValidator = z.object({
  params: z.object({
    partnerUserId: z
      .string()
      .uuid({ message: 'Invalid partner user ID format' }),
  }),
  body: z.object({
    fileName: z
      .string()
      .min(1, { message: 'File name is required' })
      .max(255, { message: 'File name must be at most 255 characters long' }),
  }),
});

export const partnerUserSettingsUpdateValidator = z.object({
  params: z.object({
    partnerUserId: z
      .string()
      .uuid({ message: 'Invalid partner user ID format' }),
  }),
  body: z.object({
    notificationsEnabled: z.boolean().optional(),
    emailNotifications: z.boolean().optional(),
    pushNotifications: z.boolean().optional(),
    darkMode: z.boolean().optional(),
    language: z
      .string()
      .min(2, { message: 'Language code must be at least 2 characters' })
      .max(10, { message: 'Language code must be at most 10 characters' })
      .optional(),
    timezone: z
      .string()
      .min(1, { message: 'Timezone is required if provided' })
      .max(50, { message: 'Timezone must be at most 50 characters' })
      .optional(),
    preferredCommunicationChannel: z
      .nativeEnum(CommunicationChannelEnum, {
        message: 'Invalid communication channel',
      })
      .optional(),
  }),
});
