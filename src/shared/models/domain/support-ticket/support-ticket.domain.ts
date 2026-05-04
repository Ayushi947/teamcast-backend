import {
  SupportTicketTypeEnum,
  SupportTicketStatusEnum,
  SupportTicketPriorityEnum,
  SupportTicketEntityTypeEnum,
  SupportTicketCategoryEnum,
  SupportClientTicketCategoryEnum,
  SupportTicketEscalationReasonEnum,
  SupportClientTicketSubcategoryEnum,
  SupportTicketAssignmentStatusEnum,
  UserTypeEnum,
  UserRoleEnum,
} from '../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketCreateData:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - ticketType
 *         - category
 *         - entityType
 *         - targetId
 *       properties:
 *         title:
 *           type: string
 *           description: Title of the support ticket
 *           example: "Login issue with mobile app"
 *         description:
 *           type: string
 *           description: Detailed description of the issue
 *           example: "Users are unable to login using their credentials on the mobile app"
 *         ticketType:
 *           $ref: '#/components/schemas/SupportTicketTypeEnum'
 *         category:
 *           $ref: '#/components/schemas/SupportTicketCategoryEnum'
 *         priority:
 *           $ref: '#/components/schemas/SupportTicketPriorityEnum'
 *         entityType:
 *           $ref: '#/components/schemas/SupportTicketEntityTypeEnum'
 *         targetId:
 *           type: string
 *           description: ID of the target entity
 *           example: "user-123"
 *         targetType:
 *           type: string
 *           description: Subcategory for better organization
 *           example: "mobile_app"
 *         assignedUserId:
 *           type: string
 *           format: uuid
 *           description: ID of the assigned support user
 *         slaPolicyId:
 *           type: string
 *           format: uuid
 *           description: ID of the SLA policy
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Tags for categorization
 *           example: ["urgent", "mobile", "login"]
 *         dueDate:
 *           type: string
 *           format: date-time
 *           description: Due date for the ticket
 *         isBacklog:
 *           type: boolean
 *           description: Whether ticket is in backlog
 *         inlineAttachments:
 *           type: object
 *           description: Inline attachments metadata
 */
