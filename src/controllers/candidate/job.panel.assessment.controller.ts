import { NextFunction, Request, Response } from 'express';

import { BaseController } from '@/controllers/common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import {
  ICandidatePanelAssessmentInvitationResponseApiRequest,
  ICandidatePanelAssessmentInvitationResponseApiResponse,
  ICandidatePanelAssessmentInvitationGetApiRequest,
  ICandidatePanelAssessmentInvitationGetApiResponse,
  ICandidatePanelAssessmentSlotsGetApiRequest,
  ICandidatePanelAssessmentSlotsGetApiResponse,
  ICandidateListScheduledInterviewsApiResponse,
  ICandidateListScheduledInterviewsRequest,
} from '@/shared/models/api/candidate/job.panel.assessment.api';
import { singleton } from '@/shared/decorators/singleton';
import { CandidatePanelAssessmentService } from '@/services/candidate/job.panel.assessment.service';

@singleton
export class CandidatePanelAssessmentController extends BaseController {
  constructor(
    private readonly panelAssessmentService: CandidatePanelAssessmentService
  ) {
    super();
  }

  /**
   * Candidate responds to panel assessment invitation (accept/reject)
   */
  respondToInvitation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidatePanelAssessmentInvitationResponseApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user.candidateId as string;

        const responseRequest =
          createIApiRequest<ICandidatePanelAssessmentInvitationResponseApiRequest>(
            req
          );

        const invitationId = responseRequest.params.invitationId;
        const { action, selectedSlotId } = responseRequest.data;

        const result =
          await this.panelAssessmentService.respondToPanelAssessmentInvitation(
            invitationId,
            candidateId,
            action,
            selectedSlotId
          );

        return {
          success: true,
          message: result.message,
          data: result,
        };
      }
    );
  };

  /**
   * Get panel assessment invitation details for candidate
   */
  getInvitation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidatePanelAssessmentInvitationGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user.candidateId as string;

        const getRequest =
          createIApiRequest<ICandidatePanelAssessmentInvitationGetApiRequest>(
            req
          );

        const invitationId = getRequest.params.invitationId;

        const result =
          await this.panelAssessmentService.getPanelAssessmentInvitation(
            invitationId,
            candidateId
          );

        return {
          success: true,
          message: 'Panel assessment invitation retrieved successfully',
          data: result,
        };
      }
    );
  };

  /**
   * Get available panel assessment slots for candidate
   */
  getAvailableSlots = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidatePanelAssessmentSlotsGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user.candidateId as string;

        const getRequest =
          createIApiRequest<ICandidatePanelAssessmentSlotsGetApiRequest>(req);

        const panelAssessmentId = getRequest.params.panelAssessmentId;

        const result =
          await this.panelAssessmentService.getPanelAssessmentSlots(
            panelAssessmentId,
            candidateId
          );

        return {
          success: true,
          message: 'Panel assessment slots retrieved successfully',
          data: result,
        };
      }
    );
  };

  listScheduledInterviews = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateListScheduledInterviewsApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user.candidateId as string;
        const request =
          createIApiRequest<ICandidateListScheduledInterviewsRequest>(req);
        return await this.panelAssessmentService.listScheduledInterviews(
          candidateId,
          request.filters,
          request.pagination
        );
      }
    );
  };
}
