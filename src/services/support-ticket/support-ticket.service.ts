import { PrismaClient } from '@prisma/client';
import {
  ISupportTicket,
  ISupportTicketCreate,
  ISupportTicketUpdate,
  ISupportTicketFilter,
  ISupportTicketSort,
  ISupportTicketPagination,
  ISupportTicketListItemResponse,
  ISupportTicketStatusChangeResponse,
  ISupportTicketPriorityChange,
  ISupportTicketComment,
  ISupportTicketCommentCreateRequest,
  ISupportTicketAuthor,
  ISupportTicketRcaRequest,
  ISupportTicketRcaResponse,
  ISupportTicketResolutionRequest,
  ISupportTicketResolutionResponse,
} from '@/shared/models/domain/support-ticket/support-ticket.domain';
import {
  SupportTicketStatusEnum,
  SupportTicketPriorityEnum,
  SupportTicketEntityTypeEnum,
  SupportTicketCategoryEnum,
  SupportTicketTypeEnum,
  SupportTicketAssignmentStatusEnum,
  UserTypeEnum,
  UserRoleEnum,
} from '@/shared/models/common/enums';
import { singleton } from '@/shared/decorators/singleton';
import { logger } from '@/shared/utils/logger';
import { SlaPolicyService } from './sla-policy.service';
import { ISlaPolicyMatchCriteria } from '@/shared/models/domain/support-ticket/sla-policy.domain';
import { INotificationProvider } from '@/services/notification/notification.interface';
import { NotificationFactory } from '@/services/notification/notification.factory';
import { ENV } from '@/config/env';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { StorageFactory } from '../helpers/storage/storage.factory';
import { v4 as uuidv4 } from 'uuid';
import { ISupportTicketListApiResponse } from '@/shared/models/api/support-ticket/support-ticket.api';
import { IPaginatedResponse } from '@/shared/models/api/common/common.api';
import { IAuthUser } from '@/shared/models/domain/auth/auth.user.domain';
import { SupportTicketActivityService } from './support-ticket-activity.service';
import {
  buildQueryConditions,
  ISearchConfig,
  IFilterConfig,
  ISortConfig,
} from '@/utils/pagination';
import { IPaginationRequest } from '@/shared/models/api/common/common.api';
import {
  ISupportTicketStatistics,
  ISupportTicketStatisticsFilter,
  ISupportTicketStatisticsOverview,
  ISupportTicketEntityTypeBreakdown,
  ISupportTicketStatusBreakdown,
  ISupportTicketCategoryBreakdown,
  ISupportTicketAssignmentBreakdown,
  ISupportTicketPerformanceMetrics,
  ISupportTicketSlaMetrics,
  ISupportTicketTrends,
  ISupportTicketTimeDistribution,
  ISupportTicketSupportTeamMetrics,
  ISupportTicketEntityBreakdown,
  ISupportTicketAssignmentSummary,
  ISupportTicketDailyTrendData,
  ISupportTicketPriorityBreakdown,
  IEntityTicketSummary,
} from '@/shared/models/domain/support-ticket/support-ticket-statistics.domain';
import { formatEnumValue } from '@/shared/utils/support-ticket.utils';

/**
 * Support Ticket Service
 * Handles all CRUD operations for support tickets
 */
@singleton
export class SupportTicketService {
  private readonly prisma: PrismaClient;
  private readonly slaPolicyService: SlaPolicyService;
  private readonly notificationProvider: INotificationProvider;
  private readonly storageService: any;
  private readonly supportTicketActivityService: SupportTicketActivityService;

  constructor() {
    this.prisma = new PrismaClient();
    this.slaPolicyService = new SlaPolicyService();
    this.notificationProvider =
      new NotificationFactory().getNotificationProvider();
    // Initialize storage service
    this.storageService = StorageFactory.getInstance().getProvider();
    this.supportTicketActivityService = new SupportTicketActivityService();
  }

  // Filter configuration for support tickets
  private readonly searchConfig: ISearchConfig = {
    searchableFields: [
      'title',
      'description',
      'ticketNumber',
      'assignmentNote',
    ],
  };

  private readonly filterConfig: IFilterConfig = {
    allowedFields: [
      'status',
      'assignmentStatus',
      'priority',
      'category',
      'subcategory',
      'ticketType',
      'entityType',
      'createdById',
      'assignedUserId',
      'assignmentNote',
      'targetId',
      'targetType',
      'tags',
      'isSlaBreach',
      'isBacklog',
      'isDeleted',
      'createdFrom',
      'createdTo',
      'dueFrom',
      'dueTo',
    ],
    enumFields: [
      'status',
      'assignmentStatus',
      'priority',
      'category',
      'subcategory',
      'ticketType',
      'entityType',
    ],
    booleanFields: ['isSlaBreach', 'isBacklog', 'isDeleted'],
    arrayFields: ['tags'],
  };

  private readonly sortConfig: ISortConfig = {
    allowedFields: [
      'createdAt',
      'updatedAt',
      'priority',
      'status',
      'assignmentStatus',
      'title',
      'ticketNumber',
      'dueDate',
      'assignmentNote',
    ],
    defaultSort: { field: 'createdAt', order: 'desc' },
  };

