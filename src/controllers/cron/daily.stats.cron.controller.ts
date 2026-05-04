import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import {
  IDailyStatsCronTaskGetApiResponse,
  IDailyStatsCronTaskListApiResponse,
  IDailyStatsCronTaskStartedApiResponse,
  IDailyStatsCronTaskListApiRequest,
  IDailyStatsCronStartTaskApiRequest,
} from '@/shared/models/api/cron/daily.stats.cron.api';
import { singleton } from '@/shared/decorators/singleton';
import { DailyStatsCronService } from '@/services/cron/daily.stats.cron.service';
import { DailyStatsProcessor } from '@/services/queue/processors/daily.stats.processor';

@singleton
export class DailyStatsCronController extends BaseController {
  constructor(
    private readonly dailyStatsCronService: DailyStatsCronService,
    private readonly dailyStatsProcessor: DailyStatsProcessor
  ) {
    super();
  }

  /**
   * Start a new daily stats task
   */
  startDailyStatsTask = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IDailyStatsCronTaskStartedApiResponse>(
      req,
      res,
      next,
      async () => {
        const { data: _data } =
          createIApiRequest<IDailyStatsCronStartTaskApiRequest>(req);
        // Start the task
        const task = await this.dailyStatsCronService.startDailyStatsTask();

        return {
          success: true,
          message: 'Daily stats task started successfully',
          data: {
            taskId: task.id,
            status: task.status,
          },
        };
      }
    );
  };

  /**
   * Get a specific daily stats task
   */
  getTask = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IDailyStatsCronTaskGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const taskId = req.params.taskId;
        return await this.dailyStatsCronService.getTask(taskId);
      }
    );
  };

  /**
   * Get all daily stats tasks with filtering and pagination
   */
  getAllTasks = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IDailyStatsCronTaskListApiResponse>(
      req,
      res,
      next,
      async () => {
        // Extract filter parameters and pagination
        const listTasksRequest =
          createIApiRequest<IDailyStatsCronTaskListApiRequest>(req);

        // Call service method with domain models
        return await this.dailyStatsCronService.getAllTasks(
          listTasksRequest.filters,
          listTasksRequest.pagination
        );
      }
    );
  };
}
