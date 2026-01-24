<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { RefreshCw, Filter, Circle } from 'lucide-vue-next'
import { getTickets, type Ticket } from '@/api/mocks'
import { format } from 'date-fns'

const router = useRouter()

// State
const tickets = ref<Ticket[]>([])
const isLoading = ref(true)
const statusFilter = ref<'All' | 'Open' | 'Closed' | 'Pending'>('All')

// Computed
const filteredTickets = computed(() => {
  if (statusFilter.value === 'All') {
    return tickets.value
  }
  return tickets.value.filter(ticket => ticket.status === statusFilter.value)
})

// Methods
async function fetchTickets() {
  isLoading.value = true
  try {
    tickets.value = await getTickets()
  } finally {
    isLoading.value = false
  }
}

function navigateToTicket(id: string) {
  router.push(`/tickets/${id}`)
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
      return 'text-red-600'
    case 'Medium':
      return 'text-orange-500'
    case 'Low':
      return 'text-gray-400'
    default:
      return 'text-gray-400'
  }
}

// Lifecycle
onMounted(() => {
  fetchTickets()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Ticket Management</h1>
        <p class="text-sm text-gray-500 mt-1">Manage and respond to customer support tickets</p>
      </div>
      <button
        @click="fetchTickets"
        :disabled="isLoading"
        class="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
        Refresh
      </button>
    </div>

    <!-- Filter Bar -->
    <div class="bg-white border border-gray-200 rounded-lg p-4">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <Filter class="w-4 h-4 text-gray-500" />
          <span class="text-sm font-medium text-gray-700">Filter by Status:</span>
        </div>
        <select
          v-model="statusFilter"
          class="block w-40 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="All">All Tickets</option>
          <option value="Open">Open</option>
          <option value="Pending">Pending</option>
          <option value="Closed">Closed</option>
        </select>
        <span class="text-sm text-gray-500">
          Showing {{ filteredTickets.length }} of {{ tickets.length }} tickets
        </span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="bg-white border border-gray-200 rounded-lg p-12">
      <div class="flex flex-col items-center justify-center">
        <RefreshCw class="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <p class="text-gray-500">Loading tickets...</p>
      </div>
    </div>

    <!-- Tickets Table -->
    <div v-else class="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Subject
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Customer
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Priority
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Last Updated
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr
            v-for="ticket in filteredTickets"
            :key="ticket.id"
            @click="navigateToTicket(ticket.id)"
            class="hover:bg-gray-50 cursor-pointer transition-colors"
            :class="{ 'bg-blue-50/50': !ticket.isRead }"
          >
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
                :class="getStatusColor(ticket.status)"
              >
                {{ ticket.status }}
              </span>
            </td>
            <td class="px-6 py-4">
              <div class="flex items-center gap-2">
                <span
                  v-if="!ticket.isRead"
                  class="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"
                  title="Unread"
                />
                <span class="text-sm text-gray-900" :class="{ 'font-semibold': !ticket.isRead }">
                  {{ ticket.subject }}
                </span>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="text-sm text-gray-700">{{ ticket.customerName }}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center gap-1.5">
                <Circle
                  class="w-3 h-3 fill-current"
                  :class="getPriorityColor(ticket.priority)"
                />
                <span class="text-sm" :class="getPriorityColor(ticket.priority)">
                  {{ ticket.priority }}
                </span>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="text-sm text-gray-500">{{ formatDate(ticket.updatedAt) }}</span>
            </td>
          </tr>

          <!-- Empty State -->
          <tr v-if="filteredTickets.length === 0">
            <td colspan="5" class="px-6 py-12 text-center">
              <p class="text-gray-500">No tickets found matching the selected filter.</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
