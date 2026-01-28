<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Send,
  Paperclip,
  User,
  Calendar,
  Hash,
  AlertCircle,
  FileText,
  Download,
  MessageCircle
} from 'lucide-vue-next'
import { createClientMessageId } from '@/api/conversations'
import {
  getConversation,
  getConversationMessages,
  postMessage,
  markConversationRead,
  uploadFile,
  makeAttachmentFromUpload,
  updateConversationStatus,
  mockSocketService,
  type ConversationListItemModel,
  type MessageModel
} from '@/api/mocks'
import { showError, RATE_LIMIT_MESSAGE } from '@/utils/toast'
import { validateFileBeforeUpload } from '@/utils/upload'
import { ApiError } from '@/utils/apiError'
import { format } from 'date-fns'

const route = useRoute()
const router = useRouter()

const conversation = ref<ConversationListItemModel | null>(null)
const messages = ref<MessageModel[]>([])
const messagesMeta = ref<{ hasMore: boolean; nextBefore: string | null }>({ hasMore: false, nextBefore: null })
const isLoading = ref(true)
const newMessage = ref('')
const isSending = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const isUploading = ref(false)
const isUpdatingStatus = ref(false)
const isLoadingMore = ref(false)

const conversationId = () => route.params.conversationId as string

async function fetchDetails() {
  isLoading.value = true
  try {
    const id = conversationId()
    const [convRes, msgsRes] = await Promise.all([
      getConversation(id),
      getConversationMessages(id)
    ])
    if (convRes) {
      conversation.value = convRes
      messages.value = msgsRes.data
      messagesMeta.value = msgsRes.meta
      await nextTick()
      scrollToBottom()
    }
  } finally {
    isLoading.value = false
  }
}

async function loadMore() {
  const next = messagesMeta.value.nextBefore
  if (!next || isLoadingMore.value) return
  isLoadingMore.value = true
  try {
    const res = await getConversationMessages(conversationId(), { nextBefore: next })
    messages.value = [...res.data, ...messages.value]
    messagesMeta.value = res.meta
  } finally {
    isLoadingMore.value = false
  }
}

function displayName(c: ConversationListItemModel) {
  return c.customer.customName || c.customer.name
}

function buildOptimisticMessage(
  clientMessageId: string,
  text: string
): MessageModel {
  const now = new Date().toISOString()
  return {
    id: `temp-${clientMessageId}`,
    senderType: 'agent',
    senderId: 'u_001',
    type: 'text',
    text,
    attachments: [],
    clientMessageId,
    createdAt: now,
    readedAt: ''
  }
}

async function handleSendMessage() {
  const text = newMessage.value.trim()
  if (!text || !conversation.value) return
  isSending.value = true
  const clientMessageId = createClientMessageId()
  const temp = buildOptimisticMessage(clientMessageId, text)
  messages.value.push(temp)
  newMessage.value = ''
  await nextTick()
  scrollToBottom()

  try {
    const m = await postMessage(conversation.value.id, { text, clientMessageId })
    const idx = messages.value.findIndex(
      (x) => x.clientMessageId === clientMessageId || x.id === temp.id
    )
    if (idx !== -1) messages.value.splice(idx, 1, m)
    else messages.value.push(m)
    await nextTick()
    scrollToBottom()
  } catch (e) {
    const idx = messages.value.findIndex(
      (x) => x.clientMessageId === clientMessageId || x.id === temp.id
    )
    if (idx !== -1) messages.value.splice(idx, 1)
    if (e instanceof ApiError && e.isRateLimit) {
      showError(RATE_LIMIT_MESSAGE)
    } else {
      showError(e instanceof Error ? e.message : '發送失敗，請稍後再試。')
    }
  } finally {
    isSending.value = false
  }
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

function goBack() {
  router.push('/conversations')
}

function formatTime(s: string) {
  return format(new Date(s), 'HH:mm')
}

function formatDate(s: string) {
  return format(new Date(s), 'MMM d, yyyy HH:mm')
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSendMessage()
  }
}

