import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // State
  const usuario = ref(null)
  const empresa = ref(null)
  const empresaNombre = ref(null)
  const empresaTipo = ref(null)
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

  function setEmpresa(empresaCod, nombre = null, tipo = null) {
    empresa.value = empresaCod
    empresaNombre.value = nombre
    empresaTipo.value = tipo

    // Persist to localStorage
    localStorage.setItem('empresaActual', empresaCod)
    if (nombre) localStorage.setItem('empresaNombre', nombre)
    if (tipo) localStorage.setItem('empresaTipo', tipo)
  }

  function setModoApp(modo) {
    modoApp.value = modo
    localStorage.setItem('modoApp', modo)
  }

  function logout() {
    usuario.value = null
    empresa.value = null
    empresaNombre.value = null
    empresaTipo.value = null
    isAuthenticated.value = false

    localStorage.removeItem('usuario')
    localStorage.removeItem('empresaActual')
    localStorage.removeItem('empresaNombre')
    localStorage.removeItem('empresaTipo')
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
      const savedNombre = localStorage.getItem('empresaNombre')
      if (savedNombre) empresaNombre.value = savedNombre
      const savedTipo = localStorage.getItem('empresaTipo')
      if (savedTipo) empresaTipo.value = savedTipo
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
    empresaTipo,
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
