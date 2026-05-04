import { ENV } from '@/config/env';
import {
  IPaginationInfo,
  IPaginationRequest,
} from '@/shared/models/api/common/common.api';

export interface IQueryConditions {
  where: Record<string, any>;
  skip: number;
  take: number;
  orderBy: Record<string, any>;
  pagination: {
    page: number;
    limit: number;
  };
}

/**
 * Generic search configuration
 */
export interface ISearchConfig {
  searchableFields: string[];
  relationFields?: Record<string, string[]>;
}

/**
 * Generic filter configuration
 */
export interface IFilterConfig {
  allowedFields: string[];
  relationFields?: Record<string, string>;
  arrayFields?: string[];
  enumFields?: string[];
  enumRelationFields?: Record<string, string>;
  booleanFields?: string[];
}

/**
 * Generic sort configuration
 */
export interface ISortConfig {
  allowedFields: string[];
  relationFields?: Record<string, { relation: string; field: string }>;
  defaultSort?: { field: string; order: 'asc' | 'desc' };
}

/**
 * Get basic pagination parameters
 */
export function getPaginationInfo(
  pageRequest: IPaginationRequest
): IPaginationInfo {
  const page = pageRequest.page ?? ENV.DEFAULT_PAGE;
  const limit = pageRequest.limit ?? ENV.DEFAULT_LIMIT;
  // Treat empty string as undefined to use default
  const sortBy =
    pageRequest.sortBy && pageRequest.sortBy.trim()
      ? pageRequest.sortBy.trim()
      : ENV.DEFAULT_SORT_BY;
  const sortOrder = pageRequest.sortOrder ?? ENV.DEFAULT_SORT_ORDER;

  return {
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
  };
}

/**
 * Build search conditions for Prisma queries
 */
export function buildSearchConditions(
  searchTerm?: string,
  searchColumns?: string[],
  config?: ISearchConfig
): Record<string, any> {
  if (!searchTerm?.trim()) {
    return {};
  }

  const fieldsToSearch = searchColumns?.length
    ? searchColumns.filter((field) => config?.searchableFields.includes(field))
    : config?.searchableFields || [];

  if (!fieldsToSearch.length) {
    return {};
  }

  const orConditions = fieldsToSearch
    .map((field) => {
      // Handle relation fields
      if (config?.relationFields && field in config.relationFields) {
        return config.relationFields[field].map((relatedField) => ({
          [field]: {
            [relatedField]: {
              contains: searchTerm.trim(),
              mode: 'insensitive' as const,
            },
          },
        }));
      }

      // Handle direct fields
      return {
        [field]: {
          contains: searchTerm.trim(),
          mode: 'insensitive' as const,
        },
      };
    })
    .flat();

  return { OR: orConditions };
}

/**
 * Build filter conditions for Prisma queries
 */
export function buildFilterConditions(
  filters: Record<string, any>,
  config?: IFilterConfig
): Record<string, any> {
  if (!filters || !config) {
    return {};
  }

  const conditions: Record<string, any> = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (!value || !config.allowedFields.includes(key)) {
      return;
    }

    // Handle relation fields
    if (config.relationFields?.[key]) {
      const relationField = config.relationFields[key];
      conditions[relationField] = {
        [key]: handleFilterValue(value, key, config),
      };
      return;
    }

    // Handle direct fields
    conditions[key] = handleFilterValue(value, key, config);
  });

  return conditions;
}

/**
 * Helper to handle different types of filter values
 */
function handleFilterValue(
  value: any,
  field: string,
  config: IFilterConfig
): any {
  // Handle array fields
  if (config.arrayFields?.includes(field)) {
    const values = Array.isArray(value)
      ? value
      : value.split(',').map((v: string) => v.trim());
    return { hasSome: values };
  }

  // Handle enum fields
  if (config.enumFields?.includes(field)) {
    const values = Array.isArray(value)
      ? value
      : value.split(',').map((v: string) => v.trim());
    return values.length > 1 ? { in: values } : values[0];
  }

  // Handle boolean
  if (
    typeof value === 'string' &&
    ['true', 'false'].includes(value.toLowerCase())
  ) {
    return value.toLowerCase() === 'true';
  }

  // Handle numbers
  if (!isNaN(value)) {
    return Number(value);
  }

  // Default string handling
  return {
    contains: value,
    mode: 'insensitive' as const,
  };
}

/**
 * Build sort conditions for Prisma queries
 */
export function buildSortConditions(
  sortBy: string,
  sortOrder: 'asc' | 'desc',
  config?: ISortConfig
): Record<string, any> {
  if (!config?.allowedFields.includes(sortBy)) {
    return config?.defaultSort
      ? { [config.defaultSort.field]: config.defaultSort.order }
      : { createdAt: 'desc' };
  }

  // Handle relation fields
  if (config.relationFields?.[sortBy]) {
    const { relation, field } = config.relationFields[sortBy];
    return {
      [relation]: {
        [field]: sortOrder,
      },
    };
  }

  // Handle direct fields
  return { [sortBy]: sortOrder };
}

/**
 * Build complete query conditions for Prisma
 */
