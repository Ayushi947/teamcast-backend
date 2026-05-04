import { Request, Response, NextFunction } from 'express';
import { LookupService } from '@/services/support/lookup.service';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import {
  ILookupCategoryCreateApiRequest,
  ILookupCategoryCreateApiResponse,
  ILookupCategoryListApiResponse,
  ILookupCategoryGetByIdApiRequest,
  ILookupCategoryGetByIdApiResponse,
  ILookupCategoryDeleteApiRequest,
  ILookupCategoryDeleteApiResponse,
  ILookupValueCreateApiRequest,
  ILookupValueCreateApiResponse,
  ILookupValueDeleteApiRequest,
  ILookupValueDeleteApiResponse,
} from '@/shared/models/api/support/lookup.api';
import { singleton } from '@/shared/decorators/singleton';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';

@singleton
export class LookupController extends BaseController {
  constructor(private readonly lookupService: LookupService) {
    super();
  }

  createLookupCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ILookupCategoryCreateApiResponse>(
      req,
      res,
      next,
      async () => {
        const userRole = req.user?.role as UserRoleEnum;
        const userType = req.user?.type as UserTypeEnum;

        if (!userRole || !userType) {
          throw new AppError(
            'User role or type not found',
            403,
            ErrorCode.FORBIDDEN
          );
        }

        const apiRequest =
          createIApiRequest<ILookupCategoryCreateApiRequest>(req);
        const category = await this.lookupService.createLookupCategory(
          apiRequest.data,
          userRole,
          userType
        );
        return category;
      }
    );
  };

  getLookupCategories = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ILookupCategoryListApiResponse>(
      req,
      res,
      next,
      async () => {
        const userRole = req.user?.role as UserRoleEnum;
        const userType = req.user?.type as UserTypeEnum;

        if (!userRole || !userType) {
          throw new AppError(
            'User role or type not found',
            403,
            ErrorCode.FORBIDDEN
          );
        }

        return await this.lookupService.getLookupCategories(userRole, userType);
      }
    );
  };

  getLookupCategoryById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ILookupCategoryGetByIdApiResponse>(
      req,
      res,
      next,
      async () => {
        const userRole = req.user?.role as UserRoleEnum;
        const userType = req.user?.type as UserTypeEnum;

        if (!userRole || !userType) {
          throw new AppError(
            'User role or type not found',
            403,
            ErrorCode.FORBIDDEN
          );
        }

        const apiRequest =
          createIApiRequest<ILookupCategoryGetByIdApiRequest>(req);
        const category = await this.lookupService.getLookupCategoryById(
          apiRequest.params.id,
          userRole,
          userType
        );
        return category;
      }
    );
  };

  deleteLookupCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ILookupCategoryDeleteApiResponse>(
      req,
      res,
      next,
      async () => {
        const userRole = req.user?.role as UserRoleEnum;
        const userType = req.user?.type as UserTypeEnum;

        if (!userRole || !userType) {
          throw new AppError(
            'User role or type not found',
            403,
            ErrorCode.FORBIDDEN
          );
        }

        const apiRequest =
          createIApiRequest<ILookupCategoryDeleteApiRequest>(req);
        await this.lookupService.deleteLookupCategory(
          apiRequest.params.id,
          userRole,
          userType
        );
        return undefined;
      }
    );
  };

  createLookupValue = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ILookupValueCreateApiResponse>(
      req,
      res,
      next,
      async () => {
        const userRole = req.user?.role as UserRoleEnum;
        const userType = req.user?.type as UserTypeEnum;

        if (!userRole || !userType) {
          throw new AppError(
            'User role or type not found',
            403,
            ErrorCode.FORBIDDEN
          );
        }

        const apiRequest = createIApiRequest<ILookupValueCreateApiRequest>(req);
        const value = await this.lookupService.createLookupValue(
          apiRequest.data,
          userRole,
          userType
        );
        return value;
      }
    );
  };

  deleteLookupValue = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ILookupValueDeleteApiResponse>(
      req,
      res,
      next,
      async () => {
        const userRole = req.user?.role as UserRoleEnum;
        const userType = req.user?.type as UserTypeEnum;

        if (!userRole || !userType) {
          throw new AppError(
            'User role or type not found',
            403,
            ErrorCode.FORBIDDEN
          );
        }

        const apiRequest = createIApiRequest<ILookupValueDeleteApiRequest>(req);
        await this.lookupService.deleteLookupValue(
          apiRequest.params.id,
          userRole,
          userType
        );
        return undefined;
      }
    );
  };

  getLookupValuesByCategories = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ILookupCategoryListApiResponse>(
      req,
      res,
      next,
      async () => {
        const userRole = req.user?.role as UserRoleEnum;
        const userType = req.user?.type as UserTypeEnum;

        if (!userRole || !userType) {
          throw new AppError(
            'User role or type not found',
            403,
            ErrorCode.FORBIDDEN
          );
        }

        const categories = req.query.categories as string;
        if (!categories) {
          throw new AppError(
            'Categories parameter is required',
            400,
            ErrorCode.VALIDATION_ERROR
          );
        }

        const categoryNames = categories
          .split(',')
          .map((name) => name.trim().toLowerCase());
        return await this.lookupService.getLookupValuesByCategories(
          categoryNames,
          userRole,
          userType
        );
      }
    );
  };

  getCountries = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      return await this.lookupService.getCountries();
    });
  };

  getTimezonesByCountry = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const country = (req.query.country as string)?.toUpperCase();
      return await this.lookupService.getTimezonesByCountry(country);
    });
  };
}
