import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/utils/api.response';

export abstract class BaseController {
  protected async handleRequest<T>(
    _req: Request,
    res: Response,
    next: NextFunction,
    action: () => Promise<any>
  ): Promise<void> {
    try {
      const result = await action();
      ApiResponse.success<T>(res, result);
    } catch (error) {
      next(error);
    }
  }
}
