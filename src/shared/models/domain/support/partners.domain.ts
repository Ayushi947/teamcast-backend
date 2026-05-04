import {
  CompanyTypeEnum,
  CompanyIndustryEnum,
  CompanySizeEnum,
  CompanyStageEnum,
} from '../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartner:
 *       type: object
 *       description: Partner information
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Partner ID
 *         companyName:
 *           type: string
 *           description: Company name
 *         email:
 *           type: string
 *           format: email
 *           description: Contact email
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         candidateCount:
 *           type: number
 *           description: Number of candidates associated with the partner
 *         userCount:
 *           type: number
 *           description: Number of users associated with the partner
 *         documentCount:
 *           type: number
 *           description: Number of documents associated with the partner
 *         financialDataExists:
 *           type: boolean
 *           description: Whether financial data exists for the partner
 *         company:
 *           type: object
 *           description: Company details
 *           properties:
 *             description:
 *               type: string
 *             companyType:
 *               type: string
 *               enum: [STARTUP, SCALE_UP, ENTERPRISE, AGENCY, CONSULTING]
 *             industry:
 *               type: string
 *               enum: [TECHNOLOGY, HEALTHCARE, FINANCE, EDUCATION, RETAIL, OTHER]
 *             size:
 *               type: string
 *               enum: [ONE_TO_TEN, ELEVEN_TO_FIFTY, FIFTY_ONE_TO_TWO_HUNDRED, TWO_HUNDRED_ONE_TO_FIVE_HUNDRED, FIVE_HUNDRED_ONE_TO_THOUSAND, OVER_THOUSAND]
 *             stage:
 *               type: string
 *               enum: [SEED, EARLY_STAGE, GROWTH, MATURE, ENTERPRISE]
 *             foundedYear:
 *               type: number
 *             website:
 *               type: string
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
 *                 twitter:
 *                   type: string
 *                 facebook:
 *                   type: string
 *                 instagram:
 *                   type: string
 *                 youtube:
 *                   type: string
 *                 github:
 *                   type: string
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
 *           description: Partner settings
 *           properties:
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
 *           description: Financial data
 *           properties:
 *             annualRevenue:
 *               type: number
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
 *         stats:
 *           type: object
 *           description: Additional statistics
 *           properties:
 *             jobApplicationsCount:
 *               type: number
 *             invitationsCount:
 *               type: number
 */

