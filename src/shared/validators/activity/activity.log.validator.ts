import { z } from 'zod';
import {
  ActivityModuleEnum,
  ActivityEntityTypeEnum,
} from '../../models/common/enums';

export const activityLogCreateSchema = z.object({
  body: z.object({
    module: z.nativeEnum(ActivityModuleEnum, {
      message:
        'Invalid module. Must be one of: auth, candidate, client, partner, job, application, assessment, system, subscription, notification',
    }),
    action: z.string().min(1, 'Action is required'),
    entityId: z.string().uuid().optional(),
    entityType: z
      .nativeEnum(ActivityEntityTypeEnum, {
        message:
          'Invalid entity type. Must be one of: user, candidate, client, partner, support, company, job_posting, job_application, job_ai_assessment, onboarding_assessment, practice_assessment, resume, subscription, payment, document, invitation',
      })
      .optional(),
    description: z.string().min(1, 'Description is required'),
    metadata: z.record(z.any()).optional(),
  }),
});

export const activityLogFiltersSchema = z.object({
  query: z.object({
    userId: z.string().uuid().optional(),
    clientId: z.string().uuid().optional(),
    module: z.nativeEnum(ActivityModuleEnum).optional(),
    action: z.union([z.string(), z.array(z.string())]).optional(),
    entityId: z.string().uuid().optional(),
    entityType: z.nativeEnum(ActivityEntityTypeEnum).optional(),
    fromDate: z.string().datetime().optional(),
    toDate: z.string().datetime().optional(),
    page: z.string().transform(Number).pipe(z.number().min(1)).optional(),
    limit: z
      .string()
      .transform(Number)
      .pipe(z.number().min(1).max(100))
      .optional(),
  }),
});
