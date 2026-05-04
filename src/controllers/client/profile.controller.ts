import { Request, Response, NextFunction } from 'express';
import { ClientProfileService } from '@/services/client/profile.service';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import {
  IClientProfileGetApiResponse,
  IClientProfileBasicGetApiResponse,
  IClientProfileBasicUpdateApiRequest,
  IClientProfileBasicUpdateApiResponse,
  IClientProfileAddressGetApiResponse,
  IClientProfileAddressUpdateApiRequest,
  IClientProfileAddressUpdateApiResponse,
  IClientProfileShippingAddressGetApiResponse,
  IClientProfileShippingAddressUpdateApiRequest,
  IClientProfileShippingAddressUpdateApiResponse,
  IClientProfileBillingAddressGetApiResponse,
  IClientProfileBillingAddressUpdateApiRequest,
  IClientProfileBillingAddressUpdateApiResponse,
  IClientProfileSocialGetApiResponse,
  IClientProfileSocialUpdateApiRequest,
  IClientProfileSocialUpdateApiResponse,
  IClientProfileCultureGetApiResponse,
  IClientProfileCultureUpdateApiRequest,
  IClientProfileCultureUpdateApiResponse,
  IClientProfileAiAssessmentSettingsGetApiResponse,
  IClientProfileAiAssessmentSettingsUpdateApiRequest,
  IClientProfileAiAssessmentSettingsUpdateApiResponse,
  IClientDocumentListApiResponse,
  IClientDocumentCreateApiResponse,
  IClientDocumentCreateApiRequest,
  IClientDocumentUpdateApiResponse,
  IClientDocumentUpdateApiRequest,
  IClientDocumentDeleteApiResponse,
  IClientProfileFinancialDataGetApiResponse,
  IClientProfileFinancialDataCreateApiRequest,
  IClientProfileFinancialDataCreateApiResponse,
  IClientProfileFinancialDataUpdateApiRequest,
  IClientProfileFinancialDataUpdateApiResponse,
  IClientBankAccountCreateApiRequest,
  IClientBankAccountCreateApiResponse,
  IClientBankAccountUpdateApiRequest,
  IClientBankAccountUpdateApiResponse,
  IClientBankAccountDeleteApiResponse,
  IClientBankAccountListApiResponse,
  IClientBankAccountGetApiResponse,
  IClientProfilePhotoDeleteApiResponse,
} from '@/shared/models/api/client/profile.api';
import {
  IClientProfileSettingsUpdateApiRequest,
  IClientProfileSettingsUpdateApiResponse,
  IClientProfileSettingsGetApiResponse,
} from '@/shared/models/api/client/profile.settings.api';

export class ClientProfileController extends BaseController {
  constructor(private readonly clientProfileService: ClientProfileService) {
    super();
  }

