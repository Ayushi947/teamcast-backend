import {
  IClientResumeViewRequest,
  IClientResumeViewResponse,
} from '../../domain/client/resume.view.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientResumeViewApiRequest:
 *       type: object
 *       description: API request model for client resume view
 *       properties:
 *         result:
 *           $ref: '#/components/schemas/IClientResumeViewRequest'
 *       required:
 *         - result
 */
export interface IClientResumeViewApiRequest {
  result: IClientResumeViewRequest;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientResumeViewApiResponse:
 *       type: object
 *       description: API response model for client resume view
 *       properties:
 *         result:
 *           $ref: '#/components/schemas/IClientResumeViewResponse'
 *         message:
 *           type: string
 *           description: Success message
 *           example: "Resume view URL generated successfully"
 *       required:
 *         - result
 *         - message
 */
export interface IClientResumeViewApiResponse {
  result: IClientResumeViewResponse;
  message: string;
}
