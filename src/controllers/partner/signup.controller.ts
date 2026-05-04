import { Request, Response, NextFunction } from 'express';
import { PartnerSignupService } from '@/services/partner/signup.service';
import { singleton } from '@/shared/decorators/singleton';
import {
  IPartnerSignupApiRequest,
  IPartnerSignupApiResponse,
} from '@/shared/models/api/partner/signup.api';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';

@singleton
export class PartnerSignupController extends BaseController {
  constructor(private partnerSignupService: PartnerSignupService) {
    super();
  }

  signup = (req: Request, res: Response, next: NextFunction): void => {
    this.handleRequest<IPartnerSignupApiResponse>(req, res, next, async () => {
      const request = createIApiRequest<IPartnerSignupApiRequest>(req);
      return await this.partnerSignupService.signup(request.data);
    });
  };
}