export function buildQueryConditions<T extends Record<string, any>>(
  filter: T,
  paginationRequest: IPaginationRequest,
  config: {
    search?: ISearchConfig;
    filter?: IFilterConfig;
    sort?: ISortConfig;
  },
  supportUserId?: string
): IQueryConditions {
  const conditions: IQueryConditions = {
    where: {},
    skip: 0,
    take: 10,
    orderBy: {},
    pagination: {
      page: 1,
      limit: 10,
    },
  };

  // Handle pagination
  if (paginationRequest.page) {
    conditions.pagination.page = Number(paginationRequest.page);
    conditions.skip =
      (conditions.pagination.page - 1) * conditions.pagination.limit;
  }

  if (paginationRequest.limit) {
    conditions.pagination.limit = Number(paginationRequest.limit);
    conditions.take = conditions.pagination.limit;
  }

  if (supportUserId && filter.showYours == 'true') {
    conditions.where.createdById = supportUserId;
  }

  // Ensure skip is calculated correctly
  conditions.skip =
    (conditions.pagination.page - 1) * conditions.pagination.limit;

  // Handle search
  if (paginationRequest.search && config.search) {
    const searchConditions = [];
    const searchValue = paginationRequest.search.trim();

    if (!searchValue) {
      return conditions;
    }

    // Handle direct fields
    if (config.search.searchableFields) {
      for (const field of config.search.searchableFields) {
        searchConditions.push({
          [field]: {
            contains: searchValue,
            mode: 'insensitive',
          },
        });
      }
    }

    // Handle relation fields
    if (config.search.relationFields) {
      for (const [relation, fields] of Object.entries(
        config.search.relationFields
      )) {
        const relationConditions = fields.map((field) => ({
          [field]: {
            contains: searchValue,
            mode: 'insensitive',
          },
        }));

        searchConditions.push({
          [relation]: {
            OR: relationConditions,
          },
        });
      }
    }

    if (searchConditions.length > 0) {
      conditions.where = {
        ...conditions.where,
        OR: searchConditions,
      };
    }
  }

  // Handle filters
  if (config.filter) {
    const filterConditions: Record<string, any> = {};

    for (const [key, value] of Object.entries(filter)) {
      if (!config.filter.allowedFields?.includes(key)) continue;

      if (config.filter.enumRelationFields?.[key]) {
        const relation = config.filter.enumRelationFields[key];
        const enumValue = Array.isArray(value)
          ? value.length > 1
            ? { in: value }
            : value[0]
          : typeof value === 'string' && value.includes(',')
            ? { in: value.split(',').map((v: string) => v.trim()) }
            : value;

        filterConditions[relation] = {
          ...filterConditions[relation],
          [key]: enumValue,
        };
        continue;
      }

      // Handle relation fields
      if (config.filter.relationFields?.[key]) {
        const relation = config.filter.relationFields[key];
        filterConditions[relation] = {
          ...filterConditions[relation],
          [key]: value,
        };
        continue;
      }

      // Handle array fields
      if (config.filter.arrayFields?.includes(key)) {
        if (Array.isArray(value)) {
          filterConditions[key] = {
            hasSome: value,
          };
        } else if (typeof value === 'string' && value.includes(',')) {
          filterConditions[key] = {
            hasSome: value.split(','),
          };
        }
        continue;
      }

      // Handle enum fields
      if (config.filter.enumFields?.includes(key)) {
        if (Array.isArray(value)) {
          filterConditions[key] = {
            in: value,
          };
        } else if (typeof value === 'string' && value.includes(',')) {
          filterConditions[key] = {
            in: value.split(','),
          };
        } else {
          filterConditions[key] = value;
        }
        continue;
      }

      // Handle boolean fields
      if (config.filter.booleanFields?.includes(key)) {
        if (typeof value === 'string') {
          filterConditions[key] = value.toLowerCase() === 'true';
        } else {
          filterConditions[key] = value;
        }
        continue;
      }

      // Handle single value filters
      filterConditions[key] = value;
    }

    if (Object.keys(filterConditions).length > 0) {
      conditions.where = {
        ...conditions.where,
        ...filterConditions,
      };
    }
  }

  // Handle sorting
  let sortApplied = false;
  if (paginationRequest.sortBy && config.sort) {
    const sortField = paginationRequest.sortBy;
    const sortOrder = paginationRequest.sortOrder || 'asc';

    // Handle relation fields
    if (config.sort.relationFields?.[sortField]) {
      const { relation, field } = config.sort.relationFields[sortField];
      conditions.orderBy = {
        [relation]: {
          [field]: sortOrder,
        },
      };
      sortApplied = true;
    } else if (config.sort.allowedFields?.includes(sortField)) {
      conditions.orderBy = {
        [sortField]: sortOrder,
      };
      sortApplied = true;
    }
  }

  // Apply default sort if no sort was applied
  if (!sortApplied && config.sort?.defaultSort) {
    const { field, order } = config.sort.defaultSort;
    if (config.sort.relationFields?.[field]) {
      const { relation, field: relationField } =
        config.sort.relationFields[field];
      conditions.orderBy = {
        [relation]: {
          [relationField]: order,
        },
      };
    } else {
      conditions.orderBy = {
        [field]: order,
      };
    }
  }

  return conditions;
}
