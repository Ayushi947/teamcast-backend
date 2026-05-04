/**
 * @openapi
 * components:
 *   schemas:
 *     ISendResetPasswordToken:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 */
export interface ISendResetPasswordToken {
  email: string;
}
/**
 * @openapi
 * components:
 *   schemas:
 *     ISendResetPasswordTokenDone:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message after password reset request
 *           example: Password reset email has been sent
 */
export interface ISendResetPasswordTokenDone {
  message: string;
}

/**
 * @openapi
 * components:
 *   parameters:
 *     IResetPasswordTokenParams:
 *       name: token
 *       in: path
 *       required: true
 *       schema:
 *         type: string
 *         description: Reset password token received via email
 */
export interface IResetPasswordTokenParams {
  token: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IResetPassword:
 *       type: object
 *       properties:
 *         password:
 *           type: string
 *           description: New password
 */
export interface IResetPassword {
  password: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IResetPasswordDone:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message after password reset token request
 */
export interface IResetPasswordDone {
  message: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISetNewPassword:
 *       type: object
 *       properties:
 *         password:
 *           type: string
 *           description: New password
 */
export interface ISetNewPassword {
  password: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISetNewPasswordDone:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message after new password set
 */
export interface ISetNewPasswordDone {
  message: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISetPasswordByEmail:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *         password:
 *           type: string
 *           description: New password
 */
export interface ISetPasswordByEmail {
  email: string;
  password: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISetPasswordByEmailDone:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message after password set
 */
export interface ISetPasswordByEmailDone {
  message: string;
}
