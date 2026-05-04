import { PaymentStatus } from '../../common/enums';

export interface IPayment {
  id: string;
  intentId: string; // Generic user ID (client, candidate, partner, etc.)
  subscriptionId?: string;
  stripePaymentId: string;
  stripeInvoiceId?: string;
  amount: number; // Amount in cents
  currency: string;
  status: PaymentStatus;
  receiptUrl?: string;
  paymentMethod?: string;
  paymentMethodId?: string;
  description?: string;
  metadata?: Record<string, any>;
  webhookReceivedAt?: Date;
  webhookEventId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPaymentCreate {
  intentId: string; // Generic user ID (client, candidate, partner, etc.)
  subscriptionId?: string;
  stripePaymentId: string;
  stripeInvoiceId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  receiptUrl?: string;
  paymentMethod?: string;
  paymentMethodId?: string;
  description?: string;
  metadata?: Record<string, any>;
  webhookEventId?: string;
}

export interface IPaymentUpdate {
  status?: PaymentStatus;
  receiptUrl?: string;
  description?: string;
  metadata?: Record<string, any>;
  webhookReceivedAt?: Date;
  webhookEventId?: string;
}

export interface IPaymentFilterQuery {
  intentId?: string; // Generic user ID (client, candidate, partner, etc.)
  subscriptionId?: string;
  status?: PaymentStatus;
  startDate?: Date;
  endDate?: Date;
  stripePaymentId?: string;
  stripeInvoiceId?: string;
}

export interface IPaymentListQuery {
  page?: number;
  limit?: number;
  intentId?: string; // Generic user ID (client, candidate, partner, etc.)
  subscriptionId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  stripePaymentId?: string;
  stripeInvoiceId?: string;
}

export interface IStripePaymentIntent {
  id: string;
  object: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  receipt_url?: string;
  description?: string;
  metadata: Record<string, any>;
  created: number;
  customer?: string;
  invoice?: string;
  subscription?: string;
}

export interface IStripePaymentInvoice {
  id: string;
  object: string;
  amount_due: number;
  amount_paid: number;
  currency: string;
  status: string;
  customer: string;
  subscription?: string;
  payment_intent?: string;
  hosted_invoice_url?: string;
  invoice_pdf?: string;
  description?: string;
  metadata: Record<string, any>;
  created: number;
  due_date?: number;
}

// Webhook processing result
export interface IWebhookProcessingResult {
  success: boolean;
  paymentId?: string;
  message: string;
  error?: string;
}
