import { singleton } from '@/shared/decorators/singleton';
import { ICompanyVerificationStatus } from '@/shared/models/common/enums';
import { IDocumentPreviewResponse } from '@/shared/models/domain/support/document.config.domain';
import {
  IClientDocument,
  toClientDocumentDomain,
} from '@/shared/models/domain/client/profile.domain';
import {
  ICountryWithDocuments,
  IDocumentConfig,
} from '@/shared/models/domain/support/document.config.domain';
import { logger } from '@/shared/utils/logger';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import {
  company,
  country,
  document_config,
  PrismaClient,
} from '@prisma/client';
import { VerificationStatus } from '@/shared/models/common/enums';
import { IDocumentVerificationApiRequest } from '@/shared/models/api/support/document-config.api';
import { NodemailerProvider } from '@/services/notification/nodemailer.service';

@singleton
export class CreateDocumentConfigService {
  private readonly prisma: PrismaClient;
  private readonly notificationService: NodemailerProvider;

  constructor() {
    this.prisma = new PrismaClient();
    this.notificationService = new NodemailerProvider();
  }

  /**
   * Transform a document_config database model to an IDocumentConfig domain model
   */
  private toDocumentConfigDomain = (
    document: document_config & { country?: any }
  ): IDocumentConfig => {
    return {
      id: document.id,
      name: document.doc_name,
      type: document.doc_type,
      required: document.is_required,
      countryId: document.countryId,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      country: document.country
        ? {
            id: document.country.id,
            countryName: document.country.name,
            createdAt: document.country.createdAt,
            updatedAt: document.country.updatedAt,
          }
        : undefined,
    };
  };

  /**
   * Transform an array of document_config database models to IDocumentConfig domain models
   */
  private toDocumentConfigDomainArray = (
    documents: (document_config & { country?: any })[]
  ): IDocumentConfig[] => {
    return documents.map(this.toDocumentConfigDomain);
  };

