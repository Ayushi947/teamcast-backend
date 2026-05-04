import { z } from 'zod';

// Get video chunks validator
export const clientCandidateOnboardingAssessmentVideoChunksGetValidator =
  z.object({
    params: z.object({
      assessmentId: z.string(),
    }),
    query: z
      .object({
        questionId: z.string().optional(),
        includeAnalysis: z.string().optional(),
        includePlaybackUrls: z.string().optional(),
      })
      .optional(),
  });

// Get chunk playback URL validator
export const clientCandidateOnboardingAssessmentChunkPlaybackUrlGetValidator =
  z.object({
    params: z.object({
      assessmentId: z.string(),
      chunkId: z.string(),
    }),
  });

// Get video chunks validator for job AI assessment
export const clientCandidateJobAiAssessmentVideoChunksGetValidator = z.object({
  params: z.object({
    assessmentId: z.string(),
  }),
  query: z
    .object({
      questionId: z.string().optional(),
      sectionId: z.string().optional(),
      includeAnalysis: z.string().optional(),
      includePlaybackUrls: z.string().optional(),
    })
    .optional(),
});

// Get chunk playback URL validator for job AI assessment
export const clientCandidateJobAiAssessmentChunkPlaybackUrlGetValidator =
  z.object({
    params: z.object({
      assessmentId: z.string(),
      chunkId: z.string(),
    }),
  });
