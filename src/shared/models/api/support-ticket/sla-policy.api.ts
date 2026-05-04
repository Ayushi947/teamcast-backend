import {
  ISlaPolicy,
  ISlaPolicyCreate,
  ISlaPolicyUpdate,
  ISlaPolicyMatchCriteria,
  ISlaPolicyStatistics,
  ISlaPolicyResult,
} from '../../domain/support-ticket/sla-policy.domain';
import { IApiPaginatedResponse } from '../common/common.api';
import { IApiRequest, IApiResponse } from '../common/common.api';

/**
 * SLA Policy API Request/Response Models
 */

/**
 * Create SLA Policy Request
 */
export type ISlaPolicyCreateApiRequest = IApiRequest<ISlaPolicyCreate>;

/**
 * Update SLA Policy Request
 */
export type ISlaPolicyUpdateApiRequest = IApiRequest<ISlaPolicyUpdate>;

/**
 * SLA Policy API Response
 */
export type ISlaPolicyApiResponse = IApiResponse<ISlaPolicy>;

/**
 * SLA Policy Create API Response
 */
export type ISlaPolicyCreateApiResponse = IApiResponse<ISlaPolicy>;

/**
 * SLA Policy Update API Response
 */
export type ISlaPolicyUpdateApiResponse = IApiResponse<ISlaPolicy>;

/**
 * SLA Policy Get API Response
 */
export type ISlaPolicyGetApiResponse = IApiResponse<ISlaPolicy>;

/**
 * SLA Policy List API Response
 */
export type ISlaPolicyListApiResponse = IApiPaginatedResponse<ISlaPolicy>;

/**
 * SLA Policy Delete API Response
 */
export type ISlaPolicyDeleteApiResponse = IApiResponse<void>;

/**
 * SLA Policy Assignment API Response
 */
export type ISlaPolicyAssignmentApiResponse = IApiResponse<ISlaPolicyResult>;

/**
 * SLA Policy Statistics API Response
 */
export type ISlaPolicyStatisticsApiResponse =
  IApiResponse<ISlaPolicyStatistics>;

/**
 * SLA Policy Match Request
 */
export type ISlaPolicyMatchApiRequest = IApiRequest<ISlaPolicyMatchCriteria>;

/**
 * SLA Policy Match API Response
 */
export type ISlaPolicyMatchApiResponse = IApiResponse<ISlaPolicyResult>;
