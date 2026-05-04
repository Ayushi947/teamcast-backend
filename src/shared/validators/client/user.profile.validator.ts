import { z } from 'zod';

export const clientUserProfileUpdateSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters long' })
    .max(100, { message: 'Name must be at most 100 characters long' }),
  jobTitle: z
    .string()
    .min(2, { message: 'Job title must be at least 2 characters long' })
    .max(100, { message: 'Job title must be at most 100 characters long' })
    .optional(),
});

// Validator for updating basic profile information
export const clientUserProfileBasicUpdateValidator = z.object({
  body: clientUserProfileUpdateSchema,
});

// Validator for changing password
export const clientUserProfilePasswordChangeSchema = z.object({
  currentPassword: z.string().min(8, {
    message: 'Current password must be at least 8 characters long',
  }),
  newPassword: z
    .string()
    .min(8, { message: 'New password must be at least 8 characters long' })
    .max(100, { message: 'New password must be at most 100 characters long' })
    .regex(/[a-z]/, {
      message: 'New password must contain at least one lowercase letter',
    })
    .regex(/[A-Z]/, {
      message: 'New password must contain at least one uppercase letter',
    })
    .regex(/[0-9]/, {
      message: 'New password must contain at least one number',
    })
    .regex(/[^a-zA-Z0-9]/, {
      message: 'New password must contain at least one special character',
    }),
});

// Validator for changing password
export const clientUserProfilePasswordChangeValidator = z.object({
  body: clientUserProfilePasswordChangeSchema,
});

// Validator for updating profile photo
export const clientUserProfilePhotoUpdateSchema = z.object({
  fileName: z
    .string()
    .min(1, { message: 'File name is required' })
    .regex(/\.(jpg|jpeg|png)$/i, {
      message: 'File must be jpg, jpeg, or png',
    }),
});

// Validator for updating profile photo
export const clientUserProfilePhotoUpdateValidator = z.object({
  body: clientUserProfilePhotoUpdateSchema,
});

// Validator for updating client user settings
export const clientUserSettingsUpdateSchema = z.object({
  notificationsEnabled: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  darkMode: z.boolean().optional(),
  language: z.string().min(2).max(10).optional(),
  timezone: z.string().min(2).max(50).optional(),
  preferredCommunicationChannel: z
    .enum(['EMAIL', 'PHONE', 'SMS', 'IN_APP'])
    .optional(),
});

// Validator for updating client user settings
export const clientUserSettingsUpdateValidator = z.object({
  body: clientUserSettingsUpdateSchema,
});
