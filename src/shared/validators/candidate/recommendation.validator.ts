import { z } from 'zod';
import {
  CandidateRecommendationStatusEnum,
  CandidateRecommendationFeedbackTypeEnum,
} from '../../models/common/enums';
import { paginationValidatorSchema } from '../common/pagination.validator';

// Get candidate recommendations validator
export const candidateRecommendationListQueryValidator = z.object({
  query: z.object({
    ...paginationValidatorSchema.shape,
    status: z
      .nativeEnum(CandidateRecommendationStatusEnum, {
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
    hasApplied: z
      .string()
      .toLowerCase()
      .transform((val) => val === 'true')
      .refine((val) => typeof val === 'boolean', {
        message: 'hasApplied must be a boolean',
      })
      .optional(),
    jobPostingId: z
      .string()
      .uuid({ message: 'Invalid job posting ID format' })
      .optional(),
    industry: z.string().optional(),
    location: z.string().optional(),
    jobType: z.string().optional(),
    createdAfter: z
      .string()
      .datetime({ message: 'Invalid date format for createdAfter' })
      .optional(),
    createdBefore: z
      .string()
      .datetime({ message: 'Invalid date format for createdBefore' })
      .optional(),
  }),
});

// Get single candidate recommendation validator
export const candidateRecommendationParamsValidator = z.object({
  params: z.object({
    candidateId: z.string().uuid({ message: 'Invalid candidate ID format' }),
    recommendationId: z
      .string()
      .uuid({ message: 'Invalid recommendation ID format' }),
  }),
});

// Reject candidate recommendation validator
export const rejectCandidateRecommendationValidator = z.object({
  params: z.object({
    candidateId: z.string().uuid({ message: 'Invalid candidate ID format' }),
    recommendationId: z
      .string()
      .uuid({ message: 'Invalid recommendation ID format' }),
  }),
  body: z.object({
    feedbackType: z.nativeEnum(CandidateRecommendationFeedbackTypeEnum, {
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
export const markCandidateRecommendationViewedValidator = z.object({
  params: z.object({
    candidateId: z.string().uuid({ message: 'Invalid candidate ID format' }),
    recommendationId: z
      .string()
      .uuid({ message: 'Invalid recommendation ID format' }),
  }),
});

// Save recommendation validator
export const saveCandidateRecommendationValidator = z.object({
  params: z.object({
    candidateId: z.string().uuid({ message: 'Invalid candidate ID format' }),
    recommendationId: z
      .string()
      .uuid({ message: 'Invalid recommendation ID format' }),
  }),
});

// Unsave recommendation validator
export const unsaveCandidateRecommendationValidator = z.object({
  params: z.object({
    candidateId: z.string().uuid({ message: 'Invalid candidate ID format' }),
    recommendationId: z
      .string()
      .uuid({ message: 'Invalid recommendation ID format' }),
  }),
});

// Common recommendation ID validator for reuse
export const candidateRecommendationIdValidator = z.object({
  params: z.object({
    candidateId: z.string().uuid({ message: 'Invalid candidate ID format' }),
    recommendationId: z
      .string()
      .uuid({ message: 'Invalid recommendation ID format' }),
  }),
});
