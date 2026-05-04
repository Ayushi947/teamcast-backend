import { z } from 'zod';

// Base pagination schema
export const paginationValidatorSchema = z.object({
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
});

// Base search schema
export const baseSearchValidatorSchema = z.object({
  search: z
    .string()
    .max(256, {
      message: 'Search term must be at most 256 characters long',
    })
    .optional(),
  searchColumns: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => (Array.isArray(val) ? val : val ? [val] : undefined))
    .optional(),
});

// Base date range filter schema
export const baseDateRangeValidatorSchema = z.object({
  createdAfter: z
    .string()
    .datetime({ message: 'Invalid createdAfter date format' })
    .optional(),
  createdBefore: z
    .string()
    .datetime({ message: 'Invalid createdBefore date format' })
    .optional(),
  updatedAfter: z
    .string()
    .datetime({ message: 'Invalid updatedAfter date format' })
    .optional(),
  updatedBefore: z
    .string()
    .datetime({ message: 'Invalid updatedBefore date format' })
    .optional(),
});

// Combined base filter schema that includes pagination, search, and date ranges
export const baseFilterValidatorSchema = z.object({
  ...paginationValidatorSchema.shape,
  ...baseSearchValidatorSchema.shape,
  ...baseDateRangeValidatorSchema.shape,
});

// Helper function to create range validators
export const createRangeValidator = (fieldName: string) => ({
  [`min${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`]: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(0))
    .optional(),
  [`max${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`]: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(0))
    .optional(),
});

// Helper function to create boolean validators
export const createBooleanValidator = (fieldName: string) => ({
  [fieldName]: z
    .string()
    .transform((val) => val === 'true')
    .pipe(z.boolean())
    .optional(),
});

// Helper function to create enum validators with multi-select support
export const createEnumValidator = <T extends Record<string, string>>(
  enumObject: T,
  fieldName: string
) => ({
  [fieldName]: z
    .union([z.nativeEnum(enumObject), z.array(z.nativeEnum(enumObject))])
    .optional(),
});

// Helper function to create string array validators
export const createStringArrayValidator = (fieldName: string) => ({
  [fieldName]: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => (Array.isArray(val) ? val : val ? [val] : undefined))
    .optional(),
});
