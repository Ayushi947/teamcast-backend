import { z } from 'zod';
import {
  ICompanyVerificationStatus,
  VerificationStatus,
} from '../../models/common/enums';

/**
 * Schema for creating a document config
 */
export const createDocumentConfigSchema = z.object({
  body: z.object({
    countryName: z.string().min(1, 'Country name is required'),
    documentConfig: z
      .array(
        z.object({
          name: z.string().min(1, 'Document name is required'),
          type: z.string().min(1, 'Document type is required'),
          required: z.boolean(),
        })
      )
      .min(1, 'At least one document config is required'),
  }),
});

/**
 * Schema for getting documents by country
 */
export const getDocumentsByCountrySchema = z.object({
  params: z.object({
    countryName: z.string().min(1, 'Country name is required'),
  }),
});

/**
 * Schema for updating company verification status
 */
export const updateCompanyVerificationStatusSchema = z.object({
  params: z.object({
    companyId: z.string().uuid('Invalid company ID'),
  }),
  body: z.object({
    status: z.nativeEnum(ICompanyVerificationStatus),
    remarks: z.string().optional(),
  }),
});

/**
 * Schema for verifying a document
 */
export const documentVerificationSchema = z.object({
  params: z.object({
    documentId: z.string().uuid('Invalid document ID'),
  }),
  body: z.object({
    status: z.nativeEnum(VerificationStatus),
    remarks: z.string().optional(),
  }),
});

/**
 * Schema for getting document preview URL
 */
export const documentPreviewSchema = z.object({
  params: z.object({
    documentId: z.string().uuid('Invalid document ID'),
  }),
});
