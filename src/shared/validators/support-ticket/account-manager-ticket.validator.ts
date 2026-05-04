import { z } from 'zod';
import {
  SupportTicketPriorityEnum,
  SupportTicketCategoryEnum,
  SupportTicketTypeEnum,
  SupportTicketStatusEnum,
} from '../../models/common/enums';

// Account Manager Ticket List Validator
export const accountManagerTicketListValidator = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    search: z.string().optional(),
    clientId: z.string().uuid().optional(),
    priority: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .transform((val) => {
        if (!val) return undefined;
        const priorities = Array.isArray(val) ? val : [val];
        return priorities.filter((p) =>
          Object.values(SupportTicketPriorityEnum).includes(
            p as SupportTicketPriorityEnum
          )
        );
      }),
    category: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .transform((val) => {
        if (!val) return undefined;
        const categories = Array.isArray(val) ? val : [val];
        return categories.filter((c) =>
          Object.values(SupportTicketCategoryEnum).includes(
            c as SupportTicketCategoryEnum
          )
        );
      }),
    ticketType: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .transform((val) => {
        if (!val) return undefined;
        const types = Array.isArray(val) ? val : [val];
        return types.filter((t) =>
          Object.values(SupportTicketTypeEnum).includes(
            t as SupportTicketTypeEnum
          )
        );
      }),
    assignedUserId: z.string().uuid().optional(),
    status: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .transform((val) => {
        if (!val) return undefined;
        const statuses = Array.isArray(val) ? val : [val];
        return statuses.filter((s) =>
          Object.values(SupportTicketStatusEnum).includes(
            s as SupportTicketStatusEnum
          )
        );
      }),
    createdFrom: z.string().datetime().optional(),
    createdTo: z.string().datetime().optional(),
  }),
});

// Account Manager Ticket Assignment Validator
export const accountManagerTicketAssignmentValidator = z.object({
  body: z.object({
    ticketId: z.string().uuid('Invalid ticket ID format'),
    assignedUserId: z.string().uuid('Invalid assigned user ID format'),
    internalNote: z.string().optional(),
  }),
});

// Account Manager Ticket Priority Change Validator
export const accountManagerTicketPriorityChangeValidator = z.object({
  body: z.object({
    ticketId: z.string().uuid('Invalid ticket ID format'),
    priority: z.nativeEnum(SupportTicketPriorityEnum, {
      errorMap: () => ({ message: 'Invalid priority value' }),
    }),
    internalNote: z.string().optional(),
  }),
});

// Account Manager Ticket Status Change Validator
export const accountManagerTicketStatusChangeValidator = z.object({
  body: z.object({
    ticketId: z.string().uuid('Invalid ticket ID format'),
    status: z.nativeEnum(SupportTicketStatusEnum, {
      errorMap: () => ({ message: 'Invalid status value' }),
    }),
    internalNote: z.string().optional(),
  }),
});

// Account Manager Ticket Comment Validator
export const accountManagerTicketCommentValidator = z.object({
  body: z.object({
    ticketId: z.string().uuid('Invalid ticket ID format'),
    content: z.string().min(1, 'Comment content is required'),
    isInternal: z.boolean(),
  }),
});
