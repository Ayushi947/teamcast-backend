import { z } from 'zod';
import {
  SupportCandidateTicketCategoryEnum,
  SupportCandidateTicketSubcategoryEnum,
  SupportTicketPriorityEnum,
  SupportTicketEntityTypeEnum,
} from '../../models/common/enums';

/**
 * Validator for creating a candidate support ticket
 */
export const candidateSupportTicketCreateValidator = z.object({
  body: z.object({
    data: z.object({
      title: z
        .string()
        .min(1, 'Title is required')
        .max(255, 'Title must be less than 255 characters'),
      description: z.string().min(1, 'Description is required'),
      category: z.nativeEnum(SupportCandidateTicketCategoryEnum, {
        message:
          'Invalid category. Must be one of the valid candidate support ticket categories',
      }),
      subcategory: z
        .nativeEnum(SupportCandidateTicketSubcategoryEnum, {
          message:
            'Invalid subcategory. Must be one of the valid candidate support ticket subcategories',
        })
        .optional(),
      priority: z
        .nativeEnum(SupportTicketPriorityEnum, {
          message:
            'Invalid priority. Must be one of the valid support ticket priorities',
        })
        .optional(),
      entityType: z
        .nativeEnum(SupportTicketEntityTypeEnum, {
          message:
            'Invalid entity type. Must be one of the valid support ticket entity types',
        })
        .optional(),
      targetId: z
        .string()
        .refine(
          (val) => !val || z.string().uuid().safeParse(val).success,
          'Invalid target ID format - must be a valid UUID or empty'
        )
        .optional(),
      targetType: z.string().optional(),
      metadata: z.record(z.any()).optional(),
    }),
  }),
});

/**
 * Validator for listing candidate support tickets
 */
export const candidateSupportTicketListValidator = z.object({
  params: z.object({
    candidateId: z.string().uuid('Invalid candidate ID format'),
  }),
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    status: z.array(z.string()).optional(),
    priority: z.array(z.string()).optional(),
    category: z.array(z.string()).optional(),
    subcategory: z.array(z.string()).optional(),
    ticketType: z.array(z.string()).optional(),
    createdFrom: z.string().datetime().optional(),
    createdTo: z.string().datetime().optional(),
  }),
});

/**
 * Validator for candidate support ticket ID parameter
 */
export const candidateSupportTicketIdValidator = z.object({
  params: z.object({
    candidateId: z.string().uuid('Invalid candidate ID format'),
    ticketId: z.string().uuid('Invalid ticket ID format'),
  }),
});