  /**
   * Transform a country database model with document configs to an ICountryWithDocuments domain model
   */
  private toCountryWithDocumentsDomain = (
    country: country & { documentConfigs: document_config[] }
  ): ICountryWithDocuments => {
    const documentConfigs = country.documentConfigs.map((doc) => ({
      id: doc.id,
      name: doc.doc_name,
      type: doc.doc_type,
      required: doc.is_required,
      countryId: doc.countryId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));

    const requiredDocumentCount = documentConfigs.filter(
      (doc) => doc.required
    ).length;

    return {
      id: country.id,
      countryName: country.name,
      documentConfigs: documentConfigs,
      documentCount: documentConfigs.length,
      requiredDocumentCount: requiredDocumentCount,
      createdAt: country.createdAt,
      updatedAt: country.updatedAt,
    };
  };

  /**
   * Transform an array of country database models with document configs to ICountryWithDocuments domain models
   */
  private toCountryWithDocumentsDomainArray = (
    countries: (country & { documentConfigs: document_config[] })[]
  ): ICountryWithDocuments[] => {
    return countries.map(this.toCountryWithDocumentsDomain);
  };

  async createDocumentConfig(
    countryName: string,
    documentConfigs: IDocumentConfig[]
  ): Promise<document_config[]> {
    let country = await this.prisma.country.findFirst({
      where: {
        name: countryName,
      },
    });

    if (!country) {
      country = await this.prisma.country.create({
        data: {
          name: countryName,
        },
      });
    }

    const createDocuments = await Promise.all(
      documentConfigs.map((config) =>
        this.prisma.document_config.create({
          data: {
            doc_name: config.name,
            doc_type: config?.type || 'OTHER',
            is_required: config.required,
            countryId: country.id,
          },
        })
      )
    );

    return createDocuments;
  }

  async getDocumentsByCountry(countryName: string): Promise<IDocumentConfig[]> {
    const country = await this.prisma.country.findFirst({
      where: {
        name: {
          equals: countryName,
          mode: 'insensitive',
        },
      },
    });

    if (!country) {
      return [];
    }

    const documents = await this.prisma.document_config.findMany({
      where: {
        countryId: country.id,
      },
      include: {
        country: true,
      },
    });

    return this.toDocumentConfigDomainArray(documents);
  }

  async updateCompanyVerificationStatus(
    companyId: string,
    status: ICompanyVerificationStatus,
    remarks?: string
  ): Promise<company> {
    const company = await this.prisma.company.findUnique({
      where: {
        id: companyId,
      },
    });

    if (!company) {
      throw new AppError('Company not found', 404, ErrorCode.NOT_FOUND);
    }

    const updatedCompany = await this.prisma.company.update({
      where: { id: companyId },
      data: { status, remarks },
    });

    return updatedCompany;
  }

  async getAllDocumentsConfig(): Promise<ICountryWithDocuments[]> {
    const countries = await this.prisma.country.findMany({
      include: {
        documentConfigs: true,
      },
    });

    if (!countries || countries.length === 0) {
      throw new AppError('No countries found', 404, ErrorCode.NOT_FOUND);
    }

    return this.toCountryWithDocumentsDomainArray(countries);
  }

  async getAllDocumentsByClientId(
    clientId: string
  ): Promise<IClientDocument[]> {
    try {
      const documents = await this.prisma.client_document.findMany({
        where: { clientId },
        orderBy: { createdAt: 'desc' },
      });

      return documents.map(toClientDocumentDomain);
    } catch (error) {
      logger.error('Error getting client documents', { error, clientId });
      throw error;
    }
  }

  /**
   * Verify a document
   */
  async verifyDocument(
    documentId: string,
    verificationData: IDocumentVerificationApiRequest
  ): Promise<boolean> {
    try {
      const document = await this.prisma.client_document.findUnique({
        where: { id: documentId },
        include: {
          client: {
            include: {
              company: true,
            },
          },
        },
      });

      if (!document) {
        throw new AppError('Document not found', 404, ErrorCode.NOT_FOUND);
      }

      await this.prisma.client_document.update({
        where: { id: documentId },
        data: {
          status: verificationData.data.status,
          remarks: verificationData.data.remarks || '',
          verifiedAt:
            verificationData.data.status === VerificationStatus.VERIFIED
              ? new Date()
              : null,
        },
      });

      // Send email notification if document is rejected
      if (verificationData.data.status === VerificationStatus.REJECTED) {
        await this.sendDocumentRejectionEmail(
          document,
          verificationData.data.remarks
        );
      }

      return true;
    } catch (error) {
      logger.error('Error verifying document', { error, documentId });
      throw error;
    }
  }

  /**
   * Send document rejection email to client
   */
  private async sendDocumentRejectionEmail(
    document: any,
    rejectionReason?: string
  ): Promise<void> {
    try {
      const company = document.client.company;

      // Use company contact email if available, otherwise log warning
      if (!company.contactEmail) {
        logger.warn(
          'No company contact email found for document rejection notification',
          {
            documentId: document.id,
            clientId: document.clientId,
            companyId: company.id,
            companyName: company.name,
          }
        );
        return;
      }

      const companyName = company.name || 'Your Company';
      const clientName = company.contactName || company.name || 'Client';
      const documentName = document.name || 'Document';
      const documentType = document.type || 'Document';
      const reason =
        rejectionReason ||
        'The document does not meet our verification requirements.';

      // Log which contact information is being used
      logger.info(
        'Using company contact information for document rejection email',
        {
          documentId: document.id,
          clientId: document.clientId,
          companyId: company.id,
          companyName: company.name,
          contactEmail: company.contactEmail,
          contactName: company.contactName,
        }
      );

      await this.notificationService.sendDocumentRejectionEmail(
        company.contactEmail,
        clientName,
        companyName,
        documentName,
        documentType,
        reason
      );

      logger.info('Document rejection email sent successfully', {
        documentId: document.id,
        contactEmail: company.contactEmail,
        clientName,
        companyName,
        documentName,
      });
    } catch (error) {
      logger.error('Failed to send document rejection email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        documentId: document.id,
        clientId: document.clientId,
      });
      // Don't throw error - email failure shouldn't break the main flow
    }
  }

  /**
   * Get document preview URL
   */
  async getDocumentPreviewUrl(
    documentId: string
  ): Promise<IDocumentPreviewResponse> {
    try {
      const document = await this.prisma.client_document.findUnique({
        where: { id: documentId },
      });

      if (!document) {
        throw new AppError('Document not found', 404, ErrorCode.NOT_FOUND);
      }
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      return {
        previewUrl: document.url,
        expiresAt: expiresAt.toISOString(),
      };
    } catch (error) {
      logger.error('Error getting document preview URL', { error, documentId });
      throw error;
    }
  }
}
