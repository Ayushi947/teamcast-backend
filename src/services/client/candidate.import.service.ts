import { PrismaClient } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import { singleton } from '@/shared/decorators/singleton';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';
import {
  ICandidateImportProgress,
  ICandidateImportRecord,
  ICandidateImportRowData,
  ICandidateImportStatistics,
} from '@/shared/models/domain/client/candidate.import.domain';
import {
  IPaginatedResponse,
  IPaginationRequest,
} from '@/shared/models/api/common/common.api';
import { CandidateImportStatusEnum } from '@/shared/models/common/enums';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs/promises';
import { IStorageProvider } from '../helpers/storage/storage.interface';
import { getBucketFolderPathToClientCandidateImport } from '@/utils/presigned.urls';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

import { CandidateImportInviteProcessor } from '../queue/processors/candidate.import.invite.processor';
import { INotificationProvider } from '../notification/notification.interface';

import { ENV } from '@/config/env';
import { IntegrationStatus } from '@/shared/models/common/enums';

@singleton
export class CandidateImportService {
  private readonly prisma: PrismaClient;
  private readonly candidateImportInviteProcessor: CandidateImportInviteProcessor;

  constructor(
    private readonly storageProvider: IStorageProvider,
    private readonly notificationProvider: INotificationProvider
  ) {
    this.prisma = new PrismaClient();
    this.candidateImportInviteProcessor = new CandidateImportInviteProcessor();

    if (ENV.ENABLE_BULLMQ_WORKERS) {
      this.candidateImportInviteProcessor.setupWorkers();
    }

    logger.info('Candidate import service initialized', {
      context: 'CandidateImportService.constructor',
    });
  }

  /**
   * Download Excel template for candidate import
   * Returns the pre-existing Excel file from excel_file directory
   */
  async downloadTemplate(
    jobPostingId: string
  ): Promise<{ buffer: Buffer; fileName: string }> {
    try {
      logger.info('Serving candidate import template', {
        context: 'CandidateImportService.downloadTemplate',
        jobPostingId,
      });

      // Verify job posting exists
      const jobPosting = await this.prisma.job_posting.findUnique({
        where: { id: jobPostingId },
        select: { id: true, title: true },
      });

      if (!jobPosting) {
        throw new AppError('Job posting not found', 404, ErrorCode.NOT_FOUND);
      }

      // Read the pre-existing Excel template file
      const templatePath = path.join(
        process.cwd(),
        'assets',
        'candidate_imports_template',
        'external_jobboard_candidates_sample.xlsx'
      );

      try {
        const buffer = await fs.readFile(templatePath);
        const fileName = `candidate_import_template_${jobPosting.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'job'}.xlsx`;

        logger.info('Excel template served successfully', {
          context: 'CandidateImportService.downloadTemplate',
          jobPostingId,
          fileName,
          bufferSize: buffer.byteLength,
          templatePath,
        });

        return {
          buffer,
          fileName,
        };
      } catch (fileError) {
        logger.error('Failed to read Excel template file', {
          context: 'CandidateImportService.downloadTemplate',
          templatePath,
          error:
            fileError instanceof Error ? fileError.message : 'Unknown error',
        });
        throw new AppError(
          'Template file not found',
          500,
          ErrorCode.INTERNAL_SERVER_ERROR
        );
      }
    } catch (error) {
      logger.error('Failed to serve candidate import template', {
        context: 'CandidateImportService.downloadTemplate',
        error: error instanceof Error ? error.message : 'Unknown error',
        jobPostingId,
      });
      throw error;
    }
  }

