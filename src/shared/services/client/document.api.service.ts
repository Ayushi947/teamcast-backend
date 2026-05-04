import { singleton } from '../../decorators/singleton';
import { DocumentApiService } from '../core/document.api.service';
import { EntityType } from '../../models/domain/common/document.domain';
import {
  IDocumentUploadApiRequest,
  IDocumentUploadApiResponse,
  IDocumentListApiRequest,
  IDocumentListApiResponse,
  IDocumentDeleteApiResponse,
} from '../../models/api/common/document.api';

@singleton
export class ClientDocumentApiService extends DocumentApiService {
  /**
   * Upload document for a client
   */
  public async uploadClientDocument(
    clientId: string,
    request: IDocumentUploadApiRequest
  ): Promise<IDocumentUploadApiResponse> {
    return await this.uploadDocument(
      {
        entityType: EntityType.CLIENT,
        entityId: clientId,
      },
      request
    );
  }

  /**
   * List documents for a client
   */
  public async listClientDocuments(
    clientId: string,
    request?: IDocumentListApiRequest
  ): Promise<IDocumentListApiResponse> {
    return await this.listDocuments(
      {
        entityType: EntityType.CLIENT,
        entityId: clientId,
      },
      request
    );
  }

  /**
   * Delete a client document
   */
  public async deleteClientDocument(
    clientId: string,
    documentId: string
  ): Promise<IDocumentDeleteApiResponse> {
    return await this.deleteDocument({
      entityType: EntityType.CLIENT,
      entityId: clientId,
      documentId,
    });
  }

  /**
   * Get client document download URL
   */
  public getClientDocumentDownloadUrl(
    clientId: string,
    documentId: string
  ): string {
    return this.getDownloadUrl({
      entityType: EntityType.CLIENT,
      entityId: clientId,
      documentId,
    });
  }

  /**
   * Get client document preview URL
   */
  public getClientDocumentPreviewUrl(
    clientId: string,
    documentId: string
  ): string {
    return this.getPreviewUrl({
      entityType: EntityType.CLIENT,
      entityId: clientId,
      documentId,
    });
  }

  /**
   * Get client document metadata
   */
  public async getClientDocumentMetadata(
    clientId: string,
    documentId: string
  ): Promise<IDocumentUploadApiResponse> {
    return await this.getDocumentMetadata({
      entityType: EntityType.CLIENT,
      entityId: clientId,
      documentId,
    });
  }
}
