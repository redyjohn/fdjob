/**
 * Conversations API Client
 * 對應 Conversation.csv / Message.csv：
 * - GET  /conversations          列表 (page, pageSize, q, status, channel, assigneeId, unread, sort, updatedAfter)
 * - GET  /conversations/{id}     詳情
 * - GET  /conversations/{id}/messages  訊息 (meta: hasMore, nextBefore)
 * - POST /conversations/{id}/messages  發送 (text, attachments, clientMessageId)
 */

import { getApiUrl } from '@/utils/config'
import type {
  ConversationDTO,
  MessageDTO,
  MetaDTO,
  MessagesMetaDTO
} from './dtos'
import { ApiError } from '@/utils/apiError'

const DEFAULT_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json'
}

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '' || v === null) continue
    search.set(k, String(v))
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

async function handleResponse<T>(res: Response): Promise<T> {
  const text = await res.text()
  let body: { message?: string; traceId?: string } | unknown = text
  try {
    body = JSON.parse(text) as { message?: string; traceId?: string }
  } catch {
    /* keep as text */
  }

  const traceId =
    typeof body === 'object' && body !== null && 'traceId' in body
      ? String((body as { traceId?: string }).traceId)
      : undefined

  if (!res.ok) {
    const msg =
      typeof body === 'object' && body !== null && 'message' in body
        ? String((body as { message?: string }).message)
        : `API ${res.status}: ${res.statusText}`

    if (res.status === 401) throw new ApiError(msg || '未授權', 401, traceId)
    if (res.status === 403) throw new ApiError(msg || '禁止存取', 403, traceId)
    if (res.status === 404) throw new ApiError(msg || '資源不存在', 404, traceId)
    if (res.status === 429) throw new ApiError(msg || '請求過於頻繁', 429, traceId)
    if (res.status >= 500) throw new ApiError(msg || '伺服器錯誤', res.status, traceId)
    throw new ApiError(msg, res.status, traceId)
  }

  if (text === '') return undefined as T
  return (typeof body === 'object' && body !== null ? body : JSON.parse(text)) as T
}

export type SortOrder = 'updatedAt_desc' | 'updatedAt_asc'

export interface GetConversationsParams {
  page?: number
  pageSize?: number
  q?: string
  status?: 'open' | 'pending' | 'closed'
  channel?: 'web' | 'email' | 'line' | 'fb' | 'ig' | 'other'
  assigneeId?: string
  unread?: boolean
  sort?: SortOrder
  updatedAfter?: string
}

export interface GetConversationsResponse {
  data: ConversationDTO[]
  meta: MetaDTO
  traceId?: string
}

/** 對話列表：GET /conversations */
export async function getConversations(
  params?: GetConversationsParams
): Promise<GetConversationsResponse> {
  const query = buildQuery({
    page: params?.page,
    pageSize: params?.pageSize,
    q: params?.q,
    status: params?.status,
    channel: params?.channel,
    assigneeId: params?.assigneeId,
    unread: params?.unread,
    sort: params?.sort,
    updatedAfter: params?.updatedAfter
  })
  const url = getApiUrl(`conversations${query}`)
  const res = await fetch(url, { method: 'GET', headers: DEFAULT_HEADERS })
  return handleResponse<GetConversationsResponse>(res)
}

export interface GetConversationResponse {
  data: ConversationDTO
  meta?: Record<string, unknown>
  traceId?: string
}

/** 單一對話詳情：GET /conversations/{conversationId} */
export async function getConversation(conversationId: string): Promise<ConversationDTO> {
  const url = getApiUrl(`conversations/${encodeURIComponent(conversationId)}`)
  const res = await fetch(url, { method: 'GET', headers: DEFAULT_HEADERS })
  const raw = await handleResponse<GetConversationResponse | ConversationDTO>(res)
  if (typeof raw === 'object' && raw !== null && 'data' in raw)
    return (raw as GetConversationResponse).data as ConversationDTO
  return raw as ConversationDTO
}

export interface GetConversationMessagesParams {
  nextBefore?: string | null
}

export interface GetConversationMessagesResponse {
  data: MessageDTO[]
  meta: MessagesMetaDTO
  traceId?: string
}

/** 訊息列表：GET /conversations/{conversationId}/messages */
export async function getConversationMessages(
  conversationId: string,
  params?: GetConversationMessagesParams
): Promise<GetConversationMessagesResponse> {
  const query = buildQuery({
    nextBefore: params?.nextBefore ?? undefined
  })
  const url = getApiUrl(`conversations/${encodeURIComponent(conversationId)}/messages${query}`)
  const res = await fetch(url, { method: 'GET', headers: DEFAULT_HEADERS })
  const raw = await handleResponse<
    GetConversationMessagesResponse | { data: MessageDTO[]; meta?: MessagesMetaDTO; traceId?: string }
  >(res)
  if (Array.isArray(raw)) {
    return { data: raw, meta: { hasMore: false, nextBefore: null }, traceId: undefined }
  }
  const r = raw as GetConversationMessagesResponse
  return {
    data: r.data ?? [],
    meta: r.meta ?? { hasMore: false, nextBefore: null },
    traceId: r.traceId
  }
}

export interface PostMessageBody {
  text?: string
  attachments?: { fileId: string; fileName: string; url: string; mimeType: string }[]
  clientMessageId?: string
}

/** 發送訊息：POST /conversations/{conversationId}/messages */
export async function postMessage(
  conversationId: string,
  body: PostMessageBody
): Promise<MessageDTO> {
  const url = getApiUrl(`conversations/${encodeURIComponent(conversationId)}/messages`)
  const res = await fetch(url, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(body)
  })
  return handleResponse<MessageDTO>(res)
}

/** 產生前端去重用的 clientMessageId */
export function createClientMessageId(): string {
  return `client-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
}

export { ApiError }
