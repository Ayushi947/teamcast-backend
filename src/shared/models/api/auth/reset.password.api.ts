import {
  ISendResetPasswordToken,
  ISendResetPasswordTokenDone,
  IResetPasswordTokenParams,
  IResetPassword,
  IResetPasswordDone,
  ISetNewPassword,
  ISetNewPasswordDone,
  ISetPasswordByEmail,
  ISetPasswordByEmailDone,
} from '../../domain/auth/reset.password.domain';
import { IApiResponse } from '../common/common.api';
import { IApiRequest } from '../common/common.api';

export type ISendResetPasswordTokenApiRequest =
  IApiRequest<ISendResetPasswordToken>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISendResetPasswordTokenApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISendResetPasswordTokenDone'
 */
export type ISendResetPasswordTokenApiResponse =
  IApiResponse<ISendResetPasswordTokenDone>;

export type IResetPasswordApiRequest = IApiRequest<
  IResetPassword,
  null,
  IResetPasswordTokenParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IResetPasswordApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IResetPasswordDone'
 */
export type IResetPasswordApiResponse = IApiResponse<IResetPasswordDone>;

export type ISetNewPasswordApiRequest = IApiRequest<ISetNewPassword>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IResetPasswordApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISetNewPasswordDone'
 */
export type ISetNewPasswordApiResponse = IApiResponse<ISetNewPasswordDone>;

export type ISetPasswordByEmailApiRequest = IApiRequest<ISetPasswordByEmail>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISetPasswordByEmailApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISetPasswordByEmailDone'
 */
export type ISetPasswordByEmailApiResponse =
  IApiResponse<ISetPasswordByEmailDone>;
