import {
  SupportTicketPriorityEnum,
  SupportTicketStatusEnum,
} from '../../models/common/enums';
import { z } from 'zod';

// ========================================
// MESSAGE VALIDATIONS
// ========================================
export const createMessageValidation = z.object({
  body: z.object({
    data: z.object({
      conversationId: z.string().uuid(),
      ticketId: z.string().uuid().optional(),
      type: z.enum([
        'TEXT',
        'IMAGE',
        'FILE',
        'SYSTEM',
        'TYPING_INDICATOR',
        'EMOJI',
        'LINK',
        'CODE',
      ]),
      content: z.string().min(1),
      userId: z.string().uuid().optional(),
      supportUserId: z.string().uuid().optional(),
      fileName: z.string().optional(),
      fileUrl: z.string().url().optional(),
      fileSize: z.number().int().min(0).optional(),
      mimeType: z.string().optional(),
      thumbnailUrl: z.string().url().optional(),
      replyToId: z.string().uuid().optional(),
      metadata: z.record(z.any()).optional(),
      tags: z.array(z.string()).optional(),
    }),
  }),
});

export const updateMessageValidation = z.object({
  body: z.object({
    data: z.object({
      content: z.string().optional(),
      status: z
        .enum(['SENT', 'DELIVERED', 'READ', 'FAILED', 'PENDING'])
        .optional(),
      isEdited: z.boolean().optional(),
      isDeleted: z.boolean().optional(),
      isPinned: z.boolean().optional(),
      readBy: z.record(z.any()).optional(),
      deliveredTo: z.record(z.any()).optional(),
      metadata: z.record(z.any()).optional(),
      tags: z.array(z.string()).optional(),
    }),
  }),
});

export const markReadValidation = z.object({
  body: z.object({
    messageIds: z.array(z.string().uuid()).min(1),
  }),
});

export const markDeliveredValidation = z.object({
  body: z.object({
    messageIds: z.array(z.string().uuid()).min(1),
  }),
});

export const togglePinValidation = z.object({
  body: z.object({
    pinned: z.boolean(),
  }),
});

// ========================================
// CONVERSATION VALIDATIONS
// ========================================
export const updateConversationValidation = z.object({
  body: z.object({
    data: z.object({
      supportUserId: z.string().uuid().optional(),
      isActive: z.boolean().optional(),
      isArchived: z.boolean().optional(),
      isMuted: z.boolean().optional(),
      subject: z.string().optional(),
      tags: z.array(z.string()).optional(),
      priority: z
        .enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL'])
        .optional(),
      isUrgent: z.boolean().optional(),
      endedAt: z.string().datetime().optional(), // ISO date
      archivedAt: z.string().datetime().optional(), // ISO date
    }),
  }),
});

// ========================================
// TICKET VALIDATIONS
// ========================================
export const createTicketValidation = z.object({
  body: z.object({
    data: z.object({
      title: z.string().min(1).max(255),
      description: z.string().min(1),
      ticketType: z
        .enum([
          'NEW_ENTITY',
          'EXISTING_ENTITY',
          'FEATURE_REQUEST',
          'BUG_REPORT',
          'TECHNICAL_ISSUE',
          'BILLING_INQUIRY',
          'ACCOUNT_ISSUE',
          'GENERAL_INQUIRY',
        ])
        .optional()
        .describe(
          'Optional: Will be automatically determined by backend based on category and subcategory'
        ),
      category: z.enum([
        'TECHNICAL',
        'BILLING',
        'ACCOUNT',
        'FEATURE',
        'BUG',
        'GENERAL',
        'INTEGRATION',
        'SECURITY',
      ]),
      subcategory: z.string().optional(),
      priority: z
        .enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL'])
        .optional(),
      entityType: z
        .enum(['CANDIDATE', 'CLIENT', 'PARTNER', 'SUPPORT'])
        .optional(),
      targetId: z.string().uuid().optional(),
      targetType: z.string().optional(),
      assignedUserId: z.string().uuid().optional(),
      assignmentNote: z.string().optional(), // Note explaining why ticket was assigned/reassigned
      slaPolicyId: z.string().uuid().optional(),
      tags: z.array(z.string()).default([]),
      dueDate: z.string().datetime().optional(), // ISO string
      isBacklog: z.boolean().default(false),
      inlineAttachments: z.record(z.any()).optional(), // JSON object
    }),
  }),
});

