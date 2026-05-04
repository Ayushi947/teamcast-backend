import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';
import { ENV } from '@/config/env';
import { UserStatusService } from '@/services/common/user.status.service';
import { IAuthUser } from '@/shared/models/domain/auth/auth.user.domain';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';

// Singleton instance of UserStatusService
const userStatusService = new UserStatusService();

/**
 * Validates if CLIENT or PARTNER user has completed profile setup and has ADMIN role
 */
export const validateClientPartnerAccess = (user: IAuthUser): boolean => {
  if (
    (user.type === UserTypeEnum.CLIENT || user.type === UserTypeEnum.PARTNER) &&
    user.role === UserRoleEnum.ADMIN &&
    !user.profileSetup
  ) {
    return false;
  }
  return true;
};

export const requireAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new AppError('No token provided', 401, ErrorCode.UNAUTHORIZED);
    }

    try {
      const decoded = jwt.verify(token, ENV.JWT_SECRET) as IAuthUser;
      req.user = decoded;

      // Profile setup validation is now handled by requireProfileSetup middleware
      // on specific routes that need it, not in the base auth middleware
      next();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        'Unauthorized - Invalid token',
        401,
        ErrorCode.INVALID_TOKEN
      );
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if the user account is active by querying the database
 * Uses a Redis cache to minimize database hits
 */
