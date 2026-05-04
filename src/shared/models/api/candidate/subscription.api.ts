import {
  IApiRequest,
  IApiResponse,
  IPaginatedResponse,
  IApiPaginatedRequest,
} from '../common/common.api';
import {
  ICandidateSubscription,
  ICandidateSubscriptionPackage,
  ICandidateSubscriptionUpdate,
  ICandidateSubscriptionCancel,
  ICandidateAddPaymentMethod,
  ICandidatePaymentMethodParams,
  ICandidateSetDefaultPaymentMethod,
  ICandidateSubscriptionPackageFilterQuery,
} from '../../domain/candidate/subscription.domain';
import { IPaymentMethod } from '../../domain/common/subscription.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     IGetCurrentSubscriptionResponse:
 *       type: object
 *       properties:
 *         subscription:
 *           $ref: '#/components/schemas/ICandidateSubscription'
 */
export interface IGetCurrentSubscriptionResponse {
  subscription: ICandidateSubscription;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IGetSubscriptionPackagesResponse:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ICandidateSubscriptionPackage'
 *         pagination:
 *           $ref: '#/components/schemas/IPagination'
 */
export type IGetSubscriptionPackagesResponse =
  IPaginatedResponse<ICandidateSubscriptionPackage>;

/**
 * API request/response for getting current subscription
 */
export type ICandidateSubscriptionGetApiRequest = IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateSubscriptionGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidateSubscription'
 */
export type ICandidateSubscriptionGetApiResponse =
  IApiResponse<ICandidateSubscription>;

/**
 * API request/response for getting available subscription packages
 */
export type ICandidateSubscriptionPackagesApiRequest = IApiPaginatedRequest<
  void,
  ICandidateSubscriptionPackageFilterQuery
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateSubscriptionPackagesApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPaginatedResponse'
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ICandidateSubscriptionPackage'
 */
export type ICandidateSubscriptionPackagesApiResponse = IApiResponse<
  IPaginatedResponse<ICandidateSubscriptionPackage>
>;

/**
 * API request for updating subscription
 */
export type ICandidateSubscriptionUpdateApiRequest =
  IApiRequest<ICandidateSubscriptionUpdate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateSubscriptionUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidateSubscription'
 */
export type ICandidateSubscriptionUpdateApiResponse =
  IApiResponse<ICandidateSubscription>;

/**
 * API request for cancelling subscription
 */
export type ICandidateSubscriptionCancelApiRequest =
  IApiRequest<ICandidateSubscriptionCancel>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateSubscriptionCancelApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidateSubscription'
 */
export type ICandidateSubscriptionCancelApiResponse =
  IApiResponse<ICandidateSubscription>;

/**
 * API request/response for getting payment methods
 */
export type ICandidatePaymentMethodsApiRequest = IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidatePaymentMethodsApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IPaymentMethod'
 */
export type ICandidatePaymentMethodsApiResponse = IApiResponse<
  IPaymentMethod[]
>;

/**
 * API request for adding payment method
 */
export type ICandidateAddPaymentMethodApiRequest =
  IApiRequest<ICandidateAddPaymentMethod>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateAddPaymentMethodApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IPaymentMethod'
 */
export type ICandidateAddPaymentMethodApiResponse = IApiResponse<
  IPaymentMethod[]
>;

/**
 * API request for removing payment method
 */
export type ICandidateRemovePaymentMethodApiRequest = IApiRequest<
  void,
  void,
  ICandidatePaymentMethodParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateRemovePaymentMethodApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IPaymentMethod'
 */
export type ICandidateRemovePaymentMethodApiResponse = IApiResponse<
  IPaymentMethod[]
>;

/**
 * API request for setting default payment method
 */
export type ICandidateSetDefaultPaymentMethodApiRequest =
  IApiRequest<ICandidateSetDefaultPaymentMethod>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateSetDefaultPaymentMethodApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IPaymentMethod'
 */
export type ICandidateSetDefaultPaymentMethodApiResponse = IApiResponse<
  IPaymentMethod[]
>;
