import {
  ClientSubscriptionStatusEnum,
  PaymentProviderEnum,
} from '../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientSubscription:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the subscription
 *         clientId:
 *           type: string
 *           format: uuid
 *           description: Identifier of the client
 *         packageId:
 *           type: string
 *           format: uuid
 *           description: Identifier of the subscription package
 *         status:
 *           $ref: '#/components/schemas/ClientSubscriptionStatusEnum'
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Date when the subscription started
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: Date when the subscription ends
 *         autoRenew:
 *           type: boolean
 *           description: Whether the subscription auto-renews
 *         usedJobPostings:
 *           type: integer
 *           description: Number of job postings used
 *         usedCandidateViews:
 *           type: integer
 *           description: Number of candidate views used
 *         usedAiAssessments:
 *           type: integer
 *           description: Number of AI assessments used
 *         usedSeats:
 *           type: integer
 *           description: Number of seats used
 *         additionalCandidateViewCredits:
 *           type: integer
 *           description: Number of additional candidate view credits
 *         additionalAiAssessmentCredits:
 *           type: integer
 *           description: Number of additional AI assessment credits
 *         additionalSeatsCredits:
 *           type: integer
 *           description: Number of additional seats credits
 *         paymentProvider:
 *           $ref: '#/components/schemas/PaymentProviderEnum'
 *         lastBillingDate:
 *           type: string
 *           format: date-time
 *           description: Date of the last billing
 *         nextBillingDate:
 *           type: string
 *           format: date-time
 *           description: Date of the next billing
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date when the subscription was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date when the subscription was last updated
 *         package:
 *           $ref: '#/components/schemas/IClientSubscriptionPackage'
 *         isTrial:
 *           type: boolean
 *           description: Whether the subscription is a trial
 *         trialExpireAt:
 *           type: string
 *           format: date-time
 *           description: Date when the trial expires
 */
