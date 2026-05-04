import { PrismaClient } from '@prisma/client';
import { singleton } from '@/shared/decorators/singleton';
import { logger } from '@/shared/utils/logger';
import Redis from 'ioredis';
import { ENV } from '@/config/env';

const prisma = new PrismaClient();

@singleton
export class UserStatusService {
  private redis: Redis | null = null;
  private statusCacheTTL = 3600; // 1 hour in seconds
  private useRedisCache: boolean;

  constructor() {
    this.useRedisCache = ENV.USE_REDIS_CACHE;

    if (this.useRedisCache) {
      try {
        this.redis = new Redis({
          host: ENV.REDIS_HOST,
          port: ENV.REDIS_PORT,
          password: ENV.REDIS_PASSWORD,
          username: ENV.REDIS_USER,
          keyPrefix: `${ENV.ENV_NAME}:user_status:`,
          connectTimeout: 5000,
          retryStrategy: (times: number) => {
            const delay = Math.min(times * 100, 3000);
            return delay;
          },
        });

        this.redis.on('error', (err: Error) => {
          logger.error('Redis error', {
            error: err.message,
            context: 'UserStatusService',
          });
        });

        logger.info('Redis cache initialized for user status', {
          context: 'UserStatusService.constructor',
        });
      } catch (error) {
        logger.error('Failed to initialize Redis', {
          error: error instanceof Error ? error.message : 'Unknown error',
          context: 'UserStatusService.constructor',
        });
        this.redis = null;
      }
    } else {
      logger.info('Redis cache disabled for user status', {
        context: 'UserStatusService.constructor',
      });
    }
  }

  /**
   * Get user status from cache or database
   * @param userId The user ID to check
   * @returns boolean indicating if user is active
   */
  async isUserActive(userId: string): Promise<boolean> {
    try {
      logger.info({
        message: 'Checking if user is active',
        context: 'UserStatusService.isUserActive',
        userId,
        useRedisCache: this.useRedisCache,
      });
      // Try to get from cache first if Redis is enabled
      if (this.useRedisCache && this.redis) {
        logger.info({
          message: 'Checking Redis cache',
          context: 'UserStatusService.isUserActive',
          userId,
        });
        try {
          const cachedStatus = await this.redis.get(userId);

          if (cachedStatus !== null) {
            return cachedStatus === 'ACTIVE';
          }
        } catch (redisError) {
          logger.warn('Redis cache lookup failed', {
            error:
              redisError instanceof Error
                ? redisError.message
                : 'Unknown error',
            userId,
            context: 'UserStatusService.isUserActive',
          });
          // Continue to database lookup if Redis fails
        }
      }

      // Get from database
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { status: true },
      });

      if (!user) {
        return false;
      }

      // Cache the result if Redis is available
      if (this.useRedisCache && this.redis) {
        try {
          await this.redis.set(userId, user.status, 'EX', this.statusCacheTTL);
        } catch (redisError) {
          logger.warn('Failed to cache user status', {
            error:
              redisError instanceof Error
                ? redisError.message
                : 'Unknown error',
            userId,
            context: 'UserStatusService.isUserActive',
          });
          // Continue even if caching fails
        }
      }

      return user.status === 'ACTIVE';
    } catch (error) {
      logger.error('Error checking user status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        context: 'UserStatusService.isUserActive',
      });

      // In case of error, assume the user is active to avoid blocking valid requests
      // This is a fallback strategy - modify based on your security requirements
      return true;
    }
  }

  /**
   * Update the cached status when a user's status changes
   * @param userId The user ID
   * @param status New status
   */
  async updateUserStatus(userId: string, status: string): Promise<void> {
    if (!this.useRedisCache || !this.redis) return;

    try {
      logger.info({
        message: 'Updating user status in cache',
        context: 'UserStatusService.updateUserStatus',
        userId,
        status,
      });
      await this.redis.set(userId, status, 'EX', this.statusCacheTTL);
    } catch (error) {
      logger.error('Failed to update user status in cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        status,
        context: 'UserStatusService.updateUserStatus',
      });
    }
  }

  /**
   * Invalidate the cached status for a user
   * @param userId The user ID
   */
  async invalidateCache(userId: string): Promise<void> {
    if (!this.useRedisCache || !this.redis) return;

    try {
      await this.redis.del(userId);
    } catch (error) {
      logger.error('Failed to invalidate user status cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        context: 'UserStatusService.invalidateCache',
      });
    }
  }
}
