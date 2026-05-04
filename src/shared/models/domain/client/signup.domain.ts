import { IAuthToken } from '../auth/auth.token.domain';
import { IAuthUser } from '../auth/auth.user.domain';
/**
 * @openapi
 * components:
 *   schemas:
 *     IClientSignup:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *         - companyName
 *         - title
 *       properties:
 *         name:
 *           type: string
 *           description: Client's full name
 *           example: John Doe
 *         email:
 *           type: string
 *           format: email
 *           description: Client's email address
 *           example: john.doe@example.com
 *         password:
 *           type: string
 *           format: password
 *           description: Client's password
 *           example: "********"
 *         companyName:
 *           type: string
 *           description: Name of the client's company
 *           example: Acme Corporation
 *         jobTitle:
 *           type: string
 *           description: Client's job title
 *           example: Chief Technology Officer
 *         selectedPlan:
 *           type: string
 *           description: Selected plan for the client
 *           example: "free"
 *         validity:
 *           type: string
 *           description: Validity period for the client
 *           example: "14"
 */

export interface IClientSignup {
  name: string;
  email: string;
  password: string;
  companyName: string;
  jobTitle: string;
  selectedPlan?: string;
  validity?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientSignupDone:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message after client signup
 *           example: Client successfully registered
 *         user:
 *           $ref: '#/components/schemas/IAuthUser'
 *           description: Authenticated user information
 *         token:
 *           $ref: '#/components/schemas/IAuthToken'
 *           description: Authentication tokens for the client
 */

export interface IClientSignupDone {
  message: string;
  user: IAuthUser;
  token: IAuthToken;
}