export interface IPartner {
  id: string;
  companyName: string;
  email: string;
  createdAt: Date;
  candidateCount: number;
  userCount: number;
  documentCount: number;
  financialDataExists: boolean;
  company?: {
    description: string;
    companyType: CompanyTypeEnum;
    industry: CompanyIndustryEnum;
    size: CompanySizeEnum;
    stage: CompanyStageEnum;
    foundedYear: number;
    website?: string;
    benefits: string[];
    contactPhone?: string;
    contactName?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    social?: {
      linkedin?: string;
      twitter?: string;
      facebook?: string;
      instagram?: string;
      youtube?: string;
      github?: string;
    };
    culture?: {
      mission?: string;
      vision?: string;
      values: string[];
      perks: string[];
      workEnvironment: string[];
    };
  };
  settings?: {
    notificationsEnabled: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
    consultantAlerts: boolean;
    contractAlerts: boolean;
    privacySettings?: any;
    brandingSettings?: any;
    integrationSettings?: any;
  };
  financialData?: {
    annualRevenue: number;
    taxId: string;
    vatNumber?: string;
    gstNumber?: string;
    bankAccounts: {
      accountName: string;
      accountNumber: string;
      bankName: string;
      swiftCode: string;
      isDefault: boolean;
    }[];
  };
  stats?: {
    jobApplicationsCount: number;
    invitationsCount: number;
  };
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportPartner:
 *       type: object
 *       description: Domain model representing a partner
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the partner
 *         companyId:
 *           type: string
 *           format: uuid
 *           description: ID of the associated company
 *         companyName:
 *           type: string
 *           description: Name of the associated company
 *         email:
 *           type: string
 *           format: email
 *           description: Contact email of the associated company
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the partner was created
 *         candidateCount:
 *           type: number
 *           description: Number of candidates associated with the partner
 *         userCount:
 *           type: number
 *           description: Number of users associated with the partner
 *         settings:
 *           $ref: '#/components/schemas/ISupportPartnerSettings'
 *           description: Partner settings
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the partner was last updated
 *       required:
 *         - id
 *         - companyId
 *         - companyName
 *         - email
 *         - createdAt
 *         - candidateCount
 *         - userCount
 *         - settings
 *         - updatedAt
 */
export interface ISupportPartner {
  id: string;
  companyId: string;
  logoUrl?: string; // Optional logo URL, can be empty if not set
  companyName: string;
  email: string;
  createdAt: Date;
  candidateCount: number;
  userCount: number;
  documentCount: number;
  financialDataExists: boolean;
  company?: ISupportPartnerCompany;
  settings?: ISupportPartnerSettings;
  invitations?: Array<{
    id: string;
    partnerId: string;
    email: string;
    name: string;
    jobTitle?: string;
    role: string;
    type: string;
    status: string;
    token: string;
    expiresAt: Date;
    acceptedAt?: Date;
    partnerUserId?: string;
    createdById: string;
    createdBy: {
      name: string;
      email: string;
    };
    createdAt: Date;
    updatedAt: Date;
  }>;
  partnerUsers?: Array<{
    id: string;
    partnerId: string;
    userId: string;
    role: string;
    status: string;
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
      jobTitle?: string;
      status: string;
      type: string;
      role: string;
      profileSetup: boolean;
      emailVerified?: Date;
    };
    settings?: {
      id: string;
      partnerUserId: string;
      notificationsEnabled: boolean;
      emailNotifications: boolean;
      pushNotifications: boolean;
      darkMode: boolean;
      language: string;
      timezone: string;
      createdAt: Date;
      updatedAt: Date;
    };
    createdAt: Date;
    updatedAt: Date;
  }>;
  candidates?: Array<{
    id: string;
    userId: string;
    status: string;
    assessmentStage: string;
    resumeAssessmentStatus: string;
    onboardingAssessmentStatus: string;
    isPublished: boolean;
    isDirty: boolean;
    completionPercentage: number;
    jobSearchStatus: string;
    user: {
      name: string;
      email: string;
      image?: string;
    };
    resume?: {
      id: string;
      summary?: string;
      totalExperience?: number;
      highestEducationLevel?: string;
    };
    candidateSubscription?: {
      status: string;
      package?: {
        name: string;
      };
    };
    createdAt: Date;
    updatedAt: Date;
  }>;
  financialData?: {
    id: string;
    annualRevenue: number;
    taxId: string;
    vatNumber?: string;
    gstNumber?: string;
    bankAccounts: {
      id: string;
      accountName: string;
      accountNumber: string;
      bankName: string;
      swiftCode: string;
      isDefault: boolean;
      createdAt: Date;
      updatedAt: Date;
    }[];
    createdAt: Date;
    updatedAt: Date;
  };
  documents?: {
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
    uploadedBy: string;
    createdAt: Date;
    updatedAt: Date;
  }[];
  jobApplications?: {
    id: string;
    candidateId: string;
    jobPostingId: string;
    status: string;
    submittedAt: Date;
    candidate: {
      id: string;
      user: {
        name: string;
        email: string;
        image?: string;
      };
      resume?: {
        totalExperience?: number;
        highestEducationLevel?: string;
      };
    };
    jobPosting: {
      id: string;
      title: string;
      client: {
        id: string;
        company: {
          name: string;
        };
      };
    };
  }[];
  stats?: {
    jobApplicationsCount: number;
    invitationsCount: number;
    documentsCount: number;
    candidatesCount: number;
    usersCount: number;
  };
  activities?: Array<{
    id: string;
    userId: string;
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
    };
    module: string;
    action: string;
    entityId: string;
    entityType: string;
    description: string;
    metadata?: any;
    timestamp: Date;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
  }>;
  updatedAt?: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportPartnerCompany:
 *       type: object
 *       description: Complete partner company information with all profiles
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         contactEmail:
 *           type: string
 *           format: email
 *         contactPhone:
 *           type: string
 *           format: phone
 *         contactName:
 *           type: string
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
export interface ISupportPartnerCompany {
  id: string;
  name: string;
  contactEmail: string;
  contactPhone?: string;
  contactName?: string;
  profile?: {
    description?: string;
    companyType?: CompanyTypeEnum;
    industry?: CompanyIndustryEnum;
    size?: CompanySizeEnum;
    stage?: CompanyStageEnum;
    foundedYear?: number;
    website?: string;
    benefits?: string[];
  };
  basic?: {
    contactPhone?: string;
    contactName?: string;
    registrationNumber?: string;
    vatNumber?: string;
  };
  billing?: {
    billingEmail?: string;
    billingPhone?: string;
    billingContactName?: string;
  };
  address?: {
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  shipping?: {
    shippingAddress?: string;
    shippingCity?: string;
    shippingState?: string;
    shippingZipCode?: string;
    shippingCountry?: string;
  };
  socialProfiles?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
    github?: string;
  };
  culture?: {
    mission?: string;
    vision?: string;
    values?: string[];
    perks?: string[];
    workEnvironment?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportPartnerSettings:
 *       type: object
 *       description: Partner settings configuration
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the settings
 *         partnerId:
 *           type: string
 *           format: uuid
 *           description: ID of the associated partner
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
 *         consultantAlerts:
 *           type: boolean
 *           description: Whether consultant alerts are enabled
 *         contractAlerts:
 *           type: boolean
 *           description: Whether contract alerts are enabled
 *         privacySettings:
 *           type: object
 *           description: Privacy settings configuration
 *         brandingSettings:
 *           type: object
 *           description: Branding settings configuration
 *         integrationSettings:
 *           type: object
 *           description: Integration settings configuration
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the settings were created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the settings were last updated
 */
export interface ISupportPartnerSettings {
  id: string;
  partnerId: string;
  globalSettingsId?: string;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  consultantAlerts: boolean;
  contractAlerts: boolean;
  privacySettings?: Record<string, any>;
  brandingSettings?: Record<string, any>;
  integrationSettings?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportPartnerCreate:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - companyName
 *         - title
 *         - specialization
 *       properties:
 *         name:
 *           type: string
 *           description: Partner's full name
 *           example: Jane Smith
 *         email:
 *           type: string
 *           format: email
 *           description: Partner's email address
 *           example: jane.smith@example.com
 *         companyName:
 *           type: string
 *           description: Name of the partner's company
 *           example: TechTalent Solutions
 *         title:
 *           type: string
 *           description: Partner's job title
 *           example: Head of Recruitment
 *         specialization:
 *           type: string
 *           description: Partner's area of specialization
 *           example: Software Engineering
 */
export interface ISupportPartnerCreate {
  name: string;
  email: string;
  companyName: string;
  title: string;
  specialization: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportPartnerUpdate:
 *       type: object
 *       description: Payload for updating an existing partner
 *       properties:
 *         settings:
 *           $ref: '#/components/schemas/ISupportPartnerSettings'
 *           description: Updated partner settings
 */
export type ISupportPartnerUpdate = Partial<
  Omit<ISupportPartner, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>
>;

/**
 * @openapi
 * components:
 *   parameters:
 *     ISupportPartnerIdParams:
 *       in: path
 *       name: supportPartnerId
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *         description: ID of the partner
 */
export interface ISupportPartnerIdParams {
  supportPartnerId: string;
}

/**
 * @openapi
 * components:
 *   parameters:
 *     ISupportPartnerFilterQueryCompanyId:
 *       in: query
 *       name: companyId
 *       required: false
 *       schema:
 *         type: string
 *         format: uuid
 *         description: Filter by company ID
 */
export interface ISupportPartnerFilterQueryCompanyId {
  companyId?: string;
}

/**
 * Helper function to convert database models to domain models
 */
export const toSupportPartnerDomain = (partner: any): ISupportPartner => {
  return {
    id: partner.id,
    companyId: partner.companyId,
    logoUrl: partner?.profile?.basic?.logoUrl || '',
    companyName: partner.company?.name || '',
    email: partner.company?.contactEmail || '',
    createdAt: partner.createdAt,
    candidateCount: partner._count?.candidates || 0,
    userCount: partner._count?.partnerUsers || 0,
    documentCount: partner._count?.documents || 0,
    financialDataExists: !!partner.financialData,
    company: partner.company
      ? {
          id: partner.company.id,
          name: partner.company.name,
          contactEmail: partner.company.contactEmail,
          contactPhone: partner.company.contactPhone,
          contactName: partner.company.contactName,
          profile: {
            description: partner.company.description || '',
            companyType: partner.company.companyType,
            industry: partner.company.industry,
            size: partner.company.size,
            stage: partner.company.stage,
            foundedYear: partner.company.foundedYear,
            website: partner.company.website,
            benefits: partner.company.benefits || [],
          },
          basic: {
            contactPhone: partner.company.contactPhone,
            contactName: partner.company.contactName,
            registrationNumber: partner.company.registrationNumber,
            vatNumber: partner.company.vatNumber,
          },
          billing: partner.company.billing,
          address: {
            address: partner.company.address,
            city: partner.company.city,
            state: partner.company.state,
            zipCode: partner.company.zipCode,
            country: partner.company.country,
          },
          shipping: partner.company.shipping,
          socialProfiles: partner.company.social,
          culture: partner.company.culture,
          createdAt: partner.company.createdAt,
          updatedAt: partner.company.updatedAt,
        }
      : undefined,
    settings: partner.settings
      ? {
          id: partner.settings.id,
          partnerId: partner.settings.partnerId,
          globalSettingsId: partner.settings.globalSettingsId,
          notificationsEnabled: partner.settings.notificationsEnabled,
          emailNotifications: partner.settings.emailNotifications,
          pushNotifications: partner.settings.pushNotifications,
          consultantAlerts: partner.settings.consultantAlerts,
          contractAlerts: partner.settings.contractAlerts,
          privacySettings: partner.settings.privacySettings,
          brandingSettings: partner.settings.brandingSettings,
          integrationSettings: partner.settings.integrationSettings,
          createdAt: partner.settings.createdAt,
          updatedAt: partner.settings.updatedAt,
        }
      : undefined,
    financialData: partner.financialData
      ? {
          id: partner.financialData.id,
          annualRevenue: Number(partner.financialData.annualRevenue),
          taxId: partner.financialData.taxId,
          vatNumber: partner.financialData.vatNumber,
          gstNumber: partner.financialData.gstNumber,
          bankAccounts:
            partner.financialData.bankAccounts?.map((account: any) => ({
              id: account.id,
              accountName: account.accountName,
              accountNumber: account.accountNumber,
              bankName: account.bankName,
              swiftCode: account.swiftCode,
              isDefault: account.isDefault,
              createdAt: account.createdAt,
              updatedAt: account.updatedAt,
            })) || [],
          createdAt: partner.financialData.createdAt,
          updatedAt: partner.financialData.updatedAt,
        }
      : undefined,
    // Only include these arrays if they were actually loaded from the database
    documents: partner.documents?.map((doc: any) => ({
      id: doc.id,
      name: doc.name,
      type: doc.type,
      size: Number(doc.size),
      url: doc.url,
      uploadedBy: doc.uploadedBy,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    })),
    jobApplications: partner.jobApplications?.map((app: any) => ({
      id: app.id,
      candidateId: app.candidateId,
      jobPostingId: app.jobPostingId,
      status: app.status,
      submittedAt: app.submittedAt,
      candidate: {
        id: app.candidate.id,
        user: {
          name: app.candidate.user.name,
          email: app.candidate.user.email,
          image: app.candidate.user.image,
        },
        resume: app.candidate.resume
          ? {
              totalExperience: app.candidate.resume.totalExperience,
              highestEducationLevel: app.candidate.resume.highestEducationLevel,
            }
          : undefined,
      },
      jobPosting: {
        id: app.jobPosting.id,
        title: app.jobPosting.title,
        client: {
          id: app.jobPosting.client.id,
          company: {
            name: app.jobPosting.client.company.name,
          },
        },
      },
    })),
    invitations: partner.invitations?.map((invitation: any) => ({
      id: invitation.id,
      partnerId: invitation.partnerId,
      email: invitation.email,
      name: invitation.name,
      jobTitle: invitation.jobTitle,
      role: invitation.role,
      type: invitation.type,
      status: invitation.status,
      token: invitation.token,
      expiresAt: invitation.expiresAt,
      acceptedAt: invitation.acceptedAt,
      partnerUserId: invitation.partnerUserId,
      createdById: invitation.createdById,
      createdBy: {
        name: invitation.createdBy.name,
        email: invitation.createdBy.email,
      },
      createdAt: invitation.createdAt,
      updatedAt: invitation.updatedAt,
    })),
    candidates: partner.candidates?.map((candidate: any) => ({
      id: candidate.id,
      userId: candidate.userId,
      status: candidate.status,
      assessmentStage: candidate.assessmentStage,
      resumeAssessmentStatus: candidate.resumeAssessmentStatus,
      onboardingAssessmentStatus: candidate.onboardingAssessmentStatus,
      isPublished: candidate.isPublished,
      isDirty: candidate.isDirty,
      completionPercentage: candidate.completionPercentage,
      jobSearchStatus: candidate.jobSearchStatus,
      user: {
        name: candidate.user.name,
        email: candidate.user.email,
        image: candidate.user.image,
      },
      resume: candidate.resume
        ? {
            id: candidate.resume.id,
            summary: candidate.resume.summary,
            totalExperience: candidate.resume.totalExperience,
            highestEducationLevel: candidate.resume.highestEducationLevel,
          }
        : undefined,
      candidateSubscription: candidate.candidateSubscription
        ? {
            status: candidate.candidateSubscription.status,
            package: candidate.candidateSubscription.package
              ? {
                  name: candidate.candidateSubscription.package.name,
                }
              : undefined,
          }
        : undefined,
      createdAt: candidate.createdAt,
      updatedAt: candidate.updatedAt,
    })),
    partnerUsers: partner.partnerUsers?.map((user: any) => ({
      id: user.id,
      partnerId: user.partnerId,
      userId: user.userId,
      role: user.role,
      status: user.status,
      user: {
        id: user.user.id,
        name: user.user.name,
        email: user.user.email,
        image: user.user.image,
        jobTitle: user.user.jobTitle,
        status: user.user.status,
        type: user.user.type,
        role: user.user.role,
        profileSetup: user.user.profileSetup,
        emailVerified: user.user.emailVerified,
      },
      settings: user.settings
        ? {
            id: user.settings.id,
            partnerUserId: user.settings.partnerUserId,
            notificationsEnabled: user.settings.notificationsEnabled,
            emailNotifications: user.settings.emailNotifications,
            pushNotifications: user.settings.pushNotifications,
            darkMode: user.settings.darkMode,
            language: user.settings.language,
            timezone: user.settings.timezone,
            createdAt: user.settings.createdAt,
            updatedAt: user.settings.updatedAt,
          }
        : undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })),
    stats: {
      jobApplicationsCount: partner._count?.jobApplications || 0,
      invitationsCount: partner._count?.invitations || 0,
      documentsCount: partner._count?.documents || 0,
      candidatesCount: partner._count?.candidates || 0,
      usersCount: partner._count?.partnerUsers || 0,
    },
    activities: partner.activities?.map((activity: any) => ({
      id: activity.id,
      userId: activity.userId,
      user: {
        id: activity.user.id,
        name: activity.user.name,
        email: activity.user.email,
        image: activity.user.image,
      },
      module: activity.module,
      action: activity.action,
      entityId: activity.entityId,
      entityType: activity.entityType,
      description: activity.description,
      metadata: activity.metadata,
      timestamp: activity.timestamp,
      ipAddress: activity.ipAddress,
      userAgent: activity.userAgent,
      createdAt: activity.createdAt,
    })),
    updatedAt: partner.updatedAt,
  };
};

export interface ISupportPartnerListResponse {
  id: string;
  companyName: string;
  email: string | null;
  industry: string;
  size: string;
  createdAt: string;
  candidateCount: number;
  userCount: number;
  jobApplicationsCount: number;
  hasFinancialData: boolean;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportPartnerCreateDone:
 *       type: object
 *       description: Response after creating a partner
 *       properties:
 *         companyName:
 *           type: string
 *           description: The name of the company
 *         email:
 *           type: string
 *           description: The email of the partner
 *         title:
 *           type: string
 *           description: The title of the partner
 *         specialization:
 *           type: string
 *           description: The specialization of the partner
 *         message:
 *           type: string
 *           description: Success message with login credentials information
 */
export interface ISupportPartnerCreateDone {
  companyName: string;
  email: string;
  title: string;
  specialization: string;
  message?: string;
}
