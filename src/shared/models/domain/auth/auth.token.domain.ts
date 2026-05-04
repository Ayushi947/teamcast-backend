/**
 * @openapi
 * components:
 *   schemas:
 *     IAuthToken:
 *       type: object
 *       properties:
 *         accessToken:
 *           type: string
 *           description: The access token
 *         refreshToken:
 *           type: string
 *           description: The refresh token
 *         expiresIn:
 *           type: number
 *           description: The expiration time of the access token
 *         tokenType:
 *           type: string
 *           description: The type of token
 */
export interface IAuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}
