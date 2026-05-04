import { Request, Response, NextFunction } from 'express';
import { PrismaClient, user_type } from '@prisma/client';
import { logger } from '@/shared/utils/logger';

const prisma = new PrismaClient();

/**
 * Routes that are allowed even when profile setup is not complete
 * These are basic profile operations that are part of the setup process
 */
const ALLOWED_DURING_SETUP_ROUTES = [
  '/api/client/profile', // Main profile GET route
  '/api/client/profile/basic', // Basic profile GET and PATCH
  '/api/client/profile/photo', // Profile photo upload
  '/api/client/profile-setup', // Profile setup routes
];

/**
 * Check if the current request path is allowed during profile setup
 */
const isAllowedDuringSetup = (path: string): boolean => {
  return ALLOWED_DURING_SETUP_ROUTES.some((allowedPath) =>
    path.startsWith(allowedPath)
  );
};

/**
 * Middleware to check if user profile setup is required
 * Only applies to CLIENT and PARTNER admin users
 * Candidates and other user types are not required to complete profile setup
 * Certain profile operations are allowed even during setup
 */
export const requireProfileSetup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      return next();
    }

    // Only check profile setup for CLIENT and PARTNER admin users
    const shouldCheckProfileSetup =
      (user.type === user_type.CLIENT || user.type === user_type.PARTNER) &&
      user.role === 'ADMIN';

    logger.info('Profile setup check decision', {
      userId: user.id,
      userType: user.type,
      userRole: user.role,
      shouldCheckProfileSetup,
      path: req.originalUrl,
      context: 'profile.setup.middleware.requireProfileSetup',
    });

    if (!shouldCheckProfileSetup) {
      return next();
    }

    // Check if the current route is allowed during profile setup
    if (isAllowedDuringSetup(req.originalUrl)) {
      logger.info('Route allowed during profile setup', {
        userId: user.id,
        path: req.originalUrl,
        context: 'profile.setup.middleware.requireProfileSetup',
      });
      return next();
    }

    logger.info('Route requires profile setup check', {
      userId: user.id,
      path: req.originalUrl,
      context: 'profile.setup.middleware.requireProfileSetup',
    });

    // Check if profile setup is completed
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { profileSetup: true },
    });

    logger.info('Profile setup status check', {
      userId: user.id,
      profileSetup: userRecord?.profileSetup,
      path: req.originalUrl,
      context: 'profile.setup.middleware.requireProfileSetup',
    });

    if (userRecord?.profileSetup === false) {
      logger.warn('User needs to complete profile setup', {
        userId: user.id,
        userType: user.type,
        path: req.originalUrl,
        context: 'profile.setup.middleware.requireProfileSetup',
      });

      res.status(403).json({
        success: false,
        message: 'Profile setup required',
        data: {
          requiresProfileSetup: true,
          redirectUrl: '/app/profile-setup', // Unified profile setup page
        },
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Error checking profile setup requirement', {
      error: error instanceof Error ? error.message : 'Unknown error',
      context: 'profile.setup.middleware.requireProfileSetup',
    });

    // Don't block the request on middleware errors
    next();
  }
};

/**
 * Middleware to allow access to profile setup routes
 * This middleware should be used on profile setup routes to bypass the requireProfileSetup check
 */
export const allowProfileSetupRoutes = (
  _req: Request,
  _res: Response,
  next: NextFunction
): void => {
  // This middleware simply passes through to allow profile setup routes
  // It's used as a marker to indicate that these routes should not be blocked
  // by the requireProfileSetup middleware
  next();
};
