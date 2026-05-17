<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import { useAppStore } from './stores/app'

const authStore = useAuthStore()
const appStore = useAppStore()

onMounted(() => {
  // Load persisted state from localStorage
  authStore.loadFromLocalStorage()
  appStore.loadFromLocalStorage()

  // Set initial theme
  const htmlElement = document.documentElement
  htmlElement.setAttribute('data-theme', appStore.tema)
})
</script>

<template>
  <div class="w-full min-h-screen" :data-theme="appStore.tema">
    <router-view />
  </div>
</template>

<style scoped>
/* Additional styling if needed */
</style>
