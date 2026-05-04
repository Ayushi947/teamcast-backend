import { z } from 'zod';

/**
 * Validator for creating a public practice assessment from parsed job data
 */
export const publicPracticeAssessmentCreateValidator = z.object({
  body: z
    .object({
      parsedJobDataId: z
        .string()
        .uuid({ message: 'Invalid parsed job data ID format' })
        .optional(),
      parsedJobData: z.any().optional(),
      candidateName: z
        .string({ required_error: 'Candidate name is required' })
        .min(1, { message: 'Candidate name is required' })
        .max(255, { message: 'Candidate name must be at most 255 characters' }),
      candidateEmail: z
        .string({ required_error: 'Candidate email is required' })
        .email({ message: 'Invalid email address format' })
        .max(255, { message: 'Email must be at most 255 characters' }),
    })
    .refine((data) => data.parsedJobDataId || data.parsedJobData, {
      message: 'Either parsedJobDataId or parsedJobData must be provided',
      path: ['parsedJobDataId'],
    }),
});

/**
 * Validator for getting a public practice assessment by ID
 */
export const publicPracticeAssessmentGetValidator = z.object({
  params: z.object({
    assessmentId: z
      .string({ required_error: 'Assessment ID is required' })
      .uuid({ message: 'Invalid assessment ID format' }),
  }),
});

/**
 * Validator for linking a public practice assessment to a candidate
 */
export const publicPracticeAssessmentLinkValidator = z.object({
  params: z.object({
    assessmentId: z
      .string({ required_error: 'Assessment ID is required' })
      .uuid({ message: 'Invalid assessment ID format' }),
  }),
  body: z.object({
    candidateId: z
      .string()
      .uuid({ message: 'Invalid candidate ID format' })
      .optional(),
  }),
});

/**
 * Validator for getting public practice assessments by email
 */
export const publicPracticeAssessmentGetByEmailValidator = z.object({
  query: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email({ message: 'Invalid email address format' })
      .max(255, { message: 'Email must be at most 255 characters' }),
  }),
});

/**
 * Validator for listing practice assessments for authenticated candidate
 */
export const publicPracticeAssessmentListValidator = z.object({
  query: z
    .object({
      page: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 1))
        .refine((val) => val >= 1, { message: 'Page must be at least 1' }),
      limit: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 10))
        .refine((val) => val >= 1 && val <= 100, {
          message: 'Limit must be between 1 and 100',
        }),
      sortBy: z
        .enum(['createdAt', 'updatedAt', 'completedAt'])
        .optional()
        .default('createdAt'),
      sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    })
    .optional()
    .default({}),
});

/**
 * Validator for parsing job URL
 */
export const publicPracticeAssessmentParseValidator = z.object({
  body: z.object({
    jobUrl: z
      .string({ required_error: 'Job URL is required' })
      .url({ message: 'Invalid URL format' })
      .max(2048, { message: 'URL must be at most 2048 characters' }),
  }),
});

/**
 * Validator for parsing job description text
 */
export const publicPracticeAssessmentParseDescriptionValidator = z.object({
  body: z.object({
    jobDescriptionText: z
      .string({ required_error: 'Job description text is required' })
      .min(1, { message: 'Job description text cannot be empty' })
      .max(50000, {
        message: 'Job description text must be at most 50000 characters',
      }),
  }),
});

/**
 * Validator for getting parsed job data by ID
 */
export const publicPracticeAssessmentGetParsedJobDataValidator = z.object({
  params: z.object({
    parsedJobDataId: z
      .string({ required_error: 'Parsed job data ID is required' })
      .uuid({ message: 'Invalid parsed job data ID format' }),
  }),
});

/**
 * Validator for getting public practice assessment task
 */
export const publicPracticeAssessmentGetTaskValidator = z.object({
  params: z.object({
    assessmentId: z
      .string({ required_error: 'Assessment ID is required' })
      .uuid({ message: 'Invalid assessment ID format' }),
  }),
});

/**
 * Validator for starting public practice assessment
 */
export const publicPracticeAssessmentStartValidator = z.object({
  params: z.object({
    assessmentId: z
      .string({ required_error: 'Assessment ID is required' })
      .uuid({ message: 'Invalid assessment ID format' }),
  }),
});

/**
 * Validator for submitting answer in public practice assessment
 */
export const publicPracticeAssessmentSubmitAnswerValidator = z.object({
  params: z.object({
    assessmentId: z
      .string({ required_error: 'Assessment ID is required' })
      .uuid({ message: 'Invalid assessment ID format' }),
    questionId: z
      .string({ required_error: 'Question ID is required' })
      .uuid({ message: 'Invalid question ID format' }),
  }),
  body: z.object({
    answerGiven: z
      .string({ required_error: 'Answer is required' })
      .min(1, { message: 'Answer cannot be empty' }),
  }),
});

/**
 * Validator for submitting public practice assessment
 */
export const publicPracticeAssessmentSubmitValidator = z.object({
  params: z.object({
    assessmentId: z
      .string({ required_error: 'Assessment ID is required' })
      .uuid({ message: 'Invalid assessment ID format' }),
  }),
});

/**
 * Validator for getting presigned URL for video chunk upload
 */
export const publicPracticeAssessmentPresignedUrlValidator = z.object({
  params: z.object({
    assessmentId: z
      .string({ required_error: 'Assessment ID is required' })
      .uuid({ message: 'Invalid assessment ID format' }),
  }),
  query: z
    .object({
      chunkIndex: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : undefined)),
    })
    .optional(),
});

/**
 * Validator for recording video chunk upload
 */
export const publicPracticeAssessmentChunkUploadValidator = z.object({
  params: z.object({
    assessmentId: z
      .string({ required_error: 'Assessment ID is required' })
      .uuid({ message: 'Invalid assessment ID format' }),
  }),
  body: z.object({
    chunkIndex: z.number({ required_error: 'chunkIndex is required' }),
    gcsUri: z.string({ required_error: 'gcsUri is required' }),
    questionId: z.string().uuid().optional(),
    sectionId: z.string().uuid().optional(),
  }),
});

/**
 * Validator for updating terms acceptance for a public practice assessment
 */
export const publicPracticeAssessmentUpdateTermsAcceptedValidator = z.object({
  params: z.object({
    assessmentId: z
      .string({ required_error: 'Assessment ID is required' })
      .uuid({ message: 'Invalid assessment ID format' }),
  }),
  body: z.object({
    termsAccepted: z.boolean({
      required_error: 'Terms accepted is required',
    }),
  }),
});
