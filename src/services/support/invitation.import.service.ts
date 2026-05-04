import { PrismaClient } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import { singleton } from '@/shared/decorators/singleton';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';
import {
  ISupportInvitationImportProgress,
  ISupportInvitationImportRecord,
  ISupportInvitationImportRowData,
  ISupportInvitationImportStatistics,
  ISupportInvitationImportPerUploadStatistics,
} from '@/shared/models/domain/support/invitation.import.domain';
import {
  IPaginatedResponse,
  IPaginationRequest,
} from '@/shared/models/api/common/common.api';
import { SupportInvitationImportStatusEnum } from '@/shared/models/common/enums';
import { v4 as uuidv4 } from 'uuid';
import { IStorageProvider } from '../helpers/storage/storage.interface';
import { getBucketFolderPathToSupportInvitationImport } from '@/utils/presigned.urls';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

import { SupportInvitationImportProcessor } from '../queue/processors/support.invitation.import.processor';
import { INotificationProvider } from '../notification/notification.interface';

import { ENV } from '@/config/env';

@singleton
export class SupportInvitationImportService {
  private readonly prisma: PrismaClient;
  private readonly supportInvitationImportProcessor: SupportInvitationImportProcessor;

  constructor(
    private readonly storageProvider: IStorageProvider,
    private readonly notificationProvider: INotificationProvider
  ) {
    this.prisma = new PrismaClient();
    this.supportInvitationImportProcessor =
      new SupportInvitationImportProcessor();

    if (ENV.ENABLE_BULLMQ_WORKERS) {
      this.supportInvitationImportProcessor.setupWorkers();
    }

    logger.info('Support invitation import service initialized', {
      context: 'SupportInvitationImportService.constructor',
    });
  }

