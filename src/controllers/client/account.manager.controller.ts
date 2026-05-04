import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../common/base.controller';
import { ClientAccountManagerService } from '@/services/client/account.manager.service';
import { createIApiRequest } from '@/utils/api.request';
import {
  IGetAccountManagerByClientIdApiRequestWrapper,
  IGetAccountManagerByClientIdApiResponse,
} from '@/shared/models/api/client/account.manager.api';

export class ClientAccountManagerController extends BaseController {
  constructor(private readonly service = new ClientAccountManagerService()) {
    super();
  }

  getAccountManagerByClientId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IGetAccountManagerByClientIdApiResponse>(
      req,
      res,
      next,
      async () => {
        const apiRequest =
          createIApiRequest<IGetAccountManagerByClientIdApiRequestWrapper>(req);
        const { clientId } = apiRequest.params;
        const user = await this.service.getAccountManagerByClientId(clientId);
        if (!user) {
          throw new Error('No account manager assigned for this client.');
        }
        // Map domain to API response
        const response: IGetAccountManagerByClientIdApiResponse = {
          id: user.id,
          name: user.name,
          email: user.email,
          type: user.type,
          role: user.role,
          status: user.status,
          jobTitle: user.jobTitle,
          image: user.image,
          createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: user.updatedAt?.toISOString() || new Date().toISOString(),
          assignedAt:
            user.assignedAt?.toISOString() || new Date().toISOString(),
        };
        return response;
      }
    );
  };
}
