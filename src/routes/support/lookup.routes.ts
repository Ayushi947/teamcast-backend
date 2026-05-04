import { Router } from 'express';
import { LookupController } from '@/controllers/support/lookup.controller';
import { LookupService } from '@/services/support/lookup.service';
import {
  requireAuth,
  requireRole,
  validateRequest,
  requireUserType,
} from '@/middleware';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';
import {
  lookupCategoryCreateValidator,
  lookupCategoryGetByIdValidator,
  lookupCategoryDeleteValidator,
  lookupValueCreateValidator,
  lookupValueDeleteValidator,
  lookupValuesByCategoriesValidator,
  lookupTimezonesByCountryValidator,
} from '@/shared/validators/support/lookup.validator';

const router = Router();

const lookupService = new LookupService();
const lookupController = new LookupController(lookupService);

const adminAndSupportMiddleware = [
  requireAuth,
  requireRole([UserRoleEnum.ADMIN]),
  requireUserType([UserTypeEnum.SUPPORT]),
];
const authMiddleware = [requireAuth];

/**
 * @openapi
 * components:
 *   schemas:
 *     ILookupCategoryCreate:
 *       type: object
 *       required:
 *         - name
 *         - label
 *       properties:
 *         name:
 *           type: string
 *           description: Unique identifier for the lookup category
 *           example: "skills"
 *         label:
 *           type: string
 *           description: Display name for the lookup category
 *           example: "Skills"
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *           description: Status of the lookup category
 *           example: "ACTIVE"
 *     ILookupValueCreate:
 *       type: object
 *       required:
 *         - label
 *         - lookupCategoryId
 *       properties:
 *         label:
 *           type: string
 *           description: The lookup value label
 *           example: "Software Engineer"
 *         lookupCategoryId:
 *           type: string
 *           format: uuid
 *           description: ID of the lookup category
 *           example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *           description: Status of the lookup value
 *           example: "ACTIVE"
 *     ILookupCategory:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier of the lookup category
 *         name:
 *           type: string
 *           description: Unique identifier for the lookup category
 *         label:
 *           type: string
 *           description: Display name for the lookup category
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *           description: Status of the lookup category
 *         lookupValues:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ILookupValue'
 *     ILookupValue:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier of the lookup value
 *         label:
 *           type: string
 *           description: The lookup value label
 *         lookupCategoryId:
 *           type: string
 *           format: uuid
 *           description: ID of the lookup category
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *           description: Status of the lookup value
 *         lookupCategory:
 *           $ref: '#/components/schemas/ILookupCategory'
 *     ILookupCategoryMinimal:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier of the lookup category
 *         name:
 *           type: string
 *           description: Unique identifier for the lookup category
 *         label:
 *           type: string
 *           description: Display name for the lookup category
 *         lookupValues:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ILookupValueMinimal'
 *     ILookupValueMinimal:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier of the lookup value
 *         label:
 *           type: string
 *           description: The lookup value label
 */

/**
 * @openapi
 * /support/lookups/categories:
 *   post:
 *     tags: [Support Lookup Management]
 *     summary: Create a lookup category
 *     description: Create a new lookup category. Category names must be unique (Admin and Support only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - label
 *             properties:
 *               name:
 *                 type: string
 *                 description: Unique identifier for the category (lowercase letters, numbers, and underscores only)
 *                 example: skills
 *                 pattern: '^[a-z0-9_]+$'
 *                 minLength: 1
 *                 maxLength: 100
 *               label:
 *                 type: string
 *                 description: Display name for the category
 *                 example: Skills
 *                 minLength: 1
 *                 maxLength: 200
 *               status:
 *                 type: string
 *                 description: Status of the category (defaults to ACTIVE if not provided)
 *                 enum: [ACTIVE, INACTIVE]
 *                 default: ACTIVE
 *                 example: ACTIVE
 *     responses:
 *       201:
 *         description: Lookup category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Lookup category created successfully
 *                 data:
 *                   $ref: '#/components/schemas/ILookupCategory'
 *       400:
 *         description: Bad request - Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid category name format. Use only lowercase letters, numbers, and underscores"
 *                 code:
 *                   type: string
 *                   example: "ERR_4001"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Unauthorized access"
 *                 code:
 *                   type: string
 *                   example: "ERR_401"
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Insufficient permissions"
 *                 code:
 *                   type: string
 *                   example: "ERR_403"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 *                 code:
 *                   type: string
 *                   example: "ERR_500"
 */
router.post(
  '/categories',
  [
    ...adminAndSupportMiddleware,
    validateRequest(lookupCategoryCreateValidator),
  ],
  lookupController.createLookupCategory
);

/**
 * @openapi
 * /support/lookups/categories:
 *   get:
 *     tags: [Support Lookup Management]
 *     summary: Get all lookup categories with values
 *     description: Retrieve all lookup categories with their values. Admins and Support see full data (all statuses), others see minimal data (only active items with id and name/value only).
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lookup categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     oneOf:
 *                       - $ref: '#/components/schemas/ILookupCategory'
 *                       - $ref: '#/components/schemas/ILookupCategoryMinimal'
 *                 error:
 *                   type: string
 *                   nullable: true
 *                 message:
 *                   type: string
 *                   nullable: true
 *       401:
 *         description: Unauthorized
 */
router.get('/categories', authMiddleware, lookupController.getLookupCategories);

