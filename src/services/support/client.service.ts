import { PrismaClient } from '@prisma/client';
import { singleton } from '@/shared/decorators/singleton';
import { INotificationProvider } from '../notification/notification.interface';
import {
  ISupportClient,
  ISupportClientUpdate,
  ISupportClientFilterQueryCompanyId,
  toSupportClientDomain,
  ISupportClientVerifyResponse,
  ISupportClientJobPostingByIdResponse,
} from '@/shared/models/domain/support/client.domain';
import { ICompanyVerificationStatus } from '@/shared/models/common/enums';
import {
  IPaginationRequest,
  IPaginatedResponse,
} from '@/shared/models/api/common/common.api';
import { buildQueryConditions } from '@/utils/pagination';

import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';
import { ClientProfileService } from '../client/profile.service';
import {
  CompanyTypeEnum,
  CompanyIndustryEnum,
  CompanySizeEnum,
  CompanyStageEnum,
  ClientSubscriptionStatusEnum,
} from '@/shared/models/common/enums';
import { ISupportClientListResponse } from '@/shared/models/domain/support/client.domain';
import { IClientProfile } from '@/shared/models/domain/client/profile.domain';
import { ClientSubscriptionService } from '../client/subscription.service';
import { MCP_SCOPES, type McpScope } from '@/mcp/config/mcp.config';
import { mcpClientService } from '@/services/mcp/mcp.client.service';
import type { IMcpClientWithApiKey } from '@/shared/models/domain/client/mcp.client.domain';
@singleton
export class SupportClientService {
  private readonly prisma: PrismaClient;
  private readonly invitationExpiryHours = 48;

  private static readonly DEFAULT_MCP_CLIENT_NAME = 'Teamcast MCP Key';
  private static readonly DEFAULT_MCP_SOURCE_SYSTEM = 'teamcast';

  constructor(
    private readonly notificationProvider: INotificationProvider,
    private readonly subscriptionService: ClientSubscriptionService,

    private readonly clientProfileService: ClientProfileService
  ) {
    this.prisma = new PrismaClient();
  }

  /**
   * Update an existing client
   */
  async updateSupportClient(
    clientId: string,
    updateData: ISupportClientUpdate
  ): Promise<ISupportClient> {
    try {
      logger.info({
        message: 'Updating client',
        context: 'SupportClientService.updateClient',
        clientId,
        updateData,
      });

      // Find the client
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
        include: {
          settings: true,
          clientAiAssessmentSettings: true,
        },
      });

      if (!client) {
        throw new AppError('Client not found', 404, ErrorCode.NOT_FOUND);
      }

