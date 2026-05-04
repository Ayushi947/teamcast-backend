import { feature_flag } from '@prisma/client';
import {
  FeatureFlagCategoryEnum,
  UserTypeEnum,
  UserRoleEnum,
} from '../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     IFeatureFlag:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         key:
 *           type: string
 *           description: Unique identifier (e.g., FACE_DETECTION_ENABLED)
 *         name:
 *           type: string
 *           description: Display name of the feature
 *         description:
 *           type: string
 *           nullable: true
 *           description: Description of the feature
 *         enabled:
 *           type: boolean
 *           description: Whether the feature is enabled
 *         category:
 *           type: string
 *           enum: [SYSTEM, ASSESSMENT, PROCTORING, UI_ENHANCEMENT, ANALYTICS, INTEGRATION, EXPERIMENTAL, BETA, DEPRECATED]
 *         targetUserType:
 *           type: string
 *           enum: [CANDIDATE, CLIENT, SUPPORT, PARTNER]
 *           nullable: true
 *         targetUserRole:
 *           type: string
 *           nullable: true
 *         clientId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         rolloutPercentage:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *         metadata:
 *           type: object
 *           nullable: true
 *         createdBy:
 *           type: string
 *           nullable: true
 *         updatedBy:
 *           type: string
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
export interface IFeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  category: FeatureFlagCategoryEnum;
  targetUserType: UserTypeEnum | null;
  targetUserRole: UserRoleEnum | null;
  clientId: string | null;
  rolloutPercentage: number;
  metadata: any | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IFeatureFlagCreate:
 *       type: object
 *       required:
 *         - key
 *         - name
 *       properties:
 *         key:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         enabled:
 *           type: boolean
 *           default: false
 *         category:
 *           type: string
 *           enum: [SYSTEM, ASSESSMENT, PROCTORING, UI_ENHANCEMENT, ANALYTICS, INTEGRATION, EXPERIMENTAL, BETA, DEPRECATED]
 *           default: SYSTEM
 *         targetUserType:
 *           type: string
 *           enum: [CANDIDATE, CLIENT, SUPPORT, PARTNER]
 *         targetUserRole:
 *           type: string
 *         clientId:
 *           type: string
 *           format: uuid
 *         rolloutPercentage:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *           default: 100
 *         metadata:
 *           type: object
 */
