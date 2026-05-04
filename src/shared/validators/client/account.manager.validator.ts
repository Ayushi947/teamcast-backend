import { z } from 'zod';

export const getAccountManagerByClientIdValidator = z.object({
  params: z.object({
    clientId: z.string().uuid({ message: 'Invalid client ID format' }),
  }),
});
