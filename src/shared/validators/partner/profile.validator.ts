import {
  CompanyIndustryEnum,
  CompanySizeEnum,
  CompanyStageEnum,
  CompanyTypeEnum,
  DifficultyLevelEnum,
} from '../../models/common/enums';
import { z } from 'zod';

export const partnerProfileBasicUpdateValidator = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, { message: 'Name must be at least 2 characters' })
      .max(100, { message: 'Name must be at most 100 characters' })
      .optional(),
    description: z
      .string()
      .min(10, { message: 'Description must be at least 10 characters' })
      .max(1000, { message: 'Description must be at most 1000 characters' })
      .optional(),
    companyType: z
      .nativeEnum(CompanyTypeEnum, { message: 'Invalid company type' })
      .optional(),
    industry: z
      .nativeEnum(CompanyIndustryEnum, { message: 'Invalid industry' })
      .optional(),
    size: z
      .nativeEnum(CompanySizeEnum, { message: 'Invalid company size' })
      .optional(),
    stage: z
      .nativeEnum(CompanyStageEnum, { message: 'Invalid company stage' })
      .optional(),
    foundedYear: z
      .number()
      .int()
      .min(1800, { message: 'Founded year must be at least 1800' })
      .max(new Date().getFullYear(), {
        message: `Founded year must be at most ${new Date().getFullYear()}`,
      })
      .optional(),
    website: z
      .string()
      .url({ message: 'Website must be a valid URL' })
      .optional()
      .nullable(),
    benefits: z.array(z.string()).optional(),
    contactEmail: z
      .string()
      .email({ message: 'Contact email must be a valid email' })
      .optional()
      .nullable(),
    contactPhone: z
      .string()
      .regex(/^\+?[1-9][\d\-+]{0,14}$/, {
        message: 'Phone number must be a valid international format',
      })
      .optional()
      .nullable(),
    contactName: z.string().optional().nullable(),
  }),
});

export const partnerProfileAddressUpdateValidator = z.object({
  body: z.object({
    address: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    zipCode: z.string().optional().nullable(),
    country: z.string().optional().nullable(),
  }),
});

export const partnerProfileShippingAddressUpdateValidator = z.object({
  body: z.object({
    shippingAddress: z.string().optional().nullable(),
    shippingCity: z.string().optional().nullable(),
    shippingState: z.string().optional().nullable(),
    shippingZipCode: z.string().optional().nullable(),
    shippingCountry: z.string().optional().nullable(),
  }),
});

export const partnerProfileBillingAddressUpdateValidator = z.object({
  body: z.object({
    billingAddress: z.string().optional().nullable(),
    billingCity: z.string().optional().nullable(),
    billingState: z.string().optional().nullable(),
    billingZipCode: z.string().optional().nullable(),
    billingCountry: z.string().optional().nullable(),
  }),
});

export const partnerProfileSocialUpdateValidator = z.object({
  body: z.object({
    linkedin: z
      .string()
      .url({ message: 'LinkedIn URL must be valid' })
      .optional()
      .nullable(),
    twitter: z
      .string()
      .url({ message: 'Twitter URL must be valid' })
      .optional()
      .nullable(),
    facebook: z
      .string()
      .url({ message: 'Facebook URL must be valid' })
      .optional()
      .nullable(),
    instagram: z
      .string()
      .url({ message: 'Instagram URL must be valid' })
      .optional()
      .nullable(),
    youtube: z
      .string()
      .url({ message: 'YouTube URL must be valid' })
      .optional()
      .nullable(),
    github: z
      .string()
      .url({ message: 'GitHub URL must be valid' })
      .optional()
      .nullable(),
  }),
});

export const partnerProfileCultureUpdateValidator = z.object({
  body: z.object({
    mission: z
      .string()
      .max(1000, { message: 'Mission must be at most 1000 characters' })
      .optional()
      .nullable(),
    vision: z
      .string()
      .max(1000, { message: 'Vision must be at most 1000 characters' })
      .optional()
      .nullable(),
    values: z.array(z.string()).optional(),
    perks: z.array(z.string()).optional(),
    workEnvironment: z.array(z.string()).optional(),
  }),
});

export const partnerProfileSettingsUpdateValidator = z.object({
  body: z.object({
    notificationsEnabled: z.boolean().optional(),
    emailNotifications: z.boolean().optional(),
    pushNotifications: z.boolean().optional(),
    jobAlerts: z.boolean().optional(),
    candidateAlerts: z.boolean().optional(),
    applicationAlerts: z.boolean().optional(),
    privacySettings: z.any().optional(),
    brandingSettings: z.any().optional(),
    integrationSettings: z.any().optional(),
  }),
});

export const partnerProfileAiAssessmentSettingsUpdateValidator = z.object({
  body: z.object({
    enabled: z.boolean().optional(),
    defaultAssessmentDuration: z.number().int().min(1).max(120).optional(),
    maxAssessmentDuration: z.number().int().min(1).max(180).optional(),
    assessmentBuffer: z.number().int().min(1).max(30).optional(),
    useCustomPrompts: z.boolean().optional(),
    technicalAssessmentEnabled: z.boolean().optional(),
    behavioralAssessmentEnabled: z.boolean().optional(),
    culturalFitAssessmentEnabled: z.boolean().optional(),
    aiDifficulty: z.nativeEnum(DifficultyLevelEnum).optional(),
    customPrompts: z.any().optional(),
    skillWeightings: z.any().optional(),
    passThreshold: z.number().min(0).max(1).optional(),
  }),
});

