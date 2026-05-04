import {
  IPartnerJobPosting,
  IPartnerJobPostingList,
  IPartnerJobPostingFilterQuery,
} from '../../domain/partner/job.postings.domain';
import {
  IApiRequest,
  IApiResponse,
  IApiPaginatedRequest,
  IPaginatedResponse,
} from '../common/common.api';

// Get job postings list API models
export type IPartnerJobPostingsGetApiRequest = IApiPaginatedRequest<
  void,
  IPartnerJobPostingFilterQuery,
  void
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerJobPostingsGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               allOf:
 *                 - $ref: '#/components/schemas/IPaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/IPartnerJobPostingList'
 */
export type IPartnerJobPostingsGetApiResponse = IApiResponse<
  IPaginatedResponse<IPartnerJobPostingList>
>;

// Get job posting details API models
export interface IPartnerJobPostingGetParams {
  id: string;
}

export type IPartnerJobPostingGetApiRequest = IApiRequest<
  void,
  void,
  IPartnerJobPostingGetParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerJobPostingGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerJobPosting'
 */
export type IPartnerJobPostingGetApiResponse = IApiResponse<IPartnerJobPosting>;
