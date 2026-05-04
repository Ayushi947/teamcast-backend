import { z } from 'zod';
import { InterviewInvitationStatusEnum } from '../../models/common/enums';

/**
 * Validation schema for interview list query parameters
 */
export const candidateInterviewListQuerySchema = z.object({
  // Pagination parameters
  page: z
    .string()
    .optional()
    .refine((val) => !val || /^\d+$/.test(val), {
      message: 'Page must be a positive integer',
    })
    .transform((val) => (val ? parseInt(val, 10) : undefined)),

  limit: z
    .string()
    .optional()
    .refine((val) => !val || /^\d+$/.test(val), {
      message: 'Limit must be a positive integer',
    })
    .transform((val) => (val ? parseInt(val, 10) : undefined)),

  sortBy: z
    .string()
    .optional()
    .refine(
      (val) =>
        !val ||
        ['createdAt', 'updatedAt', 'scheduledDate', 'status'].includes(val),
      {
        message:
          'Sort by must be one of: createdAt, updatedAt, scheduledDate, status',
      }
    ),

  sortOrder: z.enum(['asc', 'desc']).optional(),

  search: z.string().optional(),

  searchColumns: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (typeof val === 'string') {
        return val.split(',').map((s) => s.trim());
      }
      return val;
    }),

  // Filter parameters
  status: z.nativeEnum(InterviewInvitationStatusEnum).optional(),

  companyName: z.string().min(1, 'Company name cannot be empty').optional(),

  jobPostingTitle: z
    .string()
    .min(1, 'Job posting title cannot be empty')
    .optional(),

  dateFrom: z
    .string()
    .datetime({ message: 'Date from must be a valid ISO date string' })
    .optional(),

  dateTo: z
    .string()
    .datetime({ message: 'Date to must be a valid ISO date string' })
    .optional(),
});

/**
 * Validation schema for interview detail route parameters
 */
export const candidateInterviewDetailParamsSchema = z.object({
  id: z.string().uuid({ message: 'Interview ID must be a valid UUID' }),
});

/**
 * Complete validation schema for interview list endpoint
 */
export const candidateInterviewListValidationSchema = z.object({
  query: candidateInterviewListQuerySchema,
});

/**
 * Complete validation schema for interview detail endpoint
 */
export const candidateInterviewDetailValidationSchema = z.object({
  params: candidateInterviewDetailParamsSchema,
});

/**
 * Type exports for better TypeScript support
 */
export type CandidateInterviewListQuery = z.infer<
  typeof candidateInterviewListQuerySchema
>;
export type CandidateInterviewDetailParams = z.infer<
  typeof candidateInterviewDetailParamsSchema
>;
