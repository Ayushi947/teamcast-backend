import { IPaginatedResponse } from '../../api/common/common.api';

/**
 * Support Ticket Audit Log Domain Model
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportTicketAuditLog:
 *       type: object
 *       description: Support ticket audit log domain model
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the audit log
 *         ticketId:
 *           type: string
 *           format: uuid
 *           description: ID of the associated support ticket
 *         action:
 *           type: string
 *           description: Type of action performed
 *         entityType:
 *           type: string
 *           description: Type of entity affected
 *         entityId:
 *           type: string
 *           description: ID of the affected entity
 *         fieldChanged:
 *           type: string
 *           description: Name of the field that changed
 *         oldValue:
 *           type: string
 *           description: Previous value of the field
 *         newValue:
 *           type: string
 *           description: New value of the field
 *         oldData:
 *           type: object
 *           description: Previous data of the entity
 *         newData:
 *           type: object
 *           description: New data of the entity
 *         reason:
 *           type: string
 *           description: Reason for the action
 *         metadata:
 *           type: object
 *           description: Additional metadata about the action
 *         details:
 *           type: object
 *           description: Detailed information about the action
 *         performedById:
 *           type: string
 *           description: ID of the user who performed the action
 *         sessionId:
 *           type: string
 *           description: ID of the session
 *         userAgent:
 *           type: string
 *           description: User agent of the user
 *         isPrivate:
 *           type: boolean
 *           description: Whether the audit log entry is private
 *         createdAt:
 *           type: string
 *           description: Timestamp of the action
 */
export interface ISupportTicketAuditLog {
  id: string;
  ticketId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  oldData?: any;
  newData?: any;
  reason?: string;
  metadata?: any;
  details?: any;
  performedById?: string;
  sessionId?: string;
  userAgent?: string;
  isPrivate?: boolean;
  createdAt: Date;
}

/**
 * Support Ticket Audit Log Filter Interface
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportTicketAuditLogFilter:
 *       type: object
 *       description: Support ticket audit log filter domain model
 *       properties:
 *         ticketId:
 *           type: string
 *           format: uuid
 *           description: ID of the associated support ticket
 *         action:
 *           type: string
 *           description: Type of action performed
 *         entityType:
 *           type: string
 *           description: Type of entity affected
 *         entityId:
 *           type: string
 *           description: ID of the affected entity
 *         fieldChanged:
 *           type: string
 *           description: Name of the field that changed
 *         performedById:
 *           type: string
 *           description: ID of the user who performed the action
 *         sessionId:
 *           type: string
 *           description: ID of the session
 *         createdFrom:
 *           type: string
 *           description: Start date of the audit log
 *         createdTo:
 *           type: string
 *           description: End date of the audit log
 *         search:
 *           type: string
 *           description: Search query for the audit log
 */
export interface ISupportTicketAuditLogFilter {
  ticketId?: string;
  action?: string[];
  entityType?: string[];
  entityId?: string;
  fieldChanged?: string[];
  performedById?: string;
  sessionId?: string;
  createdFrom?: Date;
  createdTo?: Date;
  search?: string;
}

/**
 * Support Ticket Audit Log Sort Interface
 */
/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportTicketAuditLogSort:
 *       type: object
 *       description: Support ticket audit log sort domain model
 *       properties:
 *         field:
 *           type: string
 *           description: Field to sort by
 *         direction:
 *           type: string
 *           description: Sort direction
 */
export interface ISupportTicketAuditLogSort {
  field: 'createdAt' | 'action' | 'fieldChanged' | 'performedById';
  direction: 'asc' | 'desc';
}

/**
 * Support Ticket Audit Log List Response Interface
 */
/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportTicketAuditLogListResponse:
 *       type: object
 *       description: Support ticket audit log list response domain model
 *       properties:
 *         data:
 *           type: array
 *           description: List of audit logs
 *         pagination:
 *           type: object
 *           description: Pagination information
 *       allOf:
 *         - $ref: '#/components/schemas/IPaginatedResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               description: List of audit logs
 *             pagination:
 *               type: object
 *               description: Pagination information
 *
 */
export type ISupportTicketAuditLogListResponse =
  IPaginatedResponse<ISupportTicketAuditLog>;

/**
 * Support Ticket Audit Log Summary Interface
 */
/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportTicketAuditLogSummary:
 *       type: object
 *       description: Support ticket audit log summary domain model
 *       properties:
 *         totalActions:
 *           type: number
 *           description: Total number of actions
 *         actionsByType:
 *           type: object
 *           description: Actions by type
 *         actionsByUser:
 *           type: object
 *           description: Actions by user
 *         actionsByField:
 *           type: object
 *           description: Actions by field
 *         recentActivity:
 *           type: array
 *           description: Recent activity
 *         topUsers:
 *           type: array
 *           description: Top users
 *         topActions:
 *           type: array
 *           description: Top actions
 */
export interface ISupportTicketAuditLogSummary {
  totalActions: number;
  actionsByType: Record<string, number>;
  actionsByUser: Record<string, number>;
  actionsByField: Record<string, number>;
  recentActivity: ISupportTicketAuditLog[];
  topUsers: Array<{
    userId: string;
    userName: string;
    actionCount: number;
  }>;
  topActions: Array<{
    action: string;
    count: number;
  }>;
}

/**
 * Support Ticket Audit Log Timeline Interface
 */
/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportTicketAuditLogTimeline:
 *       type: object
 *       description: Support ticket audit log timeline domain model
 *       properties:
 *         date:
 *           type: string
 *           description: Date of the timeline
 *         actionCount:
 *           type: number
 *           description: Total number of actions
 *         actions:
 *           type: array
 *           description: Actions performed
 */
export interface ISupportTicketAuditLogTimeline {
  date: string;
  actionCount: number;
  actions: Array<{
    action: string;
    count: number;
  }>;
}
