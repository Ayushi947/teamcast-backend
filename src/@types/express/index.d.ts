import { _Request } from 'express';
import { IAuthUser } from '../../shared/models/domain/auth/auth.user.domain';
declare global {
  namespace Express {
    interface Request {
      user: IAuthUser;
      requestId: string;
    }
  }
}
