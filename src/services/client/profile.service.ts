import { PrismaClient } from '@prisma/client';
import { AppError } from '@/utils/app.error';
import {
  IClientProfile,
  IClientProfileBasic,
  IClientProfileAddress,
  IClientProfileShippingAddress,
  IClientProfileBillingAddress,
  IClientProfileSocial,
  IClientProfileCulture,
  IClientProfileBasicUpdate,
  IClientProfileAddressUpdate,
  IClientProfileShippingAddressUpdate,
  IClientProfileBillingAddressUpdate,
  IClientProfileSocialUpdate,
  IClientProfileCultureUpdate,
  toClientProfileDomain,
  toClientProfileBasicDomain,
  toClientProfileAddressDomain,
  toClientProfileShippingAddressDomain,
  toClientProfileBillingAddressDomain,
  toClientProfileSocialDomain,
  toClientProfileCultureDomain,
  IClientDocument,
  IClientDocumentCreate,
  IClientDocumentUpdate,
  toClientDocumentDomain,
  IClientFinancialData,
  IClientFinancialDataUpdate,
  IClientBankAccount,
  IClientBankAccountCreate,
  IClientBankAccountUpdate,
  toClientFinancialDataDomain,
  toClientBankAccountDomain,
} from '@/shared/models/domain/client/profile.domain';
import { ErrorCode } from '@/utils/error.codes';
import { singleton } from '@/shared/decorators/singleton';
import { logger } from '@/shared/utils/logger';
import {
  IClientProfileSettings,
  IClientProfileSettingsUpdate,
  toClientSettingsDomain,
} from '@/shared/models/domain/client/profile.settings.domain';
import {
  IClientProfileAiAssessmentSettings,
  IClientProfileAiAssessmentSettingsUpdate,
  toClientProfileAiAssessmentSettingsDomain,
} from '@/shared/models/domain/client/profile.domain';
import { StorageFactory } from '@/services/helpers/storage/storage.factory';
import { IStorageProvider } from '@/services/helpers/storage/storage.interface';
import { getBucketFolderPathToClientPhoto } from '@/utils/presigned.urls';

@singleton
export class ClientProfileService {
  private readonly prisma: PrismaClient;
  private readonly storageService: IStorageProvider;

  constructor() {
    this.prisma = new PrismaClient();
    this.storageService = StorageFactory.getInstance().getProvider();
  }

