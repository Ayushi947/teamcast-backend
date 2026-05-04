import { z } from 'zod';

export const resumeAssessmentTaskGetSchema = z.object({
  params: z.object({
    taskId: z.string().optional(),
  }),
});

export const resumeAssessmentGetSchema = z.object({
  params: z.object({
    assessmentId: z.string().optional(),
  }),
});
