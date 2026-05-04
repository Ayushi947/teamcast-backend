import { PartnerProfileController } from '@/controllers/partner/profile.controller';
import {
  requireActiveUser,
  requireAuth,
  requireRole,
  requireUserType,
  validateRequest,
} from '@/middleware';
import { PartnerProfileService } from '@/services/partner/profile.service';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';
import {
  partnerProfileAddressUpdateValidator,
  partnerProfileAiAssessmentSettingsUpdateValidator,
  partnerProfileBasicUpdateValidator,
  partnerProfileBillingAddressUpdateValidator,
  partnerProfileCultureUpdateValidator,
  partnerProfileSettingsUpdateValidator,
  partnerProfileShippingAddressUpdateValidator,
  partnerProfileSocialUpdateValidator,
  partnerFinancialDataCreateValidator,
  partnerFinancialDataUpdateValidator,
  partnerBankAccountCreateValidator,
  partnerBankAccountUpdateValidator,
  partnerDocumentCreateValidator,
  partnerDocumentUpdateValidator,
} from '@/shared/validators/partner/profile.validator';
import { requireProfileSetup } from '@/middleware/profile.setup.middleware';
import { Router } from 'express';
import multer from 'multer';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for profile photos
  },
});

// Initialize services and controller
const partnerProfileService = new PartnerProfileService();
const partnerProfileController = new PartnerProfileController(
  partnerProfileService
);

// Partner auth middleware - applies to all profile routes
const partnerAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.PARTNER]),
  requireProfileSetup,
];

// Admin-only middleware - applies to all update routes
const adminOnlyMiddleware = [
  ...partnerAuthMiddleware,
  requireRole([UserRoleEnum.ADMIN]),
];

/**
 * @openapi
 * /partner/profile:
 *   get:
 *     summary: Get complete partner profile
 *     description: Retrieves the full partner profile including basic info, addresses, social and culture
 *     tags:
 *       - Partner Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Partner profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerProfile'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Partner profile not found
 */
router.get('/', partnerAuthMiddleware, partnerProfileController.getProfile);

/**
 * @openapi
 * /partner/profile/basic:
 *   get:
 *     summary: Get basic partner profile
 *     description: Retrieves basic company information for the partner
 *     tags:
 *       - Partner Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Basic partner profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerProfileBasic'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Partner profile not found
 */
router.get(
  '/basic',
  partnerAuthMiddleware,
  partnerProfileController.getBasicProfile
);

/**
 * @openapi
 * /partner/profile/basic:
 *   patch:
 *     summary: Update basic partner profile
 *     description: Updates basic company information for the partner (Admin only)
 *     tags:
 *       - Partner Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IPartnerProfileBasic'
 *     responses:
 *       200:
 *         description: Basic partner profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerProfileBasicUpdateApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Partner profile not found
 */
router.patch(
  '/basic',
  [...adminOnlyMiddleware, validateRequest(partnerProfileBasicUpdateValidator)],
  partnerProfileController.updateBasicProfile
);

/**
 * @openapi
 * /partner/profile/address:
 *   get:
 *     summary: Get partner address
 *     description: Retrieves main address information for the partner
 *     tags:
 *       - Partner Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Partner address retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerProfileAddressGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Partner profile not found
 */
router.get(
  '/address',
  partnerAuthMiddleware,
  partnerProfileController.getAddress
);

/**
 * @openapi
 * /partner/profile/address:
 *   patch:
 *     summary: Update partner address
 *     description: Updates main address information for the partner (Admin only)
 *     tags:
 *       - Partner Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IPartnerProfileAddressUpdate'
 *     responses:
 *       200:
 *         description: Partner address updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerProfileAddressUpdateApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Partner profile not found
 */
router.patch(
  '/address',
  [
    ...adminOnlyMiddleware,
    validateRequest(partnerProfileAddressUpdateValidator),
  ],
  partnerProfileController.updateAddress
);

