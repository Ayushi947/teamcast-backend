import { Request, Response, NextFunction } from 'express';
import { PlatformUserService } from '@/services/support/platform.user.service';
import { BaseController } from '@/controllers/common/base.controller';
import { singleton } from '@/shared/decorators/singleton';

@singleton
export class PlatformUserController extends BaseController {
  constructor(private readonly platformUserService: PlatformUserService) {
    super();
  }

  /**
   * Delete a platform user by ID (support admin only).
   */
  deleteUserById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<{ message: string }>(req, res, next, async () => {
      const requestingUserId = req.user!.id;
      const userId = req.params.userId as string;
      await this.platformUserService.deleteUserById(requestingUserId, userId);
      return { message: 'User deleted successfully' };
    });
  };

  /**
   * Delete a platform user by email (support admin only).
   */
  deleteUserByEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<{ message: string }>(req, res, next, async () => {
      const requestingUserId = req.user!.id;
      const email = (req.query.email as string)?.trim();
      await this.platformUserService.deleteUserByEmail(requestingUserId, email);
      return { message: 'User deleted successfully' };
    });
  };
}
