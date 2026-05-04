import { IApiRequest, IApiResponse } from '../common/common.api';
import {
  IClientCandidateShortlistCreate,
  IClientCandidateShortlistUpdate,
  IClientCandidateShortlist,
  IClientCandidateShortlistWithCandidate,
  IClientCandidateShortlistQuery,
} from '../../domain/client/candidate.shortlist.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientCandidateShortlistCreateApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientCandidateShortlistCreate'
 */
export type IClientCandidateShortlistCreateApiRequest =
  IApiRequest<IClientCandidateShortlistCreate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientCandidateShortlistCreateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientCandidateShortlist'
 */
export type IClientCandidateShortlistCreateApiResponse =
  IApiResponse<IClientCandidateShortlist>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientCandidateShortlistUpdateApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientCandidateShortlistUpdate'
 *             params:
 *               type: object
 *               properties:
 *                 shortlistId:
 *                   type: string
 *                   format: uuid
 *                   description: The ID of the shortlist entry
 *               required:
 *                 - shortlistId
 */
export interface IClientCandidateShortlistUpdateParams {
  shortlistId: string;
}

export type IClientCandidateShortlistUpdateApiRequest = IApiRequest<
  IClientCandidateShortlistUpdate,
  void,
  IClientCandidateShortlistUpdateParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientCandidateShortlistUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientCandidateShortlist'
 */
export type IClientCandidateShortlistUpdateApiResponse =
  IApiResponse<IClientCandidateShortlist>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientCandidateShortlistGetApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             params:
 *               type: object
 *               properties:
 *                 shortlistId:
 *                   type: string
 *                   format: uuid
 *                   description: The ID of the shortlist entry
 *               required:
 *                 - shortlistId
 */
export interface IClientCandidateShortlistGetParams {
  shortlistId: string;
}

export type IClientCandidateShortlistGetApiRequest = IApiRequest<
  void,
  void,
  IClientCandidateShortlistGetParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientCandidateShortlistGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientCandidateShortlistWithCandidate'
 */
export type IClientCandidateShortlistGetApiResponse =
  IApiResponse<IClientCandidateShortlistWithCandidate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientCandidateShortlistListApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             query:
 *               $ref: '#/components/schemas/IClientCandidateShortlistQuery'
 */
export type IClientCandidateShortlistListApiRequest = IApiRequest<
  void,
  IClientCandidateShortlistQuery
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientCandidateShortlistListApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IClientCandidateShortlistWithCandidate'
 *             pagination:
 *               type: object
 *               properties:
 *                 total:
 *                   type: number
 *                   description: Total number of items
 *                 page:
 *                   type: number
 *                   description: Current page number
 *                 limit:
 *                   type: number
 *                   description: Number of items per page
 *                 totalPages:
 *                   type: number
 *                   description: Total number of pages
 */
export interface IClientCandidateShortlistListData {
  data: IClientCandidateShortlistWithCandidate[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export type IClientCandidateShortlistListApiResponse = IApiResponse<
  IClientCandidateShortlistWithCandidate[]
> & {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientCandidateShortlistDeleteApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             params:
 *               type: object
 *               properties:
 *                 shortlistId:
 *                   type: string
 *                   format: uuid
 *                   description: The ID of the shortlist entry
 *               required:
 *                 - shortlistId
 */
export interface IClientCandidateShortlistDeleteParams {
  shortlistId: string;
}

export type IClientCandidateShortlistDeleteApiRequest = IApiRequest<
  void,
  void,
  IClientCandidateShortlistDeleteParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientCandidateShortlistDeleteApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Whether the deletion was successful
 */
export type IClientCandidateShortlistDeleteApiResponse = IApiResponse<{
  success: boolean;
}>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientCandidateShortlistBulkUpdateApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 shortlistIds:
 *                   type: array
 *                   items:
 *                     type: string
 *                     format: uuid
 *                   description: Array of shortlist IDs to update
 *                 updates:
 *                   $ref: '#/components/schemas/IClientCandidateShortlistUpdate'
 *               required:
 *                 - shortlistIds
 *                 - updates
 */
export interface IClientCandidateShortlistBulkUpdateData {
  shortlistIds: string[];
  updates: IClientCandidateShortlistUpdate;
}

export type IClientCandidateShortlistBulkUpdateApiRequest =
  IApiRequest<IClientCandidateShortlistBulkUpdateData>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientCandidateShortlistBulkUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 updatedCount:
 *                   type: number
 *                   description: Number of shortlists updated
 *                 success:
 *                   type: boolean
 *                   description: Whether the bulk update was successful
 */
export type IClientCandidateShortlistBulkUpdateApiResponse = IApiResponse<{
  updatedCount: number;
  success: boolean;
}>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientCandidateShortlistStatsApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 totalShortlisted:
 *                   type: number
 *                 byStatus:
 *                   type: object
 *                   properties:
 *                     SHORTLISTED:
 *                       type: number
 *                     NOT_INTERESTED:
 *                       type: number
 *                     REJECTED:
 *                       type: number
 *                 byJobPosting:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       jobPostingId:
 *                         type: string
 *                       title:
 *                         type: string
 *                       count:
 *                         type: number
 *                 recentActivity:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/IClientCandidateShortlistWithCandidate'
 */
export type IClientCandidateShortlistStatsApiResponse = IApiResponse<{
  totalShortlisted: number;
  byStatus: {
    SHORTLISTED: number;
    NOT_INTERESTED: number;
    REJECTED: number;
  };
  byJobPosting: {
    jobPostingId: string;
    title: string;
    count: number;
  }[];
  recentActivity: IClientCandidateShortlistWithCandidate[];
}>;
