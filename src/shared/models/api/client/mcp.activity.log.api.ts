/**
 * MCP Activity Log API Models
 * API request/response types for MCP activity log endpoints
 */

import {
  IApiRequest,
  IApiResponse,
  IDateRangeFilter,
} from '../common/common.api';
import {
  IMcpActivityLog,
  IMcpActivityLogListResult,
  IMcpActivityStats,
  IMcpActivityLogFilterQuery,
} from '../../domain/client/mcp.activity.log.domain';
import { IMcpClientIdParams } from '../../domain/client/mcp.client.domain';

// ============================================================================
// Get Activity Logs for MCP Client
// ============================================================================

export interface IMcpActivityLogListOptions extends IDateRangeFilter {
  limit?: number;
  offset?: number;
}

export type IMcpActivityLogListApiRequest = IApiRequest<
  void,
  IMcpActivityLogFilterQuery & IMcpActivityLogListOptions,
  IMcpClientIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IMcpActivityLogListApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IMcpActivityLogListResult'
 */
export type IMcpActivityLogListApiResponse =
  IApiResponse<IMcpActivityLogListResult>;

// ============================================================================
// Get Activity Log Entry
// ============================================================================

export interface IMcpActivityLogIdParams extends IMcpClientIdParams {
  logId: string;
}

export type IMcpActivityLogGetApiRequest = IApiRequest<
  void,
  void,
  IMcpActivityLogIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IMcpActivityLogGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IMcpActivityLog'
 */
export type IMcpActivityLogGetApiResponse = IApiResponse<IMcpActivityLog>;

// ============================================================================
// Get Activity Stats for MCP Client
// ============================================================================

export type IMcpActivityStatsApiRequest = IApiRequest<
  void,
  IDateRangeFilter,
  IMcpClientIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IMcpActivityStatsApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IMcpActivityStats'
 */
export type IMcpActivityStatsApiResponse = IApiResponse<IMcpActivityStats>;
