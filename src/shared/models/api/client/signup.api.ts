import {
  IClientSignup,
  IClientSignupDone,
} from '../../domain/client/signup.domain';
import { IApiRequest, IApiResponse } from '../common/common.api';

export type IClientSignupApiRequest = IApiRequest<IClientSignup>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientSignupApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientSignupDone'
 */
export type IClientSignupApiResponse = IApiResponse<IClientSignupDone>;
