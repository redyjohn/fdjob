/**
 * 前端 UI Models
 * 由 DTO 經 mapper 轉換後使用，key 與 CSV 規範一致。
 */

import type {
  ConversationChannel,
  ConversationStatus,
  MessageSenderType,
  MessageType
} from './dtos'

export interface AttachmentModel {
  fileId: string
  fileName: string
  mimeType: string | null
  size: number | null
  url: string | null
}

export interface MessageSummaryModel {
  id: string
  type: MessageType
  text: string
  createdAt: string
}

export interface ConversationListItemModel {
  id: string
  customer: {
    id: string
    name: string
    customName: string
    avatarUrl: string | null
    email: string | null
    phone: string | null
    tags: string[]
  }
  channel: ConversationChannel
  status: ConversationStatus
  unreadCount: number
  lastMessage: MessageSummaryModel | null
  assignee: { id: string; name: string; role: string } | null
  tags: string[]
  updatedAt: string
  createdAt: string
}

export interface MessageModel {
  id: string
  senderType: MessageSenderType
  senderId: string | null
  type: MessageType
  text: string | null
  attachments: AttachmentModel[]
  clientMessageId: string | null
  createdAt: string
  readedAt: string
}

export interface ConversationDetailModel extends ConversationListItemModel {}
