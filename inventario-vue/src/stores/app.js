import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
  // State
  const tema = ref('light') // 'light' or 'dark'
  const sidebarOpen = ref(true)
  const currentModule = ref('dashboard')
  const loading = ref(false)

  // Computed
  const isDarkMode = computed(() => tema.value === 'dark')

  // Actions
  function setTema(nuevoTema) {
    tema.value = nuevoTema
    document.documentElement.setAttribute('data-theme', nuevoTema)
    localStorage.setItem('tema', nuevoTema)
  }

  function toggleTema() {
    const nuevoTema = tema.value === 'light' ? 'dark' : 'light'
    setTema(nuevoTema)
  }

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
  }

  function setSidebarOpen(state) {
    sidebarOpen.value = state
  }

  function setCurrentModule(modulo) {
    currentModule.value = modulo
  }

  function setLoading(state) {
    loading.value = state
  }

  function loadFromLocalStorage() {
    const savedTema = localStorage.getItem('tema')
    if (savedTema) {
      setTema(savedTema)
    }
  }

  return {
    // State
    tema,
    sidebarOpen,
    currentModule,
    loading,

    // Computed
    isDarkMode,

    // Actions
    setTema,
    toggleTema,
    toggleSidebar,
    setSidebarOpen,
    setCurrentModule,
    setLoading,
    loadFromLocalStorage,
  }
})
