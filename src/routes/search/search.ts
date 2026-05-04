import express from 'express';
import { SearchController } from '@/controllers/search/search.controller';
import { SearchService } from '@/services/search/search.service';
import { searchValidator } from '@/shared/validators/search/search.validator';
import { validateRequest } from '@/middleware';

const router = express.Router();

// Services
const searchService = new SearchService();

// Controllers
const searchController = new SearchController(searchService);

/**
 * @openapi
 * /search/jobs:
 *   post:
 *     summary: Search for jobs
 *     description: Search for jobs based on query and filters
 *     tags:
 *       - Search
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ISearchRequest'
 *     responses:
 *       200:
 *         description: Search successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISearchApiResponse'
 */
router.post(
  '/jobs',
  validateRequest(searchValidator),
  searchController.searchJobs
);

/**
 * @openapi
 * /search/candidates:
 *   post:
 *     summary: Search for candidates
 *     description: Search for candidates based on query and filters
 *     tags:
 *       - Search
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ISearchRequest'
 *     responses:
 *       200:
 *         description: Search successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISearchApiResponse'
 */
router.post(
  '/candidates',
  validateRequest(searchValidator),
  searchController.searchCandidates
);

export default router;
