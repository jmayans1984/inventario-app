import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import { gestionGastosService } from '../services/gestiongastos.service'
import { useAuthStore } from './auth'

export const useGestionGastosStore = defineStore('gestiongastos', () => {
  // ─── STATE ────────────────────────────────────────────
  const gastos = ref([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref(null)
  const selectedIds = ref([])

  const filters = reactive({
    search: '',
    page: 1,
    limit: 50,
    sortBy: 'fecha',
    sortOrder: 'desc',
  })

  // ─── ACTIONS ───────────────────────────────────────────

  async function fetchGastos() {
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
      const response = await gestionGastosService.getGastos(params)

      if (Array.isArray(response)) {
        gastos.value = response
        total.value = response.length
      } else if (response.data && Array.isArray(response.data)) {
        gastos.value = response.data
        total.value = response.total || response.data.length
      } else if (response.gastos) {
        gastos.value = response.gastos
        total.value = response.total || response.gastos.length
      }
    } catch (err) {
      console.error('Error cargando gastos:', err)
      error.value = 'API no disponible. Cargando datos de ejemplo...'
      const cached = localStorage.getItem('gastos_cache')
      if (cached) {
        try {
          gastos.value = JSON.parse(cached)
          total.value = gastos.value.length
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

  async function crearGasto(data) {
    loading.value = true
    error.value = null
    try {
      const nuevo = await gestionGastosService.crearGasto(data)
      const nuevoGasto = nuevo.data || nuevo
      gastos.value.unshift(nuevoGasto)
      total.value++
      guardarEnCache()
      return nuevoGasto
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al crear el gasto'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function actualizarGasto(codigo, data) {
    loading.value = true
    error.value = null
    try {
      const actualizado = await gestionGastosService.actualizarGasto(codigo, data)
      const item = actualizado.data || actualizado
      const index = gastos.value.findIndex(g => g.codigo === codigo)
      if (index !== -1) {
        gastos.value[index] = item
        guardarEnCache()
      }
      return item
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al actualizar el gasto'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function eliminarGasto(codigo) {
    loading.value = true
    error.value = null
    try {
      await gestionGastosService.eliminarGasto(codigo)
      const index = gastos.value.findIndex(g => g.codigo === codigo)
      if (index !== -1) {
        gastos.value.splice(index, 1)
        total.value--
        guardarEnCache()
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al eliminar el gasto'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function getProximoCodigo() {
    try {
      return await gestionGastosService.getProximoCodigo()
    } catch (err) {
      console.error('Error obteniendo próximo código:', err)
      // Generar uno local como fallback
      if (gastos.value.length === 0) return '001'
      const maxCodigo = Math.max(...gastos.value.map(g => parseInt(g.codigo) || 0))
      return String(maxCodigo + 1).padStart(3, '0')
    }
  }

  function setFilters(newFilters) {
    Object.assign(filters, newFilters)
  }

  function setSelectedIds(ids) {
    selectedIds.value = ids
  }

  function guardarEnCache() {
    localStorage.setItem('gastos_cache', JSON.stringify(gastos.value))
  }

  function cargarDatosEjemplo() {
    const authStore = useAuthStore()
    const empresa = authStore.empresa
    const hoy = new Date()

    gastos.value = [
      {
        codigo: '001',
        fecha: hoy.toISOString().split('T')[0],
        numero_factura: 'FAC-2026-0001',
        proveedor_id: 1,
        proveedor_nombre: 'Distribuidora ABC',
        centro_costos_id: 'CC001',
        centro_costos_nombre: 'Centro Principal',
        forma_pago: 'CREDITO_30',
        cuenta_contable_id: '002',
        cuenta_contable_nombre: 'Gastos de Personal',
        concepto: 'COMPRA MATERIA PRIMA',
        valor_base: 1500000,
        impuestos: 300000,
        total: 1800000,
        empresa: empresa,
        created_at: new Date().toISOString(),
      },
    ]
    total.value = gastos.value.length
  }

  // ─── COMPUTED ──────────────────────────────────────────

  const totalGastos = computed(() => gastos.value.length)

  const valorTotal = computed(() =>
    gastos.value.reduce((sum, g) => sum + (g.total || 0), 0)
  )

  const totalImpuestos = computed(() =>
    gastos.value.reduce((sum, g) => sum + (g.impuestos || 0), 0)
  )

  const gastosMesActual = computed(() => {
    const hoy = new Date()
    const mesActual = hoy.getMonth()
    const anioActual = hoy.getFullYear()

    return gastos.value
      .filter(g => {
        const fecha = new Date(g.fecha)
        return fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual
      })
      .reduce((sum, g) => sum + (g.total || 0), 0)
  })

  const paginasTotales = computed(() => Math.ceil(total.value / filters.limit))

  const tieneSeleccionados = computed(() => selectedIds.value.length > 0)

  return {
    // State
    gastos,
    total,
    loading,
    error,
    selectedIds,
    filters,

    // Actions
    fetchGastos,
    crearGasto,
    actualizarGasto,
    eliminarGasto,
    getProximoCodigo,
    setFilters,
    setSelectedIds,

    // Computed
    totalGastos,
    valorTotal,
    totalImpuestos,
    gastosMesActual,
    paginasTotales,
    tieneSeleccionados,
  }
})
