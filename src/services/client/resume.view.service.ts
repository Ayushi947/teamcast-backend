import { PrismaClient } from '@prisma/client';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';
import { singleton } from '@/shared/decorators/singleton';
import { IStorageProvider } from '@/services/helpers/storage/storage.interface';
import { StorageFactory } from '@/services/helpers/storage/storage.factory';
import { IClientResumeViewResponse } from '@/shared/models/domain/client/resume.view.domain';
import { IClientResumeViewRequest } from '@/shared/models/domain/client/resume.view.domain';

@singleton
export class ClientResumeViewService {
  private readonly prisma: PrismaClient;
  private readonly storageProvider: IStorageProvider;

  constructor() {
    this.prisma = new PrismaClient();
    this.storageProvider = StorageFactory.getInstance().getProvider();
  }

  /**
   * View a candidate's resume
   */
  async viewResume(
    clientId: string,
    clientUserId: string,
    request: IClientResumeViewRequest
  ): Promise<IClientResumeViewResponse> {
    try {
      const { candidateId } = request;

      // Verify candidate exists and get resume info
      const candidate = await this.prisma.candidate.findUnique({
        where: { id: candidateId },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          resume: true,
        },
      });

      if (!candidate) {
        throw new AppError(
          'Candidate not found',
          404,
          ErrorCode.CANDIDATE_NOT_FOUND
        );
      }

      if (!candidate.resume) {
        throw new AppError(
          'Candidate resume not found',
          404,
          ErrorCode.RESUME_NOT_FOUND
        );
      }

      if (!candidate.resume.resumeFileUrl) {
        throw new AppError(
          'Resume file not available',
          404,
          ErrorCode.RESUME_NOT_FOUND
        );
      }

      // Generate pre-signed URL for view
      const viewUrl = await this.storageProvider.generatePreSignedUrl(
        candidate.resume.resumeFileUrl,
        'read'
      );

      // Get file info from storage - using a simple approach
      const fileInfo = {
        size: 0, // We'll get this from the resume record if available
        mimeType: 'application/pdf', // Default MIME type
      };

      const response: IClientResumeViewResponse = {
        viewUrl,
        fileName: this.extractFileName(candidate.resume.resumeFileUrl),
        fileSize: fileInfo.size,
        mimeType: fileInfo.mimeType,
        expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour from now
        candidateId,
        candidateName: candidate.user.name,
        viewedAt: new Date(),
      };

      logger.info('Resume view generated successfully', {
        context: 'ClientResumeViewService.viewResume',
        clientId,
        clientUserId,
        candidateId,
      });

      return response;
    } catch (error) {
      logger.error('Failed to view resume', {
        context: 'ClientResumeViewService.viewResume',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        clientUserId,
        candidateId: request.candidateId,
      });
      throw error;
    }
  }

  /**
   * Extract filename from file path
   */
  private extractFileName(filePath: string): string {
    const parts = filePath.split('/');
    return parts[parts.length - 1] || 'resume.pdf';
  }
}
