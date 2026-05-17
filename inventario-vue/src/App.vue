<script setup>
import { onMounted, ref } from 'vue'
import { useAuthStore } from './stores/auth'
import { useAppStore } from './stores/app'

const authStore = useAuthStore()
const appStore = useAppStore()

onMounted(() => {
  // Load persisted state from localStorage
  authStore.loadFromLocalStorage()
  appStore.loadFromLocalStorage()
})
</script>

<template>
  <v-app :theme="appStore.tema">
    <router-view />
  </v-app>
</template>
