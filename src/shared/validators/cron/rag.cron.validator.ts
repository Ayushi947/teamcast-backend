import { z } from 'zod';
import { RagCronTaskStatus } from '../../models/domain/cron/rag.cron.domain';
import { paginationValidatorSchema } from '../common/pagination.validator';

// Validator for starting a new RAG task
export const startRagTaskSchema = z.object({
  batchSize: z
    .number()
    .min(1, { message: 'Batch size must be at least 1' })
    .max(100, { message: 'Batch size must be at most 100' })
    .optional()
    .default(10),
});

// Validator for starting a new RAG task
export const startRagTaskValidator = z.object({
  body: startRagTaskSchema,
});

// Schema for filtering RAG tasks
const ragTaskFilterSchema = z.object({
  status: z
    .nativeEnum(RagCronTaskStatus, {
      message: 'Invalid status. Must be one of the valid task statuses',
    })
    .optional(),
});

// Validator for listing RAG tasks with filtering
export const listRagTasksValidator = z.object({
  query: z.object({
    ...paginationValidatorSchema.shape,
    ...ragTaskFilterSchema.shape,
  }),
});
