import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { API_BASE } from '../utils/constants'

export const useAuthStore = defineStore('auth', () => {
  // State
  const usuario = ref(null)
  const empresa = ref(null)
  const empresaNombre = ref(null)
  const empresaTipo = ref(null)
  const isAuthenticated = ref(false)
  const modoApp = ref('light')
  const modulosDeshabilitados = ref([])  // array de rutas deshabilitadas para esta empresa
  // Promesa de la carga de permisos en curso. El guard del router la espera:
  // si no, al entrar por URL directa evaluaría la lista todavía vacía y dejaría
  // pasar al usuario a una ruta que tiene prohibida.
  let permisosPendientes = null

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

  // Los permisos de EMPRESA (lo que un proveedor le habilita a su cliente) solo
  // aplican a empresas CLIENTE. Los permisos por USUARIO aplican siempre: un
  // usuario de almacén está limitado igual, sea la empresa CLIENTE o PROVEEDOR.
  async function cargarPermisos(empresaCod, tipoEmpresa = null) {
    const tarea = (async () => {
    const combinadas = new Set()

    if (tipoEmpresa !== 'PROVEEDOR') {
      try {
        const r = await fetch(`${API_BASE}/permisos-modulos/${empresaCod}`)
        const j = await r.json()
        if (j.success) {
          ;[...(j.data?.rutas_deshabilitadas || []), ...(j.data?.rutas_deshabilitadas_completa || [])]
            .forEach(p => combinadas.add(p))
        }
      } catch { /* sin permisos de cliente */ }
    }

    const usuarioCodigo = usuario.value?.codigo
    if (usuarioCodigo) {
      try {
        const r = await fetch(`${API_BASE}/permisos-usuarios/${empresaCod}/${usuarioCodigo}`)
        const j = await r.json()
        if (j.success) {
          ;[...(j.data?.rutas_deshabilitadas || []), ...(j.data?.rutas_deshabilitadas_completa || [])]
            .forEach(p => combinadas.add(p))
        }
      } catch { /* sin permisos de usuario */ }
    }

    modulosDeshabilitados.value = Array.from(combinadas)
    })()
    permisosPendientes = tarea
    return tarea
  }

  /** Espera a que termine la carga de permisos en curso, si la hay. */
  async function esperarPermisos() {
    if (permisosPendientes) {
      try { await permisosPendientes } catch { /* si falla, se evalúa con lo que haya */ }
    }
  }

  /** ¿Esta ruta está bloqueada para el usuario actual? Se usa tanto en el menú
   *  lateral como en el guard del router: ocultar la opción no basta, hay que
   *  bloquear también la navegación directa por URL. */
  function rutaBloqueada(path) {
    if (!path) return false
    const dis = modulosDeshabilitados.value
    if (!dis || !dis.length) return false
    return dis.some(d => path === d || path.startsWith(d + '/'))
  }

  // El mismo usuario/clave tiene una fila (y un codigo) distinto por cada
  // empresa a la que tiene acceso. Se corrige aquí para que quede el codigo
  // correcto de la empresa seleccionada, no el de la primera fila que
  // matcheó el login — de lo contrario, todo lo que se guarda "por usuario"
  // (favoritos, atajos, etc.) queda mezclado entre empresas.
  function setUsuarioCodigo(codigo) {
    if (!usuario.value || !codigo) return
    usuario.value = { ...usuario.value, codigo }
    localStorage.setItem('usuario', JSON.stringify(usuario.value))
  }

  function setEmpresa(empresaCod, nombre = null, tipo = null) {
    empresa.value = empresaCod
    empresaNombre.value = nombre
    empresaTipo.value = tipo

    // Persist to localStorage
    localStorage.setItem('empresaActual', empresaCod)
    if (nombre) localStorage.setItem('empresaNombre', nombre)
    // Siempre guardar tipo (aunque sea null/vacío, guardar string vacío)
    localStorage.setItem('empresaTipo', tipo || '')

    // Los permisos por usuario aplican a cualquier tipo de empresa; dentro de
    // cargarPermisos se decide si además se piden los permisos de empresa.
    if (empresaCod) {
      cargarPermisos(empresaCod, tipo)
    } else {
      modulosDeshabilitados.value = []
    }
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
    modulosDeshabilitados.value = []

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
      empresaTipo.value = savedTipo || null  // carga siempre (null si vacío)

      // Al restaurar sesión se recargan igual que en el login
      if (savedEmpresa) {
        cargarPermisos(savedEmpresa, savedTipo || null)
      }
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
    modulosDeshabilitados,

    // Computed
    userName,
    userNombre,
    userNivel,
    empresaCodigo,

    // Actions
    setUsuario,
    setUsuarioCodigo,
    setEmpresa,
    setModoApp,
    logout,
    loadFromLocalStorage,
    cargarPermisos,
    rutaBloqueada,
    esperarPermisos,
  }
})
