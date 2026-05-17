import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // State
  const usuario = ref(null)
  const empresa = ref(null)
  const empresaNombre = ref(null)
  const isAuthenticated = ref(false)
  const modoApp = ref('light')

  // Computed
  const userName = computed(() => usuario.value?.usuario || '')
  const userNombre = computed(() => usuario.value?.nombre || '')
  const userNivel = computed(() => usuario.value?.nivel || '')
  const empresaCodigo = computed(() => empresa.value || '')

  // Actions
  function setUsuario(usuarioData) {
    usuario.value = usuarioData
    isAuthenticated.value = !!usuarioData

    // Persist to localStorage
    if (usuarioData) {
      localStorage.setItem('usuario', JSON.stringify(usuarioData))
    } else {
      localStorage.removeItem('usuario')
    }
  }

  function setEmpresa(empresaCod, nombre = null) {
    empresa.value = empresaCod
    empresaNombre.value = nombre

    // Persist to localStorage
    localStorage.setItem('empresaActual', empresaCod)
  }

  function setModoApp(modo) {
    modoApp.value = modo
    localStorage.setItem('modoApp', modo)
  }

  function logout() {
    usuario.value = null
    empresa.value = null
    empresaNombre.value = null
    isAuthenticated.value = false

    localStorage.removeItem('usuario')
    localStorage.removeItem('empresaActual')
  }

  function loadFromLocalStorage() {
    const savedUsuario = localStorage.getItem('usuario')
    const savedEmpresa = localStorage.getItem('empresaActual')
    const savedModo = localStorage.getItem('modoApp')

    if (savedUsuario) {
      try {
        usuario.value = JSON.parse(savedUsuario)
        isAuthenticated.value = true
      } catch (e) {
        console.error('Error parsing usuario from localStorage:', e)
      }
    }

    if (savedEmpresa) {
      empresa.value = savedEmpresa
    }

    if (savedModo) {
      modoApp.value = savedModo
    }
  }

  return {
    // State
    usuario,
    empresa,
    empresaNombre,
    isAuthenticated,
    modoApp,

    // Computed
    userName,
    userNombre,
    userNivel,
    empresaCodigo,

    // Actions
    setUsuario,
    setEmpresa,
    setModoApp,
    logout,
    loadFromLocalStorage,
  }
})
