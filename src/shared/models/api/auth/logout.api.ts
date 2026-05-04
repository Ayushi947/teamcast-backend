import { IApiRequest, IApiResponse } from '../common/common.api';
import { ILoggedOut, ILogout } from '../../domain/auth/logout.domain';

export type ILogoutApiRequest = IApiRequest<ILogout>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ILogoutApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ILoggedOut'
 */
export type ILogoutApiResponse = IApiResponse<ILoggedOut>;
