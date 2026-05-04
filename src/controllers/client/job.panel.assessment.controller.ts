import { NextFunction, Request, Response } from 'express';
import { ClientJobPanelAssessmentService } from '@/services/client/job.panel.assessment.service';
import { BaseController } from '@/controllers/common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import { FeedbackFormUtils } from '@/utils/feedback.form.utils';
import { logger } from '@/shared/utils/logger';
import {
  IClientJobPanelAssessmentSlotCreateApiRequest,
  IClientJobPanelAssessmentSlotCreateApiResponse,
  IClientJobPanelAssessmentSlotUpdateApiRequest,
  IClientJobPanelAssessmentSlotUpdateApiResponse,
  IClientJobPanelAssessmentSlotGetApiRequest,
  IClientJobPanelAssessmentSlotGetApiResponse,
  IClientJobPanelAssessmentSlotDeleteApiRequest,
  IClientJobPanelAssessmentSlotDeleteApiResponse,
  IClientJobPanelAssessmentSlotListApiRequest,
  IClientJobPanelAssessmentSlotListApiResponse,
  IClientJobPanelAssessmentInvitationCreateApiRequest,
  IClientJobPanelAssessmentInvitationCreateApiResponse,
  IClientJobPanelAssessmentInvitationGetApiRequest,
  IClientJobPanelAssessmentInvitationGetApiResponse,
  IClientJobPanelAssessmentInvitationCancelApiRequest,
  IClientJobPanelAssessmentInvitationCancelApiResponse,
  IClientJobPanelAssessmentInvitationListApiRequest,
  IClientJobPanelAssessmentInvitationListApiResponse,
  IPublicJobPanelAssessmentFeedbackSubmitApiRequest,
  IPublicJobPanelAssessmentFeedbackSubmitApiResponse,
  IClientJobPanelAssessmentFeedbackSubmitInternalApiRequest,
  IClientJobPanelAssessmentFeedbackSubmitInternalApiResponse,
  IClientJobPanelAssessmentFeedbackListApiRequest,
  IClientJobPanelAssessmentFeedbackListApiResponse,
  IClientListSceduledInterviewsApiResponse,
  IClientListScheduledInterviewsApiRequest,
  IScheduledPanelAssessmentMeetingDetailsApiResponse,
  IPublicJobPanelAssessmentFeedbackGetApiResponse,
} from '@/shared/models/api/client/job.panel.assessment.api';
import { singleton } from '@/shared/decorators/singleton';

@singleton
export class ClientJobPanelAssessmentController extends BaseController {
  constructor(
    private readonly panelAssessmentService: ClientJobPanelAssessmentService
  ) {
    super();
  }

  /**
   * Create one or more panel assessment slots
   */
  createPanelAssessmentSlot = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientJobPanelAssessmentSlotCreateApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const createdById = req.user.clientUserId as string;

        const createRequest =
          createIApiRequest<IClientJobPanelAssessmentSlotCreateApiRequest>(req);

