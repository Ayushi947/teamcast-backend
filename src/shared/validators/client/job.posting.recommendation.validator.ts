import { z } from 'zod';
import {
  JobRecommendationStatusEnum,
  JobRecommendationFeedbackTypeEnum,
} from '../../models/common/enums';
import { paginationValidatorSchema } from '../common/pagination.validator';

// Get job posting recommendations validator
export const jobPostingRecommendationListValidator = z.object({
  params: z.object({
    jobPostingId: z.string().uuid({ message: 'Invalid job posting ID format' }),
  }),
  query: z.object({
    ...paginationValidatorSchema.shape,
    status: z
      .nativeEnum(JobRecommendationStatusEnum, {
        message: 'Invalid recommendation status',
      })
      .optional(),
    minScore: z
      .number()
      .min(0, { message: 'Minimum score must be at least 0' })
      .max(1, { message: 'Minimum score must be at most 1' })
      .optional(),
    maxScore: z
      .number()
      .min(0, { message: 'Maximum score must be at least 0' })
      .max(1, { message: 'Maximum score must be at most 1' })
      .optional(),
    isViewed: z
      .string()
      .toLowerCase()
      .transform((val) => val === 'true')
      .refine((val) => typeof val === 'boolean', {
        message: 'isViewed must be a boolean',
      })
      .optional(),
    isSaved: z
      .string()
      .toLowerCase()
      .transform((val) => val === 'true')
      .refine((val) => typeof val === 'boolean', {
        message: 'isSaved must be a boolean',
      })
      .optional(),
    isInvited: z
      .string()
      .toLowerCase()
      .transform((val) => val === 'true')
      .refine((val) => typeof val === 'boolean', {
        message: 'isInvited must be a boolean',
      })
      .optional(),
    candidateId: z
      .string()
      .uuid({ message: 'Invalid candidate ID format' })
      .optional(),
  }),
});

// Get single job posting recommendation validator
export const jobPostingRecommendationGetValidator = z.object({
  params: z.object({
    jobPostingId: z.string().uuid({ message: 'Invalid job posting ID format' }),
    recommendationId: z
      .string()
      .uuid({ message: 'Invalid recommendation ID format' }),
  }),
});

// Reject job posting recommendation validator
export const jobPostingRecommendationRejectValidator = z.object({
  params: z.object({
    jobPostingId: z.string().uuid({ message: 'Invalid job posting ID format' }),
    recommendationId: z
      .string()
      .uuid({ message: 'Invalid recommendation ID format' }),
  }),
  body: z.object({
    feedbackType: z.nativeEnum(JobRecommendationFeedbackTypeEnum, {
      message: 'Invalid feedback type',
    }),
    comment: z
      .string()
      .max(1000, { message: 'Comment must be at most 1000 characters' })
      .optional(),
    reason: z
      .string()
      .max(500, { message: 'Reason must be at most 500 characters' })
      .optional(),
    isHelpful: z.boolean().optional().default(false),
  }),
});

// Mark recommendation as viewed validator
export const jobPostingRecommendationMarkViewedValidator = z.object({
  params: z.object({
    jobPostingId: z.string().uuid({ message: 'Invalid job posting ID format' }),
    recommendationId: z
      .string()
      .uuid({ message: 'Invalid recommendation ID format' }),
  }),
});

// Save recommendation validator
export const jobPostingRecommendationSaveValidator = z.object({
  params: z.object({
    jobPostingId: z.string().uuid({ message: 'Invalid job posting ID format' }),
    recommendationId: z
      .string()
      .uuid({ message: 'Invalid recommendation ID format' }),
  }),
});

// Unsave recommendation validator
export const jobPostingRecommendationUnsaveValidator = z.object({
  params: z.object({
    jobPostingId: z.string().uuid({ message: 'Invalid job posting ID format' }),
    recommendationId: z
      .string()
      .uuid({ message: 'Invalid recommendation ID format' }),
  }),
});

// Common recommendation ID validator for reuse
export const jobPostingRecommendationIdValidator = z.object({
  params: z.object({
    jobPostingId: z.string().uuid({ message: 'Invalid job posting ID format' }),
    recommendationId: z
      .string()
      .uuid({ message: 'Invalid recommendation ID format' }),
  }),
});
