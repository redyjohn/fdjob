/**
 * Mock API Service
 * 依 docs CSV 規範，DTO 格式與 GET /conversations 回傳 { data, meta } 包裝。
 */

import type {
  ConversationDTO,
  CustomerDTO,
  AgentDTO,
  MessageSummaryDTO,
  MessageDTO,
  AttachmentDTO,
  MetaDTO,
  MessagesMetaDTO
} from './dtos'
import {
  mapConversationDTOToListItem,
  mapConversationDTOsToListItems,
  mapMessageDTOToModel,
  mapMessageDTOsToModels
} from './mappers'
import type { ConversationListItemModel, MessageModel } from './types'
import { validateFileBeforeUpload } from '@/utils/upload'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

const assigneeAgent: AgentDTO = {
  id: 'u_001',
  name: '客服小美',
  role: 'agent',
  email: 'ming@example.com',
  updatedAt: '2026-01-19T09:10:00Z',
  createdAt: '2026-01-18T13:00:00Z',
  status: 'active'
}

function customer(id: string, name: string, customName: string, overrides?: Partial<CustomerDTO>): CustomerDTO {
  return {
    id,
    name,
    customName,
    avatarUrl: 'https://example.com/avatars/default.png',
    email: null,
    phone: null,
    updatedAt: '2026-01-19T09:10:00Z',
    loginAt: '2026-01-19T09:10:00Z',
    createdAt: '2026-01-18T13:00:00Z',
    tags: [],
    ...overrides
  }
}

function lastMsg(id: string, type: MessageSummaryDTO['type'], text: string, createdAt: string): MessageSummaryDTO {
  return { id, type, text, createdAt }
}

const mockConversationsDTO: ConversationDTO[] = [
  {
    id: 'c_10001',
    customer: customer('cu_88', '王小明', '王聰明', { tags: ['訂單', '急件'] }),
    channel: 'web',
    status: 'open',
    unreadCount: 2,
    lastMessage: lastMsg('m_90008', 'text', 'Great question! Your cart items are automatically saved for 7 days.', '2026-01-24T10:30:00Z'),
    assignee: assigneeAgent,
    tags: ['訂單', '急件'],
    updatedAt: '2026-01-24T10:30:00Z',
    createdAt: '2026-01-24T09:00:00Z'
  },
  {
    id: 'c_10002',
    customer: customer('cu_89', 'Sarah Johnson', 'Sarah J.'),
    channel: 'line',
    status: 'open',
    unreadCount: 0,
    lastMessage: lastMsg('m_90010', 'text', 'Request for refund on damaged product', '2026-01-24T09:15:00Z'),
    assignee: assigneeAgent,
    tags: [],
    updatedAt: '2026-01-24T09:15:00Z',
    createdAt: '2026-01-24T08:00:00Z'
  },
  {
    id: 'c_10003',
    customer: customer('cu_90', 'Michael Chen', 'Michael'),
    channel: 'email',
    status: 'pending',
    unreadCount: 0,
    lastMessage: lastMsg('m_90012', 'text', 'How to change my account email address?', '2026-01-24T08:45:00Z'),
    assignee: null,
    tags: [],
    updatedAt: '2026-01-24T08:45:00Z',
    createdAt: '2026-01-24T08:00:00Z'
  },
  {
    id: 'c_10004',
    customer: customer('cu_91', 'Emma Wilson', 'Emma W.'),
    channel: 'web',
    status: 'open',
    unreadCount: 1,
    lastMessage: lastMsg('m_90014', 'text', 'Shipping delay for international order', '2026-01-23T16:20:00Z'),
    assignee: assigneeAgent,
    tags: [],
    updatedAt: '2026-01-23T16:20:00Z',
    createdAt: '2026-01-23T15:00:00Z'
  },
  {
    id: 'c_10005',
    customer: customer('cu_92', 'David Brown', 'David B.'),
    channel: 'line',
    status: 'closed',
    unreadCount: 0,
    lastMessage: lastMsg('m_90016', 'text', 'Product warranty inquiry – resolved', '2026-01-23T14:00:00Z'),
    assignee: assigneeAgent,
    tags: [],
    updatedAt: '2026-01-23T14:00:00Z',
    createdAt: '2026-01-23T10:00:00Z'
  },
  ...(() => {
    const channels: ConversationDTO['channel'][] = ['web', 'line', 'email', 'fb', 'ig', 'other']
    const statuses: ConversationDTO['status'][] = ['open', 'pending', 'closed']
    const names = ['Alex Kim', 'Jordan Lee', 'Taylor Wong', 'Casey Liu', 'Riley Zhang', 'Morgan Hu', 'Jamie Chen', 'Quinn Wang', 'Sam Wu', 'Robin Xu', 'Jesse Guo', 'Drew Lin', 'Kai Huang', 'Sky He', 'River Deng', 'Blake Cao', 'Reese Ma', 'Sage Lu', 'Rowan Ye', 'Phoenix Jiang']
    return names.map((name, i) => {
      const idx = 10006 + i
      const ch = channels[i % channels.length]!
      const st = statuses[i % statuses.length]!
      const d = new Date(Date.UTC(2026, 0, 20 + (i % 5), 10 + (i % 8), i % 60))
      const iso = d.toISOString()
      return {
        id: `c_${idx}`,
        customer: customer(`cu_${90 + i}`, name, name.split(' ')[0] ?? name),
        channel: ch,
        status: st,
        unreadCount: i % 4 === 0 ? 1 : 0,
        lastMessage: lastMsg(`m_9${1000 + i}`, 'text', `Mock last message ${idx}`, iso),
        assignee: i % 3 === 0 ? null : assigneeAgent,
        tags: i % 5 === 0 ? ['VIP'] : [],
        updatedAt: iso,
        createdAt: iso
      } satisfies ConversationDTO
    })
  })()
]

