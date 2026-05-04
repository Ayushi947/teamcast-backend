import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { Request } from 'express';
import { AppError } from '../utils/error';
import { logger } from '@/shared/utils/logger';

// Allowed file types and their MIME types
const ALLOWED_FILE_TYPES: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    '.docx',
  ],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
    '.xlsx',
  ],
  'text/csv': ['.csv'],
};

// File size limits in bytes
const FILE_SIZE_LIMITS: Record<string, number> = {
  image: 5 * 1024 * 1024, // 5MB for images
  document: 10 * 1024 * 1024, // 10MB for documents
  default: 5 * 1024 * 1024, // 5MB default
};

// Get file type category
const getFileCategory = (mimetype: string): string => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('application/') || mimetype.startsWith('text/'))
    return 'document';
  return 'default';
};

// Generate secure filename
const generateSecureFilename = (originalname: string): string => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(16).toString('hex');
  const ext = path.extname(originalname).toLowerCase();
  return `${timestamp}-${randomString}${ext}`;
};

// File filter function
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Check if file type is allowed
  if (!ALLOWED_FILE_TYPES[file.mimetype]) {
    return cb(
      new AppError(
        'File type not allowed. Allowed types: images (jpg, png, gif, webp), documents (pdf, doc, docx, xls, xlsx, csv)',
        400
      )
    );
  }

  // Validate file extension matches MIME type
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ALLOWED_FILE_TYPES[file.mimetype];

  if (!allowedExts.includes(ext)) {
    return cb(new AppError('File extension does not match file type', 400));
  }

  // Additional security checks
  // Check for double extensions
  const filename = path.basename(file.originalname, ext);
  if (filename.includes('.')) {
    return cb(
      new AppError('Files with multiple extensions are not allowed', 400)
    );
  }

  // Check for suspicious patterns in filename
  const suspiciousPatterns = /[<>:"|?*]/;
  if (suspiciousPatterns.test(file.originalname)) {
    return cb(new AppError('Filename contains invalid characters', 400));
  }

  // Check for control characters (ASCII 0-31)
  for (let i = 0; i < file.originalname.length; i++) {
    const charCode = file.originalname.charCodeAt(i);
    if (charCode < 32) {
      return cb(new AppError('Filename contains invalid characters', 400));
    }
  }

  cb(null, true);
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    // Create separate directories for different file types
    const category = getFileCategory(file.mimetype);
    const uploadPath = path.join(process.cwd(), 'uploads', category);

    // Ensure directory exists
    fs.mkdirSync(uploadPath, { recursive: true });

    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    // Generate secure filename
    const secureFilename = generateSecureFilename(file.originalname);
    cb(null, secureFilename);
  },
});

// Create multer upload configurations
export const uploadSingle = (fieldName: string = 'file') => {
  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: FILE_SIZE_LIMITS.default,
      files: 1,
      fields: 10,
      parts: 50,
      headerPairs: 100,
    },
  }).single(fieldName);
};

export const uploadMultiple = (
  fieldName: string = 'files',
  maxCount: number = 5
) => {
  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: FILE_SIZE_LIMITS.default,
      files: maxCount,
      fields: 10,
      parts: 50,
      headerPairs: 100,
    },
  }).array(fieldName, maxCount);
};

export const uploadFields = (fields: multer.Field[]) => {
  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: FILE_SIZE_LIMITS.default,
      files: 10,
      fields: 10,
      parts: 50,
      headerPairs: 100,
    },
  }).fields(fields);
};

// Middleware to validate uploaded files post-upload
export const validateUploadedFiles = (req: Request, _res: any, next: any) => {
  try {
    // Check if files were uploaded
    if (!req.file && !req.files) {
      throw new AppError('No files uploaded', 400);
    }

    // Get all uploaded files
    const files: Express.Multer.File[] = req.file
      ? [req.file]
      : Array.isArray(req.files)
        ? req.files
        : Object.values(
            req.files as { [fieldname: string]: Express.Multer.File[] }
          ).flat();

    // Validate each file
    files.forEach((file) => {
      // Check file size based on category
      const category = getFileCategory(file.mimetype);
      const maxSize = FILE_SIZE_LIMITS[category] || FILE_SIZE_LIMITS.default;

      if (file.size > maxSize) {
        // Delete the uploaded file
        fs.unlinkSync(file.path);
        throw new AppError(
          `File ${file.originalname} exceeds maximum size limit of ${maxSize / (1024 * 1024)}MB`,
          400
        );
      }

      // Add sanitized file info to request
      file.filename = path.basename(file.filename); // Ensure no path traversal
    });

    next();
  } catch (error) {
    next(error);
  }
};

// Utility to get file URL
export const getFileUrl = (
  filename: string,
  category: string = 'default'
): string => {
  return `/local/uploads/${category}/${filename}`;
};

// Utility to delete uploaded file
export const deleteUploadedFile = async (filepath: string): Promise<void> => {
  try {
    await fs.promises.unlink(filepath);
  } catch (error) {
    logger.error('Error deleting file:', error);
  }
};
