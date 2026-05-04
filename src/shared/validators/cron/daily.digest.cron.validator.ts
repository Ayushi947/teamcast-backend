import { z } from 'zod';

import { paginationValidatorSchema } from '../common/pagination.validator';
import { DailyDigestCronTaskStatus } from '../../models/domain/cron/daily.digest.domain';

// Validator for starting a new daily digest task
export const startDailyDigestTaskValidator = z.object({
  body: z.object({
    data: z.object({}).strict(), // Reject any additional fields
  }),
});

// Schema for filtering daily digest tasks
const dailyDigestTaskFilterSchema = z.object({
  status: z
    .nativeEnum(DailyDigestCronTaskStatus, {
      message: 'Invalid status. Must be one of the valid task statuses',
    })
    .optional(),
});

// Validator for listing daily digest tasks with filtering
export const listDailyDigestTasksValidator = z.object({
  query: z.object({
    ...paginationValidatorSchema.shape,
    ...dailyDigestTaskFilterSchema.shape,
  }),
});