const mockAttachment: AttachmentDTO = {
  fileId: 'f_7788',
  fileName: 'payment_error_screenshot.png',
  mimeType: 'image/png',
  size: 345678,
  url: 'https://cdn.example.com/uploads/payment_error_screenshot.png'
}

const mockMessagesDTO: Record<string, MessageDTO[]> = {
  c_10001: [
    {
      id: 'm_90001',
      senderType: 'customer',
      senderId: 'cu_88',
      type: 'text',
      text: 'Hi, I\'ve been trying to complete my purchase for order #12345 but the payment keeps failing.',
      attachments: [],
      clientMessageId: null,
      createdAt: '2026-01-24T09:00:00Z',
      readedAt: '2026-01-24T09:00:00Z'
    },
    {
      id: 'm_90002',
      senderType: 'agent',
      senderId: 'u_001',
      type: 'text',
      text: '可以的，請提供訂單編號。',
      attachments: [],
      clientMessageId: null,
      createdAt: '2026-01-24T09:15:00Z',
      readedAt: '2026-01-24T09:15:00Z'
    },
    {
      id: 'm_90003',
      senderType: 'customer',
      senderId: 'cu_88',
      type: 'text',
      text: 'Sure, the last 4 digits are 4532. I\'ve attached a screenshot.',
      attachments: [],
      clientMessageId: null,
      createdAt: '2026-01-24T09:20:00Z',
      readedAt: '2026-01-24T09:20:00Z'
    },
    {
      id: 'm_90004',
      senderType: 'customer',
      senderId: 'cu_88',
      type: 'file',
      text: 'payment_error_screenshot.png',
      attachments: [mockAttachment],
      clientMessageId: null,
      createdAt: '2026-01-24T09:21:00Z',
      readedAt: '2026-01-24T09:21:00Z'
    },
    {
      id: 'm_90005',
      senderType: 'agent',
      senderId: 'u_001',
      type: 'text',
      text: 'Thank you for the screenshot. We\'ll escalate to the payment team.',
      attachments: [],
      clientMessageId: null,
      createdAt: '2026-01-24T09:30:00Z',
      readedAt: '2026-01-24T09:30:00Z'
    },
    {
      id: 'm_90006',
      senderType: 'agent',
      senderId: 'u_001',
      type: 'text',
      text: 'You should receive an email within 30 minutes. Is there anything else?',
      attachments: [],
      clientMessageId: null,
      createdAt: '2026-01-24T10:00:00Z',
      readedAt: '2026-01-24T10:00:00Z'
    },
    {
      id: 'm_90007',
      senderType: 'customer',
      senderId: 'cu_88',
      type: 'text',
      text: 'Will my cart items still be saved?',
      attachments: [],
      clientMessageId: null,
      createdAt: '2026-01-24T10:15:00Z',
      readedAt: '2026-01-24T10:15:00Z'
    },
    {
      id: 'm_90008',
      senderType: 'agent',
      senderId: 'u_001',
      type: 'text',
      text: 'Great question! Your cart items are automatically saved for 7 days.',
      attachments: [],
      clientMessageId: null,
      createdAt: '2026-01-24T10:30:00Z',
      readedAt: '2026-01-24T10:30:00Z'
    }
  ]
}