/**
 * @openapi
 * /partner/profile/address/shipping:
 *   get:
 *     summary: Get partner shipping address
 *     description: Retrieves shipping address information for the partner
 *     tags:
 *       - Partner Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Partner shipping address retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerProfileShippingAddressGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Partner profile not found
 */
router.get(
  '/address/shipping',
  partnerAuthMiddleware,
  partnerProfileController.getShippingAddress
);

/**
 * @openapi
 * /partner/profile/address/shipping:
 *   patch:
 *     summary: Update partner shipping address
 *     description: Updates shipping address information for the partner (Admin only)
 *     tags:
 *       - Partner Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IPartnerProfileShippingAddressUpdate'
 *     responses:
 *       200:
 *         description: Partner shipping address updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerProfileShippingAddressUpdateApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Partner profile not found
 */
router.patch(
  '/address/shipping',
  [
    ...adminOnlyMiddleware,
    validateRequest(partnerProfileShippingAddressUpdateValidator),
  ],
  partnerProfileController.updateShippingAddress
);

/**
 * @openapi
 * /partner/profile/address/billing:
 *   get:
 *     summary: Get partner billing address
 *     description: Retrieves billing address information for the partner
 *     tags:
 *       - Partner Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Partner billing address retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerProfileBillingAddressGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Partner profile not found
 */
router.get(
  '/address/billing',
  partnerAuthMiddleware,
  partnerProfileController.getBillingAddress
);

/**
 * @openapi
 * /partner/profile/address/billing:
 *   patch:
 *     summary: Update partner billing address
 *     description: Updates billing address information for the partner (Admin only)
 *     tags:
 *       - Partner Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IPartnerProfileBillingAddressUpdate'
 *     responses:
 *       200:
 *         description: Partner billing address updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerProfileBillingAddressUpdateApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Partner profile not found
 */
router.patch(
  '/address/billing',
  [
    ...adminOnlyMiddleware,
    validateRequest(partnerProfileBillingAddressUpdateValidator),
  ],
  partnerProfileController.updateBillingAddress
);

/**
 * @openapi
 * /partner/profile/social:
 *   get:
 *     summary: Get partner social profile
 *     description: Retrieves social media information for the partner
 *     tags:
 *       - Partner Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Partner social profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerProfileSocialGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Partner profile not found
 */
router.get(
  '/social',
  partnerAuthMiddleware,
  partnerProfileController.getSocialProfile
);

/**
 * @openapi
 * /partner/profile/social:
 *   patch:
 *     summary: Update partner social profile
 *     description: Updates social media information for the partner (Admin only)
 *     tags:
 *       - Partner Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IPartnerProfileSocialUpdate'
 *     responses:
 *       200:
 *         description: Partner social profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerProfileSocialUpdateApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Partner profile not found
 */
router.patch(
  '/social',
  [
    ...adminOnlyMiddleware,
    validateRequest(partnerProfileSocialUpdateValidator),
  ],
  partnerProfileController.updateSocialProfile
);

/**
 * @openapi
 * /partner/profile/culture:
 *   get:
 *     summary: Get partner culture profile
 *     description: Retrieves culture information for the partner
 *     tags:
 *       - Partner Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Partner culture profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerProfileCultureGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Partner profile not found
 */

router.get(
  '/culture',
  partnerAuthMiddleware,
  partnerProfileController.getCultureProfile
);

/**
 * @openapi
 * /partner/profile/culture:
 *   patch:
 *     summary: Update partner culture profile
 *     description: Updates culture information for the partner (Admin only)
 *     tags:
 *       - Partner Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IPartnerProfileCultureUpdate'
 *     responses:
 *       200:
 *         description: Partner culture profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerProfileCultureUpdateApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Partner profile not found
 */
router.patch(
  '/culture',
  [
    ...adminOnlyMiddleware,
    validateRequest(partnerProfileCultureUpdateValidator),
  ],
  partnerProfileController.updateCultureProfile
);

/**
 * @openapi
 * /partner/profile/settings:
 *   get:
 *     summary: Get partner settings
 *     description: Retrieves settings for the partner
 *     tags:
 *       - Partner Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Partner settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerProfileSettingsGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Partner profile not found
 */