  /**
   * Get full client profile
   */
  async getProfile(clientId: string): Promise<IClientProfile> {
    try {
      // Get client and related company
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
        include: {
          company: {
            include: {
              social: true,
              culture: true,
            },
          },
          financialData: {
            include: {
              bankAccounts: {
                orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
              },
            },
          },
          documents: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!client) {
        throw new AppError(
          'Client profile not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Convert to domain model
      const profile = toClientProfileDomain(client);

      // Generate presigned URL for profile photo if it exists
      if (client.company.logo && !client.company.logo.startsWith('http')) {
        const presignedUrl = await this.storageService.generatePreSignedUrl(
          client.company.logo,
          'read'
        );
        profile.basic.logoUrl = presignedUrl;
      }

      return profile;
    } catch (error) {
      logger.error('Error getting client profile', { error, clientId });
      throw error;
    }
  }

  /**
   * Get basic client profile
   */
  async getBasicProfile(clientId: string): Promise<IClientProfileBasic> {
    try {
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
        include: {
          company: true,
        },
      });

      if (!client) {
        throw new AppError(
          'Client profile not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      return toClientProfileBasicDomain(client.company);
    } catch (error) {
      logger.error('Error getting basic client profile', { error, clientId });
      throw error;
    }
  }

  /**
   * Update basic client profile
   */
  async updateBasicProfile(
    clientId: string,
    profileData: IClientProfileBasicUpdate
  ): Promise<IClientProfileBasic> {
    try {
      // First get the client to ensure it exists and get company ID
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
        include: {
          company: true,
        },
      });

      if (!client) {
        throw new AppError(
          'Client profile not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Update the company record
      const updatedCompany = await this.prisma.company.update({
        where: { id: client.companyId },
        data: {
          ...(profileData.name && { name: profileData.name }),
          ...(profileData.description && {
            description: profileData.description,
          }),
          ...(profileData.companyType && {
            companyType: profileData.companyType,
          }),
          ...(profileData.industry && { industry: profileData.industry }),
          ...(profileData.size && { size: profileData.size }),
          ...(profileData.stage && { stage: profileData.stage }),
          ...(profileData.foundedYear && {
            foundedYear: profileData.foundedYear,
          }),
          ...(profileData.website !== undefined && {
            website: profileData.website,
          }),
          ...(profileData.benefits && { benefits: profileData.benefits }),
          ...(profileData.contactEmail !== undefined && {
            contactEmail: profileData.contactEmail,
          }),
          ...(profileData.contactPhone !== undefined && {
            contactPhone: profileData.contactPhone,
          }),
          ...(profileData.contactName !== undefined && {
            contactName: profileData.contactName,
          }),
        },
      });

      return toClientProfileBasicDomain(updatedCompany);
    } catch (error) {
      logger.error('Error updating basic client profile', { error, clientId });
      throw error;
    }
  }

  /**
   * Get client address
   */
  async getAddress(clientId: string): Promise<IClientProfileAddress> {
    try {
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
        include: {
          company: true,
        },
      });

      if (!client) {
        throw new AppError(
          'Client profile not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      return toClientProfileAddressDomain(client.company);
    } catch (error) {
      logger.error('Error getting client address', { error, clientId });
      throw error;
    }
  }

  /**
   * Update client address
   */
  async updateAddress(
    clientId: string,
    addressData: IClientProfileAddressUpdate
  ): Promise<IClientProfileAddress> {
    try {
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
        include: {
          company: true,
        },
      });

      if (!client) {
        throw new AppError(
          'Client profile not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      const updatedCompany = await this.prisma.company.update({
        where: { id: client.companyId },
        data: {
          ...(addressData.address !== undefined && {
            address: addressData.address,
          }),
          ...(addressData.city !== undefined && { city: addressData.city }),
          ...(addressData.state !== undefined && { state: addressData.state }),
          ...(addressData.zipCode !== undefined && {
            zipCode: addressData.zipCode,
          }),
          ...(addressData.country !== undefined && {
            country: addressData.country,
          }),
        },
      });

      return toClientProfileAddressDomain(updatedCompany);
    } catch (error) {
      logger.error('Error updating client address', { error, clientId });
      throw error;
    }
  }

  /**
   * Get client shipping address
   */
  async getShippingAddress(
    clientId: string
  ): Promise<IClientProfileShippingAddress> {
    try {
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
        include: {
          company: true,
        },
      });

      if (!client) {
        throw new AppError(
          'Client profile not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      return toClientProfileShippingAddressDomain(client.company);
    } catch (error) {
      logger.error('Error getting client shipping address', {
        error,
        clientId,
      });
      throw error;
    }
  }

  /**
   * Update client shipping address
   */
  async updateShippingAddress(
    clientId: string,
    addressData: IClientProfileShippingAddressUpdate
  ): Promise<IClientProfileShippingAddress> {
    try {
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
        include: {
          company: true,
        },
      });

      if (!client) {
        throw new AppError(
          'Client profile not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      const updatedCompany = await this.prisma.company.update({
        where: { id: client.companyId },
        data: {
          ...(addressData.shippingAddress !== undefined && {
            shippingAddress: addressData.shippingAddress,
          }),
          ...(addressData.shippingCity !== undefined && {
            shippingCity: addressData.shippingCity,
          }),
          ...(addressData.shippingState !== undefined && {
            shippingState: addressData.shippingState,
          }),
          ...(addressData.shippingZipCode !== undefined && {
            shippingZipCode: addressData.shippingZipCode,
          }),
          ...(addressData.shippingCountry !== undefined && {
            shippingCountry: addressData.shippingCountry,
          }),
        },
      });

