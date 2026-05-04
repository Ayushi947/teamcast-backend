import { IApiRequest, IApiResponse } from '../common/common.api';
import {
  IStripeCustomer,
  IStripeCustomerCreate,
  IStripePrice,
  IStripePriceCreate,
  IStripeProduct,
  IStripeProductCreate,
  IStripeSubscription,
  IStripeSubscriptionCreate,
  IStripeInvoice,
  IStripeInvoiceListRequest,
} from '../../domain/common/stripe.domain';
import { IPaymentMethod } from '../../domain/common/subscription.domain';

/**
 * API request/response for creating a Stripe customer
 */
export type IStripeCustomerCreateApiRequest =
  IApiRequest<IStripeCustomerCreate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IStripeCustomerCreateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IStripeCustomer'
 */
export type IStripeCustomerCreateApiResponse = IApiResponse<IStripeCustomer>;

/**
 * API request/response for updating a Stripe customer
 */
export type IStripeCustomerUpdateApiRequest = IApiRequest<
  Partial<IStripeCustomerCreate>
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IStripeCustomerUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 */
export type IStripeCustomerUpdateApiResponse = IApiResponse<{
  success: boolean;
}>;

/**
 * API request/response for creating/updating a subscription
 */
export type IStripeSubscriptionCreateApiRequest =
  IApiRequest<IStripeSubscriptionCreate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IStripeSubscriptionCreateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IStripeSubscription'
 */
export type IStripeSubscriptionCreateApiResponse =
  IApiResponse<IStripeSubscription>;

/**
 * API request/response for canceling a subscription
 */
export type IStripeSubscriptionCancelApiRequest = IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IStripeSubscriptionCancelApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IStripeSubscription'
 */
export type IStripeSubscriptionCancelApiResponse =
  IApiResponse<IStripeSubscription>;

/**
 * API request/response for getting payment methods
 */
export type IStripePaymentMethodsApiRequest = IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IStripePaymentMethodsApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 paymentMethods:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/IPaymentMethod'
 */
export type IStripePaymentMethodsApiResponse = IApiResponse<{
  paymentMethods: IPaymentMethod[];
}>;

/**
 * API request/response for adding a payment method
 */
export type IStripeAddPaymentMethodApiRequest = IApiRequest<{
  paymentMethodId: string;
  isDefault?: boolean;
}>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IStripeAddPaymentMethodApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 paymentMethods:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/IPaymentMethod'
 */
export type IStripeAddPaymentMethodApiResponse = IApiResponse<{
  paymentMethods: IPaymentMethod[];
}>;

/**
 * API request/response for removing a payment method
 */
export type IStripeRemovePaymentMethodApiRequest = IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IStripeRemovePaymentMethodApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 paymentMethods:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/IPaymentMethod'
 */
export type IStripeRemovePaymentMethodApiResponse = IApiResponse<{
  paymentMethods: IPaymentMethod[];
}>;

/**
 * API request/response for setting default payment method
 */
export type IStripeSetDefaultPaymentMethodApiRequest = IApiRequest<{
  paymentMethodId: string;
}>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IStripeSetDefaultPaymentMethodApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 paymentMethods:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/IPaymentMethod'
 */
export type IStripeSetDefaultPaymentMethodApiResponse = IApiResponse<{
  paymentMethods: IPaymentMethod[];
}>;

/**
 * API request/response for creating a product
 */
export type IStripeProductCreateApiRequest = IApiRequest<IStripeProductCreate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IStripeProductCreateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IStripeProduct'
 */
export type IStripeProductCreateApiResponse = IApiResponse<IStripeProduct>;

/**
 * API request/response for creating a price
 */
export type IStripePriceCreateApiRequest = IApiRequest<IStripePriceCreate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IStripePriceCreateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IStripePrice'
 */
export type IStripePriceCreateApiResponse = IApiResponse<IStripePrice>;

/**
 * API request/response for getting invoices
 */
export type IStripeInvoicesApiRequest = IApiRequest<IStripeInvoiceListRequest>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IStripeInvoicesApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 invoices:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/IStripeInvoice'
 *                 hasMore:
 *                   type: boolean
 *                   description: Whether there are more invoices to fetch
 *                 totalCount:
 *                   type: integer
 *                   description: Total number of invoices
 */
export type IStripeInvoicesApiResponse = IApiResponse<{
  invoices: IStripeInvoice[];
  hasMore: boolean;
  totalCount: number;
}>;

/**
 * API request/response for getting a specific invoice
 */
export type IStripeInvoiceApiRequest = IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IStripeInvoiceApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IStripeInvoice'
 */
export type IStripeInvoiceApiResponse = IApiResponse<IStripeInvoice>;
