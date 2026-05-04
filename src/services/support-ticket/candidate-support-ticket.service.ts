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
  SupportClientTicketSubcategoryEnum,
} from '@/shared/models/common/enums';
import { singleton } from '@/shared/decorators/singleton';
import { logger } from '@/shared/utils/logger';
import { DocumentService } from '../common/document.service';
import { getBucketFolderPathToSupportTicketAttachments } from '@/utils/presigned.urls';
import { StorageFactory } from '../helpers/storage/storage.factory';
import { v4 as uuidv4 } from 'uuid';
import {
  ICandidateSupportTicketCreateApiRequest,
  ICandidateSupportTicketListApiRequest,
} from '@/shared/models/api/support-ticket/candidate-support-ticket.api';
import { ICandidateSupportTicketAttachment } from '@/shared/models/domain/support-ticket/candidate-support-ticket.domain';
import {
  buildQueryConditions,
  ISearchConfig,
  IFilterConfig,
  ISortConfig,
} from '@/utils/pagination';
import { SupportTicketService } from './support-ticket.service';

/**
 * Candidate Support Ticket Service
 * Handles support ticket creation by candidates with automatic support assignment
 */
@singleton
export class CandidateSupportTicketService {
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
   * Create a support ticket for a candidate and assign it to appropriate support user
   * Priority and due date are now inherited from SLA policy
   * Files are uploaded directly to GCP during ticket creation
   */
  async createCandidateSupportTicket(
    ticketData: ICandidateSupportTicketCreateApiRequest,
    createdByUserId: string,
    userAgent?: string,
    files?: Express.Multer.File[]
  ): Promise<ISupportTicket> {
    try {
      // 3. Find available support user (simple round-robin or least busy assignment)
      const supportUser = await this.findAvailableSupportUser();
      if (!supportUser) {
        logger.warn('No available support user found for candidate ticket');
      }

      // 4. Prepare ticket creation data
      const createData: ISupportTicketCreate = {
        title: ticketData.data.title,
        description: ticketData.data.description,
        category: ticketData.data.category,
        subcategory: ticketData.data.subcategory as
          | SupportClientTicketSubcategoryEnum
          | undefined,
        entityType:
          ticketData.data.entityType || SupportTicketEntityTypeEnum.CANDIDATE,
        targetId: ticketData.data.targetId || '',
        targetType: ticketData.data.targetType || 'CANDIDATE_PROFILE',
        createdById: createdByUserId,
        ...(supportUser?.id && { assignedUserId: supportUser.id }),
        isBacklog: false,
      };

      // 5. Create the support ticket
      const ticket = await this.supportTicketService.createTicket(
        createData,
        createdByUserId,
        userAgent
      );

      // 6. Process attachments (AFTER ticket creation, so you have ticket.id)
      const uploadedAttachments: Array<ICandidateSupportTicketAttachment> = [];

      if (files && files.length > 0) {
        logger.info('Processing file uploads for candidate support ticket', {
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
        logger.info('No files to process for candidate support ticket', {
          ticketId: ticket.id,
        });
      }

      // 7. Assign SLA policy
      try {
        const slaPolicyService = new (
          await import('./sla-policy.service')
        ).SlaPolicyService();
        await slaPolicyService.autoAssignPolicyToTicket(ticket.id, {
          entityType: SupportTicketEntityTypeEnum.CANDIDATE,
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

      return ticket;
    } catch (error) {
      logger.error('Failed to create candidate support ticket', {
        error,
        ticketData: ticketData.data,
        createdByUserId,
      });
      throw error;
    }
  }

  /**
   * Find an available support user for assignment
   * This is a simplified implementation - you may want to implement more sophisticated logic
   */
  private async findAvailableSupportUser(): Promise<{
    id: string;
    userId: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  } | null> {
    try {
      // Find a support user with least active tickets (simple load balancing)
      const supportUser = await this.prisma.support_user.findFirst({
        where: {
          user: {
            role: 'TECHNICAL_SUPPORT',
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc', // Simple round-robin by creation order
        },
      });

      if (!supportUser) {
        return null;
      }

      return {
        id: supportUser.id,
        userId: supportUser.userId,
        user: supportUser.user,
      };
    } catch (error) {
      logger.error('Failed to find available support user', {
        error,
      });
      return null;
    }
  }

  /**
   * Get support tickets for a specific candidate using pagination utilities
   */
  async getCandidateSupportTickets(
    candidateId: string,
    request: ICandidateSupportTicketListApiRequest
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
      // Verify the candidate exists
      const candidate = await this.prisma.candidate.findUnique({
        where: { id: candidateId },
        select: { id: true },
      });

      if (!candidate) {
        throw new Error('Candidate not found');
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
          targetId: candidateId,
          entityType: [SupportTicketEntityTypeEnum.CANDIDATE],
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

      logger.info('Retrieved candidate support tickets', {
        candidateId,
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
      logger.error('Failed to get candidate support tickets', {
        error,
        candidateId,
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
