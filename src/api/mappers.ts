/**
 * Mappers: DTO → 前端 UI Model
 * 依 docs CSV 規範，確保 unreadCount、lastMessage、attachments 正確轉換。
 */

import type {
  AttachmentDTO,
  ConversationDTO,
  CustomerDTO,
  AgentDTO,
  MessageDTO,
  MessageSummaryDTO
} from './dtos'
import type {
  AttachmentModel,
  ConversationListItemModel,
  MessageModel,
  MessageSummaryModel
} from './types'

function mapAttachmentDTO(dto: AttachmentDTO): AttachmentModel {
  return {
    fileId: dto.fileId,
    fileName: dto.fileName,
    mimeType: dto.mimeType,
    size: dto.size,
    url: dto.url
  }
}

function mapMessageSummaryDTO(dto: MessageSummaryDTO): MessageSummaryModel {
  return {
    id: dto.id,
    type: dto.type,
    text: dto.text,
    createdAt: dto.createdAt
  }
}

/** 轉換對話列表項目：含 unreadCount、lastMessage */
export function mapConversationDTOToListItem(dto: ConversationDTO): ConversationListItemModel {
  return {
    id: dto.id,
    customer: mapCustomerDTO(dto.customer),
    channel: dto.channel,
    status: dto.status,
    unreadCount: dto.unreadCount,
    lastMessage: dto.lastMessage ? mapMessageSummaryDTO(dto.lastMessage) : null,
    assignee: dto.assignee ? mapAssigneeDTO(dto.assignee) : null,
    tags: dto.tags,
    updatedAt: dto.updatedAt,
    createdAt: dto.createdAt
  }
}

function mapCustomerDTO(dto: CustomerDTO): ConversationListItemModel['customer'] {
  return {
    id: dto.id,
    name: dto.name,
    customName: dto.customName,
    avatarUrl: dto.avatarUrl,
    email: dto.email,
    phone: dto.phone,
    loginAt: dto.loginAt,
    tags: dto.tags
  }
}

function mapAssigneeDTO(dto: AgentDTO): { id: string; name: string; role: string } {
  return { id: dto.id, name: dto.name, role: dto.role }
}

/** 轉換訊息：含 attachments 陣列 */
export function mapMessageDTOToModel(dto: MessageDTO): MessageModel {
  return {
    id: dto.id,
    senderType: dto.senderType,
    senderId: dto.senderId,
    type: dto.type,
    text: dto.text,
    attachments: (dto.attachments ?? []).map(mapAttachmentDTO),
    clientMessageId: dto.clientMessageId,
    createdAt: dto.createdAt,
    readedAt: dto.readedAt
  }
}

export function mapConversationDTOsToListItems(dtos: ConversationDTO[]): ConversationListItemModel[] {
  return dtos.map(mapConversationDTOToListItem)
}

export function mapMessageDTOsToModels(dtos: MessageDTO[]): MessageModel[] {
  return dtos.map(mapMessageDTOToModel)
}
