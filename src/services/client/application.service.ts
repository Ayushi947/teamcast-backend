import { PrismaClient, application_action_by } from '@prisma/client';
import { singleton } from '@/shared/decorators/singleton';
import {
  IClientJobApplication,
  IClientJobApplicationFilterQuery,
  toClientApplicationDomain,
  IClientJobApplicationAiAssessment,
  toIClientJobApplicationAiAssessment,
} from '@/shared/models/domain/client/application.domain';
import {
  IPaginationRequest,
  IPaginatedResponse,
} from '@/shared/models/api/common/common.api';
import { getPaginationInfo } from '@/utils/pagination';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';
import { ENV } from '@/config/env';
import { ApplicationStatusEnum } from '../../shared/models/common/enums';
import { NotificationFactory } from '@/services/notification/notification.factory';
import { INotificationProvider } from '../notification/notification.interface';
import { IStorageProvider } from '../helpers/storage/storage.interface';
import { StorageFactory } from '../helpers/storage/storage.factory';
import { McpWebhookService } from '@/mcp/services/mcp.webhook.service';

import { ClientAccountManagerService } from '@/services/client/account.manager.service';

@singleton
export class ClientApplicationService {
  private readonly prisma: PrismaClient;
  private readonly notificationProvider: INotificationProvider;
  private readonly storageService: IStorageProvider;

  constructor() {
    this.prisma = new PrismaClient();
    const notificationFactory = new NotificationFactory();
    this.notificationProvider = notificationFactory.getNotificationProvider();
    this.storageService = StorageFactory.getInstance().getProvider();
  }

  /**
   * Get a list of applications for a client with optional filtering
   */
  async listClientApplications(
    clientId: string,
    filter: IClientJobApplicationFilterQuery,
    paginationRequest: IPaginationRequest
  ): Promise<IPaginatedResponse<IClientJobApplication>> {
    try {
      // Get pagination info
      const paginationInfo = getPaginationInfo(paginationRequest);

      // Build the where clause for filtering
      const where: any = {
        jobPosting: {
          clientId: clientId,
        },
        ...(filter.jobId && { jobPostingId: filter.jobId }),
        ...(filter.userId && { candidateId: filter.userId }),
        ...(filter.status && Array.isArray(filter.status)
          ? { status: { in: filter.status } }
          : filter.status
            ? { status: filter.status }
            : {}),
      };

      // Add search filter if provided
      if (filter.search) {
        where.OR = [
          {
            jobPosting: {
              title: {
                contains: filter.search,
                mode: 'insensitive' as const,
              },
            },
          },
          {
            jobPosting: {
              client: {
                company: {
                  name: {
                    contains: filter.search,
                    mode: 'insensitive' as const,
                  },
                },
              },
            },
          },
          {
            candidate: {
              user: {
                name: {
                  contains: filter.search,
                  mode: 'insensitive' as const,
                },
              },
            },
          },
          {
            candidate: {
              user: {
                email: {
                  contains: filter.search,
                  mode: 'insensitive' as const,
                },
              },
            },
          },
        ];
      }

      // Find all applications for this client with their related data
      const applications = await this.prisma.job_application.findMany({
        where: {
          ...where,
          status: {
            in: [
              ApplicationStatusEnum.INVITED,
              ApplicationStatusEnum.APPLIED,
              ApplicationStatusEnum.REVIEWING,
              ApplicationStatusEnum.ACCEPTED,
              ApplicationStatusEnum.SHORTLISTED,
              ApplicationStatusEnum.REJECTED,
            ],
          },
        },
        include: {
          jobPosting: {
            include: {
              client: {
                include: {
                  company: true,
                },
              },
            },
          },
          candidate: {
            include: {
              user: true,
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
            },
          },
        },
        ...paginationInfo,
      });

      // Count total matching records (for pagination)
      const totalMatchingApplications = await this.prisma.job_application.count(
        {
          where: {
            ...where,
            status: {
              in: [
                ApplicationStatusEnum.INVITED,
                ApplicationStatusEnum.APPLIED,
                ApplicationStatusEnum.REVIEWING,
              ],
            },
          },
        }
      );

      // Convert user images to presigned URLs
      for (const application of applications) {
        if (
          application.candidate?.user?.image &&
          !application.candidate.user.image.startsWith('http')
        ) {
          try {
            const presignedUrl = await this.storageService.generatePreSignedUrl(
              application.candidate.user.image,
              'read'
            );
            application.candidate.user.image = presignedUrl;
          } catch (error) {
            logger.warn({
              message: 'Failed to generate presigned URL for user image',
              context: 'ClientApplicationService.listClientApplications',
              error: error instanceof Error ? error.message : 'Unknown error',
              imagePath: application.candidate.user.image,
            });
            // Continue without image if presigned URL generation fails
          }
        }
      }

      // Convert to domain models
      const domainApplications = applications.map((application) =>
        toClientApplicationDomain(application)
      );

      // Return paginated response
      return {
        items: domainApplications,
        pagination: {
          total: totalMatchingApplications,
          page: paginationRequest.page ?? ENV.DEFAULT_PAGE,
          limit: paginationRequest.limit ?? ENV.DEFAULT_LIMIT,
          totalPages: Math.ceil(
            totalMatchingApplications /
              (paginationRequest.limit ?? ENV.DEFAULT_LIMIT)
          ),
        },
      };
    } catch (error) {
      logger.error({
        message: 'Failed to list client applications',
        context: 'ClientApplicationService.listClientApplications',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        filter,
      });
      throw error;
    }
  }

