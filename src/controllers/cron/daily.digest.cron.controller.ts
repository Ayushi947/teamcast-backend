import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import {
  IDailyDigestCronTaskGetApiResponse,
  IDailyDigestCronTaskListApiResponse,
  IDailyDigestCronTaskStartedApiResponse,
  IDailyDigestCronTaskListApiRequest,
  IDailyDigestCronStartTaskApiRequest,
} from '@/shared/models/api/cron/daily.digest.cron.api';
import { singleton } from '@/shared/decorators/singleton';
import { DailyDigestCronService } from '@/services/cron/daily.digest.cron.service';
import { DailyDigestProcessor } from '@/services/queue/processors/daily.digest.processor';

@singleton
export class DailyDigestCronController extends BaseController {
  constructor(
    private readonly dailyDigestCronService: DailyDigestCronService,
    private readonly dailyDigestProcessor: DailyDigestProcessor
  ) {
    super();
  }

  /**
   * Start a new daily digest task
   */
  startDailyDigestTask = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IDailyDigestCronTaskStartedApiResponse>(
      req,
      res,
      next,
      async () => {
        const { data: _data } =
          createIApiRequest<IDailyDigestCronStartTaskApiRequest>(req);

        // Start the task
        const task = await this.dailyDigestCronService.startDailyDigestTask();

        return {
          success: true,
          message: 'Daily digest task started successfully',
          data: {
            taskId: task.id,
            status: task.status,
          },
        };
      }
    );
  };

  /**
   * Get a specific daily digest task
   */
  getTask = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IDailyDigestCronTaskGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const taskId = req.params.taskId;
        return await this.dailyDigestCronService.getTask(taskId);
      }
    );
  };

  /**
   * Get all daily digest tasks with filtering and pagination
   */
  getAllTasks = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IDailyDigestCronTaskListApiResponse>(
      req,
      res,
      next,
      async () => {
        // Extract filter parameters and pagination
        const listTasksRequest =
          createIApiRequest<IDailyDigestCronTaskListApiRequest>(req);

        // Call service method with domain models
        return await this.dailyDigestCronService.getAllTasks(
          listTasksRequest.filters,
          listTasksRequest.pagination
        );
      }
    );
  };
}
