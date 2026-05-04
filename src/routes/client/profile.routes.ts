import { Router } from 'express';
import { ClientProfileController } from '@/controllers/client/profile.controller';
import { ClientProfileService } from '@/services/client/profile.service';
import {
  requireAuth,
  requireActiveUser,
  requireUserType,
  requireRole,
  validateRequest,
} from '@/middleware';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';
import {
  clientProfileBasicUpdateValidator,
  clientProfileAddressUpdateValidator,
  clientProfileShippingAddressUpdateValidator,
  clientProfileBillingAddressUpdateValidator,
  clientProfileSocialUpdateValidator,
  clientProfileCultureUpdateValidator,
  clientProfileSettingsUpdateValidator,
  clientProfileAiAssessmentSettingsUpdateValidator,
  clientDocumentCreateValidator,
  clientDocumentUpdateValidator,
  clientFinancialDataCreateValidator,
  clientFinancialDataUpdateValidator,
  clientBankAccountCreateValidator,
  clientBankAccountUpdateValidator,
} from '@/shared/validators/client/profile.validator';
import { requireProfileSetup } from '@/middleware/profile.setup.middleware';
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
const clientProfileService = new ClientProfileService();
const clientProfileController = new ClientProfileController(
  clientProfileService
);

// Client auth middleware - applies to all profile routes
const clientAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.CLIENT, UserTypeEnum.SUPPORT]),
  requireProfileSetup,
];

// Admin-only middleware - applies to all update routes
const adminOnlyMiddleware = [
  ...clientAuthMiddleware,
  requireRole([UserRoleEnum.ADMIN]),
];

/**
 * @openapi
 * /client/profile:
 *   get:
 *     summary: Get complete client profile
 *     description: Retrieves the full client profile including basic info, addresses, social and culture
 *     tags:
 *       - Client Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Client profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientProfileGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Client profile not found
 */
router.get('/', clientAuthMiddleware, clientProfileController.getProfile);

/**
 * @openapi
 * /client/profile/basic:
 *   get:
 *     summary: Get basic client profile
 *     description: Retrieves basic company information for the client
 *     tags:
 *       - Client Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Basic client profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientProfileBasicGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Client profile not found
 */
router.get(
  '/basic',
  clientAuthMiddleware,
  clientProfileController.getBasicProfile
);

/**
 * @openapi
 * /client/profile/basic:
 *   patch:
 *     summary: Update basic client profile
 *     description: Updates basic company information for the client (Admin only)
 *     tags:
 *       - Client Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientProfileBasic'
 *     responses:
 *       200:
 *         description: Basic client profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientProfileBasicUpdateApiResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions (Admin only)
 *       404:
 *         description: Client profile not found
 */
router.patch(
  '/basic',
  [...adminOnlyMiddleware, validateRequest(clientProfileBasicUpdateValidator)],
  clientProfileController.updateBasicProfile
);

/**
 * @openapi
 * /client/profile/address:
 *   get:
 *     summary: Get client address
 *     description: Retrieves main address information for the client
 *     tags:
 *       - Client Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Client address retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientProfileAddressGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Client profile not found
 */
router.get(
  '/address',
  clientAuthMiddleware,
  clientProfileController.getAddress
);

/**
 * @openapi
 * /client/profile/address:
 *   patch:
 *     summary: Update client address
 *     description: Updates main address information for the client (Admin only)
 *     tags:
 *       - Client Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientProfileAddressUpdate'
 *     responses:
 *       200:
 *         description: Client address updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientProfileAddressUpdateApiResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions (Admin only)
 *       404:
 *         description: Client profile not found
 */

router.patch(
  '/address',
  [
    ...adminOnlyMiddleware,
    validateRequest(clientProfileAddressUpdateValidator),
  ],
  clientProfileController.updateAddress
);

/**
 * @openapi
 * /client/profile/address/shipping:
 *   get:
 *     summary: Get client shipping address
 *     description: Retrieves shipping address information for the client
 *     tags:
 *       - Client Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Client shipping address retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientProfileShippingAddressGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Client profile not found
 */
router.get(
  '/address/shipping',
  clientAuthMiddleware,
  clientProfileController.getShippingAddress
);

/**
 * @openapi
 * /client/profile/address/shipping:
 *   patch:
 *     summary: Update client shipping address
 *     description: Updates shipping address information for the client (Admin only)
 *     tags:
 *       - Client Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientProfileShippingAddress'
 *     responses:
 *       200:
 *         description: Client shipping address updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientProfileShippingAddressUpdateApiResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions (Admin only)
 *       404:
 *         description: Client profile not found
 */
