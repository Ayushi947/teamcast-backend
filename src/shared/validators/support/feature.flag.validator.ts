import { z } from 'zod';
import {
  FeatureFlagCategoryEnum,
  UserTypeEnum,
  UserRoleEnum,
} from '../../models/common/enums';

export const featureFlagCreateValidator = z.object({
  body: z.object({
    data: z.object({
      key: z
        .string()
        .min(1, 'Key is required')
        .regex(
          /^[A-Z_]+$/,
          'Key must be uppercase letters and underscores only'
        ),
      name: z.string().min(1, 'Name is required'),
      description: z.string().optional(),
      enabled: z.boolean().optional().default(false),
      category: z
        .nativeEnum(FeatureFlagCategoryEnum)
        .optional()
        .default(FeatureFlagCategoryEnum.SYSTEM),
      targetUserType: z.nativeEnum(UserTypeEnum).optional(),
      targetUserRole: z.nativeEnum(UserRoleEnum).optional(),
      clientId: z.string().uuid().optional(),
      rolloutPercentage: z
        .number()
        .int()
        .min(0)
        .max(100)
        .optional()
        .default(100),
      metadata: z.any().optional(),
    }),
  }),
});

export const featureFlagUpdateValidator = z.object({
  body: z.object({
    data: z.object({
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      enabled: z.boolean().optional(),
      category: z.nativeEnum(FeatureFlagCategoryEnum).optional(),
      targetUserType: z.nativeEnum(UserTypeEnum).nullable().optional(),
      targetUserRole: z.nativeEnum(UserRoleEnum).nullable().optional(),
      clientId: z.string().uuid().nullable().optional(),
      rolloutPercentage: z.number().int().min(0).max(100).optional(),
      metadata: z.any().optional(),
    }),
  }),
});

export const featureFlagCopyToClientsValidator = z.object({
  body: z.object({
    clientIds: z
      .array(z.string().uuid())
      .min(1, 'At least one client is required'),
  }),
});
