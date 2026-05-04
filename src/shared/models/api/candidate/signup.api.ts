import { ICandidateSignup } from '../../domain/candidate/signup.domain';
import { IAuthToken } from '../../domain/auth/auth.token.domain';
import { IAuthUser } from '../../domain/auth/auth.user.domain';
import { IApiRequest } from '../common/common.api';

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateSignupApiRequest:
 *       type: object
 *       description: API request for candidate signup
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/ICandidateSignup'
 */
export interface ICandidateSignupApiRequest
  extends IApiRequest<ICandidateSignup> {
  data: ICandidateSignup;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateSignupApiResponse:
 *       type: object
 *       description: API response for candidate signup
 *       properties:
 *         message:
 *           type: string
 *           description: Success message
 *         user:
 *           $ref: '#/components/schemas/IAuthUser'
 *         token:
 *           $ref: '#/components/schemas/IAuthToken'
 */
export interface ICandidateSignupApiResponse {
  message: string;
  user: IAuthUser;
  token: IAuthToken;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateInviteSignupApiRequest:
 *       type: object
 *       description: API request for candidate invite-based signup
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/ICandidateSignup'
 *         inviteId:
 *           type: string
 *           format: uuid
 *           description: Invite ID for invite-based signup
 */
export interface ICandidateInviteSignupApiRequest {
  data: ICandidateSignup;
  inviteId: string;
}
