import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import {
  ICandidateRecommendationCronTaskGetApiResponse,
  ICandidateRecommendationCronTaskListApiResponse,
  ICandidateRecommendationCronTaskStartedApiResponse,
  ICandidateRecommendationCronTaskListApiRequest,
  ICandidateRecommendationCronStartTaskApiRequest,
  ICandidateRecommendationCronFindRecommendationsApiRequest,
  ICandidateRecommendationCronFindRecommendationsApiResponse,
} from '@/shared/models/api/cron/candidate.recommendation.cron.api';
import { singleton } from '@/shared/decorators/singleton';
import { CandidateRecommendationCronService } from '@/services/cron/candidate.recommendation.cron.service';

@singleton
export class CandidateRecommendationCronController extends BaseController {
  constructor(
    private readonly candidateRecommendationCronService: CandidateRecommendationCronService
  ) {
    super();
  }

  /**
   * Start a new candidate recommendation task
   */
  startCandidateRecommendationTask = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateRecommendationCronTaskStartedApiResponse>(
      req,
      res,
      next,
      async () => {
        const { data } =
          createIApiRequest<ICandidateRecommendationCronStartTaskApiRequest>(
            req
          );
        return await this.candidateRecommendationCronService.startCandidateRecommendationTask(
          data.batchSize
        );
      }
    );
  };

  /**
   * Get a candidate recommendation task by ID
   */
  getTask = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateRecommendationCronTaskGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const taskId = req.params.taskId;
        return await this.candidateRecommendationCronService.getTask(taskId);
      }
    );
  };

  /**
   * Get all candidate recommendation tasks
   */
  getAllTasks = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateRecommendationCronTaskListApiResponse>(
      req,
      res,
      next,
      async () => {
        // Extract filter parameters and pagination
        const listTasksRequest =
          createIApiRequest<ICandidateRecommendationCronTaskListApiRequest>(
            req
          );

        // Call service method with domain models
        return await this.candidateRecommendationCronService.getAllTasks(
          listTasksRequest.filters,
          listTasksRequest.pagination
        );
      }
    );
  };

  /**
   * Find initial recommendations for a candidate
   */
  findInitialRecommendations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateRecommendationCronFindRecommendationsApiResponse>(
      req,
      res,
      next,
      async () => {
        const { data } =
          createIApiRequest<ICandidateRecommendationCronFindRecommendationsApiRequest>(
            req
          );
        await this.candidateRecommendationCronService.findInitialRecommendations(
          data.candidateId,
          data.limit
        );
        return {
          recommendationsFound: 0, // Count is logged by service, not returned
          message: `Initial recommendations process completed for candidate`,
        };
      }
    );
  };

  /**
   * Find new recommendations for a candidate (based on sync timestamp)
   */
  findRecommendations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateRecommendationCronFindRecommendationsApiResponse>(
      req,
      res,
      next,
      async () => {
        const { data } =
          createIApiRequest<ICandidateRecommendationCronFindRecommendationsApiRequest>(
            req
          );
        await this.candidateRecommendationCronService.findRecommendations(
          data.candidateId,
          data.limit
        );
        return {
          recommendationsFound: 0, // Count is logged by service, not returned
          message: `New recommendations process completed for candidate`,
        };
      }
    );
  };
}
