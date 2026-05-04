import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../common/base.controller';
import { ClientJobPanelAssessmentService } from '@/services/client/job.panel.assessment.service';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import {
  IGenerateMeetingLinkRequest,
  IGenerateMeetingLinkApiResponse,
  IUpdateMeetingRequest,
  IUpdateMeetingApiResponse,
  ICancelMeetingRequest,
  ICancelMeetingApiResponse,
} from '@/shared/models/api/client/teams.meeting.api';

export class ClientTeamsMeetingController extends BaseController {
  constructor(
    private readonly panelAssessmentService: ClientJobPanelAssessmentService
  ) {
    super();
  }

  /**
   * Generate meeting link for panel assessment invitation
   */
  generateMeetingLink = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IGenerateMeetingLinkApiResponse>(
      req,
      res,
      next,
      async () => {
        const { invitationId } = req.params;
        const {
          organizerEmail,
          organizerName,
          useTeams,
          manualMeetingLink,
          manualEventId,
        }: IGenerateMeetingLinkRequest = req.body;
        const clientId = req.user?.clientId;

        if (!clientId) {
          throw new AppError(
            'Client ID not found in request',
            401,
            ErrorCode.UNAUTHORIZED
          );
        }

        if (!organizerEmail || !organizerName) {
          throw new AppError(
            'Organizer email and name are required',
            400,
            ErrorCode.VALIDATION_ERROR
          );
        }

        if (!invitationId) {
          throw new AppError(
            'Invitation ID is required',
            400,
            ErrorCode.VALIDATION_ERROR
          );
        }

        // Validate manual meeting link when Teams is disabled
        if (useTeams === false && !manualMeetingLink) {
          throw new AppError(
            'Manual meeting link is required when Teams integration is disabled',
            400,
            ErrorCode.VALIDATION_ERROR
          );
        }

        return await this.panelAssessmentService.generateAndSendInterviewLink(
          clientId,
          invitationId,
          organizerEmail,
          organizerName,
          useTeams,
          manualMeetingLink,
          manualEventId
        );
      }
    );
  };

  /**
   * Update meeting for panel assessment invitation
   */
  updateMeeting = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IUpdateMeetingApiResponse>(req, res, next, async () => {
      const { invitationId } = req.params;
      const { organizerEmail }: IUpdateMeetingRequest = req.body;
      const clientId = req.user?.clientId;

      if (!clientId) {
        throw new AppError(
          'Client ID not found in request',
          401,
          ErrorCode.UNAUTHORIZED
        );
      }

      if (!organizerEmail) {
        throw new AppError(
          'Organizer email is required',
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      if (!invitationId) {
        throw new AppError(
          'Invitation ID is required',
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      return await this.panelAssessmentService.updateInterviewMeeting(
        clientId,
        invitationId,
        organizerEmail
      );
    });
  };

  /**
   * Cancel meeting for panel assessment invitation
   */
  cancelMeeting = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICancelMeetingApiResponse>(req, res, next, async () => {
      const { invitationId } = req.params;
      const { organizerEmail }: ICancelMeetingRequest = req.body;
      const clientId = req.user?.clientId;

      if (!clientId) {
        throw new AppError(
          'Client ID not found in request',
          401,
          ErrorCode.UNAUTHORIZED
        );
      }

      if (!organizerEmail) {
        throw new AppError(
          'Organizer email is required',
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      if (!invitationId) {
        throw new AppError(
          'Invitation ID is required',
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      return await this.panelAssessmentService.cancelInterviewMeeting(
        clientId,
        invitationId,
        organizerEmail
      );
    });
  };
}
