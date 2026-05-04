import { z } from 'zod';

export const accountManagerOverrideValidator = z.object({
  body: z.object({
    clientId: z.string().uuid({ message: 'Invalid client ID format' }),
    accountManagerId: z
      .string()
      .uuid({ message: 'Invalid account manager ID format' }),
  }),
});

export const getSupportAccountManagerByClientIdValidator = z.object({
  params: z.object({
    clientId: z.string().uuid({ message: 'Invalid client ID format' }),
  }),
});

export const assignAccountManagerToRecruiterValidator = z.object({
  body: z.object({
    recruiterId: z.string().uuid({ message: 'Invalid recruiter ID format' }),
    accountManagerId: z
      .string()
      .uuid({ message: 'Invalid account manager ID format' }),
  }),
});
