import { Request, Response, NextFunction } from 'express';
import { ClientJobPostingService } from '@/services/client/job.posting.service';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import {
  IClientJobPostingCreateApiRequest,
  IClientJobPostingCreateApiResponse,
  IClientJobPostingUpdateApiRequest,
  IClientJobPostingUpdateApiResponse,
  IClientJobPostingGetApiRequest,
  IClientJobPostingGetApiResponse,
  IClientJobPostingDeleteApiRequest,
  IClientJobPostingDeleteApiResponse,
  IClientJobPostingListApiRequest,
  IClientJobPostingListApiResponse,
  IClientJobPostingSkillsUpdateApiRequest,
  IClientJobPostingSkillsUpdateApiResponse,
  IClientJobPostingStatusUpdateApiRequest,
  IClientJobPostingStatusUpdateApiResponse,
  IClientJobPostingInviteApiRequest,
  IClientJobPostingInviteApiResponse,
  IClientJobAiAssessmentSettingsGetApiRequest,
  IClientJobAiAssessmentSettingsGetApiResponse,
  IClientJobAiAssessmentSettingsUpdateApiRequest,
  IClientJobAiAssessmentSettingsUpdateApiResponse,
} from '@/shared/models/api/client/job.posting.api';
import { singleton } from '@/shared/decorators/singleton';

@singleton
export class ClientJobPostingController extends BaseController {
  constructor(
    private readonly clientJobPostingService: ClientJobPostingService
  ) {
    super();
  }

  /**
   * Create a new job posting
   */
  createJobPosting = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientJobPostingCreateApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const clientUserId = req.user.clientUserId as string;
        const createRequest =
          createIApiRequest<IClientJobPostingCreateApiRequest>(req);
        return await this.clientJobPostingService.createJobPosting(
          clientId,
          clientUserId,
          createRequest.data
        );
      }
    );
  };

  /**
   * Update an existing job posting
   */
  updateJobPosting = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientJobPostingUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const clientUserId = req.user.clientUserId as string;
        const updateRequest =
          createIApiRequest<IClientJobPostingUpdateApiRequest>(req);
        const jobPostingId = updateRequest.params.jobPostingId;
        return await this.clientJobPostingService.updateJobPosting(
          clientId,
          jobPostingId,
          updateRequest.data,
          clientUserId
        );
      }
    );
  };

  /**
   * Update job posting skills
   */
  updateJobPostingSkills = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientJobPostingSkillsUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const updateRequest =
          createIApiRequest<IClientJobPostingSkillsUpdateApiRequest>(req);
        const jobPostingId = updateRequest.params.jobPostingId;
        return await this.clientJobPostingService.updateJobPostingSkills(
          clientId,
          jobPostingId,
          updateRequest.data
        );
      }
    );
  };

  /**
   * Update job posting status
   */
  updateJobPostingStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientJobPostingStatusUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const updateRequest =
          createIApiRequest<IClientJobPostingStatusUpdateApiRequest>(req);
        const jobPostingId = updateRequest.params.jobPostingId;
        return await this.clientJobPostingService.updateJobPostingStatus(
          clientId,
          jobPostingId,
          updateRequest.data
        );
      }
    );
  };

  /**
   * Get a job posting by ID
   */
  getJobPosting = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientJobPostingGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const getRequest =
          createIApiRequest<IClientJobPostingGetApiRequest>(req);
        const jobPostingId = getRequest.params.jobPostingId;

        return await this.clientJobPostingService.getJobPosting(
          clientId,
          jobPostingId
        );
      }
    );
  };

  getPublicJobPosting = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientJobPostingGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const getRequest =
          createIApiRequest<IClientJobPostingGetApiRequest>(req);
        const jobPostingId = getRequest.params.jobPostingId;

        return await this.clientJobPostingService.getPublicJobPosting(
          jobPostingId
        );
      }
    );
  };

  /**
   * Delete a job posting
   */
  deleteJobPosting = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientJobPostingDeleteApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const deleteRequest =
          createIApiRequest<IClientJobPostingDeleteApiRequest>(req);
        const jobPostingId = deleteRequest.params.jobPostingId;
        await this.clientJobPostingService.deleteJobPosting(
          clientId,
          jobPostingId
        );
        return undefined;
      }
    );
  };

  /**
   * List job postings with filtering
   */
  listJobPostings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientJobPostingListApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const listRequest =
          createIApiRequest<IClientJobPostingListApiRequest>(req);
        return await this.clientJobPostingService.listJobPostings(
          clientId,
          listRequest.filters,
          listRequest.pagination
        );
      }
    );
  };

  /**
   * Invite a candidate to a job posting
   */
  inviteCandidate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientJobPostingInviteApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const clientUserId = req.user?.clientUserId as string;

        const inviteRequest =
          createIApiRequest<IClientJobPostingInviteApiRequest>(req);
        const jobPostingId = inviteRequest.params.jobPostingId;
        return await this.clientJobPostingService.inviteCandidate(
          clientId,
          jobPostingId,
          inviteRequest.data,
          clientUserId
        );
      }
    );
  };

  /**
   * Get AI assessment settings for a job posting
   */
  getJobPostingAiAssessmentSettings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientJobAiAssessmentSettingsGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const getRequest =
          createIApiRequest<IClientJobAiAssessmentSettingsGetApiRequest>(req);
        const jobPostingId = getRequest.params.jobPostingId;
        return await this.clientJobPostingService.getJobPostingAiAssessmentSettings(
          clientId,
          jobPostingId
        );
      }
    );
  };

  /**
   * Update AI assessment settings for a job posting
   */
  updateJobPostingAiAssessmentSettings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientJobAiAssessmentSettingsUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const updateRequest =
          createIApiRequest<IClientJobAiAssessmentSettingsUpdateApiRequest>(
            req
          );
        const jobPostingId = updateRequest.params.jobPostingId;
        return await this.clientJobPostingService.updateJobPostingAiAssessmentSettings(
          clientId,
          jobPostingId,
          updateRequest.data
        );
      }
    );
  };
}