      // Update the client and related settings in a transaction
      await this.prisma.$transaction(async (tx) => {
        // Update client company information
        await tx.company.update({
          where: { id: client.companyId },
          data: {
            ...(updateData?.company?.name && { name: updateData.company.name }),
            ...(updateData?.company?.contactEmail && {
              contactEmail: updateData.company.contactEmail,
            }),
            ...(updateData?.company?.industry && {
              industry: updateData.company.industry as CompanyIndustryEnum,
            }),
            ...(updateData?.company?.size && {
              size: updateData.company.size as CompanySizeEnum,
            }),
            ...(updateData?.company?.stage && {
              stage: updateData.company.stage as CompanyStageEnum,
            }),
            ...(updateData?.company?.foundedYear && {
              foundedYear: updateData.company.foundedYear,
            }),
            ...(updateData?.company?.description && {
              description: updateData.company.description,
            }),
            ...(updateData?.company?.companyType && {
              companyType: updateData.company.companyType as CompanyTypeEnum,
            }),
            ...(typeof updateData?.company?.website === 'string' && {
              website: updateData.company.website,
            }),
            ...(typeof updateData?.company?.contactPhone === 'string' && {
              contactPhone: updateData.company.contactPhone,
            }),

            // For address fields, ensure strings or skip
            ...(typeof updateData?.company?.address === 'string' && {
              address: updateData.company.address,
            }),
            ...(typeof updateData?.company?.city === 'string' && {
              city: updateData.company.city,
            }),
            ...(typeof updateData?.company?.state === 'string' && {
              state: updateData.company.state,
            }),
            ...(typeof updateData?.company?.zipCode === 'string' && {
              zipCode: updateData.company.zipCode,
            }),
            ...(typeof updateData?.company?.country === 'string' && {
              country: updateData.company.country,
            }),
          },
        });

        // Update client settings if provided
        if (updateData.settings) {
          await tx.client_settings.upsert({
            where: { clientId },
            create: {
              clientId,
              globalSettingsId: updateData.settings.globalSettingsId,
              notificationsEnabled:
                updateData.settings.notificationsEnabled ?? true,
              emailNotifications:
                updateData.settings.emailNotifications ?? true,
              pushNotifications: updateData.settings.pushNotifications ?? true,
              jobAlerts: updateData.settings.jobAlerts ?? true,
              candidateAlerts: updateData.settings.candidateAlerts ?? true,
              applicationAlerts: updateData.settings.applicationAlerts ?? true,
              privacySettings: updateData.settings.privacySettings,
              brandingSettings: updateData.settings.brandingSettings,
              isDeelEnabled: updateData.settings.isDeelEnabled ?? false,
              integrationSettings: updateData.settings.integrationSettings,
            },
            update: {
              globalSettingsId: updateData.settings.globalSettingsId,
              notificationsEnabled: updateData.settings.notificationsEnabled,
              emailNotifications: updateData.settings.emailNotifications,
              pushNotifications: updateData.settings.pushNotifications,
              jobAlerts: updateData.settings.jobAlerts,
              candidateAlerts: updateData.settings.candidateAlerts,
              applicationAlerts: updateData.settings.applicationAlerts,
              privacySettings: updateData.settings.privacySettings,
              brandingSettings: updateData.settings.brandingSettings,
              isDeelEnabled: updateData.settings.isDeelEnabled ?? false,
              integrationSettings: updateData.settings.integrationSettings,
            },
          });
        }

        // Update client job ai assessment settings if provided
        if (updateData.clientAiAssessmentSettings) {
          await tx.client_ai_assessment_settings.upsert({
            where: { clientId },
            create: {
              clientId,
              globalJobAiAssessmentSettingsId:
                updateData.clientAiAssessmentSettings.globalSettingsId,
              greetingMessage:
                updateData.clientAiAssessmentSettings.greetingMessage,
              defaultAssessmentDuration:
                updateData.clientAiAssessmentSettings.defaultAssessmentDuration,
              defaultPassingScore:
                updateData.clientAiAssessmentSettings.defaultPassingScore,
              requiredSections:
                updateData.clientAiAssessmentSettings.requiredSections,
              maximumAttempts:
                updateData.clientAiAssessmentSettings.maximumAttempts,
              cooldownPeriod:
                updateData.clientAiAssessmentSettings.cooldownPeriod,
              maxSections: updateData.clientAiAssessmentSettings.maxSections,
              maxQuestionsPerSection:
                updateData.clientAiAssessmentSettings.maxQuestionsPerSection,
              proctoringEnabled:
                updateData.clientAiAssessmentSettings.proctoringEnabled,
              maxWarnings: updateData.clientAiAssessmentSettings.maxWarnings,
              tabSwitchLimit:
                updateData.clientAiAssessmentSettings.tabSwitchLimit,
              copyPasteAllowed:
                updateData.clientAiAssessmentSettings.copyPasteAllowed,
              videoRecordingEnabled:
                updateData.clientAiAssessmentSettings.videoRecordingEnabled,
              minimumVideoLength:
                updateData.clientAiAssessmentSettings.minimumVideoLength,
              aiVideoAnalysisEnabled:
                updateData.clientAiAssessmentSettings.aiVideoAnalysisEnabled,
              autoPublishOnSuccess:
                updateData.clientAiAssessmentSettings.autoPublishOnSuccess,
              autoNotifyOnComplete:
                updateData.clientAiAssessmentSettings.autoNotifyOnComplete,
              sectionTemplates:
                updateData.clientAiAssessmentSettings.sectionTemplates,
              questionTemplates:
                updateData.clientAiAssessmentSettings.questionTemplates,
              customStyles: updateData.clientAiAssessmentSettings.customStyles,
              customInstructions:
                updateData.clientAiAssessmentSettings.customInstructions,
              customPrompts:
                updateData.clientAiAssessmentSettings.customPrompts,
              skillWeightings:
                updateData.clientAiAssessmentSettings.skillWeightings,
              createdAt: updateData.clientAiAssessmentSettings.createdAt,
              updatedAt: updateData.clientAiAssessmentSettings.updatedAt,
            },
            update: {
              globalJobAiAssessmentSettingsId:
                updateData.clientAiAssessmentSettings.globalSettingsId,
              greetingMessage:
                updateData.clientAiAssessmentSettings.greetingMessage,
              defaultAssessmentDuration:
                updateData.clientAiAssessmentSettings.defaultAssessmentDuration,
              defaultPassingScore:
                updateData.clientAiAssessmentSettings.defaultPassingScore,
              requiredSections:
                updateData.clientAiAssessmentSettings.requiredSections,
              maximumAttempts:
                updateData.clientAiAssessmentSettings.maximumAttempts,
              cooldownPeriod:
                updateData.clientAiAssessmentSettings.cooldownPeriod,
              maxSections: updateData.clientAiAssessmentSettings.maxSections,
              maxQuestionsPerSection:
                updateData.clientAiAssessmentSettings.maxQuestionsPerSection,
              proctoringEnabled:
                updateData.clientAiAssessmentSettings.proctoringEnabled,
              maxWarnings: updateData.clientAiAssessmentSettings.maxWarnings,
              tabSwitchLimit:
                updateData.clientAiAssessmentSettings.tabSwitchLimit,
              copyPasteAllowed:
                updateData.clientAiAssessmentSettings.copyPasteAllowed,
              videoRecordingEnabled:
                updateData.clientAiAssessmentSettings.videoRecordingEnabled,
              minimumVideoLength:
                updateData.clientAiAssessmentSettings.minimumVideoLength,
              aiVideoAnalysisEnabled:
                updateData.clientAiAssessmentSettings.aiVideoAnalysisEnabled,
              autoPublishOnSuccess:
                updateData.clientAiAssessmentSettings.autoPublishOnSuccess,
              autoNotifyOnComplete:
                updateData.clientAiAssessmentSettings.autoNotifyOnComplete,
              sectionTemplates:
                updateData.clientAiAssessmentSettings.sectionTemplates,
              questionTemplates:
                updateData.clientAiAssessmentSettings.questionTemplates,
              customStyles: updateData.clientAiAssessmentSettings.customStyles,
              customInstructions:
                updateData.clientAiAssessmentSettings.customInstructions,
              customPrompts:
                updateData.clientAiAssessmentSettings.customPrompts,
              skillWeightings:
                updateData.clientAiAssessmentSettings.skillWeightings,
              createdAt: updateData.clientAiAssessmentSettings.createdAt,
              updatedAt: updateData.clientAiAssessmentSettings.updatedAt,
            },
          });
        }

        // update subscription
        const existingSubscription = await tx.client_subscription.findFirst({
          where: { clientId },
        });

        // Convert date strings to Date objects
        const startDate = updateData.subscription?.startDate
          ? new Date(updateData.subscription.startDate)
          : existingSubscription?.startDate;
        const endDate = updateData.subscription?.endDate
          ? new Date(updateData.subscription.endDate)
          : existingSubscription?.endDate;

        if (existingSubscription && updateData.subscription) {
          await tx.client_subscription.update({
            where: { id: existingSubscription.id },
            data: {
              autoRenew: updateData.subscription.autoRenew ?? false,
              ...(updateData.subscription.status && {
                status: updateData.subscription
                  .status as ClientSubscriptionStatusEnum,
              }),
              additionalCandidateViewCredits: Number(
                updateData.subscription.additionalCandidateViewCredits ?? 0
              ),
              startDate: startDate,
              endDate: endDate,
              additionalAiAssessmentCredits: Number(
                updateData.subscription.additionalAiAssessmentCredits ?? 0
              ),
              additionalSeatsCredits: Number(
                updateData.subscription.additionalSeatsCredits ?? 0
              ),
              ...(updateData.subscription.packageId &&
                updateData.subscription.packageId.trim() !== '' &&
                updateData.subscription.packageId !== 'none' && {
                  packageId: updateData.subscription.packageId,
                }),
            },
          });
        } else {
          logger.info({
            message:
              'Skipping subscription update: no active subscription for client',
            context: 'SupportClientService.updateClient',
            clientId,
          });
        }
      });

