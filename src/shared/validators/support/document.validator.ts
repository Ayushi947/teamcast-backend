import { z } from 'zod';

/**
 * Support document validation schemas
 */

export const supportDocumentUploadRequestValidator = z.object({
  params: z.object({
    entityType: z.literal('support'),
    entityId: z.string().uuid('Invalid support user ID format'),
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

export const supportDocumentConfirmUploadValidator = z.object({
  params: z.object({
    entityType: z.literal('support'),
    entityId: z.string().uuid('Invalid support user ID format'),
  }),
  body: z.object({
    documentId: z.string().uuid('Invalid document ID format'),
  }),
});

export const supportDocumentListValidator = z.object({
  params: z.object({
    entityType: z.literal('support'),
    entityId: z.string().uuid('Invalid support user ID format'),
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

export const supportDocumentDownloadValidator = z.object({
  params: z.object({
    entityType: z.literal('support'),
    entityId: z.string().uuid('Invalid support user ID format'),
    documentId: z.string().uuid('Invalid document ID format'),
  }),
});

export const supportDocumentDeleteValidator = z.object({
  params: z.object({
    entityType: z.literal('support'),
    entityId: z.string().uuid('Invalid support user ID format'),
    documentId: z.string().uuid('Invalid document ID format'),
  }),
});

/**
 * Type exports for TypeScript
 */
export type SupportDocumentUploadRequest = z.infer<
  typeof supportDocumentUploadRequestValidator
>;
export type SupportDocumentConfirmUpload = z.infer<
  typeof supportDocumentConfirmUploadValidator
>;
export type SupportDocumentList = z.infer<typeof supportDocumentListValidator>;
export type SupportDocumentDownload = z.infer<
  typeof supportDocumentDownloadValidator
>;
export type SupportDocumentDelete = z.infer<
  typeof supportDocumentDeleteValidator
>;
