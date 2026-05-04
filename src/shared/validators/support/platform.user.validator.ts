import { z } from 'zod';

export const platformUserIdParamsValidator = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID'),
  }),
});

export const platformUserEmailQueryValidator = z.object({
  query: z.object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email address'),
    force: z
      .enum(['true', 'false'])
      .optional()
      .transform((v) => v === 'true'),
  }),
});

export const platformUserDeleteQueryValidator = z.object({
  query: z.object({
    force: z
      .enum(['true', 'false'])
      .optional()
      .transform((v) => v === 'true'),
  }),
});
