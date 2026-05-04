import { Request, Response } from 'express';
import { singleton } from '@/shared/decorators/singleton';
import { LocationService } from '@/services/common/location.service';
import {
  ICountryListApiRequest,
  IStateListApiRequest,
  ICityListApiRequest,
  ILocationNamesApiRequest,
} from '@/shared/models/api/common/location.api';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';

@singleton
export class LocationController {
  private readonly locationService: LocationService;

  constructor(locationService: LocationService) {
    this.locationService = locationService;
  }

  public async getCountries(req: Request, res: Response): Promise<void> {
    try {
      const params: ICountryListApiRequest = {
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        offset: req.query.offset ? Number(req.query.offset) : undefined,
        search: req.query.search as string,
      };

      const result = await this.locationService.getCountries(params);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      logger.error({
        message: 'Failed to get countries',
        context: 'LocationController.getCountries',
        error: error instanceof Error ? error.message : 'Unknown error',
        query: req.query,
      });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          errorCode: error.code,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
          errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
        });
      }
    }
  }

  public async getStates(req: Request, res: Response): Promise<void> {
    try {
      const params: IStateListApiRequest = {
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        offset: req.query.offset ? Number(req.query.offset) : undefined,
        search: req.query.search as string,
        countryId: req.query.countryId as string,
      };

      const result = await this.locationService.getStates(params);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      logger.error({
        message: 'Failed to get states',
        context: 'LocationController.getStates',
        error: error instanceof Error ? error.message : 'Unknown error',
        query: req.query,
      });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          errorCode: error.code,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
          errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
        });
      }
    }
  }

  public async getCities(req: Request, res: Response): Promise<void> {
    try {
      const params: ICityListApiRequest = {
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        offset: req.query.offset ? Number(req.query.offset) : undefined,
        search: req.query.search as string,
        stateId: req.query.stateId as string,
        countryId: req.query.countryId as string,
      };

      const result = await this.locationService.getCities(params);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      logger.error({
        message: 'Failed to get cities',
        context: 'LocationController.getCities',
        error: error instanceof Error ? error.message : 'Unknown error',
        query: req.query,
      });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          errorCode: error.code,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
          errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
        });
      }
    }
  }

  public async getAllLocationNames(req: Request, res: Response): Promise<void> {
    try {
      const params: ILocationNamesApiRequest = {
        search: req.query.search as string,
        countryId: req.query.countryId as string,
        stateId: req.query.stateId as string,
      };

      const result = await this.locationService.getAllLocationNames(params);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      logger.error({
        message: 'Failed to get all location names',
        context: 'LocationController.getAllLocationNames',
        error: error instanceof Error ? error.message : 'Unknown error',
        query: req.query,
      });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          errorCode: error.code,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
          errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
        });
      }
    }
  }
}
