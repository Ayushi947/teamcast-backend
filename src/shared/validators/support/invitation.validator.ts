import { z } from 'zod';
import {
  SupportInvitationTypeEnum,
  SupportInvitationStatusEnum,
  UserRoleEnum,
  SupportDepartmentEnum,
  SupportLevelEnum,
} from '../../models/common/enums';
import { baseFilterValidatorSchema } from '../common/pagination.validator';

/**
 * Validator for sending a support invitation
 */
export const supportInvitationSendValidator = z.object({
  body: z
    .object({
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
      type: z.nativeEnum(SupportInvitationTypeEnum, {
        message:
          'Invalid invitation type. Must be one of the valid support invitation types',
      }),
      clientId: z
        .string()
        .uuid({ message: 'Invalid client ID format' })
        .optional(),
      partnerId: z
        .string()
        .uuid({ message: 'Invalid partner ID format' })
        .optional(),
      companyName: z
        .string()
        .max(256, {
          message: 'Company name must be at most 256 characters long',
        })
        .optional(),
      specialization: z
        .string()
        .max(256, {
          message: 'Specialization must be at most 256 characters long',
        })
        .optional(),
      role: z
        .nativeEnum(UserRoleEnum, {
          message: 'Invalid role. Must be one of the valid user roles',
        })
        .optional(),
      department: z
        .nativeEnum(SupportDepartmentEnum, {
          message:
            'Invalid department. Must be one of the valid support departments',
        })
        .optional(),
      supportLevel: z
        .nativeEnum(SupportLevelEnum, {
          message:
            'Invalid support level. Must be one of the valid support levels',
        })
        .optional(),
      accountManagerId: z
        .string()
        .uuid({ message: 'Invalid account manager ID format' })
        .optional(),
    })
    .refine(
      (data) => {
        // Validate type-specific required fields
        switch (data.type) {
          case SupportInvitationTypeEnum.CLIENT:
            return data.companyName; // Only require companyName, clientId is optional
          case SupportInvitationTypeEnum.PARTNER:
            return data.companyName; // Only require companyName, partnerId is optional
          case SupportInvitationTypeEnum.SUPPORT_USER:
            return data.role; // Only require role, department and supportLevel are optional
          case SupportInvitationTypeEnum.CANDIDATE:
            return true; // No additional required fields
          default:
            return false;
        }
      },
      {
        message: 'Missing required fields for the specified invitation type',
      }
    ),
});

/**
 * Validator for invitation ID in route parameters
 */
export const supportInvitationIdValidator = z.object({
  params: z.object({
    supportInvitationId: z
      .string()
      .uuid({ message: 'Invalid invitation ID format' }),
  }),
});

/**
 * Support invitation filter schema with enhanced search and filtering
 */
const supportInvitationFilterSchema = z.object({
  // Basic string filters
  email: z
    .string()
    .email({ message: 'Invalid email address format' })
    .optional(),
  name: z.string().optional(),
  jobTitle: z.string().optional(),

  // Enum filters with array support
  type: z
    .union([
      z.nativeEnum(SupportInvitationTypeEnum),
      z.array(z.nativeEnum(SupportInvitationTypeEnum)),
      z
        .string()
        .transform((val) =>
          val.split(',').map((v) => v.trim() as SupportInvitationTypeEnum)
        ),
    ])
    .optional(),
  status: z
    .union([
      z.nativeEnum(SupportInvitationStatusEnum),
      z.array(z.nativeEnum(SupportInvitationStatusEnum)),
      z
        .string()
        .transform((val) =>
          val.split(',').map((v) => v.trim() as SupportInvitationStatusEnum)
        ),
    ])
    .optional(),
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
  department: z
    .union([
      z.nativeEnum(SupportDepartmentEnum),
      z.array(z.nativeEnum(SupportDepartmentEnum)),
      z
        .string()
        .transform((val) =>
          val.split(',').map((v) => v.trim() as SupportDepartmentEnum)
        ),
    ])
    .optional(),
  supportLevel: z
    .union([
      z.nativeEnum(SupportLevelEnum),
      z.array(z.nativeEnum(SupportLevelEnum)),
      z
        .string()
        .transform((val) =>
          val.split(',').map((v) => v.trim() as SupportLevelEnum)
        ),
    ])
    .optional(),
});

/**
 * Validator for listing support invitations with filtering
 */
export const supportInvitationListValidator = z.object({
  query: z.object({
    ...baseFilterValidatorSchema.shape,
    ...supportInvitationFilterSchema.shape,
  }),
});

/**
 * Validator for accepting an invitation with a token
 */
export const supportInvitationAcceptValidator = z.object({
  params: z.object({
    token: z.string().min(1, { message: 'Invitation token is required' }),
  }),
});

/**
 * Validator for generating a copied invitation token
 */
export const supportInvitationCopyValidator = z.object({
  params: z.object({
    supportInvitationId: z
      .string()
      .uuid({ message: 'Invalid invitation ID format' }),
  }),
});

/**
 * Validator for generic expire invitation
 */
export const supportGenericInvitationExpireValidator = z.object({
  params: z.object({
    invitationType: z.enum(['support', 'job-posting'], {
      message: 'Invalid invitation type. Must be "support" or "job-posting"',
    }),
  }),
  body: z
    .object({
      isSupportInvite: z.boolean().optional().default(false),
    })
    .optional(),
});
