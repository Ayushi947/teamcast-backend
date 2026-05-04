import { Request, Response, NextFunction } from 'express';
import { ClientSignupService } from '@/services/client/signup.service';
import { singleton } from '@/shared/decorators/singleton';
import {
  IClientSignupApiRequest,
  IClientSignupApiResponse,
} from '@/shared/models/api/client/signup.api';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
@singleton
export class ClientSignupController extends BaseController {
  constructor(private clientSignupService: ClientSignupService) {
    super();
  }

  signup = (req: Request, res: Response, next: NextFunction): void => {
    this.handleRequest<IClientSignupApiResponse>(req, res, next, async () => {
      const request = createIApiRequest<IClientSignupApiRequest>(req);

      return await this.clientSignupService.signup(request.data);
    });
  };
}
