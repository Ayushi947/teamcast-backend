import { z } from 'zod';
import { baseFilterValidatorSchema } from '../common/pagination.validator';
import {
  CompanyTypeEnum,
  CompanyIndustryEnum,
  CompanySizeEnum,
  CompanyStageEnum,
} from '../../models/common/enums';

/**
 * Validator for creating a support partner
 */
export const supportPartnerCreateValidator = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, { message: 'Name is required' })
      .max(256, { message: 'Name must be at most 256 characters long' }),
    email: z
      .string()
      .email({ message: 'Invalid email address format' })
      .max(256, { message: 'Email must be at most 256 characters long' }),
    companyName: z
      .string()
      .min(1, { message: 'Company name is required' })
      .max(256, {
        message: 'Company name must be at most 256 characters long',
      }),
    title: z
      .string()
      .min(1, { message: 'Title is required' })
      .max(256, { message: 'Title must be at most 256 characters long' }),
    specialization: z
      .string()
      .min(1, { message: 'Specialization is required' })
      .max(256, {
        message: 'Specialization must be at most 256 characters long',
      }),
  }),
});

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportPartnerUpdateValidator:
 *       type: object
 *       properties:
 *         companyName:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         candidateCount:
 *           type: number
 *         userCount:
 *           type: number
 *         documentCount:
 *           type: number
 *         financialDataExists:
 *           type: boolean
 *         company:
 *           type: object
 *           properties:
 *             description:
 *               type: string
 *             companyType:
 *               type: string
 *             industry:
 *               type: string
 *             size:
 *               type: string
 *             stage:
 *               type: string
 *             foundedYear:
 *               type: number
 *               minimum: 1800
 *             website:
 *               type: string
 *               format: uri
 *             benefits:
 *               type: array
 *               items:
 *                 type: string
 *             contactPhone:
 *               type: string
 *             contactName:
 *               type: string
 *             address:
 *               type: string
 *             city:
 *               type: string
 *             state:
 *               type: string
 *             zipCode:
 *               type: string
 *             country:
 *               type: string
 *             social:
 *               type: object
 *               properties:
 *                 linkedin:
 *                   type: string
 *                   format: uri
 *                 twitter:
 *                   type: string
 *                   format: uri
 *                 facebook:
 *                   type: string
 *                   format: uri
 *                 instagram:
 *                   type: string
 *                   format: uri
 *                 youtube:
 *                   type: string
 *                   format: uri
 *                 github:
 *                   type: string
 *                   format: uri
 *             culture:
 *               type: object
 *               properties:
 *                 mission:
 *                   type: string
 *                 vision:
 *                   type: string
 *                 values:
 *                   type: array
 *                   items:
 *                     type: string
 *                 perks:
 *                   type: array
 *                   items:
 *                     type: string
 *                 workEnvironment:
 *                   type: array
 *                   items:
 *                     type: string
 *         settings:
 *           type: object
 *           properties:
 *             globalSettingsId:
 *               type: string
 *               format: uuid
 *             notificationsEnabled:
 *               type: boolean
 *             emailNotifications:
 *               type: boolean
 *             pushNotifications:
 *               type: boolean
 *             consultantAlerts:
 *               type: boolean
 *             contractAlerts:
 *               type: boolean
 *             privacySettings:
 *               type: object
 *             brandingSettings:
 *               type: object
 *             integrationSettings:
 *               type: object
 *         financialData:
 *           type: object
 *           properties:
 *             annualRevenue:
 *               type: number
 *               minimum: 0
 *             taxId:
 *               type: string
 *             vatNumber:
 *               type: string
 *             gstNumber:
 *               type: string
 *             bankAccounts:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   accountName:
 *                     type: string
 *                   accountNumber:
 *                     type: string
 *                   bankName:
 *                     type: string
 *                   swiftCode:
 *                     type: string
 *                   isDefault:
 *                     type: boolean
 *                 required:
 *                   - accountName
 *                   - accountNumber
 *                   - bankName
 *                   - swiftCode
 */
