import { PrismaClient } from '@prisma/client';

import { singleton } from '@/shared/decorators/singleton';
import { logger } from '@/shared/utils/logger';
import { ENV } from '@/config/env';
import { ISupportTicketAuditLog } from '@/shared/models/domain/support-ticket/support-ticket-audit-log.domain';

/**
 * Support Ticket Activity Service
 * Handles all activity logging and audit trail functionality for support tickets
 */
@singleton
export class SupportTicketActivityService {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Map database audit log to domain model
   */
  private mapAuditLogToDomain(log: any): ISupportTicketAuditLog {
    return {
      id: log.id,
      ticketId: log.ticketId,
      action: log.action,
      entityType: log.entityType === null ? undefined : log.entityType,
      entityId: log.entityId === null ? undefined : log.entityId,
      fieldChanged: log.fieldChanged === null ? undefined : log.fieldChanged,
      oldValue: log.oldValue === null ? undefined : log.oldValue,
      newValue: log.newValue === null ? undefined : log.newValue,
      oldData: log.oldData,
      newData: log.newData,
      reason: log.reason === null ? undefined : log.reason,
      metadata: log.metadata,
      details: log.details,
      performedById: log.performedById === null ? undefined : log.performedById,
      sessionId: log.sessionId === null ? undefined : log.sessionId,
      userAgent: log.userAgent === null ? undefined : log.userAgent,
      isPrivate: log.isPrivate === null ? undefined : log.isPrivate,
      createdAt: log.createdAt,
    };
  }

  /**
   * Get activity logs for a specific ticket
   */
  async getTicketActivityLogs(
    ticketId: string,
    filters?: {
      action?: string[];
      entityType?: string[];
      performedById?: string;
      createdFrom?: Date;
      createdTo?: Date;
    },
    pagination: { page: number; limit: number } = { page: 1, limit: 50 }
  ): Promise<{
    logs: (ISupportTicketAuditLog & {
      performedBy?: { id: string; name: string; email: string } | null;
    })[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const where: any = {
        ticketId,
      };

      if (filters?.action && filters.action.length > 0) {
        where.action = { in: filters.action };
      }

      if (filters?.entityType && filters.entityType.length > 0) {
        where.entityType = { in: filters.entityType };
      }

      if (filters?.performedById) {
        where.performedById = filters.performedById;
      }

      if (filters?.createdFrom || filters?.createdTo) {
        where.createdAt = {};
        if (filters.createdFrom) {
          where.createdAt.gte = filters.createdFrom;
        }
        if (filters.createdTo) {
          where.createdAt.lte = filters.createdTo;
        }
      }

      const skip = (pagination.page - 1) * pagination.limit;

      const [logs, total] = await Promise.all([
        this.prisma.support_ticket_audit_log.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: pagination.limit,
          include: {
            performedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),
        this.prisma.support_ticket_audit_log.count({ where }),
      ]);

      const totalPages = Math.ceil(total / pagination.limit);

      return {
        logs: logs.map((log) => ({
          ...this.mapAuditLogToDomain(log),
          performedBy: log.performedBy,
        })),
        pagination: {
          ...pagination,
          total,
          totalPages,
        },
      };
    } catch (error) {
      logger.error('Failed to get ticket activity logs', {
        error,
        ticketId,
        filters,
      });
      throw error;
    }
  }

