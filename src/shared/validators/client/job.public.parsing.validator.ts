import { z } from 'zod';
import { JobParsingMode } from '../../models/domain/client/job.parsing.domain';

// Validator for public job parsing upload
export const jobPublicParsingUploadValidator = z.object({
  query: z.object({
    mode: z
      .nativeEnum(JobParsingMode, {
        message:
          'Invalid parsing mode. Must be one of: STRICT, INFERRED, GENERATIVE',
      })
      .optional(),
  }),
});

// Validator for public parsing task ID parameter
export const jobPublicParsingTaskIdValidator = z.object({
  params: z.object({
    taskId: z.string().uuid({ message: 'Task ID must be a valid UUID' }),
  }),
});

// Validator for getting parsed job description from public task
export const jobPublicParsingGetJobValidator = z.object({
  params: z.object({
    taskId: z.string().uuid({ message: 'Task ID must be a valid UUID' }),
  }),
});

// Validator for job parsing task ID parameter
export const jobParsingTaskIdValidator = z.object({
  params: z.object({
    taskId: z.string().uuid({ message: 'Task ID must be a valid UUID' }),
  }),
});

// Validator for job posting ID parameter
export const jobPostingIdValidator = z.object({
  params: z.object({
    jobPostingId: z
      .string()
      .uuid({ message: 'Job posting ID must be a valid UUID' }),
  }),
});

// Validator for job parsing upload
export const jobParsingUploadValidator = z.object({
  params: z.object({
    jobPostingId: z
      .string()
      .uuid({ message: 'Job posting ID must be a valid UUID' }),
  }),
  query: z.object({
    mode: z
      .nativeEnum(JobParsingMode, {
        message:
          'Invalid parsing mode. Must be one of: STRICT, INFERRED, GENERATIVE',
      })
      .optional(),
  }),
});
