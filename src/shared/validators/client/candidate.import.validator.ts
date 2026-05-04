import { z } from 'zod';

/**
 * Validator for candidate import template download request
 */
export const candidateImportTemplateDownloadValidator = z.object({
  body: z.object({
    jobPostingId: z
      .string()
      .uuid({ message: 'Invalid job posting ID format' })
      .min(1, { message: 'Job posting ID is required' }),
  }),
});

/**
 * Validator for candidate import file upload
 */
export const candidateImportFileUploadValidator = z.object({
  params: z.object({
    jobPostingId: z
      .string()
      .uuid({ message: 'Invalid job posting ID format' })
      .min(1, { message: 'Job posting ID is required' }),
  }),
});

/**
 * Validator for listing imported candidates
 */
export const candidateImportListValidator = z.object({
  params: z.object({
    jobPostingId: z
      .string()
      .uuid({ message: 'Invalid job posting ID format' })
      .min(1, { message: 'Job posting ID is required' }),
  }),
  query: z.object({
    limit: z
      .string()
      .optional()
      .refine(
        (val) =>
          !val ||
          (!isNaN(Number(val)) && Number(val) >= 1 && Number(val) <= 100),
        { message: 'Limit must be a number between 1 and 100' }
      ),
    offset: z
      .string()
      .optional()
      .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
        message: 'Offset must be a non-negative number',
      }),
    status: z.enum(['PENDING', 'PROCESSED', 'DUPLICATE', 'FAILED']).optional(),
    includeDuplicates: z
      .string()
      .optional()
      .refine((val) => !val || val === 'true' || val === 'false', {
        message: 'includeDuplicates must be true or false',
      }),
  }),
});

/**
 * Validator for candidate import statistics
 */
export const candidateImportStatisticsValidator = z.object({
  query: z.object({
    jobPostingId: z
      .string()
      .uuid({ message: 'Invalid job posting ID format' })
      .optional(),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: 'Start date must be in YYYY-MM-DD format',
      })
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: 'End date must be in YYYY-MM-DD format',
      })
      .optional(),
  }),
});

/**
 * Type definitions for the validators
 */
export type CandidateImportTemplateDownloadRequest = z.infer<
  typeof candidateImportTemplateDownloadValidator
>;

export type CandidateImportFileUploadRequest = z.infer<
  typeof candidateImportFileUploadValidator
>;

export type CandidateImportListRequest = z.infer<
  typeof candidateImportListValidator
>;

export type CandidateImportStatisticsRequest = z.infer<
  typeof candidateImportStatisticsValidator
>;
