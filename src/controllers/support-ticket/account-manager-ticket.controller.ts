import { Request, Response, NextFunction } from 'express';
import { singleton } from '@/shared/decorators/singleton';
import { AccountManagerTicketService } from '@/services/support-ticket/account-manager-ticket.service';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import {
  IAccountManagerTicketListApiResponse,
  IAccountManagerTicketAssignmentApiRequest,
  IAccountManagerTicketAssignmentApiResponse,
  IAccountManagerTicketPriorityChangeApiRequest,
  IAccountManagerTicketPriorityChangeApiResponse,
  IAccountManagerTicketStatusChangeApiRequest,
  IAccountManagerTicketStatusChangeApiResponse,
  IAccountManagerTicketCommentApiRequest,
  IAccountManagerTicketCommentApiResponse,
  IAccountManagerTicketStatisticsApiResponse,
} from '@/shared/models/api/support-ticket/account-manager-ticket.api';
import {
  IAccountManagerTicketFilter,
  IAccountManagerTicketSort,
  IAccountManagerTicketPagination,
  IAccountManagerTicketAssignment,
  IAccountManagerTicketPriorityChange,
  IAccountManagerTicketStatusChange,
  IAccountManagerTicketComment,
  IAccountManagerTicketStatisticsFilter,
} from '@/shared/models/domain/support-ticket/account-manager-ticket.domain';

/**
 * Account Manager Ticket Controller
 * Handles HTTP requests for account manager ticket operations
 */
@singleton
export class AccountManagerTicketController extends BaseController {
  private readonly accountManagerTicketService: AccountManagerTicketService;

  constructor() {
    super();
    this.accountManagerTicketService = new AccountManagerTicketService();
  }

