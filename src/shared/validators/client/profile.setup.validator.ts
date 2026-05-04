import { z } from 'zod';
import {
  CompanyIndustryEnum,
  CompanySizeEnum,
} from '../../models/common/enums';

/**
 * Validator for client profile setup requests
 */
export const clientProfileSetupValidator = z.object({
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
    companyIndustry: z.nativeEnum(CompanyIndustryEnum, {
      errorMap: () => ({ message: 'Please select a valid industry' }),
    }),
    companySize: z.nativeEnum(CompanySizeEnum, {
      errorMap: () => ({ message: 'Please select a valid company size' }),
    }),
    jobTitle: z
      .string()
      .min(2, { message: 'Job title must be at least 2 characters long' })
      .max(100, { message: 'Job title must be at most 100 characters long' }),
    companyDescription: z
      .string()
      .max(1000, {
        message: 'Company description must be at most 1000 characters long',
      })
      .optional()
      .nullable(),
  }),
});

/**
 * Validator for checking if client profile setup is required
 */
export const clientProfileSetupRequiredValidator = z.object({
  params: z.object({
    clientId: z
      .string()
      .uuid({ message: 'Invalid client ID format' })
      .optional(),
  }),
});
