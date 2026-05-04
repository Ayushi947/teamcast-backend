import { z } from 'zod';
import {
  JobPanelAssessmentSlotStatusEnum,
  JobPanelAssessmentFeedbackDecisionEnum,
  JobPanelAssessmentRecommendationEnum,
} from '../../models/common/enums';
import { paginationValidatorSchema } from '../common/pagination.validator';

// Panel Assessment Slot validators
export const panelAssessmentSlotCreateValidator = z.object({
  body: z.object({
    jobApplicationId: z
      .string()
      .uuid({ message: 'Invalid job application ID format' }),
    slots: z
      .array(
        z.object({
          startDateTime: z.coerce.date({
            invalid_type_error: 'Start date time must be a valid date',
          }),
          endDateTime: z.coerce.date({
            invalid_type_error: 'End date time must be a valid date',
          }),
          timeZone: z
            .string()
            .min(1, { message: 'Time zone is required' })
            .max(50, { message: 'Time zone cannot exceed 50 characters' }),
          panelMemberEmails: z
            .array(z.string().email({ message: 'Invalid email format' }))
            .min(1, { message: 'At least one panel member email is required' })
            .max(10, { message: 'Cannot have more than 10 panel members' }),
          panelMemberNames: z
            .array(
              z.string().min(1, { message: 'Panel member name is required' })
            )
            .min(1, { message: 'At least one panel member name is required' })
            .max(10, { message: 'Cannot have more than 10 panel members' }),
          hostEmail: z.string().email({ message: 'Invalid host email format' }),
          hostName: z
            .string()
            .min(1, { message: 'Host name is required' })
            .max(100, { message: 'Host name cannot exceed 100 characters' }),
        })
      )
      .min(1, { message: 'At least one slot is required' })
      .max(20, { message: 'Cannot create more than 20 slots at once' }),
  }),
});

export const panelAssessmentSlotUpdateValidator = z.object({
  params: z.object({
    slotId: z.string().uuid({ message: 'Invalid slot ID format' }),
  }),
  body: z.object({
    startDateTime: z.coerce
      .date({
        invalid_type_error: 'Start date time must be a valid date',
      })
      .optional(),
    endDateTime: z.coerce
      .date({
        invalid_type_error: 'End date time must be a valid date',
      })
      .optional(),
    timeZone: z
      .string()
      .min(1, { message: 'Time zone is required' })
      .optional(),
    panelMemberEmails: z
      .array(z.string().email({ message: 'Invalid email format' }))
      .min(1, { message: 'At least one panel member email is required' })
      .max(10, { message: 'Maximum 10 panel members allowed' })
      .optional(),
    panelMemberNames: z
      .array(z.string().min(1, { message: 'Panel member name is required' }))
      .min(1, { message: 'At least one panel member name is required' })
      .max(10, { message: 'Maximum 10 panel members allowed' })
      .optional(),
    hostEmail: z
      .string()
      .email({ message: 'Invalid host email format' })
      .optional(),
    hostName: z
      .string()
      .min(1, { message: 'Host name is required' })
      .optional(),
    status: z
      .nativeEnum(JobPanelAssessmentSlotStatusEnum, {
        message: 'Invalid slot status',
      })
      .optional(),
    isSelected: z.boolean().optional(),
  }),
});

export const panelAssessmentSlotIdValidator = z.object({
  params: z.object({
    slotId: z.string().uuid({ message: 'Invalid slot ID format' }),
  }),
});

export const panelAssessmentSlotListValidator = z.object({
  query: z.object({
    ...paginationValidatorSchema.shape,
    panelAssessmentId: z
      .string()
      .uuid({ message: 'Invalid panel assessment ID format' })
      .optional(),
    status: z
      .nativeEnum(JobPanelAssessmentSlotStatusEnum, {
        message: 'Invalid slot status',
      })
      .optional(),
    startDate: z.coerce
      .date({
        invalid_type_error: 'Start date must be a valid date',
      })
      .optional(),
    endDate: z.coerce
      .date({
        invalid_type_error: 'End date must be a valid date',
      })
      .optional(),
    hostEmail: z
      .string()
      .email({ message: 'Invalid host email format' })
      .optional(),
  }),
});

// Panel Assessment Invitation validators
export const panelAssessmentInvitationCreateValidator = z.object({
  body: z.object({
    candidateId: z.string().uuid({ message: 'Invalid candidate ID format' }),
    jobApplicationId: z
      .string()
      .uuid({ message: 'Invalid job application ID format' }),
    message: z
      .string()
      .max(1000, { message: 'Message must be at most 1000 characters' })
      .optional(),
    panelMemberEmails: z
      .array(z.string().email({ message: 'Invalid email format' }))
      .min(1, { message: 'At least one panel member email is required' })
      .max(10, { message: 'Maximum 10 panel members allowed' })
      .optional(),
    panelMemberNames: z
      .array(z.string().min(1, { message: 'Panel member name is required' }))
      .min(1, { message: 'At least one panel member name is required' })
      .max(10, { message: 'Maximum 10 panel members allowed' })
      .optional(),
    expirationDays: z
      .number()
      .int()
      .min(1, { message: 'Expiration days must be at least 1' })
      .max(30, { message: 'Expiration days cannot exceed 30' })
      .optional()
      .default(7),
  }),
});

export const panelAssessmentInvitationIdValidator = z.object({
  params: z.object({
    invitationId: z.string().uuid({ message: 'Invalid invitation ID format' }),
  }),
});

