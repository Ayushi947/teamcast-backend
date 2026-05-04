import { IAuthToken } from '../auth/auth.token.domain';
import { IAuthUser } from '../auth/auth.user.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateSignup:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           description: Candidate's full name
 *           example: John Doe
 *         email:
 *           type: string
 *           format: email
 *           description: Candidate's email address
 *           example: john.doe@example.com
 *         password:
 *           type: string
 *           format: password
 *           description: Candidate's password
 *           example: "********"
 *         jobTitle:
 *           type: string
 *           description: Candidate's current job role
 *           example: Software Engineer
 *         timezone:
 *           type: string
 *           description: Candidate's timezone
 *           example: "America/New_York"
 */

export interface ICandidateSignup {
  name: string;
  email: string;
  password: string;
  jobTitle?: string;
  timezone?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateSignupDone:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message after candidate signup
 *           example: Candidate successfully registered
 *         user:
 *           $ref: '#/components/schemas/IAuthUser'
 *           description: Authenticated user information
 *         token:
 *           $ref: '#/components/schemas/IAuthToken'
 *           description: Authentication tokens for the candidate
 */

export interface ICandidateSignupDone {
  message: string;
  user: IAuthUser;
  token: IAuthToken;
}
