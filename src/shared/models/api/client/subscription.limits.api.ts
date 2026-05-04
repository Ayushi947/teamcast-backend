import { IApiResponse } from '../common/common.api';
import {
  ISubscriptionUsageSummary,
  ISubscriptionLimitCheck,
  ISubscriptionLimitCheckView,
  ISubscriptionLimitCheckAdd,
} from '../../domain/client/subscription.limits.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     ISubscriptionUsageSummaryApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISubscriptionUsageSummary'
 */
export type ISubscriptionUsageSummaryApiResponse =
  IApiResponse<ISubscriptionUsageSummary>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISubscriptionLimitCheckApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISubscriptionLimitCheck'
 */
export type ISubscriptionLimitCheckApiResponse =
  IApiResponse<ISubscriptionLimitCheck>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISubscriptionLimitCheckViewApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISubscriptionLimitCheckView'
 */
export type ISubscriptionLimitCheckViewApiResponse =
  IApiResponse<ISubscriptionLimitCheckView>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISubscriptionLimitCheckAddApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISubscriptionLimitCheckAdd'
 */
export type ISubscriptionLimitCheckAddApiResponse =
  IApiResponse<ISubscriptionLimitCheckAdd>;
