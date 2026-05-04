import {
  IApiRequest,
  IApiResponse,
  IPaginatedResponse,
  IApiPaginatedRequest,
} from '../common/common.api';
import {
  IClientSubscription,
  IClientSubscriptionPackage,
  IClientSubscriptionUpdate,
  IClientSubscriptionCancel,
  IClientAddPaymentMethodRequest,
  IClientPaymentMethodParams,
  IClientSetDefaultPaymentMethodRequest,
  IClientSubscriptionPackageFilterQuery,
  IClientSubscriptionUpgradeInfo,
  IClientSubscriptionOverview,
} from '../../domain/client/subscription.domain';
import { IPaymentMethod } from '../../domain/common/subscription.domain';

/**
 * API request/response for getting current subscription
 */
export type IClientSubscriptionGetApiRequest = IApiRequest<void>;

/**
 * Swagger response for getting current subscription
 *
 * @openapi
 * components:
 *   schemas:
 *     IClientSubscriptionGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientSubscription'
 */
export type IClientSubscriptionGetApiResponse =
  IApiResponse<IClientSubscription>;

export type IClientSubscriptionUpdateApiRequest =
  IApiRequest<IClientSubscriptionUpdate>;

/**
 * API request/response for updating subscription
 * @openapi
 * components:
 *   schemas:
 *     IClientSubscriptionUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientSubscription'
 */
export type IClientSubscriptionUpdateApiResponse =
  IApiResponse<IClientSubscription>;

/**
 * API request/response for cancelling subscription
 */
export type IClientSubscriptionCancelApiRequest =
  IApiRequest<IClientSubscriptionCancel>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientSubscriptionCancelApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientSubscription'
 */
export type IClientSubscriptionCancelApiResponse =
  IApiResponse<IClientSubscription>;

/**
 * API request/response for getting available subscription packages
 */
export type IClientSubscriptionPackagesApiRequest = IApiPaginatedRequest<
  void,
  IClientSubscriptionPackageFilterQuery
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientSubscriptionPackagesApiResponse:
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
 *                     $ref: '#/components/schemas/IClientSubscriptionPackage'
 */
export type IClientSubscriptionPackagesApiResponse = IApiResponse<
  IPaginatedResponse<IClientSubscriptionPackage>
>;

/**
 * API request/response for getting client payment methods
 */
export type IClientPaymentMethodsApiRequest = IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientPaymentMethodsApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IPaymentMethod'
 *
 */
export type IClientPaymentMethodsApiResponse = IApiResponse<IPaymentMethod[]>;

export type IClientAddPaymentMethodApiRequest =
  IApiRequest<IClientAddPaymentMethodRequest>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientAddPaymentMethodApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IPaymentMethod'
 *
 */
export type IClientAddPaymentMethodApiResponse = IApiResponse<IPaymentMethod[]>;

export type IClientRemovePaymentMethodApiRequest = IApiRequest<
  void,
  void,
  IClientPaymentMethodParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientRemovePaymentMethodApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IPaymentMethod'
 *
 */
export type IClientRemovePaymentMethodApiResponse = IApiResponse<
  IPaymentMethod[]
>;

export type IClientSetDefaultPaymentMethodApiRequest =
  IApiRequest<IClientSetDefaultPaymentMethodRequest>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientSetDefaultPaymentMethodApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IPaymentMethod'
 *
 */

export type IClientSetDefaultPaymentMethodApiResponse = IApiResponse<
  IPaymentMethod[]
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IStripeSubscriptionStatusSyncResponse:
 *       type: object
 *       properties:
 *         subscriptionId:
 *           type: string
 *         status:
 *           type: string
 *         lastBillingDate:
 *           type: string
 *           format: date-time
 *         nextBillingDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 */
export interface IStripeSubscriptionStatusSyncResponse {
  subscriptionId: string;
  status: string;
  lastBillingDate: string;
  nextBillingDate: string | null;
}

/**
 * API request/response for subscription upgrade info
 */
export type IClientSubscriptionUpgradeInfoApiRequest = IApiRequest<void>;
export type IClientSubscriptionUpgradeInfoApiResponse =
  IApiResponse<IClientSubscriptionUpgradeInfo>;

/**
 * API request/response for logging a candidate view
 * @openapi
 * components:
 *   schemas:
 *     IClientLogCandidateViewApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               required:
 *                 - candidateId
 *               properties:
 *                 candidateId:
 *                   type: string
 *                   format: uuid
 *                   description: Candidate ID being viewed
 *                 jobPostingId:
 *                   type: string
 *                   format: uuid
 *                   description: (Optional) Job posting context
 *                 viewContext:
 *                   type: string
 *                   description: (Optional) Additional context
 *     IClientLogCandidateViewApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Result message
 *                 alreadyViewed:
 *                   type: boolean
 *                   description: Whether the candidate was already viewed by this user
 */
export type IClientLogCandidateViewApiRequest = IApiRequest<{
  candidateId: string;
  jobPostingId?: string;
  viewContext?: string;
}>;

/**
 * API request/response for candidate views
 */
export type IClientLogCandidateViewApiResponse = IApiResponse<{
  message: string;
  alreadyViewed: boolean;
}>;

/**
 * API request/response for getting current subscription overview
 */
export type IClientSubscriptionOverviewApiRequest = IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientSubscriptionOverviewApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientSubscriptionOverview'
 */
export type IClientSubscriptionOverviewApiResponse =
  IApiResponse<IClientSubscriptionOverview>;
