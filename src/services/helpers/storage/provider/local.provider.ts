import { ENV } from '@/config/env';
import { singleton } from '@/shared/decorators/singleton';
import { IStorageProvider } from '../storage.interface';
import { logger } from '@/shared/utils/logger';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

const mkdir = promisify(fs.mkdir);
const exists = promisify(fs.exists);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

@singleton
export class LocalStorageProvider implements IStorageProvider {
  private readonly uploadDir: string;
  private readonly ttl: number;

  constructor() {
    // Set up the upload directory
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.ttl = ENV.PRE_SIGNED_URL_EXPIRY_SECONDS;

    // Create upload directory if it doesn't exist
    this.initializeUploadDir().catch((error) => {
      logger.error('Failed to initialize upload directory', {
        context: 'LocalStorageProvider.constructor',
        error,
      });
    });
  }

  private async initializeUploadDir(): Promise<void> {
    if (!(await exists(this.uploadDir))) {
      await mkdir(this.uploadDir, { recursive: true });
      logger.info(`Created upload directory at ${this.uploadDir}`, {
        context: 'LocalStorageProvider.initializeUploadDir',
      });
    }
  }

  async generatePreSignedUrl(
    fileName: string,
    action: 'delete' | 'read' | 'write' | 'resumable'
  ): Promise<string> {
    try {
      logger.info('Generating pre-signed URL', {
        context: 'LocalStorageProvider.generatePreSignedUrl',
        fileName,
        action,
      });

      // Generate a unique filename to prevent collisions
      const uniqueFileName = `${uuidv4()}-${fileName}`;

      // generate the folder structure, remove file name from the path
      const folderPath = path.dirname(
        path.join(this.uploadDir, uniqueFileName)
      );
      await mkdir(folderPath, { recursive: true });

      // Return a local URL that can be used to access the file
      const baseUrl = ENV.SERVER_URL;
      const fileUrl = `${baseUrl}/api/local/uploads/${uniqueFileName}`;

      logger.info(`Generated local file URL: ${fileUrl}`, {
        context: 'LocalStorageProvider.generatePreSignedUrl',
        fileName,
        uniqueFileName,
        action,
      });

      return fileUrl;
    } catch (error) {
      logger.error('Failed to generate local file URL', {
        context: 'LocalStorageProvider.generatePreSignedUrl',
        fileName,
        error,
      });
      throw error;
    }
  }