export const requireActiveUser = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new AppError('User not authenticated', 401, ErrorCode.UNAUTHORIZED);
    }

    logger.info({
      message: 'Checking if user is active',
      context: 'AuthMiddleware.requireActiveUser',
      userId: req.user.id,
    });

    const isActive = await userStatusService.isUserActive(req.user.id);

    logger.info({
      message: 'User active status',
      context: 'AuthMiddleware.requireActiveUser',
      userId: req.user.id,
      isActive,
    });

    if (!isActive) {
      logger.warn({
        message: 'Inactive user attempted access',
        context: 'AuthMiddleware.requireActiveUser',
        userId: req.user.id,
      });
      throw new AppError(
        'User account is not active',
        403,
        ErrorCode.FORBIDDEN
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const requireUserType = (userTypes: UserTypeEnum[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user?.type || !userTypes.includes(req.user.type)) {
        logger.warn({
          message: 'Insufficient permissions',
          context: 'AuthMiddleware.requireUserType',
          requiredUserTypes: userTypes,
          userType: req.user?.type,
          userId: req.user?.id,
        });
        throw new AppError(
          'Forbidden - Insufficient permissions',
          403,
          ErrorCode.FORBIDDEN
        );
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireRole = (roles: UserRoleEnum[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user?.role || !roles.includes(req.user.role)) {
        logger.warn({
          message: 'Insufficient permissions',
          context: 'AuthMiddleware.requireRole',
          requiredRoles: roles,
          userRole: req.user?.role,
          userId: req.user?.id,
        });
        throw new AppError(
          'Forbidden - Insufficient permissions',
          403,
          ErrorCode.FORBIDDEN
        );
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware that checks if the authenticated user is either:
 * 1. The same user as the clientUserId in the URL params
 * 2. A client admin from the same client
 *
 * This enables both users to edit their own profile and admins to edit
 * profiles of users within their client organization.
 */
export const requireSameUserOrAdminForClient = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    // Get the clientUserId from URL params
    const { clientUserId } = req.params;
    // If no clientUserId in params, use the authenticated user's ID
    const targetClientUserId = clientUserId;

    // If no clientUserId in params, use the authenticated user's ID
    if (!targetClientUserId) {
      req.params.clientUserId = req.user.id;
      return next();
    }

    // Case 1: The user is operating on their own profile
    if (req.user.clientUserId === targetClientUserId) {
      return next();
    }

    // Case 2: The user is a client admin
    if (req.user.role === UserRoleEnum.ADMIN) {
      return next();
    }

    // If neither condition is met, the user doesn't have permission
    logger.warn({
      message:
        "User attempting to access another user's profile without admin privileges",
      context: 'AuthMiddleware.requireSameUserOrAdmin',
      requestingUserId: req.user.id,
      targetClientUserId,
    });

    throw new AppError(
      "Forbidden - You don't have permission to access this profile",
      403,
      ErrorCode.FORBIDDEN
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware that checks if the authenticated user is either:
 * 1. The same user as the partnerUserId in the URL params
 * 2. A partner admin from the same partner
 *
 * This enables both users to edit their own profile and admins to edit
 * profiles of users within their partner organization.
 */
export const requireSameUserOrAdminForPartner = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    // Get the partnerUserId from URL params
    const { partnerUserId } = req.params;
    // If no partnerUserId in params, use the authenticated user's ID
    const targetPartnerUserId = partnerUserId;

    // If no partnerUserId in params, use the authenticated user's ID
    if (!targetPartnerUserId) {
      req.params.partnerUserId = req.user.partnerUserId || '';
      return next();
    }

    // Case 1: The user is operating on their own profile
    if (req.user.partnerUserId === targetPartnerUserId) {
      return next();
    }

    // Case 2: The user is a partner admin
    if (req.user.role === UserRoleEnum.ADMIN) {
      return next();
    }

    // If neither condition is met, the user doesn't have permission
    logger.warn({
      message:
        "User attempting to access another user's profile without admin privileges",
      context: 'AuthMiddleware.requireSameUserOrAdminForPartner',
      requestingUserId: req.user.id,
      targetPartnerUserId,
    });

    throw new AppError(
      "Forbidden - You don't have permission to access this profile",
      403,
      ErrorCode.FORBIDDEN
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check for candidate access
 * Allows access if user is:
 * 1. CANDIDATE user type, OR
 * 2. PARTNER user type with PARTNER_RESOURCE or INDIVIDUAL role
 */
export const requireCandidateAccess = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401, ErrorCode.UNAUTHORIZED);
    }

    // Allow access if user is:
    // 1. CANDIDATE user type, OR
    // 2. PARTNER user type with PARTNER_RESOURCE or INDIVIDUAL role
    const isCandidate = req.user.type === UserTypeEnum.CANDIDATE;
    const isClient = req.user.type === UserTypeEnum.CLIENT;

    const isPartnerResource =
      req.user.type === UserTypeEnum.PARTNER &&
      (req.user.role === UserRoleEnum.PARTNER_RESOURCE ||
        req.user.role === UserRoleEnum.INDIVIDUAL);
    const isSupport = req.user.type === UserTypeEnum.SUPPORT;
    const isAdmin = req.user.role === UserRoleEnum.ADMIN;

    if (isCandidate || isClient || isPartnerResource || isSupport || isAdmin) {
      return next();
    }

    logger.warn({
      message: 'Insufficient permissions for candidate access',
      context: 'AuthMiddleware.requireCandidateAccess',
      userType: req.user.type,
      userRole: req.user.role,
      userId: req.user.id,
    });

    throw new AppError(
      'Access denied. This resource is only available to candidates.',
      403,
      ErrorCode.FORBIDDEN
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check for candidate or client access
 * Allows access if user is:
 * 1. CANDIDATE user type, OR
 * 2. CLIENT user type, OR
 * 3. PARTNER user type with PARTNER_RESOURCE or INDIVIDUAL role
 */
export const requireCandidateOrClientAccess = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401, ErrorCode.UNAUTHORIZED);
    }

    // Allow access if user is:
    // 1. CANDIDATE user type, OR
    // 2. CLIENT user type, OR
    // 3. PARTNER user type with PARTNER_RESOURCE or INDIVIDUAL role
    const isCandidate = req.user.type === UserTypeEnum.CANDIDATE;
    const isClient = req.user.type === UserTypeEnum.CLIENT;
    const isPartnerResource =
      req.user.type === UserTypeEnum.PARTNER &&
      (req.user.role === UserRoleEnum.PARTNER_RESOURCE ||
        req.user.role === UserRoleEnum.INDIVIDUAL);

    if (isCandidate || isClient || isPartnerResource) {
      return next();
    }

    logger.warn({
      message: 'Insufficient permissions for candidate or client access',
      context: 'AuthMiddleware.requireCandidateOrClientAccess',
      userType: req.user.type,
      userRole: req.user.role,
      userId: req.user.id,
    });

    throw new AppError(
      'Access denied. This resource is only available to candidates or clients.',
      403,
      ErrorCode.FORBIDDEN
    );
  } catch (error) {
    next(error);
  }
};
