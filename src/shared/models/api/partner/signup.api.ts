import {
  IPartnerSignup,
  IPartnerSignupDone,
} from '../../domain/partner/signup.domain';
import { IApiRequest, IApiResponse } from '../common/common.api';

export type IPartnerSignupApiRequest = IApiRequest<IPartnerSignup>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerSignupApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerSignupDone'
 */
export type IPartnerSignupApiResponse = IApiResponse<IPartnerSignupDone>;
