/**
 * MCP Activity Log Domain Models
 * Domain models for MCP activity logging and monitoring
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     IMcpActivityLog:
 *       type: object
 *       description: Activity log entry for MCP client requests
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the log entry
 *         mcpClientId:
 *           type: string
 *           format: uuid
 *           description: ID of the MCP client that made the request
 *         method:
 *           type: string
 *           description: JSON-RPC method (e.g., 'tools/call')
 *         toolName:
 *           type: string
 *           nullable: true
 *           description: Tool name if applicable
 *         requestId:
 *           type: string
 *           nullable: true
 *           description: JSON-RPC request ID
 *         requestBody:
 *           type: object
 *           nullable: true
 *           description: Request payload (sanitized)
 *         responseStatus:
 *           type: string
 *           description: Response status ('success' or 'error')
 *         responseCode:
 *           type: integer
 *           nullable: true
 *           description: Error code if applicable
 *         errorMessage:
 *           type: string
 *           nullable: true
 *           description: Error message if applicable
 *         durationMs:
 *           type: integer
 *           description: Request duration in milliseconds
 *         ipAddress:
 *           type: string
 *           nullable: true
 *           description: IP address of the requester
 *         userAgent:
 *           type: string
 *           nullable: true
 *           description: User agent of the requester
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of the log entry
 *       required:
 *         - id
 *         - mcpClientId
 *         - method
 *         - responseStatus
 *         - durationMs
 *         - createdAt
 */
export interface IMcpActivityLog {
  id: string;
  mcpClientId: string;
  method: string;
  toolName: string | null;
  requestId: string | null;
  requestBody: Record<string, unknown> | null;
  responseStatus: string;
  responseCode: number | null;
  errorMessage: string | null;
  durationMs: number;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IMcpActivityLogWithClient:
 *       allOf:
 *         - $ref: '#/components/schemas/IMcpActivityLog'
 *         - type: object
 *           properties:
 *             mcpClient:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 */
export interface IMcpActivityLogWithClient extends IMcpActivityLog {
  mcpClient?: {
    id: string;
    name: string;
  };
}

/**
 * @openapi
 * components:
 *   parameters:
 *     IMcpActivityLogFilterQueryMethod:
 *       in: query
 *       name: method
 *       required: false
 *       schema:
 *         type: string
 *         description: Filter by JSON-RPC method
 *     IMcpActivityLogFilterQueryToolName:
 *       in: query
 *       name: toolName
 *       required: false
 *       schema:
 *         type: string
 *         description: Filter by tool name
 *     IMcpActivityLogFilterQueryResponseStatus:
 *       in: query
 *       name: responseStatus
 *       required: false
 *       schema:
 *         type: string
 *         enum: ['success', 'error']
 *         description: Filter by response status
 *     IMcpActivityLogFilterQueryStartDate:
 *       in: query
 *       name: startDate
 *       required: false
 *       schema:
 *         type: string
 *         format: date-time
 *         description: Filter logs after this date
 *     IMcpActivityLogFilterQueryEndDate:
 *       in: query
 *       name: endDate
 *       required: false
 *       schema:
 *         type: string
 *         format: date-time
 *         description: Filter logs before this date
 */
export interface IMcpActivityLogFilterQuery {
  method?: string;
  toolName?: string;
  responseStatus?: 'success' | 'error';
  startDate?: Date;
  endDate?: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IMcpActivityLogListResult:
 *       type: object
 *       description: Paginated result for activity logs
 *       properties:
 *         logs:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IMcpActivityLog'
 *         total:
 *           type: integer
 *           description: Total number of logs
 *         limit:
 *           type: integer
 *           description: Number of logs per page
 *         offset:
 *           type: integer
 *           description: Offset for pagination
 *       required:
 *         - logs
 *         - total
 *         - limit
 *         - offset
 */
export interface IMcpActivityLogListResult {
  logs: IMcpActivityLog[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IMcpActivityStats:
 *       type: object
 *       description: Aggregated activity statistics for an MCP client
 *       properties:
 *         totalRequests:
 *           type: integer
 *           description: Total number of requests
 *         successfulRequests:
 *           type: integer
 *           description: Number of successful requests
 *         failedRequests:
 *           type: integer
 *           description: Number of failed requests
 *         averageDurationMs:
 *           type: number
 *           description: Average request duration in milliseconds
 *         requestsByMethod:
 *           type: object
 *           additionalProperties:
 *             type: integer
 *           description: Request count by method
 *         requestsByTool:
 *           type: object
 *           additionalProperties:
 *             type: integer
 *           description: Request count by tool
 *         errorsByCode:
 *           type: object
 *           additionalProperties:
 *             type: integer
 *           description: Error count by error code
 *       required:
 *         - totalRequests
 *         - successfulRequests
 *         - failedRequests
 *         - averageDurationMs
 */
export interface IMcpActivityStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageDurationMs: number;
  requestsByMethod?: Record<string, number>;
  requestsByTool?: Record<string, number>;
  errorsByCode?: Record<string, number>;
}

/**
 * Helper function to convert database model to domain model
 */
export function toMcpActivityLogDomain(
  log: Record<string, unknown>
): IMcpActivityLog {
  return {
    id: log.id as string,
    mcpClientId: log.mcpClientId as string,
    method: log.method as string,
    toolName: log.toolName as string | null,
    requestId: log.requestId as string | null,
    requestBody: log.requestBody as Record<string, unknown> | null,
    responseStatus: log.responseStatus as string,
    responseCode: log.responseCode as number | null,
    errorMessage: log.errorMessage as string | null,
    durationMs: log.durationMs as number,
    ipAddress: log.ipAddress as string | null,
    userAgent: log.userAgent as string | null,
    createdAt: log.createdAt as Date,
  };
}
