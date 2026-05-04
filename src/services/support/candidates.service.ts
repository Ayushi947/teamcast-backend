import {
  PrismaClient,
  Prisma,
  work_type as PrismaWorkType,
  work_commitment as PrismaWorkCommitment,
  application_status,
} from '@prisma/client';
import { singleton } from '@/shared/decorators/singleton';
import { INotificationProvider } from '../notification/notification.interface';
import { IStorageProvider } from '../helpers/storage/storage.interface';
import { StorageFactory } from '../helpers/storage/storage.factory';
import { OnboardingAssessmentService } from '../candidate/onboarding.assessment.service';
import { OnboardingAssessmentFactory } from '../helpers/ai.onboarding.assessment/onboarding.assessment.factory';
import { JobAiAssessmentService } from '../candidate/job.ai.assessment.service';
import { JobAiAssessmentFactory } from '../helpers/job.ai.assessment/job.ai.assessment.factory';
import {
  ISupportCandidate,
  ISupportCandidateFilterQuery,
  ISupportCandidateUpdate,
  ISupportCandidateListResponse,
  toSupportCandidateDomain,
  ISupportRecommendedCandidate,
  ISupportCandidateResetOnboardingAssessmentResponse,
  ISupportCandidateActionResponse,
} from '@/shared/models/domain/support/candidates.domain';
import {
  IPaginationRequest,
  IPaginatedResponse,
} from '@/shared/models/api/common/common.api';
import { buildQueryConditions } from '@/utils/pagination';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';
import { AppError } from '@/utils/app.error';
import {
  CandidateAssessmentStageEnum,
  CandidateOnboardingAssessmentStatusEnum,
  OnboardingAssessmentRecommendationEnum,
  OnboardingAssessmentResultEnum,
  OnboardingAssessmentStatusEnum,
  OnboardingAssessmentVideoAnalysisStatusEnum,
  CandidateReviewStatusEnum,
  JobAiAssessmentInviteStatusEnum,
  JobInviteStatusEnum,
  JobAiAssessmentStatusEnum,
  JobAiAssessmentResultEnum,
  JobAiAssessmentVideoAnalysisStatusEnum,
  JobAiAssessmentTaskStatusEnum,
} from '@/shared/models/common/enums';
import { RagCronService } from '../cron/rag.cron.service';
import { IClientResumeViewResponse } from '@/shared/models/domain/client/resume.view.domain';
import { ENV } from '@/config/env';
import { extractVideoDurationFromStorage } from '@/utils/video.helper';

@singleton
export class SupportCandidatesService {
  private readonly prisma: PrismaClient;
  private readonly storageProvider: IStorageProvider;
  private readonly storageService: IStorageProvider;
  private readonly ragCronService: RagCronService;
  private readonly onboardingAssessmentService: OnboardingAssessmentService;
  private readonly jobAiAssessmentService: JobAiAssessmentService;
  // Rate limiting storage: candidateId -> last resubmit timestamp
  private static resubmitRateLimitMap = new Map<string, number>();
  private static readonly RESUBMIT_RATE_LIMIT_MS = 10 * 60 * 1000; // 10 minutes

  constructor(
    private readonly notificationProvider: INotificationProvider,
    onboardingAssessmentService?: OnboardingAssessmentService,
    jobAiAssessmentService?: JobAiAssessmentService
  ) {
    this.prisma = new PrismaClient();
    this.storageProvider = StorageFactory.getInstance().getProvider();
    this.storageService = StorageFactory.getInstance().getProvider();
    this.ragCronService = new RagCronService();

    // Initialize or use injected OnboardingAssessmentService
    if (onboardingAssessmentService) {
      this.onboardingAssessmentService = onboardingAssessmentService;
    } else {
      const onboardingAssessmentProvider =
        OnboardingAssessmentFactory.getInstance().getProvider();
      this.onboardingAssessmentService = new OnboardingAssessmentService(
        onboardingAssessmentProvider,
        this.storageProvider
      );
    }

    // Initialize or use injected JobAiAssessmentService
    if (jobAiAssessmentService) {
      this.jobAiAssessmentService = jobAiAssessmentService;
    } else {
      const jobAiAssessmentProvider =
        JobAiAssessmentFactory.getInstance().getProvider();
      this.jobAiAssessmentService = new JobAiAssessmentService(
        jobAiAssessmentProvider,
        this.storageProvider
      );
    }
  }

  /**
   * Helper method to convert video URLs to presigned URLs
   */
  private async convertVideoUrlsToPresigned(
    assessments: any[]
  ): Promise<any[]> {
    if (!assessments || assessments.length === 0) {
      return assessments;
    }

    for (const assessment of assessments) {
      if (assessment.videoAnalysis?.videoUrl) {
        try {
          const presignedUrl = await this.storageProvider.generatePreSignedUrl(
            assessment.videoAnalysis.videoUrl,
            'read'
          );
          assessment.videoAnalysis.videoUrl = presignedUrl;
        } catch (error) {
          logger.warn('Failed to generate presigned URL for video', {
            error: error instanceof Error ? error.message : 'Unknown error',
            videoUrl: assessment.videoAnalysis.videoUrl,
            context: 'SupportCandidatesService.convertVideoUrlsToPresigned',
          });
        }
      }

      if (assessment.videoAnalysis?.highlightsVideoUrl) {
        try {
          const presignedUrl = await this.storageProvider.generatePreSignedUrl(
            assessment.videoAnalysis.highlightsVideoUrl,
            'read'
          );
          assessment.videoAnalysis.highlightsVideoUrl = presignedUrl;
        } catch (error) {
          logger.warn('Failed to generate presigned URL for highlights video', {
            error: error instanceof Error ? error.message : 'Unknown error',
            highlightsVideoUrl: assessment.videoAnalysis.highlightsVideoUrl,
            context: 'SupportCandidatesService.convertVideoUrlsToPresigned',
          });
        }
      }
    }

    return assessments;
  }

  /**
   * Extract filename from a full storage path
   */
  private extractFileName(filePath: string): string {
    if (!filePath) {
      return 'resume.pdf';
    }
    const parts = filePath.split('/');
    return parts[parts.length - 1] || 'resume.pdf';
  }

