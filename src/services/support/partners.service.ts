import { PrismaClient, Prisma } from '@prisma/client';
import { singleton } from '@/shared/decorators/singleton';
import { INotificationProvider } from '../notification/notification.interface';
import {
  ISupportPartner,
  ISupportPartnerUpdate,
  ISupportPartnerFilterQueryCompanyId,
  ISupportPartnerListResponse,
  toSupportPartnerDomain,
} from '@/shared/models/domain/support/partners.domain';
import {
  IPaginationRequest,
  IPaginatedResponse,
} from '@/shared/models/api/common/common.api';
import { buildQueryConditions } from '@/utils/pagination';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';

@singleton
export class SupportPartnersService {
  private readonly prisma: PrismaClient;
  private readonly invitationExpiryHours = 72;

  constructor(private readonly notificationProvider: INotificationProvider) {
    this.prisma = new PrismaClient();
  }

  /**
   * Update an existing support partner
   */
  async updateSupportPartner(
    _requestingUserId: string,
    supportPartnerId: string,
    updateData: ISupportPartnerUpdate
  ): Promise<ISupportPartner> {
    try {
      logger.info({
        message: 'Updating partner',
        context: 'PartnersService.updatePartner',
        supportPartnerId,
        updateData,
      });

      // Find the partner
      const supportPartner = await this.prisma.partner.findUnique({
        where: { id: supportPartnerId },
        include: {
          company: true,
          settings: true,
          financialData: true,
        },
      });

      if (!supportPartner) {
        throw new AppError('Partner not found', 404, ErrorCode.NOT_FOUND);
      }

      // Update the partner and related data in a transaction
      await this.prisma.$transaction(async (tx) => {
        // Update basic partner fields
        const partnerUpdateData: any = {};

        if (updateData.candidateCount !== undefined)
          partnerUpdateData.candidateCount = updateData.candidateCount;
        if (updateData.userCount !== undefined)
          partnerUpdateData.userCount = updateData.userCount;
        if (updateData.documentCount !== undefined)
          partnerUpdateData.documentCount = updateData.documentCount;

        if (Object.keys(partnerUpdateData).length > 0) {
          await tx.partner.update({
            where: { id: supportPartnerId },
            data: partnerUpdateData,
          });
        }

        // Update company data if provided
        if (updateData.company) {
          const companyUpdateData: any = {};

          if (updateData.companyName)
            companyUpdateData.name = updateData.companyName;
          if (updateData.email)
            companyUpdateData.contactEmail = updateData.email;
          if (updateData.company?.profile?.description)
            companyUpdateData.description =
              updateData.company.profile.description;
          if (updateData.company?.profile?.companyType)
            companyUpdateData.companyType =
              updateData.company.profile.companyType;
          if (updateData.company?.profile?.industry)
            companyUpdateData.industry = updateData.company.profile.industry;
          if (updateData.company?.profile?.size)
            companyUpdateData.size = updateData.company.profile.size;
          if (updateData.company?.profile?.stage)
            companyUpdateData.stage = updateData.company.profile.stage;
          if (updateData.company?.profile?.foundedYear)
            companyUpdateData.foundedYear =
              updateData.company.profile.foundedYear;
          if (updateData.company?.profile?.website)
            companyUpdateData.website = updateData.company.profile.website;
          if (updateData.company?.profile?.benefits)
            companyUpdateData.benefits = updateData.company.profile.benefits;

          // Use company.basic for contactPhone/contactName
          if (updateData.company?.basic?.contactPhone)
            companyUpdateData.contactPhone =
              updateData.company.basic.contactPhone;
          if (updateData.company?.basic?.contactName)
            companyUpdateData.contactName =
              updateData.company.basic.contactName;

          // Use company.address for address/city/state/zipCode/country
          if (updateData.company?.address?.address)
            companyUpdateData.address = updateData.company.address.address;
          if (updateData.company?.address?.city)
            companyUpdateData.city = updateData.company.address.city;
          if (updateData.company?.address?.state)
            companyUpdateData.state = updateData.company.address.state;
          if (updateData.company?.address?.zipCode)
            companyUpdateData.zipCode = updateData.company.address.zipCode;
          if (updateData.company?.address?.country)
            companyUpdateData.country = updateData.company.address.country;

          if (Object.keys(companyUpdateData).length > 0) {
            await tx.company.update({
              where: { id: supportPartner.companyId },
              data: companyUpdateData,
            });
          }

          // Update company social media if provided (use company.socialProfiles)
          if (updateData.company?.socialProfiles) {
            await tx.company_social.upsert({
              where: { companyId: supportPartner.companyId },
              create: {
                companyId: supportPartner.companyId,
                linkedin: updateData.company.socialProfiles.linkedin,
                twitter: updateData.company.socialProfiles.twitter,
                facebook: updateData.company.socialProfiles.facebook,
                instagram: updateData.company.socialProfiles.instagram,
                youtube: updateData.company.socialProfiles.youtube,
                github: updateData.company.socialProfiles.github,
              },
              update: {
                linkedin: updateData.company.socialProfiles.linkedin,
                twitter: updateData.company.socialProfiles.twitter,
                facebook: updateData.company.socialProfiles.facebook,
                instagram: updateData.company.socialProfiles.instagram,
                youtube: updateData.company.socialProfiles.youtube,
                github: updateData.company.socialProfiles.github,
              },
            });
          }

          // Update company culture if provided
          if (updateData.company?.culture) {
            await tx.company_culture.upsert({
              where: { companyId: supportPartner.companyId },
              create: {
                companyId: supportPartner.companyId,
                mission: updateData.company.culture.mission,
                vision: updateData.company.culture.vision,
                values: updateData.company.culture.values ?? [],
                perks: updateData.company.culture.perks ?? [],
                workEnvironment:
                  updateData.company.culture.workEnvironment ?? [],
              },
              update: {
                mission: updateData.company.culture.mission,
                vision: updateData.company.culture.vision,
                values: updateData.company.culture.values,
                perks: updateData.company.culture.perks,
                workEnvironment: updateData.company.culture.workEnvironment,
              },
            });
          }
        }

        // Update partner settings if provided
        if (updateData.settings) {
          const settingsUpdateData: any = {
            notificationsEnabled:
              updateData.settings.notificationsEnabled ?? true,
            emailNotifications: updateData.settings.emailNotifications ?? true,
            pushNotifications: updateData.settings.pushNotifications ?? true,
            consultantAlerts: updateData.settings.consultantAlerts ?? true,
            contractAlerts: updateData.settings.contractAlerts ?? true,
            privacySettings: updateData.settings.privacySettings,
            brandingSettings: updateData.settings.brandingSettings,
            integrationSettings: updateData.settings.integrationSettings,
          };

          if (updateData.settings.globalSettingsId) {
            settingsUpdateData.globalSettingsId =
              updateData.settings.globalSettingsId;
          }

          await tx.partner_settings.upsert({
            where: { partnerId: supportPartnerId },
            create: {
              partnerId: supportPartnerId,
              ...settingsUpdateData,
            },
            update: settingsUpdateData,
          });
        }

        // Update financial data if provided
        if (updateData.financialData) {
          const financialUpdateData: any = {};

          if (updateData.financialData.annualRevenue !== undefined) {
            financialUpdateData.annualRevenue =
              updateData.financialData.annualRevenue;
          }
          if (updateData.financialData.taxId !== undefined)
            financialUpdateData.taxId = updateData.financialData.taxId;
          if (updateData.financialData.vatNumber !== undefined)
            financialUpdateData.vatNumber = updateData.financialData.vatNumber;
          if (updateData.financialData.gstNumber !== undefined)
            financialUpdateData.gstNumber = updateData.financialData.gstNumber;

          if (Object.keys(financialUpdateData).length > 0) {
            await tx.partner_financial_data.upsert({
              where: { partnerId: supportPartnerId },
              create: {
                partnerId: supportPartnerId,
                annualRevenue: updateData.financialData.annualRevenue ?? 0,
                taxId: updateData.financialData.taxId ?? '',
                vatNumber: updateData.financialData.vatNumber ?? '',
                gstNumber: updateData.financialData.gstNumber ?? '',
              },
              update: financialUpdateData,
            });
          }

          // Update bank accounts if provided
          if (
            updateData.financialData.bankAccounts &&
            updateData.financialData.bankAccounts.length > 0
          ) {
            // First, get or create financial data record
            const financialData = await tx.partner_financial_data.upsert({
              where: { partnerId: supportPartnerId },
              create: {
                partnerId: supportPartnerId,
                annualRevenue: updateData.financialData.annualRevenue ?? 0,
                taxId: updateData.financialData.taxId ?? '',
                vatNumber: updateData.financialData.vatNumber ?? '',
                gstNumber: updateData.financialData.gstNumber ?? '',
              },
              update: {},
            });

            // Delete existing bank accounts and create new ones
            await tx.partner_bank_account.deleteMany({
              where: { financialDataId: financialData.id },
            });

            // Create new bank accounts
            for (const bankAccount of updateData.financialData.bankAccounts) {
              await tx.partner_bank_account.create({
                data: {
                  financialDataId: financialData.id,
                  accountName: bankAccount.accountName,
                  accountNumber: bankAccount.accountNumber,
                  bankName: bankAccount.bankName,
                  swiftCode: bankAccount.swiftCode,
                  isDefault: bankAccount.isDefault,
                },
              });
            }
          }
        }
      });

      // Fetch the updated partner with all relations
      const updatedSupportPartner = await this.prisma.partner.findUnique({
        where: { id: supportPartnerId },
        include: {
          company: {
            include: {
              social: true,
              culture: true,
            },
          },
          settings: {
            include: {
              globalSettings: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
          financialData: {
            include: {
              bankAccounts: {
                orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
              },
            },
          },
          _count: {
            select: {
              documents: true,
              invitations: true,
              partnerUsers: true,
              candidates: true,
              jobApplications: true,
            },
          },
        },
      });

      if (!updatedSupportPartner) {
        throw new AppError(
          'Partner not found after update',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Convert to domain model
      return toSupportPartnerDomain(updatedSupportPartner);
    } catch (error) {
      logger.error({
        message: 'Failed to update support partner',
        context: 'SupportPartnersService.updateSupportPartner',
        error: error instanceof Error ? error.message : 'Unknown error',
        supportPartnerId,
        updateData,
      });
      throw error;
    }
  }

  /**
   * Get a specific support partner by ID
   */
  async getSupportPartner(supportPartnerId: string): Promise<ISupportPartner> {
    try {
      const partner = await this.prisma.partner.findUnique({
        where: {
          id: supportPartnerId,
        },
        include: {
          company: {
            include: {
              social: true,
              culture: true,
            },
          },
          settings: {
            include: {
              globalSettings: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
          financialData: {
            include: {
              bankAccounts: {
                orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
              },
            },
          },
          // Get counts only, not the actual arrays
          _count: {
            select: {
              documents: true,
              invitations: true,
              partnerUsers: true,
              candidates: true,
              jobApplications: true,
            },
          },
        },
      });

      if (!partner) {
        throw new AppError('Partner not found', 404, ErrorCode.NOT_FOUND);
      }

      // Transform to domain model with basic info only
      return toSupportPartnerDomain(partner);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error({
        message: 'Failed to get support partner',
        context: 'SupportPartnersService.getSupportPartner',
        error: error instanceof Error ? error.message : 'Unknown error',
        supportPartnerId,
      });
      throw new AppError(
        'Failed to get support partner',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Delete a partner
   */
  async deleteSupportPartner(supportPartnerId: string): Promise<void> {
    try {
      // Find the partner
      const supportPartner = await this.prisma.partner.findUnique({
        where: { id: supportPartnerId },
      });

      if (!supportPartner) {
        throw new AppError('Partner not found', 404, ErrorCode.NOT_FOUND);
      }

      // Delete in a transaction
      await this.prisma.$transaction(async (tx) => {
        // Delete related settings first
        await tx.partner_settings.deleteMany({
          where: { partnerId: supportPartnerId },
        });

        // Then delete the partner
        await tx.partner.delete({
          where: { id: supportPartnerId },
        });
      });
    } catch (error) {
      logger.error({
        message: 'Failed to delete partner',
        context: 'PartnersService.deletePartner',
        error: error instanceof Error ? error.message : 'Unknown error',
        supportPartnerId,
      });
      throw error;
    }
  }

  /**
   * List all partners with optional filtering
   */
  async listSupportPartners(
    filter: ISupportPartnerFilterQueryCompanyId & { search?: string },
    paginationRequest: IPaginationRequest
  ): Promise<IPaginatedResponse<ISupportPartnerListResponse>> {
    try {
      // Build query conditions with proper sorting configuration
      const queryConditions = buildQueryConditions(filter, paginationRequest, {
        search: {
          searchableFields: [],
          relationFields: {
            company: ['name', 'contactEmail'],
          },
        },
        filter: {
          allowedFields: ['companyId', 'industry', 'size'],
          relationFields: {
            companyId: 'company',
            industry: 'company',
            size: 'company',
          },
          enumFields: ['industry', 'size'],
          enumRelationFields: {
            industry: 'company',
            size: 'company',
          },
        },
        sort: {
          allowedFields: ['id', 'createdAt', 'updatedAt'],
          relationFields: {
            companyName: { relation: 'company', field: 'name' },
            email: { relation: 'company', field: 'contactEmail' },
            industry: { relation: 'company', field: 'industry' },
            size: { relation: 'company', field: 'size' },
          },
          defaultSort: { field: 'createdAt', order: 'desc' },
        },
      });

      // Build where clause based on filters
      const where: Prisma.partnerWhereInput = {
        ...queryConditions.where,
        ...(filter.companyId && { companyId: filter.companyId }),
      };

      // Get total count for pagination
      const total = await this.prisma.partner.count({
        where,
      });

      // Get paginated results with minimal data for list view
      const partners = await this.prisma.partner.findMany({
        where,
        skip: queryConditions.skip,
        take: queryConditions.take,
        orderBy: queryConditions.orderBy,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              contactEmail: true,
              industry: true,
              size: true,
            },
          },
          // Get counts only for list view
          _count: {
            select: {
              documents: true,
              invitations: true,
              partnerUsers: true,
              candidates: true,
              jobApplications: true,
            },
          },
          financialData: {
            select: {
              id: true, // Just check if exists
            },
          },
        },
      });

      // Transform to simplified list response format
      const transformedPartners: ISupportPartnerListResponse[] = partners.map(
        (partner) => ({
          id: partner.id,
          companyName: partner.company?.name || '',
          email: partner.company?.contactEmail || null,
          industry: partner.company?.industry || '',
          size: partner.company?.size || '',
          createdAt: partner.createdAt.toISOString(),
          candidateCount: partner._count?.candidates || 0,
          userCount: partner._count?.partnerUsers || 0,
          jobApplicationsCount: partner._count?.jobApplications || 0,
          hasFinancialData: !!partner.financialData,
        })
      );

      return {
        items: transformedPartners,
        pagination: {
          total,
          page: queryConditions.pagination.page,
          limit: queryConditions.pagination.limit,
          totalPages: Math.ceil(total / queryConditions.pagination.limit),
        },
      };
    } catch (error) {
      logger.error({
        message: 'Failed to list support partners',
        context: 'SupportPartnersService.listSupportPartners',
        error: error instanceof Error ? error.message : 'Unknown error',
        filter,
      });
      throw error;
    }
  }
}
