import { z } from 'zod';

export const sendOnboardingReminderValidator = z.object({
  body: z.object({
    candidateId: z.string().uuid('Invalid candidate ID format'),
  }),
});

export type SendOnboardingReminderRequest = z.infer<
  typeof sendOnboardingReminderValidator.shape.body
>;
