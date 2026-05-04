import { z } from 'zod';
import {
  UserRoleEnum,
  UserStatusEnum,
  SupportDepartmentEnum,
} from '../../models/common/enums';
import { paginationValidatorSchema } from '../common/pagination.validator';

// Validator for creating a support user
export const supportUserCreateValidator = z.object({
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
    department: z
      .nativeEnum(SupportDepartmentEnum, {
        message:
          'Invalid department. Must be one of the valid support departments',
      })
      .optional(),
  }),
});

// Validator for updating a support user
export const supportUserUpdateValidator = z.object({
  params: z.object({
    supportUserId: z.string().uuid({ message: 'Invalid user ID format' }),
  }),
  body: z.object({
    email: z
      .string()
      .email({ message: 'Invalid email address format' })
      .max(255, { message: 'Email must be at most 255 characters long' })
      .optional(),
    name: z
      .string()
      .min(2, { message: 'Name must be at least 2 characters long' })
      .max(100, { message: 'Name must be at most 100 characters long' })
      .optional(),
    jobTitle: z
      .string()
      .min(2, { message: 'Job title must be at least 2 characters long' })
      .max(100, { message: 'Job title must be at most 100 characters long' })
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
    department: z
      .nativeEnum(SupportDepartmentEnum, {
        message:
          'Invalid department. Must be one of the valid support departments',
      })
      .optional(),
  }),
});

// Validator for support user ID in route parameters
export const supportUserIdValidator = z.object({
  params: z.object({
    supportUserId: z.string().uuid({ message: 'Invalid user ID format' }),
  }),
});

// Schema for filtering support users
const supportUserFilterSchema = z.object({
  email: z.string().email({ message: 'Invalid email format' }).optional(),
  name: z
    .string()
    .max(100, { message: 'Name must be at most 100 characters long' })
    .optional(),
  role: z
    .string()
    .transform((val) => {
      if (!val) return undefined;
      return val
        .split(',')
        .map((role) => role.trim())
        .filter(Boolean);
    })
    .pipe(z.array(z.nativeEnum(UserRoleEnum)).optional())
    .optional(),
  status: z
    .string()
    .transform((val) => {
      if (!val) return undefined;
      return val
        .split(',')
        .map((status) => status.trim())
        .filter(Boolean);
    })
    .pipe(z.array(z.nativeEnum(UserStatusEnum)).optional())
    .optional(),
  department: z
    .string()
    .transform((val) => {
      if (!val) return undefined;
      return val
        .split(',')
        .map((dept) => dept.trim())
        .filter(Boolean);
    })
    .pipe(z.array(z.nativeEnum(SupportDepartmentEnum)).optional())
    .optional(),
});

// Validator for listing support users with filtering
export const supportUserListValidator = z.object({
  query: z.object({
    ...paginationValidatorSchema.shape,
    ...supportUserFilterSchema.shape,
  }),
});

// Validator for activating/deactivating a support user
export const supportUserActivateDeactivateValidator = z.object({
  params: z.object({
    supportUserId: z.string().uuid({ message: 'Invalid user ID format' }),
  }),
  body: z.object({
    status: z.nativeEnum(UserStatusEnum, {
      message: 'Invalid status. Must be one of the valid user statuses',
    }),
    autoReassign: z
      .boolean({
        message: 'autoReassign must be a boolean value',
      })
      .optional()
      .default(true),
  }),
});

// Validator for changing a support user password
export const supportUserChangePasswordValidator = z.object({
  params: z.object({
    supportUserId: z.string().uuid({ message: 'Invalid user ID format' }),
  }),
  body: z.object({
    currentPassword: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters long' }),
    newPassword: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters long' }),
  }),
});
