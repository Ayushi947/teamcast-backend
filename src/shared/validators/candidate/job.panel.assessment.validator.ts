import { JobPanelAssessmentInvitationStatusEnum } from '../../models/common/enums';
import { z } from 'zod';

/**
 * Validator for candidate panel assessment invitation response
 */
export const candidatePanelAssessmentInvitationResponseValidator = z.object({
  params: z.object({
    invitationId: z
      .string()
      .uuid({ message: 'Invitation ID must be a valid UUID' }),
  }),
  body: z
    .object({
      action: z.enum(
        [
          JobPanelAssessmentInvitationStatusEnum.ACCEPTED,
          JobPanelAssessmentInvitationStatusEnum.DECLINED,
        ],
        {
          errorMap: () => ({
            message: "Action must be either 'accepted' or 'declined'",
          }),
        }
      ),
      selectedSlotId: z.string().uuid().optional(),
    })
    .superRefine((data, ctx) => {
      if (
        data.action === JobPanelAssessmentInvitationStatusEnum.ACCEPTED &&
        !data.selectedSlotId
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Selected slot ID is required when accepting invitation',
          path: ['selectedSlotId'],
        });
      }
    }),
});

/**
 * Validator for getting candidate panel assessment invitation
 */
export const candidatePanelAssessmentInvitationGetValidator = z.object({
  params: z.object({
    invitationId: z
      .string()
      .uuid({ message: 'Invitation ID must be a valid UUID' }),
  }),
});

/**
 * Validator for getting candidate panel assessment slots
 */
export const candidatePanelAssessmentSlotsGetValidator = z.object({
  params: z.object({
    panelAssessmentId: z
      .string()
      .uuid({ message: 'Panel assessment ID must be a valid UUID' }),
  }),
});

/**
 * Validator for getting candidate panel assessment meeting details
 */
export const candidatePanelAssessmentMeetingDetailsGetValidator = z.object({
  params: z.object({
    invitationId: z
      .string()
      .uuid({ message: 'Invitation ID must be a valid UUID' }),
  }),
});
