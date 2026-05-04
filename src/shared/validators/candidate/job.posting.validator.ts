import { z } from 'zod';
import {
  WorkTypeEnum,
  WorkCommitmentEnum,
  WorkScheduleEnum,
  CompanyIndustryEnum,
} from '../../models/common/enums';
import { paginationValidatorSchema } from '../common/pagination.validator';

// Common notes schema
const notesSchema = z
  .string()
  .max(1000, { message: 'Notes must be at most 1000 characters long' })
  .optional();

// Apply schema for job posting
export const candidateJobPostingApplyValidator = z.object({
  notes: notesSchema,
  coverLetterUrl: z
    .string()
    .url({ message: 'Cover letter URL must be a valid URL' })
    .optional(),
});

// Filter schema for job postings list
const candidateJobPostingFilterSchema = z.object({
  jobType: z
    .nativeEnum(WorkTypeEnum, {
      errorMap: () => ({ message: 'Invalid job type' }),
    })
    .optional(),
  jobCommitment: z
    .nativeEnum(WorkCommitmentEnum, {
      errorMap: () => ({ message: 'Invalid job commitment' }),
    })
    .optional(),
  jobSchedule: z
    .nativeEnum(WorkScheduleEnum, {
      errorMap: () => ({ message: 'Invalid job schedule' }),
    })
    .optional(),
  industry: z
    .nativeEnum(CompanyIndustryEnum, {
      errorMap: () => ({ message: 'Invalid industry' }),
    })
    .optional(),
  isRemote: z.boolean().optional(),
  minExperience: z
    .number()
    .int()
    .min(0, { message: 'Minimum experience must be at least 0' })
    .optional(),
  maxExperience: z
    .number()
    .int()
    .min(0, { message: 'Maximum experience must be at least 0' })
    .optional(),
  minSalary: z
    .number()
    .min(0, { message: 'Minimum salary must be at least 0' })
    .optional(),
  maxSalary: z
    .number()
    .min(0, { message: 'Maximum salary must be at least 0' })
    .optional(),
  salaryCurrency: z
    .string()
    .max(3, { message: 'Salary currency must be at most 3 characters long' })
    .optional(),
  skills: z
    .array(
      z
        .string()
        .max(100, { message: 'Skill must be at most 100 characters long' })
    )
    .optional(),
  company: z
    .string()
    .max(100, { message: 'Company name must be at most 100 characters long' })
    .optional(),
});

// List schema for job postings with pagination
export const candidateJobPostingListValidator = z.object({
  query: z.object({
    ...paginationValidatorSchema.shape,
    ...candidateJobPostingFilterSchema.shape,
  }),
});
