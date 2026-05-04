import { IAuthToken } from '../auth/auth.token.domain';
import { IAuthUser } from '../auth/auth.user.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerSignup:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *         - companyName
 *         - title
 *         - specialization
 *       properties:
 *         name:
 *           type: string
 *           description: Partner's full name
 *           example: Jane Smith
 *         email:
 *           type: string
 *           format: email
 *           description: Partner's email address
 *           example: jane.smith@example.com
 *         password:
 *           type: string
 *           format: password
 *           description: Partner's password
 *           example: "********"
 *         companyName:
 *           type: string
 *           description: Name of the partner's company
 *           example: TechTalent Solutions
 *         title:
 *           type: string
 *           description: Partner's job title
 *           example: Head of Recruitment
 *         specialization:
 *           type: string
 *           description: Partner's area of specialization
 *           example: Software Engineering
 */

export interface IPartnerSignup {
  name: string;
  email: string;
  password: string;
  companyName: string;
  title: string;
  specialization: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerSignupDone:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message after partner signup
 *           example: Partner successfully registered
 *         user:
 *           $ref: '#/components/schemas/IAuthUser'
 *           description: Authenticated user information
 *         token:
 *           $ref: '#/components/schemas/IAuthToken'
 *           description: Authentication tokens for the partner
 */

export interface IPartnerSignupDone {
  message: string;
  user: IAuthUser;
  token: IAuthToken;
}
