import { CandidateShortlistStatusEnum } from '../../models/common/enums';
import { z } from 'zod';

// Validator for creating a candidate shortlist entry
export const clientCandidateShortlistCreateValidator = z.object({
  body: z.object({
    candidateId: z
      .string()
      .uuid({ message: 'Candidate ID must be a valid UUID' }),
    jobPostingId: z
      .string()
      .uuid({ message: 'Job posting ID must be a valid UUID' })
      .optional(), // Make optional for independent shortlisting
    notes: z
      .string()
      .max(1000, { message: 'Notes must be at most 1000 characters long' })
      .optional(),
    rating: z
      .number()
      .min(1, { message: 'Rating must be at least 1' })
      .max(5, { message: 'Rating must be at most 5' })
      .optional(),
    tags: z.array(z.string().min(1).max(50)).optional(),
  }),
});

// Validator for updating a candidate shortlist entry
export const clientCandidateShortlistUpdateValidator = z.object({
  params: z.object({
    shortlistId: z
      .string()
      .uuid({ message: 'Shortlist ID must be a valid UUID' }),
  }),
  body: z.object({
    status: z
      .nativeEnum(CandidateShortlistStatusEnum, {
        errorMap: () => ({ message: 'Invalid shortlist status' }),
      })
      .optional(),
    notes: z
      .string()
      .max(1000, { message: 'Notes must be at most 1000 characters long' })
      .optional(),
    rating: z
      .number()
      .min(1, { message: 'Rating must be at least 1' })
      .max(5, { message: 'Rating must be at most 5' })
      .optional(),
    tags: z.array(z.string().min(1).max(50)).optional(),
  }),
});

// Validator for getting a single candidate shortlist entry
export const clientCandidateShortlistGetValidator = z.object({
  params: z.object({
    shortlistId: z
      .string()
      .uuid({ message: 'Shortlist ID must be a valid UUID' }),
  }),
});

// Validator for listing candidate shortlist entries
export const clientCandidateShortlistListValidator = z.object({
  query: z.object({
    status: z.nativeEnum(CandidateShortlistStatusEnum).optional(),
    jobPostingId: z
      .string()
      .uuid({ message: 'Job posting ID must be a valid UUID' })
      .optional(),
    candidateId: z
      .string()
      .uuid({ message: 'Candidate ID must be a valid UUID' })
      .optional(),
    shortlistedById: z
      .string()
      .uuid({ message: 'Shortlisted by ID must be a valid UUID' })
      .optional(),
    rating: z.coerce
      .number()
      .min(1, { message: 'Rating must be at least 1' })
      .max(5, { message: 'Rating must be at most 5' })
      .optional(),
    tags: z.union([z.string(), z.array(z.string())]).optional(),
    search: z
      .string()
      .min(1, { message: 'Search term must be at least 1 character' })
      .max(100, { message: 'Search term must be at most 100 characters' })
      .optional(),
    page: z.coerce
      .number()
      .int()
      .min(1, { message: 'Page must be a positive integer' })
      .optional(),
    limit: z.coerce
      .number()
      .int()
      .min(1, { message: 'Limit must be at least 1' })
      .max(100, { message: 'Limit must be at most 100' })
      .optional(),
  }),
});

// Validator for deleting a candidate shortlist entry
export const clientCandidateShortlistDeleteValidator = z.object({
  params: z.object({
    shortlistId: z
      .string()
      .uuid({ message: 'Shortlist ID must be a valid UUID' }),
  }),
});

// Validator for bulk updating candidate shortlist entries
export const clientCandidateShortlistBulkUpdateValidator = z.object({
  body: z.object({
    shortlistIds: z
      .array(
        z.string().uuid({ message: 'Each shortlist ID must be a valid UUID' })
      )
      .min(1, { message: 'At least one shortlist ID must be provided' }),
    updates: z.object({
      status: z
        .nativeEnum(CandidateShortlistStatusEnum, {
          errorMap: () => ({ message: 'Invalid shortlist status' }),
        })
        .optional(),
      notes: z
        .string()
        .max(1000, { message: 'Notes must be at most 1000 characters long' })
        .optional(),
      rating: z
        .number()
        .min(1, { message: 'Rating must be at least 1' })
        .max(5, { message: 'Rating must be at most 5' })
        .optional(),
      tags: z.array(z.string().min(1).max(50)).optional(),
    }),
  }),
});

// Export types
export type IClientCandidateShortlistCreateValidator = z.infer<
  typeof clientCandidateShortlistCreateValidator
>;

export type IClientCandidateShortlistUpdateValidator = z.infer<
  typeof clientCandidateShortlistUpdateValidator
>;

export type IClientCandidateShortlistGetValidator = z.infer<
  typeof clientCandidateShortlistGetValidator
>;

export type IClientCandidateShortlistListValidator = z.infer<
  typeof clientCandidateShortlistListValidator
>;

export type IClientCandidateShortlistDeleteValidator = z.infer<
  typeof clientCandidateShortlistDeleteValidator
>;

export type IClientCandidateShortlistBulkUpdateValidator = z.infer<
  typeof clientCandidateShortlistBulkUpdateValidator
>;
