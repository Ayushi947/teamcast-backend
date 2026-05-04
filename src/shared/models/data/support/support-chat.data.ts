import { SupportTicketPriorityEnum } from '../../common/enums';

/**
 * Support Chat Message Data Model (Database representation)
 */
export interface ISupportChatMessageData {
  id: string;
  conversationId: string;
  ticketId?: string;
  type: string;
  content: string;
  status: string;
  userId?: string;
  supportUserId?: string;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  thumbnailUrl?: string;
  replyToId?: string;
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  isPinned: boolean;
  pinnedAt?: Date;
  readBy?: any;
  deliveredTo?: any;
  metadata?: any;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Support Chat Conversation Data Model (Database representation)
 */
export interface ISupportChatConversationData {
  id: string;
  ticketId: string;
  userId: string;
  supportUserId?: string;
  isActive: boolean;
  isArchived: boolean;
  isMuted: boolean;
  lastMessageAt?: Date;
  lastMessageId?: string;
  messageCount: number;
  unreadCount: number;
  subject?: string;
  tags: string[];
  priority?: SupportTicketPriorityEnum;
  isUrgent: boolean;
  createdAt: Date;
  updatedAt: Date;
  endedAt?: Date;
  archivedAt?: Date;
}
