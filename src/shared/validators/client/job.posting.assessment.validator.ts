import { z } from 'zod';

export const jobPostingAssessmentStartSchema = z.object({
  params: z.object({
    jobPostingId: z.string().min(1, 'Job posting ID is required'),
  }),
});

export const jobPostingAssessmentTaskGetSchema = z.object({
  params: z.object({
    taskId: z.string().min(1, 'Task ID is required'),
  }),
});

export const jobPostingAssessmentGetSchema = z.object({
  params: z.object({
    assessmentId: z.string().min(1, 'Assessment ID is required'),
  }),
});

export const jobPostingAssessmentGetByJobPostingSchema = z.object({
  params: z.object({
    jobPostingId: z.string().min(1, 'Job posting ID is required'),
  }),
});
