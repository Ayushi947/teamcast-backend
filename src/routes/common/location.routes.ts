import { Router } from 'express';
import { LocationController } from '@/controllers/common/location.controller';
import { requireAuth, validateRequest } from '@/middleware';
import {
  countryListValidator,
  stateListValidator,
  cityListValidator,
  locationNamesValidator,
} from '@/shared/validators/common/location.validator';
import { LocationService } from '@/services/common/location.service';

const router = Router();

// Initialize services and controller
const locationService = new LocationService();
const locationController = new LocationController(locationService);

/**
 * @openapi
 * /locations/countries:
 *   get:
 *     summary: Get list of countries
 *     description: Retrieves a paginated list of countries with optional search
 *     tags:
 *       - Locations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Maximum number of countries to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of countries to skip
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term to filter countries by name or code
 *     responses:
 *       200:
 *         description: Countries retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/countries',
  [requireAuth, validateRequest(countryListValidator)],
  locationController.getCountries.bind(locationController)
);

/**
 * @openapi
 * /locations/states:
 *   get:
 *     summary: Get list of states
 *     description: Retrieves a paginated list of states with optional filtering by country and search
 *     tags:
 *       - Locations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Maximum number of states to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of states to skip
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term to filter states by name or code
 *       - in: query
 *         name: countryId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter states by country ID
 *     responses:
 *       200:
 *         description: States retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/states',
  [requireAuth, validateRequest(stateListValidator)],
  locationController.getStates.bind(locationController)
);

/**
 * @openapi
 * /locations/cities:
 *   get:
 *     summary: Get list of cities
 *     description: Retrieves a paginated list of cities with optional filtering by state, country and search
 *     tags:
 *       - Locations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Maximum number of cities to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of cities to skip
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term to filter cities by name
 *       - in: query
 *         name: stateId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter cities by state ID
 *       - in: query
 *         name: countryId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter cities by country ID
 *     responses:
 *       200:
 *         description: Cities retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/cities',
  [requireAuth, validateRequest(cityListValidator)],
  locationController.getCities.bind(locationController)
);

/**
 * @swagger
 * /locations/all:
 *   get:
 *     tags: [Locations]
 *     summary: Get all location names with filtering
 *     description: Returns a list of all locations in the format "City, State, Country"
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Filter locations by name
 *       - in: query
 *         name: countryId
 *         schema:
 *           type: string
 *         description: Filter states and cities by country ID
 *       - in: query
 *         name: stateId
 *         schema:
 *           type: string
 *         description: Filter cities by state ID
 *     responses:
 *       200:
 *         description: List of locations
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
 *                   properties:
 *                     locations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "123"
 *                           name:
 *                             type: string
 *                             example: "Pune, Maharashtra, India"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/all',
  [requireAuth, validateRequest(locationNamesValidator)],
  locationController.getAllLocationNames.bind(locationController)
);

export default router;
