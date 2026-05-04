import { Request, Response, NextFunction } from 'express';
import { singleton } from '@/shared/decorators/singleton';
import { logger } from '@/shared/utils/logger';
import { CandidateSupportTicketService } from '@/services/support-ticket/candidate-support-ticket.service';
import {
  ICandidateSupportTicketCreateApiRequest,
  ICandidateSupportTicketListApiRequest,
} from '@/shared/models/api/support-ticket/candidate-support-ticket.api';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';

/**
 * Candidate Support Ticket Controller
 * Handles HTTP requests for candidate support tickets
 */
@singleton
export class CandidateSupportTicketController extends BaseController {
  private readonly candidateSupportTicketService: CandidateSupportTicketService;

  constructor() {
    super();
    this.candidateSupportTicketService = new CandidateSupportTicketService();
  }

  createCandidateSupportTicket = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const userId = req.user?.id;
      const userAgent = req.get('User-Agent');
      const attachments = req.files;

      const ticketData =
        createIApiRequest<ICandidateSupportTicketCreateApiRequest>(req);

      // Create the support ticket
      const ticket =
        await this.candidateSupportTicketService.createCandidateSupportTicket(
          ticketData,
          userId,
          userAgent,
          attachments as Express.Multer.File[]
        );

      return {
        data: ticket,
        message: 'Support ticket created successfully',
      };
    });
  };

  getCandidateSupportTickets = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const candidateId = req.params.candidateId;
      const userId = req.user?.id;

      if (!candidateId) {
        throw new Error('Candidate ID is required');
      }

      if (!userId) {
        throw new Error('User authentication required');
      }

      // Use the createIApiRequest utility to properly structure the request
      const listRequest =
        createIApiRequest<ICandidateSupportTicketListApiRequest>(req);

      logger.info('Getting candidate support tickets', {
        candidateId,
        userId,
        pagination: listRequest.pagination,
        filters: listRequest.data,
      });

      // Get the support tickets
      const result =
        await this.candidateSupportTicketService.getCandidateSupportTickets(
          candidateId,
          listRequest
        );

      return {
        data: {
          items: result.tickets,
          pagination: result.pagination,
        },
        message: 'Support tickets retrieved successfully',
      };
    });
  };
}
