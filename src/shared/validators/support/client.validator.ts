import { z } from 'zod';
import { paginationValidatorSchema } from '../common/pagination.validator';
import {
  CompanyTypeEnum,
  CompanyIndustryEnum,
  CompanySizeEnum,
  CompanyStageEnum,
} from '../../models/common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportClientCreateValidator:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *         email:
 *           type: string
 *           format: email
 *           maxLength: 255
 *         companyName:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *         jobTitle:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *       required:
 *         - name
 *         - email
 *         - companyName
 *         - jobTitle
 */
export const supportClientCreateValidator = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, { message: 'Name must be at least 2 characters long' })
      .max(100, { message: 'Name cannot exceed 100 characters' }),
    email: z
      .string()
      .email({ message: 'Please provide a valid email address' })
      .max(255, { message: 'Email cannot exceed 255 characters' }),
    companyName: z
      .string()
      .min(2, { message: 'Company name must be at least 2 characters long' })
      .max(100, { message: 'Company name cannot exceed 100 characters' }),
    jobTitle: z
      .string()
      .min(2, { message: 'Job title must be at least 2 characters long' })
      .max(100, { message: 'Job title cannot exceed 100 characters' }),
  }),
});

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportClientUpdateValidator:
 *       type: object
 *       properties:
 *         settings:
 *           type: object
 *           properties:
 *             notificationsEnabled:
 *               type: boolean
 *             emailNotifications:
 *               type: boolean
 *             pushNotifications:
 *               type: boolean
 *             jobAlerts:
 *               type: boolean
 *             candidateAlerts:
 *               type: boolean
 *             applicationAlerts:
 *               type: boolean
 *             privacySettings:
 *               type: object
 *             brandingSettings:
 *               type: object
 *             integrationSettings:
 *               type: object
 *         clientAiAssessmentSettings:
 *           type: object
 *           properties:
 *             greetingMessage:
 *               type: string
 *               maxLength: 500
 *             defaultAssessmentDuration:
 *               type: number
 *               minimum: 1
 *               maximum: 480
 *             defaultPassingScore:
 *               type: number
 *               minimum: 0
 *               maximum: 100
 *             requiredSections:
 *               type: array
 *               items:
 *                 type: string
 *             maximumAttempts:
 *               type: number
 *               minimum: 1
 *               maximum: 10
 *             cooldownPeriod:
 *               type: number
 *               minimum: 0
 *             maxSections:
 *               type: number
 *               minimum: 1
 *               maximum: 20
 *             maxQuestionsPerSection:
 *               type: number
 *               minimum: 1
 *               maximum: 50
 *             proctoringEnabled:
 *               type: boolean
 *             maxWarnings:
 *               type: number
 *               minimum: 0
 *               maximum: 10
 *             tabSwitchLimit:
 *               type: number
 *               minimum: 0
 *               maximum: 10
 *             copyPasteAllowed:
 *               type: boolean
 *             videoRecordingEnabled:
 *               type: boolean
 *             minimumVideoLength:
 *               type: number
 *               minimum: 0
 *             aiVideoAnalysisEnabled:
 *               type: boolean
 *             autoPublishOnSuccess:
 *               type: boolean
 *             autoNotifyOnComplete:
 *               type: boolean
 *             sectionTemplates:
 *               type: object
 *             questionTemplates:
 *               type: object
 *             customStyles:
 *               type: object
 *             customInstructions:
 *               type: string
 *               maxLength: 1000
 *             customPrompts:
 *               type: object
 *             skillWeightings:
 *               type: object
 *         company:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               minLength: 2
 *               maxLength: 100
 *             contactEmail:
 *               type: string
 *               format: email
 *               maxLength: 255
 *             profile:
 *               type: object
 *               properties:
 *                 description:
 *                   type: string
 *                   maxLength: 2000
 *                 companyType:
 *                   type: string
 *                 industry:
 *                   type: string
 *                 size:
 *                   type: string
 *                 stage:
 *                   type: string
 *                 foundedYear:
 *                   type: number
 *                   minimum: 1800
 *                 website:
 *                   type: string
 *                   format: uri
 *                 benefits:
 *                   type: array
 *                   items:
 *                     type: string
 *             basic:
 *               type: object
 *               properties:
 *                 contactPhone:
 *                   type: string
 *                   maxLength: 20
 *                 contactName:
 *                   type: string
 *                   maxLength: 100
 *                 registrationNumber:
 *                   type: string
 *                   maxLength: 50
 *                 vatNumber:
 *                   type: string
 *                   maxLength: 50
 *             billing:
 *               type: object
 *               properties:
 *                 billingEmail:
 *                   type: string
 *                   format: email
 *                   maxLength: 255
 *                 billingPhone:
 *                   type: string
 *                   maxLength: 20
 *                 billingContactName:
 *                   type: string
 *                   maxLength: 100
 *             address:
 *               type: object
 *               properties:
 *                 address:
 *                   type: string
 *                   maxLength: 255
 *                 city:
 *                   type: string
 *                   maxLength: 100
 *                 state:
 *                   type: string
 *                   maxLength: 100
 *                 zipCode:
 *                   type: string
 *                   maxLength: 20
 *                 country:
 *                   type: string
 *                   maxLength: 100
 *             shipping:
 *               type: object
 *               properties:
 *                 shippingAddress:
 *                   type: string
 *                   maxLength: 255
 *                 shippingCity:
 *                   type: string
 *                   maxLength: 100
 *                 shippingState:
 *                   type: string
 *                   maxLength: 100
 *                 shippingZipCode:
 *                   type: string
 *                   maxLength: 20
 *                 shippingCountry:
 *                   type: string
 *                   maxLength: 100
 *             socialProfiles:
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
 *                 website:
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
 */
