import {
  SupportTicketTypeEnum,
  SupportTicketStatusEnum,
  SupportTicketPriorityEnum,
  SupportTicketEntityTypeEnum,
  SupportTicketCategoryEnum,
  SupportTicketEscalationReasonEnum,
} from '../../common/enums';

/**
 * Support Ticket Data Model (Database representation)
 */
export interface ISupportTicketData {
  id: string;
  title: string;
  description: string;
  ticketType: SupportTicketTypeEnum;
  category: SupportTicketCategoryEnum;
  status: SupportTicketStatusEnum;
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

  // Additional Metadata
  tags: string[];
  dueDate?: Date;
  isBacklog: boolean;
  inlineAttachments?: any;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  isDeleted: boolean;
}

/**
 * Support Ticket Audit Log Data Model
 */
export interface ISupportTicketAuditLogData {
  id: string;
  ticketId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  oldData?: any;
  newData?: any;
  reason?: string;
  metadata?: any;
  details?: any;
  performedById?: string;
  sessionId?: string;
  userAgent?: string;
  createdAt: Date;
}

/**
 * Support SLA Policy Data Model
 */
export interface ISupportSlaPolicyData {
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
 * Support Ticket Configuration Data Model
 */
export interface ISupportTicketConfigurationData {
  id: string;
  name: string;
  description?: string;
  entityType: SupportTicketEntityTypeEnum;
  firstResponseSlaHours: number;
  resolutionSlaHours: number;
  escalationSlaHours?: number;
  autoAssignmentEnabled: boolean;
  defaultAssigneeId?: string;
  assignmentRules?: any;
  autoEscalationEnabled: boolean;
  escalationThresholdHours: number;
  escalationTargetId?: string;
  escalationConditions?: any;
  notifyOnCreate: boolean;
  notifyOnUpdate: boolean;
  notifyOnStatusChange: boolean;
  notifyOnAssignment: boolean;
  notifyOnEscalation: boolean;
  allowedCategories?: any;
  allowedTypes?: any;
  allowedPriorities?: any;
  customFieldsSchema?: any;
  requiredFields?: any;
  businessHoursOnly: boolean;
  workingDaysOnly: boolean;
  excludeHolidays: boolean;
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Support Ticket Attachment Data Model
 */
export interface ISupportTicketAttachmentData {
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
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Support Ticket Comment Data Model
 */
export interface ISupportTicketCommentData {
  id: string;
  ticketId: string;
  content: string;
  isInternal: boolean;
  isSystem: boolean;
  authorId?: string;
  authorName?: string;
  authorEmail?: string;
  authorType?: SupportTicketEntityTypeEnum;
  parentCommentId?: string;
  emailMessageId?: string;
  emailSubject?: string;
  isFromEmail: boolean;
  tags: string[];
  attachments?: any;
  metadata?: any;
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