  /**
   * Get the complete client profile
   */
  getProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientProfileGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        return await this.clientProfileService.getProfile(clientId);
      }
    );
  };

  /**
   * Get basic client profile
   */
  getBasicProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientProfileBasicGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        return await this.clientProfileService.getBasicProfile(clientId);
      }
    );
  };

  /**
   * Update basic client profile
   */
  updateBasicProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientProfileBasicUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const { data } =
          createIApiRequest<IClientProfileBasicUpdateApiRequest>(req);
        return await this.clientProfileService.updateBasicProfile(
          clientId,
          data
        );
      }
    );
  };

  /**
   * Get client address
   */
  getAddress = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientProfileAddressGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        return await this.clientProfileService.getAddress(clientId);
      }
    );
  };

  /**
   * Update client address
   */
  updateAddress = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientProfileAddressUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const { data } =
          createIApiRequest<IClientProfileAddressUpdateApiRequest>(req);
        return await this.clientProfileService.updateAddress(clientId, data);
      }
    );
  };

  /**
   * Get client shipping address
   */
  getShippingAddress = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientProfileShippingAddressGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        return await this.clientProfileService.getShippingAddress(clientId);
      }
    );
  };

  /**
   * Update client shipping address
   */
  updateShippingAddress = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientProfileShippingAddressUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const { data } =
          createIApiRequest<IClientProfileShippingAddressUpdateApiRequest>(req);
        return await this.clientProfileService.updateShippingAddress(
          clientId,
          data
        );
      }
    );
  };

  /**
   * Get client billing address
   */
  getBillingAddress = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientProfileBillingAddressGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        return await this.clientProfileService.getBillingAddress(clientId);
      }
    );
  };

  /**
   * Update client billing address
   */
  updateBillingAddress = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientProfileBillingAddressUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const { data } =
          createIApiRequest<IClientProfileBillingAddressUpdateApiRequest>(req);
        return await this.clientProfileService.updateBillingAddress(
          clientId,
          data
        );
      }
    );
  };

  /**
   * Get client social profile
   */
  getSocialProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientProfileSocialGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        return await this.clientProfileService.getSocialProfile(clientId);
      }
    );
  };

  /**
   * Update client social profile
   */
  updateSocialProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientProfileSocialUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const { data } =
          createIApiRequest<IClientProfileSocialUpdateApiRequest>(req);
        return await this.clientProfileService.updateSocialProfile(
          clientId,
          data
        );
      }
    );
  };

  /**
   * Get client culture profile
   */
  getCultureProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientProfileCultureGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        return await this.clientProfileService.getCultureProfile(clientId);
      }
    );
  };

  /**
   * Update client culture profile
   */
  updateCultureProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientProfileCultureUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const { data } =
          createIApiRequest<IClientProfileCultureUpdateApiRequest>(req);
        return await this.clientProfileService.updateCultureProfile(
          clientId,
          data
        );
      }
    );
  };

  /**
   * Get client settings
   */
  getSettings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientProfileSettingsGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        return await this.clientProfileService.getClientSettings(clientId);
      }
    );
  };

  /**
   * Update client settings
   */
  updateSettings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientProfileSettingsUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;

        // Extract update data from request
        const updateRequest =
          createIApiRequest<IClientProfileSettingsUpdateApiRequest>(req);

        // Call service method with domain model
        return await this.clientProfileService.updateClientSettings(
          clientId,
          updateRequest.data
        );
      }
    );
  };

  /**
   * Get client AI assessment settings
   */
  getAiAssessmentSettings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientProfileAiAssessmentSettingsGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        return await this.clientProfileService.getClientAiAssessmentSettings(
          clientId
        );
      }
    );
  };

  getJobPostingAiAssessmentSettings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientProfileAiAssessmentSettingsGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const jobPostingId = req.params.jobPostingId as string;
        return await this.clientProfileService.getJobPostingAiAssessmentSettings(
          jobPostingId
        );
      }
    );
  };

  /**
   * Update client AI assessment settings
   */
  updateAiAssessmentSettings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientProfileAiAssessmentSettingsUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const { data } =
          createIApiRequest<IClientProfileAiAssessmentSettingsUpdateApiRequest>(
            req
          );
        return await this.clientProfileService.updateClientAiAssessmentSettings(
          clientId,
          data
        );
      }
    );
  };

  // Financial Data methods
  getFinancialData = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientProfileFinancialDataGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        return await this.clientProfileService.getFinancialData(clientId);
      }
    );
  };

  createFinancialData = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientProfileFinancialDataCreateApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const { data } =
          createIApiRequest<IClientProfileFinancialDataCreateApiRequest>(req);
        return await this.clientProfileService.createFinancialData(
          clientId,
          data
        );
      }
    );
  };

  updateFinancialData = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientProfileFinancialDataUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const { data } =
          createIApiRequest<IClientProfileFinancialDataUpdateApiRequest>(req);
        return await this.clientProfileService.updateFinancialData(
          clientId,
          data
        );
      }
    );
  };

  // Bank Account methods
  getBankAccounts = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientBankAccountListApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        return await this.clientProfileService.getBankAccounts(clientId);
      }
    );
  };

  getBankAccountById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientBankAccountGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const accountId = req.params.accountId as string;
        return await this.clientProfileService.getBankAccountById(
          clientId,
          accountId
        );
      }
    );
  };

  addBankAccount = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientBankAccountCreateApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const { data } =
          createIApiRequest<IClientBankAccountCreateApiRequest>(req);
        return await this.clientProfileService.addBankAccount(clientId, data);
      }
    );
  };

  updateBankAccount = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientBankAccountUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const accountId = req.params.accountId as string;
        const { data } =
          createIApiRequest<IClientBankAccountUpdateApiRequest>(req);
        return await this.clientProfileService.updateBankAccount(
          clientId,
          accountId,
          data
        );
      }
    );
  };

  deleteBankAccount = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientBankAccountDeleteApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const accountId = req.params.accountId as string;
        return await this.clientProfileService.deleteBankAccount(
          clientId,
          accountId
        );
      }
    );
  };

  // Document methods
  getDocuments = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientDocumentListApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        return await this.clientProfileService.getDocuments(clientId);
      }
    );
  };

  createDocument = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientDocumentCreateApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const { data } =
          createIApiRequest<IClientDocumentCreateApiRequest>(req);
        return await this.clientProfileService.createDocument(clientId, data);
      }
    );
  };

  updateDocument = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientDocumentUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const documentId = req.params.documentId as string;
        const { data } =
          createIApiRequest<IClientDocumentUpdateApiRequest>(req);
        return await this.clientProfileService.updateDocument(
          clientId,
          documentId,
          data
        );
      }
    );
  };

  deleteDocument = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientDocumentDeleteApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const documentId = req.params.documentId as string;
        return await this.clientProfileService.deleteDocument(
          clientId,
          documentId
        );
      }
    );
  };

  getDocumentById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientDocumentCreateApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const documentId = req.params.documentId as string;
        return await this.clientProfileService.getDocumentById(
          clientId,
          documentId
        );
      }
    );
  };

  /**
   * Get client profile by ID
   */
  getProfileById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientProfileGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.params.clientId as string;
        return await this.clientProfileService.getProfile(clientId);
      }
    );
  };

  /**
   * Upload profile photo directly
   */
  uploadProfilePhoto = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<{ fileName: string; logoUrl: string }>(
      req,
      res,
      next,
      async () => {
        if (!req.file) {
          throw new AppError(
            'No file uploaded',
            400,
            ErrorCode.INVALID_REQUEST
          );
        }

        const clientId = req.user.clientId as string;
        if (!clientId) {
          throw new AppError(
            'Client ID is required',
            400,
            ErrorCode.CLIENT_USER_ID_REQUIRED
          );
        }
        return await this.clientProfileService.updateProfilePhoto(
          clientId,
          req.file.buffer
        );
      }
    );
  };

  /**
   * Delete (remove) client profile logo
   */
  deleteProfileLogo = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientProfilePhotoDeleteApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        return await this.clientProfileService.deleteProfileLogo(clientId);
      }
    );
  };
}