export const supportClientUpdateValidator = z.object({
  params: z.object({
    supportClientId: z
      .string()
      .uuid({ message: 'Client ID must be a valid UUID' }),
  }),
  body: z.object({
    settings: z
      .object({
        notificationsEnabled: z.boolean().optional(),
        emailNotifications: z.boolean().optional(),
        pushNotifications: z.boolean().optional(),
        jobAlerts: z.boolean().optional(),
        candidateAlerts: z.boolean().optional(),
        applicationAlerts: z.boolean().optional(),
        privacySettings: z.record(z.any()).optional(),
        brandingSettings: z.record(z.any()).optional(),
        integrationSettings: z.record(z.any()).optional(),
      })
      .optional(),
    clientAiAssessmentSettings: z
      .object({
        greetingMessage: z.string().max(500).optional(),
        defaultAssessmentDuration: z.number().min(1).max(480).optional(),
        defaultPassingScore: z.number().min(0).max(100).optional(),
        requiredSections: z.array(z.string()).optional(),
        maximumAttempts: z.number().min(1).max(10).optional(),
        cooldownPeriod: z.number().min(0).optional(),
        maxSections: z.number().min(1).max(20).optional(),
        maxQuestionsPerSection: z.number().min(1).max(50).optional(),
        proctoringEnabled: z.boolean().optional(),
        maxWarnings: z.number().min(0).max(10).optional(),
        tabSwitchLimit: z.number().min(0).max(10).optional(),
        copyPasteAllowed: z.boolean().optional(),
        videoRecordingEnabled: z.boolean().optional(),
        minimumVideoLength: z.number().min(0).optional(),
        aiVideoAnalysisEnabled: z.boolean().optional(),
        autoPublishOnSuccess: z.boolean().optional(),
        autoNotifyOnComplete: z.boolean().optional(),
        sectionTemplates: z.record(z.any()).optional(),
        questionTemplates: z.record(z.any()).optional(),
        customStyles: z.record(z.any()).optional(),
        customInstructions: z.string().max(1000).optional(),
        customPrompts: z.record(z.any()).optional(),
        skillWeightings: z.record(z.any()).optional(),
      })
      .optional(),
    company: z
      .object({
        name: z.string().min(2).max(100).optional(),
        contactEmail: z.string().email().max(255).optional(),
        profile: z
          .object({
            description: z.string().max(2000).optional(),
            companyType: z.nativeEnum(CompanyTypeEnum).optional(),
            industry: z.nativeEnum(CompanyIndustryEnum).optional(),
            size: z.nativeEnum(CompanySizeEnum).optional(),
            stage: z.nativeEnum(CompanyStageEnum).optional(),
            foundedYear: z
              .number()
              .min(1800)
              .max(new Date().getFullYear())
              .optional(),
            website: z.string().url().optional(),
            benefits: z.array(z.string()).optional(),
          })
          .optional(),
        basic: z
          .object({
            contactPhone: z
              .string()
              .regex(/^\+?[1-9][\d\-+]{0,14}$/, {
                message: 'Phone number must be a valid international format',
              })
              .max(20)
              .optional(),
            contactName: z.string().max(100).optional(),
            registrationNumber: z.string().max(50).optional(),
            vatNumber: z.string().max(50).optional(),
          })
          .optional(),
        billing: z
          .object({
            billingEmail: z.string().email().max(255).optional(),
            billingPhone: z
              .string()
              .regex(/^\+?[1-9][\d\-+]{0,14}$/, {
                message: 'Phone number must be a valid international format',
              })
              .max(20)
              .optional(),
            billingContactName: z.string().max(100).optional(),
          })
          .optional(),
        address: z
          .object({
            address: z.string().max(255).optional(),
            city: z.string().max(100).optional(),
            state: z.string().max(100).optional(),
            zipCode: z.string().max(20).optional(),
            country: z.string().max(100).optional(),
          })
          .optional(),
        shipping: z
          .object({
            shippingAddress: z.string().max(255).optional(),
            shippingCity: z.string().max(100).optional(),
            shippingState: z.string().max(100).optional(),
            shippingZipCode: z.string().max(20).optional(),
            shippingCountry: z.string().max(100).optional(),
          })
          .optional(),
        socialProfiles: z
          .object({
            linkedin: z.string().url().optional(),
            twitter: z.string().url().optional(),
            facebook: z.string().url().optional(),
            instagram: z.string().url().optional(),
            youtube: z.string().url().optional(),
            github: z.string().url().optional(),
          })
          .optional(),
        culture: z
          .object({
            mission: z.string().max(1000).optional(),
            vision: z.string().max(1000).optional(),
            values: z.array(z.string().max(100)).optional(),
            perks: z.array(z.string().max(100)).optional(),
            workEnvironment: z.array(z.string().max(100)).optional(),
          })
          .optional(),
      })
      .optional(),
    financialData: z
      .object({
        annualRevenue: z.number().min(0).optional(),
        taxId: z.string().max(50).optional(),
        vatNumber: z.string().max(50).optional(),
        gstNumber: z.string().max(50).optional(),
        bankAccounts: z
          .array(
            z.object({
              accountName: z.string().min(2).max(100),
              accountNumber: z.string().min(5).max(30),
              bankName: z.string().min(2).max(100),
              swiftCode: z.string().min(8).max(11).optional(),
              isDefault: z.boolean().optional(),
            })
          )
          .optional(),
      })
      .optional(),
  }),
});

