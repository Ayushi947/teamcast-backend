import { Prisma, PrismaClient } from '@prisma/client';
import { singleton } from '@/shared/decorators/singleton';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';
import { JobParsingMode } from '@/shared/models/domain/client/job.parsing.domain';
import { IJobParserProvider } from '../helpers/ai.job.parser/job.parser.provider';
import { PublicPracticeJobParserProvider } from '../helpers/ai.job.parser/providers/public.practice.job.parser.provider';
import { IPracticeAssessmentProvider } from '../helpers/practice.assessment/practice.assessment.provider';
import { PracticeAssessmentFactory } from '../helpers/practice.assessment/practice.assessment.factory';
import {
  DifficultyLevelEnum,
  PublicPracticeAssessmentStatusEnum,
  PublicPracticeAssessmentResultEnum,
  PublicPracticeAssessmentRecommendationEnum,
  PublicPracticeAssessmentSectionStatusEnum,
  PublicPracticeAssessmentSectionResultEnum,
  PublicPracticeAssessmentTaskStatusEnum,
  PublicPracticeAssessmentVideoAnalysisStatusEnum,
  JobAiAssessmentResultEnum,
  JobAiAssessmentTaskStatusEnum,
  JobAiAssessmentRecommendationEnum,
  JobAiAssessmentSectionStatusEnum,
} from '@/shared/models/common/enums';
import {
  IPublicPracticeAssessment,
  IPublicPracticeAssessmentCreate,
  IPublicPracticeAssessmentWithMetadata,
  IGlobalPracticeAssessmentSettings,
  IGlobalPracticeAssessmentSettingsUpdate,
  toGlobalPracticeAssessmentSettingsDomain,
} from '@/shared/models/domain/candidate/public.practice.assessment.domain';
import { v4 as uuidv4 } from 'uuid';
import { ENV } from '@/config/env';
import { getBucketFolderPathToPublicPracticeAssessmentVideoChunks } from '@/utils/presigned.urls';
import { IStorageProvider } from '../helpers/storage/storage.interface';
import { formatEmail, formatName } from '@/shared/utils/formatters';
import { CandidateProfileSettingsService } from './profile.settings.service';
import {
  CandidateStatusEnum,
  JobSearchStatusEnum,
} from '@/shared/models/common/enums';
import { toCandidateJobAiAssessmentQuestionDomain } from '@/shared/models/domain/candidate/job.ai.assessment.domain';
import {
  generateResumeText,
  generateResumeTextFromParsedResume,
} from '@/utils/resume';
import { CandidateResumeParsingService } from './resume.parsing.service';
import { CandidateResumeService } from './resume.service';
import { StorageFactory } from '../helpers/storage/storage.factory';
import { ResumeParserFactory } from '../helpers/ai.resume.parser/resume.parser.factory';
import { ResumeParsingTaskStatusEnum } from '@/shared/models/common/enums';
import { ResumeParsingMode } from '@/shared/models/domain/candidate/resume.parsing.domain';
import { CandidateProfileService } from './profile.service';
import { PublicPracticeAssessmentVideoAnalysisProcessor } from '../queue/processors/public.practice.assessment.video.analysis.processor';
import { PublicPracticeAssessmentProcessor } from '../queue/processors/public.practice.assessment.processor';

@singleton
export class PublicPracticeAssessmentService {
  private readonly prisma: PrismaClient;
  private readonly jobParserProvider: IJobParserProvider;
  private readonly practiceAssessmentProvider: IPracticeAssessmentProvider;
  private readonly candidateProfileSettingsService: CandidateProfileSettingsService;
  private readonly publicPracticeAssessmentProcessor: PublicPracticeAssessmentProcessor;
  private readonly publicPracticeAssessmentVideoAnalysisProcessor: PublicPracticeAssessmentVideoAnalysisProcessor;
  private readonly resumeParsingService: CandidateResumeParsingService;
  private readonly resumeService: CandidateResumeService;

  constructor(private readonly storageProvider?: IStorageProvider) {
    this.prisma = new PrismaClient();
    this.jobParserProvider = new PublicPracticeJobParserProvider();

    this.practiceAssessmentProvider =
      PracticeAssessmentFactory.getInstance().getProvider();
    this.candidateProfileSettingsService =
      new CandidateProfileSettingsService();
    const storage =
      storageProvider || StorageFactory.getInstance().getProvider();
    const parserProvider = ResumeParserFactory.getInstance().getProvider();
    this.resumeParsingService = new CandidateResumeParsingService(
      storage,
      parserProvider
    );
    const profileService = new CandidateProfileService(storage);
    this.resumeService = new CandidateResumeService(profileService, storage);
    this.publicPracticeAssessmentProcessor =
      new PublicPracticeAssessmentProcessor(this);
    this.publicPracticeAssessmentVideoAnalysisProcessor =
      new PublicPracticeAssessmentVideoAnalysisProcessor(this);

    // Setup workers if enabled
    if (ENV.ENABLE_BULLMQ_WORKERS) {
      this.publicPracticeAssessmentProcessor.setupWorkers();
    }

    // Setup video analysis workers if enabled
    const workersEnabled =
      ENV.ENABLE_CHUNK_VIDEO_ANALYSIS_WORKERS || ENV.ENABLE_GPU_BULLMQ_WORKERS;
    if (workersEnabled) {
      this.publicPracticeAssessmentVideoAnalysisProcessor.setupWorkers();
    }

    logger.info('Public practice assessment service initialized', {
      context: 'PublicPracticeAssessmentService.constructor',
      queueWorkersEnabled: ENV.ENABLE_BULLMQ_WORKERS,
      videoAnalysisWorkersEnabled: workersEnabled,
    });
  }

