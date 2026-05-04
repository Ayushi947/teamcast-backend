import { IAuthToken } from '../../domain/auth/auth.token.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     IRefreshToken:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           description: The refresh token used to obtain a new access token
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *
 */

export interface IRefreshToken {
  refreshToken: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IRefreshedToken:
 *       type: object
 *       required:
 *         - token
 *       properties:
 *         token:
 *           $ref: '#/components/schemas/IAuthToken'
 */

export interface IRefreshedToken {
  token: IAuthToken;
}
