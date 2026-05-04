import { z } from 'zod';
import { UserRoleEnum, UserStatusEnum } from '../../models/common/enums';
import { paginationValidatorSchema } from '../common/pagination.validator';
// Validator for creating a client user
export const clientUserCreateValidator = z.object({
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
    status: z.nativeEnum(UserStatusEnum, {
      message: 'Invalid status. Must be one of the valid user statuses',
    }),
    clientId: z.string().uuid({ message: 'Invalid client ID format' }),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters long' })
      .optional(),
  }),
});

// Validator for updating a client user
export const clientUserUpdateValidator = z.object({
  params: z.object({
    clientUserId: z.string().uuid({ message: 'Invalid user ID format' }),
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
  }),
});

// Validator for client user ID in route parameters
export const clientUserIdValidator = z.object({
  params: z.object({
    clientUserId: z.string().uuid({ message: 'Invalid user ID format' }),
  }),
});

// Schema for filtering client users
const clientUserFilterSchema = z.object({
  email: z.string().email({ message: 'Invalid email format' }).optional(),
  name: z
    .string()
    .max(100, { message: 'Name must be at most 100 characters long' })
    .optional(),
  role: z
    .preprocess(
      (val) => {
        // Handle comma-separated string: "ADMIN,HR"
        if (typeof val === 'string' && val.includes(',')) {
          return val.split(',').map((v) => v.trim());
        }
        return val;
      },
      z.union([
        z.nativeEnum(UserRoleEnum), // single role
        z.array(z.nativeEnum(UserRoleEnum)), // multiple roles
      ])
    )
    .optional(),
  status: z
    .preprocess(
      (val) => {
        // Handle comma-separated string: "ACTIVE,INACTIVE"
        if (typeof val === 'string' && val.includes(',')) {
          return val.split(',').map((v) => v.trim());
        }
        return val;
      },
      z.union([
        z.nativeEnum(UserStatusEnum), // single status
        z.array(z.nativeEnum(UserStatusEnum)), // multiple statuses
      ])
    )
    .optional(),
});

// Validator for listing client users with filtering
export const clientUserListValidator = z.object({
  query: z.object({
    ...paginationValidatorSchema.shape,
    ...clientUserFilterSchema.shape,
  }),
});

// Validator for activating/deactivating a client user
export const clientUserActivateDeactivateValidator = z.object({
  params: z.object({
    clientUserId: z.string().uuid({ message: 'Invalid user ID format' }),
  }),
  body: z.object({
    status: z.nativeEnum(UserStatusEnum, {
      message: 'Invalid status. Must be one of the valid user statuses',
    }),
  }),
});
