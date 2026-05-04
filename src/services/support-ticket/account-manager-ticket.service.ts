import { PrismaClient } from '@prisma/client';
import { singleton } from '@/shared/decorators/singleton';
import { logger } from '@/shared/utils/logger';
import {
  IAccountManagerTicketFilter,
  IAccountManagerTicketSort,
  IAccountManagerTicketPagination,
  IAccountManagerTicketAssignment,
  IAccountManagerTicketPriorityChange,
  IAccountManagerTicketStatusChange,
  IAccountManagerTicketComment,
  IAccountManagerTicketStatistics,
  IAccountManagerTicketStatisticsFilter,
  ITicketStatisticsOverview,
  ITicketStatusBreakdown,
  ITicketPriorityBreakdown,
  ITicketCategoryBreakdown,
  ITicketClientBreakdown,
  ITicketAssignmentBreakdown,
  ITicketPerformanceMetrics,
  ITicketSlaMetrics,
  ITicketTrends,
  ITicketTimeDistribution,
  IClientTicketSummary,
  IAssignmentSummary,
  IDailyTrendData,
} from '@/shared/models/domain/support-ticket/account-manager-ticket.domain';
import {
  ISupportTicket,
  ISupportTicketComment,
  ISupportTicketListItemResponse,
} from '@/shared/models/domain/support-ticket/support-ticket.domain';
import {
  SupportTicketStatusEnum,
  SupportTicketEntityTypeEnum,
  SupportTicketPriorityEnum,
  SupportTicketCategoryEnum,
  SupportTicketAssignmentStatusEnum,
  UserTypeEnum,
  UserRoleEnum,
} from '@/shared/models/common/enums';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { StorageFactory } from '../helpers/storage/storage.factory';
import { IAccountManagerTicketListApiResponse } from '@/shared/models/api/support-ticket/account-manager-ticket.api';

/**
 * Account Manager Ticket Service
 * Handles account manager specific ticket operations
 */
@singleton
export class AccountManagerTicketService {
  private readonly prisma: PrismaClient;
  private readonly storageService: any;

  constructor() {
    this.prisma = new PrismaClient();
    // Initialize storage service
    this.storageService = StorageFactory.getInstance().getProvider();
  }

  /**
   * Get all tickets for clients assigned to an account manager
   */
  async getAccountManagerTickets(
    accountManagerId: string,
    filters: IAccountManagerTicketFilter = {},
    sort: IAccountManagerTicketSort = { field: 'createdAt', order: 'desc' },
    pagination: IAccountManagerTicketPagination = { page: 1, limit: 20 }
  ): Promise<IAccountManagerTicketListApiResponse> {
    try {
      // Verify account manager exists and has correct role
      const accountManager = await this.prisma.support_user.findFirst({
        where: {
          id: accountManagerId,
          user: {
            type: UserTypeEnum.SUPPORT,
            role: UserRoleEnum.ACCOUNT_MANAGER,
          },
        },
        include: {
          user: true,
        },
      });

      if (!accountManager || !accountManager.user) {
        throw new AppError(
          'Account manager not found or invalid role',
          404,
          ErrorCode.NOT_FOUND
        );
      }
      logger.info('Account manager found', { accountManager });

      // Get all clients assigned to this account manager
      const assignedClients =
        await this.prisma.client_account_manager_assignment.findMany({
          where: { accountManagerId },
          select: { clientId: true },
        });

      logger.info('Assigned clients', { assignedClients });

      const clientIds = assignedClients.map(
        (assignment) => assignment.clientId
      );

      if (clientIds.length === 0) {
        return {
          items: [],
          pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: 0,
            totalPages: 0,
          },
        };
      }

      // Get all client users for the assigned clients
      const clientUsers = await this.prisma.client_user.findMany({
        where: {
          clientId: { in: clientIds },
        },
        select: {
          userId: true,
        },
      });

      const clientUserIds = clientUsers.map((clientUser) => clientUser.userId);

      if (clientUserIds.length === 0) {
        return {
          items: [],
          pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: 0,
            totalPages: 0,
          },
        };
      }

      // Build where clause
      const whereClause: any = {
        isDeleted: false,
        entityType: SupportTicketEntityTypeEnum.CLIENT,
        createdById: { in: clientUserIds },
      };

      // Apply filters
      if (filters.clientId) {
        // If filtering by specific client, get only users from that client
        const specificClientUsers = await this.prisma.client_user.findMany({
          where: {
            clientId: filters.clientId,
          },
          select: {
            userId: true,
          },
        });

        const specificClientUserIds = specificClientUsers.map(
          (clientUser) => clientUser.userId
        );
        whereClause.createdById = { in: specificClientUserIds };
      }

      if (filters.priority && filters.priority.length > 0) {
        whereClause.priority = { in: filters.priority };
      }

      if (filters.category && filters.category.length > 0) {
        whereClause.category = { in: filters.category };
      }

      if (filters.ticketType && filters.ticketType.length > 0) {
        whereClause.ticketType = { in: filters.ticketType };
      }

      if (filters.assignedUserId) {
        whereClause.assignedUserId = filters.assignedUserId;
      }

      if (filters.status && filters.status.length > 0) {
        whereClause.status = { in: filters.status };
      }

