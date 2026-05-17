import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import { proveedoresService } from '../services/proveedores.service'

export const useProveedoresStore = defineStore('proveedores', () => {
  // ─── STATE ───────────────────────────────────────────
  const proveedores = ref([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref(null)
  const selectedIds = ref([])

  const filters = reactive({
    search: '',
    page: 1,
    limit: 20,
    sortBy: 'nombre',
    sortOrder: 'asc',
  })

  // ─── ACTIONS ─────────────────────────────────────────

  /**
   * Cargar proveedores del API con filtros
   */
  async function fetchProveedores() {
    loading.value = true
    error.value = null
    try {
      const params = {
        page: filters.page,
        limit: filters.limit,
        search: filters.search,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      }

      const response = await proveedoresService.getProveedores(params)

      // Manejo flexible de respuesta (puede venir en diferentes formatos)
      if (Array.isArray(response)) {
        proveedores.value = response
        total.value = response.length
      } else if (response.data && Array.isArray(response.data)) {
        proveedores.value = response.data
        total.value = response.total || response.data.length
      } else if (response.proveedores) {
        proveedores.value = response.proveedores
        total.value = response.total || response.proveedores.length
      }
    } catch (err) {
      console.error('Error cargando proveedores:', err)
      error.value = 'API no disponible. Cargando datos de ejemplo...'

      // Fallback: cargar desde localStorage si existe
      const cached = localStorage.getItem('prov_cache')
      if (cached) {
        try {
          proveedores.value = JSON.parse(cached)
          total.value = proveedores.value.length
          error.value = null
        } catch (e) {
          // Si localStorage falla, cargar datos de ejemplo
          cargarDatosEjemplo()
        }
      } else {
        // Si no hay cache, cargar datos de ejemplo
        cargarDatosEjemplo()
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * Crear un nuevo proveedor
   */
  async function crearProveedor(data) {
    loading.value = true
    error.value = null
    try {
      const nuevoProveedor = await proveedoresService.crearProveedor(data)

      // Agregar a la lista local
      if (nuevoProveedor.id) {
        proveedores.value.unshift(nuevoProveedor)
        total.value++

        // Guardar en localStorage como respaldo
        guardarEnCache()

        return nuevoProveedor
      }
    } catch (err) {
      console.error('Error creando proveedor:', err)
      error.value = err.response?.data?.message || 'Error al crear el proveedor'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Actualizar un proveedor existente
   */
  async function actualizarProveedor(id, data) {
    loading.value = true
    error.value = null
    try {
      const proveedorActualizado = await proveedoresService.actualizarProveedor(id, data)

      // Actualizar en la lista local
      const index = proveedores.value.findIndex(p => p.id === id)
      if (index !== -1) {
        proveedores.value[index] = proveedorActualizado

        // Guardar en localStorage como respaldo
        guardarEnCache()

        return proveedorActualizado
      }
    } catch (err) {
      console.error('Error actualizando proveedor:', err)
      error.value = err.response?.data?.message || 'Error al actualizar el proveedor'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Eliminar un proveedor
   */
  async function eliminarProveedor(id) {
    loading.value = true
    error.value = null
    try {
      await proveedoresService.eliminarProveedor(id)

      // Eliminar de la lista local
      const index = proveedores.value.findIndex(p => p.id === id)
      if (index !== -1) {
        proveedores.value.splice(index, 1)
        total.value--

        // Guardar en localStorage como respaldo
        guardarEnCache()
      }
    } catch (err) {
      console.error('Error eliminando proveedor:', err)
      error.value = err.response?.data?.message || 'Error al eliminar el proveedor'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Eliminar múltiples proveedores
   */
  async function eliminarMultiples(ids) {
    loading.value = true
    error.value = null
    try {
      await proveedoresService.eliminarMultiples(ids)

      // Eliminar de la lista local
      proveedores.value = proveedores.value.filter(p => !ids.includes(p.id))
      total.value = proveedores.value.length
      selectedIds.value = []

      // Guardar en localStorage como respaldo
      guardarEnCache()
    } catch (err) {
      console.error('Error en eliminación múltiple:', err)
      error.value = err.response?.data?.message || 'Error al eliminar los proveedores'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Buscar proveedores
   */
  async function buscar(query) {
    if (!query) {
      filters.search = ''
      await fetchProveedores()
      return
    }

    loading.value = true
    error.value = null
    try {
      const resultados = await proveedoresService.buscar(query)
      proveedores.value = Array.isArray(resultados) ? resultados : resultados.data || []
      total.value = proveedores.value.length
    } catch (err) {
      console.error('Error buscando proveedores:', err)
      error.value = 'Error en la búsqueda'
    } finally {
      loading.value = false
    }
  }

  /**
   * Cambiar filtros y recargar
   */
  function setFilters(nuevosFiltros) {
    Object.assign(filters, nuevosFiltros)
    filters.page = 1 // Resetear a primera página
  }

  /**
   * Actualizar selección de IDs
   */
  function setSelectedIds(ids) {
    selectedIds.value = ids
  }

  /**
   * Limpiar error
   */
  function clearError() {
    error.value = null
  }

  /**
   * Guardar en localStorage para respaldo
   */
  function guardarEnCache() {
    try {
      localStorage.setItem('prov_cache', JSON.stringify(proveedores.value))
    } catch (e) {
      console.warn('No se pudo guardar en localStorage:', e)
    }
  }

  /**
   * Cargar datos de ejemplo si no hay API
   */
  function cargarDatosEjemplo() {
    const { useAuthStore } = require('../stores/auth')
    const authStore = useAuthStore()
    const empresaActiva = authStore.empresa

    // Datos de ejemplo con diferentes empresas
    const datosCompletos = [
      // Empresa 1
      {
        id: 1,
        codigo: 'PROV-001',
        nombre: 'Distribuidora ABC',
        direccion: 'Calle Principal 123, Caracas',
        telefono1: '0212-123-4567',
        departamen: 'Logística',
        empresa: 1,
      },
      {
        id: 2,
        codigo: 'PROV-002',
        nombre: 'Importadora XYZ',
        direccion: 'Avenida Bolívar 456, Valencia',
        telefono1: '0241-555-8900',
        departamen: 'Compras',
        empresa: 1,
      },
      {
        id: 3,
        codigo: 'PROV-003',
        nombre: 'Materiales del Este',
        direccion: 'Calle 5 de Julio 789, Maracaibo',
        telefono1: '0261-999-1234',
        departamen: 'Suministros',
        empresa: 1,
      },
      {
        id: 4,
        codigo: 'PROV-004',
        nombre: 'Suministros del Centro',
        direccion: 'Calle Comercio 999, San Cristóbal',
        telefono1: '0276-333-4444',
        departamen: 'Almacén',
        empresa: 1,
      },
      {
        id: 5,
        codigo: 'PROV-005',
        nombre: 'Productos Industriales SA',
        direccion: 'Avenida Industrial 555, Barquisimeto',
        telefono1: '0251-777-8888',
        departamen: 'Administración',
        empresa: 1,
      },
    ]

    // Filtrar por empresa activa
    const datos = datosCompletos.filter(p => p.empresa === empresaActiva || !empresaActiva)

    proveedores.value = datos.length > 0 ? datos : datosCompletos
    total.value = proveedores.value.length
    guardarEnCache()
    error.value = null
  }

  // ─── COMPUTED ────────────────────────────────────────

  const totalProveedores = computed(() => total.value)

  const proveedoresActivos = computed(() =>
    proveedores.value.filter(p => p.estado !== 'INACTIVO')
  )

  const proveedoresInactivos = computed(() =>
    proveedores.value.filter(p => p.estado === 'INACTIVO')
  )

  const paginasTotales = computed(() =>
    Math.ceil(total.value / filters.limit)
  )

  const tieneSeleccionados = computed(() =>
    selectedIds.value.length > 0
  )

  // ─── INITIALIZATION ──────────────────────────────────

  // Intentar cargar desde API al montar el store
  // (se llamará explícitamente desde la vista)

  return {
    // State
    proveedores,
    total,
    loading,
    error,
    selectedIds,
    filters,

    // Actions
    fetchProveedores,
    crearProveedor,
    actualizarProveedor,
    eliminarProveedor,
    eliminarMultiples,
    buscar,
    setFilters,
    setSelectedIds,
    clearError,
    cargarDatosEjemplo,

    // Computed
    totalProveedores,
    proveedoresActivos,
    proveedoresInactivos,
    paginasTotales,
    tieneSeleccionados,
  }
})
