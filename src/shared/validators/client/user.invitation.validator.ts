import { z } from 'zod';
import {
  UserRoleEnum,
  ClientUserInvitationStatusEnum,
} from '../../models/common/enums';

/**
 * Validator for sending a client user invitation
 */
export const clientUserInvitationSendValidator = z.object({
  body: z.object({
    email: z
      .string()
      .email({ message: 'Invalid email address format' })
      .max(255, { message: 'Email must be at most 255 characters long' }),
    name: z
      .string()
      .min(2, { message: 'Name must be at least 2 characters long' })
      .max(100, { message: 'Name must be at most 100 characters long' }),
    jobTitle: z
      .string()
      .min(2, { message: 'Job title must be at least 2 characters long' })
      .max(100, { message: 'Job title must be at most 100 characters long' })
      .optional(),
    role: z.nativeEnum(UserRoleEnum, {
      message: 'Invalid role. Must be one of the valid user roles',
    }),
  }),
});

/**
 * Validator for invitation ID in route parameters
 */
export const invitationIdValidator = z.object({
  params: z.object({
    clientUserInvitationId: z
      .string()
      .uuid({ message: 'Invalid invitation ID format' }),
  }),
});

/**
 * Validator for listing client user invitations with filtering
 */
export const clientUserInvitationListValidator = z.object({
  query: z.object({
    page: z
      .string()
      .regex(/^\d+$/, { message: 'Page must be a number' })
      .transform(Number)
      .optional(),
    limit: z
      .string()
      .regex(/^\d+$/, { message: 'Limit must be a number' })
      .transform(Number)
      .optional(),
    sortBy: z.string().optional(),
    sortOrder: z
      .enum(['asc', 'desc'], {
        message: "Sort order must be either 'asc' or 'desc'",
      })
      .optional(),
    search: z
      .string()
      .max(256, {
        message: 'Search term must be at most 256 characters long',
      })
      .optional(),
    email: z.string().email().optional(),
    name: z.string().optional(),
    role: z.nativeEnum(UserRoleEnum).optional(),
    status: z.nativeEnum(ClientUserInvitationStatusEnum).optional(),
  }),
});

/**
 * Validator for accepting an invitation with a token
 */
export const clientUserInvitationAcceptValidator = z.object({
  params: z.object({
    token: z.string().min(1, { message: 'Invitation token is required' }),
  }),
});
