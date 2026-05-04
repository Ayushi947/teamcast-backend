import { z } from 'zod';

// Integration Initiation Validators
export const indeedInitiateValidator = z.object({
  body: z
    .object({
      integrationName: z
        .string()
        .min(1, { message: 'Integration name must be at least 1 character' })
        .max(100, {
          message: 'Integration name must be at most 100 characters',
        })
        .optional(),
    })
    .optional(),
});

// Job Publishing Validators
export const indeedJobPublishValidator = z.object({
  body: z
    .object({
      title: z
        .string()
        .min(1, { message: 'Job title is required' })
        .max(200, { message: 'Job title must be at most 200 characters' }),
      description: z
        .string()
        .min(10, { message: 'Job description must be at least 10 characters' })
        .max(10000, {
          message: 'Job description must be at most 10,000 characters',
        }),
      location: z
        .string()
        .min(1, { message: 'Location is required' })
        .max(100, { message: 'Location must be at most 100 characters' }),
      company: z
        .string()
        .min(1, { message: 'Company name is required' })
        .max(100, { message: 'Company name must be at most 100 characters' }),
      requirements: z
        .array(z.string())
        .min(1, { message: 'At least one requirement is required' })
        .max(20, { message: 'Maximum 20 requirements allowed' }),
      skills: z
        .array(z.string())
        .min(1, { message: 'At least one skill is required' })
        .max(30, { message: 'Maximum 30 skills allowed' }),
      salaryMin: z
        .number()
        .min(0, { message: 'Minimum salary must be non-negative' })
        .optional(),
      salaryMax: z
        .number()
        .min(0, { message: 'Maximum salary must be non-negative' })
        .optional(),
      employmentType: z
        .string()
        .min(1, { message: 'Employment type is required' })
        .max(50, { message: 'Employment type must be at most 50 characters' }),
      workLocation: z
        .string()
        .min(1, { message: 'Work location is required' })
        .max(50, { message: 'Work location must be at most 50 characters' }),
      applicationUrl: z
        .string()
        .url({ message: 'Application URL must be a valid URL' }),
    })
    .refine(
      (data) => {
        if (data.salaryMin && data.salaryMax) {
          return data.salaryMax >= data.salaryMin;
        }
        return true;
      },
      {
        message:
          'Maximum salary must be greater than or equal to minimum salary',
        path: ['salaryMax'],
      }
    ),
  params: z.object({
    clientIntegrationId: z
      .string()
      .uuid({ message: 'Invalid client integration ID' }),
    jobPostingId: z.string().uuid({ message: 'Invalid job posting ID' }),
  }),
});

export const indeedJobUpdateValidator = z.object({
  body: z
    .object({
      title: z
        .string()
        .min(1, { message: 'Job title is required' })
        .max(200, { message: 'Job title must be at most 200 characters' })
        .optional(),
      description: z
        .string()
        .min(10, { message: 'Job description must be at least 10 characters' })
        .max(10000, {
          message: 'Job description must be at most 10,000 characters',
        })
        .optional(),
      location: z
        .string()
        .min(1, { message: 'Location is required' })
        .max(100, { message: 'Location must be at most 100 characters' })
        .optional(),
      company: z
        .string()
        .min(1, { message: 'Company name is required' })
        .max(100, { message: 'Company name must be at most 100 characters' })
        .optional(),
      requirements: z
        .array(z.string())
        .min(1, { message: 'At least one requirement is required' })
        .max(20, { message: 'Maximum 20 requirements allowed' })
        .optional(),
      skills: z
        .array(z.string())
        .min(1, { message: 'At least one skill is required' })
        .max(30, { message: 'Maximum 30 skills allowed' })
        .optional(),
      salaryMin: z
        .number()
        .min(0, { message: 'Minimum salary must be non-negative' })
        .optional(),
      salaryMax: z
        .number()
        .min(0, { message: 'Maximum salary must be non-negative' })
        .optional(),
      employmentType: z
        .string()
        .min(1, { message: 'Employment type is required' })
        .max(50, { message: 'Employment type must be at most 50 characters' })
        .optional(),
      workLocation: z
        .string()
        .min(1, { message: 'Work location is required' })
        .max(50, { message: 'Work location must be at most 50 characters' })
        .optional(),
      applicationUrl: z
        .string()
        .url({ message: 'Application URL must be a valid URL' })
        .optional(),
    })
    .refine(
      (data) => {
        if (data.salaryMin && data.salaryMax) {
          return data.salaryMax >= data.salaryMin;
        }
        return true;
      },
      {
        message:
          'Maximum salary must be greater than or equal to minimum salary',
        path: ['salaryMax'],
      }
    ),
  params: z.object({
    clientIntegrationId: z
      .string()
      .uuid({ message: 'Invalid client integration ID' }),
    jobPostingId: z.string().uuid({ message: 'Invalid job posting ID' }),
  }),
});

// OAuth Validators
export const indeedCallbackValidator = z.object({
  params: z
    .object({
      clientIntegrationId: z
        .string()
        .uuid({ message: 'Invalid client integration ID' }),
    })
    .optional(),
  query: z.object({
    code: z.string().min(1, { message: 'Authorization code is required' }),
    state: z.string().min(1, { message: 'State parameter is required' }),
    error: z.string().optional(),
  }),
});

// Candidate Import Validators
export const indeedCandidateImportValidator = z.object({
  params: z.object({
    clientIntegrationId: z
      .string()
      .uuid({ message: 'Invalid client integration ID' }),
    jobPostingIntegrationId: z
      .string()
      .uuid({ message: 'Invalid job posting integration ID' }),
  }),
});

export const indeedCandidateListValidator = z.object({
  params: z.object({
    clientIntegrationId: z
      .string()
      .uuid({ message: 'Invalid client integration ID' }),
    jobPostingIntegrationId: z
      .string()
      .uuid({ message: 'Invalid job posting integration ID' }),
  }),
  query: z.object({
    page: z
      .string()
      .transform(Number)
      .refine((n) => n > 0, { message: 'Page must be greater than 0' })
      .optional(),
    limit: z
      .string()
      .transform(Number)
      .refine((n) => n > 0 && n <= 100, {
        message: 'Limit must be between 1 and 100',
      })
      .optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    search: z.string().optional(),
  }),
});

// Sync Validators
export const indeedSyncJobsValidator = z.object({
  params: z.object({
    clientIntegrationId: z
      .string()
      .uuid({ message: 'Invalid client integration ID' }),
  }),
});

export const indeedSyncCandidatesValidator = z.object({
  params: z.object({
    clientIntegrationId: z
      .string()
      .uuid({ message: 'Invalid client integration ID' }),
  }),
});

// Token Management Validators
export const indeedRefreshTokenValidator = z.object({
  params: z.object({
    clientIntegrationId: z
      .string()
      .uuid({ message: 'Invalid client integration ID' }),
  }),
});

// Connection Test Validators
export const indeedTestConnectionValidator = z.object({
  params: z.object({
    clientIntegrationId: z
      .string()
      .uuid({ message: 'Invalid client integration ID' }),
  }),
});

// Parameter Validators
export const indeedJobDeleteValidator = z.object({
  params: z.object({
    clientIntegrationId: z
      .string()
      .uuid({ message: 'Invalid client integration ID' }),
    jobPostingId: z.string().uuid({ message: 'Invalid job posting ID' }),
  }),
});
