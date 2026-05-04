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
export class SupportDocumentApiService extends DocumentApiService {
  /**
   * Upload document for a support user
   */
  public async uploadSupportDocument(
    supportUserId: string,
    request: IDocumentUploadApiRequest
  ): Promise<IDocumentUploadApiResponse> {
    return await this.uploadDocument(
      {
        entityType: EntityType.SUPPORT,
        entityId: supportUserId,
      },
      request
    );
  }

  /**
   * List documents for a support user
   */
  public async listSupportDocuments(
    supportUserId: string,
    request?: IDocumentListApiRequest
  ): Promise<IDocumentListApiResponse> {
    return await this.listDocuments(
      {
        entityType: EntityType.SUPPORT,
        entityId: supportUserId,
      },
      request
    );
  }

  /**
   * Delete a support document
   */
  public async deleteSupportDocument(
    supportUserId: string,
    documentId: string
  ): Promise<IDocumentDeleteApiResponse> {
    return await this.deleteDocument({
      entityType: EntityType.SUPPORT,
      entityId: supportUserId,
      documentId,
    });
  }

  /**
   * Get support document download URL
   */
  public getSupportDocumentDownloadUrl(
    supportUserId: string,
    documentId: string
  ): string {
    return this.getDownloadUrl({
      entityType: EntityType.SUPPORT,
      entityId: supportUserId,
      documentId,
    });
  }

  /**
   * Get support document metadata
   */
  public async getSupportDocumentMetadata(
    supportUserId: string,
    documentId: string
  ): Promise<IDocumentUploadApiResponse> {
    return await this.getDocumentMetadata({
      entityType: EntityType.SUPPORT,
      entityId: supportUserId,
      documentId,
    });
  }
}