  /**
   * Get activity logs for all tickets with comprehensive filtering
   */
  async getAllActivityLogs(
    filters?: {
      ticketId?: string;
      action?: string[];
      entityType?: string[];
      performedById?: string;
      fieldChanged?: string[];
      createdFrom?: Date;
      createdTo?: Date;
      search?: string;
    },
    sort: {
      field: 'createdAt' | 'action' | 'fieldChanged' | 'performedById';
      direction: 'asc' | 'desc';
    } = {
      field: 'createdAt',
      direction: 'desc',
    },
    pagination: { page: number; limit: number } = { page: 1, limit: 50 }
  ): Promise<{
    logs: (ISupportTicketAuditLog & {
      performedBy?: { id: string; name: string; email: string } | null;
      ticket?: {
        id: string;
        ticketNumber: string;
        title: string;
        status: string;
        priority: string;
      } | null;
    })[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const where: any = {};

      if (filters?.ticketId) {
        where.ticketId = filters.ticketId;
      }

      if (filters?.action && filters.action.length > 0) {
        where.action = { in: filters.action };
      }

      if (filters?.entityType && filters.entityType.length > 0) {
        where.entityType = { in: filters.entityType };
      }

      if (filters?.performedById) {
        where.performedById = filters.performedById;
      }

      if (filters?.fieldChanged && filters.fieldChanged.length > 0) {
        where.fieldChanged = { in: filters.fieldChanged };
      }

      if (filters?.createdFrom || filters?.createdTo) {
        where.createdAt = {};
        if (filters.createdFrom) {
          where.createdAt.gte = filters.createdFrom;
        }
        if (filters.createdTo) {
          where.createdAt.lte = filters.createdTo;
        }
      }

      if (filters?.search) {
        where.OR = [
          { action: { contains: filters.search, mode: 'insensitive' } },
          { fieldChanged: { contains: filters.search, mode: 'insensitive' } },
          { reason: { contains: filters.search, mode: 'insensitive' } },
          { oldValue: { contains: filters.search, mode: 'insensitive' } },
          { newValue: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      const skip = (pagination.page - 1) * pagination.limit;

      const [logs, total] = await Promise.all([
        this.prisma.support_ticket_audit_log.findMany({
          where,
          orderBy: { [sort.field]: sort.direction },
          skip,
          take: pagination.limit,
          include: {
            performedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            ticket: {
              select: {
                id: true,
                ticketNumber: true,
                title: true,
                status: true,
                priority: true,
              },
            },
          },
        }),
        this.prisma.support_ticket_audit_log.count({ where }),
      ]);

      const totalPages = Math.ceil(total / pagination.limit);

      return {
        logs: logs.map((log) => ({
          ...this.mapAuditLogToDomain(log),
          performedBy: log.performedBy,
          ticket: log.ticket,
        })),
        pagination: {
          ...pagination,
          total,
          totalPages,
        },
      };
    } catch (error) {
      logger.error('Failed to get all activity logs', {
        error,
        filters,
      });
      throw error;
    }
  }

  /**
   * Get activity summary for support admin dashboard
   */
  async getActivitySummary(filters?: {
    dateFrom?: Date;
    dateTo?: Date;
    performedById?: string;
    action?: string[];
  }): Promise<{
    totalActions: number;
    actionsByType: Record<string, number>;
    actionsByUser: Record<string, number>;
    actionsByField: Record<string, number>;
    recentActivity: (ISupportTicketAuditLog & {
      performedBy?: { id: string; name: string; email: string } | null;
    })[];
    topUsers: Array<{
      userId: string;
      userName: string;
      actionCount: number;
    }>;
    topActions: Array<{
      action: string;
      count: number;
    }>;
    activityTimeline: Array<{
      date: string;
      actions: Array<{
        action: string;
        count: number;
      }>;
    }>;
  }> {
    try {
      const where: any = {};

      if (filters?.dateFrom || filters?.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) {
          where.createdAt.gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          where.createdAt.lte = filters.dateTo;
        }
      }

      if (filters?.performedById) {
        where.performedById = filters.performedById;
      }

      if (filters?.action && filters.action.length > 0) {
        where.action = { in: filters.action };
      }

      // Get all logs for analysis
      const logs = await this.prisma.support_ticket_audit_log.findMany({
        where,
        include: {
          performedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Calculate summary statistics
      const totalActions = logs.length;

      // Actions by type
      const actionsByType = logs.reduce(
        (acc, log) => {
          acc[log.action] = (acc[log.action] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Actions by user
      const actionsByUser = logs.reduce(
        (acc, log) => {
          if (log.performedById) {
            acc[log.performedById] = (acc[log.performedById] || 0) + 1;
          }
          return acc;
        },
        {} as Record<string, number>
      );

      // Actions by field
      const actionsByField = logs.reduce(
        (acc, log) => {
          if (log.fieldChanged) {
            acc[log.fieldChanged] = (acc[log.fieldChanged] || 0) + 1;
          }
          return acc;
        },
        {} as Record<string, number>
      );

      // Recent activity (last 20 actions)
      const recentActivity = logs.slice(0, 20).map((log) => ({
        ...this.mapAuditLogToDomain(log),
        performedBy: log.performedBy,
      }));

      // Top users
      const userActionCounts = Object.entries(actionsByUser).map(
        ([userId, count]) => {
          const user = logs.find(
            (log) => log.performedById === userId
          )?.performedBy;
          return {
            userId,
            userName: user?.name || 'Unknown User',
            actionCount: count,
          };
        }
      );

      const topUsers = userActionCounts
        .sort((a, b) => b.actionCount - a.actionCount)
        .slice(0, 10);

      // Top actions
      const topActions = Object.entries(actionsByType)
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Activity timeline (last 7 days)
      const timeline: Array<{
        date: string;
        actions: Array<{
          action: string;
          count: number;
        }>;
      }> = [];

      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const dayLogs = logs.filter((log) => {
          const logDate = new Date(log.createdAt);
          return logDate.toISOString().split('T')[0] === dateStr;
        });

        const dayActions = dayLogs.reduce(
          (acc, log) => {
            acc[log.action] = (acc[log.action] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        timeline.push({
          date: dateStr,
          actions: Object.entries(dayActions).map(([action, count]) => ({
            action,
            count,
          })),
        });
      }

      return {
        totalActions,
        actionsByType,
        actionsByUser,
        actionsByField,
        recentActivity,
        topUsers,
        topActions,
        activityTimeline: timeline,
      };
    } catch (error) {
      logger.error('Failed to get activity summary', {
        error,
        filters,
      });
      throw error;
    }
  }

  /**
   * Get user activity logs
   */
  async getUserActivityLogs(
    userId: string,
    filters?: {
      action?: string[];
      entityType?: string[];
      createdFrom?: Date;
      createdTo?: Date;
    },
    pagination: { page: number; limit: number } = { page: 1, limit: 50 }
  ): Promise<{
    logs: (ISupportTicketAuditLog & {
      performedBy?: { id: string; name: string; email: string } | null;
      ticket?: {
        id: string;
        ticketNumber: string;
        title: string;
        status: string;
        priority: string;
      } | null;
    })[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    summary: {
      totalActions: number;
      actionsByType: Record<string, number>;
      lastActivity: Date | null;
    };
  }> {
    try {
      const where: any = {
        performedById: userId,
      };

      if (filters?.action && filters.action.length > 0) {
        where.action = { in: filters.action };
      }

      if (filters?.entityType && filters.entityType.length > 0) {
        where.entityType = { in: filters.entityType };
      }

      if (filters?.createdFrom || filters?.createdTo) {
        where.createdAt = {};
        if (filters.createdFrom) {
          where.createdAt.gte = filters.createdFrom;
        }
        if (filters.createdTo) {
          where.createdAt.lte = filters.createdTo;
        }
      }

      const skip = (pagination.page - 1) * pagination.limit;

      const [logs, total] = await Promise.all([
        this.prisma.support_ticket_audit_log.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: pagination.limit,
          include: {
            performedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            ticket: {
              select: {
                id: true,
                ticketNumber: true,
                title: true,
                status: true,
                priority: true,
              },
            },
          },
        }),
        this.prisma.support_ticket_audit_log.count({ where }),
      ]);

      const totalPages = Math.ceil(total / pagination.limit);

      // Get all user logs for summary
      const allUserLogs = await this.prisma.support_ticket_audit_log.findMany({
        where: { performedById: userId },
        orderBy: { createdAt: 'desc' },
      });

      const actionsByType = allUserLogs.reduce(
        (acc, log) => {
          acc[log.action] = (acc[log.action] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const lastActivity =
        allUserLogs.length > 0 ? allUserLogs[0].createdAt : null;

      return {
        logs: logs.map((log) => ({
          ...this.mapAuditLogToDomain(log),
          performedBy: log.performedBy,
          ticket: log.ticket,
        })),
        pagination: {
          ...pagination,
          total,
          totalPages,
        },
        summary: {
          totalActions: allUserLogs.length,
          actionsByType,
          lastActivity,
        },
      };
    } catch (error) {
      logger.error('Failed to get user activity logs', {
        error,
        userId,
        filters,
      });
      throw error;
    }
  }

  /**
   * Enhanced audit log creation with better metadata
   */
  async createEnhancedAuditLog(auditData: {
    ticketId: string;
    action: string;
    entityType?: string;
    entityId?: string;
    fieldChanged?: string;
    oldValue?: string | null;
    newValue?: string | null;
    oldData?: any;
    newData?: any;
    reason?: string;
    performedById?: string;
    userAgent?: string;
    sessionId?: string;
    metadata?: any;
    isPrivate?: boolean;
  }): Promise<void> {
    try {
      // Add enhanced metadata
      const enhancedMetadata = {
        ...auditData.metadata,
        timestamp: new Date().toISOString(),
        environment: ENV.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0',
        userAgent: auditData.userAgent,
        sessionId: auditData.sessionId,
      };

      await this.prisma.support_ticket_audit_log.create({
        data: {
          ...auditData,
          metadata: enhancedMetadata,
        },
      });

      logger.info('Enhanced audit log created successfully', {
        ticketId: auditData.ticketId,
        action: auditData.action,
        performedById: auditData.performedById,
      });
    } catch (error) {
      logger.error('Failed to create enhanced audit log', { error, auditData });
      // Don't throw error for audit log failures
    }
  }

  /**
   * Create audit log entry (enhanced version)
   */
  async createAuditLog(auditData: {
    ticketId: string;
    action: string;
    entityType?: string;
    entityId?: string;
    fieldChanged?: string;
    oldValue?: string | null;
    newValue?: string | null;
    oldData?: any;
    newData?: any;
    reason?: string;
    performedById?: string;
    userAgent?: string;
    sessionId?: string;
    metadata?: any;
    isPrivate?: boolean;
  }): Promise<void> {
    await this.createEnhancedAuditLog(auditData);
  }
}