function handleAttachment() {
  fileInput.value?.click()
}

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file || !conversation.value) return
  const validation = validateFileBeforeUpload(file)
  if (!validation.ok) {
    showError(validation.error!)
    target.value = ''
    return
  }
  isUploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    const url = await uploadFile(formData)
    const att = makeAttachmentFromUpload(file.name, url, file.type)
    const clientMessageId = createClientMessageId()
    const m = await postMessage(conversation.value.id, {
      text: file.name,
      attachments: [att],
      clientMessageId
    })
    messages.value.push(m)
    await nextTick()
    scrollToBottom()
  } catch (e) {
    if (e instanceof ApiError && e.isRateLimit) {
      showError(RATE_LIMIT_MESSAGE)
    } else {
      showError(e instanceof Error ? e.message : '檔案上傳失敗，請稍後再試。')
    }
  } finally {
    isUploading.value = false
    target.value = ''
  }
}

async function handleStatusChange(event: Event) {
  const target = event.target as HTMLSelectElement
  const status = target.value as 'open' | 'pending' | 'closed'
  if (!conversation.value || status === conversation.value.status) return
  isUpdatingStatus.value = true
  try {
    const updated = await updateConversationStatus(conversation.value.id, status)
    if (updated) {
      conversation.value.status = updated.status
      conversation.value.updatedAt = updated.updatedAt
      alert('Status updated!')
    }
  } catch (e) {
    showError(e instanceof Error ? e.message : '狀態更新失敗，請稍後再試。')
    target.value = conversation.value.status
  } finally {
    isUpdatingStatus.value = false
  }
}

onMounted(async () => {
  const id = conversationId()
  await markConversationRead(id)
  await fetchDetails()
  if (conversation.value) {
    mockSocketService.connect(id, (m: MessageModel) => {
      messages.value.push(m)
      nextTick(() => scrollToBottom())
    })
  }
})

onUnmounted(() => {
  mockSocketService.disconnect()
})
</script>

