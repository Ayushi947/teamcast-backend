import { z } from 'zod';
import {
  UserRoleEnum,
  PartnerUserInvitationStatusEnum,
} from '../../models/common/enums';
import { baseFilterValidatorSchema } from '../common/pagination.validator';

/**
 * Validator for sending a partner user invitation
 */
export const partnerUserInvitationSendValidator = z.object({
  body: z.object({
    email: z
      .string()
      .email({ message: 'Invalid email address format' })
      .max(256, { message: 'Email must be at most 256 characters long' }),
    name: z
      .string()
      .min(1, { message: 'Name is required' })
      .max(256, { message: 'Name must be at most 256 characters long' }),
    jobTitle: z
      .string()
      .max(256, { message: 'Job title must be at most 256 characters long' })
      .optional(),
    role: z.nativeEnum(UserRoleEnum, {
      message: 'Invalid role. Must be one of the valid user roles',
    }),
    partnerId: z.string().uuid({ message: 'Invalid partner ID format' }),
  }),
});

/**
 * Validator for invitation ID parameter
 */
export const partnerInvitationIdValidator = z.object({
  params: z.object({
    partnerUserInvitationId: z
      .string()
      .uuid({ message: 'Invalid invitation ID format' }),
  }),
});

/**
 * Validator for invitation accept token parameter
 */
export const partnerUserInvitationAcceptValidator = z.object({
  params: z.object({
    token: z.string().min(1, { message: 'Token is required' }),
  }),
});

// Partner user invitation filter schema with enhanced search and filtering
const partnerUserInvitationFilterSchema = z.object({
  // Basic string filters
  email: z
    .string()
    .email({ message: 'Invalid email address format' })
    .optional(),
  name: z.string().optional(),
  jobTitle: z.string().optional(),

  role: z
    .union([
      z.nativeEnum(UserRoleEnum),
      z.array(z.nativeEnum(UserRoleEnum)),
      z
        .string()
        .transform((val) =>
          val.split(',').map((v) => v.trim() as UserRoleEnum)
        ),
    ])
    .optional(),
  status: z
    .union([
      z.nativeEnum(PartnerUserInvitationStatusEnum),
      z.array(z.nativeEnum(PartnerUserInvitationStatusEnum)),
      z
        .string()
        .transform((val) =>
          val.split(',').map((v) => v.trim() as PartnerUserInvitationStatusEnum)
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

export const partnerUserInvitationListValidator = z.object({
  query: z.object({
    ...baseFilterValidatorSchema.shape,
    ...partnerUserInvitationFilterSchema.shape,
  }),
});
