import { ApiService } from './api.service';
import { singleton } from '../../decorators/singleton';
import {
  IDocumentUploadApiRequest,
  IDocumentUploadApiResponse,
  IDocumentListApiRequest,
  IDocumentListApiResponse,
  IDocumentDeleteApiResponse,
  IDocumentApiParams,
} from '../../models/api/common/document.api';
import { EntityType } from '../../models/domain/common/document.domain';

/**
 * API endpoints for document operations
 */
const DOCUMENT_ENDPOINTS = {
  UPLOAD: (entityType: EntityType, entityId: string) =>
    `/documents/${entityType}/${entityId}/upload`,
  DOWNLOAD: (entityType: EntityType, entityId: string, documentId: string) =>
    `/documents/${entityType}/${entityId}/download/${documentId}`,
  LIST: (entityType: EntityType, entityId: string) =>
    `/documents/${entityType}/${entityId}`,
  DELETE: (entityType: EntityType, entityId: string, documentId: string) =>
    `/documents/${entityType}/${entityId}/${documentId}`,
} as const;

@singleton
export class DocumentApiService extends ApiService {
  /**
   * Upload a document file
   */
  public async uploadDocument(
    params: IDocumentApiParams,
    request: IDocumentUploadApiRequest
  ): Promise<IDocumentUploadApiResponse> {
    try {
      const formData = new FormData();

      // Handle different file types (File for browser, Buffer for Node.js)
      if (request.file instanceof File) {
        formData.append('file', request.file);
      } else if (Buffer.isBuffer(request.file)) {
        // For Node.js environments, create a Blob-like object
        const blob = new Blob([request.file]);
        formData.append('file', blob);
      } else {
        throw new Error('Invalid file type');
      }

      if (request.documentType) {
        formData.append('documentType', request.documentType);
      }

      if (request.name) {
        formData.append('name', request.name);
      }

      const endpoint = DOCUMENT_ENDPOINTS.UPLOAD(
        params.entityType,
        params.entityId
      );

      return await this.apiPost<IDocumentUploadApiResponse>(
        endpoint,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get download URL for a document
   * Note: For direct binary download, use the endpoint directly with proper HTTP client
   */
  public getDownloadUrl(
    params: IDocumentApiParams & { documentId: string }
  ): string {
    return DOCUMENT_ENDPOINTS.DOWNLOAD(
      params.entityType,
      params.entityId,
      params.documentId
    );
  }

  /**
   * Get preview URL for a document
   */
  public getPreviewUrl(
    params: IDocumentApiParams & { documentId: string }
  ): string {
    const baseUrl = DOCUMENT_ENDPOINTS.DOWNLOAD(
      params.entityType,
      params.entityId,
      params.documentId
    );
    return `${baseUrl}?action=preview`;
  }

  /**
   * Get document preview URL (returns JSON with pre-signed URL)
   */
  public async getDocumentPreview(
    params: IDocumentApiParams & { documentId: string }
  ): Promise<{ downloadUrl: string; expiresAt: string }> {
    try {
      const response = await this.apiGet<{
        downloadUrl: string;
        expiresAt: string;
      }>(this.getPreviewUrl(params));
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * List documents for an entity
   */
  public async listDocuments(
    params: IDocumentApiParams,
    request?: IDocumentListApiRequest
  ): Promise<IDocumentListApiResponse> {
    try {
      const endpoint = DOCUMENT_ENDPOINTS.LIST(
        params.entityType,
        params.entityId
      );

      const queryParams = this.buildQueryString({
        limit: request?.limit,
        offset: request?.offset,
        type: request?.type,
        includeDownloadUrls: request?.includeDownloadUrls,
      });

      return await this.apiGet<IDocumentListApiResponse>(
        `${endpoint}${queryParams}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete a document
   */
  public async deleteDocument(
    params: IDocumentApiParams & { documentId: string }
  ): Promise<IDocumentDeleteApiResponse> {
    try {
      const endpoint = DOCUMENT_ENDPOINTS.DELETE(
        params.entityType,
        params.entityId,
        params.documentId
      );

      return await this.apiDelete<IDocumentDeleteApiResponse>(endpoint);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get document metadata (without downloading the file)
   */
  public async getDocumentMetadata(
    params: IDocumentApiParams & { documentId: string }
  ): Promise<IDocumentUploadApiResponse> {
    try {
      // Use the list endpoint with filtering to get specific document metadata
      const listResponse = await this.listDocuments(params, {
        limit: 1,
        offset: 0,
        includeDownloadUrls: false,
      });

      const document = listResponse.data?.documents.find(
        (doc) => doc.id === params.documentId
      );

      if (!document) {
        throw new Error('Document not found');
      }

      return {
        success: true,
        data: document,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
