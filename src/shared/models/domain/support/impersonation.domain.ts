import { UserTypeEnum } from '../../common/enums';
import { IAuthUser } from '../auth/auth.user.domain';
import { IAuthToken } from '../auth/auth.token.domain';

/**
 * Metadata for impersonation session
 */
export interface IImpersonationSessionMetadata {
  targetUserId: string;
  targetUserType: UserTypeEnum;
  targetUserName: string;
  targetUserEmail: string;
}

/**
 * Metadata for activity log during impersonation
 */
export interface IImpersonationActivityMetadata {
  supportUserId: string;
  impersonationId: string;
  reason?: string;
}

/**
 * Request to start impersonation (like ILogin)
 */
export interface IStartImpersonation {
  targetUserId: string;
  targetUserType: UserTypeEnum;
  reason?: string;
}

/**
 * Response for starting impersonation (like ILoggedIn)
 */
export interface IStartImpersonationResponse {
  token: IAuthToken;
  user: IAuthUser;
  impersonationId: string;
  targetUserImage?: string | null;
  supportUserImage?: string | null;
}

/**
 * Request to stop impersonation
 */
export interface IStopImpersonation {
  impersonationId: string;
}

/**
 * Response for stopping impersonation (like ILoggedIn - returns to support user)
 */
export interface IStopImpersonationResponse {
  token: IAuthToken;
  user: IAuthUser;
}
