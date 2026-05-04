import { z } from 'zod';

/**
 * Validator for partner profile setup requests
 */
export const partnerProfileSetupValidator = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, { message: 'Name must be at least 2 characters long' })
      .max(100, { message: 'Name must be at most 100 characters long' }),
    phone: z
      .string()
      .regex(/^\+?[1-9][\d\-+]{0,14}$/, {
        message: 'Phone number must be a valid international format',
      })
      .optional()
      .nullable(),
    companyName: z
      .string()
      .min(2, { message: 'Company name must be at least 2 characters long' })
      .max(100, {
        message: 'Company name must be at most 100 characters long',
      }),
    title: z
      .string()
      .min(2, { message: 'Title must be at least 2 characters long' })
      .max(100, { message: 'Title must be at most 100 characters long' }),
    specialization: z
      .string()
      .min(2, { message: 'Specialization must be at least 2 characters long' })
      .max(200, {
        message: 'Specialization must be at most 200 characters long',
      }),
    experience: z
      .string()
      .max(1000, { message: 'Experience must be at most 1000 characters long' })
      .optional()
      .nullable(),
  }),
});

/**
 * Validator for checking if partner profile setup is required
 */
export const partnerProfileSetupRequiredValidator = z.object({
  params: z.object({
    partnerId: z
      .string()
      .uuid({ message: 'Invalid partner ID format' })
      .optional(),
  }),
});
