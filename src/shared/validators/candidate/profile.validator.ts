import { z } from 'zod';
import {
  JobSearchStatusEnum,
  MaritalStatusEnum,
  SexEnum,
} from '../../models/common/enums';

export const candidateProfileBasicSchema = z.object({
  name: z
    .string()
    .min(2, 'Name should be at least 2 characters long')
    .max(100, 'Name should not exceed 100 characters')
    .regex(/^[A-Za-z\s]+$/, 'Name should only contain alphabets')
    .refine(
      (val) => {
        const words = val.trim().split(/\s+/);
        return words.length >= 2 && words.length <= 3;
      },
      {
        message: 'Name must be 2 to 3 words maximum',
      }
    )
    .optional(),
  jobTitle: z
    .string()
    .min(2, 'Job title must be at least 2 characters long')
    .max(50, 'Job title must not exceed 50 characters')
    .regex(
      /^(?!.*[^A-Za-z0-9\s]{4,}).+$/,
      'Job title cannot contain more than 3 consecutive special characters'
    )
    .refine(
      (val) => {
        const digits = val.replace(/[^0-9]/g, '');
        return digits.length <= 1;
      },
      {
        message: 'Invalid Job title',
      }
    )
    .optional(),
  location: z
    .string()
    .trim()
    .min(2, 'Location must be at least 2 characters long')
    .max(100, 'Location must not exceed 100 characters')
    .regex(
      /^(?!.*[^A-Za-z0-9\s]{4,}).+$/,
      'Location cannot contain more than 3 consecutive special characters'
    )
    .optional(),
  totalExperience: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val === '') return true; // Allow empty values
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0 && num <= 69;
      },
      {
        message: 'Experience must be a number between 0 and 69',
      }
    ),
  summary: z
    .string()
    .trim()
    .min(30, 'Summary must be at least 30 characters long')
    .max(1000, 'Summary must not exceed 1000 characters')
    .regex(
      /^(?!.*[^A-Za-z0-9\s]{4,}).+$/,
      'Summary cannot contain more than 3 consecutive special characters'
    )
    .optional(),
  industriesString: z
    .string()
    .optional()
    .refine((val) => !val || val.trim().length > 0, {
      message: 'If provided, at least one industry is required',
    }),
  languagesString: z
    .string()
    .optional()
    .refine((val) => !val || val.trim().length > 0, {
      message: 'If provided, at least one language is required',
    }),
  resumeSkillsString: z
    .string()
    .min(1, 'Please add skills to continue')
    .optional(),
  sex: z.nativeEnum(SexEnum).optional(),
  birthDate: z
    .union([z.string().transform((str) => new Date(str)), z.date()])
    .refine((date) => !isNaN(date.getTime()), {
      message: 'Birth date must be a valid date',
    })
    .optional(),
  maritalStatus: z.nativeEnum(MaritalStatusEnum).optional(),
  jobSearchStatus: z.nativeEnum(JobSearchStatusEnum).optional(),
});

// Validator for updating basic profile information
export const candidateProfileBasicUpdateValidator = z.object({
  body: candidateProfileBasicSchema,
});

// Validator for changing password
export const candidateProfilePasswordChangeSchema = z.object({
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

export const candidateProfileByEmailIDSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
});

export const candidateProfileByEmailIDValidator = z.object({
  params: candidateProfileByEmailIDSchema,
});

// Validator for changing password
export const candidateProfilePasswordChangeValidator = z.object({
  body: candidateProfilePasswordChangeSchema,
});

// Validator for updating profile photo
export const candidateProfilePhotoUpdateSchema = z.object({
  fileName: z
    .string()
    .min(1, { message: 'File name is required' })
    .regex(/\.(jpg|jpeg|png)$/i, {
      message: 'File must be jpg, jpeg, or png',
    }),
});

// Validator for updating profile photo
export const candidateProfilePhotoUpdateValidator = z.object({
  body: candidateProfilePhotoUpdateSchema,
});

// Validator for deleting profile photo
export const candidateProfilePhotoDeleteSchema = z.object({
  softDelete: z.boolean().default(true),
});

// Validator for deleting profile photo
export const candidateProfilePhotoDeleteValidator = z.object({
  body: candidateProfilePhotoDeleteSchema,
});