  /**
   * List candidates with optional filtering
   */
  async listSupportCandidates(
    filter: ISupportCandidateFilterQuery & { search?: string },
    paginationRequest: IPaginationRequest
  ): Promise<IPaginatedResponse<ISupportCandidateListResponse>> {
    try {
      // Build query conditions with proper sorting configuration
      const queryConditions = buildQueryConditions(filter, paginationRequest, {
        search: {
          searchableFields: [],
          relationFields: {
            user: ['name', 'email'],
          },
        },
        filter: {
          allowedFields: ['status', 'assessmentStage'],
          enumFields: ['status', 'assessmentStage'],
        },
        sort: {
          allowedFields: [
            'id',
            'createdAt',
            'updatedAt',
            'completionPercentage',
          ],
          relationFields: {
            fullName: { relation: 'user', field: 'name' },
            name: { relation: 'user', field: 'name' },
            email: { relation: 'user', field: 'email' },
          },
          defaultSort: { field: 'createdAt', order: 'desc' },
        },
      });

      // Build where clause based on filters - buildQueryConditions already handles all filtering
      const where: Prisma.candidateWhereInput = {
        ...queryConditions.where,
      };

      // Get total count for pagination
      const total = await this.prisma.candidate.count({
        where,
      });

      // Get paginated results
      const candidates = await this.prisma.candidate.findMany({
        where,
        skip: queryConditions.skip,
        take: queryConditions.take,
        orderBy: queryConditions.orderBy,
        include: {
          user: {
            include: {
              partnerUser: {
                include: {
                  partner: {
                    include: {
                      company: {
                        select: {
                          id: true,
                          name: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          resume: {
            select: {
              phone: true,
            },
          },
          onboardingAssessments: {
            orderBy: {
              completedAt: 'desc',
            },
            take: 1,
            select: {
              id: true,
              recommendation: true,
              completedAt: true,
              status: true,
            },
          },
          resumeAssessments: {
            orderBy: {
              completedAt: 'desc',
            },
            take: 1,
            select: {
              id: true,
              recommendation: true,
              completedAt: true,
              status: true,
            },
          },
          jobAiAssessments: {
            orderBy: {
              completedAt: 'desc',
            },
            take: 1,
            select: {
              id: true,
              recommendation: true,
              completedAt: true,
              status: true,
            },
          },
        },
      });

      // Transform to desired format
      const transformedCandidates: ISupportCandidateListResponse[] =
        candidates.map((candidate) => {
          const latestJobAi = candidate.jobAiAssessments[0];
          // Check if Job AI assessment has started (status is not NOT_STARTED)
          const hasJobAiStarted =
            latestJobAi &&
            latestJobAi.status !== JobAiAssessmentStatusEnum.NOT_STARTED;

          // Derive assessment stage: only show JOB_AI_ASSESSMENT if assessment has started
          const effectiveAssessmentStage = hasJobAiStarted
            ? CandidateAssessmentStageEnum.JOB_AI_ASSESSMENT
            : candidate.assessmentStage;

          return {
            id: candidate.id,
            fullName: candidate.user.name,
            email: candidate.user.email,
            phone: candidate.resume?.phone || null,
            status: candidate.status,
            assessmentStage: effectiveAssessmentStage,
            jobSearchStatus: candidate.jobSearchStatus,
            partner: candidate.user.partnerUser?.partner
              ? {
                  id: candidate.user.partnerUser.partner.id,
                  name: candidate.user.partnerUser.partner.company.name,
                }
              : undefined,
            completionPercentage: candidate.completionPercentage,
            resumeAssessmentStatus: candidate.resumeAssessmentStatus,
            onboardingAssessmentStatus: candidate.onboardingAssessmentStatus,
            jobAiAssessmentStatus:
              latestJobAi?.status || JobAiAssessmentStatusEnum.NOT_STARTED,
            onboardingAssessmentRecommendation:
              candidate.onboardingAssessments[0]?.recommendation || undefined,
            resumeAssessmentRecommendation:
              candidate.resumeAssessments[0]?.recommendation || undefined,
            jobAiAssessmentRecommendation:
              latestJobAi?.recommendation || undefined,
            isImportedCandidate: candidate.isImportedCandidate,
            importedByClientId: candidate.importedByClientId,
            importedJobPostingId: candidate.importedJobPostingId,
            importedIntegrationId: candidate.importedIntegrationId,
            createdAt: candidate.createdAt.toISOString(),
          };
        });

      return {
        items: transformedCandidates,
        pagination: {
          total,
          page: queryConditions.pagination.page,
          limit: queryConditions.pagination.limit,
          totalPages: Math.ceil(total / queryConditions.pagination.limit),
        },
      };
    } catch (error) {
      logger.error({
        message: 'Failed to list support candidates',
        context: 'SupportCandidatesService.listSupportCandidates',
        error: error instanceof Error ? error.message : 'Unknown error',
        filter,
        paginationRequest,
      });
      throw error;
    }
  }
  /**
   * Get a candidate by ID
   */
  async getSupportCandidate(
    supportCandidateId: string
  ): Promise<ISupportCandidate> {
    try {
      const supportCandidate = await this.prisma.candidate.findUnique({
        where: { id: supportCandidateId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          partner: {
            select: {
              id: true,
              company: {
                select: {
                  name: true,
                  contactEmail: true,
                  website: true,
                  industry: true,
                  size: true,
                },
              },
            },
          },
          settings: {
            include: {
              globalSettings: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
          preferences: true,
          resume: {
            include: {
              experience: {
                include: {
                  projects: true,
                },
              },
              education: true,
              certifications: true,
            },
          },
          applications: {
            include: {
              jobPosting: {
                include: {
                  client: {
                    include: {
                      company: {
                        select: {
                          name: true,
                        },
                      },
                    },
                  },
                },
              },
            },
            orderBy: {
              appliedAt: 'desc',
            },
          },
          jobAiAssessmentInvitations: {
            include: {
              jobAiAssessment: {
                include: {
                  jobApplication: {
                    include: {
                      jobPosting: {
                        select: {
                          title: true,
                          client: {
                            include: {
                              company: {
                                select: {
                                  name: true,
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              invitedBy: {
                select: {
                  id: true,
                  user: {
                    select: {
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          jobAiAssessments: {
            include: {
              jobApplication: {
                include: {
                  jobPosting: {
                    select: {
                      title: true,
                      client: {
                        include: {
                          company: {
                            select: {
                              name: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              sections: {
                include: {
                  questions: true,
                },
                orderBy: {
                  order: 'asc',
                },
              },
              videoAnalysis: true,
              proctoring: true,
              jobAiAssessmentSettings: true,
            },
            orderBy: {
              completedAt: 'desc',
            },
          },
          resumeAssessments: {
            include: {
              task: true,
            },
            orderBy: {
              completedAt: 'desc',
            },
          },
          onboardingAssessments: {
            include: {
              sections: {
                include: {
                  questions: true,
                },
                orderBy: {
                  order: 'asc',
                },
              },
              videoAnalysis: true,
              proctoring: true,
              onboardingAssessmentSettings: true,
            },
            orderBy: [{ completedAt: 'desc' }, { createdAt: 'desc' }],
          },
          publicPracticeAssessments: {
            include: {
              sections: {
                include: {
                  questions: true,
                },
                orderBy: {
                  order: 'asc',
                },
              },
              videoAnalysis: true,
              proctoring: true,
              settings: true,
            },
            orderBy: [{ completedAt: 'desc' }, { createdAt: 'desc' }],
          },
          views: {
            include: {
              clientUser: {
                include: {
                  user: {
                    select: {
                      name: true,
                      email: true,
                    },
                  },
                  client: {
                    include: {
                      company: {
                        select: {
                          name: true,
                        },
                      },
                    },
                  },
                },
              },
              jobPosting: {
                select: {
                  title: true,
                },
              },
            },
            orderBy: {
              viewedAt: 'desc',
            },
            take: 50, // Limit to recent 50 views
          },
          savedJobs: {
            include: {
              jobPosting: {
                include: {
                  client: {
                    include: {
                      company: {
                        select: {
                          name: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          candidateSubscription: {
            include: {
              package: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  price: true,
                  currency: true,
                  billingCycle: true,
                  isActive: true,
                  isDefault: true,
                  maxAssessmentsPerMonth: true,
                  maxPracticeAssessments: true,
                  accessToAllSkills: true,
                  personalizedFeedback: true,
                  careerCoaching: true,
                  paymentProvider: true,
                  paymentProviderPriceId: true,
                  paymentProviderProductId: true,
                  features: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
              creditPurchases: {
                select: {
                  id: true,
                  creditType: true,
                  creditsAmount: true,
                  costPerCredit: true,
                  totalCost: true,
                  currency: true,
                  paymentProvider: true,
                  paymentProviderPaymentIntentId: true,
                  paymentProviderInvoiceId: true,
                  isPaid: true,
                  paidAt: true,
                  createdAt: true,
                  updatedAt: true,
                },
                orderBy: {
                  createdAt: 'desc',
                },
              },
            },
          },
        },
      });

      if (!supportCandidate) {
        throw new AppError('Candidate not found', 404, ErrorCode.NOT_FOUND);
      }

      // Convert video URLs to presigned URLs for assessments
      if (supportCandidate.jobAiAssessments) {
        await this.convertVideoUrlsToPresigned(
          supportCandidate.jobAiAssessments
        );
      }
      if (supportCandidate.onboardingAssessments) {
        await this.convertVideoUrlsToPresigned(
          supportCandidate.onboardingAssessments
        );
      }
      if (supportCandidate.publicPracticeAssessments) {
        await this.convertVideoUrlsToPresigned(
          supportCandidate.publicPracticeAssessments
        );
      }

      let imageUrl = supportCandidate.user.image;
      if (imageUrl && !imageUrl.startsWith('http')) {
        try {
          const presignedUrl = await this.storageService.generatePreSignedUrl(
            imageUrl,
            'read'
          );
          imageUrl = presignedUrl;
        } catch (_error) {
          imageUrl = null;
        }
      }

      const supportCandidateForResponse = {
        ...supportCandidate,
        user: {
          ...supportCandidate.user,
          image: imageUrl,
        },
      };

      return toSupportCandidateDomain(supportCandidateForResponse);
    } catch (error) {
      logger.error({
        message: 'Failed to get candidate details',
        context: 'SupportCandidatesService.getSupportCandidate',
        error: error instanceof Error ? error.message : 'Unknown error',
        supportCandidateId,
      });
      throw error;
    }
  }

  /**
   * Generate a pre-signed URL for viewing a candidate's resume
   */
  async viewCandidateResume(
    supportUserId: string,
    supportCandidateId: string
  ): Promise<IClientResumeViewResponse> {
    try {
      const candidate = await this.prisma.candidate.findUnique({
        where: { id: supportCandidateId },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          resume: true,
        },
      });

      if (!candidate) {
        throw new AppError('Candidate not found', 404, ErrorCode.NOT_FOUND);
      }

      if (!candidate.resume || !candidate.resume.resumeFileUrl) {
        throw new AppError(
          'User has not uploaded a resume',
          404,
          ErrorCode.RESUME_NOT_FOUND
        );
      }

      const viewUrl = await this.storageProvider.generatePreSignedUrl(
        candidate.resume.resumeFileUrl,
        'read'
      );

      const response: IClientResumeViewResponse = {
        viewUrl,
        fileName: this.extractFileName(candidate.resume.resumeFileUrl),
        fileSize: 0,
        mimeType: 'application/pdf',
        expiresAt: new Date(Date.now() + 3600 * 1000),
        candidateId: supportCandidateId,
        candidateName: candidate.user?.name ?? 'Candidate',
        viewedAt: new Date(),
      };

      logger.info('Support resume view generated successfully', {
        context: 'SupportCandidatesService.viewCandidateResume',
        supportUserId,
        supportCandidateId,
      });

      return response;
    } catch (error) {
      logger.error({
        message: 'Failed to generate support resume view URL',
        context: 'SupportCandidatesService.viewCandidateResume',
        error: error instanceof Error ? error.message : 'Unknown error',
        supportUserId,
        supportCandidateId,
      });
      throw error;
    }
  }

  /**
   * Update a candidate with comprehensive field support
   */
  async updateSupportCandidate(
    _requestingUserId: string,
    supportCandidateId: string,
    updateData: ISupportCandidateUpdate
  ): Promise<ISupportCandidate> {
    try {
      // Use transaction to ensure all updates are atomic
      await this.prisma.$transaction(async (tx) => {
        // Update user data if provided
        const userUpdateData: any = {};
        if (updateData.fullName) {
          userUpdateData.name = updateData.fullName;
        }
        if (updateData.email) userUpdateData.email = updateData.email;
        if (updateData.image) {
          if (updateData.image.startsWith('http')) {
            logger.warn({
              message:
                'Ignoring presigned URL for profile image update request',
              context: 'SupportCandidatesService.updateSupportCandidate',
              supportCandidateId,
            });
          } else {
            userUpdateData.image = updateData.image;
          }
        }
        // Note: phone is stored in resume table, not user table

        if (Object.keys(userUpdateData).length > 0) {
          await tx.user.update({
            where: {
              id: (
                await tx.candidate.findUnique({
                  where: { id: supportCandidateId },
                  select: { userId: true },
                })
              )?.userId,
            },
            data: userUpdateData,
          });
        }

        // Update candidate data
        const candidateUpdateData: any = {
          updatedBy: _requestingUserId,
        };

        // Basic candidate fields
        if (updateData.status) candidateUpdateData.status = updateData.status;
        if (updateData.assessmentStage)
          candidateUpdateData.assessmentStage = updateData.assessmentStage;
        if (updateData.resumeAssessmentStatus)
          candidateUpdateData.resumeAssessmentStatus =
            updateData.resumeAssessmentStatus;
        if (updateData.onboardingAssessmentStatus)
          candidateUpdateData.onboardingAssessmentStatus =
            updateData.onboardingAssessmentStatus;
        if (updateData.jobSearchStatus)
          candidateUpdateData.jobSearchStatus = updateData.jobSearchStatus;
        if (updateData.sex) candidateUpdateData.sex = updateData.sex;
        if (updateData.birthDate)
          candidateUpdateData.birthDate = new Date(updateData.birthDate);
        if (updateData.maritalStatus)
          candidateUpdateData.maritalStatus = updateData.maritalStatus;
        if (updateData.isPublished !== undefined)
          candidateUpdateData.isPublished = updateData.isPublished;
        if (updateData.isDirty !== undefined)
          candidateUpdateData.isDirty = updateData.isDirty;
        if (updateData.completionPercentage !== undefined)
          candidateUpdateData.completionPercentage =
            updateData.completionPercentage;
        if (updateData.createdBy)
          candidateUpdateData.createdBy = updateData.createdBy;
        if (updateData.note !== undefined)
          candidateUpdateData.note = updateData.note;

        // Partner relationship
        if (updateData.partnerId) {
          candidateUpdateData.partnerId = updateData.partnerId;
        }

        await tx.candidate.update({
          where: { id: supportCandidateId },
          data: candidateUpdateData,
        });

        // Update resume data if provided
        if (updateData.resume || updateData.phone) {
          const resumeData: any = {};
          if (updateData.resume?.summary !== undefined)
            resumeData.summary = updateData.resume.summary;
          if (updateData.resume?.skills)
            resumeData.resumeSkills = updateData.resume.skills;
          if (updateData.resume?.industries)
            resumeData.industries = updateData.resume.industries;
          if (updateData.resume?.totalExperience !== undefined)
            resumeData.totalExperience = updateData.resume.totalExperience;
          if (updateData.resume?.highestEducationLevel)
            resumeData.highestEducationLevel =
              updateData.resume.highestEducationLevel;

          // Handle phone field which is stored in resume table
          if (updateData.phone !== undefined)
            resumeData.phone = updateData.phone;

          // Update or create resume
          await tx.resume.upsert({
            where: { candidateId: supportCandidateId },
            create: {
              candidateId: supportCandidateId,
              summary: resumeData.summary || '',
              primaryIndustry:
                updateData.resume?.industries?.[0] || 'Technology',
              totalExperience: resumeData.totalExperience || 0,
              highestEducationLevel:
                resumeData.highestEducationLevel || 'HIGH_SCHOOL',
              resumeSkills: resumeData.resumeSkills || [],
              industries: resumeData.industries || [],
              phone: resumeData.phone || '',
            },
            update: resumeData,
          });

          if (Array.isArray(updateData.resume?.experience)) {
            const experiencePayloads = updateData.resume.experience;

            if (experiencePayloads.length === 0) {
              await tx.resume_experience.deleteMany({
                where: { resume: { candidateId: supportCandidateId } },
              });
            } else {
              const incomingExperienceIds = experiencePayloads
                .map((exp) => exp.id)
                .filter((id): id is string => Boolean(id));

              await tx.resume_experience.deleteMany({
                where: {
                  resume: { candidateId: supportCandidateId },
                  ...(incomingExperienceIds.length > 0
                    ? { id: { notIn: incomingExperienceIds } }
                    : {}),
                },
              });
            }

            for (const exp of experiencePayloads) {
              const expData = exp as any;

              const workType =
                typeof expData.type === 'string' &&
                Object.values(PrismaWorkType).includes(
                  expData.type as PrismaWorkType
                )
                  ? (expData.type as PrismaWorkType)
                  : PrismaWorkType.EMPLOYEE;

              const workCommitment =
                typeof expData.commitment === 'string' &&
                Object.values(PrismaWorkCommitment).includes(
                  expData.commitment as PrismaWorkCommitment
                )
                  ? (expData.commitment as PrismaWorkCommitment)
                  : PrismaWorkCommitment.FULL_TIME;

              const experiencePayload = {
                position: expData.title,
                company: expData.company,
                industry: expData.industry || 'Technology',
                type: workType,
                commitment: workCommitment,
                startDate: new Date(expData.startDate),
                endDate: expData.endDate ? new Date(expData.endDate) : null,
                description: expData.description ?? '',
                location: expData.location,
              };

              if (expData.id) {
                await tx.resume_experience.update({
                  where: { id: expData.id },
                  data: experiencePayload,
                });

                if (Array.isArray(expData.projects)) {
                  await tx.resume_project.deleteMany({
                    where: { experienceId: expData.id },
                  });

                  for (const project of expData.projects) {
                    await tx.resume_project.create({
                      data: {
                        experienceId: expData.id,
                        name: project.name,
                        description: project.description,
                        role: 'Developer', // Default role
                        startDate: new Date(project.startDate),
                        endDate: project.endDate
                          ? new Date(project.endDate)
                          : null,
                      },
                    });
                  }
                }
              } else {
                const createdExp = await tx.resume_experience.create({
                  data: {
                    resume: { connect: { candidateId: supportCandidateId } },
                    ...experiencePayload,
                  },
                });

                if (Array.isArray(expData.projects)) {
                  for (const project of expData.projects) {
                    await tx.resume_project.create({
                      data: {
                        experienceId: createdExp.id,
                        name: project.name,
                        description: project.description,
                        role: 'Developer', // Default role
                        startDate: new Date(project.startDate),
                        endDate: project.endDate
                          ? new Date(project.endDate)
                          : null,
                      },
                    });
                  }
                }
              }
            }
          }

          // Update education if provided
          if (Array.isArray(updateData.resume?.education)) {
            const educationPayloads = updateData.resume.education;

            if (educationPayloads.length === 0) {
              await tx.resume_education.deleteMany({
                where: { resume: { candidateId: supportCandidateId } },
              });
            } else {
              const incomingEducationIds = educationPayloads
                .map((edu) => edu.id)
                .filter((id): id is string => Boolean(id));

              await tx.resume_education.deleteMany({
                where: {
                  resume: { candidateId: supportCandidateId },
                  ...(incomingEducationIds.length > 0
                    ? { id: { notIn: incomingEducationIds } }
                    : {}),
                },
              });
            }

            for (const edu of educationPayloads) {
              const eduData = edu as any;
              const educationPayload = {
                institution: eduData.institution,
                level: eduData.level || 'BACHELORS',
                degree: eduData.degree,
                fieldOfStudy: eduData.fieldOfStudy,
                startDate: new Date(eduData.startDate),
                endDate: eduData.endDate ? new Date(eduData.endDate) : null,
              };

              if (eduData.id) {
                await tx.resume_education.update({
                  where: { id: eduData.id },
                  data: educationPayload,
                });
              } else {
                await tx.resume_education.create({
                  data: {
                    resume: { connect: { candidateId: supportCandidateId } },
                    ...educationPayload,
                  },
                });
              }
            }
          }

          // Update certifications if provided
          if (Array.isArray(updateData.resume?.certifications)) {
            const certificationPayloads = updateData.resume.certifications;

            if (certificationPayloads.length === 0) {
              await tx.resume_certification.deleteMany({
                where: { resume: { candidateId: supportCandidateId } },
              });
            } else {
              const incomingCertificationIds = certificationPayloads
                .map((cert) => cert.id)
                .filter((id): id is string => Boolean(id));

              await tx.resume_certification.deleteMany({
                where: {
                  resume: { candidateId: supportCandidateId },
                  ...(incomingCertificationIds.length > 0
                    ? { id: { notIn: incomingCertificationIds } }
                    : {}),
                },
              });
            }

            for (const cert of certificationPayloads) {
              const certData = cert as any;
              const certificationPayload = {
                name: certData.name,
                issuer: certData.issuer,
                issueDate: new Date(certData.date),
                expiryDate: certData.expiryDate
                  ? new Date(certData.expiryDate)
                  : null,
                credentialId: certData.credentialId,
                credentialUrl: certData.credentialUrl,
              };

              if (certData.id) {
                await tx.resume_certification.update({
                  where: { id: certData.id },
                  data: certificationPayload,
                });
              } else {
                await tx.resume_certification.create({
                  data: {
                    resume: { connect: { candidateId: supportCandidateId } },
                    ...certificationPayload,
                  },
                });
              }
            }
          }
        }

        // Update candidate settings if provided
        if (updateData.settings) {
          const settingsData: any = {};

          // Handle all settings fields
          if (updateData.settings.notificationsEnabled !== undefined) {
            settingsData.notificationsEnabled =
              updateData.settings.notificationsEnabled;
          }
          if (updateData.settings.emailNotifications !== undefined) {
            settingsData.emailNotifications =
              updateData.settings.emailNotifications;
          }
          if (updateData.settings.pushNotifications !== undefined) {
            settingsData.pushNotifications =
              updateData.settings.pushNotifications;
          }
          if (updateData.settings.jobAlerts !== undefined) {
            settingsData.jobAlerts = updateData.settings.jobAlerts;
          }
          if (updateData.settings.applicationUpdates !== undefined) {
            settingsData.applicationUpdates =
              updateData.settings.applicationUpdates;
          }
          if (updateData.settings.profileVisibility !== undefined) {
            settingsData.profileVisibility =
              updateData.settings.profileVisibility;
          }
          if (updateData.settings.shareDataWithEmployers !== undefined) {
            settingsData.shareDataWithEmployers =
              updateData.settings.shareDataWithEmployers;
          }
          if (updateData.settings.darkMode !== undefined) {
            settingsData.darkMode = updateData.settings.darkMode;
          }
          if (updateData.settings.language !== undefined) {
            settingsData.language = updateData.settings.language;
          }
          if (updateData.settings.timezone !== undefined) {
            settingsData.timezone = updateData.settings.timezone;
          }
          if (updateData.settings.preferredCommunicationChannel !== undefined) {
            settingsData.preferredCommunicationChannel = updateData.settings
              .preferredCommunicationChannel as any;
          }

          // Handle globalSettingsId if it exists in the settings object
          if (updateData.settings.globalSettings?.id) {
            settingsData.globalSettingsId =
              updateData.settings.globalSettings.id;
          }

          await tx.candidate_settings.upsert({
            where: { candidateId: supportCandidateId },
            create: {
              candidateId: supportCandidateId,
              notificationsEnabled: settingsData.notificationsEnabled ?? true,
              emailNotifications: settingsData.emailNotifications ?? true,
              pushNotifications: settingsData.pushNotifications ?? true,
              jobAlerts: settingsData.jobAlerts ?? true,
              applicationUpdates: settingsData.applicationUpdates ?? true,
              profileVisibility: settingsData.profileVisibility ?? true,
              shareDataWithEmployers:
                settingsData.shareDataWithEmployers ?? true,
              darkMode: settingsData.darkMode ?? false,
              language: settingsData.language ?? 'en',
              timezone: settingsData.timezone ?? 'UTC',
              preferredCommunicationChannel:
                settingsData.preferredCommunicationChannel ?? 'EMAIL',
              globalSettingsId: settingsData.globalSettingsId,
            },
            update: settingsData,
          });
        }

        // Update candidate preferences if provided
        if (updateData.preferences) {
          const preferencesData: any = {};

          // Handle all preference fields
          if (updateData.preferences.preferredIndustries !== undefined) {
            preferencesData.preferredIndustries =
              updateData.preferences.preferredIndustries;
          }
          if (updateData.preferences.preferredLocations !== undefined) {
            preferencesData.preferredLocations =
              updateData.preferences.preferredLocations;
          }
          if (updateData.preferences.preferredJobTitles !== undefined) {
            preferencesData.preferredJobTitles =
              updateData.preferences.preferredJobTitles;
          }
          if (updateData.preferences.preferredJobCommitments !== undefined) {
            preferencesData.preferredJobCommitments =
              updateData.preferences.preferredJobCommitments;
          }
          if (updateData.preferences.preferredSalaryMin !== undefined) {
            preferencesData.preferredSalaryMin =
              updateData.preferences.preferredSalaryMin;
          }
          if (updateData.preferences.preferredSalaryMax !== undefined) {
            preferencesData.preferredSalaryMax =
              updateData.preferences.preferredSalaryMax;
          }
          if (updateData.preferences.preferredSalaryCurrency !== undefined) {
            preferencesData.preferredSalaryCurrency =
              updateData.preferences.preferredSalaryCurrency;
          }
          if (updateData.preferences.preferredEquity !== undefined) {
            preferencesData.preferredEquity =
              updateData.preferences.preferredEquity;
          }
          if (updateData.preferences.preferredBenefits !== undefined) {
            preferencesData.preferredBenefits =
              updateData.preferences.preferredBenefits;
          }
          if (updateData.preferences.preferredResponsibilities !== undefined) {
            preferencesData.preferredResponsibilities =
              updateData.preferences.preferredResponsibilities;
          }
          if (updateData.preferences.preferredTags !== undefined) {
            preferencesData.preferredTags =
              updateData.preferences.preferredTags;
          }

          // Handle enum arrays as any to avoid type issues
          if (updateData.preferences.preferredWorkTypes !== undefined) {
            preferencesData.preferredWorkTypes = updateData.preferences
              .preferredWorkTypes as any;
          }
          if (updateData.preferences.preferredJobSchedules !== undefined) {
            preferencesData.preferredJobSchedules = updateData.preferences
              .preferredJobSchedules as any;
          }

          await tx.candidate_preferences.upsert({
            where: { candidateId: supportCandidateId },
            create: {
              candidateId: supportCandidateId,
              preferredIndustries: preferencesData.preferredIndustries ?? [],
              preferredLocations: preferencesData.preferredLocations ?? [],
              preferredWorkTypes: preferencesData.preferredWorkTypes ?? [],
              preferredJobTitles: preferencesData.preferredJobTitles ?? [],
              preferredJobCommitments:
                preferencesData.preferredJobCommitments ?? [],
              preferredJobSchedules:
                preferencesData.preferredJobSchedules ?? [],
              preferredSalaryMin: preferencesData.preferredSalaryMin,
              preferredSalaryMax: preferencesData.preferredSalaryMax,
              preferredSalaryCurrency:
                preferencesData.preferredSalaryCurrency ?? 'INR',
              preferredEquity: preferencesData.preferredEquity ?? false,
              preferredBenefits: preferencesData.preferredBenefits ?? [],
              preferredResponsibilities:
                preferencesData.preferredResponsibilities ?? [],
              preferredTags: preferencesData.preferredTags ?? [],
            },
            update: preferencesData,
          });
        }

        // Update candidate subscription if provided (limited fields for support)
        if (updateData.subscription) {
          const subscriptionUpdate: any = {};

          if (updateData.subscription.status !== undefined) {
            subscriptionUpdate.status = updateData.subscription.status;
          }
          if (updateData.subscription.endDate !== undefined) {
            subscriptionUpdate.endDate = updateData.subscription.endDate;
          }
          if (updateData.subscription.autoRenew !== undefined) {
            subscriptionUpdate.autoRenew = updateData.subscription.autoRenew;
          }
          if (updateData.subscription.assessmentsUsedThisMonth !== undefined) {
            subscriptionUpdate.assessmentsUsedThisMonth =
              updateData.subscription.assessmentsUsedThisMonth;
          }
          if (updateData.subscription.practiceAssessmentsUsed !== undefined) {
            subscriptionUpdate.practiceAssessmentsUsed =
              updateData.subscription.practiceAssessmentsUsed;
          }
          if (
            updateData.subscription.additionalPracticeAssessmentCredits !==
            undefined
          ) {
            subscriptionUpdate.additionalPracticeAssessmentCredits =
              updateData.subscription.additionalPracticeAssessmentCredits;
          }

          // Only update if there are fields to update
          if (Object.keys(subscriptionUpdate).length > 0) {
            await tx.candidate_subscription.updateMany({
              where: { candidateId: supportCandidateId },
              data: subscriptionUpdate,
            });
          }
        }

        // Update resume assessments if provided
        if (updateData.resumeAssessments) {
          for (const assessmentData of updateData.resumeAssessments) {
            if (assessmentData.id) {
              // Update existing assessment
              const updateDataForAssessment: any = {};
              if (assessmentData.status !== undefined)
                updateDataForAssessment.status = assessmentData.status;
              if (assessmentData.result !== undefined)
                updateDataForAssessment.result = assessmentData.result;
              if (assessmentData.score !== undefined)
                updateDataForAssessment.score = assessmentData.score;
              if (assessmentData.recommendation !== undefined)
                updateDataForAssessment.recommendation =
                  assessmentData.recommendation;
              if (assessmentData.overallFeedback !== undefined)
                updateDataForAssessment.overallFeedback =
                  assessmentData.overallFeedback;
              if (assessmentData.strengths !== undefined)
                updateDataForAssessment.strengths = assessmentData.strengths;
              if (assessmentData.areasForImprovement !== undefined)
                updateDataForAssessment.areasForImprovement =
                  assessmentData.areasForImprovement;
              if (assessmentData.skills !== undefined)
                updateDataForAssessment.skills = assessmentData.skills;
              if (assessmentData.technicalSkills !== undefined)
                updateDataForAssessment.technicalSkills =
                  assessmentData.technicalSkills;
              if (assessmentData.softSkills !== undefined)
                updateDataForAssessment.softSkills = assessmentData.softSkills;
              if (assessmentData.industriesFit !== undefined)
                updateDataForAssessment.industriesFit =
                  assessmentData.industriesFit;
              if (assessmentData.jobRolesFit !== undefined)
                updateDataForAssessment.jobRolesFit =
                  assessmentData.jobRolesFit;

              if (Object.keys(updateDataForAssessment).length > 0) {
                await tx.resume_assessment.update({
                  where: { id: assessmentData.id },
                  data: updateDataForAssessment,
                });
              }
            }
          }
        }

        // Update onboarding assessments if provided
        if (updateData.onboardingAssessments) {
          for (const assessmentData of updateData.onboardingAssessments) {
            if (assessmentData.id) {
              // Update existing assessment
              const updateDataForAssessment: any = {};
              if (assessmentData.status !== undefined)
                updateDataForAssessment.status = assessmentData.status;
              if (assessmentData.result !== undefined)
                updateDataForAssessment.result = assessmentData.result;
              if (assessmentData.score !== undefined)
                updateDataForAssessment.score = assessmentData.score;
              if (assessmentData.recommendation !== undefined)
                updateDataForAssessment.recommendation =
                  assessmentData.recommendation;
              if (assessmentData.overallFeedback !== undefined)
                updateDataForAssessment.overallFeedback =
                  assessmentData.overallFeedback;
              if (assessmentData.strengths !== undefined)
                updateDataForAssessment.strengths = assessmentData.strengths;
              if (assessmentData.areasForImprovement !== undefined)
                updateDataForAssessment.areasForImprovement =
                  assessmentData.areasForImprovement;
              if (assessmentData.skills !== undefined)
                updateDataForAssessment.skills = assessmentData.skills;
              if (assessmentData.technicalSkills !== undefined)
                updateDataForAssessment.technicalSkills =
                  assessmentData.technicalSkills;
              if (assessmentData.softSkills !== undefined)
                updateDataForAssessment.softSkills = assessmentData.softSkills;
              if (assessmentData.duration !== undefined)
                updateDataForAssessment.duration = assessmentData.duration;

              if (Object.keys(updateDataForAssessment).length > 0) {
                await tx.onboarding_assessment.update({
                  where: { id: assessmentData.id },
                  data: updateDataForAssessment,
                });
              }

              // Update sections if provided
              if (assessmentData.sections) {
                for (const sectionData of assessmentData.sections) {
                  if (sectionData.id) {
                    const sectionUpdateData: any = {};
                    if (sectionData.title !== undefined)
                      sectionUpdateData.title = sectionData.title;
                    if (sectionData.description !== undefined)
                      sectionUpdateData.description = sectionData.description;
                    if (sectionData.type !== undefined)
                      sectionUpdateData.type = sectionData.type;
                    if (sectionData.status !== undefined)
                      sectionUpdateData.status = sectionData.status;
                    if (sectionData.result !== undefined)
                      sectionUpdateData.result = sectionData.result;
                    if (sectionData.score !== undefined)
                      sectionUpdateData.score = sectionData.score;
                    if (sectionData.order !== undefined)
                      sectionUpdateData.order = sectionData.order;
                    if (sectionData.feedback !== undefined)
                      sectionUpdateData.feedback = sectionData.feedback;
                    if (sectionData.strengths !== undefined)
                      sectionUpdateData.strengths = sectionData.strengths;
                    if (sectionData.areasForImprovement !== undefined)
                      sectionUpdateData.areasForImprovement =
                        sectionData.areasForImprovement;

                    if (Object.keys(sectionUpdateData).length > 0) {
                      // Check if section exists before updating
                      const sectionExists =
                        await tx.onboarding_assessment_section.findUnique({
                          where: { id: sectionData.id },
                        });

                      if (sectionExists) {
                        await tx.onboarding_assessment_section.update({
                          where: { id: sectionData.id },
                          data: sectionUpdateData,
                        });
                      } else {
                        logger.warn({
                          message: 'Section not found for update, skipping',
                          context: 'CandidatesService.updateCandidate',
                          sectionId: sectionData.id,
                        });
                      }
                    }
                  }
                }
              }

              // Update onboarding video analysis strengths/areas if provided
              if (assessmentData.videoAnalysis && assessmentData.id) {
                const videoUpdateData: any = {};

                if (assessmentData.videoAnalysis.strengths !== undefined) {
                  videoUpdateData.strengths =
                    assessmentData.videoAnalysis.strengths;
                }

                if (
                  assessmentData.videoAnalysis.areasForImprovement !== undefined
                ) {
                  videoUpdateData.areasForImprovement =
                    assessmentData.videoAnalysis.areasForImprovement;
                }

                if (Object.keys(videoUpdateData).length > 0) {
                  await tx.onboarding_assessment_video_analysis.upsert({
                    where: { assessmentId: assessmentData.id },
                    update: videoUpdateData,
                    create: {
                      assessmentId: assessmentData.id,
                      ...videoUpdateData,
                    },
                  });
                }
              }
            }
          }
        }

        // Update job AI assessments if provided
        if (updateData.jobAiAssessments) {
          for (const assessmentData of updateData.jobAiAssessments) {
            if (assessmentData.id) {
              // Update existing assessment
              const updateDataForAssessment: any = {};
              if (assessmentData.status !== undefined)
                updateDataForAssessment.status = assessmentData.status;
              if (assessmentData.result !== undefined)
                updateDataForAssessment.result = assessmentData.result;
              if (assessmentData.score !== undefined)
                updateDataForAssessment.score = assessmentData.score;
              if (assessmentData.recommendation !== undefined)
                updateDataForAssessment.recommendation =
                  assessmentData.recommendation;
              if (assessmentData.overallFeedback !== undefined)
                updateDataForAssessment.overallFeedback =
                  assessmentData.overallFeedback;
              if (assessmentData.strengths !== undefined)
                updateDataForAssessment.strengths = assessmentData.strengths;
              if (assessmentData.areasForImprovement !== undefined)
                updateDataForAssessment.areasForImprovement =
                  assessmentData.areasForImprovement;
              if (assessmentData.skills !== undefined)
                updateDataForAssessment.skills = assessmentData.skills;
              if (assessmentData.technicalSkills !== undefined)
                updateDataForAssessment.technicalSkills =
                  assessmentData.technicalSkills;
              if (assessmentData.softSkills !== undefined)
                updateDataForAssessment.softSkills = assessmentData.softSkills;
              if (assessmentData.duration !== undefined)
                updateDataForAssessment.duration = assessmentData.duration;

              if (Object.keys(updateDataForAssessment).length > 0) {
                await tx.job_ai_assessment.update({
                  where: { id: assessmentData.id },
                  data: updateDataForAssessment,
                });
              }

              // Update sections if provided
              if (assessmentData.sections) {
                for (const sectionData of assessmentData.sections) {
                  if (sectionData.id) {
                    const sectionUpdateData: any = {};
                    if (sectionData.title !== undefined)
                      sectionUpdateData.title = sectionData.title;
                    if (sectionData.description !== undefined)
                      sectionUpdateData.description = sectionData.description;
                    if (sectionData.type !== undefined)
                      sectionUpdateData.type = sectionData.type;
                    if (sectionData.status !== undefined)
                      sectionUpdateData.status = sectionData.status;
                    if (sectionData.result !== undefined)
                      sectionUpdateData.result = sectionData.result;
                    if (sectionData.score !== undefined)
                      sectionUpdateData.score = sectionData.score;
                    if (sectionData.order !== undefined)
                      sectionUpdateData.order = sectionData.order;
                    if (sectionData.feedback !== undefined)
                      sectionUpdateData.feedback = sectionData.feedback;
                    if (sectionData.strengths !== undefined)
                      sectionUpdateData.strengths = sectionData.strengths;
                    if (sectionData.areasForImprovement !== undefined)
                      sectionUpdateData.areasForImprovement =
                        sectionData.areasForImprovement;

                    if (Object.keys(sectionUpdateData).length > 0) {
                      await tx.job_ai_assessment_section.update({
                        where: { id: sectionData.id },
                        data: sectionUpdateData,
                      });
                    }
                  }
                }
              }

              // Update job AI video analysis strengths/areas if provided
              if (assessmentData.videoAnalysis && assessmentData.id) {
                const videoUpdateData: any = {};

                if (assessmentData.videoAnalysis.strengths !== undefined) {
                  videoUpdateData.strengths =
                    assessmentData.videoAnalysis.strengths;
                }

                if (
                  assessmentData.videoAnalysis.areasForImprovement !== undefined
                ) {
                  videoUpdateData.areasForImprovement =
                    assessmentData.videoAnalysis.areasForImprovement;
                }

                if (Object.keys(videoUpdateData).length > 0) {
                  await tx.job_ai_assessment_video_analysis.upsert({
                    where: { assessmentId: assessmentData.id },
                    update: videoUpdateData,
                    create: {
                      assessmentId: assessmentData.id,
                      ...videoUpdateData,
                    },
                  });
                }
              }
            }
          }
        }
      });

      // Return the full updated candidate detail using the same logic as getSupportCandidate
      return await this.getSupportCandidate(supportCandidateId);
    } catch (error) {
      logger.error({
        message: 'Failed to update candidate',
        context: 'SupportCandidatesService.updateSupportCandidate',
        error: error instanceof Error ? error.message : 'Unknown error',
        supportCandidateId,
        updateData,
      });
      throw error;
    }
  }

  /**
   * Delete a candidate
   */
  async deleteSupportCandidate(supportCandidateId: string): Promise<boolean> {
    try {
      // Find the candidate
      const candidate = await this.prisma.candidate.findUnique({
        where: { id: supportCandidateId },
      });

      if (!candidate) {
        throw new AppError('Candidate not found', 404, ErrorCode.NOT_FOUND);
      }

      // Delete the candidate
      await this.prisma.candidate.delete({
        where: { id: supportCandidateId },
      });

      return true;
    } catch (error) {
      logger.error({
        message: 'Failed to delete candidate',
        context: 'SupportCandidatesService.deleteSupportCandidate',
        error: error instanceof Error ? error.message : 'Unknown error',
        supportCandidateId,
      });
      throw error;
    }
  }

  async getCandidateRecommendationDetail(
    id: string
  ): Promise<ISupportCandidate> {
    try {
      const candidate = await this.prisma.candidate.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          resume: {
            select: {
              id: true,
              summary: true,
              currentJobTitle: true,
              currentCompany: true,
              currentWorkLocation: true,
              currentSalary: true,
              currentSalaryCurrency: true,
              currentWorkType: true,
              experience: {
                include: {
                  projects: true,
                },
              },
              education: true,
              certifications: true,
              industries: true,
              totalExperience: true,
              highestEducationLevel: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          preferences: {
            select: {
              id: true,
              preferredLocations: true,
              preferredIndustries: true,
              preferredWorkTypes: true,
              preferredSalaryMin: true,
              preferredSalaryMax: true,
              preferredSalaryCurrency: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          resumeAssessments: {
            select: {
              id: true,
              score: true,
              recommendation: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          onboardingAssessments: {
            select: {
              id: true,
              score: true,
              recommendation: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });

      if (!candidate) {
        throw new AppError('Candidate not found', 404, ErrorCode.NOT_FOUND);
      }

      // Convert video URLs to presigned URLs for assessments
      if (candidate.onboardingAssessments) {
        await this.convertVideoUrlsToPresigned(candidate.onboardingAssessments);
      }

      // Add logging for debugging
      logger.debug({
        message: 'Retrieved candidate details',
        context: 'CandidatesService.getCandidateRecommendationDetail',
        candidateId: id,
        hasResume: !!candidate.resume,
        hasUser: !!candidate.user,
        hasPreferences: !!candidate.preferences,
        experienceCount: candidate.resume?.experience?.length || 0,
      });

      return toSupportCandidateDomain(candidate);
    } catch (error) {
      logger.error({
        message: 'Failed to get candidate details',
        context: 'SupportCandidatesService.getCandidateRecommendationDetail',
        error: error instanceof Error ? error.message : 'Unknown error',
        id,
      });
      throw error;
    }
  }

  /**
   * Get candidates with onboarding assessment recommendations (HIGHLY_RECOMMENDED or RECOMMENDED) that are not published
   */
  async getRecommendedCandidates(
    filter: ISupportCandidateFilterQuery & { search?: string },
    paginationRequest: IPaginationRequest
  ): Promise<IPaginatedResponse<ISupportRecommendedCandidate>> {
    try {
      // Build query conditions with proper sorting configuration
      const queryConditions = buildQueryConditions(filter, paginationRequest, {
        search: {
          searchableFields: [],
          relationFields: {
            user: ['name', 'email'],
          },
        },
        filter: {
          allowedFields: ['partnerId', 'status', 'jobSearchStatus'],
          enumFields: ['status', 'jobSearchStatus'],
        },
        sort: {
          allowedFields: [
            'id',
            'createdAt',
            'updatedAt',
            'completionPercentage',
            'assessmentScore',
            'assessmentCompletedAt',
          ],
          relationFields: {
            fullName: { relation: 'user', field: 'name' },
            name: { relation: 'user', field: 'name' },
            email: { relation: 'user', field: 'email' },
          },
          defaultSort: { field: 'createdAt', order: 'desc' },
        },
      });

      // Build where clause based on filters - buildQueryConditions already handles all filtering
      const where: Prisma.candidateWhereInput = {
        ...queryConditions.where,
        isPublished: false,
        reviewStatus: CandidateReviewStatusEnum.PENDING_PUBLISH,
        onboardingAssessments: {
          some: {
            recommendation: {
              in: [
                OnboardingAssessmentRecommendationEnum.HIGHLY_RECOMMENDED,
                OnboardingAssessmentRecommendationEnum.RECOMMENDED,
              ],
            },
            status: {
              in: [
                OnboardingAssessmentStatusEnum.ASSESSMENT_COMPLETED,
                OnboardingAssessmentStatusEnum.AI_REVIEW_COMPLETED,
              ],
            },
          },
        },
      };

      // Get total count for pagination
      const total = await this.prisma.candidate.count({
        where,
      });

      // Handle custom sorting for assessment-related fields
      let customOrderBy = queryConditions.orderBy;
      let needsCustomSorting = false;
      let customSortField = '';
      let customSortOrder: 'asc' | 'desc' = 'asc';

      if (
        paginationRequest.sortBy === 'assessmentScore' ||
        paginationRequest.sortBy === 'assessmentCompletedAt'
      ) {
        needsCustomSorting = true;
        customSortField = paginationRequest.sortBy;
        customSortOrder =
          (paginationRequest.sortOrder as 'asc' | 'desc') || 'asc';
        // Use default sorting for initial query, will sort manually after
        customOrderBy = { createdAt: 'desc' };
      }

      // Get paginated results
      const candidates = await this.prisma.candidate.findMany({
        where,
        skip: queryConditions.skip,
        take: queryConditions.take,
        orderBy: customOrderBy,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          resume: {
            select: {
              phone: true,
            },
          },
          onboardingAssessments: {
            where: {
              recommendation: {
                in: [
                  OnboardingAssessmentRecommendationEnum.HIGHLY_RECOMMENDED,
                  OnboardingAssessmentRecommendationEnum.RECOMMENDED,
                ],
              },
              status: {
                in: [
                  OnboardingAssessmentStatusEnum.ASSESSMENT_COMPLETED,
                  OnboardingAssessmentStatusEnum.AI_REVIEW_COMPLETED,
                ],
              },
            },
            orderBy: {
              completedAt: 'desc',
            },
            take: 1,
            select: {
              id: true,
              status: true,
              score: true,
              recommendation: true,
              completedAt: true,
            },
          },
        },
      });

      // Apply custom sorting if needed
      if (needsCustomSorting && candidates.length > 0) {
        candidates.sort((a, b) => {
          const assessmentA = a.onboardingAssessments[0];
          const assessmentB = b.onboardingAssessments[0];

          if (!assessmentA && !assessmentB) return 0;
          if (!assessmentA) return customSortOrder === 'asc' ? 1 : -1;
          if (!assessmentB) return customSortOrder === 'asc' ? -1 : 1;

          let valueA: any;
          let valueB: any;

          if (customSortField === 'assessmentScore') {
            valueA = assessmentA.score || 0;
            valueB = assessmentB.score || 0;
          } else if (customSortField === 'assessmentCompletedAt') {
            valueA = assessmentA.completedAt
              ? new Date(assessmentA.completedAt).getTime()
              : 0;
            valueB = assessmentB.completedAt
              ? new Date(assessmentB.completedAt).getTime()
              : 0;
          }

          if (valueA < valueB) return customSortOrder === 'asc' ? -1 : 1;
          if (valueA > valueB) return customSortOrder === 'asc' ? 1 : -1;
          return 0;
        });
      }

      // Transform to desired format
      const transformedCandidates: ISupportRecommendedCandidate[] =
        candidates.map((candidate) => ({
          id: candidate.id,
          fullName: candidate.user.name,
          email: candidate.user.email,
          phone: candidate.resume?.phone || undefined,
          status: candidate.status,
          isPublished: candidate.isPublished,
          completionPercentage: candidate.completionPercentage,
          onboardingAssessment: candidate.onboardingAssessments[0]
            ? {
                id: candidate.onboardingAssessments[0].id,
                status: candidate.onboardingAssessments[0].status,
                score: candidate.onboardingAssessments[0].score,
                recommendation:
                  candidate.onboardingAssessments[0].recommendation || '',
                completedAt:
                  candidate.onboardingAssessments[0].completedAt?.toISOString() ||
                  '',
              }
            : undefined,
          createdAt: candidate.createdAt.toISOString(),
        }));

      return {
        items: transformedCandidates,
        pagination: {
          total,
          page: queryConditions.pagination.page,
          limit: queryConditions.pagination.limit,
          totalPages: Math.ceil(total / queryConditions.pagination.limit),
        },
      };
    } catch (error) {
      logger.error({
        message: 'Failed to get recommended candidates',
        context: 'SupportCandidatesService.getRecommendedCandidates',
        error: error instanceof Error ? error.message : 'Unknown error',
        paginationRequest,
      });
      throw error;
    }
  }

  /**
   * Publish candidate with note
   */
  async publishCandidate(
    requestingUserId: string,
    candidateId: string,
    note: string
  ): Promise<ISupportCandidateActionResponse> {
    try {
      const results: ISupportCandidateActionResponse = {
        processedCount: 0,
        failedCount: 0,
        failedCandidates: [] as Array<{
          candidateId: string;
          reason: string;
        }>,
      };

      // Validate note is provided
      if (!note || note.trim().length === 0) {
        results.failedCount++;
        results.failedCandidates.push({
          candidateId,
          reason: 'Note is required for publishing a candidate',
        });
        return results;
      }

      // Use transaction to ensure all updates are atomic
      await this.prisma.$transaction(async (tx) => {
        try {
          // Check if candidate exists and has recommended onboarding assessment
          const candidate = await tx.candidate.findFirst({
            where: {
              id: candidateId,
              isPublished: false,
              reviewStatus: CandidateReviewStatusEnum.PENDING_PUBLISH,
              onboardingAssessments: {
                some: {
                  recommendation: {
                    in: [
                      OnboardingAssessmentRecommendationEnum.HIGHLY_RECOMMENDED,
                      OnboardingAssessmentRecommendationEnum.RECOMMENDED,
                    ],
                  },
                  status: {
                    in: [
                      OnboardingAssessmentStatusEnum.ASSESSMENT_COMPLETED,
                      OnboardingAssessmentStatusEnum.AI_REVIEW_COMPLETED,
                    ],
                  },
                },
              },
            },
          });

          if (!candidate) {
            results.failedCount++;
            results.failedCandidates.push({
              candidateId,
              reason:
                'Candidate not found or does not meet criteria for publishing',
            });
            return;
          }

          // Update candidate to published with note and review status
          await tx.candidate.update({
            where: { id: candidateId },
            data: {
              isPublished: true,
              reviewStatus: CandidateReviewStatusEnum.PENDING_PUBLISH,
              note: note.trim(),
              updatedBy: requestingUserId,
              updatedAt: new Date(),
            },
          });

          results.processedCount++;

          // Start RAG task after successful publication
          try {
            await this.ragCronService.startRagTask(10); // Default batch size of 10
            logger.info({
              message: 'RAG task started after candidate publication',
              context: 'SupportCandidatesService.publishCandidate',
              candidateId,
              requestingUserId,
            });
          } catch (ragError) {
            logger.warn({
              message: 'Failed to start RAG task after candidate publication',
              context: 'SupportCandidatesService.publishCandidate',
              error:
                ragError instanceof Error ? ragError.message : 'Unknown error',
              candidateId,
              requestingUserId,
            });
            // Don't fail the publication if RAG task fails
          }
        } catch (error) {
          results.failedCount++;
          results.failedCandidates.push({
            candidateId,
            reason: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      });

      return results;
    } catch (error) {
      logger.error({
        message: 'Failed to publish candidate',
        context: 'SupportCandidatesService.publishCandidate',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        note,
      });
      throw error;
    }
  }

  /**
   * Do not publish candidate (mark as reviewed but not published)
   */
  async doNotPublishCandidate(
    requestingUserId: string,
    candidateId: string,
    note: string
  ): Promise<ISupportCandidateActionResponse> {
    try {
      const results = {
        processedCount: 0,
        failedCount: 0,
        failedCandidates: [] as Array<{
          candidateId: string;
          reason: string;
        }>,
      };

      // Validate note is provided
      if (!note || note.trim().length === 0) {
        results.failedCount++;
        results.failedCandidates.push({
          candidateId,
          reason: 'Note is required for do not publish action',
        });
        return results;
      }

      // Use transaction to ensure all updates are atomic
      await this.prisma.$transaction(async (tx) => {
        try {
          // Check if candidate exists and is not already published
          const candidate = await tx.candidate.findFirst({
            where: {
              id: candidateId,
              isPublished: false,
            },
          });

          if (!candidate) {
            results.failedCount++;
            results.failedCandidates.push({
              candidateId,
              reason: 'Candidate not found or is already published',
            });
            return;
          }

          // Update candidate with do not publish note and review status
          await tx.candidate.update({
            where: { id: candidateId },
            data: {
              reviewStatus: CandidateReviewStatusEnum.UNPUBLISHED,
              note: note.trim(),
              updatedBy: requestingUserId,
              updatedAt: new Date(),
            },
          });

          results.processedCount++;
        } catch (error) {
          results.failedCount++;
          results.failedCandidates.push({
            candidateId,
            reason: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      });

      return results;
    } catch (error) {
      logger.error({
        message: 'Failed to mark candidate as do not publish',
        context: 'SupportCandidatesService.doNotPublishCandidate',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        note,
      });
      throw error;
    }
  }

  /**
   * Unpublish candidate
   */
  async unpublishCandidate(
    requestingUserId: string,
    candidateId: string,
    reason?: string
  ): Promise<{
    unpublishedCount: number;
    failedCount: number;
    failedCandidates: Array<{
      candidateId: string;
      reason: string;
    }>;
  }> {
    try {
      const results = {
        unpublishedCount: 0,
        failedCount: 0,
        failedCandidates: [] as Array<{
          candidateId: string;
          reason: string;
        }>,
      };

      // Use transaction to ensure all updates are atomic
      await this.prisma.$transaction(async (tx) => {
        try {
          // Check if candidate exists and is currently published
          const candidate = await tx.candidate.findFirst({
            where: {
              id: candidateId,
              isPublished: true,
            },
          });

          if (!candidate) {
            results.failedCount++;
            results.failedCandidates.push({
              candidateId,
              reason: 'Candidate not found or is not currently published',
            });
            return;
          }

          // Update candidate to unpublished with reason
          await tx.candidate.update({
            where: { id: candidateId },
            data: {
              isPublished: false,
              note: reason || null,
              updatedBy: requestingUserId,
              updatedAt: new Date(),
            },
          });

          results.unpublishedCount++;
        } catch (error) {
          results.failedCount++;
          results.failedCandidates.push({
            candidateId,
            reason: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      });

      return results;
    } catch (error) {
      logger.error({
        message: 'Failed to unpublish candidate',
        context: 'SupportCandidatesService.unpublishCandidate',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        reason,
      });
      throw error;
    }
  }

  /**
   * Reset onboarding assessment for a candidate
   */
  async resetOnboardingAssessment(
    adminUserId: string,
    candidateId: string,
    reason?: string
  ): Promise<ISupportCandidateResetOnboardingAssessmentResponse> {
    try {
      // Find the candidate with their onboarding assessments
      const candidate = await this.prisma.candidate.findUnique({
        where: { id: candidateId },
        include: {
          onboardingAssessments: {
            include: {
              sections: {
                include: {
                  questions: true,
                },
              },
              videoAnalysis: true,
              proctoring: true,
              onboardingAssessmentSettings: true,
              progressState: true,
              task: true,
            },
          },
        },
      });

      if (!candidate) {
        throw new AppError('Candidate not found', 404, ErrorCode.NOT_FOUND);
      }

      // Get the most recent onboarding assessment
      const latestAssessment = candidate.onboardingAssessments.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];

      if (!latestAssessment) {
        throw new AppError(
          'No onboarding assessment found for this candidate',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Reset assessment data and create history record
      const historyRecord = await this.prisma.$transaction(async (tx) => {
        // Save current state to history before resetting
        const history = await tx.onboarding_assessment_history.create({
          data: {
            onboardingAssessmentId: latestAssessment.id,
            candidateId: candidateId,
            action: 'RESET',
            actionReason: reason || 'Manual reset by admin',
            performedBy: adminUserId,
            metadata: {
              assessment: {
                id: latestAssessment.id,
                status: latestAssessment.status,
                result: latestAssessment.result,
                score: latestAssessment.score,
                startedAt: latestAssessment.startedAt,
                completedAt: latestAssessment.completedAt,
                automaticallyPublished: latestAssessment.automaticallyPublished,
                duration: latestAssessment.duration,
                selectedForNextRound: latestAssessment.selectedForNextRound,
                strengths: latestAssessment.strengths,
                areasForImprovement: latestAssessment.areasForImprovement,
                overallFeedback: latestAssessment.overallFeedback,
                recommendation: latestAssessment.recommendation,
                experienceSummary: latestAssessment.experienceSummary,
                educationSummary: latestAssessment.educationSummary,
                skills: latestAssessment.skills,
                technicalSkills: latestAssessment.technicalSkills,
                softSkills: latestAssessment.softSkills,
                industriesFit: latestAssessment.industriesFit,
                jobRolesFit: latestAssessment.jobRolesFit,
                resumeText: latestAssessment.resumeText,
                videoAnalysisStatus: latestAssessment.videoAnalysisStatus,
                videoAnalysisError: latestAssessment.videoAnalysisError,
                createdAt: latestAssessment.createdAt,
                updatedAt: latestAssessment.updatedAt,
              },
              sections: latestAssessment.sections,
              videoAnalysis: latestAssessment.videoAnalysis,
              proctoring: latestAssessment.proctoring,
              settings: latestAssessment.onboardingAssessmentSettings,
              progressState: latestAssessment.progressState,
              task: latestAssessment.task,
              sectionCount: latestAssessment.sections.length,
              totalQuestions: latestAssessment.sections.reduce(
                (total, section) => total + section.questions.length,
                0
              ),
              resetTimestamp: new Date().toISOString(),
              resetBy: adminUserId,
              resetReason: reason || 'Manual reset by admin',
            },
          },
        });

        // Reset only the specific fields without deleting related data
        await tx.onboarding_assessment.update({
          where: { id: latestAssessment.id },
          data: {
            status: OnboardingAssessmentStatusEnum.NOT_STARTED,
            result: OnboardingAssessmentResultEnum.NOT_AVAILABLE,
            score: 0,
            startedAt: null,
            completedAt: null,
            // Reset video analysis status so it triggers again after completion
            videoAnalysisStatus:
              OnboardingAssessmentVideoAnalysisStatusEnum.NOT_STARTED,
            videoAnalysisError: null,
          },
        });

        // Mark all existing video chunks as irrelevant and skip their analysis
        const chunkUpdateResult = await tx.videoChunkAnalysis.updateMany({
          where: {
            assessmentId: latestAssessment.id,
            isRelevant: true, // Only update currently relevant chunks
          },
          data: {
            isRelevant: false, // Mark old chunks as irrelevant
            status: 'skipped', // Stop any pending analysis for these chunks
          },
        });

        // Update candidate onboarding assessment status
        await tx.candidate.update({
          where: { id: candidateId },
          data: {
            onboardingAssessmentStatus:
              CandidateOnboardingAssessmentStatusEnum.ASSESSMENT_RESET,
            updatedBy: adminUserId,
          },
        });

        // Return the history record and chunk update result
        return { history, chunkUpdateCount: chunkUpdateResult.count };
      });

      logger.info('Onboarding assessment reset successfully', {
        candidateId,
        assessmentId: latestAssessment.id,
        historyId: historyRecord.history.id,
        chunksMarkedIrrelevant: historyRecord.chunkUpdateCount,
        performedBy: adminUserId,
        reason,
        context: 'SupportCandidatesService.resetOnboardingAssessment',
      });

      return {
        message: 'Onboarding assessment reset successfully',
        historyId: historyRecord.history.id,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to reset onboarding assessment',
        context: 'SupportCandidatesService.resetOnboardingAssessment',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        adminUserId,
        reason,
      });
      throw error;
    }
  }

  /**
   * Resubmit onboarding assessment for re-analysis
   * Deletes previous video files and triggers background processing
   * Rate limited to once per 10 minutes per candidate
   */
  async resubmitOnboardingAssessment(
    adminUserId: string,
    candidateId: string
  ): Promise<ISupportCandidateResetOnboardingAssessmentResponse> {
    try {
      logger.info({
        message: 'Resubmitting onboarding assessment',
        context: 'SupportCandidatesService.resubmitOnboardingAssessment',
        candidateId,
        adminUserId,
      });

      // Check rate limiting
      const lastResubmitTime =
        SupportCandidatesService.resubmitRateLimitMap.get(candidateId);
      if (lastResubmitTime) {
        const timeSinceLastResubmit = Date.now() - lastResubmitTime;
        if (
          timeSinceLastResubmit <
          SupportCandidatesService.RESUBMIT_RATE_LIMIT_MS
        ) {
          const remainingTime = Math.ceil(
            (SupportCandidatesService.RESUBMIT_RATE_LIMIT_MS -
              timeSinceLastResubmit) /
              1000 /
              60
          );
          throw new AppError(
            `Please wait ${remainingTime} more minute${remainingTime !== 1 ? 's' : ''} before resubmitting this assessment`,
            429,
            ErrorCode.VALIDATION_ERROR
          );
        }
      }

      // Verify candidate exists
      const candidate = await this.prisma.candidate.findUnique({
        where: { id: candidateId },
      });

      if (!candidate) {
        throw new AppError(
          'Candidate not found',
          404,
          ErrorCode.CANDIDATE_NOT_FOUND
        );
      }

      // Get the latest onboarding assessment
      const latestAssessment =
        await this.prisma.onboarding_assessment.findFirst({
          where: {
            candidateId,
          },
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            videoAnalysis: true,
            task: true,
          },
        });

      if (!latestAssessment) {
        throw new AppError(
          'No onboarding assessment found for this candidate',
          404,
          ErrorCode.ONBOARDING_ASSESSMENT_NOT_FOUND
        );
      }

      // Use the singleton instance of OnboardingAssessmentService
      await this.onboardingAssessmentService.reSubmitAssessment(
        latestAssessment.id
      );

      // Update rate limit timestamp
      SupportCandidatesService.resubmitRateLimitMap.set(
        candidateId,
        Date.now()
      );

      // Clean up old entries from rate limit map (older than rate limit period)
      const cutoffTime =
        Date.now() - SupportCandidatesService.RESUBMIT_RATE_LIMIT_MS;
      for (const [
        id,
        timestamp,
      ] of SupportCandidatesService.resubmitRateLimitMap.entries()) {
        if (timestamp < cutoffTime) {
          SupportCandidatesService.resubmitRateLimitMap.delete(id);
        }
      }

      logger.info({
        message: 'Onboarding assessment resubmitted successfully',
        context: 'SupportCandidatesService.resubmitOnboardingAssessment',
        candidateId,
        assessmentId: latestAssessment.id,
        performedBy: adminUserId,
      });

      return {
        message:
          'Assessment resubmitted successfully. Processing in background...',
        historyId: null,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to resubmit onboarding assessment',
        context: 'SupportCandidatesService.resubmitOnboardingAssessment',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        adminUserId,
      });
      throw error;
    }
  }

  /**
   * Resend expired job AI assessment invitation
   * Only resends if the invitation is expired
   */
  async resendJobAiAssessmentInvitation(
    supportUserId: string,
    invitationId: string
  ): Promise<ISupportCandidateActionResponse> {
    try {
      const results: ISupportCandidateActionResponse = {
        processedCount: 0,
        failedCount: 0,
        failedCandidates: [] as Array<{
          candidateId: string;
          reason: string;
        }>,
      };

      // Find the invitation
      const invitation =
        await this.prisma.job_ai_assessment_invitation.findUnique({
          where: { id: invitationId },
          include: {
            candidate: {
              include: {
                user: true,
              },
            },
            jobApplication: {
              include: {
                jobInvite: true,
                jobPosting: {
                  include: {
                    client: {
                      include: {
                        company: true,
                      },
                    },
                  },
                },
              },
            },
            invitedBy: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        });

      if (!invitation) {
        results.failedCount++;
        results.failedCandidates.push({
          candidateId: '',
          reason: 'Invitation not found',
        });
        return results;
      }

      // Check if invitation is expired
      const now = new Date();
      const isExpired =
        invitation.status === JobAiAssessmentInviteStatusEnum.EXPIRED ||
        (invitation.expiresAt && invitation.expiresAt < now);

      if (!isExpired) {
        results.failedCount++;
        results.failedCandidates.push({
          candidateId: invitation.candidateId,
          reason:
            'Invitation is not expired. Only expired invitations can be resent.',
        });
        return results;
      }

      // Use transaction to ensure all updates are atomic
      await this.prisma.$transaction(async (tx) => {
        // Update invitation status and expiration date (72 hours from now)
        const invitationExpiryHours = 72;
        const newExpiresAt = new Date(
          now.getTime() + invitationExpiryHours * 60 * 60 * 1000
        );

        await tx.job_ai_assessment_invitation.update({
          where: { id: invitationId },
          data: {
            status: JobAiAssessmentInviteStatusEnum.PENDING,
            expiresAt: newExpiresAt,
            updatedAt: new Date(),
          },
        });

        // Also reset the associated job_invite status/expiry so candidate sees Pending
        let jobInviteId: string | undefined =
          invitation.jobApplication?.jobInvite?.id || undefined;

        // Fallback: look up by jobApplicationId if relation not loaded/null
        if (!jobInviteId) {
          const inviteByApplicationId = await tx.job_invite.findFirst({
            where: { jobApplicationId: invitation.jobApplicationId },
            select: { id: true },
          });
          jobInviteId = inviteByApplicationId?.id || undefined;
        }

        // Second fallback: match by jobId + candidate email (common linkage)
        if (!jobInviteId && invitation.jobApplication?.jobPostingId) {
          const inviteByJobAndEmail = await tx.job_invite.findFirst({
            where: {
              jobId: invitation.jobApplication.jobPostingId,
              email: {
                equals: invitation.candidate.user.email,
                mode: 'insensitive',
              },
            },
            select: { id: true },
          });
          jobInviteId = inviteByJobAndEmail?.id || undefined;
        }

        // Third fallback: pick latest invite for jobId that is expired/withdrawn/pending
        if (!jobInviteId && invitation.jobApplication?.jobPostingId) {
          const inviteByJobOnly = await tx.job_invite.findFirst({
            where: {
              jobId: invitation.jobApplication.jobPostingId,
              status: {
                in: [
                  JobInviteStatusEnum.EXPIRED,
                  JobInviteStatusEnum.WITHDRAWN,
                  JobInviteStatusEnum.PENDING,
                ],
              },
            },
            orderBy: { updatedAt: 'desc' },
            select: { id: true },
          });
          jobInviteId = inviteByJobOnly?.id || undefined;
        }

        if (jobInviteId) {
          await tx.job_invite.update({
            where: { id: jobInviteId },
            data: {
              status: JobInviteStatusEnum.PENDING,
              expiresAt: newExpiresAt,
              updatedAt: new Date(),
              // Ensure linkage exists for next time
              jobApplicationId: invitation.jobApplicationId || undefined,
            },
          });
          logger.info({
            message: '[6] job_invite updated to PENDING during resend',
            context: 'SupportCandidatesService.resendJobAiAssessmentInvitation',
            jobInviteId,
            jobApplicationId: invitation.jobApplicationId,
            invitationId,
            jobPostingId: invitation.jobApplication?.jobPostingId,
            candidateEmail: invitation.candidate.user.email,
            newExpiresAt,
          });
        } else {
          logger.warn({
            message:
              '[6] No job_invite linked to job application when resending assessment invite',
            context: 'SupportCandidatesService.resendJobAiAssessmentInvitation',
            jobApplicationId: invitation.jobApplicationId,
            invitationId,
            jobPostingId: invitation.jobApplication?.jobPostingId,
            candidateEmail: invitation.candidate.user.email,
          });
        }

        // Reset job application status to INVITED and clear acceptance/decline timestamps
        await tx.job_application.update({
          where: { id: invitation.jobApplicationId },
          data: {
            status: application_status.INVITED,
            acceptedAt: null,
            acceptedBy: null,
            acceptedById: null,
            acceptanceNote: null,
            declinedAt: null,
            declinedBy: null,
            declinedById: null,
            declineReason: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        logger.info({
          message: '[7] job_application reset to INVITED during resend',
          context: 'SupportCandidatesService.resendJobAiAssessmentInvitation',
          jobApplicationId: invitation.jobApplicationId,
          invitationId,
        });

        // Get inviter name - prefer from job_invite, then from invitedBy, then default
        let inviterName = 'Hiring Manager';
        if (jobInviteId) {
          const jobInvite = await tx.job_invite.findUnique({
            where: { id: jobInviteId },
            select: { inviterId: true },
          });
          if (jobInvite?.inviterId) {
            // Try to get inviter name from client_user or support_user
            const clientUser = await tx.client_user.findUnique({
              where: { id: jobInvite.inviterId },
              include: { user: { select: { name: true } } },
            });
            if (clientUser?.user?.name) {
              inviterName = clientUser.user.name;
            } else {
              const supportUser = await tx.support_user.findUnique({
                where: { id: jobInvite.inviterId },
                include: { user: { select: { name: true } } },
              });
              if (supportUser?.user?.name) {
                inviterName = supportUser.user.name;
              }
            }
          }
        } else if (invitation.invitedBy?.user?.name) {
          inviterName = invitation.invitedBy.user.name;
        }

        // Generate invitation URL - use job_invite ID if available, otherwise use assessment invitation
        const inviteUrl = jobInviteId
          ? `${ENV.FRONTEND_URL}/app/candidate/assessment-invites/accept?inviteId=${jobInviteId}&email=${encodeURIComponent(invitation.candidate.user.email)}`
          : `${ENV.FRONTEND_URL}/app/candidate/assessment-invites`;

        // Send email notification using "You are invited to apply" template
        await this.notificationProvider.sendJobInviteEmail(
          invitation.candidate.user.email,
          invitation.candidate.user.name,
          invitation.jobApplication.jobPosting.client.company.name,
          inviterName,
          invitation.jobApplication.jobPosting.title,
          inviteUrl,
          invitationExpiryHours
        );

        results.processedCount++;
      });

      logger.info('Job AI assessment invitation resent successfully', {
        context: 'SupportCandidatesService.resendJobAiAssessmentInvitation',
        supportUserId,
        invitationId,
        candidateId: invitation.candidateId,
      });

      return results;
    } catch (error) {
      logger.error({
        message: 'Failed to resend job AI assessment invitation',
        context: 'SupportCandidatesService.resendJobAiAssessmentInvitation',
        error: error instanceof Error ? error.message : 'Unknown error',
        invitationId,
        supportUserId,
      });
      throw error;
    }
  }

  /**
   * Reset job AI assessment for a candidate
   */
  async resetJobAiAssessment(
    adminUserId: string,
    assessmentId: string,
    reason?: string
  ): Promise<ISupportCandidateResetOnboardingAssessmentResponse> {
    try {
      // Find the assessment with all related data
      const assessment = await this.prisma.job_ai_assessment.findUnique({
        where: { id: assessmentId },
        include: {
          candidate: true,
          sections: {
            include: {
              questions: true,
            },
          },
          videoAnalysis: true,
          proctoring: true,
          jobAiAssessmentSettings: true,
          progressState: true,
          task: true,
        },
      });

      if (!assessment) {
        throw new AppError(
          'Job AI assessment not found',
          404,
          ErrorCode.JOB_AI_ASSESSMENT_NOT_FOUND
        );
      }

      // Reset assessment data and create history record
      const historyRecord = await this.prisma.$transaction(async (tx) => {
        // Save current state to history before resetting
        const history = await tx.job_ai_assessment_history.create({
          data: {
            jobAiAssessmentId: assessment.id,
            candidateId: assessment.candidateId,
            action: 'RESET',
            actionReason: reason || 'Manual reset by admin',
            performedBy: adminUserId,
            metadata: {
              assessment: {
                id: assessment.id,
                status: assessment.status,
                result: assessment.result,
                score: assessment.score,
                startedAt: assessment.startedAt,
                completedAt: assessment.completedAt,
                automaticallyPublished: assessment.automaticallyPublished,
                duration: assessment.duration,
                selectedForNextRound: assessment.selectedForNextRound,
                strengths: assessment.strengths,
                areasForImprovement: assessment.areasForImprovement,
                overallFeedback: assessment.overallFeedback,
                recommendation: assessment.recommendation,
                experienceSummary: assessment.experienceSummary,
                educationSummary: assessment.educationSummary,
                skills: assessment.skills,
                technicalSkills: assessment.technicalSkills,
                softSkills: assessment.softSkills,
                industriesFit: assessment.industriesFit,
                jobRolesFit: assessment.jobRolesFit,
                resumeText: assessment.resumeText,
                jobDescriptionText: assessment.jobDescriptionText,
                videoAnalysisStatus: assessment.videoAnalysisStatus,
                videoAnalysisError: assessment.videoAnalysisError,
                createdAt: assessment.createdAt,
                updatedAt: assessment.updatedAt,
              },
              sections: assessment.sections,
              videoAnalysis: assessment.videoAnalysis,
              proctoring: assessment.proctoring,
              settings: assessment.jobAiAssessmentSettings,
              progressState: assessment.progressState,
              task: assessment.task,
              sectionCount: assessment.sections.length,
              totalQuestions: assessment.sections.reduce(
                (total, section) => total + section.questions.length,
                0
              ),
              resetTimestamp: new Date().toISOString(),
              resetBy: adminUserId,
              resetReason: reason || 'Manual reset by admin',
            },
          },
        });

        // Reset only the specific fields without deleting related data
        await tx.job_ai_assessment.update({
          where: { id: assessment.id },
          data: {
            status: JobAiAssessmentStatusEnum.NOT_STARTED,
            result: JobAiAssessmentResultEnum.NOT_AVAILABLE,
            score: 0,
            startedAt: null,
            completedAt: null,
            videoAnalysisStatus:
              JobAiAssessmentVideoAnalysisStatusEnum.NOT_STARTED,
            videoAnalysisError: null,
          },
        });

        // Delete existing sections (questions will be cascade deleted)
        if (assessment.sections && assessment.sections.length > 0) {
          await tx.job_ai_assessment_section.deleteMany({
            where: { assessmentId: assessment.id },
          });
        }

        // Delete progress state if it exists
        if (assessment.progressState) {
          await tx.job_ai_assessment_progress.deleteMany({
            where: { assessmentId: assessment.id },
          });
        }

        // Mark all existing video chunks as irrelevant and skip their analysis
        const chunkUpdateResult =
          await tx.jobAiAssessmentVideoChunkAnalysis.updateMany({
            where: {
              assessmentId: assessment.id,
              isRelevant: true, // Only update currently relevant chunks
            },
            data: {
              isRelevant: false, // Mark old chunks as irrelevant
              status: 'skipped', // Stop any pending analysis for these chunks
            },
          });

        logger.info({
          message:
            'Marked old video chunks as irrelevant and skipped after reset',
          context: 'SupportCandidatesService.resetJobAiAssessment',
          assessmentId: assessment.id,
          chunksMarkedIrrelevant: chunkUpdateResult.count,
        });

        // Reset task status to PENDING if task exists, so it can be re-initialized
        if (assessment.task) {
          await tx.job_ai_assessment_task.update({
            where: { id: assessment.task.id },
            data: {
              status: JobAiAssessmentTaskStatusEnum.PENDING,
              error: null,
            },
          });
        }

        // Return the history record
        return history;
      });

      logger.info('Job AI assessment reset successfully', {
        candidateId: assessment.candidateId,
        assessmentId: assessment.id,
        historyId: historyRecord.id,
        performedBy: adminUserId,
        reason,
        context: 'SupportCandidatesService.resetJobAiAssessment',
      });

      // Note: Assessment is reset but NOT automatically initialized
      // Candidate must manually call initialize() when ready to start the assessment
      logger.info(
        'Assessment reset complete - candidate must initialize manually',
        {
          assessmentId: assessment.id,
          candidateId: assessment.candidateId,
          context: 'SupportCandidatesService.resetJobAiAssessment',
        }
      );

      return {
        message:
          'Job AI assessment reset successfully. Candidate must initialize the assessment when ready.',
        historyId: historyRecord.id,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to reset job AI assessment',
        context: 'SupportCandidatesService.resetJobAiAssessment',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessmentId,
        adminUserId,
        reason,
      });
      throw error;
    }
  }

  /**
   * Resubmit job assessment for video analysis
   * Deletes previous video files and triggers background processing
   * Rate limited to once per 10 minutes per assessment
   */
  async resubmitJobAssessment(
    adminUserId: string,
    assessmentId: string
  ): Promise<ISupportCandidateResetOnboardingAssessmentResponse> {
    try {
      logger.info({
        message: 'Resubmitting job assessment',
        context: 'SupportCandidatesService.resubmitJobAssessment',
        assessmentId,
        adminUserId,
      });

      // Check rate limiting
      const lastResubmitTime =
        SupportCandidatesService.resubmitRateLimitMap.get(assessmentId);
      if (lastResubmitTime) {
        const timeSinceLastResubmit = Date.now() - lastResubmitTime;
        if (
          timeSinceLastResubmit <
          SupportCandidatesService.RESUBMIT_RATE_LIMIT_MS
        ) {
          const remainingTime = Math.ceil(
            (SupportCandidatesService.RESUBMIT_RATE_LIMIT_MS -
              timeSinceLastResubmit) /
              1000 /
              60
          );
          throw new AppError(
            `Please wait ${remainingTime} more minute${remainingTime !== 1 ? 's' : ''} before resubmitting this assessment`,
            429,
            ErrorCode.VALIDATION_ERROR
          );
        }
      }

      // Get the job assessment
      const assessment = await this.prisma.job_ai_assessment.findUnique({
        where: { id: assessmentId },
        include: {
          videoAnalysis: true,
          task: true,
        },
      });

      if (!assessment) {
        throw new AppError(
          'Job assessment not found',
          404,
          ErrorCode.JOB_AI_ASSESSMENT_NOT_FOUND
        );
      }

      // Use the singleton instance of JobAiAssessmentService
      await this.jobAiAssessmentService.reSubmitAssessment(assessmentId);

      // Update rate limit timestamp
      SupportCandidatesService.resubmitRateLimitMap.set(
        assessmentId,
        Date.now()
      );

      // Clean up old entries from rate limit map (older than rate limit period)
      const cutoffTime =
        Date.now() - SupportCandidatesService.RESUBMIT_RATE_LIMIT_MS;
      for (const [
        id,
        timestamp,
      ] of SupportCandidatesService.resubmitRateLimitMap.entries()) {
        if (timestamp < cutoffTime) {
          SupportCandidatesService.resubmitRateLimitMap.delete(id);
        }
      }

      logger.info({
        message: 'Job assessment resubmitted successfully',
        context: 'SupportCandidatesService.resubmitJobAssessment',
        assessmentId,
        performedBy: adminUserId,
      });

      return {
        message:
          'Assessment resubmitted successfully. Processing in background...',
        historyId: null,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to resubmit job assessment',
        context: 'SupportCandidatesService.resubmitJobAssessment',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessmentId,
        adminUserId,
      });
      throw error;
    }
  }

  /**
   * Fix video chunks for existing assessments that were affected by the reset issue
   * Marks old chunks (created before startedAt) as irrelevant for both job AI and onboarding assessments
   */
  async fixVideoChunksForAssessment(
    adminUserId: string,
    options?: {
      assessmentId?: string;
      assessmentType?: 'job' | 'onboarding' | 'both';
      dryRun?: boolean;
    }
  ): Promise<{
    message: string;
    jobAiAssessmentsFixed: number;
    onboardingAssessmentsFixed: number;
    jobAiChunksMarkedIrrelevant: number;
    onboardingChunksMarkedIrrelevant: number;
    details: Array<{
      assessmentId: string;
      assessmentType: 'job' | 'onboarding';
      chunksMarkedIrrelevant: number;
      candidateId: string;
    }>;
  }> {
    try {
      logger.info({
        message: 'Fixing video chunks for affected assessments',
        context: 'SupportCandidatesService.fixVideoChunksForAssessment',
        adminUserId,
        options,
      });

      const assessmentType = options?.assessmentType || 'both';
      const dryRun = options?.dryRun || false;
      const details: Array<{
        assessmentId: string;
        assessmentType: 'job' | 'onboarding';
        chunksMarkedIrrelevant: number;
        candidateId: string;
      }> = [];

      let jobAiAssessmentsFixed = 0;
      let onboardingAssessmentsFixed = 0;
      let jobAiChunksMarkedIrrelevant = 0;
      let onboardingChunksMarkedIrrelevant = 0;

      // Fix Job AI Assessments
      if (assessmentType === 'job' || assessmentType === 'both') {
        const jobAiWhere: any = {};
        if (options?.assessmentId) {
          jobAiWhere.id = options.assessmentId;
        } else {
          // Find assessments that have startedAt set (meaning they were started/reset)
          jobAiWhere.startedAt = { not: null };
        }

        const jobAiAssessments = await this.prisma.job_ai_assessment.findMany({
          where: jobAiWhere,
          select: {
            id: true,
            candidateId: true,
            startedAt: true,
          },
        });

        for (const assessment of jobAiAssessments) {
          if (!assessment.startedAt) continue;

          // Find chunks created before startedAt but still marked as relevant
          const oldChunks =
            await this.prisma.jobAiAssessmentVideoChunkAnalysis.findMany({
              where: {
                assessmentId: assessment.id,
                isRelevant: true,
                createdAt: {
                  lt: assessment.startedAt,
                },
              },
              select: { id: true },
            });

          if (oldChunks.length > 0) {
            if (!dryRun) {
              const updateResult =
                await this.prisma.jobAiAssessmentVideoChunkAnalysis.updateMany({
                  where: {
                    assessmentId: assessment.id,
                    isRelevant: true,
                    createdAt: {
                      lt: assessment.startedAt,
                    },
                  },
                  data: {
                    isRelevant: false,
                    status: 'skipped', // Stop any pending analysis
                  },
                });

              jobAiChunksMarkedIrrelevant += updateResult.count;
              details.push({
                assessmentId: assessment.id,
                assessmentType: 'job',
                chunksMarkedIrrelevant: updateResult.count,
                candidateId: assessment.candidateId,
              });
            } else {
              jobAiChunksMarkedIrrelevant += oldChunks.length;
              details.push({
                assessmentId: assessment.id,
                assessmentType: 'job',
                chunksMarkedIrrelevant: oldChunks.length,
                candidateId: assessment.candidateId,
              });
            }
            jobAiAssessmentsFixed++;
          }
        }
      }

      // Fix Onboarding Assessments
      if (assessmentType === 'onboarding' || assessmentType === 'both') {
        const onboardingWhere: any = {};
        if (options?.assessmentId) {
          onboardingWhere.id = options.assessmentId;
        } else {
          // Find assessments that have startedAt set (meaning they were started/reset)
          onboardingWhere.startedAt = { not: null };
        }

        const onboardingAssessments =
          await this.prisma.onboarding_assessment.findMany({
            where: onboardingWhere,
            select: {
              id: true,
              candidateId: true,
              startedAt: true,
            },
          });

        for (const assessment of onboardingAssessments) {
          if (!assessment.startedAt) continue;

          // Find chunks created before startedAt but still marked as relevant
          const oldChunks = await this.prisma.videoChunkAnalysis.findMany({
            where: {
              assessmentId: assessment.id,
              isRelevant: true,
              createdAt: {
                lt: assessment.startedAt,
              },
            },
            select: { id: true },
          });

          if (oldChunks.length > 0) {
            if (!dryRun) {
              const updateResult =
                await this.prisma.videoChunkAnalysis.updateMany({
                  where: {
                    assessmentId: assessment.id,
                    isRelevant: true,
                    createdAt: {
                      lt: assessment.startedAt,
                    },
                  },
                  data: {
                    isRelevant: false,
                    status: 'skipped', // Stop any pending analysis
                  },
                });

              onboardingChunksMarkedIrrelevant += updateResult.count;
              details.push({
                assessmentId: assessment.id,
                assessmentType: 'onboarding',
                chunksMarkedIrrelevant: updateResult.count,
                candidateId: assessment.candidateId,
              });
            } else {
              onboardingChunksMarkedIrrelevant += oldChunks.length;
              details.push({
                assessmentId: assessment.id,
                assessmentType: 'onboarding',
                chunksMarkedIrrelevant: oldChunks.length,
                candidateId: assessment.candidateId,
              });
            }
            onboardingAssessmentsFixed++;
          }
        }
      }

      const message = dryRun
        ? `Dry run completed. Would fix ${jobAiAssessmentsFixed + onboardingAssessmentsFixed} assessment(s) and mark ${jobAiChunksMarkedIrrelevant + onboardingChunksMarkedIrrelevant} chunk(s) as irrelevant.`
        : `Fixed ${jobAiAssessmentsFixed + onboardingAssessmentsFixed} assessment(s) and marked ${jobAiChunksMarkedIrrelevant + onboardingChunksMarkedIrrelevant} chunk(s) as irrelevant.`;

      logger.info({
        message: 'Video chunks fix completed',
        context: 'SupportCandidatesService.fixVideoChunksForAssessment',
        adminUserId,
        jobAiAssessmentsFixed,
        onboardingAssessmentsFixed,
        jobAiChunksMarkedIrrelevant,
        onboardingChunksMarkedIrrelevant,
        dryRun,
      });

      return {
        message,
        jobAiAssessmentsFixed,
        onboardingAssessmentsFixed,
        jobAiChunksMarkedIrrelevant,
        onboardingChunksMarkedIrrelevant,
        details,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to fix video chunks for assessments',
        context: 'SupportCandidatesService.fixVideoChunksForAssessment',
        error: error instanceof Error ? error.message : 'Unknown error',
        adminUserId,
        options,
      });
      throw error;
    }
  }

  /**
   * Backfill video chunk durations for existing chunks that don't have duration
   * Extracts duration from video files and stores it in the database
   */
  async backfillVideoChunkDurations(
    adminUserId: string,
    options?: {
      assessmentId?: string;
      candidateId?: string;
      assessmentType?: 'job' | 'onboarding' | 'both';
      batchSize?: number;
      dryRun?: boolean;
    }
  ): Promise<{
    message: string;
    jobAiChunksProcessed: number;
    jobAiChunksSucceeded: number;
    jobAiChunksFailed: number;
    onboardingChunksProcessed: number;
    onboardingChunksSucceeded: number;
    onboardingChunksFailed: number;
    details: Array<{
      assessmentId: string;
      assessmentType: 'job' | 'onboarding';
      chunkId: string;
      chunkIndex: number;
      success: boolean;
      duration?: number;
      error?: string;
    }>;
  }> {
    try {
      logger.info({
        message: 'Starting video chunk duration backfill',
        context: 'SupportCandidatesService.backfillVideoChunkDurations',
        adminUserId,
        options,
      });

      const assessmentType = options?.assessmentType || 'both';
      const batchSize = options?.batchSize || 10;
      const dryRun = options?.dryRun || false;
      const details: Array<{
        assessmentId: string;
        assessmentType: 'job' | 'onboarding';
        chunkId: string;
        chunkIndex: number;
        success: boolean;
        duration?: number;
        error?: string;
      }> = [];

      let jobAiChunksProcessed = 0;
      let jobAiChunksSucceeded = 0;
      let jobAiChunksFailed = 0;
      let onboardingChunksProcessed = 0;
      let onboardingChunksSucceeded = 0;
      let onboardingChunksFailed = 0;

      // Process Job AI Assessment chunks
      if (assessmentType === 'job' || assessmentType === 'both') {
        const jobAiWhere: any = {
          duration: null, // Only chunks without duration
          isRelevant: true, // Only process relevant chunks
          gcsUri: { not: { equals: null } }, // Must have a file (not null)
        };

        if (options?.assessmentId) {
          jobAiWhere.assessmentId = options.assessmentId;
        } else if (options?.candidateId) {
          // Find assessments for this candidate
          const assessments = await this.prisma.job_ai_assessment.findMany({
            where: { candidateId: options.candidateId },
            select: { id: true },
          });
          jobAiWhere.assessmentId = {
            in: assessments.map((a) => a.id),
          };
        }

        const jobAiChunks =
          await this.prisma.jobAiAssessmentVideoChunkAnalysis.findMany({
            where: jobAiWhere,
            select: {
              id: true,
              assessmentId: true,
              chunkIndex: true,
              gcsUri: true,
            },
            take: batchSize * 10, // Limit to avoid overwhelming the system
          });

        logger.info({
          message: `Found ${jobAiChunks.length} job AI chunks without duration`,
          context: 'SupportCandidatesService.backfillVideoChunkDurations',
        });

        // Process chunks in batches
        for (let i = 0; i < jobAiChunks.length; i += batchSize) {
          const batch = jobAiChunks.slice(i, i + batchSize);

          await Promise.all(
            batch.map(async (chunk) => {
              jobAiChunksProcessed++;

              if (dryRun) {
                details.push({
                  assessmentId: chunk.assessmentId,
                  assessmentType: 'job',
                  chunkId: chunk.id,
                  chunkIndex: chunk.chunkIndex,
                  success: true,
                });
                jobAiChunksSucceeded++;
                return;
              }

              try {
                // Extract file path from GCS URI
                const filePath = chunk.gcsUri!.replace(
                  `gs://${ENV.BUCKET_NAME}/`,
                  ''
                );

                // Extract duration from video file
                const duration = await extractVideoDurationFromStorage(
                  this.storageProvider,
                  filePath
                );

                if (duration === null) {
                  jobAiChunksFailed++;
                  details.push({
                    assessmentId: chunk.assessmentId,
                    assessmentType: 'job',
                    chunkId: chunk.id,
                    chunkIndex: chunk.chunkIndex,
                    success: false,
                    error: 'Failed to extract duration from video file',
                  });
                  return;
                }

                // Update chunk record with duration
                await this.prisma.jobAiAssessmentVideoChunkAnalysis.update({
                  where: { id: chunk.id },
                  data: { duration },
                });

                jobAiChunksSucceeded++;
                details.push({
                  assessmentId: chunk.assessmentId,
                  assessmentType: 'job',
                  chunkId: chunk.id,
                  chunkIndex: chunk.chunkIndex,
                  success: true,
                  duration,
                });

                logger.debug({
                  message: 'Job AI chunk duration backfilled',
                  context:
                    'SupportCandidatesService.backfillVideoChunkDurations',
                  chunkId: chunk.id,
                  assessmentId: chunk.assessmentId,
                  duration,
                });
              } catch (error) {
                jobAiChunksFailed++;
                const errorMessage =
                  error instanceof Error ? error.message : 'Unknown error';
                details.push({
                  assessmentId: chunk.assessmentId,
                  assessmentType: 'job',
                  chunkId: chunk.id,
                  chunkIndex: chunk.chunkIndex,
                  success: false,
                  error: errorMessage,
                });

                logger.warn({
                  message: 'Failed to backfill job AI chunk duration',
                  context:
                    'SupportCandidatesService.backfillVideoChunkDurations',
                  chunkId: chunk.id,
                  error: errorMessage,
                });
              }
            })
          );

          // Small delay between batches to avoid overwhelming the system
          if (i + batchSize < jobAiChunks.length) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      }

      // Process Onboarding Assessment chunks
      if (assessmentType === 'onboarding' || assessmentType === 'both') {
        const onboardingWhere: any = {
          duration: null, // Only chunks without duration
          isRelevant: true, // Only process relevant chunks
          gcsUri: { not: { equals: null } }, // Must have a file (not null)
        };

        if (options?.assessmentId) {
          onboardingWhere.assessmentId = options.assessmentId;
        } else if (options?.candidateId) {
          // Find assessments for this candidate
          const assessments = await this.prisma.onboarding_assessment.findMany({
            where: { candidateId: options.candidateId },
            select: { id: true },
          });
          onboardingWhere.assessmentId = {
            in: assessments.map((a) => a.id),
          };
        }

        const onboardingChunks = await this.prisma.videoChunkAnalysis.findMany({
          where: onboardingWhere,
          select: {
            id: true,
            assessmentId: true,
            chunkIndex: true,
            gcsUri: true,
          },
          take: batchSize * 10, // Limit to avoid overwhelming the system
        });

        logger.info({
          message: `Found ${onboardingChunks.length} onboarding chunks without duration`,
          context: 'SupportCandidatesService.backfillVideoChunkDurations',
        });

        // Process chunks in batches
        for (let i = 0; i < onboardingChunks.length; i += batchSize) {
          const batch = onboardingChunks.slice(i, i + batchSize);

          await Promise.all(
            batch.map(async (chunk) => {
              onboardingChunksProcessed++;

              if (dryRun) {
                details.push({
                  assessmentId: chunk.assessmentId,
                  assessmentType: 'onboarding',
                  chunkId: chunk.id,
                  chunkIndex: chunk.chunkIndex,
                  success: true,
                });
                onboardingChunksSucceeded++;
                return;
              }

              try {
                // Extract file path from GCS URI
                const filePath = chunk.gcsUri!.replace(
                  `gs://${ENV.BUCKET_NAME}/`,
                  ''
                );

                // Extract duration from video file
                const duration = await extractVideoDurationFromStorage(
                  this.storageProvider,
                  filePath
                );

                if (duration === null) {
                  onboardingChunksFailed++;
                  details.push({
                    assessmentId: chunk.assessmentId,
                    assessmentType: 'onboarding',
                    chunkId: chunk.id,
                    chunkIndex: chunk.chunkIndex,
                    success: false,
                    error: 'Failed to extract duration from video file',
                  });
                  return;
                }

                // Update chunk record with duration
                await this.prisma.videoChunkAnalysis.update({
                  where: { id: chunk.id },
                  data: { duration },
                });

                onboardingChunksSucceeded++;
                details.push({
                  assessmentId: chunk.assessmentId,
                  assessmentType: 'onboarding',
                  chunkId: chunk.id,
                  chunkIndex: chunk.chunkIndex,
                  success: true,
                  duration,
                });

                logger.debug({
                  message: 'Onboarding chunk duration backfilled',
                  context:
                    'SupportCandidatesService.backfillVideoChunkDurations',
                  chunkId: chunk.id,
                  assessmentId: chunk.assessmentId,
                  duration,
                });
              } catch (error) {
                onboardingChunksFailed++;
                const errorMessage =
                  error instanceof Error ? error.message : 'Unknown error';
                details.push({
                  assessmentId: chunk.assessmentId,
                  assessmentType: 'onboarding',
                  chunkId: chunk.id,
                  chunkIndex: chunk.chunkIndex,
                  success: false,
                  error: errorMessage,
                });

                logger.warn({
                  message: 'Failed to backfill onboarding chunk duration',
                  context:
                    'SupportCandidatesService.backfillVideoChunkDurations',
                  chunkId: chunk.id,
                  error: errorMessage,
                });
              }
            })
          );

          // Small delay between batches to avoid overwhelming the system
          if (i + batchSize < onboardingChunks.length) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      }

      const totalProcessed = jobAiChunksProcessed + onboardingChunksProcessed;
      const totalSucceeded = jobAiChunksSucceeded + onboardingChunksSucceeded;
      const totalFailed = jobAiChunksFailed + onboardingChunksFailed;

      const message = dryRun
        ? `Dry run completed. Would process ${totalProcessed} chunk(s): ${totalSucceeded} would succeed, ${totalFailed} would fail.`
        : `Processed ${totalProcessed} chunk(s): ${totalSucceeded} succeeded, ${totalFailed} failed.`;

      logger.info({
        message: 'Video chunk duration backfill completed',
        context: 'SupportCandidatesService.backfillVideoChunkDurations',
        adminUserId,
        jobAiChunksProcessed,
        jobAiChunksSucceeded,
        jobAiChunksFailed,
        onboardingChunksProcessed,
        onboardingChunksSucceeded,
        onboardingChunksFailed,
        dryRun,
      });

      return {
        message,
        jobAiChunksProcessed,
        jobAiChunksSucceeded,
        jobAiChunksFailed,
        onboardingChunksProcessed,
        onboardingChunksSucceeded,
        onboardingChunksFailed,
        details,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to backfill video chunk durations',
        context: 'SupportCandidatesService.backfillVideoChunkDurations',
        error: error instanceof Error ? error.message : 'Unknown error',
        adminUserId,
        options,
      });
      throw error;
    }
  }
}
