import {
  IActivityLog,
  IActivityLogCreate,
  IActivityLogFilters,
  IActivityLogCreated,
} from '../../domain/activity/activity.log.domain';
import { IApiRequest, IApiResponse } from '../common/common.api';

export type IActivityLogCreateApiRequest = IApiRequest<IActivityLogCreate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IActivityLogCreateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IActivityLogCreated'
 */
export type IActivityLogCreateApiResponse = IApiResponse<IActivityLogCreated>;

export interface IActivityLogGetApiRequestQuery extends IActivityLogFilters {
  page?: number;
  limit?: number;
}

export type IActivityLogGetApiRequest = IApiRequest<
  never,
  never,
  IActivityLogGetApiRequestQuery
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IActivityLogGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IActivityLog'
 *             meta:
 *               type: object
 *               properties:
 *                 total:
 *                   type: number
 *                   description: Total number of activity logs
 *                 page:
 *                   type: number
 *                   description: Current page number
 *                 limit:
 *                   type: number
 *                   description: Number of items per page
 *                 totalPages:
 *                   type: number
 *                   description: Total number of pages
 */
export interface IActivityLogGetApiResponse
  extends IApiResponse<IActivityLog[]> {
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
