import { PartnerProfileService } from '@/services/partner/profile.service';
import { BaseController } from '../common/base.controller';
import { NextFunction, Request, Response } from 'express';
import {
  IPartnerProfileBasicGetApiResponse,
  IPartnerProfileGetApiResponse,
  IPartnerProfileBasicUpdateApiResponse,
  IPartnerProfileBasicUpdateApiRequest,
  IPartnerProfileAddressGetApiResponse,
  IPartnerProfileAddressUpdateApiResponse,
  IPartnerProfileAddressUpdateApiRequest,
  IPartnerProfileShippingAddressGetApiResponse,
  IPartnerProfileShippingAddressUpdateApiRequest,
  IPartnerProfileShippingAddressUpdateApiResponse,
  IPartnerProfileBillingAddressGetApiResponse,
  IPartnerProfileBillingAddressUpdateApiResponse,
  IPartnerProfileBillingAddressUpdateApiRequest,
  IPartnerProfileSocialGetApiResponse,
  IPartnerProfileSocialUpdateApiRequest,
  IPartnerProfileSocialUpdateApiResponse,
  IPartnerProfileCultureGetApiResponse,
  IPartnerProfileCultureUpdateApiResponse,
  IPartnerProfileCultureUpdateApiRequest,
  IPartnerProfileAiAssessmentSettingsGetApiResponse,
  IPartnerProfileAiAssessmentSettingsUpdateApiResponse,
  IPartnerProfileAiAssessmentSettingsUpdateApiRequest,
  IPartnerProfileFinancialDataGetApiResponse,
  IPartnerProfileFinancialDataCreateApiResponse,
  IPartnerProfileFinancialDataCreateApiRequest,
  IPartnerProfileFinancialDataUpdateApiResponse,
  IPartnerProfileFinancialDataUpdateApiRequest,
  IPartnerBankAccountCreateApiResponse,
  IPartnerBankAccountCreateApiRequest,
  IPartnerBankAccountUpdateApiResponse,
  IPartnerBankAccountUpdateApiRequest,
  IPartnerDocumentListApiResponse,
  IPartnerDocumentCreateApiResponse,
  IPartnerDocumentCreateApiRequest,
  IPartnerDocumentUpdateApiResponse,
  IPartnerDocumentUpdateApiRequest,
  IPartnerDocumentDeleteApiResponse,
} from '@/shared/models/api/partner/profile.api';
import { createIApiRequest } from '@/utils/api.request';
import { ErrorCode } from '@/utils/error.codes';
import { AppError } from '@/utils/app.error';

export class PartnerProfileController extends BaseController {
  constructor(private readonly partnerProfileService: PartnerProfileService) {
    super();
  }

  getProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerProfileGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.user.partnerId as string;
        return await this.partnerProfileService.getProfile(partnerId);
      }
    );
  };

  getBasicProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerProfileBasicGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.user.partnerId as string;
        return await this.partnerProfileService.getBasicProfile(partnerId);
      }
    );
  };

  updateBasicProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerProfileBasicUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.user.partnerId as string;
        const { data } =
          createIApiRequest<IPartnerProfileBasicUpdateApiRequest>(req);
        return await this.partnerProfileService.updateBasicProfile(
          partnerId,
          data
        );
      }
    );
  };

  getAddress = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerProfileAddressGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.user.partnerId as string;
        return await this.partnerProfileService.getAddress(partnerId);
      }
    );
  };

  updateAddress = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerProfileAddressUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.user.partnerId as string;
        const { data } =
          createIApiRequest<IPartnerProfileAddressUpdateApiRequest>(req);
        return await this.partnerProfileService.updateAddress(partnerId, data);
      }
    );
  };

  getShippingAddress = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerProfileShippingAddressGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.user.partnerId as string;
        return await this.partnerProfileService.getShippingAddress(partnerId);
      }
    );
  };

  updateShippingAddress = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerProfileShippingAddressUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.user.partnerId as string;
        const { data } =
          createIApiRequest<IPartnerProfileShippingAddressUpdateApiRequest>(
            req
          );
        return await this.partnerProfileService.updateShippingAddress(
          partnerId,
          data
        );
      }
    );
  };

  getBillingAddress = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerProfileBillingAddressGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.user.partnerId as string;
        return await this.partnerProfileService.getBillingAddress(partnerId);
      }
    );
  };

  updateBillingAddress = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerProfileBillingAddressUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.user.partnerId as string;
        const { data } =
          createIApiRequest<IPartnerProfileBillingAddressUpdateApiRequest>(req);
        return await this.partnerProfileService.updateBillingAddress(
          partnerId,
          data
        );
      }
    );
  };

  getSocialProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerProfileSocialGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.user.partnerId as string;
        return await this.partnerProfileService.getSocialProfile(partnerId);
      }
    );
  };

  updateSocialProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerProfileSocialUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.user.partnerId as string;
        const { data } =
          createIApiRequest<IPartnerProfileSocialUpdateApiRequest>(req);
        return await this.partnerProfileService.updateSocialProfile(
          partnerId,
          data
        );
      }
    );
  };

  getCultureProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerProfileCultureGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.user.partnerId as string;
        return await this.partnerProfileService.getCultureProfile(partnerId);
      }
    );
  };

  updateCultureProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerProfileCultureUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.user.partnerId as string;
        const { data } =
          createIApiRequest<IPartnerProfileCultureUpdateApiRequest>(req);
        return await this.partnerProfileService.updateCultureProfile(
          partnerId,
          data
        );
      }
    );
  };

  getSettings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerProfileAiAssessmentSettingsGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.user.partnerId as string;
        return await this.partnerProfileService.getPartnerAiAssessmentSettings(
          partnerId
        );
      }
    );
  };

  updateSettings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerProfileAiAssessmentSettingsUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.user.partnerId as string;
        const { data } =
          createIApiRequest<IPartnerProfileAiAssessmentSettingsUpdateApiRequest>(
            req
          );
        return await this.partnerProfileService.updatePartnerAiAssessmentSettings(
          partnerId,
          data
        );
      }
    );
  };

  getAiAssessmentSettings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerProfileAiAssessmentSettingsGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.user.partnerId as string;
        return await this.partnerProfileService.getPartnerAiAssessmentSettings(
          partnerId
        );
      }
    );
  };

  updateAiAssessmentSettings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerProfileAiAssessmentSettingsUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.user.partnerId as string;
        const { data } =
          createIApiRequest<IPartnerProfileAiAssessmentSettingsUpdateApiRequest>(
            req
          );
        return await this.partnerProfileService.updatePartnerAiAssessmentSettings(
          partnerId,
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
    this.handleRequest<IPartnerProfileFinancialDataGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.user.partnerId as string;
        return await this.partnerProfileService.getFinancialData(partnerId);
      }
    );
  };

  createFinancialData = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerProfileFinancialDataCreateApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.user.partnerId as string;
        const { data } =
          createIApiRequest<IPartnerProfileFinancialDataCreateApiRequest>(req);
        return await this.partnerProfileService.createFinancialData(
          partnerId,
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
    this.handleRequest<IPartnerProfileFinancialDataUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.user.partnerId as string;
        const { data } =
          createIApiRequest<IPartnerProfileFinancialDataUpdateApiRequest>(req);
        return await this.partnerProfileService.updateFinancialData(
          partnerId,
          data
        );
      }
    );
  };

  // Bank Account methods
  addBankAccount = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerBankAccountCreateApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.user.partnerId as string;
        const { data } =
          createIApiRequest<IPartnerBankAccountCreateApiRequest>(req);
        return await this.partnerProfileService.addBankAccount(partnerId, data);
      }
    );
  };

  updateBankAccount = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerBankAccountUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.user.partnerId as string;
        const accountId = req.params.accountId as string;
        const { data } =
          createIApiRequest<IPartnerBankAccountUpdateApiRequest>(req);
        return await this.partnerProfileService.updateBankAccount(
          partnerId,
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
    this.handleRequest<IPartnerDocumentDeleteApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.user.partnerId as string;
        const accountId = req.params.accountId as string;
        return await this.partnerProfileService.deleteBankAccount(
          partnerId,
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
    this.handleRequest<IPartnerDocumentListApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.user.partnerId as string;
        return await this.partnerProfileService.getDocuments(partnerId);
      }
    );
  };

  createDocument = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerDocumentCreateApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.user.partnerId as string;
        const { data } =
          createIApiRequest<IPartnerDocumentCreateApiRequest>(req);
        return await this.partnerProfileService.createDocument(partnerId, data);
      }
    );
  };

  updateDocument = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerDocumentUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.user.partnerId as string;
        const documentId = req.params.documentId as string;
        const { data } =
          createIApiRequest<IPartnerDocumentUpdateApiRequest>(req);
        return await this.partnerProfileService.updateDocument(
          partnerId,
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
    this.handleRequest<IPartnerDocumentDeleteApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.user.partnerId as string;
        const documentId = req.params.documentId as string;
        return await this.partnerProfileService.deleteDocument(
          partnerId,
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
    this.handleRequest<IPartnerDocumentCreateApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.user.partnerId as string;
        const documentId = req.params.documentId as string;
        return await this.partnerProfileService.getDocumentById(
          partnerId,
          documentId
        );
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

        const partnerId = req.user.partnerId as string;
        if (!partnerId) {
          throw new AppError(
            'Partner ID is required',
            400,
            ErrorCode.PARTNER_ID_REQUIRED
          );
        }
        return await this.partnerProfileService.updateProfilePhoto(
          partnerId,
          req.file.buffer
        );
      }
    );
  };

  /**
   * Get partner profile by ID
   */
  getProfileById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerProfileGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.params.partnerId as string;
        return await this.partnerProfileService.getProfile(partnerId);
      }
    );
  };
}
