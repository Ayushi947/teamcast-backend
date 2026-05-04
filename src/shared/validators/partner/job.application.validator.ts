import { z } from 'zod';
import { ApplicationStatusEnum } from '../../models/common/enums';
import { baseFilterValidatorSchema } from '../common/pagination.validator';

// Job application filters validator
const partnerJobApplicationFilterSchema = z.object({
  status: z.nativeEnum(ApplicationStatusEnum).optional(),
  jobPostingId: z.string().uuid().optional(),
  candidateId: z.string().uuid().optional(),
  appliedAfter: z.string().datetime().optional(),
  appliedBefore: z.string().datetime().optional(),
});

export const partnerJobApplicationsListValidator = z.object({
  query: z.object({
    ...baseFilterValidatorSchema.shape,
    ...partnerJobApplicationFilterSchema.shape,
  }),
});

// Get application by ID validator
export const partnerJobApplicationByIdValidator = z.object({
  params: z.object({
    id: z.string().uuid('Invalid application ID'),
  }),
});

// Withdraw application validator
export const partnerJobApplicationWithdrawValidator = z.object({
  params: z.object({
    id: z.string().uuid('Invalid application ID'),
  }),
  body: z.object({
    reason: z.string().optional(),
  }),
});
