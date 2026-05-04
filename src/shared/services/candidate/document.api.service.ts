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
export class CandidateDocumentApiService extends DocumentApiService {
  /**
   * Upload document for a candidate
   */
  public async uploadCandidateDocument(
    candidateId: string,
    request: IDocumentUploadApiRequest
  ): Promise<IDocumentUploadApiResponse> {
    return await this.uploadDocument(
      {
        entityType: EntityType.CANDIDATE,
        entityId: candidateId,
      },
      request
    );
  }

  /**
   * List documents for a candidate
   */
  public async listCandidateDocuments(
    candidateId: string,
    request?: IDocumentListApiRequest
  ): Promise<IDocumentListApiResponse> {
    return await this.listDocuments(
      {
        entityType: EntityType.CANDIDATE,
        entityId: candidateId,
      },
      request
    );
  }

  /**
   * Delete a candidate document
   */
  public async deleteCandidateDocument(
    candidateId: string,
    documentId: string
  ): Promise<IDocumentDeleteApiResponse> {
    return await this.deleteDocument({
      entityType: EntityType.CANDIDATE,
      entityId: candidateId,
      documentId,
    });
  }

  /**
   * Get candidate document download URL
   */
  public getCandidateDocumentDownloadUrl(
    candidateId: string,
    documentId: string
  ): string {
    return this.getDownloadUrl({
      entityType: EntityType.CANDIDATE,
      entityId: candidateId,
      documentId,
    });
  }

  /**
   * Get candidate document metadata
   */
  public async getCandidateDocumentMetadata(
    candidateId: string,
    documentId: string
  ): Promise<IDocumentUploadApiResponse> {
    return await this.getDocumentMetadata({
      entityType: EntityType.CANDIDATE,
      entityId: candidateId,
      documentId,
    });
  }
}