export interface ISupportTicketCreateData {
  title: string;
  description: string;
  ticketType: SupportTicketTypeEnum;
  category: SupportTicketCategoryEnum;
  subcategory?: SupportClientTicketSubcategoryEnum;
  priority?: SupportTicketPriorityEnum;
  assignmentStatus?: SupportTicketAssignmentStatusEnum;
  entityType: SupportTicketEntityTypeEnum;
  targetId: string;
  targetType?: string;
  assignedUserId?: string;
  assignmentNote?: string; // Note explaining why ticket was assigned/reassigned
  slaPolicyId?: string;
  tags?: string[];
  dueDate?: Date;
  isBacklog?: boolean;
  inlineAttachments?: any;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketUpdateData:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: Title of the support ticket
 *         description:
 *           type: string
 *           description: Detailed description of the issue
 *         ticketType:
 *           $ref: '#/components/schemas/SupportTicketTypeEnum'
 *         category:
 *           $ref: '#/components/schemas/SupportTicketCategoryEnum'
 *         status:
 *           $ref: '#/components/schemas/SupportTicketStatusEnum'
 *         priority:
 *           $ref: '#/components/schemas/SupportTicketPriorityEnum'
 *         assignedUserId:
 *           type: string
 *           format: uuid
 *           description: ID of the assigned support user
 *         slaPolicyId:
 *           type: string
 *           format: uuid
 *           description: ID of the SLA policy
 *         escalatedToUserId:
 *           type: string
 *           format: uuid
 *           description: ID of user escalated to
 *         escalatedByUserId:
 *           type: string
 *           format: uuid
 *           description: ID of user who escalated
 *         escalationReason:
 *           $ref: '#/components/schemas/SupportTicketEscalationReasonEnum'
 *         customerRating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Customer satisfaction rating
 *         customerFeedback:
 *           type: string
 *           description: Customer feedback
 *         resolutionNotes:
 *           type: string
 *           description: Notes about the resolution
 *         resolvedAt:
 *           type: string
 *           format: date-time
 *           description: When ticket was resolved
 *         closedAt:
 *           type: string
 *           format: date-time
 *           description: When ticket was closed
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Tags for categorization
 *         dueDate:
 *           type: string
 *           format: date-time
 *           description: Due date for the ticket
 *         isBacklog:
 *           type: boolean
 *           description: Whether ticket is in backlog
 *         inlineAttachments:
 *           type: object
 *           description: Inline attachments metadata
 */
export interface ISupportTicketUpdateData {
  title?: string;
  description?: string;
  ticketType?: SupportTicketTypeEnum;
  category?: SupportTicketCategoryEnum;
  subcategory?: SupportClientTicketSubcategoryEnum;
  status?: SupportTicketStatusEnum;
  assignmentStatus?: SupportTicketAssignmentStatusEnum;
  priority?: SupportTicketPriorityEnum;
  assignedUserId?: string;
  assignmentNote?: string; // Note explaining why ticket was assigned/reassigned
  slaPolicyId?: string;
  escalatedToUserId?: string;
  escalatedByUserId?: string;
  escalationReason?: SupportTicketEscalationReasonEnum;
  customerRating?: number;
  customerFeedback?: string;
  resolutionNotes?: string;
  resolvedAt?: Date;
  closedAt?: Date;
  rootCauseAnalysis?: string;
  rcaCategory?: string;
  rcaContributingFactors?: string[];
  rcaPreventiveMeasures?: string[];
  rcaCompletedAt?: Date;
  rcaCompletedBy?: string;
  tags?: string[];
  dueDate?: Date;
  isBacklog?: boolean;
  inlineAttachments?: any;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketFilterApiRequest:
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
 *         ticketType:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SupportTicketTypeEnum'
 *           description: Filter by ticket type
 *         entityType:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SupportTicketEntityTypeEnum'
 *           description: Filter by entity type
 *         createdById:
 *           type: string
 *           format: uuid
 *           description: Filter by creator ID
 *         assignedUserId:
 *           type: string
 *           format: uuid
 *           description: Filter by assigned user ID
 *         targetId:
 *           type: string
 *           description: Filter by target ID
 *         targetType:
 *           type: string
 *           description: Filter by target type
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Filter by tags
 *         isSlaBreach:
 *           type: boolean
 *           description: Filter by SLA breach status
 *         isBacklog:
 *           type: boolean
 *           description: Filter by backlog status
 *         isDeleted:
 *           type: boolean
 *           description: Filter by deletion status
 *         createdFrom:
 *           type: string
 *           format: date-time
 *           description: Filter tickets created from this date
 *         createdTo:
 *           type: string
 *           format: date-time
 *           description: Filter tickets created until this date
 *         dueFrom:
 *           type: string
 *           format: date-time
 *           description: Filter tickets due from this date
 *         dueTo:
 *           type: string
 *           format: date-time
 *           description: Filter tickets due until this date
 *         search:
 *           type: string
 *           description: Search in title and description
 */
export interface ISupportTicketFilterApiRequest {
  status?: SupportTicketStatusEnum[];
  priority?: SupportTicketPriorityEnum[];
  category?: SupportTicketCategoryEnum[];
  subcategory?: SupportClientTicketSubcategoryEnum[];
  ticketType?: SupportTicketTypeEnum[];
  entityType?: SupportTicketEntityTypeEnum[];
  createdById?: string;
  assignedUserId?: string;
  targetId?: string;
  targetType?: string;
  tags?: string[];
  isSlaBreach?: boolean;
  isBacklog?: boolean;
  isDeleted?: boolean;
  createdFrom?: Date;
  createdTo?: Date;
  dueFrom?: Date;
  dueTo?: Date;
  search?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketApiResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the support ticket
 *         title:
 *           type: string
 *           description: Title of the support ticket
 *         description:
 *           type: string
 *           description: Detailed description of the issue
 *         ticketType:
 *           $ref: '#/components/schemas/SupportTicketTypeEnum'
 *         category:
 *           $ref: '#/components/schemas/SupportTicketCategoryEnum'
 *         status:
 *           $ref: '#/components/schemas/SupportTicketStatusEnum'
 *         priority:
 *           $ref: '#/components/schemas/SupportTicketPriorityEnum'
 *         ticketNumber:
 *           type: string
 *           description: Human-readable ticket number
 *         sequenceNumber:
 *           type: integer
 *           description: Sequential auto-incrementing number
 *         entityType:
 *           $ref: '#/components/schemas/SupportTicketEntityTypeEnum'
 *         targetId:
 *           type: string
 *           description: ID of the target entity
 *         targetType:
 *           type: string
 *           description: Subcategory for better organization
 *         createdById:
 *           type: string
 *           format: uuid
 *           description: ID of the user who created the ticket
 *         assignedUserId:
 *           type: string
 *           format: uuid
 *           description: ID of the assigned support user
 *         slaBreachAt:
 *           type: string
 *           format: date-time
 *           description: When SLA will be breached
 *         slaDuration:
 *           type: integer
 *           description: SLA duration in minutes
 *         slaStartedAt:
 *           type: string
 *           format: date-time
 *           description: When SLA counting started
 *         slaPolicyId:
 *           type: string
 *           format: uuid
 *           description: ID of the SLA policy
 *         isSlaBreach:
 *           type: boolean
 *           description: Whether SLA has been breached
 *         escalatedAt:
 *           type: string
 *           format: date-time
 *           description: When ticket was escalated
 *         escalatedToUserId:
 *           type: string
 *           format: uuid
 *           description: ID of user escalated to
 *         escalatedByUserId:
 *           type: string
 *           format: uuid
 *           description: ID of user who escalated
 *         escalationReason:
 *           $ref: '#/components/schemas/SupportTicketEscalationReasonEnum'
 *         customerRating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Customer satisfaction rating
 *         customerFeedback:
 *           type: string
 *           description: Customer feedback
 *         customerRatedAt:
 *           type: string
 *           format: date-time
 *           description: When customer rated the ticket
 *         resolutionNotes:
 *           type: string
 *           description: Notes about the resolution
 *         resolvedAt:
 *           type: string
 *           format: date-time
 *           description: When ticket was resolved
 *         closedAt:
 *           type: string
 *           format: date-time
 *           description: When ticket was closed
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Tags for categorization
 *         dueDate:
 *           type: string
 *           format: date-time
 *           description: Due date for the ticket
 *         isBacklog:
 *           type: boolean
 *           description: Whether ticket is in backlog
 *         inlineAttachments:
 *           type: object
 *           description: Inline attachments metadata
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the ticket was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the ticket was last updated

