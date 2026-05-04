import { z } from 'zod';
import {
  SupportTicketEntityTypeEnum,
  SupportTicketCategoryEnum,
  SupportTicketPriorityEnum,
} from '../../models/common/enums';

/**
 * SLA Policy Validation Rules
 */

// Create SLA Policy Validation
export const createSlaPolicyValidation = z.object({
  body: z.object({
    data: z.object({
      name: z.string().min(1).max(255),
      description: z.string().max(1000).optional(),
      entityType: z.nativeEnum(SupportTicketEntityTypeEnum),
      category: z.nativeEnum(SupportTicketCategoryEnum),
      priority: z.nativeEnum(SupportTicketPriorityEnum),
      responseTime: z.number().int().min(1),
      resolutionTime: z.number().int().min(1),
      escalationTime: z.number().int().min(1).optional(),
      businessHoursOnly: z.boolean().optional(),
      workingDaysOnly: z.boolean().optional(),
      excludeHolidays: z.boolean().optional(),
      isActive: z.boolean().optional(),
      isDefault: z.boolean().optional(),
    }),
  }),
});

// Update SLA Policy Validation
export const updateSlaPolicyValidation = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    data: z.object({
      name: z.string().min(1).max(255).optional(),
      description: z.string().max(1000).optional(),
      entityType: z.nativeEnum(SupportTicketEntityTypeEnum).optional(),
      category: z.nativeEnum(SupportTicketCategoryEnum).optional(),
      priority: z.nativeEnum(SupportTicketPriorityEnum).optional(),
      responseTime: z.number().int().min(1).optional(),
      resolutionTime: z.number().int().min(1).optional(),
      escalationTime: z.number().int().min(1).optional(),
      businessHoursOnly: z.boolean().optional(),
      workingDaysOnly: z.boolean().optional(),
      excludeHolidays: z.boolean().optional(),
      isActive: z.boolean().optional(),
      isDefault: z.boolean().optional(),
    }),
  }),
});

// Get SLA Policy by ID Validation
export const getSlaPolicyByIdValidation = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

// Delete SLA Policy Validation
export const deleteSlaPolicyValidation = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

// List SLA Policies Validation
export const listSlaPoliciesValidation = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 1)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 20)),
    'filters[entityType]': z.string().optional(),
    'filters[category]': z.string().optional(),
    'filters[priority]': z.string().optional(),
    'filters[isActive]': z
      .string()
      .optional()
      .transform((val) => val === 'true'),
    'filters[isDefault]': z
      .string()
      .optional()
      .transform((val) => val === 'true'),
    'filters[search]': z.string().max(255).optional(),
    'sort[field]': z
      .enum([
        'name',
        'createdAt',
        'updatedAt',
        'responseTime',
        'resolutionTime',
      ])
      .optional(),
    'sort[direction]': z.enum(['asc', 'desc']).optional(),
  }),
});

// Find Matching SLA Policy Validation
export const findMatchingSlaPolicyValidation = z.object({
  body: z.object({
    data: z.object({
      entityType: z.nativeEnum(SupportTicketEntityTypeEnum),
      category: z.nativeEnum(SupportTicketCategoryEnum),
      priority: z.nativeEnum(SupportTicketPriorityEnum),
    }),
  }),
});
