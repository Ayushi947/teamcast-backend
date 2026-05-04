export type ILogout = void;

/**
 * @openapi
 * components:
 *   schemas:
 *     ILoggedOut:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message after logout
 *           example: Successfully logged out
 *         logoutUrl:
 *           type: string
 *           description: URL to complete logout
 *           example: https://example.com/app/auth/logout
 */

export type ILoggedOut = {
  message: string;
  logoutUrl?: string;
};
