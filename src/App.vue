<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import DefaultLayout from '@/components/layout/DefaultLayout.vue'

const route = useRoute()

// Check if current route should use layout
const useLayout = computed(() => {
  return route.meta.layout !== 'none'
})
</script>

<template>
  <!-- Routes with layout -->
  <DefaultLayout v-if="useLayout">
    <router-view />
  </DefaultLayout>
  
  <!-- Routes without layout (e.g., Login) -->
  <router-view v-else />
</template>

