import {
  SupportTicketEntityTypeEnum,
  SupportTicketTypeEnum,
  SupportTicketCategoryEnum,
  SupportTicketPriorityEnum,
} from '../../common/enums';

/**
 * Candidate Support Ticket Create Interface
 */
export interface ICandidateSupportTicketCreate {
  title: string;
  description: string;
  category: SupportTicketCategoryEnum;
  subcategory?: string;
  priority?: SupportTicketPriorityEnum;
  entityType?: SupportTicketEntityTypeEnum;
  attachments?: (ICandidateSupportTicketAttachment | File)[];
  targetId?: string;
  targetType?: string;
  metadata?: any;
}

/**
 * Candidate Support Ticket Update Interface
 */
export interface ICandidateSupportTicketUpdate {
  title?: string;
  description?: string;
  category?: SupportTicketCategoryEnum;
  subcategory?: string;
  priority?: SupportTicketPriorityEnum;
  type?: SupportTicketTypeEnum;
  entityType?: SupportTicketEntityTypeEnum;
  metadata?: any;
}

/**
 * Candidate Support Ticket Filter Interface
 */
export interface ICandidateSupportTicketFilter {
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
 * Candidate Support Ticket Comment Create Interface
 */
export interface ICandidateSupportTicketCommentCreate {
  ticketId: string;
  content: string;
  isInternal?: boolean;
  attachments?: ICandidateSupportTicketAttachment[];
  metadata?: any;
}

/**
 * Candidate Support Ticket Attachment Interface
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateSupportTicketAttachment:
 *       type: object
 *       properties:
 *         fileName:
 *           type: string
 *           description: Name of the uploaded file
 *         presignedUrl:
 *           type: string
 *           description: URL to the uploaded file
 */
export interface ICandidateSupportTicketAttachment {
  fileName: string;
  presignedUrl: string;
}

/**
 * Candidate Support Ticket Comment Update Interface
 */
export interface ICandidateSupportTicketCommentUpdate {
  content?: string;
  metadata?: any;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateSupportTicketCreateRequest:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - category
 *       properties:
 *         title:
 *           type: string
 *           description: Title of the support ticket
 *           example: "Unable to access assessment dashboard"
 *         description:
 *           type: string
 *           description: Detailed description of the issue
 *           example: "I'm getting a 403 error when trying to access the assessment dashboard. This started happening yesterday."
 *         ticketType:
 *           $ref: '#/components/schemas/SupportTicketTypeEnum'
 *         category:
 *           $ref: '#/components/schemas/SupportTicketCategoryEnum'
 *         subcategory:
 *           type: string
 *           description: Specific subcategory for more precise ticket classification
 *           example: "ASSESSMENT_TECHNICAL_ISSUE"
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Tags to categorize the ticket
 *           example: ["assessment", "access", "urgent"]
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
 *           example: "ASSESSMENT"
 */
export interface ICandidateSupportTicketCreateRequest {
  title: string;
  description: string;
  ticketType: SupportTicketTypeEnum;
  category: SupportTicketCategoryEnum;
  subcategory?: string;
  tags?: string[];
  attachments?: ICandidateSupportTicketAttachment[];
  targetId?: string;
  targetType?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateSupportTicketListRequest:
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
 *             type: string
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
export interface ICandidateSupportTicketListRequest {
  status?: string[];
  priority?: string[];
  category?: string[];
  subcategory?: string[];
  ticketType?: string[];
  createdFrom?: Date;
  createdTo?: Date;
}
