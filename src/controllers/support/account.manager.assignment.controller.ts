import { Request, Response, NextFunction } from 'express';
import { singleton } from '@/shared/decorators/singleton';
import { AccountManagerAssignmentService } from '@/services/support/account.manager.assignment.service';
import { IClientAccountManagerAssignment } from '@/shared/models/domain/support/account.manager.assignment.domain';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import {
  IAccountManagerOverrideApiRequestWrapper,
  IAccountManagerOverrideApiResponse,
  IAccountManagerWrapper,
  IAssignAccountManagerToRecruiterApiRequestWrapper,
  IGetSupportAccountManagerByClientIdApiRequestWrapper,
  IGetSupportAccountManagerByClientIdApiResponse,
} from '@/shared/models/api/support/account.manager.assignment.api';

@singleton
export class AccountManagerAssignmentController extends BaseController {
  constructor(
    private readonly assignmentService = new AccountManagerAssignmentService()
  ) {
    super();
  }

  /**
   * Override the account manager for a client
   * @route POST /support/account-manager-override
   */
  changeAccountManager = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IAccountManagerOverrideApiResponse>(
      req,
      res,
      next,
      async () => {
        const apiRequest =
          createIApiRequest<IAccountManagerOverrideApiRequestWrapper>(req);
        const { clientId, accountManagerId, changeReason } = apiRequest.data;
        const changedBy = req.user?.id as string; // Get user ID from request
        const assignment: IClientAccountManagerAssignment =
          await this.assignmentService.changeAccountManager(
            clientId,
            accountManagerId,
            changedBy,
            changeReason || 'Account manager reassignment'
          );
        return {
          message: 'Account manager overridden successfully.',
          assignment: {
            id: assignment.id,
            clientId: assignment.clientId,
            accountManagerId: assignment.accountManagerId,
            assignedAt: assignment.assignedAt.toISOString(),
          },
        };
      }
    );
  };

  getAllAccountManagers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IAccountManagerWrapper>(req, res, next, async () => {
      return await this.assignmentService.getAllAccountManagers();
    });
  };

  getManagerDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IAccountManagerWrapper>(req, res, next, async () => {
      const supportUserId = req.user.supportUserId;

      if (!supportUserId) {
        throw new Error('Support user not found');
      }

      return await this.assignmentService.getManagerDetails(supportUserId);
    });
  };

  getAccountManagerByClientId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IGetSupportAccountManagerByClientIdApiResponse>(
      req,
      res,
      next,
      async () => {
        const apiRequest =
          createIApiRequest<IGetSupportAccountManagerByClientIdApiRequestWrapper>(
            req
          );
        const { clientId } = apiRequest.params;
        const user =
          await this.assignmentService.getAccountManagerByClientId(clientId);
        // Map domain to API response
        const response: IGetSupportAccountManagerByClientIdApiResponse = {
          id: user.id,
          name: user.name,
          email: user.email,
          type: user.type,
          role: user.role,
          status: user.status,
          jobTitle: user.jobTitle,
          image: user.image,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        };
        return response;
      }
    );
  };

  assignAccountManagerToRecruiter = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IAccountManagerWrapper>(req, res, next, async () => {
      const apiRequest =
        createIApiRequest<IAssignAccountManagerToRecruiterApiRequestWrapper>(
          req
        );

      const { recruiterId, accountManagerId } = apiRequest.data;
      const recruiter =
        await this.assignmentService.assignAccountManagerToRecruiter(
          recruiterId,
          accountManagerId
        );

      return {
        message: 'Account manager assigned to recruiter successfully.',
        recruiter: recruiter,
      };
    });
  };

  /**
   * Change/reassign the account manager for a recruiter
   * @route PUT /support/account-manager-assignment/recruiter/change
   */
  changeAccountManagerForRecruiter = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IAccountManagerWrapper>(req, res, next, async () => {
      const apiRequest =
        createIApiRequest<IAssignAccountManagerToRecruiterApiRequestWrapper>(
          req
        );

      const { recruiterId, accountManagerId } = apiRequest.data;
      const changedBy = req.user?.id as string;
      const changeReason = 'Account manager reassignment by support admin';

      const recruiter =
        await this.assignmentService.changeAccountManagerForRecruiter(
          recruiterId,
          accountManagerId,
          changedBy,
          changeReason
        );

      return {
        message: 'Account manager changed for recruiter successfully.',
        recruiter: recruiter,
      };
    });
  };

  /**
   * Get account manager assigned to a recruiter
   * @route GET /support/account-manager-assignment/recruiter/:recruiterId
   */
  getAccountManagerByRecruiterId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IGetSupportAccountManagerByClientIdApiResponse>(
      req,
      res,
      next,
      async () => {
        const { recruiterId } = req.params;
        const accountManager =
          await this.assignmentService.getAccountManagerByRecruiterId(
            recruiterId
          );

        const response: IGetSupportAccountManagerByClientIdApiResponse = {
          id: accountManager.id,
          name: accountManager.name,
          email: accountManager.email,
          type: accountManager.type,
          role: accountManager.role,
          status: accountManager.status,
          jobTitle: accountManager.jobTitle,
          image: accountManager.image,
          createdAt: accountManager.createdAt.toISOString(),
          updatedAt: accountManager.updatedAt.toISOString(),
        };

        return response;
      }
    );
  };

  /**
   * Toggle account manager availability status
   * @route PUT /support/account-manager/availability
   */
  toggleAccountManagerAvailability = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<{
      success: boolean;
      message: string;
      isAvailable: boolean;
    }>(req, res, next, async () => {
      const accountManagerUserId = req.user?.id;
      const { isAvailable } = req.body;

      if (!accountManagerUserId) {
        throw new Error('User ID is required');
      }

      if (typeof isAvailable !== 'boolean') {
        throw new Error('isAvailable must be a boolean value');
      }

      const result =
        await this.assignmentService.toggleAccountManagerAvailability(
          accountManagerUserId,
          isAvailable
        );

      return result;
    });
  };

  /**
   * Get account manager availability status
   * @route GET /support/account-manager/availability
   */
  getAccountManagerAvailabilityStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<{ isAvailable: boolean; name: string }>(
      req,
      res,
      next,
      async () => {
        const accountManagerUserId = req.user?.id;

        if (!accountManagerUserId) {
          throw new Error('User ID is required');
        }

        const result =
          await this.assignmentService.getAccountManagerAvailabilityStatus(
            accountManagerUserId
          );

        return result;
      }
    );
  };
}
