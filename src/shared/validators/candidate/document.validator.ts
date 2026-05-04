import { z } from 'zod';

/**
 * Candidate document validation schemas
 */

export const candidateDocumentUploadRequestValidator = z.object({
  params: z.object({
    entityType: z.literal('candidate'),
    entityId: z.string().uuid('Invalid candidate ID format'),
  }),
  body: z.object({
    fileName: z
      .string()
      .min(1, 'File name is required')
      .max(255, 'File name must be less than 255 characters'),
    fileType: z
      .string()
      .regex(/^[a-zA-Z0-9]+\/[a-zA-Z0-9\-+.]+$/, 'Invalid file type format'),
    fileSize: z
      .number()
      .int('File size must be an integer')
      .min(1, 'File size must be greater than 0')
      .max(100 * 1024 * 1024, 'File size must be less than 100MB'),
    documentType: z
      .string()
      .min(1, 'Document type is required')
      .max(50, 'Document type must be less than 50 characters'),
  }),
});

export const candidateDocumentConfirmUploadValidator = z.object({
  params: z.object({
    entityType: z.literal('candidate'),
    entityId: z.string().uuid('Invalid candidate ID format'),
  }),
  body: z.object({
    documentId: z.string().uuid('Invalid document ID format'),
  }),
});

export const candidateDocumentListValidator = z.object({
  params: z.object({
    entityType: z.literal('candidate'),
    entityId: z.string().uuid('Invalid candidate ID format'),
  }),
  query: z.object({
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined))
      .refine((val) => val === undefined || (val >= 1 && val <= 100), {
        message: 'Limit must be between 1 and 100',
      }),
    offset: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined))
      .refine((val) => val === undefined || val >= 0, {
        message: 'Offset must be 0 or greater',
      }),
    type: z.string().optional(),
  }),
});

export const candidateDocumentDownloadValidator = z.object({
  params: z.object({
    entityType: z.literal('candidate'),
    entityId: z.string().uuid('Invalid candidate ID format'),
    documentId: z.string().uuid('Invalid document ID format'),
  }),
});

export const candidateDocumentDeleteValidator = z.object({
  params: z.object({
    entityType: z.literal('candidate'),
    entityId: z.string().uuid('Invalid candidate ID format'),
    documentId: z.string().uuid('Invalid document ID format'),
  }),
});

/**
 * Type exports for TypeScript
 */
export type CandidateDocumentUploadRequest = z.infer<
  typeof candidateDocumentUploadRequestValidator
>;
export type CandidateDocumentConfirmUpload = z.infer<
  typeof candidateDocumentConfirmUploadValidator
>;
export type CandidateDocumentList = z.infer<
  typeof candidateDocumentListValidator
>;
export type CandidateDocumentDownload = z.infer<
  typeof candidateDocumentDownloadValidator
>;
export type CandidateDocumentDelete = z.infer<
  typeof candidateDocumentDeleteValidator
>;
