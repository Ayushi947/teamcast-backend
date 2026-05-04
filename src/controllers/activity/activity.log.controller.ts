import { Request, Response, NextFunction } from 'express';
import { ActivityLogService } from '@/services/activity/activity.log.service';
import { BaseController } from '@/controllers/common/base.controller';
import { singleton } from '@/shared/decorators/singleton';
import { createIApiRequest } from '@/utils/api.request';
import {
  IActivityLogCreateApiRequest,
  IActivityLogCreateApiResponse,
  IActivityLogGetApiResponse,
} from '@/shared/models/api/activity/activity.log.api';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { IActivityLogFilters } from '@/shared/models/domain/activity/activity.log.domain';
import {
  UserTypeEnum,
  ActivityModuleEnum,
  ActivityEntityTypeEnum,
} from '@/shared/models/common/enums';

@singleton
export class ActivityLogController extends BaseController {
  constructor(private activityLogService: ActivityLogService) {
    super();
  }

  createActivityLog = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    this.handleRequest<IActivityLogCreateApiResponse>(
      req,
      res,
      next,
      async () => {
        if (!req.user?.id) {
          throw new AppError('Unauthorized', 401, ErrorCode.UNAUTHORIZED);
        }

        const createRequest =
          createIApiRequest<IActivityLogCreateApiRequest>(req);
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent');

        return await this.activityLogService.createActivityLog(
          req.user.id,
          createRequest.data,
          ipAddress,
          userAgent
        );
      }
    );
  };

  getActivityLogs = (req: Request, res: Response, next: NextFunction): void => {
    this.handleRequest<IActivityLogGetApiResponse>(req, res, next, async () => {
      if (!req.user?.id) {
        throw new AppError('Unauthorized', 401, ErrorCode.UNAUTHORIZED);
      }

      const {
        userId,
        clientId,
        module,
        action,
        entityId,
        entityType,
        fromDate,
        toDate,
        page = 1,
        limit = 10,
      } = req.query;

      let actionFilter: string | string[] | undefined;
      if (action) {
        if (Array.isArray(action)) {
          actionFilter = action as string[];
        } else {
          actionFilter = action as string;
        }
      }

      // Convert string dates to Date objects if provided
      let filters: IActivityLogFilters = {
        userId: userId as string,
        clientId: clientId as string,
        module: module as ActivityModuleEnum,
        action: actionFilter,
        entityId: entityId as string,
        entityType: entityType as ActivityEntityTypeEnum,
        fromDate:
          fromDate && typeof fromDate === 'string'
            ? new Date(fromDate)
            : undefined,
        toDate:
          toDate && typeof toDate === 'string' ? new Date(toDate) : undefined,
      };

      // Client users may only request activity for their own client
      if (req.user?.type === UserTypeEnum.CLIENT && req.user?.clientId) {
        filters = { ...filters, clientId: req.user.clientId as string };
      }

      const result = await this.activityLogService.getActivityLogs(
        filters,
        Number(page),
        Number(limit)
      );

      return {
        success: true,
        message: 'Activity logs retrieved successfully',
        data: result.data,
        meta: result.meta,
      };
    });
  };

  getActivityLogById = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    this.handleRequest<{ data: any }>(req, res, next, async () => {
      if (!req.user?.id) {
        throw new AppError('Unauthorized', 401, ErrorCode.UNAUTHORIZED);
      }

      const { id } = req.params;
      if (!id) {
        throw new AppError(
          'Activity log ID is required',
          400,
          ErrorCode.INVALID_INPUT
        );
      }

      const activityLog = await this.activityLogService.getActivityLogById(id);

      return {
        success: true,
        message: 'Activity log retrieved successfully',
        data: activityLog,
      };
    });
  };

  getUserActivityLogs = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    this.handleRequest<IActivityLogGetApiResponse>(req, res, next, async () => {
      if (!req.user?.id) {
        throw new AppError('Unauthorized', 401, ErrorCode.UNAUTHORIZED);
      }

      const { userId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      // Ensure user can only access their own logs or admin can access any
      const targetUserId = userId || req.user.id;
      if (targetUserId !== req.user.id && req.user.role !== 'ADMIN') {
        throw new AppError('Forbidden', 403, ErrorCode.FORBIDDEN);
      }

      const result = await this.activityLogService.getUserActivityLogs(
        targetUserId,
        Number(page),
        Number(limit)
      );

      return {
        success: true,
        message: 'User activity logs retrieved successfully',
        data: result.data,
        meta: result.meta,
      };
    });
  };

  deleteActivityLog = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    this.handleRequest<{ message: string }>(req, res, next, async () => {
      // Only admins should be able to delete activity logs
      if (!req.user?.id || req.user.role !== 'ADMIN') {
        throw new AppError('Forbidden', 403, ErrorCode.FORBIDDEN);
      }

      const { id } = req.params;
      if (!id) {
        throw new AppError(
          'Activity log ID is required',
          400,
          ErrorCode.INVALID_INPUT
        );
      }

      await this.activityLogService.deleteActivityLog(id);

      return {
        success: true,
        message: 'Activity log deleted successfully',
      };
    });
  };
}
