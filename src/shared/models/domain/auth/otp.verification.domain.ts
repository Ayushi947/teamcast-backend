import { IAuthUser } from './auth.user.domain';
import { IAuthToken } from './auth.token.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     ISendOtpVerification:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address for OTP verification
 *           example: user@example.com
 */
export interface ISendOtpVerification {
  email: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IVerifyOtp:
 *       type: object
 *       required:
 *         - otp
 *       properties:
 *         otp:
 *           type: string
 *           minLength: 6
 *           maxLength: 6
 *           description: 6-digit OTP code for email verification
 *           example: "123456"
 */
export interface IVerifyOtp {
  otp: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISendOtpVerificationSent:
 *       type: object
 *       required:
 *         - message
 *       properties:
 *         message:
 *           type: string
 *           description: Success message after OTP verification email sent
 *           example: OTP verification email has been sent
 */
export interface ISendOtpVerificationSent {
  message: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IOtpVerified:
 *       type: object
 *       required:
 *         - message
 *         - user
 *         - token
 *       properties:
 *         message:
 *           type: string
 *           description: Success message after OTP verification
 *           example: Email verified successfully
 *         user:
 *           $ref: '#/components/schemas/IAuthUser'
 *           description: Updated user information with emailVerified field
 *         token:
 *           $ref: '#/components/schemas/IAuthToken'
 *           description: New authentication tokens
 */
export interface IOtpVerified {
  message: string;
  user: IAuthUser;
  token: IAuthToken;
}
