import { z } from 'zod';
import { JobRecommendationCronTaskStatus } from '../../models/domain/cron/job.recommendation.cron.domain';
import { paginationValidatorSchema } from '../common/pagination.validator';

// Validator for starting a new job recommendation task
export const startJobRecommendationTaskSchema = z.object({
  jobPostingId: z
    .string()
    .uuid({ message: 'Invalid job posting ID format' })
    .optional(),
  batchSize: z
    .number()
    .min(1, { message: 'Batch size must be at least 1' })
    .max(100, { message: 'Batch size must be at most 100' })
    .optional()
    .default(10),
});

// Validator for starting a new job recommendation task
export const startJobRecommendationTaskValidator = z.object({
  body: startJobRecommendationTaskSchema,
});

// Validator for getting a job recommendation task by ID
export const getJobRecommendationTaskValidator = z.object({
  params: z.object({
    taskId: z.string().uuid({ message: 'Invalid task ID format' }),
  }),
});

// Schema for filtering job recommendation tasks
const jobRecommendationTaskFilterSchema = z.object({
  status: z
    .nativeEnum(JobRecommendationCronTaskStatus, {
      message: 'Invalid status. Must be one of the valid task statuses',
    })
    .optional(),
  jobPostingId: z
    .string()
    .uuid({ message: 'Invalid job posting ID format' })
    .optional(),
});

// Validator for listing job recommendation tasks with filtering
export const listJobRecommendationTasksValidator = z.object({
  query: z.object({
    ...paginationValidatorSchema.shape,
    ...jobRecommendationTaskFilterSchema.shape,
  }),
});

// Validator for finding recommendations directly
export const findJobRecommendationsSchema = z.object({
  jobPostingId: z.string().uuid({ message: 'Invalid job posting ID format' }),
  limit: z
    .number()
    .min(1, { message: 'Limit must be at least 1' })
    .max(100, { message: 'Limit must be at most 100' })
    .optional()
    .default(10),
});

// Validator for finding recommendations directly
export const findJobRecommendationsValidator = z.object({
  body: findJobRecommendationsSchema,
});
