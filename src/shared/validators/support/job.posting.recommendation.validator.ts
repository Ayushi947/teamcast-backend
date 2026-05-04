import { z } from 'zod';
import { baseFilterValidatorSchema } from '../common/pagination.validator';

/**
 * Job posting recommendation preview filter schema
 */
const supportJobRecommendationPreviewFilterSchema = z.object({
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1 && val <= 100, {
      message: 'Limit must be between 1 and 100',
    })
    .optional(),
  prevSyncDateTime: z
    .string()
    .datetime({ message: 'Invalid prevSyncDateTime format' })
    .optional(),
  candidateSearch: z
    .string()
    .min(1, { message: 'Candidate search term must not be empty' })
    .optional(),
});

/**
 * Validator for job posting recommendation preview request
 */
export const supportJobRecommendationPreviewValidator = z.object({
  params: z.object({
    jobPostingId: z.string().uuid({ message: 'Invalid job posting ID format' }),
  }),
  query: z.object({
    ...baseFilterValidatorSchema.shape,
    ...supportJobRecommendationPreviewFilterSchema.shape,
  }),
});

/**
 * Store recommendations request body schema
 */
const storeRecommendationsBodySchema = z.object({
  selectedCandidateIds: z
    .array(z.string().uuid({ message: 'Invalid candidate ID format' }))
    .min(1, { message: 'At least one candidate must be selected' })
    .max(50, { message: 'Cannot select more than 50 candidates at once' }),
  recommendations: z
    .array(
      z.object({
        metadata: z.object({
          semanticScore: z
            .number()
            .min(0, { message: 'Score must be at least 0' })
            .max(1, { message: 'Score must be at most 1' }),
        }),
        matchReason: z.string().min(1, { message: 'Match reason is required' }),
      })
    )
    .min(1, { message: 'At least one recommendation is required' }),
});

/**
 * Validator for storing selected recommendations
 */
export const supportStoreRecommendationsValidator = z.object({
  params: z.object({
    jobPostingId: z.string().uuid({ message: 'Invalid job posting ID format' }),
  }),
  body: storeRecommendationsBodySchema,
});

/**
 * Validator for getting stored recommendations
 */
export const supportStoredJobRecommendationListValidator = z.object({
  params: z.object({
    jobPostingId: z.string().uuid({ message: 'Invalid job posting ID format' }),
  }),
  query: z.object({
    ...baseFilterValidatorSchema.shape,
  }),
});

/**
 * Refresh recommendations body schema
 */
const refreshRecommendationsBodySchema = z.object({
  limit: z
    .number()
    .int()
    .min(1, { message: 'Limit must be at least 1' })
    .max(100, { message: 'Limit must be at most 100' })
    .optional()
    .default(25),
});

/**
 * Validator for refreshing job recommendations
 */
export const supportRefreshRecommendationsValidator = z.object({
  params: z.object({
    jobPostingId: z.string().uuid({ message: 'Invalid job posting ID format' }),
  }),
  body: refreshRecommendationsBodySchema,
});

/**
 * Common job posting ID parameter validator
 */
export const supportJobPostingIdParamsValidator = z.object({
  params: z.object({
    jobPostingId: z.string().uuid({ message: 'Invalid job posting ID format' }),
  }),
});

/**
 * Type exports for use in controllers
 */
export type SupportJobRecommendationPreviewRequest = z.infer<
  typeof supportJobRecommendationPreviewValidator
>;

export type SupportStoreRecommendationsRequest = z.infer<
  typeof supportStoreRecommendationsValidator
>;

export type SupportStoredJobRecommendationListRequest = z.infer<
  typeof supportStoredJobRecommendationListValidator
>;

export type SupportRefreshRecommendationsRequest = z.infer<
  typeof supportRefreshRecommendationsValidator
>;

export type SupportJobPostingIdParams = z.infer<
  typeof supportJobPostingIdParamsValidator
>;
