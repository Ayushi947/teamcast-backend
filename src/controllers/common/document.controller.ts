import { Request, Response } from 'express';
import { singleton } from '@/shared/decorators/singleton';
import { DocumentService } from '@/services/common/document.service';
import { EntityType } from '@/shared/models/domain/common/document.domain';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';
import {
  isValidDocumentType,
  getDocumentTypesList,
} from '@/shared/utils/document.utils';
import { DocumentTypeEnum } from '@/shared/models/common/enums';

@singleton
export class DocumentController {
  private readonly documentService: DocumentService;

  constructor(documentService: DocumentService) {
    this.documentService = documentService;
  }

  /**
   * Upload document directly (single call)
   */
  public async uploadDocument(req: Request, res: Response): Promise<void> {
    try {
      const { entityType, entityId } = req.params;
      const { documentType, name } = req.body;
      const file = req.file;
      const uploadedBy = req.user?.id;

      if (!uploadedBy) {
        throw new AppError(
          'User not authenticated',
          401,
          ErrorCode.UNAUTHORIZED
        );
      }

      if (!file) {
        throw new AppError('No file provided', 400, ErrorCode.INVALID_REQUEST);
      }

      // Validate entity type
      if (!Object.values(EntityType).includes(entityType as EntityType)) {
        throw new AppError(
          'Invalid entity type',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      // Validate document type
      if (!documentType || !isValidDocumentType(documentType)) {
        throw new AppError(
          `Invalid document type. Must be one of: ${getDocumentTypesList()}`,
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      const result = await this.documentService.uploadDocument(
        entityType as EntityType,
        entityId,
        file.buffer,
        {
          fileName: file.originalname,
          name: name || undefined,
          fileType: file.mimetype,
          fileSize: file.size,
          documentType: documentType as DocumentTypeEnum,
        },
        uploadedBy
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error({
        message: 'Failed to upload document',
        context: 'DocumentController.uploadDocument',
        error: error instanceof Error ? error.message : 'Unknown error',
        params: req.params,
        body: req.body,
        file: req.file
          ? {
              originalname: req.file.originalname,
              size: req.file.size,
              mimetype: req.file.mimetype,
            }
          : null,
      });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          errorCode: error.code,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
          errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
        });
      }
    }
  }

  /**
   * Download document directly or get preview URL based on action parameter
   */
  public async downloadDocument(req: Request, res: Response): Promise<void> {
    try {
      const { entityType, entityId, documentId } = req.params;
      const { action = 'download' } = req.query; // Default to download

      // Validate entity type
      if (!Object.values(EntityType).includes(entityType as EntityType)) {
        throw new AppError(
          'Invalid entity type',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      // Validate action parameter
      if (!['download', 'preview'].includes(action as string)) {
        throw new AppError(
          "Invalid action parameter. Must be 'download' or 'preview'",
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      if (action === 'preview') {
        // Get preview URL
        const result = await this.documentService.getPreviewUrl(
          documentId,
          entityType as EntityType,
          entityId
        );

        res.status(200).json({
          success: true,
          data: result,
        });
      } else {
        // Download file directly
        const result = await this.documentService.downloadDocument(
          documentId,
          entityType as EntityType,
          entityId
        );

        // Set appropriate headers for file download
        res.setHeader(
          'Content-Type',
          result.document.mimeType || 'application/octet-stream'
        );
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${result.document.originalFileName || result.document.name}"`
        );
        res.setHeader('Content-Length', result.buffer.length);

        // Send the file buffer
        res.send(result.buffer);
      }
    } catch (error) {
      logger.error({
        message: `Failed to ${req.query.action || 'download'} document`,
        context: 'DocumentController.downloadDocument',
        error: error instanceof Error ? error.message : 'Unknown error',
        params: req.params,
        query: req.query,
      });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          errorCode: error.code,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
          errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
        });
      }
    }
  }

  /**
   * List documents for an entity
   */
  public async listDocuments(req: Request, res: Response): Promise<void> {
    try {
      const { entityType, entityId } = req.params;
      const { limit, offset, type, includeDownloadUrls } = req.query;

      // Validate entity type
      if (!Object.values(EntityType).includes(entityType as EntityType)) {
        throw new AppError(
          'Invalid entity type',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      const result = await this.documentService.listDocuments(
        entityType as EntityType,
        entityId,
        {
          limit: limit ? parseInt(limit as string) : undefined,
          offset: offset ? parseInt(offset as string) : undefined,
          type: type as string,
          includeDownloadUrls: includeDownloadUrls === 'true', // Default to false now
        }
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error({
        message: 'Failed to list documents',
        context: 'DocumentController.listDocuments',
        error: error instanceof Error ? error.message : 'Unknown error',
        params: req.params,
        query: req.query,
      });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          errorCode: error.code,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
          errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
        });
      }
    }
  }

  /**
   * Delete a document
   */
  public async deleteDocument(req: Request, res: Response): Promise<void> {
    try {
      const { entityType, entityId, documentId } = req.params;

      // Validate entity type
      if (!Object.values(EntityType).includes(entityType as EntityType)) {
        throw new AppError(
          'Invalid entity type',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      await this.documentService.deleteDocument(
        documentId,
        entityType as EntityType,
        entityId
      );

      res.status(200).json({
        success: true,
        message: 'Document deleted successfully',
      });
    } catch (error) {
      logger.error({
        message: 'Failed to delete document',
        context: 'DocumentController.deleteDocument',
        error: error instanceof Error ? error.message : 'Unknown error',
        params: req.params,
      });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          errorCode: error.code,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
          errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
        });
      }
    }
  }
}
