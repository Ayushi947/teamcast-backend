/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportTicketActivityLogFilter:
 *       type: object
 *       description: Filter options for activity logs
 *       properties:
 *         ticketId:
 *           type: string
 *           format: uuid
 *           description: Filter by specific ticket ID
 *         action:
 *           type: array
 *           items:
 *             type: string
 *           description: Filter by action types
 *         entityType:
 *           type: array
 *           items:
 *             type: string
 *           description: Filter by entity types
 *         performedById:
 *           type: string
 *           format: uuid
 *           description: Filter by user who performed the action
 *         fieldChanged:
 *           type: array
 *           items:
 *             type: string
 *           description: Filter by fields that were changed
 *         createdFrom:
 *           type: string
 *           format: date-time
 *           description: Filter by creation date from
 *         createdTo:
 *           type: string
 *           format: date-time
 *           description: Filter by creation date to
 *         search:
 *           type: string
 *           description: Search query for activity logs
 */
export interface ISupportTicketActivityLogFilter {
  ticketId?: string;
  action?: string[];
  entityType?: string[];
  performedById?: string;
  fieldChanged?: string[];
  createdFrom?: Date;
  createdTo?: Date;
  search?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportTicketActivityLogSort:
 *       type: object
 *       description: Sort options for activity logs
 *       properties:
 *         field:
 *           type: string
 *           enum:
 *             - createdAt
 *             - action
 *             - fieldChanged
 *             - performedById
 *           description: Field to sort by
 *         direction:
 *           type: string
 *           enum:
 *             - asc
 *             - desc
 *           description: Sort direction
 *       required:
 *         - field
 *         - direction
 */
export interface ISupportTicketActivityLogSort {
  field: 'createdAt' | 'action' | 'fieldChanged' | 'performedById';
  direction: 'asc' | 'desc';
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportTicketActivityLogPagination:
 *       type: object
 *       description: Pagination options for activity logs
 *       properties:
 *         page:
 *           type: number
 *           minimum: 1
 *           description: Page number (1-based)
 *         limit:
 *           type: number
 *           minimum: 1
 *           maximum: 100
 *           description: Number of items per page
 *       required:
 *         - page
 *         - limit
 */
export interface ISupportTicketActivityLogPagination {
  page: number;
  limit: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportTicketActivitySummaryFilter:
 *       type: object
 *       description: Filter options for activity summary
 *       properties:
 *         dateFrom:
 *           type: string
 *           format: date-time
 *           description: Start date for summary calculation
 *         dateTo:
 *           type: string
 *           format: date-time
 *           description: End date for summary calculation
 *         performedById:
 *           type: string
 *           format: uuid
 *           description: Filter by user who performed the action
 *         action:
 *           type: array
 *           items:
 *             type: string
 *           description: Filter by action types
 */
export interface ISupportTicketActivitySummaryFilter {
  dateFrom?: Date;
  dateTo?: Date;
  performedById?: string;
  action?: string[];
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportTicketUserActivityLogFilter:
 *       type: object
 *       description: Filter options for user activity logs
 *       properties:
 *         action:
 *           type: array
 *           items:
 *             type: string
 *           description: Filter by action types
 *         entityType:
 *           type: array
 *           items:
 *             type: string
 *           description: Filter by entity types
 *         createdFrom:
 *           type: string
 *           format: date-time
 *           description: Filter by creation date from
 *         createdTo:
 *           type: string
 *           format: date-time
 *           description: Filter by creation date to
 */
export interface ISupportTicketUserActivityLogFilter {
  action?: string[];
  entityType?: string[];
  createdFrom?: Date;
  createdTo?: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportTicketExportActivityLogFilter:
 *       type: object
 *       description: Filter options for exporting activity logs
 *       properties:
 *         ticketId:
 *           type: string
 *           format: uuid
 *           description: Filter by specific ticket ID
 *         action:
 *           type: array
 *           items:
 *             type: string
 *           description: Filter by action types
 *         entityType:
 *           type: array
 *           items:
 *             type: string
 *           description: Filter by entity types
 *         performedById:
 *           type: string
 *           format: uuid
 *           description: Filter by user who performed the action
 *         fieldChanged:
 *           type: array
 *           items:
 *             type: string
 *           description: Filter by fields that were changed
 *         createdFrom:
 *           type: string
 *           format: date-time
 *           description: Filter by creation date from
 *         createdTo:
 *           type: string
 *           format: date-time
 *           description: Filter by creation date to
 */
export interface ISupportTicketExportActivityLogFilter {
  ticketId?: string;
  action?: string[];
  entityType?: string[];
  performedById?: string;
  fieldChanged?: string[];
  createdFrom?: Date;
  createdTo?: Date;
}
