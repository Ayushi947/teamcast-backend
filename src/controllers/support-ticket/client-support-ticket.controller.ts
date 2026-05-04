import { Request, Response, NextFunction } from 'express';
import { ClientSupportTicketService } from '../../services/support-ticket/client-support-ticket.service';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import {
  IClientSupportTicketCreateApiRequest,
  IClientSupportTicketCreateApiResponse,
  IClientSupportTicketListApiRequest,
  IClientSupportTicketListApiResponse,
} from '../../shared/models/api/support-ticket/client-support-ticket.api';
import {} from '../../shared/models/common/enums';
import { singleton } from '@/shared/decorators/singleton';

/**
 * Client Support Ticket Controller
 * Handles HTTP requests for client support ticket operations
 */
@singleton
export class ClientSupportTicketController extends BaseController {
  private readonly clientSupportTicketService: ClientSupportTicketService;

  constructor() {
    super();
    this.clientSupportTicketService = new ClientSupportTicketService();
  }

  createSupportTicket = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientSupportTicketCreateApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user?.clientId;
        const userId = req.user?.id;
        const attachments = req.files;

        if (!userId) {
          throw new Error('User authentication required');
        }

        if (!clientId) {
          throw new Error('Client ID is required');
        }

        // Create the support ticket request data
        const ticketData =
          createIApiRequest<IClientSupportTicketCreateApiRequest>(req);

        // Create the support ticket with attachments
        const ticket =
          await this.clientSupportTicketService.createClientSupportTicket(
            ticketData,
            clientId,
            userId,
            req.get('User-Agent'),
            attachments as Express.Multer.File[]
          );

        return {
          data: ticket,
          message: 'Support ticket created successfully',
        };
      }
    );
  };

  getSupportTickets = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientSupportTicketListApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user?.clientId;

        if (!clientId) {
          throw new Error('Client ID is required');
        }

        // Use the createIApiRequest utility to properly structure the request
        const listRequest =
          createIApiRequest<IClientSupportTicketListApiRequest>(req);

        // Get support tickets
        const result =
          await this.clientSupportTicketService.getClientSupportTickets(
            clientId,
            listRequest
          );

        return {
          data: {
            tickets: result.tickets,
            pagination: result.pagination,
          },
          message: 'Support tickets retrieved successfully',
        };
      }
    );
  };
}
