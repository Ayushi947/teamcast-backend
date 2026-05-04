import { z } from 'zod';

/**
 * Validator for client resume view requests
 */
export const clientResumeViewValidator = z.object({
  params: z.object({
    candidateId: z
      .string()
      .uuid('Candidate ID must be a valid UUID')
      .min(1, 'Candidate ID is required'),
  }),
});
