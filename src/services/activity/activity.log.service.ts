import { Prisma, PrismaClient } from '@prisma/client';
import { singleton } from '@/shared/decorators/singleton';
import { logger } from '@/shared/utils/logger';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import {
  IActivityLog,
  IActivityLogCreate,
  IActivityLogCreated,
  IActivityLogFilters,
  toActivityLogDomain,
} from '@/shared/models/domain/activity/activity.log.domain';

const prisma = new PrismaClient();

@singleton
export class ActivityLogService {
  constructor() {}

  async createActivityLog(
    userId: string,
    activityLogData: IActivityLogCreate,
    ipAddress?: string,
    userAgent?: string
  ): Promise<IActivityLogCreated> {
    try {
      logger.debug('Creating activity log', {
        userId,
        module: activityLogData.module,
        action: activityLogData.action,
        context: 'ActivityLogService.createActivityLog',
      });

      const activityLog = await prisma.activity_log.create({
        data: {
          userId,
          module: activityLogData.module,
          action: activityLogData.action,
          entityId: activityLogData.entityId,
          entityType: activityLogData.entityType,
          description: activityLogData.description,
          metadata: activityLogData.metadata,
          ipAddress,
          userAgent,
        },
      });

      logger.info('Activity log created successfully', {
        activityLogId: activityLog.id,
        userId,
        module: activityLogData.module,
        action: activityLogData.action,
        context: 'ActivityLogService.createActivityLog',
      });

      return {
        message: 'Activity logged successfully',
        activityLog: toActivityLogDomain(activityLog),
      };
    } catch (error) {
      logger.error('Failed to create activity log', {
        error,
        userId,
        activityLogData,
        context: 'ActivityLogService.createActivityLog',
      });
      throw new AppError(
        'Failed to create activity log',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getActivityLogs(
    filters: IActivityLogFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    data: IActivityLog[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    try {
      logger.debug('Fetching activity logs', {
        filters,
        page,
        limit,
        context: 'ActivityLogService.getActivityLogs',
      });

      // Build where clause
      const whereClause: Prisma.activity_logWhereInput = {};

      if (filters.userId) {
        whereClause.userId = filters.userId;
      }
      if (filters.clientId) {
        // Restrict to activity from users that belong to this client
        whereClause.user = {
          clientUser: {
            clientId: filters.clientId,
          },
        };
      }
      if (filters.module) {
        whereClause.module = filters.module;
      }
      if (filters.action) {
        if (Array.isArray(filters.action)) {
          whereClause.action = {
            in: filters.action,
          };
        } else {
          whereClause.action = filters.action;
        }
      }
      if (filters.entityId) {
        whereClause.entityId = filters.entityId;
      }
      if (filters.entityType) {
        whereClause.entityType = filters.entityType;
      }
      if (filters.fromDate || filters.toDate) {
        whereClause.timestamp = {};
        if (filters.fromDate) {
          whereClause.timestamp.gte = filters.fromDate;
        }
        if (filters.toDate) {
          whereClause.timestamp.lte = filters.toDate;
        }
      }

      // Get total count
      const total = await prisma.activity_log.count({
        where: whereClause,
      });

      // Calculate pagination
      const skip = (page - 1) * limit;
      const totalPages = Math.ceil(total / limit);

      // Fetch activity logs
      const activityLogs = await prisma.activity_log.findMany({
        where: whereClause,
        orderBy: {
          timestamp: 'desc',
        },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              type: true,
              role: true,
              clientUser: {
                select: {
                  client: {
                    select: {
                      company: { select: { name: true } },
                    },
                  },
                },
              },
              partnerUser: {
                select: {
                  partner: {
                    select: {
                      company: { select: { name: true } },
                    },
                  },
                },
              },
            },
          },
        },
      });

      logger.info('Activity logs fetched successfully', {
        total,
        page,
        limit,
        totalPages,
        context: 'ActivityLogService.getActivityLogs',
      });

      return {
        data: activityLogs.map(toActivityLogDomain),
        meta: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      logger.error('Failed to fetch activity logs', {
        error,
        filters,
        page,
        limit,
        context: 'ActivityLogService.getActivityLogs',
      });
      throw new AppError(
        'Failed to fetch activity logs',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getActivityLogById(id: string): Promise<IActivityLog> {
    try {
      logger.debug('Fetching activity log by ID', {
        id,
        context: 'ActivityLogService.getActivityLogById',
      });

      const activityLog = await prisma.activity_log.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              type: true,
              role: true,
              clientUser: {
                select: {
                  client: {
                    select: {
                      company: { select: { name: true } },
                    },
                  },
                },
              },
              partnerUser: {
                select: {
                  partner: {
                    select: {
                      company: { select: { name: true } },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!activityLog) {
        throw new AppError('Activity log not found', 404, ErrorCode.NOT_FOUND);
      }

      logger.info('Activity log fetched successfully', {
        id,
        context: 'ActivityLogService.getActivityLogById',
      });

      return toActivityLogDomain(activityLog);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Failed to fetch activity log by ID', {
        error,
        id,
        context: 'ActivityLogService.getActivityLogById',
      });
      throw new AppError(
        'Failed to fetch activity log',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getUserActivityLogs(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    data: IActivityLog[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    return this.getActivityLogs({ userId }, page, limit);
  }

  async deleteActivityLog(id: string): Promise<void> {
    try {
      logger.debug('Deleting activity log', {
        id,
        context: 'ActivityLogService.deleteActivityLog',
      });

      const activityLog = await prisma.activity_log.findUnique({
        where: { id },
      });

      if (!activityLog) {
        throw new AppError('Activity log not found', 404, ErrorCode.NOT_FOUND);
      }

      await prisma.activity_log.delete({
        where: { id },
      });

      logger.info('Activity log deleted successfully', {
        id,
        context: 'ActivityLogService.deleteActivityLog',
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Failed to delete activity log', {
        error,
        id,
        context: 'ActivityLogService.deleteActivityLog',
      });
      throw new AppError(
        'Failed to delete activity log',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }
}