router.get(
  '/settings',
  partnerAuthMiddleware,
  partnerProfileController.getSettings
);

/**
 * @openapi
 * /partner/profile/settings:
 *   patch:
 *     summary: Update partner settings
 *     description: Updates settings for the partner (Admin only)
 *     tags:
 *       - Partner Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IPartnerProfileSettingsUpdate'
 *     responses:
 *       200:
 *         description: Partner settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerProfileSettingsUpdateApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Partner profile not found
 */
router.patch(
  '/settings',
  [
    ...adminOnlyMiddleware,
    validateRequest(partnerProfileSettingsUpdateValidator),
  ],
  partnerProfileController.updateSettings
);

/**
 * @openapi
 * /partner/profile/ai-assessment-settings:
 *   get:
 *     summary: Get partner AI assessment settings
 *     description: Retrieves AI assessment settings for the partner
 *     tags:
 *       - Partner Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Partner AI assessment settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerProfileAiAssessmentSettingsGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Partner profile not found
 */
router.get(
  '/ai-assessment-settings',
  partnerAuthMiddleware,
  partnerProfileController.getAiAssessmentSettings
);

/**
 * @openapi
 * /partner/profile/settings/ai-assessment:
 *   patch:
 *     summary: Update partner AI assessment settings
 *     description: Updates AI assessment configuration for the partner (Admin only)
 *     tags:
 *       - Partner Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IPartnerProfileAiAssessmentSettingsUpdate'
 *     responses:
 *       200:
 *         description: AI assessment settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerProfileAiAssessmentSettingsUpdateApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Partner not found
 */
router.patch(
  '/settings/ai-assessment',
  [
    ...adminOnlyMiddleware,
    validateRequest(partnerProfileAiAssessmentSettingsUpdateValidator),
  ],
  partnerProfileController.updateAiAssessmentSettings
);

// Financial Data Routes

/**
 * @openapi
 * /partner/profile/financial-data:
 *   get:
 *     summary: Get partner financial data
 *     description: Retrieves financial information including bank accounts for the partner
 *     tags:
 *       - Partner Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Financial data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerProfileFinancialDataGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Financial data not found
 */
router.get(
  '/financial-data',
  partnerAuthMiddleware,
  partnerProfileController.getFinancialData
);

/**
 * @openapi
 * /partner/profile/financial-data:
 *   post:
 *     summary: Create partner financial data
 *     description: Creates financial information for the partner (Admin only)
 *     tags:
 *       - Partner Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IPartnerFinancialDataUpdate'
 *     responses:
 *       201:
 *         description: Financial data created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerProfileFinancialDataCreateApiResponse'
 *       400:
 *         description: Financial data already exists
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Partner not found
 */
router.post(
  '/financial-data',
  [
    ...adminOnlyMiddleware,
    validateRequest(partnerFinancialDataCreateValidator),
  ],
  partnerProfileController.createFinancialData
);

/**
 * @openapi
 * /partner/profile/financial-data:
 *   patch:
 *     summary: Update partner financial data
 *     description: Updates financial information for the partner (Admin only)
 *     tags:
 *       - Partner Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IPartnerFinancialDataUpdate'
 *     responses:
 *       200:
 *         description: Financial data updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerProfileFinancialDataUpdateApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Financial data not found
 */
router.patch(
  '/financial-data',
  [
    ...adminOnlyMiddleware,
    validateRequest(partnerFinancialDataUpdateValidator),
  ],
  partnerProfileController.updateFinancialData
);

// Bank Account Routes

/**
 * @openapi
 * /partner/profile/financial-data/bank-accounts:
 *   post:
 *     summary: Add bank account
 *     description: Adds a new bank account to partner financial data (Admin only)
 *     tags:
 *       - Partner Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IPartnerBankAccountCreate'
 *     responses:
 *       201:
 *         description: Bank account added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerBankAccountCreateApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Financial data not found
 */
router.post(
  '/financial-data/bank-accounts',
  [...adminOnlyMiddleware, validateRequest(partnerBankAccountCreateValidator)],
  partnerProfileController.addBankAccount
);

