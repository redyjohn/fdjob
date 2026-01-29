/**
 * 列表未讀即時增量 Store
 * 當 WebSocket 推播「某對話有新訊息」且使用者不在該對話詳情頁時，增加該對話的 unreadCount 顯示。
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUnreadStore = defineStore('unread', () => {
  const deltas = ref<Record<string, number>>({})

  function incrementUnread(conversationId: string) {
    deltas.value[conversationId] = (deltas.value[conversationId] ?? 0) + 1
    deltas.value = { ...deltas.value }
  }

  function clearDelta(conversationId: string) {
    if (conversationId in deltas.value) {
      const next = { ...deltas.value }
      delete next[conversationId]
      deltas.value = next
    }
  }

  function getDelta(conversationId: string): number {
    return deltas.value[conversationId] ?? 0
  }

  return {
    deltas: computed(() => deltas.value),
    incrementUnread,
    clearDelta,
    getDelta
  }
})