export const supportPartnerUpdateValidator = z.object({
  params: z.object({
    supportPartnerId: z.string().uuid({ message: 'Invalid partner ID format' }),
  }),
  body: z.object({
    // Basic partner fields - these match the ISupportPartner interface
    companyName: z.string().optional(),
    email: z.string().email({ message: 'Invalid email format' }).optional(),
    candidateCount: z.number().optional(),
    userCount: z.number().optional(),
    documentCount: z.number().optional(),
    financialDataExists: z.boolean().optional(),

    // Company object with comprehensive fields
    company: z
      .object({
        description: z.string().optional(),
        companyType: z
          .enum(Object.values(CompanyTypeEnum) as [string, ...string[]])
          .optional(),
        industry: z
          .enum(Object.values(CompanyIndustryEnum) as [string, ...string[]])
          .optional(),
        size: z
          .enum(Object.values(CompanySizeEnum) as [string, ...string[]])
          .optional(),
        stage: z
          .enum(Object.values(CompanyStageEnum) as [string, ...string[]])
          .optional(),
        foundedYear: z
          .number()
          .min(1800)
          .max(new Date().getFullYear())
          .optional(),
        website: z.string().url().optional(),
        benefits: z.array(z.string()).optional(),
        contactPhone: z
          .string()
          .regex(/^\+?[1-9][\d\-+]{0,14}$/, {
            message: 'Phone number must be a valid international format',
          })
          .optional(),
        contactName: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        country: z.string().optional(),

        // Social media links
        social: z
          .object({
            linkedin: z.string().url().optional(),
            twitter: z.string().url().optional(),
            facebook: z.string().url().optional(),
            instagram: z.string().url().optional(),
            youtube: z.string().url().optional(),
            github: z.string().url().optional(),
          })
          .optional(),

        // Company culture
        culture: z
          .object({
            mission: z.string().optional(),
            vision: z.string().optional(),
            values: z.array(z.string()).optional(),
            perks: z.array(z.string()).optional(),
            workEnvironment: z.array(z.string()).optional(),
          })
          .optional(),
      })
      .optional(),

    // Partner settings - matches ISupportPartnerSettings interface
    settings: z
      .object({
        globalSettingsId: z
          .string()
          .uuid({ message: 'Invalid global settings ID format' })
          .optional(),
        notificationsEnabled: z.boolean().optional(),
        emailNotifications: z.boolean().optional(),
        pushNotifications: z.boolean().optional(),
        consultantAlerts: z.boolean().optional(),
        contractAlerts: z.boolean().optional(),
        privacySettings: z.record(z.any()).optional(),
        brandingSettings: z.record(z.any()).optional(),
        integrationSettings: z.record(z.any()).optional(),
      })
      .optional(),

    // Financial data
    financialData: z
      .object({
        annualRevenue: z.number().min(0).optional(),
        taxId: z.string().optional(),
        vatNumber: z.string().optional(),
        gstNumber: z.string().optional(),
        bankAccounts: z
          .array(
            z.object({
              accountName: z
                .string()
                .min(1, { message: 'Account name is required' }),
              accountNumber: z
                .string()
                .min(1, { message: 'Account number is required' }),
              bankName: z.string().min(1, { message: 'Bank name is required' }),
              swiftCode: z
                .string()
                .min(1, { message: 'SWIFT code is required' }),
              isDefault: z.boolean(),
            })
          )
          .optional(),
      })
      .optional(),
  }),
});

/**
 * Validator for support partner ID in path parameters
 */
export const supportPartnerIdValidator = z.object({
  params: z.object({
    supportPartnerId: z.string().uuid({ message: 'Invalid partner ID format' }),
  }),
});

/**
 * Validator for support partner list with filtering
 */
export const supportPartnerFilterValidator = z.object({
  query: z.object({
    ...baseFilterValidatorSchema.shape,
    search: z
      .string()
      .min(1, { message: 'Search term must be at least 1 character long' })
      .max(100, { message: 'Search term must be at most 100 characters long' })
      .optional(),
    companyId: z
      .string()
      .uuid({ message: 'Invalid company ID format' })
      .optional(),
    status: z
      .enum(['ACTIVE', 'INACTIVE', 'SUSPENDED'], {
        message: 'Status must be one of: ACTIVE, INACTIVE, SUSPENDED',
      })
      .optional(),
    industry: z.string().optional(),
    size: z.string().optional(),
    hasFinancialData: z
      .string()
      .transform((val) => val === 'true')
      .optional(),
    hasSubscription: z
      .string()
      .transform((val) => val === 'true')
      .optional(),
    createdAfter: z
      .string()
      .datetime({ message: 'Invalid createdAfter date format' })
      .optional(),
    createdBefore: z
      .string()
      .datetime({ message: 'Invalid createdBefore date format' })
      .optional(),
  }),
});
