import { z } from 'zod';
import {
  WorkTypeEnum,
  WorkCommitmentEnum,
  WorkScheduleEnum,
  CompanyIndustryEnum,
  JobPostingStatusEnum,
} from '../../models/common/enums';
import { paginationValidatorSchema } from '../common/pagination.validator';

const jobPostingSchema = z.object({
  title: z
    .string()
    .min(2, { message: 'Title must be at least 2 characters long' })
    .max(100, { message: 'Title must be at most 100 characters long' }),
  description: z
    .string()
    .min(10, { message: 'Description must be at least 10 characters long' })
    .max(5000, {
      message: 'Description must be at most 5000 characters long',
    }),
  jobType: z.nativeEnum(WorkTypeEnum, {
    message: 'Invalid job type. Must be one of the valid work types',
  }),
  jobCommitment: z.nativeEnum(WorkCommitmentEnum, {
    message:
      'Invalid job commitment. Must be one of the valid work commitments',
  }),
  jobSchedule: z.nativeEnum(WorkScheduleEnum, {
    message: 'Invalid job schedule. Must be one of the valid work schedules',
  }),
  industry: z
    .nativeEnum(CompanyIndustryEnum, {
      message: 'Invalid industry. Must be one of the valid industries',
    })
    .optional(),
  totalExperience: z
    .number()
    .min(0, { message: 'Total experience must be at least 0' })
    .max(50, { message: 'Total experience must be at most 50 years' }),
  department: z
    .string()
    .min(2, { message: 'Department must be at least 2 characters long' })
    .max(100, { message: 'Department must be at most 100 characters long' })
    .optional(),
  teamSize: z
    .number()
    .min(0, { message: 'Team size must be at least 0' })
    .optional(),
  reportingTo: z
    .string()
    .max(100, { message: 'Reporting to must be at most 100 characters long' })
    .optional(),
  hiring_manager_email: z
    .string()
    .email({ message: 'Hiring manager email must be a valid email address' })
    .optional(),
  applicationDeadline: z
    .union([z.string().transform((str) => new Date(str)), z.date()])
    .refine((date) => !isNaN(date.getTime()), {
      message: 'Application deadline must be a valid date',
    })
    .optional(),
  availableFrom: z
    .union([z.string().transform((str) => new Date(str)), z.date()])
    .refine((date) => !isNaN(date.getTime()), {
      message: 'Available from must be a valid date',
    })
    .optional(),
  numberOfOpenings: z
    .number()
    .min(1, { message: 'Number of openings must be at least 1' })
    .max(1000, { message: 'Number of openings must be at most 1000' }),
  applicationUrl: z.string().optional(),
  isFeatured: z.boolean().optional(),
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
    .length(3, { message: 'Salary currency must be 3 characters long' }),
  equity: z.boolean().optional(),
  responsibilities: z
    .array(z.string())
    .min(1, { message: 'At least one responsibility is required' })
    .max(50, { message: 'Maximum 50 responsibilities allowed' }),
  benefits: z.array(z.string()).optional(),
  tags: z
    .array(z.string())
    .max(20, { message: 'Maximum 20 tags allowed' })
    .optional(),
  isRemote: z.boolean().optional(),
  preferredUniversities: z.array(z.string()).optional(),
  preferredDegrees: z.array(z.string()).optional(),
  preferredLocations: z
    .array(z.string())
    .min(1, { message: 'At least one preferred location is required' })
    .max(10, { message: 'Maximum 10 preferred locations allowed' }),
  preferredIndustries: z.array(z.string()).optional(),
  requiredSkills: z
    .array(z.string())
    .min(1, { message: 'At least one required skill is required' })
    .max(50, { message: 'Maximum 50 required skills allowed' }),
  preferredSkills: z.array(z.string()).optional(),
});

// Validator for creating a job posting
export const clientJobPostingCreateValidator = z.object({
  body: jobPostingSchema,
});

// Validator for updating a job posting
export const clientJobPostingUpdateValidator = z.object({
  params: z.object({
    jobPostingId: z.string().uuid({ message: 'Invalid job posting ID format' }),
  }),
  body: jobPostingSchema.partial(),
});