router.patch(
  '/address/shipping',
  [
    ...adminOnlyMiddleware,
    validateRequest(clientProfileShippingAddressUpdateValidator),
  ],
  clientProfileController.updateShippingAddress
);

/**
 * @openapi
 * /client/profile/address/billing:
 *   get:
 *     summary: Get client billing address
 *     description: Retrieves billing address information for the client
 *     tags:
 *       - Client Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Client billing address retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientProfileBillingAddressGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Client profile not found
 */
router.get(
  '/address/billing',
  clientAuthMiddleware,
  clientProfileController.getBillingAddress
);

/**
 * @openapi
 * /client/profile/address/billing:
 *   patch:
 *     summary: Update client billing address
 *     description: Updates billing address information for the client (Admin only)
 *     tags:
 *       - Client Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientProfileBillingAddress'
 *     responses:
 *       200:
 *         description: Client billing address updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientProfileBillingAddressUpdateApiResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions (Admin only)
 *       404:
 *         description: Client profile not found
 */
router.patch(
  '/address/billing',
  [
    ...adminOnlyMiddleware,
    validateRequest(clientProfileBillingAddressUpdateValidator),
  ],
  clientProfileController.updateBillingAddress
);

/**
 * @openapi
 * /client/profile/social:
 *   get:
 *     summary: Get client social profiles
 *     description: Retrieves social media links for the client
 *     tags:
 *       - Client Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Client social profiles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientProfileSocialGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Client profile not found
 */
router.get(
  '/social',
  clientAuthMiddleware,
  clientProfileController.getSocialProfile
);

/**
 * @openapi
 * /client/profile/social:
 *   patch:
 *     summary: Update client social profiles
 *     description: Updates social media links for the client (Admin only)
 *     tags:
 *       - Client Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientProfileSocial'
 *     responses:
 *       200:
 *         description: Client social profiles updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientProfileSocialUpdateApiResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions (Admin only)
 *       404:
 *         description: Client profile not found
 */

router.patch(
  '/social',
  [...adminOnlyMiddleware, validateRequest(clientProfileSocialUpdateValidator)],
  clientProfileController.updateSocialProfile
);

/**
 * @openapi
 * /client/profile/culture:
 *   get:
 *     summary: Get client culture information
 *     description: Retrieves company culture information for the client
 *     tags:
 *       - Client Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Client culture information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientProfileCultureGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Client profile not found
 */
router.get(
  '/culture',
  clientAuthMiddleware,
  clientProfileController.getCultureProfile
);

/**
 * @openapi
 * /client/profile/culture:
 *   patch:
 *     summary: Update client culture information
 *     description: Updates company culture information for the client (Admin only)
 *     tags:
 *       - Client Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientProfileCulture'
 *     responses:
 *       200:
 *         description: Client culture information updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientProfileCultureUpdateApiResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions (Admin only)
 *       404:
 *         description: Client profile not found
 */

router.patch(
  '/culture',
  [
    ...adminOnlyMiddleware,
    validateRequest(clientProfileCultureUpdateValidator),
  ],
  clientProfileController.updateCultureProfile
);

/**
 * @openapi
 * /client/profile/settings:
 *   get:
 *     summary: Get client settings
 *     description: Retrieves notification and configuration settings for the client
 *     tags:
 *       - Client Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Client settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientProfileSettingsGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Client settings not found
 */
router.get(
  '/settings',
  clientAuthMiddleware,
  clientProfileController.getSettings
);

/**
 * @openapi
 * /client/profile/settings:
 *   patch:
 *     summary: Update client settings
 *     description: Updates notification and configuration settings for the client (Admin only)
 *     tags:
 *       - Client Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientProfileSettingsUpdate'
 *     responses:
 *       200:
 *         description: Client settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientProfileSettingsUpdateApiResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions (Admin only)
 *       404:
 *         description: Client settings not found
 */

router.patch(
  '/settings',
  [
    ...adminOnlyMiddleware,
    validateRequest(clientProfileSettingsUpdateValidator),
  ],
  clientProfileController.updateSettings
);

/**
 * @openapi
 * /client/profile/ai-assessment-settings:
 *   get:
 *     summary: Get client AI assessment settings
 *     description: Retrieves AI assessment configuration settings for the client
 *     tags:
 *       - Client Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI assessment settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientProfileAiAssessmentSettingsGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: AI assessment settings not found
 */