  /**
   * Create or update client integration for Excel Upload provider
   */
  private async createExcelUploadIntegration(
    clientId: string,
    fileName: string,
    progress: ICandidateImportProgress
  ): Promise<void> {
    try {
      // Find the Excel Upload provider
      const excelUploadProvider =
        await this.prisma.integration_provider.findFirst({
          where: {
            name: 'Excel Upload',
            isActive: true,
          },
        });

      if (!excelUploadProvider) {
        logger.warn(
          'Excel Upload provider not found, skipping integration creation',
          {
            context: 'CandidateImportService.createExcelUploadIntegration',
            clientId,
          }
        );
        return;
      }

      // Check if integration already exists for this client and provider
      const existingIntegration =
        await this.prisma.client_integration.findUnique({
          where: {
            clientId_providerId: {
              clientId,
              providerId: excelUploadProvider.id,
            },
          },
        });

      const integrationData = {
        name: `Excel Upload - ${fileName}`,
        description: `Excel file upload integration for candidate import. Last import: ${progress.successfulImports} candidates processed successfully.`,
        config: {
          lastImportFile: fileName,
          lastImportDate: new Date().toISOString(),
          totalImports:
            (existingIntegration?.config as any)?.totalImports || 0 + 1,
          lastImportStats: {
            totalRecords: progress.totalRecords,
            successfulImports: progress.successfulImports,
            failedRecords: progress.failedRecords,
          },
        },
        autoSyncEnabled: false, // Excel upload doesn't support auto-sync
      };

      if (existingIntegration) {
        // Update existing integration
        await this.prisma.client_integration.update({
          where: { id: existingIntegration.id },
          data: {
            name: integrationData.name,
            description: integrationData.description,
            config: integrationData.config,
            status: IntegrationStatus.ACTIVE,
            lastSyncAt: new Date(),
            lastError: null,
            errorCount: 0,
            updatedAt: new Date(),
          },
        });

        logger.info('Updated existing Excel Upload integration', {
          context: 'CandidateImportService.createExcelUploadIntegration',
          clientId,
          integrationId: existingIntegration.id,
          fileName,
        });
      } else {
        // Create new integration
        const newIntegration = await this.prisma.client_integration.create({
          data: {
            clientId,
            providerId: excelUploadProvider.id,
            name: integrationData.name,
            description: integrationData.description,
            config: integrationData.config,
            status: IntegrationStatus.ACTIVE,
            autoSyncEnabled: integrationData.autoSyncEnabled,
            lastSyncAt: new Date(),
          },
        });

        logger.info('Created new Excel Upload integration', {
          context: 'CandidateImportService.createExcelUploadIntegration',
          clientId,
          integrationId: newIntegration.id,
          fileName,
        });
      }
    } catch (error) {
      logger.error('Failed to create Excel Upload integration', {
        context: 'CandidateImportService.createExcelUploadIntegration',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        fileName,
      });
      // Don't throw error - integration creation failure shouldn't break the import process
    }
  }

  /**
   * Upload and process Excel file using storage provider (like DocumentService)
   */
  async uploadAndProcessCandidates(
    jobPostingId: string,
    clientId: string,
    file: Buffer,
    fileName: string,
    uploadedBy: string
  ): Promise<ICandidateImportProgress> {
    try {
      logger.info('Starting candidate import upload and processing', {
        context: 'CandidateImportService.uploadAndProcessCandidates',
        jobPostingId,
        clientId,
        fileName,
        fileSize: file.length,
        uploadedBy,
      });

      // Validate job posting exists and belongs to client
      const jobPosting = await this.prisma.job_posting.findUnique({
        where: { id: jobPostingId, clientId },
        select: { id: true, title: true, clientId: true },
      });

      if (!jobPosting) {
        throw new AppError('Job posting not found', 404, ErrorCode.NOT_FOUND);
      }

      // Validate file with comprehensive checks
      this.validateCandidateImportFile(file, fileName);

      // Generate batch ID and unique file name
      const batchId = uuidv4();
      const fileExtension = this.getFileExtension(fileName);
      const uniqueFileName = `candidate_import_${batchId}_${Date.now()}${fileExtension}`;

      // Upload file to storage using storage provider
      const { folderPath } =
        getBucketFolderPathToClientCandidateImport(clientId);
      const filePath = `${folderPath}/candidate_imports/${uniqueFileName}`;

      const uploadedUrl = await this.storageProvider.uploadFile(file, filePath);

      // Process Excel file for candidate data
      const progress = await this.processExcelFile(
        file,
        batchId,
        jobPostingId,
        clientId,
        fileName,
        uniqueFileName,
        uploadedUrl,
        uploadedBy
      );

      // Create client integration for Excel Upload provider if successful
      if (progress.successfulImports > 0) {
        await this.createExcelUploadIntegration(clientId, fileName, progress);
      }

      logger.info('Candidate import completed successfully', {
        context: 'CandidateImportService.uploadAndProcessCandidates',
        batchId,
        progress,
      });

      return progress;
    } catch (error) {
      logger.error('Failed to upload and process candidates', {
        context: 'CandidateImportService.uploadAndProcessCandidates',
        error: error instanceof Error ? error.message : 'Unknown error',
        jobPostingId,
        clientId,
        fileName,
      });
      throw error;
    }
  }

