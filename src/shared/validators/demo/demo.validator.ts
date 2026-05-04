import { z } from 'zod';

/**
 * Validator for demo profile selection
 */
export const demoProfileSelectionValidator = z.object({
  params: z.object({
    profileId: z.string().min(1, 'Profile ID is required and must be a string'),
  }),
});

/**
 * Validator for demo assessment start request
 */
export const demoAssessmentStartValidator = z.object({
  body: z.object({
    profileId: z.string().min(1, 'Profile ID is required and must be a string'),
    candidateName: z.string().min(1).max(100).optional(),
    candidateEmail: z.string().email().optional(),
  }),
});

/**
 * Validator for demo answer submission
 */
export const demoAnswerSubmitValidator = z.object({
  params: z.object({
    sessionId: z.string().min(1, 'Session ID is required and must be a string'),
  }),
  body: z.object({
    questionId: z
      .string()
      .min(1, 'Question ID is required and must be a string'),
    answer: z.string().min(1).max(5000).optional(),
    videoUrl: z.union([z.string().url(), z.literal('')]).optional(),
    duration: z.number().int().min(0).max(3600).optional(),
  }),
});

/**
 * Validator for demo video analysis request
 */
export const demoVideoAnalysisValidator = z.object({
  body: z.object({
    videoUrl: z.string().url('Video URL is required and must be a valid URL'),
    sessionId: z.string().min(1).optional(),
  }),
});

/**
 * Validator for demo presigned URL request
 */
export const demoPresignedUrlValidator = z.object({
  query: z.object({
    fileName: z.string().min(1, 'File name is required and must be a string'),
  }),
});
