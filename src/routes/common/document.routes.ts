import { Router } from 'express';
import { DocumentController } from '@/controllers/common/document.controller';
import { requireAuth, validateRequest } from '@/middleware';
import {
  genericDocumentListValidator,
  genericDocumentDeleteValidator,
} from '@/shared/validators/common/document.validator';
import multer from 'multer';
import { DocumentService } from '@/services/common/document.service';
import { StorageFactory } from '@/services/helpers/storage/storage.factory';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Initialize storage provider and services
const storageProvider = StorageFactory.getInstance().getProvider();
const documentService = new DocumentService(storageProvider);
const documentController = new DocumentController(documentService);

/**
 * @openapi
 * /documents/{entityType}/{entityId}/upload:
 *   post:
 *     summary: Upload document directly
 *     description: Uploads a document file directly to the specified entity
 *     tags:
 *       - Documents
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [partner, client, candidate, support]
 *         description: The type of entity that will own the document
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the entity that will own the document
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
 *                 description: The document file to upload
 *               name:
 *                 type: string
 *                 description: Optional custom display name for the document
 *               documentType:
 *                 type: string
 *                 enum: DocumentTypeEnum
 *                 description: Type/category of the document from predefined list
 *                 example: contract
 *     responses:
 *       200:
 *         description: Document uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/IDocument'
 *       400:
 *         description: Invalid request data or file
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Entity not found
 *       413:
 *         description: File too large
 */
router.post(
  '/:entityType/:entityId/upload',
  [requireAuth, upload.single('file')],
  documentController.uploadDocument.bind(documentController)
);

/**
 * @openapi
 * /documents/{entityType}/{entityId}/download/{documentId}:
 *   get:
 *     summary: Download document or get preview URL
 *     description: Downloads a document file directly or returns a preview URL based on the action parameter
 *     tags:
 *       - Documents
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [partner, client, candidate, support]
 *         description: The type of entity that owns the document
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the entity that owns the document
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the document to download
 *       - in: query
 *         name: action
 *         required: false
 *         schema:
 *           type: string
 *           enum: [download, preview]
 *           default: download
 *         description: Action to perform - 'download' for direct file download, 'preview' for pre-signed URL
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *               description: Document file (when action=download)
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     downloadUrl:
 *                       type: string
 *                       description: Pre-signed URL for document preview
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       description: When the preview URL expires
 *               description: Preview URL response (when action=preview)
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Document or entity not found
 */
router.get(
  '/:entityType/:entityId/download/:documentId',
  [requireAuth],
  documentController.downloadDocument.bind(documentController)
);

/**
 * @openapi
 * /documents/{entityType}/{entityId}:
 *   get:
 *     summary: List documents for an entity
 *     description: Retrieves a paginated list of documents for the specified entity
 *     tags:
 *       - Documents
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [partner, client, candidate, support]
 *         description: The type of entity to list documents for
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the entity to list documents for
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Maximum number of documents to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of documents to skip
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter documents by type
 *       - in: query
 *         name: includeDownloadUrls
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Whether to include pre-signed download URLs in the response (for backward compatibility)
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/IDocumentListResponse'
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Entity not found
 */
router.get(
  '/:entityType/:entityId',
  [requireAuth, validateRequest(genericDocumentListValidator)],
  documentController.listDocuments.bind(documentController)
);

/**
 * @openapi
 * /documents/{entityType}/{entityId}/{documentId}:
 *   delete:
 *     summary: Delete a document
 *     description: Deletes a document from both storage and database
 *     tags:
 *       - Documents
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [partner, client, candidate, support]
 *         description: The type of entity that owns the document
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the entity that owns the document
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the document to delete
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Document or entity not found
 */
router.delete(
  '/:entityType/:entityId/:documentId',
  [requireAuth, validateRequest(genericDocumentDeleteValidator)],
  documentController.deleteDocument.bind(documentController)
);

export default router;
