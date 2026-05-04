import { z } from 'zod';

/**
 * Validation schema for creating candidate recommendation
 */
export const createCandidateRecommendationSchema = z.object({
  body: z.object({
    candidateId: z
      .string()
      .uuid('Candidate ID must be a valid UUID')
      .min(1, 'Candidate ID is required'),
    jobId: z
      .string()
      .uuid('Job posting ID must be a valid UUID')
      .min(1, 'Job posting ID is required'),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
  headers: z.object({}).optional(),
});

export const getCandidateRecommendedJobsSchema = z.object({
  query: z.object({}).optional(),
  params: z.object({
    candidateId: z.string().uuid('Candidate ID must be a valid UUID'),
  }),
  headers: z.object({}).optional(),
});
