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
export class PartnerDocumentApiService extends DocumentApiService {
  /**
   * Upload document for a partner
   */
  public async uploadPartnerDocument(
    partnerId: string,
    request: IDocumentUploadApiRequest
  ): Promise<IDocumentUploadApiResponse> {
    return await this.uploadDocument(
      {
        entityType: EntityType.PARTNER,
        entityId: partnerId,
      },
      request
    );
  }

  /**
   * List documents for a partner
   */
  public async listPartnerDocuments(
    partnerId: string,
    request?: IDocumentListApiRequest
  ): Promise<IDocumentListApiResponse> {
    return await this.listDocuments(
      {
        entityType: EntityType.PARTNER,
        entityId: partnerId,
      },
      request
    );
  }

  /**
   * Delete a partner document
   */
  public async deletePartnerDocument(
    partnerId: string,
    documentId: string
  ): Promise<IDocumentDeleteApiResponse> {
    return await this.deleteDocument({
      entityType: EntityType.PARTNER,
      entityId: partnerId,
      documentId,
    });
  }

  /**
   * Get partner document download URL
   */
  public getPartnerDocumentDownloadUrl(
    partnerId: string,
    documentId: string
  ): string {
    return this.getDownloadUrl({
      entityType: EntityType.PARTNER,
      entityId: partnerId,
      documentId,
    });
  }

  /**
   * Get partner document metadata
   */
  public async getPartnerDocumentMetadata(
    partnerId: string,
    documentId: string
  ): Promise<IDocumentUploadApiResponse> {
    return await this.getDocumentMetadata({
      entityType: EntityType.PARTNER,
      entityId: partnerId,
      documentId,
    });
  }

  /**
   * Get partner document preview URL (returns JSON with pre-signed URL)
   */
  public async getPartnerDocumentPreview(
    partnerId: string,
    documentId: string
  ): Promise<{ downloadUrl: string; expiresAt: string }> {
    return await this.getDocumentPreview({
      entityType: EntityType.PARTNER,
      entityId: partnerId,
      documentId,
    });
  }
}
