import {
  IRefreshedToken,
  IRefreshToken,
} from '../../domain/auth/refresh.token.domain';
import { IApiRequest, IApiResponse } from '../common/common.api';

export type IRefreshTokenApiRequest = IApiRequest<IRefreshToken>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IRefreshTokenApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IRefreshedToken'
 */
export type IRefreshTokenApiResponse = IApiResponse<IRefreshedToken>;