<template>
  <div v-if="isLoading" class="h-[calc(100vh-64px)] flex items-center justify-center">
    <div class="flex flex-col items-center">
      <div class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p class="text-gray-500">Loading conversation...</p>
    </div>
  </div>

  <div
    v-else-if="!conversation"
    class="h-[calc(100vh-64px)] flex items-center justify-center"
  >
    <div class="text-center">
      <AlertCircle class="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h2 class="text-xl font-semibold text-gray-900 mb-2">Conversation Not Found</h2>
      <p class="text-gray-500 mb-4">The conversation you're looking for doesn't exist.</p>
      <button
        @click="goBack"
        class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <ArrowLeft class="w-4 h-4" />
        Back to List
      </button>
    </div>
  </div>

  <div v-else class="h-[calc(100vh-64px)] flex flex-col">
    <div class="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
      <div class="flex items-center gap-4">
        <button
          @click="goBack"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Back"
        >
          <ArrowLeft class="w-5 h-5 text-gray-600" />
        </button>
        <div class="flex-1 min-w-0">
          <h1 class="text-lg font-semibold text-gray-900 truncate">
            {{ displayName(conversation) }}
          </h1>
          <p class="text-sm text-gray-500">
            #{{ conversation.id }} · {{ conversation.channel }}
          </p>
        </div>
      </div>
    </div>

    <div class="flex-1 flex overflow-hidden">
      <div class="flex-1 flex flex-col bg-gray-50">
        <div
          ref="messagesContainer"
          class="flex-1 overflow-y-auto p-6 space-y-4"
        >
          <div v-if="messagesMeta.hasMore" class="flex justify-center pb-2">
            <button
              @click="loadMore"
              :disabled="isLoadingMore"
              class="text-sm text-blue-600 hover:underline disabled:opacity-50"
            >
              {{ isLoadingMore ? 'Loading…' : 'Load older messages' }}
            </button>
          </div>

          <div v-if="messages.length === 0" class="h-full flex items-center justify-center">
            <div class="text-center">
              <FileText class="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p class="text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          </div>

          <div
            v-for="m in messages"
            :key="m.id"
            class="flex"
            :class="m.senderType === 'agent' ? 'justify-end' : 'justify-start'"
          >
            <div
              class="max-w-[70%] rounded-2xl px-4 py-3"
              :class="
                m.senderType === 'agent'
                  ? 'bg-blue-600 text-white rounded-br-md'
                  : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md shadow-sm'
              "
            >
              <div
                class="text-xs font-medium mb-1"
                :class="m.senderType === 'agent' ? 'text-blue-200' : 'text-gray-500'"
              >
                {{ m.senderType === 'agent' ? 'You' : displayName(conversation) }}
              </div>

              <div v-if="m.type === 'file' || m.attachments?.length" class="space-y-2">
                <div
                  v-for="a in (m.attachments ?? [])"
                  :key="a.fileId"
                  class="flex items-center gap-3"
                >
                  <div
                    class="p-2 rounded-lg"
                    :class="m.senderType === 'agent' ? 'bg-blue-500' : 'bg-gray-100'"
                  >
                    <FileText
                      class="w-5 h-5"
                      :class="m.senderType === 'agent' ? 'text-white' : 'text-gray-600'"
                    />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium truncate">{{ a.fileName }}</p>
                    <p
                      class="text-xs"
                      :class="m.senderType === 'agent' ? 'text-blue-200' : 'text-gray-500'"
                    >
                      Attachment
                    </p>
                  </div>
                  <a
                    v-if="a.url"
                    :href="a.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="p-1.5 rounded-lg transition-colors"
                    :class="
                      m.senderType === 'agent'
                        ? 'hover:bg-blue-500 text-white'
                        : 'hover:bg-gray-100 text-gray-600'
                    "
                    title="Download"
                  >
                    <Download class="w-4 h-4" />
                  </a>
                </div>
              </div>
              <p v-if="m.text" class="text-sm whitespace-pre-wrap break-words">{{ m.text }}</p>
              <div
                class="text-xs mt-2 flex items-center gap-2 flex-wrap"
                :class="m.senderType === 'agent' ? 'text-blue-200' : 'text-gray-400'"
              >
                <span>{{ formatTime(m.createdAt) }}</span>
                <span v-if="m.id.startsWith('temp-')" class="opacity-75">發送中…</span>
                <span v-else-if="m.readedAt" class="opacity-90">已讀</span>
                <span v-else-if="m.senderType === 'agent'" class="opacity-75">已發送</span>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white border-t border-gray-200 p-4 flex-shrink-0">
          <input
            ref="fileInput"
            type="file"
            class="hidden"
            @change="handleFileChange"
            accept="image/*,application/pdf,.doc,.docx"
          />
          <div class="flex items-end gap-3">
            <button
              @click="handleAttachment"
              :disabled="isUploading"
              class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Attach file"
            >
              <Paperclip class="w-5 h-5" />
            </button>
            <div class="flex-1">
              <textarea
                v-model="newMessage"
                @keydown="handleKeydown"
                placeholder="Type your reply... (Press Enter to send)"
                rows="2"
                class="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                :disabled="isSending || isUploading"
              />
            </div>
            <button
              @click="handleSendMessage"
              :disabled="!newMessage.trim() || isSending || isUploading"
              class="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Send"
            >
              <Send class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div class="w-80 bg-white border-l border-gray-200 flex-shrink-0 overflow-y-auto">
        <div class="p-6 space-y-6">
          <div>
            <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Conversation Info
            </h3>
            <div class="space-y-4">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-gray-100 rounded-lg">
                  <Hash class="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <p class="text-xs text-gray-500">ID</p>
                  <p class="text-sm font-medium text-gray-900">#{{ conversation.id }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="p-2 bg-gray-100 rounded-lg">
                  <AlertCircle class="w-4 h-4 text-gray-600" />
                </div>
                <div class="flex-1">
                  <p class="text-xs text-gray-500 mb-1">Status</p>
                  <select
                    :value="conversation.status"
                    @change="handleStatusChange"
                    :disabled="isUpdatingStatus"
                    class="w-full px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="open">open</option>
                    <option value="pending">pending</option>
                    <option value="closed">closed</option>
                  </select>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="p-2 bg-gray-100 rounded-lg">
                  <MessageCircle class="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <p class="text-xs text-gray-500">Channel</p>
                  <p class="text-sm font-medium text-gray-900">{{ conversation.channel }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="p-2 bg-gray-100 rounded-lg">
                  <Calendar class="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <p class="text-xs text-gray-500">Updated</p>
                  <p class="text-sm font-medium text-gray-900">{{ formatDate(conversation.updatedAt) }}</p>
                </div>
              </div>
            </div>
          </div>

          <hr class="border-gray-200" />

          <div>
            <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Customer
            </h3>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User class="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900">{{ displayName(conversation) }}</p>
                <p class="text-xs text-gray-500">{{ conversation.customer.name }}</p>
              </div>
            </div>
          </div>

          <hr class="border-gray-200" />

          <div>
            <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Actions
            </h3>
            <div class="space-y-2">
              <button
                v-if="conversation.status !== 'closed'"
                class="w-full px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Mark as Resolved
              </button>
              <button
                v-if="conversation.status === 'closed'"
                class="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Reopen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
