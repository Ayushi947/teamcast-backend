import { z } from 'zod';

// UUID validation helper
const uuidSchema = z.string().uuid({ message: 'Must be a valid UUID' });

// Integration ID parameter validator
export const integrationIdParamsValidator = z.object({
  params: z.object({
    integrationId: uuidSchema,
  }),
});

// Job ID parameter validator
export const jobIdParamsValidator = z.object({
  params: z.object({
    jobId: uuidSchema,
  }),
});

// Candidate ID parameter validator
export const candidateIdParamsValidator = z.object({
  params: z.object({
    candidateId: uuidSchema,
  }),
});

// Integration disconnect request body validator
export const integrationDisconnectRequestValidator = z.object({
  params: z.object({
    integrationId: uuidSchema,
  }),
  body: z.object({
    reason: z
      .string()
      .max(500, { message: 'Reason must be at most 500 characters' })
      .optional(),
    removeData: z.boolean({
      required_error: 'removeData is required',
      invalid_type_error: 'removeData must be a boolean',
    }),
    preserveJobsWithApplications: z.boolean().optional().default(false),
  }),
});

// Bulk disconnect request body validator
export const integrationBulkDisconnectRequestValidator = z.object({
  body: z.object({
    integrationIds: z
      .array(uuidSchema, {
        required_error: 'integrationIds is required',
        invalid_type_error: 'integrationIds must be an array of UUIDs',
      })
      .min(1, { message: 'At least one integration ID is required' })
      .max(50, {
        message: 'Cannot disconnect more than 50 integrations at once',
      }),
    disconnectOptions: z.object({
      reason: z
        .string()
        .max(500, { message: 'Reason must be at most 500 characters' })
        .optional(),
      removeData: z.boolean({
        required_error: 'removeData is required',
        invalid_type_error: 'removeData must be a boolean',
      }),
      preserveJobsWithApplications: z.boolean().optional().default(false),
    }),
  }),
});

// Integration data summary query validator (no query params needed)
export const integrationDataSummaryQueryValidator = z.object({
  query: z.object({}).optional(),
});

// Integration data details query validator (no query params needed)
export const integrationDataDetailsQueryValidator = z.object({
  params: z.object({
    integrationId: uuidSchema,
  }),
  query: z.object({}).optional(),
});

// Job import source query validator (no query params needed)
export const jobImportSourceQueryValidator = z.object({
  params: z.object({
    jobId: uuidSchema,
  }),
  query: z.object({}).optional(),
});

// Candidate import source query validator (no query params needed)
export const candidateImportSourceQueryValidator = z.object({
  params: z.object({
    candidateId: uuidSchema,
  }),
  query: z.object({}).optional(),
});

// Data usage statistics query validator (no query params needed)
export const dataUsageStatisticsQueryValidator = z.object({
  query: z.object({}).optional(),
});

// Disconnect preview query validator (no query params needed)
export const disconnectPreviewQueryValidator = z.object({
  params: z.object({
    integrationId: uuidSchema,
  }),
  query: z.object({}).optional(),
});

// Export all validators grouped by functionality
export const IntegrationCommonValidators = {
  // Parameter validators
  integrationIdParams: integrationIdParamsValidator,
  jobIdParams: jobIdParamsValidator,
  candidateIdParams: candidateIdParamsValidator,

  // Data tracking validators
  dataSummary: integrationDataSummaryQueryValidator,
  dataDetails: integrationDataDetailsQueryValidator,
  jobImportSource: jobImportSourceQueryValidator,
  candidateImportSource: candidateImportSourceQueryValidator,
  usageStatistics: dataUsageStatisticsQueryValidator,

  // Disconnect validators
  disconnect: integrationDisconnectRequestValidator,
  bulkDisconnect: integrationBulkDisconnectRequestValidator,
  disconnectPreview: disconnectPreviewQueryValidator,
};
