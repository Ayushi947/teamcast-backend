import { PrismaClient } from '@prisma/client';
import {
  ISupportTicket,
  ISupportTicketCreate,
  ISupportTicketListItemResponse,
  ISupportTicketSort,
} from '@/shared/models/domain/support-ticket/support-ticket.domain';
import {
  SupportTicketPriorityEnum,
  SupportTicketEntityTypeEnum,
} from '@/shared/models/common/enums';
import { singleton } from '@/shared/decorators/singleton';
import { logger } from '@/shared/utils/logger';
import { DocumentService } from '../common/document.service';
import { getBucketFolderPathToSupportTicketAttachments } from '@/utils/presigned.urls';
import { StorageFactory } from '../helpers/storage/storage.factory';
import { v4 as uuidv4 } from 'uuid';
import {
  IClientSupportTicketCreateApiRequest,
  IClientSupportTicketListApiRequest,
} from '@/shared/models/api/support-ticket/client-support-ticket.api';
import { IClientSupportTicketAttachment } from '@/shared/models/domain/support-ticket/client-support-ticket.domain';
import {
  buildQueryConditions,
  ISearchConfig,
  IFilterConfig,
  ISortConfig,
} from '@/utils/pagination';
import { SupportTicketService } from './support-ticket.service';

/**
 * Client Support Ticket Service
 * Handles support ticket creation by clients with automatic account manager assignment
 */
@singleton
export class ClientSupportTicketService {
  private readonly prisma: PrismaClient;
  private readonly documentService: DocumentService;
  private readonly storageService: any;
  private readonly supportTicketService: SupportTicketService;

  constructor() {
    this.prisma = new PrismaClient();
    // Initialize storage service
    this.storageService = StorageFactory.getInstance().getProvider();
    // Initialize document service with storage provider
    this.documentService = new DocumentService(this.storageService);
    this.supportTicketService = new SupportTicketService();
  }

  /**
   * Create a support ticket for a client and assign it to their account manager
   * Priority and due date are now inherited from SLA policy
   * Files are uploaded directly to GCP during ticket creation
   */
  async createClientSupportTicket(
    ticketData: IClientSupportTicketCreateApiRequest,
    clientId: string,
    createdByUserId: string,
    userAgent?: string,
    files?: Express.Multer.File[]
  ): Promise<ISupportTicket> {
    try {
      logger.info('Creating client support ticket', {
        clientId,
        createdByUserId,
        fileCount: files?.length || 0,
        ticketData: {
          title: ticketData.data.title,
          category: ticketData.data.category,
          subcategory: ticketData.data.subcategory,
        },
      });

      // 1. Verify the client exists
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
        include: {
          company: {
            select: { id: true, name: true },
          },
        },
      });

      if (!client) {
        throw new Error('Client not found');
      }

      // 2. Verify the user is associated with this client
      const clientUser = await this.prisma.client_user.findFirst({
        where: { clientId, userId: createdByUserId },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      });

      if (!clientUser) {
        throw new Error('User is not associated with this client');
      }

      // 3. Find account manager
      const accountManager = await this.findClientAccountManager(clientId);
      if (!accountManager) {
        logger.warn('No account manager found for client', {
          clientId,
          companyName: client.company.name,
        });
      }

      // 4. Prepare ticket creation data
      const createData: ISupportTicketCreate = {
        title: ticketData.data.title,
        description: ticketData.data.description,
        category: ticketData.data.category,
        subcategory: ticketData.data.subcategory,
        entityType:
          ticketData.data.entityType || SupportTicketEntityTypeEnum.CLIENT,
        targetId: ticketData.data.targetId || '',
        targetType: ticketData.data.targetType || '',
        createdById: createdByUserId,
        ...(accountManager?.id && { assignedUserId: accountManager.id }),
        isBacklog: false,
      };

      // 5. Create the support ticket
      const ticket = await this.supportTicketService.createTicket(
        createData,
        createdByUserId,
        userAgent
      );

      // 6. Process attachments (AFTER ticket creation, so you have ticket.id)
      const uploadedAttachments: Array<IClientSupportTicketAttachment> = [];

