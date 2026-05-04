import { IPaginatedResponse } from '../common/common.api';
import {
  IFeatureFlag,
  IFeatureFlagCreate,
  IFeatureFlagUpdate,
} from '../../domain/support/feature.flag.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     IFeatureFlagListApiResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IFeatureFlag'
 */
export interface IFeatureFlagListApiResponse {
  data: IFeatureFlag[];
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IFeatureFlagPaginatedListApiResponse:
 *       type: object
 *       description: Paginated list of feature flags (search, filters, pagination)
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IFeatureFlag'
 *         pagination:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *               description: Total number of items
 *             page:
 *               type: integer
 *               description: Current page
 *             limit:
 *               type: integer
 *               description: Items per page
 *             totalPages:
 *               type: integer
 *               description: Total number of pages
 */
export type IFeatureFlagPaginatedListApiResponse =
  IPaginatedResponse<IFeatureFlag>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IFeatureFlagGetApiResponse:
 *       type: object
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/IFeatureFlag'
 */
export interface IFeatureFlagGetApiResponse {
  data: IFeatureFlag;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IFeatureFlagCreateApiRequest:
 *       type: object
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/IFeatureFlagCreate'
 */
export interface IFeatureFlagCreateApiRequest {
  data: IFeatureFlagCreate;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IFeatureFlagCreateApiResponse:
 *       type: object
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/IFeatureFlag'
 */
export interface IFeatureFlagCreateApiResponse {
  data: IFeatureFlag;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IFeatureFlagUpdateApiRequest:
 *       type: object
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/IFeatureFlagUpdate'
 */
export interface IFeatureFlagUpdateApiRequest {
  data: IFeatureFlagUpdate;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IFeatureFlagUpdateApiResponse:
 *       type: object
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/IFeatureFlag'
 */
export interface IFeatureFlagUpdateApiResponse {
  data: IFeatureFlag;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IFeatureFlagDeleteApiResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 */
export interface IFeatureFlagDeleteApiResponse {
  data: {
    success: boolean;
  };
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IFeatureFlagPublicApiResponse:
 *       type: object
 *       description: Public feature flags (only key and enabled status)
 *       additionalProperties:
 *         type: boolean
 */
export interface IFeatureFlagPublicApiResponse {
  data: Record<string, boolean>;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IFeatureFlagCopyToClientsApiResponse:
 *       type: object
 *       description: Response after copying a feature flag to selected clients
 *       properties:
 *         data:
 *           type: object
 *           properties:
 *             created:
 *               type: array
 *               description: Feature flags created for clients (client-specific overrides)
 *               items:
 *                 $ref: '#/components/schemas/IFeatureFlag'
 *             skipped:
 *               type: array
 *               description: Client IDs that already had this flag (skipped)
 *               items:
 *                 type: string
 *                 format: uuid
 */
export interface IFeatureFlagCopyToClientsApiResponse {
  data: {
    created: IFeatureFlag[];
    skipped: string[];
  };
}
