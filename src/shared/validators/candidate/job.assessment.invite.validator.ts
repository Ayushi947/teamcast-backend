import { z } from 'zod';
import { paginationValidatorSchema } from '../common/pagination.validator';
import { JobAssessmentInviteStatusEnum } from '../../models/common/enums';

// Filter schema for Job assessment invites list
const candidateJobAssessmentInviteFilterSchema = z.object({
  status: z
    .union([
      z.nativeEnum(JobAssessmentInviteStatusEnum, {
        errorMap: () => ({ message: 'Invalid invite status' }),
      }),
      z.array(
        z.nativeEnum(JobAssessmentInviteStatusEnum, {
          errorMap: () => ({ message: 'Invalid invite status' }),
        })
      ),
      z
        .string()
        .transform((val) => val.split(',').map((s) => s.trim()))
        .pipe(
          z.array(
            z.nativeEnum(JobAssessmentInviteStatusEnum, {
              errorMap: () => ({ message: 'Invalid invite status' }),
            })
          )
        ),
    ])
    .optional(),
  companyName: z.string().min(1).optional(),
  jobPostingTitle: z.string().min(1).optional(),
  hasAssessment: z
    .string()
    .transform((val) => val === 'true')
    .pipe(z.boolean())
    .optional(),
  assessmentCompleted: z
    .string()
    .transform((val) => val === 'true')
    .pipe(z.boolean())
    .optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

// List schema for Job assessment invites with pagination and filtering
export const candidateJobAssessmentInviteListValidator = z.object({
  query: z.object({
    ...paginationValidatorSchema.shape,
    ...candidateJobAssessmentInviteFilterSchema.shape,
  }),
});

// Accept invite validator
export const candidateJobAssessmentInviteAcceptValidator = z.object({
  params: z.object({
    inviteId: z.string().uuid({ message: 'Invalid invite ID format' }),
  }),
  body: z
    .object({
      acceptanceNote: z
        .string()
        .max(500, {
          message: 'Acceptance note must be at most 500 characters long',
        })
        .optional(),
      scheduledDate: z
        .string()
        .datetime({ message: 'Invalid scheduled date format' })
        .optional(),
    })
    .optional(),
});

// Decline invite validator
export const candidateJobAssessmentInviteDeclineValidator = z.object({
  params: z.object({
    inviteId: z.string().uuid({ message: 'Invalid invite ID format' }),
  }),
  body: z
    .object({
      reason: z
        .string()
        .max(500, { message: 'Reason must be at most 500 characters long' })
        .optional(),
      declineNote: z
        .string()
        .max(1000, {
          message: 'Decline note must be at most 1000 characters long',
        })
        .optional(),
    })
    .optional(),
});
