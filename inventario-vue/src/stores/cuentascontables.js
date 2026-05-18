import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import { cuentasContablesService } from '../services/cuentascontables.service'
import { useAuthStore } from './auth'

export const useCuentasContablesStore = defineStore('cuentascontables', () => {
  // ─── STATE ───────────────────────────────────────────
  const cuentasContables = ref([])
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

  async function fetchCuentasContables() {
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
      const response = await cuentasContablesService.getCuentasContables(params)

      if (Array.isArray(response)) {
        cuentasContables.value = response
        total.value = response.length
      } else if (response.data && Array.isArray(response.data)) {
        cuentasContables.value = response.data
        total.value = response.total || response.data.length
      } else if (response.cuentasContables) {
        cuentasContables.value = response.cuentasContables
        total.value = response.total || response.cuentasContables.length
      }
    } catch (err) {
      console.error('Error cargando cuentas contables:', err)
      error.value = 'API no disponible. Cargando datos de ejemplo...'
      const cached = localStorage.getItem('cc_cache_contables')
      if (cached) {
        try {
          cuentasContables.value = JSON.parse(cached)
          total.value = cuentasContables.value.length
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

  async function crearCuentaContable(data) {
    loading.value = true
    error.value = null
    try {
      const nuevo = await cuentasContablesService.crearCuentaContable(data)
      const nuevoCuenta = nuevo.data || nuevo
      cuentasContables.value.unshift(nuevoCuenta)
      total.value++
      guardarEnCache()
      return nuevoCuenta
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al crear la cuenta contable'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function actualizarCuentaContable(codigo, data) {
    loading.value = true
    error.value = null
    try {
      const actualizado = await cuentasContablesService.actualizarCuentaContable(codigo, data)
      const item = actualizado.data || actualizado
      const index = cuentasContables.value.findIndex(c => c.codigo === codigo)
      if (index !== -1) {
        cuentasContables.value[index] = item
        guardarEnCache()
      }
      return item
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al actualizar la cuenta contable'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function toggleEstado(codigo) {
    const idx = cuentasContables.value.findIndex(c => c.codigo === codigo)
    if (idx === -1) return
    const estadoAnterior = cuentasContables.value[idx].estado
    const nuevoEstado = estadoAnterior === 'ACTIVA' ? 'INACTIVA' : 'ACTIVA'
    // Optimistic update — mutar el campo directamente para mantener reactividad
    cuentasContables.value[idx].estado = nuevoEstado
    try {
      await cuentasContablesService.cambiarEstado(codigo, estadoAnterior)
      guardarEnCache()
    } catch (err) {
      // Revertir si la API falla
      cuentasContables.value[idx].estado = estadoAnterior
      error.value = 'Error al cambiar el estado'
    }
  }

  async function eliminarCuentaContable(codigo) {
    loading.value = true
    error.value = null
    try {
      await cuentasContablesService.eliminarCuentaContable(codigo)
      const index = cuentasContables.value.findIndex(c => c.codigo === codigo)
      if (index !== -1) {
        cuentasContables.value.splice(index, 1)
        total.value--
        guardarEnCache()
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al eliminar la cuenta contable'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function eliminarMultiples(codigos) {
    loading.value = true
    error.value = null
    try {
      await cuentasContablesService.eliminarMultiples(codigos)
      cuentasContables.value = cuentasContables.value.filter(c => !codigos.includes(c.codigo))
      total.value = cuentasContables.value.length
      selectedIds.value = []
      guardarEnCache()
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al eliminar las cuentas contables'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function buscar(query) {
    if (!query) {
      filters.search = ''
      await fetchCuentasContables()
      return
    }
    loading.value = true
    error.value = null
    try {
      const resultados = await cuentasContablesService.buscar(query)
      cuentasContables.value = Array.isArray(resultados) ? resultados : resultados.data || []
      total.value = cuentasContables.value.length
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
      localStorage.setItem('cc_cache_contables', JSON.stringify(cuentasContables.value))
    } catch (e) {
      console.warn('No se pudo guardar en localStorage:', e)
    }
  }

  function cargarDatosEjemplo() {
    const authStore = useAuthStore()
    const empresa = authStore.empresa

    const datos = [
      { codigo: '001', nombre: 'ACTIVOS CORRIENTES', grupo_gastos_codigo: 'AST', estado: 'ACTIVA', empresa, iva_descontable: null },
      { codigo: '002', nombre: 'ACTIVOS NO CORRIENTES', grupo_gastos_codigo: 'AST', estado: 'ACTIVA', empresa, iva_descontable: null },
      { codigo: '003', nombre: 'PASIVOS CORRIENTES', grupo_gastos_codigo: 'LIA', estado: 'ACTIVA', empresa, iva_descontable: null },
      { codigo: '004', nombre: 'PASIVOS NO CORRIENTES', grupo_gastos_codigo: 'LIA', estado: 'ACTIVA', empresa, iva_descontable: null },
      { codigo: '005', nombre: 'PATRIMONIO', grupo_gastos_codigo: 'EQU', estado: 'ACTIVA', empresa, iva_descontable: null },
      { codigo: '006', nombre: 'INGRESOS', grupo_gastos_codigo: 'REV', estado: 'ACTIVA', empresa, iva_descontable: null },
      { codigo: '007', nombre: 'COSTOS DE VENTAS', grupo_gastos_codigo: 'COGS', estado: 'ACTIVA', empresa, iva_descontable: null },
      { codigo: '008', nombre: 'GASTOS OPERACIONALES', grupo_gastos_codigo: 'EXP', estado: 'ACTIVA', empresa, iva_descontable: null },
    ]

    cuentasContables.value = datos
    total.value = datos.length
    guardarEnCache()
    error.value = null
  }

  async function getProximoCodigo() {
    try {
      const authStore = useAuthStore()
      const empresa = authStore.empresa
      const response = await cuentasContablesService.getCuentasContables({ empresa, limit: 200 })
      const lista = Array.isArray(response) ? response : response?.data || cuentasContables.value
      let maxNum = 0
      lista.forEach(c => {
        const n = parseInt(c.codigo) || 0
        if (n > maxNum) maxNum = n
      })
      return String(maxNum + 1).padStart(3, '0')
    } catch {
      let maxNum = 0
      cuentasContables.value.forEach(c => {
        const n = parseInt(c.codigo) || 0
        if (n > maxNum) maxNum = n
      })
      return String(maxNum + 1).padStart(3, '0')
    }
  }

  // ─── COMPUTED ────────────────────────────────────────

  const totalCuentasContables = computed(() => total.value)
  const paginasTotales = computed(() => Math.ceil(total.value / filters.limit))
  const tieneSeleccionados = computed(() => selectedIds.value.length > 0)

  return {
    cuentasContables,
    total,
    loading,
    error,
    selectedIds,
    filters,

    fetchCuentasContables,
    getProximoCodigo,
    crearCuentaContable,
    actualizarCuentaContable,
    toggleEstado,
    eliminarCuentaContable,
    eliminarMultiples,
    buscar,
    setFilters,
    clearError,
    cargarDatosEjemplo,

    totalCuentasContables,
    paginasTotales,
    tieneSeleccionados,
  }
})