// Validator for client verification
export const clientVerifyValidator = z.object({
  params: z.object({
    clientId: z.string().uuid({ message: 'Invalid client ID format' }),
  }),
  body: z.object({
    remarks: z
      .string()
      .max(500, { message: 'Remarks must be at most 500 characters long' })
      .optional(),
  }),
});

/**
 * Support client ID parameter validator
 */
export const supportClientIdValidator = z.object({
  params: z.object({
    supportClientId: z
      .string()
      .uuid({ message: 'Client ID must be a valid UUID' }),
  }),
});

/**
 * Support client filter query validator
 */
export const supportClientFilterSchema = z.object({
  query: z.object({
    companyId: z.string().uuid().optional(),
    search: z.string().min(1).max(100).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
    industry: z.nativeEnum(CompanyIndustryEnum).optional(),
    size: z.nativeEnum(CompanySizeEnum).optional(),
    hasFinancialData: z.boolean().optional(),
    hasSubscription: z.boolean().optional(),
    createdAfter: z.string().datetime().optional(),
    createdBefore: z.string().datetime().optional(),
    updatedAfter: z.string().datetime().optional(),
    updatedBefore: z.string().datetime().optional(),
  }),
});

export const supportClientListValidator = z.object({
  ...paginationValidatorSchema.shape,
  ...supportClientFilterSchema.shape.query.shape,
});
