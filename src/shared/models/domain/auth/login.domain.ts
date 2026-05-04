import { IAuthToken } from '../../domain/auth/auth.token.domain';
import { IAuthUser } from '../../domain/auth/auth.user.domain';
import { IClientSubscriptionOverview } from '../client/subscription.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     ILogin:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *           example: user@example.com
 *         password:
 *           type: string
 *           format: password
 *           description: User's password
 *           example: "********"
 */

export interface ILogin {
  email: string;
  password: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ILoggedIn:
 *       type: object
 *       properties:
 *         token:
 *           $ref: '#/components/schemas/IAuthToken'
 *           description: Authentication tokens for the logged in user
 *         user:
 *           $ref: '#/components/schemas/IAuthUser'
 *           description: Details of the authenticated user
 *         subscriptionOverview:
 *           $ref: '#/components/schemas/IClientSubscriptionOverview'
 *           description: Overview of the client's subscription
 *           nullable: true
 */

export interface ILoggedIn {
  token: IAuthToken;
  user: IAuthUser;
  subscriptionOverview?: IClientSubscriptionOverview;
}
