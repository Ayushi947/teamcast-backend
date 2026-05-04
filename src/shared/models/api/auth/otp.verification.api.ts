import { IApiRequest, IApiResponse } from '../common/common.api';
import {
  ISendOtpVerification,
  IVerifyOtp,
  ISendOtpVerificationSent,
  IOtpVerified,
} from '../../domain/auth/otp.verification.domain';

export type ISendOtpVerificationApiRequest = IApiRequest<ISendOtpVerification>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISendOtpVerificationApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISendOtpVerificationSent'
 */
export type ISendOtpVerificationApiResponse =
  IApiResponse<ISendOtpVerificationSent>;

export type IVerifyOtpApiRequest = IApiRequest<IVerifyOtp>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IVerifyOtpApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IOtpVerified'
 */
export type IVerifyOtpApiResponse = IApiResponse<IOtpVerified>;
