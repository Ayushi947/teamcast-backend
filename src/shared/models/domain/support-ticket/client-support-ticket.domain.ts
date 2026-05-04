import {
  SupportClientTicketSubcategoryEnum,
  SupportTicketEntityTypeEnum,
  SupportTicketTypeEnum,
  SupportTicketCategoryEnum,
  SupportTicketPriorityEnum,
  SupportClientTicketCategoryEnum,
} from '../../common/enums';

/**
 * Client Support Ticket Create Interface
 */
export interface IClientSupportTicketCreate {
  title: string;
  description: string;
  category: SupportTicketCategoryEnum;
  subcategory?: SupportClientTicketSubcategoryEnum;
  priority?: SupportTicketPriorityEnum;
  entityType?: SupportTicketEntityTypeEnum;
  attachments?: (IClientSupportTicketAttachment | File)[];
  targetId?: string;
  targetType?: string;
  metadata?: any;
}

/**
 * Client Support Ticket Update Interface
 */
export interface IClientSupportTicketUpdate {
  title?: string;
  description?: string;
  category?: SupportTicketCategoryEnum;
  subcategory?: SupportClientTicketSubcategoryEnum;
  priority?: SupportTicketPriorityEnum;
  type?: SupportTicketTypeEnum;
  entityType?: SupportTicketEntityTypeEnum;
  metadata?: any;
}

/**
 * Client Support Ticket Filter Interface
 */
export interface IClientSupportTicketFilter {
  status?: string[];
  priority?: string[];
  category?: string[];
  type?: string[];
  assignedTo?: string[];
  createdFrom?: Date;
  createdTo?: Date;
  search?: string;
}

/**
 * Client Support Ticket Comment Create Interface
 */
export interface IClientSupportTicketCommentCreate {
  ticketId: string;
  content: string;
  isInternal?: boolean;
  attachments?: IClientSupportTicketAttachment[];
  metadata?: any;
}

/**
 * Client Support Ticket Attachment Interface
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientSupportTicketAttachment:
 *       type: object
 *       properties:
 *         fileName:
 *           type: string
 *           description: Name of the uploaded file
 *         presignedUrl:
 *           type: string
 *           description: URL to the uploaded file
 */
export interface IClientSupportTicketAttachment {
  fileName: string;
  presignedUrl: string;
}

/**
 * Client Support Ticket Comment Update Interface
 */
export interface IClientSupportTicketCommentUpdate {
  content?: string;
  metadata?: any;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientSupportTicketCreateRequest:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - category
 *       properties:
 *         title:
 *           type: string
 *           description: Title of the support ticket
 *           example: "Unable to access job posting dashboard"
 *         description:
 *           type: string
 *           description: Detailed description of the issue
 *           example: "I'm getting a 403 error when trying to access the job posting dashboard. This started happening yesterday."
 *         ticketType:
 *           $ref: '#/components/schemas/SupportTicketTypeEnum'
 *         category:
 *           $ref: '#/components/schemas/SupportTicketCategoryEnum'
 *         subcategory:
 *           $ref: '#/components/schemas/SupportClientTicketSubcategoryEnum'
 *           description: Specific subcategory for more precise ticket classification
 *           example: "JOB_POSTING_AI_REVIEW_FAILED"
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Tags to categorize the ticket
 *           example: ["dashboard", "access", "urgent"]
 *         attachments:
 *           type: array
 *           items:
 *             type: object
 *             format: binary
 *           description: Files to attach to the ticket
 *         targetId:
 *           type: string
 *           description: ID of the target entity
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         targetType:
 *           type: string
 *           description: Type of the target entity
 *           example: "JOB_POSTING"
 */
export interface IClientSupportTicketCreateRequest {
  title: string;
  description: string;
  ticketType: SupportTicketTypeEnum;
  category: SupportTicketCategoryEnum | SupportClientTicketCategoryEnum;
  subcategory?: SupportClientTicketSubcategoryEnum;
  tags?: string[];
  attachments?: IClientSupportTicketAttachment[];
  targetId?: string;
  targetType?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientSupportTicketListRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiPaginatedRequest'
 *         - type: object
 *       type: object
 *       properties:
 *         status:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SupportTicketStatusEnum'
 *           description: Filter by ticket status
 *         priority:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SupportTicketPriorityEnum'
 *           description: Filter by ticket priority
 *         category:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SupportTicketCategoryEnum'
 *           description: Filter by ticket category
 *         subcategory:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SupportClientTicketSubcategoryEnum'
 *           description: Filter by ticket subcategory
 *         ticketType:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SupportTicketTypeEnum'
 *           description: Filter by ticket type
 *         createdFrom:
 *           type: string
 *           format: date-time
 *           description: Filter tickets created from this date
 *         createdTo:
 *           type: string
 *           format: date-time
 *           description: Filter tickets created until this date
 */
export interface IClientSupportTicketListRequest {
  status?: string[];
  priority?: string[];
  category?: string[];
  subcategory?: string[];
  ticketType?: string[];
  createdFrom?: Date;
  createdTo?: Date;
}