  /**
   * Get a specific application by ID
   */
  async getClientApplication(
    _clientId: string,
    applicationId: string
  ): Promise<IClientJobApplication> {
    try {
      // Find the application with its related data
      const application = await this.prisma.job_application.findFirst({
        where: {
          id: applicationId,
        },
        include: {
          jobPosting: {
            include: {
              client: {
                include: {
                  company: true,
                },
              },
            },
          },
          candidate: {
            include: {
              user: true,
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
            },
          },
        },
      });

      if (!application) {
        throw new AppError('Application not found', 404, ErrorCode.NOT_FOUND);
      }

      // Convert user image to presigned URL if it exists
      if (
        application.candidate?.user?.image &&
        !application.candidate.user.image.startsWith('http')
      ) {
        try {
          const presignedUrl = await this.storageService.generatePreSignedUrl(
            application.candidate.user.image,
            'read'
          );
          application.candidate.user.image = presignedUrl;
        } catch (error) {
          logger.warn({
            message: 'Failed to generate presigned URL for user image',
            context: 'ClientApplicationService.getClientApplication',
            error: error instanceof Error ? error.message : 'Unknown error',
            imagePath: application.candidate.user.image,
          });
          // Continue without image if presigned URL generation fails
        }
      }

      // Convert to domain model
      return toClientApplicationDomain(application);
    } catch (error) {
      logger.error({
        message: 'Failed to get client application',
        context: 'ClientApplicationService.getClientApplication',
        error: error instanceof Error ? error.message : 'Unknown error',
        applicationId,
      });
      throw error;
    }
  }

  /**
   * Get the AI assessment for a specific application
   * Returns null if no assessment exists yet (candidate hasn't completed assessment)
   */
  async getClientApplicationAiAssessment(
    clientId: string,
    applicationId: string
  ): Promise<IClientJobApplicationAiAssessment | null> {
    try {
      const application = await this.prisma.job_application.findUnique({
        where: {
          id: applicationId,
          jobPosting: {
            clientId,
          },
        },
      });

      if (!application) {
        throw new AppError(
          'Application not found',
          404,
          ErrorCode.JOB_APPLICATION_NOT_FOUND
        );
      }

      const candidateAiAssessment =
        await this.prisma.job_ai_assessment_invitation.findFirst({
          where: {
            jobApplicationId: applicationId,
            candidateId: application.candidateId,
          },
          include: {
            jobAiAssessment: true,
          },
        });

      if (!candidateAiAssessment?.jobAiAssessment) {
        logger.info('No candidate AI assessment found', {
          context: 'ClientApplicationService.getClientApplicationAiAssessment',
          applicationId,
        });
        return null;
      }

      const assessment = candidateAiAssessment.jobAiAssessment;

      return assessment
        ? toIClientJobApplicationAiAssessment(assessment)
        : null;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Failed to get AI assessment', {
        context: 'ApplicationService.getClientApplicationAiAssessment',
        clientId,
        applicationId,
        error,
      });

