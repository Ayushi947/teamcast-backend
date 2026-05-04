import { UserRoleEnum, UserStatusEnum } from '../../models/common/enums';
import { z } from 'zod';
import {
  baseFilterValidatorSchema,
  createBooleanValidator,
} from '../common/pagination.validator';

export const partnerUserCreateValidator = z.object({
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
    status: z.nativeEnum(UserStatusEnum, {
      message: 'Invalid status. Must be one of the valid user statuses',
    }),
    profilePicture: z.string().url().optional(),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters long' })
      .optional(),
  }),
});

export const partnerUserUpdateValidator = z.object({
  params: z.object({
    partnerUserId: z
      .string()
      .uuid({ message: 'Invalid partner user ID format' }),
  }),
  body: z.object({
    email: z
      .string()
      .email({ message: 'Invalid email address format' })
      .max(256, { message: 'Email must be at most 256 characters long' })
      .optional(),
    name: z
      .string()
      .min(1, { message: 'Name is required' })
      .max(256, { message: 'Name must be at most 256 characters long' })
      .optional(),
    jobTitle: z
      .string()
      .max(256, { message: 'Job title must be at most 256 characters long' })
      .optional(),
    role: z
      .nativeEnum(UserRoleEnum, {
        message: 'Invalid role. Must be one of the valid user roles',
      })
      .optional(),
    status: z
      .nativeEnum(UserStatusEnum, {
        message: 'Invalid status. Must be one of the valid user statuses',
      })
      .optional(),
    profilePicture: z.string().url().optional(),
  }),
});

export const partnerUserIdValidator = z.object({
  params: z.object({
    partnerUserId: z
      .string()
      .uuid({ message: 'Invalid partner user ID format' }),
  }),
});

export const partnerUserActivateDeactivateValidator = z.object({
  params: z.object({
    partnerUserId: z
      .string()
      .uuid({ message: 'Invalid partner user ID format' }),
  }),
  body: z.object({
    status: z.nativeEnum(UserStatusEnum, {
      message: 'Invalid status. Must be one of the valid user statuses',
    }),
  }),
});

// Partner user filter schema with enhanced search and filtering
const partnerUserFilterSchema = z.object({
  // Basic string filters
  email: z
    .string()
    .email({ message: 'Invalid email address format' })
    .optional(),
  name: z.string().optional(),
  jobTitle: z.string().optional(),

  // Enum filters with multi-select support
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
      z.nativeEnum(UserStatusEnum),
      z.array(z.nativeEnum(UserStatusEnum)),
      z
        .string()
        .transform((val) =>
          val.split(',').map((v) => v.trim() as UserStatusEnum)
        ),
    ])
    .optional(),

  // Boolean filters
  ...createBooleanValidator('hasProfilePicture'),
});

export const partnerUserListValidator = z.object({
  query: z.object({
    ...baseFilterValidatorSchema.shape,
    ...partnerUserFilterSchema.shape,
  }),
});