router.get(
  '/ai-assessment-settings',
  clientAuthMiddleware,
  clientProfileController.getAiAssessmentSettings
);

/**
 * @openapi
 * /client/profile/job-posting/{jobPostingId}/ai-assessment-settings:
 *   get:
 *     summary: Get job posting AI assessment settings
 *     description: Retrieves AI assessment configuration settings for a specific job posting
 *     tags:
 *       - Client Profile
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobPostingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job posting ID
 *     responses:
 *       200:
 *         description: Job posting AI assessment settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientProfileAiAssessmentSettingsGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job posting AI assessment settings not found
 */

router.get(
  '/job-posting/:jobPostingId/ai-assessment-settings',
  clientAuthMiddleware,
  clientProfileController.getJobPostingAiAssessmentSettings
);

/**
 * @openapi
 * /client/profile/ai-assessment-settings:
 *   patch:
 *     summary: Update client AI assessment settings
 *     description: Updates AI assessment configuration settings for the client (Admin only)
 *     tags:
 *       - Client Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientProfileAiAssessmentSettingsUpdate'
 *     responses:
 *       200:
 *         description: AI assessment settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientProfileAiAssessmentSettingsUpdateApiResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions (Admin only)
 *       404:
 *         description: AI assessment settings not found
 */
router.patch(
  '/ai-assessment-settings',
  [
    ...adminOnlyMiddleware,
    validateRequest(clientProfileAiAssessmentSettingsUpdateValidator),
  ],
  clientProfileController.updateAiAssessmentSettings
);

// Financial Data Routes

/**
 * @openapi
 * /client/profile/financial-data:
 *   get:
 *     summary: Get client financial data
 *     description: Retrieves financial information for the client
 *     tags:
 *       - Client Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Financial data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientProfileFinancialDataGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Financial data not found
 */
router.get(
  '/financial-data',
  clientAuthMiddleware,
  clientProfileController.getFinancialData
);

/**
 * @openapi
 * /client/profile/financial-data:
 *   post:
 *     summary: Create client financial data
 *     description: Creates financial information for the client (Admin only)
 *     tags:
 *       - Client Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientFinancialDataUpdate'
 *     responses:
 *       201:
 *         description: Financial data created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientProfileFinancialDataCreateApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions (Admin only)
 */
router.post(
  '/financial-data',
  [...adminOnlyMiddleware, validateRequest(clientFinancialDataCreateValidator)],
  clientProfileController.createFinancialData
);

/**
 * @openapi
 * /client/profile/financial-data:
 *   patch:
 *     summary: Update client financial data
 *     description: Updates financial information for the client (Admin only)
 *     tags:
 *       - Client Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientFinancialDataUpdate'
 *     responses:
 *       200:
 *         description: Financial data updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientProfileFinancialDataUpdateApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions (Admin only)
 *       404:
 *         description: Financial data not found
 */
router.patch(
  '/financial-data',
  [...adminOnlyMiddleware, validateRequest(clientFinancialDataUpdateValidator)],
  clientProfileController.updateFinancialData
);

// Bank Account Routes

/**
 * @openapi
 * /client/profile/financial-data/bank-accounts:
 *   get:
 *     summary: Get all client bank accounts
 *     description: Retrieves all bank accounts for the client
 *     tags:
 *       - Client Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bank accounts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientBankAccountListApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Financial data not found
 */
router.get(
  '/financial-data/bank-accounts',
  clientAuthMiddleware,
  clientProfileController.getBankAccounts
);

/**
 * @openapi
 * /client/profile/financial-data/bank-accounts/{accountId}:
 *   get:
 *     summary: Get client bank account by ID
 *     description: Retrieves a specific bank account by ID
 *     tags:
 *       - Client Profile
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
 *         description: Bank account retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientBankAccountGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Bank account not found
 */
router.get(
  '/financial-data/bank-accounts/:accountId',
  clientAuthMiddleware,
  clientProfileController.getBankAccountById
);

/**
 * @openapi
 * /client/profile/financial-data/bank-accounts:
 *   post:
 *     summary: Add client bank account
 *     description: Adds a new bank account for the client (Admin only)
 *     tags:
 *       - Client Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientBankAccountCreate'
 *     responses:
 *       201:
 *         description: Bank account added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientBankAccountCreateApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions (Admin only)
 *       404:
 *         description: Financial data not found
 */
router.post(
  '/financial-data/bank-accounts',
  [...adminOnlyMiddleware, validateRequest(clientBankAccountCreateValidator)],
  clientProfileController.addBankAccount
);

