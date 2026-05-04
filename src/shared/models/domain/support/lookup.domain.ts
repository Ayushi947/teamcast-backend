import {
  LookupStatus,
  ILookupCategory,
  ILookupValue,
} from '../../common/enums';

// Create DTOs
/**
 * @openapi
 * components:
 *   schemas:
 *     ILookupCategoryCreate:
 *       type: object
 *       description: Data required to create a lookup category
 *       required:
 *         - name
 *         - label
 *       properties:
 *         name:
 *           type: string
 *           description: Unique identifier for the lookup category (lowercase letters, numbers, and underscores only)
 *           example: "skills"
 *           pattern: '^[a-z0-9_]+$'
 *           minLength: 1
 *           maxLength: 100
 *         label:
 *           type: string
 *           description: Display name for the lookup category
 *           example: "Skills"
 *           minLength: 1
 *           maxLength: 200
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *           description: Status of the lookup category
 *           default: ACTIVE
 *           example: ACTIVE
 */
export interface ILookupCategoryCreate {
  name: string;
  label: string;
  status?: LookupStatus;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ILookupValueCreate:
 *       type: object
 *       description: Data required to create a lookup value
 *       required:
 *         - label
 *         - lookupCategoryId
 *       properties:
 *         label:
 *           type: string
 *           description: The lookup value label
 *           example: "Software Engineer"
 *           minLength: 1
 *           maxLength: 200
 *         lookupCategoryId:
 *           type: string
 *           format: uuid
 *           description: ID of the lookup category
 *           example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *           description: Status of the lookup value
 *           default: ACTIVE
 *           example: ACTIVE
 */
export interface ILookupValueCreate {
  label: string;
  lookupCategoryId: string;
  status?: LookupStatus;
}

// Query DTOs
/**
 * @openapi
 * components:
 *   schemas:
 *     ILookupValuesByCategoriesQuery:
 *       type: object
 *       description: Query parameters for getting lookup values by categories
 *       required:
 *         - categories
 *       properties:
 *         categories:
 *           type: string
 *           description: Comma-separated list of category names
 *           example: "skills,industries,locations"
 *           minLength: 1
 *           maxLength: 1000
 */
export interface ILookupValuesByCategoriesQuery {
  categories: string;
}

// Parameter DTOs
/**
 * @openapi
 * components:
 *   schemas:
 *     ILookupCategoryIdParams:
 *       type: object
 *       description: Path parameters for lookup category operations
 *       required:
 *         - id
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Lookup category ID
 *           example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 */
export interface ILookupCategoryIdParams {
  id: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ILookupValueIdParams:
 *       type: object
 *       description: Path parameters for lookup value operations
 *       required:
 *         - id
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Lookup value ID
 *           example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 */
export interface ILookupValueIdParams {
  id: string;
}

// Prisma Models
/**
 * @internal
 * Prisma model for lookup value
 */
export interface IPrismaLookupValue {
  id: string;
  label: string;
  lookupCategoryId: string;
  status: string;
  lookupCategory?: IPrismaLookupCategory;
}

/**
 * @internal
 * Prisma model for lookup category
 */
export interface IPrismaLookupCategory {
  id: string;
  name: string;
  label: string;
  status: string;
  lookupValues?: IPrismaLookupValue[];
}

// Minimal Models
/**
 * @openapi
 * components:
 *   schemas:
 *     ILookupValueMinimal:
 *       type: object
 *       description: Minimal lookup value information (for non-admin users)
 *       required:
 *         - id
 *         - label
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the lookup value
 *           example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *         label:
 *           type: string
 *           description: The lookup value label
 *           example: "Software Engineer"
 *           minLength: 1
 *           maxLength: 200
 */
export interface ILookupValueMinimal {
  id: string;
  label: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ILookupCategoryMinimal:
 *       type: object
 *       description: Minimal lookup category information (for non-admin users)
 *       required:
 *         - id
 *         - name
 *         - label
 *         - lookupValues
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the lookup category
 *           example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *         name:
 *           type: string
 *           description: Name of the lookup category
 *           example: "skills"
 *           minLength: 1
 *           maxLength: 100
 *         label:
 *           type: string
 *           description: Display name for the lookup category
 *           example: "Skills"
 *           minLength: 1
 *           maxLength: 200
 *         lookupValues:
 *           type: array
 *           description: Array of minimal lookup values belonging to this category
 *           items:
 *             $ref: '#/components/schemas/ILookupValueMinimal'
 */
export interface ILookupCategoryMinimal {
  id: string;
  name: string;
  label: string;
  lookupValues: ILookupValueMinimal[];
}

// Default Values
/**
 * @internal
 * Default lookup category instance
 */
export const DEFAULT_LOOKUP_CATEGORY: ILookupCategory = {
  id: '',
  name: '',
  label: '',
  status: LookupStatus.ACTIVE,
  lookupValues: [],
};

/**
 * @internal
 * Default lookup value instance
 */
export const DEFAULT_LOOKUP_VALUE: ILookupValue = {
  id: '',
  label: '',
  lookupCategoryId: '',
  status: LookupStatus.ACTIVE,
};

// Utility Functions
/**
 * @internal
 * Maps Prisma status string to LookupStatus enum
 */
const mapPrismaStatusToLookupStatus = (status: string): LookupStatus => {
  if (status !== 'ACTIVE' && status !== 'INACTIVE') {
    throw new Error(`Invalid status value: ${status}`);
  }
  return status === 'ACTIVE' ? LookupStatus.ACTIVE : LookupStatus.INACTIVE;
};

/**
 * @internal
 * Maps Prisma lookup category to domain model
 */
export const toLookupCategoryDomain = (
  data: IPrismaLookupCategory
): ILookupCategory => ({
  id: data.id,
  name: data.name,
  label: data.label,
  status: mapPrismaStatusToLookupStatus(data.status),
  lookupValues:
    data.lookupValues?.map((value: IPrismaLookupValue) => ({
      id: value.id,
      label: value.label,
      lookupCategoryId: value.lookupCategoryId,
      status: mapPrismaStatusToLookupStatus(value.status),
    })) || [],
});

/**
 * @internal
 * Maps Prisma lookup value to domain model
 */
export const toLookupValueDomain = (
  prismaValue: IPrismaLookupValue
): ILookupValue => ({
  id: prismaValue.id,
  label: prismaValue.label,
  lookupCategoryId: prismaValue.lookupCategoryId,
  status: mapPrismaStatusToLookupStatus(prismaValue.status),
});

/**
 * @internal
 * Maps Prisma lookup category to minimal domain model
 */
export const toLookupCategoryMinimal = (
  data: IPrismaLookupCategory
): ILookupCategoryMinimal => ({
  id: data.id,
  name: data.name,
  label: data.label,
  lookupValues:
    data.lookupValues?.map((value: IPrismaLookupValue) => ({
      id: value.id,
      label: value.label,
    })) || [],
});

/**
 * @internal
 * Maps Prisma lookup value to minimal domain model
 */
export const toLookupValueMinimal = (
  prismaValue: IPrismaLookupValue
): ILookupValueMinimal => ({
  id: prismaValue.id,
  label: prismaValue.label,
});

/**
 * @openapi
 * components:
 *   schemas:
 *     ICountry:
 *       type: object
 *       properties:
 *         code:
 *           type: string
 *           description: ISO 3166-1 alpha-2 country code
 *           example: "US"
 *         name:
 *           type: string
 *           description: Country name
 *           example: "United States"
 */
export interface ILookupCountry {
  code: string;
  name: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ITimezone:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Timezone name (IANA)
 *           example: "America/New_York"
 *         tzCode:
 *           type: string
 *           description: Timezone code (IANA)
 *           example: "America/New_York"
 *         utcOffset:
 *           type: integer
 *           description: UTC offset in minutes
 *           example: -300
 *         utcOffsetStr:
 *           type: string
 *           description: UTC offset as string
 *           example: "-05:00"
 */
export interface ILookupTimezone {
  name: string;
  tzCode: string;
  utcOffset: number;
  utcOffsetStr: string;
}
