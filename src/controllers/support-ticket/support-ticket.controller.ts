import { Request, Response, NextFunction } from 'express';
import { singleton } from '@/shared/decorators/singleton';
import { SupportTicketService } from '@/services/support-ticket/support-ticket.service';
import { BaseController } from '../common/base.controller';
import {
  ISupportTicketUpdateApiRequest,
  ISupportTicketGetApiResponse,
  ISupportTicketCreateApiResponse,
  ISupportTicketUpdateApiResponse,
  ISupportTicketListApiResponse,
  ISupportTicketDeleteApiResponse,
  ISupportTicketCreateApiRequest,
  ISupportTicketListApiRequest,
  ISupportTicketStatusChangeApiRequest,
  ISupportTicketEscalationApiRequest,
  ISupportTicketRatingApiRequest,
  ISupportTicketPriorityChangeApiResponse,
  ISupportTicketPriorityChangeApiRequest,
  ISupportTicketCommentApiRequest,
  ISupportTicketRcaApiRequest,
  ISupportTicketRcaApiResponse,
  ISupportTicketResolutionApiRequest,
  ISupportTicketResolutionApiResponse,
  ISupportTicketStatisticsApiResponse,
} from '@/shared/models/api/support-ticket/support-ticket.api';
import {
  ISupportTicketSort,
  ISupportTicketPagination,
  ISupportTicketCreate,
  ISupportTicketCommentCreateRequest,
} from '@/shared/models/domain/support-ticket/support-ticket.domain';
import { createIApiRequest } from '@/utils/api.request';
import { ISupportTicketComment } from '@/shared/models/domain/support-ticket/support-ticket.domain';
import { logger } from '@/shared/utils/logger';
import { ISupportTicketStatisticsFilter } from '@/shared/models/domain/support-ticket/support-ticket-statistics.domain';

/**
 * Support Ticket Controller
 * Handles HTTP requests for support ticket operations
 */
@singleton
export class SupportTicketController extends BaseController {
  constructor(private readonly supportTicketService: SupportTicketService) {
    super();
  }

