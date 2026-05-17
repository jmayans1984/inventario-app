<template>
  <aside
    class="w-64 bg-gradient-to-b from-blue-900 via-blue-800 to-purple-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-white shadow-lg flex flex-col"
  >
    <!-- Logo Section -->
    <div class="p-6 border-b border-white border-opacity-10">
      <div class="flex items-center gap-3 mb-2">
        <span class="text-2xl">📊</span>
        <div>
          <h2 class="text-xl font-bold">ERP Pro</h2>
          <p class="text-xs text-blue-200 dark:text-gray-400">Sistema Integral</p>
        </div>
      </div>
    </div>

    <!-- Navigation Menu -->
    <nav class="flex-1 overflow-y-auto py-4">
      <ul class="space-y-1 px-3">
        <li v-for="module in modules" :key="module.id">
          <router-link
            :to="module.path"
            :class="[
              'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300',
              'hover:bg-white hover:bg-opacity-10',
              isActive(module.path)
                ? 'bg-blue-400 bg-opacity-30 border-l-4 border-blue-300 text-white font-semibold'
                : 'text-blue-100 dark:text-gray-300 border-l-4 border-transparent',
            ]"
          >
            <span class="text-lg">{{ module.icon }}</span>
            <span class="text-sm">{{ module.name }}</span>
          </router-link>
        </li>
      </ul>
    </nav>

    <!-- Footer -->
    <div class="p-4 border-t border-white border-opacity-10">
      <div class="text-xs text-blue-200 dark:text-gray-500 text-center">
        <p>{{ userInfo }}</p>
        <p class="text-opacity-75">v2.0</p>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { MODULES } from '../../utils/constants'

const route = useRoute()
const authStore = useAuthStore()

const modules = computed(() => MODULES)

const userInfo = computed(() => {
  const userName = authStore.userName || 'Usuario'
  return `${userName}`
})

const isActive = (path) => {
  return route.path === path
}
</script>

<style scoped>
/* Custom scrollbar for sidebar */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
