import { z } from 'zod';

// Send AI assessment invite validator
export const jobAiAssessmentInviteCreateValidator = z.object({
  body: z.object({
    candidateId: z.string().uuid({ message: 'Invalid candidate ID format' }),
    jobApplicationId: z
      .string()
      .uuid({ message: 'Invalid job application ID format' }),
  }),
});

export const jobAiAssessmentInviteGenerateUrlValidator = z.object({
  body: z.object({
    candidateId: z.string().uuid({ message: 'Invalid candidate ID format' }),
    jobApplicationId: z
      .string()
      .uuid({ message: 'Invalid job application ID format' }),
  }),
});
