import { z } from 'zod';
import { businessEmailValidator } from '../common/email.validator';

/**
 * Validator for client signup requests
 */
export const clientSignupValidator = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, { message: 'Name must be at least 2 characters long' })
      .max(100, { message: 'Name must be at most 100 characters long' }),
    email: businessEmailValidator,
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters long' })
      .max(100, { message: 'Password must be at most 100 characters long' })
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
        message:
          'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      }),
    companyName: z
      .string()
      .min(2, { message: 'Company name must be at least 2 characters long' })
      .max(100, {
        message: 'Company name must be at most 100 characters long',
      }),
    jobTitle: z
      .string()
      .min(2, { message: 'Job title must be at least 2 characters long' })
      .max(100, { message: 'Job title must be at most 100 characters long' }),
    selectedPlan: z.string().optional(),
  }),
});
