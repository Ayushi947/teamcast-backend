import { ICandidateRecommendation } from '../../../../shared/models/domain/candidate/recommendation.domain';
import { IApiRequest } from '../../../../shared/models/api/common/common.api';

export interface ICreateCandidateRecommendationRequest {
  candidateId: string;
  jobId: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICreateCandidateRecommendationRequest:
 *       type: object
 *       required:
 *         - candidateId
 *         - jobId
 *       properties:
 *         candidateId:
 *           type: string
 *           format: uuid
 *           description: ID of the candidate
 *         jobId:
 *           type: string
 *           format: uuid
 *           description: ID of the job posting
 *       example:
 *         candidateId: "123e4567-e89b-12d3-a456-426614174000"
 *         jobId: "987fcdeb-51a2-43d1-9f12-345678901234"
 *     ICreateCandidateRecommendationResponse:
 *       type: object
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/ICandidateRecommendation'
 *         message:
 *           type: string
 *           description: Success message
 *           example: "Candidate recommendation created successfully"
 *     IErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Error message
 *         statusCode:
 *           type: integer
 *           description: HTTP status code
 *         message:
 *           type: string
 *           description: Error description
 */

export type ICreateCandidateRecommendationApiRequest =
  IApiRequest<ICreateCandidateRecommendationRequest>;

export interface ICreateCandidateRecommendationResponse {
  data: ICandidateRecommendation;
  message: string;
}
