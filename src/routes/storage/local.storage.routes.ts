import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import {
  uploadSingle,
  uploadMultiple,
  validateUploadedFiles,
  getFileUrl,
} from '../../middleware/file.upload.middleware';
import { AppError } from '../../utils/error';

const router = Router();

/**
 * @openapi
 * /local/uploads/{category}/{filename}:
 *   get:
 *     summary: Get a file
 *     description: Get a file from the local storage with security validation
 *     tags:
 *       - Local Storage
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [image, document]
 *         description: The category of the file (image or document)
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the file to retrieve
 *     responses:
 *       200:
 *         description: File downloaded successfully
 *         headers:
 *           X-Content-Type-Options:
 *             schema:
 *               type: string
 *               default: nosniff
 *           X-Frame-Options:
 *             schema:
 *               type: string
 *               default: DENY
 *       400:
 *         description: Invalid file category or filename
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: File not found
 */
// Serve static files with security checks
router.get(
  '/:category/:filename',
  (req: Request, res: Response, next: NextFunction) => {
    // Validate category
    const validCategories = ['image', 'document'];
    if (!validCategories.includes(req.params.category)) {
      return next(new AppError('Invalid file category', 400));
    }

    // Validate filename (prevent path traversal)
    const filename = path.basename(req.params.filename);
    if (filename !== req.params.filename) {
      return next(new AppError('Invalid filename', 400));
    }

    // Construct safe file path
    const filePath = path.join(
      process.cwd(),
      'uploads',
      req.params.category,
      filename
    );

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return next(new AppError('File not found', 404));
    }

    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; style-src 'unsafe-inline';"
    );

    // Send file
    res.sendFile(filePath);
  }
);

/**
 * @openapi
 * /local/uploads/single:
 *   post:
 *     summary: Upload a single file
 *     description: Upload a single file with type validation and size limits. Allowed types - images (jpg, png, gif, webp) up to 5MB, documents (pdf, doc, docx, xls, xlsx, csv) up to 10MB
 *     tags:
 *       - Local Storage
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The file to upload
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     filename:
 *                       type: string
 *                     originalName:
 *                       type: string
 *                     mimetype:
 *                       type: string
 *                     size:
 *                       type: number
 *                     url:
 *                       type: string
 *                     category:
 *                       type: string
 *       400:
 *         description: Invalid file type, size exceeded, or no file uploaded
 *       401:
 *         description: Unauthorized
 */
// Single file upload endpoint
router.post(
  '/single',
  uploadSingle('file'),
  validateUploadedFiles,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new AppError('No file uploaded', 400);
      }

      // Get file info
      const file = req.file;
      const category = file.mimetype.startsWith('image/')
        ? 'image'
        : 'document';
      const fileUrl = getFileUrl(file.filename, category);

      // You can add additional processing here (e.g., virus scanning, image optimization)

      res.json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          url: fileUrl,
          category: category,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /local/uploads/multiple:
 *   post:
 *     summary: Upload multiple files
 *     description: Upload up to 5 files with type validation and size limits
 *     tags:
 *       - Local Storage
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: The files to upload (max 5)
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     files:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           filename:
 *                             type: string
 *                           originalName:
 *                             type: string
 *                           mimetype:
 *                             type: string
 *                           size:
 *                             type: number
 *                           url:
 *                             type: string
 *                           category:
 *                             type: string
 *                     count:
 *                       type: number
 *       400:
 *         description: Invalid file type, size exceeded, or no files uploaded
 *       401:
 *         description: Unauthorized
 */
// Multiple files upload endpoint
router.post(
  '/multiple',
  uploadMultiple('files', 5),
  validateUploadedFiles,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        throw new AppError('No files uploaded', 400);
      }

      const uploadedFiles = req.files.map((file) => {
        const category = file.mimetype.startsWith('image/')
          ? 'image'
          : 'document';
        return {
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          url: getFileUrl(file.filename, category),
          category: category,
        };
      });

      res.json({
        success: true,
        message: `${uploadedFiles.length} files uploaded successfully`,
        data: {
          files: uploadedFiles,
          count: uploadedFiles.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
