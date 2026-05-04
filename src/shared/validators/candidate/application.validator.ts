import { z } from 'zod';
import { ApplicationStatusEnum } from '../../models/common/enums';
import { paginationValidatorSchema } from '../common/pagination.validator';

// Common notes schema
const notesSchema = z
  .string()
  .max(1000, { message: 'Notes must be at most 1000 characters long' })
  .optional();

// Update schema for job application
export const candidateJobApplicationUpdateValidator = z.object({
  status: z
    .nativeEnum(ApplicationStatusEnum, {
      errorMap: () => ({ message: 'Invalid application status' }),
    })
    .optional(),
  notes: notesSchema,
  coverLetterUrl: z
    .string()
    .url({ message: 'Cover letter URL must be a valid URL' })
    .optional(),
});

// Accept schema for job application
export const candidateJobApplicationAcceptValidator = z.object({
  notes: notesSchema,
});

// Reject schema for job application
export const candidateJobApplicationRejectValidator = z.object({
  notes: notesSchema,
});

// Withdraw schema for job application
export const candidateJobApplicationWithdrawValidator = z.object({
  notes: notesSchema,
});

// Enhanced filter schema for job applications list with comprehensive filtering
const candidateJobApplicationFilterSchema = z.object({
  search: z
    .string()
    .max(500, { message: 'Search term must be at most 500 characters long' })
    .optional(),
  searchColumns: z
    .array(z.string())
    .max(10, { message: 'Cannot search in more than 10 columns' })
    .optional(),
  status: z
    .union([
      z.nativeEnum(ApplicationStatusEnum),
      z.array(z.nativeEnum(ApplicationStatusEnum)),
      z
        .string()
        .transform((val) => val.split(',').map((s) => s.trim()))
        .pipe(z.array(z.nativeEnum(ApplicationStatusEnum))),
    ])
    .optional(),
  jobTitle: z
    .string()
    .max(200, { message: 'Job title must be at most 200 characters long' })
    .optional(),
  company: z
    .string()
    .max(200, { message: 'Company name must be at most 200 characters long' })
    .optional(),
  industry: z
    .string()
    .max(100, { message: 'Industry must be at most 100 characters long' })
    .optional(),
  location: z
    .string()
    .max(200, { message: 'Location must be at most 200 characters long' })
    .optional(),
  jobType: z
    .union([
      z.string(),
      z.array(z.string()),
      z.string().transform((val) => val.split(',').map((s) => s.trim())),
    ])
    .optional(),
  minSalary: z
    .union([z.number(), z.string().transform((val) => parseFloat(val))])
    .pipe(z.number().min(0, { message: 'Minimum salary must be at least 0' }))
    .optional(),
  maxSalary: z
    .union([z.number(), z.string().transform((val) => parseFloat(val))])
    .pipe(z.number().min(0, { message: 'Maximum salary must be at least 0' }))
    .optional(),
  salaryCurrency: z
    .string()
    .length(3, { message: 'Currency code must be 3 characters' })
    .optional(),
  appliedAfter: z
    .union([z.date(), z.string().transform((val) => new Date(val))])
    .optional(),
  appliedBefore: z
    .union([z.date(), z.string().transform((val) => new Date(val))])
    .optional(),
  createdAfter: z
    .union([z.date(), z.string().transform((val) => new Date(val))])
    .optional(),
  createdBefore: z
    .union([z.date(), z.string().transform((val) => new Date(val))])
    .optional(),
  updatedAfter: z
    .union([z.date(), z.string().transform((val) => new Date(val))])
    .optional(),
  updatedBefore: z
    .union([z.date(), z.string().transform((val) => new Date(val))])
    .optional(),
});

// List schema for job applications with pagination and enhanced filtering
export const candidateJobApplicationListValidator = z.object({
  query: z.object({
    ...paginationValidatorSchema.shape,
    ...candidateJobApplicationFilterSchema.shape,
  }),
});