 */
export interface ISupportTicketApiResponse {
  id: string;
  title: string;
  description: string;
  ticketType: SupportTicketTypeEnum;
  category: SupportTicketCategoryEnum;
  subcategory?: SupportClientTicketSubcategoryEnum;
  status: SupportTicketStatusEnum;
  priority: SupportTicketPriorityEnum;
  ticketNumber: string;
  sequenceNumber: number;
  entityType: SupportTicketEntityTypeEnum;
  targetId: string;
  targetType?: string;
  createdById: string;
  assignedUserId?: string;
  slaDuration?: number;
  slaStartedAt?: Date;
  isSlaBreach: boolean;
  slaPolicyId?: string;
  slaBreachAt?: Date;
  escalatedAt?: Date;
  escalatedToUserId?: string;
  escalatedByUserId?: string;
  escalationReason?: SupportTicketEscalationReasonEnum;
  customerRating?: number;
  customerFeedback?: string;
  customerRatedAt?: Date;
  resolutionNotes?: string;
  resolvedAt?: Date;
  closedAt?: Date;
  tags: string[];
  dueDate?: Date;
  isBacklog: boolean;
  inlineAttachments?: any;
  createdAt: Date;
  updatedAt: Date;
}
/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportTicket:
 *       type: object
 *       description: Domain model representing a support ticket
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the support ticket
 *         title:
 *           type: string
 *           description: Title of the support ticket
 *         description:
 *           type: string
 *           description: Detailed description of the issue
 *         ticketType:
 *           $ref: '#/components/schemas/SupportTicketTypeEnum'
 *         category:
 *           type: string
 *           description: Category of the support ticket
 *         subcategory:
 *           $ref: '#/components/schemas/SupportClientTicketSubcategoryEnum'
 *         status:
 *           $ref: '#/components/schemas/SupportTicketStatusEnum'
 *         priority:
 *           $ref: '#/components/schemas/SupportTicketPriorityEnum'
 *         ticketNumber:
 *           type: string
 *           description: Unique ticket number
 *         sequenceNumber:
 *           type: number
 *           description: Sequential number for the ticket
 *         displayNumber:
 *           type: string
 *           description: Display-friendly ticket number
 *         publicTicketNumber:
 *           type: string
 *           description: Public-facing ticket number
 *         entityType:
 *           $ref: '#/components/schemas/SupportTicketEntityTypeEnum'
 *         targetId:
 *           type: string
 *           format: uuid
 *           description: ID of the target entity
 *         targetType:
 *           type: string
 *           description: Type of the target entity
 *         createdById:
 *           type: string
 *           format: uuid
 *           description: ID of the user who created the ticket
 *         assignedUserId:
 *           type: string
 *           format: uuid
 *           description: ID of the assigned support user
 *         slaPolicyId:
 *           type: string
 *           format: uuid
 *           description: ID of the SLA policy
 *         slaBreachAt:
 *           type: string
 *           format: date-time
 *           description: When the SLA was breached
 *         slaDuration:
 *           type: number
 *           description: SLA duration in hours
 *         slaStartedAt:
 *           type: string
 *           format: date-time
 *           description: When the SLA timer started
 *         isSlaBreach:
 *           type: boolean
 *           description: Whether the SLA has been breached
 *         escalatedAt:
 *           type: string
 *           format: date-time
 *           description: When the ticket was escalated
 *         escalatedToUserId:
 *           type: string
 *           format: uuid
 *           description: ID of the user the ticket was escalated to
 *         escalatedByUserId:
 *           type: string
 *           format: uuid
 *           description: ID of the user who escalated the ticket
 *         escalationReason:
 *           $ref: '#/components/schemas/SupportTicketEscalationReasonEnum'
 *         customerRating:
 *           type: number
 *           description: Customer satisfaction rating
 *         customerFeedback:
 *           type: string
 *           description: Customer feedback
 *         customerRatedAt:
 *           type: string
 *           format: date-time
 *           description: When the customer provided rating
 *         resolutionNotes:
 *           type: string
 *           description: Notes about the resolution
 *         resolvedAt:
 *           type: string
 *           format: date-time
 *           description: When the ticket was resolved
 *         closedAt:
 *           type: string
 *           format: date-time
 *           description: When the ticket was closed
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Tags associated with the ticket
 *         dueDate:
 *           type: string
 *           format: date-time
 *           description: Due date for the ticket
 *         isBacklog:
 *           type: boolean
 *           description: Whether the ticket is in backlog
 *         inlineAttachments:
 *           type: object
 *           description: Inline attachments data
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the ticket was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the ticket was last updated
 *         deletedAt:
 *           type: string
 *           format: date-time
 *           description: When the ticket was deleted
 *         isDeleted:
 *           type: boolean
 *           description: Whether the ticket is deleted
 *         createdBy:
 *           type: object
 *           description: Information about the user who created the ticket
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 *             email:
 *               type: string
 *         assignedTo:
 *           type: object
 *           description: Information about the assigned support user
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             user:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *         escalatedToUser:
 *           type: object
 *           description: Information about the user the ticket was escalated to
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 *             email:
 *               type: string
 *         escalatedByUser:
 *           type: object
 *           description: Information about the user who escalated the ticket
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 *             email:
 *               type: string
 *         slaPolicy:
 *           $ref: '#/components/schemas/ISupportSlaPolicy'
 *         chatConversation:
 *           $ref: '#/components/schemas/ISupportChatConversation'
 *         attachments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ISupportTicketAttachment'
 *       required:
 *         - id
 *         - title
 *         - description
 *         - ticketType
 *         - category
 *         - status
 *         - priority
 *         - ticketNumber
 *         - sequenceNumber
 *         - entityType
 *         - targetId
 *         - createdById
 *         - isSlaBreach
 *         - tags
 *         - isBacklog
 *         - createdAt
 *         - updatedAt
 *         - isDeleted
 */
export interface ISupportTicket {
  id: string;
  title: string;
  description: string;
  ticketType: SupportTicketTypeEnum;
  category: string;
  subcategory?: SupportClientTicketSubcategoryEnum;
  status: SupportTicketStatusEnum;
  assignmentStatus: SupportTicketAssignmentStatusEnum;
  priority: SupportTicketPriorityEnum;

