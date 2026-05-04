import { LookupStatus } from '../../models/common/enums';
import { z } from 'zod';

export const lookupCategoryCreateValidator = z.object({
  body: z
    .object({
      name: z
        .string()
        .min(1, 'Category name is required')
        .max(100, 'Category name must be less than 100 characters')
        .regex(
          /^[a-z0-9_]+$/,
          'Category name must contain only lowercase letters, numbers, and underscores'
        )
        .transform((val) => val.toLowerCase().trim()),
      label: z
        .string()
        .min(1, 'Category label is required')
        .max(200, 'Category label must be less than 200 characters')
        .transform((val) => val.trim()),
      status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE').optional(),
    })
    .strict(),
});

export const lookupCategoryGetByIdValidator = z.object({
  params: z
    .object({
      id: z.string().uuid({ message: 'Category ID must be a valid UUID' }),
    })
    .strict(),
});

export const lookupCategoryDeleteValidator = z.object({
  params: z
    .object({
      id: z.string().uuid({ message: 'Category ID must be a valid UUID' }),
    })
    .strict(),
});

export const lookupValueCreateValidator = z.object({
  body: z
    .object({
      label: z
        .string()
        .trim()
        .min(1, { message: 'Lookup value label is required' })
        .max(200, {
          message: 'Lookup value label must not exceed 200 characters',
        }),
      lookupCategoryId: z
        .string()
        .uuid({ message: 'Lookup category ID must be a valid UUID' }),
      status: z
        .nativeEnum(LookupStatus)
        .optional()
        .default(LookupStatus.ACTIVE),
    })
    .strict(),
});

export const lookupValueDeleteValidator = z.object({
  params: z
    .object({
      id: z.string().uuid({ message: 'Lookup value ID must be a valid UUID' }),
    })
    .strict(),
});

export const lookupValuesByCategoriesValidator = z.object({
  query: z.object({
    categories: z
      .string()
      .min(1, { message: 'At least one category name is required' })
      .transform((val) =>
        val.split(',').map((name) => name.trim().toLowerCase())
      ),
  }),
});

export const lookupTimezonesByCountryValidator = z.object({
  query: z.object({
    country: z
      .string()
      .length(2, {
        message: 'Country code must be 2 letters (ISO 3166-1 alpha-2)',
      })
      .regex(/^[A-Za-z]{2}$/, {
        message: 'Country code must be alphabetic (ISO 3166-1 alpha-2)',
      })
      .transform((val) => val.toUpperCase()),
  }),
});
