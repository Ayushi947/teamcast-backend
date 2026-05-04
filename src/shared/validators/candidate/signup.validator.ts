import { z } from 'zod';

/**
 * Validator for candidate sign-up
 */
export const candidateSignupValidator = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, { message: 'Name must be at least 2 characters long' })
      .max(100, { message: 'Name must be at most 100 characters long' })
      .regex(/^[A-Za-z\s]+$/, {
        message: 'Name can only contain letters and spaces',
      })
      .refine((name) => name.trim().split(/\s+/).length >= 2, {
        message: 'Name must contain at least 2 words',
      }),
    email: z
      .string()
      .email({ message: 'Invalid email address format' })
      .max(255, { message: 'Email must be at most 255 characters long' }),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters long' })
      .max(100, { message: 'Password must be at most 100 characters long' })
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/,
        {
          message:
            'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
        }
      ),
    jobTitle: z
      .string()
      .min(2, { message: 'Job role must be at least 2 characters long' })
      .max(100, { message: 'Job role must be at most 100 characters long' })
      .regex(/^[A-Za-z0-9 ]+$/, {
        message: 'Job role can only contain letters, numbers, and spaces',
      })
      .refine((val) => !/\d{2,}/.test(val), {
        message: 'Job role cannot contain consecutive numbers',
      })
      .optional(),
  }),
});
