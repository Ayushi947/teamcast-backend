import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/services/auth/auth.service';
import { BaseController } from '@/controllers/common/base.controller';
import { AppError } from '@/utils/app.error';

import {
  ILoginApiRequest,
  ILoginApiResponse,
} from '@/shared/models/api/auth/login.api';
import {
  ISendResetPasswordTokenApiRequest,
  ISendResetPasswordTokenApiResponse,
  IResetPasswordApiRequest,
  IResetPasswordApiResponse,
} from '@/shared/models/api/auth/reset.password.api';
import {
  IRefreshTokenApiRequest,
  IRefreshTokenApiResponse,
} from '@/shared/models/api/auth/refresh.token.api';
import { ILogoutApiResponse } from '@/shared/models/api/auth/logout.api';
import { createIApiRequest } from '@/utils/api.request';
import { IMeResponse } from '@/shared/models/api/auth/me.api';
import { singleton } from '@/shared/decorators/singleton';
import {
  ISetNewPasswordApiRequest,
  ISetNewPasswordApiResponse,
  ISetPasswordByEmailApiRequest,
  ISetPasswordByEmailApiResponse,
} from '@/shared/models/api/auth/reset.password.api';

@singleton
export class AuthController extends BaseController {
  constructor(private authService: AuthService) {
    super();
  }

  login = (req: Request, res: Response, next: NextFunction): void => {
    this.handleRequest<ILoginApiResponse>(req, res, next, async () => {
      const loginRequest = createIApiRequest<ILoginApiRequest>(req);
      return await this.authService.login(loginRequest.data);
    });
  };

  logout = (req: Request, res: Response, next: NextFunction): void => {
    this.handleRequest<ILogoutApiResponse>(req, res, next, async () => {
      if (!req.user?.id) {
        throw new AppError('Unauthorized', 401);
      }
      return await this.authService.logout(req.user.id);
    });
  };

  refresh = (req: Request, res: Response, next: NextFunction): void => {
    this.handleRequest<IRefreshTokenApiResponse>(req, res, next, async () => {
      const refreshTokenRequest =
        createIApiRequest<IRefreshTokenApiRequest>(req);
      return await this.authService.refresh(refreshTokenRequest.data);
    });
  };

  sendResetPasswordToken = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    this.handleRequest<ISendResetPasswordTokenApiResponse>(
      req,
      res,
      next,
      async () => {
        const resetPasswordTokenRequest =
          createIApiRequest<ISendResetPasswordTokenApiRequest>(req);
        return await this.authService.sendResetPasswordToken(
          resetPasswordTokenRequest.data
        );
      }
    );
  };

  resetPassword = (req: Request, res: Response, next: NextFunction): void => {
    this.handleRequest<IResetPasswordApiResponse>(req, res, next, async () => {
      const resetPasswordRequest =
        createIApiRequest<IResetPasswordApiRequest>(req);
      return await this.authService.resetPassword(
        resetPasswordRequest.params.token,
        resetPasswordRequest.data.password
      );
    });
  };

  setNewPassword = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user?.id) {
      throw new AppError('Unauthorized', 401);
    }
    this.handleRequest<ISetNewPasswordApiResponse>(req, res, next, async () => {
      const setNewPasswordRequest =
        createIApiRequest<ISetNewPasswordApiRequest>(req);
      return await this.authService.setNewPassword(
        req.user.id,
        setNewPasswordRequest.data.password
      );
    });
  };

  setPasswordByEmail = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    this.handleRequest<ISetPasswordByEmailApiResponse>(
      req,
      res,
      next,
      async () => {
        const setPasswordByEmailRequest =
          createIApiRequest<ISetPasswordByEmailApiRequest>(req);
        return await this.authService.setPasswordByEmail(
          setPasswordByEmailRequest.data
        );
      }
    );
  };

  me = (req: Request, res: Response, next: NextFunction): void => {
    this.handleRequest<IMeResponse>(req, res, next, async () => {
      const user = await this.authService.me(req.user.id);
      return { user };
    });
  };
}
