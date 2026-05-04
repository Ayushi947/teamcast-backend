import { z } from 'zod';
import {
  partnerDocumentUploadRequestValidator,
  partnerDocumentConfirmUploadValidator,
  partnerDocumentListValidator,
  partnerDocumentDownloadValidator,
  partnerDocumentDeleteValidator,
} from '../partner/document.validator';
import {
  clientDocumentUploadRequestValidator,
  clientDocumentConfirmUploadValidator,
  clientDocumentListValidator,
  clientDocumentDownloadValidator,
  clientDocumentDeleteValidator,
} from '../client/document.validator';
import {
  candidateDocumentUploadRequestValidator,
  candidateDocumentConfirmUploadValidator,
  candidateDocumentListValidator,
  candidateDocumentDownloadValidator,
  candidateDocumentDeleteValidator,
} from '../candidate/document.validator';
import {
  supportDocumentUploadRequestValidator,
  supportDocumentConfirmUploadValidator,
  supportDocumentListValidator,
  supportDocumentDownloadValidator,
  supportDocumentDeleteValidator,
} from '../support/document.validator';
import { DocumentTypeEnum } from '../../models/common/enums';

/**
 * Common document validation schemas
 */

// Entity type validation
export const entityTypeSchema = z.enum([
  'partner',
  'client',
  'candidate',
  'support',
]);

// Document type validation
export const documentTypeSchema = z.nativeEnum(DocumentTypeEnum);

// Generic document validation (fallback for general use)
export const genericDocumentUploadRequestValidator = z.object({
  params: z.object({
    entityType: entityTypeSchema,
    entityId: z.string().uuid('Invalid entity ID format'),
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
    documentType: documentTypeSchema,
  }),
});

export const genericDocumentConfirmUploadValidator = z.object({
  params: z.object({
    entityType: entityTypeSchema,
    entityId: z.string().uuid('Invalid entity ID format'),
  }),
  body: z.object({
    documentId: z.string().uuid('Invalid document ID format'),
  }),
});

export const genericDocumentListValidator = z.object({
  params: z.object({
    entityType: entityTypeSchema,
    entityId: z.string().uuid('Invalid entity ID format'),
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

export const genericDocumentDownloadValidator = z.object({
  params: z.object({
    entityType: entityTypeSchema,
    entityId: z.string().uuid('Invalid entity ID format'),
    documentId: z.string().uuid('Invalid document ID format'),
  }),
  query: z
    .object({
      action: z.enum(['download', 'preview']).optional().default('download'),
    })
    .optional(),
});

export const genericDocumentDeleteValidator = z.object({
  params: z.object({
    entityType: entityTypeSchema,
    entityId: z.string().uuid('Invalid entity ID format'),
    documentId: z.string().uuid('Invalid document ID format'),
  }),
});

/**
 * Validator selector - returns entity-specific validator or generic fallback
 */
export const getDocumentValidator = (
  entityType: string,
  operationType: string
) => {
  const validators = {
    partner: {
      uploadRequest: partnerDocumentUploadRequestValidator,
      confirmUpload: partnerDocumentConfirmUploadValidator,
      list: partnerDocumentListValidator,
      download: partnerDocumentDownloadValidator,
      delete: partnerDocumentDeleteValidator,
    },
    client: {
      uploadRequest: clientDocumentUploadRequestValidator,
      confirmUpload: clientDocumentConfirmUploadValidator,
      list: clientDocumentListValidator,
      download: clientDocumentDownloadValidator,
      delete: clientDocumentDeleteValidator,
    },
    candidate: {
      uploadRequest: candidateDocumentUploadRequestValidator,
      confirmUpload: candidateDocumentConfirmUploadValidator,
      list: candidateDocumentListValidator,
      download: candidateDocumentDownloadValidator,
      delete: candidateDocumentDeleteValidator,
    },
    support: {
      uploadRequest: supportDocumentUploadRequestValidator,
      confirmUpload: supportDocumentConfirmUploadValidator,
      list: supportDocumentListValidator,
      download: supportDocumentDownloadValidator,
      delete: supportDocumentDeleteValidator,
    },
  };

  const genericValidators = {
    uploadRequest: genericDocumentUploadRequestValidator,
    confirmUpload: genericDocumentConfirmUploadValidator,
    list: genericDocumentListValidator,
    download: genericDocumentDownloadValidator,
    delete: genericDocumentDeleteValidator,
  };

  // Return entity-specific validator or generic fallback
  return (
    validators[entityType as keyof typeof validators]?.[
      operationType as keyof typeof validators.partner
    ] || genericValidators[operationType as keyof typeof genericValidators]
  );
};

/**
 * Type exports
 */
export type EntityTypeSchema = z.infer<typeof entityTypeSchema>;
export type GenericDocumentUploadRequest = z.infer<
  typeof genericDocumentUploadRequestValidator
>;
export type GenericDocumentConfirmUpload = z.infer<
  typeof genericDocumentConfirmUploadValidator
>;
export type GenericDocumentList = z.infer<typeof genericDocumentListValidator>;
export type GenericDocumentDownload = z.infer<
  typeof genericDocumentDownloadValidator
>;
export type GenericDocumentDelete = z.infer<
  typeof genericDocumentDeleteValidator
>;
