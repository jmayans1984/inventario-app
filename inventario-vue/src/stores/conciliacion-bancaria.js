import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { conciliacionBancariaService } from '../services/conciliacion-bancaria.service'
import { useAuthStore } from './auth'

export const useConciliacionBancariaStore = defineStore('conciliacionBancaria', () => {
  // Estado
  const movimientos = ref([])
  const loading = ref(false)
  const error = ref(null)
  const selectedIds = ref([])
  const filtroEstado = ref('PENDIENTE') // PENDIENTE, CONCILIADO, TODOS

  // Getters
  const movimientosPendientes = computed(() =>
    movimientos.value.filter(m => m.estado === 'PENDIENTE')
  )

  const movimientosConciliados = computed(() =>
    movimientos.value.filter(m => m.estado === 'CONCILIADO')
  )

  const totalMovimientos = computed(() => movimientos.value.length)

  const totalPendiente = computed(() => {
    return movimientos.value
      .filter(m => m.estado === 'PENDIENTE')
      .reduce((sum, m) => sum + parseFloat(m.monto || 0), 0)
  })

  const totalConciliado = computed(() => {
    return movimientos.value
      .filter(m => m.estado === 'CONCILIADO')
      .reduce((sum, m) => sum + parseFloat(m.monto || 0), 0)
  })

  // Actions
  async function fetchMovimientos() {
    loading.value = true
    error.value = null
    try {
      const estado = filtroEstado.value === 'TODOS' ? null : filtroEstado.value
      const data = await conciliacionBancariaService.getMovimientos(estado)
      movimientos.value = Array.isArray(data) ? data : data.data || []
    } catch (err) {
      error.value = err.message
      console.error('Error fetchMovimientos:', err)
    } finally {
      loading.value = false
    }
  }

  async function marcarConciliado(id) {
    loading.value = true
    error.value = null
    try {
      await conciliacionBancariaService.marcarConciliado(id)
      const idx = movimientos.value.findIndex(m => m.id === id)
      if (idx >= 0) {
        movimientos.value[idx].estado = 'CONCILIADO'
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function marcarPendiente(id) {
    loading.value = true
    error.value = null
    try {
      await conciliacionBancariaService.marcarPendiente(id)
      const idx = movimientos.value.findIndex(m => m.id === id)
      if (idx >= 0) {
        movimientos.value[idx].estado = 'PENDIENTE'
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function marcarMultiplesConciliados() {
    if (selectedIds.value.length === 0) return
    loading.value = true
    error.value = null
    try {
      await conciliacionBancariaService.marcarMultiplesConciliados(selectedIds.value)
      selectedIds.value.forEach(id => {
        const idx = movimientos.value.findIndex(m => m.id === id)
        if (idx >= 0) {
          movimientos.value[idx].estado = 'CONCILIADO'
        }
      })
      selectedIds.value = []
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  function setSelectedIds(ids) {
    selectedIds.value = ids
  }

  function setFiltroEstado(estado) {
    filtroEstado.value = estado
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    movimientos,
    loading,
    error,
    selectedIds,
    filtroEstado,

    // Getters
    movimientosPendientes,
    movimientosConciliados,
    totalMovimientos,
    totalPendiente,
    totalConciliado,

    // Actions
    fetchMovimientos,
    marcarConciliado,
    marcarPendiente,
    marcarMultiplesConciliados,
    setSelectedIds,
    setFiltroEstado,
    clearError,
  }
})
