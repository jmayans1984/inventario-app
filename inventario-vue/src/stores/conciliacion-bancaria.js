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
  const filtroEstado = ref('PENDIENTE')
  const bancoSeleccionado = ref(null)

  // Saldos del resumen
  const saldoInicialConciliado = ref(0)
  const ingresosPendientes = ref(0)
  const egresosPendientes = ref(0)
  const saldoFinalConciliado = ref(0)

  // Getters — la API ya devuelve solo los NO conciliados
  const movimientosPendientes = computed(() =>
    movimientos.value.filter(m => (m.conciliado || 'NO') === 'NO')
  )

  const movimientosConciliados = computed(() =>
    movimientos.value.filter(m => m.conciliado === 'SI')
  )

  const totalMovimientos = computed(() => movimientos.value.length)

  const totalPendiente = computed(() => {
    // moviban.conciliado='NO' → pendientes (toda la lista viene filtrada por NO)
    return movimientos.value.reduce((sum, m) =>
      sum + parseFloat(m.ingreso || 0) + parseFloat(m.egreso || 0), 0)
  })

  const totalConciliado = computed(() => {
    // Los conciliados en sesión ya no están en la lista (se filtran por conciliado=NO)
    return 0
  })

  // Actions
  async function fetchMovimientos() {
    if (!bancoSeleccionado.value) {
      movimientos.value = []
      return
    }
    loading.value = true
    error.value = null
    try {
      // Cargar movimientos pendientes y resumen en paralelo
      const [dataMovs, dataResumen] = await Promise.all([
        conciliacionBancariaService.getMovimientos(bancoSeleccionado.value),
        conciliacionBancariaService.getResumen(bancoSeleccionado.value)
      ])
      movimientos.value = Array.isArray(dataMovs) ? dataMovs : dataMovs.data || []

      if (dataResumen?.data) {
        saldoInicialConciliado.value = dataResumen.data.saldo_inicial_conciliado || 0
        ingresosPendientes.value     = dataResumen.data.ingresos_pendientes      || 0
        egresosPendientes.value      = dataResumen.data.egresos_pendientes       || 0
        saldoFinalConciliado.value   = dataResumen.data.saldo_final_conciliado   || 0
      }
    } catch (err) {
      error.value = err.message
      console.error('Error fetchMovimientos:', err)
    } finally {
      loading.value = false
    }
  }

  function setBanco(codigo) {
    bancoSeleccionado.value = codigo
    selectedIds.value = []
    saldoInicialConciliado.value = 0
    ingresosPendientes.value = 0
    egresosPendientes.value = 0
    saldoFinalConciliado.value = 0
  }

  async function marcarConciliado(numero) {
    loading.value = true
    error.value = null
    try {
      await conciliacionBancariaService.marcarConciliado(numero)
      // Quitar de la lista (la vista solo muestra NO conciliados)
      movimientos.value = movimientos.value.filter(m => m.numero !== numero)
      // Actualizar resumen de KPIs
      await actualizarResumen()
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function marcarPendiente(numero) {
    loading.value = true
    error.value = null
    try {
      await conciliacionBancariaService.marcarPendiente(numero)
      movimientos.value = movimientos.value.filter(m => m.numero !== numero)
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
      // Quitar de la lista todos los conciliados
      movimientos.value = movimientos.value.filter(m => !selectedIds.value.includes(m.numero))
      selectedIds.value = []
      // Actualizar resumen de KPIs
      await actualizarResumen()
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

  async function actualizarResumen() {
    if (!bancoSeleccionado.value) return
    try {
      const dataResumen = await conciliacionBancariaService.getResumen(bancoSeleccionado.value)
      if (dataResumen?.data) {
        saldoInicialConciliado.value = dataResumen.data.saldo_inicial_conciliado || 0
        ingresosPendientes.value     = dataResumen.data.ingresos_pendientes      || 0
        egresosPendientes.value      = dataResumen.data.egresos_pendientes       || 0
        saldoFinalConciliado.value   = dataResumen.data.saldo_final_conciliado   || 0
      }
    } catch (err) {
      console.error('Error actualizarResumen:', err)
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
    selectedIds,
    filtroEstado,
    bancoSeleccionado,
    saldoInicialConciliado,
    ingresosPendientes,
    egresosPendientes,
    saldoFinalConciliado,

    // Getters
    movimientosPendientes,
    movimientosConciliados,
    totalMovimientos,
    totalPendiente,
    totalConciliado,

    // Actions
    fetchMovimientos,
    actualizarResumen,
    marcarConciliado,
    marcarPendiente,
    marcarMultiplesConciliados,
    setSelectedIds,
    setFiltroEstado,
    setBanco,
    clearError,
  }
})