/**
 * @openapi
 * /partner/profile/financial-data/bank-accounts/{accountId}:
 *   patch:
 *     summary: Update bank account
 *     description: Updates an existing bank account (Admin only)
 *     tags:
 *       - Partner Profile
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: Bank account ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IPartnerBankAccountUpdate'
 *     responses:
 *       200:
 *         description: Bank account updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerBankAccountUpdateApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Bank account not found
 */
router.patch(
  '/financial-data/bank-accounts/:accountId',
  [...adminOnlyMiddleware, validateRequest(partnerBankAccountUpdateValidator)],
  partnerProfileController.updateBankAccount
);

/**
 * @openapi
 * /partner/profile/financial-data/bank-accounts/{accountId}:
 *   delete:
 *     summary: Delete bank account
 *     description: Deletes a bank account (Admin only)
 *     tags:
 *       - Partner Profile
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: Bank account ID
 *     responses:
 *       200:
 *         description: Bank account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerDocumentDeleteApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Bank account not found
 */
router.delete(
  '/financial-data/bank-accounts/:accountId',
  adminOnlyMiddleware,
  partnerProfileController.deleteBankAccount
);

// Document Routes

/**
 * @openapi
 * /partner/profile/documents:
 *   get:
 *     summary: Get partner documents
 *     description: Retrieves all documents for the partner
 *     tags:
 *       - Partner Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerDocumentListApiResponse'
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/documents',
  partnerAuthMiddleware,
  partnerProfileController.getDocuments
);

/**
 * @openapi
 * /partner/profile/documents:
 *   post:
 *     summary: Upload partner document
 *     description: Uploads a new document for the partner (Admin only)
 *     tags:
 *       - Partner Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IPartnerDocumentCreate'
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerDocumentCreateApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Partner not found
 */
router.post(
  '/documents',
  [...adminOnlyMiddleware, validateRequest(partnerDocumentCreateValidator)],
  partnerProfileController.createDocument
);

/**
 * @openapi
 * /partner/profile/documents/{documentId}:
 *   get:
 *     summary: Get partner document by ID
 *     description: Retrieves a specific document by ID
 *     tags:
 *       - Partner Profile
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerDocumentCreateApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Document not found
 */
router.get(
  '/documents/:documentId',
  partnerAuthMiddleware,
  partnerProfileController.getDocumentById
);

/**
 * @openapi
 * /partner/profile/documents/{documentId}:
 *   patch:
 *     summary: Update partner document
 *     description: Updates document metadata (Admin only)
 *     tags:
 *       - Partner Profile
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IPartnerDocumentUpdate'
 *     responses:
 *       200:
 *         description: Document updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerDocumentUpdateApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Document not found
 */
router.patch(
  '/documents/:documentId',
  [...adminOnlyMiddleware, validateRequest(partnerDocumentUpdateValidator)],
  partnerProfileController.updateDocument
);

/**
 * @openapi
 * /partner/profile/documents/{documentId}:
 *   delete:
 *     summary: Delete partner document
 *     description: Deletes a document (Admin only)
 *     tags:
 *       - Partner Profile
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerDocumentDeleteApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Document not found
 */
router.delete(
  '/documents/:documentId',
  adminOnlyMiddleware,
  partnerProfileController.deleteDocument
);

/**
 * @openapi
 * /partner/profile/photo:
 *   patch:
 *     summary: Update profile photo
 *     description: Updates the partner's profile photo by uploading directly to storage
 *     tags:
 *       - Partner Profile
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
 *                 description: The profile photo file to upload
 *     responses:
 *       200:
 *         description: Profile photo updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerProfilePhotoUrlApiResponse'
 *       400:
 *         description: Invalid request data or file
 *       401:
 *         description: Unauthorized
 *       413:
 *         description: File too large
 */
router.patch(
  '/photo',
  [...partnerAuthMiddleware, upload.single('file')],
  partnerProfileController.uploadProfilePhoto.bind(partnerProfileController)
);

export default router;