  /**
   * Get all tickets for clients assigned to an account manager
   */
  getAccountManagerTickets = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IAccountManagerTicketListApiResponse>(
      req,
      res,
      next,
      async () => {
        const accountManagerId = req.user?.supportUserId;

        if (!accountManagerId) {
          throw new Error('Support user ID is required');
        }

        // Extract query parameters
        const {
          page = 1,
          limit = 20,
          sortBy = 'createdAt',
          sortOrder = 'desc',
          search,
          clientId,
          priority,
          category,
          ticketType,
          assignedUserId,
          status,
          createdFrom,
          createdTo,
        } = req.query;

        // Build filters from query parameters
        const ticketFilters: IAccountManagerTicketFilter = {};

        if (search) ticketFilters.search = search as string;
        if (clientId) ticketFilters.clientId = clientId as string;
        if (priority)
          ticketFilters.priority = Array.isArray(priority)
            ? (priority as any)
            : [priority as any];
        if (category)
          ticketFilters.category = Array.isArray(category)
            ? (category as any)
            : [category as any];
        if (ticketType)
          ticketFilters.ticketType = Array.isArray(ticketType)
            ? (ticketType as any)
            : [ticketType as any];
        if (assignedUserId)
          ticketFilters.assignedUserId = assignedUserId as string;
        if (status)
          ticketFilters.status = Array.isArray(status)
            ? (status as any)
            : [status as any];
        if (createdFrom)
          ticketFilters.createdFrom = new Date(createdFrom as string);
        if (createdTo) ticketFilters.createdTo = new Date(createdTo as string);

        const ticketSort: IAccountManagerTicketSort = {
          field: sortBy as any,
          order: sortOrder as 'asc' | 'desc',
        };

        const ticketPagination: IAccountManagerTicketPagination = {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
        };

        const result =
          await this.accountManagerTicketService.getAccountManagerTickets(
            accountManagerId,
            ticketFilters,
            ticketSort,
            ticketPagination
          );

        return {
          items: result.items,
          pagination: result.pagination,
        };
      }
    );
  };

  /**
   * Assign or reassign a ticket to a support user
   */
  assignTicket = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IAccountManagerTicketAssignmentApiResponse>(
      req,
      res,
      next,
      async () => {
        const accountManagerId = req.user?.supportUserId;
        const { data } =
          createIApiRequest<IAccountManagerTicketAssignmentApiRequest>(req);

        if (!accountManagerId) {
          throw new Error('Support user ID is required');
        }

        const assignmentData: IAccountManagerTicketAssignment = {
          ticketId: data.ticketId,
          assignedUserId: data.assignedUserId,
          internalNote: data.internalNote,
        };

        const ticket = await this.accountManagerTicketService.assignTicket(
          accountManagerId,
          assignmentData
        );

        return ticket;
      }
    );
  };

  /**
   * Change ticket priority with internal note
   */
  changeTicketPriority = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IAccountManagerTicketPriorityChangeApiResponse>(
      req,
      res,
      next,
      async () => {
        const accountManagerId = req.user?.supportUserId;
        const { data } =
          createIApiRequest<IAccountManagerTicketPriorityChangeApiRequest>(req);

        if (!accountManagerId) {
          throw new Error('Support user ID is required');
        }

        const priorityData: IAccountManagerTicketPriorityChange = {
          ticketId: data.ticketId,
          priority: data.priority as any,
          internalNote: data.internalNote || '',
        };

        const ticket =
          await this.accountManagerTicketService.changeTicketPriority(
            accountManagerId,
            priorityData
          );

        return ticket;
      }
    );
  };

  /**
   * Change ticket status with internal note
   */
  changeTicketStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IAccountManagerTicketStatusChangeApiResponse>(
      req,
      res,
      next,
      async () => {
        const accountManagerId = req.user?.supportUserId;
        const { data } =
          createIApiRequest<IAccountManagerTicketStatusChangeApiRequest>(req);

        if (!accountManagerId) {
          throw new Error('Support user ID is required');
        }

        const statusData: IAccountManagerTicketStatusChange = {
          ticketId: data.ticketId,
          status: data.status as any,
          internalNote: data.internalNote || '',
        };

        const ticket =
          await this.accountManagerTicketService.changeTicketStatus(
            accountManagerId,
            statusData
          );

        return ticket;
      }
    );
  };

  /**
   * Add comment to ticket
   */
  addTicketComment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IAccountManagerTicketCommentApiResponse>(
      req,
      res,
      next,
      async () => {
        const accountManagerId = req.user?.supportUserId;
        const { data } =
          createIApiRequest<IAccountManagerTicketCommentApiRequest>(req);

        if (!accountManagerId) {
          throw new Error('Support user ID is required');
        }

        const commentData: IAccountManagerTicketComment = {
          ticketId: data.ticketId,
          content: data.content,
          isInternal: data.isInternal,
        };

        const comment = await this.accountManagerTicketService.addTicketComment(
          accountManagerId,
          commentData
        );

        return comment;
      }
    );
  };

  /**
   * Get comprehensive ticket statistics for account manager
   */
  getTicketStatistics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IAccountManagerTicketStatisticsApiResponse>(
      req,
      res,
      next,
      async () => {
        const accountManagerId = req.user?.supportUserId;

        if (!accountManagerId) {
          throw new Error('Support user ID is required');
        }

        // Extract query parameters for filters
        const {
          clientId,
          dateFrom,
          dateTo,
          includeResolved = true,
          includeClosed = true,
        } = req.query;

        // Build filters from query parameters
        const statisticsFilters: IAccountManagerTicketStatisticsFilter = {};

        if (clientId) statisticsFilters.clientId = clientId as string;
        if (dateFrom) statisticsFilters.dateFrom = new Date(dateFrom as string);
        if (dateTo) statisticsFilters.dateTo = new Date(dateTo as string);
        if (includeResolved !== undefined) {
          statisticsFilters.includeResolved = includeResolved === 'true';
        }
        if (includeClosed !== undefined) {
          statisticsFilters.includeClosed = includeClosed === 'true';
        }

        const statistics =
          await this.accountManagerTicketService.getTicketStatistics(
            accountManagerId,
            statisticsFilters
          );

        return statistics;
      }
    );
  };
}
