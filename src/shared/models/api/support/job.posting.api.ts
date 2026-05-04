import {
  ISupportJobPosting,
  ISupportJobPostingListResponse,
} from '../../domain/support/job.posting.domain';
import { IApiResponse, IApiPaginatedRequest } from '../common/common.api';

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportJobPostingListApiRequest:
 *       type: object
 *       description: Request model for getting job postings by account manager
 *       properties:
 *         data:
 *           type: object
 *           description: Request data (empty for this endpoint)
 *         filters:
 *           type: object
 *           description: Query filters (empty for this endpoint)
 *         params:
 *           type: object
 *           description: URL parameters (empty for this endpoint)
 *         pagination:
 *           $ref: '#/components/schemas/IPaginationRequest'
 */
export type ISupportJobPostingListApiRequest = IApiPaginatedRequest<
  void,
  void,
  void
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportJobPostingListApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISupportJobPostingListResponse'
 *               description: List of job postings assigned to the account manager
 */
export type ISupportJobPostingListApiResponse =
  IApiResponse<ISupportJobPostingListResponse>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportJobPostingGetApiRequest:
 *       type: object
 *       description: Request model for getting a specific job posting
 *       properties:
 *         data:
 *           type: object
 *           description: Request data (empty for this endpoint)
 *         filters:
 *           type: object
 *           description: Query filters (empty for this endpoint)
 *         params:
 *           type: object
 *           properties:
 *             jobPostingId:
 *               type: string
 *               format: uuid
 *               description: ID of the job posting to retrieve
 *         pagination:
 *           $ref: '#/components/schemas/IPaginationRequest'
 */
export interface ISupportJobPostingIdParams {
  jobPostingId: string;
}

export type ISupportJobPostingGetApiRequest = IApiPaginatedRequest<
  void,
  void,
  ISupportJobPostingIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportJobPostingGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISupportJobPosting'
 *               description: Job posting details
 */
export type ISupportJobPostingGetApiResponse = IApiResponse<ISupportJobPosting>;