  /**
   * Create a new support ticket
   */
  async createTicket(
    ticketData: ISupportTicketCreate,
    createdById: string,
    userAgent?: string,
    attachments?: Express.Multer.File[]
  ): Promise<ISupportTicket> {
    try {
      // Get user details for audit log
      const createdByUser = await this.prisma.user.findUnique({
        where: { id: createdById },
        select: { id: true, name: true, email: true, type: true },
      });

      // Generate ticket number
      const ticketNumber = await this.generateTicketNumber();
      const sequenceNumber = await this.getNextSequenceNumber();

      const {
        subcategory,
        priority,
        ...ticketDataWithoutSubcategoryAndPriority
      } = ticketData;

      // Determine priority from SLA policy instead of manual input
      const determinedPriority =
        await this.slaPolicyService.determinePriorityFromSlaPolicy(
          ticketData.entityType,
          ticketData.category
        );

      // Automatically determine ticket type based on category and subcategory
      const determinedTicketType = this.determineTicketType(
        ticketData.category,
        ticketData.subcategory
      );

      const createData = {
        ...ticketDataWithoutSubcategoryAndPriority,
        createdById,
        ticketNumber,
        sequenceNumber,
        priority: determinedPriority, // Use determined priority instead of manual input
        status: SupportTicketStatusEnum.NEW,
        assignmentStatus: SupportTicketAssignmentStatusEnum.UNASSIGNED, // Always UNASSIGNED initially
        assignmentNote: ticketData.assignmentNote, // Include assignment note if provided
        tags: ticketData.tags || [],
        isBacklog: ticketData.isBacklog || false,
        subCategory: subcategory,
        ticketType: determinedTicketType, // Use automatically determined ticket type
      };

      const ticket = await this.prisma.support_ticket.create({
        data: createData,
        include: {
          createdBy: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          escalatedToUser: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          escalatedByUser: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          slaPolicy: true,
          chatConversation: true,
          attachments: true,
          comments: {
            where: {
              isDeleted: false,
            },
            orderBy: {
              createdAt: 'asc',
            },
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      // Auto-assign SLA policy if not already assigned
      if (!ticketData.slaPolicyId) {
        try {
          const criteria: ISlaPolicyMatchCriteria = {
            entityType:
              ticketData.entityType || SupportTicketEntityTypeEnum.SUPPORT,
            category: ticketData.category || SupportTicketCategoryEnum.GENERAL,
            priority: determinedPriority, // Use determined priority for SLA policy matching
          };

          const slaAssignment =
            await this.slaPolicyService.autoAssignPolicyToTicket(
              ticket.id,
              criteria
            );

          if (slaAssignment && slaAssignment.data) {
            logger.info('SLA policy auto-assigned to ticket', {
              ticketId: ticket.id,
              policyId: slaAssignment.data.policyId,
              slaBreachAt: slaAssignment.data.slaBreachAt,
              determinedPriority: determinedPriority,
            });
          }
        } catch (slaError) {
          // Log SLA assignment error but don't fail ticket creation
          logger.error('Failed to auto-assign SLA policy to ticket', {
            error: slaError,
            ticketId: ticket.id,
            criteria: {
              entityType: ticketData.entityType,
              category: ticketData.category,
              priority: determinedPriority,
            },
          });
        }
      }

      // Create comprehensive audit log
      await this.supportTicketActivityService.createAuditLog({
        ticketId: ticket.id,
        action: 'create',
        entityType: 'ticket',
        entityId: ticket.id,
        newData: ticket,
        performedById: createdById,
        userAgent,
        metadata: {
          description: `${createdByUser?.name || 'Unknown User'} (${createdByUser?.email}) created a new support ticket "${ticket.title}"`,
          ticketNumber: ticket.ticketNumber,
          sequenceNumber: ticket.sequenceNumber,
          category: ticket.category,
          subcategory: ticket.subCategory,
          priority: ticket.priority,
          ticketType: ticket.ticketType,
          entityType: ticket.entityType,
          targetId: ticket.targetId,
          targetType: ticket.targetType,
          assignedUserId: ticket.assignedUserId,
          slaPolicyId: ticket.slaPolicyId,
          tags: ticket.tags,
          isBacklog: ticket.isBacklog,
          attachmentCount: attachments?.length || 0,
          userType: createdByUser?.type,
          timestamp: new Date().toISOString(),
          actionDetails: {
            what: 'Created new support ticket',
            who: createdByUser?.name || 'Unknown User',
            when: new Date().toISOString(),
            context: `Ticket #${ticket.ticketNumber} for ${ticket.category} category`,
            priorityDetermined: determinedPriority,
            ticketTypeDetermined: determinedTicketType,
            originalPriority: priority,
          },
        },
      });

      logger.info('Support ticket created successfully', {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        createdById,
        determinedPriority,
        originalPriority: priority, // Log the original priority if provided
      });

      // Process file uploads if attachments are provided
      if (attachments && attachments.length > 0) {
        logger.info('Processing file uploads for support ticket', {
          ticketId: ticket.id,
          fileCount: attachments.length,
        });

        for (const file of attachments) {
          try {
            // Upload file directly to support ticket attachments folder
            const documentId = uuidv4();
            const fileExtension = this.getFileExtension(file.originalname);
            const uniqueFileName = `${documentId}_${Date.now()}${fileExtension}`;

            // Use support ticket attachments folder path
            const folderPath = `support/tickets/${ticket.id}/attachments`;
            const filePath = `${folderPath}/${uniqueFileName}`;

            // Upload file directly to storage
            const uploadedUrl = await this.storageService.uploadFile(
              file.buffer,
              filePath
            );

            // Create support ticket attachment entry
            await this.prisma.support_ticket_attachment.create({
              data: {
                ticketId: ticket.id,
                uploadedById: createdById,
                fileName: file.originalname,
                originalName: file.originalname,
                filePath: filePath,
                fileSize: file.size,
                mimeType: file.mimetype,
                isPublic: false,
                isInternal: false,
                tags: [],
                isEncrypted: false,
                isProcessed: true,
                processedAt: new Date(),
                processingStatus: 'completed',
              },
            });

            // Create audit log for file upload
            await this.supportTicketActivityService.createAuditLog({
              ticketId: ticket.id,
              action: 'attachment_upload',
              entityType: 'attachment',
              entityId: documentId,
              performedById: createdById,
              userAgent,
              metadata: {
                description: `${createdByUser?.name || 'Unknown User'} uploaded attachment "${file.originalname}" to ticket #${ticket.ticketNumber}`,
                fileName: file.originalname,
                fileSize: file.size,
                mimeType: file.mimetype,
                filePath: filePath,
                documentId: documentId,
                uploadUrl: uploadedUrl,
                timestamp: new Date().toISOString(),
                actionDetails: {
                  what: 'Uploaded file attachment',
                  who: createdByUser?.name || 'Unknown User',
                  when: new Date().toISOString(),
                  context: `File: ${file.originalname} (${this.formatFileSize(file.size)})`,
                  fileType: file.mimetype,
                },
              },
            });

            logger.info('File uploaded successfully to support ticket folder', {
              documentId: documentId,
              fileName: file.originalname,
              fileSize: file.size,
              filePath: uploadedUrl,
            });
          } catch (error) {
            logger.error('Failed to upload file', {
              error,
              fileName: file.originalname,
              fileSize: file.size,
            });
            // Continue with other files even if one fails
          }
        }
      }

      // Fetch the updated ticket with SLA information
      const updatedTicket = await this.getTicketById(ticket.id);
      const finalTicket = updatedTicket || (await this.mapDataToDomain(ticket));

      // Send email notification if ticket is assigned to a support user
      if (ticketData.assignedUserId) {
        try {
          const assignedSupportUser = await this.prisma.support_user.findUnique(
            {
              where: { id: ticketData.assignedUserId },
              include: {
                user: true,
              },
            }
          );

          const assignedByUser = await this.prisma.user.findUnique({
            where: { id: createdById },
          });

          if (
            assignedSupportUser &&
            assignedSupportUser.user &&
            assignedByUser
          ) {
            await this.sendTicketCreationEmail(
              ticket,
              assignedSupportUser.user,
              assignedByUser
            );
          }
        } catch (emailError) {
          logger.error('Failed to send ticket creation email', {
            error: emailError,
            ticketId: ticket.id,
            assignedUserId: ticketData.assignedUserId,
          });
          // Don't throw error - email failure shouldn't break ticket creation
        }
      }

      return finalTicket;
    } catch (error) {
      logger.error('Failed to create support ticket', {
        error,
        ticketData,
        createdById,
      });
      throw error;
    }
  }

  /**
   * Get a support ticket by ID
   */
  async getTicketById(ticketId: string): Promise<ISupportTicket | null> {
    try {
      const ticket = await this.prisma.support_ticket.findFirst({
        where: {
          id: ticketId,
          isDeleted: false,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          slaPolicy: true,
          escalatedToUser: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          escalatedByUser: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          chatConversation: true,
          auditLogs: true,
          attachments: true,
          rcaCompletedByUser: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      if (!ticket) {
        return null;
      }

      return await this.mapDataToDomain(ticket);
    } catch (error) {
      logger.error('Failed to get support ticket by ID', {
        error,
        ticketId,
      });
      throw error;
    }
  }

  async createCandidateSupportTicket() {}

  /**
   * Update a support ticket
   */
  async updateTicket(
    ticketId: string,
    updateData: ISupportTicketUpdate,
    updatedById: string,
    userAgent?: string
  ): Promise<ISupportTicket> {
    try {
      // Get user details for audit log
      const updatedByUser = await this.prisma.user.findUnique({
        where: { id: updatedById },
        select: { id: true, name: true, email: true, type: true, role: true },
      });

      // Get current ticket data for audit log
      const currentTicket = await this.prisma.support_ticket.findUnique({
        where: { id: ticketId },
      });

      if (!currentTicket) {
        throw new Error('Support ticket not found');
      }

      // Map subcategory to subCategory for Prisma schema if present
      const prismaUpdateData = {
        ...updateData,
        ...(updateData.subcategory !== undefined && {
          subCategory: updateData.subcategory,
        }),
      };

      // Remove subcategory from the data to avoid conflicts
      delete prismaUpdateData.subcategory;

      const updatedTicket = await this.prisma.support_ticket.update({
        where: { id: ticketId },
        data: prismaUpdateData,
        include: {
          createdBy: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          escalatedToUser: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          escalatedByUser: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          slaPolicy: true,
          chatConversation: true,
          attachments: true,
          comments: {
            where: {
              isDeleted: false,
            },
            orderBy: {
              createdAt: 'asc',
            },
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      // Identify changed fields for detailed audit log
      const changedFields = this.getChangedFields(currentTicket, updatedTicket);
      const changeDescriptions = this.generateChangeDescriptions(
        changedFields,
        currentTicket,
        updatedTicket
      );

      // Create comprehensive audit log
      await this.supportTicketActivityService.createAuditLog({
        ticketId: ticketId,
        action: 'update',
        entityType: 'ticket',
        entityId: ticketId,
        oldData: currentTicket,
        newData: updatedTicket,
        performedById: updatedById,
        userAgent,
        metadata: {
          description: `${updatedByUser?.name || 'Unknown User'} (${updatedByUser?.email}) updated ticket #${currentTicket.ticketNumber}`,
          ticketNumber: currentTicket.ticketNumber,
          changedFields: changedFields,
          changeDescriptions: changeDescriptions,
          userType: updatedByUser?.type,
          timestamp: new Date().toISOString(),
          actionDetails: {
            what: 'Updated support ticket details',
            who: updatedByUser?.name || 'Unknown User',
            when: new Date().toISOString(),
            context: `Ticket #${currentTicket.ticketNumber}: ${currentTicket.title}`,
            changes: changeDescriptions,
            fieldsModified: changedFields.length,
          },
        },
      });

      logger.info('Support ticket updated successfully', {
        ticketId,
        updatedById,
        changedFields: changedFields,
      });

      return await this.mapDataToDomain(updatedTicket);
    } catch (error) {
      logger.error('Failed to update support ticket', {
        error,
        ticketId,
        updateData,
        updatedById,
      });
      throw error;
    }
  }

  /**
   * Delete a support ticket (soft delete)
   */
  async deleteTicket(
    ticketId: string,
    deletedById: string,
    userAgent?: string
  ): Promise<void> {
    try {
      // Get user details for audit log
      const deletedByUser = await this.prisma.user.findUnique({
        where: { id: deletedById },
        select: { id: true, name: true, email: true, type: true },
      });

      const ticket = await this.prisma.support_ticket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) {
        throw new Error('Support ticket not found');
      }

      await this.prisma.support_ticket.update({
        where: { id: ticketId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      // Create comprehensive audit log
      await this.supportTicketActivityService.createAuditLog({
        ticketId: ticketId,
        action: 'delete',
        entityType: 'ticket',
        entityId: ticketId,
        oldData: ticket,
        performedById: deletedById,
        userAgent,
        metadata: {
          description: `${deletedByUser?.name || 'Unknown User'} (${deletedByUser?.email}) deleted ticket #${ticket.ticketNumber}`,
          ticketNumber: ticket.ticketNumber,
          ticketTitle: ticket.title,
          ticketStatus: ticket.status,
          ticketPriority: ticket.priority,
          userType: deletedByUser?.type,
          timestamp: new Date().toISOString(),
          actionDetails: {
            what: 'Deleted support ticket',
            who: deletedByUser?.name || 'Unknown User',
            when: new Date().toISOString(),
            context: `Ticket #${ticket.ticketNumber}: ${ticket.title}`,
            deletionType: 'soft_delete',
            finalStatus: ticket.status,
            finalPriority: ticket.priority,
          },
        },
      });

      logger.info('Support ticket deleted successfully', {
        ticketId,
        deletedById,
        ticketNumber: ticket.ticketNumber,
      });
    } catch (error) {
      logger.error('Failed to delete support ticket', {
        error,
        ticketId,
        deletedById,
      });
      throw error;
    }
  }

  /**
   * List support tickets with filtering, sorting, and pagination
   */
  async listTickets(
    filters: ISupportTicketFilter = {},
    sort: ISupportTicketSort = { field: 'createdAt', direction: 'desc' },
    pagination: ISupportTicketPagination = { page: 1, limit: 20 }
  ): Promise<ISupportTicketListApiResponse> {
    try {
      // Convert to pagination request format
      const paginationRequest: IPaginationRequest = {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
        sortBy: sort.field,
        sortOrder: sort.direction,
      };

      // Build query conditions using the utility
      const queryConditions = buildQueryConditions(filters, paginationRequest, {
        search: this.searchConfig,
        filter: this.filterConfig,
        sort: this.sortConfig,
      });

      const [tickets, total] = await Promise.all([
        this.prisma.support_ticket.findMany({
          where: queryConditions.where,
          orderBy: queryConditions.orderBy,
          skip: queryConditions.skip,
          take: queryConditions.take,
          include: {
            createdBy: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
            assignedTo: {
              select: {
                id: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
            escalatedToUser: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
            escalatedByUser: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
            slaPolicy: true,
            chatConversation: true,
            attachments: true,
            comments: {
              where: {
                isDeleted: false,
              },
              orderBy: {
                createdAt: 'asc',
              },
              include: {
                author: {
                  select: {
                    id: true,
                    email: true,
                    name: true,
                  },
                },
              },
            },
          },
        }),
        this.prisma.support_ticket.count({ where: queryConditions.where }),
      ]);

      const totalPages = Math.ceil(total / queryConditions.pagination.limit);

      const items = await Promise.all(
        tickets.map((ticket) => this.mapTicketListItemDataToDomain(ticket))
      );

      const paginatedData: IPaginatedResponse<ISupportTicketListItemResponse> =
        {
          items,
          pagination: {
            total,
            page: queryConditions.pagination.page,
            limit: queryConditions.pagination.limit,
            totalPages,
          },
        };

      return {
        items: paginatedData.items,
        pagination: paginatedData.pagination,
      };
    } catch (error) {
      logger.error('Failed to list support tickets', {
        error,
        filters,
        sort,
        pagination,
      });
      throw error;
    }
  }
  /**
   * Get support tickets created by a specific user
   */
  async getTicketsByUserId(
    userId: string,
    filters: Omit<ISupportTicketFilter, 'createdById'> = {},
    sort: ISupportTicketSort = { field: 'createdAt', direction: 'desc' },
    pagination: ISupportTicketPagination = { page: 1, limit: 20 }
  ): Promise<ISupportTicketListApiResponse | null> {
    try {
      // Verify user exists and has created tickets
      const userTickets = await this.prisma.support_ticket.findFirst({
        where: { createdById: userId },
        select: { createdById: true },
      });
      if (!userTickets) {
        logger.error('User not found or has no tickets', { userId });
        return null;
      }

      // Convert to pagination request format
      const paginationRequest: IPaginationRequest = {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
        sortBy: sort.field,
        sortOrder: sort.direction,
      };

      // Add createdById to filters
      const filterWithUserId = {
        ...filters,
        createdById: userId,
        isDeleted: false, // Ensure we don't get deleted tickets
      };

      // Build query conditions using the utility
      const queryConditions = buildQueryConditions(
        filterWithUserId,
        paginationRequest,
        {
          search: this.searchConfig,
          filter: this.filterConfig,
          sort: this.sortConfig,
        }
      );

      const [result, total] = await Promise.all([
        this.prisma.support_ticket.findMany({
          where: queryConditions.where,
          orderBy: queryConditions.orderBy,
          skip: queryConditions.skip,
          take: queryConditions.take,
          include: {
            createdBy: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
            assignedTo: {
              select: {
                id: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
            slaPolicy: true,
            attachments: true,
            comments: {
              where: {
                isDeleted: false,
              },
              orderBy: {
                createdAt: 'asc',
              },
              include: {
                author: {
                  select: {
                    id: true,
                    email: true,
                    name: true,
                  },
                },
              },
            },
          },
        }),
        this.prisma.support_ticket.count({ where: queryConditions.where }),
      ]);

      const totalPages = Math.ceil(total / queryConditions.pagination.limit);

      const items = await Promise.all(
        result.map((t) => this.mapTicketListItemDataToDomain(t))
      );

      const paginatedData: IPaginatedResponse<ISupportTicketListItemResponse> =
        {
          items,
          pagination: {
            total,
            page: queryConditions.pagination.page,
            limit: queryConditions.pagination.limit,
            totalPages,
          },
        };

      return {
        items: paginatedData.items,
        pagination: paginatedData.pagination,
      };
    } catch (error) {
      logger.error('Failed to get support tickets by user ID', {
        error,
        userId,
        filters,
        sort,
        pagination,
      });
      throw error;
    }
  }

  /**
   * Get support tickets assigned to a specific support user
   */
  async getTicketsAssignedToUserId(
    assignedUserId: string,
    filters: Omit<ISupportTicketFilter, 'assignedUserId'> = {},
    sort: ISupportTicketSort = { field: 'createdAt', direction: 'desc' },
    pagination: ISupportTicketPagination = { page: 1, limit: 20 }
  ): Promise<ISupportTicketListApiResponse> {
    try {
      // Verify support user exists
      const supportUser = await this.prisma.support_user.findUnique({
        where: { id: assignedUserId },
        select: { id: true },
      });
      if (!supportUser) throw new Error('Support user not found');

      // Convert to pagination request format
      const paginationRequest: IPaginationRequest = {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
        sortBy: sort.field,
        sortOrder: sort.direction,
      };

      // Add assignedUserId to filters
      const filterWithAssignedUserId = {
        ...filters,
        assignedUserId: assignedUserId,
        isDeleted: false, // Ensure we don't get deleted tickets
      };

      // Build query conditions using the utility
      const queryConditions = buildQueryConditions(
        filterWithAssignedUserId,
        paginationRequest,
        {
          search: this.searchConfig,
          filter: this.filterConfig,
          sort: this.sortConfig,
        }
      );

      const [result, total] = await Promise.all([
        this.prisma.support_ticket.findMany({
          where: queryConditions.where,
          orderBy: queryConditions.orderBy,
          skip: queryConditions.skip,
          take: queryConditions.take,
          include: {
            createdBy: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
            assignedTo: {
              select: {
                id: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
            slaPolicy: true,
            attachments: true,
            comments: {
              where: {
                isDeleted: false,
              },
              orderBy: {
                createdAt: 'asc',
              },
              include: {
                author: {
                  select: {
                    id: true,
                    email: true,
                    name: true,
                  },
                },
              },
            },
          },
        }),
        this.prisma.support_ticket.count({ where: queryConditions.where }),
      ]);

      const totalPages = Math.ceil(total / queryConditions.pagination.limit);

      const items = await Promise.all(
        result.map((t) => this.mapTicketListItemDataToDomain(t))
      );

      const paginatedData: IPaginatedResponse<ISupportTicketListItemResponse> =
        {
          items,
          pagination: {
            total,
            page: queryConditions.pagination.page,
            limit: queryConditions.pagination.limit,
            totalPages,
          },
        };

      return {
        items: paginatedData.items,
        pagination: paginatedData.pagination,
      };
    } catch (error) {
      logger.error('Failed to get support tickets assigned to user ID', {
        error,
        assignedUserId,
        filters,
        sort,
        pagination,
      });
      throw error;
    }
  }

  /**
   * Assign a support ticket to a user and send notification email
   */
  async assignTicket(
    ticketId: string,
    assignedUserId: string,
    assignedByUserId: string,
    assignmentNote?: string,
    userAgent?: string
  ): Promise<ISupportTicket> {
    try {
      // Get user details for audit log
      const assignedByUser = await this.prisma.user.findUnique({
        where: { id: assignedByUserId },
        select: { id: true, name: true, email: true, type: true },
      });

      const currentTicket = await this.prisma.support_ticket.findUnique({
        where: { id: ticketId },
        include: {
          createdBy: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          attachments: true,
        },
      });

      if (!currentTicket) {
        throw new AppError(
          'Support ticket not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Get assigned user details
      const assignedUser = await this.prisma.support_user.findUnique({
        where: { id: assignedUserId },
        include: {
          user: true,
        },
      });

      if (!assignedUser || !assignedUser.user) {
        throw new AppError('Support user not found', 404, ErrorCode.NOT_FOUND);
      }

      if (!assignedByUser) {
        throw new AppError(
          'Assigned by user not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Determine if this is a reassignment or initial assignment
      const isReassignment =
        currentTicket.assignedUserId &&
        currentTicket.assignedUserId !== assignedUserId;

      // Determine the appropriate assignment status
      let assignmentStatus: SupportTicketAssignmentStatusEnum;
      if (isReassignment) {
        assignmentStatus = SupportTicketAssignmentStatusEnum.REASSIGNED;
      } else if (
        currentTicket.assignmentStatus ===
        SupportTicketAssignmentStatusEnum.UNASSIGNED
      ) {
        assignmentStatus = SupportTicketAssignmentStatusEnum.ASSIGNED;
      } else {
        assignmentStatus = SupportTicketAssignmentStatusEnum.REASSIGNED;
      }

      // Determine the appropriate ticket status
      let ticketStatus: SupportTicketStatusEnum;
      if (currentTicket.status === SupportTicketStatusEnum.NEW) {
        // If ticket is NEW, change to IN_PROGRESS when assigned
        ticketStatus = SupportTicketStatusEnum.IN_PROGRESS;
      } else if (
        currentTicket.status === SupportTicketStatusEnum.CLOSED ||
        currentTicket.status === SupportTicketStatusEnum.RESOLVED
      ) {
        // If ticket was closed/resolved, reopen it
        ticketStatus = SupportTicketStatusEnum.REOPENED;
      } else {
        ticketStatus = currentTicket.status as SupportTicketStatusEnum;
      }

      const updatedTicket = await this.prisma.support_ticket.update({
        where: { id: ticketId },
        data: {
          assignedUserId,
          assignmentStatus,
          status: ticketStatus,
          assignmentNote, // Include the assignment note
        },
        include: {
          createdBy: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          escalatedToUser: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          escalatedByUser: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          slaPolicy: true,
          chatConversation: true,
          attachments: true,
          comments: {
            where: {
              isDeleted: false,
            },
            orderBy: {
              createdAt: 'asc',
            },
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      // Create comprehensive audit log
      await this.supportTicketActivityService.createAuditLog({
        ticketId: ticketId,
        action: 'assign',
        entityType: 'assignment',
        fieldChanged: 'assignedUserId',
        oldValue: currentTicket.assignedUserId || null,
        newValue: assignedUserId,
        reason: assignmentNote, // Include assignment note as reason
        performedById: assignedByUserId,
        userAgent,
        isPrivate: true,
        metadata: {
          description: `${assignedByUser.name} (${assignedByUser.email}) ${isReassignment ? 'reassigned' : 'assigned'} ticket #${currentTicket.ticketNumber} to ${assignedUser.user.name} (${assignedUser.user.email})`,
          ticketNumber: currentTicket.ticketNumber,
          ticketTitle: currentTicket.title,
          previousAssignee: currentTicket.assignedUserId,
          newAssignee: assignedUserId,
          assigneeName: assignedUser.user.name,
          assigneeEmail: assignedUser.user.email,
          assignerName: assignedByUser.name,
          assignerEmail: assignedByUser.email,
          userType: assignedByUser.type,
          timestamp: new Date().toISOString(),
          actionDetails: {
            what: isReassignment
              ? 'Reassigned ticket to different support user'
              : 'Assigned ticket to support user',
            who: assignedByUser.name,
            when: new Date().toISOString(),
            context: `Ticket #${currentTicket.ticketNumber}: ${currentTicket.title}`,
            assignee: assignedUser.user.name,
            previousAssignee: currentTicket.assignedUserId
              ? 'Previously assigned'
              : 'Unassigned',
            assignmentType: isReassignment
              ? 'reassignment'
              : 'manual_assignment',
            assignmentNote: assignmentNote || 'No note provided',
          },
        },
      });

      // Send assignment notification email
      await this.sendTicketAssignmentEmail(
        updatedTicket,
        assignedUser,
        assignedByUser
      );

      logger.info(
        `Support ticket ${isReassignment ? 'reassigned' : 'assigned'} successfully`,
        {
          ticketId,
          assignedUserId,
          assignedByUserId,
          ticketNumber: currentTicket.ticketNumber,
          assignmentType: isReassignment
            ? 'reassignment'
            : 'initial_assignment',
          previousAssignee: currentTicket.assignedUserId,
        }
      );

      return await this.mapDataToDomain(updatedTicket);
    } catch (error) {
      logger.error('Failed to assign support ticket', {
        error,
        ticketId,
        assignedUserId,
        assignedByUserId,
      });
      throw error;
    }
  }

  /**
   * Change ticket status
   */
  async changeStatus(
    ticketId: string,
    status: SupportTicketStatusEnum,
    changedById: string,
    reason?: string,
    userAgent?: string
  ): Promise<ISupportTicket> {
    try {
      // Get user details for audit log
      const changedByUser = await this.prisma.user.findUnique({
        where: { id: changedById },
        select: { id: true, name: true, email: true, type: true },
      });

      const currentTicket = await this.prisma.support_ticket.findUnique({
        where: { id: ticketId },
      });

      if (!currentTicket) {
        throw new Error('Support ticket not found');
      }

      const updateData = {
        status,
        resolvedAt:
          status === SupportTicketStatusEnum.RESOLVED ? new Date() : undefined,
        closedAt:
          status === SupportTicketStatusEnum.CLOSED ? new Date() : undefined,
      };

      const updatedTicket = await this.prisma.support_ticket.update({
        where: { id: ticketId },
        data: updateData,
        include: {
          createdBy: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          escalatedToUser: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          escalatedByUser: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          slaPolicy: true,
          chatConversation: true,
          attachments: true,
          comments: {
            where: {
              isDeleted: false,
            },
            orderBy: {
              createdAt: 'asc',
            },
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      // Create comprehensive audit log
      await this.supportTicketActivityService.createAuditLog({
        ticketId: ticketId,
        action: 'status_change',
        entityType: 'ticket',
        fieldChanged: 'status',
        oldValue: currentTicket.status,
        newValue: status,
        reason,
        performedById: changedById,
        userAgent,
        isPrivate: true,
        metadata: {
          description: `${changedByUser?.name || 'Unknown User'} (${changedByUser?.email}) changed ticket #${currentTicket.ticketNumber} status from ${formatEnumValue(currentTicket.status)} to ${formatEnumValue(status)}`,
          ticketNumber: currentTicket.ticketNumber,
          ticketTitle: currentTicket.title,
          previousStatus: currentTicket.status,
          newStatus: status,
          statusChangeReason: reason,
          userType: changedByUser?.type,
          timestamp: new Date().toISOString(),
          resolvedAt: updatedTicket.resolvedAt,
          closedAt: updatedTicket.closedAt,
          actionDetails: {
            what: 'Changed ticket status',
            who: changedByUser?.name || 'Unknown User',
            when: new Date().toISOString(),
            context: `Ticket #${currentTicket.ticketNumber}: ${currentTicket.title}`,
            statusTransition: `${formatEnumValue(currentTicket.status)} → ${formatEnumValue(status)}`,
            reason: reason || 'No reason provided',
            isResolution: status === SupportTicketStatusEnum.RESOLVED,
            isClosure: status === SupportTicketStatusEnum.CLOSED,
          },
        },
      });

      logger.info('Support ticket status changed successfully', {
        ticketId,
        status,
        changedById,
        previousStatus: currentTicket.status,
        reason,
      });

      return await this.mapDataToDomain(updatedTicket);
    } catch (error) {
      logger.error('Failed to change support ticket status', {
        error,
        ticketId,
        status,
        changedById,
      });
      throw error;
    }
  }

  /**
   * Update ticket priority
   */
  async changeTicketPriority(
    ticketId: string,
    priority: SupportTicketPriorityEnum,
    updatedBy: string
  ): Promise<ISupportTicketPriorityChange> {
    try {
      // Get user details for audit log
      const updatedByUser = await this.prisma.user.findUnique({
        where: { id: updatedBy },
        select: { id: true, name: true, email: true, type: true },
      });

      const currentTicket = await this.prisma.support_ticket.findUnique({
        where: { id: ticketId },
      });

      if (!currentTicket) {
        throw new Error('Support ticket not found');
      }

      const updatedTicket = await this.prisma.support_ticket.update({
        where: { id: ticketId },
        data: { priority },
      });

      // Create comprehensive audit log
      await this.supportTicketActivityService.createAuditLog({
        ticketId: ticketId,
        action: 'priority_change',
        entityType: 'ticket',
        fieldChanged: 'priority',
        oldValue: currentTicket.priority,
        newValue: priority,
        isPrivate: true,
        performedById: updatedBy,
        metadata: {
          description: `${updatedByUser?.name || 'Unknown User'} (${updatedByUser?.email}) changed ticket #${currentTicket.ticketNumber} priority from ${formatEnumValue(currentTicket.priority)} to ${formatEnumValue(priority)}`,
          ticketNumber: currentTicket.ticketNumber,
          ticketTitle: currentTicket.title,
          previousPriority: currentTicket.priority,
          newPriority: priority,
          userType: updatedByUser?.type,
          timestamp: new Date().toISOString(),
          actionDetails: {
            what: 'Changed ticket priority',
            who: updatedByUser?.name || 'Unknown User',
            when: new Date().toISOString(),
            context: `Ticket #${currentTicket.ticketNumber}: ${currentTicket.title}`,
            priorityTransition: `${formatEnumValue(currentTicket.priority)} → ${formatEnumValue(priority)}`,
            priorityLevel: this.getPriorityLevel(priority),
            previousPriorityLevel: this.getPriorityLevel(
              currentTicket.priority
            ),
          },
        },
      });

      logger.info('Support ticket priority updated successfully', {
        ticketId,
        priority,
        previousPriority: currentTicket.priority,
      });

      return this.mapTicketPriorityToDomain(updatedTicket as ISupportTicket);
    } catch (error) {
      logger.error('Failed to update support ticket priority', {
        error,
        ticketId,
        priority,
      });
      throw error;
    }
  }

  /**
   * Get Ticket Comments
   */
  async getTicketComments(ticketId: string): Promise<ISupportTicketComment[]> {
    try {
      const comments = await this.prisma.support_ticket_comment.findMany({
        where: { ticketId, isDeleted: false },
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              type: true,
              role: true,
              image: true,
            },
          },
          replies: {
            where: { isDeleted: false },
            orderBy: { createdAt: 'asc' },
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  type: true,
                  role: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      return comments.map((comment: any) =>
        this.mapTicketCommentDataToDomain(comment)
      );
    } catch (error) {
      logger.error('Failed to get support ticket comments', {
        error,
        ticketId,
      });
      throw error;
    }
  }

  /**
   * Add a comment to a support ticket
   */
  async addTicketComment(
    ticketId: string,
    data: ISupportTicketCommentCreateRequest,
    user: IAuthUser,
    userAgent?: string
  ): Promise<ISupportTicketComment[]> {
    try {
      // Ensure ticket exists with all necessary fields for notifications
      const ticket = await this.prisma.support_ticket.findUnique({
        where: { id: ticketId },
        select: {
          id: true,
          ticketNumber: true,
          title: true,
          priority: true,
          status: true,
          entityType: true,
          targetId: true,
          assignedUserId: true,
          createdById: true,
        },
      });
      if (!ticket) {
        throw new AppError(
          'Support ticket not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Validate and fetch mentioned users
      let mentionedUsers: any[] = [];
      let mentionedUserIds: string[] = [];
      if (data.mentionedUserIds && data.mentionedUserIds.length > 0) {
        try {
          // Validate that mentioned user IDs exist and are valid
          const mentionedUserData = await this.prisma.user.findMany({
            where: {
              id: { in: data.mentionedUserIds },
            },
            select: {
              id: true,
              name: true,
              email: true,
              type: true,
              role: true,
              image: true,
            },
          });

          // Check if all mentioned user IDs were found
          const foundUserIds = mentionedUserData.map((u) => u.id);
          const missingUserIds = data.mentionedUserIds.filter(
            (id) => !foundUserIds.includes(id)
          );

          if (missingUserIds.length > 0) {
            logger.warn('Some mentioned user IDs not found', {
              ticketId,
              missingUserIds,
              providedUserIds: data.mentionedUserIds,
            });
          }

          // Store user info for notifications and logging
          mentionedUserIds = mentionedUserData.map((u) => u.id);
          mentionedUsers = mentionedUserData.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            type: user.type,
            role: user.role,
            profilePicture: user.image,
          }));

          logger.info('Mentioned users validated and fetched', {
            ticketId,
            mentionedUserCount: mentionedUsers.length,
            mentionedUserIds: mentionedUserIds,
          });
        } catch (error) {
          logger.error('Failed to validate mentioned users', {
            error: error instanceof Error ? error.message : 'Unknown error',
            ticketId,
            mentionedUserIds: data.mentionedUserIds,
          });
          // Continue without mentioned users rather than failing the comment creation
        }
      }
      // Create the comment
      const created = await this.prisma.support_ticket_comment.create({
        data: {
          ticketId,
          content: data.content,
          isInternal: data.isInternal ?? false,
          isSystem: false,
          authorId: user.id,
          metadata: data.metadata,
          // Mention functionality - store user IDs for the relation
          mentionedUserIds: mentionedUserIds,
          parentCommentId: data.parentCommentId,
          // Email integration
          emailMessageId: data.emailMessageId,
          emailSubject: data.emailSubject,
          isFromEmail: data.isFromEmail || false,
          tags: data.tags || [],
        },
      });

      // Create comprehensive audit log
      await this.supportTicketActivityService.createAuditLog({
        ticketId,
        action: 'comment_create',
        entityType: 'comment',
        entityId: created.id,
        performedById: user.id,
        userAgent: userAgent,
        isPrivate: data.isInternal ? true : false,
        metadata: {
          description: `${user.name} (${user.email}) added a ${data.isInternal ? 'private' : 'public'} comment to ticket #${ticket.ticketNumber}${mentionedUsers.length > 0 ? ` and mentioned ${mentionedUsers.length} user(s)` : ''}`,
          ticketNumber: ticket.ticketNumber,
          ticketTitle: ticket.title,
          commentId: created.id,
          commentType: data.isInternal ? 'internal' : 'public',
          commentLength: data.content?.length || 0,
          authorName: user.name,
          authorEmail: user.email,
          authorType: user.type,
          timestamp: new Date().toISOString(),
          mentionedUsers: mentionedUsers.map((u) => ({
            supportUserId: u.supportUserId,
            id: u.id,
            name: u.name,
            email: u.email,
            type: u.type,
          })),
          mentionedUserCount: mentionedUsers.length,
          actionDetails: {
            what: 'Added comment to ticket',
            who: user.name,
            when: new Date().toISOString(),
            context: `Ticket #${ticket.ticketNumber}: ${ticket.title}`,
            commentType: data.isInternal
              ? 'Internal comment'
              : 'Public comment',
            commentPreview:
              data.content?.substring(0, 100) +
              (data.content?.length > 100 ? '...' : ''),
            userRole: user.type,
            mentionedUsers:
              mentionedUsers.length > 0
                ? mentionedUsers.map((u) => u.name).join(', ')
                : undefined,
          },
        },
      });

      // Send comment notification emails based on author type
      logger.info('About to send comment notification emails', {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        commentAuthorType: user.type,
        commentAuthorEmail: user.email,
        ticketEntityType: ticket.entityType,
        ticketTargetId: ticket.targetId,
        ticketAssignedUserId: ticket.assignedUserId,
        ticketCreatedById: ticket.createdById,
        ticketPriority: ticket.priority,
        ticketStatus: ticket.status,
      });

      await this.sendCommentNotificationEmails(ticket, created, user);

      // Return updated comment list (sorted asc)
      return await this.getTicketComments(ticketId);
    } catch (error) {
      logger.error('Failed to add support ticket comment', {
        error,
        ticketId,
        userId: user.id,
      });
      throw error;
    }
  }

  /**
   * Escalate a support ticket
   */
  async escalateTicket(
    ticketId: string,
    escalatedToUserId: string,
    escalationReason: string,
    escalatedById: string,
    userAgent?: string
  ): Promise<ISupportTicket> {
    try {
      // Get user details for audit log
      const escalatedByUser = await this.prisma.user.findUnique({
        where: { id: escalatedById },
        select: { id: true, name: true, email: true, type: true },
      });

      const currentTicket = await this.prisma.support_ticket.findUnique({
        where: { id: ticketId },
      });

      if (!currentTicket) {
        throw new Error('Support ticket not found');
      }

      // Get escalated to user details
      const escalatedToUser = await this.prisma.user.findUnique({
        where: { id: escalatedToUserId },
        select: { id: true, name: true, email: true },
      });

      const updatedTicket = await this.prisma.support_ticket.update({
        where: { id: ticketId },
        data: {
          escalatedAt: new Date(),
          escalatedToUserId,
          escalatedByUserId: escalatedById,
          escalationReason: escalationReason as any,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          escalatedToUser: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          escalatedByUser: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          slaPolicy: true,
          chatConversation: true,
          attachments: true,
          comments: {
            where: {
              isDeleted: false,
            },
            orderBy: {
              createdAt: 'asc',
            },
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      // Create comprehensive audit log
      await this.supportTicketActivityService.createAuditLog({
        ticketId: ticketId,
        action: 'escalate',
        entityType: 'escalation',
        reason: escalationReason,
        performedById: escalatedById,
        userAgent,
        isPrivate: true,
        metadata: {
          description: `${escalatedByUser?.name || 'Unknown User'} (${escalatedByUser?.email}) escalated ticket #${currentTicket.ticketNumber} to ${escalatedToUser?.name || 'Unknown User'}`,
          ticketNumber: currentTicket.ticketNumber,
          ticketTitle: currentTicket.title,
          escalationReason: escalationReason,
          escalatedBy: escalatedByUser?.name,
          escalatedByEmail: escalatedByUser?.email,
          escalatedTo: escalatedToUser?.name,
          escalatedToEmail: escalatedToUser?.email,
          escalationTimestamp: new Date().toISOString(),
          userType: escalatedByUser?.type,
          actionDetails: {
            what: 'Escalated ticket to higher level',
            who: escalatedByUser?.name || 'Unknown User',
            when: new Date().toISOString(),
            context: `Ticket #${currentTicket.ticketNumber}: ${currentTicket.title}`,
            escalationTarget: escalatedToUser?.name || 'Unknown User',
            reason: escalationReason,
            escalationType: 'manual_escalation',
          },
        },
      });

      logger.info('Support ticket escalated successfully', {
        ticketId,
        escalatedToUserId,
        escalatedById,
        escalationReason,
      });

      return await this.mapDataToDomain(updatedTicket);
    } catch (error) {
      logger.error('Failed to escalate support ticket', {
        error,
        ticketId,
        escalatedToUserId,
        escalatedById,
      });
      throw error;
    }
  }

  /**
   * Add customer rating and feedback
   */
  async addCustomerRating(
    ticketId: string,
    rating: number,
    feedback?: string,
    ratedById?: string
  ): Promise<ISupportTicket> {
    try {
      // Get user details for audit log
      const ratedByUser = ratedById
        ? await this.prisma.user.findUnique({
            where: { id: ratedById },
            select: { id: true, name: true, email: true, type: true },
          })
        : null;

      const currentTicket = await this.prisma.support_ticket.findUnique({
        where: { id: ticketId },
      });

      if (!currentTicket) {
        throw new Error('Support ticket not found');
      }

      const updatedTicket = await this.prisma.support_ticket.update({
        where: { id: ticketId },
        data: {
          customerRating: rating,
          customerFeedback: feedback,
          customerRatedAt: new Date(),
        },
        include: {
          createdBy: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          escalatedToUser: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          escalatedByUser: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          slaPolicy: true,
          chatConversation: true,
          attachments: true,
          comments: {
            where: {
              isDeleted: false,
            },
            orderBy: {
              createdAt: 'asc',
            },
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      // Create comprehensive audit log
      await this.supportTicketActivityService.createAuditLog({
        ticketId: ticketId,
        action: 'customer_rating',
        entityType: 'ticket',
        fieldChanged: 'customerRating',
        newValue: rating.toString(),
        reason: feedback,
        performedById: ratedById,
        metadata: {
          description: `${ratedByUser?.name || 'Customer'} rated ticket #${currentTicket.ticketNumber} with ${rating} stars`,
          ticketNumber: currentTicket.ticketNumber,
          ticketTitle: currentTicket.title,
          rating: rating,
          feedback: feedback,
          ratedBy: ratedByUser?.name || 'Customer',
          ratedByEmail: ratedByUser?.email,
          ratingTimestamp: new Date().toISOString(),
          userType: ratedByUser?.type,
          actionDetails: {
            what: 'Added customer rating',
            who: ratedByUser?.name || 'Customer',
            when: new Date().toISOString(),
            context: `Ticket #${currentTicket.ticketNumber}: ${currentTicket.title}`,
            rating: `${rating}/5 stars`,
            feedback: feedback || 'No feedback provided',
            ratingType: 'customer_satisfaction',
          },
        },
      });

      logger.info('Customer rating added successfully', {
        ticketId,
        rating,
        ratedById,
        feedback,
      });

      return await this.mapDataToDomain(updatedTicket);
    } catch (error) {
      logger.error('Failed to add customer rating', {
        error,
        ticketId,
        rating,
        ratedById,
      });
      throw error;
    }
  }

  /**
   * Generate unique ticket number
   */
  private async generateTicketNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const sequenceNumber = await this.getNextSequenceNumber();
    return `TCKT-${year}-${sequenceNumber.toString().padStart(6, '0')}`;
  }

  /**
   * Get next sequence number
   */
  private async getNextSequenceNumber(): Promise<number> {
    const lastTicket = await this.prisma.support_ticket.findFirst({
      orderBy: { sequenceNumber: 'desc' },
      select: { sequenceNumber: true },
    });

    return (lastTicket?.sequenceNumber || 0) + 1;
  }

  /**
   * Send ticket assignment notification email
   */
  private async sendTicketAssignmentEmail(
    ticket: any,
    assignedUser: any,
    assignedByUser: any
  ): Promise<void> {
    try {
      // Generate ticket URL
      const ticketUrl = `${ENV.FRONTEND_URL}/app/support/support-tickets/${ticket.id}`;

      // Convert priority enum to lowercase for email template
      const priorityMap: {
        [key: string]: 'low' | 'medium' | 'high' | 'urgent';
      } = {
        LOW: 'low',
        MEDIUM: 'medium',
        HIGH: 'high',
        URGENT: 'urgent',
        CRITICAL: 'urgent', // Map critical to urgent for email template
      };

      const emailPriority = priorityMap[ticket.priority] || 'medium';

      // Convert status enum to lowercase for email template
      const statusMap: { [key: string]: string } = {
        OPEN: 'open',
        ASSIGNED: 'assigned',
        IN_PROGRESS: 'in-progress',
        PENDING: 'pending',
        RESOLVED: 'resolved',
        CLOSED: 'closed',
        CANCELLED: 'cancelled',
        REOPENED: 'reopened',
      };

      const emailStatus = statusMap[ticket.status] || 'assigned';

      // Get client information if available
      let clientName: string | undefined;
      let clientCompanyName: string | undefined;

      if (ticket.entityType === 'CLIENT' && ticket.targetId) {
        try {
          const client = await this.prisma.client.findUnique({
            where: { id: ticket.targetId },
            include: {
              company: true,
              clientUsers: {
                take: 1,
                include: {
                  user: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          });
          clientName = client?.clientUsers?.[0]?.user?.name;
          clientCompanyName = client?.company?.name;
        } catch (error) {
          logger.warn(
            'Failed to fetch client information for ticket assignment email',
            {
              ticketId: ticket.id,
              targetId: ticket.targetId,
              error: error instanceof Error ? error.message : 'Unknown error',
            }
          );
        }
      }

      // Send assignment notification email
      await this.notificationProvider.sendSupportTicketAssignmentEmail(
        assignedUser.email,
        assignedUser.name,
        ticket.sequenceNumber.toString(),
        ticket.title,
        ticket.description,
        emailPriority,
        ticket.category,
        emailStatus,
        assignedByUser.name,
        assignedByUser.email,
        ticketUrl,
        clientName,
        clientCompanyName,
        ticket.dueDate?.toISOString().split('T')[0], // Format as YYYY-MM-DD
        undefined, // estimatedResolutionTime
        ticket.attachments?.map((attachment: any) => ({
          name: attachment.fileName,
          size: this.formatFileSize(attachment.fileSize),
          type: attachment.mimeType,
        }))
      );

      logger.info('Support ticket assignment email sent successfully', {
        ticketId: ticket.id,
        assignedUserEmail: assignedUser.email,
        assignedByUserEmail: assignedByUser.email,
      });
    } catch (error) {
      logger.error('Failed to send support ticket assignment email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ticketId: ticket.id,
        assignedUserEmail: assignedUser.email,
      });
      // Don't throw error - email failure shouldn't break the assignment
    }
  }

  /**
   * Send ticket creation notification email to assigned support user
   */
  private async sendTicketCreationEmail(
    ticket: any,
    assignedUser?: any,
    assignedByUser?: any
  ): Promise<void> {
    try {
      // Only send email if ticket is assigned to a support user
      if (!assignedUser || !assignedByUser) {
        return;
      }

      // Generate ticket URL
      const ticketUrl = `${ENV.FRONTEND_URL}/app/support/support-tickets/${ticket.id}`;

      // Convert priority enum to lowercase for email template
      const priorityMap: {
        [key: string]: 'low' | 'medium' | 'high' | 'urgent';
      } = {
        LOW: 'low',
        MEDIUM: 'medium',
        HIGH: 'high',
        URGENT: 'urgent',
        CRITICAL: 'urgent', // Map critical to urgent for email template
      };

      const emailPriority = priorityMap[ticket.priority] || 'medium';

      // Convert status enum to lowercase for email template
      const statusMap: { [key: string]: string } = {
        OPEN: 'open',
        ASSIGNED: 'assigned',
        IN_PROGRESS: 'in-progress',
        PENDING: 'pending',
        RESOLVED: 'resolved',
        CLOSED: 'closed',
        CANCELLED: 'cancelled',
        REOPENED: 'reopened',
      };

      const emailStatus = statusMap[ticket.status] || 'assigned';

      // Get client information if available
      let clientName: string | undefined;
      let clientCompanyName: string | undefined;

      if (ticket.entityType === 'CLIENT' && ticket.targetId) {
        try {
          const client = await this.prisma.client.findUnique({
            where: { id: ticket.targetId },
            include: {
              company: true,
              clientUsers: {
                take: 1,
                include: {
                  user: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          });
          clientName = client?.clientUsers?.[0]?.user?.name;
          clientCompanyName = client?.company?.name;
        } catch (error) {
          logger.warn(
            'Failed to fetch client information for ticket creation email',
            {
              ticketId: ticket.id,
              targetId: ticket.targetId,
              error: error instanceof Error ? error.message : 'Unknown error',
            }
          );
        }
      }

      // Send creation notification email
      await this.notificationProvider.sendSupportTicketAssignmentEmail(
        assignedUser.email,
        assignedUser.name,
        ticket.sequenceNumber.toString(),
        ticket.title,
        ticket.description,
        emailPriority,
        ticket.category,
        emailStatus,
        assignedByUser.name,
        assignedByUser.email,
        ticketUrl,
        clientName,
        clientCompanyName,
        ticket.dueDate?.toISOString().split('T')[0], // Format as YYYY-MM-DD
        undefined, // estimatedResolutionTime
        ticket.attachments?.map((attachment: any) => ({
          name: attachment.fileName,
          size: this.formatFileSize(attachment.fileSize),
          type: attachment.mimeType,
        }))
      );

      logger.info('Support ticket creation email sent successfully', {
        ticketId: ticket.id,
        assignedUserEmail: assignedUser.email,
        assignedByUserEmail: assignedByUser.email,
      });
    } catch (error) {
      logger.error('Failed to send support ticket creation email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ticketId: ticket.id,
        assignedUserEmail: assignedUser?.email,
      });
      // Don't throw error - email failure shouldn't break the ticket creation
    }
  }

  /**
   * Format file size in human readable format
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : '';
  }

  /**
   * Generate pre-signed URLs for attachments
   */
  private async generateAttachmentUrls(attachments: any[]): Promise<any[]> {
    if (!attachments || attachments.length === 0) {
      return [];
    }

    // Check if storage service is available
    if (!this.storageService) {
      logger.warn(
        'Storage service not available, returning attachments without URLs'
      );
      return attachments;
    }

    const attachmentsWithUrls = await Promise.all(
      attachments.map(async (attachment) => {
        try {
          // Generate pre-signed URL for download
          const downloadUrl = await this.storageService.generatePreSignedUrl(
            attachment.filePath,
            'read'
          );

          // Generate pre-signed URL for preview (if it's an image or document)
          let previewUrl: string | undefined;
          if (
            attachment.mimeType.startsWith('image/') ||
            attachment.mimeType.includes('pdf') ||
            attachment.mimeType.includes('text/')
          ) {
            previewUrl = await this.storageService.generatePreSignedUrl(
              attachment.filePath,
              'read'
            );
          }

          return {
            ...attachment,
            downloadUrl,
            previewUrl,
          };
        } catch (error) {
          logger.error('Failed to generate pre-signed URL for attachment', {
            error,
            attachmentId: attachment.id,
            filePath: attachment.filePath,
          });
          // Return attachment without URLs if generation fails
          return attachment;
        }
      })
    );

    return attachmentsWithUrls;
  }

  /**
   * Map data model to domain model
   */
  private async mapDataToDomain(ticket: any): Promise<ISupportTicket> {
    // Generate pre-signed URLs for attachments
    const attachmentsWithUrls = await this.generateAttachmentUrls(
      ticket.attachments
    );

    return {
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      ticketType: ticket.ticketType,
      category: ticket.category,
      subcategory: ticket.subCategory,
      status: ticket.status,
      assignmentStatus: ticket.assignmentStatus,
      priority: ticket.priority,
      ticketNumber: ticket.ticketNumber,
      sequenceNumber: ticket.sequenceNumber,
      displayNumber: ticket.displayNumber,
      publicTicketNumber: ticket.publicTicketNumber,
      entityType: ticket.entityType,
      targetId: ticket.targetId,
      targetType: ticket.targetType,
      createdById: ticket.createdById,
      assignedUserId: ticket.assignedUserId,
      assignmentNote: ticket.assignmentNote,
      slaPolicyId: ticket.slaPolicyId,
      slaBreachAt: ticket.slaBreachAt,
      slaDuration: ticket.slaDuration,
      slaStartedAt: ticket.slaStartedAt,
      isSlaBreach: ticket.isSlaBreach,
      escalatedAt: ticket.escalatedAt,
      escalatedToUserId: ticket.escalatedToUserId,
      escalatedByUserId: ticket.escalatedByUserId,
      escalationReason: ticket.escalationReason,
      customerRating: ticket.customerRating,
      customerFeedback: ticket.customerFeedback,
      customerRatedAt: ticket.customerRatedAt,
      resolutionNotes: ticket.resolutionNotes,
      resolvedAt: ticket.resolvedAt,
      closedAt: ticket.closedAt,
      tags: ticket.tags,
      dueDate: ticket.dueDate,
      isBacklog: ticket.isBacklog,
      inlineAttachments: ticket.inlineAttachments,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      deletedAt: ticket.deletedAt,
      isDeleted: ticket.isDeleted,
      // Root Cause Analysis (RCA)
      rootCauseAnalysis: ticket.rootCauseAnalysis,
      rcaCategory: ticket.rcaCategory,
      rcaContributingFactors: ticket.rcaContributingFactors,
      rcaPreventiveMeasures: ticket.rcaPreventiveMeasures,
      rcaCompletedAt: ticket.rcaCompletedAt,
      rcaCompletedBy: ticket.rcaCompletedBy,
      // Include related data
      createdBy: ticket.createdBy,
      assignedTo: ticket.assignedTo,
      escalatedToUser: ticket.escalatedToUser,
      escalatedByUser: ticket.escalatedByUser,
      slaPolicy: ticket.slaPolicy,
      attachments: attachmentsWithUrls,
      rcaCompletedByUser: ticket.rcaCompletedByUser,
    };
  }

  /**
   * Map Ticket Status to Domain Model
   */
  private mapTicketStatusToDomain(
    ticket: any
  ): ISupportTicketStatusChangeResponse {
    return {
      ticketId: ticket.id,
      title: ticket.title,
      status: ticket.status,
      updatedAt: ticket.updatedAt,
      updatedBy: ticket.updatedBy,
      reason: ticket.reason,
    };
  }

  /**
   * Map Ticket Priority to Domain Model
   */
  private mapTicketPriorityToDomain(
    ticket: ISupportTicket
  ): ISupportTicketPriorityChange {
    return {
      ticketId: ticket.id,
      title: ticket.title,
      priority: ticket.priority,
      updatedAt: ticket.updatedAt,
    };
  }

  /**
   * Map ticket comment data model to domain model
   */
  private mapTicketCommentDataToDomain(comment: any): ISupportTicketComment {
    // Handle author information - can come from relation or direct fields
    let author: ISupportTicketAuthor | undefined;

    if (comment.author) {
      // Author information from user relation
      author = {
        id: comment.author.id,
        name: comment.author.name,
        email: comment.author.email,
        type: comment.author.type,
        role: comment.author.role,
        profilePicture: comment.author.image,
      };
    } else if (comment.authorId) {
      // Author information when relation is not loaded
      author = {
        id: comment.authorId,
        name: 'Unknown User',
        email: 'unknown@example.com',
        type: UserTypeEnum.SUPPORT,
        role: UserRoleEnum.INDIVIDUAL,
        profilePicture: undefined,
      };
    }

    return {
      id: comment.id,
      ticketId: comment.ticketId,
      content: comment.content,
      isInternal: comment.isInternal,
      isSystem: comment.isSystem,
      author,
      attachments: comment.attachments,
      metadata: comment.metadata,
      isEdited: comment.isEdited,
      editedAt: comment.editedAt,
      isDeleted: comment.isDeleted,
      deletedAt: comment.deletedAt,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      // Mention functionality
      mentionedUserIds: comment.mentionedUserIds || [],
      parentCommentId: comment.parentCommentId,
      replies: comment.replies || [],
      // Email integration
      emailMessageId: comment.emailMessageId,
      emailSubject: comment.emailSubject,
      isFromEmail: comment.isFromEmail || false,
      tags: comment.tags || [],
    };
  }

  /**
   * Map ticket data model to domain model
   */
  private mapTicketListItemDataToDomain(
    ticket: any
  ): ISupportTicketListItemResponse {
    return {
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      subcategory: ticket.subCategory,
      status: ticket.status,
      priority: ticket.priority,
      ticketNumber: ticket.ticketNumber,
      sequenceNumber: ticket.sequenceNumber,
      entityType: ticket.entityType,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      createdBy: ticket.createdBy,
    };
  }
  // Add any additional methods you want to add to the service

  /**
   * Helper method to get changed fields between two objects
   */
  private getChangedFields(oldData: any, newData: any): string[] {
    const changedFields: string[] = [];
    const allFields = Array.from(
      new Set([...Object.keys(oldData), ...Object.keys(newData)])
    );

    for (const field of allFields) {
      if (oldData[field] !== newData[field]) {
        changedFields.push(field);
      }
    }

    return changedFields;
  }

  /**
   * Helper method to generate human-readable change descriptions
   */
  private generateChangeDescriptions(
    changedFields: string[],
    oldData: any,
    newData: any
  ): string[] {
    const descriptions: string[] = [];

    for (const field of changedFields) {
      const oldValue = oldData[field];
      const newValue = newData[field];

      switch (field) {
        case 'title':
          descriptions.push(
            `Title changed from "${oldValue}" to "${newValue}"`
          );
          break;
        case 'description':
          descriptions.push('Description updated');
          break;
        case 'status':
          descriptions.push(`Status changed from ${oldValue} to ${newValue}`);
          break;
        case 'priority':
          descriptions.push(`Priority changed from ${oldValue} to ${newValue}`);
          break;
        case 'category':
          descriptions.push(`Category changed from ${oldValue} to ${newValue}`);
          break;
        case 'subCategory':
          descriptions.push(
            `Subcategory changed from "${oldValue || 'None'}" to "${newValue || 'None'}"`
          );
          break;
        case 'assignedUserId':
          descriptions.push(
            `Assignment changed from ${oldValue ? 'assigned' : 'unassigned'} to ${newValue ? 'assigned' : 'unassigned'}`
          );
          break;
        case 'dueDate':
          descriptions.push(
            `Due date changed from ${oldValue ? oldValue.toISOString().split('T')[0] : 'None'} to ${newValue ? newValue.toISOString().split('T')[0] : 'None'}`
          );
          break;
        case 'tags':
          descriptions.push('Tags updated');
          break;
        case 'isBacklog':
          descriptions.push(
            `Backlog status changed from ${oldValue} to ${newValue}`
          );
          break;
        default:
          descriptions.push(`${field} updated`);
      }
    }

    return descriptions;
  }

  /**
   * Send comment notification emails based on comment author type
   */
  private async sendCommentNotificationEmails(
    ticket: any,
    comment: any,
    commentAuthor: IAuthUser
  ): Promise<void> {
    try {
      // Generate ticket URL
      const ticketUrl = `${ENV.FRONTEND_URL}/app/support/support-tickets/${ticket.id}`;

      // Convert priority enum to lowercase for email template
      const priorityMap: {
        [key: string]: 'low' | 'medium' | 'high' | 'urgent';
      } = {
        LOW: 'low',
        MEDIUM: 'medium',
        HIGH: 'high',
        URGENT: 'urgent',
        CRITICAL: 'urgent', // Map critical to urgent for email template
      };

      const emailPriority = priorityMap[ticket.priority] || 'medium';

      // Convert status enum to lowercase for email template
      const statusMap: { [key: string]: string } = {
        OPEN: 'open',
        ASSIGNED: 'assigned',
        IN_PROGRESS: 'in-progress',
        PENDING: 'pending',
        RESOLVED: 'resolved',
        CLOSED: 'closed',
        CANCELLED: 'cancelled',
        REOPENED: 'reopened',
      };

      const emailStatus = statusMap[ticket.status] || 'assigned';

      // Determine comment author type and send appropriate notifications
      if (commentAuthor.type === UserTypeEnum.CLIENT) {
        // Client added comment - notify account manager
        await this.notifyAccountManagerOfClientComment(
          ticket,
          comment,
          commentAuthor,
          ticketUrl,
          emailPriority,
          emailStatus
        );
      } else if (commentAuthor.type === UserTypeEnum.SUPPORT) {
        // Support/Account manager added comment - notify client
        await this.notifyClientOfAccountManagerComment(
          ticket,
          comment,
          commentAuthor,
          ticketUrl,
          emailPriority,
          emailStatus
        );
      }

      logger.info('Comment notification emails sent successfully', {
        ticketId: ticket.id,
        commentId: comment.id,
        commentAuthorType: commentAuthor.type,
        commentAuthorEmail: commentAuthor.email,
      });
    } catch (error) {
      logger.error('Failed to send comment notification emails', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ticketId: ticket.id,
        commentId: comment.id,
        commentAuthorType: commentAuthor.type,
      });
      // Don't throw error - email failure shouldn't break comment creation
    }
  }

  /**
   * Notify account manager when client adds a comment
   */
  private async notifyAccountManagerOfClientComment(
    ticket: any,
    comment: any,
    commentAuthor: IAuthUser,
    ticketUrl: string,
    emailPriority: string,
    emailStatus: string
  ): Promise<void> {
    try {
      // Get account manager information
      let accountManagerEmail: string | undefined;
      let accountManagerName: string | undefined;

      if (ticket.entityType === 'CLIENT' && ticket.targetId) {
        try {
          const client = await this.prisma.client.findUnique({
            where: { id: ticket.targetId },
            include: {
              company: true,
              accountManagerAssignments: {
                include: {
                  accountManager: {
                    include: {
                      user: true,
                    },
                  },
                },
                take: 1,
                orderBy: {
                  assignedAt: 'desc',
                },
              },
            },
          });

          if (client?.accountManagerAssignments?.[0]?.accountManager?.user) {
            accountManagerEmail =
              client.accountManagerAssignments[0].accountManager.user.email;
            accountManagerName =
              client.accountManagerAssignments[0].accountManager.user.name;
          }
        } catch (error) {
          logger.warn(
            'Failed to fetch account manager information for comment notification',
            {
              ticketId: ticket.id,
              targetId: ticket.targetId,
              error: error instanceof Error ? error.message : 'Unknown error',
            }
          );
        }
      }

      // If no account manager found, try to get from assigned support user
      if (!accountManagerEmail && ticket.assignedUserId) {
        try {
          const assignedSupportUser = await this.prisma.support_user.findUnique(
            {
              where: { id: ticket.assignedUserId },
              include: {
                user: true,
              },
            }
          );

          if (assignedSupportUser?.user) {
            accountManagerEmail = assignedSupportUser.user.email;
            accountManagerName = assignedSupportUser.user.name;
          }
        } catch (error) {
          logger.warn(
            'Failed to fetch assigned support user information for comment notification',
            {
              ticketId: ticket.id,
              assignedUserId: ticket.assignedUserId,
              error: error instanceof Error ? error.message : 'Unknown error',
            }
          );
        }
      }

      // Send notification email if account manager found
      if (accountManagerEmail && accountManagerName) {
        const clientCompanyName =
          ticket.entityType === 'CLIENT' && ticket.targetId
            ? await this.getClientCompanyName(ticket.targetId)
            : 'Unknown Company';

        await this.notificationProvider.sendSupportTicketCommentToAccountManagerEmail(
          accountManagerEmail,
          accountManagerName,
          ticket.id,
          ticket.title,
          ticket.ticketNumber,
          comment.content,
          commentAuthor.name,
          commentAuthor.email,
          clientCompanyName,
          ticketUrl,
          emailPriority,
          emailStatus
        );

        logger.info('Account manager notified of client comment', {
          ticketId: ticket.id,
          commentId: comment.id,
          accountManagerEmail,
          accountManagerName,
        });
      } else {
        logger.warn('No account manager found to notify of client comment', {
          ticketId: ticket.id,
          commentId: comment.id,
          entityType: ticket.entityType,
          targetId: ticket.targetId,
          assignedUserId: ticket.assignedUserId,
          accountManagerEmail,
          accountManagerName,
        });
      }
    } catch (error) {
      logger.error('Failed to notify account manager of client comment', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ticketId: ticket.id,
        commentId: comment.id,
        commentAuthorEmail: commentAuthor.email,
      });
      // Don't throw error - notification failure shouldn't break the flow
    }
  }

  /**
   * Notify client when account manager adds a comment
   */
  private async notifyClientOfAccountManagerComment(
    ticket: any,
    comment: any,
    commentAuthor: IAuthUser,
    ticketUrl: string,
    emailPriority: string,
    emailStatus: string
  ): Promise<void> {
    try {
      // Try to find client information - first from targetId, then from ticket creator
      let clientEmail: string | undefined;
      let clientName: string | undefined;

      if (ticket.entityType === UserTypeEnum.CLIENT && ticket.targetId) {
        try {
          const client = await this.prisma.client.findUnique({
            where: { id: ticket.targetId },
            include: {
              company: true,
              clientUsers: {
                take: 1,
                include: {
                  user: {
                    select: {
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          });

          if (client?.clientUsers?.[0]?.user) {
            clientEmail = client.clientUsers[0].user.email;
            clientName = client.clientUsers[0].user.name;
            logger.info('Client found via targetId', {
              clientId: ticket.targetId,
              clientEmail,
              clientName,
            });
          }
        } catch (error) {
          logger.warn(
            'Failed to fetch client information for comment notification via targetId',
            {
              ticketId: ticket.id,
              targetId: ticket.targetId,
              error: error instanceof Error ? error.message : 'Unknown error',
            }
          );
        }
      }

      // If no client found via targetId, try to find via ticket creator
      if (!clientEmail && !clientName) {
        try {
          const ticketCreator = await this.prisma.user.findUnique({
            where: { id: ticket.createdById },
            select: {
              id: true,
              name: true,
              email: true,
              type: true,
            },
          });

          // If ticket creator is a client user, use their information
          if (ticketCreator && ticketCreator.type === UserTypeEnum.CLIENT) {
            clientEmail = ticketCreator.email;
            clientName = ticketCreator.name;
            logger.info('Client found via ticket creator', {
              creatorId: ticket.createdById,
              clientEmail,
              clientName,
            });
          }
        } catch (error) {
          logger.warn(
            'Failed to fetch ticket creator information for comment notification',
            {
              ticketId: ticket.id,
              createdById: ticket.createdById,
              error: error instanceof Error ? error.message : 'Unknown error',
            }
          );
        }
      }

      // If still no client found, try to find via assigned user's client relationship
      if (!clientEmail && !clientName && ticket.assignedUserId) {
        try {
          const assignedSupportUser = await this.prisma.support_user.findUnique(
            {
              where: { id: ticket.assignedUserId },
              include: {
                user: true,
                clientAccountManagerAssignments: {
                  take: 1,
                  include: {
                    client: {
                      include: {
                        clientUsers: {
                          take: 1,
                          include: {
                            user: {
                              select: {
                                name: true,
                                email: true,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            }
          );

          if (
            assignedSupportUser?.clientAccountManagerAssignments?.[0]?.client
              ?.clientUsers?.[0]?.user
          ) {
            clientEmail =
              assignedSupportUser.clientAccountManagerAssignments[0].client
                .clientUsers[0].user.email;
            clientName =
              assignedSupportUser.clientAccountManagerAssignments[0].client
                .clientUsers[0].user.name;
            logger.info('Client found via assigned support user', {
              assignedUserId: ticket.assignedUserId,
              clientEmail,
              clientName,
            });
          }
        } catch (error) {
          logger.warn(
            'Failed to fetch client information via assigned support user',
            {
              ticketId: ticket.id,
              assignedUserId: ticket.assignedUserId,
              error: error instanceof Error ? error.message : 'Unknown error',
            }
          );
        }
      }

      // Send notification email if client found
      if (clientEmail && clientName) {
        const accountManagerJobTitle = UserTypeEnum.SUPPORT;

        await this.notificationProvider.sendSupportTicketCommentToClientEmail(
          clientEmail,
          clientName,
          ticket.id,
          ticket.title,
          ticket.ticketNumber,
          comment.content,
          commentAuthor.name,
          commentAuthor.email,
          ticketUrl,
          emailPriority,
          emailStatus,
          accountManagerJobTitle
        );

        logger.info('Client notified of account manager comment', {
          ticketId: ticket.id,
          commentId: comment.id,
          clientEmail,
          clientName,
        });
      } else {
        logger.warn('No client found to notify of account manager comment', {
          ticketId: ticket.id,
          commentId: comment.id,
          entityType: ticket.entityType,
          targetId: ticket.targetId,
          createdById: ticket.createdById,
          assignedUserId: ticket.assignedUserId,
          clientEmail,
          clientName,
        });
      }
    } catch (error) {
      logger.error('Failed to notify client of account manager comment', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ticketId: ticket.id,
        commentId: comment.id,
        commentAuthorEmail: commentAuthor.email,
      });
      // Don't throw error - notification failure shouldn't break the flow
    }
  }

  /**
   * Helper method to get client company name
   */
  private async getClientCompanyName(clientId: string): Promise<string> {
    try {
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
        include: {
          company: true,
        },
      });
      return client?.company?.name || 'Unknown Company';
    } catch (error) {
      logger.warn('Failed to fetch client company name', {
        clientId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 'Unknown Company';
    }
  }

  /**
   * Helper method to get priority level description
   */
  private getPriorityLevel(priority: string): string {
    switch (priority) {
      case 'LOW':
        return 'Low Priority';
      case 'MEDIUM':
        return 'Medium Priority';
      case 'HIGH':
        return 'High Priority';
      case 'URGENT':
        return 'Urgent Priority';
      case 'CRITICAL':
        return 'Critical Priority';
      default:
        return 'Unknown Priority';
    }
  }

  /**
   * Automatically determine ticket type based on category and subcategory
   */
  private determineTicketType(
    category: string,
    subcategory?: string
  ): SupportTicketTypeEnum {
    // If no category is provided, default to general inquiry
    if (!category) {
      return SupportTicketTypeEnum.GENERAL_INQUIRY;
    }

    // If subcategory is provided, determine ticket type based on subcategory keywords
    if (subcategory) {
      const subcategoryLower = subcategory.toLowerCase();

      // Check for keywords that indicate new entity creation
      if (
        subcategoryLower.includes('create') ||
        subcategoryLower.includes('new') ||
        subcategoryLower.includes('add') ||
        subcategoryLower.includes('setup') ||
        subcategoryLower.includes('onboard') ||
        subcategoryLower.includes('register') ||
        subcategoryLower.includes('start') ||
        subcategoryLower.includes('initiate')
      ) {
        return SupportTicketTypeEnum.NEW_ENTITY;
      }

      // Check for keywords that indicate existing entity issues
      if (
        subcategoryLower.includes('update') ||
        subcategoryLower.includes('modify') ||
        subcategoryLower.includes('change') ||
        subcategoryLower.includes('edit') ||
        subcategoryLower.includes('delete') ||
        subcategoryLower.includes('remove') ||
        subcategoryLower.includes('fix') ||
        subcategoryLower.includes('resolve') ||
        subcategoryLower.includes('troubleshoot') ||
        subcategoryLower.includes('manage') ||
        subcategoryLower.includes('configure') ||
        subcategoryLower.includes('adjust') ||
        subcategoryLower.includes('maintain')
      ) {
        return SupportTicketTypeEnum.EXISTING_ENTITY;
      }

      // Check for technical issue keywords
      if (
        subcategoryLower.includes('error') ||
        subcategoryLower.includes('bug') ||
        subcategoryLower.includes('crash') ||
        subcategoryLower.includes('performance') ||
        subcategoryLower.includes('slow') ||
        subcategoryLower.includes('broken') ||
        subcategoryLower.includes('not working') ||
        subcategoryLower.includes('issue') ||
        subcategoryLower.includes('problem')
      ) {
        return SupportTicketTypeEnum.TECHNICAL_ISSUE;
      }

      // Check for feature request keywords
      if (
        subcategoryLower.includes('feature') ||
        subcategoryLower.includes('enhancement') ||
        subcategoryLower.includes('improvement') ||
        subcategoryLower.includes('request') ||
        subcategoryLower.includes('suggestion') ||
        subcategoryLower.includes('idea')
      ) {
        return SupportTicketTypeEnum.FEATURE_REQUEST;
      }

      // Check for billing and account related keywords
      if (
        subcategoryLower.includes('billing') ||
        subcategoryLower.includes('payment') ||
        subcategoryLower.includes('invoice') ||
        subcategoryLower.includes('subscription') ||
        subcategoryLower.includes('account') ||
        subcategoryLower.includes('settings')
      ) {
        return SupportTicketTypeEnum.ACCOUNT_ISSUE;
      }

      // If subcategory doesn't match any specific patterns, default to EXISTING_ENTITY
      // since most operations are on existing entities
      return SupportTicketTypeEnum.EXISTING_ENTITY;
    }

    // If no subcategory provided, fall back to category-based logic for backward compatibility
    const ticketTypeRules: Record<string, SupportTicketTypeEnum> = {
      // Technical and integration issues
      INTEGRATION: SupportTicketTypeEnum.TECHNICAL_ISSUE,
      TECHNICAL_ISSUE: SupportTicketTypeEnum.TECHNICAL_ISSUE,

      // Feature requests and bug reports
      FEATURE_REQUEST: SupportTicketTypeEnum.FEATURE_REQUEST,
      BUG: SupportTicketTypeEnum.BUG_REPORT,

      // General categories
      GENERAL: SupportTicketTypeEnum.GENERAL_INQUIRY,
      BILLING: SupportTicketTypeEnum.BILLING_INQUIRY,
      ACCOUNT: SupportTicketTypeEnum.ACCOUNT_ISSUE,
    };

    // Check if we have a specific rule for this category
    if (ticketTypeRules[category]) {
      return ticketTypeRules[category];
    }

    // Default to existing entity if no specific rules match
    return SupportTicketTypeEnum.EXISTING_ENTITY;
  }

  /**
   * Add Root Cause Analysis (RCA) to a support ticket
   * Only assigned support users can add RCA
   */
  async addRootCauseAnalysis(
    ticketId: string,
    rcaData: ISupportTicketRcaRequest,
    completedById: string,
    userAgent?: string
  ): Promise<ISupportTicketRcaResponse> {
    try {
      // Get user details for audit log
      const completedByUser = await this.prisma.user.findUnique({
        where: { id: completedById },
        select: { id: true, name: true, email: true, type: true, role: true },
      });

      if (!completedByUser) {
        throw new AppError('User not found', 404, ErrorCode.NOT_FOUND);
      }

      // Verify user is a support user
      if (completedByUser.type !== UserTypeEnum.SUPPORT) {
        throw new AppError(
          'Only support users can add root cause analysis',
          403,
          ErrorCode.FORBIDDEN
        );
      }
      logger.info('Adding root cause analysis', {
        ticketId,
        completedById,
        rcaData,
      });

      const currentTicket = await this.prisma.support_ticket.findUnique({
        where: { id: ticketId },
      });

      if (!currentTicket) {
        throw new AppError(
          'Support ticket not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      const updatedTicket = await this.prisma.support_ticket.update({
        where: { id: ticketId },
        data: {
          rootCauseAnalysis: rcaData.rootCauseAnalysis,
          rcaCategory: rcaData.rcaCategory,
          rcaContributingFactors: rcaData.rcaContributingFactors || [],
          rcaPreventiveMeasures: rcaData.rcaPreventiveMeasures || [],
          rcaCompletedAt: new Date(),
          rcaCompletedBy: completedById,
        },
        include: {
          rcaCompletedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Verify that the data was stored correctly
      if (!updatedTicket.rootCauseAnalysis && !updatedTicket.rcaCategory) {
        logger.error('RCA data was not stored correctly', {
          ticketId,
          rcaData,
          storedData: {
            rootCauseAnalysis: updatedTicket.rootCauseAnalysis,
            rcaCategory: updatedTicket.rcaCategory,
            rcaContributingFactors: updatedTicket.rcaContributingFactors,
            rcaPreventiveMeasures: updatedTicket.rcaPreventiveMeasures,
          },
        });
        throw new AppError(
          'Failed to store RCA data',
          500,
          ErrorCode.INTERNAL_SERVER_ERROR
        );
      }

      // Create comprehensive audit log
      await this.supportTicketActivityService.createAuditLog({
        ticketId: ticketId,
        action: 'rca_add',
        entityType: 'rca',
        entityId: ticketId,
        performedById: completedById,
        isPrivate: true,
        userAgent,
        metadata: {
          description: `${completedByUser.name} (${completedByUser.email}) added root cause analysis`,
          ticketNumber: currentTicket.ticketNumber,
          ticketTitle: currentTicket.title,
          rcaCategory: rcaData.rcaCategory,
          contributingFactorsCount: rcaData.rcaContributingFactors?.length || 0,
          preventiveMeasuresCount: rcaData.rcaPreventiveMeasures?.length || 0,
          userType: completedByUser.type,
          timestamp: new Date().toISOString(),
          actionDetails: {
            what: 'Added root cause analysis',
            who: completedByUser.name,
            when: new Date().toISOString(),
            context: `Ticket #${currentTicket.ticketNumber}: ${currentTicket.title}`,
            rcaCategory: rcaData.rcaCategory,
            contributingFactors: rcaData.rcaContributingFactors || [],
            preventiveMeasures: rcaData.rcaPreventiveMeasures || [],
            analysisLength: rcaData.rootCauseAnalysis?.length || 0,
          },
        },
      });

      logger.info('Root cause analysis added successfully', {
        ticketId,
        completedById,
        rcaCategory: rcaData.rcaCategory,
        contributingFactorsCount: rcaData.rcaContributingFactors?.length || 0,
        preventiveMeasuresCount: rcaData.rcaPreventiveMeasures?.length || 0,
        storedData: {
          rootCauseAnalysis: updatedTicket.rootCauseAnalysis,
          rcaCategory: updatedTicket.rcaCategory,
          rcaContributingFactors: updatedTicket.rcaContributingFactors,
          rcaPreventiveMeasures: updatedTicket.rcaPreventiveMeasures,
          rcaCompletedAt: updatedTicket.rcaCompletedAt,
          rcaCompletedBy: updatedTicket.rcaCompletedBy,
        },
      });

      return {
        ticketId: updatedTicket.id,
        rootCauseAnalysis: updatedTicket.rootCauseAnalysis!,
        rcaCategory: updatedTicket.rcaCategory!,
        rcaContributingFactors: updatedTicket.rcaContributingFactors || [],
        rcaPreventiveMeasures: updatedTicket.rcaPreventiveMeasures || [],
        rcaCompletedAt: updatedTicket.rcaCompletedAt!,
        rcaCompletedBy: {
          id: updatedTicket.rcaCompletedByUser!.id,
          name: updatedTicket.rcaCompletedByUser!.name,
          email: updatedTicket.rcaCompletedByUser!.email,
        },
      };
    } catch (error) {
      logger.error('Failed to add root cause analysis', {
        error,
        ticketId,
        completedById,
        rcaData,
      });
      throw error;
    }
  }

  /**
   * Update Root Cause Analysis (RCA) for a support ticket
   * Only the user who created the RCA or admin can update it
   */
  async updateRootCauseAnalysis(
    ticketId: string,
    rcaData: ISupportTicketRcaRequest,
    updatedById: string,
    userAgent?: string
  ): Promise<ISupportTicketRcaResponse> {
    try {
      logger.info('Updating root cause analysis', {
        ticketId,
        updatedById,
        rcaData,
      });

      // Get user details for audit log
      const updatedByUser = await this.prisma.user.findUnique({
        where: { id: updatedById },
        select: { id: true, name: true, email: true, type: true },
      });

      if (!updatedByUser) {
        throw new AppError('User not found', 404, ErrorCode.NOT_FOUND);
      }

      // Verify user is a support user
      if (updatedByUser.type !== UserTypeEnum.SUPPORT) {
        throw new AppError(
          'Only support users can update root cause analysis',
          403,
          ErrorCode.FORBIDDEN
        );
      }

      const currentTicket = await this.prisma.support_ticket.findUnique({
        where: { id: ticketId },
      });

      if (!currentTicket) {
        throw new AppError(
          'Support ticket not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Verify the user is the one who created the RCA or has admin privileges
      if (
        currentTicket.rcaCompletedBy !== updatedById &&
        updatedByUser.type !== UserTypeEnum.SUPPORT
      ) {
        throw new AppError(
          'Only the RCA creator or admin can update root cause analysis',
          403,
          ErrorCode.FORBIDDEN
        );
      }

      const updatedTicket = await this.prisma.support_ticket.update({
        where: { id: ticketId },
        data: {
          rootCauseAnalysis: rcaData.rootCauseAnalysis,
          rcaCategory: rcaData.rcaCategory,
          rcaContributingFactors: rcaData.rcaContributingFactors || [],
          rcaPreventiveMeasures: rcaData.rcaPreventiveMeasures || [],
          rcaCompletedAt: new Date(), // Update completion time
          rcaCompletedBy: updatedById, // Set who completed the RCA
        },
        include: {
          rcaCompletedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Create comprehensive audit log
      await this.supportTicketActivityService.createAuditLog({
        ticketId: ticketId,
        action: 'rca_update',
        entityType: 'rca',
        entityId: ticketId,
        performedById: updatedById,
        isPrivate: true,
        userAgent,
        metadata: {
          description: `${updatedByUser.name} (${updatedByUser.email}) updated root cause analysis`,
          ticketNumber: currentTicket.ticketNumber,
          ticketTitle: currentTicket.title,
          rcaCategory: rcaData.rcaCategory,
          contributingFactorsCount: rcaData.rcaContributingFactors?.length || 0,
          preventiveMeasuresCount: rcaData.rcaPreventiveMeasures?.length || 0,
          userType: updatedByUser.type,
          timestamp: new Date().toISOString(),
          actionDetails: {
            what: 'Updated root cause analysis',
            who: updatedByUser.name,
            when: new Date().toISOString(),
            context: `Ticket #${currentTicket.ticketNumber}: ${currentTicket.title}`,
            rcaCategory: rcaData.rcaCategory,
            contributingFactors: rcaData.rcaContributingFactors || [],
            preventiveMeasures: rcaData.rcaPreventiveMeasures || [],
            analysisLength: rcaData.rootCauseAnalysis?.length || 0,
          },
        },
      });

      return {
        ticketId: updatedTicket.id,
        rootCauseAnalysis: updatedTicket.rootCauseAnalysis!,
        rcaCategory: updatedTicket.rcaCategory!,
        rcaContributingFactors: updatedTicket.rcaContributingFactors || [],
        rcaPreventiveMeasures: updatedTicket.rcaPreventiveMeasures || [],
        rcaCompletedAt: updatedTicket.rcaCompletedAt!,
        rcaCompletedBy: {
          id: updatedTicket.rcaCompletedByUser!.id,
          name: updatedTicket.rcaCompletedByUser!.name,
          email: updatedTicket.rcaCompletedByUser!.email,
        },
      };
    } catch (error) {
      logger.error('Failed to update root cause analysis', {
        error,
        ticketId,
        updatedById,
        rcaData,
      });
      throw error;
    }
  }

  /**
   * Add resolution notes to a support ticket
   * Only assigned support users can add resolution notes
   */
  async addResolutionNotes(
    ticketId: string,
    resolutionData: ISupportTicketResolutionRequest,
    resolvedById: string,
    userAgent?: string
  ): Promise<ISupportTicketResolutionResponse> {
    try {
      // Get user details for audit log
      const resolvedByUser = await this.prisma.user.findUnique({
        where: { id: resolvedById },
        select: { id: true, name: true, email: true, type: true },
      });

      if (!resolvedByUser) {
        throw new AppError('User not found', 404, ErrorCode.NOT_FOUND);
      }

      // Verify user is a support user
      if (resolvedByUser.type !== UserTypeEnum.SUPPORT) {
        throw new AppError(
          'Only support users can add resolution notes',
          403,
          ErrorCode.FORBIDDEN
        );
      }

      const currentTicket = await this.prisma.support_ticket.findUnique({
        where: { id: ticketId },
      });

      if (!currentTicket) {
        throw new AppError(
          'Support ticket not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Verify the user is assigned to this ticket or has admin privileges
      if (
        currentTicket.assignedUserId !== resolvedById &&
        resolvedByUser.type !== UserTypeEnum.SUPPORT
      ) {
        throw new AppError(
          'Only assigned support user or admin can add resolution notes',
          403,
          ErrorCode.FORBIDDEN
        );
      }

      const updatedTicket = await this.prisma.support_ticket.update({
        where: { id: ticketId },
        data: {
          resolutionNotes: resolutionData.resolutionNotes,
          resolvedAt: new Date(),
        },
      });

      // Create comprehensive audit log
      await this.supportTicketActivityService.createAuditLog({
        ticketId: ticketId,
        action: 'resolution_add',
        entityType: 'resolution',
        entityId: ticketId,
        performedById: resolvedById,
        userAgent,
        metadata: {
          description: `${resolvedByUser.name} (${resolvedByUser.email}) added resolution notes`,
          ticketNumber: currentTicket.ticketNumber,
          ticketTitle: currentTicket.title,
          resolutionLength: resolutionData.resolutionNotes?.length || 0,
          userType: resolvedByUser.type,
          timestamp: new Date().toISOString(),
          actionDetails: {
            what: 'Added resolution notes',
            who: resolvedByUser.name,
            when: new Date().toISOString(),
            context: `Ticket #${currentTicket.ticketNumber}: ${currentTicket.title}`,
            resolutionPreview:
              resolutionData.resolutionNotes?.substring(0, 100) +
              (resolutionData.resolutionNotes?.length > 100 ? '...' : ''),
          },
        },
      });

      logger.info('Resolution notes added successfully', {
        ticketId,
        resolvedById,
        resolutionLength: resolutionData.resolutionNotes?.length || 0,
      });

      return {
        ticketId: updatedTicket.id,
        resolutionNotes: updatedTicket.resolutionNotes!,
        resolvedAt: updatedTicket.resolvedAt!,
        resolvedBy: {
          id: resolvedByUser.id,
          name: resolvedByUser.name,
          email: resolvedByUser.email,
        },
      };
    } catch (error) {
      logger.error('Failed to add resolution notes', {
        error,
        ticketId,
        resolvedById,
        resolutionData,
      });
      throw error;
    }
  }

  /**
   * Update resolution notes for a support ticket
   * Only the user who created the resolution or admin can update it
   */
  async updateResolutionNotes(
    ticketId: string,
    resolutionData: ISupportTicketResolutionRequest,
    updatedById: string,
    userAgent?: string
  ): Promise<ISupportTicketResolutionResponse> {
    try {
      // Get user details for audit log
      const updatedByUser = await this.prisma.user.findUnique({
        where: { id: updatedById },
        select: { id: true, name: true, email: true, type: true },
      });

      if (!updatedByUser) {
        throw new AppError('User not found', 404, ErrorCode.NOT_FOUND);
      }

      // Verify user is a support user
      if (updatedByUser.type !== UserTypeEnum.SUPPORT) {
        throw new AppError(
          'Only support users can update resolution notes',
          403,
          ErrorCode.FORBIDDEN
        );
      }

      const currentTicket = await this.prisma.support_ticket.findUnique({
        where: { id: ticketId },
      });

      if (!currentTicket) {
        throw new AppError(
          'Support ticket not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Verify the user is assigned to this ticket or has admin privileges
      if (
        currentTicket.assignedUserId !== updatedById &&
        updatedByUser.type !== UserTypeEnum.SUPPORT
      ) {
        throw new AppError(
          'Only assigned support user or admin can update resolution notes',
          403,
          ErrorCode.FORBIDDEN
        );
      }

      const updatedTicket = await this.prisma.support_ticket.update({
        where: { id: ticketId },
        data: {
          resolutionNotes: resolutionData.resolutionNotes,
          resolvedAt: new Date(), // Update resolution time
        },
      });

      // Create comprehensive audit log
      await this.supportTicketActivityService.createAuditLog({
        ticketId: ticketId,
        action: 'resolution_update',
        entityType: 'resolution',
        entityId: ticketId,
        performedById: updatedById,
        userAgent,
        metadata: {
          description: `${updatedByUser.name} (${updatedByUser.email}) updated resolution notes for ticket #${currentTicket.ticketNumber}`,
          ticketNumber: currentTicket.ticketNumber,
          ticketTitle: currentTicket.title,
          resolutionLength: resolutionData.resolutionNotes?.length || 0,
          userType: updatedByUser.type,
          timestamp: new Date().toISOString(),
          actionDetails: {
            what: 'Updated resolution notes',
            who: updatedByUser.name,
            when: new Date().toISOString(),
            context: `Ticket #${currentTicket.ticketNumber}: ${currentTicket.title}`,
            resolutionPreview:
              resolutionData.resolutionNotes?.substring(0, 100) +
              (resolutionData.resolutionNotes?.length > 100 ? '...' : ''),
          },
        },
      });

      logger.info('Resolution notes updated successfully', {
        ticketId,
        updatedById,
        resolutionLength: resolutionData.resolutionNotes?.length || 0,
      });

      return {
        ticketId: updatedTicket.id,
        resolutionNotes: updatedTicket.resolutionNotes!,
        resolvedAt: updatedTicket.resolvedAt!,
        resolvedBy: {
          id: updatedByUser.id,
          name: updatedByUser.name,
          email: updatedByUser.email,
        },
      };
    } catch (error) {
      logger.error('Failed to update resolution notes', {
        error,
        ticketId,
        updatedById,
        resolutionData,
      });
      throw error;
    }
  }

  /**
   * Get Root Cause Analysis for a support ticket
   */
  async getRootCauseAnalysis(
    ticketId: string
  ): Promise<ISupportTicketRcaResponse | null> {
    try {
      const ticket = await this.prisma.support_ticket.findUnique({
        where: { id: ticketId },
        include: {
          rcaCompletedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Check if ticket exists and has any RCA data
      if (
        !ticket ||
        (!ticket.rootCauseAnalysis &&
          !ticket.rcaCategory &&
          !ticket.rcaCompletedAt)
      ) {
        logger.info('No RCA data found for ticket', {
          ticketId,
          hasTicket: !!ticket,
          hasRootCauseAnalysis: !!ticket?.rootCauseAnalysis,
          hasRcaCategory: !!ticket?.rcaCategory,
          hasRcaCompletedAt: !!ticket?.rcaCompletedAt,
        });
        return null;
      }

      logger.info('RCA data found for ticket', {
        ticketId,
        hasRootCauseAnalysis: !!ticket.rootCauseAnalysis,
        hasRcaCategory: !!ticket.rcaCategory,
        hasRcaCompletedAt: !!ticket.rcaCompletedAt,
        rcaCompletedBy: ticket.rcaCompletedByUser?.name,
        rawData: {
          rootCauseAnalysis: ticket.rootCauseAnalysis,
          rcaCategory: ticket.rcaCategory,
          rcaContributingFactors: ticket.rcaContributingFactors,
          rcaPreventiveMeasures: ticket.rcaPreventiveMeasures,
          rcaCompletedAt: ticket.rcaCompletedAt,
          rcaCompletedBy: ticket.rcaCompletedBy,
        },
        queryResult: ticket, // Log the entire ticket object for debugging
      });

      return {
        ticketId: ticket.id,
        rootCauseAnalysis: ticket.rootCauseAnalysis || '',
        rcaCategory: ticket.rcaCategory || '',
        rcaContributingFactors: ticket.rcaContributingFactors || [],
        rcaPreventiveMeasures: ticket.rcaPreventiveMeasures || [],
        rcaCompletedAt: ticket.rcaCompletedAt!,
        rcaCompletedBy: {
          id: ticket.rcaCompletedByUser!.id,
          name: ticket.rcaCompletedByUser!.name,
          email: ticket.rcaCompletedByUser!.email,
        },
      };
    } catch (error) {
      logger.error('Failed to get root cause analysis', {
        error,
        ticketId,
      });
      throw error;
    }
  }

  /**
   * Get resolution notes for a support ticket
   */
  async getResolutionNotes(
    ticketId: string
  ): Promise<ISupportTicketResolutionResponse | null> {
    try {
      const ticket = await this.prisma.support_ticket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket || !ticket.resolutionNotes) {
        return null;
      }

      // Get the user who resolved the ticket
      const resolvedByUser = await this.prisma.user.findUnique({
        where: { id: ticket.assignedUserId! },
        select: { id: true, name: true, email: true },
      });

      return {
        ticketId: ticket.id,
        resolutionNotes: ticket.resolutionNotes,
        resolvedAt: ticket.resolvedAt!,
        resolvedBy: {
          id: resolvedByUser?.id || '',
          name: resolvedByUser?.name || 'Unknown User',
          email: resolvedByUser?.email || '',
        },
      };
    } catch (error) {
      logger.error('Failed to get resolution notes', {
        error,
        ticketId,
      });
      throw error;
    }
  }

  /**
   * Get comprehensive ticket statistics for all entity types
   */
  async getTicketStatistics(
    filters: ISupportTicketStatisticsFilter = {}
  ): Promise<ISupportTicketStatistics> {
    try {
      // Build base where clause for tickets
      const baseWhereClause: any = {
        isDeleted: false,
      };

      // Apply filters
      if (filters.entityType && filters.entityType.length > 0) {
        baseWhereClause.entityType = { in: filters.entityType };
      }

      if (filters.category && filters.category.length > 0) {
        baseWhereClause.category = { in: filters.category };
      }

      if (filters.priority && filters.priority.length > 0) {
        baseWhereClause.priority = { in: filters.priority };
      }

      if (filters.status && filters.status.length > 0) {
        baseWhereClause.status = { in: filters.status };
      }

      if (filters.assignedUserId) {
        baseWhereClause.assignedUserId = filters.assignedUserId;
      }

      const allTickets = await this.prisma.support_ticket.findMany({
        where: baseWhereClause,
        include: {
          createdBy: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
          slaPolicy: true,
          comments: {
            where: {
              isDeleted: false,
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });

      logger.info('Fetched tickets count', { ticketCount: allTickets.length });

      // Calculate all statistics in parallel
      const [
        overview,
        entityTypeBreakdown,
        entityBreakdown,
        statusBreakdown,
        priorityBreakdown,
        categoryBreakdown,
        assignmentBreakdown,
        performanceMetrics,
        slaMetrics,
        trends,
        timeDistribution,
        supportTeamMetrics,
      ] = await Promise.all([
        this.calculateSupportTicketOverview(allTickets),
        this.calculateEntityTypeBreakdown(allTickets),
        this.calculateEntityBreakdown(allTickets),
        this.calculateSupportTicketStatusBreakdown(allTickets),
        this.calculateSupportTicketPriorityBreakdown(allTickets),
        this.calculateSupportTicketCategoryBreakdown(allTickets),
        this.calculateSupportTicketAssignmentBreakdown(allTickets),
        this.calculateSupportTicketPerformanceMetrics(allTickets),
        this.calculateSupportTicketSlaMetrics(allTickets),
        this.calculateSupportTicketTrends(baseWhereClause),
        this.calculateSupportTicketTimeDistribution(allTickets),
        this.calculateSupportTeamMetrics(allTickets),
      ]);

      logger.info('Support ticket statistics calculated successfully', {
        totalTickets: overview.totalTickets,
        entityTypes: Object.keys(entityTypeBreakdown).length,
      });

      const result = {
        overview,
        entityTypeBreakdown,
        entityBreakdown,
        statusBreakdown,
        priorityBreakdown,
        categoryBreakdown,
        assignmentBreakdown,
        performanceMetrics,
        slaMetrics,
        trends,
        timeDistribution,
        supportTeamMetrics,
      };

      logger.info('Returning statistics result', {
        hasOverview: !!result.overview,
        hasEntityTypeBreakdown: !!result.entityTypeBreakdown,
        overviewTotalTickets: result.overview?.totalTickets,
      });

      return result;
    } catch (error) {
      logger.error('Failed to get support ticket statistics', {
        error,
        filters,
      });
      throw error;
    }
  }

  /**
   * Calculate overview statistics for support tickets
   */
  private async calculateSupportTicketOverview(
    tickets: any[]
  ): Promise<ISupportTicketStatisticsOverview> {
    const now = new Date();
    const totalTickets = tickets.length;

    const openTickets = tickets.filter(
      (t) => t.status === SupportTicketStatusEnum.OPEN
    ).length;
    const inProgressTickets = tickets.filter(
      (t) => t.status === SupportTicketStatusEnum.IN_PROGRESS
    ).length;
    const resolvedTickets = tickets.filter(
      (t) => t.status === SupportTicketStatusEnum.RESOLVED
    ).length;
    const closedTickets = tickets.filter(
      (t) => t.status === SupportTicketStatusEnum.CLOSED
    ).length;
    const overDueTickets = tickets.filter(
      (t) =>
        t.dueDate &&
        new Date(t.dueDate) < now &&
        t.status !== SupportTicketStatusEnum.CLOSED
    ).length;
    const unassignedTickets = tickets.filter((t) => !t.assignedUserId).length;
    const highPriorityTickets = tickets.filter((t) =>
      [
        SupportTicketPriorityEnum.HIGH,
        SupportTicketPriorityEnum.URGENT,
        SupportTicketPriorityEnum.CRITICAL,
      ].includes(t.priority)
    ).length;

    // Calculate average resolution time
    const resolvedTicketsWithTime = tickets.filter(
      (t) => t.status === SupportTicketStatusEnum.RESOLVED && t.resolvedAt
    );
    const averageResolutionTime =
      resolvedTicketsWithTime.length > 0
        ? resolvedTicketsWithTime.reduce((sum, t) => {
            const resolutionTime =
              (new Date(t.resolvedAt).getTime() -
                new Date(t.createdAt).getTime()) /
              (1000 * 60 * 60);
            return sum + resolutionTime;
          }, 0) / resolvedTicketsWithTime.length
        : 0;

    // Calculate average response time (first comment time)
    const ticketsWithComments = tickets.filter(
      (t) => t.comments && t.comments.length > 0
    );
    const averageResponseTime =
      ticketsWithComments.length > 0
        ? ticketsWithComments.reduce((sum, t) => {
            const firstCommentTime =
              new Date(t.comments[0].createdAt).getTime() -
              new Date(t.createdAt).getTime();
            return sum + firstCommentTime / (1000 * 60 * 60);
          }, 0) / ticketsWithComments.length
        : 0;

    // Get unique entity types
    const uniqueEntityTypes = new Set(tickets.map((t) => t.entityType));
    const totalEntities = uniqueEntityTypes.size;

    // Calculate satisfaction score
    const ratedTickets = tickets.filter(
      (t) => t.customerRating && t.customerRating > 0
    );
    const satisfactionScore =
      ratedTickets.length > 0
        ? ratedTickets.reduce((sum, t) => sum + t.customerRating, 0) /
          ratedTickets.length
        : 0;

    // Calculate escalation rate
    const escalatedTickets = tickets.filter((t) => t.escalatedToUserId);
    const escalationRate =
      totalTickets > 0 ? (escalatedTickets.length / totalTickets) * 100 : 0;

    return {
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      overDueTickets,
      unassignedTickets,
      highPriorityTickets,
      averageResolutionTime,
      averageResponseTime,
      totalEntities,
      satisfactionScore,
      escalationRate,
      slaComplianceRate: 0, // TODO: Calculate SLA compliance rate
    };
  }

  /**
   * Calculate entity type breakdown
   */
  private async calculateEntityTypeBreakdown(
    tickets: any[]
  ): Promise<ISupportTicketEntityTypeBreakdown> {
    const breakdown = {
      candidate: 0,
      client: 0,
      partner: 0,
      support: 0,
    };

    tickets.forEach((ticket) => {
      const entityType = ticket.entityType;
      if (Object.prototype.hasOwnProperty.call(breakdown, entityType)) {
        breakdown[entityType as keyof typeof breakdown]++;
      }
    });

    return breakdown;
  }

  private async calculateEntityBreakdown(
    tickets: any[]
  ): Promise<ISupportTicketEntityBreakdown> {
    const entityTypeMap = new Map<string, any[]>();

    tickets.forEach((ticket) => {
      const entityType = ticket.entityType;
      if (!entityTypeMap.has(entityType)) {
        entityTypeMap.set(entityType, []);
      }
      entityTypeMap.get(entityType)!.push(ticket);
    });

    const entityTypes: IEntityTicketSummary[] = [];

    for (const [entityType, entityTickets] of entityTypeMap) {
      const openTickets = entityTickets.filter(
        (t) => t.status === SupportTicketStatusEnum.OPEN
      ).length;
      const highPriorityTickets = entityTickets.filter((t) =>
        [
          SupportTicketPriorityEnum.HIGH,
          SupportTicketPriorityEnum.URGENT,
          SupportTicketPriorityEnum.CRITICAL,
        ].includes(t.priority)
      ).length;

      const resolvedTickets = entityTickets.filter(
        (t) => t.status === SupportTicketStatusEnum.RESOLVED && t.resolvedAt
      );
      const averageResolutionTime =
        resolvedTickets.length > 0
          ? resolvedTickets.reduce((sum, t) => {
              const resolutionTime =
                (new Date(t.resolvedAt).getTime() -
                  new Date(t.createdAt).getTime()) /
                (1000 * 60 * 60);
              return sum + resolutionTime;
            }, 0) / resolvedTickets.length
          : 0;

      const ratedTickets = entityTickets.filter(
        (t) => t.customerRating && t.customerRating > 0
      );
      const satisfactionScore =
        ratedTickets.length > 0
          ? ratedTickets.reduce((sum, t) => sum + t.customerRating, 0) /
            ratedTickets.length
          : 0;

      const lastTicketDate =
        entityTickets.length > 0
          ? new Date(
              Math.max(
                ...entityTickets.map((t) => new Date(t.createdAt).getTime())
              )
            )
          : undefined;

      entityTypes.push({
        entityId: entityType, // Using entityType as entityId for now
        entityName: entityType, // Using entityType as entityName for now
        entityType: entityType as SupportTicketEntityTypeEnum,
        totalTickets: entityTickets.length,
        openTickets,
        highPriorityTickets,
        averageResolutionTime,
        satisfactionScore,
        lastTicketDate,
        escalationCount: entityTickets.filter((t) => t.escalatedAt).length,
        slaBreachCount: entityTickets.filter((t) => t.isSlaBreach).length,
      });
    }

    return {
      totalEntities: entityTypes.length,
      entities: entityTypes.sort((a, b) => b.totalTickets - a.totalTickets),
    };
  }

  /**
   * Calculate status breakdown
   */
  private async calculateSupportTicketStatusBreakdown(
    tickets: any[]
  ): Promise<ISupportTicketStatusBreakdown> {
    return {
      open: tickets.filter((t) => t.status === SupportTicketStatusEnum.OPEN)
        .length,
      assigned: tickets.filter(
        (t) => t.assignedUserId && t.status === SupportTicketStatusEnum.OPEN
      ).length,
      inProgress: tickets.filter(
        (t) => t.status === SupportTicketStatusEnum.IN_PROGRESS
      ).length,
      pending: tickets.filter(
        (t) => t.status === SupportTicketStatusEnum.PENDING
      ).length,
      resolved: tickets.filter(
        (t) => t.status === SupportTicketStatusEnum.RESOLVED
      ).length,
      closed: tickets.filter((t) => t.status === SupportTicketStatusEnum.CLOSED)
        .length,
      cancelled: tickets.filter(
        (t) => t.status === SupportTicketStatusEnum.CANCELLED
      ).length,
      reopened: tickets.filter(
        (t) => t.status === SupportTicketStatusEnum.REOPENED
      ).length,
    };
  }

  /**
   * Calculate priority breakdown
   */
  private async calculateSupportTicketPriorityBreakdown(
    tickets: any[]
  ): Promise<ISupportTicketPriorityBreakdown> {
    return {
      low: tickets.filter((t) => t.priority === SupportTicketPriorityEnum.LOW)
        .length,
      medium: tickets.filter(
        (t) => t.priority === SupportTicketPriorityEnum.MEDIUM
      ).length,
      high: tickets.filter((t) => t.priority === SupportTicketPriorityEnum.HIGH)
        .length,
      urgent: tickets.filter(
        (t) => t.priority === SupportTicketPriorityEnum.URGENT
      ).length,
      critical: tickets.filter(
        (t) => t.priority === SupportTicketPriorityEnum.CRITICAL
      ).length,
    };
  }

  /**
   * Calculate category breakdown
   */
  private async calculateSupportTicketCategoryBreakdown(
    tickets: any[]
  ): Promise<ISupportTicketCategoryBreakdown> {
    return {
      technical: tickets.filter(
        (t) => t.category === SupportTicketCategoryEnum.TECHNICAL
      ).length,
      billing: tickets.filter(
        (t) => t.category === SupportTicketCategoryEnum.BILLING
      ).length,
      account: tickets.filter(
        (t) => t.category === SupportTicketCategoryEnum.ACCOUNT
      ).length,
      feature: tickets.filter(
        (t) => t.category === SupportTicketCategoryEnum.FEATURE
      ).length,
      bug: tickets.filter((t) => t.category === SupportTicketCategoryEnum.BUG)
        .length,
      general: tickets.filter(
        (t) => t.category === SupportTicketCategoryEnum.GENERAL
      ).length,
      integration: tickets.filter(
        (t) => t.category === SupportTicketCategoryEnum.INTEGRATION
      ).length,
      security: tickets.filter(
        (t) => t.category === SupportTicketCategoryEnum.SECURITY
      ).length,
    };
  }

  /**
   * Calculate assignment breakdown
   */
  private async calculateSupportTicketAssignmentBreakdown(
    tickets: any[]
  ): Promise<ISupportTicketAssignmentBreakdown> {
    const unassignedTickets = tickets.filter((t) => !t.assignedUserId).length;

    const assignmentMap = new Map<string, any[]>();
    tickets.forEach((ticket) => {
      if (ticket.assignedUserId) {
        if (!assignmentMap.has(ticket.assignedUserId)) {
          assignmentMap.set(ticket.assignedUserId, []);
        }
        assignmentMap.get(ticket.assignedUserId)!.push(ticket);
      }
    });

    const assignments: ISupportTicketAssignmentSummary[] = [];

    for (const [userId, userTickets] of assignmentMap) {
      const user = userTickets[0].assignedTo?.user;
      if (!user) continue;

      const openTickets = userTickets.filter(
        (t) => t.status === SupportTicketStatusEnum.OPEN
      ).length;
      const inProgressTickets = userTickets.filter(
        (t) => t.status === SupportTicketStatusEnum.IN_PROGRESS
      ).length;
      const resolvedTickets = userTickets.filter(
        (t) => t.status === SupportTicketStatusEnum.RESOLVED
      ).length;

      const resolvedTicketsWithTime = userTickets.filter(
        (t) => t.status === SupportTicketStatusEnum.RESOLVED && t.resolvedAt
      );
      const averageResolutionTime =
        resolvedTicketsWithTime.length > 0
          ? resolvedTicketsWithTime.reduce((sum, t) => {
              const resolutionTime =
                (new Date(t.resolvedAt).getTime() -
                  new Date(t.createdAt).getTime()) /
                (1000 * 60 * 60);
              return sum + resolutionTime;
            }, 0) / resolvedTicketsWithTime.length
          : 0;

      // Determine workload
      let workload: 'LOW' | 'MEDIUM' | 'HIGH' | 'OVERLOADED' = 'LOW';
      if (userTickets.length >= 20) workload = 'OVERLOADED';
      else if (userTickets.length >= 10) workload = 'HIGH';
      else if (userTickets.length >= 5) workload = 'MEDIUM';

      assignments.push({
        userId,
        userName: user.name || 'Unknown User',
        userEmail: user.email || '',
        // userRole removed as it's not in the assignment summary interface
        totalTickets: userTickets.length,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        averageResolutionTime,
        workload,
        satisfactionScore: 0, // TODO: Calculate satisfaction score
        escalationCount: userTickets.filter((t) => t.escalatedAt).length,
        slaBreachCount: userTickets.filter((t) => t.isSlaBreach).length,
      });
    }

    return {
      unassignedTickets,
      totalSupportUsers: assignments.length,
      assignments: assignments.sort((a, b) => b.totalTickets - a.totalTickets),
    };
  }

  /**
   * Calculate performance metrics
   */
  private async calculateSupportTicketPerformanceMetrics(
    tickets: any[]
  ): Promise<ISupportTicketPerformanceMetrics> {
    const resolvedTickets = tickets.filter(
      (t) => t.status === SupportTicketStatusEnum.RESOLVED && t.resolvedAt
    );
    const ticketsWithComments = tickets.filter(
      (t) => t.comments && t.comments.length > 0
    );
    const ratedTickets = tickets.filter(
      (t) => t.customerRating && t.customerRating > 0
    );
    const escalatedTickets = tickets.filter((t) => t.escalatedToUserId);
    const reopenedTickets = tickets.filter(
      (t) => t.status === SupportTicketStatusEnum.REOPENED
    );

    // Calculate response times
    const responseTimes = ticketsWithComments.map((t) => {
      const firstCommentTime =
        new Date(t.comments[0].createdAt).getTime() -
        new Date(t.createdAt).getTime();
      return firstCommentTime / (1000 * 60 * 60); // Convert to hours
    });

    const resolutionTimes = resolvedTickets.map((t) => {
      const resolutionTime =
        new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime();
      return resolutionTime / (1000 * 60 * 60); // Convert to hours
    });

    const averageFirstResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) /
          responseTimes.length
        : 0;

    const averageResolutionTime =
      resolutionTimes.length > 0
        ? resolutionTimes.reduce((sum, time) => sum + time, 0) /
          resolutionTimes.length
        : 0;

    const medianResolutionTime =
      resolutionTimes.length > 0
        ? resolutionTimes.sort((a, b) => a - b)[
            Math.floor(resolutionTimes.length / 2)
          ]
        : 0;

    const totalResponseCount = tickets.reduce(
      (sum, t) => sum + (t.comments?.length || 0),
      0
    );

    return {
      averageFirstResponseTime,
      averageResolutionTime,
      medianResolutionTime,
      resolutionRate:
        tickets.length > 0
          ? (resolvedTickets.length / tickets.length) * 100
          : 0,
      firstCallResolutionRate:
        tickets.length > 0
          ? (resolvedTickets.filter((t) => t.comments?.length <= 1).length /
              tickets.length) *
            100
          : 0,
      reopenRate:
        tickets.length > 0
          ? (reopenedTickets.length / tickets.length) * 100
          : 0,
      escalationRate:
        tickets.length > 0
          ? (escalatedTickets.length / tickets.length) * 100
          : 0,
      customerSatisfactionScore:
        ratedTickets.length > 0
          ? ratedTickets.reduce((sum, t) => sum + t.customerRating, 0) /
            ratedTickets.length
          : 0,
      totalResponseCount,
      averageResponsesPerTicket:
        tickets.length > 0 ? totalResponseCount / tickets.length : 0,
      slaComplianceRate: 0, // TODO: Calculate SLA compliance rate
    };
  }

  /**
   * Calculate SLA metrics
   */
  private async calculateSupportTicketSlaMetrics(
    tickets: any[]
  ): Promise<ISupportTicketSlaMetrics> {
    const ticketsWithSla = tickets.filter((t) => t.slaPolicy);
    const ticketsWithinSla = ticketsWithSla.filter(
      (t) => !t.isSlaBreach
    ).length;
    const ticketsBreachingSla = ticketsWithSla.filter(
      (t) => t.isSlaBreach
    ).length;
    const ticketsAtRisk = ticketsWithSla.filter((t) => {
      if (!t.dueDate || t.status === SupportTicketStatusEnum.CLOSED)
        return false;
      const hoursUntilDue =
        (new Date(t.dueDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60);
      return hoursUntilDue <= 24 && hoursUntilDue > 0; // At risk if due within 24 hours
    }).length;

    const slaComplianceRate =
      ticketsWithSla.length > 0
        ? (ticketsWithinSla / ticketsWithSla.length) * 100
        : 0;

    // Calculate average SLA breach time
    const breachedTickets = ticketsWithSla.filter(
      (t) => t.isSlaBreach && t.resolvedAt
    );
    const averageSlaBreachTime =
      breachedTickets.length > 0
        ? breachedTickets.reduce((sum, t) => {
            const breachTime =
              (new Date(t.resolvedAt).getTime() -
                new Date(t.dueDate).getTime()) /
              (1000 * 60 * 60);
            return sum + breachTime;
          }, 0) / breachedTickets.length
        : 0;

    // Calculate SLA breakdown by priority
    const slaBreakdownByPriority = {
      low: this.calculateSlaByPriority(
        ticketsWithSla,
        SupportTicketPriorityEnum.LOW
      ),
      medium: this.calculateSlaByPriority(
        ticketsWithSla,
        SupportTicketPriorityEnum.MEDIUM
      ),
      high: this.calculateSlaByPriority(
        ticketsWithSla,
        SupportTicketPriorityEnum.HIGH
      ),
      urgent: this.calculateSlaByPriority(
        ticketsWithSla,
        SupportTicketPriorityEnum.URGENT
      ),
      critical: this.calculateSlaByPriority(
        ticketsWithSla,
        SupportTicketPriorityEnum.CRITICAL
      ),
    };

    return {
      totalTicketsWithSla: ticketsWithSla.length,
      ticketsWithinSla,
      ticketsBreachingSla,
      slaComplianceRate,
      averageSlaBreachTime,
      ticketsAtRisk,
      slaBreakdownByPriority,
    };
  }

  /**
   * Calculate SLA metrics by priority
   */
  private calculateSlaByPriority(
    tickets: any[],
    priority: SupportTicketPriorityEnum
  ) {
    const priorityTickets = tickets.filter((t) => t.priority === priority);
    const compliant = priorityTickets.filter((t) => !t.isSlaBreach).length;
    const breached = priorityTickets.filter((t) => t.isSlaBreach).length;

    return {
      total: priorityTickets.length,
      compliant,
      breached,
    };
  }

  /**
   * Calculate trends
   */
  private async calculateSupportTicketTrends(
    baseWhereClause: any
  ): Promise<ISupportTicketTrends> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get daily trend data for last 7 days
    const last7DaysData: ISupportTicketDailyTrendData[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const startOfDay = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      const dayTickets = await this.prisma.support_ticket.findMany({
        where: {
          ...baseWhereClause,
          createdAt: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
      });

      const resolvedTickets = await this.prisma.support_ticket.findMany({
        where: {
          ...baseWhereClause,
          resolvedAt: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
      });

      const closedTickets = await this.prisma.support_ticket.findMany({
        where: {
          ...baseWhereClause,
          status: SupportTicketStatusEnum.CLOSED,
          updatedAt: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
      });

      last7DaysData.push({
        date: startOfDay.toISOString().split('T')[0],
        created: dayTickets.length,
        resolved: resolvedTickets.length,
        closed: closedTickets.length,
        escalated: dayTickets.filter((t) => t.escalatedAt).length,
      });
    }

    // Get daily trend data for last 30 days
    const last30DaysData: ISupportTicketDailyTrendData[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const startOfDay = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      const dayTickets = await this.prisma.support_ticket.findMany({
        where: {
          ...baseWhereClause,
          createdAt: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
      });

      const resolvedTickets = await this.prisma.support_ticket.findMany({
        where: {
          ...baseWhereClause,
          resolvedAt: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
      });

      const closedTickets = await this.prisma.support_ticket.findMany({
        where: {
          ...baseWhereClause,
          status: SupportTicketStatusEnum.CLOSED,
          updatedAt: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
      });

      last30DaysData.push({
        date: startOfDay.toISOString().split('T')[0],
        created: dayTickets.length,
        resolved: resolvedTickets.length,
        closed: closedTickets.length,
        escalated: dayTickets.filter((t) => t.escalatedAt).length,
      });
    }

    // Calculate monthly growth rate
    const currentMonthTickets = await this.prisma.support_ticket.count({
      where: {
        ...baseWhereClause,
        createdAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), 1),
        },
      },
    });

    const lastMonthTickets = await this.prisma.support_ticket.count({
      where: {
        ...baseWhereClause,
        createdAt: {
          gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          lt: new Date(now.getFullYear(), now.getMonth(), 1),
        },
      },
    });

    const monthlyGrowthRate =
      lastMonthTickets > 0
        ? ((currentMonthTickets - lastMonthTickets) / lastMonthTickets) * 100
        : 0;

    // Calculate resolution trend
    const recentResolved = last7DaysData.reduce(
      (sum, day) => sum + day.resolved,
      0
    );
    const olderResolved = last30DaysData
      .slice(0, 7)
      .reduce((sum, day) => sum + day.resolved, 0);
    const resolutionTrend =
      recentResolved > olderResolved
        ? 'IMPROVING'
        : recentResolved < olderResolved
          ? 'DECLINING'
          : 'STABLE';

    // Calculate average tickets per day
    const totalCreated = last30DaysData.reduce(
      (sum, day) => sum + day.created,
      0
    );
    const averageTicketsPerDay = totalCreated / 30;

    // Find peak day and hour
    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const dayCounts = new Array(7).fill(0);
    const hourCounts = new Array(24).fill(0);

    const allTickets = await this.prisma.support_ticket.findMany({
      where: {
        ...baseWhereClause,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        createdAt: true,
      },
    });

    allTickets.forEach((ticket) => {
      const date = new Date(ticket.createdAt);
      dayCounts[date.getDay()]++;
      hourCounts[date.getHours()]++;
    });

    const peakDayOfWeek = dayNames[dayCounts.indexOf(Math.max(...dayCounts))];
    const peakHourOfDay = hourCounts.indexOf(Math.max(...hourCounts));

    return {
      last7Days: last7DaysData,
      last30Days: last30DaysData,
      monthlyGrowthRate,
      resolutionTrend,
      averageTicketsPerDay,
      peakDayOfWeek,
      peakHourOfDay,
      escalationTrend: 'STABLE' as const, // TODO: Calculate escalation trend
    };
  }

  /**
   * Calculate time distribution
   */
  private async calculateSupportTicketTimeDistribution(
    tickets: any[]
  ): Promise<ISupportTicketTimeDistribution> {
    const hourCounts = new Array(24).fill(0);
    const dayCounts = new Array(7).fill(0);
    const monthCounts = new Map<string, number>();

    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    tickets.forEach((ticket) => {
      const date = new Date(ticket.createdAt);
      hourCounts[date.getHours()]++;
      dayCounts[date.getDay()]++;

      const monthKey = `${date.getFullYear()}-${monthNames[date.getMonth()]}`;
      monthCounts.set(monthKey, (monthCounts.get(monthKey) || 0) + 1);
    });

    const byHour = hourCounts.map((count, hour) => ({ hour, count }));
    const byDayOfWeek = dayCounts.map((count, day) => ({
      dayOfWeek: dayNames[day],
      count,
    }));
    const byMonth = Array.from(monthCounts.entries()).map(([month, count]) => ({
      month,
      count,
    }));

    // Calculate business hours (9 AM to 5 PM, Monday to Friday)
    const businessHoursTickets = tickets.filter((ticket) => {
      const date = new Date(ticket.createdAt);
      const hour = date.getHours();
      const day = date.getDay();
      return hour >= 9 && hour < 17 && day >= 1 && day <= 5;
    }).length;

    const businessHoursPercentage =
      tickets.length > 0 ? (businessHoursTickets / tickets.length) * 100 : 0;
    const afterHoursPercentage = 100 - businessHoursPercentage;

    return {
      byHour,
      byDayOfWeek,
      byMonth,
      businessHours: {
        total: businessHoursTickets,
        percentage: businessHoursPercentage,
      },
      afterHours: {
        total: tickets.length - businessHoursTickets,
        percentage: afterHoursPercentage,
      },
    };
  }

  /**
   * Calculate support team metrics
   */
  private async calculateSupportTeamMetrics(
    tickets: any[]
  ): Promise<ISupportTicketSupportTeamMetrics> {
    // Get unique support users from tickets
    const supportUsers = new Map<string, any>();

    tickets.forEach((ticket) => {
      if (ticket.assignedUserId) {
        supportUsers.set(ticket.assignedUserId, {
          userId: ticket.assignedUserId,
          userName: ticket.assignedTo?.user?.name || 'Unknown',
          userEmail: ticket.assignedTo?.user?.email || 'unknown@example.com',
        });
      }
    });

    const totalSupportUsers = supportUsers.size;
    const activeSupportUsers = supportUsers.size; // All users with tickets are active

    // Calculate metrics for each support user
    const userMetrics = Array.from(supportUsers.values()).map((user) => {
      const userTickets = tickets.filter(
        (t) => t.assignedUserId === user.userId
      );
      const resolvedTickets = userTickets.filter(
        (t) => t.status === SupportTicketStatusEnum.RESOLVED
      ).length;
      const _openTickets = userTickets.filter(
        (t) => t.status === SupportTicketStatusEnum.OPEN
      ).length;
      const _inProgressTickets = userTickets.filter(
        (t) => t.status === SupportTicketStatusEnum.IN_PROGRESS
      ).length;

      // Calculate average resolution time
      const resolvedTicketsWithTime = userTickets.filter(
        (t) => t.status === SupportTicketStatusEnum.RESOLVED && t.resolvedAt
      );
      const averageResolutionTime =
        resolvedTicketsWithTime.length > 0
          ? resolvedTicketsWithTime.reduce((sum, ticket) => {
              const created = new Date(ticket.createdAt).getTime();
              const resolved = new Date(ticket.resolvedAt).getTime();
              return sum + (resolved - created) / (1000 * 60 * 60); // Convert to hours
            }, 0) / resolvedTicketsWithTime.length
          : 0;

      // Calculate satisfaction score
      const ratedTickets = userTickets.filter((t) => t.customerRating);
      const satisfactionScore =
        ratedTickets.length > 0
          ? ratedTickets.reduce(
              (sum, ticket) => sum + ticket.customerRating,
              0
            ) / ratedTickets.length
          : 0;

      return {
        userId: user.userId,
        userName: user.userName,
        resolvedTickets,
        averageResolutionTime,
        satisfactionScore,
      };
    });

    // Sort by resolved tickets to get top performers
    const topPerformers = userMetrics
      .sort((a, b) => b.resolvedTickets - a.resolvedTickets)
      .slice(0, 5);

    // Calculate workload distribution
    const workloadDistribution = {
      underUtilized: 0,
      balanced: 0,
      highWorkload: 0,
      overloaded: 0,
    };

    userMetrics.forEach((user) => {
      const totalTickets = tickets.filter(
        (t) => t.assignedUserId === user.userId
      ).length;
      if (totalTickets < 5) {
        workloadDistribution.underUtilized++;
      } else if (totalTickets <= 15) {
        workloadDistribution.balanced++;
      } else if (totalTickets <= 25) {
        workloadDistribution.highWorkload++;
      } else {
        workloadDistribution.overloaded++;
      }
    });

    // Calculate team averages
    const teamSatisfactionScore =
      userMetrics.length > 0
        ? userMetrics.reduce((sum, user) => sum + user.satisfactionScore, 0) /
          userMetrics.length
        : 0;

    const teamEscalationRate =
      tickets.length > 0
        ? (tickets.filter((t) => t.escalatedAt).length / tickets.length) * 100
        : 0;

    return {
      totalSupportUsers,
      activeSupportUsers,
      averageTicketsPerUser:
        totalSupportUsers > 0 ? tickets.length / totalSupportUsers : 0,
      topPerformers,
      workloadDistribution,
      teamSatisfactionScore,
      teamEscalationRate,
    };
  }
}
