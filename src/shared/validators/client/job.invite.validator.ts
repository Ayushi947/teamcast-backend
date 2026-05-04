import { z } from 'zod';
import { JobInviteStatusEnum } from '../../models/common/enums';
import { paginationValidatorSchema } from '../common/pagination.validator';

export const jobInviteCreateValidator = z.object({
  body: z.object({
    candidates: z
      .array(
        z.object({
          name: z.string().min(1, { message: 'Name is required' }),
          email: z.string().email({ message: 'Invalid email address' }),
        })
      )
      .min(1, { message: 'At least one candidate is required' }),
    jobTitle: z.string().min(1, { message: 'Job title is required' }),
    jobId: z.string().uuid({ message: 'Invalid job ID format' }),
    message: z
      .string()
      .max(1000, { message: 'Message must be at most 1000 characters' })
      .optional(),
    expirationDays: z
      .number()
      .int()
      .min(1, { message: 'Expiration days must be at least 1' })
      .max(30, { message: 'Expiration days cannot exceed 30' })
      .optional()
      .default(7),
  }),
});

export const jobInviteTokenValidationValidator = z.object({
  params: z.object({
    token: z.string().uuid({ message: 'Invalid token format' }),
  }),
});

export const jobInviteListValidator = z.object({
  query: paginationValidatorSchema.extend({
    status: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .transform((val) => {
        if (!val) return undefined;
        if (Array.isArray(val)) {
          return val.map((v) => v.trim() as JobInviteStatusEnum);
        }
        return [val.trim() as JobInviteStatusEnum];
      }),
    jobId: z.string().uuid({ message: 'Invalid job ID format' }).optional(),
    startDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid start date format',
      })
      .optional(),
    endDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid end date format',
      })
      .optional(),
  }),
});

export const jobInviteByJobValidator = z.object({
  params: z.object({
    jobPostingId: z.string().uuid({ message: 'Invalid job posting ID format' }),
  }),
  query: paginationValidatorSchema.extend({
    status: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .transform((val) => {
        if (!val) return undefined;
        if (Array.isArray(val)) {
          return val.map((v) => v.trim() as JobInviteStatusEnum);
        }
        return [val.trim() as JobInviteStatusEnum];
      }),
    startDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid start date format',
      })
      .optional(),
    endDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid end date format',
      })
      .optional(),
  }),
});
