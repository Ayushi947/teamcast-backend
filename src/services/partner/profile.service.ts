import { singleton } from '@/shared/decorators/singleton';
import { ErrorCode } from '@/utils/error.codes';
import { AppError } from '@/utils/app.error';
import {
  PrismaClient,
  company_type,
  company_industry,
  company_size,
  company_stage,
} from '@prisma/client';
import { logger } from '@/shared/utils/logger';
import { StorageFactory } from '@/services/helpers/storage/storage.factory';
import { getBucketFolderPathToPartnerPhoto } from '@/utils/presigned.urls';
import { IStorageProvider } from '@/services/helpers/storage/storage.interface';
import {
  IPartnerProfile,
  IPartnerProfileAddress,
  IPartnerProfileAddressUpdate,
  IPartnerProfileBasic,
  IPartnerProfileBasicUpdate,
  IPartnerProfileBillingAddress,
  IPartnerProfileBillingAddressUpdate,
  IPartnerProfileCulture,
  IPartnerProfileCultureUpdate,
  IPartnerProfileShippingAddress,
  IPartnerProfileShippingAddressUpdate,
  IPartnerProfileSocial,
  IPartnerProfileSocialUpdate,
  toPartnerProfileAddressDomain,
  toPartnerProfileBasicDomain,
  toPartnerProfileBillingAddressDomain,
  toPartnerProfileCultureDomain,
  toPartnerProfileDomain,
  toPartnerProfileShippingAddressDomain,
  toPartnerProfileSocialDomain,
  IPartnerProfileAiAssessmentSettingsUpdate,
  IPartnerProfileAiAssessmentSettings,
  toPartnerProfileAiAssessmentSettingsDomain,
  IPartnerFinancialData,
  IPartnerFinancialDataUpdate,
  IPartnerDocument,
  IPartnerDocumentCreate,
  IPartnerDocumentUpdate,
  IPartnerBankAccount,
  IPartnerBankAccountCreate,
  IPartnerBankAccountUpdate,
  toPartnerFinancialDataDomain,
  toPartnerDocumentDomain,
  toPartnerBankAccountDomain,
} from '@/shared/models/domain/partner/profile.domain';
import {
  toPartnerSettingsDomain,
  IPartnerProfileSettings,
} from '@/shared/models/domain/partner/profile.settings.domain';

@singleton
export class PartnerProfileService {
  private readonly prisma: PrismaClient;
  private readonly storageService: IStorageProvider;

  constructor() {
    this.prisma = new PrismaClient();
    this.storageService = StorageFactory.getInstance().getProvider();
  }

