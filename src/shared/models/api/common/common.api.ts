/**
 * @openapi
 * components:
 *   schemas:
 *     IApiRequest:
 *       type: object
 *       properties:
 *         data:
 *           type: object
 *           description: Request data payload
 *         filters:
 *           type: object
 *           description: Query filters
 *         params:
 *           type: object
 *           description: URL parameters
 *         pagination:
 *           $ref: '#/components/schemas/IPaginationRequest'
 *     IApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the operation was successful
 *           example: true
 *         data:
 *           type: object
 *           description: Response data
 *         error:
 *           type: string
 *           description: Error message if success is false
 *         message:
 *           type: string
 *           description: Response message
 */
export interface IApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface IApiRequest<data = any, filters = any, params = any> {
  data: data;
  filters: filters;
  params: params;
  pagination: IPaginationRequest;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IDateRangeFilter:
 *       type: object
 *       properties:
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Start date for filtering data
 *           example: "2023-01-01T00:00:00Z"
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: End date for filtering data
 *           example: "2023-12-31T23:59:59Z"
 */
export interface IDateRangeFilter {
  startDate?: string;
  endDate?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPaginationRequest:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           description: Page number
 *           example: 1
 *         limit:
 *           type: integer
 *           description: Number of items per page
 *           example: 10
 *         sortBy:
 *           type: string
 *           description: Field to sort by
 *           example: "createdAt"
 *         sortOrder:
 *           type: string
 *           enum: ["asc", "desc"]
 *           description: Sort order
 *           example: "asc"
 *         search:
 *           type: string
 *           description: Search term
 *           example: "search term"
 *         searchColumns:
 *           type: array
 *           items:
 *             type: string
 *           description: Specific columns to search in
 *           example: ["name", "email"]
 *   parameters:
 *     IPaginationRequestParamsPage:
 *       in: query
 *       name: page
 *       required: false
 *       schema:
 *         type: integer
 *         description: Page number
 *         example: 1
 *     IPaginationRequestParamsLimit:
 *       in: query
 *       name: limit
 *       required: false
 *       schema:
 *         type: integer
 *         description: Number of items per page
 *         example: 10
 *     IPaginationRequestParamsSortBy:
 *       in: query
 *       name: sortBy
 *       required: false
 *       schema:
 *         type: string
 *         description: Field to sort by
 *         example: "createdAt"
 *     IPaginationRequestParamsSortOrder:
 *       in: query
 *       name: sortOrder
 *       required: false
 *       schema:
 *         type: string
 *         description: Sort order
 *         example: "asc"
 *     IPaginationRequestParamsSearch:
 *       in: query
 *       name: search
 *       required: false
 *       schema:
 *         type: string
 *         description: Search term
 *         example: "search term"
 *     IPaginationRequestParamsSearchColumns:
 *       in: query
 *       name: searchColumns
 *       required: false
 *       schema:
 *         type: array
 *         items:
 *           type: string
 *         description: Specific columns to search in
 *         example: ["name", "email"]
 */
export interface IPaginationRequest {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  searchColumns?: string[];
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPaginationInfo:
 *       type: object
 *       properties:
 *         skip:
 *           type: integer
 *           description: Number of items to skip
 *         take:
 *           type: integer
 *           description: Number of items to take
 *         orderBy:
 *           type: object
 *           description: Sort order configuration
 */
export interface IPaginationInfo {
  skip: number;
  take: number;
  orderBy: Record<string, 'asc' | 'desc'>;
}

export type IApiPaginatedRequest<
  data = any,
  filters = any,
  params = any,
> = IApiRequest<data, filters, params>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPaginatedResponse:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           description: Array of items
 *           items:
 *             type: object
 *         pagination:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *               description: Total number of items
 *               example: 100
 *             page:
 *               type: integer
 *               description: Current page
 *               example: 1
 *             limit:
 *               type: integer
 *               description: Items per page
 *               example: 10
 *             totalPages:
 *               type: integer
 *               description: Total number of pages
 *               example: 10
 */
export interface IPaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IApiPaginatedResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the request was successful
 *         data:
 *           $ref: '#/components/schemas/IPaginatedResponse'
 *         message:
 *           type: string
 *           description: Optional message about the response
 */

export type IApiPaginatedResponse<T> = IApiResponse<IPaginatedResponse<T>>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the operation was successful
 *           example: false
 *         message:
 *           type: string
 *           description: Error message
 *           example: "Bad request - Invalid input data"
 *         code:
 *           type: string
 *           description: Error code
 *           example: "ERR_3001"
 *         stack:
 *           type: string
 *           description: Stack trace (only in development)
 *           example: "Error: Invalid input\n    at ..."
 *       required:
 *         - success
 *         - message
 *         - code
 *     ForbiddenError:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the operation was successful
 *           example: false
 *         message:
 *           type: string
 *           description: Error message
 *           example: "Forbidden - Insufficient permissions"
 *         code:
 *           type: string
 *           description: Error code
 *           example: "ERR_2001"
 *       required:
 *         - success
 *         - message
 *         - code
 *     NotFoundError:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the operation was successful
 *           example: false
 *         message:
 *           type: string
 *           description: Error message
 *           example: "Resource not found"
 *         code:
 *           type: string
 *           description: Error code
 *           example: "ERR_4001"
 *       required:
 *         - success
 *         - message
 *         - code
 *     InternalServerError:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the operation was successful
 *           example: false
 *         message:
 *           type: string
 *           description: Error message
 *           example: "Internal server error"
 *         code:
 *           type: string
 *           description: Error code
 *           example: "ERR_6001"
 *         stack:
 *           type: string
 *           description: Stack trace (only in development)
 *           example: "Error: Internal server error\n    at ..."
 *       required:
 *         - success
 *         - message
 *         - code
 */
export interface IErrorResponse {
  success: false;
  message: string;
  code: string;
  stack?: string;
}

export interface IForbiddenError {
  success: false;
  message: string;
  code: string;
}

export interface INotFoundError {
  success: false;
  message: string;
  code: string;
}

export interface IInternalServerError {
  success: false;
  message: string;
  code: string;
  stack?: string;
}
