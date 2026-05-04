import { ILogin, ILoggedIn } from '../../domain/auth/login.domain';
import { IApiRequest, IApiResponse } from '../common/common.api';

export type ILoginApiRequest = IApiRequest<ILogin>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ILoginApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ILoggedIn'
 */
export type ILoginApiResponse = IApiResponse<ILoggedIn>;
