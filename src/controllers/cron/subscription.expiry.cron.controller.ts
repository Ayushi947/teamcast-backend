import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../common/base.controller';

import { singleton } from '@/shared/decorators/singleton';
import { SubscriptionExpiryCronService } from '@/services/cron/subscription.expiry.cron.service';
import {
  ISubscriptionExpiryCronTaskListQuery,
  parseSubscriptionExpiryCronTaskListQuery,
} from '@/shared/models/domain/cron/subscription.expiry.cron.domain';
import {
  ISubscriptionExpiryCronStartTaskApiRequest,
  ISubscriptionExpiryCronTaskGetApiResponse,
  ISubscriptionExpiryCronTaskListApiResponse,
  ISubscriptionExpiryCronTaskStartedApiResponse,
} from '@/shared/models/api/cron/subscription.expiry.cron.api';

@singleton
export class SubscriptionExpiryCronController extends BaseController {
  constructor(
    private readonly subscriptionExpiryCronService: SubscriptionExpiryCronService
  ) {
    super();
  }

  /**
   * Start a new subscription expiry task
   */
  startSubscriptionExpiryTask = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISubscriptionExpiryCronTaskStartedApiResponse>(
      req,
      res,
      next,
      async () => {
        const requestData =
          req.body as ISubscriptionExpiryCronStartTaskApiRequest;
        return await this.subscriptionExpiryCronService.startSubscriptionExpiryTask(
          requestData.type,
          requestData.metadata
        );
      }
    );
  };

  /**
   * Get a subscription expiry task by ID
   */
  getTask = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISubscriptionExpiryCronTaskGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const taskId = req.params.taskId;
        return await this.subscriptionExpiryCronService.getTask(taskId);
      }
    );
  };

  /**
   * Get all subscription expiry tasks
   */
  getAllTasks = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISubscriptionExpiryCronTaskListApiResponse>(
      req,
      res,
      next,
      async () => {
        const queryParams: ISubscriptionExpiryCronTaskListQuery = {
          page: req.query.page ? parseInt(req.query.page as string) : undefined,
          limit: req.query.limit
            ? parseInt(req.query.limit as string)
            : undefined,
          type: req.query.type as string,
          status: req.query.status as string,
          startDate: req.query.startDate as string,
          endDate: req.query.endDate as string,
        };

        const { pagination, filters } =
          parseSubscriptionExpiryCronTaskListQuery(queryParams);

        return await this.subscriptionExpiryCronService.getTasks(
          pagination,
          filters
        );
      }
    );
  };

  /**
   * Cancel a subscription expiry task
   */
  cancelTask = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISubscriptionExpiryCronTaskGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const taskId = req.params.taskId;
        return await this.subscriptionExpiryCronService.cancelTask(taskId);
      }
    );
  };

  /**
   * Delete a subscription expiry task
   */
  deleteTask = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const taskId = req.params.taskId;
      await this.subscriptionExpiryCronService.deleteTask(taskId);
      return { message: 'Task deleted successfully' };
    });
  };
}