  /**
   * Upload and process Excel file for support invitation import
   */
  async uploadAndProcessInvitations(
    supportUserId: string,
    file: Buffer,
    fileName: string,
    uploadedBy: string
  ): Promise<ISupportInvitationImportProgress> {
    try {
      logger.info('Starting support invitation import upload and processing', {
        context: 'SupportInvitationImportService.uploadAndProcessInvitations',
        supportUserId,
        fileName,
        fileSize: file.length,
        uploadedBy,
      });

      // Validate support user exists
      const supportUser = await this.prisma.support_user.findUnique({
        where: { id: supportUserId },
        select: { id: true, user: { select: { name: true } } },
      });

      if (!supportUser) {
        logger.error('Support user not found in database', {
          context: 'SupportInvitationImportService.uploadAndProcessInvitations',
          supportUserId,
          uploadedBy,
        });
        throw new AppError('Support user not found', 404, ErrorCode.NOT_FOUND);
      }

      // Validate file with comprehensive checks
      this.validateInvitationImportFile(file, fileName);

      // Generate batch ID and unique file name
      const batchId = uuidv4();
      const fileExtension = this.getFileExtension(fileName);
      const uniqueFileName = `support_invitation_import_${batchId}_${Date.now()}${fileExtension}`;

      // Upload file to storage using storage provider
      const { folderPath } =
        getBucketFolderPathToSupportInvitationImport(supportUserId);
      const filePath = `${folderPath}/invitation_imports/${uniqueFileName}`;

      const uploadedUrl = await this.storageProvider.uploadFile(file, filePath);

      // Process Excel file for candidate data
      const progress = await this.processExcelFile(
        file,
        batchId,
        supportUserId,
        fileName,
        uniqueFileName,
        uploadedUrl,
        uploadedBy
      );

      logger.info('Support invitation import completed successfully', {
        context: 'SupportInvitationImportService.uploadAndProcessInvitations',
        batchId,
        progress,
      });

      return progress;
    } catch (error) {
      logger.error('Failed to upload and process support invitations', {
        context: 'SupportInvitationImportService.uploadAndProcessInvitations',
        error: error instanceof Error ? error.message : 'Unknown error',
        supportUserId,
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
    supportUserId: string,
    originalFileName: string,
    storedFileName: string,
    fileUrl: string,
    uploadedBy: string
  ): Promise<ISupportInvitationImportProgress> {
    try {
      const fileExtension =
        this.getFileExtension(originalFileName).toLowerCase();
      let candidateRows: ISupportInvitationImportRowData[] = [];

      if (fileExtension === '.csv') {
        candidateRows = await this.parseCSVFile(fileBuffer);
      } else {
        candidateRows = await this.parseExcelFile(fileBuffer);
      }

      const totalRecords = candidateRows.length;
      let processedRecords = 0;
      let successfulImports = 0;
      let updatedRecords = 0;
      let failedRecords = 0;

      logger.info(
        `Processing ${totalRecords} candidate records for support invitation import`,
        {
          context: 'SupportInvitationImportService.processExcelFile',
          totalRecords,
          batchId,
          fileType: fileExtension,
        }
      );

      // Get current upload count for this support user
      const currentUploadCount =
        await this.getSupportUserUploadCount(supportUserId);

      // Process each candidate
      for (const candidateData of candidateRows) {
        try {
          const result = await this.processCandidateRow(
            candidateData,
            batchId,
            supportUserId,
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
          logger.warn(
            'Failed to process candidate row for support invitation import',
            {
              context: 'SupportInvitationImportService.processExcelFile',
              email: candidateData.email,
              error: error instanceof Error ? error.message : 'Unknown error',
            }
          );
          failedRecords++;
        }
        processedRecords++;
      }

      // Queue invitations for successfully imported candidates in batches
      let queuedInviteBatches = 0;
      if (successfulImports > 0) {
        try {
          queuedInviteBatches =
            await this.supportInvitationImportProcessor.queueInviteBatches(
              candidateRows,
              batchId,
              supportUserId,
              uploadedBy
            );

          logger.info(
            'Support invitation batches queued for imported candidates',
            {
              context: 'SupportInvitationImportService.processExcelFile',
              batchId,
              totalCandidates: candidateRows.length,
              queuedBatches: queuedInviteBatches,
            }
          );
        } catch (inviteError) {
          logger.warn(
            'Failed to queue support invitations for imported candidates',
            {
              context: 'SupportInvitationImportService.processExcelFile',
              batchId,
              error:
                inviteError instanceof Error
                  ? inviteError.message
                  : 'Unknown error',
            }
          );
          // Don't fail the entire import process if invitation queuing fails
        }
      }

      // Count actual duplicates from this batch
      const actualDuplicateRecords =
        await this.prisma.support_invitation_import.count({
          where: {
            batchId,
            isDuplicate: true,
          },
        });

      const progress: ISupportInvitationImportProgress = {
        batchId,
        totalRecords,
        processedRecords,
        successfulImports,
        updatedRecords,
        duplicateRecords: actualDuplicateRecords,
        failedRecords,
        estimatedTimeRemaining: 0,
        status: SupportInvitationImportStatusEnum.PROCESSED,
      };

      logger.info('Support invitation import processing completed', {
        context: 'SupportInvitationImportService.processExcelFile',
        batchId,
        progress,
        queuedInviteBatches,
      });

      return progress;
    } catch (error) {
      logger.error('Failed to process file for support invitation import', {
        context: 'SupportInvitationImportService.processExcelFile',
        error: error instanceof Error ? error.message : 'Unknown error',
        batchId,
        fileName: originalFileName,
      });
      throw error;
    }
  }

  /**
   * Get current upload count for a support user
   */
  private async getSupportUserUploadCount(
    supportUserId: string
  ): Promise<number> {
    try {
      const result = await this.prisma.support_invitation_import.aggregate({
        where: {
          supportUserId,
        },
        _max: { uploadCount: true },
      });

      return (result._max.uploadCount || 0) + 1;
    } catch (error) {
      logger.error('Failed to get support user upload count', {
        context: 'SupportInvitationImportService.getSupportUserUploadCount',
        supportUserId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 1; // Default to 1 if error occurs
    }
  }

  /**
   * Process individual candidate row - simplified to just store import data
   */
  private async processCandidateRow(
    candidateData: ISupportInvitationImportRowData,
    batchId: string,
    supportUserId: string,
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

      // Create support invitation import record
      const invitationImportData = {
        batchId,
        supportUserId,
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
        status: SupportInvitationImportStatusEnum.PROCESSED,
        integrationProviderId: excelUploadProvider?.id || null,
      };

      // Check if email already exists in support_invitation_import table (across all batches)
      const existingEmailRecord =
        await this.prisma.support_invitation_import.findFirst({
          where: {
            email: invitationImportData.email,
            supportUserId: invitationImportData.supportUserId,
          },
          orderBy: { createdAt: 'desc' },
          select: { id: true, status: true, batchId: true },
        });

      // Check if existing record has INVITED status to preserve it
      const existingRecord =
        await this.prisma.support_invitation_import.findUnique({
          where: {
            unique_email_per_batch: {
              email: invitationImportData.email,
              batchId: invitationImportData.batchId,
            },
          },
          select: { status: true },
        });

      // Determine if this is a duplicate entry
      const isDuplicate =
        existingEmailRecord &&
        existingEmailRecord.batchId !== invitationImportData.batchId;

      // Determine the status to use
      let statusToUse: SupportInvitationImportStatusEnum;
      if (isDuplicate) {
        statusToUse = SupportInvitationImportStatusEnum.DUPLICATE;
      } else if (
        existingRecord?.status === SupportInvitationImportStatusEnum.INVITED
      ) {
        // Preserve INVITED status if it exists in the same batch
        statusToUse = SupportInvitationImportStatusEnum.INVITED;
      } else if (
        existingRecord?.status === SupportInvitationImportStatusEnum.ACCEPTED
      ) {
        // Preserve ACCEPTED status if it exists in the same batch
        statusToUse = SupportInvitationImportStatusEnum.ACCEPTED;
      } else {
        statusToUse = invitationImportData.status;
      }

      // Use upsert to either create new record or update existing one based on email + batchId
      const upsertedRecord = await this.prisma.support_invitation_import.upsert(
        {
          where: {
            unique_email_per_batch: {
              email: invitationImportData.email,
              batchId: invitationImportData.batchId,
            },
          },
          update: {
            supportUserId: invitationImportData.supportUserId,
            name: invitationImportData.name,
            phone: invitationImportData.phone,
            jobTitle: invitationImportData.jobTitle,
            location: invitationImportData.location,
            experience: invitationImportData.experience,
            skills: invitationImportData.skills,
            education: invitationImportData.education,
            gender: invitationImportData.gender,
            languages: invitationImportData.languages,
            originalFileName: invitationImportData.originalFileName,
            storedFileName: invitationImportData.storedFileName,
            fileUrl: invitationImportData.fileUrl,
            uploadedBy: invitationImportData.uploadedBy,
            uploadCount: invitationImportData.uploadCount,
            status: statusToUse,
            integrationProviderId: invitationImportData.integrationProviderId,
            isDuplicate: Boolean(isDuplicate),
            duplicateScore: isDuplicate ? 100 : undefined,
            duplicateOf: isDuplicate ? existingEmailRecord?.id : undefined,
            validationErrors: null,
          },
          create: {
            ...invitationImportData,
            status: statusToUse,
            isDuplicate: Boolean(isDuplicate),
            duplicateScore: isDuplicate ? 100 : undefined,
            duplicateOf: isDuplicate ? existingEmailRecord?.id : undefined,
          },
        }
      );

      const isUpdate =
        upsertedRecord.createdAt.getTime() !==
        upsertedRecord.updatedAt.getTime();

      const statusPreserved =
        existingRecord?.status === SupportInvitationImportStatusEnum.INVITED &&
        statusToUse === SupportInvitationImportStatusEnum.INVITED;

      logger.info('Support invitation import record processed successfully', {
        context: 'SupportInvitationImportService.processCandidateRow',
        recordId: upsertedRecord.id,
        email: candidateData.email,
        batchId,
        uploadCount,
        isUpdate,
        action: isUpdate ? 'updated' : 'created',
        statusPreserved,
        finalStatus: statusToUse,
        originalStatus: existingRecord?.status,
        isDuplicate,
        duplicateOfRecordId: isDuplicate ? existingEmailRecord?.id : null,
      });

      return { isUpdate };
    } catch (error) {
      logger.error(
        'Failed to process candidate row for support invitation import',
        {
          context: 'SupportInvitationImportService.processCandidateRow',
          candidateEmail: candidateData.email,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
      throw error;
    }
  }

  /**
   * Get support invitation import statistics for a support user
   */
  async getImportStatistics(
    supportUserId: string,
    filters?: {
      startDate?: string;
      endDate?: string;
    }
  ): Promise<ISupportInvitationImportStatistics> {
    try {
      logger.info('Getting support invitation import statistics', {
        context: 'SupportInvitationImportService.getImportStatistics',
        supportUserId,
        filters,
      });

      // Build where clause
      const where: any = { supportUserId };

      // Get basic statistics
      const [
        totalInvitations,
        successfulImports,
        invitedCandidates,
        duplicateCandidates,
        failedImports,
        totalUploads,
        failedRecordsWithErrors,
      ] = await Promise.all([
        // Total invitations
        this.prisma.support_invitation_import.count({ where }),

        // Successful imports
        this.prisma.support_invitation_import.count({
          where: {
            ...where,
            status: SupportInvitationImportStatusEnum.PROCESSED,
          },
        }),

        // Invited candidates
        this.prisma.support_invitation_import.count({
          where: {
            ...where,
            status: SupportInvitationImportStatusEnum.INVITED,
          },
        }),

        // Duplicate candidates
        this.prisma.support_invitation_import.count({
          where: { ...where, isDuplicate: true },
        }),

        // Failed imports
        this.prisma.support_invitation_import.count({
          where: { ...where, status: SupportInvitationImportStatusEnum.FAILED },
        }),

        // Total uploads (distinct upload counts)
        this.prisma.support_invitation_import.aggregate({
          where,
          _max: { uploadCount: true },
        }),

        // Get failed records with validation errors for failure reasons
        this.prisma.support_invitation_import.findMany({
          where: {
            ...where,
            status: SupportInvitationImportStatusEnum.FAILED,
            validationErrors: { not: null },
          },
          select: {
            email: true,
            validationErrors: true,
          },
          take: 100, // Limit to prevent memory issues
        }),
      ]);

      // Process failure reasons
      const failureReasons = this.processFailureReasons(
        failedRecordsWithErrors
      );

      const statistics: ISupportInvitationImportStatistics = {
        totalUploads: totalUploads._max.uploadCount || 0,
        totalInvitations,
        successfulImports,
        invitedCandidates,
        duplicateCandidates,
        failedImports,
        failureReasons,
      };

      logger.info(
        'Support invitation import statistics retrieved successfully',
        {
          context: 'SupportInvitationImportService.getImportStatistics',
          supportUserId,
          statistics,
        }
      );

      return statistics;
    } catch (error) {
      logger.error('Failed to get support invitation import statistics', {
        context: 'SupportInvitationImportService.getImportStatistics',
        supportUserId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get per-upload statistics for a support user
   */
  async getPerUploadStatistics(
    supportUserId: string,
    filters?: {
      startDate?: string;
      endDate?: string;
    }
  ): Promise<ISupportInvitationImportPerUploadStatistics[]> {
    try {
      logger.info('Getting per-upload support invitation import statistics', {
        context: 'SupportInvitationImportService.getPerUploadStatistics',
        supportUserId,
        filters,
      });

      // Build where clause
      const where: any = { supportUserId };

      // Get all unique batches for this support user
      const batches = await this.prisma.support_invitation_import.findMany({
        where,
        select: {
          batchId: true,
          originalFileName: true,
          createdAt: true,
        },
        distinct: ['batchId'],
        orderBy: { createdAt: 'desc' },
      });

      const perUploadStats: ISupportInvitationImportPerUploadStatistics[] = [];

      // Get statistics for each batch
      for (const batch of batches) {
        const batchWhere = { ...where, batchId: batch.batchId };

        const [
          totalRecords,
          successfulImports,
          failedRecords,
          duplicateRecords,
          invitedRecords,
          acceptedRecords,
          failedRecordsWithErrors,
        ] = await Promise.all([
          // Total records in this batch
          this.prisma.support_invitation_import.count({ where: batchWhere }),

          // Successful imports
          this.prisma.support_invitation_import.count({
            where: {
              ...batchWhere,
              status: SupportInvitationImportStatusEnum.PROCESSED,
            },
          }),

          // Failed records
          this.prisma.support_invitation_import.count({
            where: {
              ...batchWhere,
              status: SupportInvitationImportStatusEnum.FAILED,
            },
          }),

          // Duplicate records
          this.prisma.support_invitation_import.count({
            where: { ...batchWhere, isDuplicate: true },
          }),

          // Invited records
          this.prisma.support_invitation_import.count({
            where: {
              ...batchWhere,
              status: SupportInvitationImportStatusEnum.INVITED,
            },
          }),

          // Accepted records
          this.prisma.support_invitation_import.count({
            where: {
              ...batchWhere,
              status: SupportInvitationImportStatusEnum.ACCEPTED,
            },
          }),

          // Get failed records with validation errors for failure reasons
          this.prisma.support_invitation_import.findMany({
            where: {
              ...batchWhere,
              status: SupportInvitationImportStatusEnum.FAILED,
              validationErrors: { not: null },
            },
            select: {
              email: true,
              validationErrors: true,
            },
            take: 50, // Limit to prevent memory issues
          }),
        ]);

        // Process failure reasons for this batch
        const failureReasons = this.processFailureReasons(
          failedRecordsWithErrors
        );

        perUploadStats.push({
          batchId: batch.batchId,
          fileName: batch.originalFileName,
          uploadDate: batch.createdAt,
          totalRecords,
          successfulImports,
          failedRecords,
          duplicateRecords,
          invitedRecords,
          acceptedRecords,
          failureReasons,
        });
      }

      logger.info(
        'Per-upload support invitation import statistics retrieved successfully',
        {
          context: 'SupportInvitationImportService.getPerUploadStatistics',
          supportUserId,
          batchCount: perUploadStats.length,
        }
      );

      return perUploadStats;
    } catch (error) {
      logger.error(
        'Failed to get per-upload support invitation import statistics',
        {
          context: 'SupportInvitationImportService.getPerUploadStatistics',
          supportUserId,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
      throw error;
    }
  }

  /**
   * Process failure reasons from validation errors
   */
  private processFailureReasons(
    failedRecords: Array<{ email: string; validationErrors: string | null }>
  ): Array<{ reason: string; count: number; examples: string[] }> {
    const reasonCounts: Record<string, { count: number; examples: string[] }> =
      {};

    failedRecords.forEach((record) => {
      if (record.validationErrors) {
        // Clean and normalize the error message
        const cleanError = record.validationErrors
          .replace(/^Invitation processing failed: /, '')
          .trim();

        if (cleanError) {
          if (!reasonCounts[cleanError]) {
            reasonCounts[cleanError] = { count: 0, examples: [] };
          }
          reasonCounts[cleanError].count++;

          // Add email as example (limit to 3 examples per reason)
          if (reasonCounts[cleanError].examples.length < 3) {
            reasonCounts[cleanError].examples.push(record.email);
          }
        }
      }
    });

    // Convert to array and sort by count (descending)
    return Object.entries(reasonCounts)
      .map(([reason, data]) => ({
        reason,
        count: data.count,
        examples: data.examples,
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Parse Excel file and extract candidate data
   */
  private async parseExcelFile(
    fileBuffer: Buffer
  ): Promise<ISupportInvitationImportRowData[]> {
    const candidateRows: ISupportInvitationImportRowData[] = [];

    // Parse Excel file
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);

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

    logger.debug('Excel headers detected for support invitation import', {
      context: 'SupportInvitationImportService.parseExcelFile',
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

      logger.debug('Processing Excel row for support invitation import', {
        context: 'SupportInvitationImportService.parseExcelFile',
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
        logger.debug(
          'Skipping row due to missing/invalid required fields for support invitation import',
          {
            context: 'SupportInvitationImportService.parseExcelFile',
            rowNumber,
            hasValidEmail,
            hasValidName,
            mappedData,
          }
        );
      }
    });

    return candidateRows;
  }

  /**
   * Parse CSV file and extract candidate data
   */
  private async parseCSVFile(
    fileBuffer: Buffer
  ): Promise<ISupportInvitationImportRowData[]> {
    return new Promise((resolve, reject) => {
      const candidateRows: ISupportInvitationImportRowData[] = [];
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
          logger.debug('CSV parsing completed for support invitation import', {
            context: 'SupportInvitationImportService.parseCSVFile',
            totalRows: candidateRows.length,
          });
          resolve(candidateRows);
        })
        .on('error', (error: any) => {
          logger.error(
            'Failed to parse CSV file for support invitation import',
            {
              context: 'SupportInvitationImportService.parseCSVFile',
              error: error.message,
            }
          );
          reject(error);
        });
    });
  }

  /**
   * List imported candidates for a support user with pagination
   */
  async listImportedCandidates(
    supportUserId: string,
    filters: {
      jobTitle?: string;
      location?: string;
      skills?: string;
      status?: string;
    },
    pagination: IPaginationRequest
  ): Promise<IPaginatedResponse<ISupportInvitationImportRecord>> {
    try {
      const where: any = {
        supportUserId,
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

      if (filters.status) {
        where.status = filters.status as SupportInvitationImportStatusEnum;
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

      // Log the where clause for debugging
      logger.debug('Support invitation import list query where clause', {
        context: 'SupportInvitationImportService.listImportedCandidates',
        where,
        filters,
        pagination,
      });

      const [candidates, total] = await Promise.all([
        this.prisma.support_invitation_import.findMany({
          where,
          take: limit,
          skip,
          orderBy,
        }),
        this.prisma.support_invitation_import.count({ where }),
      ]);

      // Transform candidates to match interface expectations
      const transformedCandidates: ISupportInvitationImportRecord[] =
        candidates.map((candidate) => ({
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
          status: candidate.status as SupportInvitationImportStatusEnum,
          duplicateScore: candidate.duplicateScore || undefined,
          duplicateRecordId: candidate.duplicateOf || undefined,
          errorMessage: candidate.validationErrors || undefined,
          uploadCount: candidate.uploadCount,
          processedAt: candidate.updatedAt,
          createdAt: candidate.createdAt,
        }));

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
      logger.error(
        'Failed to list imported candidates for support invitation import',
        {
          context: 'SupportInvitationImportService.listImportedCandidates',
          error: error instanceof Error ? error.message : 'Unknown error',
          supportUserId,
        }
      );
      throw error;
    }
  }

  /**
   * Validate support invitation import file
   */
  private validateInvitationImportFile(file: Buffer, fileName: string): void {
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
   * Get file extension from filename
   */
  private getFileExtension(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : '';
  }
}
