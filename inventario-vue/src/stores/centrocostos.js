import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import { centroCostosService } from '../services/centrocostos.service'
import { useAuthStore } from './auth'

export const useCentroCostosStore = defineStore('centrocostos', () => {
  // ─── STATE ───────────────────────────────────────────
  const centrosCostos = ref([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref(null)
  const selectedIds = ref([])

  const filters = reactive({
    search: '',
    page: 1,
    limit: 50,
    sortBy: 'codigo',
    sortOrder: 'asc',
  })

  // ─── ACTIONS ─────────────────────────────────────────

  async function fetchCentrosCostos() {
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
      const response = await centroCostosService.getCentrosCostos(params)

      if (Array.isArray(response)) {
        centrosCostos.value = response
        total.value = response.length
      } else if (response.data && Array.isArray(response.data)) {
        centrosCostos.value = response.data
        total.value = response.total || response.data.length
      } else if (response.centrosCostos) {
        centrosCostos.value = response.centrosCostos
        total.value = response.total || response.centrosCostos.length
      }
    } catch (err) {
      console.error('Error cargando centros de costos:', err)
      error.value = 'API no disponible. Cargando datos de ejemplo...'
      const cached = localStorage.getItem('cc_cache')
      if (cached) {
        try {
          centrosCostos.value = JSON.parse(cached)
          total.value = centrosCostos.value.length
          error.value = null
        } catch (e) {
          cargarDatosEjemplo()
        }
      } else {
        cargarDatosEjemplo()
      }
    } finally {
      loading.value = false
    }
  }

  async function crearCentroCostos(data) {
    loading.value = true
    error.value = null
    try {
      const nuevo = await centroCostosService.crearCentroCostos(data)
      centrosCostos.value.unshift(nuevo.data || nuevo)
      total.value++
      guardarEnCache()
      return nuevo
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al crear el centro de costos'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function actualizarCentroCostos(codigo, data) {
    loading.value = true
    error.value = null
    try {
      const actualizado = await centroCostosService.actualizarCentroCostos(codigo, data)
      const item = actualizado.data || actualizado
      const index = centrosCostos.value.findIndex(c => c.codigo === codigo)
      if (index !== -1) {
        centrosCostos.value[index] = item
        guardarEnCache()
      }
      return item
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al actualizar el centro de costos'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function eliminarCentroCostos(codigo) {
    loading.value = true
    error.value = null
    try {
      await centroCostosService.eliminarCentroCostos(codigo)
      const index = centrosCostos.value.findIndex(c => c.codigo === codigo)
      if (index !== -1) {
        centrosCostos.value.splice(index, 1)
        total.value--
        guardarEnCache()
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al eliminar el centro de costos'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function eliminarMultiples(codigos) {
    loading.value = true
    error.value = null
    try {
      await centroCostosService.eliminarMultiples(codigos)
      centrosCostos.value = centrosCostos.value.filter(c => !codigos.includes(c.codigo))
      total.value = centrosCostos.value.length
      selectedIds.value = []
      guardarEnCache()
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al eliminar los centros de costos'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function buscar(query) {
    if (!query) {
      filters.search = ''
      await fetchCentrosCostos()
      return
    }
    loading.value = true
    error.value = null
    try {
      const resultados = await centroCostosService.buscar(query)
      centrosCostos.value = Array.isArray(resultados) ? resultados : resultados.data || []
      total.value = centrosCostos.value.length
    } catch (err) {
      error.value = 'Error en la búsqueda'
    } finally {
      loading.value = false
    }
  }

  function setFilters(nuevosFiltros) {
    Object.assign(filters, nuevosFiltros)
    filters.page = 1
  }

  function clearError() {
    error.value = null
  }

  function guardarEnCache() {
    try {
      localStorage.setItem('cc_cache', JSON.stringify(centrosCostos.value))
    } catch (e) {
      console.warn('No se pudo guardar en localStorage:', e)
    }
  }

  function cargarDatosEjemplo() {
    const authStore = useAuthStore()
    const empresa = authStore.empresa

    const datos = [
      { codigo: 'ADM', nombre: 'Administración',        empresa, square_location_id: '' },
      { codigo: 'VEN', nombre: 'Ventas',                empresa, square_location_id: '' },
      { codigo: 'PRO', nombre: 'Producción',            empresa, square_location_id: '' },
      { codigo: 'LOG', nombre: 'Logística',             empresa, square_location_id: '' },
      { codigo: 'MKT', nombre: 'Marketing',             empresa, square_location_id: '' },
      { codigo: 'RRH', nombre: 'Recursos Humanos',      empresa, square_location_id: '' },
      { codigo: 'TIC', nombre: 'Tecnología',            empresa, square_location_id: '' },
      { codigo: 'FIN', nombre: 'Finanzas',              empresa, square_location_id: '' },
    ]

    centrosCostos.value = datos
    total.value = datos.length
    guardarEnCache()
    error.value = null
  }

  // ─── COMPUTED ────────────────────────────────────────

  const totalCentrosCostos = computed(() => total.value)
  const paginasTotales = computed(() => Math.ceil(total.value / filters.limit))
  const tieneSeleccionados = computed(() => selectedIds.value.length > 0)

  return {
    centrosCostos,
    total,
    loading,
    error,
    selectedIds,
    filters,

    fetchCentrosCostos,
    crearCentroCostos,
    actualizarCentroCostos,
    eliminarCentroCostos,
    eliminarMultiples,
    buscar,
    setFilters,
    clearError,
    cargarDatosEjemplo,

    totalCentrosCostos,
    paginasTotales,
    tieneSeleccionados,
  }
})
