import { ISupportTicketAuditLog } from '../../domain/support-ticket/support-ticket-audit-log.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketActivityLogsApiResponse:
 *       type: object
 *       description: Response containing activity logs with pagination
 *       properties:
 *         logs:
 *           type: array
 *           items:
 *             allOf:
 *               - $ref: '#/components/schemas/ISupportTicketAuditLog'
 *               - type: object
 *                 properties:
 *                   performedBy:
 *                     type: object
 *                     nullable: true
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                   ticket:
 *                     type: object
 *                     nullable: true
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       ticketNumber:
 *                         type: string
 *                       title:
 *                         type: string
 *                       status:
 *                         type: string
 *                       priority:
 *                         type: string
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: number
 *               description: Current page number
 *             limit:
 *               type: number
 *               description: Number of items per page
 *             total:
 *               type: number
 *               description: Total number of activity logs
 *             totalPages:
 *               type: number
 *               description: Total number of pages
 *           required:
 *             - page
 *             - limit
 *             - total
 *             - totalPages
 *       required:
 *         - logs
 *         - pagination
 */
export interface ISupportTicketActivityLogsApiResponse {
  logs: (ISupportTicketAuditLog & {
    performedBy?: { id: string; name: string; email: string } | null;
    ticket?: {
      id: string;
      ticketNumber: string;
      title: string;
      status: string;
      priority: string;
    } | null;
  })[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketActivitySummaryApiResponse:
 *       type: object
 *       description: Response containing aggregated activity statistics and summary data
 *       properties:
 *         totalActions:
 *           type: number
 *           description: Total number of actions performed
 *         actionsByType:
 *           type: object
 *           additionalProperties:
 *             type: number
 *           description: Breakdown of actions by type
 *         actionsByUser:
 *           type: object
 *           additionalProperties:
 *             type: number
 *           description: Breakdown of actions by user
 *         actionsByField:
 *           type: object
 *           additionalProperties:
 *             type: number
 *           description: Breakdown of actions by field changed
 *         recentActivity:
 *           type: array
 *           items:
 *             allOf:
 *               - $ref: '#/components/schemas/ISupportTicketAuditLog'
 *               - type: object
 *                 properties:
 *                   performedBy:
 *                     type: object
 *                     nullable: true
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                   ticket:
 *                     type: object
 *                     nullable: true
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       ticketNumber:
 *                         type: string
 *                       title:
 *                         type: string
 *                       status:
 *                         type: string
 *                       priority:
 *                         type: string
 *           description: Recent activity logs
 *         topUsers:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *               actionCount:
 *                 type: number
 *             required:
 *               - userId
 *               - name
 *               - actionCount
 *           description: Top users by action count
 *         topActions:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *               count:
 *                 type: number
 *             required:
 *               - action
 *               - count
 *           description: Top actions by frequency
 *         timeline:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               count:
 *                 type: number
 *             required:
 *               - date
 *               - count
 *           description: Timeline of activity over the last 7 days
 *       required:
 *         - totalActions
 *         - actionsByType
 *         - actionsByUser
 *         - actionsByField
 *         - recentActivity
 *         - topUsers
 *         - topActions
 *         - timeline
 */
export interface ISupportTicketActivitySummaryApiResponse {
  totalActions: number;
  actionsByType: { [key: string]: number };
  actionsByUser: { [key: string]: number };
  actionsByField: { [key: string]: number };
  recentActivity: (ISupportTicketAuditLog & {
    performedBy?: { id: string; name: string; email: string } | null;
    ticket?: {
      id: string;
      ticketNumber: string;
      title: string;
      status: string;
      priority: string;
    } | null;
  })[];
  topUsers: { userId: string; name: string; actionCount: number }[];
  topActions: { action: string; count: number }[];
  timeline: { date: string; count: number }[];
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketUserActivityLogsApiResponse:
 *       type: object
 *       description: Response containing user activity logs with summary statistics
 *       properties:
 *         logs:
 *           type: array
 *           items:
 *             allOf:
 *               - $ref: '#/components/schemas/ISupportTicketAuditLog'
 *               - type: object
 *                 properties:
 *                   performedBy:
 *                     type: object
 *                     nullable: true
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                   ticket:
 *                     type: object
 *                     nullable: true
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       ticketNumber:
 *                         type: string
 *                       title:
 *                         type: string
 *                       status:
 *                         type: string
 *                       priority:
 *                         type: string
 *           description: Activity logs for the user
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: number
 *               description: Current page number
 *             limit:
 *               type: number
 *               description: Number of items per page
 *             total:
 *               type: number
 *               description: Total number of activity logs
 *             totalPages:
 *               type: number
 *               description: Total number of pages
 *           required:
 *             - page
 *             - limit
 *             - total
 *             - totalPages
 *         summary:
 *           type: object
 *           properties:
 *             totalActions:
 *               type: number
 *               description: Total number of actions performed by the user
 *             actionsByType:
 *               type: object
 *               additionalProperties:
 *                 type: number
 *               description: Breakdown of actions by type for the user
 *             actionsByField:
 *               type: object
 *               additionalProperties:
 *                 type: number
 *               description: Breakdown of actions by field changed for the user
 *             recentActivity:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/ISupportTicketAuditLog'
 *                   - type: object
 *                     properties:
 *                       performedBy:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                       ticket:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           ticketNumber:
 *                             type: string
 *                           title:
 *                             type: string
 *                           status:
 *                             type: string
 *                           priority:
 *                             type: string
 *               description: Recent activity logs for the user
 *           required:
 *             - totalActions
 *             - actionsByType
 *             - actionsByField
 *             - recentActivity
 *       required:
 *         - logs
 *         - pagination
 *         - summary
 */
export interface ISupportTicketUserActivityLogsApiResponse {
  logs: (ISupportTicketAuditLog & {
    performedBy?: { id: string; name: string; email: string } | null;
    ticket?: {
      id: string;
      ticketNumber: string;
      title: string;
      status: string;
      priority: string;
    } | null;
  })[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalActions: number;
    actionsByType: { [key: string]: number };
    actionsByField: { [key: string]: number };
    recentActivity: (ISupportTicketAuditLog & {
      performedBy?: { id: string; name: string; email: string } | null;
      ticket?: {
        id: string;
        ticketNumber: string;
        title: string;
        status: string;
        priority: string;
      } | null;
    })[];
  };
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketExportActivityLogsApiResponse:
 *       type: object
 *       description: Response for activity logs export operation
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the export was successful
 *         message:
 *           type: string
 *           description: Success or error message
 *       required:
 *         - success
 *         - message
 *       example:
 *         success: true
 *         message: "CSV exported successfully"
 */
export interface ISupportTicketExportActivityLogsApiResponse {
  success: boolean;
  message: string;
}