export const panelAssessmentInvitationListValidator = z.object({
  query: z.object({
    ...paginationValidatorSchema.shape,
    candidateId: z
      .string()
      .uuid({ message: 'Invalid candidate ID format' })
      .optional(),
    status: z.string().optional(),
    panelAssessmentId: z
      .string()
      .uuid({ message: 'Invalid panel assessment ID format' })
      .optional(),
  }),
});

// Public Feedback validators (for panel members)
export const publicPanelAssessmentFeedbackTokenValidator = z.object({
  params: z.object({
    feedbackToken: z.string().min(1, { message: 'Feedback token is required' }),
  }),
});

export const publicPanelAssessmentFeedbackSubmitValidator = z.object({
  params: z.object({
    feedbackToken: z.string().min(1, { message: 'Feedback token is required' }),
  }),
  body: z.object({
    detailedFeedback: z
      .string()
      .min(10, { message: 'Detailed feedback must be at least 10 characters' })
      .max(5000, {
        message: 'Detailed feedback must be at most 5000 characters',
      }),
    decision: z.nativeEnum(JobPanelAssessmentFeedbackDecisionEnum, {
      message: 'Invalid feedback decision',
    }),
    recommendation: z.nativeEnum(JobPanelAssessmentRecommendationEnum, {
      message: 'Invalid feedback recommendation',
    }),
  }),
});

// Internal Feedback validators (for authenticated panel members)
export const panelAssessmentFeedbackSubmitInternalValidator = z.object({
  params: z.object({
    panelAssessmentId: z
      .string()
      .uuid({ message: 'Invalid panel assessment ID format' }),
  }),
  body: z.object({
    panelMemberEmail: z.string().email({ message: 'Invalid email format' }),
    detailedFeedback: z
      .string()
      .min(10, { message: 'Detailed feedback must be at least 10 characters' })
      .max(5000, {
        message: 'Detailed feedback must be at most 5000 characters',
      }),
    decision: z.nativeEnum(JobPanelAssessmentFeedbackDecisionEnum, {
      message: 'Invalid feedback decision',
    }),
    recommendation: z.nativeEnum(JobPanelAssessmentRecommendationEnum, {
      message: 'Invalid feedback recommendation',
    }),
  }),
});

export const panelAssessmentFeedbackListValidator = z.object({
  query: z.object({
    ...paginationValidatorSchema.shape,
    panelAssessmentId: z
      .string()
      .uuid({ message: 'Invalid panel assessment ID format' })
      .optional(),
    panelMemberEmail: z
      .string()
      .email({ message: 'Invalid email format' })
      .optional(),
    isSubmitted: z
      .string()
      .transform((val) => val === 'true')
      .optional(),
  }),
});

// Custom validation functions
export const validateSlotTiming = (startDateTime: Date, endDateTime: Date) => {
  if (startDateTime >= endDateTime) {
    throw new Error('Start date time must be before end date time');
  }

  // Check if the time slot is at least 30 minutes
  const duration = endDateTime.getTime() - startDateTime.getTime();
  const thirtyMinutes = 30 * 60 * 1000;
  if (duration < thirtyMinutes) {
    throw new Error('Time slot must be at least 30 minutes long');
  }

  // Check if start time is in the future (with 1 hour buffer)
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  if (startDateTime < oneHourFromNow) {
    throw new Error('Start date time must be at least 1 hour in the future');
  }
};

export const validatePanelMemberConsistency = (
  emails: string[],
  names: string[]
) => {
  if (emails.length !== names.length) {
    throw new Error('Number of panel member emails must match number of names');
  }
};

// Meeting validators (supports both Teams and manual meeting links)
export const panelAssessmentMeetingGenerateValidator = z.object({
  params: z.object({
    invitationId: z.string().uuid({ message: 'Invalid invitation ID format' }),
  }),
  body: z
    .object({
      organizerEmail: z
        .string()
        .email({ message: 'Invalid organizer email format' }),
      organizerName: z
        .string()
        .min(1, { message: 'Organizer name is required' })
        .max(100, { message: 'Organizer name cannot exceed 100 characters' })
        .optional(),
      useTeams: z.boolean().optional().default(true),
      manualMeetingLink: z
        .string()
        .url({ message: 'Manual meeting link must be a valid URL' })
        .optional(),
      manualEventId: z
        .string()
        .min(1, { message: 'Manual event ID cannot be empty' })
        .max(255, { message: 'Manual event ID cannot exceed 255 characters' })
        .optional(),
    })
    .superRefine((data, ctx) => {
      // If useTeams is false, manualMeetingLink is required
      if (data.useTeams === false && !data.manualMeetingLink) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Manual meeting link is required when Teams integration is disabled',
          path: ['manualMeetingLink'],
        });
      }
    }),
});

export const panelAssessmentMeetingUpdateValidator = z.object({
  params: z.object({
    invitationId: z.string().uuid({ message: 'Invalid invitation ID format' }),
  }),
  body: z.object({
    organizerEmail: z
      .string()
      .email({ message: 'Invalid organizer email format' }),
  }),
});

export const panelAssessmentMeetingCancelValidator = z.object({
  params: z.object({
    invitationId: z.string().uuid({ message: 'Invalid invitation ID format' }),
  }),
  body: z.object({
    organizerEmail: z
      .string()
      .email({ message: 'Invalid organizer email format' }),
  }),
});

/**
 * Validator for getting client panel assessment meeting details
 */
export const clientPanelAssessmentMeetingDetailsGetValidator = z.object({
  params: z.object({
    invitationId: z
      .string()
      .uuid({ message: 'Invitation ID must be a valid UUID' }),
  }),
});

export const panelAssessmentIdValidator = z.object({
  params: z.object({
    panelAssessmentId: z
      .string()
      .uuid({ message: 'Invalid panel assessment ID format' }),
  }),
});
