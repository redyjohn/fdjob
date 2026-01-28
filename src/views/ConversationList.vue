<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'
import { RefreshCw, Filter, Search, ArrowUpDown, User } from 'lucide-vue-next'
import {
  getConversations,
  type ConversationListItemModel,
  type GetConversationsResult,
  type GetConversationsParams,
  type SortOrder
} from '@/api/mocks'
import { format } from 'date-fns'

const router = useRouter()

const list = ref<ConversationListItemModel[]>([])
const meta = ref<GetConversationsResult['meta'] | null>(null)
const isLoading = ref(true)
const isLoadingMore = ref(false)
const statusFilter = ref<'all' | 'open' | 'closed' | 'pending'>('all')
const channelFilter = ref<'all' | 'web' | 'email' | 'line' | 'fb' | 'ig' | 'other'>('all')
const unreadOnly = ref(false)
const q = ref('')
const sort = ref<SortOrder>('updatedAt_desc')
const page = ref(1)

function buildParams(overridePage?: number): GetConversationsParams {
  return {
    page: overridePage ?? page.value,
    pageSize: 20,
    sort: sort.value,
    q: q.value.trim() || undefined,
    status: statusFilter.value === 'all' ? undefined : statusFilter.value,
    channel: channelFilter.value === 'all' ? undefined : channelFilter.value,
    unread: unreadOnly.value ? true : undefined
  }
}

async function fetchConversations(loadMore = false) {
  if (loadMore) {
    if (isLoadingMore.value || !meta.value || meta.value.page >= meta.value.totalPages) return
    isLoadingMore.value = true
    const nextPage = meta.value.page + 1
    try {
      const res = await getConversations(buildParams(nextPage))
      list.value = [...list.value, ...res.data]
      meta.value = res.meta
      page.value = nextPage
    } finally {
      isLoadingMore.value = false
    }
    return
  }

  page.value = 1
  isLoading.value = true
  try {
    const res = await getConversations(buildParams(1))
    list.value = res.data
    meta.value = res.meta
  } finally {
    isLoading.value = false
  }
}

function navigateTo(conversationId: string) {
  router.push(`/conversations/${conversationId}`)
}

function formatDate(dateString: string) {
  return format(new Date(dateString), 'MMM d, yyyy HH:mm')
}

function getStatusColor(status: ConversationListItemModel['status']) {
  switch (status) {
    case 'open':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'closed':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

function displayName(c: ConversationListItemModel) {
  return c.customer.customName || c.customer.name
}

function lastMessageText(c: ConversationListItemModel) {
  return c.lastMessage?.text ?? ''
}

function avatarUrl(c: ConversationListItemModel) {
  return c.customer.avatarUrl ?? null
}

const hasMore = () => meta.value != null && meta.value.page < meta.value.totalPages

const debouncedFetch = useDebounceFn(() => fetchConversations(false), 300)

onMounted(() => fetchConversations(false))
watch([statusFilter, channelFilter, sort, unreadOnly], () => fetchConversations(false))
watch(q, () => debouncedFetch())
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Conversation Management</h1>
        <p class="text-sm text-gray-500 mt-1">Manage and respond to customer conversations</p>
      </div>
      <button
        @click="fetchConversations(false)"
        :disabled="isLoading"
        class="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
        Refresh
      </button>
    </div>

    <div class="bg-white border border-gray-200 rounded-lg p-4">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-2">
          <Filter class="w-4 h-4 text-gray-500" />
          <span class="text-sm font-medium text-gray-700">Filters</span>
        </div>
        <select
          v-model="statusFilter"
          class="block w-36 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All status</option>
          <option value="open">open</option>
          <option value="pending">pending</option>
          <option value="closed">closed</option>
        </select>
        <select
          v-model="channelFilter"
          class="block w-36 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All channel</option>
          <option value="web">web</option>
          <option value="email">email</option>
          <option value="line">line</option>
          <option value="fb">fb</option>
          <option value="ig">ig</option>
          <option value="other">other</option>
        </select>
        <label class="inline-flex items-center gap-2 cursor-pointer">
          <input
            v-model="unreadOnly"
            type="checkbox"
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span class="text-sm text-gray-700">只看未讀 (unread)</span>
        </label>
        <div class="relative flex-1 min-w-[200px] max-w-xs">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            v-model="q"
            type="text"
            placeholder="Search (customer / content)"
            class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div class="flex items-center gap-2">
          <ArrowUpDown class="w-4 h-4 text-gray-500" />
          <select
            v-model="sort"
            class="block w-40 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="updatedAt_desc">Newest first</option>
            <option value="updatedAt_asc">Oldest first</option>
          </select>
        </div>
        <span class="text-sm text-gray-500">
          Showing {{ list.length }} of {{ meta?.total ?? 0 }}
        </span>
      </div>
    </div>

    <div v-if="isLoading" class="bg-white border border-gray-200 rounded-lg p-12">
      <div class="flex flex-col items-center justify-center">
        <RefreshCw class="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <p class="text-gray-500">Loading conversations...</p>
      </div>
    </div>

    <div v-else class="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Channel</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assignee</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Last message</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tags</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Unread</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Updated</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr
            v-for="c in list"
            :key="c.id"
            @click="navigateTo(c.id)"
            class="hover:bg-gray-50 cursor-pointer transition-colors"
            :class="{ 'bg-blue-50/50': c.unreadCount > 0 }"
          >
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
                :class="getStatusColor(c.status)"
              >
                {{ c.status }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{{ c.channel }}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center gap-2">
                <div
                  class="w-8 h-8 rounded-full flex-shrink-0 bg-gray-200 flex items-center justify-center overflow-hidden"
                >
                  <img
                    v-if="avatarUrl(c)"
                    :src="avatarUrl(c)!"
                    :alt="displayName(c)"
                    class="w-full h-full object-cover"
                  />
                  <User v-else class="w-4 h-4 text-gray-500" />
                </div>
                <span
                  v-if="c.unreadCount > 0"
                  class="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"
                  title="Unread"
                />
                <span class="text-sm text-gray-900" :class="{ 'font-semibold': c.unreadCount > 0 }">
                  {{ displayName(c) }}
                </span>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
              {{ c.assignee?.name ?? '—' }}
            </td>
            <td class="px-6 py-4 max-w-xs">
              <span class="text-sm text-gray-700 truncate block" :title="lastMessageText(c)">
                {{ lastMessageText(c) || '—' }}
              </span>
            </td>
            <td class="px-6 py-4">
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="tag in (c.tags || []).slice(0, 3)"
                  :key="tag"
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {{ tag }}
                </span>
                <span v-if="!(c.tags?.length)" class="text-sm text-gray-400">—</span>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span v-if="c.unreadCount > 0" class="text-sm font-medium text-blue-600">{{ c.unreadCount }}</span>
              <span v-else class="text-sm text-gray-400">0</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatDate(c.updatedAt) }}</td>
          </tr>
          <tr v-if="list.length === 0">
            <td colspan="8" class="px-6 py-12 text-center text-gray-500">No conversations match the filters.</td>
          </tr>
        </tbody>
      </table>
      <div
        v-if="hasMore() && list.length > 0"
        class="flex justify-center py-4 border-t border-gray-200"
      >
        <button
          type="button"
          :disabled="isLoadingMore"
          @click="fetchConversations(true)"
          class="text-sm text-blue-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isLoadingMore ? '載入中…' : '載入更多' }}
        </button>
      </div>
    </div>
  </div>
</template>
