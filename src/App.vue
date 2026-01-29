<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import DefaultLayout from '@/components/layout/DefaultLayout.vue'
import { mockSocketService } from '@/api/mocks'
import { useUnreadStore } from '@/stores/unread'

const route = useRoute()
const unreadStore = useUnreadStore()

let unsubscribe: (() => void) | null = null

onMounted(() => {
  unsubscribe = mockSocketService.subscribeGlobal((conversationId) => {
    const currentId = route.params.conversationId as string | undefined
    if (currentId !== conversationId) {
      unreadStore.incrementUnread(conversationId)
    }
  })
})

onUnmounted(() => {
  unsubscribe?.()
})
</script>

<template>
  <DefaultLayout>
    <router-view />
  </DefaultLayout>
</template>

