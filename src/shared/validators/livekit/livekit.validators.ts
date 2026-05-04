import { z } from 'zod';

/**
 * Validator for LiveKit room creation
 */
export const liveKitRoomValidator = z.object({
  body: z.object({
    assessmentId: z.string().uuid({ message: 'Invalid assessment ID format' }),
    assessmentType: z.enum(['ONBOARDING', 'JOB_AI'], {
      errorMap: () => ({
        message: 'Assessment type must be ONBOARDING or JOB_AI',
      }),
    }),
    candidateId: z.string().uuid().optional(), // Frontend may send this, but backend overrides with JWT value
    roomConfig: z
      .object({
        maxParticipants: z.number().int().positive().optional(),
        emptyTimeout: z.number().int().positive().optional(),
        metadata: z.record(z.any()).optional(),
        agents: z
          .array(
            z.object({
              agentName: z.string().min(1),
              metadata: z.record(z.any()).optional(),
            })
          )
          .optional(),
      })
      .optional(),
  }),
});

/**
 * Validator for LiveKit token generation
 */
export const liveKitTokenValidator = z.object({
  body: z.object({
    roomName: z
      .string()
      .min(1, { message: 'Room name cannot be empty' })
      .max(200, { message: 'Room name must be at most 200 characters' }),
    participantName: z
      .string()
      .min(1, { message: 'Participant name cannot be empty' })
      .max(200, { message: 'Participant name must be at most 200 characters' }),
    participantIdentity: z.string().min(1).max(200).optional(),
    metadata: z.record(z.any()).optional(),
  }),
});

/**
 * Validator for LiveKit room status
 */
export const liveKitRoomStatusValidator = z.object({
  params: z.object({
    roomName: z
      .string()
      .min(1, { message: 'Room name cannot be empty' })
      .max(200, { message: 'Room name must be at most 200 characters' }),
  }),
});
