import { z } from 'zod';

/**
 * Zod schema for support invitation import list query parameters
 */
export const supportInvitationImportListSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
  jobTitle: z.string().optional(),
  location: z.string().optional(),
  skills: z.string().optional(),
  status: z
    .enum([
      'PENDING',
      'PROCESSED',
      'INVITED',
      'DUPLICATE',
      'FAILED',
      'ACCEPTED',
    ])
    .optional(),
});

/**
 * Zod schema for support invitation import statistics query parameters
 */
export const supportInvitationImportStatisticsSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

/**
 * Type definitions for the schemas
 */
export type SupportInvitationImportListQuery = z.infer<
  typeof supportInvitationImportListSchema
>;
export type SupportInvitationImportStatisticsQuery = z.infer<
  typeof supportInvitationImportStatisticsSchema
>;
