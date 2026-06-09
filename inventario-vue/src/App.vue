<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useAuthStore } from './stores/auth'
import { useAppStore } from './stores/app'
import MiniCalculadora from './components/MiniCalculadora.vue'

const authStore = useAuthStore()
const appStore  = useAppStore()

const miniCalc    = ref(null)
const lastFocused = ref(null)

function onFocusIn(e) {
  const el = e.target
  if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
    lastFocused.value = el
  }
}

function onKeyDown(e) {
  if (e.key === 'F9') {
    e.preventDefault()
    miniCalc.value?.open(lastFocused.value)
  }
}

onMounted(() => {
  authStore.loadFromLocalStorage()
  appStore.loadFromLocalStorage()
  document.addEventListener('focusin', onFocusIn, true)
  document.addEventListener('keydown', onKeyDown, true)
})

onUnmounted(() => {
  document.removeEventListener('focusin', onFocusIn, true)
  document.removeEventListener('keydown', onKeyDown, true)
})
</script>

<template>
  <v-app :theme="appStore.tema">
    <router-view />
    <MiniCalculadora ref="miniCalc" />
  </v-app>
</template>
