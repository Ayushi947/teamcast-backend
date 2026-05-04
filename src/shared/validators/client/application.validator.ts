import { z } from 'zod';
import { ApplicationStatusEnum } from '../../models/common/enums';

// Validator for application ID in path parameters
export const clientApplicationIdValidator = z.object({
  params: z.object({
    applicationId: z.string().uuid({
      message: 'Application ID must be a valid UUID',
    }),
  }),
});

// Validator for application status update
export const clientApplicationStatusUpdateValidator = z.object({
  params: z.object({
    applicationId: z.string().uuid({
      message: 'Application ID must be a valid UUID',
    }),
  }),
  body: z.object({
    status: z.nativeEnum(ApplicationStatusEnum, {
      errorMap: () => ({ message: 'Invalid application status' }),
    }),
    notes: z
      .string()
      .max(1000, {
        message: 'Notes must be at most 1000 characters long',
      })
      .optional(),
  }),
});

// Validator for application list query parameters
export const clientApplicationListValidator = z.object({
  query: z.object({
    jobId: z
      .string()
      .uuid({
        message: 'Job ID must be a valid UUID',
      })
      .optional(),
    userId: z
      .string()
      .uuid({
        message: 'User ID must be a valid UUID',
      })
      .optional(),
    status: z
      .union([
        z.nativeEnum(ApplicationStatusEnum, {
          errorMap: () => ({ message: 'Invalid application status' }),
        }),
        z.array(
          z.nativeEnum(ApplicationStatusEnum, {
            errorMap: () => ({ message: 'Invalid application status' }),
          })
        ),
      ])
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

// Validator for hire request (uses same params as get application)
export const clientApplicationHireRequestValidator = z.object({
  params: z.object({
    applicationId: z.string().uuid({
      message: 'Application ID must be a valid UUID',
    }),
  }),
});
