import { z } from 'zod';
import { CandidateRecommendationCronTaskStatus } from '../../models/domain/cron/candidate.recommendation.cron.domain';
import { paginationValidatorSchema } from '../common/pagination.validator';

// Validator for starting a new candidate recommendation task
export const startCandidateRecommendationTaskSchema = z.object({
  candidateId: z
    .string()
    .uuid({ message: 'Invalid candidate ID format' })
    .optional(),
  batchSize: z
    .number()
    .min(1, { message: 'Batch size must be at least 1' })
    .max(100, { message: 'Batch size must be at most 100' })
    .optional()
    .default(10),
});

// Validator for starting a new candidate recommendation task
export const startCandidateRecommendationTaskValidator = z.object({
  body: startCandidateRecommendationTaskSchema,
});

// Validator for getting a candidate recommendation task by ID
export const getCandidateRecommendationTaskValidator = z.object({
  params: z.object({
    taskId: z.string().uuid({ message: 'Invalid task ID format' }),
  }),
});

// Schema for filtering candidate recommendation tasks
const candidateRecommendationTaskFilterSchema = z.object({
  status: z
    .nativeEnum(CandidateRecommendationCronTaskStatus, {
      message: 'Invalid status. Must be one of the valid task statuses',
    })
    .optional(),
  candidateId: z
    .string()
    .uuid({ message: 'Invalid candidate ID format' })
    .optional(),
});

// Validator for listing candidate recommendation tasks with filtering
export const listCandidateRecommendationTasksValidator = z.object({
  query: z.object({
    ...paginationValidatorSchema.shape,
    ...candidateRecommendationTaskFilterSchema.shape,
  }),
});

// Validator for finding recommendations directly
export const findCandidateRecommendationsSchema = z.object({
  candidateId: z.string().uuid({ message: 'Invalid candidate ID format' }),
  limit: z
    .number()
    .min(1, { message: 'Limit must be at least 1' })
    .max(100, { message: 'Limit must be at most 100' })
    .optional()
    .default(10),
});

// Validator for finding recommendations directly
export const findCandidateRecommendationsValidator = z.object({
  body: findCandidateRecommendationsSchema,
});
