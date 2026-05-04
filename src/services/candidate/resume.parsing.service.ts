import { singleton } from '@/shared/decorators/singleton';
import {
  ResumeParsingTaskStatusEnum,
  WorkTypeEnum,
  WorkCommitmentEnum,
  WorkScheduleEnum,
  NoticePeriodEnum,
  EducationLevelEnum,
  CertificationLevelEnum,
} from '@/shared/models/common/enums';
import {
  IResumeParsed,
  IResumeParsingTask,
} from '@/shared/models/domain/candidate/resume.parsing.domain';
import { toResumeParsingTaskDomain } from '@/shared/models/domain/candidate/resume.parsing.domain';
import {
  IResumePublicParsingTask,
  toResumePublicParsingTaskDomain,
} from '@/shared/models/domain/candidate/resume.public.parsing.domain';
import { logger } from '@/shared/utils/logger';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { PrismaClient } from '@prisma/client';

import {
  IAiResumeParsingStatus,
  IResumeParserProvider,
} from '../helpers/ai.resume.parser/resume.parser.provider';
import { ResumeParsingMode } from '@/shared/models/domain/candidate/resume.parsing.domain';
import {
  IResume,
  IResumeCertification,
  IResumeEducation,
  IResumeExperience,
  IResumeProject,
} from '@/shared/models/domain/candidate/resume.domain';

import { IStorageProvider } from '../helpers/storage/storage.interface';
import { getBucketFolderPathToCandidateResume } from '@/utils/presigned.urls';
import { ResumeParsingProcessor } from '../queue/processors/resume.parsing.processor';
import { ENV } from '@/config/env';
import { validateUrl } from '@/shared/utils/utils';

@singleton
export class CandidateResumeParsingService {
  private readonly prisma: PrismaClient;
  private readonly resumeParsingProcessor: ResumeParsingProcessor;

  private sanitizeFileName(fileName: string): string {
    // Remove any path components and get just the filename
    const baseName = fileName.split('/').pop() || fileName;
    // Remove any non-alphanumeric characters except dots and hyphens
    const sanitized = baseName.replace(/[^a-zA-Z0-9.-]/g, '_');
    // Ensure the filename isn't too long (max 100 chars)
    return sanitized.slice(0, 100);
  }

  constructor(
    private readonly storageProvider: IStorageProvider,
    private readonly parserProvider: IResumeParserProvider
  ) {
    this.prisma = new PrismaClient();
    this.resumeParsingProcessor = new ResumeParsingProcessor(this);
    if (ENV.ENABLE_BULLMQ_WORKERS) {
      this.resumeParsingProcessor.setupWorkers();
    }
    logger.info('Resume parsing service initialized with BullMQ integration', {
      context: 'CandidateResumeParsingService.constructor',
    });
  }

  /**
   * Upload a resume file and create a parsing task
   */
  async uploadResume(
    candidateId: string,
    file: Buffer,
    fileName: string,
    mode: ResumeParsingMode = ResumeParsingMode.INFERRED
  ): Promise<IResumeParsingTask> {
    try {
      // Get or create resume
      const resume = await this.prisma.resume.findUnique({
        where: { candidateId },
        include: {
          parsingTask: true,
        },
      });

      if (!resume) {
        // Throw error, resume not found
        throw new AppError(
          `Resume not found for candidate ${candidateId}`,
          404,
          ErrorCode.RESUME_NOT_FOUND
        );
      }

      // Check if there's an existing parsing task in progress
      if (
        resume.parsingTask &&
        (resume.parsingTask.status === ResumeParsingTaskStatusEnum.PENDING ||
          resume.parsingTask.status === ResumeParsingTaskStatusEnum.PROCESSING)
      ) {
        throw new AppError(
          'A resume parsing task is already in progress',
          400,
          ErrorCode.PARSING_TASK_IN_PROGRESS
        );
      }

      // Upload file to storage
      const sanitizedFileName = this.sanitizeFileName(fileName);
      const { folderPath } = getBucketFolderPathToCandidateResume(candidateId);
      const uniqueFileName = `${Date.now()}-${sanitizedFileName}`;
      const filePath = `${folderPath}/${uniqueFileName}`;
      await this.storageProvider.uploadFile(file, filePath);

      // Update resume with file URL
      await this.prisma.resume.update({
        where: { id: resume.id },
        data: { resumeFileUrl: filePath },
      });

      // If there's an existing task, update it instead of creating a new one
      let task;
      if (resume.parsingTask) {
        task = await this.prisma.resume_parsing_task.update({
          where: { id: resume.parsingTask.id },
          data: {
            fileUrl: filePath,
            status: ResumeParsingTaskStatusEnum.PENDING,
            error: null, // Clear any previous errors
          },
        });
      } else {
        // Create new parsing task
        task = await this.prisma.resume_parsing_task.create({
          data: {
            resumeId: resume.id,
            fileUrl: filePath,
            status: ResumeParsingTaskStatusEnum.PENDING,
          },
        });
      }

      // Parse resume in the backend using queue
      await this.resumeParsingProcessor.addParsingJob(task.id, filePath, mode);

      return toResumeParsingTaskDomain(task);
    } catch (error) {
      logger.error('Failed to upload resume', {
        context: 'CandidateResumeService.uploadResume',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
      });
      throw error;
    }
  }