      if (filters.search) {
        whereClause.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      if (filters.createdFrom || filters.createdTo) {
        whereClause.createdAt = {};
        if (filters.createdFrom) {
          whereClause.createdAt.gte = filters.createdFrom;
        }
        if (filters.createdTo) {
          whereClause.createdAt.lte = filters.createdTo;
        }
      }

      // Build order by clause
      const orderByClause: any = {};
      orderByClause[sort.field] = sort.order;

      // Calculate pagination
      const skip = (pagination.page - 1) * pagination.limit;
      const take = pagination.limit;

      // Get total count
      const total = await this.prisma.support_ticket.count({
        where: whereClause,
      });

      // Get tickets
      const tickets = await this.prisma.support_ticket.findMany({
        where: whereClause,
        orderBy: orderByClause,
        skip,
        take,
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

      // Map to domain models
      logger.info('Tickets', { tickets });
      const mappedTickets: ISupportTicketListItemResponse[] = await Promise.all(
        tickets.map((ticket) => this.mapTicketListItemDataToDomain(ticket))
      );

      const totalPages = Math.ceil(total / pagination.limit);
      logger.info('Account manager tickets retrieved successfully', {
        accountManagerId,
        total,
        page: pagination.page,
        limit: pagination.limit,
      });

      return {
        items: mappedTickets,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      logger.error('Failed to get account manager tickets', {
        error,
        accountManagerId,
        filters,
      });
      throw error;
    }
  }

  /**
   * Assign or reassign a ticket to a support user
   */
  async assignTicket(
    accountManagerId: string,
    assignmentData: IAccountManagerTicketAssignment
  ): Promise<ISupportTicket> {
    try {
      // Verify account manager exists and has correct role
      const accountManager = await this.prisma.support_user.findFirst({
        where: {
          id: accountManagerId,
          user: {
            type: UserTypeEnum.SUPPORT,
            role: UserRoleEnum.ACCOUNT_MANAGER,
          },
        },
        include: {
          user: true,
        },
      });

      if (!accountManager || !accountManager.user) {
        throw new AppError(
          'Account manager not found or invalid role',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Verify ticket exists and belongs to a client assigned to this account manager
      const ticket = await this.prisma.support_ticket.findFirst({
        where: {
          id: assignmentData.ticketId,
          isDeleted: false,
          entityType: SupportTicketEntityTypeEnum.CLIENT,
        },
        include: {
          createdBy: true,
        },
      });

      if (!ticket) {
        throw new AppError('Ticket not found', 404, ErrorCode.NOT_FOUND);
      }

      // Check if the client is assigned to this account manager
      const clientAssignment =
        await this.prisma.client_account_manager_assignment.findUnique({
          where: {
            clientId: ticket.targetId,
            accountManagerId,
          },
        });

      if (!clientAssignment) {
        throw new AppError(
          'Ticket does not belong to a client assigned to this account manager',
          403,
          ErrorCode.FORBIDDEN
        );
      }

      // Verify assigned user exists and is a support user
      const assignedUser = await this.prisma.support_user.findUnique({
        where: { id: assignmentData.assignedUserId },
        include: { user: true },
      });

      if (!assignedUser) {
        throw new AppError('Assigned user not found', 404, ErrorCode.NOT_FOUND);
      }

      // Update ticket assignment
      const updatedTicket = await this.prisma.support_ticket.update({
        where: { id: assignmentData.ticketId },
        data: {
          assignedUserId: assignmentData.assignedUserId,
          assignmentStatus: SupportTicketAssignmentStatusEnum.ASSIGNED,
          status:
            ticket.status === SupportTicketStatusEnum.NEW
              ? SupportTicketStatusEnum.OPEN
              : ticket.status,
          updatedAt: new Date(),
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
          auditLogs: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      // Add internal comment if provided
      if (assignmentData.internalNote) {
        await this.prisma.support_ticket_comment.create({
          data: {
            ticketId: assignmentData.ticketId,
            content: assignmentData.internalNote,
            isInternal: true,
            isSystem: false,
            authorId: accountManager.userId,
            tags: ['assignment', 'internal'],
            isFromEmail: false,
          },
        });
      }

      logger.info('Ticket assigned successfully', {
        ticketId: assignmentData.ticketId,
        assignedUserId: assignmentData.assignedUserId,
        accountManagerId,
      });

      return await this.mapDataToDomain(updatedTicket);
    } catch (error) {
      logger.error('Failed to assign ticket', {
        error,
        accountManagerId,
        assignmentData,
      });
      throw error;
    }
  }

  /**
   * Change ticket priority with internal note
   */
  async changeTicketPriority(
    accountManagerId: string,
    priorityData: IAccountManagerTicketPriorityChange
  ): Promise<ISupportTicket> {
    try {
      // Verify account manager exists and has correct role
      const accountManager = await this.prisma.support_user.findFirst({
        where: {
          id: accountManagerId,
          user: {
            type: UserTypeEnum.SUPPORT,
            role: UserRoleEnum.ACCOUNT_MANAGER,
          },
        },
        include: {
          user: true,
        },
      });

      if (!accountManager || !accountManager.user) {
        throw new AppError(
          'Account manager not found or invalid role',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Verify ticket exists and belongs to a client assigned to this account manager
      const ticket = await this.prisma.support_ticket.findFirst({
        where: {
          id: priorityData.ticketId,
          isDeleted: false,
          entityType: SupportTicketEntityTypeEnum.CLIENT,
        },
      });

      if (!ticket) {
        throw new AppError('Ticket not found', 404, ErrorCode.NOT_FOUND);
      }

      // Check if the client is assigned to this account manager
      const clientAssignment =
        await this.prisma.client_account_manager_assignment.findUnique({
          where: {
            clientId: ticket.createdById,
            accountManagerId,
          },
        });

      if (!clientAssignment) {
        throw new AppError(
          'Ticket does not belong to a client assigned to this account manager',
          403,
          ErrorCode.FORBIDDEN
        );
      }

      // Update ticket priority
      const updatedTicket = await this.prisma.support_ticket.update({
        where: { id: priorityData.ticketId },
        data: {
          priority: priorityData.priority,
          updatedAt: new Date(),
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

      // Add internal comment for priority change
      await this.prisma.support_ticket_comment.create({
        data: {
          ticketId: priorityData.ticketId,
          content: `Priority changed to ${priorityData.priority}. ${priorityData.internalNote}`,
          isInternal: true,
          isSystem: false,
          authorId: accountManager.userId,
          tags: ['priority-change', 'internal'],
          isFromEmail: false,
        },
      });

      logger.info('Ticket priority changed successfully', {
        ticketId: priorityData.ticketId,
        newPriority: priorityData.priority,
        accountManagerId,
      });

      return await this.mapDataToDomain(updatedTicket);
    } catch (error) {
      logger.error('Failed to change ticket priority', {
        error,
        accountManagerId,
        priorityData,
      });
      throw error;
    }
  }

  /**
   * Change ticket status with internal note
   */
  async changeTicketStatus(
    accountManagerId: string,
    statusData: IAccountManagerTicketStatusChange
  ): Promise<ISupportTicket> {
    try {
      // Verify account manager exists and has correct role
      const accountManager = await this.prisma.support_user.findFirst({
        where: {
          id: accountManagerId,
          user: {
            type: UserTypeEnum.SUPPORT,
            role: UserRoleEnum.ACCOUNT_MANAGER,
          },
        },
        include: {
          user: true,
        },
      });

      if (!accountManager || !accountManager.user) {
        throw new AppError(
          'Account manager not found or invalid role',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Verify ticket exists and belongs to a client assigned to this account manager
      const ticket = await this.prisma.support_ticket.findFirst({
        where: {
          id: statusData.ticketId,
          isDeleted: false,
          entityType: SupportTicketEntityTypeEnum.CLIENT,
        },
      });

      if (!ticket) {
        throw new AppError('Ticket not found', 404, ErrorCode.NOT_FOUND);
      }

      // Check if the client is assigned to this account manager
      const clientAssignment =
        await this.prisma.client_account_manager_assignment.findUnique({
          where: {
            clientId: ticket.createdById,
            accountManagerId,
          },
        });

      if (!clientAssignment) {
        throw new AppError(
          'Ticket does not belong to a client assigned to this account manager',
          403,
          ErrorCode.FORBIDDEN
        );
      }

      // Prepare update data
      const updateData: any = {
        status: statusData.status,
        updatedAt: new Date(),
      };

      // Set resolvedAt if status is RESOLVED
      if (statusData.status === SupportTicketStatusEnum.RESOLVED) {
        updateData.resolvedAt = new Date();
      }

      // Set closedAt if status is CLOSED
      if (statusData.status === SupportTicketStatusEnum.CLOSED) {
        updateData.closedAt = new Date();
      }

      // Update ticket status
      const updatedTicket = await this.prisma.support_ticket.update({
        where: { id: statusData.ticketId },
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

      // Add internal comment for status change
      await this.prisma.support_ticket_comment.create({
        data: {
          ticketId: statusData.ticketId,
          content: `Status changed to ${statusData.status}. ${statusData.internalNote}`,
          isInternal: true,
          isSystem: false,
          authorId: accountManager.userId,
          tags: ['status-change', 'internal'],
          isFromEmail: false,
        },
      });

      logger.info('Ticket status changed successfully', {
        ticketId: statusData.ticketId,
        newStatus: statusData.status,
        accountManagerId,
      });

      return await this.mapDataToDomain(updatedTicket);
    } catch (error) {
      logger.error('Failed to change ticket status', {
        error,
        accountManagerId,
        statusData,
      });
      throw error;
    }
  }

  /**
   * Add comment to ticket
   */
  async addTicketComment(
    accountManagerId: string,
    commentData: IAccountManagerTicketComment
  ): Promise<ISupportTicketComment> {
    try {
      // Verify account manager exists and has correct role
      const accountManager = await this.prisma.support_user.findFirst({
        where: {
          id: accountManagerId,
          user: {
            type: UserTypeEnum.SUPPORT,
            role: UserRoleEnum.ACCOUNT_MANAGER,
          },
        },
        include: {
          user: true,
        },
      });

      if (!accountManager || !accountManager.user) {
        throw new AppError(
          'Account manager not found or invalid role',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Verify ticket exists and belongs to a client assigned to this account manager
      const ticket = await this.prisma.support_ticket.findFirst({
        where: {
          id: commentData.ticketId,
          isDeleted: false,
          entityType: SupportTicketEntityTypeEnum.CLIENT,
        },
      });

      if (!ticket) {
        throw new AppError('Ticket not found', 404, ErrorCode.NOT_FOUND);
      }

      const client = await this.prisma.client_user.findUnique({
        where: {
          userId: ticket.createdById,
        },
        select: {
          clientId: true,
        },
      });
      if (!client) {
        throw new AppError('Client not found', 404, ErrorCode.NOT_FOUND);
      }

      // Check if the client is assigned to this account manager
      const clientAssignment =
        await this.prisma.client_account_manager_assignment.findUnique({
          where: {
            clientId: client.clientId,
            accountManagerId,
          },
        });

      if (!clientAssignment) {
        throw new AppError(
          'Ticket does not belong to a client assigned to this account manager',
          403,
          ErrorCode.FORBIDDEN
        );
      }

      // Create comment
      const comment = await this.prisma.support_ticket_comment.create({
        data: {
          ticketId: commentData.ticketId,
          content: commentData.content,
          isInternal: commentData.isInternal,
          isSystem: false,
          authorId: accountManager.userId,
          // author field removed to match Prisma schema
          tags: commentData.isInternal ? ['internal'] : ['external'],
          isFromEmail: false,
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
      });

      logger.info('Ticket comment added successfully', {
        ticketId: commentData.ticketId,
        commentId: comment.id,
        isInternal: commentData.isInternal,
        accountManagerId,
      });

      return this.mapCommentDataToDomain(comment);
    } catch (error) {
      logger.error('Failed to add ticket comment', {
        error,
        accountManagerId,
        commentData,
      });
      throw error;
    }
  }

  /**
   * Get comprehensive ticket statistics for account manager
   */
  async getTicketStatistics(
    accountManagerId: string,
    filters: IAccountManagerTicketStatisticsFilter = {}
  ): Promise<IAccountManagerTicketStatistics> {
    try {
      // Verify account manager exists and has correct role
      const accountManager = await this.prisma.support_user.findFirst({
        where: {
          id: accountManagerId,
          user: {
            type: UserTypeEnum.SUPPORT,
            role: UserRoleEnum.ACCOUNT_MANAGER,
          },
        },
        include: {
          user: true,
        },
      });

      if (!accountManager || !accountManager.user) {
        throw new AppError(
          'Account manager not found or invalid role',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Get all clients assigned to this account manager
      const assignedClients =
        await this.prisma.client_account_manager_assignment.findMany({
          where: { accountManagerId },
          select: { clientId: true },
        });

      const clientIds = assignedClients.map(
        (assignment) => assignment.clientId
      );

      if (clientIds.length === 0) {
        return this.getEmptyStatistics();
      }

      // Build base where clause for tickets
      const baseWhereClause: any = {
        isDeleted: false,
        entityType: SupportTicketEntityTypeEnum.CLIENT,
        targetId: { in: clientIds },
      };

      // Apply filters
      if (filters.clientId) {
        baseWhereClause.targetId = filters.clientId;
      }

      if (filters.dateFrom || filters.dateTo) {
        baseWhereClause.createdAt = {};
        if (filters.dateFrom) {
          baseWhereClause.createdAt.gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          baseWhereClause.createdAt.lte = filters.dateTo;
        }
      }

      // Get all tickets for calculations
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

      // Calculate all statistics in parallel
      const [
        overview,
        statusBreakdown,
        priorityBreakdown,
        categoryBreakdown,
        clientBreakdown,
        assignmentBreakdown,
        performanceMetrics,
        slaMetrics,
        trends,
        timeDistribution,
      ] = await Promise.all([
        this.calculateOverview(allTickets, clientIds),
        this.calculateStatusBreakdown(allTickets),
        this.calculatePriorityBreakdown(allTickets),
        this.calculateCategoryBreakdown(allTickets),
        this.calculateClientBreakdown(allTickets, clientIds),
        this.calculateAssignmentBreakdown(allTickets),
        this.calculatePerformanceMetrics(allTickets),
        this.calculateSlaMetrics(allTickets),
        this.calculateTrends(baseWhereClause),
        this.calculateTimeDistribution(allTickets),
      ]);

      logger.info('Ticket statistics calculated successfully', {
        accountManagerId,
        totalTickets: overview.totalTickets,
        clientCount: clientIds.length,
      });

      return {
        overview,
        statusBreakdown,
        priorityBreakdown,
        categoryBreakdown,
        clientBreakdown,
        assignmentBreakdown,
        performanceMetrics,
        slaMetrics,
        trends,
        timeDistribution,
      };
    } catch (error) {
      logger.error('Failed to get ticket statistics', {
        error,
        accountManagerId,
        filters,
      });
      throw error;
    }
  }

  /**
   * Get empty statistics for when account manager has no clients
   */
  private getEmptyStatistics(): IAccountManagerTicketStatistics {
    return {
      overview: {
        totalTickets: 0,
        openTickets: 0,
        inProgressTickets: 0,
        resolvedTickets: 0,
        closedTickets: 0,
        overDueTickets: 0,
        unassignedTickets: 0,
        highPriorityTickets: 0,
        averageResolutionTime: 0,
        averageResponseTime: 0,
        totalClients: 0,
        satisfactionScore: 0,
      },
      statusBreakdown: {
        open: 0,
        assigned: 0,
        inProgress: 0,
        pending: 0,
        resolved: 0,
        closed: 0,
        cancelled: 0,
        reopened: 0,
      },
      priorityBreakdown: {
        low: 0,
        medium: 0,
        high: 0,
        urgent: 0,
        critical: 0,
      },
      categoryBreakdown: {
        technical: 0,
        billing: 0,
        account: 0,
        feature: 0,
        bug: 0,
        general: 0,
        integration: 0,
        security: 0,
      },
      clientBreakdown: {
        totalClients: 0,
        clients: [],
      },
      assignmentBreakdown: {
        unassignedTickets: 0,
        totalSupportUsers: 0,
        assignments: [],
      },
      performanceMetrics: {
        averageFirstResponseTime: 0,
        averageResolutionTime: 0,
        medianResolutionTime: 0,
        resolutionRate: 0,
        firstCallResolutionRate: 0,
        reopenRate: 0,
        escalationRate: 0,
        customerSatisfactionScore: 0,
        totalResponseCount: 0,
        averageResponsesPerTicket: 0,
      },
      slaMetrics: {
        totalTicketsWithSla: 0,
        ticketsWithinSla: 0,
        ticketsBreachingSla: 0,
        slaComplianceRate: 0,
        averageSlaBreachTime: 0,
        ticketsAtRisk: 0,
        slaBreakdownByPriority: {
          low: { total: 0, compliant: 0, breached: 0 },
          medium: { total: 0, compliant: 0, breached: 0 },
          high: { total: 0, compliant: 0, breached: 0 },
          urgent: { total: 0, compliant: 0, breached: 0 },
          critical: { total: 0, compliant: 0, breached: 0 },
        },
      },
      trends: {
        last7Days: [],
        last30Days: [],
        monthlyGrowthRate: 0,
        resolutionTrend: 'STABLE',
        averageTicketsPerDay: 0,
        peakDayOfWeek: 'Monday',
        peakHourOfDay: 9,
      },
      timeDistribution: {
        byHour: Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 })),
        byDayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ].map((day) => ({ dayOfWeek: day, count: 0 })),
        byMonth: [],
        businessHours: { total: 0, percentage: 0 },
        afterHours: { total: 0, percentage: 0 },
      },
    };
  }

  /**
   * Calculate overview statistics
   */
  private async calculateOverview(
    tickets: any[],
    clientIds: string[]
  ): Promise<ITicketStatisticsOverview> {
    const totalTickets = tickets.length;

    // Status counts
    const statusCounts = tickets.reduce(
      (acc, ticket) => {
        acc[ticket.status] = (acc[ticket.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const openTickets = statusCounts[SupportTicketStatusEnum.OPEN] || 0;
    const inProgressTickets =
      statusCounts[SupportTicketStatusEnum.IN_PROGRESS] || 0;
    const resolvedTickets = statusCounts[SupportTicketStatusEnum.RESOLVED] || 0;
    const closedTickets = statusCounts[SupportTicketStatusEnum.CLOSED] || 0;

    // Overdue tickets (tickets that have breached SLA)
    const overDueTickets = tickets.filter(
      (ticket) => ticket.isSlaBreach
    ).length;

    // Unassigned tickets
    const unassignedTickets = tickets.filter(
      (ticket) => !ticket.assignedUserId
    ).length;

    // High priority tickets (HIGH, URGENT, CRITICAL)
    const highPriorityTickets = tickets.filter((ticket) =>
      [
        SupportTicketPriorityEnum.HIGH,
        SupportTicketPriorityEnum.URGENT,
        SupportTicketPriorityEnum.CRITICAL,
      ].includes(ticket.priority)
    ).length;

    // Resolution time calculations
    const resolvedTicketsWithTime = tickets.filter(
      (ticket) => ticket.resolvedAt && ticket.createdAt
    );

    const resolutionTimes = resolvedTicketsWithTime.map((ticket) => {
      const created = new Date(ticket.createdAt);
      const resolved = new Date(ticket.resolvedAt);
      return (resolved.getTime() - created.getTime()) / (1000 * 60 * 60); // hours
    });

    const averageResolutionTime =
      resolutionTimes.length > 0
        ? resolutionTimes.reduce((sum, time) => sum + time, 0) /
          resolutionTimes.length
        : 0;

    // First response time calculations
    const ticketsWithComments = tickets.filter(
      (ticket) => ticket.comments?.length > 0
    );
    const responseTimes = ticketsWithComments.map((ticket) => {
      const created = new Date(ticket.createdAt);
      const firstComment = ticket.comments[0];
      const firstResponse = new Date(firstComment.createdAt);
      return (firstResponse.getTime() - created.getTime()) / (1000 * 60 * 60); // hours
    });

    const averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) /
          responseTimes.length
        : 0;

    // Customer satisfaction
    const ratedTickets = tickets.filter(
      (ticket) => ticket.customerRating !== null
    );
    const satisfactionScore =
      ratedTickets.length > 0
        ? ratedTickets.reduce((sum, ticket) => sum + ticket.customerRating, 0) /
          ratedTickets.length
        : 0;

    return {
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      overDueTickets,
      unassignedTickets,
      highPriorityTickets,
      averageResolutionTime: Math.round(averageResolutionTime * 100) / 100,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      totalClients: clientIds.length,
      satisfactionScore: Math.round(satisfactionScore * 100) / 100,
    };
  }

  /**
   * Calculate status breakdown
   */
  private async calculateStatusBreakdown(
    tickets: any[]
  ): Promise<ITicketStatusBreakdown> {
    const statusCounts = tickets.reduce(
      (acc, ticket) => {
        acc[ticket.status] = (acc[ticket.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      open: statusCounts[SupportTicketStatusEnum.OPEN] || 0,
      assigned: tickets.filter(
        (ticket) =>
          ticket.assignmentStatus === SupportTicketAssignmentStatusEnum.ASSIGNED
      ).length,
      inProgress: statusCounts[SupportTicketStatusEnum.IN_PROGRESS] || 0,
      pending: statusCounts[SupportTicketStatusEnum.PENDING] || 0,
      resolved: statusCounts[SupportTicketStatusEnum.RESOLVED] || 0,
      closed: statusCounts[SupportTicketStatusEnum.CLOSED] || 0,
      cancelled: statusCounts[SupportTicketStatusEnum.CANCELLED] || 0,
      reopened: statusCounts[SupportTicketStatusEnum.REOPENED] || 0,
    };
  }

  /**
   * Calculate priority breakdown
   */
  private async calculatePriorityBreakdown(
    tickets: any[]
  ): Promise<ITicketPriorityBreakdown> {
    const priorityCounts = tickets.reduce(
      (acc, ticket) => {
        acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      low: priorityCounts[SupportTicketPriorityEnum.LOW] || 0,
      medium: priorityCounts[SupportTicketPriorityEnum.MEDIUM] || 0,
      high: priorityCounts[SupportTicketPriorityEnum.HIGH] || 0,
      urgent: priorityCounts[SupportTicketPriorityEnum.URGENT] || 0,
      critical: priorityCounts[SupportTicketPriorityEnum.CRITICAL] || 0,
    };
  }

  /**
   * Calculate category breakdown
   */
  private async calculateCategoryBreakdown(
    tickets: any[]
  ): Promise<ITicketCategoryBreakdown> {
    const categoryCounts = tickets.reduce(
      (acc, ticket) => {
        acc[ticket.category] = (acc[ticket.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      technical: categoryCounts[SupportTicketCategoryEnum.TECHNICAL] || 0,
      billing: categoryCounts[SupportTicketCategoryEnum.BILLING] || 0,
      account: categoryCounts[SupportTicketCategoryEnum.ACCOUNT] || 0,
      feature: categoryCounts[SupportTicketCategoryEnum.FEATURE] || 0,
      bug: categoryCounts[SupportTicketCategoryEnum.BUG] || 0,
      general: categoryCounts[SupportTicketCategoryEnum.GENERAL] || 0,
      integration: categoryCounts[SupportTicketCategoryEnum.INTEGRATION] || 0,
      security: categoryCounts[SupportTicketCategoryEnum.SECURITY] || 0,
    };
  }

  /**
   * Calculate client breakdown
   */
  private async calculateClientBreakdown(
    tickets: any[],
    clientIds: string[]
  ): Promise<ITicketClientBreakdown> {
    // Get client information
    const clients = await this.prisma.client.findMany({
      where: { id: { in: clientIds } },
      include: { company: true },
    });

    const clientSummaries: IClientTicketSummary[] = await Promise.all(
      clients.map(async (client) => {
        const clientTickets = tickets.filter(
          (ticket) => ticket.targetId === client.id
        );

        const openTickets = clientTickets.filter(
          (ticket) =>
            ticket.status === SupportTicketStatusEnum.OPEN ||
            ticket.status === SupportTicketStatusEnum.IN_PROGRESS
        ).length;

        const highPriorityTickets = clientTickets.filter((ticket) =>
          [
            SupportTicketPriorityEnum.HIGH,
            SupportTicketPriorityEnum.URGENT,
            SupportTicketPriorityEnum.CRITICAL,
          ].includes(ticket.priority)
        ).length;

        const resolvedTickets = clientTickets.filter(
          (ticket) => ticket.resolvedAt
        );
        const resolutionTimes = resolvedTickets.map((ticket) => {
          const created = new Date(ticket.createdAt);
          const resolved = new Date(ticket.resolvedAt);
          return (resolved.getTime() - created.getTime()) / (1000 * 60 * 60); // hours
        });

        const averageResolutionTime =
          resolutionTimes.length > 0
            ? resolutionTimes.reduce((sum, time) => sum + time, 0) /
              resolutionTimes.length
            : 0;

        const ratedTickets = clientTickets.filter(
          (ticket) => ticket.customerRating !== null
        );
        const satisfactionScore =
          ratedTickets.length > 0
            ? ratedTickets.reduce(
                (sum, ticket) => sum + ticket.customerRating,
                0
              ) / ratedTickets.length
            : 0;

        const lastTicketDate =
          clientTickets.length > 0
            ? new Date(
                Math.max(
                  ...clientTickets.map((ticket) =>
                    new Date(ticket.createdAt).getTime()
                  )
                )
              )
            : undefined;

        return {
          clientId: client.id,
          clientName: client.company?.name || 'Unknown',
          totalTickets: clientTickets.length,
          openTickets,
          highPriorityTickets,
          averageResolutionTime: Math.round(averageResolutionTime * 100) / 100,
          satisfactionScore: Math.round(satisfactionScore * 100) / 100,
          lastTicketDate,
        };
      })
    );

    return {
      totalClients: clients.length,
      clients: clientSummaries.sort((a, b) => b.totalTickets - a.totalTickets),
    };
  }

  /**
   * Calculate assignment breakdown
   */
  private async calculateAssignmentBreakdown(
    tickets: any[]
  ): Promise<ITicketAssignmentBreakdown> {
    const unassignedTickets = tickets.filter(
      (ticket) => !ticket.assignedUserId
    ).length;

    // Get all support users who have tickets assigned
    const assignedUserIds = [
      ...new Set(
        tickets
          .filter((ticket) => ticket.assignedUserId)
          .map((ticket) => ticket.assignedUserId)
      ),
    ];

    const supportUsers = await this.prisma.support_user.findMany({
      where: { id: { in: assignedUserIds } },
      include: { user: true },
    });

    const assignments: IAssignmentSummary[] = supportUsers.map(
      (supportUser) => {
        const userTickets = tickets.filter(
          (ticket) => ticket.assignedUserId === supportUser.id
        );

        const openTickets = userTickets.filter(
          (ticket) =>
            ticket.status === SupportTicketStatusEnum.OPEN ||
            ticket.assignmentStatus ===
              SupportTicketAssignmentStatusEnum.ASSIGNED
        ).length;

        const inProgressTickets = userTickets.filter(
          (ticket) => ticket.status === SupportTicketStatusEnum.IN_PROGRESS
        ).length;

        const resolvedTickets = userTickets.filter(
          (ticket) =>
            ticket.status === SupportTicketStatusEnum.RESOLVED ||
            ticket.status === SupportTicketStatusEnum.CLOSED
        ).length;

        const resolvedWithTime = userTickets.filter(
          (ticket) => ticket.resolvedAt
        );
        const resolutionTimes = resolvedWithTime.map((ticket) => {
          const created = new Date(ticket.createdAt);
          const resolved = new Date(ticket.resolvedAt);
          return (resolved.getTime() - created.getTime()) / (1000 * 60 * 60); // hours
        });

        const averageResolutionTime =
          resolutionTimes.length > 0
            ? resolutionTimes.reduce((sum, time) => sum + time, 0) /
              resolutionTimes.length
            : 0;

        // Determine workload based on open tickets
        let workload: 'LOW' | 'MEDIUM' | 'HIGH' | 'OVERLOADED';
        const totalActiveTickets = openTickets + inProgressTickets;
        if (totalActiveTickets <= 5) workload = 'LOW';
        else if (totalActiveTickets <= 15) workload = 'MEDIUM';
        else if (totalActiveTickets <= 25) workload = 'HIGH';
        else workload = 'OVERLOADED';

        return {
          userId: supportUser.id,
          userName: supportUser.user?.name || 'Unknown',
          userEmail: supportUser.user?.email || 'Unknown',
          totalTickets: userTickets.length,
          openTickets,
          inProgressTickets,
          resolvedTickets,
          averageResolutionTime: Math.round(averageResolutionTime * 100) / 100,
          workload,
        };
      }
    );

    return {
      unassignedTickets,
      totalSupportUsers: supportUsers.length,
      assignments: assignments.sort((a, b) => b.totalTickets - a.totalTickets),
    };
  }

  /**
   * Calculate performance metrics
   */
  private async calculatePerformanceMetrics(
    tickets: any[]
  ): Promise<ITicketPerformanceMetrics> {
    // First response time
    const ticketsWithComments = tickets.filter(
      (ticket) => ticket.comments?.length > 0
    );
    const firstResponseTimes = ticketsWithComments.map((ticket) => {
      const created = new Date(ticket.createdAt);
      const firstComment = ticket.comments[0];
      const firstResponse = new Date(firstComment.createdAt);
      return (firstResponse.getTime() - created.getTime()) / (1000 * 60 * 60); // hours
    });

    const averageFirstResponseTime =
      firstResponseTimes.length > 0
        ? firstResponseTimes.reduce((sum, time) => sum + time, 0) /
          firstResponseTimes.length
        : 0;

    // Resolution time
    const resolvedTickets = tickets.filter((ticket) => ticket.resolvedAt);
    const resolutionTimes = resolvedTickets.map((ticket) => {
      const created = new Date(ticket.createdAt);
      const resolved = new Date(ticket.resolvedAt);
      return (resolved.getTime() - created.getTime()) / (1000 * 60 * 60); // hours
    });

    const averageResolutionTime =
      resolutionTimes.length > 0
        ? resolutionTimes.reduce((sum, time) => sum + time, 0) /
          resolutionTimes.length
        : 0;

    const sortedResolutionTimes = [...resolutionTimes].sort((a, b) => a - b);
    const medianResolutionTime =
      sortedResolutionTimes.length > 0
        ? sortedResolutionTimes[Math.floor(sortedResolutionTimes.length / 2)]
        : 0;

    // Resolution rate (resolved within SLA)
    const ticketsWithSla = tickets.filter((ticket) => ticket.slaPolicy);
    const resolvedWithinSla = ticketsWithSla.filter(
      (ticket) => ticket.resolvedAt && !ticket.isSlaBreach
    );
    const resolutionRate =
      ticketsWithSla.length > 0
        ? (resolvedWithinSla.length / ticketsWithSla.length) * 100
        : 0;

    // First call resolution (tickets resolved with only one response)
    const firstCallResolved = tickets.filter(
      (ticket) => ticket.resolvedAt && ticket.comments?.length === 1
    );
    const firstCallResolutionRate =
      tickets.length > 0
        ? (firstCallResolved.length / tickets.length) * 100
        : 0;

    // Reopen rate
    const reopenedTickets = tickets.filter(
      (ticket) => ticket.status === SupportTicketStatusEnum.REOPENED
    );
    const reopenRate =
      tickets.length > 0 ? (reopenedTickets.length / tickets.length) * 100 : 0;

    // Escalation rate
    const escalatedTickets = tickets.filter((ticket) => ticket.escalatedAt);
    const escalationRate =
      tickets.length > 0 ? (escalatedTickets.length / tickets.length) * 100 : 0;

    // Customer satisfaction
    const ratedTickets = tickets.filter(
      (ticket) => ticket.customerRating !== null
    );
    const customerSatisfactionScore =
      ratedTickets.length > 0
        ? ratedTickets.reduce((sum, ticket) => sum + ticket.customerRating, 0) /
          ratedTickets.length
        : 0;

    // Response counts
    const totalResponseCount = tickets.reduce(
      (sum, ticket) => sum + (ticket.comments?.length || 0),
      0
    );
    const averageResponsesPerTicket =
      tickets.length > 0 ? totalResponseCount / tickets.length : 0;

    return {
      averageFirstResponseTime:
        Math.round(averageFirstResponseTime * 100) / 100,
      averageResolutionTime: Math.round(averageResolutionTime * 100) / 100,
      medianResolutionTime: Math.round(medianResolutionTime * 100) / 100,
      resolutionRate: Math.round(resolutionRate * 100) / 100,
      firstCallResolutionRate: Math.round(firstCallResolutionRate * 100) / 100,
      reopenRate: Math.round(reopenRate * 100) / 100,
      escalationRate: Math.round(escalationRate * 100) / 100,
      customerSatisfactionScore:
        Math.round(customerSatisfactionScore * 100) / 100,
      totalResponseCount,
      averageResponsesPerTicket:
        Math.round(averageResponsesPerTicket * 100) / 100,
    };
  }

  /**
   * Calculate SLA metrics
   */
  private async calculateSlaMetrics(
    tickets: any[]
  ): Promise<ITicketSlaMetrics> {
    const now = new Date();
    const ticketsWithSla = tickets.filter((ticket) => ticket.slaPolicy);
    const ticketsWithinSla = ticketsWithSla.filter(
      (ticket) => !ticket.isSlaBreach
    );
    const ticketsBreachingSla = ticketsWithSla.filter(
      (ticket) => ticket.isSlaBreach
    );

    const slaComplianceRate =
      ticketsWithSla.length > 0
        ? (ticketsWithinSla.length / ticketsWithSla.length) * 100
        : 0;

    // Calculate average breach time
    const breachTimes = ticketsBreachingSla
      .filter((ticket) => ticket.slaBreachAt)
      .map((ticket) => {
        const slaBreachTime = new Date(ticket.slaBreachAt);
        const dueTime = ticket.slaStartedAt
          ? new Date(ticket.slaStartedAt)
          : new Date(ticket.createdAt);
        dueTime.setHours(dueTime.getHours() + (ticket.slaDuration || 24));
        return (slaBreachTime.getTime() - dueTime.getTime()) / (1000 * 60 * 60); // hours
      });

    const averageSlaBreachTime =
      breachTimes.length > 0
        ? breachTimes.reduce((sum, time) => sum + time, 0) / breachTimes.length
        : 0;

    // Tickets at risk (approaching SLA deadline)
    const ticketsAtRisk = ticketsWithSla.filter((ticket) => {
      if (ticket.resolvedAt || ticket.isSlaBreach) return false;

      const dueTime = ticket.slaStartedAt
        ? new Date(ticket.slaStartedAt)
        : new Date(ticket.createdAt);
      dueTime.setHours(dueTime.getHours() + (ticket.slaDuration || 24));
      const timeUntilDue = dueTime.getTime() - now.getTime();
      const hoursUntilDue = timeUntilDue / (1000 * 60 * 60);

      return hoursUntilDue <= 2 && hoursUntilDue > 0; // At risk if less than 2 hours remaining
    }).length;

    // SLA breakdown by priority
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
      ticketsWithinSla: ticketsWithinSla.length,
      ticketsBreachingSla: ticketsBreachingSla.length,
      slaComplianceRate: Math.round(slaComplianceRate * 100) / 100,
      averageSlaBreachTime: Math.round(averageSlaBreachTime * 100) / 100,
      ticketsAtRisk,
      slaBreakdownByPriority,
    };
  }

  /**
   * Calculate SLA metrics for specific priority
   */
  private calculateSlaByPriority(
    tickets: any[],
    priority: SupportTicketPriorityEnum
  ) {
    const priorityTickets = tickets.filter(
      (ticket) => ticket.priority === priority
    );
    const compliant = priorityTickets.filter(
      (ticket) => !ticket.isSlaBreach
    ).length;
    const breached = priorityTickets.filter(
      (ticket) => ticket.isSlaBreach
    ).length;

    return {
      total: priorityTickets.length,
      compliant,
      breached,
    };
  }

  /**
   * Calculate trends
   */
  private async calculateTrends(baseWhereClause: any): Promise<ITicketTrends> {
    const now = new Date();
    const last7Days: IDailyTrendData[] = [];
    const last30Days: IDailyTrendData[] = [];

    // Calculate last 7 days trends
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const dayTickets = await this.prisma.support_ticket.findMany({
        where: {
          ...baseWhereClause,
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      const resolved = dayTickets.filter(
        (ticket) =>
          ticket.resolvedAt &&
          ticket.resolvedAt >= startOfDay &&
          ticket.resolvedAt <= endOfDay
      ).length;

      const closed = dayTickets.filter(
        (ticket) =>
          ticket.closedAt &&
          ticket.closedAt >= startOfDay &&
          ticket.closedAt <= endOfDay
      ).length;

      last7Days.push({
        date: startOfDay.toISOString().split('T')[0],
        created: dayTickets.length,
        resolved,
        closed,
      });
    }

    // Calculate last 30 days trends
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const dayTickets = await this.prisma.support_ticket.findMany({
        where: {
          ...baseWhereClause,
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      const resolved = dayTickets.filter(
        (ticket) =>
          ticket.resolvedAt &&
          ticket.resolvedAt >= startOfDay &&
          ticket.resolvedAt <= endOfDay
      ).length;

      const closed = dayTickets.filter(
        (ticket) =>
          ticket.closedAt &&
          ticket.closedAt >= startOfDay &&
          ticket.closedAt <= endOfDay
      ).length;

      last30Days.push({
        date: startOfDay.toISOString().split('T')[0],
        created: dayTickets.length,
        resolved,
        closed,
      });
    }

    // Calculate growth rate (compare last 30 days with previous 30 days)
    const previous30DaysStart = new Date(now);
    previous30DaysStart.setDate(previous30DaysStart.getDate() - 60);
    const previous30DaysEnd = new Date(now);
    previous30DaysEnd.setDate(previous30DaysEnd.getDate() - 30);

    const previousPeriodTickets = await this.prisma.support_ticket.count({
      where: {
        ...baseWhereClause,
        createdAt: {
          gte: previous30DaysStart,
          lte: previous30DaysEnd,
        },
      },
    });

    const currentPeriodTickets = last30Days.reduce(
      (sum, day) => sum + day.created,
      0
    );
    const monthlyGrowthRate =
      previousPeriodTickets > 0
        ? ((currentPeriodTickets - previousPeriodTickets) /
            previousPeriodTickets) *
          100
        : 0;

    // Determine resolution trend
    const firstHalfResolved = last30Days
      .slice(0, 15)
      .reduce((sum, day) => sum + day.resolved, 0);
    const secondHalfResolved = last30Days
      .slice(15)
      .reduce((sum, day) => sum + day.resolved, 0);
    let resolutionTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';

    if (secondHalfResolved > firstHalfResolved * 1.1)
      resolutionTrend = 'IMPROVING';
    else if (secondHalfResolved < firstHalfResolved * 0.9)
      resolutionTrend = 'DECLINING';
    else resolutionTrend = 'STABLE';

    const averageTicketsPerDay = currentPeriodTickets / 30;

    // Calculate peak day and hour (simplified - would need more detailed analysis)
    const dayOfWeekCounts = last30Days.reduce(
      (acc, day) => {
        const dayOfWeek = new Date(day.date).toLocaleDateString('en', {
          weekday: 'long',
        });
        acc[dayOfWeek] = (acc[dayOfWeek] || 0) + day.created;
        return acc;
      },
      {} as Record<string, number>
    );

    const peakDayOfWeek =
      Object.entries(dayOfWeekCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      'Monday';

    return {
      last7Days,
      last30Days,
      monthlyGrowthRate: Math.round(monthlyGrowthRate * 100) / 100,
      resolutionTrend,
      averageTicketsPerDay: Math.round(averageTicketsPerDay * 100) / 100,
      peakDayOfWeek,
      peakHourOfDay: 10, // Simplified - would need hour-by-hour analysis
    };
  }

  /**
   * Calculate time distribution
   */
  private async calculateTimeDistribution(
    tickets: any[]
  ): Promise<ITicketTimeDistribution> {
    // Hour distribution
    const byHour = Array.from({ length: 24 }, (_, hour) => {
      const count = tickets.filter((ticket) => {
        const createdHour = new Date(ticket.createdAt).getHours();
        return createdHour === hour;
      }).length;
      return { hour, count };
    });

    // Day of week distribution
    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const byDayOfWeek = dayNames.map((dayOfWeek) => {
      const dayIndex = dayNames.indexOf(dayOfWeek);
      const count = tickets.filter((ticket) => {
        const createdDay = new Date(ticket.createdAt).getDay();
        return createdDay === dayIndex;
      }).length;
      return { dayOfWeek, count };
    });

    // Month distribution (last 12 months)
    const byMonth: Array<{ month: string; count: number }> = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.toLocaleDateString('en', {
        year: 'numeric',
        month: 'long',
      });
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0,
        23,
        59,
        59
      );

      const count = tickets.filter((ticket) => {
        const ticketDate = new Date(ticket.createdAt);
        return ticketDate >= startOfMonth && ticketDate <= endOfMonth;
      }).length;

      byMonth.push({ month, count });
    }

    // Business hours vs after hours (assuming 9 AM - 5 PM business hours)
    const businessHoursTickets = tickets.filter((ticket) => {
      const hour = new Date(ticket.createdAt).getHours();
      const day = new Date(ticket.createdAt).getDay();
      return hour >= 9 && hour < 17 && day >= 1 && day <= 5; // Monday to Friday, 9 AM to 5 PM
    });

    const afterHoursTickets = tickets.filter((ticket) => {
      const hour = new Date(ticket.createdAt).getHours();
      const day = new Date(ticket.createdAt).getDay();
      return !(hour >= 9 && hour < 17 && day >= 1 && day <= 5);
    });

    const businessHours = {
      total: businessHoursTickets.length,
      percentage:
        tickets.length > 0
          ? (businessHoursTickets.length / tickets.length) * 100
          : 0,
    };

    const afterHours = {
      total: afterHoursTickets.length,
      percentage:
        tickets.length > 0
          ? (afterHoursTickets.length / tickets.length) * 100
          : 0,
    };

    return {
      byHour,
      byDayOfWeek,
      byMonth,
      businessHours: {
        total: businessHours.total,
        percentage: Math.round(businessHours.percentage * 100) / 100,
      },
      afterHours: {
        total: afterHours.total,
        percentage: Math.round(afterHours.percentage * 100) / 100,
      },
    };
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
      createdBy: ticket.createdBy,
      assignedTo: ticket.assignedTo,
      escalatedToUser: ticket.escalatedToUser,
      escalatedByUser: ticket.escalatedByUser,
      slaPolicy: ticket.slaPolicy,
      attachments: attachmentsWithUrls,
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
      ticketNumber: ticket.ticketNumber,
      sequenceNumber: ticket.sequenceNumber,
      entityType: ticket.entityType,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      createdBy: ticket.createdBy,
    };
  }

  /**
   * Map comment data model to domain model
   */
  private mapCommentDataToDomain(comment: any): ISupportTicketComment {
    return {
      id: comment.id,
      ticketId: comment.ticketId,
      content: comment.content,
      isInternal: comment.isInternal,
      isSystem: comment.isSystem,
      author: {
        id: comment.authorId,
        name: comment.authorName,
        email: comment.authorEmail,
        type: comment.authorType,
        role: comment.authorRole,
      },
      attachments: comment.attachments,
      metadata: comment.metadata,
      isEdited: comment.isEdited,
      editedAt: comment.editedAt,
      isDeleted: comment.isDeleted,
      deletedAt: comment.deletedAt,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }
}
