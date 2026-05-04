import {
  CompanyIndustryEnum,
  CompanySizeEnum,
  CompanyStageEnum,
  CompanyTypeEnum,
  DifficultyLevelEnum,
} from '../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerProfile:
 *       type: object
 *       description: Partner profile information
 *       properties:
 *         id:
 *           type: string
 *           description: Partner ID
 *         companyId:
 *           type: string
 *           description: Associated company ID
 *         basic:
 *           $ref: '#/components/schemas/IPartnerProfileBasic'
 *         address:
 *           $ref: '#/components/schemas/IPartnerProfileAddress'
 *         shippingAddress:
 *           $ref: '#/components/schemas/IPartnerProfileShippingAddress'
 *         billingAddress:
 *           $ref: '#/components/schemas/IPartnerProfileBillingAddress'
 *         social:
 *           $ref: '#/components/schemas/IPartnerProfileSocial'
 *         culture:
 *           $ref: '#/components/schemas/IPartnerProfileCulture'
 *         financialData:
 *           $ref: '#/components/schemas/IPartnerFinancialData'
 *         documents:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IPartnerDocument'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

export interface IPartnerProfile {
  id: string;
  companyId: string;
  basic: IPartnerProfileBasic;
  address: IPartnerProfileAddress;
  shippingAddress: IPartnerProfileShippingAddress;
  billingAddress: IPartnerProfileBillingAddress;
  social: IPartnerProfileSocial;
  culture: IPartnerProfileCulture;
  financialData?: IPartnerFinancialData;
  documents: IPartnerDocument[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerProfileBasic:
 *       type: object
 *       description: Basic company information
 *       properties:
 *         name:
 *           type: string
 *           description: Company name
 *         description:
 *           type: string
 *           description: Company description
 *         companyType:
 *           $ref: '#/components/schemas/CompanyTypeEnum'
 *         industry:
 *           $ref: '#/components/schemas/CompanyIndustryEnum'
 *         size:
 *           $ref: '#/components/schemas/CompanySizeEnum'
 *         stage:
 *           $ref: '#/components/schemas/CompanyStageEnum'
 *         foundedYear:
 *           type: integer
 *           description: Year the company was founded
 *         website:
 *           type: string
 *           description: Company website URL
 *         benefits:
 *           type: array
 *           items:
 *             type: string
 *           description: List of company benefits
 *         contactEmail:
 *           type: string
 *           format: email
 *         contactPhone:
 *           type: string
 *           description: Primary contact phone number
 *         contactName:
 *           type: string
 *           description: Primary contact name
 *         logoUrl:
 *           type: string
 *           description: Company logo URL
 */

export interface IPartnerProfileBasic {
  name: string;
  description: string;
  companyType: CompanyTypeEnum;
  industry: CompanyIndustryEnum;
  size: CompanySizeEnum;
  stage: CompanyStageEnum;
  foundedYear: number;
  website?: string;
  benefits: string[];
  contactEmail?: string;
  contactPhone?: string;
  contactName?: string;
  logoUrl?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerProfileAddress:
 *       type: object
 *       description: Company address
 *       properties:
 *         address:
 *           type: string
 *           description: Street address
 *         city:
 *           type: string
 *           description: City
 *         state:
 *           type: string
 *           description: State or province
 *         zipCode:
 *           type: string
 *           description: Postal or zip code
 *         country:
 *           type: string
 *           description: Country
 */

export interface IPartnerProfileAddress {
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerProfileShippingAddress:
 *       type: object
 *       description: Company shipping address
 *       properties:
 *         shippingAddress:
 *           type: string
 *           description: Shipping street address
 *         shippingCity:
 *           type: string
 *           description: Shipping city
 *         shippingState:
 *           type: string
 *           description: Shipping state or province
 *         shippingZipCode:
 *           type: string
 *           description: Shipping postal or zip code
 *         shippingCountry:
 *           type: string
 *           description: Shipping country
 */

export interface IPartnerProfileShippingAddress {
  shippingAddress?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingZipCode?: string;
  shippingCountry?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerProfileBillingAddress:
 *       type: object
 *       description: Company billing address
 *       properties:
 *         billingAddress:
 *           type: string
 *           description: Billing street address
 *         billingCity:
 *           type: string
 *           description: Billing city
 *         billingState:
 *           type: string
 *           description: Billing state or province
 *         billingZipCode:
 *           type: string
 *           description: Billing postal or zip code
 *         billingCountry:
 *           type: string
 *           description: Billing country
 */

export interface IPartnerProfileBillingAddress {
  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingZipCode?: string;
  billingCountry?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerProfileSocial:
 *       type: object
 *       description: Company social media accounts
 *       properties:
 *         id:
 *           type: string
 *           description: Social profile ID
 *         linkedin:
 *           type: string
 *           description: LinkedIn profile URL
 *         twitter:
 *           type: string
 *           description: Twitter profile URL
 *         facebook:
 *           type: string
 *           description: Facebook page URL
 *         instagram:
 *           type: string
 *           description: Instagram profile URL
 *         youtube:
 *           type: string
 *           description: YouTube channel URL
 *         github:
 *           type: string
 *           description: GitHub profile URL
 */

export interface IPartnerProfileSocial {
  id?: string;
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  github?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerProfileCulture:
 *       type: object
 *       description: Company culture information
 *       properties:
 *         id:
 *           type: string
 *           description: Culture profile ID
 *         mission:
 *           type: string
 *           description: Company mission statement
 *         vision:
 *           type: string
 *           description: Company vision statement
 *         values:
 *           type: array
 *           items:
 *             type: string
 *           description: Company core values
 *         perks:
 *           type: array
 *           items:
 *             type: string
 *           description: Company perks and benefits
 *         workEnvironment:
 *           type: array
 *           items:
 *             type: string
 *           description: Work environment characteristics
 */
export interface IPartnerProfileCulture {
  id?: string;
  mission?: string;
  vision?: string;
  values: string[];
  perks: string[];
  workEnvironment: string[];
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerProfileDomain:
 *       $ref: '#/components/schemas/IPartnerProfile'
 */

export type IPartnerProfileBasicUpdate = Partial<IPartnerProfileBasic>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerProfileAddressUpdate:
 *       $ref: '#/components/schemas/IPartnerProfileAddress'
 */
export type IPartnerProfileAddressUpdate = Partial<IPartnerProfileAddress>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerProfileShippingAddressUpdate:
 *       $ref: '#/components/schemas/IPartnerProfileShippingAddress'
 */
export type IPartnerProfileShippingAddressUpdate =
  Partial<IPartnerProfileShippingAddress>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerProfileBillingAddressUpdate:
 *       $ref: '#/components/schemas/IPartnerProfileBillingAddress'
 */
export type IPartnerProfileBillingAddressUpdate =
  Partial<IPartnerProfileBillingAddress>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerProfileSocialUpdate:
 *       $ref: '#/components/schemas/IPartnerProfileSocial'
 */

export type IPartnerProfileSocialUpdate = Partial<IPartnerProfileSocial>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerProfileCultureUpdate:
 *       $ref: '#/components/schemas/IPartnerProfileCulture'
 */
export type IPartnerProfileCultureUpdate = Partial<IPartnerProfileCulture>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerProfileAiAssessmentSettings:
 *       type: object
 *       description: Partner AI assessment settings
 *       properties:
 *         partnerId:
 *           type: string
 *           description: Partner ID
 *         globalSettingsId:
 *           type: string
 *           description: Global settings ID
 *         enabled:
 *           type: boolean
 *           description: Whether AI assessments are enabled
 *         defaultAssessmentDuration:
 *           type: integer
 *           description: Default assessment duration in seconds
 *         maxAssessmentDuration:
 *           type: integer
 *           description: Maximum assessment duration in seconds
 *         assessmentBuffer:
 *           type: integer
 *           description: Buffer time between assessments in seconds
 *         useCustomPrompts:
 *           type: boolean
 *           description: Whether to use custom prompts
 *         technicalAssessmentEnabled:
 *           type: boolean
 *           description: Whether technical assessments are enabled
 *         behavioralAssessmentEnabled:
 *           type: boolean
 *           description: Whether behavioral assessments are enabled
 *         culturalFitAssessmentEnabled:
 *           type: boolean
 *           description: Whether cultural fit assessments are enabled
 *         aiDifficulty:
 *           $ref: '#/components/schemas/DifficultyLevelEnum'
 *         customPrompts:
 *           type: object
 *           description: Custom assessment prompts
 *         skillWeightings:
 *           type: object
 *           description: Custom weightings for different skills
 *         passThreshold:
 *           type: number
 *           description: Score threshold to pass (0.0-1.0)
 */
export interface IPartnerProfileAiAssessmentSettings {
  partnerId: string;
  globalSettingsId?: string;
  enabled: boolean;
  defaultAssessmentDuration: number;
  maxAssessmentDuration: number;
  assessmentBuffer: number;
  useCustomPrompts: boolean;
  technicalAssessmentEnabled: boolean;
  behavioralAssessmentEnabled: boolean;
  culturalFitAssessmentEnabled: boolean;
  aiDifficulty: DifficultyLevelEnum;
  customPrompts?: any;
  skillWeightings?: any;
  passThreshold: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerProfileAiAssessmentSettingsUpdate:
 *       $ref: '#/components/schemas/IPartnerProfileAiAssessmentSettings'
 */

export type IPartnerProfileAiAssessmentSettingsUpdate =
  Partial<IPartnerProfileAiAssessmentSettings>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerFinancialData:
 *       type: object
 *       description: Partner financial information
 *       properties:
 *         id:
 *           type: string
 *           description: Financial data ID
 *         partnerId:
 *           type: string
 *           description: Partner ID
 *         annualRevenue:
 *           type: number
 *           description: Annual revenue amount
 *         taxId:
 *           type: string
 *           description: Tax identification number
 *         vatNumber:
 *           type: string
 *           description: VAT number (optional)
 *         gstNumber:
 *           type: string
 *           description: GST number (optional)
 *         bankAccounts:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IPartnerBankAccount'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

export interface IPartnerFinancialData {
  id: string;
  partnerId: string;
  annualRevenue: number;
  taxId: string;
  vatNumber?: string;
  gstNumber?: string;
  bankAccounts: IPartnerBankAccount[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerBankAccount:
 *       type: object
 *       description: Partner bank account information
 *       properties:
 *         id:
 *           type: string
 *           description: Bank account ID
 *         accountName:
 *           type: string
 *           description: Account holder name
 *         accountNumber:
 *           type: string
 *           description: Bank account number
 *         bankName:
 *           type: string
 *           description: Bank name
 *         swiftCode:
 *           type: string
 *           description: SWIFT/BIC code
 *         isDefault:
 *           type: boolean
 *           description: Whether this is the default account
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

export interface IPartnerBankAccount {
  id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  swiftCode: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerDocument:
 *       type: object
 *       description: Partner document information
 *       properties:
 *         id:
 *           type: string
 *           description: Document ID
 *         partnerId:
 *           type: string
 *           description: Partner ID
 *         name:
 *           type: string
 *           description: Document name
 *         type:
 *           type: string
 *           description: Document type/category
 *         size:
 *           type: number
 *           description: File size in bytes
 *         url:
 *           type: string
 *           description: Document URL
 *         uploadedBy:
 *           type: string
 *           description: User ID who uploaded the document
 *         uploadedAt:
 *           type: string
 *           format: date-time
 *           description: Upload timestamp
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

export interface IPartnerDocument {
  id: string;
  partnerId: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerFinancialDataUpdate:
 *       type: object
 *       description: Partner financial data update payload
 *       properties:
 *         annualRevenue:
 *           type: number
 *           description: Annual revenue
 *         taxId:
 *           type: string
 *           description: Tax identification number
 *         vatNumber:
 *           type: string
 *           description: VAT number (optional)
 *         gstNumber:
 *           type: string
 *           description: GST number (optional)
 *         bankAccounts:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               accountName:
 *                 type: string
 *               accountNumber:
 *                 type: string
 *               bankName:
 *                 type: string
 *               swiftCode:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 */

export type IPartnerFinancialDataUpdate = Partial<
  Omit<
    IPartnerFinancialData,
    'id' | 'partnerId' | 'bankAccounts' | 'createdAt' | 'updatedAt'
  >
> & {
  bankAccounts?: Omit<IPartnerBankAccount, 'id' | 'createdAt' | 'updatedAt'>[];
};

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerBankAccountCreate:
 *       type: object
 *       required:
 *         - accountName
 *         - accountNumber
 *         - bankName
 *         - swiftCode
 *       description: Partner bank account creation payload
 *       properties:
 *         accountName:
 *           type: string
 *           description: Account holder name
 *         accountNumber:
 *           type: string
 *           description: Bank account number
 *         bankName:
 *           type: string
 *           description: Bank name
 *         swiftCode:
 *           type: string
 *           description: SWIFT/BIC code
 *         isDefault:
 *           type: boolean
 *           description: Whether this is the default account
 *           default: false
 */

export interface IPartnerBankAccountCreate {
  accountName: string;
  accountNumber: string;
  bankName: string;
  swiftCode: string;
  isDefault?: boolean;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerBankAccountUpdate:
 *       type: object
 *       description: Partner bank account update payload
 *       properties:
 *         accountName:
 *           type: string
 *           description: Account holder name
 *         accountNumber:
 *           type: string
 *           description: Bank account number
 *         bankName:
 *           type: string
 *           description: Bank name
 *         swiftCode:
 *           type: string
 *           description: SWIFT/BIC code
 *         isDefault:
 *           type: boolean
 *           description: Whether this is the default account
 */

export interface IPartnerBankAccountUpdate {
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  swiftCode?: string;
  isDefault?: boolean;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerDocumentCreate:
 *       type: object
 *       required:
 *         - name
 *         - type
 *         - size
 *         - url
 *         - uploadedBy
 *       description: Partner document creation payload
 *       properties:
 *         name:
 *           type: string
 *           description: Document name
 *         type:
 *           type: string
 *           description: Document type/format
 *         size:
 *           type: number
 *           description: File size in bytes
 *         url:
 *           type: string
 *           description: Document URL
 *         uploadedBy:
 *           type: string
 *           description: User ID who uploaded the document
 */

export interface IPartnerDocumentCreate {
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerDocumentUpdate:
 *       type: object
 *       description: Partner document update payload
 *       properties:
 *         name:
 *           type: string
 *           description: Document name
 *         type:
 *           type: string
 *           description: Document type/format
 */

export type IPartnerDocumentUpdate = Partial<
  Pick<IPartnerDocument, 'name' | 'type'>
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerProfilePhotoUrl:
 *       type: object
 *       properties:
 *         fileName:
 *           type: string
 *           description: Name of the uploaded file
 *         presignedUrl:
 *           type: string
 *           description: URL to partner's profile picture
 */
export interface IPartnerProfilePhotoUrl {
  fileName: string;
  presignedUrl: string;
}

// Helper methods to convert database models to domain models
export const toPartnerProfileDomain = (partner: any): IPartnerProfile => {
  return {
    id: partner.id,
    companyId: partner.companyId,
    basic: toPartnerProfileBasicDomain(partner.company),
    address: toPartnerProfileAddressDomain(partner.company),
    shippingAddress: toPartnerProfileShippingAddressDomain(partner.company),
    billingAddress: toPartnerProfileBillingAddressDomain(partner.company),
    social: toPartnerProfileSocialDomain(partner.company.social),
    culture: toPartnerProfileCultureDomain(partner.company.culture),
    financialData: partner.financialData
      ? toPartnerFinancialDataDomain(partner.financialData)
      : undefined,
    documents: partner.documents?.map(toPartnerDocumentDomain) || [],
    createdAt: partner.createdAt,
    updatedAt: partner.updatedAt,
  };
};

export const toPartnerProfileBasicDomain = (
  company: any
): IPartnerProfileBasic => {
  return {
    name: company.name,
    description: company.description,
    companyType: company.companyType,
    industry: company.industry,
    size: company.size,
    stage: company.stage,
    foundedYear: company.foundedYear,
    website: company.website || undefined,
    benefits: company.benefits || [],
    contactEmail: company.contactEmail || undefined,
    contactPhone: company.contactPhone || undefined,
    contactName: company.contactName || undefined,
    logoUrl: company.logo || undefined,
  };
};

export const toPartnerProfileAddressDomain = (
  company: any
): IPartnerProfileAddress => {
  return {
    address: company.address || undefined,
    city: company.city || undefined,
    state: company.state || undefined,
    zipCode: company.zipCode || undefined,
    country: company.country || undefined,
  };
};

export const toPartnerProfileShippingAddressDomain = (
  company: any
): IPartnerProfileShippingAddress => {
  return {
    shippingAddress: company.shippingAddress || undefined,
    shippingCity: company.shippingCity || undefined,
    shippingState: company.shippingState || undefined,
    shippingZipCode: company.shippingZipCode || undefined,
    shippingCountry: company.shippingCountry || undefined,
  };
};

export const toPartnerProfileBillingAddressDomain = (
  company: any
): IPartnerProfileBillingAddress => {
  return {
    billingAddress: company.billingAddress || undefined,
    billingCity: company.billingCity || undefined,
    billingState: company.billingState || undefined,
    billingZipCode: company.billingZipCode || undefined,
    billingCountry: company.billingCountry || undefined,
  };
};

export const toPartnerProfileSocialDomain = (
  social: any
): IPartnerProfileSocial => {
  if (!social) {
    return {
      id: undefined,
      linkedin: undefined,
      twitter: undefined,
      facebook: undefined,
      instagram: undefined,
      youtube: undefined,
      github: undefined,
    };
  }

  return {
    id: social.id,
    linkedin: social.linkedin || undefined,
    twitter: social.twitter || undefined,
    facebook: social.facebook || undefined,
    instagram: social.instagram || undefined,
    youtube: social.youtube || undefined,
    github: social.github || undefined,
  };
};

export const toPartnerProfileCultureDomain = (
  culture: any
): IPartnerProfileCulture => {
  if (!culture) {
    return {
      id: undefined,
      mission: undefined,
      vision: undefined,
      values: [],
      perks: [],
      workEnvironment: [],
    };
  }

  return {
    id: culture.id,
    mission: culture.mission || undefined,
    vision: culture.vision || undefined,
    values: culture.values || [],
    perks: culture.perks || [],
    workEnvironment: culture.workEnvironment || [],
  };
};

export const toPartnerProfileAiAssessmentSettingsDomain = (
  settings: any
): IPartnerProfileAiAssessmentSettings => {
  return {
    partnerId: settings.partnerId,
    globalSettingsId: settings.globalSettingsId,
    enabled: settings.enabled,
    defaultAssessmentDuration: settings.defaultAssessmentDuration,
    maxAssessmentDuration: settings.maxAssessmentDuration,
    assessmentBuffer: settings.assessmentBuffer,
    useCustomPrompts: settings.useCustomPrompts,
    technicalAssessmentEnabled: settings.technicalAssessmentEnabled,
    behavioralAssessmentEnabled: settings.behavioralAssessmentEnabled,
    culturalFitAssessmentEnabled: settings.culturalFitAssessmentEnabled,
    aiDifficulty: settings.aiDifficulty,
    customPrompts: settings.customPrompts,
    skillWeightings: settings.skillWeightings,
    passThreshold: settings.passThreshold,
  };
};

export const toPartnerFinancialDataDomain = (
  financialData: any
): IPartnerFinancialData => ({
  id: financialData.id,
  partnerId: financialData.partnerId,
  annualRevenue: parseFloat(financialData.annualRevenue?.toString() || '0'),
  taxId: financialData.taxId,
  vatNumber: financialData.vatNumber,
  gstNumber: financialData.gstNumber,
  bankAccounts:
    financialData.bankAccounts?.map(toPartnerBankAccountDomain) || [],
  createdAt: financialData.createdAt,
  updatedAt: financialData.updatedAt,
});

export const toPartnerBankAccountDomain = (
  bankAccount: any
): IPartnerBankAccount => ({
  id: bankAccount.id,
  accountName: bankAccount.accountName,
  accountNumber: bankAccount.accountNumber,
  bankName: bankAccount.bankName,
  swiftCode: bankAccount.swiftCode,
  isDefault: bankAccount.isDefault,
  createdAt: bankAccount.createdAt,
  updatedAt: bankAccount.updatedAt,
});

export const toPartnerDocumentDomain = (document: any): IPartnerDocument => ({
  id: document.id,
  partnerId: document.partnerId,
  name: document.name,
  type: document.type,
  size: parseInt(document.size?.toString() || '0'),
  url: document.url,
  uploadedBy: document.uploadedBy,
  uploadedAt: document.createdAt, // Using createdAt as uploadedAt
  createdAt: document.createdAt,
  updatedAt: document.updatedAt,
});
