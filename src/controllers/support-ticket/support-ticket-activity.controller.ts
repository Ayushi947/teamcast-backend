import { Request, Response, NextFunction } from 'express';
import { singleton } from '@/shared/decorators/singleton';
import { SupportTicketActivityService } from '@/services/support-ticket/support-ticket-activity.service';
import { BaseController } from '../common/base.controller';
import {
  ISupportTicketActivityLogsApiResponse,
  ISupportTicketActivitySummaryApiResponse,
  ISupportTicketUserActivityLogsApiResponse,
} from '@/shared/models/api/support-ticket/support-ticket-activity.api';
import {
  ISupportTicketActivityLogFilter,
  ISupportTicketActivityLogSort,
  ISupportTicketActivityLogPagination,
  ISupportTicketActivitySummaryFilter,
  ISupportTicketUserActivityLogFilter,
} from '@/shared/models/domain/support-ticket/support-ticket-activity.domain';

/**
 * Support Ticket Activity Controller
 * Handles activity logging and audit trail functionality for support admins
 */
@singleton
export class SupportTicketActivityController extends BaseController {
  private readonly activityService: SupportTicketActivityService;

  constructor() {
    super();
    this.activityService = new SupportTicketActivityService();
  }

  /**
   * Get activity logs for a specific ticket
   */
  getTicketActivityLogs = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportTicketActivityLogsApiResponse>(
      req,
      res,
      next,
      async () => {
        const { ticketId } = req.params;
        const {
          action,
          entityType,
          performedById,
          createdFrom,
          createdTo,
          page = '1',
          limit = '50',
        } = req.query;

        const filters: ISupportTicketActivityLogFilter = {};

        if (action) {
          filters.action = Array.isArray(action)
            ? (action as string[])
            : [action as string];
        }
        if (entityType) {
          filters.entityType = Array.isArray(entityType)
            ? (entityType as string[])
            : [entityType as string];
        }
        if (performedById) filters.performedById = performedById as string;
        if (createdFrom) filters.createdFrom = new Date(createdFrom as string);
        if (createdTo) filters.createdTo = new Date(createdTo as string);

        const pagination: ISupportTicketActivityLogPagination = {
          page: parseInt(page as string, 10),
          limit: parseInt(limit as string, 10),
        };

        const result = await this.activityService.getTicketActivityLogs(
          ticketId,
          filters,
          pagination
        );

        return {
          logs: result.logs,
          pagination: result.pagination,
        };
      }
    );
  };

  /**
   * Get all activity logs with comprehensive filtering
   */
  getAllActivityLogs = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportTicketActivityLogsApiResponse>(
      req,
      res,
      next,
      async () => {
        const {
          ticketId,
          action,
          entityType,
          performedById,
          fieldChanged,
          createdFrom,
          createdTo,
          search,
          sortBy = 'createdAt',
          sortOrder = 'desc',
          page = '1',
          limit = '50',
        } = req.query;

        const filters: ISupportTicketActivityLogFilter = {};

        if (ticketId) filters.ticketId = ticketId as string;
        if (action) {
          filters.action = Array.isArray(action)
            ? (action as string[])
            : [action as string];
        }
        if (entityType) {
          filters.entityType = Array.isArray(entityType)
            ? (entityType as string[])
            : [entityType as string];
        }
        if (performedById) filters.performedById = performedById as string;
        if (fieldChanged) {
          filters.fieldChanged = Array.isArray(fieldChanged)
            ? (fieldChanged as string[])
            : [fieldChanged as string];
        }
        if (createdFrom) filters.createdFrom = new Date(createdFrom as string);
        if (createdTo) filters.createdTo = new Date(createdTo as string);
        if (search) filters.search = search as string;

        const sort: ISupportTicketActivityLogSort = {
          field: sortBy as
            | 'createdAt'
            | 'action'
            | 'fieldChanged'
            | 'performedById',
          direction: sortOrder as 'asc' | 'desc',
        };

        const pagination: ISupportTicketActivityLogPagination = {
          page: parseInt(page as string, 10),
          limit: parseInt(limit as string, 10),
        };

        const result = await this.activityService.getAllActivityLogs(
          filters,
          sort,
          pagination
        );

        return {
          logs: result.logs,
          pagination: result.pagination,
        };
      }
    );
  };

  /**
   * Get activity summary for support admin dashboard
   */
  getActivitySummary = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportTicketActivitySummaryApiResponse>(
      req,
      res,
      next,
      async () => {
        const { dateFrom, dateTo, performedById, action } = req.query;

        const filters: ISupportTicketActivitySummaryFilter = {};

        if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
        if (dateTo) filters.dateTo = new Date(dateTo as string);
        if (performedById) filters.performedById = performedById as string;
        if (action) {
          filters.action = Array.isArray(action)
            ? (action as string[])
            : [action as string];
        }

        const result = await this.activityService.getActivitySummary(filters);

        return result;
      }
    );
  };

  /**
   * Get user activity logs
   */
  getUserActivityLogs = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportTicketUserActivityLogsApiResponse>(
      req,
      res,
      next,
      async () => {
        const { userId } = req.params;
        const {
          action,
          entityType,
          createdFrom,
          createdTo,
          page = '1',
          limit = '50',
        } = req.query;

        const filters: ISupportTicketUserActivityLogFilter = {};

        if (action) {
          filters.action = Array.isArray(action)
            ? (action as string[])
            : [action as string];
        }
        if (entityType) {
          filters.entityType = Array.isArray(entityType)
            ? (entityType as string[])
            : [entityType as string];
        }
        if (createdFrom) filters.createdFrom = new Date(createdFrom as string);
        if (createdTo) filters.createdTo = new Date(createdTo as string);

        const pagination: ISupportTicketActivityLogPagination = {
          page: parseInt(page as string, 10),
          limit: parseInt(limit as string, 10),
        };

        const result = await this.activityService.getUserActivityLogs(
          userId,
          filters,
          pagination
        );

        return {
          logs: result.logs,
          pagination: result.pagination,
          summary: result.summary,
        };
      }
    );
  };
}