export const updateTicketValidation = z.object({
  body: z.object({
    data: z.object({
      title: z.string().min(1).max(255).optional(),
      description: z.string().min(1).optional(),
      ticketType: z
        .enum([
          'NEW_ENTITY',
          'EXISTING_ENTITY',
          'FEATURE_REQUEST',
          'BUG_REPORT',
          'TECHNICAL_ISSUE',
          'BILLING_INQUIRY',
          'ACCOUNT_ISSUE',
          'GENERAL_INQUIRY',
        ])
        .optional()
        .describe(
          'Optional: Can be updated manually or will be automatically determined by backend'
        ),
      category: z
        .enum([
          'JOB_POSTING',
          'JOB_APPLICATION',
          'JOB_INTERVIEW',
          'JOB_ONBOARDING',
          'CANDIDATE_RECOMMENDATION',
          'USER_INVITATION',
          'USER_MANAGEMENT',
          'SUBSCRIPTION_BILLING',
          'AI_ASSESSMENT',
          'CANDIDATE_MANAGEMENT',
          'COMPANY_PROFILE',
          'INTEGRATION',
          'TECHNICAL_ISSUE',
          'ACCOUNT_SETTINGS',
          'NOTIFICATION_SETTINGS',
          'DATA_EXPORT_IMPORT',
          'SECURITY_AUTHENTICATION',
          'API_ACCESS',
          'REPORTING_ANALYTICS',
          'FEATURE_REQUEST',
          'GENERAL_INQUIRY',
        ])
        .optional(),
      subcategory: z.string().optional(),
      status: z
        .enum([
          'OPEN',
          'ASSIGNED',
          'IN_PROGRESS',
          'PENDING',
          'RESOLVED',
          'CLOSED',
          'CANCELLED',
          'REOPENED',
        ])
        .optional(),
      priority: z
        .enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL'])
        .optional(),
      assignedUserId: z.string().uuid().optional(),
      assignmentNote: z.string().optional(), // Note explaining why ticket was assigned/reassigned
      slaPolicyId: z.string().uuid().optional(),
      escalatedToUserId: z.string().uuid().optional(),
      escalatedByUserId: z.string().uuid().optional(),
      escalationReason: z
        .enum([
          'SLA_BREACH',
          'CUSTOMER_REQUEST',
          'TECHNICAL_COMPLEXITY',
          'BILLING_DISPUTE',
          'SECURITY_CONCERN',
          'MANAGER_REVIEW',
          'OTHER',
        ])
        .optional(),
      customerRating: z.number().min(1).max(5).optional(),
      customerFeedback: z.string().optional(),
      resolutionNotes: z.string().optional(),
      resolvedAt: z.string().datetime().optional(),
      closedAt: z.string().datetime().optional(),
      tags: z.array(z.string()).optional(),
      dueDate: z.string().datetime().optional(),
      isBacklog: z.boolean().optional(),
      inlineAttachments: z.record(z.any()).optional(),
    }),
  }),
});

export const assignTicketValidation = z.object({
  body: z.object({
    assignedUserId: z.string().uuid(),
    assignmentNote: z.string().optional(), // Note explaining why ticket was assigned/reassigned
  }),
});

export const changeStatusValidation = z.object({
  body: z.object({
    status: z.enum(
      Object.values(SupportTicketStatusEnum) as [string, ...string[]]
    ),
    reason: z.string().optional(),
  }),
});

export const escalateTicketValidation = z.object({
  body: z.object({
    escalatedToUserId: z.string().uuid(),
    escalationReason: z.enum([
      'SLA_BREACH',
      'CUSTOMER_REQUEST',
      'TECHNICAL_COMPLEXITY',
      'BILLING_DISPUTE',
      'SECURITY_CONCERN',
      'MANAGER_REVIEW',
      'OTHER',
    ]),
  }),
});

export const addRatingValidation = z.object({
  body: z.object({
    rating: z.number().min(1).max(5),
    feedback: z.string().optional(),
  }),
});

export const changePriorityValidation = z.object({
  body: z.object({
    priority: z.enum(
      Object.values(SupportTicketPriorityEnum) as [string, ...string[]]
    ),
  }),
});

// ========================================
// COMMENT VALIDATIONS
// ========================================
export const addTicketCommentValidation = z.object({
  body: z.object({
    content: z.string().min(1),
    isInternal: z.boolean().optional(),
    parentCommentId: z.string().uuid().optional(),
    attachments: z
      .array(
        z.object({
          fileName: z.string(),
          originalName: z.string(),
          filePath: z.string(),
          fileSize: z.number().int().min(0),
          mimeType: z.string(),
          isPublic: z.boolean().optional(),
          isInternal: z.boolean().optional(),
          description: z.string().optional(),
          tags: z.array(z.string()).optional(),
        })
      )
      .optional(),
    metadata: z.record(z.any()).optional(),
    tags: z.array(z.string()).optional(),
  }),
});
