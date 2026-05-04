import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '../../utils/api.request';
import { singleton } from '@/shared/decorators/singleton';
import { JobAiAssessmentInviteService } from '@/services/client/job.ai.assessment.invite.service';
import {
  IJobAiAssessmentApplicationUrlGenerateApiResponse,
  IJobAiAssessmentApplicationUrlGenerateApiRequest,
  IJobAiAssessmentInviteCreateApiRequest,
  IJobAiAssessmentInviteCreateApiResponse,
  IScheduledJobAssessmentDetailsApiResponse,
  IClientJobAiAssessmentInterviewsListApiRequest,
  IClientListJobAiAssessmentInterviewsApiResponse,
} from '@/shared/models/api/client/job.ai.assessment.invite.api';
import { IJobAiAssessmentInvite } from '@/shared/models/domain/client/job.ai.assessment.invite';

@singleton
export class ClientJobAiAssessmentInviteController extends BaseController {
  constructor(
    private readonly jobAiAssessmentInviteService: JobAiAssessmentInviteService
  ) {
    super();
  }

  createJobAiAssessmentInvite = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IJobAiAssessmentInviteCreateApiResponse>(
      req,
      res,
      next,
      async () => {
        const { data } =
          createIApiRequest<IJobAiAssessmentInviteCreateApiRequest>(req);

        const clientId = req.user.clientId;
        const clientUserId = req.user.clientUserId;

        if (!clientId) {
          throw new Error('Client ID is required');
        }

        if (!clientUserId) {
          throw new Error('Client User ID is required');
        }

        const { candidateId, jobApplicationId } = data;

        return await this.jobAiAssessmentInviteService.createAiAssessmentInvite(
          candidateId,
          jobApplicationId,
          clientId,
          clientUserId
        );
      }
    );
  };

  /**
   * Generate JD assessment URL for pending invitation
   */
  generateInvitationUrl = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IJobAiAssessmentApplicationUrlGenerateApiResponse>(
      req,
      res,
      next,
      async () => {
        const { data } =
          createIApiRequest<IJobAiAssessmentApplicationUrlGenerateApiRequest>(
            req
          );

        const result =
          await this.jobAiAssessmentInviteService.generateInvitationUrl(
            data.candidateId,
            data.jobApplicationId
          );

        return result;
      }
    );
  };

  listJobAiAssessmentInterviews = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    this.handleRequest<IClientListJobAiAssessmentInterviewsApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const { pagination } =
          createIApiRequest<IClientJobAiAssessmentInterviewsListApiRequest>(
            req
          );
        return await this.jobAiAssessmentInviteService.listJobAiAssessmentInterviews(
          clientId,
          pagination
        );
      }
    );
  };

  getJobAiAssessmentDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IScheduledJobAssessmentDetailsApiResponse>(
      req,
      res,
      next,
      async () => {
        const { invitationId } = req.params;
        return await this.jobAiAssessmentInviteService.getJobAiAssessmentDetails(
          req.user.clientId as string,
          invitationId as string
        );
      }
    );
  };

  getJobAiAssessmentInviteForCandidateId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IJobAiAssessmentInvite>(req, res, next, async () => {
      const { candidateId } = req.params;
      return await this.jobAiAssessmentInviteService.getJobAiAssessmentInviteForCandidateId(
        req.user.clientId as string,
        candidateId as string
      );
    });
  };
}