/**
 * @openapi
 * /support/lookups/categories/{id}:
 *   get:
 *     tags: [Support Lookup Management]
 *     summary: Get lookup category by ID
 *     description: Retrieve a specific lookup category with all its values (Admin and Support only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The lookup category ID
 *     responses:
 *       200:
 *         description: Lookup category retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ILookupCategory'
 *                 error:
 *                   type: string
 *                   nullable: true
 *                 message:
 *                   type: string
 *                   nullable: true
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin or Support access required
 *       404:
 *         description: Lookup category not found
 */
router.get(
  '/categories/:id',
  [
    ...adminAndSupportMiddleware,
    validateRequest(lookupCategoryGetByIdValidator),
  ],
  lookupController.getLookupCategoryById
);

/**
 * @openapi
 * /support/lookups/categories/{id}:
 *   delete:
 *     tags: [Support Lookup Management]
 *     summary: Delete lookup category
 *     description: Soft delete a lookup category and all its values by setting status to INACTIVE (Admin and Support only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The lookup category ID
 *     responses:
 *       200:
 *         description: Lookup category deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   nullable: true
 *                 error:
 *                   type: string
 *                   nullable: true
 *                 message:
 *                   type: string
 *                   example: "Lookup category deleted successfully"
 *       400:
 *         description: Bad request - Invalid ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin or Support access required
 *       404:
 *         description: Lookup category not found
 */
router.delete(
  '/categories/:id',
  [
    ...adminAndSupportMiddleware,
    validateRequest(lookupCategoryDeleteValidator),
  ],
  lookupController.deleteLookupCategory
);

/**
 * @openapi
 * /support/lookups/values:
 *   post:
 *     tags: [Support Lookup Management]
 *     summary: Create a lookup value
 *     description: Create a new lookup value for a specific category. Value labels must be unique within each category (Admin and Support only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ILookupValueCreate'
 *     responses:
 *       200:
 *         description: Lookup value created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ILookupValue'
 *                 error:
 *                   type: string
 *                   nullable: true
 *                 message:
 *                   type: string
 *                   nullable: true
 *       400:
 *         description: Bad request - validation error or duplicate value in category
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin or Support access required
 *       404:
 *         description: Lookup category not found
 */
router.post(
  '/values',
  [...adminAndSupportMiddleware, validateRequest(lookupValueCreateValidator)],
  lookupController.createLookupValue
);

/**
 * @openapi
 * /support/lookups/values/{id}:
 *   delete:
 *     tags: [Support Lookup Management]
 *     summary: Delete lookup value
 *     description: Soft delete a lookup value by setting status to INACTIVE (Admin and Support only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The lookup value ID
 *     responses:
 *       200:
 *         description: Lookup value deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   nullable: true
 *                 error:
 *                   type: string
 *                   nullable: true
 *                 message:
 *                   type: string
 *                   example: "Lookup value deleted successfully"
 *       400:
 *         description: Bad request - Invalid ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin or Support access required
 *       404:
 *         description: Lookup value not found
 */
router.delete(
  '/values/:id',
  [...adminAndSupportMiddleware, validateRequest(lookupValueDeleteValidator)],
  lookupController.deleteLookupValue
);

/**
 * @openapi
 * /support/lookups/values/by-categories:
 *   get:
 *     tags: [Support Lookup Management]
 *     summary: Get lookup values by category names
 *     description: Retrieve lookup values for specified categories. Admins and Support see full data (all statuses), others see minimal data (only active items with id and name/value only).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: categories
 *         required: true
 *         schema:
 *           type: string
 *         description: Comma-separated list of category names
 *         example: "skills,industries,locations"
 *     responses:
 *       200:
 *         description: Lookup values retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     oneOf:
 *                       - $ref: '#/components/schemas/ILookupCategory'
 *                       - $ref: '#/components/schemas/ILookupCategoryMinimal'
 *                 error:
 *                   type: string
 *                   nullable: true
 *                 message:
 *                   type: string
 *                   nullable: true
 *       400:
 *         description: Bad request - Invalid category names
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No lookup categories found with the provided names
 */
router.get(
  '/values/by-categories',
  authMiddleware,
  validateRequest(lookupValuesByCategoriesValidator),
  lookupController.getLookupValuesByCategories
);

/**
 * @openapi
 * /support/lookups/countries:
 *   get:
 *     tags: [Support Lookup Management]
 *     summary: Get list of countries
 *     description: Retrieve a list of all countries (ISO 3166-1 alpha-2 codes and names)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of countries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ICountry'
 *                 error:
 *                   type: string
 *                   nullable: true
 *                 message:
 *                   type: string
 *                   nullable: true
 *       401:
 *         description: Unauthorized
 */
router.get('/countries', authMiddleware, lookupController.getCountries);

/**
 * @openapi
 * /support/lookups/timezones:
 *   get:
 *     tags: [Support Lookup Management]
 *     summary: Get timezones for a country
 *     description: Retrieve a list of timezones for a given country code (ISO 3166-1 alpha-2)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: country
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *           maxLength: 2
 *         description: ISO 3166-1 alpha-2 country code (e.g., 'US', 'IN')
 *         example: "US"
 *     responses:
 *       200:
 *         description: List of timezones for the country
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ITimezone'
 *                 error:
 *                   type: string
 *                   nullable: true
 *                 message:
 *                   type: string
 *                   nullable: true
 *       400:
 *         description: Bad request - Invalid country code
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/timezones',
  authMiddleware,
  validateRequest(lookupTimezonesByCountryValidator),
  lookupController.getTimezonesByCountry
);

export default router;