  // Ticket Number System
  ticketNumber: string;
  sequenceNumber: number;
  displayNumber?: string;
  publicTicketNumber?: string;

  // Entity and Target Information
  entityType: SupportTicketEntityTypeEnum;
  targetId: string;
  targetType?: string;

  // Assignment and Ownership
  createdById: string;
  assignedUserId?: string;
  assignmentNote?: string; // Note explaining why ticket was assigned/reassigned

  // SLA Management
  slaPolicyId?: string;
  slaBreachAt?: Date;
  slaDuration?: number;
  slaStartedAt?: Date;
  isSlaBreach: boolean;

  // Escalation Management
  escalatedAt?: Date;
  escalatedToUserId?: string;
  escalatedByUserId?: string;
  escalationReason?: SupportTicketEscalationReasonEnum;

  // Customer Satisfaction
  customerRating?: number;
  customerFeedback?: string;
  customerRatedAt?: Date;

  // Resolution Information
  resolutionNotes?: string;
  resolvedAt?: Date;
  closedAt?: Date;

  // Root Cause Analysis (RCA)
  rootCauseAnalysis?: string;
  rcaCategory?: string;
  rcaContributingFactors?: string[];
  rcaPreventiveMeasures?: string[];
  rcaCompletedAt?: Date;
  rcaCompletedBy?: string;

  // Additional Metadata
  tags: string[];
  dueDate?: Date;
  isBacklog: boolean;
  inlineAttachments?: any;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  isDeleted?: boolean;

