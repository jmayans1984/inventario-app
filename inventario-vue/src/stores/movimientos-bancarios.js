import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { movimientosBancariosService } from '../services/movimientos-bancarios.service'

export const useMovimientosBancariosStore = defineStore('movimientosBancarios', () => {
  // Estado
  const movimientos = ref([])
  const loading = ref(false)
  const error = ref(null)
  const filtros = ref({
    tipo: 'TODOS',           // TODOS, ING (ingresos), EGR (egresos)
    banco: '',              // Filtrar por banco
    busqueda: '',           // Búsqueda por concepto/beneficiario
    fechaInicio: null,
    fechaFin: null
  })

  // Getters
  const movimientosIngresos = computed(() =>
    movimientos.value.filter(m => parseFloat(m.ingreso || 0) > 0)
  )

  const movimientosEgresos = computed(() =>
    movimientos.value.filter(m => parseFloat(m.egreso || 0) > 0)
  )

  const totalMovimientos = computed(() => movimientos.value.length)

  const totalIngresos = computed(() => {
    return movimientos.value
      .reduce((sum, m) => sum + parseFloat(m.ingreso || 0), 0)
  })

  const totalEgresos = computed(() => {
    return movimientos.value
      .reduce((sum, m) => sum + parseFloat(m.egreso || 0), 0)
  })

  const saldoNeto = computed(() => totalIngresos.value - totalEgresos.value)

  const movimientosFiltrados = computed(() => {
    let filtered = [...movimientos.value]

    // Filtro por tipo
    if (filtros.value.tipo === 'ING') {
      filtered = filtered.filter(m => parseFloat(m.ingreso || 0) > 0)
    } else if (filtros.value.tipo === 'EGR') {
      filtered = filtered.filter(m => parseFloat(m.egreso || 0) > 0)
    }

    // Filtro por banco
    if (filtros.value.banco) {
      filtered = filtered.filter(m =>
        m.banco && m.banco.toLowerCase().includes(filtros.value.banco.toLowerCase())
      )
    }

    // Filtro por búsqueda (concepto o beneficiario)
    if (filtros.value.busqueda.trim()) {
      const q = filtros.value.busqueda.toLowerCase()
      filtered = filtered.filter(m =>
        (m.concepto && m.concepto.toLowerCase().includes(q)) ||
        (m.referencia && m.referencia.toLowerCase().includes(q))
      )
    }

    return filtered
  })

  const bancos = computed(() => {
    const bancoSet = new Set()
    movimientos.value.forEach(m => {
      if (m.banco) bancoSet.add(m.banco)
    })
    return Array.from(bancoSet).sort()
  })

  // Actions
  async function fetchMovimientos() {
    loading.value = true
    error.value = null
    try {
      const data = await movimientosBancariosService.getMovimientos()
      movimientos.value = Array.isArray(data.data) ? data.data : data.data?.data || []
    } catch (err) {
      error.value = err.message
      console.error('Error fetchMovimientos:', err)
    } finally {
      loading.value = false
    }
  }

  function setFiltros(nuevosFiltros) {
    filtros.value = { ...filtros.value, ...nuevosFiltros }
  }

  function clearFiltros() {
    filtros.value = {
      tipo: 'TODOS',
      banco: '',
      busqueda: '',
      fechaInicio: null,
      fechaFin: null
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    movimientos,
    loading,
    error,
    filtros,

    // Getters
    movimientosIngresos,
    movimientosEgresos,
    totalMovimientos,
    totalIngresos,
    totalEgresos,
    saldoNeto,
    movimientosFiltrados,
    bancos,

    // Actions
    fetchMovimientos,
    setFiltros,
    clearFiltros,
    clearError,
  }
})
