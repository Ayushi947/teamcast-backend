import { singleton } from '@/shared/decorators/singleton';
import { BaseController } from '../common/base.controller';
import { CreateDocumentConfigService } from '@/services/support/document.config.service';
import { NextFunction, Request, Response } from 'express';
import { ErrorCode } from '@/utils/error.codes';
import { AppError } from '@/utils/app.error';
import { createIApiRequest } from '@/utils/api.request';
import {
  CreateDocumentConfigApiRequest,
  IDocumentVerificationApiRequest,
} from '@/shared/models/api/support/document-config.api';

@singleton
export class DocumentConfigController extends BaseController {
  constructor(
    private readonly documentConfigService: CreateDocumentConfigService
  ) {
    super();
  }

  /**
   * Create a new document config
   */
  createDocumentConfig = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const {
        data: { countryName, documentConfig },
      } = createIApiRequest<CreateDocumentConfigApiRequest>(req);

      if (!countryName || !documentConfig) {
        throw new AppError(
          'Country name and document config are required',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      return await this.documentConfigService.createDocumentConfig(
        countryName,
        documentConfig
      );
    });
  };

  getDocumentsByCountry = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const countryName = req.params.countryName;

      if (!countryName) {
        throw new AppError(
          'Country name is required',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      return await this.documentConfigService.getDocumentsByCountry(
        countryName as string
      );
    });
  };

  /**
   * Update the verification status of a company
   */
  updateCompanyVerificationStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const { status, remarks } = req.body;
      const companyId = req.params.companyId;

      if (!companyId || !status) {
        throw new AppError(
          'Company ID and status are required',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      return await this.documentConfigService.updateCompanyVerificationStatus(
        companyId,
        status,
        remarks
      );
    });
  };

  /**
   * Get all documents config
   */
  getAllDocumentsConfig = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      return await this.documentConfigService.getAllDocumentsConfig();
    });
  };

  /**
   * Get all documents by client id
   */
  getAllDocumentsByClientId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const clientId = req.params.clientId;
      return await this.documentConfigService.getAllDocumentsByClientId(
        clientId
      );
    });
  };

  /**
   * Verify a document
   */
  verifyDocument = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const documentId = req.params.documentId;
      const request = createIApiRequest<IDocumentVerificationApiRequest>(req);

      if (!documentId) {
        throw new AppError(
          'Document ID is required',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      if (!request.data) {
        throw new AppError(
          'Verification data is required',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      const success = await this.documentConfigService.verifyDocument(
        documentId,
        request
      );

      return { success };
    });
  };

  /**
   * Get document preview URL
   */
  getDocumentPreviewUrl = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const documentId = req.params.documentId;

      if (!documentId) {
        throw new AppError(
          'Document ID is required',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      return await this.documentConfigService.getDocumentPreviewUrl(documentId);
    });
  };
}
