import { GetSignedUrlConfig, Storage } from '@google-cloud/storage';
import { ENV } from '@/config/env';
import { singleton } from '@/shared/decorators/singleton';
import { IStorageProvider } from '../storage.interface';
import { logger } from '@/shared/utils/logger';
import { gcpConfig } from '@/config/gcp';

@singleton
export class GcpStorageProvider implements IStorageProvider {
  private storage: Storage;
  private bucketName: string;
  private ttl: number;

  constructor() {
    this.storage = gcpConfig.getStorage();
    this.bucketName = ENV.BUCKET_NAME;
    this.ttl = ENV.PRE_SIGNED_URL_EXPIRY_SECONDS;
  }

  private getBucket() {
    return this.storage.bucket(this.bucketName);
  }

  async generatePreSignedUrl(
    fileName: string,
    action: 'delete' | 'read' | 'write' | 'resumable',
    contentType?: string
  ): Promise<string> {
    logger.info('Generating pre-signed URL', {
      context: 'GcpStorageProvider.generatePreSignedUrl',
      fileName,
      action,
      contentType,
    });

    try {
      const bucket = this.getBucket();
      const file = bucket.file(fileName);

      // Use different TTL based on action
      // - Write: 10 minutes (600 seconds) - enough time to upload
      // - Read: 1 hour (3600 seconds) - enough time to watch video
      // - Delete: 5 minutes (300 seconds) - short window for security
      let ttl = this.ttl; // Default from env

      if (action === 'read') {
        ttl = 3600; // 1 hour for video playback
      } else if (action === 'write') {
        ttl = 600; // 10 minutes for upload
      } else if (action === 'delete') {
        ttl = 300; // 5 minutes for deletion
      }

      const options: GetSignedUrlConfig = {
        version: 'v4',
        action: action,
        expires: Date.now() + ttl * 1000,
      };

      // For write operations, set contentType if provided
      if (action === 'write' && contentType) {
        options.contentType = contentType;
      }

      // For read operations, set response content type for proper playback
      if (action === 'read' && contentType) {
        options.responseType = contentType;
      }

      const [url] = await file.getSignedUrl(options);

      logger.info('Generated pre-signed URL successfully', {
        context: 'GcpStorageProvider.generatePreSignedUrl',
        fileName,
        action,
        ttl,
      });

      return url;
    } catch (error) {
      logger.error('Failed to generate pre-signed URL', {
        context: 'GcpStorageProvider.generatePreSignedUrl',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        fileName,
        action,
        bucketName: this.bucketName,
      });
      throw error;
    }
  }

  async uploadFile(file: Buffer, fileName: string): Promise<string> {
    try {
      const bucket = this.getBucket();
      const blob = bucket.file(fileName);

      // Upload the file
      await blob.save(file);

      // Return the public URL
      return `${fileName}`;
    } catch (error) {
      logger.error('Failed to upload file', {
        context: 'GcpStorageProvider.uploadFile',
        error: error instanceof Error ? error.message : 'Unknown error',
        fileName,
      });
      throw error;
    }
  }

  async downloadFile(fileName: string): Promise<Buffer> {
    try {
      logger.info('Downloading file', {
        context: 'GcpStorageProvider.downloadFile',
        fileName,
      });

      const bucket = this.getBucket();
      const file = bucket.file(fileName);

      // Download the file
      const [fileBuffer] = await file.download();
      logger.info('file downloaded ', fileName);
      return fileBuffer;
    } catch (error) {
      logger.error('Failed to download file', {
        context: 'GcpStorageProvider.downloadFile',
        error: error instanceof Error ? error.message : 'Unknown error',
        fileName,
      });
      throw error;
    }
  }

