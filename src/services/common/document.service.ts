import { PrismaClient } from '@prisma/client';
import { singleton } from '@/shared/decorators/singleton';
import { IStorageProvider } from '../helpers/storage/storage.interface';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';
import {
  EntityType,
  IDocument,
  IDocumentUploadRequest,
  IDocumentUploadUrlResponse,
  IDocumentListResponse,
  IDocumentDownloadResponse,
} from '@/shared/models/domain/common/document.domain';
import {
  getBucketFolderPathToEntityDocuments,
  getBucketFolderPathToPartnerDocuments,
  getBucketFolderPathToClientDocuments,
  getBucketFolderPathToCandidateDocuments,
  getBucketFolderPathToSupportDocuments,
} from '@/utils/presigned.urls';
import { v4 as uuidv4 } from 'uuid';

@singleton
export class DocumentService {
  private readonly prisma: PrismaClient;

  constructor(private readonly storageService: IStorageProvider) {
    this.prisma = new PrismaClient();
  }

  /**
   * Generate pre-signed URL for document upload
   */
  async generateUploadUrl(
    entityType: EntityType,
    entityId: string,
    uploadRequest: IDocumentUploadRequest,
    uploadedBy: string
  ): Promise<IDocumentUploadUrlResponse> {
    try {
      // Validate that the entity exists before proceeding
      await this.validateEntityExists(entityType, entityId);

      // Generate unique document ID and file name
      const documentId = uuidv4();
      const fileExtension = this.getFileExtension(uploadRequest.fileName);
      const uniqueFileName = `${documentId}_${Date.now()}${fileExtension}`;

      // Get the appropriate folder path
      const { folderPath } = this.getFolderPath(entityType, entityId);
      const filePath = `${folderPath}/${uniqueFileName}`;

      // Generate pre-signed URL for upload
      const uploadUrl = await this.storageService.generatePreSignedUrl(
        filePath,
        'write',
        uploadRequest.fileType
      );

      // Create a pending document record
      await this.createPendingDocumentRecord(
        documentId,
        entityType,
        entityId,
        {
          ...uploadRequest,
          fileName: uniqueFileName,
          filePath,
        },
        uploadedBy
      );

      return {
        uploadUrl,
        documentId,
        filePath,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to generate upload URL',
        context: 'DocumentService.generateUploadUrl',
        error: error instanceof Error ? error.message : 'Unknown error',
        entityType,
        entityId,
        uploadRequest,
      });
      throw error;
    }
  }

  /**
   * Direct upload of document file (single call alternative to generateUploadUrl + confirmUpload)
   */
  async uploadDocument(
    entityType: EntityType,
    entityId: string,
    file: Buffer,
    uploadRequest: IDocumentUploadRequest,
    uploadedBy: string
  ): Promise<IDocument> {
    try {
      // Validate that the entity exists before proceeding
      await this.validateEntityExists(entityType, entityId);

      // Generate unique document ID and file name
      const documentId = uuidv4();
      const fileExtension = this.getFileExtension(uploadRequest.fileName);
      const uniqueFileName = `${documentId}_${Date.now()}${fileExtension}`;

      // Get the appropriate folder path
      const { folderPath } = this.getFolderPath(entityType, entityId);
      const filePath = `${folderPath}/${uniqueFileName}`;

      // Upload file directly to storage
      const uploadedUrl = await this.storageService.uploadFile(file, filePath);

      // Create document record directly (no pending state needed)
      const document = await this.createDocumentRecord(
        documentId,
        entityType,
        entityId,
        {
          ...uploadRequest,
          fileName: uniqueFileName,
          filePath: uploadedUrl,
        },
        uploadedBy
      );

      return this.mapToDocumentInterface(document);
    } catch (error) {
      logger.error({
        message: 'Failed to upload document',
        context: 'DocumentService.uploadDocument',
        error: error instanceof Error ? error.message : 'Unknown error',
        entityType,
        entityId,
        uploadRequest,
      });
      throw error;
    }
  }

  /**
   * Confirm document upload and finalize the record
   */
  async confirmUpload(
    documentId: string,
    entityType: EntityType,
    entityId: string
  ): Promise<IDocument> {
    try {
      // Find the pending document
      const document = await this.findPendingDocument(
        documentId,
        entityType,
        entityId
      );

      if (!document) {
        throw new AppError('Document not found', 404, ErrorCode.NOT_FOUND);
      }

      // Update the document status to confirmed
      const confirmedDocument = await this.finalizePendingDocument(
        documentId,
        entityType
      );

      return this.mapToDocumentInterface(confirmedDocument);
    } catch (error) {
      logger.error({
        message: 'Failed to confirm upload',
        context: 'DocumentService.confirmUpload',
        error: error instanceof Error ? error.message : 'Unknown error',
        documentId,
        entityType,
        entityId,
      });
      throw error;
    }
  }

  /**
   * Get document download URL (pre-signed URL approach)
   */
  async getDownloadUrl(
    documentId: string,
    entityType: EntityType,
    entityId: string
  ): Promise<IDocumentDownloadResponse> {
    try {
      // Validate that the entity exists
      await this.validateEntityExists(entityType, entityId);

      // Find the document
      const document = await this.findDocument(
        documentId,
        entityType,
        entityId
      );
      if (!document) {
        throw new AppError('Document not found', 404, ErrorCode.NOT_FOUND);
      }

      // Generate download URL
      const downloadUrl = await this.storageService.generatePreSignedUrl(
        document.url,
        'read'
      );

      // URLs typically expire in 1 hour
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      return {
        downloadUrl,
        expiresAt,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to generate download URL',
        context: 'DocumentService.getDownloadUrl',
        error: error instanceof Error ? error.message : 'Unknown error',
        documentId,
        entityType,
        entityId,
      });
      throw error;
    }
  }

  /**
   * Get document preview URL (pre-signed URL approach)
   * Similar to download but with potentially different expiration and access controls
   */
  async getPreviewUrl(
    documentId: string,
    entityType: EntityType,
    entityId: string
  ): Promise<IDocumentDownloadResponse> {
    try {
      // Validate that the entity exists
      await this.validateEntityExists(entityType, entityId);

      // Find the document
      const document = await this.findDocument(
        documentId,
        entityType,
        entityId
      );
      if (!document) {
        throw new AppError('Document not found', 404, ErrorCode.NOT_FOUND);
      }

      // Generate preview URL (same as download for now, but can be customized)
      const previewUrl = await this.storageService.generatePreSignedUrl(
        document.url,
        'read'
      );

      // Preview URLs might have longer expiration (e.g., 2 hours) for better UX
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 2);

      return {
        downloadUrl: previewUrl, // Using the same interface, but this is actually previewUrl
        expiresAt,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to generate preview URL',
        context: 'DocumentService.getPreviewUrl',
        error: error instanceof Error ? error.message : 'Unknown error',
        documentId,
        entityType,
        entityId,
      });
      throw error;
    }
  }

  /**
   * Direct download of document file (returns file buffer)
   */
  async downloadDocument(
    documentId: string,
    entityType: EntityType,
    entityId: string
  ): Promise<{ buffer: Buffer; document: IDocument }> {
    try {
      // Validate that the entity exists
      await this.validateEntityExists(entityType, entityId);

      // Find the document
      const document = await this.findDocument(
        documentId,
        entityType,
        entityId
      );
      if (!document) {
        throw new AppError('Document not found', 404, ErrorCode.NOT_FOUND);
      }

      // Download file directly from storage
      const fileBuffer = await this.storageService.downloadFile(document.url);

      return {
        buffer: fileBuffer,
        document: this.mapToDocumentInterface(document),
      };
    } catch (error) {
      logger.error({
        message: 'Failed to download document',
        context: 'DocumentService.downloadDocument',
        error: error instanceof Error ? error.message : 'Unknown error',
        documentId,
        entityType,
        entityId,
      });
      throw error;
    }
  }

  /**
   * List documents for an entity
   */
  async listDocuments(
    entityType: EntityType,
    entityId: string,
    options?: {
      limit?: number;
      offset?: number;
      type?: string;
      includeDownloadUrls?: boolean; // New option to control URL generation
    }
  ): Promise<IDocumentListResponse> {
    try {
      // Validate that the entity exists
      await this.validateEntityExists(entityType, entityId);

      // Get documents and total count
      const [documents, total] = await Promise.all([
        this.findDocumentsByEntity(entityType, entityId, options),
        this.countDocumentsByEntity(entityType, entityId),
      ]);

      // Conditionally generate download URLs for each document
      const documentsWithUrls = await Promise.all(
        documents.map(async (doc) => {
          const mappedDoc = this.mapToDocumentInterface(doc);

          if (options?.includeDownloadUrls !== false) {
            try {
              const downloadUrl =
                await this.storageService.generatePreSignedUrl(doc.url, 'read');
              return {
                ...mappedDoc,
                url: downloadUrl,
              };
            } catch (error) {
              logger.warn({
                message: 'Failed to generate download URL for document',
                context: 'DocumentService.listDocuments',
                error: error instanceof Error ? error.message : 'Unknown error',
                documentId: doc.id,
              });
              return mappedDoc;
            }
          }

          return mappedDoc;
        })
      );

      return {
        documents: documentsWithUrls,
        total,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to list documents',
        context: 'DocumentService.listDocuments',
        error: error instanceof Error ? error.message : 'Unknown error',
        entityType,
        entityId,
        options,
      });
      throw error;
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(
    documentId: string,
    entityType: EntityType,
    entityId: string
  ): Promise<void> {
    try {
      // Validate that the entity exists
      await this.validateEntityExists(entityType, entityId);

      // Find the document to ensure it exists and belongs to the entity
      const document = await this.findDocument(
        documentId,
        entityType,
        entityId
      );
      if (!document) {
        throw new AppError('Document not found', 404, ErrorCode.NOT_FOUND);
      }

      // Delete from storage
      try {
        await this.storageService.generatePreSignedUrl(document.url, 'delete');
      } catch (error) {
        logger.warn({
          message: 'Failed to delete file from storage (file may not exist)',
          context: 'DocumentService.deleteDocument',
          error: error instanceof Error ? error.message : 'Unknown error',
          documentId,
          filePath: document.url,
        });
      }

      // Delete from database
      await this.deleteDocumentFromDatabase(documentId, entityType);

      logger.info({
        message: 'Document deleted successfully',
        context: 'DocumentService.deleteDocument',
        documentId,
        entityType,
        entityId,
      });
    } catch (error) {
      logger.error({
        message: 'Failed to delete document',
        context: 'DocumentService.deleteDocument',
        error: error instanceof Error ? error.message : 'Unknown error',
        documentId,
        entityType,
        entityId,
      });
      throw error;
    }
  }

  // Private helper methods

  private getFolderPath(
    entityType: EntityType,
    entityId: string
  ): { folderPath: string } {
    switch (entityType) {
      case EntityType.PARTNER:
        return getBucketFolderPathToPartnerDocuments(entityId);
      case EntityType.CLIENT:
        return getBucketFolderPathToClientDocuments(entityId);
      case EntityType.CANDIDATE:
        return getBucketFolderPathToCandidateDocuments(entityId);
      case EntityType.SUPPORT:
        return getBucketFolderPathToSupportDocuments(entityId);
      default:
        return getBucketFolderPathToEntityDocuments(entityType, entityId);
    }
  }

  private getFileExtension(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : '';
  }

  private async createPendingDocumentRecord(
    documentId: string,
    entityType: EntityType,
    entityId: string,
    uploadRequest: IDocumentUploadRequest & {
      fileName: string;
      filePath: string;
    },
    uploadedBy: string
  ): Promise<void> {
    // Use provided name or fall back to original fileName
    const documentName = uploadRequest.name || uploadRequest.fileName;

    switch (entityType) {
      case EntityType.PARTNER:
        await this.prisma.partner_document.create({
          data: {
            id: documentId,
            partnerId: entityId,
            name: documentName,
            type: uploadRequest.documentType,
            size: BigInt(uploadRequest.fileSize),
            url: uploadRequest.filePath,
            uploadedBy,
          },
        });
        break;
      case EntityType.CLIENT:
        await this.prisma.client_document.create({
          data: {
            id: documentId,
            clientId: entityId,
            name: documentName,
            type: uploadRequest.documentType,
            size: BigInt(uploadRequest.fileSize),
            url: uploadRequest.filePath,
            uploadedBy,
          },
        });
        break;
      // TODO: Add other entity types when their document models are added to the schema
      // case EntityType.CANDIDATE:
      // case EntityType.SUPPORT:
      default:
        throw new AppError(
          `Document creation not implemented for entity type: ${entityType}`,
          501,
          ErrorCode.INTERNAL_SERVER_ERROR
        );
    }
  }

  private async findPendingDocument(
    documentId: string,
    entityType: EntityType,
    entityId: string
  ): Promise<any> {
    switch (entityType) {
      case EntityType.PARTNER:
        return await this.prisma.partner_document.findFirst({
          where: { id: documentId, partnerId: entityId },
        });
      case EntityType.CLIENT:
        return await this.prisma.client_document.findFirst({
          where: { id: documentId, clientId: entityId },
        });
      // TODO: Add other entity types when their document models are added to the schema
      // case EntityType.CANDIDATE:
      // case EntityType.SUPPORT:
      default:
        throw new AppError(
          `Document lookup not implemented for entity type: ${entityType}`,
          501,
          ErrorCode.INTERNAL_SERVER_ERROR
        );
    }
  }

  private async finalizePendingDocument(
    documentId: string,
    entityType: EntityType
  ): Promise<IDocument> {
    // For now, just return the document as is since we're not tracking pending status
    // In the future, you might want to add a status field to track pending vs confirmed
    return await this.findDocumentById(documentId, entityType);
  }

  private async findDocument(
    documentId: string,
    entityType: EntityType,
    entityId: string
  ): Promise<any> {
    switch (entityType) {
      case EntityType.PARTNER:
        return await this.prisma.partner_document.findFirst({
          where: { id: documentId, partnerId: entityId },
        });
      case EntityType.CLIENT:
        return await this.prisma.client_document.findFirst({
          where: { id: documentId, clientId: entityId },
        });
      // TODO: Add other entity types when their document models are added to the schema
      // case EntityType.CANDIDATE:
      // case EntityType.SUPPORT:
      default:
        throw new AppError(
          `Document lookup not implemented for entity type: ${entityType}`,
          501,
          ErrorCode.INTERNAL_SERVER_ERROR
        );
    }
  }

  private async findDocumentById(
    documentId: string,
    entityType: EntityType
  ): Promise<any> {
    switch (entityType) {
      case EntityType.PARTNER:
        return await this.prisma.partner_document.findUnique({
          where: { id: documentId },
        });
      case EntityType.CLIENT:
        return await this.prisma.client_document.findUnique({
          where: { id: documentId },
        });
      // TODO: Add other entity types when their document models are added to the schema
      // case EntityType.CANDIDATE:
      // case EntityType.SUPPORT:
      default:
        throw new AppError(
          `Document lookup not implemented for entity type: ${entityType}`,
          501,
          ErrorCode.INTERNAL_SERVER_ERROR
        );
    }
  }

  private async findDocumentsByEntity(
    entityType: EntityType,
    entityId: string,
    options?: {
      limit?: number;
      offset?: number;
      type?: string;
    }
  ): Promise<any[]> {
    const where: any = {};
    const take = options?.limit || 50;
    const skip = options?.offset || 0;

    switch (entityType) {
      case EntityType.PARTNER:
        where.partnerId = entityId;
        if (options?.type) where.type = options.type;
        return await this.prisma.partner_document.findMany({
          where,
          take,
          skip,
          orderBy: { createdAt: 'desc' },
        });
      case EntityType.CLIENT:
        where.clientId = entityId;
        if (options?.type) where.type = options.type;
        return await this.prisma.client_document.findMany({
          where,
          take,
          skip,
          orderBy: { createdAt: 'desc' },
        });
      // TODO: Add other entity types when their document models are added to the schema
      // case EntityType.CANDIDATE:
      // case EntityType.SUPPORT:
      default:
        throw new AppError(
          `Document listing not implemented for entity type: ${entityType}`,
          501,
          ErrorCode.INTERNAL_SERVER_ERROR
        );
    }
  }

  private async countDocumentsByEntity(
    entityType: EntityType,
    entityId: string
  ): Promise<number> {
    const where: any = {};

    switch (entityType) {
      case EntityType.PARTNER:
        where.partnerId = entityId;
        return await this.prisma.partner_document.count({ where });
      case EntityType.CLIENT:
        where.clientId = entityId;
        return await this.prisma.client_document.count({ where });
      // TODO: Add other entity types when their document models are added to the schema
      // case EntityType.CANDIDATE:
      // case EntityType.SUPPORT:
      default:
        throw new AppError(
          `Document counting not implemented for entity type: ${entityType}`,
          501,
          ErrorCode.INTERNAL_SERVER_ERROR
        );
    }
  }

  private async deleteDocumentFromDatabase(
    documentId: string,
    entityType: EntityType
  ): Promise<void> {
    switch (entityType) {
      case EntityType.PARTNER:
        await this.prisma.partner_document.delete({
          where: { id: documentId },
        });
        break;
      case EntityType.CLIENT:
        await this.prisma.client_document.delete({
          where: { id: documentId },
        });
        break;
      // TODO: Add other entity types when their document models are added to the schema
      // case EntityType.CANDIDATE:
      // case EntityType.SUPPORT:
      default:
        throw new AppError(
          `Document deletion not implemented for entity type: ${entityType}`,
          501,
          ErrorCode.INTERNAL_SERVER_ERROR
        );
    }
  }

  private mapToDocumentInterface(doc: any): IDocument {
    return {
      id: doc.id,
      name: doc.name,
      originalFileName: doc.name, // You might want to store this separately
      type: doc.type,
      mimeType: '', // You might want to store this separately
      size: Number(doc.size),
      url: doc.url,
      uploadedBy: doc.uploadedBy,
      uploadedAt: doc.createdAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  /**
   * Validate that the entity exists in the database
   */
  private async validateEntityExists(
    entityType: EntityType,
    entityId: string
  ): Promise<void> {
    switch (entityType) {
      case EntityType.PARTNER: {
        const partner = await this.prisma.partner.findUnique({
          where: { id: entityId },
        });
        if (!partner) {
          throw new AppError(
            `Partner with ID ${entityId} not found`,
            404,
            ErrorCode.NOT_FOUND
          );
        }
        break;
      }
      case EntityType.CLIENT: {
        const client = await this.prisma.client.findUnique({
          where: { id: entityId },
        });
        if (!client) {
          throw new AppError(
            `Client with ID ${entityId} not found`,
            404,
            ErrorCode.NOT_FOUND
          );
        }
        break;
      }
      case EntityType.CANDIDATE: {
        const candidate = await this.prisma.candidate.findUnique({
          where: { id: entityId },
        });
        if (!candidate) {
          throw new AppError(
            `Candidate with ID ${entityId} not found`,
            404,
            ErrorCode.NOT_FOUND
          );
        }
        break;
      }
      case EntityType.SUPPORT: {
        const supportUser = await this.prisma.support_user.findUnique({
          where: { id: entityId },
        });
        if (!supportUser) {
          throw new AppError(
            `Support user with ID ${entityId} not found`,
            404,
            ErrorCode.NOT_FOUND
          );
        }
        break;
      }
      default:
        throw new AppError(
          `Entity validation not implemented for entity type: ${entityType}`,
          501,
          ErrorCode.INTERNAL_SERVER_ERROR
        );
    }
  }

  private async createDocumentRecord(
    documentId: string,
    entityType: EntityType,
    entityId: string,
    uploadRequest: IDocumentUploadRequest & {
      fileName: string;
      filePath: string;
    },
    uploadedBy: string
  ): Promise<any> {
    // Use provided name or fall back to original fileName
    const documentName = uploadRequest.name || uploadRequest.fileName;

    switch (entityType) {
      case EntityType.PARTNER:
        return await this.prisma.partner_document.create({
          data: {
            id: documentId,
            partnerId: entityId,
            name: documentName,
            type: uploadRequest.documentType,
            size: BigInt(uploadRequest.fileSize),
            url: uploadRequest.filePath,
            uploadedBy,
          },
        });
      case EntityType.CLIENT:
        return await this.prisma.client_document.create({
          data: {
            id: documentId,
            clientId: entityId,
            name: documentName,
            type: uploadRequest.documentType,
            size: BigInt(uploadRequest.fileSize),
            url: uploadRequest.filePath,
            uploadedBy,
          },
        });
      // TODO: Add other entity types when their document models are added to the schema
      // case EntityType.CANDIDATE:
      // case EntityType.SUPPORT:
      default:
        throw new AppError(
          `Document creation not implemented for entity type: ${entityType}`,
          501,
          ErrorCode.INTERNAL_SERVER_ERROR
        );
    }
  }
}
