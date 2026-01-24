<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
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
  Download
} from 'lucide-vue-next'
import { getTicketDetails, sendMessage, type Ticket, type Message } from '@/api/mocks'
import { format } from 'date-fns'

const route = useRoute()
const router = useRouter()

// State
const ticket = ref<Ticket | null>(null)
const messages = ref<Message[]>([])
const isLoading = ref(true)
const newMessage = ref('')
const isSending = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)

// Methods
async function fetchTicketDetails() {
  isLoading.value = true
  try {
    const ticketId = route.params.id as string
    const result = await getTicketDetails(ticketId)
    if (result) {
      ticket.value = result.ticket
      messages.value = result.messages
      await nextTick()
      scrollToBottom()
    }
  } finally {
    isLoading.value = false
  }
}

async function handleSendMessage() {
  if (!newMessage.value.trim() || !ticket.value) return
  
  isSending.value = true
  try {
    const message = await sendMessage(ticket.value.id, newMessage.value.trim())
    messages.value.push(message)
    newMessage.value = ''
    await nextTick()
    scrollToBottom()
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
  router.push('/tickets')
}

function formatTime(dateString: string) {
  return format(new Date(dateString), 'HH:mm')
}

function formatDate(dateString: string) {
  return format(new Date(dateString), 'MMM d, yyyy HH:mm')
}

function getStatusColor(status: Ticket['status']) {
  switch (status) {
    case 'Open':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'Closed':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

function getPriorityColor(priority: Ticket['priority']) {
  switch (priority) {
    case 'High':
      return 'bg-red-100 text-red-800'
    case 'Medium':
      return 'bg-orange-100 text-orange-800'
    case 'Low':
      return 'bg-gray-100 text-gray-600'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSendMessage()
  }
}

function handleAttachment() {
  console.log('Attachment button clicked - File upload UI would open here')
  // TODO: Implement file upload functionality
}

// Lifecycle
onMounted(() => {
  fetchTicketDetails()
})
</script>

<template>
  <!-- Loading State -->
  <div v-if="isLoading" class="h-[calc(100vh-64px)] flex items-center justify-center">
    <div class="flex flex-col items-center">
      <div class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p class="text-gray-500">Loading ticket details...</p>
    </div>
  </div>

  <!-- Ticket Not Found -->
  <div v-else-if="!ticket" class="h-[calc(100vh-64px)] flex items-center justify-center">
    <div class="text-center">
      <AlertCircle class="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h2 class="text-xl font-semibold text-gray-900 mb-2">Ticket Not Found</h2>
      <p class="text-gray-500 mb-4">The ticket you're looking for doesn't exist.</p>
      <button
        @click="goBack"
        class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <ArrowLeft class="w-4 h-4" />
        Back to Tickets
      </button>
    </div>
  </div>

  <!-- Main Content -->
  <div v-else class="h-[calc(100vh-64px)] flex flex-col">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
      <div class="flex items-center gap-4">
        <button
          @click="goBack"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Back to tickets"
        >
          <ArrowLeft class="w-5 h-5 text-gray-600" />
        </button>
        <div class="flex-1 min-w-0">
          <h1 class="text-lg font-semibold text-gray-900 truncate">{{ ticket.subject }}</h1>
          <p class="text-sm text-gray-500">Ticket #{{ ticket.id }} · {{ ticket.customerName }}</p>
        </div>
      </div>
    </div>

    <!-- Content Area -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Chat Area (Left/Center) -->
      <div class="flex-1 flex flex-col bg-gray-50">
        <!-- Messages List -->
        <div 
          ref="messagesContainer"
          class="flex-1 overflow-y-auto p-6 space-y-4"
        >
          <!-- Empty State -->
          <div v-if="messages.length === 0" class="h-full flex items-center justify-center">
            <div class="text-center">
              <FileText class="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p class="text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          </div>

          <!-- Message Bubbles -->
          <div
            v-for="message in messages"
            :key="message.id"
            class="flex"
            :class="message.sender === 'agent' ? 'justify-end' : 'justify-start'"
          >
            <div
              class="max-w-[70%] rounded-2xl px-4 py-3"
              :class="message.sender === 'agent' 
                ? 'bg-blue-600 text-white rounded-br-md' 
                : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md shadow-sm'"
            >
              <!-- Sender Label -->
              <div 
                class="text-xs font-medium mb-1"
                :class="message.sender === 'agent' ? 'text-blue-200' : 'text-gray-500'"
              >
                {{ message.sender === 'agent' ? 'You' : ticket.customerName }}
              </div>

              <!-- File Attachment -->
              <div v-if="message.type === 'file'" class="flex items-center gap-3">
                <div 
                  class="p-2 rounded-lg"
                  :class="message.sender === 'agent' ? 'bg-blue-500' : 'bg-gray-100'"
                >
                  <FileText class="w-5 h-5" :class="message.sender === 'agent' ? 'text-white' : 'text-gray-600'" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium truncate">{{ message.content }}</p>
                  <p 
                    class="text-xs"
                    :class="message.sender === 'agent' ? 'text-blue-200' : 'text-gray-500'"
                  >
                    Attachment
                  </p>
                </div>
                <button 
                  class="p-1.5 rounded-lg transition-colors"
                  :class="message.sender === 'agent' 
                    ? 'hover:bg-blue-500 text-white' 
                    : 'hover:bg-gray-100 text-gray-600'"
                  title="Download"
                >
                  <Download class="w-4 h-4" />
                </button>
              </div>

              <!-- Text Message -->
              <p v-else class="text-sm whitespace-pre-wrap break-words">{{ message.content }}</p>

              <!-- Timestamp -->
              <div 
                class="text-xs mt-2"
                :class="message.sender === 'agent' ? 'text-blue-200' : 'text-gray-400'"
              >
                {{ formatTime(message.timestamp) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Reply Box -->
        <div class="bg-white border-t border-gray-200 p-4 flex-shrink-0">
          <div class="flex items-end gap-3">
            <button
              @click="handleAttachment"
              class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
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
                :disabled="isSending"
              />
            </div>
            <button
              @click="handleSendMessage"
              :disabled="!newMessage.trim() || isSending"
              class="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Send message"
            >
              <Send class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Right Sidebar -->
      <div class="w-80 bg-white border-l border-gray-200 flex-shrink-0 overflow-y-auto">
        <div class="p-6 space-y-6">
          <!-- Ticket Info Section -->
          <div>
            <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Ticket Information
            </h3>
            <div class="space-y-4">
              <!-- Ticket ID -->
              <div class="flex items-center gap-3">
                <div class="p-2 bg-gray-100 rounded-lg">
                  <Hash class="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <p class="text-xs text-gray-500">Ticket ID</p>
                  <p class="text-sm font-medium text-gray-900">#{{ ticket.id }}</p>
                </div>
              </div>

              <!-- Status -->
              <div class="flex items-center gap-3">
                <div class="p-2 bg-gray-100 rounded-lg">
                  <AlertCircle class="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <p class="text-xs text-gray-500">Status</p>
                  <span 
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border mt-1"
                    :class="getStatusColor(ticket.status)"
                  >
                    {{ ticket.status }}
                  </span>
                </div>
              </div>

              <!-- Priority -->
              <div class="flex items-center gap-3">
                <div class="p-2 bg-gray-100 rounded-lg">
                  <AlertCircle class="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <p class="text-xs text-gray-500">Priority</p>
                  <span 
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1"
                    :class="getPriorityColor(ticket.priority)"
                  >
                    {{ ticket.priority }}
                  </span>
                </div>
              </div>

              <!-- Last Updated -->
              <div class="flex items-center gap-3">
                <div class="p-2 bg-gray-100 rounded-lg">
                  <Calendar class="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <p class="text-xs text-gray-500">Last Updated</p>
                  <p class="text-sm font-medium text-gray-900">{{ formatDate(ticket.updatedAt) }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Divider -->
          <hr class="border-gray-200" />

          <!-- Customer Info Section -->
          <div>
            <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Customer Information
            </h3>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User class="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900">{{ ticket.customerName }}</p>
                <p class="text-xs text-gray-500">Customer</p>
              </div>
            </div>
          </div>

          <!-- Divider -->
          <hr class="border-gray-200" />

          <!-- Actions Section -->
          <div>
            <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Actions
            </h3>
            <div class="space-y-2">
              <button 
                v-if="ticket.status !== 'Closed'"
                class="w-full px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Mark as Resolved
              </button>
              <button 
                v-if="ticket.status === 'Closed'"
                class="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Reopen Ticket
              </button>
              <button class="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                Change Priority
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
