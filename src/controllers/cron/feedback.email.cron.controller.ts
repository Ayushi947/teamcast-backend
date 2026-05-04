import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import {
  IFeedbackEmailCronTaskGetApiResponse,
  IFeedbackEmailCronTaskListApiResponse,
  IFeedbackEmailCronTaskStartedApiResponse,
  IFeedbackEmailCronTaskListApiRequest,
  IFeedbackEmailCronStartTaskApiRequest,
} from '@/shared/models/api/cron/feedback.email.cron.api';
import { singleton } from '@/shared/decorators/singleton';
import { FeedbackEmailCronService } from '@/services/cron/feedback.email.cron.service';
import { FeedbackEmailTaskType } from '@/shared/models/domain/cron/feedback.email.cron.domain';

@singleton
export class FeedbackEmailCronController extends BaseController {
  constructor(
    private readonly feedbackEmailCronService: FeedbackEmailCronService
  ) {
    super();
  }

  /**
   * Start a new feedback email task
   */
  startFeedbackEmailTask = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IFeedbackEmailCronTaskStartedApiResponse>(
      req,
      res,
      next,
      async () => {
        const { data } =
          createIApiRequest<IFeedbackEmailCronStartTaskApiRequest>(req);
        return await this.feedbackEmailCronService.startFeedbackEmailTask(
          data.type
        );
      }
    );
  };

  /**
   * Get a feedback email task by ID
   */
  getTask = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IFeedbackEmailCronTaskGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const taskId = req.params.taskId;
        return await this.feedbackEmailCronService.getTask(taskId);
      }
    );
  };

  /**
   * Get all feedback email tasks
   */
  getAllTasks = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IFeedbackEmailCronTaskListApiResponse>(
      req,
      res,
      next,
      async () => {
        // Extract filter parameters and pagination
        const listTasksRequest =
          createIApiRequest<IFeedbackEmailCronTaskListApiRequest>(req);

        // Call service method with domain models
        return await this.feedbackEmailCronService.getAllTasks(
          listTasksRequest.filters,
          listTasksRequest.pagination
        );
      }
    );
  };

  /**
   * Update panel assessment statuses based on timing
   */
  updatePanelAssessmentStatuses = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IFeedbackEmailCronTaskStartedApiResponse>(
      req,
      res,
      next,
      async () => {
        // Create a task for panel assessment status updates
        const task = await this.feedbackEmailCronService.startFeedbackEmailTask(
          FeedbackEmailTaskType.PANEL_ASSESSMENT_STATUS_UPDATE
        );

        return {
          success: true,
          message: 'Panel assessment status update task started successfully',
          data: task,
        };
      }
    );
  };
}