export interface IFeatureFlagCreate {
  key: string;
  name: string;
  description?: string;
  enabled?: boolean;
  category?: FeatureFlagCategoryEnum;
  targetUserType?: UserTypeEnum;
  targetUserRole?: UserRoleEnum;
  clientId?: string;
  rolloutPercentage?: number;
  metadata?: any;
  createdBy?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IFeatureFlagUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         enabled:
 *           type: boolean
 *         category:
 *           type: string
 *           enum: [SYSTEM, ASSESSMENT, PROCTORING, UI_ENHANCEMENT, ANALYTICS, INTEGRATION, EXPERIMENTAL, BETA, DEPRECATED]
 *         targetUserType:
 *           type: string
 *           enum: [CANDIDATE, CLIENT, SUPPORT, PARTNER]
 *         targetUserRole:
 *           type: string
 *         clientId:
 *           type: string
 *           format: uuid
 *         rolloutPercentage:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *         metadata:
 *           type: object
 */
export interface IFeatureFlagUpdate {
  name?: string;
  description?: string;
  enabled?: boolean;
  category?: FeatureFlagCategoryEnum;
  targetUserType?: UserTypeEnum | null;
  targetUserRole?: UserRoleEnum | null;
  clientId?: string | null;
  rolloutPercentage?: number;
  metadata?: any;
  updatedBy?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IFeatureFlagListParams:
 *       type: object
 *       description: Query params for listing feature flags with search, filters and pagination
 *       properties:
 *         page:
 *           type: integer
 *           minimum: 1
 *           description: Page number (1-based)
 *         limit:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           description: Items per page
 *         search:
 *           type: string
 *           description: Search term for key, name or description
 *         category:
 *           type: string
 *           enum: [SYSTEM, ASSESSMENT, PROCTORING, UI_ENHANCEMENT, ANALYTICS, INTEGRATION, EXPERIMENTAL, BETA, DEPRECATED]
 *         enabled:
 *           type: boolean
 *           description: Filter by enabled status
 *         sortBy:
 *           type: string
 *           enum: [key, name, category, enabled, createdAt, updatedAt]
 *         sortOrder:
 *           type: string
 *           enum: [asc, desc]
 */
export interface IFeatureFlagListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  enabled?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IFeatureFlagPresetItem:
 *       type: object
 *       description: One item in a preset (snapshot of flag config, no id/clientId)
 *       required:
 *         - key
 *         - name
 *         - enabled
 *         - category
 *       properties:
 *         key:
 *           type: string
 *           description: Feature flag key
 *         name:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         enabled:
 *           type: boolean
 *         category:
 *           type: string
 *           enum: [SYSTEM, ASSESSMENT, PROCTORING, UI_ENHANCEMENT, ANALYTICS, INTEGRATION, EXPERIMENTAL, BETA, DEPRECATED]
 *         targetUserType:
 *           type: string
 *           enum: [CANDIDATE, CLIENT, SUPPORT, PARTNER]
 *           nullable: true
 *         targetUserRole:
 *           type: string
 *           nullable: true
 *         rolloutPercentage:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *         metadata:
 *           type: object
 */
export interface IFeatureFlagPresetItem {
  key: string;
  name: string;
  description?: string | null;
  enabled: boolean;
  category: FeatureFlagCategoryEnum;
  targetUserType?: UserTypeEnum | null;
  targetUserRole?: UserRoleEnum | null;
  rolloutPercentage?: number;
  metadata?: any;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IFeatureFlagPreset:
 *       type: object
 *       description: Saved preset (named set of flag configs to apply to a client)
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           description: Preset name (e.g. Proctoring strict)
 *         description:
 *           type: string
 *           nullable: true
 *         flagConfigs:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IFeatureFlagPresetItem'
 *         createdBy:
 *           type: string
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
export interface IFeatureFlagPreset {
  id: string;
  name: string;
  description: string | null;
  flagConfigs: IFeatureFlagPresetItem[];
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IFeatureFlagPresetCreate:
 *       type: object
 *       description: Payload to create a feature flag preset
 *       required:
 *         - name
 *         - flagConfigs
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         flagConfigs:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IFeatureFlagPresetItem'
 *         createdBy:
 *           type: string
 */
export interface IFeatureFlagPresetCreate {
  name: string;
  description?: string | null;
  flagConfigs: IFeatureFlagPresetItem[];
  createdBy?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IFeatureFlagPresetUpdate:
 *       type: object
 *       description: Payload to update a feature flag preset
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         flagConfigs:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IFeatureFlagPresetItem'
 */
export interface IFeatureFlagPresetUpdate {
  name?: string;
  description?: string | null;
  flagConfigs?: IFeatureFlagPresetItem[];
}

/**
 * @openapi
 * components:
 *   schemas:
 *     FeatureFlagScheduleAction:
 *       type: string
 *       enum: [ENABLE, DISABLE]
 *       description: Action to perform at scheduled time
 */
export type FeatureFlagScheduleAction = 'ENABLE' | 'DISABLE';

/**
 * @openapi
 * components:
 *   schemas:
 *     FeatureFlagScheduleStatus:
 *       type: string
 *       enum: [PENDING, APPLIED, CANCELLED]
 *       description: Status of a scheduled feature flag change
 */
export type FeatureFlagScheduleStatus = 'PENDING' | 'APPLIED' | 'CANCELLED';

/**
 * @openapi
 * components:
 *   schemas:
 *     IFeatureFlagSchedule:
 *       type: object
 *       description: Scheduled feature flag change (enable/disable at a specific time)
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         featureFlagId:
 *           type: string
 *           format: uuid
 *         clientId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: null for global flag
 *         scheduledAt:
 *           type: string
 *           format: date-time
 *         action:
 *           $ref: '#/components/schemas/FeatureFlagScheduleAction'
 *         status:
 *           $ref: '#/components/schemas/FeatureFlagScheduleStatus'
 *         createdBy:
 *           type: string
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         appliedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 */
export interface IFeatureFlagSchedule {
  id: string;
  featureFlagId: string;
  clientId: string | null;
  scheduledAt: Date;
  action: FeatureFlagScheduleAction;
  status: FeatureFlagScheduleStatus;
  createdBy: string | null;
  createdAt: Date;
  appliedAt: Date | null;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IFeatureFlagScheduleCreate:
 *       type: object
 *       description: Payload to create a scheduled feature flag change
 *       required:
 *         - featureFlagId
 *         - scheduledAt
 *         - action
 *       properties:
 *         featureFlagId:
 *           type: string
 *           format: uuid
 *         clientId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         scheduledAt:
 *           type: string
 *           format: date-time
 *         action:
 *           $ref: '#/components/schemas/FeatureFlagScheduleAction'
 *         createdBy:
 *           type: string
 */
export interface IFeatureFlagScheduleCreate {
  featureFlagId: string;
  clientId?: string | null;
  scheduledAt: Date;
  action: FeatureFlagScheduleAction;
  createdBy?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IFeatureFlagDiffResult:
 *       type: object
 *       description: Result of comparing global flags vs client-specific overrides
 *       properties:
 *         global:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IFeatureFlag'
 *           description: All global (clientId null) feature flags
 *         clientOverrides:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IFeatureFlag'
 *           description: Client-specific overrides for the given client
 */
export interface IFeatureFlagDiffResult {
  global: IFeatureFlag[];
  clientOverrides: IFeatureFlag[];
}

// Transform database model to domain model
export function toFeatureFlagDomain(flag: feature_flag): IFeatureFlag {
  return {
    id: flag.id,
    key: flag.key,
    name: flag.name,
    description: flag.description,
    enabled: flag.enabled,
    category: flag.category as FeatureFlagCategoryEnum,
    targetUserType: flag.targetUserType as UserTypeEnum | null,
    targetUserRole: flag.targetUserRole as UserRoleEnum | null,
    clientId: flag.clientId,
    rolloutPercentage: flag.rolloutPercentage,
    metadata: flag.metadata,
    createdBy: flag.createdBy,
    updatedBy: flag.updatedBy,
    createdAt: flag.createdAt,
    updatedAt: flag.updatedAt,
  };
}
