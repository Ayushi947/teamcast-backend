import {
  ISupportCandidateKpis,
  ISupportCandidateKpisFilterOptions,
  ISupportCandidateKpisExport,
} from '../../domain/support/kpis.domain';

/**
 * @openapi
 * components:
 *   parameters:
 *     ISupportCandidateKpisFilterQueryStartDate:
 *       in: query
 *       name: startDate
 *       required: false
 *       schema:
 *         type: string
 *         format: date-time
 *       description: Start date for filtering (ISO 8601 format)
 *       example: "2024-01-01T00:00:00.000Z"
 *     ISupportCandidateKpisFilterQueryEndDate:
 *       in: query
 *       name: endDate
 *       required: false
 *       schema:
 *         type: string
 *         format: date-time
 *       description: End date for filtering (ISO 8601 format)
 *       example: "2024-12-31T23:59:59.999Z"
 *     ISupportCandidateKpisFilterQueryFilterBy:
 *       in: query
 *       name: filterBy
 *       required: false
 *       schema:
 *         type: string
 *       description: |
 *         Filter types to apply. Can be:
 *         - Single value: "user_signup"
 *         - Multiple values (comma-separated): "user_signup,job_invitations"
 *         - ID-based filters: "recruiter:123", "partner:456", "hr:789", "account_manager:101"
 *         - Multiple IDs: "recruiter:123,456", "partner:789,101"
 *         - Mixed filters: "support_invitations,recruiter:123,partner:456"
 *         - All filters: "all" (default)
 *
 *         Available filter types:
 *         - user_signup: Filter candidates by signup date
 *         - support_invitations: Filter support invitations by creation date
 *         - partner_invitations: Filter partner invitations by creation date
 *         - job_invitations: Filter job invitations by creation date
 *         - job_ai_assessment_invitations: Filter job AI assessment invitations by creation date
 *         - recruiter:{id1},{id2}: Filter candidates by recruiter assignments
 *         - hr:{id1},{id2}: Filter candidates by HR assignments
 *         - account_manager:{id1},{id2}: Filter candidates by account manager assignments
 *         - partner:{id1},{id2}: Filter candidates by partner assignments
 *       example: "support_invitations,recruiter:123,partner:456"
 *   schemas:
 *     ISupportCandidateKpisFilterQuery:
 *       type: object
 *       description: Filter query parameters for candidate KPIs
 *       properties:
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Start date for filtering (ISO 8601 format)
 *           example: "2024-01-01T00:00:00.000Z"
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: End date for filtering (ISO 8601 format)
 *           example: "2024-12-31T23:59:59.999Z"
 *         filterBy:
 *           type: string
 *           description: |
 *             Filter types to apply. Can be:
 *             - Single value: "user_signup"
 *             - Multiple values (comma-separated): "user_signup,job_invitations"
 *             - ID-based filters: "recruiter:123", "partner:456", "hr:789", "account_manager:101"
 *             - Multiple IDs: "recruiter:123,456", "partner:789,101"
 *             - Mixed filters: "support_invitations,recruiter:123,partner:456"
 *             - All filters: "all" (default)
 *
 *             Available filter types:
 *             - user_signup: Filter candidates by signup date
 *             - support_invitations: Filter support invitations by creation date
 *             - partner_invitations: Filter partner invitations by creation date
 *             - job_invitations: Filter job invitations by creation date
 *             - job_ai_assessment_invitations: Filter job AI assessment invitations by creation date
 *             - recruiter:{id1},{id2}: Filter candidates by recruiter assignments
 *             - hr:{id1},{id2}: Filter candidates by HR assignments
 *             - account_manager:{id1},{id2}: Filter candidates by account manager assignments
 *             - partner:{id1},{id2}: Filter candidates by partner assignments
 *           example: "support_invitations,recruiter:123,partner:456"
 */
export interface ISupportCandidateKpisFilterQuery {
  startDate?: string;
  endDate?: string;
  filterBy?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportCandidateKpisApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISupportCandidateKpis'
 */
export interface ISupportCandidateKpisApiResponse {
  data: ISupportCandidateKpis;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportCandidateKpisFilterOptionsApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISupportCandidateKpisFilterOptions'
 */
export interface ISupportCandidateKpisFilterOptionsApiResponse {
  data: ISupportCandidateKpisFilterOptions;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportCandidateKpisExportApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISupportCandidateKpisExport'
 */
export interface ISupportCandidateKpisExportApiResponse {
  data: ISupportCandidateKpisExport;
}
