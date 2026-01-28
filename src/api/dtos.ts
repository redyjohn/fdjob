/**
 * Data Transfer Objects (DTOs)
 * 依 docs CSV 規範定義，key / type 與 API 文件完全一致。
 */

// --- Meta.csv ---
export interface MetaDTO {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

// --- Customer.csv ---
export interface CustomerDTO {
  id: string
  name: string
  customName: string
  avatarUrl: string | null
  email: string | null
  phone: string | null
  updatedAt: string
  loginAt: string
  createdAt: string
  tags: string[]
}

// --- API 文件.csv (Agent) ---
export type AgentRole = 'agent' | 'admin'
export type AgentStatus = 'active' | 'pause'

export interface AgentDTO {
  id: string
  name: string
  role: AgentRole
  email: string | null
  updatedAt: string
  createdAt: string
  status: AgentStatus
}

// --- Attachment.csv ---
export interface AttachmentDTO {
  fileId: string
  fileName: string
  mimeType: string | null
  size: number | null
  url: string | null
}

// --- MessageSummary.csv ---
export type MessageSummaryType = 'text' | 'file' | 'image' | 'system'

export interface MessageSummaryDTO {
  id: string
  type: MessageSummaryType
  text: string
  createdAt: string
}

// --- Message.csv ---
export type MessageSenderType = 'customer' | 'agent' | 'system'
export type MessageType = 'text' | 'file' | 'image' | 'system'

export interface MessageDTO {
  id: string
  senderType: MessageSenderType
  senderId: string | null
  type: MessageType
  text: string | null
  attachments: AttachmentDTO[]
  clientMessageId: string | null
  createdAt: string
  readedAt: string
}

// --- Conversation.csv ---
export type ConversationChannel = 'web' | 'email' | 'line' | 'fb' | 'ig' | 'other'
export type ConversationStatus = 'open' | 'pending' | 'closed'

export interface ConversationDTO {
  id: string
  customer: CustomerDTO
  channel: ConversationChannel
  status: ConversationStatus
  unreadCount: number
  lastMessage: MessageSummaryDTO | null
  assignee: AgentDTO | null
  tags: string[]
  updatedAt: string
  createdAt: string
}

// --- GET /conversations 回應 (Conversation.csv) ---
export interface GetConversationsResponseDTO {
  data: ConversationDTO[]
  meta: MetaDTO
  traceId?: string
}

// --- GET /conversations/{id}/messages 回應 meta (Message.csv) ---
export interface MessagesMetaDTO {
  hasMore: boolean
  nextBefore: string | null
}
