import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import {
  IJobRecommendationCronTaskGetApiResponse,
  IJobRecommendationCronTaskListApiResponse,
  IJobRecommendationCronTaskStartedApiResponse,
  IJobRecommendationCronTaskListApiRequest,
  IJobRecommendationCronStartTaskApiRequest,
  IJobRecommendationCronFindRecommendationsApiRequest,
  IJobRecommendationCronFindRecommendationsApiResponse,
} from '@/shared/models/api/cron/job.recommendation.cron.api';
import { singleton } from '@/shared/decorators/singleton';
import { JobRecommendationCronService } from '@/services/cron/job.recommendation.cron.service';

@singleton
export class JobRecommendationCronController extends BaseController {
  constructor(
    private readonly jobRecommendationCronService: JobRecommendationCronService
  ) {
    super();
  }

  /**
   * Start a new job recommendation task
   */
  startJobRecommendationTask = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IJobRecommendationCronTaskStartedApiResponse>(
      req,
      res,
      next,
      async () => {
        const { data } =
          createIApiRequest<IJobRecommendationCronStartTaskApiRequest>(req);
        return await this.jobRecommendationCronService.startJobRecommendationTask(
          data.batchSize
        );
      }
    );
  };

  /**
   * Get a job recommendation task by ID
   */
  getTask = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IJobRecommendationCronTaskGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const taskId = req.params.taskId;
        return await this.jobRecommendationCronService.getTask(taskId);
      }
    );
  };

  /**
   * Get all job recommendation tasks
   */
  getAllTasks = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IJobRecommendationCronTaskListApiResponse>(
      req,
      res,
      next,
      async () => {
        // Extract filter parameters and pagination
        const listTasksRequest =
          createIApiRequest<IJobRecommendationCronTaskListApiRequest>(req);

        // Call service method with domain models
        return await this.jobRecommendationCronService.getAllTasks(
          listTasksRequest.filters,
          listTasksRequest.pagination
        );
      }
    );
  };

  /**
   * Find initial recommendations for a job
   */
  findInitialRecommendations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IJobRecommendationCronFindRecommendationsApiResponse>(
      req,
      res,
      next,
      async () => {
        const { data } =
          createIApiRequest<IJobRecommendationCronFindRecommendationsApiRequest>(
            req
          );
        await this.jobRecommendationCronService.findInitialRecommendations(
          data.jobPostingId,
          data.limit
        );
        return {
          recommendationsFound: 0, // Count is logged by service, not returned
          message: `Initial recommendations process completed for job posting`,
        };
      }
    );
  };

  /**
   * Find new recommendations for a job (based on sync timestamp)
   */
  findRecommendations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IJobRecommendationCronFindRecommendationsApiResponse>(
      req,
      res,
      next,
      async () => {
        const { data } =
          createIApiRequest<IJobRecommendationCronFindRecommendationsApiRequest>(
            req
          );
        await this.jobRecommendationCronService.findRecommendations(
          data.jobPostingId,
          data.limit
        );
        return {
          recommendationsFound: 0, // Count is logged by service, not returned
          message: `New recommendations process completed for job posting`,
        };
      }
    );
  };
}
