import { ApiService } from '../core/api.service';
import { ILoggedIn, ILogin } from '../../models/domain/auth/login.domain';
import { IMeResponse } from '../../models/api/auth/me.api';
import { ILoggedOut } from '../../models/domain/auth/logout.domain';
import {
  ISendOtpVerificationSent,
  IOtpVerified,
} from '../../models/domain/auth/otp.verification.domain';
import {
  IResetPasswordDone,
  ISendResetPasswordTokenDone,
  ISetNewPasswordDone,
  ISetPasswordByEmailDone,
} from '../../models/domain/auth/reset.password.domain';
import {
  IRefreshedToken,
  IRefreshToken,
} from '../../models/domain/auth/refresh.token.domain';
import { singleton } from '../../decorators/singleton';

/**
 * API endpoints for authentication related operations
 */
const AUTH_ENDPOINTS = {
  BASE: '/auth',
  LOGIN: '/login',
  LOGOUT: '/logout',
  ME: '/me',
  SEND_OTP_VERIFICATION: '/send-otp-verification',
  VERIFY_OTP: '/verify-otp',
  SEND_RESET_PASSWORD_TOKEN: '/send-reset-password-token',
  RESET_PASSWORD: '/reset-password',
  SET_NEW_PASSWORD: '/set-new-password',
  SET_PASSWORD_BY_EMAIL: '/set-password-by-email',
  REFRESH: '/refresh',
} as const;

/**
 * Service for handling authentication related API operations
 */
@singleton
export class AuthApiService extends ApiService {
  /**
   * Login with email and password
   * @param credentials - The login credentials
   * @returns Promise resolving to the login response
   * @throws Error if the API request fails
   */
  public async login(credentials: ILogin): Promise<ILoggedIn> {
    try {
      return await this.apiPost<ILoggedIn>(
        `${AUTH_ENDPOINTS.BASE}${AUTH_ENDPOINTS.LOGIN}`,
        credentials
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Logout current user
   * @returns Promise resolving to the logout response
   * @throws Error if the API request fails
   */
  public async logout(): Promise<ILoggedOut> {
    try {
      return await this.apiPost<ILoggedOut>(
        `${AUTH_ENDPOINTS.BASE}${AUTH_ENDPOINTS.LOGOUT}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get current user information
   * @returns Promise resolving to the current user information
   * @throws Error if the API request fails
   */
  public async getCurrentUser(): Promise<IMeResponse> {
    try {
      return await this.apiGet<IMeResponse>(
        `${AUTH_ENDPOINTS.BASE}${AUTH_ENDPOINTS.ME}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Send OTP for email verification
   * @param email - The email address to send OTP to
   * @returns Promise resolving to the OTP verification sent response
   * @throws Error if the API request fails
   */
  public async sendOtpVerification(
    email: string
  ): Promise<ISendOtpVerificationSent> {
    try {
      return await this.apiPost<ISendOtpVerificationSent>(
        `${AUTH_ENDPOINTS.BASE}${AUTH_ENDPOINTS.SEND_OTP_VERIFICATION}`,
        { email }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Verify OTP for email verification
   * @param otp - The OTP code to verify
   * @returns Promise resolving to the OTP verification response
   * @throws Error if the API request fails
   */
  public async verifyOtp(otp: string): Promise<IOtpVerified> {
    try {
      return await this.apiPost<IOtpVerified>(
        `${AUTH_ENDPOINTS.BASE}${AUTH_ENDPOINTS.VERIFY_OTP}`,
        { otp }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Send reset password token
   * @param email - The email address to send reset token to
   * @returns Promise resolving to the reset password token sent response
   * @throws Error if the API request fails
   */
  public async sendResetPasswordToken(
    email: string
  ): Promise<ISendResetPasswordTokenDone> {
    try {
      return await this.apiPost<ISendResetPasswordTokenDone>(
        `${AUTH_ENDPOINTS.BASE}${AUTH_ENDPOINTS.SEND_RESET_PASSWORD_TOKEN}`,
        { email }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Reset password using token
   * @param token - The reset password token
   * @param password - The new password
   * @returns Promise resolving to the password reset response
   * @throws Error if the API request fails
   */
  public async resetPassword(
    token: string,
    password: string
  ): Promise<IResetPasswordDone> {
    try {
      return await this.apiPost<IResetPasswordDone>(
        `${AUTH_ENDPOINTS.BASE}${AUTH_ENDPOINTS.RESET_PASSWORD}/${token}`,
        { password }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Set new password
   * @param password - The new password
   * @returns Promise resolving to the new password set response
   * @throws Error if the API request fails
   */
  public async setNewPassword(password: string): Promise<ISetNewPasswordDone> {
    try {
      return await this.apiPost<ISetNewPasswordDone>(
        `${AUTH_ENDPOINTS.BASE}${AUTH_ENDPOINTS.SET_NEW_PASSWORD}`,
        { password }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Set password by email (public endpoint, no authentication required)
   * Used for practice assessment users who are not yet authenticated
   * @param email - The user's email address
   * @param password - The new password
   * @returns Promise resolving to the password set response
   * @throws Error if the API request fails
   */
  public async setPasswordByEmail(
    email: string,
    password: string
  ): Promise<ISetPasswordByEmailDone> {
    try {
      return await this.apiPost<ISetPasswordByEmailDone>(
        `${AUTH_ENDPOINTS.BASE}${AUTH_ENDPOINTS.SET_PASSWORD_BY_EMAIL}`,
        { email, password }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Refresh access token
   * @param refreshToken - The refresh token data
   * @returns Promise resolving to the refreshed token response
   * @throws Error if the API request fails
   */
  public async refreshAccessToken(
    refreshToken: IRefreshToken
  ): Promise<IRefreshedToken> {
    try {
      return await this.apiPost<IRefreshedToken>(
        `${AUTH_ENDPOINTS.BASE}${AUTH_ENDPOINTS.REFRESH}`,
        refreshToken
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