/**
 * @openapi
 * /client/profile/financial-data/bank-accounts/{accountId}:
 *   patch:
 *     summary: Update client bank account
 *     description: Updates a bank account for the client (Admin only)
 *     tags:
 *       - Client Profile
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
 *             $ref: '#/components/schemas/IClientBankAccountUpdate'
 *     responses:
 *       200:
 *         description: Bank account updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientBankAccountUpdateApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions (Admin only)
 *       404:
 *         description: Bank account not found
 */
router.patch(
  '/financial-data/bank-accounts/:accountId',
  [...adminOnlyMiddleware, validateRequest(clientBankAccountUpdateValidator)],
  clientProfileController.updateBankAccount
);

/**
 * @openapi
 * /client/profile/financial-data/bank-accounts/{accountId}:
 *   delete:
 *     summary: Delete client bank account
 *     description: Deletes a bank account for the client (Admin only)
 *     tags:
 *       - Client Profile
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
 *               $ref: '#/components/schemas/IClientBankAccountDeleteApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions (Admin only)
 *       404:
 *         description: Bank account not found
 */
router.delete(
  '/financial-data/bank-accounts/:accountId',
  adminOnlyMiddleware,
  clientProfileController.deleteBankAccount
);

// Document Routes

/**
 * @openapi
 * /client/profile/documents:
 *   get:
 *     summary: Get client documents
 *     description: Retrieves all documents for the client
 *     tags:
 *       - Client Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientDocumentListApiResponse'
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/documents',
  clientAuthMiddleware,
  clientProfileController.getDocuments
);

/**
 * @openapi
 * /client/profile/documents:
 *   post:
 *     summary: Upload client document
 *     description: Uploads a new document for the client (Admin only)
 *     tags:
 *       - Client Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientDocumentCreate'
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientDocumentCreateApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Client not found
 */
router.post(
  '/documents',
  [...adminOnlyMiddleware, validateRequest(clientDocumentCreateValidator)],
  clientProfileController.createDocument
);

/**
 * @openapi
 * /client/profile/documents/{documentId}:
 *   get:
 *     summary: Get client document by ID
 *     description: Retrieves a specific document by ID
 *     tags:
 *       - Client Profile
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
 *               $ref: '#/components/schemas/IClientDocumentCreateApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Document not found
 */
router.get(
  '/documents/:documentId',
  clientAuthMiddleware,
  clientProfileController.getDocumentById
);

/**
 * @openapi
 * /client/profile/documents/{documentId}:
 *   patch:
 *     summary: Update client document
 *     description: Updates document metadata (Admin only)
 *     tags:
 *       - Client Profile
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
 *             $ref: '#/components/schemas/IClientDocumentUpdate'
 *     responses:
 *       200:
 *         description: Document updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientDocumentUpdateApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Document not found
 */
router.patch(
  '/documents/:documentId',
  [...adminOnlyMiddleware, validateRequest(clientDocumentUpdateValidator)],
  clientProfileController.updateDocument
);

/**
 * @openapi
 * /client/profile/documents/{documentId}:
 *   delete:
 *     summary: Delete client document
 *     description: Deletes a document (Admin only)
 *     tags:
 *       - Client Profile
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
 *               $ref: '#/components/schemas/IClientDocumentDeleteApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Document not found
 */
router.delete(
  '/documents/:documentId',
  adminOnlyMiddleware,
  clientProfileController.deleteDocument
);

/**
 * @openapi
 * /client/profile/logo:
 *   patch:
 *     summary: Update company logo
 *     description: Updates the client's company logo by uploading directly to storage
 *     tags:
 *       - Client Profile
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
 *                 description: The company logo file to upload
 *     responses:
 *       200:
 *         description: Company logo updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientProfilePhotoUrlApiResponse'
 *       400:
 *         description: Invalid request data or file
 *       401:
 *         description: Unauthorized
 *       413:
 *         description: File too large
 */
router.patch(
  '/logo',
  [...clientAuthMiddleware, upload.single('file')],
  clientProfileController.uploadProfilePhoto.bind(clientProfileController)
);

/**
 * @openapi
 * /client/profile/logo:
 *   delete:
 *     summary: Delete company logo
 *     description: Removes the client's company logo (sets logo to null)
 *     tags:
 *       - Client Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Company logo deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientProfilePhotoDeleteApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Client not found
 */
router.delete(
  '/logo',
  clientAuthMiddleware,
  clientProfileController.deleteProfileLogo
);

export default router;
