import { IApiRequest } from '../common/common.api';

/**
 * @openapi
 * components:
 *   schemas:
 *     IGetAccountManagerByClientIdApiRequest:
 *       type: object
 */

export interface IGetAccountManagerByClientIdApiRequest {
  clientId: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IGetAccountManagerByClientIdApiResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The ID of the account manager
 *         name:
 *           type: string
 *           description: The name of the account manager
 *         email:
 *           type: string
 *           description: The email of the account manager
 *         type:
 *           type: string
 *           description: The type of the account manager
 *         role:
 *           type: string
 *           description: The role of the account manager
 *         status:
 *           type: string
 *           description: The status of the account manager
 *         jobTitle:
 *           type: string
 *           description: The job title of the account manager
 *         image:
 *           type: string
 *           description: The image of the account manager
 *         createdAt:
 *           type: string
 *           description: The created at date of the account manager
 *         updatedAt:
 *           type: string
 *           description: The updated at date of the account manager
 *         assignedAt:
 *           type: string
 *           description: The date when the account manager was assigned to the client
 */

export interface IGetAccountManagerByClientIdApiResponse {
  id: string;
  name: string;
  email: string;
  type: string;
  role: string;
  status: string;
  jobTitle?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
  assignedAt: string;
  // Add other user fields as needed
}

export type IGetAccountManagerByClientIdApiRequestWrapper = IApiRequest<
  any,
  IGetAccountManagerByClientIdApiRequest,
  any
>;
