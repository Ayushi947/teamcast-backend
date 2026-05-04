import {
  DifficultyLevelEnum,
  ICompanyVerificationStatus,
} from '../../common/enums';
import { IClientProfile } from '../client/profile.domain';
import {
  IClientSubscription,
  toClientSubscriptionDomain,
} from '../client/subscription.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportClient:
 *       type: object
 *       description: Domain model representing a client
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the client
 *         companyId:
 *           type: string
 *           format: uuid
 *           description: ID of the associated company
 *         settings:
 *           $ref: '#/components/schemas/ISupportClientSettings'
 *           description: Client settings
 *         clientAiAssessmentSettings:
 *           $ref: '#/components/schemas/ISupportClientAiAssessmentSettings'
 *           description: Job ai assessment settings
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the client was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the client was last updated
 *       required:
 *         - id
 *         - companyId
 *         - createdAt
 *         - updatedAt
 */
export interface ISupportClient {
  id: string;
  companyId: string;
  settings?: ISupportClientSettings;
  clientAiAssessmentSettings?: ISupportClientAiAssessmentSettings;
  status?: ICompanyVerificationStatus;
  createdAt: Date;
  updatedAt: Date;
  company?: ISupportClientCompany;
  clientUsers?: ISupportClientUser[];
  jobPostings?: ISupportClientJobPosting[];
  invitations?: ISupportClientUserInvitation[];
  jobAssessmentInvitations?: ISupportClientJobAssessmentInvitation[];
  subscription?: IClientSubscription;
  financialData?: ISupportClientFinancialData;
  documents?: ISupportClientDocument[];
  // Additional fields for enhanced support view
  stats?: {
    totalUsers: number;
    totalJobPostings: number;
    totalDocuments: number;
  };
  profile?: IClientProfile;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportClientSettings:
 *       type: object
 *       description: Client settings configuration
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the settings
 *         clientId:
 *           type: string
 *           format: uuid
 *           description: ID of the associated client
 *         globalSettingsId:
 *           type: string
 *           format: uuid
 *           description: ID of the associated global settings
 *         notificationsEnabled:
 *           type: boolean
 *           description: Whether notifications are enabled
 *         emailNotifications:
 *           type: boolean
 *           description: Whether email notifications are enabled
 *         pushNotifications:
 *           type: boolean
 *           description: Whether push notifications are enabled
 *         jobAlerts:
 *           type: boolean
 *           description: Whether job alerts are enabled
 *         candidateAlerts:
 *           type: boolean
 *           description: Whether candidate alerts are enabled
 *         applicationAlerts:
 *           type: boolean
 *           description: Whether application alerts are enabled
 *         privacySettings:
 *           type: object
 *           description: Privacy settings configuration
 *         brandingSettings:
 *           type: object
 *           description: Branding settings configuration
 *         integrationSettings:
 *           type: object
 *           description: Integration settings configuration
 *         isDeelEnabled:
 *           type: boolean
 *           description: Whether Deel SSO integration is enabled
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the settings were created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the settings were last updated
 */
export interface ISupportClientSettings {
  id: string;
  clientId: string;
  globalSettingsId?: string;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  jobAlerts: boolean;
  candidateAlerts: boolean;
  applicationAlerts: boolean;
  privacySettings?: Record<string, any>;
  brandingSettings?: Record<string, any>;
  integrationSettings?: Record<string, any>;
  isDeelEnabled?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportClientAiAssessmentSettings:
 *       type: object
 *       required:
 *         - id
 *         - clientId
 *       description: Job ai assessment settings for a client
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the settings
 *         clientId:
 *           type: string
 *           format: uuid
 *           description: ID of the associated client
 *         globalSettingsId:
 *           type: string
 *           format: uuid
 *           description: ID of the global settings to inherit from
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
 *         maxSections:
 *           type: number
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
 *         sectionTemplates:
 *           type: object
 *           description: Section templates
 *         questionTemplates:
 *           type: object
 *           description: Question templates
 *         customStyles:
 *           type: object
 *           description: Custom styles
 *         customInstructions:
 *           type: string
 *           description: Custom instructions
 *         createdAt:
 *           type: string
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the settings were last updated
 */
export interface ISupportClientAiAssessmentSettings {
  id: string;
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
 *     ISupportClientCreate:
 *       type: object
 *       description: Payload for creating a new client
 *       properties:
 *         name:
 *           type: string
 *           description: Admin user name
 *         email:
 *           type: string
 *           format: email
 *           description: Admin user email
 *         companyName:
 *           type: string
 *           description: Company name
 *         jobTitle:
 *           type: string
 *           description: Admin user job title
 *         settings:
 *           $ref: '#/components/schemas/ISupportClientSettings'
 *           description: Initial client settings
 *         clientAiAssessmentSettings:
 *           $ref: '#/components/schemas/ISupportClientAiAssessmentSettings'
 *           description: Client job ai assessment settings
 */
export interface ISupportClientCreate {
  name: string;
  email: string;
  companyName: string;
  jobTitle: string;
  settings?: Omit<
    ISupportClientSettings,
    'id' | 'clientId' | 'createdAt' | 'updatedAt'
  >;
  clientAiAssessmentSettings?: Omit<
    ISupportClientAiAssessmentSettings,
    'id' | 'clientId' | 'createdAt' | 'updatedAt'
  >;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportClientUpdate:
 *       type: object
 *       description: Payload for updating an existing client
 *       properties:
 *         settings:
 *           $ref: '#/components/schemas/ISupportClientSettings'
 *           description: Updated client settings
 *         clientAiAssessmentSettings:
 *           $ref: '#/components/schemas/ISupportClientAiAssessmentSettings'
 *           description: Job ai assessment settings
 */
export type ISupportClientUpdate = Partial<
  Omit<ISupportClient, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>
>;

/**
 * @openapi
 * components:
 *   parameters:
 *     ISupportClientIdParams:
 *       in: path
 *       name: supportClientId
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *         description: ID of the client
 */
export interface ISupportClientIdParams {
  supportClientId: string;
}

/**
 * @openapi
 * components:
 *   parameters:
 *     ISupportClientFilterQueryCompanyId:
 *       in: query
 *       name: companyFilters
 *       required: false
 *       style: deepObject
 *       explode: true
 *       description: Filters for support clients
 *       schema:
 *         type: object
 *         properties:
 *           companyId:
 *             type: string
 *             format: uuid
 *             description: Filter by company ID
 *           industry:
 *             type: string
 *             description: Filter by industry
 *           size:
 *             type: string
 *             description: Filter by size
 *           stage:
 *             type: string
 *             description: Filter by stage
 *           companyType:
 *             type: string
 *             description: Filter by company type
 *           foundedYear:
 *             type: number
 *             description: Filter by founded year
 *           website:
 *             type: string
 *             description: Filter by website
 *           status:
 *             type: string
 *             description: Filter by status
 */
export interface ISupportClientFilterQueryCompanyId {
  companyId?: string;
  industry?: string;
  size?: string;
  stage?: string;
  status?: string;
  companyType?: string;
  foundedYear?: number;
  website?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportClientCompany:
 *       type: object
 *       description: Complete company information with all profiles
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         contactEmail:
 *           type: string
 *           format: email
 *         status:
 *           type: string
 *           description: Status of the company
 *         profile:
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
 *             website:
 *               type: string
 *             benefits:
 *               type: array
 *               items:
 *                 type: string
 *         basic:
 *           type: object
 *           properties:
 *             contactPhone:
 *               type: string
 *             contactName:
 *               type: string
 *             registrationNumber:
 *               type: string
 *             vatNumber:
 *               type: string
 *         billing:
 *           type: object
 *           properties:
 *             billingEmail:
 *               type: string
 *             billingPhone:
 *               type: string
 *             billingContactName:
 *               type: string
 *         address:
 *           type: string
 *           description: Address of the company
 *         city:
 *           type: string
 *           description: City of the company
 *         state:
 *           type: string
 *           description: State of the company
 *         zipCode:
 *           type: string
 *           description: Zip code of the company
 *         country:
 *           type: string
 *           description: Country of the company
 *         social:
 *           type: object
 *           properties:
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
 *         shipping:
 *           type: object
 *           properties:
 *             shippingAddress:
 *               type: string
 *             shippingCity:
 *               type: string
 *             shippingState:
 *               type: string
 *             shippingZipCode:
 *               type: string
 *             shippingCountry:
 *               type: string
 *         socialProfiles:
 *           type: object
 *           properties:
 *             linkedin:
 *               type: string
 *             twitter:
 *               type: string
 *             facebook:
 *               type: string
 *             instagram:
 *               type: string
 *             youtube:
 *               type: string
 *             github:
 *               type: string
 *         culture:
 *           type: object
 *           properties:
 *             mission:
 *               type: string
 *             vision:
 *               type: string
 *             values:
 *               type: array
 *               items:
 *                 type: string
 *             perks:
 *               type: array
 *               items:
 *                 type: string
 *             workEnvironment:
 *               type: array
 *               items:
 *                 type: string
 */
export interface ISupportClientCompany {
  id: string;
  name: string;
  description?: string;
  companyType?: string;
  industry?: string;
  size?: string;
  stage?: string;
  foundedYear?: number;
  website?: string;
  benefits?: string[];
  contactPhone?: string;
  contactName?: string;
  contactEmail?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  social?: Record<string, string>;
  culture?: Record<string, any>;
  status?: ICompanyVerificationStatus;
  remarks?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportClientUser:
 *       type: object
 *       description: User information
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the user
 *         email:
 *           type: string
 *           description: Email of the user
 *         name:
 *           type: string
 *           description: Name of the user
 *         role:
 *           type: string
 *           description: Role of the user
 *         status:
 *           type: string
 *           description: Status of the user
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the user was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the user was last updated
 */
export interface ISupportClientUser {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportClientJobPosting:
 *       type: object
 *       description: Job posting information
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the job posting
 *         title:
 *           type: string
 *           description: Title of the job posting
 *         status:
 *           type: string
 *           description: Status of the job posting
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the job posting was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the job posting was last updated
 *         totalExperience:
 *           type: number
 *           description: Total experience required for the job posting
 */
export interface ISupportClientJobPosting {
  id: string;
  title: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  totalExperience?: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportClientUserInvitation:
 *       type: object
 *       description: Support client user invitation information
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the invitation
 *         email:
 *           type: string
 *           description: Email of the invited user
 *         name:
 *           type: string
 *           description: Name of the invited user
 *         jobTitle:
 *           type: string
 *           description: Title of the job for the invitation
 *         role:
 *           type: string
 *           description: Role of the invited user
 *         status:
 *           type: string
 *           description: Status of the invitation
 *         token:
 *           type: string
 *           description: Token for the invitation
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: Expiration date of the invitation
 *         acceptedAt:
 *           type: string
 *           format: date-time
 *           description: Acceptance date of the invitation
 *         clientUserId:
 *           type: string
 *           format: uuid
 *           description: ID of the client user for the invitation
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the invitation was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the invitation was last updated
 */
export interface ISupportClientUserInvitation {
  id: string;
  email: string;
  name: string;
  jobTitle: string;
  role: string;
  status: string;
  token: string;
  expiresAt: Date;
  acceptedAt: Date;
  clientUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportClientJobAssessmentInvitation:
 *       type: object
 *       description: Job assessment invitation information
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the job assessment invitation
 *         candidateId:
 *           type: string
 *           format: uuid
 *           description: ID of the candidate for the job assessment
 *         jobApplicationId:
 *           type: string
 *           format: uuid
 *           description: ID of the job application for the job assessment
 *         jobAiAssessmentId:
 *           type: string
 *           format: uuid
 *           description: ID of the job AI assessment for the job assessment
 *         invitedById:
 *           type: string
 *           format: uuid
 *           description: ID of the user who invited the candidate for the job assessment
 *         type:
 *           type: string
 *           description: Type of the job assessment invitation
 *         status:
 *           type: string
 *           description: Status of the job assessment invitation
 *         message:
 *           type: string
 *           description: Message for the job assessment invitation
 *         scheduledDate:
 *           type: string
 *           format: date-time
 *           description: Scheduled date of the job assessment invitation
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: Expiration date of the job assessment invitation
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the job assessment invitation was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the job assessment invitation was last updated
 *         candidate:
 *           type: object
 *           description: Candidate information for the job assessment invitation
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *               description: Unique identifier for the candidate
 *             userId:
 *               type: string
 *               format: uuid
 *               description: ID of the user for the candidate
 */
export interface ISupportClientJobAssessmentInvitation {
  id: string;
  candidateId: string;
  jobApplicationId: string;
  jobAiAssessmentId: string;
  invitedById: string;
  type: string;
  status: string;
  message: string;
  scheduledDate: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  candidate:
    | {
        id: string;
        userId: string;
      }
    | undefined;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportClientBankAccount:
 *       type: object
 *       description: Bank account information
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the bank account
 *         accountName:
 *           type: string
 *           description: Name of the bank account
 *         accountNumber:
 *           type: string
 *           description: Account number of the bank account
 *         bankName:
 *           type: string
 *           description: Name of the bank
 *         swiftCode:
 *           type: string
 *           description: SWIFT code of the bank account
 *         isDefault:
 *           type: boolean
 *           description: Whether the bank account is default
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the bank account was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the bank account was last updated
 */
export interface ISupportClientBankAccount {
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
 *     ISupportClientFinancialData:
 *       type: object
 *       description: Financial data information
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the financial data
 *         annualRevenue:
 *           type: number
 *           description: Annual revenue of the company
 *         taxId:
 *           type: string
 *           description: Tax ID of the company
 *         vatNumber:
 *           type: string
 *           description: VAT number of the company
 *         gstNumber:
 *           type: string
 *           description: GST number of the company
 *         bankAccounts:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ISupportClientBankAccount'
 *           description: Bank accounts of the company
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the financial data was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the financial data was last updated
 */
export interface ISupportClientFinancialData {
  id: string | null;
  annualRevenue: number;
  taxId: string | null;
  vatNumber?: string | null;
  gstNumber?: string | null;
  bankAccounts: ISupportClientBankAccount[];
  createdAt: Date | null;
  updatedAt: Date | null;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportClientDocument:
 *       type: object
 *       description: Document information
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the document
 *         name:
 *           type: string
 *           description: Name of the document
 *         type:
 *           type: string
 *           description: Type of the document
 *         size:
 *           type: number
 *           description: Size of the document
 *         url:
 *           type: string
 *           description: URL of the document
 *         uploadedBy:
 *           type: string
 *           format: uuid
 *           description: ID of the user who uploaded the document
 *         status:
 *           type: string
 *           description: Status of the document
 *         remarks:
 *           type: string
 *           description: Remarks about the document
 *         verifiedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the document was verified
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the document was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the document was last updated
 */
export interface ISupportClientDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  status?: string;
  remarks?: string;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Add missing response types for API consistency
export interface ISupportClientCreateResponse {
  id: string;
  companyName: string;
  email: string;
  jobTitle: string;
  message: string;
}

export interface ISupportClientListResponse {
  id: string;
  companyId: string;
  companyName: string;
  contactEmail: string;
  industry: string;
  size: string;
  status: string;
  createdAt: string;
  userCount: number;
  jobPostingsCount: number;
  documentsCount: number;
  hasFinancialData: boolean;
}

/**
 * Helper function to convert database models to domain models
 */
export function toSupportClientDomain(client: any): ISupportClient {
  return {
    id: client.id,
    companyId: client.companyId,
    settings: client.settings
      ? {
          id: client.settings.id,
          clientId: client.settings.clientId,
          globalSettingsId: client.settings.globalSettingsId,
          notificationsEnabled: client.settings.notificationsEnabled,
          emailNotifications: client.settings.emailNotifications,
          pushNotifications: client.settings.pushNotifications,
          jobAlerts: client.settings.jobAlerts,
          candidateAlerts: client.settings.candidateAlerts,
          applicationAlerts: client.settings.applicationAlerts,
          privacySettings: client.settings.privacySettings,
          brandingSettings: client.settings.brandingSettings,
          integrationSettings: client.settings.integrationSettings,
          isDeelEnabled: client.settings.isDeelEnabled ?? false,
          createdAt: client.settings.createdAt,
          updatedAt: client.settings.updatedAt,
        }
      : undefined,
    clientAiAssessmentSettings: client.clientAiAssessmentSettings
      ? {
          id: client.clientAiAssessmentSettings.id,
          clientId: client.clientAiAssessmentSettings.clientId,
          globalSettingsId: client.clientAiAssessmentSettings.globalSettingsId,
          greetingMessage: client.clientAiAssessmentSettings.greetingMessage,
          defaultAssessmentDuration:
            client.clientAiAssessmentSettings.defaultAssessmentDuration,
          defaultPassingScore:
            client.clientAiAssessmentSettings.defaultPassingScore,
          requiredSections: client.clientAiAssessmentSettings.requiredSections,
          maximumAttempts: client.clientAiAssessmentSettings.maximumAttempts,
          cooldownPeriod: client.clientAiAssessmentSettings.cooldownPeriod,
          maxAssessmentDuration:
            client.clientAiAssessmentSettings.maxAssessmentDuration,
          assessmentBuffer: client.clientAiAssessmentSettings.assessmentBuffer,
          useCustomPrompts: client.clientAiAssessmentSettings.useCustomPrompts,
          aiDifficulty: client.clientAiAssessmentSettings.aiDifficulty,
          customPrompts: client.clientAiAssessmentSettings.customPrompts,
          skillWeightings: client.clientAiAssessmentSettings.skillWeightings,
          maxSections: client.clientAiAssessmentSettings.maxSections,
          maxQuestionsPerSection:
            client.clientAiAssessmentSettings.maxQuestionsPerSection,
          proctoringEnabled:
            client.clientAiAssessmentSettings.proctoringEnabled,
          maxWarnings: client.clientAiAssessmentSettings.maxWarnings,
          tabSwitchLimit: client.clientAiAssessmentSettings.tabSwitchLimit,
          copyPasteAllowed: client.clientAiAssessmentSettings.copyPasteAllowed,
          videoRecordingEnabled:
            client.clientAiAssessmentSettings.videoRecordingEnabled,
          minimumVideoLength:
            client.clientAiAssessmentSettings.minimumVideoLength,
          aiVideoAnalysisEnabled:
            client.clientAiAssessmentSettings.aiVideoAnalysisEnabled,
          autoPublishOnSuccess:
            client.clientAiAssessmentSettings.autoPublishOnSuccess,
          autoNotifyOnComplete:
            client.clientAiAssessmentSettings.autoNotifyOnComplete,
          sectionTemplates: client.clientAiAssessmentSettings.sectionTemplates,
          questionTemplates:
            client.clientAiAssessmentSettings.questionTemplates,
          customStyles: client.clientAiAssessmentSettings.customStyles,
          customInstructions:
            client.clientAiAssessmentSettings.customInstructions,
          createdAt: client.clientAiAssessmentSettings.createdAt,
          updatedAt: client.clientAiAssessmentSettings.updatedAt,
        }
      : undefined,
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
    // --- Strongly typed related fields (only if they were loaded) ---
    company: client.company
      ? {
          id: client.company.id,
          name: client.company.name,
          description: client.company.description,
          companyType: client.company.companyType,
          industry: client.company.industry,
          size: client.company.size,
          stage: client.company.stage,
          foundedYear: client.company.foundedYear,
          website: client.company.website,
          benefits: client.company.benefits,
          contactPhone: client.company.contactPhone,
          contactName: client.company.contactName,
          contactEmail: client.company.contactEmail,
          address: client.company.address,
          city: client.company.city,
          state: client.company.state,
          zipCode: client.company.zipCode,
          country: client.company.country,
          social: client.company.social,
          culture: client.company.culture,
          status: client.company.status,
          remarks: client.company.remarks,
        }
      : undefined,
    // Only include these arrays if they were actually loaded from the database
    clientUsers: client.clientUsers?.map((u: any) => ({
      id: u.id,
      email: u.user?.email,
      name: u.user?.name,
      role: u.user?.role,
      status: u.user?.status,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    })),
    jobPostings: client.jobPostings?.map((j: any) => ({
      id: j.id,
      title: j.title,
      status: j.status,
      createdAt: j.createdAt,
      updatedAt: j.updatedAt,
      totalExperience: j.totalExperience,
    })),
    invitations: client.invitations?.map((i: any) => ({
      id: i.id,
      email: i.email,
      name: i.name,
      jobTitle: i.jobTitle,
      role: i.role,
      status: i.status,
      token: i.token,
      expiresAt: i.expiresAt,
      acceptedAt: i.acceptedAt,
      clientUserId: i.clientUserId,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    })),
    jobAssessmentInvitations: client.jobAssessmentInvitations?.map(
      (ja: any) => ({
        id: ja.id,
        candidateId: ja.candidateId,
        jobApplicationId: ja.jobApplicationId,
        jobAiAssessmentId: ja.jobAiAssessmentId,
        invitedById: ja.invitedById,
        type: ja.type,
        status: ja.status,
        message: ja.message,
        scheduledDate: ja.scheduledDate,
        expiresAt: ja.expiresAt,
        createdAt: ja.createdAt,
        updatedAt: ja.updatedAt,
        candidate: ja.candidate
          ? {
              id: ja.candidate.id,
              userId: ja.candidate.userId,
            }
          : undefined,
      })
    ),
    financialData: client.financialData
      ? {
          id: client.financialData.id,
          annualRevenue: Number(client.financialData.annualRevenue),
          taxId: client.financialData.taxId,
          vatNumber: client.financialData.vatNumber,
          gstNumber: client.financialData.gstNumber,
          bankAccounts:
            client.financialData.bankAccounts?.map((b: any) => ({
              id: b.id,
              accountName: b.accountName,
              accountNumber: b.accountNumber,
              bankName: b.bankName,
              swiftCode: b.swiftCode,
              isDefault: b.isDefault,
              createdAt: b.createdAt,
              updatedAt: b.updatedAt,
            })) || [],
          createdAt: client.financialData.createdAt,
          updatedAt: client.financialData.updatedAt,
        }
      : {
          id: null,
          annualRevenue: 0,
          taxId: null,
          vatNumber: null,
          gstNumber: null,
          bankAccounts: [],
          createdAt: null,
          updatedAt: null,
        },
    // Additional fields for enhanced support view
    documents: client.documents?.map((d: any) => ({
      id: d.id,
      name: d.name,
      type: d.type,
      size: Number(d.size),
      url: d.url,
      uploadedBy: d.uploadedBy,
      status: d.status,
      remarks: d.remarks,
      verifiedAt: d.verifiedAt,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    })),
    stats: {
      totalUsers: client._count?.clientUsers || 0,
      totalJobPostings: client._count?.jobPostings || 0,
      totalDocuments: client._count?.documents || 0,
    },
    profile: client.profile,
    subscription: client.subscriptions?.[0]
      ? toClientSubscriptionDomain(client.subscriptions[0])
      : undefined,
  };
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportClientVerifyApiRequest:
 *       type: object
 *       description: Request payload for verifying a client
 *       properties:
 *         remarks:
 *           type: string
 *           description: Optional remarks about the verification
 *           maxLength: 500
 *
 */
export interface ISupportClientVerifyRequest {
  remarks?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportClientVerifyResponse:
 *       type: object
 *       description: Response payload for client verification
 *       properties:
 *         clientId:
 *           type: string
 *           format: uuid
 *           description: ID of the verified client
 *         companyId:
 *           type: string
 *           format: uuid
 *           description: ID of the company
 *         companyName:
 *           type: string
 *           description: Name of the company
 *         verificationStatus:
 *           $ref: '#/components/schemas/ICompanyVerificationStatus'
 *           description: Current verification status
 *         message:
 *           type: string
 *           description: Success message
 *         verifiedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the client was verified
 *         verifiedBy:
 *           type: string
 *           format: uuid
 *           description: ID of the support user who verified the client
 *       required:
 *         - clientId
 *         - companyId
 *         - companyName
 *         - verificationStatus
 *         - message
 *         - verifiedAt
 *         - verifiedBy
 */
export interface ISupportClientVerifyResponse {
  clientId: string;
  companyId: string;
  companyName: string;
  verificationStatus: ICompanyVerificationStatus;
  message: string;
  verifiedAt: Date;
  verifiedBy: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportClientJobPostingByIdParams:
 *       type: object
 *       description: Params for getting a job posting by ID
 *       properties:
 *         jobPostingId:
 *           type: string
 *           format: uuid
 *           description: ID of the job posting
 */

export interface ISupportClientJobPostingByIdParams {
  jobPostingId: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportClientJobPostingByIdResponse:
 *       type: object
 *       description: Response payload for getting a job posting by ID
 *       properties:
 *         title:
 *           type: string
 *           description: Title of the job posting
 */
export interface ISupportClientJobPostingByIdResponse {
  title: string;
}
