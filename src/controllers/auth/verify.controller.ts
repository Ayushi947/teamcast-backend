import { Request, Response, NextFunction } from 'express';
import { BaseController } from '@/controllers/common/base.controller';
import {
  ISendOtpVerificationApiRequest,
  ISendOtpVerificationApiResponse,
} from '@/shared/models/api/auth/otp.verification.api';
import {
  IVerifyOtpApiRequest,
  IVerifyOtpApiResponse,
} from '@/shared/models/api/auth/otp.verification.api';
import { singleton } from '@/shared/decorators/singleton';
import { VerifyService } from '@/services/auth/verify.service';
import { createIApiRequest } from '@/utils/api.request';

@singleton
export class VerifyController extends BaseController {
  constructor(private verifyService: VerifyService) {
    super();
  }

  sendOtpVerification = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    this.handleRequest<ISendOtpVerificationApiResponse>(
      req,
      res,
      next,
      async () => {
        const sendOtpVerificationRequest =
          createIApiRequest<ISendOtpVerificationApiRequest>(req);
        return await this.verifyService.sendOtpVerification(
          sendOtpVerificationRequest.data
        );
      }
    );
  };

  verifyOtp = (req: Request, res: Response, next: NextFunction): void => {
    this.handleRequest<IVerifyOtpApiResponse>(req, res, next, async () => {
      const verifyOtpRequest = createIApiRequest<IVerifyOtpApiRequest>(req);
      return await this.verifyService.verifyOtp(verifyOtpRequest.data);
    });
  };
}
