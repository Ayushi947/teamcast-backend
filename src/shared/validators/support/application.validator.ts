import { z } from 'zod';

// Validator for application ID in path parameters
export const supportApplicationIdValidator = z.object({
  params: z.object({
    applicationId: z.string().uuid({
      message: 'Application ID must be a valid UUID',
    }),
  }),
});

// Validator for application list query parameters
export const supportApplicationListValidator = z.object({
  query: z.object({
    jobId: z
      .string()
      .uuid({
        message: 'Job ID must be a valid UUID',
      })
      .optional(),
    candidateId: z
      .string()
      .uuid({
        message: 'Candidate ID must be a valid UUID',
      })
      .optional(),
    clientId: z
      .string()
      .uuid({
        message: 'Client ID must be a valid UUID',
      })
      .optional(),
    partnerId: z
      .string()
      .uuid({
        message: 'Partner ID must be a valid UUID',
      })
      .optional(),
    dateFrom: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: 'Date from must be in YYYY-MM-DD format',
      })
      .optional(),
    dateTo: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: 'Date to must be in YYYY-MM-DD format',
      })
      .optional(),
    page: z.coerce
      .number()
      .int()
      .positive({
        message: 'Page number must be a positive integer',
      })
      .optional(),
    limit: z.coerce
      .number()
      .int()
      .positive({
        message: 'Limit must be a positive integer',
      })
      .optional(),
    sortBy: z
      .string({
        message: 'Sort by field must be a string',
      })
      .optional(),
    sortOrder: z
      .enum(['asc', 'desc'], {
        errorMap: () => ({
          message: "Sort order must be either 'asc' or 'desc'",
        }),
      })
      .optional(),
    search: z
      .string({
        message: 'Search term must be a string',
      })
      .optional(),
  }),
});

// Validator for statistics query parameters
export const supportApplicationStatisticsValidator = z.object({
  query: z.object({
    dateFrom: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: 'Date from must be in YYYY-MM-DD format',
      })
      .optional(),
    dateTo: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: 'Date to must be in YYYY-MM-DD format',
      })
      .optional(),
  }),
});
