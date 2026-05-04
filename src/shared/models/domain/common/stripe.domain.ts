/**
 * @openapi
 * components:
 *   schemas:
 *     IStripeCustomer:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Stripe customer ID
 *         email:
 *           type: string
 *           format: email
 *           description: Customer email
 *         name:
 *           type: string
 *           description: Customer name
 *         metadata:
 *           type: object
 *           description: Customer metadata
 *         created:
 *           type: number
 *           description: Customer creation timestamp
 */
export interface IStripeCustomer {
  id: string;
  email: string;
  name: string;
  metadata?: Record<string, any>;
  created: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IStripeSubscription:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Stripe subscription ID
 *         customerId:
 *           type: string
 *           description: Customer ID
 *         status:
 *           type: string
 *           description: Subscription status
 *         currentPeriodStart:
 *           type: string
 *           format: date-time
 *           description: Current period start date
 *         currentPeriodEnd:
 *           type: string
 *           format: date-time
 *           description: Current period end date
 *         metadata:
 *           type: object
 *           description: Subscription metadata
 */
export interface IStripeSubscription {
  id: string;
  customerId: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  metadata?: Record<string, any>;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IStripeProduct:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Stripe product ID
 *         name:
 *           type: string
 *           description: Product name
 *         description:
 *           type: string
 *           description: Product description
 *         active:
 *           type: boolean
 *           description: Whether the product is active
 *         metadata:
 *           type: object
 *           description: Additional metadata associated with the product
 */
export interface IStripeProduct {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  metadata?: Record<string, any>;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IStripePrice:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Stripe price ID
 *         productId:
 *           type: string
 *           description: ID of the associated product
 *         unitAmount:
 *           type: integer
 *           description: Price amount in cents
 *         currency:
 *           type: string
 *           description: Three-letter ISO currency code
 *         recurring:
 *           type: object
 *           properties:
 *             interval:
 *               type: string
 *               description: Billing interval (month, year, etc.)
 *             intervalCount:
 *               type: integer
 *               description: Number of intervals between billings
 *         active:
 *           type: boolean
 *           description: Whether the price is active
 *         metadata:
 *           type: object
 *           description: Additional metadata associated with the price
 */
export interface IStripePrice {
  id: string;
  productId: string;
  unitAmount: number;
  currency: string;
  recurring?: {
    interval: string;
    intervalCount: number;
  };
  active: boolean;
  metadata?: Record<string, any>;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IStripeCustomerCreate:
 *       type: object
 *       required:
 *         - email
 *         - name
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Customer's email address
 *         name:
 *           type: string
 *           description: Customer's full name
 *         metadata:
 *           type: object
 *           description: Additional metadata to associate with the customer
 */
export interface IStripeCustomerCreate {
  email: string;
  name: string;
  metadata?: Record<string, any>;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IStripeSubscriptionCreate:
 *       type: object
 *       required:
 *         - productId
 *         - priceId
 *       properties:
 *         productId:
 *           type: string
 *           description: ID of the product to subscribe to
 *         priceId:
 *           type: string
 *           description: ID of the price to use for the subscription
 *         metadata:
 *           type: object
 *           description: Additional metadata to associate with the subscription
 */
export interface IStripeSubscriptionCreate {
  productId: string;
  priceId: string;
  metadata?: Record<string, any>;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IStripeProductCreate:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Product name
 *         description:
 *           type: string
 *           description: Product description
 *         metadata:
 *           type: object
 *           description: Additional metadata to associate with the product
 */
export interface IStripeProductCreate {
  name: string;
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IStripePriceCreate:
 *       type: object
 *       required:
 *         - amount
 *       properties:
 *         amount:
 *           type: integer
 *           description: Price amount in cents
 *         currency:
 *           type: string
 *           description: Three-letter ISO currency code
 *           default: usd
 *         recurring:
 *           type: object
 *           properties:
 *             interval:
 *               type: string
 *               description: Billing interval (day, week, month, year)
 *             intervalCount:
 *               type: integer
 *               description: Number of intervals between billings
 *         metadata:
 *           type: object
 *           description: Additional metadata to associate with the price
 */
export interface IStripePriceCreate {
  amount: number;
  currency?: string;
  recurring?: {
    interval: string;
    intervalCount: number;
  };
  metadata?: Record<string, any>;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IStripeInvoice:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Stripe invoice ID
 *         customerId:
 *           type: string
 *           description: Customer ID
 *         subscriptionId:
 *           type: string
 *           description: Subscription ID (if applicable)
 *         status:
 *           type: string
 *           description: Invoice status (draft, open, paid, void, uncollectible)
 *         amountDue:
 *           type: integer
 *           description: Amount due in cents
 *         amountPaid:
 *           type: integer
 *           description: Amount paid in cents
 *         currency:
 *           type: string
 *           description: Three-letter ISO currency code
 *         invoiceDate:
 *           type: string
 *           format: date-time
 *           description: Invoice date
 *         dueDate:
 *           type: string
 *           format: date-time
 *           description: Due date
 *         paidAt:
 *           type: string
 *           format: date-time
 *           description: Date when invoice was paid
 *         invoicePdf:
 *           type: string
 *           description: URL to PDF invoice
 *         hostedInvoiceUrl:
 *           type: string
 *           description: URL to hosted invoice page
 *         description:
 *           type: string
 *           description: Invoice description
 *         metadata:
 *           type: object
 *           description: Additional metadata
 */
export interface IStripeInvoice {
  id: string;
  customerId: string;
  subscriptionId?: string;
  status: string;
  amountDue: number;
  amountPaid: number;
  currency: string;
  invoiceDate: Date;
  dueDate: Date;
  paidAt?: Date;
  invoicePdf?: string;
  hostedInvoiceUrl?: string;
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IStripeInvoiceListRequest:
 *       type: object
 *       properties:
 *         limit:
 *           type: integer
 *           description: Number of invoices to return (max 100)
 *           default: 10
 *         startingAfter:
 *           type: string
 *           description: Cursor for pagination (invoice ID)
 *         endingBefore:
 *           type: string
 *           description: Cursor for pagination (invoice ID)
 *         status:
 *           type: string
 *           description: Filter by invoice status
 *         subscriptionId:
 *           type: string
 *           description: Filter by subscription ID
 */
export interface IStripeInvoiceListRequest {
  limit?: number;
  startingAfter?: string;
  endingBefore?: string;
  status?: string;
  subscriptionId?: string;
}