  /**
   * Create a new support ticket
   */
  createTicket = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportTicketCreateApiResponse>(
      req,
      res,
      next,
      async () => {
        const userId = req.user?.id;
        const userAgent = req.get('User-Agent');

        // Get the ticket data from the request body
        const createRequest =
          createIApiRequest<ISupportTicketCreateApiRequest>(req);

        // Get uploaded files
        const attachments = req.files as Express.Multer.File[];

        // Call service method with domain model
        return await this.supportTicketService.createTicket(
          createRequest.data as ISupportTicketCreate,
          userId,
          userAgent,
          attachments
        );
      }
    );
  };

  /**
   * Get a support ticket by ID
   */
  getTicketById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportTicketGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const { id } = req.params;
        const userId = req.user?.id;

        if (!userId) {
          throw new Error('User not authenticated');
        }

        // Call service method with domain model
        return await this.supportTicketService.getTicketById(id);
      }
    );
  };

  /**
   * Update a support ticket
   */
  updateTicket = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportTicketUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const { id } = req.params;
        const userId = req.user?.id;
        const userAgent = req.get('User-Agent');

        // Get the update data from the request body
        const updateRequest =
          createIApiRequest<ISupportTicketUpdateApiRequest>(req);

        // Call service method with domain model
        return await this.supportTicketService.updateTicket(
          id,
          updateRequest.data,
          userId,
          userAgent
        );
      }
    );
  };

  /**
   * Delete a support ticket
   */
  deleteTicket = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportTicketDeleteApiResponse>(
      req,
      res,
      next,
      async () => {
        const { id } = req.params;
        const userId = req.user?.id;
        const userAgent = req.get('User-Agent');

        // Call service method with domain model
        await this.supportTicketService.deleteTicket(id, userId, userAgent);

        // Return empty data for successful deletion
        return undefined;
      }
    );
  };

  /**
   * List support tickets with filtering, sorting, and pagination
   */
  listTickets = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportTicketListApiResponse>(
      req,
      res,
      next,
      async () => {
        // Use the createIApiRequest utility to properly structure the request
        const listRequest =
          createIApiRequest<ISupportTicketListApiRequest>(req);

        // Extract filters and pagination from the request
        const filters = listRequest.filters;
        const pagination = listRequest.pagination;

        // Build sort data from pagination
        const sortData: ISupportTicketSort = {
          field: (pagination.sortBy as any) || 'createdAt',
          direction: (pagination.sortOrder as 'asc' | 'desc') || 'desc',
        };

        // Validate sort field
        const allowedSortFields = [
          'createdAt',
          'updatedAt',
          'priority',
          'status',
          'title',
          'ticketNumber',
          'dueDate',
        ];
        if (!allowedSortFields.includes(sortData.field)) {
          sortData.field = 'createdAt';
        }

        // Validate sort direction
        if (!['asc', 'desc'].includes(sortData.direction)) {
          sortData.direction = 'desc';
        }

        const paginationData: ISupportTicketPagination = {
          page: pagination.page || 1,
          limit: pagination.limit || 20,
        };

        // Call service method with domain models
        return await this.supportTicketService.listTickets(
          filters,
          sortData,
          paginationData
        );
      }
    );
  };

  /**
   * Assign a support ticket to a user
   */
  assignTicket = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportTicketUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const { id } = req.params;
        const userId = req.user?.id;
        const userAgent = req.get('User-Agent');

        // Get the assignment data from the request body
        const assignRequest =
          createIApiRequest<ISupportTicketUpdateApiRequest>(req);

        // Call service method with domain model
        return await this.supportTicketService.assignTicket(
          id,
          assignRequest.data.assignedUserId || '',
          userId,
          assignRequest.data.assignmentNote, // Pass the assignment note
          userAgent
        );
      }
    );
  };

  /**
   * Change ticket status
   */
  changeStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportTicketUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const { id } = req.params;
        const userId = req.user?.id;
        const userAgent = req.get('User-Agent');

        // Get the status change data from the request body
        const statusRequest =
          createIApiRequest<ISupportTicketStatusChangeApiRequest>(req);

        // Call service method with domain model
        return await this.supportTicketService.changeStatus(
          id,
          statusRequest.data.status,
          userId,
          statusRequest.data.reason,
          userAgent
        );
      }
    );
  };

  changePriority = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportTicketPriorityChangeApiResponse>(
      req,
      res,
      next,
      async () => {
        const { id } = req.params;
        const userId = req.user?.id;

        // Get the status change data from the request body
        const statusRequest =
          createIApiRequest<ISupportTicketPriorityChangeApiRequest>(req);

        // Call service method with domain model
        return await this.supportTicketService.changeTicketPriority(
          id,
          statusRequest.data.priority,
          userId
        );
      }
    );
  };

  /**
   * Escalate a support ticket
   */
  escalateTicket = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportTicketUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const { id } = req.params;
        const userId = req.user?.id;
        const userAgent = req.get('User-Agent');

        // Get the escalation data from the request body
        const escalateRequest =
          createIApiRequest<ISupportTicketEscalationApiRequest>(req);

        // Call service method with domain model
        return await this.supportTicketService.escalateTicket(
          id,
          escalateRequest.data.escalatedToUserId,
          escalateRequest.data.escalationReason,
          userId,
          userAgent
        );
      }
    );
  };

  /**
   * Add customer rating and feedback
   */
  addCustomerRating = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportTicketUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const { id } = req.params;
        const userId = req.user?.id;

        // Get the rating data from the request body
        const ratingRequest =
          createIApiRequest<ISupportTicketRatingApiRequest>(req);

        // Call service method with domain model
        return await this.supportTicketService.addCustomerRating(
          id,
          ratingRequest.data.rating,
          ratingRequest.data.feedback,
          userId
        );
      }
    );
  };

  /**
   * Get tickets for a user by user id
   */
  getTicketsByUserId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportTicketListApiResponse>(
      req,
      res,
      next,
      async () => {
        const { userId } = req.params;

        // Use the createIApiRequest utility to properly structure the request
        const listRequest =
          createIApiRequest<ISupportTicketListApiRequest>(req);

        // Extract filters and pagination from the request
        const filters = listRequest.filters;
        const pagination = listRequest.pagination;

        // Build sort data from pagination
        const ticketSort: ISupportTicketSort = {
          field: (pagination.sortBy as any) || 'createdAt',
          direction: (pagination.sortOrder as 'asc' | 'desc') || 'desc',
        };

        const ticketPagination: ISupportTicketPagination = {
          page: pagination.page || 1,
          limit: pagination.limit || 20,
        };

        // Call service method with domain models
        return await this.supportTicketService.getTicketsByUserId(
          userId,
          filters,
          ticketSort,
          ticketPagination
        );
      }
    );
  };

  /**
   * Get tickets assigned to a specific support user
   */
  getTicketsAssignedToUserId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportTicketListApiResponse>(
      req,
      res,
      next,
      async () => {
        const { assignedUserId } = req.params;

        // Use the createIApiRequest utility to properly structure the request
        const listRequest =
          createIApiRequest<ISupportTicketListApiRequest>(req);

        // Extract filters and pagination from the request
        const filters = listRequest.filters;
        const pagination = listRequest.pagination;

        // Build sort data from pagination
        const ticketSort: ISupportTicketSort = {
          field: (pagination.sortBy as any) || 'createdAt',
          direction: (pagination.sortOrder as 'asc' | 'desc') || 'desc',
        };

        const ticketPagination: ISupportTicketPagination = {
          page: pagination.page || 1,
          limit: pagination.limit || 20,
        };

        // Call service method with domain models
        return await this.supportTicketService.getTicketsAssignedToUserId(
          assignedUserId,
          filters,
          ticketSort,
          ticketPagination
        );
      }
    );
  };

  /**
   * Get comments for a support ticket
   */
  getTicketComments = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<{ data: ISupportTicketComment[] }>(
      req,
      res,
      next,
      async () => {
        const { id } = req.params;
        return await this.supportTicketService.getTicketComments(id);
      }
    );
  };

  /**
   * Add a comment to a support ticket
   */
  addTicketComment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportTicketCommentCreateRequest>(
      req,
      res,
      next,
      async () => {
        const { id } = req.params;
        const user = req.user;
        const userAgent = req.get('User-Agent');
        const data = createIApiRequest<ISupportTicketCommentApiRequest>(req);

        return await this.supportTicketService.addTicketComment(
          id,
          data.data,
          user,
          userAgent
        );
      }
    );
  };

  /**
   * Add Root Cause Analysis (RCA) to a support ticket
   */
  addRootCauseAnalysis = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportTicketRcaApiResponse>(
      req,
      res,
      next,
      async () => {
        const { id } = req.params;
        const userId = req.user?.id;
        const userAgent = req.get('User-Agent');

        // Get the RCA data from the request body
        const { data } = createIApiRequest<ISupportTicketRcaApiRequest>(req);

        // Call service method with domain model
        return await this.supportTicketService.addRootCauseAnalysis(
          id,
          data,
          userId,
          userAgent
        );
      }
    );
  };

  /**
   * Update Root Cause Analysis (RCA) for a support ticket
   */
  updateRootCauseAnalysis = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportTicketRcaApiResponse>(
      req,
      res,
      next,
      async () => {
        const { id } = req.params;
        const userId = req.user?.id;
        const userAgent = req.get('User-Agent');
        const { data } = createIApiRequest<ISupportTicketRcaApiRequest>(req);

        // Call service method with domain model
        return await this.supportTicketService.updateRootCauseAnalysis(
          id,
          data,
          userId,
          userAgent
        );
      }
    );
  };

  /**
   * Get Root Cause Analysis (RCA) for a support ticket
   */
  getRootCauseAnalysis = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportTicketRcaApiResponse>(
      req,
      res,
      next,
      async () => {
        const { id } = req.params;

        // Call service method
        return await this.supportTicketService.getRootCauseAnalysis(id);
      }
    );
  };

  /**
   * Add resolution notes to a support ticket
   */
  addResolutionNotes = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportTicketResolutionApiResponse>(
      req,
      res,
      next,
      async () => {
        const { id } = req.params;
        const userId = req.user?.id;
        const userAgent = req.get('User-Agent');

        // Get the resolution data from the request body
        const { data } =
          createIApiRequest<ISupportTicketResolutionApiRequest>(req);

        // Call service method with domain model
        return await this.supportTicketService.addResolutionNotes(
          id,
          data,
          userId,
          userAgent
        );
      }
    );
  };

  /**
   * Update resolution notes for a support ticket
   */
  updateResolutionNotes = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportTicketResolutionApiResponse>(
      req,
      res,
      next,
      async () => {
        const { id } = req.params;
        const userId = req.user?.id;
        const userAgent = req.get('User-Agent');

        // Get the resolution data from the request body
        const { data } =
          createIApiRequest<ISupportTicketResolutionApiRequest>(req);

        // Call service method with domain model
        return await this.supportTicketService.updateResolutionNotes(
          id,
          data,
          userId,
          userAgent
        );
      }
    );
  };

  /**
   * Get resolution notes for a support ticket
   */
  getResolutionNotes = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportTicketResolutionApiResponse>(
      req,
      res,
      next,
      async () => {
        const { id } = req.params;

        // Call service method
        return await this.supportTicketService.getResolutionNotes(id);
      }
    );
  };

  /**
   * Get comprehensive support ticket statistics
   */
  getTicketStatistics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportTicketStatisticsApiResponse>(
      req,
      res,
      next,
      async () => {
        // Helper function to parse query parameter as array
        const parseAsArray = (value: any): any[] | undefined => {
          if (!value) return undefined;
          if (Array.isArray(value)) return value;
          return [value];
        };
        logger.info('Getting ticket statistics with filters', {
          filters: req.query,
        });
        // Get the filters from query parameters
        const filters: ISupportTicketStatisticsFilter = {};

        // Parse array parameters
        if (req.query.entityType) {
          filters.entityType = parseAsArray(req.query.entityType);
        }
        if (req.query.category) {
          filters.category = parseAsArray(req.query.category);
        }
        if (req.query.priority) {
          filters.priority = parseAsArray(req.query.priority);
        }
        if (req.query.status) {
          filters.status = parseAsArray(req.query.status);
        }

        // Parse string parameters
        if (req.query.assignedUserId) {
          filters.assignedUserId = req.query.assignedUserId as string;
        }

        // Call service method with domain model
        const statistics =
          await this.supportTicketService.getTicketStatistics(filters);

        return statistics;
      }
    );
  };
}
