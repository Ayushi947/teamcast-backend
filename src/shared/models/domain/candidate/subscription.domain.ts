import {
  CandidateSubscriptionStatusEnum,
  PaymentProviderEnum,
} from '../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateSubscription:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the subscription
 *         candidateId:
 *           type: string
 *           format: uuid
 *           description: Identifier of the candidate
 *         packageId:
 *           type: string
 *           format: uuid
 *           description: Identifier of the subscription package
 *         status:
 *           $ref: '#/components/schemas/CandidateSubscriptionStatusEnum'
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Date when the subscription started
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: Date when the subscription ends
 *         nextBillingDate:
 *           type: string
 *           format: date-time
 *           description: Date of the next billing
 *         lastBillingDate:
 *           type: string
 *           format: date-time
 *           description: Date of the last billing
 *         autoRenew:
 *           type: boolean
 *           description: Whether the subscription auto-renews
 *         practiceAssessmentsUsed:
 *           type: integer
 *           description: Number of practice assessments used
 *         aiAssessmentsUsed:
 *           type: integer
 *           description: Number of AI assessments used
 *         paymentProvider:
 *           $ref: '#/components/schemas/PaymentProviderEnum'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date when the subscription was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date when the subscription was last updated
 *         package:
 *           $ref: '#/components/schemas/ICandidateSubscriptionPackage'
 */
