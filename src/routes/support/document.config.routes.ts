import { Router } from 'express';
import { DocumentConfigController } from '@/controllers/support/document.config.controller';
import { CreateDocumentConfigService } from '@/services/support/document.config.service';
import {
  requireActiveUser,
  requireAuth,
  requireRole,
  requireUserType,
  validateRequest,
} from '@/middleware';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';
import {
  createDocumentConfigSchema,
  documentVerificationSchema,
  getDocumentsByCountrySchema,
  updateCompanyVerificationStatusSchema,
} from '@/shared/validators/support/document.config.validator';

const router = Router();

const documentConfigService = new CreateDocumentConfigService();
const documentConfigController = new DocumentConfigController(
  documentConfigService
);

const adminAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireRole([UserRoleEnum.ADMIN]),
  requireUserType([UserTypeEnum.SUPPORT]),
];

/**
 * @openapi
 * /support/document/config:
 *   post:
 *     summary: Create a new document config
 *     description: Creates a new document config for a country
 *     tags:
 *       - Support
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDocumentConfigRequest'
 *     responses:
 *       200:
 *         description: Document config created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateDocumentConfigRequest'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       400:
 *         description: Bad Request - Invalid request body
 *       500:
 *         description: Internal Server Error
 */

router.post(
  '/document/config',
  adminAuthMiddleware,
  validateRequest(createDocumentConfigSchema),
  documentConfigController.createDocumentConfig
);

/**
 * @openapi
 * /support/document/company/{companyId}/verification-status:
 *   put:
 *     summary: Update company verification status
 *     description: Updates the verification status of a company
 *     tags:
 *       - Support
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the company to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 $ref: '#/components/schemas/ICompanyVerificationStatus'
 *               remarks:
 *                 type: string
 *                 description: Optional remarks about the verification status
 *     responses:
 *       200:
 *         description: Company verification status updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Company not found
 */

router.put(
  '/document/company/:companyId/verification-status',
  adminAuthMiddleware,
  validateRequest(updateCompanyVerificationStatusSchema),
  documentConfigController.updateCompanyVerificationStatus
);

/**
 * @openapi
 * /support/document/config/all:
 *   get:
 *     summary: Get all documents config
 *     description: Retrieves all documents config
 *     tags:
 *       - Support
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Documents config retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       400:
 *         description: Bad Request - Invalid request body
 *       500:
 *         description: Internal Server Error
 */

router.get(
  '/document/config/all',
  adminAuthMiddleware,
  documentConfigController.getAllDocumentsConfig
);

/**
 * @openapi
 * /support/document/client/{clientId}:
 *   get:
 *     summary: Get client documents
 *     description: Retrieves all documents for the client
 *     tags:
 *       - Support
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: clientId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientDocumentListApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       400:
 *         description: Bad Request - Invalid request body
 *       500:
 *         description: Internal Server Error
 */
router.get(
  '/document/client/:clientId',
  adminAuthMiddleware,
  documentConfigController.getAllDocumentsByClientId
);

/**
 * @openapi
 * /support/document/{countryName}:
 *   get:
 *     summary: Get documents by country
 *     description: Retrieves all documents for a specific country
 *     tags:
 *       - Support
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: countryName
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           description: The name of the country
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GetDocumentsByCountryResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       400:
 *         description: Bad Request - Invalid request body
 *       500:
 *         description: Internal Server Error
 */

router.get(
  '/document/:countryName',
  validateRequest(getDocumentsByCountrySchema),
  documentConfigController.getDocumentsByCountry
);

/**
 * @openapi
 * /support/document/{documentId}/verify:
 *   patch:
 *     summary: Verify a document
 *     description: Verify or reject a document
 *     tags:
 *       - Support
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: documentId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the document to verify
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DocumentVerificationRequest'
 *     responses:
 *       200:
 *         description: Document verification updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentVerificationApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Document not found
 *       500:
 *         description: Internal Server Error
 */
router.patch(
  '/document/:documentId/verify',
  adminAuthMiddleware,
  validateRequest(documentVerificationSchema),
  documentConfigController.verifyDocument
);

/**
 * @openapi
 * /support/document/{documentId}/preview:
 *   get:
 *     summary: Get document preview URL
 *     description: Get a URL to preview a document
 *     tags:
 *       - Support
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: documentId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the document to preview
 *     responses:
 *       200:
 *         description: Document preview URL retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentPreviewApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Document not found
 *       500:
 *         description: Internal Server Error
 */
router.get(
  '/document/:documentId/preview',
  adminAuthMiddleware,
  documentConfigController.getDocumentPreviewUrl
);

export default router;