      if (files && files.length > 0) {
        logger.info('Processing file uploads for support ticket', {
          clientId,
          fileCount: files.length,
          ticketId: ticket.id,
        });

        for (const file of files) {
          try {
            const documentId = uuidv4();

            // Handle Express.Multer.File type
            if (this.isMulterFile(file)) {
              // Express.Multer.File - use directly
              const fileExtension = this.getFileExtension(file.originalname);
              const uniqueFileName = `${documentId}_${Date.now()}${fileExtension}`;

              const { folderPath } =
                getBucketFolderPathToSupportTicketAttachments(
                  createdByUserId,
                  ticket.id
                );
              const filePath = `${folderPath}/${uniqueFileName}`;

              // Upload file
              const uploadedUrl = await this.storageService.uploadFile(
                file.buffer,
                filePath
              );

              // Save record in DB
              await this.prisma.support_ticket_attachment.create({
                data: {
                  ticketId: ticket.id,
                  uploadedById: createdByUserId,
                  fileName: file.originalname,
                  originalName: file.originalname,
                  filePath,
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

              uploadedAttachments.push({
                fileName: file.originalname,
                presignedUrl: uploadedUrl,
              });

              logger.info('File uploaded successfully', {
                ticketId: ticket.id,
                documentId,
                fileName: file.originalname,
                uploadedUrl,
              });
            }
          } catch (error) {
            logger.error('Failed to upload attachment', {
              error,
              fileName: file.originalname,
            });
          }
        }
      } else {
        logger.info('No files to process for support ticket', {
          ticketId: ticket.id,
        });
      }

      // 7. Assign SLA policy
      try {
        const slaPolicyService = new (
          await import('./sla-policy.service')
        ).SlaPolicyService();
        await slaPolicyService.autoAssignPolicyToTicket(ticket.id, {
          entityType: SupportTicketEntityTypeEnum.CLIENT,
          category: ticketData.data.category,
          priority: SupportTicketPriorityEnum.MEDIUM,
        });
      } catch (slaError) {
        logger.error('Failed to assign SLA policy', {
          error: slaError,
          ticketId: ticket.id,
          category: ticketData.data.category,
        });
      }

      logger.info('Client support ticket created successfully', {
        ticketId: ticket.id,
        clientId,
        clientName: client.company.name,
        createdByUserId,
        attachmentCount: uploadedAttachments.length,
      });

      return ticket;
    } catch (error) {
      logger.error('Failed to create client support ticket', {
        error,
        ticketData: ticketData.data,
        clientId,
        createdByUserId,
      });
      throw error;
    }
  }

  /**
   * Find the account manager assigned to a client
   */
  private async findClientAccountManager(clientId: string): Promise<{
    id: string;
    userId: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  } | null> {
    try {
      const assignment =
        await this.prisma.client_account_manager_assignment.findUnique({
          where: { clientId },
          include: {
            accountManager: {
              include: {
                user: {
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

      if (!assignment) {
        return null;
      }

      return {
        id: assignment.accountManager.id,
        userId: assignment.accountManager.userId,
        user: assignment.accountManager.user,
      };
    } catch (error) {
      logger.error('Failed to find client account manager', {
        error,
        clientId,
      });
      return null;
    }
  }

  /**
   * Get support tickets for a specific client using pagination utilities
   */
  async getClientSupportTickets(
    clientId: string,
    request: IClientSupportTicketListApiRequest
  ): Promise<{
    tickets: ISupportTicketListItemResponse[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      // Verify the client exists
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
        select: { id: true },
      });

      if (!client) {
        throw new Error('Client not found');
      }

      // Define search, filter, and sort configurations
      const searchConfig: ISearchConfig = {
        searchableFields: ['title', 'description', 'ticketNumber'],
        relationFields: {
          createdBy: ['name', 'email'],
          assignedTo: ['name', 'email'],
        },
      };

      const filterConfig: IFilterConfig = {
        allowedFields: [
          'status',
          'priority',
          'category',
          'subcategory',
          'ticketType',
          'createdFrom',
          'createdTo',
        ],
        enumFields: [
          'status',
          'priority',
          'category',
          'subcategory',
          'ticketType',
        ],
        arrayFields: [
          'status',
          'priority',
          'category',
          'subcategory',
          'ticketType',
        ],
      };

      const sortConfig: ISortConfig = {
        allowedFields: [
          'createdAt',
          'updatedAt',
          'title',
          'priority',
          'status',
        ],
        defaultSort: { field: 'createdAt', order: 'desc' },
      };

      // Build query conditions using pagination utilities
      const queryConditions = buildQueryConditions(
        {
          ...request.data,
          targetId: clientId,
          entityType: [SupportTicketEntityTypeEnum.CLIENT],
        },
        request.pagination,
        {
          search: searchConfig,
          filter: filterConfig,
          sort: sortConfig,
        }
      );

      // Use the main support ticket service to list tickets
      const result = await this.supportTicketService.listTickets(
        queryConditions.where,
        this.convertOrderByToSort(queryConditions.orderBy),
        {
          page: queryConditions.pagination.page,
          limit: queryConditions.pagination.limit,
        }
      );

      if (!result.items) {
        throw new Error('No data returned from service');
      }

      logger.info('Retrieved client support tickets', {
        clientId,
        ticketCount: result.items.length,
        totalTickets: result.pagination.total,
      });

      return {
        tickets: result.items,
        pagination: {
          page: result.pagination.page,
          limit: result.pagination.limit,
          total: result.pagination.total || 0,
          totalPages: result.pagination.totalPages || 0,
        },
      };
    } catch (error) {
      logger.error('Failed to get client support tickets', {
        error,
        clientId,
        request,
      });
      throw error;
    }
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : '';
  }

  /**
   * Type guard to check if file is Express.Multer.File
   */
  private isMulterFile(file: any): file is Express.Multer.File {
    return 'originalname' in file && 'mimetype' in file && 'buffer' in file;
  }

  /**
   * Converts the orderBy object from pagination utilities to the format expected by ISupportTicketSort
   */
  private convertOrderByToSort(
    orderBy: Record<string, any>
  ): ISupportTicketSort {
    // Extract the first key-value pair from orderBy object
    const [field, direction] = Object.entries(orderBy)[0] || [
      'createdAt',
      'desc',
    ];

    return {
      field: field as ISupportTicketSort['field'],
      direction: direction as 'asc' | 'desc',
    };
  }
}
