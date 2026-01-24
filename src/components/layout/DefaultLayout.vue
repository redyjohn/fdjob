<script setup lang="ts">
import { useRoute } from 'vue-router'
import { Ticket, Settings, LogOut } from 'lucide-vue-next'

const route = useRoute()

const navItems = [
  { name: 'Tickets', path: '/tickets', icon: Ticket },
  { name: 'Settings', path: '/settings', icon: Settings },
]

const isActive = (path: string) => {
  return route.path.startsWith(path)
}
</script>

<template>
  <div class="flex h-screen bg-gray-50">
    <!-- Sidebar -->
    <aside class="w-64 bg-slate-900 text-white flex flex-col">
      <!-- Logo Area -->
      <div class="h-16 flex items-center px-6 border-b border-slate-700">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Ticket class="w-5 h-5 text-white" />
          </div>
          <span class="text-lg font-semibold">Reply System</span>
        </div>
      </div>

      <!-- Navigation Links -->
      <nav class="flex-1 px-4 py-6">
        <ul class="space-y-2">
          <li v-for="item in navItems" :key="item.path">
            <router-link
              :to="item.path"
              class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors"
              :class="isActive(item.path) 
                ? 'bg-slate-800 text-white' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'"
            >
              <component :is="item.icon" class="w-5 h-5" />
              <span>{{ item.name }}</span>
            </router-link>
          </li>
        </ul>
      </nav>

      <!-- Logout -->
      <div class="p-4 border-t border-slate-700">
        <button class="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors">
          <LogOut class="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
        <div>
          <!-- Breadcrumb or page title can go here -->
        </div>

        <!-- User Info -->
        <div class="flex items-center gap-3">
          <span class="text-sm text-gray-700 font-medium">Admin</span>
          <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span class="text-white text-sm font-medium">A</span>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-1 overflow-auto p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