  /**
   * Create or get candidate from email and name
   * Handles all edge cases for user/candidate creation
   */
  async createOrGetCandidateFromEmailAndName(
    email: string,
    name: string
  ): Promise<{
    candidateId: string;
    userId: string;
    isNewUser: boolean;
    isNewCandidate: boolean;
    requiresPasswordSetup: boolean;
    requiresEmailVerification: boolean;
    hasResume: boolean;
    resumeParsed: boolean;
    resumeParsingStatus?: string;
  }> {
    try {
      const normalizedEmail = formatEmail(email);
      const formattedName = formatName(name);

      logger.info('Creating or getting candidate from email and name', {
        context:
          'PublicPracticeAssessmentService.createOrGetCandidateFromEmailAndName',
        email: normalizedEmail,
        name: formattedName,
      });

      // Check if user exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: {
          candidate: {
            include: {
              resume: {
                include: {
                  parsingTask: true,
                },
              },
            },
          },
        },
      });

      if (existingUser) {
        // Handle existing user cases
        if (
          existingUser.type === 'CLIENT' ||
          existingUser.type === 'SUPPORT' ||
          existingUser.type === 'PARTNER'
        ) {
          throw new AppError(
            `This email is already registered as a ${existingUser.type.toLowerCase()} account. Please use a different email.`,
            400,
            ErrorCode.USER_TYPE_CONFLICT
          );
        }

        if (existingUser.candidate) {
          if (existingUser.name !== formattedName) {
            const existingNameNormalized = existingUser.name
              .trim()
              .toLowerCase();
            const newNameNormalized = formattedName.trim().toLowerCase();

            if (existingNameNormalized !== newNameNormalized) {
              logger.warn('Name mismatch detected for existing candidate', {
                context:
                  'PublicPracticeAssessmentService.createOrGetCandidateFromEmailAndName',
                email: normalizedEmail,
                existingName: existingUser.name,
                providedName: formattedName,
                candidateId: existingUser.candidate.id,
              });
            } else {
              await this.prisma.user.update({
                where: { id: existingUser.id },
                data: { name: formattedName },
              });
            }
          }

          const hasResume = !!existingUser.candidate.resume;
          const resumeParsed =
            hasResume &&
            existingUser.candidate.resume?.parsingTask?.status ===
              ResumeParsingTaskStatusEnum.COMPLETED;
          const resumeParsingStatus =
            existingUser.candidate.resume?.parsingTask?.status || undefined;

          logger.info('Using existing candidate', {
            context:
              'PublicPracticeAssessmentService.createOrGetCandidateFromEmailAndName',
            candidateId: existingUser.candidate.id,
            userId: existingUser.id,
            hasResume,
            resumeParsed,
          });

          return {
            candidateId: existingUser.candidate.id,
            userId: existingUser.id,
            isNewUser: false,
            isNewCandidate: false,
            requiresPasswordSetup: !existingUser.password,
            requiresEmailVerification: !existingUser.emailVerified,
            hasResume,
            resumeParsed,
            resumeParsingStatus,
          };
        } else {
          const candidate = await this.prisma.candidate.create({
            data: {
              userId: existingUser.id,
              status: CandidateStatusEnum.NEW,
              jobSearchStatus: JobSearchStatusEnum.OPEN_TO_OPPORTUNITIES,
              isPublished: false,
              completionPercentage: 0,
              isInviteSignup: false,
            },
          });

          // Create candidate settings
          const defaultSettings =
            await this.candidateProfileSettingsService.getDefaultSettings(
              candidate.id
            );
          await this.prisma.candidate_settings.create({
            data: {
              candidateId: candidate.id,
              globalSettingsId: defaultSettings.globalSettingsId,
              notificationsEnabled: defaultSettings.notificationsEnabled,
              emailNotifications: defaultSettings.emailNotifications,
              pushNotifications: defaultSettings.pushNotifications,
              jobAlerts: defaultSettings.jobAlerts,
              applicationUpdates: defaultSettings.applicationUpdates,
              profileVisibility: defaultSettings.profileVisibility,
              shareDataWithEmployers: defaultSettings.shareDataWithEmployers,
              darkMode: defaultSettings.darkMode,
              language: defaultSettings.language,
              timezone: defaultSettings.timezone,
              preferredCommunicationChannel:
                defaultSettings.preferredCommunicationChannel,
            },
          });

          logger.info('Created candidate profile for existing user', {
            context:
              'PublicPracticeAssessmentService.createOrGetCandidateFromEmailAndName',
            candidateId: candidate.id,
            userId: existingUser.id,
          });

          return {
            candidateId: candidate.id,
            userId: existingUser.id,
            isNewUser: false,
            isNewCandidate: true,
            requiresPasswordSetup: !existingUser.password,
            requiresEmailVerification: !existingUser.emailVerified,
            hasResume: false,
            resumeParsed: false,
          };
        }
      } else {
        // New user - create passwordless account
        const result = await this.prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              name: formattedName,
              email: normalizedEmail,
              password: null, // Passwordless
              type: 'CANDIDATE',
              role: 'INDIVIDUAL',
              status: 'ACTIVE',
              emailVerified: null,
            },
          });

          const candidate = await tx.candidate.create({
            data: {
              userId: user.id,
              status: CandidateStatusEnum.NEW,
              jobSearchStatus: JobSearchStatusEnum.OPEN_TO_OPPORTUNITIES,
              isPublished: false,
              completionPercentage: 0,
              isInviteSignup: false,
            },
          });

          // Create candidate settings
          const defaultSettings =
            await this.candidateProfileSettingsService.getDefaultSettings(
              candidate.id
            );
          await tx.candidate_settings.create({
            data: {
              candidateId: candidate.id,
              globalSettingsId: defaultSettings.globalSettingsId,
              notificationsEnabled: defaultSettings.notificationsEnabled,
              emailNotifications: defaultSettings.emailNotifications,
              pushNotifications: defaultSettings.pushNotifications,
              jobAlerts: defaultSettings.jobAlerts,
              applicationUpdates: defaultSettings.applicationUpdates,
              profileVisibility: defaultSettings.profileVisibility,
              shareDataWithEmployers: defaultSettings.shareDataWithEmployers,
              darkMode: defaultSettings.darkMode,
              language: defaultSettings.language,
              timezone: defaultSettings.timezone,
              preferredCommunicationChannel:
                defaultSettings.preferredCommunicationChannel,
            },
          });

          return { user, candidate };
        });

        logger.info('Created new user and candidate', {
          context:
            'PublicPracticeAssessmentService.createOrGetCandidateFromEmailAndName',
          candidateId: result.candidate.id,
          userId: result.user.id,
        });

        return {
          candidateId: result.candidate.id,
          userId: result.user.id,
          isNewUser: true,
          isNewCandidate: true,
          requiresPasswordSetup: true,
          requiresEmailVerification: true,
          hasResume: false,
          resumeParsed: false,
        };
      }
    } catch (error) {
      logger.error('Failed to create or get candidate', {
        context:
          'PublicPracticeAssessmentService.createOrGetCandidateFromEmailAndName',
        error: error instanceof Error ? error.message : 'Unknown error',
        email,
        name,
      });
      throw error;
    }
  }

  /**
   * Check if candidate exists by email and return candidate info
   * Used for pre-filling form data when email is entered
   */
  async checkCandidateByEmail(email: string): Promise<{
    exists: boolean;
    name?: string;
    hasResume: boolean;
    resumeParsed: boolean;
    userType?: string;
  }> {
    try {
      const normalizedEmail = formatEmail(email);

      logger.info('Checking candidate by email', {
        context: 'PublicPracticeAssessmentService.checkCandidateByEmail',
        email: normalizedEmail,
      });

      const existingUser = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: {
          candidate: {
            include: {
              resume: {
                include: {
                  parsingTask: true,
                },
              },
            },
          },
        },
      });

      if (!existingUser) {
        return {
          exists: false,
          hasResume: false,
          resumeParsed: false,
        };
      }

      // Check if user is not a candidate type
      if (
        existingUser.type === 'CLIENT' ||
        existingUser.type === 'SUPPORT' ||
        existingUser.type === 'PARTNER'
      ) {
        return {
          exists: true,
          hasResume: false,
          resumeParsed: false,
          userType: existingUser.type,
        };
      }

      // User is CANDIDATE type
      if (existingUser.candidate) {
        const hasResume = !!existingUser.candidate.resume;
        const resumeParsed =
          hasResume &&
          existingUser.candidate.resume?.parsingTask?.status ===
            ResumeParsingTaskStatusEnum.COMPLETED;

        return {
          exists: true,
          name: existingUser.name || undefined,
          hasResume,
          resumeParsed,
          userType: existingUser.type,
        };
      }

      // User exists but no candidate profile
      return {
        exists: true,
        name: existingUser.name || undefined,
        hasResume: false,
        resumeParsed: false,
        userType: existingUser.type,
      };
    } catch (error) {
      logger.error('Failed to check candidate by email', {
        context: 'PublicPracticeAssessmentService.checkCandidateByEmail',
        error: error instanceof Error ? error.message : 'Unknown error',
        email,
      });
      throw error;
    }
  }

  /**
   * Parse a job URL and store parsed data, return ID
   */
  async parseJobUrl(jobUrl: string): Promise<{ parsedJobDataId: string }> {
    try {
      logger.info('Parsing job URL', {
        context: 'PublicPracticeAssessmentService.parseJobUrl',
        jobUrl,
      });

      // Validate URL
      if (!this.isValidUrl(jobUrl)) {
        throw new AppError(
          'Invalid job URL provided',
          400,
          ErrorCode.INVALID_INPUT
        );
      }

      // Parse the job URL
      const parsedJob = await this.parseJobUrlInternal(jobUrl);

      // Store parsed data in database
      const storedData =
        await this.prisma.public_practice_parsed_job_data.create({
          data: {
            jobUrl,
            parsedData: parsedJob,
          },
        });

      logger.info('Job URL parsed and stored successfully', {
        context: 'PublicPracticeAssessmentService.parseJobUrl',
        jobUrl,
        parsedJobDataId: storedData.id,
        hasParsedJob: !!parsedJob,
      });

      return { parsedJobDataId: storedData.id };
    } catch (error) {
      logger.error('Failed to parse job URL', {
        context: 'PublicPracticeAssessmentService.parseJobUrl',
        error: error instanceof Error ? error.message : 'Unknown error',
        jobUrl,
      });
      throw error;
    }
  }

  /**
   * Parse a job description text and store parsed data, return ID
   */
  async parseJobDescription(
    jobDescriptionText: string
  ): Promise<{ parsedJobDataId: string }> {
    try {
      logger.info('Parsing job description text', {
        context: 'PublicPracticeAssessmentService.parseJobDescription',
        textLength: jobDescriptionText.length,
      });

      // Validate text
      if (!jobDescriptionText || jobDescriptionText.trim().length === 0) {
        throw new AppError(
          'Job description text is required',
          400,
          ErrorCode.INVALID_INPUT
        );
      }

      // Validate that the input is not a URL
      const trimmedText = jobDescriptionText.trim();
      if (this.isValidUrl(trimmedText)) {
        throw new AppError(
          'The provided text appears to be a URL. Please use the parseJobUrl endpoint for URLs, or provide the actual job description text.',
          400,
          ErrorCode.INVALID_INPUT
        );
      }

      // Parse the job description text
      const parsedJob = await this.parseJobDescriptionInternal(
        jobDescriptionText.trim()
      );

      const finalParsedData = {
        ...parsedJob, // Keep mode, confidenceScore, etc.
        parsedJob: {
          ...(parsedJob.parsedJob || {}),
          originalText: jobDescriptionText.trim(),
        },
      };

      logger.info('Storing parsed job data with original text', {
        context: 'PublicPracticeAssessmentService.parseJobDescription',
        hasParsedJob: !!parsedJob.parsedJob,
        hasOriginalText: !!finalParsedData.parsedJob.originalText,
        originalTextLength: finalParsedData.parsedJob.originalText.length,
        hasTitle: !!finalParsedData.parsedJob.title,
        hasDescription: !!finalParsedData.parsedJob.description,
        parsedJobKeys: Object.keys(parsedJob),
      });

      const storedData =
        await this.prisma.public_practice_parsed_job_data.create({
          data: {
            jobUrl: '', // No URL for text-based parsing
            parsedData: finalParsedData,
          },
        });

      logger.info('Job description text parsed and stored successfully', {
        context: 'PublicPracticeAssessmentService.parseJobDescription',
        parsedJobDataId: storedData.id,
        hasParsedJob: !!parsedJob,
      });

      return { parsedJobDataId: storedData.id };
    } catch (error) {
      logger.error('Failed to parse job description text', {
        context: 'PublicPracticeAssessmentService.parseJobDescription',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get parsed job data by ID
   */
  async getParsedJobData(
    parsedJobDataId: string
  ): Promise<{ jobUrl: string; parsedData: any }> {
    try {
      const storedData =
        await this.prisma.public_practice_parsed_job_data.findUnique({
          where: { id: parsedJobDataId },
        });

      if (!storedData) {
        throw new AppError(
          'Parsed job data not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      return {
        jobUrl: storedData.jobUrl,
        parsedData: storedData.parsedData as any,
      };
    } catch (error) {
      logger.error('Failed to get parsed job data', {
        context: 'PublicPracticeAssessmentService.getParsedJobData',
        error: error instanceof Error ? error.message : 'Unknown error',
        parsedJobDataId,
      });
      throw error;
    }
  }

  /**
   * Create a public practice assessment from parsed job data
   */
  async createFromParsedData(
    request: IPublicPracticeAssessmentCreate
  ): Promise<IPublicPracticeAssessmentWithMetadata> {
    try {
      logger.info('Creating public practice assessment from parsed data', {
        context: 'PublicPracticeAssessmentService.createFromParsedData',
        candidateEmail: request.candidateEmail,
      });

      if (!request.candidateEmail || !request.candidateEmail.trim()) {
        throw new AppError(
          'Email is required before proceeding with assessment creation',
          400,
          ErrorCode.INVALID_INPUT
        );
      }

      const normalizedEmail = formatEmail(request.candidateEmail);

      const existingCandidateCheck =
        await this.checkCandidateByEmail(normalizedEmail);

      if (existingCandidateCheck.exists) {
        if (existingCandidateCheck.userType !== 'CANDIDATE') {
          throw new AppError(
            `This email is already registered as a ${existingCandidateCheck.userType?.toLowerCase()} account. Please use a different email.`,
            400,
            ErrorCode.USER_TYPE_CONFLICT
          );
        }

        if (
          existingCandidateCheck.name &&
          request.candidateName &&
          existingCandidateCheck.name.trim() !==
            formatName(request.candidateName).trim()
        ) {
          throw new AppError(
            'The provided name does not match the existing account. Please use the correct name or contact support.',
            400,
            ErrorCode.INVALID_INPUT
          );
        }
      }

      const {
        candidateId,
        userId,
        isNewUser,
        isNewCandidate,
        requiresPasswordSetup,
        requiresEmailVerification: _requiresEmailVerification,
        hasResume,
        resumeParsed,
      } = await this.createOrGetCandidateFromEmailAndName(
        request.candidateEmail,
        request.candidateName
      );

      logger.info('Candidate created or retrieved', {
        context: 'PublicPracticeAssessmentService.createFromParsedData',
        candidateId,
        userId,
        isNewUser,
        isNewCandidate,
        hasResume,
        resumeParsed,
        requiresPasswordSetup,
      });

      let resumeText = '';

      if (request.resumeFile && request.resumeFileName) {
        // Ensure candidate has a resume record
        let candidate = await this.prisma.candidate.findUnique({
          where: { id: candidateId },
          include: { resume: true },
        });

        if (!candidate?.resume) {
          // Create initial resume for candidate
          await this.resumeService.createInitialResume(candidateId);
          logger.info('Created initial resume for candidate', {
            context: 'PublicPracticeAssessmentService.createFromParsedData',
            candidateId,
          });
        }

        // Upload resume file to candidate's resume record
        try {
          const parsingTask = await this.resumeParsingService.uploadResume(
            candidateId,
            request.resumeFile,
            request.resumeFileName,
            ResumeParsingMode.GENERATIVE
          );

          logger.info('Resume uploaded, waiting for parsing to complete', {
            context: 'PublicPracticeAssessmentService.createFromParsedData',
            taskId: parsingTask.id,
            candidateId,
          });

          // Wait for parsing to complete (poll up to 60 seconds)
          let attempts = 0;
          const maxAttempts = 60;
          const pollInterval = 1000; // 1 second

          while (attempts < maxAttempts) {
            const task = await this.resumeParsingService.getParsingTask(
              parsingTask.id
            );

            if (task.status === ResumeParsingTaskStatusEnum.COMPLETED) {
              logger.info('Resume parsing completed', {
                context: 'PublicPracticeAssessmentService.createFromParsedData',
                taskId: parsingTask.id,
                candidateId,
              });
              break;
            } else if (task.status === ResumeParsingTaskStatusEnum.FAILED) {
              const errorMessage =
                task.error ||
                'The resume file could not be parsed. Please ensure your resume is a valid PDF file with readable content.';
              throw new AppError(
                errorMessage,
                400,
                ErrorCode.PARSING_TASK_NOT_COMPLETED_OR_FAILED
              );
            }

            // Wait before next poll
            await new Promise((resolve) => setTimeout(resolve, pollInterval));
            attempts++;
          }

          if (attempts >= maxAttempts) {
            throw new AppError(
              'Resume parsing timed out. Please try uploading your resume again or contact support if the issue persists.',
              408,
              ErrorCode.SERVICE_UNAVAILABLE
            );
          }

          // Get resume text from candidate's resume (now that it's parsed and stored in DB)
          candidate = await this.prisma.candidate.findUnique({
            where: { id: candidateId },
            include: { resume: true },
          });

          if (candidate?.resume) {
            try {
              resumeText = await generateResumeText(
                this.prisma,
                candidate.resume.id
              );
              logger.info('Generated resume text from candidate resume', {
                context: 'PublicPracticeAssessmentService.createFromParsedData',
                candidateId,
                resumeId: candidate.resume.id,
                resumeTextLength: resumeText.length,
              });

              // Validate resume text is meaningful
              const trimmedResumeText = resumeText.trim();
              const MIN_RESUME_TEXT_LENGTH = 100; // Minimum 100 characters for a meaningful resume

              if (
                !trimmedResumeText ||
                trimmedResumeText.length < MIN_RESUME_TEXT_LENGTH
              ) {
                throw new AppError(
                  'The uploaded resume appears to be blank or corrupted. Please upload a valid resume file with readable content (minimum 100 characters).',
                  400,
                  ErrorCode.INVALID_INPUT
                );
              }
            } catch (error) {
              if (error instanceof AppError) {
                throw error;
              }

              logger.error('Failed to generate or validate resume text', {
                context: 'PublicPracticeAssessmentService.createFromParsedData',
                error: error instanceof Error ? error.message : 'Unknown error',
                candidateId,
                resumeId: candidate.resume.id,
              });
              throw new AppError(
                'The resume file could not be processed. Please ensure your resume is a valid PDF file with readable content.',
                400,
                ErrorCode.PARSING_TASK_NOT_COMPLETED_OR_FAILED
              );
            }
          } else {
            throw new AppError(
              'Resume record not found after parsing. Please try uploading your resume again.',
              500,
              ErrorCode.INTERNAL_SERVER_ERROR
            );
          }
        } catch (error) {
          logger.error('Failed to upload or parse resume', {
            context: 'PublicPracticeAssessmentService.createFromParsedData',
            error: error instanceof Error ? error.message : 'Unknown error',
            candidateId,
          });
          throw error;
        }
      } else if (request.resumeParsingTaskId) {
        // Legacy: Get parsed resume from public parsing task
        try {
          const parsedResume =
            await this.resumeParsingService.getParsedResumeFromPublicTask(
              request.resumeParsingTaskId
            );

          if (parsedResume && parsedResume.parsedResume) {
            resumeText = generateResumeTextFromParsedResume(
              parsedResume.parsedResume
            );

            // Validate resume text is meaningful
            const trimmedResumeText = resumeText.trim();
            const MIN_RESUME_TEXT_LENGTH = 100; // Minimum 100 characters for a meaningful resume

            if (
              !trimmedResumeText ||
              trimmedResumeText.length < MIN_RESUME_TEXT_LENGTH
            ) {
              throw new AppError(
                'The uploaded resume appears to be blank or corrupted. Please upload a valid resume file with readable content (minimum 100 characters).',
                400,
                ErrorCode.INVALID_INPUT
              );
            }
          } else {
            throw new AppError(
              'The resume file could not be parsed. Please ensure your resume is a valid PDF file with readable content.',
              400,
              ErrorCode.PARSING_TASK_NOT_COMPLETED_OR_FAILED
            );
          }
        } catch (error) {
          logger.error('Failed to get parsed resume from public task', {
            context: 'PublicPracticeAssessmentService.createFromParsedData',
            error: error instanceof Error ? error.message : 'Unknown error',
            taskId: request.resumeParsingTaskId,
            candidateId,
          });
          throw error;
        }
      }

      // If resume text is still empty, try to get from existing candidate resume
      // This handles the case where candidate has existing parsed resume but no file was uploaded
      if (!resumeText && hasResume && resumeParsed) {
        const candidate = await this.prisma.candidate.findUnique({
          where: { id: candidateId },
          include: { resume: true },
        });

        if (candidate?.resume) {
          try {
            resumeText = await generateResumeText(
              this.prisma,
              candidate.resume.id
            );
            logger.info('Using existing parsed resume (no file uploaded)', {
              context: 'PublicPracticeAssessmentService.createFromParsedData',
              candidateId,
              resumeId: candidate.resume.id,
              resumeTextLength: resumeText.length,
            });

            // Validate resume text is meaningful
            const trimmedResumeText = resumeText.trim();
            const MIN_RESUME_TEXT_LENGTH = 100; // Minimum 100 characters for a meaningful resume

            if (
              !trimmedResumeText ||
              trimmedResumeText.length < MIN_RESUME_TEXT_LENGTH
            ) {
              logger.warn('Existing resume text is too short or empty', {
                context: 'PublicPracticeAssessmentService.createFromParsedData',
                candidateId,
                resumeId: candidate.resume.id,
                resumeTextLength: trimmedResumeText.length,
              });
              resumeText = '';
            }
          } catch (error) {
            logger.warn('Failed to generate resume text from existing resume', {
              context: 'PublicPracticeAssessmentService.createFromParsedData',
              error: error instanceof Error ? error.message : 'Unknown error',
              candidateId,
              resumeId: candidate.resume.id,
            });
            resumeText = '';
          }
        }
      }

      let parsedJobData: any;
      let sourceJobUrl: string;

      // Check if parsedJobDataId is provided, if so fetch from database
      if (request.parsedJobDataId) {
        const storedData = await this.getParsedJobData(request.parsedJobDataId);
        parsedJobData = storedData.parsedData;
        sourceJobUrl = storedData.jobUrl;
      } else if (request.parsedJobData) {
        // Support legacy format with parsedJobData directly
        parsedJobData = request.parsedJobData;
        sourceJobUrl = request.parsedJobData.sourceJobUrl || '';
      } else {
        throw new AppError(
          'Either parsedJobDataId or parsedJobData must be provided',
          400,
          ErrorCode.INVALID_INPUT
        );
      }

      // Extract parsedJob from the data structure
      const jobData = parsedJobData.parsedJob || parsedJobData;

      const jobDescriptionText =
        this.generateJobDescriptionTextFromParsedData(jobData);

      logger.info('Generated job description text for assessment', {
        context: 'PublicPracticeAssessmentService.createFromParsedData',
        hasOriginalText: !!jobData.originalText,
        jobDescriptionTextLength: jobDescriptionText.length,
        hasTitle: !!jobData.title,
        hasDescription: !!jobData.description,
        parsedDataKeys: Object.keys(parsedJobData),
        jobDataKeys: Object.keys(jobData),
      });

      // Validate that we have job description text
      if (!jobDescriptionText || jobDescriptionText.trim().length === 0) {
        logger.error('Generated job description text is empty', {
          context: 'PublicPracticeAssessmentService.createFromParsedData',
          parsedJobDataStructure: {
            hasParsedJob: !!parsedJobData.parsedJob,
            topLevelKeys: Object.keys(parsedJobData),
            jobDataKeys: Object.keys(jobData),
          },
        });
        throw new AppError(
          'Failed to generate job description text from parsed data',
          500,
          ErrorCode.INTERNAL_SERVER_ERROR
        );
      }

      // Get global practice assessment settings for default duration
      const globalSettingsDb =
        await this.prisma.global_practice_assessment_settings.findFirst({
          where: { isSingleton: true },
        });

      const globalSettings = globalSettingsDb
        ? toGlobalPracticeAssessmentSettingsDomain(globalSettingsDb)
        : null;

      const defaultDuration = globalSettings?.defaultAssessmentDuration || 3600; // Default to 1 hour if settings not found

      // 3. Create public practice assessment with candidateId (required)
      const assessment = await this.prisma.public_practice_assessment.create({
        data: {
          candidateId, // Required, not optional
          title: jobData.title || 'Practice Assessment',
          description:
            jobData.description ||
            'Practice assessment based on job posting requirements',
          skillsFocus: [
            ...(jobData.requiredSkills || []),
            ...(jobData.preferredSkills || []),
          ],
          difficulty: DifficultyLevelEnum.MEDIUM,
          status: PublicPracticeAssessmentStatusEnum.NOT_STARTED,
          result: PublicPracticeAssessmentResultEnum.NOT_AVAILABLE,
          score: 0,
          duration: defaultDuration, // Use global settings duration
          sourceJobUrl: jobData.sourceUrl || sourceJobUrl || '',
          candidateEmail: request.candidateEmail, // Keep for reference
          candidateName: request.candidateName, // Keep for reference
          jobDescriptionText,
          resumeText, // Use actual resume if available
        },
      });

      // Create task for AI initialization
      const task = await this.prisma.public_practice_assessment_task.create({
        data: {
          assessmentId: assessment.id,
          status: PublicPracticeAssessmentTaskStatusEnum.PENDING,
          resumeText,
          jobDescriptionText,
        },
      });

      logger.info('Created public practice assessment', {
        context: 'PublicPracticeAssessmentService.createFromParsedData',
        assessmentId: assessment.id,
        taskId: task.id,
        requiresPasswordSetup,
        hasResume,
        resumeParsed,
      });

      // Note: Initialization is NOT queued here - it will be triggered when user clicks "I am ready"
      // This matches the job AI assessment flow

      const assessmentData = this.toPublicPracticeAssessment(assessment);

      // Return assessment with metadata
      const result: IPublicPracticeAssessmentWithMetadata = {
        ...assessmentData,
        _metadata: {
          requiresPasswordSetup,
          hasResume,
          resumeParsed,
        },
      };
      return result;
    } catch (error) {
      logger.error('Failed to create public practice assessment', {
        context: 'PublicPracticeAssessmentService.createFromParsedData',
        error: error instanceof Error ? error.message : 'Unknown error',
        request,
      });
      throw error;
    }
  }

  /**
   * Start background process initialize task (called by queue processor)
   */
  async startBackgroundProcessInitializeTask(
    assessmentId: string
  ): Promise<void> {
    const assessment = await this.prisma.public_practice_assessment.findUnique({
      where: { id: assessmentId },
      include: {
        task: true,
        sections: {
          include: { questions: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!assessment) {
      throw new AppError('Assessment not found', 404, ErrorCode.NOT_FOUND);
    }

    if (!assessment.task) {
      throw new AppError('Assessment task not found', 404, ErrorCode.NOT_FOUND);
    }

    logger.info('Starting background process initialize task', {
      context:
        'PublicPracticeAssessmentService.startBackgroundProcessInitializeTask',
      assessmentId,
    });

    await this.backgroundProcessInitializeTask(assessment);
  }

  /**
   * Initialize assessment with AI using the Practice Assessment Provider
   */
  private async backgroundProcessInitializeTask(
    assessment: any
  ): Promise<void> {
    const assessmentId = assessment.id;
    const taskId = assessment.task.id;
    try {
      // Get the assessment with task
      const assessment =
        await this.prisma.public_practice_assessment.findUnique({
          where: { id: assessmentId },
          include: {
            task: true,
          },
        });

      if (!assessment || !assessment.task) {
        throw new AppError(
          'Assessment or task not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Log job description text availability for debugging
      logger.info('Initializing assessment with job description', {
        context:
          'PublicPracticeAssessmentService.backgroundProcessInitializeTask',
        assessmentId,
        taskId,
        hasJobDescriptionText: !!assessment.jobDescriptionText,
        jobDescriptionTextLength: assessment.jobDescriptionText?.length || 0,
        hasResumeText: !!assessment.resumeText,
        resumeTextLength: assessment.resumeText?.length || 0,
      });

      // Update status to initialization in progress
      await this.prisma.public_practice_assessment.update({
        where: { id: assessmentId },
        data: {
          status:
            PublicPracticeAssessmentStatusEnum.AI_INITIALIZATION_IN_PROGRESS,
        },
      });

      await this.prisma.public_practice_assessment_task.update({
        where: { id: taskId },
        data: {
          status: PublicPracticeAssessmentTaskStatusEnum.PROCESSING,
        },
      });

      // Fetch global practice assessment settings for configuration
      const globalSettingsDb =
        await this.prisma.global_practice_assessment_settings.findFirst({
          where: { isSingleton: true },
        });

      if (!globalSettingsDb) {
        throw new AppError(
          'Global practice assessment settings not found',
          500,
          ErrorCode.INTERNAL_SERVER_ERROR
        );
      }

      const globalSettings =
        toGlobalPracticeAssessmentSettingsDomain(globalSettingsDb);

      // NO onboarding assessment data is used
      await this.practiceAssessmentProvider.initializeAssessment(
        taskId,
        assessment.resumeText || '',
        assessment.jobDescriptionText || '',
        {
          maxSections: globalSettings.maxSections || 3,
          maxQuestionsPerSection: globalSettings.maxQuestionsPerSection || 5,
          requiredSections: (globalSettings.requiredSections as string[]) || [
            'TECHNICAL',
            'BEHAVIORAL',
          ],
          defaultPassingScore: globalSettings.defaultPassingScore || 0.7,
          defaultAssessmentDuration:
            globalSettings.defaultAssessmentDuration || 3600,
        }
      );

      // Get the initialized assessment from provider
      const aiTask =
        await this.practiceAssessmentProvider.getPracticeAssessmentTask(taskId);

      // Validate that sections exist (questions are generated on-demand)
      if (
        !aiTask.assessment.sections ||
        aiTask.assessment.sections.length === 0
      ) {
        throw new AppError(
          'No sections generated for assessment',
          500,
          ErrorCode.INTERNAL_SERVER_ERROR
        );
      }

      const proctoringEnabled = globalSettings.proctoringEnabled ?? true;
      const videoRecordingEnabled =
        globalSettings.videoRecordingEnabled ?? true;
      const aiVideoAnalysisEnabled =
        globalSettings.aiVideoAnalysisEnabled ?? true;

      logger.info('Creating/updating public practice assessment settings', {
        context:
          'PublicPracticeAssessmentService.backgroundProcessInitializeTask',
        assessmentId,
        proctoringEnabled,
        videoRecordingEnabled,
        aiVideoAnalysisEnabled,
        globalProctoringEnabled: globalSettings.proctoringEnabled,
        globalVideoRecordingEnabled: globalSettings.videoRecordingEnabled,
        globalAiVideoAnalysisEnabled: globalSettings.aiVideoAnalysisEnabled,
      });

      await this.prisma.public_practice_assessment_settings.upsert({
        where: { assessmentId },
        create: {
          id: uuidv4(),
          assessmentId,
          globalSettingsId: globalSettings.id,
          greetingMessage: globalSettings.greetingMessage || '',
          defaultAssessmentDuration:
            globalSettings.defaultAssessmentDuration || 3600,
          maxSections: globalSettings.maxSections || 3,
          maxQuestionsPerSection: globalSettings.maxQuestionsPerSection || 5,
          proctoringEnabled,
          maxWarnings: globalSettings.maxWarnings || 3,
          tabSwitchLimit: globalSettings.tabSwitchLimit || 3,
          copyPasteAllowed: globalSettings.copyPasteAllowed ?? false,
          videoRecordingEnabled,
          minimumVideoLength: globalSettings.minimumVideoLength || 0,
          aiVideoAnalysisEnabled,
          interviewLanguage: globalSettings.interviewLanguage || 'ENGLISH',
          interviewDialect: globalSettings.interviewDialect || 'en-US',
          interviewVoiceGender: globalSettings.interviewVoiceGender || 'female',
        },
        update: {
          globalSettingsId: globalSettings.id,
          greetingMessage: globalSettings.greetingMessage || '',
          defaultAssessmentDuration:
            globalSettings.defaultAssessmentDuration || 3600,
          maxSections: globalSettings.maxSections || 3,
          maxQuestionsPerSection: globalSettings.maxQuestionsPerSection || 5,
          proctoringEnabled,
          maxWarnings: globalSettings.maxWarnings || 3,
          tabSwitchLimit: globalSettings.tabSwitchLimit || 3,
          copyPasteAllowed: globalSettings.copyPasteAllowed ?? false,
          videoRecordingEnabled,
          minimumVideoLength: globalSettings.minimumVideoLength || 0,
          aiVideoAnalysisEnabled,
          interviewLanguage: globalSettings.interviewLanguage || 'ENGLISH',
          interviewDialect: globalSettings.interviewDialect || 'en-US',
          interviewVoiceGender: globalSettings.interviewVoiceGender || 'female',
        },
      });

      // Update assessment with generated sections
      await this.prisma.public_practice_assessment.update({
        where: { id: assessmentId },
        data: {
          status:
            PublicPracticeAssessmentStatusEnum.AI_INITIALIZATION_COMPLETED,
          sections: {
            create: aiTask.assessment.sections.map((section: any) => ({
              id: section.id || uuidv4(),
              title: section.title,
              description: section.description,
              type: section.type,
              status: PublicPracticeAssessmentSectionStatusEnum.NOT_STARTED,
              result: PublicPracticeAssessmentSectionResultEnum.NOT_AVAILABLE,
              score: 0,
              order: section.order,
              passThreshold: section.passThreshold || 0.7,
              isRequired: section.isRequired !== false,
              strengths: section.strengths || [],
              areasForImprovement: section.areasForImprovement || [],
              questions: {
                create:
                  section.questions?.map((question: any) => ({
                    id: question.id || uuidv4(),
                    question: question.question,
                    questionType: question.questionType,
                    options: question.options,
                    correctAnswer: question.correctAnswer,
                    score: 0,
                    maxScore: question.maxScore || 1.0,
                    order: question.order,
                    isRequired: question.isRequired !== false,
                    isLastQuestion: question.isLastQuestion || false,
                    isAnswered: false,
                  })) || [],
              },
            })),
          },
        },
      });

      // Update task status
      await this.prisma.public_practice_assessment_task.update({
        where: { id: taskId },
        data: {
          status: PublicPracticeAssessmentTaskStatusEnum.COMPLETED,
        },
      });

      logger.info('Initialized assessment with AI', {
        context:
          'PublicPracticeAssessmentService.backgroundProcessInitializeTask',
        assessmentId,
        taskId,
        sectionsCount: aiTask.assessment.sections.length,
      });
    } catch (error) {
      logger.error('Failed to initialize assessment with AI', {
        context:
          'PublicPracticeAssessmentService.backgroundProcessInitializeTask',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessmentId,
        taskId,
      });

      // Update status to failed
      await this.prisma.public_practice_assessment.update({
        where: { id: assessmentId },
        data: {
          status: PublicPracticeAssessmentStatusEnum.FAILED,
        },
      });

      await this.prisma.public_practice_assessment_task.update({
        where: { id: taskId },
        data: {
          status: PublicPracticeAssessmentTaskStatusEnum.FAILED,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Generate job description text from parsed job data
   * Uses original text if available (for text-based parsing), otherwise generates from structured fields
   */
  private generateJobDescriptionTextFromParsedData(jobData: any): string {
    if (jobData.originalText && typeof jobData.originalText === 'string') {
      logger.info('Using original text from parsed job data', {
        context:
          'PublicPracticeAssessmentService.generateJobDescriptionTextFromParsedData',
        originalTextLength: jobData.originalText.length,
      });
      return jobData.originalText;
    }

    logger.info('Generating job description from structured fields', {
      context:
        'PublicPracticeAssessmentService.generateJobDescriptionTextFromParsedData',
      hasTitle: !!jobData.title,
      hasDescription: !!jobData.description,
      hasRequiredSkills: !!jobData.requiredSkills?.length,
      hasPreferredSkills: !!jobData.preferredSkills?.length,
    });

    // Otherwise, generate from structured fields (for URL-based parsing)
    const parts: string[] = [];

    if (jobData.title) parts.push(`Title: ${jobData.title}`);
    if (jobData.description) parts.push(`Description: ${jobData.description}`);
    if (jobData.department) parts.push(`Department: ${jobData.department}`);
    if (jobData.responsibilities?.length > 0) {
      parts.push(`Responsibilities: ${jobData.responsibilities.join(', ')}`);
    }
    if (jobData.requiredSkills?.length > 0) {
      parts.push(`Required Skills: ${jobData.requiredSkills.join(', ')}`);
    }
    if (jobData.preferredSkills?.length > 0) {
      parts.push(`Preferred Skills: ${jobData.preferredSkills.join(', ')}`);
    }
    if (jobData.benefits?.length > 0) {
      parts.push(`Benefits: ${jobData.benefits.join(', ')}`);
    }

    if (parts.length > 0) {
      return parts.join('\n\n');
    }

    if (jobData.description) {
      return jobData.description;
    }

    return '';
  }

  /**
   * Parse job description text using the job parser (internal method)
   */
  private async parseJobDescriptionInternal(
    jobDescriptionText: string
  ): Promise<any> {
    try {
      // Create a temporary public parsing task
      const taskId = uuidv4();

      const textBuffer = Buffer.from(jobDescriptionText, 'utf-8');
      const base64Text = textBuffer.toString('base64');
      const dataUrl = `data:text/plain;base64,${base64Text}`;

      // Use the job parser provider to parse the data URL
      const parsingTask = await this.jobParserProvider.parse(
        taskId,
        dataUrl,
        JobParsingMode.GENERATIVE
      );

      // Wait for parsing to complete (with timeout)
      const maxWaitTime = 60000; // 60 seconds
      const startTime = Date.now();
      let task = parsingTask;

      while (
        task.status !== 'COMPLETED' &&
        task.status !== 'FAILED' &&
        Date.now() - startTime < maxWaitTime
      ) {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
        task = await this.jobParserProvider.getParsingTask(taskId);
      }

      if (task.status === 'FAILED') {
        throw new AppError(
          'Failed to parse job description',
          400,
          ErrorCode.PARSING_TASK_NOT_COMPLETED
        );
      }

      if (task.status !== 'COMPLETED') {
        throw new AppError(
          'Job parsing timed out',
          408,
          ErrorCode.SERVICE_UNAVAILABLE
        );
      }

      // Get parsed job data
      const parsedJob = await this.jobParserProvider.getParsedJob(taskId);

      return parsedJob;
    } catch (error) {
      logger.error('Failed to parse job description text', {
        context: 'PublicPracticeAssessmentService.parseJobDescriptionInternal',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Check if this is a network-related error
      const isNetworkError = this.isNetworkRelatedError(error);
      if (isNetworkError) {
        throw new AppError(
          'Network error: Unable to connect to the service. Please check your internet connection and try again.',
          503, // Service Unavailable - indicates network/connectivity issue
          ErrorCode.SERVICE_UNAVAILABLE
        );
      }

      throw error;
    }
  }

  /**
   * Check if an error is network-related
   */
  private isNetworkRelatedError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    const errorMessage = error.message.toLowerCase();
    const errorName = error.name?.toLowerCase() || '';

    // Network error indicators
    const networkErrorIndicators = [
      'fetch failed',
      'network request failed',
      'networkerror',
      'econnrefused',
      'enotfound',
      'econnaborted',
      'econnreset',
      'exception posting request',
      'connection refused',
      'connection reset',
      'connection aborted',
      'connection closed',
      'timeout',
      'etimedout',
      'googlegenerativeaierror',
      'vertexai',
    ];

    // Check error message and name
    const hasNetworkIndicator = networkErrorIndicators.some(
      (indicator) =>
        errorMessage.includes(indicator) || errorName.includes(indicator)
    );

    if (hasNetworkIndicator) {
      return true;
    }

    // Check error cause chain (for nested errors)
    const errorAny = error as any;
    if (errorAny.cause) {
      if (errorAny.cause instanceof Error) {
        return this.isNetworkRelatedError(errorAny.cause);
      }
      if (errorAny.cause.message) {
        const causeMsg = errorAny.cause.message.toLowerCase();
        return networkErrorIndicators.some((indicator) =>
          causeMsg.includes(indicator)
        );
      }
    }

    return false;
  }

  /**
   * Parse job URL using the job parser (internal method)
   */
  private async parseJobUrlInternal(jobUrl: string): Promise<any> {
    try {
      const taskId = uuidv4();

      // Use the job parser provider to parse the URL
      const parsingTask = await this.jobParserProvider.parse(
        taskId,
        jobUrl,
        JobParsingMode.GENERATIVE
      );

      // Wait for parsing to complete (with timeout)
      const maxWaitTime = 60000; // 60 seconds
      const startTime = Date.now();
      let task = parsingTask;

      while (
        task.status !== 'COMPLETED' &&
        task.status !== 'FAILED' &&
        Date.now() - startTime < maxWaitTime
      ) {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
        task = await this.jobParserProvider.getParsingTask(taskId);
      }

      if (task.status === 'FAILED') {
        throw new AppError(
          'Failed to parse job URL',
          400,
          ErrorCode.PARSING_TASK_NOT_COMPLETED
        );
      }

      if (task.status !== 'COMPLETED') {
        throw new AppError(
          'Job parsing timed out',
          408,
          ErrorCode.SERVICE_UNAVAILABLE
        );
      }

      // Get parsed job data
      const parsedJob = await this.jobParserProvider.getParsedJob(taskId);

      return parsedJob;
    } catch (error) {
      logger.error('Failed to parse job URL', {
        context: 'PublicPracticeAssessmentService.parseJobUrl',
        error: error instanceof Error ? error.message : 'Unknown error',
        jobUrl,
      });

      // Check if this is a network-related error
      const isNetworkError = this.isNetworkRelatedError(error);
      if (isNetworkError) {
        throw new AppError(
          'Network error: Unable to connect to the service. Please check your internet connection and try again.',
          503, // Service Unavailable - indicates network/connectivity issue
          ErrorCode.SERVICE_UNAVAILABLE
        );
      }

      throw error;
    }
  }

  /**
   * Get a public practice assessment by ID
   */
  async getPublicPracticeAssessment(
    assessmentId: string
  ): Promise<IPublicPracticeAssessment> {
    try {
      const assessment =
        await this.prisma.public_practice_assessment.findUnique({
          where: { id: assessmentId },
          include: {
            sections: {
              include: {
                questions: {
                  orderBy: {
                    order: 'asc',
                  },
                },
              },
              orderBy: {
                order: 'asc',
              },
            },
            progressState: true,
            proctoring: true,
            settings: true,
          },
        });

      if (!assessment) {
        throw new AppError(
          'Practice assessment not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      return this.toPublicPracticeAssessment(assessment);
    } catch (error) {
      logger.error('Failed to get public practice assessment', {
        context: 'PublicPracticeAssessmentService.getPublicPracticeAssessment',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessmentId,
      });
      throw error;
    }
  }

  /**
   * Link a public practice assessment to a candidate after signup/login
   */
  async linkToCandidate(
    assessmentId: string,
    candidateId: string
  ): Promise<IPublicPracticeAssessment> {
    try {
      const assessment =
        await this.prisma.public_practice_assessment.findUnique({
          where: { id: assessmentId },
        });

      if (!assessment) {
        throw new AppError(
          'Practice assessment not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      if (assessment.candidateId) {
        throw new AppError(
          'Assessment is already linked to a candidate',
          400,
          ErrorCode.INVALID_INPUT
        );
      }

      // Verify candidate exists
      const candidate = await this.prisma.candidate.findUnique({
        where: { id: candidateId },
        include: {
          user: true,
        },
      });

      if (!candidate) {
        throw new AppError('Candidate not found', 404, ErrorCode.NOT_FOUND);
      }

      // Verify email matches
      if (candidate.user.email !== assessment.candidateEmail) {
        throw new AppError(
          'Email does not match the assessment candidate email',
          403,
          ErrorCode.FORBIDDEN
        );
      }

      // Link assessment to candidate
      const updatedAssessment =
        await this.prisma.public_practice_assessment.update({
          where: { id: assessmentId },
          data: {
            candidateId,
            linkedAt: new Date(),
          },
        });

      logger.info('Linked public practice assessment to candidate', {
        context: 'PublicPracticeAssessmentService.linkToCandidate',
        assessmentId,
        candidateId,
      });

      return this.toPublicPracticeAssessment(updatedAssessment);
    } catch (error) {
      logger.error('Failed to link assessment to candidate', {
        context: 'PublicPracticeAssessmentService.linkToCandidate',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessmentId,
        candidateId,
      });
      throw error;
    }
  }

  /**
   * Get public practice assessments by email (for linking after signup)
   */
  async getByEmail(email: string): Promise<IPublicPracticeAssessment[]> {
    try {
      const assessments = await this.prisma.public_practice_assessment.findMany(
        {
          where: {
            candidateEmail: email,
            candidateId: null, // Not yet linked
          },
          orderBy: {
            createdAt: 'desc',
          },
        }
      );

      return assessments.map(this.toPublicPracticeAssessment);
    } catch (error) {
      logger.error('Failed to get public practice assessments by email', {
        context: 'PublicPracticeAssessmentService.getByEmail',
        error: error instanceof Error ? error.message : 'Unknown error',
        email,
      });
      throw error;
    }
  }

  /**
   * Get all public practice assessments for a candidate with pagination
   * Requires authentication - candidate must be logged in
   */
  async getPracticeAssessmentsForCandidate(
    candidateId: string,
    paginationRequest: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<{
    items: IPublicPracticeAssessment[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    try {
      const page = paginationRequest.page || 1;
      const limit = paginationRequest.limit || 10;
      const skip = (page - 1) * limit;
      const sortBy = paginationRequest.sortBy || 'createdAt';
      const sortOrder = paginationRequest.sortOrder || 'desc';

      logger.info('Getting practice assessments for candidate', {
        context:
          'PublicPracticeAssessmentService.getPracticeAssessmentsForCandidate',
        candidateId,
        page,
        limit,
        sortBy,
        sortOrder,
      });

      const where = {
        candidateId,
        status: {
          in: [
            PublicPracticeAssessmentStatusEnum.COMPLETED,
            PublicPracticeAssessmentStatusEnum.AI_REVIEW_COMPLETED,
            PublicPracticeAssessmentStatusEnum.AI_REVIEW_IN_PROGRESS,
          ],
        },
      };

      // Get total count
      const total = await this.prisma.public_practice_assessment.count({
        where,
      });

      // Get assessments with related data
      const assessments = await this.prisma.public_practice_assessment.findMany(
        {
          where,
          skip,
          take: limit,
          orderBy: {
            [sortBy]: sortOrder,
          },
          include: {
            sections: {
              include: {
                questions: {
                  orderBy: {
                    order: 'asc',
                  },
                },
              },
              orderBy: {
                order: 'asc',
              },
            },
            progressState: true,
            proctoring: true,
            settings: true,
            videoAnalysis: true,
          },
        }
      );

      const totalPages = Math.ceil(total / limit);

      return {
        items: assessments.map((assessment) =>
          this.toPublicPracticeAssessment(assessment)
        ),
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      logger.error('Failed to get practice assessments for candidate', {
        context:
          'PublicPracticeAssessmentService.getPracticeAssessmentsForCandidate',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        paginationRequest,
      });
      throw error;
    }
  }

  /**
   * Get public practice assessment task
   */
  async getTask(assessmentId: string): Promise<any> {
    try {
      const assessment =
        await this.prisma.public_practice_assessment.findUnique({
          where: { id: assessmentId },
          include: {
            task: true,
            settings: true,
            sections: {
              include: {
                questions: true,
              },
            },
          },
        });

      if (!assessment) {
        throw new AppError(
          'Practice assessment not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      if (!assessment.task) {
        throw new AppError(
          'Assessment task not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      return {
        id: assessment.task.id,
        status: assessment.task.status,
        assessment: this.toPublicPracticeAssessment(assessment),
      };
    } catch (error) {
      logger.error('Failed to get assessment task', {
        context: 'PublicPracticeAssessmentService.getTask',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessmentId,
      });
      throw error;
    }
  }

  /**
   * Initialize public practice assessment (matches job AI assessment flow)
   * Called when user clicks "I am ready" on check page
   */
  async initialize(assessmentId: string): Promise<any> {
    try {
      logger.info('Initializing public practice assessment', {
        context: 'PublicPracticeAssessmentService.initialize',
        assessmentId,
      });

      const assessment =
        await this.prisma.public_practice_assessment.findUnique({
          where: { id: assessmentId },
          include: {
            task: true,
            candidate: {
              include: {
                resume: true,
              },
            },
          },
        });

      if (!assessment) {
        throw new AppError(
          'Practice assessment not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      if (!assessment.candidateId) {
        throw new AppError(
          'Assessment is not linked to a candidate',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      // Check if task exists, if not create it
      let task = assessment.task;
      if (!task) {
        // Get resume and job description text
        let resumeText = '';
        if (assessment.candidate?.resume) {
          try {
            resumeText = await generateResumeText(
              this.prisma,
              assessment.candidate.resume.id
            );
          } catch (error) {
            logger.warn('Failed to generate resume text', {
              context: 'PublicPracticeAssessmentService.initialize',
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        const jobDescriptionText = assessment.jobDescriptionText || '';

        task = await this.prisma.public_practice_assessment_task.create({
          data: {
            assessmentId: assessment.id,
            status: PublicPracticeAssessmentTaskStatusEnum.PENDING,
            resumeText,
            jobDescriptionText,
          },
        });

        logger.info('Created assessment task', {
          context: 'PublicPracticeAssessmentService.initialize',
          assessmentId,
          taskId: task.id,
        });
      } else {
        // Task exists - check if already initialized
        if (
          task.status === PublicPracticeAssessmentTaskStatusEnum.COMPLETED ||
          task.status === PublicPracticeAssessmentTaskStatusEnum.PROCESSING
        ) {
          // Already initialized or in progress, return existing task
          logger.info('Assessment already initialized or in progress', {
            context: 'PublicPracticeAssessmentService.initialize',
            assessmentId,
            taskStatus: task.status,
          });

          return {
            id: task.id,
            status: task.status,
            assessment: this.toPublicPracticeAssessment(assessment),
          };
        }

        // Reset task to PENDING if it was failed
        if (task.status === PublicPracticeAssessmentTaskStatusEnum.FAILED) {
          await this.prisma.public_practice_assessment_task.update({
            where: { id: task.id },
            data: {
              status: PublicPracticeAssessmentTaskStatusEnum.PENDING,
              error: null,
            },
          });
          task.status = PublicPracticeAssessmentTaskStatusEnum.PENDING;
        }
      }

      // Queue AI initialization job
      await this.publicPracticeAssessmentProcessor.addInitializeJob(
        assessment.id
      );

      logger.info('Initialization job queued', {
        context: 'PublicPracticeAssessmentService.initialize',
        assessmentId,
        taskId: task.id,
      });

      // Get complete task with assessment
      const completeTask = await this.getTask(assessmentId);

      return completeTask;
    } catch (error) {
      logger.error('Failed to initialize public practice assessment', {
        context: 'PublicPracticeAssessmentService.initialize',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessmentId,
      });
      throw error;
    }
  }

  /**
   * Start a public practice assessment
   */
  async startAssessment(
    assessmentId: string
  ): Promise<IPublicPracticeAssessment> {
    try {
      const assessment =
        await this.prisma.public_practice_assessment.findUnique({
          where: { id: assessmentId },
          include: {
            task: true,
            sections: {
              include: {
                questions: true,
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
        });

      if (!assessment) {
        throw new AppError(
          'Practice assessment not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Validate candidateId exists
      if (!assessment.candidateId) {
        throw new AppError(
          'Assessment is not linked to a candidate',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      // Check if assessment is ready to start
      if (
        assessment.status !==
        PublicPracticeAssessmentStatusEnum.AI_INITIALIZATION_COMPLETED
      ) {
        throw new AppError(
          'Assessment is not ready to start',
          400,
          ErrorCode.ASSESSMENT_NOT_READY
        );
      }

      if (!assessment.task) {
        throw new AppError(
          'Assessment task not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Validate sections exist
      if (!assessment.sections || assessment.sections.length === 0) {
        throw new AppError(
          'Assessment initialization incomplete: No sections found. Please wait for initialization to complete.',
          400,
          ErrorCode.ASSESSMENT_NOT_READY
        );
      }

      // Get first section
      const firstSection = assessment.sections[0];
      if (!firstSection) {
        throw new AppError(
          'Assessment initialization incomplete: No sections found. Please wait for initialization to complete.',
          400,
          ErrorCode.ASSESSMENT_NOT_READY
        );
      }

      // Check if first section has questions, if not generate the first question
      let firstQuestion = firstSection.questions?.[0];

      if (!firstQuestion) {
        // Generate the first question using the Practice Assessment Provider
        logger.info('Generating first question for assessment', {
          context: 'PublicPracticeAssessmentService.startAssessment',
          assessmentId,
          taskId: assessment.task.id,
          sectionId: firstSection.id,
        });

        try {
          const questionResponse =
            await this.practiceAssessmentProvider.getNextQuestion(
              assessment.task.id,
              undefined // No previous question for the first question
            );

          if (questionResponse.nextQuestion) {
            // Save the first question to the database
            firstQuestion =
              await this.prisma.public_practice_assessment_question.create({
                data: {
                  id: questionResponse.nextQuestion.id || uuidv4(),
                  sectionId: firstSection.id,
                  question: questionResponse.nextQuestion.question,
                  questionType: questionResponse.nextQuestion.questionType,
                  options: questionResponse.nextQuestion.options || {},
                  correctAnswer:
                    questionResponse.nextQuestion.correctAnswer || '',
                  score: 0,
                  maxScore: questionResponse.nextQuestion.maxScore || 1.0,
                  order: 0,
                  isRequired:
                    questionResponse.nextQuestion.isRequired !== false,
                  isLastQuestion:
                    questionResponse.nextQuestion.isLastQuestion || false,
                  isAnswered: false,
                },
              });

            logger.info('Generated and saved first question', {
              context: 'PublicPracticeAssessmentService.startAssessment',
              assessmentId,
              questionId: firstQuestion.id,
              sectionId: firstSection.id,
            });
          } else {
            throw new AppError(
              'Failed to generate first question',
              500,
              ErrorCode.INTERNAL_SERVER_ERROR
            );
          }
        } catch (error) {
          logger.error('Failed to generate first question', {
            context: 'PublicPracticeAssessmentService.startAssessment',
            error: error instanceof Error ? error.message : 'Unknown error',
            assessmentId,
            taskId: assessment.task.id,
          });
          throw new AppError(
            'Failed to generate first question. Please try again.',
            500,
            ErrorCode.INTERNAL_SERVER_ERROR
          );
        }
      }

      // Update assessment status and create progress
      await this.prisma.public_practice_assessment.update({
        where: { id: assessmentId },
        data: {
          status: PublicPracticeAssessmentStatusEnum.IN_PROGRESS,
          startedAt: new Date(),
          progressState: {
            create: {
              currentSectionId: firstSection.id,
              currentQuestionId: firstQuestion.id,
              lastSavedAt: new Date(),
              isCompleted: false,
            },
          },
        },
      });

      const updatedAssessment =
        await this.prisma.public_practice_assessment.findUnique({
          where: { id: assessmentId },
          include: {
            sections: {
              include: {
                questions: {
                  orderBy: {
                    order: 'asc',
                  },
                },
              },
              orderBy: {
                order: 'asc',
              },
            },
            progressState: true,
            proctoring: true,
            settings: true,
          },
        });

      if (!updatedAssessment) {
        throw new AppError(
          'Failed to update assessment',
          500,
          ErrorCode.INTERNAL_SERVER_ERROR
        );
      }

      return this.toPublicPracticeAssessment(updatedAssessment);
    } catch (error) {
      logger.error('Failed to start assessment', {
        context: 'PublicPracticeAssessmentService.startAssessment',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessmentId,
      });
      throw error;
    }
  }

  /**
   * Submit answer for a question
   */
  async submitAnswer(
    assessmentId: string,
    questionId: string,
    answerGiven: string
  ): Promise<any> {
    try {
      const question =
        await this.prisma.public_practice_assessment_question.findUnique({
          where: { id: questionId },
          include: {
            section: {
              include: {
                assessment: {
                  include: {
                    task: true,
                    sections: {
                      include: {
                        questions: {
                          orderBy: {
                            order: 'asc',
                          },
                        },
                      },
                      orderBy: {
                        order: 'asc',
                      },
                    },
                  },
                },
              },
            },
          },
        });

      if (!question) {
        throw new AppError('Question not found', 404, ErrorCode.NOT_FOUND);
      }

      const assessment = question.section.assessment;

      if (assessment.id !== assessmentId) {
        throw new AppError(
          'Question does not belong to this assessment',
          400,
          ErrorCode.INVALID_INPUT
        );
      }

      // Validate candidateId exists
      if (!assessment.candidateId) {
        throw new AppError(
          'Assessment is not linked to a candidate',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      // Validate task exists
      if (!assessment.task) {
        throw new AppError(
          'Assessment task not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      if (question.isAnswered && question.answerGiven) {
        logger.warn('Question already answered, checking for next question', {
          context: 'PublicPracticeAssessmentService.submitAnswer',
          assessmentId,
          questionId,
          existingAnswer: question.answerGiven,
        });

        // Check if there's a next question already generated
        const progressState =
          await this.prisma.public_practice_assessment_progress.findUnique({
            where: { assessmentId },
          });

        if (
          progressState?.currentQuestionId &&
          progressState.currentQuestionId !== questionId
        ) {
          // Next question exists, return it
          const nextQuestion =
            await this.prisma.public_practice_assessment_question.findUnique({
              where: { id: progressState.currentQuestionId },
            });

          if (nextQuestion) {
            logger.info('Returning existing next question', {
              context: 'PublicPracticeAssessmentService.submitAnswer',
              assessmentId,
              nextQuestionId: nextQuestion.id,
            });
            return {
              nextQuestion: {
                id: nextQuestion.id,
                question: nextQuestion.question,
                questionType: nextQuestion.questionType,
                options: nextQuestion.options,
                sectionId: nextQuestion.sectionId,
                order: nextQuestion.order,
              },
              isCompleted: false,
              shouldEndAssessment: false,
            };
          }
        }

        if (question.isLastQuestion) {
          return {
            nextQuestion: null,
            isCompleted: true,
            shouldEndAssessment: true,
          };
        }

        throw new AppError(
          'This question has already been answered. Please wait for the next question.',
          400,
          ErrorCode.INVALID_INPUT
        );
      }

      // Get assessment settings to determine max questions per section
      const settings =
        await this.prisma.public_practice_assessment_settings.findUnique({
          where: { assessmentId },
        });
      const maxQuestionsPerSection = settings?.maxQuestionsPerSection || 5;

      // Get current section data
      const currentSectionData = question.section;
      const currentSectionOrder = currentSectionData.order;
      const isLastSection =
        currentSectionOrder === assessment.sections.length - 1;

      if (
        currentSectionData.status ===
        PublicPracticeAssessmentSectionStatusEnum.NOT_STARTED
      ) {
        await this.prisma.public_practice_assessment_section.update({
          where: { id: question.sectionId },
          data: {
            status: PublicPracticeAssessmentSectionStatusEnum.IN_PROGRESS,
          },
        });

        logger.info('Section started', {
          context: 'PublicPracticeAssessmentService.submitAnswer',
          assessmentId,
          sectionId: question.sectionId,
          sectionTitle: currentSectionData.title,
        });
      }

      // Update question with answer
      const updatedQuestion =
        await this.prisma.public_practice_assessment_question.update({
          where: { id: questionId },
          data: {
            answerGiven,
            isAnswered: true,
          },
        });

      const isLastQuestionOfSection =
        updatedQuestion.order === maxQuestionsPerSection - 1;

      if (isLastQuestionOfSection) {
        await this.prisma.public_practice_assessment_section.update({
          where: { id: updatedQuestion.sectionId },
          data: {
            status: PublicPracticeAssessmentSectionStatusEnum.COMPLETED,
          },
        });

        logger.info('Section completed', {
          context: 'PublicPracticeAssessmentService.submitAnswer',
          assessmentId,
          sectionId: updatedQuestion.sectionId,
          sectionTitle: currentSectionData.title,
          sectionOrder: currentSectionOrder,
          questionOrder: updatedQuestion.order,
        });
      }

      // Check if this is the last question of the last section BEFORE calling AI provider
      const isThisTheLastQuestion =
        (updatedQuestion.isLastQuestion || isLastQuestionOfSection) &&
        isLastSection;

      logger.info('Checking if this is the last question', {
        context: 'PublicPracticeAssessmentService.submitAnswer',
        assessmentId,
        questionId,
        sectionOrder: currentSectionOrder,
        questionOrder: updatedQuestion.order,
        isLastQuestionFlag: updatedQuestion.isLastQuestion,
        isLastQuestionByOrder: isLastQuestionOfSection,
        isLastSection,
        isThisTheLastQuestion,
        totalSections: assessment.sections.length,
        maxQuestionsPerSection,
      });

      const currentQuestion =
        toCandidateJobAiAssessmentQuestionDomain(updatedQuestion);

      await this.practiceAssessmentProvider.saveAnswer(
        assessment.task.id,
        currentQuestion
      );

      logger.info('Answer saved to provider', {
        context: 'PublicPracticeAssessmentService.submitAnswer',
        assessmentId,
        questionId,
        sectionOrder: currentSectionOrder,
        questionOrder: updatedQuestion.order,
        isThisTheLastQuestion,
      });

      // If this is the last question, mark progress as completed and signal assessment end
      if (isThisTheLastQuestion) {
        logger.info(
          'Last question of last section answered - signaling assessment completion',
          {
            context: 'PublicPracticeAssessmentService.submitAnswer',
            assessmentId,
            questionId,
            sectionOrder: currentSectionOrder,
            questionOrder: updatedQuestion.order,
            isLastQuestionFlag: updatedQuestion.isLastQuestion,
            isLastQuestionByOrder: isLastQuestionOfSection,
          }
        );

        await this.prisma.public_practice_assessment_progress.update({
          where: { assessmentId },
          data: {
            isCompleted: true,
            lastSavedAt: new Date(),
          },
        });

        logger.info('Progress marked as completed, ready for submission', {
          context: 'PublicPracticeAssessmentService.submitAnswer',
          assessmentId,
          questionId,
        });

        return {
          nextQuestion: null,
          isCompleted: true,
          shouldEndAssessment: true,
        };
      }

      // Use Practice Assessment Provider to generate next question
      logger.info('Getting next question from Practice Assessment Provider', {
        context: 'PublicPracticeAssessmentService.submitAnswer',
        assessmentId,
        questionId,
      });

      const response = await this.practiceAssessmentProvider.getNextQuestion(
        assessment.task.id,
        currentQuestion
      );

      logger.info('Got next question from AI provider', {
        context: 'PublicPracticeAssessmentService.submitAnswer',
        assessmentId,
        questionId,
        nextQuestionId: response.nextQuestion?.id,
        shouldEndAssessment: response.shouldEndAssessment,
      });

      const nextQuestion = response.nextQuestion;

      if (!nextQuestion) {
        // No next question - mark as completed
        await this.prisma.public_practice_assessment_progress.update({
          where: { assessmentId },
          data: {
            isCompleted: true,
            lastSavedAt: new Date(),
          },
        });

        return {
          nextQuestion: null,
          isCompleted: true,
          shouldEndAssessment: response.shouldEndAssessment || true,
        };
      }

      // Save the next question
      const savedNextQuestion =
        await this.prisma.public_practice_assessment_question.create({
          data: {
            id: nextQuestion.id,
            sectionId: nextQuestion.sectionId,
            question: nextQuestion.question,
            questionType: nextQuestion.questionType,
            options: nextQuestion.options || {},
            correctAnswer: nextQuestion.correctAnswer || '',
            score: 0,
            maxScore: nextQuestion.maxScore || 1.0,
            order: nextQuestion.order,
            isRequired: nextQuestion.isRequired !== false,
            isLastQuestion: nextQuestion.isLastQuestion || false,
            isAnswered: false,
          },
        });

      // Update progress
      await this.prisma.public_practice_assessment_progress.update({
        where: { assessmentId },
        data: {
          currentSectionId: nextQuestion.sectionId,
          currentQuestionId: nextQuestion.id,
          lastSavedAt: new Date(),
          isCompleted: false,
        },
      });

      return {
        nextQuestion: {
          id: savedNextQuestion.id,
          question: savedNextQuestion.question,
          questionType: savedNextQuestion.questionType,
          options: savedNextQuestion.options,
          sectionId: savedNextQuestion.sectionId,
          order: savedNextQuestion.order,
        },
        isCompleted: false,
        shouldEndAssessment: response.shouldEndAssessment || false,
      };
    } catch (error) {
      logger.error('Failed to submit answer', {
        context: 'PublicPracticeAssessmentService.submitAnswer',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessmentId,
        questionId,
      });
      throw error;
    }
  }

  /**
   * Submit public practice assessment
   */
  async submitAssessment(
    assessmentId: string
  ): Promise<IPublicPracticeAssessment> {
    try {
      const assessment =
        await this.prisma.public_practice_assessment.findUnique({
          where: { id: assessmentId },
          include: {
            task: true,
          },
        });

      if (!assessment) {
        throw new AppError(
          'Practice assessment not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Validate candidateId exists
      if (!assessment.candidateId) {
        throw new AppError(
          'Assessment is not linked to a candidate',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      // Queue submit job (same as job AI assessment)
      await this.publicPracticeAssessmentProcessor.addSubmitJob(assessmentId);

      logger.info('Submit job queued', {
        context: 'PublicPracticeAssessmentService.submitAssessment',
        assessmentId,
      });

      // Return the assessment (actual processing happens in background)
      return this.toPublicPracticeAssessment(assessment);
    } catch (error) {
      logger.error('Failed to submit assessment', {
        context: 'PublicPracticeAssessmentService.submitAssessment',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessmentId,
      });
      throw error;
    }
  }

  /**
   * Get presigned URL for video chunk upload
   */
  async getPresignedUrlForVideoChunk(
    assessmentId: string,
    chunkIndex?: number,
    sectionId?: string,
    questionId?: string
  ): Promise<{
    presignedUrl: string;
    chunkIndex: number;
    gcsUri: string;
    filePath: string;
  }> {
    try {
      logger.info('Getting presigned URL for video chunk upload', {
        context: 'PublicPracticeAssessmentService.getPresignedUrlForVideoChunk',
        assessmentId,
        chunkIndex,
        sectionId,
        questionId,
      });

      // Get assessment to validate it exists and has candidateId
      const assessment =
        await this.prisma.public_practice_assessment.findUnique({
          where: { id: assessmentId },
          select: { candidateId: true },
        });

      if (!assessment) {
        throw new AppError(
          'Public practice assessment not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      if (!assessment.candidateId) {
        throw new AppError(
          'Assessment is not linked to a candidate',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      // Use provided chunkIndex or calculate next chunk index
      let nextChunkIndex: number;
      if (chunkIndex !== undefined) {
        nextChunkIndex = chunkIndex;
      } else {
        // Get next chunk index - only count relevant chunks with uploaded/completed status
        const lastChunk =
          await this.prisma.public_practice_assessment_video_chunk_analysis.findFirst(
            {
              where: {
                assessmentId,
                isRelevant: true,
                status: {
                  in: ['uploaded', 'analyzing', 'completed'],
                },
              },
              orderBy: { chunkIndex: 'desc' },
              select: { chunkIndex: true },
            }
          );

        nextChunkIndex = lastChunk ? lastChunk.chunkIndex + 1 : 0;
      }

      const { folderPath } =
        getBucketFolderPathToPublicPracticeAssessmentVideoChunks(assessmentId);

      // Use consistent filename format: chunk-INDEX-TIMESTAMP.webm
      const timestamp = Date.now();
      const fileName = `chunk-${nextChunkIndex}-${timestamp}.webm`;
      const filePath = `${folderPath}/${fileName}`;
      const gcsUri = `gs://${ENV.GCS_BUCKET_NAME}/${filePath}`;

      if (!this.storageProvider) {
        throw new AppError(
          'Storage provider not configured',
          500,
          ErrorCode.INTERNAL_SERVER_ERROR
        );
      }

      // Generate presigned URL with longer expiry for upload (10 minutes)
      const presignedUrl = await this.storageProvider.generatePreSignedUrl(
        filePath,
        'write',
        'video/webm;codecs=vp8,opus'
      );

      logger.info('Generated presigned URL for video chunk upload', {
        context: 'PublicPracticeAssessmentService.getPresignedUrlForVideoChunk',
        assessmentId,
        chunkIndex: nextChunkIndex,
        fileName,
        filePath,
      });

      return {
        presignedUrl,
        chunkIndex: nextChunkIndex,
        gcsUri,
        filePath,
      };
    } catch (error) {
      logger.error('Failed to get presigned URL for video chunk', {
        context: 'PublicPracticeAssessmentService.getPresignedUrlForVideoChunk',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessmentId,
        chunkIndex,
      });
      throw error;
    }
  }

  /**
   * Record video chunk upload and trigger analysis
   */
  async recordVideoChunkUpload(
    assessmentId: string,
    chunkIndex: number,
    gcsUri: string,
    questionId?: string,
    sectionId?: string
  ): Promise<{ success: boolean; chunkId: string }> {
    try {
      logger.info('Recording video chunk upload', {
        context: 'PublicPracticeAssessmentService.recordVideoChunkUpload',
        assessmentId,
        chunkIndex,
        gcsUri,
        questionId,
        sectionId,
      });

      // Validate assessment exists and has candidateId
      const assessment =
        await this.prisma.public_practice_assessment.findUnique({
          where: { id: assessmentId },
          select: { candidateId: true },
        });

      if (!assessment) {
        throw new AppError(
          'Public practice assessment not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      if (!assessment.candidateId) {
        throw new AppError(
          'Assessment is not linked to a candidate',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      // Verify file exists in GCS before recording (only for question chunks)
      if (questionId && this.storageProvider) {
        try {
          const filePath = gcsUri.replace(`gs://${ENV.GCS_BUCKET_NAME}/`, '');
          const exists = await this.storageProvider.fileExists(filePath);

          if (!exists) {
            throw new AppError(
              'Video chunk file not found in storage',
              404,
              ErrorCode.FILE_NOT_FOUND
            );
          }

          logger.info('Verified question chunk file in GCS', {
            context: 'PublicPracticeAssessmentService.recordVideoChunkUpload',
            assessmentId,
            chunkIndex,
            questionId,
          });
        } catch (storageError) {
          logger.error('Failed to verify chunk file in GCS', {
            context: 'PublicPracticeAssessmentService.recordVideoChunkUpload',
            error:
              storageError instanceof Error
                ? storageError.message
                : 'Unknown error',
            assessmentId,
            chunkIndex,
            questionId,
            gcsUri,
          });
          throw new AppError(
            'Failed to verify uploaded video chunk',
            500,
            ErrorCode.STORAGE_ERROR
          );
        }
      }

      // Determine attempt number for this question
      let attemptNumber = 1;
      if (questionId) {
        const existingChunks =
          await this.prisma.public_practice_assessment_video_chunk_analysis.findMany(
            {
              where: {
                assessmentId,
                questionId,
                isRelevant: true,
              },
              orderBy: {
                attemptNumber: 'desc',
              },
              take: 1,
            }
          );

        if (existingChunks.length > 0) {
          attemptNumber = existingChunks[0].attemptNumber;
        }
      }

      // Create or update chunk record
      const chunk =
        await this.prisma.public_practice_assessment_video_chunk_analysis.upsert(
          {
            where: {
              public_practice_video_chunk_analysis_assessment_id_chunk_index_section_id_key:
                {
                  assessmentId,
                  chunkIndex,
                  sectionId: sectionId ?? null,
                } as Prisma.public_practice_assessment_video_chunk_analysisWhereUniqueInput['public_practice_video_chunk_analysis_assessment_id_chunk_index_section_id_key'],
            },
            create: {
              assessmentId,
              chunkIndex,
              gcsUri,
              questionId,
              sectionId,
              attemptNumber,
              isRelevant: !!questionId,
              status: questionId ? 'uploaded' : 'skipped',
            },
            update: {
              gcsUri,
              questionId,
              sectionId,
              attemptNumber,
              isRelevant: !!questionId,
              status: questionId ? 'uploaded' : 'skipped',
              updatedAt: new Date(),
            },
          }
        );

      // Trigger async analysis for question chunks
      if (questionId) {
        this.analyzeChunkAsync(assessmentId, chunkIndex, gcsUri).catch(
          (error) => {
            logger.error('Failed to analyze chunk', {
              context: 'PublicPracticeAssessmentService.recordVideoChunkUpload',
              error: error instanceof Error ? error.message : 'Unknown error',
              assessmentId,
              chunkIndex,
              questionId,
            });
          }
        );

        logger.info('Question chunk recorded and analysis triggered', {
          context: 'PublicPracticeAssessmentService.recordVideoChunkUpload',
          assessmentId,
          chunkIndex,
          questionId,
          chunkId: chunk.id,
        });
      }

      return { success: true, chunkId: chunk.id };
    } catch (error) {
      logger.error('Failed to record video chunk upload', {
        context: 'PublicPracticeAssessmentService.recordVideoChunkUpload',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessmentId,
        chunkIndex,
      });
      throw error;
    }
  }

  /**
   * Analyze chunk asynchronously
   */
  private async analyzeChunkAsync(
    assessmentId: string,
    chunkIndex: number,
    gcsUri: string,
    retryCount: number = 0
  ): Promise<void> {
    const MAX_RETRIES = 2;

    try {
      // Check if chunk should be analyzed (skip if marked as irrelevant or skipped)
      const chunk =
        await this.prisma.public_practice_assessment_video_chunk_analysis.findFirst(
          {
            where: {
              assessmentId,
              chunkIndex,
            },
            select: {
              isRelevant: true,
              status: true,
            },
          }
        );

      if (chunk && (!chunk.isRelevant || chunk.status === 'skipped')) {
        logger.info({
          message:
            'Skipping chunk analysis - chunk marked as irrelevant or skipped',
          context: 'PublicPracticeAssessmentService.analyzeChunkAsync',
          assessmentId,
          chunkIndex,
          isRelevant: chunk.isRelevant,
          status: chunk.status,
        });
        return;
      }

      // Update status to analyzing
      await this.prisma.public_practice_assessment_video_chunk_analysis.updateMany(
        {
          where: {
            assessmentId,
            chunkIndex,
          },
          data: {
            status: 'analyzing',
          },
        }
      );

      // Import and use IntelligentChunkAnalysisService
      const { IntelligentChunkAnalysisService } = await import(
        '@/services/video/intelligent.chunk.analysis.service'
      );
      const analysisService = new IntelligentChunkAnalysisService();

      // Perform analysis using IntelligentChunkAnalysisService with 'public-practice' type
      // The service will automatically save to public_practice_assessment_video_chunk_analysis table
      await analysisService.analyzeChunk(
        gcsUri,
        chunkIndex,
        assessmentId,
        'public-practice'
      );

      // Analysis is automatically saved by IntelligentChunkAnalysisService
      logger.info('Chunk analysis completed and saved', {
        context: 'PublicPracticeAssessmentService.analyzeChunkAsync',
        assessmentId,
        chunkIndex,
        retryCount,
      });

      logger.info('Chunk analysis completed', {
        context: 'PublicPracticeAssessmentService.analyzeChunkAsync',
        assessmentId,
        chunkIndex,
        retryCount,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      if (retryCount < MAX_RETRIES) {
        logger.warn('Chunk analysis failed, retrying', {
          context: 'PublicPracticeAssessmentService.analyzeChunkAsync',
          assessmentId,
          chunkIndex,
          retryCount,
          error: errorMessage,
        });

        // Retry after delay
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return this.analyzeChunkAsync(
          assessmentId,
          chunkIndex,
          gcsUri,
          retryCount + 1
        );
      }

      // Mark as failed after max retries
      await this.prisma.public_practice_assessment_video_chunk_analysis.updateMany(
        {
          where: {
            assessmentId,
            chunkIndex,
          },
          data: {
            status: 'failed',
          },
        }
      );

      logger.error('Chunk analysis failed after retries', {
        context: 'PublicPracticeAssessmentService.analyzeChunkAsync',
        assessmentId,
        chunkIndex,
        retryCount,
        error: errorMessage,
      });
    }
  }

  /**
   * Heartbeat (status update) for assessment
   * Updates the duration field with remaining time to preserve timer state on refresh
   */
  async heartbeat(
    assessmentId: string,
    duration: number,
    status?: string
  ): Promise<boolean> {
    try {
      logger.info({
        message: 'Updating assessment status',
        context: 'PublicPracticeAssessmentService.heartbeat',
        assessmentId,
        duration,
        status,
      });

      // Verify assessment exists
      const assessment =
        await this.prisma.public_practice_assessment.findUnique({
          where: { id: assessmentId },
        });

      if (!assessment) {
        throw new AppError(
          'Practice assessment not found',
          404,
          ErrorCode.AI_ASSESSMENT_NOT_FOUND
        );
      }

      const updateData: any = { duration };
      // Do not update status via heartbeat to avoid conflicts
      // Status should only be updated via specific state transitions

      const updated = await this.prisma.public_practice_assessment.update({
        where: { id: assessmentId },
        data: updateData,
      });

      if (!updated) {
        throw new AppError(
          'Assessment not found',
          404,
          ErrorCode.AI_ASSESSMENT_NOT_FOUND
        );
      }

      return true;
    } catch (error) {
      logger.error({
        message: 'Failed to update heartbeat',
        context: 'PublicPracticeAssessmentService.heartbeat',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessmentId,
      });
      throw error;
    }
  }

  /**
   * Get all relevant video chunks for an assessment
   */
  async getVideoChunks(
    assessmentId: string,
    options?: {
      questionId?: string;
      sectionId?: string;
      includeAnalysis?: boolean;
      includePlaybackUrls?: boolean;
    }
  ): Promise<
    Array<{
      id: string;
      chunkIndex: number;
      questionId: string | null;
      sectionId: string | null;
      attemptNumber: number;
      status: string;
      createdAt: Date;
      analysis?: any;
      playbackUrl?: string;
      playbackUrlError?: string;
    }>
  > {
    try {
      logger.info('Getting video chunks', {
        context: 'PublicPracticeAssessmentService.getVideoChunks',
        assessmentId,
        options,
      });

      // Validate assessment exists
      const assessment =
        await this.prisma.public_practice_assessment.findUnique({
          where: { id: assessmentId },
          select: { candidateId: true },
        });

      if (!assessment) {
        throw new AppError(
          'Public practice assessment not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Build query filter
      const where: any = {
        assessmentId,
        isRelevant: true,
      };

      if (options?.questionId) {
        where.questionId = options.questionId;
      }

      if (options?.sectionId) {
        where.sectionId = options.sectionId;
      }

      // Get chunks from database
      const chunks =
        await this.prisma.public_practice_assessment_video_chunk_analysis.findMany(
          {
            where,
            orderBy: [
              { sectionId: 'asc' },
              { questionId: 'asc' },
              { chunkIndex: 'asc' },
            ],
            select: {
              id: true,
              chunkIndex: true,
              questionId: true,
              sectionId: true,
              attemptNumber: true,
              status: true,
              createdAt: true,
              gcsUri: true,
              analysis: options?.includeAnalysis ?? false,
            },
          }
        );

      // Generate playback URLs if requested
      const result = await Promise.all(
        chunks.map(async (chunk) => {
          const data: any = {
            id: chunk.id,
            chunkIndex: chunk.chunkIndex,
            questionId: chunk.questionId,
            sectionId: chunk.sectionId,
            attemptNumber: chunk.attemptNumber,
            status: chunk.status,
            createdAt: chunk.createdAt,
          };

          if (options?.includeAnalysis) {
            data.analysis = chunk.analysis;
          }

          if (
            options?.includePlaybackUrls &&
            chunk.questionId &&
            this.storageProvider
          ) {
            try {
              const filePath = chunk.gcsUri.replace(
                `gs://${ENV.GCS_BUCKET_NAME}/`,
                ''
              );
              data.playbackUrl =
                await this.storageProvider.generatePreSignedUrl(
                  filePath,
                  'read'
                );
            } catch (error) {
              logger.warn('Failed to generate playback URL', {
                context: 'PublicPracticeAssessmentService.getVideoChunks',
                error: error instanceof Error ? error.message : 'Unknown error',
                chunkId: chunk.id,
              });
              data.playbackUrlError =
                error instanceof Error ? error.message : 'Unknown error';
            }
          }

          return data;
        })
      );

      return result;
    } catch (error) {
      logger.error('Failed to get video chunks', {
        context: 'PublicPracticeAssessmentService.getVideoChunks',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessmentId,
      });
      throw error;
    }
  }

  /**
   * Record proctoring event
   */
  async recordProctoringEvent(
    assessmentId: string,
    type: string,
    _data?: any
  ): Promise<{ success: boolean; warningCount: number }> {
    try {
      logger.info('Recording proctoring event', {
        context: 'PublicPracticeAssessmentService.recordProctoringEvent',
        assessmentId,
        type,
      });

      // Validate assessment exists and has candidateId
      const assessment =
        await this.prisma.public_practice_assessment.findUnique({
          where: { id: assessmentId },
          select: { candidateId: true },
        });

      if (!assessment) {
        throw new AppError(
          'Public practice assessment not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      if (!assessment.candidateId) {
        throw new AppError(
          'Assessment is not linked to a candidate',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      let proctoring =
        await this.prisma.public_practice_assessment_proctoring.findUnique({
          where: { assessmentId },
        });

      if (!proctoring) {
        proctoring =
          await this.prisma.public_practice_assessment_proctoring.create({
            data: { assessmentId },
          });
      }

      const update: any = {};
      const currentEvents =
        typeof proctoring.suspiciousEvents === 'object' &&
        proctoring.suspiciousEvents !== null
          ? proctoring.suspiciousEvents
          : {};

      switch (type) {
        case 'TAB_SWITCHED':
          update.tabSwitches = { increment: 1 };
          break;
        case 'COPY_PASTE':
          update.copyPasteAttempts = { increment: 1 };
          break;
        case 'MULTIPLE_PERSONS_DETECTED':
          update.multiplePersonsDetected = true;
          break;
        case 'NO_FACE_DETECTED':
          update.suspiciousEvents = {
            set: {
              ...currentEvents,
              [new Date().toISOString()]: 'NO_FACE_DETECTED',
            },
          };
          break;
        case 'AUDIO_IRREGULARITY':
          update.audioIrregularities = true;
          break;
        case 'SCREEN_SHARE_VIOLATION':
          update.screenShareViolations = true;
          break;
        case 'WARNING':
          update.warningCount = { increment: 1 };
          break;
        default:
          update.suspiciousEvents = {
            set: { ...currentEvents, [new Date().toISOString()]: type },
          };
      }

      const updated =
        await this.prisma.public_practice_assessment_proctoring.update({
          where: { assessmentId },
          data: update,
        });

      return {
        success: true,
        warningCount: updated.warningCount,
      };
    } catch (error) {
      logger.error('Failed to record proctoring event', {
        context: 'PublicPracticeAssessmentService.recordProctoringEvent',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessmentId,
        type,
      });
      throw error;
    }
  }

  /**
   * Get proctoring data for an assessment
   */
  async getProctoringData(assessmentId: string): Promise<any> {
    try {
      const assessment =
        await this.prisma.public_practice_assessment.findUnique({
          where: { id: assessmentId },
          include: {
            proctoring: true,
          },
        });

      if (!assessment) {
        throw new AppError(
          'Public practice assessment not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      return (
        assessment.proctoring || {
          warningCount: 0,
          suspiciousEvents: {},
          tabSwitches: 0,
          copyPasteAttempts: 0,
          multiplePersonsDetected: false,
          audioIrregularities: false,
          screenShareViolations: false,
        }
      );
    } catch (error) {
      logger.error('Failed to get proctoring data', {
        context: 'PublicPracticeAssessmentService.getProctoringData',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessmentId,
      });
      throw error;
    }
  }

  /**
   * Trigger video analysis (queue background job)
   */
  async triggerVideoAnalysis(
    assessmentId: string
  ): Promise<{ success: boolean }> {
    try {
      logger.info('Triggering video analysis', {
        context: 'PublicPracticeAssessmentService.triggerVideoAnalysis',
        assessmentId,
      });

      // Validate assessment exists
      const assessment =
        await this.prisma.public_practice_assessment.findUnique({
          where: { id: assessmentId },
          select: { candidateId: true },
        });

      if (!assessment) {
        throw new AppError(
          'Public practice assessment not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      if (!assessment.candidateId) {
        throw new AppError(
          'Assessment is not linked to a candidate',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      // Update status to IN_PROGRESS
      await this.prisma.public_practice_assessment.update({
        where: { id: assessmentId },
        data: {
          videoAnalysisStatus:
            PublicPracticeAssessmentVideoAnalysisStatusEnum.IN_PROGRESS,
        },
      });

      // Get task ID if available
      const assessmentWithTask =
        await this.prisma.public_practice_assessment.findUnique({
          where: { id: assessmentId },
          select: { task: { select: { id: true } } },
        });

      const taskId = assessmentWithTask?.task?.id;

      // Queue background job for video analysis using the processor
      await this.publicPracticeAssessmentVideoAnalysisProcessor.addVideoAnalysisJob(
        assessmentId,
        taskId
      );

      logger.info('Video analysis job queued successfully', {
        context: 'PublicPracticeAssessmentService.triggerVideoAnalysis',
        assessmentId,
        taskId,
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to trigger video analysis', {
        context: 'PublicPracticeAssessmentService.triggerVideoAnalysis',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessmentId,
      });
      throw error;
    }
  }

  /**
   * Get video analysis results
   */
  async getVideoAnalysis(assessmentId: string): Promise<any> {
    try {
      const assessment =
        await this.prisma.public_practice_assessment.findUnique({
          where: { id: assessmentId },
          include: {
            videoAnalysis: true,
          },
        });

      if (!assessment) {
        throw new AppError(
          'Public practice assessment not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      return assessment.videoAnalysis;
    } catch (error) {
      logger.error('Failed to get video analysis', {
        context: 'PublicPracticeAssessmentService.getVideoAnalysis',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessmentId,
      });
      throw error;
    }
  }

  /**
   * Start background process submit task (called by queue processor)
   */
  async startBackgroundProcessSubmitTask(assessmentId: string): Promise<void> {
    const assessment = await this.prisma.public_practice_assessment.findUnique({
      where: { id: assessmentId },
      include: {
        task: true,
        sections: {
          include: { questions: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!assessment) {
      throw new AppError('Assessment not found', 404, ErrorCode.NOT_FOUND);
    }

    if (!assessment.task) {
      throw new AppError('Assessment task not found', 404, ErrorCode.NOT_FOUND);
    }

    logger.info('Starting background process submit task', {
      context:
        'PublicPracticeAssessmentService.startBackgroundProcessSubmitTask',
      assessmentId,
    });

    await this.backgroundProcessSubmitTask(assessment);
  }

  /**
   * Background process submit task
   */
  private async backgroundProcessSubmitTask(assessment: any): Promise<void> {
    const assessmentId = assessment.id;

    try {
      logger.info('Processing submit task', {
        context: 'PublicPracticeAssessmentService.backgroundProcessSubmitTask',
        assessmentId,
      });

      if (!assessment.task) {
        throw new AppError(
          'Assessment task not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Update the assessment status to AI_REVIEW_IN_PROGRESS (matching job AI assessment)
      await this.prisma.public_practice_assessment.update({
        where: { id: assessmentId },
        data: {
          status: PublicPracticeAssessmentStatusEnum.AI_REVIEW_IN_PROGRESS,
        },
      });

      // Update the assessment task status (matching job AI assessment)
      await this.prisma.public_practice_assessment_task.update({
        where: { id: assessment.task.id },
        data: {
          status: PublicPracticeAssessmentTaskStatusEnum.PROCESSING,
        },
      });

      // Start AI review using Practice Assessment Provider

      await this.practiceAssessmentProvider.doAssessment(assessment.task.id);

      // Get the AI task result
      const aiTask =
        await this.practiceAssessmentProvider.getPracticeAssessmentTask(
          assessment.task.id
        );

      logger.info('AI assessment task completed', {
        context: 'PublicPracticeAssessmentService.backgroundProcessSubmitTask',
        assessmentId,
        aiTaskStatus: aiTask.status,
        hasAssessment: !!aiTask.assessment,
      });

      // Synthesize final video chunk analysis (if chunks exist)
      try {
        const { IntelligentChunkAnalysisService } = await import(
          '@/services/video/intelligent.chunk.analysis.service'
        );
        const analysisService = new IntelligentChunkAnalysisService();

        // Check if there are any analyzed chunks
        const chunkCount =
          await this.prisma.public_practice_assessment_video_chunk_analysis.count(
            {
              where: {
                assessmentId,
                status: 'completed',
              },
            }
          );

        if (chunkCount > 0) {
          logger.info('Synthesizing final video chunk analysis', {
            context:
              'PublicPracticeAssessmentService.backgroundProcessSubmitTask',
            assessmentId,
            chunkCount,
          });

          const finalAnalysis = await analysisService.synthesizeFinalAnalysis(
            assessmentId,
            'public-practice'
          );

          // Store final analysis in videoAnalysis field
          await this.createVideoAnalysis(assessmentId, finalAnalysis);

          await this.prisma.public_practice_assessment.update({
            where: { id: assessmentId },
            data: {
              videoAnalysisStatus:
                PublicPracticeAssessmentVideoAnalysisStatusEnum.COMPLETED,
              score: finalAnalysis.overallScore || assessment.score || 0,
              overallFeedback: finalAnalysis.overallFeedback || null,
              strengths: finalAnalysis.strengths || [],
              areasForImprovement: finalAnalysis.areasForImprovement || [],
            },
          });

          logger.info('Final video chunk analysis completed', {
            context:
              'PublicPracticeAssessmentService.backgroundProcessSubmitTask',
            assessmentId,
          });
        } else {
          logger.info('No video chunks found for analysis', {
            context:
              'PublicPracticeAssessmentService.backgroundProcessSubmitTask',
            assessmentId,
          });
        }
      } catch (videoError) {
        logger.error(
          'Failed to synthesize video chunk analysis (continuing anyway)',
          {
            context:
              'PublicPracticeAssessmentService.backgroundProcessSubmitTask',
            error:
              videoError instanceof Error
                ? videoError.message
                : 'Unknown error',
            assessmentId,
          }
        );
        // Don't throw - video analysis is supplementary
      }

      // Handle AI task failure (matching job AI assessment)
      if (aiTask.status === JobAiAssessmentTaskStatusEnum.FAILED) {
        // Update the assessment task status
        await this.prisma.public_practice_assessment_task.update({
          where: { id: assessment.task.id },
          data: {
            status: PublicPracticeAssessmentTaskStatusEnum.FAILED,
          },
        });

        // Update the assessment status
        await this.prisma.public_practice_assessment.update({
          where: { id: assessmentId },
          data: {
            status: PublicPracticeAssessmentStatusEnum.FAILED,
            result: PublicPracticeAssessmentResultEnum.NOT_AVAILABLE,
          },
        });

        logger.error('AI assessment task failed', {
          context:
            'PublicPracticeAssessmentService.backgroundProcessSubmitTask',
          assessmentId,
          taskId: assessment.task.id,
        });

        return;
      }

      // Update assessment with AI review results
      if (!aiTask.assessment) {
        logger.error('AI task completed but no assessment data found', {
          context:
            'PublicPracticeAssessmentService.backgroundProcessSubmitTask',
          assessmentId,
          aiTaskStatus: aiTask.status,
        });
        throw new AppError(
          'AI assessment completed but no assessment data was returned',
          500,
          ErrorCode.INTERNAL_SERVER_ERROR
        );
      }

      // Update assessment with results (matching job AI assessment)
      await this.updatePublicPracticeAssessmentResult(
        assessmentId,
        aiTask.assessment
      );

      // Update the assessment task status (matching job AI assessment)
      await this.prisma.public_practice_assessment_task.update({
        where: { id: assessment.task.id },
        data: {
          status: PublicPracticeAssessmentTaskStatusEnum.COMPLETED,
        },
      });

      // Update the assessment status to COMPLETED
      await this.prisma.public_practice_assessment.update({
        where: { id: assessmentId },
        data: {
          status: PublicPracticeAssessmentStatusEnum.COMPLETED,
          completedAt: new Date(),
        },
      });

      logger.info('Submit task completed successfully', {
        context: 'PublicPracticeAssessmentService.backgroundProcessSubmitTask',
        assessmentId,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      logger.error('Failed to process submit task', {
        context: 'PublicPracticeAssessmentService.backgroundProcessSubmitTask',
        error: errorMessage,
        errorStack,
        assessmentId,
        taskId: assessment?.task?.id,
      });

      // Update status to failed (matching job AI assessment error handling)
      try {
        if (assessment?.task) {
          // Update the assessment task status
          await this.prisma.public_practice_assessment_task.update({
            where: { id: assessment.task.id },
            data: {
              status: PublicPracticeAssessmentTaskStatusEnum.FAILED,
              error: errorMessage,
            },
          });
        }

        // Update the assessment status
        await this.prisma.public_practice_assessment.update({
          where: { id: assessmentId },
          data: {
            status: PublicPracticeAssessmentStatusEnum.FAILED,
          },
        });
      } catch (updateError) {
        logger.error('Failed to update assessment task status on error', {
          context:
            'PublicPracticeAssessmentService.backgroundProcessSubmitTask',
          error:
            updateError instanceof Error
              ? updateError.message
              : 'Unknown error',
          assessmentId,
        });
      }

      // Re-throw the original error for queue processing
      throw error;
    }
  }

  /**
   * Update public practice assessment with AI review results
   */
  private async updatePublicPracticeAssessmentResult(
    assessmentId: string,
    assessment: any
  ): Promise<void> {
    try {
      logger.info('Updating public practice assessment result', {
        context:
          'PublicPracticeAssessmentService.updatePublicPracticeAssessmentResult',
        assessmentId,
        score: assessment.score,
        result: assessment.result,
      });

      // Map job AI assessment result to practice assessment result
      let practiceResult = PublicPracticeAssessmentResultEnum.NOT_AVAILABLE;
      if (assessment.result === JobAiAssessmentResultEnum.PASSED) {
        practiceResult = PublicPracticeAssessmentResultEnum.PASSED;
      } else if (
        assessment.result === JobAiAssessmentResultEnum.AI_REVIEW_FAILED ||
        assessment.result === JobAiAssessmentResultEnum.MANUAL_REVIEW_FAILED
      ) {
        practiceResult = PublicPracticeAssessmentResultEnum.FAILED;
      }

      // Map job AI assessment recommendation to practice assessment recommendation
      let practiceRecommendation: PublicPracticeAssessmentRecommendationEnum | null =
        null;
      if (assessment.recommendation) {
        if (
          assessment.recommendation ===
          JobAiAssessmentRecommendationEnum.HIGHLY_RECOMMENDED
        ) {
          practiceRecommendation =
            PublicPracticeAssessmentRecommendationEnum.HIGHLY_RECOMMENDED;
        } else if (
          assessment.recommendation ===
          JobAiAssessmentRecommendationEnum.RECOMMENDED
        ) {
          practiceRecommendation =
            PublicPracticeAssessmentRecommendationEnum.RECOMMENDED;
        } else if (
          assessment.recommendation ===
          JobAiAssessmentRecommendationEnum.NOT_RECOMMENDED
        ) {
          practiceRecommendation =
            PublicPracticeAssessmentRecommendationEnum.NOT_RECOMMENDED;
        }
      }

      try {
        await this.prisma.$transaction(async (tx) => {
          await tx.public_practice_assessment.update({
            where: { id: assessmentId },
            data: {
              status: PublicPracticeAssessmentStatusEnum.AI_REVIEW_COMPLETED,
              result: practiceResult,
              score: assessment.score || 0,
              overallFeedback: assessment.overallFeedback || null,
              recommendation: practiceRecommendation,
              strengths: assessment.strengths || [],
              areasForImprovement: assessment.areasForImprovement || [],
              selectedForNextRound: assessment.selectedForNextRound || false,
              skills: assessment.skills || [],
              technicalSkills: assessment.technicalSkills || [],
              softSkills: assessment.softSkills || [],
              industriesFit: assessment.industriesFit || [],
              jobRolesFit: assessment.jobRolesFit || [],
              experienceSummary: assessment.experienceSummary || null,
              educationSummary: assessment.educationSummary || null,
              completedAt: new Date(),
            },
          });

          // Only update sections that have AI result (COMPLETED)
          if (assessment.sections?.length) {
            for (const section of assessment.sections) {
              const hasAiResult =
                section.status ===
                  PublicPracticeAssessmentSectionStatusEnum.COMPLETED ||
                section.status === JobAiAssessmentSectionStatusEnum.COMPLETED ||
                section.status === 'COMPLETED';
              if (!hasAiResult) continue;
              await tx.public_practice_assessment_section.update({
                where: { id: section.id },
                data: {
                  status: PublicPracticeAssessmentSectionStatusEnum.COMPLETED,
                  result:
                    section.result === JobAiAssessmentResultEnum.PASSED ||
                    section.result === 'PASSED'
                      ? PublicPracticeAssessmentSectionResultEnum.PASSED
                      : section.result ===
                            JobAiAssessmentResultEnum.AI_REVIEW_FAILED ||
                          section.result ===
                            JobAiAssessmentResultEnum.MANUAL_REVIEW_FAILED ||
                          section.result === 'FAILED'
                        ? PublicPracticeAssessmentSectionResultEnum.FAILED
                        : PublicPracticeAssessmentSectionResultEnum.NOT_AVAILABLE,
                  score: section.score ?? 0,
                  feedback: section.feedback ?? null,
                  strengths: section.strengths ?? [],
                  areasForImprovement: section.areasForImprovement ?? [],
                },
              });
            }
          }
        });

        logger.info('Assessment result updated successfully', {
          context:
            'PublicPracticeAssessmentService.updatePublicPracticeAssessmentResult',
          assessmentId,
          result: practiceResult,
          recommendation: practiceRecommendation,
          sectionCount: assessment.sections?.length || 0,
        });
      } catch (updateError) {
        logger.error('Failed to update assessment result', {
          context:
            'PublicPracticeAssessmentService.updatePublicPracticeAssessmentResult',
          error:
            updateError instanceof Error
              ? updateError.message
              : 'Unknown error',
          errorStack:
            updateError instanceof Error ? updateError.stack : undefined,
          assessmentId,
          hasSections: !!assessment.sections,
          sectionCount: assessment.sections?.length || 0,
        });
        throw updateError;
      }

      logger.info('Public practice assessment result updated successfully', {
        context:
          'PublicPracticeAssessmentService.updatePublicPracticeAssessmentResult',
        assessmentId,
        result: practiceResult,
        score: assessment.score,
      });
    } catch (error) {
      logger.error('Failed to update public practice assessment result', {
        context:
          'PublicPracticeAssessmentService.updatePublicPracticeAssessmentResult',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessmentId,
      });
      throw error;
    }
  }

  /**
   * Background process video analysis (synthesize chunks)
   * This is called by the queue processor
   */
  async backgroundProcessVideoAnalysis(
    assessmentId: string,
    taskId?: string
  ): Promise<void> {
    logger.info('Processing public practice assessment video analysis', {
      context: 'PublicPracticeAssessmentService.backgroundProcessVideoAnalysis',
      assessmentId,
      taskId,
    });

    try {
      // Update status to IN_PROGRESS (already done in triggerVideoAnalysis)
      // Synthesize final video chunk analysis using IntelligentChunkAnalysisService
      const { IntelligentChunkAnalysisService } = await import(
        '@/services/video/intelligent.chunk.analysis.service'
      );
      const analysisService = new IntelligentChunkAnalysisService();

      // Check if there are any analyzed chunks
      const chunkCount =
        await this.prisma.public_practice_assessment_video_chunk_analysis.count(
          {
            where: {
              assessmentId,
              status: 'completed',
            },
          }
        );

      if (chunkCount > 0) {
        logger.info('Synthesizing final video chunk analysis', {
          context:
            'PublicPracticeAssessmentService.backgroundProcessVideoAnalysis',
          assessmentId,
          chunkCount,
        });

        // Use IntelligentChunkAnalysisService to synthesize final analysis
        const finalAnalysis = await analysisService.synthesizeFinalAnalysis(
          assessmentId,
          'public-practice'
        );

        // Store final analysis in videoAnalysis field
        await this.createVideoAnalysis(assessmentId, finalAnalysis);

        // Get current assessment to preserve existing score if needed
        const currentAssessment =
          await this.prisma.public_practice_assessment.findUnique({
            where: { id: assessmentId },
            select: { score: true },
          });

        // Update the assessment video analysis status to COMPLETED
        await this.prisma.public_practice_assessment.update({
          where: { id: assessmentId },
          data: {
            videoAnalysisStatus:
              PublicPracticeAssessmentVideoAnalysisStatusEnum.COMPLETED,
            score: finalAnalysis.overallScore || currentAssessment?.score || 0,
            overallFeedback: finalAnalysis.overallFeedback || null,
            strengths: finalAnalysis.strengths || [],
            areasForImprovement: finalAnalysis.areasForImprovement || [],
          },
        });

        logger.info('Final video chunk analysis completed', {
          context:
            'PublicPracticeAssessmentService.backgroundProcessVideoAnalysis',
          assessmentId,
          overallScore: finalAnalysis.overallScore,
        });
      } else {
        logger.warn('No video chunks found for analysis', {
          context:
            'PublicPracticeAssessmentService.backgroundProcessVideoAnalysis',
          assessmentId,
        });

        // Update status to FAILED since no chunks were found
        await this.prisma.public_practice_assessment.update({
          where: { id: assessmentId },
          data: {
            videoAnalysisStatus:
              PublicPracticeAssessmentVideoAnalysisStatusEnum.FAILED,
            videoAnalysisError: 'No video chunks found for analysis',
          },
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      logger.error('Failed to process video analysis', {
        context:
          'PublicPracticeAssessmentService.backgroundProcessVideoAnalysis',
        error: errorMessage,
        assessmentId,
        taskId,
      });

      // Update status to FAILED and store error message
      await this.prisma.public_practice_assessment.update({
        where: { id: assessmentId },
        data: {
          videoAnalysisStatus:
            PublicPracticeAssessmentVideoAnalysisStatusEnum.FAILED,
          videoAnalysisError: errorMessage,
        },
      });

      // Re-throw the error so the job is marked as failed in the queue
      throw error;
    }
  }

  /**
   * Create video analysis record
   */
  private async createVideoAnalysis(
    assessmentId: string,
    analysis: any
  ): Promise<void> {
    await this.prisma.public_practice_assessment_video_analysis.upsert({
      where: { assessmentId },
      create: {
        assessmentId,
        videoUrl: analysis.videoUrl || null,
        highlightsVideoUrl: analysis.highlightsVideoUrl || null,
        transcriptText: analysis.transcriptText || null,
        overallScore: analysis.overallScore || null,
        overallFeedback: analysis.overallFeedback || null,
        engagementScore: analysis.engagementScore || null,
        engagementFeedback: analysis.engagementFeedback || null,
        confidenceScore: analysis.confidenceScore || null,
        confidenceFeedback: analysis.confidenceFeedback || null,
        clarityScore: analysis.clarityScore || null,
        clarityFeedback: analysis.clarityFeedback || null,
        professionalDemeanorScore: analysis.professionalDemeanorScore || null,
        professionalDemeanorFeedback:
          analysis.professionalDemeanorFeedback || null,
        proctoringScore: analysis.proctoringScore || null,
        proctoringFeedback: analysis.proctoringFeedback || null,
        strengths: analysis.strengths || [],
        areasForImprovement: analysis.areasForImprovement || [],
        highlightsInstructions: analysis.highlightsInstructions || null,
      },
      update: {
        videoUrl: analysis.videoUrl || null,
        highlightsVideoUrl: analysis.highlightsVideoUrl || null,
        transcriptText: analysis.transcriptText || null,
        overallScore: analysis.overallScore || null,
        overallFeedback: analysis.overallFeedback || null,
        engagementScore: analysis.engagementScore || null,
        engagementFeedback: analysis.engagementFeedback || null,
        confidenceScore: analysis.confidenceScore || null,
        confidenceFeedback: analysis.confidenceFeedback || null,
        clarityScore: analysis.clarityScore || null,
        clarityFeedback: analysis.clarityFeedback || null,
        professionalDemeanorScore: analysis.professionalDemeanorScore || null,
        professionalDemeanorFeedback:
          analysis.professionalDemeanorFeedback || null,
        proctoringScore: analysis.proctoringScore || null,
        proctoringFeedback: analysis.proctoringFeedback || null,
        strengths: analysis.strengths || [],
        areasForImprovement: analysis.areasForImprovement || [],
        highlightsInstructions: analysis.highlightsInstructions || null,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Convert database model to domain model
   */
  private toPublicPracticeAssessment(
    assessment: any
  ): IPublicPracticeAssessment {
    return {
      id: assessment.id,
      title: assessment.title,
      description: assessment.description,
      sourceJobUrl: assessment.sourceJobUrl,
      candidateName: assessment.candidateName,
      candidateEmail: assessment.candidateEmail,
      status: assessment.status,
      result: assessment.result,
      score: assessment.score,
      duration: assessment.duration,
      startedAt: assessment.startedAt,
      completedAt: assessment.completedAt,
      createdAt: assessment.createdAt,
      updatedAt: assessment.updatedAt,
      linkedAt: assessment.linkedAt,
      candidateId: assessment.candidateId || undefined,
      termsAccepted: assessment.termsAccepted || false,
      termsAcceptedAt: assessment.termsAcceptedAt || undefined,
      // Feedback fields
      overallFeedback: assessment.overallFeedback || undefined,
      strengths: assessment.strengths || [],
      areasForImprovement: assessment.areasForImprovement || [],
      recommendation: assessment.recommendation || undefined,
      // Skills and fit analysis
      technicalSkills: assessment.technicalSkills || [],
      softSkills: assessment.softSkills || [],
      industriesFit: assessment.industriesFit || [],
      jobRolesFit: assessment.jobRolesFit || [],
      sections:
        assessment.sections?.map((section: any) => ({
          id: section.id,
          assessmentId: section.assessmentId,
          title: section.title,
          description: section.description,
          type: section.type,
          status: section.status,
          result: section.result,
          score: section.score,
          order: section.order,
          isRequired: section.isRequired,
          passThreshold: section.passThreshold,
          startedAt: section.startedAt || undefined,
          completedAt: section.completedAt || undefined,
          feedback: section.feedback || undefined,
          strengths: section.strengths || [],
          areasForImprovement: section.areasForImprovement || [],
          questions:
            section.questions?.map((question: any) => ({
              id: question.id,
              sectionId: question.sectionId,
              question: question.question,
              questionType: question.questionType,
              options: question.options || undefined,
              correctAnswer: question.correctAnswer || undefined,
              answerGiven: question.answerGiven || undefined,
              score: question.score,
              maxScore: question.maxScore,
              order: question.order,
              isRequired: question.isRequired,
              isLastQuestion: question.isLastQuestion,
              feedback: question.feedback || undefined,
              isAnswered: question.isAnswered,
            })) || [],
        })) || undefined,
      progressState: assessment.progressState
        ? {
            currentSectionId:
              assessment.progressState.currentSectionId || undefined,
            currentQuestionId:
              assessment.progressState.currentQuestionId || undefined,
            lastSavedAt: assessment.progressState.lastSavedAt,
            progressData: assessment.progressState.progressData || undefined,
            isCompleted: assessment.progressState.isCompleted,
          }
        : undefined,
      proctoring: assessment.proctoring
        ? {
            warningCount: assessment.proctoring.warningCount,
            suspiciousEvents:
              assessment.proctoring.suspiciousEvents || undefined,
            tabSwitches: assessment.proctoring.tabSwitches,
            copyPasteAttempts: assessment.proctoring.copyPasteAttempts,
            multiplePersonsDetected:
              assessment.proctoring.multiplePersonsDetected,
            audioIrregularities: assessment.proctoring.audioIrregularities,
            screenShareViolations: assessment.proctoring.screenShareViolations,
            automaticallyFailed: assessment.proctoring.automaticallyFailed,
            manualReviewRequired: assessment.proctoring.manualReviewRequired,
            reviewerNotes: assessment.proctoring.reviewerNotes || undefined,
          }
        : undefined,
      publicPracticeAssessmentSettings: assessment.settings
        ? {
            id: assessment.settings.id,
            assessmentId: assessment.settings.assessmentId,
            greetingMessage: assessment.settings.greetingMessage || undefined,
            defaultAssessmentDuration:
              assessment.settings.defaultAssessmentDuration || undefined,
            maxSections: assessment.settings.maxSections || undefined,
            maxQuestionsPerSection:
              assessment.settings.maxQuestionsPerSection || undefined,
            proctoringEnabled: assessment.settings.proctoringEnabled,
            maxWarnings: assessment.settings.maxWarnings || undefined,
            tabSwitchLimit: assessment.settings.tabSwitchLimit || undefined,
            copyPasteAllowed: assessment.settings.copyPasteAllowed,
            videoRecordingEnabled: assessment.settings.videoRecordingEnabled,
            minimumVideoLength:
              assessment.settings.minimumVideoLength || undefined,
            aiVideoAnalysisEnabled: assessment.settings.aiVideoAnalysisEnabled,
            interviewLanguage:
              assessment.settings.interviewLanguage || undefined,
            interviewDialect: assessment.settings.interviewDialect || undefined,
            interviewVoiceGender:
              assessment.settings.interviewVoiceGender || undefined,
            createdAt: assessment.settings.createdAt || undefined,
            updatedAt: assessment.settings.updatedAt || undefined,
          }
        : undefined,
      videoAnalysis: assessment.videoAnalysis
        ? {
            videoUrl: assessment.videoAnalysis.videoUrl || undefined,
            transcriptText:
              assessment.videoAnalysis.transcriptText || undefined,
            overallScore: assessment.videoAnalysis.overallScore || undefined,
            overallFeedback:
              assessment.videoAnalysis.overallFeedback || undefined,
            engagementScore:
              assessment.videoAnalysis.engagementScore || undefined,
            engagementFeedback:
              assessment.videoAnalysis.engagementFeedback || undefined,
            confidenceScore:
              assessment.videoAnalysis.confidenceScore || undefined,
            confidenceFeedback:
              assessment.videoAnalysis.confidenceFeedback || undefined,
            clarityScore: assessment.videoAnalysis.clarityScore || undefined,
            clarityFeedback:
              assessment.videoAnalysis.clarityFeedback || undefined,
            professionalDemeanorScore:
              assessment.videoAnalysis.professionalDemeanorScore || undefined,
            professionalDemeanorFeedback:
              assessment.videoAnalysis.professionalDemeanorFeedback ||
              undefined,
            proctoringScore:
              assessment.videoAnalysis.proctoringScore || undefined,
            proctoringFeedback:
              assessment.videoAnalysis.proctoringFeedback || undefined,
            strengths: assessment.videoAnalysis.strengths || [],
            areasForImprovement:
              assessment.videoAnalysis.areasForImprovement || [],
            highlightsInstructions:
              assessment.videoAnalysis.highlightsInstructions || undefined,
            highlightsVideoUrl:
              assessment.videoAnalysis.highlightsVideoUrl || undefined,
          }
        : undefined,
    };
  }

  /**
   * Get presigned URL for video chunk upload
   */
  async getPresignedUrl(
    assessmentId: string,
    chunkIndex?: number
  ): Promise<{
    presignedUrl: string;
    chunkIndex: number;
    gcsUri: string;
    filePath: string;
  }> {
    try {
      logger.info({
        message: 'Getting presigned URL for video upload',
        context: 'PublicPracticeAssessmentService.getPresignedUrl',
        assessmentId,
        chunkIndex,
      });

      // Verify assessment exists
      const assessment =
        await this.prisma.public_practice_assessment.findUnique({
          where: { id: assessmentId },
        });

      if (!assessment) {
        throw new AppError(
          'Public practice assessment not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      if (!this.storageProvider) {
        throw new AppError(
          'Storage provider not configured',
          500,
          ErrorCode.SERVICE_UNAVAILABLE
        );
      }

      // Use provided chunkIndex or calculate next chunk index
      let nextChunkIndex: number;
      if (chunkIndex !== undefined) {
        nextChunkIndex = chunkIndex;
      } else {
        // Get next chunk index
        const lastChunk =
          await this.prisma.public_practice_assessment_video_chunk_analysis.findFirst(
            {
              where: {
                assessmentId,
                status: {
                  in: ['uploaded', 'completed'],
                },
              },
              orderBy: { chunkIndex: 'desc' },
              select: { chunkIndex: true },
            }
          );

        nextChunkIndex = lastChunk ? lastChunk.chunkIndex + 1 : 0;
      }

      // Generate file path
      const { folderPath } =
        getBucketFolderPathToPublicPracticeAssessmentVideoChunks(assessmentId);
      const fileName = `chunk-${nextChunkIndex}-${Date.now()}.webm`;
      const filePath = `${folderPath}/${fileName}`;
      const gcsUri = `gs://${ENV.GCS_BUCKET_NAME}/${filePath}`;

      // Generate presigned URL
      const presignedUrl = await this.storageProvider.generatePreSignedUrl(
        filePath,
        'write',
        'video/webm;codecs=vp8,opus'
      );

      logger.info({
        message: 'Presigned URL generated successfully',
        context: 'PublicPracticeAssessmentService.getPresignedUrl',
        assessmentId,
        chunkIndex: nextChunkIndex,
        fileName,
      });

      return {
        presignedUrl,
        chunkIndex: nextChunkIndex,
        gcsUri,
        filePath,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to get presigned URL',
        context: 'PublicPracticeAssessmentService.getPresignedUrl',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessmentId,
        chunkIndex,
      });
      throw error;
    }
  }

  /**
   * Record chunk upload and trigger analysis
   */
  async recordChunkUpload(
    assessmentId: string,
    chunkIndex: number,
    gcsUri: string,
    questionId?: string,
    sectionId?: string
  ): Promise<{ success: boolean; chunkId: string }> {
    try {
      logger.info({
        message: 'Recording chunk upload',
        context: 'PublicPracticeAssessmentService.recordChunkUpload',
        assessmentId,
        chunkIndex,
        gcsUri,
        questionId,
        sectionId,
      });

      // Verify assessment exists
      const assessment =
        await this.prisma.public_practice_assessment.findUnique({
          where: { id: assessmentId },
        });

      if (!assessment) {
        throw new AppError(
          'Public practice assessment not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Verify file exists in GCS if questionId is provided
      if (questionId && this.storageProvider) {
        try {
          const filePath = gcsUri.replace(`gs://${ENV.GCS_BUCKET_NAME}/`, '');
          const exists = await this.storageProvider.fileExists(filePath);

          if (!exists) {
            throw new AppError(
              'Video chunk file not found in storage',
              404,
              ErrorCode.FILE_NOT_FOUND
            );
          }
        } catch (storageError) {
          logger.error({
            message: 'Failed to verify chunk file in GCS',
            context: 'PublicPracticeAssessmentService.recordChunkUpload',
            error:
              storageError instanceof Error
                ? storageError.message
                : 'Unknown error',
            assessmentId,
            chunkIndex,
            questionId,
            gcsUri,
          });
          throw new AppError(
            'Failed to verify uploaded video chunk',
            500,
            ErrorCode.STORAGE_ERROR
          );
        }
      }

      // Determine attempt number
      let attemptNumber = 1;
      if (questionId) {
        const existingChunks =
          await this.prisma.public_practice_assessment_video_chunk_analysis.findMany(
            {
              where: {
                assessmentId,
                questionId,
              },
              orderBy: { attemptNumber: 'desc' },
              take: 1,
            }
          );

        if (existingChunks.length > 0) {
          attemptNumber = existingChunks[0].attemptNumber;
        }
      }

      // Create or update chunk record
      const chunk =
        await this.prisma.public_practice_assessment_video_chunk_analysis.upsert(
          {
            where: {
              public_practice_video_chunk_analysis_assessment_id_chunk_index_section_id_key:
                {
                  assessmentId,
                  chunkIndex,
                  sectionId: sectionId ?? null,
                } as Prisma.public_practice_assessment_video_chunk_analysisWhereUniqueInput['public_practice_video_chunk_analysis_assessment_id_chunk_index_section_id_key'],
            },
            create: {
              assessmentId,
              chunkIndex,
              gcsUri,
              questionId: questionId || null,
              sectionId: sectionId || null,
              attemptNumber,
              status: questionId
                ? PublicPracticeAssessmentVideoAnalysisStatusEnum.UPLOADED
                : PublicPracticeAssessmentVideoAnalysisStatusEnum.SKIPPED,
            },
            update: {
              gcsUri,
              questionId: questionId || null,
              sectionId: sectionId || null,
              attemptNumber,
              status: questionId
                ? PublicPracticeAssessmentVideoAnalysisStatusEnum.UPLOADED
                : PublicPracticeAssessmentVideoAnalysisStatusEnum.SKIPPED,
            },
          }
        );

      logger.info({
        message: 'Chunk recorded successfully',
        context: 'PublicPracticeAssessmentService.recordChunkUpload',
        assessmentId,
        chunkIndex,
        chunkId: chunk.id,
        questionId,
        sectionId,
      });

      return {
        success: true,
        chunkId: chunk.id,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to record chunk upload',
        context: 'PublicPracticeAssessmentService.recordChunkUpload',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessmentId,
        chunkIndex,
        gcsUri,
        questionId,
        sectionId,
      });
      throw error;
    }
  }

  /**
   * Update terms acceptance status for a public practice assessment
   * No authentication required - uses assessmentId
   */
  async updateTermsAccepted(
    assessmentId: string,
    termsAccepted: boolean
  ): Promise<void> {
    try {
      logger.info('Updating terms acceptance for public practice assessment', {
        context: 'PublicPracticeAssessmentService.updateTermsAccepted',
        assessmentId,
        termsAccepted,
      });

      // Check if assessment exists
      const assessment =
        await this.prisma.public_practice_assessment.findUnique({
          where: { id: assessmentId },
        });

      if (!assessment) {
        throw new AppError(
          'Public practice assessment not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Update terms acceptance
      await this.prisma.public_practice_assessment.update({
        where: { id: assessmentId },
        data: {
          termsAccepted,
          termsAcceptedAt: termsAccepted ? new Date() : null,
        },
      });

      logger.info('Terms acceptance updated successfully', {
        context: 'PublicPracticeAssessmentService.updateTermsAccepted',
        assessmentId,
        termsAccepted,
      });
    } catch (error) {
      logger.error('Failed to update terms acceptance', {
        context: 'PublicPracticeAssessmentService.updateTermsAccepted',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessmentId,
        termsAccepted,
      });
      throw error;
    }
  }

  /**
   * Get global practice assessment settings
   */
  async getGlobalPracticeAssessmentSettings(): Promise<IGlobalPracticeAssessmentSettings> {
    try {
      const globalSettingsDb =
        await this.prisma.global_practice_assessment_settings.findFirst({
          where: { isSingleton: true },
        });

      if (!globalSettingsDb) {
        // Return default settings if not found
        return {
          id: '',
          name: 'Default Practice Assessment Settings',
          description: 'Default settings for practice assessments',
          isSingleton: true,
          greetingMessage: '',
          defaultAssessmentDuration: 3600,
          defaultPassingScore: 0.7,
          requiredSections: ['TECHNICAL', 'BEHAVIORAL'],
          maximumAttempts: 3,
          cooldownPeriod: 7,
          maxSections: 3,
          maxQuestionsPerSection: 5,
          proctoringEnabled: true,
          maxWarnings: 3,
          tabSwitchLimit: 3,
          copyPasteAllowed: false,
          videoRecordingEnabled: true,
          minimumVideoLength: 10,
          aiVideoAnalysisEnabled: true,
          autoPublishOnSuccess: false,
          autoNotifyOnComplete: true,
          interviewLanguage: 'ENGLISH',
          interviewDialect: 'en-US',
          interviewVoiceGender: 'female',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      return toGlobalPracticeAssessmentSettingsDomain(globalSettingsDb);
    } catch (error) {
      logger.error('Failed to get global practice assessment settings', {
        context:
          'PublicPracticeAssessmentService.getGlobalPracticeAssessmentSettings',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Update global practice assessment settings
   */
  async updateGlobalPracticeAssessmentSettings(
    data: IGlobalPracticeAssessmentSettingsUpdate
  ): Promise<IGlobalPracticeAssessmentSettings> {
    try {
      // Get or create the singleton global settings
      const globalSettingsDb =
        await this.prisma.global_practice_assessment_settings.upsert({
          where: { isSingleton: true },
          create: {
            name: 'Default Practice Assessment Settings',
            description: 'Default settings for practice assessments',
            isSingleton: true,
            greetingMessage: data.greetingMessage || '',
            defaultAssessmentDuration: data.defaultAssessmentDuration || 3600,
            defaultPassingScore: data.defaultPassingScore || 0.7,
            requiredSections: data.requiredSections || [
              'TECHNICAL',
              'BEHAVIORAL',
            ],
            maximumAttempts: data.maximumAttempts || 3,
            cooldownPeriod: data.cooldownPeriod || 7,
            maxSections: data.maxSections || 3,
            maxQuestionsPerSection: data.maxQuestionsPerSection || 5,
            proctoringEnabled: data.proctoringEnabled ?? true,
            maxWarnings: data.maxWarnings || 3,
            tabSwitchLimit: data.tabSwitchLimit || 3,
            copyPasteAllowed: data.copyPasteAllowed ?? false,
            videoRecordingEnabled: data.videoRecordingEnabled ?? true,
            minimumVideoLength: data.minimumVideoLength || 300,
            aiVideoAnalysisEnabled: data.aiVideoAnalysisEnabled ?? true,
            autoPublishOnSuccess: data.autoPublishOnSuccess ?? false,
            autoNotifyOnComplete: data.autoNotifyOnComplete ?? true,
            interviewLanguage: data.interviewLanguage || 'ENGLISH',
            interviewDialect: data.interviewDialect || 'en-US',
            interviewVoiceGender: data.interviewVoiceGender || 'female',
          },
          update: {
            ...(data.greetingMessage !== undefined && {
              greetingMessage: data.greetingMessage,
            }),
            ...(data.defaultAssessmentDuration !== undefined && {
              defaultAssessmentDuration: data.defaultAssessmentDuration,
            }),
            ...(data.defaultPassingScore !== undefined && {
              defaultPassingScore: data.defaultPassingScore,
            }),
            ...(data.requiredSections !== undefined && {
              requiredSections: data.requiredSections,
            }),
            ...(data.maximumAttempts !== undefined && {
              maximumAttempts: data.maximumAttempts,
            }),
            ...(data.cooldownPeriod !== undefined && {
              cooldownPeriod: data.cooldownPeriod,
            }),
            ...(data.maxSections !== undefined && {
              maxSections: data.maxSections,
            }),
            ...(data.maxQuestionsPerSection !== undefined && {
              maxQuestionsPerSection: data.maxQuestionsPerSection,
            }),
            ...(data.proctoringEnabled !== undefined && {
              proctoringEnabled: data.proctoringEnabled,
            }),
            ...(data.maxWarnings !== undefined && {
              maxWarnings: data.maxWarnings,
            }),
            ...(data.tabSwitchLimit !== undefined && {
              tabSwitchLimit: data.tabSwitchLimit,
            }),
            ...(data.copyPasteAllowed !== undefined && {
              copyPasteAllowed: data.copyPasteAllowed,
            }),
            ...(data.videoRecordingEnabled !== undefined && {
              videoRecordingEnabled: data.videoRecordingEnabled,
            }),
            ...(data.minimumVideoLength !== undefined && {
              minimumVideoLength: data.minimumVideoLength,
            }),
            ...(data.aiVideoAnalysisEnabled !== undefined && {
              aiVideoAnalysisEnabled: data.aiVideoAnalysisEnabled,
            }),
            ...(data.autoPublishOnSuccess !== undefined && {
              autoPublishOnSuccess: data.autoPublishOnSuccess,
            }),
            ...(data.autoNotifyOnComplete !== undefined && {
              autoNotifyOnComplete: data.autoNotifyOnComplete,
            }),
            ...(data.interviewLanguage !== undefined && {
              interviewLanguage: data.interviewLanguage,
            }),
            ...(data.interviewDialect !== undefined && {
              interviewDialect: data.interviewDialect,
            }),
            ...(data.interviewVoiceGender !== undefined && {
              interviewVoiceGender: data.interviewVoiceGender,
            }),
          },
        });

      return toGlobalPracticeAssessmentSettingsDomain(globalSettingsDb);
    } catch (error) {
      logger.error('Failed to update global practice assessment settings', {
        context:
          'PublicPracticeAssessmentService.updateGlobalPracticeAssessmentSettings',
        error: error instanceof Error ? error.message : 'Unknown error',
        data,
      });
      throw error;
    }
  }
}