      throw new AppError(
        'Failed to get AI assessment',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Update application status (accept/reject)
   */
  async updateApplicationStatus(
    clientId: string,
    applicationId: string,
    status: ApplicationStatusEnum,
    notes?: string,
    clientUserId?: string
  ): Promise<IClientJobApplication> {
    try {
      // First, validate that the application exists and belongs to this client
      const existingApplication = await this.prisma.job_application.findFirst({
        where: {
          id: applicationId,
        },
        include: {
          jobPosting: {
            include: {
              client: {
                include: {
                  company: true,
                },
              },
            },
          },
          candidate: {
            include: {
              user: true,
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
            },
          },
        },
      });

      if (!existingApplication) {
        throw new AppError(
          'Application not found',
          404,
          ErrorCode.JOB_APPLICATION_NOT_FOUND
        );
      }

      // Validate status transition
      const validTransitions = this.getValidStatusTransitions(
        existingApplication.status
      );
      if (!validTransitions.includes(status)) {
        throw new AppError(
          `Invalid status transition from ${existingApplication.status} to ${status}`,
          400,
          ErrorCode.INVALID_JOB_APPLICATION_STATUS_TRANSITION
        );
      }

      // Prepare update data based on status
      const updateData: any = {
        status: status,
        notes: notes,
      };

      if (status === ApplicationStatusEnum.ACCEPTED) {
        updateData.acceptedAt = new Date();
        updateData.acceptedBy = application_action_by.CLIENT;
        updateData.acceptedById = clientUserId || null;
        updateData.acceptanceNote = notes || null;
      }

      if (status === ApplicationStatusEnum.REJECTED) {
        updateData.declinedAt = new Date();
        updateData.declinedBy = application_action_by.CLIENT;
        updateData.declinedById = clientUserId || null;
        updateData.declineReason = notes || null;
      }

      // Update the application status
      const updatedApplication = await this.prisma.job_application.update({
        where: {
          id: applicationId,
        },
        data: updateData,
        include: {
          jobPosting: {
            include: {
              client: {
                include: {
                  company: true,
                },
              },
            },
          },
          candidate: {
            include: {
              user: true,
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
            },
          },
        },
      });

      // Send email notification based on status
      await this.sendStatusUpdateNotification(
        updatedApplication,
        status,
        notes
      );

      // Notify MCP client if this candidate was sent via MCP
      McpWebhookService.getInstance()
        .notifyApplicationStatusChange(
          applicationId,
          existingApplication.status,
          status
        )
        .catch((err) => {
          logger.error({
            message: 'Failed to send MCP webhook for application status change',
            context: 'ClientApplicationService.updateApplicationStatus',
            error: err instanceof Error ? err.message : 'Unknown error',
            applicationId,
            oldStatus: existingApplication.status,
            newStatus: status,
          });
        });

      return toClientApplicationDomain(updatedApplication);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error({
        message: 'Failed to update application status',
        context: 'ClientApplicationService.updateApplicationStatus',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        applicationId,
        status,
      });
      throw new AppError(
        'Failed to update application status',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get valid status transitions for a given current status
   */
  private getValidStatusTransitions(
    currentStatus: string
  ): ApplicationStatusEnum[] {
    const transitions: Record<string, ApplicationStatusEnum[]> = {
      [ApplicationStatusEnum.APPLIED]: [
        ApplicationStatusEnum.ACCEPTED,
        ApplicationStatusEnum.REJECTED,
        ApplicationStatusEnum.REVIEWING,
      ],
      [ApplicationStatusEnum.REVIEWING]: [
        ApplicationStatusEnum.ACCEPTED,
        ApplicationStatusEnum.REJECTED,
      ],
      [ApplicationStatusEnum.SHORTLISTED]: [
        ApplicationStatusEnum.ASSESSING,
        ApplicationStatusEnum.OFFERED,
        ApplicationStatusEnum.REJECTED,
      ],
      [ApplicationStatusEnum.ASSESSING]: [
        ApplicationStatusEnum.OFFERED,
        ApplicationStatusEnum.FAILED,
        ApplicationStatusEnum.REJECTED,
      ],
      [ApplicationStatusEnum.OFFERED]: [
        ApplicationStatusEnum.ACCEPTED,
        ApplicationStatusEnum.REJECTED,
      ],
      [ApplicationStatusEnum.INVITED]: [
        ApplicationStatusEnum.ACCEPTED,
        ApplicationStatusEnum.REJECTED,
        ApplicationStatusEnum.REVIEWING,
        ApplicationStatusEnum.OFFERED,
      ],
    };

    return transitions[currentStatus] || [];
  }

  /**
   * Send email notification based on application status update
   */
  private async sendStatusUpdateNotification(
    application: any,
    status: ApplicationStatusEnum,
    notes?: string
  ): Promise<void> {
    try {
      const candidateEmail = application.candidate.user.email;
      const jobTitle = application.jobPosting.title;
      const companyName = application.jobPosting.client.company.name;

      // Send different emails based on status
      switch (status) {
        case ApplicationStatusEnum.REJECTED:
          await this.notificationProvider.sendApplicationRejectedEmail({
            to: candidateEmail,
            jobTitle: jobTitle,
            companyName: companyName,
            notes: notes,
          });
          break;

        case ApplicationStatusEnum.SHORTLISTED:
          await this.notificationProvider.sendApplicationShortlistedEmail({
            to: candidateEmail,
            jobTitle: jobTitle,
            companyName: companyName,
            notes: notes,
          });
          break;

        default:
          logger.info('Application status updated', {
            applicationId: application.id,
            status,
            candidateEmail,
            jobTitle,
            companyName,
          });
      }
    } catch (error) {
      logger.error('Failed to send status update notification', {
        context: 'ClientApplicationService.sendStatusUpdateNotification',
        applicationId: application.id,
        status,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get job posting and company details
   */
  async getJobPostingDetails(jobId: string): Promise<{
    title: string;
    companyName: string;
  }> {
    try {
      const jobPosting = await this.prisma.job_posting.findUnique({
        where: { id: jobId },
        select: {
          title: true,
          client: {
            select: {
              company: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      return {
        title: jobPosting?.title || 'Job Title',
        companyName: jobPosting?.client?.company?.name || 'Company Name',
      };
    } catch (error) {
      logger.error({
        message: 'Failed to get job posting details',
        context: 'ClientApplicationService.getJobPostingDetails',
        error: error instanceof Error ? error.message : 'Unknown error',
        jobId,
      });

      // Return fallback values on error
      return {
        title: 'Job Title',
        companyName: 'Company Name',
      };
    }
  }

  /**
   * Process hire request and send email to account manager
   */
  async processHireRequest(
    clientId: string,
    applicationId: string,
    clientUserId: string
  ): Promise<void> {
    try {
      // Get application details with all necessary relations
      const application = await this.prisma.job_application.findFirst({
        where: {
          id: applicationId,
          jobPosting: {
            clientId: clientId,
          },
        },
        include: {
          jobPosting: {
            include: {
              client: {
                include: {
                  company: true,
                },
              },
            },
          },
          candidate: {
            include: {
              user: true,
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
            },
          },
        },
      });

      if (!application) {
        throw new AppError(
          'Application not found',
          404,
          ErrorCode.JOB_APPLICATION_NOT_FOUND
        );
      }

      // Get client user details
      const clientUser = await this.prisma.client_user.findUnique({
        where: {
          id: clientUserId,
        },
        include: {
          user: true,
        },
      });

      if (!clientUser) {
        throw new AppError(
          'Client user not found',
          404,
          ErrorCode.JOB_APPLICATION_NOT_FOUND
        );
      }

      // Get account manager for the client
      const accountManagerService = new ClientAccountManagerService();
      const accountManager =
        await accountManagerService.getAccountManagerByClientId(clientId);

      if (!accountManager) {
        throw new AppError(
          'Account manager not found for this client',
          404,
          ErrorCode.JOB_APPLICATION_NOT_FOUND
        );
      }

      // Get AI assessment details if available
      const aiAssessment = await this.prisma.job_ai_assessment.findFirst({
        where: {
          jobApplicationId: applicationId,
        },
        select: {
          score: true,
          result: true,
          recommendation: true,
        },
      });

      // Prepare email data
      const emailData = {
        accountManagerName: accountManager.name,
        clientName: clientUser.user.name,
        clientCompanyName: application.jobPosting.client.company.name,
        clientEmail: clientUser.user.email,
        candidateName: application.candidate.user.name,
        candidateEmail: application.candidate.user.email,
        jobTitle: application.jobPosting.title,
        applicationId: applicationId,
        candidateId: application.candidateId,
        clientId: clientId,
        assessmentScore: aiAssessment?.score,
        assessmentResult: aiAssessment?.result,
        assessmentRecommendation: aiAssessment?.recommendation || undefined,
        requestDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        priority: 'medium' as const,
        specialNotes: `Hire request initiated by ${clientUser.user.name} (${clientUser.user.email})`,
      };

      // Send hire request email to account manager
      await this.notificationProvider.sendHireRequestEmail(
        accountManager.email,
        emailData.accountManagerName,
        emailData.clientName,
        emailData.clientCompanyName,
        emailData.clientEmail,
        emailData.candidateName,
        emailData.candidateEmail,
        emailData.jobTitle,
        emailData.applicationId,
        emailData.candidateId,
        emailData.clientId,
        emailData.requestDate,
        emailData.priority,
        emailData.assessmentScore,
        emailData.assessmentResult,
        emailData.assessmentRecommendation,
        emailData.specialNotes
      );

      // Update application status to OFFERED
      await this.updateApplicationStatus(
        clientId,
        applicationId,
        ApplicationStatusEnum.OFFERED,
        'Hire request sent to account manager'
      );

      logger.info({
        message: 'Hire request processed successfully',
        context: 'ClientApplicationService.processHireRequest',
        clientId,
        applicationId,
        accountManagerEmail: accountManager.email,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error({
        message: 'Failed to process hire request',
        context: 'ClientApplicationService.processHireRequest',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        applicationId,
        clientUserId,
      });

      throw new AppError(
        'Failed to process hire request',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }
}