        const result =
          await this.panelAssessmentService.createPanelAssessmentSlot(
            clientId,
            createdById,
            createRequest.data
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
   * Update an existing panel assessment slot
   */
  updatePanelAssessmentSlot = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientJobPanelAssessmentSlotUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;

        const updateRequest =
          createIApiRequest<IClientJobPanelAssessmentSlotUpdateApiRequest>(req);
        const slotId = updateRequest.params.slotId;

        const result =
          await this.panelAssessmentService.updatePanelAssessmentSlot(
            clientId,
            slotId,
            updateRequest.data
          );

        return {
          success: true,
          message: 'Panel assessment slot updated successfully',
          data: result,
        };
      }
    );
  };

  /**
   * Get a panel assessment slot by ID
   */
  getPanelAssessmentSlot = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientJobPanelAssessmentSlotGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;

        const getRequest =
          createIApiRequest<IClientJobPanelAssessmentSlotGetApiRequest>(req);
        const slotId = getRequest.params.slotId;

        const result = await this.panelAssessmentService.getPanelAssessmentSlot(
          clientId,
          slotId
        );

        return result;
      }
    );
  };

  /**
   * Delete a panel assessment slot
   */
  deletePanelAssessmentSlot = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientJobPanelAssessmentSlotDeleteApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;

        const deleteRequest =
          createIApiRequest<IClientJobPanelAssessmentSlotDeleteApiRequest>(req);
        const slotId = deleteRequest.params.slotId;

        await this.panelAssessmentService.deletePanelAssessmentSlot(
          clientId,
          slotId
        );

        return null;
      }
    );
  };

  /**
   * List panel assessment slots with filtering
   */
  listPanelAssessmentSlots = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientJobPanelAssessmentSlotListApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;

        const listRequest =
          createIApiRequest<IClientJobPanelAssessmentSlotListApiRequest>(req);

        // Convert string dates to Date objects if present
        const filters = {
          ...listRequest.filters,
          startDate: listRequest.filters.startDate
            ? new Date(listRequest.filters.startDate)
            : undefined,
          endDate: listRequest.filters.endDate
            ? new Date(listRequest.filters.endDate)
            : undefined,
        };

        const result =
          await this.panelAssessmentService.listPanelAssessmentSlots(
            clientId,
            filters,
            listRequest.pagination
          );

        return {
          success: true,
          message: 'Panel assessment slots retrieved successfully',
          items: result.items,
          pagination: result.pagination,
        };
      }
    );
  };

  /**
   * Create a new panel assessment invitation
   */
  createPanelAssessmentInvitation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientJobPanelAssessmentInvitationCreateApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const invitedById = req.user.clientUserId as string;

        const createRequest =
          createIApiRequest<IClientJobPanelAssessmentInvitationCreateApiRequest>(
            req
          );

        const result =
          await this.panelAssessmentService.createPanelAssessmentInvitation(
            clientId,
            invitedById,
            createRequest.data
          );

        return {
          success: true,
          message: 'Panel assessment invitation created successfully',
          data: result,
        };
      }
    );
  };

  /**
   * Get a panel assessment invitation by ID
   */
  getPanelAssessmentInvitation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientJobPanelAssessmentInvitationGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;

        const getRequest =
          createIApiRequest<IClientJobPanelAssessmentInvitationGetApiRequest>(
            req
          );
        const invitationId = getRequest.params.invitationId;

        const result =
          await this.panelAssessmentService.getPanelAssessmentInvitation(
            clientId,
            invitationId
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
   * Cancel a panel assessment invitation
   */
  cancelPanelAssessmentInvitation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientJobPanelAssessmentInvitationCancelApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;

        const cancelRequest =
          createIApiRequest<IClientJobPanelAssessmentInvitationCancelApiRequest>(
            req
          );
        const invitationId = cancelRequest.params.invitationId;

        const result =
          await this.panelAssessmentService.cancelPanelAssessmentInvitation(
            clientId,
            invitationId
          );

        return {
          success: true,
          message: 'Panel assessment invitation cancelled successfully',
          data: result,
        };
      }
    );
  };

  /**
   * List panel assessment invitations with filtering
   */
  listPanelAssessmentInvitations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientJobPanelAssessmentInvitationListApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;

        const listRequest =
          createIApiRequest<IClientJobPanelAssessmentInvitationListApiRequest>(
            req
          );

        const result =
          await this.panelAssessmentService.listPanelAssessmentInvitations(
            clientId,
            listRequest.filters,
            listRequest.pagination
          );

        return {
          success: true,
          message: 'Panel assessment invitations retrieved successfully',
          items: result.items,
          pagination: result.pagination,
        };
      }
    );
  };

  /**
   * Submit public job panel assessment feedback
   */
  submitPublicJobPanelAssessmentFeedback = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPublicJobPanelAssessmentFeedbackSubmitApiResponse>(
      req,
      res,
      next,
      async () => {
        const submitRequest =
          createIApiRequest<IPublicJobPanelAssessmentFeedbackSubmitApiRequest>(
            req
          );

        const result = await this.panelAssessmentService.submitPanelFeedback(
          submitRequest.params.feedbackToken,
          submitRequest.data
        );

        return {
          success: true,
          message:
            'Public job panel assessment feedback submitted successfully',
          data: result,
        };
      }
    );
  };

  /**
   * Get feedback details by token for external feedback form
   */
  getFeedbackByToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPublicJobPanelAssessmentFeedbackGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const feedbackToken = req.params.feedbackToken;

        const result =
          await this.panelAssessmentService.getFeedbackByToken(feedbackToken);

        return {
          success: true,
          message: 'Feedback details retrieved successfully',
          data: result,
        };
      }
    );
  };

  /**
   * Get HTML feedback form for external panel members
   */
  getFeedbackForm = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const feedbackToken = req.params.feedbackToken;

      // Get feedback details
      const feedbackDetails =
        await this.panelAssessmentService.getFeedbackByToken(feedbackToken);

      if (feedbackDetails.isSubmitted) {
        res.status(400);
        res.setHeader(
          'Content-Security-Policy',
          "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "connect-src 'self' https: http: ws: wss:; " +
            "img-src 'self' data: https:; " +
            "font-src 'self' https: data:;"
        );
        res.send(FeedbackFormUtils.generateAlreadySubmittedHtml());
        return;
      }

      // Generate HTML form
      const formData = {
        ...feedbackDetails,
        assessment: {
          ...feedbackDetails.assessment,
          scheduledDate:
            feedbackDetails.assessment.scheduledDate?.toISOString(),
        },
      };
      const html = FeedbackFormUtils.generateFeedbackFormHtml(
        feedbackToken,
        formData
      );

      res.setHeader('Content-Type', 'text/html');
      // Allow inline styles and scripts for feedback form
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "connect-src 'self'; " +
          "img-src 'self' data: https:; " +
          "font-src 'self' https: data:;"
      );
      res.send(html);
    } catch (error) {
      logger.error('Debug: Error in getFeedbackForm:', error);
      res.status(404);
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "connect-src 'self'; " +
          "img-src 'self' data: https:; " +
          "font-src 'self' https: data:;"
      );
      res.send(FeedbackFormUtils.generateInvalidTokenHtml());
    }
  };

  /**
   * Submit internal job panel assessment feedback
   */
  submitInternalJobPanelAssessmentFeedback = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientJobPanelAssessmentFeedbackSubmitInternalApiResponse>(
      req,
      res,
      next,
      async () => {
        const submitRequest =
          createIApiRequest<IClientJobPanelAssessmentFeedbackSubmitInternalApiRequest>(
            req
          );

        const result = await this.panelAssessmentService.submitPanelFeedback(
          submitRequest.data.panelMemberEmail,
          {
            detailedFeedback: submitRequest.data.detailedFeedback,
            decision: submitRequest.data.decision,
            recommendation: submitRequest.data.recommendation,
          },
          submitRequest.params.panelAssessmentId
        );

        return {
          success: true,
          message:
            'Internal job panel assessment feedback submitted successfully',
          data: result,
        };
      }
    );
  };

  /**
   * List job panel assessment feedback with filtering
   */
  listJobPanelAssessmentFeedback = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientJobPanelAssessmentFeedbackListApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;

        const listRequest =
          createIApiRequest<IClientJobPanelAssessmentFeedbackListApiRequest>(
            req
          );

        const result =
          await this.panelAssessmentService.listPanelAssessmentFeedback(
            clientId,
            listRequest.filters,
            listRequest.pagination
          );

        return {
          success: true,
          message: 'Job panel assessment feedback retrieved successfully',
          items: result.items,
          pagination: result.pagination,
        };
      }
    );
  };

  listScheduledInterviews = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientListSceduledInterviewsApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const request =
          createIApiRequest<IClientListScheduledInterviewsApiRequest>(req);
        return await this.panelAssessmentService.listScheduledInterviews(
          clientId,
          request.pagination
        );
      }
    );
  };

  getPanelAssessmentMeetingDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IScheduledPanelAssessmentMeetingDetailsApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const invitationId = req.params.invitationId;

        return await this.panelAssessmentService.getPanelAssessmentMeetingDetails(
          clientId,
          invitationId
        );
      }
    );
  };

  /**
   * Mark panel assessment as completed
   */
  markPanelAssessmentAsCompleted = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<{
      success: boolean;
      message: string;
      data: any;
    }>(req, res, next, async () => {
      const clientId = req.user.clientId as string;
      const panelAssessmentId = req.params.panelAssessmentId;

      const result =
        await this.panelAssessmentService.markPanelAssessmentAsCompleted(
          clientId,
          panelAssessmentId
        );

      return {
        success: true,
        message: 'Panel assessment marked as completed successfully',
        data: result,
      };
    });
  };
}