// 其他對話若無訊息則回傳空陣列
function getMessagesForConversation(id: string): MessageDTO[] {
  return [...(mockMessagesDTO[id] ?? [])]
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

export interface GetConversationsResult {
  data: ConversationListItemModel[]
  meta: MetaDTO
  traceId?: string
}

/** 模擬 GET /conversations：回傳 { data, meta, traceId? } */
export async function getConversations(params?: GetConversationsParams): Promise<GetConversationsResult> {
  await delay(500)
  let list = [...mockConversationsDTO]

  if (params?.status) list = list.filter((c) => c.status === params.status)
  if (params?.channel) list = list.filter((c) => c.channel === params.channel)
  if (params?.assigneeId)
    list = list.filter((c) => c.assignee?.id === params.assigneeId)
  if (params?.unread === true) list = list.filter((c) => c.unreadCount > 0)
  if (params?.q) {
    const q = params.q.toLowerCase()
    list = list.filter(
      (c) =>
        c.customer.name.toLowerCase().includes(q) ||
        c.customer.customName.toLowerCase().includes(q) ||
        (c.lastMessage?.text ?? '').toLowerCase().includes(q)
    )
  }
  if (params?.updatedAfter) {
    const t = new Date(params.updatedAfter).getTime()
    list = list.filter((c) => new Date(c.updatedAt).getTime() >= t)
  }

  const sort = params?.sort ?? 'updatedAt_desc'
  list.sort((a, b) => {
    const ta = new Date(a.updatedAt).getTime()
    const tb = new Date(b.updatedAt).getTime()
    return sort === 'updatedAt_desc' ? tb - ta : ta - tb
  })

  const page = params?.page ?? 1
  const pageSize = params?.pageSize ?? 20
  const total = list.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize
  const paged = list.slice(start, start + pageSize)
  const meta: MetaDTO = { page, pageSize, total, totalPages }
  const traceId = `mock-trace-${Date.now()}`

  return {
    data: mapConversationDTOsToListItems(paged),
    meta,
    traceId
  }
}

export async function getConversation(id: string): Promise<ConversationListItemModel | null> {
  await delay(300)
  const dto = mockConversationsDTO.find((c) => c.id === id)
  if (!dto) return null
  return mapConversationDTOToListItem(dto)
}

const MESSAGES_PAGE_SIZE = 10

export interface GetConversationMessagesResult {
  data: MessageModel[]
  meta: MessagesMetaDTO
  traceId?: string
}

/** 模擬 GET /conversations/{id}/messages：回傳 { data, meta: { hasMore, nextBefore } } */
export async function getConversationMessages(
  id: string,
  options?: { nextBefore?: string | null }
): Promise<GetConversationMessagesResult> {
  await delay(300)
  const dtos = getMessagesForConversation(id)
  const sort = [...dtos].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  let start: number
  if (options?.nextBefore) {
    const idx = sort.findIndex((m) => m.id === options.nextBefore || m.createdAt === options.nextBefore)
    start = idx < 0 ? 0 : idx + 1
  } else {
    start = 0
  }

  const chunk = sort.slice(start, start + MESSAGES_PAGE_SIZE)
  const hasMore = start + MESSAGES_PAGE_SIZE < sort.length
  const last = chunk[chunk.length - 1]
  const nextBefore: string | null = hasMore && last ? last.id : null
  const meta: MessagesMetaDTO = { hasMore, nextBefore }
  const data = mapMessageDTOsToModels(chunk)
  const traceId = `mock-trace-${Date.now()}`

  return { data, meta, traceId }
}

const sentByClientId = new Map<string, MessageDTO>()

export async function postMessage(
  conversationId: string,
  body: { text?: string; attachments?: AttachmentDTO[]; clientMessageId?: string }
): Promise<MessageModel> {
  await delay(300)
  if (body.clientMessageId) {
    const existing = sentByClientId.get(body.clientMessageId)
    if (existing) return mapMessageDTOToModel(existing)
  }

  const msgs = getMessagesForConversation(conversationId)
  const nextId = 90000 + msgs.length + 1
  const id = body.clientMessageId ?? `m_${nextId}`
  const now = new Date().toISOString()
  const att = body.attachments ?? []
  const text = body.text ?? (att.length ? att.map((a) => a.fileName).join(', ') : '')

  const dto: MessageDTO = {
    id,
    senderType: 'agent',
    senderId: 'u_001',
    type: att.length ? 'file' : 'text',
    text: text || null,
    attachments: att,
    clientMessageId: body.clientMessageId ?? null,
    createdAt: now,
    readedAt: now
  }

  if (!mockMessagesDTO[conversationId]) mockMessagesDTO[conversationId] = []
  mockMessagesDTO[conversationId].push(dto)
  if (body.clientMessageId) sentByClientId.set(body.clientMessageId, dto)

  return mapMessageDTOToModel(dto)
}

export async function updateConversationStatus(
  id: string,
  status: 'open' | 'pending' | 'closed'
): Promise<ConversationListItemModel | null> {
  await delay(300)
  const dto = mockConversationsDTO.find((c) => c.id === id)
  if (!dto) return null
  dto.status = status
  dto.updatedAt = new Date().toISOString()
  return mapConversationDTOToListItem(dto)
}

export async function markConversationRead(id: string): Promise<boolean> {
  await delay(200)
  const dto = mockConversationsDTO.find((c) => c.id === id)
  if (!dto) return false
  dto.unreadCount = 0
  return true
}

/**
 * 檔案上傳：完整使用 FormData 封裝，呼叫端以 formData.append('file', file) 傳入。
 * 對接真實後端時：改為使用 fetch(getApiUrl('api/upload'), { method: 'POST', body: formData })，
 * 不設 Content-Type（由瀏覽器自動帶 multipart/form-data boundary），
 * 依後端回傳取得檔案 URL 後再以 attachments 傳入 postMessage。
 */
export async function uploadFile(formData: FormData): Promise<string> {
  await delay(800)
  const file = formData.get('file') as File | null
  if (!file) throw new Error('未選擇檔案')
  const validation = validateFileBeforeUpload(file)
  if (!validation.ok) throw new Error(validation.error)
  const fileName = file.name
  // Mock：直接回傳模擬 URL。真實對接範例：
  // const res = await fetch(getApiUrl('api/upload'), { method: 'POST', body: formData })
  // if (!res.ok) throw new ApiError(await res.text(), res.status, res.headers.get('X-Trace-Id') ?? undefined)
  // const json = await res.json() as { url: string }
  // return json.url
  return `https://cdn.example.com/uploads/${Date.now()}_${fileName}`
}

/** 上傳後組出 AttachmentDTO，供 postMessage 使用 */
export function makeAttachmentFromUpload(fileName: string, url: string, mimeType?: string | null): AttachmentDTO {
  return {
    fileId: `f_${Date.now()}`,
    fileName,
    mimeType: mimeType ?? null,
    size: null,
    url
  }
}

type MessageCallback = (m: MessageModel) => void
type GlobalNewMessageCallback = (conversationId: string) => void

export class MockSocketService {
  private intervalId: ReturnType<typeof setInterval> | null = null
  private conversationId: string | null = null
  private callback: MessageCallback | null = null
  private static globalListeners: GlobalNewMessageCallback[] = []

  /** 訂閱「任一對話收到新訊息」事件，用於列表頁即時更新 unreadCount */
  static subscribeGlobal(cb: GlobalNewMessageCallback): () => void {
    MockSocketService.globalListeners.push(cb)
    return () => {
      MockSocketService.globalListeners = MockSocketService.globalListeners.filter((l) => l !== cb)
    }
  }

  /** 實例方法：委派給靜態 subscribeGlobal */
  subscribeGlobal(cb: GlobalNewMessageCallback): () => void {
    return MockSocketService.subscribeGlobal(cb)
  }

  private static notifyGlobal(conversationId: string) {
    MockSocketService.globalListeners.forEach((cb) => cb(conversationId))
  }

  connect(conversationId: string, cb: MessageCallback) {
    this.conversationId = conversationId
    this.callback = cb
    this.intervalId = setInterval(() => {
      if (!this.callback || !this.conversationId) return
      const msgs = getMessagesForConversation(this.conversationId)
      const nextId = 90000 + msgs.length + 1
      const now = new Date().toISOString()
      const samples = [
        'Thanks for the update!',
        'That sounds good, I\'ll wait.',
        'Can you provide more details?',
        'I have another question...'
      ]
      const text = samples[Math.floor(Math.random() * samples.length)] ?? 'Message'
      const dto: MessageDTO = {
        id: `m_${nextId}`,
        senderType: 'customer',
        senderId: 'cu_88',
        type: 'text',
        text,
        attachments: [],
        clientMessageId: null,
        createdAt: now,
        readedAt: now
      }
      const cid = this.conversationId
      if (!cid) return
      if (!mockMessagesDTO[cid]) mockMessagesDTO[cid] = []
      mockMessagesDTO[cid].push(dto)
      this.callback(mapMessageDTOToModel(dto))
      MockSocketService.notifyGlobal(cid)
    }, 10000)
  }

  disconnect() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.conversationId = null
    this.callback = null
  }

  isConnected(): boolean {
    return this.intervalId != null
  }
}

export const mockSocketService = new MockSocketService()

/** 用於列表 assigneeId 篩選：回傳 Mock 中出現的 assignee 選項 */
export function getAssigneeOptions(): { id: string; name: string }[] {
  return [
    { id: 'u_001', name: '客服小美' }
  ]
}

export type { ConversationListItemModel, MessageModel } from './types'