export const partnerFinancialDataCreateValidator = z.object({
  body: z.object({
    annualRevenue: z
      .number()
      .min(0, { message: 'Annual revenue must be positive' }),
    taxId: z
      .string()
      .min(1, { message: 'Tax ID is required' })
      .max(50, { message: 'Tax ID must be at most 50 characters' }),
    vatNumber: z
      .string()
      .max(50, { message: 'VAT number must be at most 50 characters' })
      .optional()
      .nullable(),
    gstNumber: z
      .string()
      .max(50, { message: 'GST number must be at most 50 characters' })
      .optional()
      .nullable(),
    bankAccounts: z
      .array(
        z.object({
          accountName: z
            .string()
            .min(1, { message: 'Account name is required' })
            .max(100, {
              message: 'Account name must be at most 100 characters',
            }),
          accountNumber: z
            .string()
            .min(1, { message: 'Account number is required' })
            .max(50, {
              message: 'Account number must be at most 50 characters',
            }),
          bankName: z
            .string()
            .min(1, { message: 'Bank name is required' })
            .max(100, { message: 'Bank name must be at most 100 characters' }),
          swiftCode: z
            .string()
            .min(8, { message: 'SWIFT code must be at least 8 characters' })
            .max(11, { message: 'SWIFT code must be at most 11 characters' })
            .regex(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, {
              message: 'Invalid SWIFT code format',
            }),
          isDefault: z.boolean().optional(),
        })
      )
      .optional(),
  }),
});

export const partnerFinancialDataUpdateValidator = z.object({
  body: z.object({
    annualRevenue: z
      .number()
      .min(0, { message: 'Annual revenue must be positive' })
      .optional(),
    taxId: z
      .string()
      .min(1, { message: 'Tax ID is required' })
      .max(50, { message: 'Tax ID must be at most 50 characters' })
      .optional(),
    vatNumber: z
      .string()
      .max(50, { message: 'VAT number must be at most 50 characters' })
      .optional()
      .nullable(),
    gstNumber: z
      .string()
      .max(50, { message: 'GST number must be at most 50 characters' })
      .optional()
      .nullable(),
  }),
});

export const partnerBankAccountCreateValidator = z.object({
  body: z.object({
    accountName: z
      .string()
      .min(1, { message: 'Account name is required' })
      .max(100, { message: 'Account name must be at most 100 characters' }),
    accountNumber: z
      .string()
      .min(1, { message: 'Account number is required' })
      .max(50, { message: 'Account number must be at most 50 characters' }),
    bankName: z
      .string()
      .min(1, { message: 'Bank name is required' })
      .max(100, { message: 'Bank name must be at most 100 characters' }),
    swiftCode: z
      .string()
      .min(8, { message: 'SWIFT code must be at least 8 characters' })
      .max(11, { message: 'SWIFT code must be at most 11 characters' })
      .regex(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, {
        message: 'Invalid SWIFT code format',
      }),
    isDefault: z.boolean().optional(),
  }),
});

export const partnerBankAccountUpdateValidator = z.object({
  body: z.object({
    accountName: z
      .string()
      .min(1, { message: 'Account name is required' })
      .max(100, { message: 'Account name must be at most 100 characters' })
      .optional(),
    accountNumber: z
      .string()
      .min(1, { message: 'Account number is required' })
      .max(50, { message: 'Account number must be at most 50 characters' })
      .optional(),
    bankName: z
      .string()
      .min(1, { message: 'Bank name is required' })
      .max(100, { message: 'Bank name must be at most 100 characters' })
      .optional(),
    swiftCode: z
      .string()
      .min(8, { message: 'SWIFT code must be at least 8 characters' })
      .max(11, { message: 'SWIFT code must be at most 11 characters' })
      .regex(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, {
        message: 'Invalid SWIFT code format',
      })
      .optional(),
    isDefault: z.boolean().optional(),
  }),
});

export const partnerDocumentCreateValidator = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, { message: 'Document name is required' })
      .max(255, { message: 'Document name must be at most 255 characters' }),
    type: z
      .string()
      .min(1, { message: 'Document type is required' })
      .max(50, { message: 'Document type must be at most 50 characters' }),
    size: z
      .number()
      .int()
      .min(1, { message: 'File size must be positive' })
      .max(100 * 1024 * 1024, { message: 'File size must be less than 100MB' }),
    url: z
      .string()
      .url({ message: 'URL must be valid' })
      .min(1, { message: 'URL is required' }),
    uploadedBy: z.string().min(1, { message: 'Uploaded by is required' }),
  }),
});

export const partnerDocumentUpdateValidator = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, { message: 'Document name is required' })
      .max(255, { message: 'Document name must be at most 255 characters' })
      .optional(),
    type: z
      .string()
      .min(1, { message: 'Document type is required' })
      .max(50, { message: 'Document type must be at most 50 characters' })
      .optional(),
  }),
});