  async uploadFile(file: Buffer, fileName: string): Promise<string> {
    try {
      // Generate a unique filename to prevent collisions
      const uniqueFileName = `${uuidv4()}-${fileName}`;
      const filePath = path.join(this.uploadDir, uniqueFileName);

      // Create directory if it doesn't exist
      const folderPath = path.dirname(filePath);
      await mkdir(folderPath, { recursive: true });

      // Write the file
      await writeFile(filePath, file);

      // Return the URL
      const baseUrl = ENV.SERVER_URL;
      const fileUrl = `${baseUrl}/api/local/uploads/${uniqueFileName}`;

      logger.info(`Uploaded file to: ${filePath}`, {
        context: 'LocalStorageProvider.uploadFile',
        fileName,
        uniqueFileName,
      });

      return fileUrl;
    } catch (error) {
      logger.error('Failed to upload file', {
        context: 'LocalStorageProvider.uploadFile',
        fileName,
        error,
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
        context: 'LocalStorageProvider.listFiles',
        folderPath,
        options,
      });

      const fullPath = path.join(this.uploadDir, folderPath);

      // Check if directory exists
      if (!(await exists(fullPath))) {
        return [];
      }

      const files = await readdir(fullPath);
      const fileDetails = await Promise.all(
        files.map(async (fileName) => {
          const filePath = path.join(fullPath, fileName);
          const stats = await stat(filePath);
          const baseUrl = ENV.SERVER_URL;
          const relativePath = path.relative(this.uploadDir, filePath);
          const url = `${baseUrl}/api/local/uploads/${relativePath}`;

          return {
            name: fileName,
            url,
            size: stats.size,
            created: stats.birthtime,
            updated: stats.mtime,
          };
        })
      );

      // Apply prefix filter if specified
      let filteredFiles = fileDetails;
      if (options?.prefix) {
        filteredFiles = fileDetails.filter((file) =>
          file.name.toLowerCase().startsWith(options.prefix!.toLowerCase())
        );
      }

      // Apply limit if specified
      if (options?.limit) {
        filteredFiles = filteredFiles.slice(0, options.limit);
      }

      // Sort the results
      if (options?.sortBy) {
        filteredFiles.sort((a, b) => {
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

      return filteredFiles;
    } catch (error) {
      logger.error('Failed to list files', {
        context: 'LocalStorageProvider.listFiles',
        error: error instanceof Error ? error.message : 'Unknown error',
        folderPath,
        options,
      });
      throw error;
    }
  }

  async downloadFile(fileName: string): Promise<Buffer> {
    try {
      const filePath = path.join(this.uploadDir, fileName);
      if (!(await exists(filePath))) {
        throw new Error(`File not found: ${fileName}`);
      }
      return await fs.promises.readFile(filePath);
    } catch (error) {
      logger.error('Failed to download file', {
        context: 'LocalStorageProvider.downloadFile',
        fileName,
        error,
      });
      throw error;
    }
  }

  async deleteFile(fileName: string): Promise<void> {
    try {
      logger.info('Deleting file', {
        context: 'LocalStorageProvider.deleteFile',
        fileName,
      });

      const filePath = path.join(this.uploadDir, fileName);

      // Check if file exists before deleting
      if (!(await exists(filePath))) {
        logger.warn('File does not exist, skipping deletion', {
          context: 'LocalStorageProvider.deleteFile',
          fileName,
        });
        return;
      }

      // Delete the file
      await fs.promises.unlink(filePath);

      logger.info('File deleted successfully', {
        context: 'LocalStorageProvider.deleteFile',
        fileName,
      });
    } catch (error) {
      logger.error('Failed to delete file', {
        context: 'LocalStorageProvider.deleteFile',
        error: error instanceof Error ? error.message : 'Unknown error',
        fileName,
      });
      throw error;
    }
  }

  async fileExists(fileName: string): Promise<boolean> {
    try {
      logger.info('Checking if file exists', {
        context: 'LocalStorageProvider.fileExists',
        fileName,
      });

      const filePath = path.join(this.uploadDir, fileName);
      const fileExists = await exists(filePath);

      logger.info('File existence check complete', {
        context: 'LocalStorageProvider.fileExists',
        fileName,
        exists: fileExists,
      });

      return fileExists;
    } catch (error) {
      logger.error('Failed to check file existence', {
        context: 'LocalStorageProvider.fileExists',
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
        context: 'LocalStorageProvider.getFileMetadata',
        fileName,
      });

      const filePath = path.join(this.uploadDir, fileName);

      // Check if file exists
      if (!(await exists(filePath))) {
        throw new Error(`File not found: ${fileName}`);
      }

      // Get file stats
      const stats = await stat(filePath);

      // Determine content type based on file extension
      const ext = path.extname(fileName).toLowerCase();
      const contentTypeMap: { [key: string]: string } = {
        '.webm': 'video/webm',
        '.mp4': 'video/mp4',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.pdf': 'application/pdf',
        '.json': 'application/json',
        '.txt': 'text/plain',
      };

      const contentType = contentTypeMap[ext] || 'application/octet-stream';

      const result = {
        size: stats.size,
        contentType,
        created: stats.birthtime,
        updated: stats.mtime,
      };

      logger.info('File metadata retrieved successfully', {
        context: 'LocalStorageProvider.getFileMetadata',
        fileName,
        size: result.size,
        contentType: result.contentType,
      });

      return result;
    } catch (error) {
      logger.error('Failed to get file metadata', {
        context: 'LocalStorageProvider.getFileMetadata',
        error: error instanceof Error ? error.message : 'Unknown error',
        fileName,
      });
      throw error;
    }
  }
}
