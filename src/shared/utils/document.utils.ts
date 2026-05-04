import { DocumentTypeEnum } from '../models/common/enums';

/**
 * Document utility functions
 */

/**
 * Get all valid document types as an array
 */
export const getValidDocumentTypes = (): string[] => {
  return Object.values(DocumentTypeEnum);
};

/**
 * Check if a document type is valid
 */
export const isValidDocumentType = (
  documentType: string
): documentType is DocumentTypeEnum => {
  return Object.values(DocumentTypeEnum).includes(
    documentType as DocumentTypeEnum
  );
};

/**
 * Get a formatted list of valid document types for error messages
 */
export const getDocumentTypesList = (): string => {
  return Object.values(DocumentTypeEnum).join(', ');
};

/**
 * Get document type description
 */
export const getDocumentTypeDescription = (
  documentType: DocumentTypeEnum
): string => {
  const descriptions: Record<DocumentTypeEnum, string> = {
    [DocumentTypeEnum.CONTRACT]: 'Legal contract or agreement document',
    [DocumentTypeEnum.CERTIFICATE]: 'Certificate of completion or achievement',
    [DocumentTypeEnum.LEGAL]: 'Legal document or compliance material',
    [DocumentTypeEnum.INVOICE]: 'Invoice or billing document',
    [DocumentTypeEnum.AGREEMENT]: 'Agreement or memorandum of understanding',
    [DocumentTypeEnum.LICENSE]: 'License or permit document',
    [DocumentTypeEnum.WORK_PERMIT]: 'Work permit or authorization document',
    [DocumentTypeEnum.PASSPORT]: 'Passport or identity document',
    [DocumentTypeEnum.DRIVING_LICENSE]: 'Driving license or identification',
    [DocumentTypeEnum.VISA]: 'Visa or travel document',
    [DocumentTypeEnum.NATIONAL_ID]: 'National ID or identity document',
    [DocumentTypeEnum.SOCIAL_SECURITY_NUMBER]:
      'Social security number or identification',
    [DocumentTypeEnum.TAX_ID]: 'Tax ID or identification',
    [DocumentTypeEnum.BANK_STATEMENT]: 'Bank statement or financial document',
    [DocumentTypeEnum.BANK_ACCOUNT]: 'Bank account or financial document',
    [DocumentTypeEnum.OTHER]: 'Other document type',
    [DocumentTypeEnum.SUPPORT_TICKET_ATTACHMENT]: 'Support Ticket Attachment',
  };

  return descriptions[documentType] || 'Unknown document type';
};

/**
 * Get document type category for grouping
 */
export const getDocumentTypeCategory = (
  documentType: DocumentTypeEnum
): string => {
  const categories: Record<DocumentTypeEnum, string> = {
    [DocumentTypeEnum.CONTRACT]: 'Legal',
    [DocumentTypeEnum.CERTIFICATE]: 'Professional',
    [DocumentTypeEnum.LEGAL]: 'Legal',
    [DocumentTypeEnum.INVOICE]: 'Financial',
    [DocumentTypeEnum.AGREEMENT]: 'Legal',
    [DocumentTypeEnum.LICENSE]: 'Legal',
    [DocumentTypeEnum.WORK_PERMIT]: 'Legal',
    [DocumentTypeEnum.PASSPORT]: 'Legal',
    [DocumentTypeEnum.DRIVING_LICENSE]: 'Legal',
    [DocumentTypeEnum.VISA]: 'Legal',
    [DocumentTypeEnum.NATIONAL_ID]: 'Legal',
    [DocumentTypeEnum.SOCIAL_SECURITY_NUMBER]: 'Legal',
    [DocumentTypeEnum.TAX_ID]: 'Legal',
    [DocumentTypeEnum.BANK_STATEMENT]: 'Legal',
    [DocumentTypeEnum.BANK_ACCOUNT]: 'Legal',
    [DocumentTypeEnum.OTHER]: 'Miscellaneous',
    [DocumentTypeEnum.SUPPORT_TICKET_ATTACHMENT]: 'Support Ticket',
  };

  return categories[documentType] || 'Unknown';
};