  /**
   * Normalize a header string for reliable comparison
   */
  private normalizeHeader(header: string): string {
    return header
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Map a normalized header to a target field name
   */
  private mapHeaderToField(
    normalizedHeader: string
  ):
    | 'name'
    | 'email'
    | 'phone'
    | 'jobTitle'
    | 'city'
    | 'country'
    | 'experience'
    | 'skills'
    | 'education'
    | 'gender'
    | 'languages'
    | undefined {
    const aliases: Record<string, string[]> = {
      name: ['full name', 'name', 'candidate name'],
      email: [
        'email',
        'email id',
        'email address',
        'e mail',
        'mail id',
        'mail address',
      ],
      phone: [
        'phone',
        'phone number',
        'phone no',
        'mobile',
        'mobile number',
        'mobile no',
        'contact number',
        'contact no',
      ],
      jobTitle: [
        'job title',
        'role',
        'position',
        'designation',
        'current designation',
        'curr company designation',
      ],
      city: [
        'location city',
        'city',
        'current city',
        'home town city',
        'current location',
      ],
      country: ['location country', 'country'],
      experience: [
        'total experience in years',
        'total experience',
        'experience',
        'years of experience',
      ],
      skills: ['skills', 'key skills', 'technical skills'],
      education: [
        'highest education',
        'education',
        'under graduation degree',
        'post graduation degree',
        'doctorate degree',
      ],
      gender: ['gender'],
      languages: ['languages', 'known languages'],
    };

    for (const [field, list] of Object.entries(aliases)) {
      if (list.includes(normalizedHeader)) {
        return field as any;
      }
    }

    return undefined;
  }

  /**
   * Determine if a string is a placeholder (e.g., 'NA', 'N/A', '-')
   */
  private isPlaceholder(value: string | undefined | null): boolean {
    if (value === undefined || value === null) return true;
    const v = String(value).trim().toLowerCase();
    return (
      v === '' ||
      v === 'na' ||
      v === 'n/a' ||
      v === 'null' ||
      v === 'none' ||
      v === '-' ||
      v === 'not available'
    );
  }

  /**
   * Clean a raw string cell value; return undefined if placeholder/empty
   */
  private normalizeCellString(
    value: string | number | undefined | null
  ): string | undefined {
    if (value === undefined || value === null) return undefined;
    const v = String(value).trim();
    if (this.isPlaceholder(v)) return undefined;
    return v;
  }

  /**
   * Extract the first valid email address from a string
   */
  private extractPrimaryEmail(value: string | undefined): string | undefined {
    if (!value) return undefined;
    const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
    const matches = value.match(emailRegex);
    return matches && matches.length > 0 ? matches[0].toLowerCase() : undefined;
  }

  /**
   * Validate email string
   */
  private isValidEmail(value: string | undefined): boolean {
    if (!value) return false;
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return emailRegex.test(value);
  }

  /**
   * Legacy mapping for original template headers (fallback)
   */
  private mapHeaderToFieldLegacy(
    headerValue: string
  ):
    | 'name'
    | 'email'
    | 'phone'
    | 'jobTitle'
    | 'city'
    | 'country'
    | 'experience'
    | 'skills'
    | 'education'
    | 'gender'
    | 'languages'
    | undefined {
    const lowerHeader = headerValue.toLowerCase().trim();

    // Exact matches from original template
    if (lowerHeader === 'full name') return 'name';
    if (lowerHeader === 'email') return 'email';
    if (lowerHeader === 'phone number') return 'phone';
    if (lowerHeader === 'job title') return 'jobTitle';
    if (lowerHeader === 'location (city)') return 'city';
    if (lowerHeader === 'location (country)') return 'country';
    if (lowerHeader === 'total experience (in years)') return 'experience';
    if (lowerHeader === 'skills') return 'skills';
    if (lowerHeader === 'highest education') return 'education';
    if (lowerHeader === 'gender') return 'gender';
    if (lowerHeader === 'languages') return 'languages';

    // Fallback partial matches
    if (lowerHeader.includes('name') && !lowerHeader.includes('company'))
      return 'name';
    if (lowerHeader.includes('email') && !lowerHeader.includes('by'))
      return 'email';
    if (lowerHeader.includes('phone')) return 'phone';
    if (lowerHeader.includes('job') && lowerHeader.includes('title'))
      return 'jobTitle';
    if (lowerHeader.includes('location') && lowerHeader.includes('city'))
      return 'city';
    if (lowerHeader.includes('location') && lowerHeader.includes('country'))
      return 'country';
    if (lowerHeader.includes('experience') && !lowerHeader.includes('year'))
      return 'experience';
    if (lowerHeader.includes('skill') && !lowerHeader.includes('key'))
      return 'skills';
    if (lowerHeader.includes('education')) return 'education';
    if (lowerHeader === 'gender') return 'gender';
    if (lowerHeader.includes('language')) return 'languages';

    return undefined;
  }

  /**
   * Process Excel or CSV file directly from buffer
   */
  private async processExcelFile(
    fileBuffer: Buffer,
    batchId: string,
    jobPostingId: string,
    clientId: string,
    originalFileName: string,
    storedFileName: string,
    fileUrl: string,
    uploadedBy: string
  ): Promise<ICandidateImportProgress> {
    try {
      const fileExtension =
        this.getFileExtension(originalFileName).toLowerCase();
      let candidateRows: ICandidateImportRowData[] = [];

      if (fileExtension === '.csv') {
        candidateRows = await this.parseCSVFile(fileBuffer);
      } else {
        candidateRows = await this.parseExcelFile(fileBuffer);
      }

      const totalRecords = candidateRows.length;
      let processedRecords = 0;
      let successfulImports = 0;
      let updatedRecords = 0;
      const duplicateRecords = 0;
      let failedRecords = 0;

      logger.info(`Processing ${totalRecords} candidate records`, {
        context: 'CandidateImportService.processExcelFile',
        totalRecords,
        batchId,
        fileType: fileExtension,
      });

      // Get current upload count for this client and job posting
      const currentUploadCount = await this.getJobPostingUploadCount(
        clientId,
        jobPostingId
      );

      // Process each candidate
      for (const candidateData of candidateRows) {
        try {
          const result = await this.processCandidateRow(
            candidateData,
            batchId,
            jobPostingId,
            clientId,
            originalFileName,
            storedFileName,
            fileUrl,
            uploadedBy,
            currentUploadCount
          );

          if (result.isUpdate) {
            updatedRecords++;
          } else {
            successfulImports++;
          }
        } catch (error) {
          logger.warn('Failed to process candidate row', {
            context: 'CandidateImportService.processExcelFile',
            email: candidateData.email,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          failedRecords++;
        }
        processedRecords++;
      }

      // Queue job invites for successfully imported candidates in batches
      let queuedInviteBatches = 0;
      if (successfulImports > 0) {
        try {
          queuedInviteBatches =
            await this.candidateImportInviteProcessor.queueInviteBatches(
              candidateRows,
              batchId,
              jobPostingId,
              clientId,
              uploadedBy
            );

          logger.info('Job invite batches queued for imported candidates', {
            context: 'CandidateImportService.processExcelFile',
            batchId,
            totalCandidates: candidateRows.length,
            queuedBatches: queuedInviteBatches,
          });
        } catch (inviteError) {
          logger.warn('Failed to queue job invites for imported candidates', {
            context: 'CandidateImportService.processExcelFile',
            batchId,
            error:
              inviteError instanceof Error
                ? inviteError.message
                : 'Unknown error',
          });
          // Don't fail the entire import process if job invite queuing fails
        }
      }

      const progress: ICandidateImportProgress = {
        batchId,
        totalRecords,
        processedRecords,
        successfulImports,
        updatedRecords,
        duplicateRecords,
        failedRecords,
        estimatedTimeRemaining: 0,
        status: CandidateImportStatusEnum.PROCESSED,
      };

      logger.info('Candidate import processing completed', {
        context: 'CandidateImportService.processExcelFile',
        batchId,
        progress,
        queuedInviteBatches,
      });

      return progress;
    } catch (error) {
      logger.error('Failed to process file', {
        context: 'CandidateImportService.processExcelFile',
        error: error instanceof Error ? error.message : 'Unknown error',
        batchId,
        fileName: originalFileName,
      });
      throw error;
    }
  }

  /**
   * Get current upload count for a client and job posting combination
   */
  private async getJobPostingUploadCount(
    clientId: string,
    jobPostingId: string
  ): Promise<number> {
    try {
      const result = await this.prisma.candidate_import.aggregate({
        where: {
          clientId,
          jobPostingId,
        },
        _max: { uploadCount: true },
      });

      return (result._max.uploadCount || 0) + 1;
    } catch (error) {
      logger.error('Failed to get job posting upload count', {
        context: 'CandidateImportService.getJobPostingUploadCount',
        clientId,
        jobPostingId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 1; // Default to 1 if error occurs
    }
  }

  /**
   * Process individual candidate row - simplified to just store import data
   */
  private async processCandidateRow(
    candidateData: ICandidateImportRowData,
    batchId: string,
    jobPostingId: string,
    clientId: string,
    originalFileName: string,
    storedFileName: string,
    fileUrl: string,
    uploadedBy: string,
    uploadCount: number
  ): Promise<{ isUpdate: boolean }> {
    try {
      // Get Excel Upload integration provider ID
      const excelUploadProvider =
        await this.prisma.integration_provider.findFirst({
          where: {
            name: 'Excel Upload',
            isActive: true,
          },
        });

      // Create candidate import record
      const candidateImportData = {
        batchId,
        jobPostingId,
        clientId,
        email: candidateData.email,
        name: candidateData.name,
        phone: candidateData.phone,
        jobTitle: candidateData.jobTitle,
        location: candidateData.location,
        experience: candidateData.experience,
        skills: candidateData.skills,
        education: candidateData.education,
        gender: candidateData.gender,
        languages: candidateData.languages,
        originalFileName,
        storedFileName,
        fileUrl,
        uploadedBy,
        uploadCount,
        status: CandidateImportStatusEnum.PROCESSED,
        integrationProviderId: excelUploadProvider?.id || null,
      };

      // Check if existing record has INVITED status to preserve it
      const existingRecord = await this.prisma.candidate_import.findUnique({
        where: {
          unique_email_per_job: {
            email: candidateImportData.email,
            jobPostingId: candidateImportData.jobPostingId,
          },
        },
        select: { status: true },
      });

      // Determine the status to use - preserve INVITED status if it exists
      const statusToUse =
        existingRecord?.status === CandidateImportStatusEnum.INVITED
          ? CandidateImportStatusEnum.INVITED
          : candidateImportData.status;

      // Use upsert to either create new record or update existing one based on email + jobPostingId
      const upsertedRecord = await this.prisma.candidate_import.upsert({
        where: {
          unique_email_per_job: {
            email: candidateImportData.email,
            jobPostingId: candidateImportData.jobPostingId,
          },
        },
        update: {
          batchId: candidateImportData.batchId,
          clientId: candidateImportData.clientId,
          name: candidateImportData.name,
          phone: candidateImportData.phone,
          jobTitle: candidateImportData.jobTitle,
          location: candidateImportData.location,
          experience: candidateImportData.experience,
          skills: candidateImportData.skills,
          education: candidateImportData.education,
          gender: candidateImportData.gender,
          languages: candidateImportData.languages,
          originalFileName: candidateImportData.originalFileName,
          storedFileName: candidateImportData.storedFileName,
          fileUrl: candidateImportData.fileUrl,
          uploadedBy: candidateImportData.uploadedBy,
          uploadCount: candidateImportData.uploadCount,
          status: statusToUse,
          integrationProviderId: candidateImportData.integrationProviderId,
          isDuplicate: false,
          duplicateScore: null,
          duplicateOf: null,
          validationErrors: null,
        },
        create: candidateImportData,
      });

      const isUpdate =
        upsertedRecord.createdAt.getTime() !==
        upsertedRecord.updatedAt.getTime();

      const statusPreserved =
        existingRecord?.status === CandidateImportStatusEnum.INVITED &&
        statusToUse === CandidateImportStatusEnum.INVITED;

      logger.info('Candidate import record processed successfully', {
        context: 'CandidateImportService.processCandidateRow',
        recordId: upsertedRecord.id,
        email: candidateData.email,
        batchId,
        uploadCount,
        isUpdate,
        action: isUpdate ? 'updated' : 'created',
        statusPreserved,
        finalStatus: statusToUse,
        originalStatus: existingRecord?.status,
      });

      return { isUpdate };
    } catch (error) {
      logger.error('Failed to process candidate row', {
        context: 'CandidateImportService.processCandidateRow',
        candidateEmail: candidateData.email,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get candidate import statistics for a client
   */
  async getImportStatistics(
    clientId: string,
    filters?: {
      jobPostingId?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<ICandidateImportStatistics> {
    try {
      logger.info('Getting candidate import statistics', {
        context: 'CandidateImportService.getImportStatistics',
        clientId,
        filters,
      });

      // Build where clause
      const where: any = { clientId };

      if (filters?.jobPostingId) {
        where.jobPostingId = filters.jobPostingId;
      }

      // Get basic statistics
      const [
        totalCandidates,
        successfulImports,
        invitedCandidates,
        duplicateCandidates,
        failedImports,
        totalUploads,
      ] = await Promise.all([
        // Total candidates
        this.prisma.candidate_import.count({ where }),

        // Successful imports
        this.prisma.candidate_import.count({
          where: { ...where, status: CandidateImportStatusEnum.PROCESSED },
        }),

        // Invited candidates
        this.prisma.candidate_import.count({
          where: { ...where, status: CandidateImportStatusEnum.INVITED },
        }),

        // Duplicate candidates
        this.prisma.candidate_import.count({
          where: { ...where, isDuplicate: true },
        }),

        // Failed imports
        this.prisma.candidate_import.count({
          where: { ...where, status: CandidateImportStatusEnum.FAILED },
        }),

        // Total uploads (distinct upload counts)
        this.prisma.candidate_import.aggregate({
          where,
          _max: { uploadCount: true },
        }),
      ]);

      const statistics: ICandidateImportStatistics = {
        totalUploads: totalUploads._max.uploadCount || 0,
        totalCandidates,
        successfulImports,
        invitedCandidates,
        duplicateCandidates,
        failedImports,
      };

      logger.info('Candidate import statistics retrieved successfully', {
        context: 'CandidateImportService.getImportStatistics',
        clientId,
        statistics,
      });

      return statistics;
    } catch (error) {
      logger.error('Failed to get candidate import statistics', {
        context: 'CandidateImportService.getImportStatistics',
        clientId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Parse Excel file and extract candidate data
   */
  private async parseExcelFile(
    fileBuffer: Buffer
  ): Promise<ICandidateImportRowData[]> {
    const candidateRows: ICandidateImportRowData[] = [];

    // Parse Excel file
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer as unknown as ExcelJS.Buffer);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new AppError(
        'No worksheet found in Excel file',
        400,
        ErrorCode.VALIDATION_ERROR
      );
    }

    // Build column index -> field mapping using normalized headers
    const headerRow = worksheet.getRow(1);
    const columnToField: Record<number, string> = {};
    const rawHeaders: Record<number, string> = {};

    headerRow.eachCell((cell: any, colNumber: number) => {
      const rawHeader = (cell?.value?.toString?.() || '')
        .replace(' *', '')
        .trim();

      // Try new dynamic mapping first
      const normalized = this.normalizeHeader(rawHeader);
      let field = this.mapHeaderToField(normalized);

      // Fallback to legacy mapping for template compatibility
      if (!field) {
        field = this.mapHeaderToFieldLegacy(rawHeader);
      }

      if (field && !columnToField[colNumber]) {
        columnToField[colNumber] = field;
      }
      rawHeaders[colNumber] = rawHeader.toLowerCase();
    });

    logger.debug('Excel headers detected', {
      context: 'CandidateImportService.parseExcelFile',
      headers: Object.values(rawHeaders).filter((h) => h),
      columnToField,
    });

    // Process data rows (skip header)
    worksheet.eachRow((row: any, rowNumber: number) => {
      if (rowNumber === 1) return; // Skip header

      const mappedData: any = {};

      row.eachCell((cell: any, colNumber: number) => {
        const field = columnToField[colNumber];
        if (!field) return;
        if (cell.value === null || cell.value === undefined) return;

        // Extract string from different cell value types
        let cellValue: string = '';
        if (typeof cell.value === 'object') {
          if (cell.value.hyperlink && cell.value.text) {
            cellValue = cell.value.text;
          } else if (cell.value.richText) {
            cellValue = cell.value.richText.map((rt: any) => rt.text).join('');
          } else if (cell.value.result !== undefined) {
            cellValue = String(cell.value.result);
          } else if (cell.value.text) {
            cellValue = String(cell.value.text);
          } else {
            cellValue = String(cell.value);
          }
        } else {
          cellValue = String(cell.value);
        }

        const cleaned = this.normalizeCellString(cellValue);
        if (!cleaned) return;

        if (field === 'email') {
          const primary = this.extractPrimaryEmail(cleaned);
          if (primary && !mappedData.email) {
            mappedData.email = primary;
          }
        } else if (!mappedData[field]) {
          mappedData[field] = cleaned;
        }
      });

      // Combine city and country for location
      let finalLocation = '';
      if (mappedData.city && mappedData.country) {
        finalLocation = `${mappedData.city}, ${mappedData.country}`;
      } else if (mappedData.city && !mappedData.country) {
        finalLocation = mappedData.city;
      } else if (!mappedData.city && mappedData.country) {
        finalLocation = mappedData.country;
      } else if (mappedData.location) {
        finalLocation = mappedData.location;
      }
      if (finalLocation) {
        mappedData.location = finalLocation;
      }

      const hasValidName = !!this.normalizeCellString(mappedData.name);
      const hasValidEmail = this.isValidEmail(mappedData.email);

      logger.debug('Processing Excel row', {
        context: 'CandidateImportService.parseExcelFile',
        rowNumber,
        rawRowData: mappedData, // already cleaned values
        mappedData,
        finalLocation,
        city: mappedData.city,
        country: mappedData.country,
        hasRequiredFields: hasValidName && hasValidEmail,
      });

      if (hasValidName && hasValidEmail) {
        candidateRows.push({
          rowNumber,
          email: mappedData.email,
          name: mappedData.name,
          phone: mappedData.phone,
          jobTitle: mappedData.jobTitle,
          location: mappedData.location,
          experience: mappedData.experience
            ? parseInt(mappedData.experience)
            : undefined,
          skills: mappedData.skills || '',
          education: mappedData.education,
          gender: mappedData.gender,
          languages: mappedData.languages || '',
        });
      } else {
        logger.debug('Skipping row due to missing/invalid required fields', {
          context: 'CandidateImportService.parseExcelFile',
          rowNumber,
          hasValidEmail,
          hasValidName,
          mappedData,
        });
      }
    });

    return candidateRows;
  }

  /**
   * Parse CSV file and extract candidate data
   */
  private async parseCSVFile(
    fileBuffer: Buffer
  ): Promise<ICandidateImportRowData[]> {
    return new Promise((resolve, reject) => {
      const candidateRows: ICandidateImportRowData[] = [];
      const stream = Readable.from(fileBuffer);
      let rowNumber = 1;

      stream
        .pipe(csvParser())
        .on('data', (data: any) => {
          rowNumber++;

          const mappedData: any = {};

          Object.keys(data).forEach((key) => {
            const raw = data[key];

            // Try new dynamic mapping first
            const normalizedHeader = this.normalizeHeader(key);
            let field = this.mapHeaderToField(normalizedHeader);

            // Fallback to legacy mapping for template compatibility
            if (!field) {
              field = this.mapHeaderToFieldLegacy(key);
            }

            const cleaned = this.normalizeCellString(raw);
            if (!field || !cleaned) return;

            if (field === 'email') {
              const primary = this.extractPrimaryEmail(cleaned);
              if (primary && !mappedData.email) {
                mappedData.email = primary;
              }
            } else if (!mappedData[field]) {
              mappedData[field] = cleaned;
            }
          });

          // Combine city and country for location
          let finalLocation = '';
          if (mappedData.city && mappedData.country) {
            finalLocation = `${mappedData.city}, ${mappedData.country}`;
          } else if (mappedData.city && !mappedData.country) {
            finalLocation = mappedData.city;
          } else if (!mappedData.city && mappedData.country) {
            finalLocation = mappedData.country;
          } else if (mappedData.location) {
            finalLocation = mappedData.location;
          }
          if (finalLocation) {
            mappedData.location = finalLocation;
          }

          const hasValidName = !!this.normalizeCellString(mappedData.name);
          const hasValidEmail = this.isValidEmail(mappedData.email);

          if (hasValidName && hasValidEmail) {
            candidateRows.push({
              rowNumber,
              email: mappedData.email,
              name: mappedData.name,
              phone: mappedData.phone,
              jobTitle: mappedData.jobTitle,
              location: mappedData.location,
              experience: mappedData.experience
                ? parseInt(mappedData.experience)
                : undefined,
              skills: mappedData.skills || '',
              education: mappedData.education,
              gender: mappedData.gender,
              languages: mappedData.languages || '',
            });
          }
        })
        .on('end', () => {
          logger.debug('CSV parsing completed', {
            context: 'CandidateImportService.parseCSVFile',
            totalRows: candidateRows.length,
          });
          resolve(candidateRows);
        })
        .on('error', (error: any) => {
          logger.error('Failed to parse CSV file', {
            context: 'CandidateImportService.parseCSVFile',
            error: error.message,
          });
          reject(error);
        });
    });
  }

  /**
   * List imported candidates for a job posting with pagination
   */
  async listImportedCandidates(
    jobPostingId: string,
    clientId: string,
    filters: {
      jobTitle?: string;
      location?: string;
      skills?: string;
    },
    pagination: IPaginationRequest
  ): Promise<IPaginatedResponse<ICandidateImportRecord>> {
    try {
      const where: any = {
        jobPostingId,
        clientId,
      };

      if (filters.jobTitle) {
        where.jobTitle = filters.jobTitle;
      }

      if (filters.location) {
        where.location = filters.location;
      }

      if (filters.skills) {
        where.skills = filters.skills;
      }

      // Set default pagination values
      const page = pagination.page || 1;
      const limit = pagination.limit || 50;
      const skip = (page - 1) * limit;

      // Set up ordering
      const orderBy: any = {};
      if (pagination.sortBy) {
        orderBy[pagination.sortBy] = pagination.sortOrder || 'desc';
      } else {
        orderBy.createdAt = 'desc';
      }

      // Add search functionality
      if (pagination.search) {
        const searchColumns = pagination.searchColumns || [
          'name',
          'email',
          'phone',
          'jobTitle',
          'location',
          'skills',
        ];
        const searchConditions = searchColumns.map((column) => ({
          [column]: {
            contains: pagination.search,
            mode: 'insensitive',
          },
        }));
        where.OR = searchConditions;
      }

      const [candidates, total] = await Promise.all([
        this.prisma.candidate_import.findMany({
          where,
          take: limit,
          skip,
          orderBy,
        }),
        this.prisma.candidate_import.count({ where }),
      ]);

      // Transform candidates to match interface expectations
      const transformedCandidates: ICandidateImportRecord[] = candidates.map(
        (candidate) => ({
          id: candidate.id,
          batchId: candidate.batchId,
          rowNumber: 0, // Placeholder since we're not storing row numbers yet
          email: candidate.email,
          name: candidate.name,
          phone: candidate.phone || undefined,
          jobTitle: candidate.jobTitle || undefined,
          location: candidate.location || undefined,
          experience: candidate.experience || undefined,
          skills: candidate.skills
            ? candidate.skills.split(',').map((s) => s.trim())
            : [],
          education: candidate.education || undefined,
          gender: candidate.gender || undefined,
          languages: candidate.languages
            ? candidate.languages.split(',').map((l) => l.trim())
            : [],
          status: candidate.status as CandidateImportStatusEnum,
          duplicateScore: candidate.duplicateScore || undefined,
          duplicateCandidateId: candidate.duplicateOf || undefined,
          errorMessage: candidate.validationErrors || undefined,
          uploadCount: candidate.uploadCount,
          processedAt: candidate.updatedAt,
          createdAt: candidate.createdAt,
        })
      );

      const totalPages = Math.ceil(total / limit);

      return {
        items: transformedCandidates,
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      logger.error('Failed to list imported candidates', {
        context: 'CandidateImportService.listImportedCandidates',
        error: error instanceof Error ? error.message : 'Unknown error',
        jobPostingId,
        clientId,
      });
      throw error;
    }
  }

  /**
   * Validate candidate import file (like DocumentService validations)
   */
  private validateCandidateImportFile(file: Buffer, fileName: string): void {
    // Validate file size (max 10MB)
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    if (file.length > maxFileSize) {
      throw new AppError(
        'File size exceeds 10MB limit',
        400,
        ErrorCode.VALIDATION_ERROR
      );
    }

    // Validate file extension
    const allowedExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = this.getFileExtension(fileName);
    if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
      throw new AppError(
        'Invalid file type. Only Excel (.xlsx, .xls) and CSV (.csv) files are allowed',
        400,
        ErrorCode.VALIDATION_ERROR
      );
    }

    // Validate file is not empty
    if (file.length === 0) {
      throw new AppError(
        'Empty file provided',
        400,
        ErrorCode.VALIDATION_ERROR
      );
    }
  }

  /**
   * Get file extension from filename (like DocumentService)
   */
  private getFileExtension(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : '';
  }
}