  async listFiles(
    folderPath: string,
    options?: {
      sortBy?: 'name' | 'created' | 'updated';
      sortOrder?: 'asc' | 'desc';
      prefix?: string;
      limit?: number;
    }
  ): Promise<
    Array<{
      name: string;
      url: string;
      size: number;
      created: Date;
      updated: Date;
    }>
  > {
    try {
      logger.info('Listing files', {
        context: 'GcpStorageProvider.listFiles',
        folderPath,
        options,
      });

      const bucket = this.getBucket();
      const prefix = options?.prefix
        ? `${folderPath}/${options.prefix}`
        : folderPath;

      const [files] = await bucket.getFiles({
        prefix,
        maxResults: options?.limit,
      });

      const fileDetails = await Promise.all(
        files.map(async (file) => {
          const [metadata] = await file.getMetadata();
          const [url] = await file.getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: Date.now() + this.ttl * 1000,
          });

          return {
            name: file.name,
            url,
            size: parseInt(metadata.size as string),
            created: new Date(metadata.timeCreated as string),
            updated: new Date(metadata.updated as string),
          };
        })
      );

      // Sort the results
      if (options?.sortBy) {
        fileDetails.sort((a, b) => {
          const order = options.sortOrder === 'desc' ? -1 : 1;
          switch (options.sortBy) {
            case 'name':
              return order * a.name.localeCompare(b.name);
            case 'created':
              return order * (a.created.getTime() - b.created.getTime());
            case 'updated':
              return order * (a.updated.getTime() - b.updated.getTime());
            default:
              return 0;
          }
        });
      }

      return fileDetails;
    } catch (error) {
      logger.error('Failed to list files', {
        context: 'GcpStorageProvider.listFiles',
        error: error instanceof Error ? error.message : 'Unknown error',
        folderPath,
        options,
      });
      throw error;
    }
  }

  async deleteFile(fileName: string): Promise<void> {
    try {
      logger.info('Deleting file', {
        context: 'GcpStorageProvider.deleteFile',
        fileName,
      });

      const bucket = this.getBucket();
      const file = bucket.file(fileName);

      // Check if file exists before deleting
      const [exists] = await file.exists();
      if (!exists) {
        logger.warn('File does not exist, skipping deletion', {
          context: 'GcpStorageProvider.deleteFile',
          fileName,
        });
        return;
      }

      // Delete the file
      await file.delete();

      logger.info('File deleted successfully', {
        context: 'GcpStorageProvider.deleteFile',
        fileName,
      });
    } catch (error) {
      logger.error('Failed to delete file', {
        context: 'GcpStorageProvider.deleteFile',
        error: error instanceof Error ? error.message : 'Unknown error',
        fileName,
      });
      throw error;
    }
  }

  async fileExists(fileName: string): Promise<boolean> {
    try {
      logger.info('Checking if file exists', {
        context: 'GcpStorageProvider.fileExists',
        fileName,
      });

      const bucket = this.getBucket();
      const file = bucket.file(fileName);
      const [exists] = await file.exists();

      logger.info('File existence check complete', {
        context: 'GcpStorageProvider.fileExists',
        fileName,
        exists,
      });

      return exists;
    } catch (error) {
      logger.error('Failed to check file existence', {
        context: 'GcpStorageProvider.fileExists',
        error: error instanceof Error ? error.message : 'Unknown error',
        fileName,
      });
      throw error;
    }
  }

  async getFileMetadata(fileName: string): Promise<{
    size: number;
    contentType: string;
    created: Date;
    updated: Date;
  }> {
    try {
      logger.info('Getting file metadata', {
        context: 'GcpStorageProvider.getFileMetadata',
        fileName,
      });

      const bucket = this.getBucket();
      const file = bucket.file(fileName);
      const [metadata] = await file.getMetadata();

      const result = {
        size: parseInt(metadata.size as string),
        contentType: metadata.contentType as string,
        created: new Date(metadata.timeCreated as string),
        updated: new Date(metadata.updated as string),
      };

      logger.info('File metadata retrieved successfully', {
        context: 'GcpStorageProvider.getFileMetadata',
        fileName,
        size: result.size,
        contentType: result.contentType,
      });

      return result;
    } catch (error) {
      logger.error('Failed to get file metadata', {
        context: 'GcpStorageProvider.getFileMetadata',
        error: error instanceof Error ? error.message : 'Unknown error',
        fileName,
      });
      throw error;
    }
  }
}