export interface IClientSubscription {
  id: string;
  clientId: string;
  packageId: string;
  status: ClientSubscriptionStatusEnum;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  usedJobPostings: number;
  usedCandidateViews: number;
  usedAiAssessments: number;
  usedSeats: number;
  additionalCandidateViewCredits: number;
  additionalAiAssessmentCredits: number;
  additionalSeatsCredits: number;
  paymentProvider: PaymentProviderEnum;
  lastBillingDate: Date;
  nextBillingDate: Date;
  createdAt: Date;
  updatedAt: Date;
  package: IClientSubscriptionPackage;
  isTrial: boolean;
  trialExpireAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientSubscriptionPackage:
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
 *           format: float
 *           description: Price of the package
 *         currency:
 *           type: string
 *           description: Currency of the price
 *         billingCycle:
 *           type: string
 *           description: Billing cycle for the package
 *         maxJobPostings:
 *           type: integer
 *           description: Maximum number of job postings allowed
 *         maxCandidateViews:
 *           type: integer
 *           description: Maximum number of candidate views allowed
 *         maxAiAssessments:
 *           type: integer
 *           description: Maximum number of AI assessments allowed
 *         maxSeats:
 *           type: integer
 *           description: Maximum number of seats allowed
 *         unlimitedCandidateViews:
 *           type: boolean
 *           description: Whether candidate views are unlimited
 *         isActive:
 *           type: boolean
 *           description: Whether the package is active
 *         isDefault:
 *           type: boolean
 *           description: Whether the package is the default
 *         additionalFeatures:
 *           type: object
 *           description: Additional features included in the package
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date when the package was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date when the package was last updated
 */
export interface IClientSubscriptionPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: string;
  maxJobPostings: number;
  maxCandidateViews: number;
  maxAiAssessments: number;
  maxSeats: number;
  unlimitedCandidateViews: boolean;
  isActive: boolean;
  isDefault: boolean;
  additionalFeatures: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * API request/response for getting available subscription packages
 *
 * @openapi
 * components:
 *   parameters:
 *     IClientSubscriptionPackageFilterQueryName:
 *       in: query
 *       name: name
 *       required: false
 *       schema:
 *         type: string
 *         description: Filter by name
 *     IClientSubscriptionPackageFilterQueryDescription:
 *       in: query
 *       name: description
 *       required: false
 *       schema:
 *         type: string
 *         description: Filter by description
 *     IClientSubscriptionPackageFilterQueryPrice:
 *       in: query
 *       name: price
 *       required: false
 *       schema:
 *         type: number
 *         description: Filter by price
 *     IClientSubscriptionPackageFilterQueryIsActive:
 *       in: query
 *       name: isActive
 *       required: false
 *       schema:
 *         type: boolean
 *         description: Filter by active status
 */
export type IClientSubscriptionPackageFilterQuery = {
  name?: string;
  description?: string;
  price?: number;
  isActive?: boolean;
};

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientSubscriptionUpdate:
 *       type: object
 *       required:
 *         - packageId
 *       properties:
 *         packageId:
 *           type: string
 *           format: uuid
 *           description: ID of the subscription package to upgrade to
 *         autoRenew:
 *           type: boolean
 *           description: Whether the subscription should auto-renew
 *           default: true
 *     IClientSubscriptionAutoRenewUpdate:
 *       type: object
 *       required:
 *         - autoRenew
 *       properties:
 *         autoRenew:
 *           type: boolean
 *           description: Whether the subscription should auto-renew
 *     IClientSubscriptionUpgradeInfo:
 *       type: object
 *       properties:
 *         isUpgrade:
 *           type: boolean
 *           description: Whether this is an upgrade
 *         isDowngrade:
 *           type: boolean
 *           description: Whether this is a downgrade
 *         oldMaxSeats:
 *           type: integer
 *           description: Maximum seats in old package
 *         newMaxSeats:
 *           type: integer
 *           description: Maximum seats in new package
 *         preservedUsedSeats:
 *           type: integer
 *           description: Number of used seats preserved during downgrade
 *         creditsReset:
 *           type: boolean
 *           description: Whether credits were reset during downgrade
 */
export interface IClientSubscriptionUpdate {
  packageId: string;
  autoRenew?: boolean;
}

export interface IClientSubscriptionAutoRenewUpdate {
  autoRenew: boolean;
}

export interface IClientSubscriptionUpgradeInfo {
  isUpgrade: boolean;
  isDowngrade: boolean;
  oldMaxSeats: number;
  newMaxSeats: number;
  preservedUsedSeats?: number;
  creditsReset?: boolean;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientSubscriptionCancel:
 *       type: object
 *       properties:
 *         reason:
 *           type: string
 *           description: Reason for cancellation
 */
export interface IClientSubscriptionCancel {
  reason?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientAddPaymentMethodRequest:
 *       type: object
 *       properties:
 *         paymentMethodId:
 *           type: string
 *           description: ID of the payment method to add
 */
export interface IClientAddPaymentMethodRequest {
  paymentMethodId: string;
  isDefault?: boolean;
}

/**
 * @openapi
 * components:
 *   parameters:
 *     IClientPaymentMethodParams:
 *       name: paymentMethodId
 *       in: path
 *       required: true
 *       type: string
 *       description: ID of the payment method to remove
 */
export interface IClientPaymentMethodParams {
  paymentMethodId: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientSetDefaultPaymentMethodRequest:
 *       type: object
 *       properties:
 *         paymentMethodId:
 *           type: string
 *           description: ID of the payment method to set as default
 */
export interface IClientSetDefaultPaymentMethodRequest {
  paymentMethodId: string;
}

/**
 * Helper function to convert a client subscription data object to a domain model
 * @param subscriptionData The subscription data from the database
 * @returns Client subscription domain model
 */
export function toClientSubscriptionDomain(
  subscriptionData: any,
  includePackage: boolean = true
): IClientSubscription {
  const {
    paymentProviderCustomerId,
    paymentProviderSubscriptionId,
    client,
    creditPurchases,
    ...subscription
  } = subscriptionData;

  return {
    ...subscription,
    package:
      includePackage && subscriptionData.package
        ? toClientSubscriptionPackageDomain(subscriptionData.package)
        : undefined,
  };
}

/**
 * Helper function to convert a client subscription package data object to a domain model
 * @param packageData The subscription package data from the database
 * @returns Client subscription package domain model
 */
export function toClientSubscriptionPackageDomain(
  packageData: any
): IClientSubscriptionPackage {
  const {
    paymentProviderPriceId,
    paymentProviderProductId,
    clientSubscriptions,
    ...packageDetails
  } = packageData;
  return packageDetails;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IStripeCheckoutSessionRequest:
 *       type: object
 *       required:
 *         - packageId
 *         - successUrl
 *         - cancelUrl
 *       properties:
 *         packageId:
 *           type: string
 *           format: uuid
 *           description: ID of the subscription package to purchase
 *         successUrl:
 *           type: string
 *           format: uri
 *           description: URL to redirect to after successful payment
 *         cancelUrl:
 *           type: string
 *           format: uri
 *           description: URL to redirect to if payment is cancelled
 *         customerEmail:
 *           type: string
 *           format: email
 *           description: Customer email for the checkout session
 *         metadata:
 *           type: object
 *           description: Additional metadata for the checkout session
 */
export interface IStripeCheckoutSessionRequest {
  packageId: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  metadata?: Record<string, any>;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IStripeCheckoutSessionResponse:
 *       type: object
 *       properties:
 *         sessionId:
 *           type: string
 *           description: Stripe checkout session ID
 *         url:
 *           type: string
 *           format: uri
 *           description: URL to redirect customer to for payment
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: When the checkout session expires
 */
export interface IStripeCheckoutSessionResponse {
  sessionId: string;
  url: string;
  expiresAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IStripeCheckoutSessionRetrieveResponse:
 *       type: object
 *       properties:
 *         sessionId:
 *           type: string
 *           description: Stripe checkout session ID
 *         status:
 *           type: string
 *           description: Status of the checkout session
 *         paymentStatus:
 *           type: string
 *           description: Payment status
 *         customerId:
 *           type: string
 *           description: Stripe customer ID
 *         subscriptionId:
 *           type: string
 *           description: Stripe subscription ID (if created)
 *         amountTotal:
 *           type: number
 *           description: Total amount in cents
 *         currency:
 *           type: string
 *           description: Currency code
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: When the checkout session expires
 *         metadata:
 *           type: object
 *           description: Session metadata
 */
export interface IStripeCheckoutSessionRetrieveResponse {
  sessionId: string;
  status: string;
  paymentStatus: string;
  customerId?: string;
  subscriptionId?: string;
  amountTotal: number;
  currency: string;
  expiresAt: Date;
  metadata?: Record<string, any>;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IStripeSubscriptionSyncRequest:
 *       type: object
 *       required:
 *         - subscriptionId
 *       properties:
 *         subscriptionId:
 *           type: string
 *           description: Stripe subscription ID to sync
 *     IStripeCompleteCheckoutRequest:
 *       type: object
 *       required:
 *         - sessionId
 *         - clientId
 *       properties:
 *         sessionId:
 *           type: string
 *           description: Stripe checkout session ID
 *         clientId:
 *           type: string
 *           description: Client ID to associate with the subscription
 */
export interface IStripeSubscriptionSyncRequest {
  subscriptionId: string;
}

export interface IStripeCompleteCheckoutRequest {
  sessionId: string;
  clientId: string;
}

/**
 * Domain model for logging a candidate view request
 * Used for business logic in the service layer
 */
/**
 * @openapi
 * components:
 *   schemas:
 *     ILogCandidateViewRequest:
 *       type: object
 *       required:
 *         - candidateId
 *       properties:
 *         candidateId:
 *           type: string
 *           format: uuid
 *           description: Candidate ID being viewed
 *         jobPostingId:
 *           type: string
 *           format: uuid
 *           description: (Optional) Job posting context for the view
 *         viewContext:
 *           type: string
 *           description: (Optional) Additional context for the view
 */
export interface ILogCandidateViewRequest {
  candidateId: string;
  jobPostingId?: string;
  viewContext?: string;
}

/**
 * Domain model for logging a candidate view response
 * Used for business logic in the service layer
 */
/**
 * @openapi
 * components:
 *   schemas:
 *     ILogCandidateViewResponse:
 *       type: object
 *       required:
 *         - message
 *         - alreadyViewed
 *       properties:
 *         message:
 *           type: string
 *           description: Result message
 *         alreadyViewed:
 *           type: boolean
 *           description: Whether the candidate was already viewed by this client user
 */
export interface ILogCandidateViewResponse {
  message: string;
  alreadyViewed: boolean;
}

/**
 * Domain model for the client subscription overview
 * Used for business logic in the service layer
 * @openapi
 * components:
 *   schemas:
 *     IClientSubscriptionOverview:
 *       type: object
 *       properties:
 *         isStarterPackage:
 *           type: boolean
 *           description: Whether the client is on the starter package
 *         activePackRemainingDays:
 *           type: integer
 *           description: Number of days remaining in the active package
 *         seatsQuotaUsedInPercentage:
 *           type: number
 *           description: Percentage of seats quota used
 *         jobPostingsQuotaUsedInPercentage:
 *           type: number
 *           description: Percentage of job postings quota used
 *         candidateViewsQuotaUsedInPercentage:
 *           type: number
 *           description: Percentage of candidate views quota used
 *         aiAssessmentsQuotaUsedInPercentage:
 *           type: number
 *           description: Percentage of AI assessments quota used
 *         overallQuotaUsedInPercentage:
 *           type: number
 *           description: Percentage of overall quota used
 *         subscriptionStatus:
 *           $ref: '#/components/schemas/ClientSubscriptionStatusEnum'
 *         nextBillingDate:
 *           type: string
 *           format: date-time
 *           description: Date of the next billing
 *         packStartDate:
 *           type: string
 *           format: date-time
 *           description: Date of the start of the pack
 *         activePackTotalDays:
 *           type: integer
 *           description: Total number of days in the active pack
 */
export interface IClientSubscriptionOverview {
  isStarterPackage: boolean;
  activePackRemainingDays: number;
  seatsQuotaUsedInPercentage: number;
  jobPostingsQuotaUsedInPercentage: number;
  candidateViewsQuotaUsedInPercentage: number;
  aiAssessmentsQuotaUsedInPercentage: number;
  overallQuotaUsedInPercentage: number;
  subscriptionStatus: ClientSubscriptionStatusEnum;
  nextBillingDate: Date;
  packStartDate?: Date | null;
  activePackTotalDays: number;
}