  /**
   * Get full partner profile
   */
  async getProfile(partnerId: string): Promise<IPartnerProfile> {
    try {
      const partner = await this.prisma.partner.findUnique({
        where: { id: partnerId },
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

      if (!partner) {
        throw new AppError('Partner not found', 404, ErrorCode.NOT_FOUND);
      }

      // Convert to domain model
      const profile = toPartnerProfileDomain(partner);

      // Generate presigned URL for profile photo if it exists
      if (partner.company.logo && !partner.company.logo.startsWith('http')) {
        const presignedUrl = await this.storageService.generatePreSignedUrl(
          partner.company.logo,
          'read'
        );
        profile.basic.logoUrl = presignedUrl;
      }

      return profile;
    } catch (error) {
      logger.error('Error getting partner profile', { error, partnerId });
      throw error;
    }
  }

  /**
   * Get basic partner profile
   */
  async getBasicProfile(partnerId: string): Promise<IPartnerProfileBasic> {
    try {
      const partner = await this.prisma.partner.findUnique({
        where: { id: partnerId },
        include: {
          company: true,
        },
      });

      if (!partner) {
        throw new AppError('Partner not found', 404, ErrorCode.NOT_FOUND);
      }

      return toPartnerProfileBasicDomain(partner);
    } catch (error) {
      logger.error('Error getting partner profile', { error, partnerId });
      throw error;
    }
  }

  /**
   * Update basic partner profile
   */
  async updateBasicProfile(
    partnerId: string,
    profileData: IPartnerProfileBasicUpdate
  ): Promise<IPartnerProfileBasic> {
    try {
      const partner = await this.prisma.partner.findUnique({
        where: { id: partnerId },
        include: {
          company: true,
        },
      });

      if (!partner) {
        throw new AppError('Partner not found', 404, ErrorCode.NOT_FOUND);
      }

      // Update the company record
      const updatedCompany = await this.prisma.company.update({
        where: { id: partner.companyId },
        data: {
          ...(profileData.name && { name: profileData.name }),
          ...(profileData.description && {
            description: profileData.description,
          }),
          ...(profileData.companyType && {
            companyType: profileData.companyType as company_type,
          }),
          ...(profileData.industry && {
            industry: profileData.industry as company_industry,
          }),
          ...(profileData.size && {
            size: profileData.size as company_size,
          }),
          ...(profileData.stage && {
            stage: profileData.stage as company_stage,
          }),
          ...(profileData.foundedYear && {
            foundedYear: profileData.foundedYear,
          }),
          ...(profileData.website && {
            website: profileData.website,
          }),
          ...(profileData.benefits && {
            benefits: profileData.benefits,
          }),
          ...(profileData.contactEmail && {
            contactEmail: profileData.contactEmail,
          }),
          ...(profileData.contactPhone && {
            contactPhone: profileData.contactPhone,
          }),
          ...(profileData.contactName && {
            contactName: profileData.contactName,
          }),
        },
      });

      return toPartnerProfileBasicDomain(updatedCompany);
    } catch (error) {
      logger.error('Error updating basic partner profile', {
        error,
        partnerId,
      });
      throw error;
    }
  }

  /**
   * Get address
   */
  async getAddress(partnerId: string): Promise<IPartnerProfileAddress> {
    try {
      const partner = await this.prisma.partner.findUnique({
        where: { id: partnerId },
        include: {
          company: true,
        },
      });

      if (!partner) {
        throw new AppError('Partner not found', 404, ErrorCode.NOT_FOUND);
      }

      return toPartnerProfileAddressDomain(partner);
    } catch (error) {
      logger.error('Error getting partner address', { error, partnerId });
      throw error;
    }
  }

  /**
   * Update Partner address
   */
  async updateAddress(
    partnerId: string,
    addressData: IPartnerProfileAddressUpdate
  ): Promise<IPartnerProfileAddress> {
    try {
      const partner = await this.prisma.partner.findUnique({
        where: { id: partnerId },
        include: {
          company: true,
        },
      });

      if (!partner) {
        throw new AppError('Partner not found', 404, ErrorCode.NOT_FOUND);
      }

      const updatedCompany = await this.prisma.company.update({
        where: { id: partner.companyId },
        data: {
          ...(addressData.address && { address: addressData.address }),
          ...(addressData.city && { city: addressData.city }),
          ...(addressData.state && { state: addressData.state }),
          ...(addressData.zipCode && { zipCode: addressData.zipCode }),
          ...(addressData.country && { country: addressData.country }),
        },
      });

      return toPartnerProfileAddressDomain(updatedCompany);
    } catch (error) {
      logger.error('Error updating partner address', { error, partnerId });
      throw error;
    }
  }

  /**
   * Get shipping address
   */
  async getShippingAddress(
    partnerId: string
  ): Promise<IPartnerProfileShippingAddress> {
    try {
      const partner = await this.prisma.partner.findUnique({
        where: { id: partnerId },
        include: {
          company: true,
        },
      });

      if (!partner) {
        throw new AppError('Partner not found', 404, ErrorCode.NOT_FOUND);
      }

      return toPartnerProfileShippingAddressDomain(partner.company);
    } catch (error) {
      logger.error('Error getting partner shipping address', {
        error,
        partnerId,
      });
      throw error;
    }
  }

  /**
   * Update shipping address
   */
  async updateShippingAddress(
    partnerId: string,
    addressData: IPartnerProfileShippingAddressUpdate
  ): Promise<IPartnerProfileShippingAddress> {
    try {
      const partner = await this.prisma.partner.findUnique({
        where: { id: partnerId },
        include: {
          company: true,
        },
      });

      if (!partner) {
        throw new AppError('Partner not found', 404, ErrorCode.NOT_FOUND);
      }

      const updatedCompany = await this.prisma.company.update({
        where: { id: partner.companyId },
        data: {
          ...(addressData.shippingAddress && {
            shippingAddress: addressData.shippingAddress,
          }),
          ...(addressData.shippingCity && {
            shippingCity: addressData.shippingCity,
          }),
          ...(addressData.shippingState && {
            shippingState: addressData.shippingState,
          }),
          ...(addressData.shippingZipCode && {
            shippingZipCode: addressData.shippingZipCode,
          }),
          ...(addressData.shippingCountry && {
            shippingCountry: addressData.shippingCountry,
          }),
        },
      });

      return toPartnerProfileShippingAddressDomain(updatedCompany);
    } catch (error) {
      logger.error('Error updating partner shipping address', {
        error,
        partnerId,
      });
      throw error;
    }
  }

  /**
   * Get billing address
   */
  async getBillingAddress(
    partnerId: string
  ): Promise<IPartnerProfileBillingAddress> {
    try {
      const partner = await this.prisma.partner.findUnique({
        where: { id: partnerId },
        include: {
          company: true,
        },
      });

      if (!partner) {
        throw new AppError('Partner not found', 404, ErrorCode.NOT_FOUND);
      }

      return toPartnerProfileBillingAddressDomain(partner.company);
    } catch (error) {
      logger.error('Error getting partner billing address', {
        error,
        partnerId,
      });
      throw error;
    }
  }

  /**
   * Update billing address
   */
  async updateBillingAddress(
    partnerId: string,
    addressData: IPartnerProfileBillingAddressUpdate
  ): Promise<IPartnerProfileBillingAddress> {
    try {
      const partner = await this.prisma.partner.findUnique({
        where: { id: partnerId },
        include: {
          company: true,
        },
      });

      if (!partner) {
        throw new AppError('Partner not found', 404, ErrorCode.NOT_FOUND);
      }

      const updatedCompany = await this.prisma.company.update({
        where: { id: partner.companyId },
        data: {
          ...(addressData.billingAddress && {
            billingAddress: addressData.billingAddress,
          }),
          ...(addressData.billingCity && {
            billingCity: addressData.billingCity,
          }),
          ...(addressData.billingState && {
            billingState: addressData.billingState,
          }),
          ...(addressData.billingZipCode && {
            billingZipCode: addressData.billingZipCode,
          }),
          ...(addressData.billingCountry && {
            billingCountry: addressData.billingCountry,
          }),
        },
      });

      return toPartnerProfileBillingAddressDomain(updatedCompany);
    } catch (error) {
      logger.error('Error updating partner billing address', {
        error,
        partnerId,
      });
      throw error;
    }
  }

  /**
   * Get social profile
   */
  async getSocialProfile(partnerId: string): Promise<IPartnerProfileSocial> {
    try {
      const partner = await this.prisma.partner.findUnique({
        where: { id: partnerId },
        include: {
          company: {
            include: {
              social: true,
            },
          },
        },
      });

      if (!partner) {
        throw new AppError('Partner not found', 404, ErrorCode.NOT_FOUND);
      }

      return toPartnerProfileSocialDomain(partner.company);
    } catch (error) {
      logger.error('Error getting partner social profile', {
        error,
        partnerId,
      });
      throw error;
    }
  }

  /**
   * Update social profile
   */
  async updateSocialProfile(
    partnerId: string,
    socialData: IPartnerProfileSocialUpdate
  ): Promise<IPartnerProfileSocial> {
    try {
      const partner = await this.prisma.partner.findUnique({
        where: { id: partnerId },
        include: {
          company: {
            include: {
              social: true,
            },
          },
        },
      });

      if (!partner) {
        throw new AppError('Partner not found', 404, ErrorCode.NOT_FOUND);
      }

      const companyId = partner.companyId;
      let companyWithSocial;

      if (partner.company.social) {
        companyWithSocial = await this.prisma.company.update({
          where: { id: companyId },
          data: {
            social: {
              update: socialData,
            },
          },
          include: {
            social: true,
          },
        });
      } else {
        companyWithSocial = await this.prisma.company.update({
          where: { id: companyId },
          data: {
            social: {
              create: socialData,
            },
          },
          include: {
            social: true,
          },
        });
      }

      return toPartnerProfileSocialDomain(companyWithSocial);
    } catch (error) {
      logger.error('Error updating partner social profile', {
        error,
        partnerId,
      });
      throw error;
    }
  }

  /**
   * Get culture profile
   */
  async getCultureProfile(partnerId: string): Promise<IPartnerProfileCulture> {
    try {
      const partner = await this.prisma.partner.findUnique({
        where: { id: partnerId },
        include: {
          company: {
            include: {
              culture: true,
            },
          },
        },
      });

      if (!partner) {
        throw new AppError('Partner not found', 404, ErrorCode.NOT_FOUND);
      }

      return toPartnerProfileCultureDomain(partner.company);
    } catch (error) {
      logger.error('Error getting partner culture profile', {
        error,
        partnerId,
      });
      throw error;
    }
  }

  /**
   * Update culture profile
   */
  async updateCultureProfile(
    partnerId: string,
    cultureData: IPartnerProfileCultureUpdate
  ): Promise<IPartnerProfileCulture> {
    try {
      const partner = await this.prisma.partner.findUnique({
        where: { id: partnerId },
        include: {
          company: {
            include: {
              culture: true,
            },
          },
        },
      });

      if (!partner) {
        throw new AppError('Partner not found', 404, ErrorCode.NOT_FOUND);
      }

      const companyId = partner.companyId;
      let companyWithCulture;

      if (partner.company.culture) {
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

      return toPartnerProfileCultureDomain(companyWithCulture.culture);
    } catch (error) {
      logger.error('Error updating partner culture profile', {
        error,
        partnerId,
      });
      throw error;
    }
  }

  /**
   * Get default settings from global settings
   */
  async getDefaultSettings(
    partnerId: string
  ): Promise<IPartnerProfileSettings> {
    const globalSettings = await this.prisma.global_settings.findFirst({
      where: { isSingleton: true },
    });

    if (!globalSettings) {
      // Fallback to hardcoded defaults if no global settings exist
      return {
        partnerId,
        notificationsEnabled: true,
        emailNotifications: true,
        pushNotifications: true,
        jobAlerts: true,
        candidateAlerts: true,
        applicationAlerts: true,
      };
    }

    return toPartnerSettingsDomain(globalSettings);
  }

  async getPartnerSettings(
    partnerId: string
  ): Promise<IPartnerProfileSettings> {
    try {
      const patrtnerSettings = await this.prisma.partner_settings.findFirst({
        where: { partnerId },
      });

      if (!patrtnerSettings) {
        const defaultSettings = await this.getDefaultSettings(partnerId);
        const newSettings = await this.prisma.partner_settings.create({
          data: defaultSettings,
        });
        return toPartnerSettingsDomain(newSettings);
      }

      return toPartnerSettingsDomain(patrtnerSettings);
    } catch (error) {
      logger.error('Error getting partner settings', { error, partnerId });
      throw error;
    }
  }

  /**
   * Get partner AI assessment settings
   */
  async getPartnerAiAssessmentSettings(
    partnerId: string
  ): Promise<IPartnerProfileAiAssessmentSettings> {
    try {
      const settings = await this.prisma.partner_settings.findUnique({
        where: { partnerId },
      });

      if (!settings) {
        throw new AppError(
          'Partner settings not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      return toPartnerProfileAiAssessmentSettingsDomain(settings);
    } catch (error) {
      logger.error('Error getting partner AI assessment settings', {
        error,
        partnerId,
      });
      throw error;
    }
  }

  /**
   * Update partner AI assessment settings
   */
  async updatePartnerAiAssessmentSettings(
    partnerId: string,
    settingsData: IPartnerProfileAiAssessmentSettingsUpdate
  ): Promise<IPartnerProfileAiAssessmentSettings> {
    try {
      const settings = await this.prisma.partner_settings.update({
        where: { partnerId },
        data: {
          ...(settingsData.defaultAssessmentDuration && {
            defaultAssessmentDuration: settingsData.defaultAssessmentDuration,
          }),
          ...(settingsData.maxAssessmentDuration && {
            maxAssessmentDuration: settingsData.maxAssessmentDuration,
          }),
          ...(settingsData.assessmentBuffer && {
            assessmentBuffer: settingsData.assessmentBuffer,
          }),
          ...(settingsData.useCustomPrompts !== undefined && {
            useCustomPrompts: settingsData.useCustomPrompts,
          }),
          ...(settingsData.technicalAssessmentEnabled !== undefined && {
            technicalAssessmentEnabled: settingsData.technicalAssessmentEnabled,
          }),
          ...(settingsData.behavioralAssessmentEnabled !== undefined && {
            behavioralAssessmentEnabled:
              settingsData.behavioralAssessmentEnabled,
          }),
          ...(settingsData.culturalFitAssessmentEnabled !== undefined && {
            culturalFitAssessmentEnabled:
              settingsData.culturalFitAssessmentEnabled,
          }),
          ...(settingsData.aiDifficulty && {
            aiDifficulty: settingsData.aiDifficulty,
          }),
          ...(settingsData.customPrompts && {
            customPrompts: settingsData.customPrompts,
          }),
          ...(settingsData.skillWeightings && {
            skillWeightings: settingsData.skillWeightings,
          }),
          ...(settingsData.passThreshold && {
            passThreshold: settingsData.passThreshold,
          }),
          ...(settingsData.enabled !== undefined && {
            enabled: settingsData.enabled,
          }),
        },
      });

      return toPartnerProfileAiAssessmentSettingsDomain(settings);
    } catch (error) {
      logger.error('Error updating partner AI assessment settings', {
        error,
        partnerId,
      });
      throw error;
    }
  }

  /**
   * Get partner financial data
   */
  async getFinancialData(partnerId: string): Promise<IPartnerFinancialData> {
    try {
      const partner = await this.prisma.partner.findUnique({
        where: { id: partnerId },
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

      if (!partner) {
        throw new AppError('Partner not found', 404, ErrorCode.NOT_FOUND);
      }

      if (!partner.financialData) {
        throw new AppError(
          'Financial data not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      return toPartnerFinancialDataDomain(partner.financialData);
    } catch (error) {
      logger.error('Error getting partner financial data', {
        error,
        partnerId,
      });
      throw error;
    }
  }

  /**
   * Create partner financial data
   */
  async createFinancialData(
    partnerId: string,
    financialData: IPartnerFinancialDataUpdate
  ): Promise<IPartnerFinancialData> {
    try {
      const partner = await this.prisma.partner.findUnique({
        where: { id: partnerId },
      });

      if (!partner) {
        throw new AppError('Partner not found', 404, ErrorCode.NOT_FOUND);
      }

      const existingFinancialData =
        await this.prisma.partner_financial_data.findUnique({
          where: { partnerId },
        });

      if (existingFinancialData) {
        throw new AppError(
          'Financial data already exists',
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      const newFinancialData = await this.prisma.partner_financial_data.create({
        data: {
          partnerId,
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

      return toPartnerFinancialDataDomain(newFinancialData);
    } catch (error) {
      logger.error('Error creating partner financial data', {
        error,
        partnerId,
      });
      throw error;
    }
  }

  /**
   * Update partner financial data
   */
  async updateFinancialData(
    partnerId: string,
    financialData: IPartnerFinancialDataUpdate
  ): Promise<IPartnerFinancialData> {
    try {
      const existingFinancialData =
        await this.prisma.partner_financial_data.findUnique({
          where: { partnerId },
        });

      if (!existingFinancialData) {
        return this.createFinancialData(partnerId, financialData);
      }
      const updatedFinancialData =
        await this.prisma.partner_financial_data.update({
          where: { partnerId },
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

      return toPartnerFinancialDataDomain(updatedFinancialData);
    } catch (error) {
      logger.error('Error updating partner financial data', {
        error,
        partnerId,
      });
      throw error;
    }
  }

  /**
   * Add bank account
   */
  async addBankAccount(
    partnerId: string,
    accountData: IPartnerBankAccountCreate
  ): Promise<IPartnerBankAccount> {
    try {
      const financialData = await this.prisma.partner_financial_data.findUnique(
        {
          where: { partnerId },
          include: { bankAccounts: true },
        }
      );

      if (!financialData) {
        throw new AppError(
          'Financial data not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      if (accountData.isDefault) {
        await this.prisma.partner_bank_account.updateMany({
          where: { financialDataId: financialData.id },
          data: { isDefault: false },
        });
      }

      const newAccount = await this.prisma.partner_bank_account.create({
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

      return toPartnerBankAccountDomain(newAccount);
    } catch (error) {
      logger.error('Error adding bank account', { error, partnerId });
      throw error;
    }
  }

  /**
   * Update bank account
   */
  async updateBankAccount(
    partnerId: string,
    accountId: string,
    accountData: IPartnerBankAccountUpdate
  ): Promise<IPartnerBankAccount> {
    try {
      const financialData = await this.prisma.partner_financial_data.findUnique(
        {
          where: { partnerId },
          include: {
            bankAccounts: {
              where: { id: accountId },
            },
          },
        }
      );

      if (!financialData || financialData.bankAccounts.length === 0) {
        throw new AppError('Bank account not found', 404, ErrorCode.NOT_FOUND);
      }

      if (accountData.isDefault) {
        await this.prisma.partner_bank_account.updateMany({
          where: {
            financialDataId: financialData.id,
            id: { not: accountId },
          },
          data: { isDefault: false },
        });
      }

      const updatedAccount = await this.prisma.partner_bank_account.update({
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

      return toPartnerBankAccountDomain(updatedAccount);
    } catch (error) {
      logger.error('Error updating bank account', {
        error,
        partnerId,
        accountId,
      });
      throw error;
    }
  }

  /**
   * Delete bank account
   */
  async deleteBankAccount(
    partnerId: string,
    accountId: string
  ): Promise<{ success: boolean }> {
    try {
      const financialData = await this.prisma.partner_financial_data.findUnique(
        {
          where: { partnerId },
          include: {
            bankAccounts: {
              where: { id: accountId },
            },
          },
        }
      );

      if (!financialData || financialData.bankAccounts.length === 0) {
        throw new AppError('Bank account not found', 404, ErrorCode.NOT_FOUND);
      }

      await this.prisma.partner_bank_account.delete({
        where: { id: accountId },
      });

      const remainingAccounts = await this.prisma.partner_bank_account.findMany(
        {
          where: { financialDataId: financialData.id },
        }
      );

      if (
        remainingAccounts.length > 0 &&
        !remainingAccounts.some((acc: IPartnerBankAccount) => acc.isDefault)
      ) {
        await this.prisma.partner_bank_account.update({
          where: { id: remainingAccounts[0].id },
          data: { isDefault: true },
        });
      }

      return { success: true };
    } catch (error) {
      logger.error('Error deleting bank account', {
        error,
        partnerId,
        accountId,
      });
      throw error;
    }
  }

  /**
   * Get partner documents
   */
  async getDocuments(partnerId: string): Promise<IPartnerDocument[]> {
    try {
      const documents = await this.prisma.partner_document.findMany({
        where: { partnerId },
        orderBy: { createdAt: 'desc' },
      });

      return documents.map(toPartnerDocumentDomain);
    } catch (error) {
      logger.error('Error getting partner documents', { error, partnerId });
      throw error;
    }
  }

  /**
   * Create partner document
   */
  async createDocument(
    partnerId: string,
    documentData: IPartnerDocumentCreate
  ): Promise<IPartnerDocument> {
    try {
      const partner = await this.prisma.partner.findUnique({
        where: { id: partnerId },
      });

      if (!partner) {
        throw new AppError('Partner not found', 404, ErrorCode.NOT_FOUND);
      }

      const newDocument = await this.prisma.partner_document.create({
        data: {
          partnerId,
          name: documentData.name,
          type: documentData.type,
          size: documentData.size,
          url: documentData.url,
          uploadedBy: documentData.uploadedBy,
        },
      });

      return toPartnerDocumentDomain(newDocument);
    } catch (error) {
      logger.error('Error creating partner document', { error, partnerId });
      throw error;
    }
  }

  /**
   * Update partner document
   */
  async updateDocument(
    partnerId: string,
    documentId: string,
    documentData: IPartnerDocumentUpdate
  ): Promise<IPartnerDocument> {
    try {
      const existingDocument = await this.prisma.partner_document.findFirst({
        where: {
          id: documentId,
          partnerId: partnerId,
        },
      });

      if (!existingDocument) {
        throw new AppError('Document not found', 404, ErrorCode.NOT_FOUND);
      }

      const updatedDocument = await this.prisma.partner_document.update({
        where: { id: documentId },
        data: {
          ...(documentData.name && { name: documentData.name }),
          ...(documentData.type && { type: documentData.type }),
        },
      });

      return toPartnerDocumentDomain(updatedDocument);
    } catch (error) {
      logger.error('Error updating partner document', {
        error,
        partnerId,
        documentId,
      });
      throw error;
    }
  }

  /**
   * Delete partner document
   */
  async deleteDocument(
    partnerId: string,
    documentId: string
  ): Promise<{ success: boolean }> {
    try {
      const existingDocument = await this.prisma.partner_document.findFirst({
        where: {
          id: documentId,
          partnerId: partnerId,
        },
      });

      if (!existingDocument) {
        throw new AppError('Document not found', 404, ErrorCode.NOT_FOUND);
      }

      await this.prisma.partner_document.delete({
        where: { id: documentId },
      });

      return { success: true };
    } catch (error) {
      logger.error('Error deleting partner document', {
        error,
        partnerId,
        documentId,
      });
      throw error;
    }
  }

  /**
   * Get partner document by ID
   */
  async getDocumentById(
    partnerId: string,
    documentId: string
  ): Promise<IPartnerDocument> {
    try {
      const document = await this.prisma.partner_document.findFirst({
        where: {
          id: documentId,
          partnerId: partnerId,
        },
      });

      if (!document) {
        throw new AppError('Document not found', 404, ErrorCode.NOT_FOUND);
      }

      return toPartnerDocumentDomain(document);
    } catch (error) {
      logger.error('Error getting partner document', {
        error,
        partnerId,
        documentId,
      });
      throw error;
    }
  }

  /**
   * Update profile photo with direct file upload
   */
  async updateProfilePhoto(
    partnerId: string,
    file: Buffer
  ): Promise<{ fileName: string; logoUrl: string }> {
    try {
      // Find the partner by ID
      const partner = await this.prisma.partner.findUnique({
        where: {
          id: partnerId,
        },
        include: {
          company: true,
        },
      });

      if (!partner) {
        throw new AppError('Partner not found', 404, ErrorCode.NOT_FOUND);
      }

      // Generate a unique filename for the upload
      const uniqueFileName = `${partnerId}-${Date.now()}.jpg`;
      const { folderPath } = getBucketFolderPathToPartnerPhoto(partnerId);
      const filePath = `${folderPath}/${uniqueFileName}`;

      // Upload file directly to storage
      const uploadedUrl = await this.storageService.uploadFile(file, filePath);

      // Update the company's logo field
      await this.prisma.company.update({
        where: { id: partner.companyId },
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
        context: 'PartnerProfileService.updateProfilePhoto',
        error: error instanceof Error ? error.message : 'Unknown error',
        partnerId,
      });
      throw error;
    }
  }
}