      // Fetch and return the full updated client with all relations
      const updatedClient = await this.prisma.client.findUnique({
        where: { id: clientId },
        include: {
          company: true,
          clientUsers: {
            include: {
              user: true,
            },
          },
          jobPostings: true,
          invitations: true,
          jobAiAssessmentInvitations: {
            include: {
              candidate: true,
            },
          },
          settings: true,
          clientAiAssessmentSettings: true,
          subscriptions: true,
          financialData: {
            include: {
              bankAccounts: true,
            },
          },
          documents: true,
        },
      });

      // Convert to domain model
      return toSupportClientDomain(updatedClient);
    } catch (error) {
      logger.error({
        message: 'Failed to update client',
        context: 'SupportClientService.updateClient',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        updateData,
      });
      throw error;
    }
  }

  /**
   * Get a specific client by ID
   */
  async getSupportClient(clientId: string): Promise<ISupportClient> {
    try {
      const client = await this.prisma.client.findUnique({
        where: {
          id: clientId,
        },
        include: {
          company: true,
          settings: true,
          clientAiAssessmentSettings: true,
          // Get counts for totals
          _count: {
            select: {
              clientUsers: true,
              jobPostings: true,
              invitations: true,
              jobAiAssessmentInvitations: true,
              documents: true,
            },
          },
          subscriptions: {
            include: {
              package: true,
            },
            orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
          },
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

      // Get client profile for additional company information
      let clientProfile: IClientProfile | undefined = undefined;
      try {
        clientProfile = await this.clientProfileService.getProfile(clientId);
      } catch (error) {
        logger.warn({
          message: 'Failed to get client profile, continuing without it',
          context: 'SupportClientService.getSupportClient',
          error: error instanceof Error ? error.message : 'Unknown error',
          clientId,
        });
      }

      // Transform to domain model with enhanced information
      const supportClient = toSupportClientDomain(client);

      // Add counts to the response
      const enhancedClient: ISupportClient = {
        ...supportClient,
        // Include client profile if available
        profile: clientProfile,
        // Explicitly include financial data to ensure it's preserved
        financialData: supportClient.financialData,
        // Remove documents from the response
        documents: undefined,
      };

      return enhancedClient;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error({
        message: 'Failed to get client',
        context: 'SupportClientService.getClient',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
      });
      throw new AppError(
        'Failed to get client',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Delete a client
   */
  async deleteSupportClient(clientId: string): Promise<void> {
    try {
      // Find the client
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        throw new AppError('Client not found', 404, ErrorCode.NOT_FOUND);
      }

      // Delete in a transaction
      await this.prisma.$transaction(async (tx) => {
        // Delete related settings first
        await tx.client_settings.deleteMany({
          where: { clientId },
        });

        await tx.client_ai_assessment_settings.deleteMany({
          where: { clientId },
        });

        // Then delete the client
        await tx.client.delete({
          where: { id: clientId },
        });
      });
    } catch (error) {
      logger.error({
        message: 'Failed to delete client',
        context: 'SupportClientService.deleteClient',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
      });
      throw error;
    }
  }

  /**
   * List all clients with optional filtering
   */
  async listSupportClients(
    filter: ISupportClientFilterQueryCompanyId,
    paginationRequest: IPaginationRequest
  ): Promise<IPaginatedResponse<ISupportClientListResponse>> {
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
          allowedFields: [
            'companyId',
            'industry',
            'size',
            'status',
            'stage',
            'companyType',
            'foundedYear',
            'website',
          ],
          relationFields: {
            industry: 'company',
            size: 'company',
            status: 'company',
            stage: 'company',
            companyType: 'company',
            foundedYear: 'company',
            website: 'company',
          },
          enumFields: ['industry', 'size', 'status', 'stage', 'companyType'],
          enumRelationFields: {
            industry: 'company',
            size: 'company',
            status: 'company',
            stage: 'company',
            companyType: 'company',
          },
        },
        sort: {
          allowedFields: ['id', 'companyId', 'createdAt', 'updatedAt'],
          relationFields: {
            companyName: { relation: 'company', field: 'name' },
            email: { relation: 'company', field: 'contactEmail' },
            industry: { relation: 'company', field: 'industry' },
            size: { relation: 'company', field: 'size' },
            status: { relation: 'company', field: 'status' },
          },
          defaultSort: { field: 'createdAt', order: 'desc' },
        },
      });

      // Build where clause based on filters
      const where: any = {
        ...queryConditions.where,
      };

      // Get total count for pagination
      const total = await this.prisma.client.count({ where });

      // Fetch paginated client list
      const clients = await this.prisma.client.findMany({
        where,
        skip: queryConditions.skip,
        take: queryConditions.take,
        orderBy: queryConditions.orderBy,
        include: {
          company: true,
          _count: {
            select: {
              clientUsers: true,
              jobPostings: true,
              documents: true,
            },
          },
          financialData: {
            select: { id: true },
          },
        },
      });

      // Map result to response DTO
      const items: ISupportClientListResponse[] = clients.map((client) => ({
        id: client.id,
        companyId: client.companyId,
        companyName: client.company?.name || '',
        contactEmail: client.company?.contactEmail || '',
        industry: client.company?.industry || '',
        size: client.company?.size || '',
        status: client.company?.status || '',
        createdAt: client.createdAt.toISOString(),
        userCount: client._count?.clientUsers || 0,
        jobPostingsCount: client._count?.jobPostings || 0,
        documentsCount: client._count?.documents || 0,
        hasFinancialData: !!client.financialData,
      }));

      // Return paginated response
      return {
        items,
        pagination: {
          total,
          page: queryConditions.pagination.page,
          limit: queryConditions.pagination.limit,
          totalPages: Math.ceil(total / queryConditions.pagination.limit),
        },
      };
    } catch (error) {
      logger.error({
        message: 'Failed to list clients',
        context: 'SupportClientService.listClients',
        error: error instanceof Error ? error.message : 'Unknown error',
        filter,
      });
      throw error;
    }
  }

  async getSupportClientJobPostingById(
    jobPostingId: string
  ): Promise<ISupportClientJobPostingByIdResponse> {
    const jobPosting = await this.prisma.job_posting.findUnique({
      where: { id: jobPostingId },
    });

    if (!jobPosting) {
      throw new AppError('Job posting not found', 404, ErrorCode.NOT_FOUND);
    }

    const response = {
      title: jobPosting.title,
    };

    return response;
  }

  /**
   * Verify a client by updating the company's verification status
   */
  async verifyClient(
    clientId: string,
    verifiedBy: string,
    remarks?: string
  ): Promise<ISupportClientVerifyResponse> {
    try {
      logger.info({
        message: 'Starting client verification',
        context: 'SupportClientService.verifyClient',
        clientId,
        verifiedBy,
        remarks,
      });

      // Find the client with company information
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
        include: {
          company: true,
          clientUsers: {
            include: {
              user: true,
            },
          },
          jobPostings: true,
          invitations: true,
          jobAiAssessmentInvitations: {
            include: {
              candidate: true,
            },
          },
          settings: true,
          clientAiAssessmentSettings: true,
          subscriptions: {
            include: {
              package: true,
            },
          },
          financialData: {
            include: {
              bankAccounts: true,
            },
          },
          documents: true,
        },
      });

      if (!client) {
        throw new AppError('Client not found', 404, ErrorCode.NOT_FOUND);
      }

      // Check if client is already verified
      if (client.company.status === ICompanyVerificationStatus.VERIFIED) {
        throw new AppError(
          'Client is already verified',
          409,
          ErrorCode.CONFLICT
        );
      }

      // Update company verification status in a transaction
      await this.prisma.$transaction(async (tx) => {
        // Update company verification status
        await tx.company.update({
          where: { id: client.companyId },
          data: {
            status: ICompanyVerificationStatus.VERIFIED,
            remarks: remarks || 'Manually verified by support team',
          },
        });

        // Log the verification activity
        await tx.activity_log.create({
          data: {
            userId: verifiedBy,
            module: 'support',
            action: 'CLIENT_VERIFIED',
            entityId: clientId,
            entityType: 'CLIENT',
            description: `Client ${client.company.name} verified by support team`,
            metadata: {
              clientId,
              companyId: client.companyId,
              companyName: client.company.name,
              remarks,
              verifiedBy,
            },
            ipAddress: 'SYSTEM', // Since this is a system action
            userAgent: 'SYSTEM',
          },
        });
      });

      // Fetch the updated company to get the verification status
      const updatedCompany = await this.prisma.company.findUnique({
        where: { id: client.companyId },
        select: {
          id: true,
          name: true,
          status: true,
        },
      });

      if (!updatedCompany) {
        throw new AppError(
          'Failed to fetch updated company',
          500,
          ErrorCode.INTERNAL_SERVER_ERROR
        );
      }

      logger.info({
        message: 'Client verification completed successfully',
        context: 'SupportClientService.verifyClient',
        clientId,
        verifiedBy,
      });

      return {
        clientId,
        companyId: client.companyId,
        companyName: updatedCompany.name,
        verificationStatus: updatedCompany.status as ICompanyVerificationStatus,
        message: 'Client verified successfully',
        verifiedAt: new Date(),
        verifiedBy,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to verify client',
        context: 'SupportClientService.verifyClient',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        verifiedBy,
        remarks,
      });
      throw error;
    }
  }

  async getClientsByAccountManagerId(
    accountManagerId: string,
    paginationRequest: IPaginationRequest,
    filter: ISupportClientFilterQueryCompanyId
  ): Promise<IPaginatedResponse<ISupportClientListResponse>> {
    try {
      logger.info({
        message: 'Starting to get clients by account manager ID',
        context: 'SupportClientService.getClientsByAccountManagerId',
        accountManagerId,
        filter,
      });

      // Get pagination info with correct default sort field for client_account_manager_assignment
      const page = paginationRequest.page ?? 1;
      const limit = paginationRequest.limit ?? 10;
      const sortBy = paginationRequest.sortBy ?? 'assignedAt'; // Use assignedAt instead of createdAt
      const sortOrder = paginationRequest.sortOrder ?? 'desc';

      const paginationInfo = {
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      };

      // Extract search filters
      const { search, searchColumns = [] } = paginationRequest;
      const effectiveSearchColumns =
        searchColumns.length > 0
          ? searchColumns
          : search
            ? ['client.company.name', 'client.company.contactEmail']
            : [];

      // Build where clause for account manager assignment
      const where: any = {
        accountManagerId,
      };

      // Add client filters
      if (filter.companyId) {
        where.client = {
          ...(where.client || {}),
          companyId: filter.companyId,
        };
      }

      // Add company filters
      if (
        filter.industry ||
        filter.size ||
        filter.stage ||
        filter.status ||
        filter.companyType ||
        filter.foundedYear ||
        filter.website
      ) {
        where.client = {
          ...(where.client || {}),
          company: {},
        };

        if (filter.industry) {
          const industries = filter.industry.split(',').map((i) => i.trim());
          where.client.company.industry = { in: industries };
        }

        if (filter.size) {
          where.client.company.size = filter.size;
        }

        if (filter.stage) {
          where.client.company.stage = filter.stage;
        }

        if (filter.status) {
          where.client.company.status = filter.status;
        }

        if (filter.companyType) {
          where.client.company.companyType = filter.companyType;
        }

        if (filter.foundedYear) {
          where.client.company.foundedYear = filter.foundedYear;
        }

        if (filter.website) {
          where.client.company.website = filter.website;
        }
      }

      // Handle search filters
      if (search && effectiveSearchColumns.length > 0) {
        const companyConditions: any[] = [];

        for (const col of effectiveSearchColumns) {
          if (col.startsWith('client.company.')) {
            const [, , field] = col.split('.');
            companyConditions.push({
              [field]: {
                contains: search,
                mode: 'insensitive',
              },
            });
          }
        }

        if (companyConditions.length > 0) {
          where.client = {
            ...(where.client || {}),
            company: {
              ...(where.client?.company || {}),
              OR: companyConditions,
            },
          };
        }
      }

      // Count total for pagination
      const total = await this.prisma.client_account_manager_assignment.count({
        where,
      });

      // Fetch paginated client assignments
      const clientAssignments =
        await this.prisma.client_account_manager_assignment.findMany({
          where,
          skip: paginationInfo.skip,
          take: paginationInfo.take,
          orderBy: paginationInfo.orderBy,
          include: {
            client: {
              include: {
                company: true,
                _count: {
                  select: {
                    clientUsers: true,
                    jobPostings: true,
                    documents: true,
                  },
                },
                financialData: {
                  select: { id: true },
                },
              },
            },
          },
        });

      // Map result to response DTO
      const items: ISupportClientListResponse[] = clientAssignments.map(
        (assignment) => ({
          id: assignment.client.id,
          companyId: assignment.client.companyId,
          companyName: assignment.client.company?.name || '',
          contactEmail: assignment.client.company?.contactEmail || '',
          industry: assignment.client.company?.industry || '',
          size: assignment.client.company?.size || '',
          status: assignment.client.company?.status || '',
          createdAt: assignment.client.createdAt.toISOString(),
          userCount: assignment.client._count?.clientUsers || 0,
          jobPostingsCount: assignment.client._count?.jobPostings || 0,
          documentsCount: assignment.client._count?.documents || 0,
          hasFinancialData: !!assignment.client.financialData,
        })
      );

      // Return paginated response
      return {
        items,
        pagination: {
          total,
          page: Math.floor(paginationInfo.skip / paginationInfo.take) + 1,
          limit: paginationInfo.take,
          totalPages: Math.ceil(total / paginationInfo.take),
        },
      };
    } catch (error) {
      logger.error({
        message: 'Failed to get clients by account manager id',
        context: 'SupportClientService.getClientsByAccountManagerId',
        error: error instanceof Error ? error.message : 'Unknown error',
        accountManagerId,
        filter,
      });
      throw error;
    }
  }

  /**
   * Get integration provider details by ID
   */
  async getIntegrationProviderDetails(
    integrationProviderId: string
  ): Promise<any> {
    try {
      logger.info({
        message: 'Getting integration provider details',
        context: 'SupportClientService.getIntegrationProviderDetails',
        integrationProviderId,
      });

      const integrationProvider =
        await this.prisma.integration_provider.findUnique({
          where: { id: integrationProviderId },
          include: {
            clientIntegrations: {
              include: {
                client: {
                  include: {
                    company: true,
                  },
                },
              },
            },
          },
        });

      if (!integrationProvider) {
        throw new AppError(
          'Integration provider not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      return {
        id: integrationProvider.id,
        name: integrationProvider.name,
        description: integrationProvider.description,
        type: integrationProvider.type,
        logoUrl: integrationProvider.logoUrl,
        websiteUrl: integrationProvider.websiteUrl,
        isActive: integrationProvider.isActive,
        metadata: integrationProvider.metadata,
        createdAt: integrationProvider.createdAt,
        updatedAt: integrationProvider.updatedAt,
        clientIntegrations: integrationProvider.clientIntegrations.map(
          (integration) => ({
            id: integration.id,
            clientId: integration.clientId,
            clientName: integration.client.company.name,
            clientEmail: integration.client.company.contactEmail,
            name: integration.name,
            description: integration.description,
            status: integration.status,
            lastSyncAt: integration.lastSyncAt,
            createdAt: integration.createdAt,
          })
        ),
      };
    } catch (error) {
      logger.error({
        message: 'Failed to get integration provider details',
        context: 'SupportClientService.getIntegrationProviderDetails',
        error: error instanceof Error ? error.message : 'Unknown error',
        integrationProviderId,
      });
      throw error;
    }
  }

  /**
   * Get client integrations by client ID
   */
  async getClientIntegrations(clientId: string): Promise<any[]> {
    try {
      logger.info({
        message: 'Getting client integrations',
        context: 'SupportClientService.getClientIntegrations',
        clientId,
      });

      // Verify client exists
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
        include: {
          company: true,
        },
      });

      if (!client) {
        throw new AppError('Client not found', 404, ErrorCode.NOT_FOUND);
      }

      const clientIntegrations = await this.prisma.client_integration.findMany({
        where: { clientId },
        include: {
          provider: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return clientIntegrations.map((integration) => ({
        id: integration.id,
        clientId: integration.clientId,
        clientName: client.company.name,
        integrationProviderId: integration.providerId,
        integrationProviderName: integration.provider.name,
        integrationProviderType: integration.provider.type,
        name: integration.name,
        description: integration.description,
        status: integration.status,
        config: integration.config,
        autoSyncEnabled: integration.autoSyncEnabled,
        lastSyncAt: integration.lastSyncAt,
        lastError: integration.lastError,
        errorCount: integration.errorCount,
        createdAt: integration.createdAt,
        updatedAt: integration.updatedAt,
      }));
    } catch (error) {
      logger.error({
        message: 'Failed to get client integrations',
        context: 'SupportClientService.getClientIntegrations',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
      });
      throw error;
    }
  }

  /**
   * Generate or rotate the primary MCP API key for a client (support-managed).
   * - If a primary MCP client already exists for the tenant, rotates its key
   * - Otherwise, creates a new MCP client with default scopes and returns its key
   */
  async generateOrRotateClientMcpKey(
    clientId: string,
    supportUserId: string
  ): Promise<IMcpClientWithApiKey> {
    // Verify client exists (and fetch company email for optional contact info)
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      include: { company: true },
    });

    if (!client) {
      throw new AppError('Client not found', 404, ErrorCode.NOT_FOUND);
    }

    // Locate existing support-managed "primary" MCP client for this tenant
    const existingPrimary = await this.prisma.mcp_client.findFirst({
      where: {
        clientId,
        name: SupportClientService.DEFAULT_MCP_CLIENT_NAME,
        sourceSystem: SupportClientService.DEFAULT_MCP_SOURCE_SYSTEM,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingPrimary) {
      return await mcpClientService.regenerateApiKey(
        clientId,
        existingPrimary.id
      );
    }

    const defaultScopes = Object.values(MCP_SCOPES) as McpScope[];

    return await mcpClientService.createMcpClient(
      clientId,
      {
        name: SupportClientService.DEFAULT_MCP_CLIENT_NAME,
        description: 'Primary MCP API key (support-managed)',
        scopes: defaultScopes,
        sourceSystem: SupportClientService.DEFAULT_MCP_SOURCE_SYSTEM,
        contactEmail: client.company?.contactEmail || undefined,
        metadata: {
          isPrimary: true,
          createdBy: 'support',
        },
      },
      supportUserId
    );
  }
}
