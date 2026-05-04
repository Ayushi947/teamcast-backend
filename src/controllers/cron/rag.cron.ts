import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import {
  IRagCronTaskGetApiResponse,
  IRagCronTaskListApiResponse,
  IRagCronTaskStartedApiResponse,
  IRagCronTaskListApiRequest,
} from '@/shared/models/api/cron/rag.cron.api';
import { singleton } from '@/shared/decorators/singleton';
import { RagCronService } from '@/services/cron/rag.cron.service';
import { IRagCronStartTaskApiRequest } from '@/shared/models/api/cron/rag.cron.api';

@singleton
export class RagCronController extends BaseController {
  constructor(private readonly ragCronService: RagCronService) {
    super();
  }

  /**
   * Start a new RAG task
   */
  startRagTask = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IRagCronTaskStartedApiResponse>(
      req,
      res,
      next,
      async () => {
        const { data } = createIApiRequest<IRagCronStartTaskApiRequest>(req);
        return await this.ragCronService.startRagTask(data.batchSize);
      }
    );
  };

  /**
   * Get a RAG task by ID
   */
  getTask = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IRagCronTaskGetApiResponse>(req, res, next, async () => {
      const taskId = req.params.taskId;
      return await this.ragCronService.getTask(taskId);
    });
  };

  /**
   * Get all RAG tasks
   */
  getAllTasks = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IRagCronTaskListApiResponse>(
      req,
      res,
      next,
      async () => {
        // Extract filter parameters and pagination
        const listTasksRequest =
          createIApiRequest<IRagCronTaskListApiRequest>(req);

        // Call service method with domain models
        return await this.ragCronService.getAllTasks(
          listTasksRequest.filters,
          listTasksRequest.pagination
        );
      }
    );
  };
}
