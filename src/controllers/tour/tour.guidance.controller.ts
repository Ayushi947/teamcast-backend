import { Request, Response, NextFunction } from 'express';
import { TourGuidanceService } from '../../services/tour/tour.guidance.service';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '../../utils/api.request';
import { AppError } from '../../utils/app.error';
import { ErrorCode } from '../../utils/error.codes';
import {
  IGetUserToursApiResponse,
  IStartTourApiRequest,
  IStartTourApiResponse,
  IGetTourStepApiRequest,
  IGetTourStepApiResponse,
  IUpdateTourProgressApiRequest,
  IUpdateTourProgressApiResponse,
  IPauseTourApiRequest,
  IPauseTourApiResponse,
  IResumeTourApiRequest,
  IResumeTourApiResponse,
  ICompleteTourApiRequest,
  ICompleteTourApiResponse,
  IDismissTourApiRequest,
  IDismissTourApiResponse,
  ISkipTourApiResponse,
  IResetTourApiRequest,
  IResetTourApiResponse,
  IGetTourAnalyticsApiRequest,
  IGetTourAnalyticsApiResponse,
  IGetTourStatusApiResponse,
} from '../../shared/models/api/tour/tour.guidance.api';

export class TourGuidanceController extends BaseController {
  constructor(private readonly tourGuidanceService: TourGuidanceService) {
    super();
  }

  /**
   * Get available tours for the current user
   */
  getUserTours = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IGetUserToursApiResponse>(req, res, next, async () => {
      const userId = req.user.id;
      const userType = req.user.type;
      const userRole = req.user.role;

      return await this.tourGuidanceService.getUserTours(
        userId,
        userType,
        userRole
      );
    });
  };

  /**
   * Start a tour for the current user
   */
  startTour = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IStartTourApiResponse>(req, res, next, async () => {
      const userId = req.user.id;
      const startTourRequest = createIApiRequest<IStartTourApiRequest>(req);

      return await this.tourGuidanceService.startTour(
        userId,
        startTourRequest.data.tourKey,
        startTourRequest.data.customSettings,
        startTourRequest.data.currentPage
      );
    });
  };

  /**
   * Get tour progress by key
   */
  getTourProgressByKey = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<any>(req, res, next, async () => {
      const userId = req.user.id;
      const tourKey = req.params.tourKey;

      const progress = await this.tourGuidanceService.getTourProgressByKey(
        userId,
        tourKey
      );

      if (!progress) {
        throw new AppError('Tour progress not found', 404, ErrorCode.NOT_FOUND);
      }

      return progress;
    });
  };

  /**
   * Get tour status by key
   */
  getTourStatusByKey = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IGetTourStatusApiResponse>(req, res, next, async () => {
      const userId = req.user.id;
      const tourKey = req.params.tourKey;

      return await this.tourGuidanceService.getTourStatusByKey(userId, tourKey);
    });
  };

  /**
   * Get tour definition by key
   */
  getTourDefinition = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<any>(req, res, next, async () => {
      const tourKey = req.params.tourKey;

      const definition =
        await this.tourGuidanceService.getTourDefinition(tourKey);

      if (!definition) {
        throw new AppError(
          'Tour definition not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      return definition;
    });
  };

  /**
   * Get current tour step
   */
  getTourStep = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IGetTourStepApiResponse>(req, res, next, async () => {
      const userId = req.user.id;
      const tourStepRequest = createIApiRequest<IGetTourStepApiRequest>(req);

      return await this.tourGuidanceService.getTourStep(
        userId,
        tourStepRequest.params.tourId
      );
    });
  };

  /**
   * Update tour progress
   */
  updateTourProgress = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IUpdateTourProgressApiResponse>(
      req,
      res,
      next,
      async () => {
        const userId = req.user.id;
        const progressRequest =
          createIApiRequest<IUpdateTourProgressApiRequest>(req);

        return await this.tourGuidanceService.updateTourProgress(
          userId,
          progressRequest.data
        );
      }
    );
  };

  /**
   * Pause a tour
   */
  pauseTour = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPauseTourApiResponse>(req, res, next, async () => {
      const userId = req.user.id;
      const pauseRequest = createIApiRequest<IPauseTourApiRequest>(req);

      return await this.tourGuidanceService.pauseTour(
        userId,
        pauseRequest.params.tourId
      );
    });
  };

  /**
   * Resume a tour
   */
  resumeTour = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IResumeTourApiResponse>(req, res, next, async () => {
      const userId = req.user.id;
      const resumeRequest = createIApiRequest<IResumeTourApiRequest>(req);

      return await this.tourGuidanceService.resumeTour(
        userId,
        resumeRequest.params.tourId
      );
    });
  };

  /**
   * Complete a tour
   */
  completeTour = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICompleteTourApiResponse>(req, res, next, async () => {
      const userId = req.user.id;
      const completeRequest = createIApiRequest<ICompleteTourApiRequest>(req);

      return await this.tourGuidanceService.completeTour(
        userId,
        completeRequest.params.tourId
      );
    });
  };

  /**
   * Dismiss a tour
   */
  dismissTour = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IDismissTourApiResponse>(req, res, next, async () => {
      const userId = req.user.id;
      const dismissRequest = createIApiRequest<IDismissTourApiRequest>(req);

      return await this.tourGuidanceService.dismissTour(
        userId,
        dismissRequest.params.tourId
      );
    });
  };

  /**
   * Skip the entire tour
   */
  skipTour = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISkipTourApiResponse>(req, res, next, async () => {
      const userId = req.user.id;
      const tourId = req.params.tourId;
      const stepId = req.query.stepId as string | undefined;

      return await this.tourGuidanceService.skipTour(userId, tourId, stepId);
    });
  };

  /**
   * Reset a tour
   */
  resetTour = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IResetTourApiResponse>(req, res, next, async () => {
      const userId = req.user.id;
      const resetRequest = createIApiRequest<IResetTourApiRequest>(req);

      return await this.tourGuidanceService.resetTour(
        userId,
        resetRequest.params.tourId
      );
    });
  };

  /**
   * Get tour analytics (Admin only)
   */
  getTourAnalytics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IGetTourAnalyticsApiResponse>(
      req,
      res,
      next,
      async () => {
        const analyticsRequest =
          createIApiRequest<IGetTourAnalyticsApiRequest>(req);

        return await this.tourGuidanceService.getTourAnalytics(
          analyticsRequest.filters,
          analyticsRequest.pagination
        );
      }
    );
  };
}
