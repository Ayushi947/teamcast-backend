import { Request, Response, NextFunction } from 'express';
import { SupportApplicationService } from '@/services/support/application.service';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import {
  ISupportJobApplicationListApiRequest,
  ISupportJobApplicationListApiResponse,
  ISupportJobApplicationGetApiRequest,
  ISupportJobApplicationGetApiResponse,
  ISupportJobApplicationGetAiAssessmentApiRequest,
  ISupportJobApplicationGetAiAssessmentApiResponse,
  ISupportJobApplicationStatisticsApiRequest,
  ISupportJobApplicationStatisticsApiResponse,
} from '../../shared/models/api/support/application.api';
import { singleton } from '@/shared/decorators/singleton';

@singleton
export class SupportApplicationController extends BaseController {
  constructor(
    private readonly supportApplicationService: SupportApplicationService
  ) {
    super();
  }

  /**
   * List all accepted applications for support with optional filtering
   */
  listSupportApplications = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportJobApplicationListApiResponse>(
      req,
      res,
      next,
      async () => {
        // Extract filter parameters
        const listApplicationsRequest =
          createIApiRequest<ISupportJobApplicationListApiRequest>(req);

        // Call service method with domain models
        return await this.supportApplicationService.listSupportApplications(
          listApplicationsRequest.filters,
          listApplicationsRequest.pagination
        );
      }
    );
  };

  /**
   * Get a specific accepted application by ID
   */
  getSupportApplication = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportJobApplicationGetApiResponse>(
      req,
      res,
      next,
      async () => {
        // Get the application ID from the request parameters
        const getRequest =
          createIApiRequest<ISupportJobApplicationGetApiRequest>(req);
        const applicationId = getRequest.params.applicationId;

        // Call service method with domain model
        return await this.supportApplicationService.getSupportApplication(
          applicationId
        );
      }
    );
  };

  /**
   * Get the AI assessment for a specific accepted application
   */
  getSupportApplicationAiAssessment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportJobApplicationGetAiAssessmentApiResponse>(
      req,
      res,
      next,
      async () => {
        // Get the application ID from the request parameters
        const getRequest =
          createIApiRequest<ISupportJobApplicationGetAiAssessmentApiRequest>(
            req
          );
        const applicationId = getRequest.params.applicationId;

        // Call service method with domain model
        return await this.supportApplicationService.getSupportApplicationAiAssessment(
          applicationId
        );
      }
    );
  };

  /**
   * Get conversion statistics for support dashboard
   */
  getConversionStatistics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportJobApplicationStatisticsApiResponse>(
      req,
      res,
      next,
      async () => {
        // Get the statistics request parameters
        const statisticsRequest =
          createIApiRequest<ISupportJobApplicationStatisticsApiRequest>(req);
        const { dateFrom, dateTo } = statisticsRequest.filters;

        // Call service method to get conversion statistics
        return await this.supportApplicationService.getConversionStatistics(
          dateFrom,
          dateTo
        );
      }
    );
  };
}
