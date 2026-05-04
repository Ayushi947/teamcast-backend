import { z } from 'zod';
import { baseFilterValidatorSchema } from '../common/pagination.validator';
import { JobInviteStatusEnum } from '../../models/common/enums';

/**
 * Job posting invite filter schema with enhanced search and filtering
 */
const supportJobPostingInviteFilterSchema = z.object({
  // Basic string filters
  email: z
    .string()
    .email({ message: 'Invalid email address format' })
    .optional(),
  name: z.string().optional(),
  jobId: z.string().uuid({ message: 'Invalid job ID format' }).optional(),

  // Status filter with support for multiple values
  status: z
    .union([
      z.nativeEnum(JobInviteStatusEnum),
      z.array(z.nativeEnum(JobInviteStatusEnum)),
      z
        .string()
        .transform((val) =>
          val.split(',').map((v) => v.trim() as JobInviteStatusEnum)
        ),
    ])
    .optional(),

  // Date range filters for invitation dates
  invitedAfter: z
    .string()
    .datetime({ message: 'Invalid invitedAfter date format' })
    .optional(),
  invitedBefore: z
    .string()
    .datetime({ message: 'Invalid invitedBefore date format' })
    .optional(),
});

/**
 * Validator for listing job posting invites with pagination and filtering
 */
export const supportJobPostingInviteListValidator = z.object({
  query: z.object({
    ...baseFilterValidatorSchema.shape,
    ...supportJobPostingInviteFilterSchema.shape,
  }),
});

/**
 * Validator for creating job posting invites
 */
export const supportJobPostingInviteCreateValidator = z.object({
  body: z.object({
    candidates: z.array(
      z.object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email('Invalid email format'),
      })
    ),
    jobTitle: z.string().min(1, 'Job title is required'),
    jobId: z.string().uuid('Invalid job ID format'),
  }),
});

export const supportJobPostingInviteResendValidator = z.object({
  params: z.object({
    invitationId: z.string().uuid('Invalid invitation ID format'),
  }),
});

export const supportJobPostingInviteWithdrawValidator = z.object({
  params: z.object({
    invitationId: z.string().uuid('Invalid invitation ID format'),
  }),
});