// Validator for updating job posting skills
export const clientJobPostingSkillsUpdateValidator = z.object({
  params: z.object({
    jobPostingId: z.string().uuid({ message: 'Invalid job posting ID format' }),
  }),
  body: z.object({
    requiredSkills: z
      .array(z.string())
      .min(1, { message: 'At least one required skill is required' })
      .max(50, { message: 'Maximum 50 required skills allowed' })
      .optional(),
    preferredSkills: z
      .array(z.string())
      .max(50, { message: 'Maximum 50 preferred skills allowed' })
      .optional(),
  }),
});

// Validator for updating job posting status
export const clientJobPostingStatusUpdateValidator = z.object({
  params: z.object({
    jobPostingId: z.string().uuid({ message: 'Invalid job posting ID format' }),
  }),
  body: z.object({
    status: z.nativeEnum(JobPostingStatusEnum, {
      message: 'Invalid status. Must be one of the valid job posting statuses',
    }),
  }),
});

// Validator for job posting ID in route parameters
export const clientJobPostingIdValidator = z.object({
  params: z.object({
    jobPostingId: z.string().uuid({ message: 'Invalid job posting ID format' }),
  }),
});

// Validator for listing job postings with filtering
export const clientJobPostingListValidator = z.object({
  query: z.object({
    ...paginationValidatorSchema.shape,
    title: z.string().optional(),
    jobType: z.nativeEnum(WorkTypeEnum).optional(),
    industry: z.nativeEnum(CompanyIndustryEnum).optional(),
    status: z.nativeEnum(JobPostingStatusEnum).optional(),
    isRemote: z
      .string()
      .transform((val) => val === 'true')
      .optional(),
    minSalary: z
      .string()
      .regex(/^\d+$/, { message: 'Minimum salary must be a number' })
      .transform(Number)
      .optional(),
    maxSalary: z
      .string()
      .regex(/^\d+$/, { message: 'Maximum salary must be a number' })
      .transform(Number)
      .optional(),
    requiredSkills: z
      .string()
      .transform((val) => val.split(','))
      .optional(),
  }),
});

// Validator for job posting invite endpoint
export const clientJobPostingInviteValidator = z.object({
  params: z.object({
    jobPostingId: z.string().uuid({ message: 'Invalid job posting ID format' }),
  }),
  body: z.object({
    candidateId: z.string().uuid({ message: 'Invalid candidate ID format' }),
    message: z
      .string()
      .max(1000, {
        message: 'Message must be at most 1000 characters long',
      })
      .optional(),
  }),
});

export const clientJobAiAssessmentSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  assessmentDuration: z
    .number()
    .min(10 * 60, {
      message: 'Assessment duration must be at least 10 minutes',
    })
    .max(120 * 60, {
      message: 'Assessment duration must be at most 120 minutes',
    })
    .optional(),
  useCustomPrompts: z.boolean().optional(),
  technicalAssessmentEnabled: z.boolean().optional(),
  behavioralAssessmentEnabled: z.boolean().optional(),
  culturalFitAssessmentEnabled: z.boolean().optional(),
  aiDifficulty: z
    .enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT'], {
      message: 'Invalid difficulty level',
    })
    .optional(),
  requiredSkills: z
    .array(z.string())
    .min(1, { message: 'At least one required skill is required' })
    .max(50, { message: 'Maximum 50 required skills allowed' })
    .optional(),
  customPrompts: z.record(z.any()).optional(),
  skillWeightings: z.record(z.any()).optional(),
  passThreshold: z
    .number()
    .min(0, { message: 'Pass threshold must be at least 0' })
    .max(1, { message: 'Pass threshold must be at most 1' })
    .optional(),
});

// Validator for job AI assessment settings update
export const clientJobAiAssessmentSettingsUpdateValidator = z.object({
  params: z.object({
    jobPostingId: z.string().uuid({ message: 'Invalid job posting ID format' }),
  }),
  body: clientJobAiAssessmentSettingsSchema.partial(),
});
