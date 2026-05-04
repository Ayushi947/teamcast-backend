import { singleton } from '@/shared/decorators/singleton';
import { Request, Response, NextFunction } from 'express';
import { PartnerJobPostingsService } from '@/services/partner/job.postings.service';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import {
  IPartnerJobPostingsGetApiRequest,
  IPartnerJobPostingGetApiRequest,
} from '@/shared/models/api/partner/job.postings.api';
import {
  IPartnerJobApplicationApplyApiRequest,
  IPartnerJobApplicationApplyApiResponse,
} from '@/shared/models/api/partner/job.application.api';

@singleton
export class PartnerJobPostingsController extends BaseController {
  constructor(
    private readonly partnerJobPostingsService: PartnerJobPostingsService
  ) {
    super();
  }

  /**
   * Get active job postings for partners
   * Only returns job postings that have recommendations for the partner's candidates
   */
  getJobPostings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const apiRequest =
        createIApiRequest<IPartnerJobPostingsGetApiRequest>(req);

      // Get partner ID from authenticated user
      const partnerId =
        await this.partnerJobPostingsService.getPartnerFromUserId(req.user!.id);

      return await this.partnerJobPostingsService.getActiveJobPostings(
        partnerId,
        apiRequest.filters,
        apiRequest.pagination
      );
    });
  };

  /**
   * Get job posting details by ID
   */
  getJobPostingById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const apiRequest =
        createIApiRequest<IPartnerJobPostingGetApiRequest>(req);

      const result = await this.partnerJobPostingsService.getJobPostingById(
        apiRequest.params.id
      );

      return { data: result };
    });
  };

  /**
   * Apply to a job posting with partner's resources
   */
  applyToJobPosting = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerJobApplicationApplyApiResponse>(
      req,
      res,
      next,
      async () => {
        // Extract job posting ID from params and application data from body
        const apiRequest =
          createIApiRequest<IPartnerJobApplicationApplyApiRequest>(req);

        // Get partner ID from authenticated user
        const partnerId =
          await this.partnerJobPostingsService.getPartnerFromUserId(
            req.user!.id
          );

        const results = await this.partnerJobPostingsService.applyToJobPosting(
          partnerId,
          apiRequest.params.id,
          apiRequest.data
        );

        return {
          message: 'Applications submitted successfully',
          applications: results.map((app) => ({
            applicationId: app.id,
            candidateId: app.candidateId,
            status: app.status,
          })),
        };
      }
    );
  };
}
