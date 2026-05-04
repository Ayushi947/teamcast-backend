import { z } from 'zod';

import { paginationValidatorSchema } from '../common/pagination.validator';
import { DailyStatsCronTaskStatus } from '../../models/domain/cron/daily.stats.domain';

// Validator for starting a new daily stats task
export const startDailyStatsTaskValidator = z.object({
  body: z.object({
    data: z.object({}).strict(), // Reject any additional fields
  }),
});

// Schema for filtering daily stats tasks
const dailyStatsTaskFilterSchema = z.object({
  status: z
    .nativeEnum(DailyStatsCronTaskStatus, {
      message: 'Invalid status. Must be one of the valid task statuses',
    })
    .optional(),
});

// Validator for listing daily stats tasks with filtering
export const listDailyStatsTasksValidator = z.object({
  query: z.object({
    ...paginationValidatorSchema.shape,
    ...dailyStatsTaskFilterSchema.shape,
  }),
});
