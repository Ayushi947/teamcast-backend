import {
  CandidateStatusEnum,
  CandidateAssessmentStageEnum,
  CandidateJobSearchStatusEnum,
  SexEnum,
  MaritalStatusEnum,
} from '../../models/common/enums';
import { z } from 'zod';
import {
  baseFilterValidatorSchema,
  createRangeValidator,
  createBooleanValidator,
  createStringArrayValidator,
} from '../common/pagination.validator';

export const partnerCandidateUpdateValidator = z.object({
  params: z.object({
    candidateId: z.string().uuid({ message: 'Invalid candidate ID format' }),
  }),
  body: z.object({
    status: z
      .nativeEnum(CandidateStatusEnum, {
        message: 'Invalid status. Must be one of the valid candidate statuses',
      })
      .optional(),
    assessmentStage: z
      .nativeEnum(CandidateAssessmentStageEnum, {
        message:
          'Invalid assessment stage. Must be one of the valid assessment stages',
      })
      .optional(),
    jobSearchStatus: z
      .nativeEnum(CandidateJobSearchStatusEnum, {
        message:
          'Invalid job search status. Must be one of the valid job search statuses',
      })
      .optional(),
    sex: z
      .nativeEnum(SexEnum, {
        message: 'Invalid sex. Must be one of the valid sex options',
      })
      .optional(),
    birthDate: z
      .string()
      .datetime({ message: 'Invalid birth date format' })
      .optional(),
    maritalStatus: z
      .nativeEnum(MaritalStatusEnum, {
        message:
          'Invalid marital status. Must be one of the valid marital statuses',
      })
      .optional(),
  }),
});

export const partnerCandidateIdValidator = z.object({
  params: z.object({
    candidateId: z.string().uuid({ message: 'Invalid candidate ID format' }),
  }),
});

const partnerCandidateFilterSchema = z.object({
  // Basic string filters
  email: z
    .string()
    .email({ message: 'Invalid email address format' })
    .optional(),
  name: z.string().optional(),
  jobTitle: z.string().optional(),
  company: z.string().optional(),
  industry: z.string().optional(),
  location: z.string().optional(),

  // Array filters using helper
  ...createStringArrayValidator('skills'),
  ...createStringArrayValidator('industries'),
  ...createStringArrayValidator('languages'),

  // Enum filters with multi-select support
  status: z
    .union([
      z.nativeEnum(CandidateStatusEnum),
      z.array(z.nativeEnum(CandidateStatusEnum)),
      z
        .string()
        .transform((val) =>
          val.split(',').map((v) => v.trim() as CandidateStatusEnum)
        ),
    ])
    .optional(),
  assessmentStage: z
    .union([
      z.nativeEnum(CandidateAssessmentStageEnum),
      z.array(z.nativeEnum(CandidateAssessmentStageEnum)),
      z
        .string()
        .transform((val) =>
          val.split(',').map((v) => v.trim() as CandidateAssessmentStageEnum)
        ),
    ])
    .optional(),
  jobSearchStatus: z
    .union([
      z.nativeEnum(CandidateJobSearchStatusEnum),
      z.array(z.nativeEnum(CandidateJobSearchStatusEnum)),
      z
        .string()
        .transform((val) =>
          val.split(',').map((v) => v.trim() as CandidateJobSearchStatusEnum)
        ),
    ])
    .optional(),

  // Boolean filters using helper
  ...createBooleanValidator('isPublished'),

  // Range filters using helper
  ...createRangeValidator('experience'),
  ...createRangeValidator('completionPercentage'),
});

export const partnerCandidateListValidator = z.object({
  query: z.object({
    ...baseFilterValidatorSchema.shape,
    ...partnerCandidateFilterSchema.shape,
  }),
});

export const partnerCandidateDeleteValidator = z.object({
  params: z.object({
    candidateId: z.string().uuid({ message: 'Invalid candidate ID format' }),
  }),
});

export const partnerCandidateRecommendationsValidator = z.object({
  params: z.object({
    jobPostingId: z.string().uuid({ message: 'Invalid job posting ID format' }),
  }),
  query: z.object({
    ...baseFilterValidatorSchema.shape,
  }),
});

export const partnerCandidateRecommendationUpdateValidator = z.object({
  params: z.object({
    candidateId: z.string().uuid({ message: 'Invalid candidate ID format' }),
    jobPostingId: z.string().uuid({ message: 'Invalid job posting ID format' }),
  }),
  body: z.object({
    isViewed: z.boolean().optional(),
    isSaved: z.boolean().optional(),
    hasApplied: z.boolean().optional(),
  }),
});
