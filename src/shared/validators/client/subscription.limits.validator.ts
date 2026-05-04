import { z } from 'zod';
import { paginationValidatorSchema } from '../common/pagination.validator';

/**
 * Validator for getting usage summary
 * No parameters required - uses authenticated user's client ID
 */
export const clientSubscriptionUsageSummaryValidator = z.object({
  // No body, params, or query needed - uses authenticated user context
});

/**
 * Validator for checking job posting limits
 * No parameters required - uses authenticated user's client ID
 */
export const clientSubscriptionJobPostingLimitValidator = z.object({
  // No body, params, or query needed - uses authenticated user context
});

/**
 * Validator for checking candidate view limits
 * No parameters required - uses authenticated user's client ID
 */
export const clientSubscriptionCandidateViewLimitValidator = z.object({
  // No body, params, or query needed - uses authenticated user context
});

/**
 * Validator for checking AI assessment limits
 * No parameters required - uses authenticated user's client ID
 */
export const clientSubscriptionAiAssessmentLimitValidator = z.object({
  // No body, params, or query needed - uses authenticated user context
});

/**
 * Validator for checking seats (team members) limits
 * No parameters required - uses authenticated user's client ID
 */
export const clientSubscriptionSeatsLimitValidator = z.object({
  // No body, params, or query needed - uses authenticated user context
});

/**
 * Validator for getting usage history with optional filtering
 */
export const clientSubscriptionUsageHistoryValidator = z.object({
  query: z.object({
    ...paginationValidatorSchema.shape,
    startDate: z
      .string()
      .datetime({ message: 'Start date must be a valid ISO date string' })
      .optional(),
    endDate: z
      .string()
      .datetime({ message: 'End date must be a valid ISO date string' })
      .optional(),
    limitType: z
      .enum(['jobPostings', 'candidateViews', 'aiAssessments', 'seats'], {
        message:
          'Limit type must be one of: jobPostings, candidateViews, aiAssessments, seats',
      })
      .optional(),
  }),
});

/**
 * Validator for incrementing usage counters (admin/internal use)
 */
export const clientSubscriptionIncrementUsageValidator = z.object({
  body: z.object({
    limitType: z.enum(
      ['jobPostings', 'candidateViews', 'aiAssessments', 'seats'],
      {
        message:
          'Limit type must be one of: jobPostings, candidateViews, aiAssessments, seats',
      }
    ),
    incrementBy: z
      .number()
      .int()
      .positive({ message: 'Increment value must be a positive integer' })
      .default(1),
  }),
});

/**
 * Validator for resetting usage counters (admin/internal use)
 */
export const clientSubscriptionResetUsageValidator = z.object({
  body: z.object({
    limitType: z
      .enum(['jobPostings', 'candidateViews', 'aiAssessments', 'seats'], {
        message:
          'Limit type must be one of: jobPostings, candidateViews, aiAssessments, seats',
      })
      .optional(), // If not provided, reset all counters
    resetTo: z
      .number()
      .int()
      .min(0, { message: 'Reset value must be a non-negative integer' })
      .default(0),
  }),
});

/**
 * Validator for getting subscription limit alerts
 */
export const clientSubscriptionLimitAlertsValidator = z.object({
  query: z.object({
    threshold: z
      .string()
      .regex(/^[\d]+$/, { message: 'Threshold must be a number' })
      .transform(Number)
      .pipe(
        z
          .number()
          .min(0, { message: 'Threshold must be at least 0' })
          .max(100, { message: 'Threshold must be at most 100' })
          .default(80)
      ), // Default to 80% usage threshold
    limitType: z
      .enum(['jobPostings', 'candidateViews', 'aiAssessments', 'seats'], {
        message:
          'Limit type must be one of: jobPostings, candidateViews, aiAssessments, seats',
      })
      .optional(),
  }),
});

/**
 * Validator for checking if client can perform a specific action
 */
export const clientSubscriptionCanPerformActionValidator = z.object({
  body: z.object({
    action: z.enum(
      [
        'createJobPosting',
        'viewCandidate',
        'createAiAssessment',
        'addTeamMember',
      ],
      {
        message:
          'Action must be one of: createJobPosting, viewCandidate, createAiAssessment, addTeamMember',
      }
    ),
    quantity: z
      .number()
      .int()
      .positive({ message: 'Quantity must be a positive integer' })
      .default(1),
  }),
});
