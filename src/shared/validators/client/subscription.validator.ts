import { z } from 'zod';

/**
 * Validator for updating a client subscription
 */
export const clientSubscriptionUpdateValidator = z.object({
  body: z.object({
    packageId: z.string().uuid({ message: 'Invalid package ID format' }),
  }),
});

/**
 * Validator for cancelling a client subscription
 */
export const clientSubscriptionCancelValidator = z.object({
  body: z.object({
    reason: z
      .string()
      .max(500, { message: 'Reason must be at most 500 characters' })
      .optional(),
  }),
});

/**
 * Validator for pagination parameters when fetching subscription packages
 */
export const clientSubscriptionPackagesValidator = z.object({
  query: z.object({
    page: z
      .string()
      .regex(/^\d+$/, { message: 'Page must be a number' })
      .transform(Number)
      .optional(),
    limit: z
      .string()
      .regex(/^\d+$/, { message: 'Limit must be a number' })
      .transform(Number)
      .optional(),
    sortBy: z.string().optional(),
    sortOrder: z
      .enum(['asc', 'desc'], {
        message: "Sort order must be either 'asc' or 'desc'",
      })
      .optional(),
  }),
});

/**
 * Validator for adding a payment method
 */
export const clientAddPaymentMethodValidator = z.object({
  body: z.object({
    paymentMethodId: z
      .string()
      .min(1, { message: 'Payment method ID is required' }),
    isDefault: z.boolean().optional(),
  }),
});

/**
 * Validator for removing a payment method
 */
export const clientRemovePaymentMethodValidator = z.object({
  params: z.object({
    paymentMethodId: z
      .string()
      .min(1, { message: 'Payment method ID is required' }),
  }),
});

/**
 * Validator for setting a default payment method
 */
export const clientSetDefaultPaymentMethodValidator = z.object({
  body: z.object({
    paymentMethodId: z
      .string()
      .min(1, { message: 'Payment method ID is required' }),
  }),
});

/**
 * Validator for updating auto-renewal settings
 */
export const clientSubscriptionAutoRenewValidator = z.object({
  body: z.object({
    autoRenew: z.boolean({ message: 'Auto-renewal setting is required' }),
  }),
});

/**
 * Validator for logging a candidate view
 */
export const clientLogCandidateViewValidator = z.object({
  body: z.object({
    candidateId: z.string().uuid({ message: 'Invalid candidate ID format' }),
    jobPostingId: z
      .string()
      .uuid({ message: 'Invalid job posting ID format' })
      .optional(),
    viewContext: z.string().max(255).optional(),
  }),
});
