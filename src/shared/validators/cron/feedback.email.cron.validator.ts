import { z } from 'zod';
import {
  FeedbackEmailTaskCronStatus,
  FeedbackEmailTaskType,
} from '../../models/domain/cron/feedback.email.cron.domain';
import { paginationValidatorSchema } from '../common/pagination.validator';

// Validator for starting a new feedback email task
export const startFeedbackEmailTaskSchema = z.object({
  type: z.nativeEnum(FeedbackEmailTaskType, {
    message:
      'Invalid task type. Must be one of the valid feedback email task types',
  }),
});

export const startFeedbackEmailTaskValidator = z.object({
  body: startFeedbackEmailTaskSchema,
});

// Schema for filtering feedback email tasks
const feedbackEmailTaskFilterSchema = z.object({
  status: z
    .nativeEnum(FeedbackEmailTaskCronStatus, {
      message: 'Invalid status. Must be one of the valid task statuses',
    })
    .optional(),
  type: z
    .nativeEnum(FeedbackEmailTaskType, {
      message: 'Invalid type. Must be one of the valid task types',
    })
    .optional(),
});

// Validator for listing feedback email tasks with filtering
export const listFeedbackEmailTasksValidator = z.object({
  query: z.object({
    ...paginationValidatorSchema.shape,
    ...feedbackEmailTaskFilterSchema.shape,
  }),
});
