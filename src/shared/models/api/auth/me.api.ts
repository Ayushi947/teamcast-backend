import { IApiResponse } from '../common/common.api';
import { IUser } from '../../domain/user/user.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     IMeResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IUser'
 */
export type IMeResponse = IApiResponse<IUser>;