      return toClientProfileShippingAddressDomain(updatedCompany);
    } catch (error) {
      logger.error('Error updating client shipping address', {
        error,
        clientId,
      });
      throw error;
    }
  }

  /**
   * Get client billing address
   */
  async getBillingAddress(
    clientId: string
  ): Promise<IClientProfileBillingAddress> {
    try {
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
        include: {
          company: true,
        },
      });

      if (!client) {
        throw new AppError(
          'Client profile not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      return toClientProfileBillingAddressDomain(client.company);
    } catch (error) {
      logger.error('Error getting client billing address', { error, clientId });
      throw error;
    }
  }

  /**
   * Update client billing address
   */
  async updateBillingAddress(
    clientId: string,
    addressData: IClientProfileBillingAddressUpdate
  ): Promise<IClientProfileBillingAddress> {
    try {
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
        include: {
          company: true,
        },
      });

      if (!client) {
        throw new AppError(
          'Client profile not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      const updatedCompany = await this.prisma.company.update({
        where: { id: client.companyId },
        data: {
          ...(addressData.billingAddress !== undefined && {
            billingAddress: addressData.billingAddress,
          }),
          ...(addressData.billingCity !== undefined && {
            billingCity: addressData.billingCity,
          }),
          ...(addressData.billingState !== undefined && {
            billingState: addressData.billingState,
          }),
          ...(addressData.billingZipCode !== undefined && {
            billingZipCode: addressData.billingZipCode,
          }),
          ...(addressData.billingCountry !== undefined && {
            billingCountry: addressData.billingCountry,
          }),
        },
      });

      return toClientProfileBillingAddressDomain(updatedCompany);
    } catch (error) {
      logger.error('Error updating client billing address', {
        error,
        clientId,
      });
      throw error;
    }
  }

  /**
   * Get client social profile
   */
  async getSocialProfile(clientId: string): Promise<IClientProfileSocial> {
    try {
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
        include: {
          company: {
            include: {
              social: true,
            },
          },
        },
      });

      if (!client) {
        throw new AppError(
          'Client profile not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      return toClientProfileSocialDomain(client.company.social);
    } catch (error) {
      logger.error('Error getting client social profile', { error, clientId });
      throw error;
    }
  }

  /**
   * Update client social profile
   */
  async updateSocialProfile(
    clientId: string,
    socialData: IClientProfileSocialUpdate
  ): Promise<IClientProfileSocial> {
    try {
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
        include: {
          company: {
            include: {
              social: true,
            },
          },
        },
      });

      if (!client) {
        throw new AppError(
          'Client profile not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      const companyId = client.companyId;
      let companyWithSocial;

      if (client.company.social) {
        // Update existing social record
        companyWithSocial = await this.prisma.company.update({
          where: { id: companyId },
          data: {
            social: {
              update: {
                ...(socialData.linkedin !== undefined && {
                  linkedin: socialData.linkedin,
                }),
                ...(socialData.twitter !== undefined && {
                  twitter: socialData.twitter,
                }),
                ...(socialData.facebook !== undefined && {
                  facebook: socialData.facebook,
                }),
                ...(socialData.instagram !== undefined && {
                  instagram: socialData.instagram,
                }),
                ...(socialData.youtube !== undefined && {
                  youtube: socialData.youtube,
                }),
                ...(socialData.github !== undefined && {
                  github: socialData.github,
                }),
              },
            },
          },
          include: {
            social: true,
          },
        });
      } else {
        // Create new social record
        companyWithSocial = await this.prisma.company.update({
          where: { id: companyId },
          data: {
            social: {
              create: {
                linkedin: socialData.linkedin || null,
                twitter: socialData.twitter || null,
                facebook: socialData.facebook || null,
                instagram: socialData.instagram || null,
                youtube: socialData.youtube || null,
                github: socialData.github || null,
              },
            },
          },
          include: {
            social: true,
          },
        });
      }

      return toClientProfileSocialDomain(companyWithSocial.social);
    } catch (error) {
      logger.error('Error updating client social profile', { error, clientId });
      throw error;
    }
  }

  /**
   * Get client culture profile
   */
  async getCultureProfile(clientId: string): Promise<IClientProfileCulture> {
    try {
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
        include: {
          company: {
            include: {
              culture: true,
            },
          },
        },
      });

      if (!client) {
        throw new AppError(
          'Client profile not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      return toClientProfileCultureDomain(client.company.culture);
    } catch (error) {
      logger.error('Error getting client culture profile', {
        error,
        clientId,
      });
      throw error;
    }
  }

  /**
   * Update client culture profile
   */
  async updateCultureProfile(
    clientId: string,
    cultureData: IClientProfileCultureUpdate
  ): Promise<IClientProfileCulture> {
    try {
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
        include: {
          company: {
            include: {
              culture: true,
            },
          },
        },
      });

      if (!client) {
        throw new AppError(
          'Client profile not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      const companyId = client.companyId;
      let companyWithCulture;

      if (client.company.culture) {
        // Update existing culture record
        companyWithCulture = await this.prisma.company.update({
          where: { id: companyId },
          data: {
            culture: {
              update: {
                ...(cultureData.mission !== undefined && {
                  mission: cultureData.mission,
                }),
                ...(cultureData.vision !== undefined && {
                  vision: cultureData.vision,
                }),
                ...(cultureData.values && { values: cultureData.values }),
                ...(cultureData.perks && { perks: cultureData.perks }),
                ...(cultureData.workEnvironment && {
                  workEnvironment: cultureData.workEnvironment,
                }),
              },
            },
          },
          include: {
            culture: true,
          },
        });
      } else {
        // Create new culture record
        companyWithCulture = await this.prisma.company.update({
          where: { id: companyId },
          data: {
            culture: {
              create: {
                mission: cultureData.mission || null,
                vision: cultureData.vision || null,
                values: cultureData.values || [],
                perks: cultureData.perks || [],
                workEnvironment: cultureData.workEnvironment || [],
              },
            },
          },
          include: {
            culture: true,
          },
        });
      }

      return toClientProfileCultureDomain(companyWithCulture.culture);
    } catch (error) {
      logger.error('Error updating client culture profile', {
        error,
        clientId,
      });
      throw error;
    }
  }

  /**
   * Get default settings from global settings
   */
  async getDefaultSettings(clientId: string): Promise<IClientProfileSettings> {
    const globalSettings = await this.prisma.global_settings.findFirst({
      where: { isSingleton: true },
    });

    if (!globalSettings) {
      // Fallback to hardcoded defaults if no global settings exist
      return {
        clientId,
        notificationsEnabled: true,
        emailNotifications: true,
        pushNotifications: true,
        jobAlerts: true,
        candidateAlerts: true,
        applicationAlerts: true,
      };
    }

    // Use global settings as defaults
    return {
      clientId,
      notificationsEnabled: globalSettings.defaultNotificationsEnabled,
      emailNotifications: globalSettings.defaultEmailNotifications,
      pushNotifications: globalSettings.defaultPushNotifications,
      jobAlerts: globalSettings.defaultJobAlerts,
      candidateAlerts: globalSettings.defaultCandidateAlerts,
      applicationAlerts: globalSettings.defaultApplicationAlerts,
      globalSettingsId: globalSettings.id,
    };
  }

  /**
   * Get client settings
   */
  async getClientSettings(clientId: string): Promise<IClientProfileSettings> {
    try {
      // Find client settings
      const clientSettings = await this.prisma.client_settings.findUnique({
        where: { clientId },
      });

      if (!clientSettings) {
        // Get default settings and create new client settings
        const defaultSettings = await this.getDefaultSettings(clientId);
        const newSettings = await this.prisma.client_settings.create({
          data: defaultSettings,
        });
        return toClientSettingsDomain(newSettings);
      }

      // Convert to domain model
      return toClientSettingsDomain(clientSettings);
    } catch (error) {
      logger.error('Error getting client settings', { error, clientId });
      throw error;
    }
  }

  /**
   * Update client settings
   */
  async updateClientSettings(
    clientId: string,
    settingsData: IClientProfileSettingsUpdate
  ): Promise<IClientProfileSettings> {
    try {
      // Find client settings
      const existingSettings = await this.prisma.client_settings.findUnique({
        where: { clientId },
      });

      if (!existingSettings) {
        // Get default settings and create new client settings
        const defaultSettings = await this.getDefaultSettings(clientId);
        const newSettings = await this.prisma.client_settings.create({
          data: {
            ...defaultSettings,
            ...settingsData,
          },
        });
        return toClientSettingsDomain(newSettings);
      }

      const { clientId: _, ...safeUpdateData } =
        settingsData as IClientProfileSettingsUpdate;

      // Update existing settings
      const updatedSettings = await this.prisma.client_settings.update({
        where: { id: existingSettings.id },
        data: safeUpdateData,
      });

      // Convert to domain model
      return toClientSettingsDomain(updatedSettings);
    } catch (error) {
      logger.error('Error updating client settings', { error, clientId });
      throw error;
    }
  }

  /**
   * Get default AI assessment settings from global settings
   */
  async getDefaultAiAssessmentSettings(
    clientId: string
  ): Promise<IClientProfileAiAssessmentSettings> {
    const globalSettings =
      await this.prisma.global_job_ai_assessment_settings.findFirst({
        where: { isSingleton: true },
      });

    if (!globalSettings) {
      throw new AppError(
        'No global AI assessment settings found',
        404,
        ErrorCode.NOT_FOUND
      );
    }

    // Create new client settings using global defaults
    return {
      clientId,
      globalSettingsId: globalSettings.id,
      greetingMessage: globalSettings.greetingMessage || undefined,
      defaultAssessmentDuration: globalSettings.defaultAssessmentDuration,
      defaultPassingScore: globalSettings.defaultPassingScore,
      requiredSections: globalSettings.requiredSections,
      maximumAttempts: globalSettings.maximumAttempts,
      cooldownPeriod: globalSettings.cooldownPeriod,
      maxSections: globalSettings.maxSections,
      maxQuestionsPerSection: globalSettings.maxQuestionsPerSection,
      proctoringEnabled: globalSettings.proctoringEnabled,
      maxWarnings: globalSettings.maxWarnings,
      tabSwitchLimit: globalSettings.tabSwitchLimit,
      copyPasteAllowed: globalSettings.copyPasteAllowed,
      videoRecordingEnabled: globalSettings.videoRecordingEnabled,
      minimumVideoLength: globalSettings.minimumVideoLength,
      aiVideoAnalysisEnabled: globalSettings.aiVideoAnalysisEnabled,
      autoPublishOnSuccess: globalSettings.autoPublishOnSuccess,
      autoNotifyOnComplete: globalSettings.autoNotifyOnComplete,
      sectionTemplates:
        (globalSettings.sectionTemplates as Record<string, string>) || {},
      questionTemplates:
        (globalSettings.questionTemplates as Record<string, string>) || {},
      customStyles:
        (globalSettings.customStyles as Record<string, string>) || {},
      customInstructions: globalSettings.customInstructions || '',
      customPrompts:
        (globalSettings.customPrompts as Record<string, string>) || {},
      skillWeightings:
        (globalSettings.skillWeightings as Record<string, number>) || {},
      createdAt: globalSettings.createdAt,
      updatedAt: globalSettings.updatedAt,
    };
  }

  /**
   * Get client AI assessment settings
   */
  async getClientAiAssessmentSettings(
    clientId: string
  ): Promise<IClientProfileAiAssessmentSettings> {
    try {
      // Find client AI assessment settings
      const settings =
        await this.prisma.client_ai_assessment_settings.findUnique({
          where: { clientId },
        });

      if (!settings) {
        // Get default settings and create new client settings
        // Get default settings
        const defaultSettings =
          await this.getDefaultAiAssessmentSettings(clientId);
        // Create new client settings using the defaults
        const newSettings =
          await this.prisma.client_ai_assessment_settings.create({
            data: {
              ...defaultSettings,
            },
          });
        return toClientProfileAiAssessmentSettingsDomain(newSettings);
      }

      // Convert to domain model
      return toClientProfileAiAssessmentSettingsDomain(settings);
    } catch (error) {
      logger.error('Error getting client AI assessment settings', {
        error,
        clientId,
      });
      throw error;
    }
  }

  async getJobPostingAiAssessmentSettings(
    jobPostingId: string
  ): Promise<IClientProfileAiAssessmentSettings> {
    const jobPosting = await this.prisma.job_posting.findUnique({
      where: { id: jobPostingId },
    });

    if (!jobPosting) {
      throw new AppError('Job posting not found', 404, ErrorCode.NOT_FOUND);
    }

    const settings =
      await this.prisma.job_posting_ai_assessment_settings.findUnique({
        where: { jobPostingId },
      });

    if (!settings) {
      throw new AppError(
        'Job posting AI assessment settings not found',
        404,
        ErrorCode.NOT_FOUND
      );
    }

    return toClientProfileAiAssessmentSettingsDomain(settings);
  }

  /**
   * Update client AI assessment settings
   */
  async updateClientAiAssessmentSettings(
    clientId: string,
    settingsData: IClientProfileAiAssessmentSettingsUpdate
  ): Promise<IClientProfileAiAssessmentSettings> {
    try {
      // Find existing settings
      const existingSettings =
        await this.prisma.client_ai_assessment_settings.findUnique({
          where: { clientId },
        });

      if (!existingSettings) {
        // Get default settings and create new client settings
        // Get default settings
        const defaultSettings =
          await this.getDefaultAiAssessmentSettings(clientId);
        // Create new client settings using the defaults
        const newSettings =
          await this.prisma.client_ai_assessment_settings.create({
            data: {
              ...defaultSettings,
              ...settingsData,
            },
          });
        return toClientProfileAiAssessmentSettingsDomain(newSettings);
      }

      // Update existing settings
      const updatedSettings =
        await this.prisma.client_ai_assessment_settings.update({
          where: { id: existingSettings.id },
          data: settingsData,
        });

      // Convert to domain model
      return toClientProfileAiAssessmentSettingsDomain(updatedSettings);
    } catch (error) {
      logger.error('Error updating client AI assessment settings', {
        error,
        clientId,
      });
      throw error;
    }
  }

  /**
   * Get client documents
   */
  async getDocuments(clientId: string): Promise<IClientDocument[]> {
    try {
      const documents = await this.prisma.client_document.findMany({
        where: { clientId },
        orderBy: { createdAt: 'desc' },
      });

      return documents.map(toClientDocumentDomain);
    } catch (error) {
      logger.error('Error getting client documents', { error, clientId });
      throw error;
    }
  }

  /**
   * Create client document
   */
  async createDocument(
    clientId: string,
    documentData: IClientDocumentCreate
  ): Promise<IClientDocument> {
    try {
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        throw new AppError('Client not found', 404, ErrorCode.NOT_FOUND);
      }

      const newDocument = await this.prisma.client_document.create({
        data: {
          clientId,
          name: documentData.name,
          type: documentData.type,
          size: documentData.size,
          url: documentData.url,
          uploadedBy: documentData.uploadedBy,
        },
      });

      return toClientDocumentDomain(newDocument);
    } catch (error) {
      logger.error('Error creating client document', { error, clientId });
      throw error;
    }
  }

  /**
   * Update client document
   */
  async updateDocument(
    clientId: string,
    documentId: string,
    documentData: IClientDocumentUpdate
  ): Promise<IClientDocument> {
    try {
      const existingDocument = await this.prisma.client_document.findFirst({
        where: {
          id: documentId,
          clientId: clientId,
        },
      });

      if (!existingDocument) {
        throw new AppError('Document not found', 404, ErrorCode.NOT_FOUND);
      }

      const updatedDocument = await this.prisma.client_document.update({
        where: { id: documentId },
        data: {
          ...(documentData.name && { name: documentData.name }),
          ...(documentData.type && { type: documentData.type }),
        },
      });

      return toClientDocumentDomain(updatedDocument);
    } catch (error) {
      logger.error('Error updating client document', {
        error,
        clientId,
        documentId,
      });
      throw error;
    }
  }

  /**
   * Delete client document
   */
  async deleteDocument(
    clientId: string,
    documentId: string
  ): Promise<{ success: boolean }> {
    try {
      const existingDocument = await this.prisma.client_document.findFirst({
        where: {
          id: documentId,
          clientId: clientId,
        },
      });

      if (!existingDocument) {
        throw new AppError('Document not found', 404, ErrorCode.NOT_FOUND);
      }

      await this.prisma.client_document.delete({
        where: { id: documentId },
      });

      return { success: true };
    } catch (error) {
      logger.error('Error deleting client document', {
        error,
        clientId,
        documentId,
      });
      throw error;
    }
  }

  /**
   * Get client document by ID
   */
  async getDocumentById(
    clientId: string,
    documentId: string
  ): Promise<IClientDocument> {
    try {
      const document = await this.prisma.client_document.findFirst({
        where: {
          id: documentId,
          clientId: clientId,
        },
      });

      if (!document) {
        throw new AppError('Document not found', 404, ErrorCode.NOT_FOUND);
      }

      return toClientDocumentDomain(document);
    } catch (error) {
      logger.error('Error getting client document', {
        error,
        clientId,
        documentId,
      });
      throw error;
    }
  }

  /**
   * Get client financial data
   */
  async getFinancialData(clientId: string): Promise<IClientFinancialData> {
    try {
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
        include: {
          financialData: {
            include: {
              bankAccounts: {
                orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
              },
            },
          },
        },
      });

      if (!client) {
        throw new AppError('Client not found', 404, ErrorCode.NOT_FOUND);
      }

      if (!client.financialData) {
        throw new AppError(
          'Financial data not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      return toClientFinancialDataDomain(client.financialData);
    } catch (error) {
      logger.error('Error getting client financial data', {
        error,
        clientId,
      });
      throw error;
    }
  }

  /**
   * Create client financial data
   */
  async createFinancialData(
    clientId: string,
    financialData: IClientFinancialDataUpdate
  ): Promise<IClientFinancialData> {
    try {
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        throw new AppError('Client not found', 404, ErrorCode.NOT_FOUND);
      }

      const existingFinancialData =
        await this.prisma.client_financial_data.findUnique({
          where: { clientId },
        });

      if (existingFinancialData) {
        throw new AppError(
          'Financial data already exists',
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      const newFinancialData = await this.prisma.client_financial_data.create({
        data: {
          clientId,
          annualRevenue: financialData.annualRevenue || 0,
          taxId: financialData.taxId || '',
          vatNumber: financialData.vatNumber,
          gstNumber: financialData.gstNumber,
          bankAccounts: {
            create:
              financialData.bankAccounts?.map((account, index) => ({
                accountName: account.accountName,
                accountNumber: account.accountNumber,
                bankName: account.bankName,
                swiftCode: account.swiftCode,
                isDefault: account.isDefault || index === 0,
              })) || [],
          },
        },
        include: {
          bankAccounts: {
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
          },
        },
      });

      return toClientFinancialDataDomain(newFinancialData);
    } catch (error) {
      logger.error('Error creating client financial data', {
        error,
        clientId,
      });
      throw error;
    }
  }

  /**
   * Update client financial data
   */
  async updateFinancialData(
    clientId: string,
    financialData: IClientFinancialDataUpdate
  ): Promise<IClientFinancialData> {
    try {
      const existingFinancialData =
        await this.prisma.client_financial_data.findUnique({
          where: { clientId },
        });

      if (!existingFinancialData) {
        return this.createFinancialData(clientId, financialData);
      }

      const updatedFinancialData =
        await this.prisma.client_financial_data.update({
          where: { clientId },
          data: {
            ...(financialData.annualRevenue !== undefined && {
              annualRevenue: financialData.annualRevenue,
            }),
            ...(financialData.taxId && {
              taxId: financialData.taxId,
            }),
            ...(financialData.vatNumber !== undefined && {
              vatNumber: financialData.vatNumber,
            }),
            ...(financialData.gstNumber !== undefined && {
              gstNumber: financialData.gstNumber,
            }),
          },
          include: {
            bankAccounts: {
              orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
            },
          },
        });

      return toClientFinancialDataDomain(updatedFinancialData);
    } catch (error) {
      logger.error('Error updating client financial data', {
        error,
        clientId,
      });
      throw error;
    }
  }

  /**
   * Get all bank accounts for a client
   */
  async getBankAccounts(clientId: string): Promise<IClientBankAccount[]> {
    try {
      const financialData = await this.prisma.client_financial_data.findUnique({
        where: { clientId },
        include: {
          bankAccounts: {
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
          },
        },
      });

      if (!financialData) {
        throw new AppError(
          'Financial data not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      return financialData.bankAccounts.map(toClientBankAccountDomain);
    } catch (error) {
      logger.error('Error getting bank accounts', { error, clientId });
      throw error;
    }
  }

  /**
   * Get a specific bank account by ID
   */
  async getBankAccountById(
    clientId: string,
    accountId: string
  ): Promise<IClientBankAccount> {
    try {
      const financialData = await this.prisma.client_financial_data.findUnique({
        where: { clientId },
        include: {
          bankAccounts: {
            where: { id: accountId },
          },
        },
      });

      if (!financialData || financialData.bankAccounts.length === 0) {
        throw new AppError('Bank account not found', 404, ErrorCode.NOT_FOUND);
      }

      return toClientBankAccountDomain(financialData.bankAccounts[0]);
    } catch (error) {
      logger.error('Error getting bank account', {
        error,
        clientId,
        accountId,
      });
      throw error;
    }
  }

  /**
   * Add bank account
   */
  async addBankAccount(
    clientId: string,
    accountData: IClientBankAccountCreate
  ): Promise<IClientBankAccount> {
    try {
      const financialData = await this.prisma.client_financial_data.findUnique({
        where: { clientId },
        include: { bankAccounts: true },
      });

      if (!financialData) {
        throw new AppError(
          'Financial data not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      if (accountData.isDefault) {
        await this.prisma.client_bank_account.updateMany({
          where: { financialDataId: financialData.id },
          data: { isDefault: false },
        });
      }

      const newAccount = await this.prisma.client_bank_account.create({
        data: {
          financialDataId: financialData.id,
          accountName: accountData.accountName,
          accountNumber: accountData.accountNumber,
          bankName: accountData.bankName,
          swiftCode: accountData.swiftCode,
          isDefault:
            accountData.isDefault || financialData.bankAccounts.length === 0,
        },
      });

      return toClientBankAccountDomain(newAccount);
    } catch (error) {
      logger.error('Error adding bank account', { error, clientId });
      throw error;
    }
  }

  /**
   * Update bank account
   */
  async updateBankAccount(
    clientId: string,
    accountId: string,
    accountData: IClientBankAccountUpdate
  ): Promise<IClientBankAccount> {
    try {
      const financialData = await this.prisma.client_financial_data.findUnique({
        where: { clientId },
        include: {
          bankAccounts: {
            where: { id: accountId },
          },
        },
      });

      if (!financialData || financialData.bankAccounts.length === 0) {
        throw new AppError('Bank account not found', 404, ErrorCode.NOT_FOUND);
      }

      if (accountData.isDefault) {
        await this.prisma.client_bank_account.updateMany({
          where: {
            financialDataId: financialData.id,
            id: { not: accountId },
          },
          data: { isDefault: false },
        });
      }

      const updatedAccount = await this.prisma.client_bank_account.update({
        where: { id: accountId },
        data: {
          ...(accountData.accountName && {
            accountName: accountData.accountName,
          }),
          ...(accountData.accountNumber && {
            accountNumber: accountData.accountNumber,
          }),
          ...(accountData.bankName && {
            bankName: accountData.bankName,
          }),
          ...(accountData.swiftCode && {
            swiftCode: accountData.swiftCode,
          }),
          ...(accountData.isDefault !== undefined && {
            isDefault: accountData.isDefault,
          }),
        },
      });

      return toClientBankAccountDomain(updatedAccount);
    } catch (error) {
      logger.error('Error updating bank account', {
        error,
        clientId,
        accountId,
      });
      throw error;
    }
  }

  /**
   * Delete bank account
   */
  async deleteBankAccount(
    clientId: string,
    accountId: string
  ): Promise<{ success: boolean }> {
    try {
      const financialData = await this.prisma.client_financial_data.findUnique({
        where: { clientId },
        include: {
          bankAccounts: {
            where: { id: accountId },
          },
        },
      });

      if (!financialData || financialData.bankAccounts.length === 0) {
        throw new AppError('Bank account not found', 404, ErrorCode.NOT_FOUND);
      }

      await this.prisma.client_bank_account.delete({
        where: { id: accountId },
      });

      const remainingAccounts = await this.prisma.client_bank_account.findMany({
        where: { financialDataId: financialData.id },
      });

      if (
        remainingAccounts.length > 0 &&
        !remainingAccounts.some((acc: IClientBankAccount) => acc.isDefault)
      ) {
        await this.prisma.client_bank_account.update({
          where: { id: remainingAccounts[0].id },
          data: { isDefault: true },
        });
      }

      return { success: true };
    } catch (error) {
      logger.error('Error deleting bank account', {
        error,
        clientId,
        accountId,
      });
      throw error;
    }
  }

  /**
   * Update profile photo with direct file upload
   */
  async updateProfilePhoto(
    clientId: string,
    file: Buffer
  ): Promise<{ fileName: string; logoUrl: string }> {
    try {
      // Find the client by ID
      const client = await this.prisma.client.findUnique({
        where: {
          id: clientId,
        },
        include: {
          company: true,
        },
      });

      if (!client) {
        throw new AppError('Client not found', 404, ErrorCode.NOT_FOUND);
      }

      // Generate a unique filename for the upload
      const uniqueFileName = `${clientId}-${Date.now()}.jpg`;
      const { folderPath } = getBucketFolderPathToClientPhoto(clientId);
      const filePath = `${folderPath}/${uniqueFileName}`;

      // Upload file directly to storage
      const uploadedUrl = await this.storageService.uploadFile(file, filePath);

      // Update the company's logo field
      await this.prisma.company.update({
        where: { id: client.companyId },
        data: { logo: uploadedUrl },
      });

      // Generate a read URL for the uploaded logo
      const logoUrl = await this.storageService.generatePreSignedUrl(
        uploadedUrl,
        'read'
      );

      return {
        fileName: uniqueFileName,
        logoUrl,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to update profile photo',
        context: 'ClientProfileService.updateProfilePhoto',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
      });
      throw error;
    }
  }

  /**
   * Soft delete (remove) the company logo
   */
  async deleteProfileLogo(clientId: string): Promise<{ success: boolean }> {
    try {
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
        include: { company: true },
      });
      if (!client) {
        throw new AppError('Client not found', 404, ErrorCode.NOT_FOUND);
      }
      await this.prisma.company.update({
        where: { id: client.companyId },
        data: { logo: null },
      });
      return { success: true };
    } catch (error) {
      logger.error({
        message: 'Failed to delete company logo',
        context: 'ClientProfileService.deleteProfileLogo',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
      });
      throw error;
    }
  }
}