  /**
   * Start background parse resume (public method for queue processor)
   */
  async startBackgroundParseResume(
    taskId: string,
    resumeUrl: string,
    mode: ResumeParsingMode
  ): Promise<void> {
    return this.backgroundParseResume(taskId, resumeUrl, mode);
  }

  /**
   * Parse a resume
   */
  private async backgroundParseResume(
    taskId: string,
    resumeUrl: string,
    mode: ResumeParsingMode
  ): Promise<void> {
    try {
      const task = await this.prisma.resume_parsing_task.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        throw new AppError(
          `Parsing task not found with id ${taskId}`,
          404,
          ErrorCode.PARSING_TASK_NOT_FOUND
        );
      }

      // Update task status to completed
      await this.prisma.resume_parsing_task.update({
        where: { id: taskId },
        data: { status: ResumeParsingTaskStatusEnum.PROCESSING },
      });

      // Initiate parsing task
      await this.parserProvider.parse(taskId, resumeUrl, mode);

      // Process the resume
      await this.updateResume(taskId);

      // Update task status to completed
      await this.prisma.resume_parsing_task.update({
        where: { id: taskId },
        data: { status: ResumeParsingTaskStatusEnum.COMPLETED },
      });
    } catch (error) {
      logger.error('Failed to parse resume', {
        context: 'CandidateResumeService.parseResume',
        error: error instanceof Error ? error.message : 'Unknown error',
        taskId,
      });

      // Update task status to failed
      await this.prisma.resume_parsing_task.update({
        where: { id: taskId },
        data: {
          status: ResumeParsingTaskStatusEnum.FAILED,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  /**
   * Get parsing task status
   */
  async getParsingTaskForCandidate(
    candidateId: string
  ): Promise<IResumeParsingTask> {
    try {
      const resume = await this.prisma.resume.findUnique({
        where: { candidateId },
        include: {
          parsingTask: true,
        },
      });

      if (!resume || !resume.parsingTask) {
        throw new AppError(
          `Parsing task not found with id ${candidateId}`,
          404,
          ErrorCode.PARSING_TASK_NOT_FOUND
        );
      }

      return toResumeParsingTaskDomain(resume.parsingTask);
    } catch (error) {
      logger.error('Failed to get parsing task for candidate', {
        context: 'CandidateResumeService.getParsingTaskForCandidate',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
      });
      throw error;
    }
  }

  /**
   * Get parsing task status
   */
  async getParsingTask(taskId: string): Promise<IResumeParsingTask> {
    try {
      const task = await this.prisma.resume_parsing_task.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        throw new AppError(
          `Parsing task not found with id ${taskId}`,
          404,
          ErrorCode.PARSING_TASK_NOT_FOUND
        );
      }

      return toResumeParsingTaskDomain(task);
    } catch (error) {
      logger.error('Failed to get parsing task', {
        context: 'CandidateResumeService.getParsingTask',
        error: error instanceof Error ? error.message : 'Unknown error',
        taskId,
      });
      throw error;
    }
  }

  /**
   * Get parsed resume
   */
  async getParsedResume(taskId: string): Promise<IResumeParsed> {
    const task = await this.prisma.resume_parsing_task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new AppError(
        `Parsing task not found with id ${taskId}`,
        404,
        ErrorCode.PARSING_TASK_NOT_FOUND
      );
    }

    if (task.status !== ResumeParsingTaskStatusEnum.COMPLETED) {
      throw new AppError(
        `Parsing task is not completed with id ${taskId}`,
        400,
        ErrorCode.PARSING_TASK_NOT_COMPLETED_OR_FAILED
      );
    }

    const parsedResume = await this.parserProvider.getParsingTask(taskId);

    if (!parsedResume.parsedResume) {
      throw new AppError(
        `Resume not parsed for task ${taskId}`,
        404,
        ErrorCode.PARSING_TASK_NOT_COMPLETED_OR_FAILED
      );
    }

    return parsedResume.parsedResume;
  }

  /**
   * Process a resume parsing task
   * @param taskId - The ID of the task to process
   */
  async updateResume(taskId: string): Promise<boolean> {
    const task = await this.prisma.resume_parsing_task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      logger.error('Task not found', {
        context: 'CandidateResumeService.processResume',
        taskId,
      });
      return false;
    }

    if (
      task.status !== ResumeParsingTaskStatusEnum.PENDING &&
      task.status !== ResumeParsingTaskStatusEnum.PROCESSING
    ) {
      // Its not a pending or processing task, so we don't need to process it
      logger.info('Task is not pending or processing', {
        context: 'CandidateResumeService.processResume',
        taskId,
      });
      return false;
    }

    const providerTask = await this.parserProvider.getParsingTask(taskId);

    if (
      providerTask.status !== IAiResumeParsingStatus.COMPLETED &&
      providerTask.status !== IAiResumeParsingStatus.FAILED
    ) {
      // The task is not completed or failed, so we don't need to process it
      logger.info('Task is not completed or failed', {
        context: 'CandidateResumeService.processResume',
        taskId,
      });
      return false;
    }

    // Update task status to updating, this is to prevent subsequent tasks from updating the same resume
    await this.prisma.resume_parsing_task.update({
      where: { id: taskId },
      data: { status: ResumeParsingTaskStatusEnum.UPDATING_CANDIDATE_RESUME },
    });

    if (providerTask.status === IAiResumeParsingStatus.FAILED) {
      await this.prisma.resume_parsing_task.update({
        where: { id: task.id },
        data: {
          status: ResumeParsingTaskStatusEnum.FAILED,
          error: providerTask.error,
        },
      });
      return false;
    } else if (providerTask.status === IAiResumeParsingStatus.COMPLETED) {
      const parsedResume = providerTask.parsedResume;
      if (!parsedResume) {
        await this.prisma.resume_parsing_task.update({
          where: { id: task.id },
          data: {
            status: ResumeParsingTaskStatusEnum.FAILED,
            error: 'Parsed resume not found',
          },
        });
      }
      // Update candidate resume with parsed data
      if (parsedResume) {
        await this.updateResumeWithParsedData(
          task.resumeId,
          parsedResume.parsedResume
        );

        // Update task status to completed
        await this.prisma.resume_parsing_task.update({
          where: { id: task.id },
          data: {
            status: ResumeParsingTaskStatusEnum.COMPLETED,
          },
        });
      }
    }
    return true;
  }

  /**
   * Sanitize and validate enum values
   */
  private sanitizeEnumValue(
    value: any,
    validValues: string[],
    defaultValue?: string
  ): string | undefined {
    if (!value) return defaultValue || undefined;
    const upperValue = String(value).toUpperCase().trim();
    return validValues.includes(upperValue) ? upperValue : defaultValue;
  }

  /**
   * Map common mistakes in enum values
   */
  private mapWorkType(value: any): string | undefined {
    if (!value) return undefined;
    const upperValue = String(value).toUpperCase().trim();

    // Map common mistakes
    const mappings: Record<string, string> = {
      PROJECT_BASED: WorkTypeEnum.OTHER,
      FULL_TIME: WorkTypeEnum.EMPLOYEE,
      PART_TIME: WorkTypeEnum.OTHER,
      HOURLY: WorkTypeEnum.CONTRACTOR,
    };

    if (mappings[upperValue]) {
      logger.warn('Mapped invalid work_type value', {
        context: 'CandidateResumeParsingService.mapWorkType',
        original: value,
        mapped: mappings[upperValue],
      });
      return mappings[upperValue];
    }

    // Valid work_type values
    const validTypes = Object.values(WorkTypeEnum);
    const sanitized = this.sanitizeEnumValue(
      value,
      validTypes,
      WorkTypeEnum.OTHER
    );

    if (sanitized !== upperValue && sanitized) {
      logger.warn('Sanitized work_type value', {
        context: 'CandidateResumeParsingService.mapWorkType',
        original: value,
        sanitized,
      });
    }

    return sanitized;
  }

  /**
   * Update a resume with parsed data
   * @param resumeId - The ID of the resume to update
   * @param parsedResume - The parsed resume data
   */
  private async updateResumeWithParsedData(
    resumeId: string,
    parsedResume: Partial<IResume>
  ): Promise<void> {
    try {
      // Get existing resume to preserve any existing data
      const existingResume = await this.prisma.resume.findUnique({
        where: { id: resumeId },
        include: {
          social: true,
          certifications: true,
          education: true,
          experience: {
            include: {
              projects: true,
            },
          },
        },
      });

      if (!existingResume) {
        throw new Error(`Resume not found with id ${resumeId}`);
      }

      // Prepare the update data
      const updateData: any = {};

      // Valid enum values for sanitization
      const validWorkCommitments = Object.values(WorkCommitmentEnum);
      const validWorkSchedules = Object.values(WorkScheduleEnum);
      const validNoticePeriods = Object.values(NoticePeriodEnum);
      const validEducationLevels = Object.values(EducationLevelEnum);
      const validCertificationLevels = Object.values(CertificationLevelEnum);

      // Update basic resume fields if they exist in parsed data
      if (parsedResume.phone) updateData.phone = parsedResume.phone;
      if (parsedResume.location) updateData.location = parsedResume.location;
      if (parsedResume.summary) updateData.summary = parsedResume.summary;
      if (parsedResume.primaryIndustry)
        updateData.primaryIndustry = parsedResume.primaryIndustry;
      if (parsedResume.totalExperience)
        updateData.totalExperience = parsedResume.totalExperience;
      if (parsedResume.currentJobTitle)
        updateData.currentJobTitle = parsedResume.currentJobTitle;
      if (parsedResume.currentCompany)
        updateData.currentCompany = parsedResume.currentCompany;
      if (parsedResume.currentIndustry)
        updateData.currentIndustry = parsedResume.currentIndustry;
      if (parsedResume.currentWorkLocation)
        updateData.currentWorkLocation = parsedResume.currentWorkLocation;

      // Sanitize enum fields
      if (parsedResume.currentWorkType)
        updateData.currentWorkType = this.mapWorkType(
          parsedResume.currentWorkType
        );
      if (parsedResume.currentWorkCommitment)
        updateData.currentWorkCommitment = this.sanitizeEnumValue(
          parsedResume.currentWorkCommitment,
          validWorkCommitments
        );
      if (parsedResume.currentWorkSchedule)
        updateData.currentWorkSchedule = this.sanitizeEnumValue(
          parsedResume.currentWorkSchedule,
          validWorkSchedules
        );
      if (parsedResume.noticePeriod)
        updateData.noticePeriod = this.sanitizeEnumValue(
          parsedResume.noticePeriod,
          validNoticePeriods
        );
      if (parsedResume.highestEducationLevel)
        updateData.highestEducationLevel = this.sanitizeEnumValue(
          parsedResume.highestEducationLevel,
          validEducationLevels,
          EducationLevelEnum.BACHELORS
        );

      // Continue with other fields
      if (parsedResume.currentSalary)
        updateData.currentSalary = parsedResume.currentSalary;
      if (parsedResume.currentSalaryCurrency)
        updateData.currentSalaryCurrency = parsedResume.currentSalaryCurrency;
      if (parsedResume.availableFrom)
        updateData.availableFrom = parsedResume.availableFrom;
      if (parsedResume.resumeSkills)
        updateData.resumeSkills = parsedResume.resumeSkills;
      if (parsedResume.industries)
        updateData.industries = parsedResume.industries;
      if (parsedResume.languages) updateData.languages = parsedResume.languages;

      // USA Work Authorization fields
      if (parsedResume.isUSWorkAuthorized !== undefined)
        updateData.isUSWorkAuthorized = parsedResume.isUSWorkAuthorized;
      if (parsedResume.requiresUSVisaSponsorship !== undefined)
        updateData.requiresUSVisaSponsorship =
          parsedResume.requiresUSVisaSponsorship;
      if (parsedResume.usWorkAuthorizationStatus)
        updateData.usWorkAuthorizationStatus =
          parsedResume.usWorkAuthorizationStatus;
      if (parsedResume.usWorkAuthorizationDetails)
        updateData.usWorkAuthorizationDetails =
          parsedResume.usWorkAuthorizationDetails;

      // Update social links if they exist
      if (parsedResume.social) {
        updateData.social = {
          upsert: {
            create: {
              linkedin: validateUrl(parsedResume.social.linkedin),
              twitter: validateUrl(parsedResume.social.twitter),
              github: validateUrl(parsedResume.social.github),
              portfolio: validateUrl(parsedResume.social.portfolio),
              leetcode: validateUrl(parsedResume.social.leetcode),
            },
            update: {
              linkedin: validateUrl(parsedResume.social.linkedin),
              twitter: validateUrl(parsedResume.social.twitter),
              github: validateUrl(parsedResume.social.github),
              portfolio: validateUrl(parsedResume.social.portfolio),
              leetcode: validateUrl(parsedResume.social.leetcode),
            },
          },
        };
      }

      // Update certifications if they exist
      if (parsedResume.certifications?.length) {
        // Delete existing certifications
        await this.prisma.resume_certification.deleteMany({
          where: { resumeId },
        });

        // Create new certifications
        updateData.certifications = {
          create: parsedResume.certifications.map(
            (cert: IResumeCertification) => ({
              name: cert.name,
              issuer: cert.issuer,
              issueDate: cert.issueDate,
              expiryDate: cert.expiryDate,
              credentialId: cert.credentialId,
              credentialUrl: cert.credentialUrl,
              level: cert.level
                ? this.sanitizeEnumValue(cert.level, validCertificationLevels)
                : undefined,
              category: cert.category,
              description: cert.description,
            })
          ),
        };
      }

      // Update education if it exists
      if (parsedResume.education?.length) {
        // Delete existing education
        await this.prisma.resume_education.deleteMany({
          where: { resumeId },
        });

        // Create new education entries
        updateData.education = {
          create: parsedResume.education.map((edu: IResumeEducation) => ({
            institution: edu.institution,
            level: this.sanitizeEnumValue(
              edu.level,
              validEducationLevels,
              EducationLevelEnum.BACHELORS
            ), // Sanitize education level
            degree: edu.degree,
            fieldOfStudy: edu.fieldOfStudy,
            startDate: edu.startDate,
            endDate: edu.endDate,
            currentlyPursuing: edu.currentlyPursuing,
            gpa: edu.gpa,
            achievements: edu.achievements || [],
          })),
        };
      }

      // Update experience if it exists
      if (parsedResume.experience?.length) {
        // Delete existing experience and related projects
        await this.prisma.resume_experience.deleteMany({
          where: { resumeId },
        });

        // Create new experience entries with projects
        updateData.experience = {
          create: parsedResume.experience.map((exp: IResumeExperience) => ({
            company: exp.company,
            position: exp.position,
            industry: exp.industry,
            startDate: exp.startDate,
            endDate: exp.endDate,
            currentlyWorking: exp.currentlyWorking,
            description: exp.description,
            type: this.mapWorkType(exp.type), // Sanitize work_type
            commitment: this.sanitizeEnumValue(
              exp.commitment,
              validWorkCommitments,
              WorkCommitmentEnum.FULL_TIME
            ), // Sanitize work_commitment
            location: exp.location,
            skills: exp.skills,
            achievements: exp.achievements,
            responsibilities: exp.responsibilities || [],
            projects: {
              create:
                exp.projects?.map((proj: IResumeProject) => ({
                  name: proj.name,
                  description: proj.description,
                  startDate: proj.startDate,
                  endDate: proj.endDate,
                  currentlyWorking: proj.currentlyWorking,
                  role: proj.role,
                  teamSize: proj.teamSize,
                  url: proj.url,
                  githubUrl: proj.githubUrl,
                  demoUrl: proj.demoUrl,
                  skills: proj.skills || [],
                  responsibilities: proj.responsibilities || [],
                  achievements: proj.achievements || [],
                  challenges: proj.challenges || [],
                  solutions: proj.solutions || [],
                  impact: proj.impact || [],
                })) || [],
            },
          })),
        };
      }

      // Update the resume with all the changes
      await this.prisma.resume.update({
        where: { id: resumeId },
        data: updateData,
      });

      logger.info('Successfully updated resume with parsed data', {
        context: 'ResumeParsingCronService.updateResumeWithParsedData',
        resumeId,
      });
    } catch (error) {
      logger.error('Failed to update resume with parsed data', {
        context: 'ResumeParsingCronService.updateResumeWithParsedData',
        error: error instanceof Error ? error.message : 'Unknown error',
        resumeId,
      });
      throw error;
    }
  }

  /**
   * Upload a resume file and create a public parsing task (async)
   */
  async uploadResumePublic(
    file: Buffer,
    fileName: string,
    mode: ResumeParsingMode = ResumeParsingMode.INFERRED
  ): Promise<IResumePublicParsingTask> {
    try {
      // Upload file to storage
      const sanitizedFileName = this.sanitizeFileName(fileName);
      const uniqueFileName = `${Date.now()}-${sanitizedFileName}`;
      const filePath = `public-temp/${uniqueFileName}`;
      await this.storageProvider.uploadFile(file, filePath);

      // Create public parsing task
      const task = await this.prisma.resume_public_parsing_task.create({
        data: {
          fileUrl: filePath,
          fileName: sanitizedFileName,
          mode: mode,
          status: ResumeParsingTaskStatusEnum.PENDING,
        },
      });

      // Parse resume in the background using queue
      await this.resumeParsingProcessor.addPublicParsingJob(
        task.id,
        filePath,
        mode
      );

      return toResumePublicParsingTaskDomain(task);
    } catch (error) {
      logger.error('Failed to upload resume for public parsing', {
        context: 'CandidateResumeService.uploadResumePublic',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get public parsing task status
   */
  async getPublicParsingTask(
    taskId: string
  ): Promise<IResumePublicParsingTask> {
    try {
      const task = await this.prisma.resume_public_parsing_task.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        throw new AppError(
          `Public parsing task not found with id ${taskId}`,
          404,
          ErrorCode.PARSING_TASK_NOT_FOUND
        );
      }

      return toResumePublicParsingTaskDomain(task);
    } catch (error) {
      logger.error('Failed to get public parsing task', {
        context: 'CandidateResumeService.getPublicParsingTask',
        error: error instanceof Error ? error.message : 'Unknown error',
        taskId,
      });
      throw error;
    }
  }

  /**
   * Get parsed resume from public task
   */
  async getParsedResumeFromPublicTask(taskId: string): Promise<IResumeParsed> {
    const task = await this.prisma.resume_public_parsing_task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new AppError(
        `Public parsing task not found with id ${taskId}`,
        404,
        ErrorCode.PARSING_TASK_NOT_FOUND
      );
    }

    if (task.status !== ResumeParsingTaskStatusEnum.COMPLETED) {
      throw new AppError(
        `Public parsing task is not completed with id ${taskId}`,
        400,
        ErrorCode.PARSING_TASK_NOT_COMPLETED_OR_FAILED
      );
    }

    const parsedResume = await this.parserProvider.getParsingTask(taskId);

    if (!parsedResume.parsedResume) {
      throw new AppError(
        `Resume not parsed for public task ${taskId}`,
        404,
        ErrorCode.PARSING_TASK_NOT_COMPLETED_OR_FAILED
      );
    }

    return parsedResume.parsedResume;
  }

  /**
   * Background parsing for public tasks
   */
  async backgroundParseResumePublic(
    taskId: string,
    resumeUrl: string,
    mode: ResumeParsingMode
  ): Promise<void> {
    try {
      const task = await this.prisma.resume_public_parsing_task.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        throw new AppError(
          `Public parsing task not found with id ${taskId}`,
          404,
          ErrorCode.PARSING_TASK_NOT_FOUND
        );
      }

      // Update task status to processing
      await this.prisma.resume_public_parsing_task.update({
        where: { id: taskId },
        data: { status: ResumeParsingTaskStatusEnum.PROCESSING },
      });

      // Initiate parsing task
      await this.parserProvider.parse(taskId, resumeUrl, mode);

      // Update task status to completed
      await this.prisma.resume_public_parsing_task.update({
        where: { id: taskId },
        data: { status: ResumeParsingTaskStatusEnum.COMPLETED },
      });
    } catch (error) {
      logger.error('Failed to parse resume for public task', {
        context: 'CandidateResumeService.backgroundParseResumePublic',
        error: error instanceof Error ? error.message : 'Unknown error',
        taskId,
      });

      // Update task status to failed
      await this.prisma.resume_public_parsing_task.update({
        where: { id: taskId },
        data: {
          status: ResumeParsingTaskStatusEnum.FAILED,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }
}
