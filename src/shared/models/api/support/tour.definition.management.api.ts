import { ITourDefinition } from '../../domain/tour/tour.guidance.domain';
import { IPaginatedResponse } from '../common/common.api';

/**
 * @openapi
 * components:
 *   schemas:
 *     ITourDefinitionExtended:
 *       allOf:
 *         - $ref: '#/components/schemas/ITourDefinition'
 *         - type: object
 *           properties:
 *             pagePattern:
 *               type: string
 *               description: URL pattern where this tour should be shown
 *               example: '/app/candidate/onboard/resume'
 *             targetPages:
 *               type: array
 *               items:
 *                 type: string
 *               description: Array of specific pages where tour applies
 *               example: ['/app/candidate/onboard/resume']
 *             tourGroup:
 *               type: string
 *               description: Group identifier for skip/dismiss behavior
 *               example: 'candidate_onboarding'
 *             autoStart:
 *               type: boolean
 *               description: Should tour start automatically
 *               default: false
 *             restartOnPageChange:
 *               type: boolean
 *               description: Restart tour when page changes
 *               default: false
 */
export interface ITourDefinitionExtended extends ITourDefinition {
  pagePattern?: string;
  targetPages?: string[];
  tourGroup?: string;
  autoStart?: boolean;
  restartOnPageChange?: boolean;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICreateTourDefinitionApiRequest:
 *       type: object
 *       required:
 *         - data
 *       properties:
 *         data:
 *           type: object
 *           required:
 *             - tourKey
 *             - name
 *             - userType
 *             - isActive
 *             - priority
 *             - version
 *             - triggerConditions
 *             - tourSteps
 *             - tourSettings
 *           properties:
 *             tourKey:
 *               type: string
 *               description: Unique identifier for the tour
 *               example: 'candidate_onboarding_resume'
 *             name:
 *               type: string
 *               description: Display name of the tour
 *               example: 'Resume Upload Guide'
 *             description:
 *               type: string
 *               description: Description of the tour
 *             userType:
 *               type: string
 *               enum: [CANDIDATE, CLIENT, PARTNER, SUPPORT]
 *               description: User type this tour is for
 *             userRole:
 *               type: string
 *               description: Optional user role filter
 *             isActive:
 *               type: boolean
 *               description: Whether the tour is active
 *             priority:
 *               type: number
 *               description: Priority order (higher = higher priority)
 *             version:
 *               type: string
 *               description: Version of the tour definition
 *             pagePattern:
 *               type: string
 *               description: URL pattern where this tour should be shown
 *             targetPages:
 *               type: array
 *               items:
 *                 type: string
 *               description: Array of specific pages where tour applies
 *             triggerConditions:
 *               type: object
 *               description: Conditions to show the tour
 *             tourSteps:
 *               type: array
 *               items:
 *                 type: object
 *               description: Array of tour step definitions
 *             tourSettings:
 *               type: object
 *               description: Default settings for the tour
 *             tourGroup:
 *               type: string
 *               description: Group identifier for skip/dismiss behavior
 *             autoStart:
 *               type: boolean
 *               default: false
 *             restartOnPageChange:
 *               type: boolean
 *               default: false
 */
export interface ICreateTourDefinitionApiRequest {
  data: Omit<ITourDefinitionExtended, 'id' | 'createdAt' | 'updatedAt'>;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICreateTourDefinitionApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/ITourDefinitionExtended'
 */
export type ICreateTourDefinitionApiResponse = ITourDefinitionExtended;

/**
 * @openapi
 * components:
 *   schemas:
 *     IUpdateTourDefinitionApiRequest:
 *       type: object
 *       required:
 *         - data
 *       properties:
 *         data:
 *           type: object
 *           description: Partial tour definition data to update
 *           properties:
 *             name:
 *               type: string
 *             description:
 *               type: string
 *             userType:
 *               type: string
 *               enum: [CANDIDATE, CLIENT, PARTNER, SUPPORT]
 *             userRole:
 *               type: string
 *             isActive:
 *               type: boolean
 *             priority:
 *               type: number
 *             version:
 *               type: string
 *             pagePattern:
 *               type: string
 *             targetPages:
 *               type: array
 *               items:
 *                 type: string
 *             triggerConditions:
 *               type: object
 *             tourSteps:
 *               type: array
 *               items:
 *                 type: object
 *             tourSettings:
 *               type: object
 *             tourGroup:
 *               type: string
 *             autoStart:
 *               type: boolean
 *             restartOnPageChange:
 *               type: boolean
 */
export interface IUpdateTourDefinitionApiRequest {
  data: Partial<
    Omit<ITourDefinitionExtended, 'id' | 'tourKey' | 'createdAt' | 'updatedAt'>
  >;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IUpdateTourDefinitionApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/ITourDefinitionExtended'
 */
export type IUpdateTourDefinitionApiResponse = ITourDefinitionExtended;

/**
 * @openapi
 * components:
 *   schemas:
 *     IGetTourDefinitionApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/ITourDefinitionExtended'
 */
export type IGetTourDefinitionApiResponse = ITourDefinitionExtended;

/**
 * @openapi
 * components:
 *   schemas:
 *     IGetAllTourDefinitionsApiResponse:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ITourDefinitionExtended'
 *         pagination:
 *           type: object
 *           properties:
 *             total:
 *               type: number
 *               description: Total number of items
 *             page:
 *               type: number
 *               description: Current page number
 *             limit:
 *               type: number
 *               description: Items per page
 *             totalPages:
 *               type: number
 *               description: Total number of pages
 */
export type IGetAllTourDefinitionsApiResponse =
  IPaginatedResponse<ITourDefinitionExtended>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IGetTourDefinitionsFilters:
 *       type: object
 *       properties:
 *         userType:
 *           type: string
 *           description: Filter by user type
 *           example: 'CANDIDATE'
 *         userRole:
 *           type: string
 *           description: Filter by user role
 *         isActive:
 *           type: boolean
 *           description: Filter by active status
 *         tourGroup:
 *           type: string
 *           description: Filter by tour group
 *           example: 'candidate_onboarding'
 *         search:
 *           type: string
 *           description: Search in name, tourKey, or description
 */
export interface IGetTourDefinitionsFilters {
  userType?: string;
  userRole?: string;
  isActive?: boolean;
  tourGroup?: string;
  search?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IGetTourGroupsApiResponse:
 *       type: object
 *       properties:
 *         groups:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of unique tour group identifiers
 *           example: ['candidate_onboarding', 'client_onboarding']
 */
export interface IGetTourGroupsApiResponse {
  groups: string[];
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IToggleTourDefinitionStatusApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/ITourDefinitionExtended'
 */
export type IToggleTourDefinitionStatusApiResponse = ITourDefinitionExtended;
