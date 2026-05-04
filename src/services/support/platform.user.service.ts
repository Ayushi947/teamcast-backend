import { PrismaClient } from '@prisma/client';
import { singleton } from '@/shared/decorators/singleton';
import { UserTypeEnum } from '@/shared/models/common/enums';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';

@singleton
export class PlatformUserService {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async deleteUserById(
    requestingUserId: string,
    targetUserId: string
  ): Promise<void> {
    if (requestingUserId === targetUserId) {
      throw new AppError(
        'You cannot delete your own account',
        403,
        ErrorCode.FORBIDDEN
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new AppError('User not found', 404, ErrorCode.NOT_FOUND);
    }

    if (user.type === UserTypeEnum.SUPPORT) {
      throw new AppError(
        'Support users must be deleted via Support User Management (/support/users/:supportUserId)',
        403,
        ErrorCode.FORBIDDEN
      );
    }

    await this.performDelete(targetUserId, 'id', targetUserId);
  }

  async deleteUserByEmail(
    requestingUserId: string,
    email: string
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      throw new AppError('User not found', 404, ErrorCode.NOT_FOUND);
    }

    if (requestingUserId === user.id) {
      throw new AppError(
        'You cannot delete your own account',
        403,
        ErrorCode.FORBIDDEN
      );
    }

    if (user.type === UserTypeEnum.SUPPORT) {
      throw new AppError(
        'Support users must be deleted via Support User Management (/support/users/:supportUserId)',
        403,
        ErrorCode.FORBIDDEN
      );
    }

    await this.performDelete(user.id, 'email', email);
  }

  private async performDelete(
    userId: string,
    by: 'id' | 'email',
    value: string
  ): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { id: userId },
      });
      logger.info({
        message: 'Platform user deleted by support admin',
        context: 'PlatformUserService.performDelete',
        userId,
        deletedBy: by,
        value,
      });
    } catch (error: unknown) {
      const prismaError = error as {
        code?: string;
        meta?: { constraint?: string };
      };
      if (prismaError.code === 'P2003') {
        throw new AppError(
          `User cannot be deleted because they have related data (foreign key constraint${prismaError.meta?.constraint ? `: ${prismaError.meta.constraint}` : ''}). Ensure schema has onDelete Cascade/SetNull on all relations to user.`,
          409,
          ErrorCode.CONFLICT
        );
      }
      logger.error({
        message: 'Failed to delete platform user',
        context: 'PlatformUserService.performDelete',
        error: error instanceof Error ? error.message : 'Unknown',
        userId,
        by,
        value,
      });
      throw error;
    }
  }
}
