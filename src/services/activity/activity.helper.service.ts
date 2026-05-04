import { ActivityLogService } from './activity.log.service';
import { IActivityLogCreate } from '@/shared/models/domain/activity/activity.log.domain';
import {
  ActivityModuleEnum,
  ActivityEntityTypeEnum,
} from '@/shared/models/common/enums';
import { logger } from '@/shared/utils/logger';
import { singleton } from '@/shared/decorators/singleton';

// Base interface for common activity parameters
interface IBaseActivityParams {
  userId: string;
  action: string;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

// Interface for activities with entity information
interface IEntityActivityParams extends IBaseActivityParams {
  entityId?: string;
  entityType?: ActivityEntityTypeEnum;
}

// Interface for specific entity types with custom ID names
interface IJobActivityParams extends IBaseActivityParams {
  jobId?: string;
}

interface IApplicationActivityParams extends IBaseActivityParams {
  applicationId?: string;
}

interface IAssessmentActivityParams extends IBaseActivityParams {
  assessmentId?: string;
  assessmentType?: ActivityEntityTypeEnum;
}

interface ISubscriptionActivityParams extends IBaseActivityParams {
  subscriptionId?: string;
}

@singleton
export class ActivityHelper {
  private activityLogService = new ActivityLogService();

  /**
   * Log user activity with automatic IP and User-Agent detection
   */
  async logActivity(
    userId: string,
    activityData: IActivityLogCreate,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await this.activityLogService.createActivityLog(
        userId,
        activityData,
        ipAddress,
        userAgent
      );
    } catch (error) {
      // Log the error but don't throw - activity logging should not break the main flow
      logger.error('Failed to log activity', {
        error,
        userId,
        activityData,
        context: 'ActivityHelper.logActivity',
      });
    }
  }

  /**
   * Convenience method for logging authentication activities
   */
  async logAuth(params: IBaseActivityParams): Promise<void> {
    const { userId, action, description, metadata, ipAddress, userAgent } =
      params;
    await this.logActivity(
      userId,
      {
        module: ActivityModuleEnum.AUTH,
        action,
        description,
        metadata,
      },
      ipAddress,
      userAgent
    );
  }

  /**
   * Convenience method for logging candidate activities
   */
  async logCandidate(params: IEntityActivityParams): Promise<void> {
    const {
      userId,
      action,
      description,
      entityId,
      metadata,
      ipAddress,
      userAgent,
    } = params;
    await this.logActivity(
      userId,
      {
        module: ActivityModuleEnum.CANDIDATE,
        action,
        entityId,
        entityType: entityId ? ActivityEntityTypeEnum.CANDIDATE : undefined,
        description,
        metadata,
      },
      ipAddress,
      userAgent
    );
  }

  /**
   * Convenience method for logging client activities
   */
  async logClient(params: IEntityActivityParams): Promise<void> {
    const {
      userId,
      action,
      description,
      entityId,
      entityType,
      metadata,
      ipAddress,
      userAgent,
    } = params;
    await this.logActivity(
      userId,
      {
        module: ActivityModuleEnum.CLIENT,
        action,
        entityId,
        entityType,
        description,
        metadata,
      },
      ipAddress,
      userAgent
    );
  }

  /**
   * Convenience method for logging partner activities
   */
  async logPartner(params: IEntityActivityParams): Promise<void> {
    const {
      userId,
      action,
      description,
      entityId,
      entityType,
      metadata,
      ipAddress,
      userAgent,
    } = params;
    await this.logActivity(
      userId,
      {
        module: ActivityModuleEnum.PARTNER,
        action,
        entityId,
        entityType,
        description,
        metadata,
      },
      ipAddress,
      userAgent
    );
  }

  /**
   * Convenience method for logging job-related activities
   */
  async logJob(params: IJobActivityParams): Promise<void> {
    const {
      userId,
      action,
      description,
      jobId,
      metadata,
      ipAddress,
      userAgent,
    } = params;
    await this.logActivity(
      userId,
      {
        module: ActivityModuleEnum.JOB,
        action,
        entityId: jobId,
        entityType: jobId ? ActivityEntityTypeEnum.JOB_POSTING : undefined,
        description,
        metadata,
      },
      ipAddress,
      userAgent
    );
  }

  /**
   * Convenience method for logging application activities
   */
  async logApplication(params: IApplicationActivityParams): Promise<void> {
    const {
      userId,
      action,
      description,
      applicationId,
      metadata,
      ipAddress,
      userAgent,
    } = params;
    await this.logActivity(
      userId,
      {
        module: ActivityModuleEnum.APPLICATION,
        action,
        entityId: applicationId,
        entityType: applicationId
          ? ActivityEntityTypeEnum.JOB_APPLICATION
          : undefined,
        description,
        metadata,
      },
      ipAddress,
      userAgent
    );
  }

  /**
   * Convenience method for logging assessment activities
   */
  async logAssessment(params: IAssessmentActivityParams): Promise<void> {
    const {
      userId,
      action,
      description,
      assessmentId,
      assessmentType,
      metadata,
      ipAddress,
      userAgent,
    } = params;
    await this.logActivity(
      userId,
      {
        module: ActivityModuleEnum.ASSESSMENT,
        action,
        entityId: assessmentId,
        entityType: assessmentType,
        description,
        metadata,
      },
      ipAddress,
      userAgent
    );
  }

  /**
   * Convenience method for logging system/admin activities
   */
  async logSystem(params: IEntityActivityParams): Promise<void> {
    const {
      userId,
      action,
      description,
      entityId,
      entityType,
      metadata,
      ipAddress,
      userAgent,
    } = params;
    await this.logActivity(
      userId,
      {
        module: ActivityModuleEnum.SYSTEM,
        action,
        entityId,
        entityType,
        description,
        metadata,
      },
      ipAddress,
      userAgent
    );
  }

  /**
   * Convenience method for logging subscription activities
   */
  async logSubscription(params: ISubscriptionActivityParams): Promise<void> {
    const {
      userId,
      action,
      description,
      subscriptionId,
      metadata,
      ipAddress,
      userAgent,
    } = params;
    await this.logActivity(
      userId,
      {
        module: ActivityModuleEnum.SUBSCRIPTION,
        action,
        entityId: subscriptionId,
        entityType: subscriptionId
          ? ActivityEntityTypeEnum.SUBSCRIPTION
          : undefined,
        description,
        metadata,
      },
      ipAddress,
      userAgent
    );
  }

  /**
   * Convenience method for logging notification activities
   */
  async logNotification(params: IEntityActivityParams): Promise<void> {
    const {
      userId,
      action,
      description,
      entityId,
      entityType,
      metadata,
      ipAddress,
      userAgent,
    } = params;
    await this.logActivity(
      userId,
      {
        module: ActivityModuleEnum.NOTIFICATION,
        action,
        entityId,
        entityType,
        description,
        metadata,
      },
      ipAddress,
      userAgent
    );
  }
}

// Export a singleton instance for easy importing
export const activityHelper = new ActivityHelper();
