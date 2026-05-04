import { z } from 'zod';

/**
 * Client document validation schemas
 */

export const clientDocumentUploadRequestValidator = z.object({
  params: z.object({
    entityType: z.literal('client'),
    entityId: z.string().uuid('Invalid client ID format'),
  }),
  body: z.object({
    fileName: z
      .string()
      .min(1, 'File name is required')
      .max(255, 'File name must be less than 255 characters'),
    name: z
      .string()
      .min(1, 'Document name must not be empty')
      .max(255, 'Document name must be less than 255 characters')
      .optional(),
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

export const clientDocumentConfirmUploadValidator = z.object({
  params: z.object({
    entityType: z.literal('client'),
    entityId: z.string().uuid('Invalid client ID format'),
  }),
  body: z.object({
    documentId: z.string().uuid('Invalid document ID format'),
  }),
});

export const clientDocumentListValidator = z.object({
  params: z.object({
    entityType: z.literal('client'),
    entityId: z.string().uuid('Invalid client ID format'),
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

export const clientDocumentDownloadValidator = z.object({
  params: z.object({
    entityType: z.literal('client'),
    entityId: z.string().uuid('Invalid client ID format'),
    documentId: z.string().uuid('Invalid document ID format'),
  }),
});

export const clientDocumentDeleteValidator = z.object({
  params: z.object({
    entityType: z.literal('client'),
    entityId: z.string().uuid('Invalid client ID format'),
    documentId: z.string().uuid('Invalid document ID format'),
  }),
});

/**
 * Type exports for TypeScript
 */
export type ClientDocumentUploadRequest = z.infer<
  typeof clientDocumentUploadRequestValidator
>;
export type ClientDocumentConfirmUpload = z.infer<
  typeof clientDocumentConfirmUploadValidator
>;
export type ClientDocumentList = z.infer<typeof clientDocumentListValidator>;
export type ClientDocumentDownload = z.infer<
  typeof clientDocumentDownloadValidator
>;
export type ClientDocumentDelete = z.infer<
  typeof clientDocumentDeleteValidator
>;
