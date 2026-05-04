import { z } from 'zod';
import { ResumeParsingMode } from '../../models/domain/candidate/resume.parsing.domain';

// Validator for public resume parsing upload
export const resumePublicParsingUploadValidator = z.object({
  query: z.object({
    mode: z
      .nativeEnum(ResumeParsingMode, {
        message:
          'Invalid parsing mode. Must be one of: STRICT, INFERRED, GENERATIVE',
      })
      .optional(),
  }),
});

// Validator for public parsing task ID parameter
export const resumePublicParsingTaskIdValidator = z.object({
  params: z.object({
    taskId: z.string().uuid({ message: 'Task ID must be a valid UUID' }),
  }),
});

// Validator for getting parsed resume from public task
export const resumePublicParsingGetResumeValidator = z.object({
  params: z.object({
    taskId: z.string().uuid({ message: 'Task ID must be a valid UUID' }),
  }),
});
