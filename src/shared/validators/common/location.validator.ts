import { z } from 'zod';

export const countryListValidator = z.object({
  query: z.object({
    limit: z.coerce.number().min(1).max(100).optional().default(50),
    offset: z.coerce.number().min(0).optional().default(0),
    search: z.string().optional(),
  }),
});

export const stateListValidator = z.object({
  query: z.object({
    limit: z.coerce.number().min(1).max(100).optional().default(50),
    offset: z.coerce.number().min(0).optional().default(0),
    search: z.string().optional(),
    countryId: z.string().uuid().optional(),
  }),
});

export const cityListValidator = z.object({
  query: z.object({
    limit: z.coerce.number().min(1).max(100).optional().default(50),
    offset: z.coerce.number().min(0).optional().default(0),
    search: z.string().optional(),
    stateId: z.string().uuid().optional(),
    countryId: z.string().uuid().optional(),
  }),
});

export const locationNamesValidator = z.object({
  query: z.object({
    search: z.string().optional(),
    countryId: z.string().optional(),
    stateId: z.string().optional(),
  }),
});
