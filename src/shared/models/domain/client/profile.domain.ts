import {
  CompanyTypeEnum,
  CompanyIndustryEnum,
  CompanySizeEnum,
  CompanyStageEnum,
  DifficultyLevelEnum,
  ICompanyVerificationStatus,
  VerificationStatus,
} from '../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientProfile:
 *       type: object
 *       description: Client profile information
 *       properties:
 *         id:
 *           type: string
 *           description: Client ID
 *         companyId:
 *           type: string
 *           description: Associated company ID
 *         basic:
 *           $ref: '#/components/schemas/IClientProfileBasic'
 *         address:
 *           $ref: '#/components/schemas/IClientProfileAddress'
 *         shippingAddress:
 *           $ref: '#/components/schemas/IClientProfileShippingAddress'
 *         billingAddress:
 *           $ref: '#/components/schemas/IClientProfileBillingAddress'
 *         social:
 *           $ref: '#/components/schemas/IClientProfileSocial'
 *         culture:
 *           $ref: '#/components/schemas/IClientProfileCulture'
 *         financialData:
 *           $ref: '#/components/schemas/IClientFinancialData'
 *           description: Client financial information
 *         documents:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IClientDocument'
 *           description: Client documents
 *         verificationStatus:
 *           $ref: '#/components/schemas/ICompanyVerificationStatus'
 *           description: Company verification status
 *         verificationRemarks:
 *           type: string
 *           description: Remarks about the verification
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
export interface IClientProfile {
  id: string;
  companyId: string;
  basic: IClientProfileBasic;
  address: IClientProfileAddress;
  shippingAddress: IClientProfileShippingAddress;
  billingAddress: IClientProfileBillingAddress;
  social: IClientProfileSocial;
  culture: IClientProfileCulture;
  financialData?: IClientFinancialData;
  documents: IClientDocument[];
  verificationStatus?: ICompanyVerificationStatus;
  verificationRemarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientProfileBasic:
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
 *           description: Primary contact email
 *         contactPhone:
 *           type: string
 *           description: Primary contact phone number
 *         contactName:
 *           type: string
 *           description: Primary contact name
 *         logoUrl:
 *           type: string
 *           nullable: true
 *           description: Company logo URL
 *         verificationStatus:
 *           $ref: '#/components/schemas/ICompanyVerificationStatus'
 *           description: Company verification status
 *         verificationRemarks:
 *           type: string
 *           description: Remarks about the verification
 */
export interface IClientProfileBasic {
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
  logoUrl?: string | null;
  verificationStatus?: ICompanyVerificationStatus;
  verificationRemarks?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientProfileAddress:
 *       type: object
 *       description: Primary company address
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
export interface IClientProfileAddress {
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
 *     IClientProfileShippingAddress:
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
export interface IClientProfileShippingAddress {
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
 *     IClientProfileBillingAddress:
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
export interface IClientProfileBillingAddress {
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
 *     IClientProfileSocial:
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
 *           description: GitHub organization URL
 */
export interface IClientProfileSocial {
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
 *     IClientProfileCulture:
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
export interface IClientProfileCulture {
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
 *     IClientProfileDomain:
 *       $ref: '#/components/schemas/IClientProfile'
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientProfileBasicUpdate:
 *       type: object
 *       description: Client profile basic information update payload
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
 *           description: Primary contact email
 *         contactPhone:
 *           type: string
 *           description: Primary contact phone number
 *         contactName:
 *           type: string
 *           description: Primary contact name
 *         logoUrl:
 *           type: string
 *           nullable: true
 *           description: Company logo URL
 *         verificationStatus:
 *           $ref: '#/components/schemas/ICompanyVerificationStatus'
 *           description: Company verification status
 *         verificationRemarks:
 *           type: string
 *           description: Remarks about the verification
 */
export type IClientProfileBasicUpdate = Partial<IClientProfileBasic>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientProfileAddressUpdate:
 *       type: object
 *       description: Client profile address update payload
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
export type IClientProfileAddressUpdate = Partial<IClientProfileAddress>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientProfileShippingAddressUpdate:
 *       type: object
 *       description: Client profile shipping address update payload
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
export type IClientProfileShippingAddressUpdate =
  Partial<IClientProfileShippingAddress>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientProfileBillingAddressUpdate:
 *       type: object
 *       description: Client profile billing address update payload
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
export type IClientProfileBillingAddressUpdate =
  Partial<IClientProfileBillingAddress>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientProfileSocialUpdate:
 *       type: object
 *       description: Client profile social media update payload
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
 *           description: GitHub organization URL
 */
export type IClientProfileSocialUpdate = Partial<IClientProfileSocial>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientProfileCultureUpdate:
 *       type: object
 *       description: Client profile culture update payload
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
export type IClientProfileCultureUpdate = Partial<IClientProfileCulture>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientFinancialData:
 *       type: object
 *       description: Client financial information
 *       properties:
 *         id:
 *           type: string
 *           description: Financial data ID
 *         clientId:
 *           type: string
 *           description: Client ID
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
 *             $ref: '#/components/schemas/IClientBankAccount'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

export interface IClientFinancialData {
  id: string;
  clientId: string;
  annualRevenue: number;
  taxId: string;
  vatNumber?: string;
  gstNumber?: string;
  bankAccounts: IClientBankAccount[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientBankAccount:
 *       type: object
 *       description: Client bank account information
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

export interface IClientBankAccount {
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
 *     IClientFinancialDataUpdate:
 *       type: object
 *       description: Client financial data update payload
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

export type IClientFinancialDataUpdate = Partial<
  Omit<
    IClientFinancialData,
    'id' | 'clientId' | 'bankAccounts' | 'createdAt' | 'updatedAt'
  >
> & {
  bankAccounts?: Omit<IClientBankAccount, 'id' | 'createdAt' | 'updatedAt'>[];
};

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientBankAccountCreate:
 *       type: object
 *       required:
 *         - accountName
 *         - accountNumber
 *         - bankName
 *         - swiftCode
 *       description: Client bank account creation payload
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

export interface IClientBankAccountCreate {
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
 *     IClientBankAccountUpdate:
 *       type: object
 *       description: Client bank account update payload
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

export interface IClientBankAccountUpdate {
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
 *     IClientProfileAiAssessmentSettings:
 *       type: object
 *       description: Client AI assessment settings
 *       properties:
 *         id:
 *           type: string
 *           description: Settings ID
 *         clientId:
 *           type: string
 *           description: Client ID
 *         globalSettingsId:
 *           type: string
 *           description: Global settings ID
 *         greetingMessage:
 *           type: string
 *           description: Greeting message for the assessment
 *         defaultAssessmentDuration:
 *           type: number
 *           description: Default assessment duration
 *         defaultPassingScore:
 *           type: number
 *           description: Default passing score
 *         requiredSections:
 *           type: array
 *           items:
 *             type: string
 *           description: Required sections
 *         maximumAttempts:
 *           type: number
 *           description: Maximum attempts
 *         cooldownPeriod:
 *           type: number
 *           description: Cooldown period
 *         maxAssessmentDuration:
 *           type: number
 *           description: Maximum assessment duration
 *         assessmentBuffer:
 *           type: number
 *           description: Assessment buffer time
 *         useCustomPrompts:
 *           type: boolean
 *           description: Whether to use custom prompts
 *         aiDifficulty:
 *           $ref: '#/components/schemas/DifficultyLevelEnum'
 *           description: AI difficulty level
 *         customPrompts:
 *           type: object
 *           additionalProperties:
 *             type: string
 *           description: Custom prompts mapping
 *         skillWeightings:
 *           type: object
 *           additionalProperties:
 *             type: number
 *           description: Skill weightings mapping
 *         maxSections:
 *           type: number
 *           description: Maximum number of sections
 *         maxQuestionsPerSection:
 *           type: number
 *           description: Maximum questions per section
 *         proctoringEnabled:
 *           type: boolean
 *           description: Whether proctoring is enabled
 *         maxWarnings:
 *           type: number
 *           description: Maximum warnings
 *         tabSwitchLimit:
 *           type: number
 *           description: Maximum tab switches
 *         copyPasteAllowed:
 *           type: boolean
 *           description: Whether copy-paste is allowed
 *         videoRecordingEnabled:
 *           type: boolean
 *           description: Whether video recording is enabled
 *         minimumVideoLength:
 *           type: number
 *           description: Minimum video length
 *         aiVideoAnalysisEnabled:
 *           type: boolean
 *           description: Whether AI video analysis is enabled
 *         autoPublishOnSuccess:
 *           type: boolean
 *           description: Whether to auto-publish on success
 *         autoNotifyOnComplete:
 *           type: boolean
 *           description: Whether to auto-notify on completion
 *         interviewLanguage:
 *           type: string
 *           description: Primary language for interviews (e.g., "ENGLISH")
 *         interviewDialect:
 *           type: string
 *           description: Dialect code for voice synthesis (e.g., "en-US", "en-GB", "en-AU", "en-CA", "en-IN")
 *         interviewVoiceGender:
 *           type: string
 *           description: Voice gender ("female" or "male")
 *         sectionTemplates:
 *           type: object
 *           additionalProperties:
 *             type: string
 *           description: Section templates mapping
 *         questionTemplates:
 *           type: object
 *           additionalProperties:
 *             type: string
 *           description: Question templates mapping
 *         customStyles:
 *           type: object
 *           additionalProperties:
 *             type: string
 *           description: Custom styles mapping
 *         customInstructions:
 *           type: string
 *           description: Custom instructions
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the settings were created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the settings were last updated

 */
export interface IClientProfileAiAssessmentSettings {
  clientId: string;
  globalSettingsId?: string;
  greetingMessage?: string;

  defaultAssessmentDuration?: number;
  defaultPassingScore?: number;
  requiredSections?: string[];
  maximumAttempts?: number;
  cooldownPeriod?: number;
  maxAssessmentDuration?: number;
  assessmentBuffer?: number;

  useCustomPrompts?: boolean;
  aiDifficulty?: DifficultyLevelEnum;
  customPrompts?: Record<string, string>;
  skillWeightings?: Record<string, number>;

  maxSections?: number;
  maxQuestionsPerSection?: number;

  proctoringEnabled?: boolean;
  maxWarnings?: number;
  tabSwitchLimit?: number;
  copyPasteAllowed?: boolean;

  videoRecordingEnabled?: boolean;
  minimumVideoLength?: number;
  aiVideoAnalysisEnabled?: boolean;

  autoPublishOnSuccess?: boolean;
  autoNotifyOnComplete?: boolean;

  // Voice configuration
  interviewLanguage?: string; // Primary language for interviews (e.g., "ENGLISH")
  interviewDialect?: string; // Dialect code for voice synthesis (e.g., "en-US", "en-GB", "en-AU", "en-CA", "en-IN")
  interviewVoiceGender?: string; // Voice gender: "female" or "male"

  sectionTemplates?: Record<string, string>;
  questionTemplates?: Record<string, string>;

  customStyles?: Record<string, string>;
  customInstructions?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientProfileAiAssessmentSettingsUpdate:
 *       type: object
 *       description: Client AI assessment settings update payload
 *       properties:
 *         globalSettingsId:
 *           type: string
 *           description: Global settings ID
 *         greetingMessage:
 *           type: string
 *           description: Greeting message for the assessment
 *         defaultAssessmentDuration:
 *           type: number
 *           description: Default assessment duration
 *         defaultPassingScore:
 *           type: number
 *           description: Default passing score
 *         requiredSections:
 *           type: array
 *           items:
 *             type: string
 *           description: Required sections
 *         maximumAttempts:
 *           type: number
 *           description: Maximum attempts
 *         cooldownPeriod:
 *           type: number
 *           description: Cooldown period
 *         maxAssessmentDuration:
 *           type: number
 *           description: Maximum assessment duration
 *         assessmentBuffer:
 *           type: number
 *           description: Assessment buffer time
 *         useCustomPrompts:
 *           type: boolean
 *           description: Whether to use custom prompts
 *         aiDifficulty:
 *           $ref: '#/components/schemas/DifficultyLevelEnum'
 *           description: AI difficulty level
 *         customPrompts:
 *           type: object
 *           additionalProperties:
 *             type: string
 *           description: Custom prompts mapping
 *         skillWeightings:
 *           type: object
 *           additionalProperties:
 *             type: number
 *           description: Skill weightings mapping
 *         maxSections:
 *           type: number
 *           description: Maximum number of sections
 *         maxQuestionsPerSection:
 *           type: number
 *           description: Maximum questions per section
 *         proctoringEnabled:
 *           type: boolean
 *           description: Whether proctoring is enabled
 *         maxWarnings:
 *           type: number
 *           description: Maximum warnings
 *         tabSwitchLimit:
 *           type: number
 *           description: Maximum tab switches
 *         copyPasteAllowed:
 *           type: boolean
 *           description: Whether copy-paste is allowed
 *         videoRecordingEnabled:
 *           type: boolean
 *           description: Whether video recording is enabled
 *         minimumVideoLength:
 *           type: number
 *           description: Minimum video length
 *         aiVideoAnalysisEnabled:
 *           type: boolean
 *           description: Whether AI video analysis is enabled
 *         autoPublishOnSuccess:
 *           type: boolean
 *           description: Whether to auto-publish on success
 *         autoNotifyOnComplete:
 *           type: boolean
 *           description: Whether to auto-notify on completion
 *         interviewLanguage:
 *           type: string
 *           description: Primary language for interviews (e.g., "ENGLISH")
 *         interviewDialect:
 *           type: string
 *           description: Dialect code for voice synthesis (e.g., "en-US", "en-GB", "en-AU", "en-CA", "en-IN")
 *         interviewVoiceGender:
 *           type: string
 *           description: Voice gender ("female" or "male")
 *         sectionTemplates:
 *           type: object
 *           additionalProperties:
 *             type: string
 *           description: Section templates mapping
 *         questionTemplates:
 *           type: object
 *           additionalProperties:
 *             type: string
 *           description: Question templates mapping
 *         customStyles:
 *           type: object
 *           additionalProperties:
 *             type: string
 *           description: Custom styles mapping
 *         customInstructions:
 *           type: string
 *           description: Custom instructions
 */
export type IClientProfileAiAssessmentSettingsUpdate =
  Partial<IClientProfileAiAssessmentSettings>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientDocument:
 *       type: object
 *       description: Client document information
 *       properties:
 *         id:
 *           type: string
 *           description: Document ID
 *         clientId:
 *           type: string
 *           description: Client ID
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
 *         status:
 *           $ref: '#/components/schemas/VerificationStatus'
 *           description: Document verification status
 *         remarks:
 *           type: string
 *           description: Remarks about the document
 *         verifiedAt:
 *           type: string
 *           format: date-time
 *           description: Verification timestamp
 */

export interface IClientDocument {
  id: string;
  clientId: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  status?: VerificationStatus;
  remarks?: string;
  verifiedAt?: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientDocumentCreate:
 *       type: object
 *       required:
 *         - name
 *         - type
 *         - size
 *         - url
 *         - uploadedBy
 *       description: Client document creation payload
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

export interface IClientDocumentCreate {
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
 *     IClientDocumentUpdate:
 *       type: object
 *       description: Client document update payload
 *       properties:
 *         name:
 *           type: string
 *           description: Document name
 *         type:
 *           type: string
 *           description: Document type/format
 */

export type IClientDocumentUpdate = Partial<
  Pick<IClientDocument, 'name' | 'type'>
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientProfilePhotoUpload:
 *       type: object
 *       description: Client profile photo upload result
 *       properties:
 *         fileName:
 *           type: string
 *           description: Name of the uploaded photo file
 *         logoUrl:
 *           type: string
 *           description: URL to access the uploaded photo
 */
export interface IClientProfilePhotoUpload {
  fileName: string;
  logoUrl: string;
}

// Helper methods to convert database models to domain models
export const toClientProfileDomain = (client: any): IClientProfile => {
  return {
    id: client.id,
    companyId: client.companyId,
    basic: toClientProfileBasicDomain(client.company),
    address: toClientProfileAddressDomain(client.company),
    shippingAddress: toClientProfileShippingAddressDomain(client.company),
    billingAddress: toClientProfileBillingAddressDomain(client.company),
    social: toClientProfileSocialDomain(client.company.social),
    culture: toClientProfileCultureDomain(client.company.culture),
    financialData: client.financialData
      ? toClientFinancialDataDomain(client.financialData)
      : undefined,
    documents: client.documents?.map(toClientDocumentDomain) || [],
    verificationStatus: client.company.status,
    verificationRemarks: client.company.remarks,
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
  };
};

export const toClientProfileBasicDomain = (
  company: any
): IClientProfileBasic => {
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
    logoUrl: company.logo || null,
    verificationStatus: company.status,
    verificationRemarks: company.remarks,
  };
};

export const toClientProfileAddressDomain = (
  company: any
): IClientProfileAddress => {
  return {
    address: company.address || undefined,
    city: company.city || undefined,
    state: company.state || undefined,
    zipCode: company.zipCode || undefined,
    country: company.country || undefined,
  };
};

export const toClientProfileShippingAddressDomain = (
  company: any
): IClientProfileShippingAddress => {
  return {
    shippingAddress: company.shippingAddress || undefined,
    shippingCity: company.shippingCity || undefined,
    shippingState: company.shippingState || undefined,
    shippingZipCode: company.shippingZipCode || undefined,
    shippingCountry: company.shippingCountry || undefined,
  };
};

export const toClientProfileBillingAddressDomain = (
  company: any
): IClientProfileBillingAddress => {
  return {
    billingAddress: company.billingAddress || undefined,
    billingCity: company.billingCity || undefined,
    billingState: company.billingState || undefined,
    billingZipCode: company.billingZipCode || undefined,
    billingCountry: company.billingCountry || undefined,
  };
};

export const toClientProfileSocialDomain = (
  social: any
): IClientProfileSocial => {
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

export const toClientProfileCultureDomain = (
  culture: any
): IClientProfileCulture => {
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

export const toClientProfileAiAssessmentSettingsDomain = (
  settings: any
): IClientProfileAiAssessmentSettings => {
  return {
    clientId: settings.clientId,
    globalSettingsId: settings.globalSettingsId,
    greetingMessage: settings.greetingMessage || undefined,
    defaultAssessmentDuration: settings.defaultAssessmentDuration || undefined,
    defaultPassingScore: settings.defaultPassingScore || undefined,
    requiredSections: settings.requiredSections || undefined,
    maximumAttempts: settings.maximumAttempts || undefined,
    cooldownPeriod: settings.cooldownPeriod || undefined,
    maxAssessmentDuration: settings.maxAssessmentDuration || undefined,
    assessmentBuffer: settings.assessmentBuffer || undefined,
    useCustomPrompts: settings.useCustomPrompts || undefined,
    aiDifficulty: settings.aiDifficulty || undefined,
    customPrompts: settings.customPrompts || undefined,
    skillWeightings: settings.skillWeightings || undefined,
    maxSections: settings.maxSections || undefined,
    maxQuestionsPerSection: settings.maxQuestionsPerSection || undefined,
    proctoringEnabled: settings.proctoringEnabled || undefined,
    maxWarnings: settings.maxWarnings || undefined,
    tabSwitchLimit: settings.tabSwitchLimit || undefined,
    copyPasteAllowed: settings.copyPasteAllowed || undefined,
    videoRecordingEnabled: settings.videoRecordingEnabled || undefined,
    minimumVideoLength: settings.minimumVideoLength || undefined,
    aiVideoAnalysisEnabled: settings.aiVideoAnalysisEnabled || undefined,
    autoPublishOnSuccess: settings.autoPublishOnSuccess || undefined,
    autoNotifyOnComplete: settings.autoNotifyOnComplete || undefined,
    interviewLanguage: settings.interviewLanguage || undefined,
    interviewDialect: settings.interviewDialect || undefined,
    interviewVoiceGender: settings.interviewVoiceGender || undefined,
    sectionTemplates: settings.sectionTemplates || undefined,
    questionTemplates: settings.questionTemplates || undefined,
    customStyles: settings.customStyles || undefined,
    customInstructions: settings.customInstructions || undefined,
    createdAt: settings.createdAt,
    updatedAt: settings.updatedAt,
  };
};

export const toClientDocumentDomain = (document: any): IClientDocument => ({
  id: document.id,
  clientId: document.clientId,
  name: document.name,
  type: document.type,
  size: parseInt(document.size?.toString() || '0'),
  url: document.url,
  uploadedBy: document.uploadedBy,
  uploadedAt: document.createdAt,
  createdAt: document.createdAt,
  updatedAt: document.updatedAt,
  status: document.status || undefined,
  remarks: document.remarks || undefined,
  verifiedAt: document.verifiedAt || undefined,
});

export const toClientFinancialDataDomain = (
  financialData: any
): IClientFinancialData => ({
  id: financialData.id,
  clientId: financialData.clientId,
  annualRevenue: parseFloat(financialData.annualRevenue?.toString() || '0'),
  taxId: financialData.taxId,
  vatNumber: financialData.vatNumber,
  gstNumber: financialData.gstNumber,
  bankAccounts:
    financialData.bankAccounts?.map(toClientBankAccountDomain) || [],
  createdAt: financialData.createdAt,
  updatedAt: financialData.updatedAt,
});

export const toClientBankAccountDomain = (
  bankAccount: any
): IClientBankAccount => ({
  id: bankAccount.id,
  accountName: bankAccount.accountName,
  accountNumber: bankAccount.accountNumber,
  bankName: bankAccount.bankName,
  swiftCode: bankAccount.swiftCode,
  isDefault: bankAccount.isDefault,
  createdAt: bankAccount.createdAt,
  updatedAt: bankAccount.updatedAt,
});