  // Related Data
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  assignedTo?: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  escalatedToUser?: {
    id: string;
    name: string;
    email: string;
  };
  escalatedByUser?: {
    id: string;
    name: string;
    email: string;
  };
  slaPolicy?: ISupportSlaPolicy;
  attachments?: ISupportTicketAttachment[];
  rcaCompletedByUser?: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Support Ticket Status Change Response
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportTicketStatusChangeResponse:
 *       type: object
 *       description: Response payload for status change of a support ticket
 *       properties:
 *         ticketId:
 *           type: string
 *           format: uuid
 *           description: ID of the associated support ticket
 *         title:
 *           type: string
 *           description: Title of the ticket
 *         status:
 *           $ref: '#/components/schemas/SupportTicketStatusEnum'
 *           description: Status of the ticket
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the ticket was last updated
 *         updatedBy:
 *           type: string
 *           format: uuid
 *           description: ID of the user who changed the status
 *         reason:
 *           type: string
 *           description: Reason for the status change
 */
export interface ISupportTicketStatusChangeResponse {
  ticketId: string;
  title: string;
  status: SupportTicketStatusEnum;
  updatedAt: Date;
  updatedBy: string;
  reason?: string;
}

/**
 * Support Ticket Priority Change Response
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportTicketPriorityChange:
 *       type: object
 *       description: Response payload for priority change of a support ticket
 *       properties:
 *         ticketId:
 *           type: string
 *           format: uuid
 *           description: ID of the associated support ticket
 *         title:
 *           type: string
 *           description: Title of the ticket
 *         priority:
 *           $ref: '#/components/schemas/SupportTicketPriorityEnum'
 *           description: Updated priority of the ticket
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the ticket was last updated
 *         updatedBy:
 *           type: string
 *           format: uuid
 *           description: ID of the user who changed the priority
 */
export interface ISupportTicketPriorityChange {
  ticketId: string;
  priority: SupportTicketPriorityEnum;
  title?: string;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportTicketListItem:
 *       type: object
 *       description: Support ticket list item domain model
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the ticket
 *         title:
 *           type: string
 *           description: Title of the ticket
 *         description:
 *           type: string
 *           description: Description of the ticket
 *         category:
 *           $ref: '#/components/schemas/SupportTicketCategoryEnum'
 *         subcategory:
 *           $ref: '#/components/schemas/SupportClientTicketSubcategoryEnum'
 *         status:
 *           $ref: '#/components/schemas/SupportTicketStatusEnum'
 *         priority:
 *           $ref: '#/components/schemas/SupportTicketPriorityEnum'
 *         ticketNumber:
 *           type: string
 *           description: Ticket number
 *         entityType:
 *           $ref: '#/components/schemas/SupportTicketEntityTypeEnum'
 *         sequenceNumber:
 *           type: number
 *           description: Sequence number of the ticket
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the ticket was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the ticket was last updated
 *         createdBy:
 *           type: object
 *           description: Information about the user who created the ticket
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 *             email:
 *               type: string
 *       required:
 *         - id
 *         - title
 *         - description
 *         - category
 *         - subcategory
 *         - status
 *         - priority
 *         - ticketNumber
 *         - sequenceNumber
 *         - entityType
 *         - createdAt
 *         - updatedAt
 *         - createdBy
 */
export interface ISupportTicketListItemResponse {
  id: string;
  title: string;
  description: string;
  category: SupportTicketCategoryEnum;
  subcategory?: SupportClientTicketSubcategoryEnum;
  status: SupportTicketStatusEnum;
  priority?: SupportTicketPriorityEnum;
  ticketNumber: string;
  sequenceNumber: number;
  entityType: SupportTicketEntityTypeEnum;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportSlaPolicy:
 *       type: object
 *       description: Support SLA policy domain model
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the SLA policy
 *         name:
 *           type: string
 *           description: Name of the SLA policy
 *         description:
 *           type: string
 *           description: Description of the SLA policy
 *         entityType:
 *           $ref: '#/components/schemas/SupportTicketEntityTypeEnum'
 *         category:
 *           $ref: '#/components/schemas/SupportTicketCategoryEnum'
 *         priority:
 *           $ref: '#/components/schemas/SupportTicketPriorityEnum'
 *         responseTime:
 *           type: number
 *           description: Response time in hours
 *         resolutionTime:
 *           type: number
 *           description: Resolution time in hours
 *         escalationTime:
 *           type: number
 *           description: Escalation time in hours
 *         businessHoursOnly:
 *           type: boolean
 *           description: Whether SLA applies only during business hours
 *         workingDaysOnly:
 *           type: boolean
 *           description: Whether SLA applies only on working days
 *         excludeHolidays:
 *           type: boolean
 *           description: Whether holidays are excluded from SLA calculation
 *         isActive:
 *           type: boolean
 *           description: Whether the SLA policy is active
 *         isDefault:
 *           type: boolean
 *           description: Whether this is the default SLA policy
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the SLA policy was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the SLA policy was last updated
 *       required:
 *         - id
 *         - name
 *         - entityType
 *         - category
 *         - priority
 *         - responseTime
 *         - resolutionTime
 *         - businessHoursOnly
 *         - workingDaysOnly
 *         - excludeHolidays
 *         - isActive
 *         - isDefault
 *         - createdAt
 *         - updatedAt
 */
export interface ISupportSlaPolicy {
  id: string;
  name: string;
  description?: string;
  entityType: SupportTicketEntityTypeEnum;
  category: SupportTicketCategoryEnum;
  priority: SupportTicketPriorityEnum;
  responseTime: number;
  resolutionTime: number;
  escalationTime?: number;
  businessHoursOnly: boolean;
  workingDaysOnly: boolean;
  excludeHolidays: boolean;
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportTicketAttachment:
 *       type: object
 *       description: Support ticket attachment domain model
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the attachment
 *         ticketId:
 *           type: string
 *           format: uuid
 *           description: ID of the associated support ticket
 *         commentId:
 *           type: string
 *           format: uuid
 *           description: ID of the associated comment
 *         uploadedById:
 *           type: string
 *           format: uuid
 *           description: ID of the user who uploaded the attachment
 *         attachmentId:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the attachment
 *         fileName:
 *           type: string
 *           description: File name
 *         originalName:
 *           type: string
 *           description: Original file name
 *         filePath:
 *           type: string
 *           description: Path to the file
 *         fileSize:
 *           type: number
 *           description: File size in bytes
 *         mimeType:
 *           type: string
 *           description: MIME type of the file
 *         fileHash:
 *           type: string
 *           description: Hash of the file
 *         checksum:
 *           type: string
 *           description: Checksum of the file
 *         isPublic:
 *           type: boolean
 *           description: Whether the attachment is public
 *         isInternal:
 *           type: boolean
 *           description: Whether the attachment is internal
 *         description:
 *           type: string
 *           description: Description of the attachment
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Tags associated with the attachment
 *         isEncrypted:
 *           type: boolean
 *           description: Whether the attachment is encrypted
 *         accessLevel:
 *           type: string
 *           description: Access level for the attachment
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: When the attachment expires
 *         isProcessed:
 *           type: boolean
 *           description: Whether the attachment has been processed
 *         processedAt:
 *           type: string
 *           format: date-time
 *           description: When the attachment was processed
 *         processingStatus:
 *           type: string
 *           description: Status of the processing
 *         processingError:
 *           type: string
 *           description: Error during processing
 *         downloadUrl:
 *           type: string
 *           description: Pre-signed URL for downloading
 *         previewUrl:
 *           type: string
 *           description: Pre-signed URL for previewing
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the attachment was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the attachment was last updated
 *       required:
 *         - id
 *         - fileName
 *         - originalName
 *         - filePath
 *         - fileSize
 *         - mimeType
 *         - isPublic
 *         - isInternal
 *         - tags
 *         - isEncrypted
 *         - isProcessed
 *         - createdAt
 *         - updatedAt
 */
export interface ISupportTicketAttachment {
  id: string;
  ticketId?: string;
  commentId?: string;
  uploadedById?: string;
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  fileHash?: string;
  checksum?: string;
  isPublic: boolean;
  isInternal: boolean;
  description?: string;
  tags: string[];
  isEncrypted: boolean;
  accessLevel?: string;
  expiresAt?: Date;
  isProcessed: boolean;
  processedAt?: Date;
  processingStatus?: string;
  processingError?: string;
  // Document service integration
  downloadUrl?: string; // Pre-signed URL for downloading
  previewUrl?: string; // Pre-signed URL for previewing
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportTicketComment:
 *       type: object
 *       description: Support ticket comment domain model
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the comment
 *         ticketId:
 *           type: string
 *           format: uuid
 *           description: ID of the associated support ticket
 *         content:
 *           type: string
 *           description: Content of the comment
 *         isInternal:
 *           type: boolean
 *           description: Whether the comment is internal
 *         isSystem:
 *           type: boolean
 *           description: Whether the comment is from the system
 *         author:
 *           $ref: '#/components/schemas/ISupportTicketAuthor'
 *           description: Author of the comment
 *         attachments:
 *           type: object
 *           description: Attachments associated with the comment
 *         metadata:
 *           type: object
 *           description: Additional metadata
 *         isEdited:
 *           type: boolean
 *           description: Whether the comment has been edited
 *         editedAt:
 *           type: string
 *           format: date-time
 *           description: When the comment was edited
 *         isDeleted:
 *           type: boolean
 *           description: Whether the comment is deleted
 *         deletedAt:
 *           type: string
 *           format: date-time
 *           description: When the comment was deleted
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the comment was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the comment was last updated
 *       required:
 *         - id
 *         - ticketId
 *         - content
 *         - createdAt
 *         - updatedAt
 */

export interface ISupportTicketComment {
  id: string;
  ticketId: string;
  content: string;
  isInternal?: boolean;
  isSystem?: boolean;
  author?: ISupportTicketAuthor;
  attachments?: any;
  metadata?: any;
  isEdited?: boolean;
  editedAt?: Date;
  isDeleted?: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Mention functionality
  mentionedUserIds?: string[]; // Array of support_user IDs that were mentioned
  mentionedUsers?: ISupportTicketAuthor[];
  parentCommentId?: string;
  replies?: ISupportTicketComment[];
  // Email integration
  emailMessageId?: string;
  emailSubject?: string;
  isFromEmail?: boolean;
  tags?: string[];
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportTicketAuthor:
 *       type: object
 *       description: Support ticket author domain model
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID of the author
 *         name:
 *           type: string
 *           description: Name of the author
 *         email:
 *           type: string
 *           format: email
 *           description: Email of the author
 *         type:
 *           $ref: '#/components/schemas/UserTypeEnum'
 *           description: Type of the author
 *         role:
 *           $ref: '#/components/schemas/UserRoleEnum'
 *           description: Role of the author
 *         profilePicture:
 *           type: string
 *           description: Profile picture of the author
 *       required:
 *         - id
 *         - name
 *         - email
 *         - type
 *         - role
 *         - profilePicture
 */
export interface ISupportTicketAuthor {
  id: string;
  name: string;
  email: string;
  type: UserTypeEnum;
  role: UserRoleEnum;
  profilePicture?: string;
}

/**
 * Support Ticket Comment Create Request
 */
/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportTicketCommentCreateRequest:
 *       type: object
 *       description: Support ticket comment create request
 *       properties:
 *         content:
 *           type: string
 *           description: Content of the comment
 *         isInternal:
 *           type: boolean
 *           description: Whether the comment is internal
 *         metadata:
 *           type: object
 *           description: Additional metadata
 *       required:
 *         - content
 *         - metadata
 */
export interface ISupportTicketCommentCreateRequest {
  content: string;
  isInternal?: boolean;
  metadata?: any;
  // Mention functionality
  mentionedUserIds?: string[]; // Array of support_user IDs that were mentioned
  parentCommentId?: string;
  // Email integration
  emailMessageId?: string;
  emailSubject?: string;
  isFromEmail?: boolean;
  tags?: string[];
}

/**
 * Support Ticket Create Domain Model
 * Priority and due date are now inherited from SLA policy
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportTicketCreate:
 *       type: object
 *       description: Support ticket create domain model
 *       properties:
 *         title:
 *           type: string
 *           description: Title of the ticket
 *         description:
 *           type: string
 *           description: Description of the ticket
 *         ticketType:
 *           $ref: '#/components/schemas/SupportTicketTypeEnum'
 *           description: Type of the ticket
 *         category:
 *           $ref: '#/components/schemas/SupportTicketCategoryEnum'
 *           description: Category of the ticket
 *         subcategory:
 *           $ref: '#/components/schemas/SupportClientTicketSubcategoryEnum'
 *           description: Subcategory of the ticket
 *         entityType:
 *           $ref: '#/components/schemas/SupportTicketEntityTypeEnum'
 *           description: Entity type of the ticket
 *         targetId:
 *           type: string
 *           format: uuid
 *           description: ID of the target
 *         targetType:
 *           type: string
 *           description: Type of the target
 *         createdById:
 *           type: string
 *           format: uuid
 *           description: ID of the created by
 *         assignedUserId:
 *           type: string
 *           format: uuid
 *           description: ID of the assigned to
 *         slaPolicyId:
 *           type: string
 *           format: uuid
 *           description: ID of the sla policy
 *         priority:
 *           $ref: '#/components/schemas/SupportTicketPriorityEnum'
 *           description: Priority of the ticket
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Tags of the ticket
 *         isBacklog:
 *           type: boolean
 *           description: Whether the ticket is a backlog
 *         inlineAttachments:
 *           type: object
 *           description: Inline attachments of the ticket
 *       required:
 *         - title
 *         - description
 *         - category
 *         - entityType
 *         - targetId
 *         - targetType
 *         - createdById
 */
export interface ISupportTicketCreate {
  title: string;
  description: string;
  category: SupportTicketCategoryEnum | SupportClientTicketCategoryEnum;
  entityType: SupportTicketEntityTypeEnum;
  targetId: string;
  targetType?: string;
  ticketType?: SupportTicketTypeEnum;
  subcategory?: SupportClientTicketSubcategoryEnum;
  createdById: string;
  assignedUserId?: string;
  assignmentNote?: string; // Note explaining why ticket was assigned/reassigned
  slaPolicyId?: string;
  priority?: SupportTicketPriorityEnum;
  tags?: string[];
  isBacklog?: boolean;
  inlineAttachments?: any;
}

/**
 * Support Ticket Update Domain Model
 */
export interface ISupportTicketUpdate {
  title?: string;
  description?: string;
  ticketType?: SupportTicketTypeEnum;
  category?: SupportTicketCategoryEnum;
  subcategory?: SupportClientTicketSubcategoryEnum;
  status?: SupportTicketStatusEnum;
  priority?: SupportTicketPriorityEnum;
  assignedUserId?: string;
  assignmentNote?: string; // Note explaining why ticket was assigned/reassigned
  slaPolicyId?: string;
  escalatedToUserId?: string;
  escalatedByUserId?: string;
  escalationReason?: SupportTicketEscalationReasonEnum;
  customerRating?: number;
  customerFeedback?: string;
  resolutionNotes?: string;
  resolvedAt?: Date;
  closedAt?: Date;
  tags?: string[];
  dueDate?: Date;
  isBacklog?: boolean;
  inlineAttachments?: any;
}

/**
 * Support Ticket Status Change Domain Model
 */
/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportTicketStatusChange:
 *       type: object
 *       description: Support ticket status change domain model
 *       properties:
 *         ticketId:
 *           type: string
 *           format: uuid
 *           description: ID of the associated support ticket
 *         status:
 *           type: string
 *           description: New status of the ticket
 *         reason:
 *           type: string
 *           description: Reason for the status change
 *         userAgent:
 *           type: string
 *           description: User agent of the user who changed the status
 *       required:
 *         - ticketId
 *         - status
 *         - changedById
 *         - reason
 *         - userAgent
 */
export interface ISupportTicketStatusChange {
  ticketId: string;
  status: SupportTicketStatusEnum;
  reason?: string;
  userAgent?: string;
  resolvedAt?: Date;
  closedAt?: Date;
}
/**
 * Support Ticket Filter Domain Model
 */
export interface ISupportTicketFilter {
  status?: SupportTicketStatusEnum[];
  assignmentStatus?: SupportTicketAssignmentStatusEnum[];
  priority?: SupportTicketPriorityEnum[];
  category?: SupportTicketCategoryEnum[];
  subcategory?: SupportClientTicketSubcategoryEnum[];
  ticketType?: SupportTicketTypeEnum[];
  entityType?: SupportTicketEntityTypeEnum[];
  createdById?: string;
  assignedUserId?: string;
  assignmentNote?: string; // Filter by assignment note content
  targetId?: string;
  targetType?: string;
  tags?: string[];
  isSlaBreach?: boolean;
  isBacklog?: boolean;
  isDeleted?: boolean;
  createdFrom?: Date;
  createdTo?: Date;
  dueFrom?: Date;
  dueTo?: Date;
  search?: string;
}

/**
 * Support Ticket Sort Domain Model
 */
export interface ISupportTicketSort {
  field:
    | 'createdAt'
    | 'updatedAt'
    | 'priority'
    | 'status'
    | 'assignmentStatus'
    | 'title'
    | 'ticketNumber'
    | 'dueDate'
    | 'assignmentNote';
  direction: 'asc' | 'desc';
}

/**
 * Support Ticket Pagination Domain Model
 */
export interface ISupportTicketPagination {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  searchColumns?: string[];
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportTicketRcaRequest:
 *       type: object
 *       required:
 *         - rootCauseAnalysis
 *         - rcaCategory
 *       properties:
 *         rootCauseAnalysis:
 *           type: string
 *           description: Detailed root cause analysis
 *           example: "The issue was caused by a database connection timeout due to insufficient connection pooling configuration"
 *         rcaCategory:
 *           type: string
 *           description: Category of the root cause
 *           example: "Technical"
 *         rcaContributingFactors:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of contributing factors
 *           example: ["Insufficient monitoring", "Lack of connection pooling", "High concurrent user load"]
 *         rcaPreventiveMeasures:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of preventive measures to avoid recurrence
 *           example: ["Implement connection pooling", "Add monitoring alerts", "Increase database resources"]
 */
export interface ISupportTicketRcaRequest {
  rootCauseAnalysis: string;
  rcaCategory: string;
  rcaContributingFactors?: string[];
  rcaPreventiveMeasures?: string[];
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportTicketRcaResponse:
 *       type: object
 *       properties:
 *         ticketId:
 *           type: string
 *           format: uuid
 *           description: ID of the support ticket
 *         rootCauseAnalysis:
 *           type: string
 *           description: Detailed root cause analysis
 *         rcaCategory:
 *           type: string
 *           description: Category of the root cause
 *         rcaContributingFactors:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of contributing factors
 *         rcaPreventiveMeasures:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of preventive measures
 *         rcaCompletedAt:
 *           type: string
 *           format: date-time
 *           description: When RCA was completed
 *         rcaCompletedBy:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 *             email:
 *               type: string
 *               format: email
 */
export interface ISupportTicketRcaResponse {
  ticketId: string;
  rootCauseAnalysis: string;
  rcaCategory: string;
  rcaContributingFactors: string[];
  rcaPreventiveMeasures: string[];
  rcaCompletedAt: Date;
  rcaCompletedBy: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportTicketResolutionRequest:
 *       type: object
 *       required:
 *         - resolutionNotes
 *       properties:
 *         resolutionNotes:
 *           type: string
 *           description: Detailed notes about the resolution
 *           example: "Issue resolved by implementing connection pooling and increasing database resources"
 */
export interface ISupportTicketResolutionRequest {
  resolutionNotes: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportTicketResolutionResponse:
 *       type: object
 *       properties:
 *         ticketId:
 *           type: string
 *           format: uuid
 *           description: ID of the support ticket
 *         resolutionNotes:
 *           type: string
 *           description: Notes about the resolution
 *         resolvedAt:
 *           type: string
 *           format: date-time
 *           description: When the ticket was resolved
 *         resolvedBy:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 *             email:
 *               type: string
 *               format: email
 */
export interface ISupportTicketResolutionResponse {
  ticketId: string;
  resolutionNotes: string;
  resolvedAt: Date;
  resolvedBy: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * @openapi
 * components:
 *   schemas:
 *   ISupportTicketAttachentsCreate:
 *     type: object
 *     properties:
 *       fileName:
 *         type: string
 *       presignedUrl:
 *         type: string
 *     required:
 *       - fileName
 *       - presignedUrl
 */
export interface ISupportTicketAttachentsCreate {
  fileName: string;
  presignedUrl: string;
}
