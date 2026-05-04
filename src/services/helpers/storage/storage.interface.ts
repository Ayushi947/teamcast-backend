/**
 * Interface for storage services
 * This interface defines the contract that all storage service implementations must follow
 */
export interface IStorageProvider {
  /**
   * Generates a pre-signed URL for uploading a file
   * @param params Request parameters containing the file name
   * @param action The action to perform on the file
   * @returns A promise that resolves to a response containing the pre-signed URL
   */
  generatePreSignedUrl(
    fileName: string,
    action: 'delete' | 'read' | 'write' | 'resumable',
    contentType?: string
  ): Promise<string>;

  /**
   * Uploads a file to storage
   * @param file The file buffer to upload
   * @param fileName The name to give the file
   * @returns A promise that resolves to the public URL of the uploaded file
   */
  uploadFile(file: Buffer, fileName: string): Promise<string>;

  /**
   * Downloads a file from storage
   * @param fileName The name of the file to download
   * @returns A promise that resolves to the file buffer
   */
  downloadFile(fileName: string): Promise<Buffer>;

  /**
   * Lists files in a folder with sorting and filtering options
   * @param folderPath The path of the folder to list files from
   * @param options Options for sorting and filtering the results
   * @returns A promise that resolves to an array of file information
   */
  listFiles(
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
  >;

  /**
   * Deletes a file from storage
   * @param fileName The name of the file to delete
   * @returns A promise that resolves when the file is deleted
   */
  deleteFile(fileName: string): Promise<void>;

  /**
   * Checks if a file exists in storage
   * @param fileName The name of the file to check
   * @returns A promise that resolves to true if the file exists, false otherwise
   */
  fileExists(fileName: string): Promise<boolean>;

  /**
   * Gets metadata for a file in storage
   * @param fileName The name of the file
   * @returns A promise that resolves to file metadata (size, contentType, etc.)
   */
  getFileMetadata(fileName: string): Promise<{
    size: number;
    contentType: string;
    created: Date;
    updated: Date;
  }>;
}
