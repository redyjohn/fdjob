import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/conversations'
  },
  {
    path: '/conversations',
    name: 'ConversationList',
    component: () => import('@/views/ConversationList.vue')
  },
  {
    path: '/conversations/:conversationId',
    name: 'ConversationDetail',
    component: () => import('@/views/ConversationDetail.vue')
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/Settings.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
