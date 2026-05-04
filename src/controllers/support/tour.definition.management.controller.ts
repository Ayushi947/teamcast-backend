import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../common/base.controller';
import { TourDefinitionManagementService } from '../../services/support/tour.definition.management.service';
import {
  ICreateTourDefinitionApiResponse,
  IUpdateTourDefinitionApiResponse,
  IGetTourDefinitionApiResponse,
  IGetAllTourDefinitionsApiResponse,
  IGetTourGroupsApiResponse,
  IToggleTourDefinitionStatusApiResponse,
  IGetTourDefinitionsFilters,
  ITourDefinitionExtended,
} from '../../shared/models/api/support/tour.definition.management.api';
import { IPaginationRequest } from '../../shared/models/api/common/common.api';

export class TourDefinitionManagementController extends BaseController {
  constructor(
    private readonly tourDefinitionManagementService: TourDefinitionManagementService
  ) {
    super();
  }

  /**
   * Get all tour definitions with pagination and filters
   */
  getAllTourDefinitions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IGetAllTourDefinitionsApiResponse>(
      req,
      res,
      next,
      async () => {
        const pagination: IPaginationRequest = {
          page: parseInt(req.query.page as string) || 1,
          limit: parseInt(req.query.limit as string) || 10,
        };

        const filters: IGetTourDefinitionsFilters = {
          userType: req.query.userType as string | undefined,
          userRole: req.query.userRole as string | undefined,
          isActive:
            req.query.isActive !== undefined
              ? req.query.isActive === 'true'
              : undefined,
          tourGroup: req.query.tourGroup as string | undefined,
          search: req.query.search as string | undefined,
        };

        return await this.tourDefinitionManagementService.getAllTourDefinitions(
          pagination,
          filters
        );
      }
    );
  };

  /**
   * Get a single tour definition by ID
   */
  getTourDefinitionById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IGetTourDefinitionApiResponse>(
      req,
      res,
      next,
      async () => {
        const { tourId } = req.params;
        return await this.tourDefinitionManagementService.getTourDefinitionById(
          tourId
        );
      }
    );
  };

  /**
   * Get a single tour definition by tour key
   */
  getTourDefinitionByKey = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IGetTourDefinitionApiResponse>(
      req,
      res,
      next,
      async () => {
        const { tourKey } = req.params;
        return await this.tourDefinitionManagementService.getTourDefinitionByKey(
          tourKey
        );
      }
    );
  };

  /**
   * Create a new tour definition
   */
  createTourDefinition = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICreateTourDefinitionApiResponse>(
      req,
      res,
      next,
      async () => {
        const requestBody = req.body as {
          data: Omit<ITourDefinitionExtended, 'id' | 'createdAt' | 'updatedAt'>;
        };
        const userId = req.user?.id;

        return await this.tourDefinitionManagementService.createTourDefinition(
          requestBody.data,
          userId
        );
      }
    );
  };

  /**
   * Update an existing tour definition
   */
  updateTourDefinition = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IUpdateTourDefinitionApiResponse>(
      req,
      res,
      next,
      async () => {
        const { tourId } = req.params;
        const requestBody = req.body as {
          data: Partial<
            Omit<
              ITourDefinitionExtended,
              'id' | 'tourKey' | 'createdAt' | 'updatedAt'
            >
          >;
        };
        const userId = req.user?.id;

        return await this.tourDefinitionManagementService.updateTourDefinition(
          tourId,
          requestBody.data,
          userId
        );
      }
    );
  };

  /**
   * Delete a tour definition
   */
  deleteTourDefinition = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<void>(req, res, next, async () => {
      const { tourId } = req.params;
      await this.tourDefinitionManagementService.deleteTourDefinition(tourId);
      return { success: true, message: 'Tour definition deleted successfully' };
    });
  };

  /**
   * Toggle tour definition active status
   */
  toggleTourDefinitionStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IToggleTourDefinitionStatusApiResponse>(
      req,
      res,
      next,
      async () => {
        const { tourId } = req.params;
        return await this.tourDefinitionManagementService.toggleTourDefinitionStatus(
          tourId
        );
      }
    );
  };

  /**
   * Get all unique tour groups
   */
  getTourGroups = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IGetTourGroupsApiResponse>(req, res, next, async () => {
      const groups = await this.tourDefinitionManagementService.getTourGroups();
      return { groups };
    });
  };
}
