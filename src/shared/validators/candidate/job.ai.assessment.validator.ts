import { z } from 'zod';
import {
  JobAiAssessmentStatusEnum,
  ProctorTypeEnum,
} from '../../models/common/enums';
import { paginationValidatorSchema } from '../common/pagination.validator';

// Filter schema for job ai assessments list
const candidateJobAiAssessmentFilterSchema = z.object({
  status: z
    .nativeEnum(JobAiAssessmentStatusEnum, {
      errorMap: () => ({ message: 'Invalid assessment status' }),
    })
    .optional(),
});

// List schema for job ai assessments with pagination
export const candidateJobAiAssessmentListValidator = z.object({
  query: z.object({
    ...paginationValidatorSchema.shape,
    ...candidateJobAiAssessmentFilterSchema.shape,
  }),
});

// Get schema for job ai assessment initialize task
export const candidateJobAiAssessmentInitializeTaskGetValidator = z.object({
  params: z.object({
    taskId: z.string().optional(),
  }),
});

// Start assessment schema
export const candidateJobAiAssessmentStartValidator = z.object({
  params: z.object({
    assessmentId: z.string(),
  }),
});

// Submit answer schema
export const candidateJobAiAssessmentSubmitAnswerValidator = z.object({
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
export const candidateJobAiAssessmentHeartbeatValidator = z.object({
  params: z.object({
    assessmentId: z.string(),
  }),
  body: z.object({
    duration: z.number().min(0),
    status: z.string().optional(), // Optionally allow status update
  }),
});

// Proctoring event validator
export const candidateJobAiAssessmentProctorValidator = z.object({
  params: z.object({
    assessmentId: z.string(),
  }),
  body: z.object({
    type: z.nativeEnum(ProctorTypeEnum),
  }),
});

// Submit assessment validator
export const candidateJobAiAssessmentSubmitValidator = z.object({
  params: z.object({
    assessmentId: z.string(),
  }),
});

// Get presigned URL validator
export const candidateJobAiAssessmentPresignedUrlValidator = z.object({
  params: z.object({
    assessmentId: z.string(),
  }),
});

export const candidateJobAiAssessmentPresignedUrlByVideoUrlValidator = z.object(
  {
    query: z.object({
      videoUrl: z.string().min(1, 'Video URL is required'),
    }),
  }
);

// Get question audio presigned URL validator
export const candidateJobAiAssessmentPresignedUrlByAssessmentIdValidator =
  z.object({
    params: z.object({
      assessmentId: z.string(),
    }),
  });

// Get question audio presigned URL validator
export const candidateJobAiAssessmentQuestionAudioPresignedUrlValidator =
  z.object({
    params: z.object({
      assessmentId: z.string(),
      questionId: z.string(),
    }),
  });

// Get video chunks validator
export const candidateJobAiAssessmentVideoChunksGetValidator = z.object({
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

// Get chunk playback URL validator
export const candidateJobAiAssessmentChunkPlaybackUrlGetValidator = z.object({
  params: z.object({
    assessmentId: z.string(),
    chunkId: z.string(),
  }),
});