export interface ICandidateSubscription {
  id: string;
  candidateId: string;
  packageId: string;
  status: CandidateSubscriptionStatusEnum;
  startDate: Date;
  endDate?: Date;
  nextBillingDate?: Date;
  lastBillingDate?: Date;
  autoRenew: boolean;
  paymentProvider: PaymentProviderEnum;
  paymentProviderCustomerId?: string;
  paymentProviderSubscriptionId?: string;
  practiceAssessmentsUsed: number;
  aiAssessmentsUsed: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  package?: ICandidateSubscriptionPackage;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateSubscriptionPackage:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the package
 *         name:
 *           type: string
 *           description: Name of the package
 *         description:
 *           type: string
 *           description: Description of the package
 *         price:
 *           type: number
 *           description: Price of the package
 *         currency:
 *           type: string
 *           description: Currency of the price
 *         billingCycle:
 *           type: string
 *           description: Billing cycle (monthly, yearly, etc.)
 *         isActive:
 *           type: boolean
 *           description: Whether the package is currently active
 *         isDefault:
 *           type: boolean
 *           description: Whether this is the default package
 *         maxAssessmentsPerMonth:
 *           type: integer
 *           description: Maximum number of assessments allowed per month
 *         maxAiAssessmentsPerMonth:
 *           type: integer
 *           description: Maximum number of AI assessments allowed per month
 *         features:
 *           type: object
 *           description: Additional features included in the package
 *         paymentProvider:
 *           $ref: '#/components/schemas/PaymentProviderEnum'
 *         paymentProviderProductId:
 *           type: string
 *           description: ID of the product in the payment provider
 *         paymentProviderPriceId:
 *           type: string
 *           description: ID of the price in the payment provider
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date when the package was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date when the package was last updated
 */
export interface ICandidateSubscriptionPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: string;
  isActive: boolean;
  isDefault: boolean;
  maxAssessmentsPerMonth: number;
  maxAiAssessmentsPerMonth: number;
  features: Record<string, any>;
  paymentProvider: PaymentProviderEnum;
  paymentProviderProductId?: string;
  paymentProviderPriceId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * API request/response for getting available subscription packages
 *
 * @openapi
 * components:
 *   parameters:
 *     ICandidateSubscriptionPackageFilterQueryName:
 *       in: query
 *       name: name
 *       required: false
 *       schema:
 *         type: string
 *         description: Filter by name
 *     ICandidateSubscriptionPackageFilterQueryDescription:
 *       in: query
 *       name: description
 *       required: false
 *       schema:
 *         type: string
 *         description: Filter by description
 *     ICandidateSubscriptionPackageFilterQueryPrice:
 *       in: query
 *       name: price
 *       required: false
 *       schema:
 *         type: number
 *         description: Filter by price
 *     ICandidateSubscriptionPackageFilterQueryIsActive:
 *       in: query
 *       name: isActive
 *       required: false
 *       schema:
 *         type: boolean
 *         description: Filter by active status
 */
export type ICandidateSubscriptionPackageFilterQuery = {
  name?: string;
  description?: string;
  price?: number;
  isActive?: boolean;
};

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateSubscriptionUpdate:
 *       type: object
 *       properties:
 *         packageId:
 *           type: string
 *           format: uuid
 *           description: ID of the new package to subscribe to
 */
export interface ICandidateSubscriptionUpdate {
  packageId: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateSubscriptionCancel:
 *       type: object
 *       properties:
 *         reason:
 *           type: string
 *           description: Optional reason for cancellation
 */
export interface ICandidateSubscriptionCancel {
  reason?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateAddPaymentMethod:
 *       type: object
 *       properties:
 *         paymentMethodId:
 *           type: string
 *           description: ID of the payment method to add
 *         isDefault:
 *           type: boolean
 *           description: Whether this should be the default payment method
 */
export interface ICandidateAddPaymentMethod {
  paymentMethodId: string;
  isDefault?: boolean;
}

/**
 * @openapi
 * components:
 *   parameters:
 *     ICandidatePaymentMethodParams:
 *       type: object
 *       properties:
 *         paymentMethodId:
 *           type: string
 *           description: ID of the payment method to remove
 */
export interface ICandidatePaymentMethodParams {
  paymentMethodId: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateSetDefaultPaymentMethod:
 *       type: object
 *       properties:
 *         paymentMethodId:
 *           type: string
 *           description: ID of the payment method to set as default
 */
export interface ICandidateSetDefaultPaymentMethod {
  paymentMethodId: string;
}

export const toCandidateSubscriptionDomain = (
  subscription: any
): ICandidateSubscription => ({
  id: subscription.id,
  candidateId: subscription.candidateId,
  packageId: subscription.packageId,
  status: subscription.status,
  startDate: subscription.startDate,
  endDate: subscription.endDate,
  nextBillingDate: subscription.nextBillingDate,
  lastBillingDate: subscription.lastBillingDate,
  autoRenew: subscription.autoRenew,
  paymentProvider: subscription.paymentProvider,
  paymentProviderCustomerId: subscription.paymentProviderCustomerId,
  paymentProviderSubscriptionId: subscription.paymentProviderSubscriptionId,
  practiceAssessmentsUsed: subscription.practiceAssessmentsUsed,
  aiAssessmentsUsed: subscription.aiAssessmentsUsed,
  metadata: subscription.metadata,
  createdAt: subscription.createdAt,
  updatedAt: subscription.updatedAt,
  package: subscription.package
    ? toCandidateSubscriptionPackageDomain(subscription.package)
    : undefined,
});

export const toCandidateSubscriptionPackageDomain = (
  pkg: any
): ICandidateSubscriptionPackage => ({
  id: pkg.id,
  name: pkg.name,
  description: pkg.description,
  price: pkg.price,
  currency: pkg.currency,
  billingCycle: pkg.billingCycle,
  isActive: pkg.isActive,
  isDefault: pkg.isDefault,
  maxAssessmentsPerMonth: pkg.maxAssessmentsPerMonth,
  maxAiAssessmentsPerMonth: pkg.maxAiAssessmentsPerMonth,
  features: pkg.features,
  paymentProvider: pkg.paymentProvider,
  paymentProviderProductId: pkg.paymentProviderProductId,
  paymentProviderPriceId: pkg.paymentProviderPriceId,
  createdAt: pkg.createdAt,
  updatedAt: pkg.updatedAt,
});
