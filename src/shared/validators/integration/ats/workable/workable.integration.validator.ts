import { z } from 'zod';

/**
 * Validator for Workable connection request
 * Validates subdomain, API key, and integration name
 */
export const workableConnectionRequestValidator = z.object({
  body: z.object({
    subdomain: z
      .string()
      .min(1, 'Subdomain is required')
      .max(100, 'Subdomain must be less than 100 characters')
      .regex(
        /^[a-z0-9-]+$/,
        'Subdomain must contain only lowercase letters, numbers, and hyphens'
      ),
    apiKey: z
      .string()
      .min(1, 'API key is required')
      .max(500, 'API key must be less than 500 characters'),
    name: z
      .string()
      .min(1, 'Integration name is required')
      .max(200, 'Integration name must be less than 200 characters'),
    description: z
      .string()
      .max(1000, 'Description must be less than 1000 characters')
      .optional(),
  }),
});

/**
 * Validator for Workable candidate import request
 * Validates pagination parameters and filter options
 */
export const workableCandidateImportRequestValidator = z.object({
  body: z
    .object({
      externalJobId: z
        .string()
        .optional()
        .refine(
          (val) => !val || /^[a-zA-Z0-9-_]+$/.test(val),
          'Job ID must contain only alphanumeric characters, hyphens, and underscores'
        ),
      limit: z
        .number()
        .int()
        .min(1, 'Limit must be at least 1')
        .max(200, 'Limit cannot exceed 200')
        .optional()
        .default(50),
      offset: z
        .number()
        .int()
        .min(0, 'Offset must be 0 or greater')
        .optional()
        .default(0),
      state: z
        .string()
        .optional()
        .refine(
          (val) =>
            !val ||
            ['active', 'hired', 'disqualified', 'withdrawn'].includes(val),
          'State must be one of: active, hired, disqualified, withdrawn'
        ),
    })
    .optional(),
});

/**
 * Validator for integration ID parameter
 * Validates UUID format for integration ID
 */
export const workableIntegrationIdParamsValidator = z.object({
  params: z.object({
    integrationId: z.string().uuid('Integration ID must be a valid UUID'),
  }),
});

/**
 * Validator for Workable credentials
 * Used internally for credential validation
 */
export const workableCredentialsValidator = z.object({
  subdomain: z.string().min(1, 'Subdomain is required'),
  apiKey: z.string().min(1, 'API key is required'),
});

/**
 * Validator for Workable job import request
 * Validates pagination parameters and filter options
 */
export const workableJobImportRequestValidator = z.object({
  body: z
    .object({
      state: z
        .string()
        .optional()
        .refine(
          (val) =>
            !val || ['draft', 'published', 'closed', 'archived'].includes(val),
          'State must be one of: draft, published, closed, archived'
        ),
      limit: z
        .number()
        .int()
        .min(1, 'Limit must be at least 1')
        .max(200, 'Limit cannot exceed 200')
        .optional()
        .default(50),
      offset: z
        .number()
        .int()
        .min(0, 'Offset must be 0 or greater')
        .optional()
        .default(0),
      sync: z.boolean().optional().default(true),
    })
    .optional(),
});

export type IWorkableConnectionRequestValidated = z.infer<
  typeof workableConnectionRequestValidator
>['body'];
export type IWorkableCandidateImportRequestValidated = z.infer<
  typeof workableCandidateImportRequestValidator
>['body'];
export type IWorkableIntegrationIdParamsValidated = z.infer<
  typeof workableIntegrationIdParamsValidator
>['params'];
export type IWorkableCredentialsValidated = z.infer<
  typeof workableCredentialsValidator
>;
export type IWorkableJobImportRequestValidated = z.infer<
  typeof workableJobImportRequestValidator
>['body'];
export type IWorkableJobSelectionRequestValidated = z.infer<
  typeof workableJobSelectionValidator
>['body'];

/**
 * Combined validator for candidate import with params
 */
export const workableCandidateImportValidator = z.object({
  params: z.object({
    integrationId: z.string().uuid('Integration ID must be a valid UUID'),
  }),
  body: z
    .object({
      externalJobId: z
        .string()
        .optional()
        .refine(
          (val) => !val || /^[a-zA-Z0-9-_]+$/.test(val),
          'Job ID must contain only alphanumeric characters, hyphens, and underscores'
        ),
      limit: z
        .number()
        .int()
        .min(1, 'Limit must be at least 1')
        .max(200, 'Limit cannot exceed 200')
        .optional()
        .default(50),
      offset: z
        .number()
        .int()
        .min(0, 'Offset must be 0 or greater')
        .optional()
        .default(0),
      state: z
        .string()
        .optional()
        .refine(
          (val) =>
            !val ||
            ['active', 'hired', 'disqualified', 'withdrawn'].includes(val),
          'State must be one of: active, hired, disqualified, withdrawn'
        ),
    })
    .optional(),
});

/**
 * Combined validator for job import with params
 */
export const workableJobImportValidator = z.object({
  params: z.object({
    integrationId: z.string().uuid('Integration ID must be a valid UUID'),
  }),
  body: z
    .object({
      state: z
        .string()
        .optional()
        .refine(
          (val) =>
            !val || ['draft', 'published', 'closed', 'archived'].includes(val),
          'State must be one of: draft, published, closed, archived'
        ),
      limit: z
        .number()
        .int()
        .min(1, 'Limit must be at least 1')
        .max(200, 'Limit cannot exceed 200')
        .optional()
        .default(50),
      offset: z
        .number()
        .int()
        .min(0, 'Offset must be 0 or greater')
        .optional()
        .default(0),
      sync: z.boolean().optional().default(true),
    })
    .optional(),
});

/**
 * Combined validator for connection validation with params
 */
export const workableValidateConnectionValidator = z.object({
  params: z.object({
    integrationId: z.string().uuid('Integration ID must be a valid UUID'),
  }),
});

/**
 * Validator for Workable job selection request
 * Validates the selected job IDs for manual import
 */
export const workableJobSelectionValidator = z.object({
  body: z.object({
    selectedJobIds: z
      .array(z.string().min(1, 'Job ID cannot be empty'))
      .min(1, 'At least one job ID must be selected')
      .max(50, 'Cannot select more than 50 jobs at once'),
  }),
  params: workableIntegrationIdParamsValidator.shape.params,
});
