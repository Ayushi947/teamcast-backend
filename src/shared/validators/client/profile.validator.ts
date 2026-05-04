import { z } from 'zod';
import {
  CompanyTypeEnum,
  CompanyIndustryEnum,
  CompanySizeEnum,
  CompanyStageEnum,
  DifficultyLevelEnum,
} from '../../models/common/enums';

// Basic profile validator
export const clientProfileBasicUpdateValidator = z.object({
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
});

// Address validator
export const clientProfileAddressUpdateValidator = z.object({
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
});

// Shipping address validator
export const clientProfileShippingAddressUpdateValidator = z.object({
  shippingAddress: z.string().optional().nullable(),
  shippingCity: z.string().optional().nullable(),
  shippingState: z.string().optional().nullable(),
  shippingZipCode: z.string().optional().nullable(),
  shippingCountry: z.string().optional().nullable(),
});

// Billing address validator
export const clientProfileBillingAddressUpdateValidator = z.object({
  billingAddress: z.string().optional().nullable(),
  billingCity: z.string().optional().nullable(),
  billingState: z.string().optional().nullable(),
  billingZipCode: z.string().optional().nullable(),
  billingCountry: z.string().optional().nullable(),
});

// Social profile validator
export const clientProfileSocialUpdateValidator = z.object({
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
});
// Culture profile validator
export const clientProfileCultureUpdateValidator = z.object({
  mission: z
    .string()
    .max(1000, {
      message: 'Mission statement must be at most 1000 characters',
    })
    .optional()
    .nullable(),
  vision: z
    .string()
    .max(1000, {
      message: 'Vision statement must be at most 1000 characters',
    })
    .optional()
    .nullable(),
  values: z.array(z.string()).optional(),
  perks: z.array(z.string()).optional(),
  workEnvironment: z.array(z.string()).optional(),
});

// Client profile settings validator
export const clientProfileSettingsUpdateValidator = z.object({
  notificationsEnabled: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  jobAlerts: z.boolean().optional(),
  candidateAlerts: z.boolean().optional(),
  applicationAlerts: z.boolean().optional(),
  privacySettings: z.any().optional(),
  brandingSettings: z.any().optional(),
  integrationSettings: z.any().optional(),
});

// AI Assessment Settings validator
export const clientProfileAiAssessmentSettingsUpdateValidator = z.object({
  enabled: z.boolean().optional(),
  defaultAssessmentDuration: z.number().int().min(60).max(7200).optional(),
  maxAssessmentDuration: z.number().int().min(60).max(10800).optional(),
  assessmentBuffer: z.number().int().min(60).max(600).optional(),
  useCustomPrompts: z.boolean().optional(),
  technicalAssessmentEnabled: z.boolean().optional(),
  behavioralAssessmentEnabled: z.boolean().optional(),
  culturalFitAssessmentEnabled: z.boolean().optional(),
  aiDifficulty: z.nativeEnum(DifficultyLevelEnum).optional(),
  customPrompts: z.any().optional(),
  skillWeightings: z.any().optional(),
  passThreshold: z.number().min(0).max(1).optional(),
});

// Document validators
export const clientDocumentCreateValidator = z.object({
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
});

export const clientDocumentUpdateValidator = z.object({
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
});

// Financial Data validators
const bankAccountSchema = z.object({
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
    .max(11, { message: 'SWIFT code must be at most 11 characters' }),
  isDefault: z.boolean().optional(),
});

export const clientFinancialDataCreateValidator = z.object({
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
  bankAccounts: z.array(bankAccountSchema.omit({ isDefault: true })).optional(),
});

export const clientFinancialDataUpdateValidator = z.object({
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
});

// Bank Account validators
export const clientBankAccountCreateValidator = bankAccountSchema;

export const clientBankAccountUpdateValidator = bankAccountSchema.partial();
