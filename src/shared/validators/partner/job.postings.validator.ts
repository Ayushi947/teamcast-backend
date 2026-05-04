import { z } from 'zod';
import {
  WorkTypeEnum,
  CompanyIndustryEnum,
  JobPostingStatusEnum,
} from '../../models/common/enums';
import {
  createRangeValidator,
  createBooleanValidator,
  createStringArrayValidator,
  paginationValidatorSchema,
} from '../common/pagination.validator';

// Job posting filter schema with enhanced search and filtering
const partnerJobPostingFilterSchema = z.object({
  // Basic string filters
  title: z.string().optional(),
  department: z.string().optional(),
  reportingTo: z.string().optional(),
  location: z.string().optional(),

  jobType: z
    .union([
      z.nativeEnum(WorkTypeEnum),
      z.array(z.nativeEnum(WorkTypeEnum)),
      z
        .string()
        .transform((val) =>
          val.split(',').map((v) => v.trim() as WorkTypeEnum)
        ),
    ])
    .optional(),
  industry: z
    .union([
      z.nativeEnum(CompanyIndustryEnum),
      z.array(z.nativeEnum(CompanyIndustryEnum)),
      z
        .string()
        .transform((val) =>
          val.split(',').map((v) => v.trim() as CompanyIndustryEnum)
        ),
    ])
    .optional(),
  status: z
    .union([
      z.nativeEnum(JobPostingStatusEnum),
      z.array(z.nativeEnum(JobPostingStatusEnum)),
      z
        .string()
        .transform((val) =>
          val.split(',').map((v) => v.trim() as JobPostingStatusEnum)
        ),
    ])
    .optional(),

  // Boolean filters
  ...createBooleanValidator('isRemote'),
  ...createBooleanValidator('isFeatured'),
  ...createBooleanValidator('equity'),

  // Range filters
  ...createRangeValidator('experience'),
  ...createRangeValidator('salary'),
  ...createRangeValidator('teamSize'),
  ...createRangeValidator('numberOfOpenings'),

  // Array filters
  ...createStringArrayValidator('skills'),
  ...createStringArrayValidator('requiredSkills'),
  ...createStringArrayValidator('preferredSkills'),
  ...createStringArrayValidator('preferredLocations'),
  ...createStringArrayValidator('preferredIndustries'),
  ...createStringArrayValidator('benefits'),
  ...createStringArrayValidator('tags'),

  // Date range filters for application deadline and availability
  applicationDeadlineAfter: z
    .string()
    .datetime({ message: 'Invalid applicationDeadlineAfter date format' })
    .optional(),
  applicationDeadlineBefore: z
    .string()
    .datetime({ message: 'Invalid applicationDeadlineBefore date format' })
    .optional(),
  availableFromAfter: z
    .string()
    .datetime({ message: 'Invalid availableFromAfter date format' })
    .optional(),
  availableFromBefore: z
    .string()
    .datetime({ message: 'Invalid availableFromBefore date format' })
    .optional(),
});

export const partnerJobPostingsListValidator = z.object({
  query: z.object({
    ...paginationValidatorSchema.shape,
    ...partnerJobPostingFilterSchema.shape,
  }),
});

export const partnerJobPostingDetailsValidator = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Invalid job posting ID format' }),
  }),
});

export const partnerJobApplicationCreateValidator = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Invalid job posting ID format' }),
  }),
  body: z.object({
    candidates: z
      .array(
        z.object({
          candidateId: z.string().uuid({ message: 'Invalid candidate ID' }),
          comment: z.string().max(1000).optional(),
        })
      )
      .min(1, { message: 'At least one candidate is required' }),
  }),
});
