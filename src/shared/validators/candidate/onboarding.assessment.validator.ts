import { z } from 'zod';
import {
  OnboardingAssessmentStatusEnum,
  ProctorTypeEnum,
} from '../../models/common/enums';
import { paginationValidatorSchema } from '../common/pagination.validator';

// Filter schema for onboarding assessments list
const candidateOnboardingAssessmentFilterSchema = z.object({
  status: z
    .nativeEnum(OnboardingAssessmentStatusEnum, {
      errorMap: () => ({ message: 'Invalid assessment status' }),
    })
    .optional(),
});

// List schema for onboarding assessments with pagination
export const candidateOnboardingAssessmentListValidator = z.object({
  query: z.object({
    ...paginationValidatorSchema.shape,
    ...candidateOnboardingAssessmentFilterSchema.shape,
  }),
});

// Get schema for onboarding assessment initialize task
export const candidateOnboardingAssessmentInitializeTaskGetValidator = z.object(
  {
    params: z.object({
      taskId: z.string().optional(),
    }),
  }
);

// Start assessment schema
export const candidateOnboardingAssessmentStartValidator = z.object({
  params: z.object({
    assessmentId: z.string(),
  }),
});

// Submit answer schema
export const candidateOnboardingAssessmentSubmitAnswerValidator = z.object({
  params: z.object({
    assessmentId: z.string(),
    questionId: z.string(),
  }),
  body: z.object({
    answerGiven: z.string().min(1, {
      message: 'Please provide a more detailed answer (minimum 1 characters)',
    }),
  }),
});

// Heartbeat (status update) validator
export const candidateOnboardingAssessmentHeartbeatValidator = z.object({
  params: z.object({
    assessmentId: z.string(),
  }),
  body: z.object({
    duration: z.number().min(0),
    status: z.string().optional(), // Optionally allow status update
  }),
});

// Proctoring event validator
export const candidateOnboardingAssessmentProctorValidator = z.object({
  params: z.object({
    assessmentId: z.string(),
  }),
  body: z.object({
    type: z.nativeEnum(ProctorTypeEnum),
  }),
});

// Submit assessment validator
export const candidateOnboardingAssessmentSubmitValidator = z.object({
  params: z.object({
    assessmentId: z.string(),
  }),
});

// Get presigned URL validator
export const candidateOnboardingAssessmentPresignedUrlValidator = z.object({
  params: z.object({
    assessmentId: z.string(),
  }),
});

// Get question audio presigned URL validator
export const candidateOnboardingAssessmentQuestionAudioPresignedUrlValidator =
  z.object({
    params: z.object({
      assessmentId: z.string(),
      questionId: z.string(),
    }),
  });

// Get video chunks validator
export const candidateOnboardingAssessmentVideoChunksGetValidator = z.object({
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
export const candidateOnboardingAssessmentChunkPlaybackUrlGetValidator =
  z.object({
    params: z.object({
      assessmentId: z.string(),
      chunkId: z.string(),
    }),
  });
