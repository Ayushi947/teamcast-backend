import { z } from 'zod';

/**
 * Validator for search requests
 */
export const searchValidator = z.object({
  body: z.object({
    query: z
      .string()
      .max(200, {
        message: 'Search query must be at most 200 characters long',
      })
      .optional()
      .or(z.literal('')), // Allow empty string
  }),
});

/**
 * Validator for typeahead requests
 */
export const typeaheadValidator = z.object({
  body: z.object({
    query: z
      .string()
      .max(100, {
        message: 'Typeahead query must be at most 100 characters long',
      })
      .optional()
      .or(z.literal('')), // Allow empty string
  }),
});
