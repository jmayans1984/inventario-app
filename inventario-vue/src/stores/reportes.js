import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { reportesService } from '../services/reportes.service'

export const useReportesStore = defineStore('reportes', () => {
  // Estado compartido
  const loading = ref(false)
  const error = ref(null)
  const exportando = ref(false)

  // Reporte de Conciliación
  const conciliacionData = ref({
    pendientes: [],
    conciliados: [],
    resumen: {}
  })

  // Reporte de Movimientos
  const movimientosData = ref({
    movimientos: [],
    resumen: {}
  })

  // Reporte de Ventas por Período
  const ventasPeriodoData = ref({
    ventas: [],
    resumen: {}
  })

  // Reporte de Ventas por Productos
  const ventasProductosData = ref({
    productos: [],
    resumen: {}
  })

  // Filtros
  const filtros = ref({
    fechaInicio: null,
    fechaFin: null,
    banco: '',
    cliente: '',
    producto: ''
  })

  // ========== GETTERS ==========

  const totalPendiente = computed(() => {
    return (conciliacionData.value.resumen?.total_pendiente || 0)
  })

  const totalConciliado = computed(() => {
    return (conciliacionData.value.resumen?.total_conciliado || 0)
  })

  const porcentajeConciliacion = computed(() => {
    const total = totalPendiente.value + totalConciliado.value
    if (total === 0) return 0
    return Math.round((totalConciliado.value / total) * 100)
  })

  // ========== ACTIONS ==========

  async function fetchReporteConciliacion(params = {}) {
    loading.value = true
    error.value = null

    try {
      const response = await reportesService.getReporteConciliacion(params)
      conciliacionData.value = response.data || {
        pendientes: [],
        conciliados: [],
        resumen: {}
      }
      return true
    } catch (err) {
      error.value = err.message
      console.error('Error fetchReporteConciliacion:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  async function fetchReporteMovimientos(params = {}) {
    loading.value = true
    error.value = null

    try {
      const response = await reportesService.getReporteMovimientos(params)
      movimientosData.value = response.data || {
        movimientos: [],
        resumen: {}
      }
      return true
    } catch (err) {
      error.value = err.message
      console.error('Error fetchReporteMovimientos:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  async function fetchReporteVentasPeriodo(params = {}) {
    loading.value = true
    error.value = null

    try {
      const response = await reportesService.getReporteVentasPeriodo(params)
      ventasPeriodoData.value = response.data || {
        ventas: [],
        resumen: {}
      }
      return true
    } catch (err) {
      error.value = err.message
      console.error('Error fetchReporteVentasPeriodo:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  async function fetchReporteVentasProductos(params = {}) {
    loading.value = true
    error.value = null

    try {
      const response = await reportesService.getReporteVentasProductos(params)
      ventasProductosData.value = response.data || {
        productos: [],
        resumen: {}
      }
      return true
    } catch (err) {
      error.value = err.message
      console.error('Error fetchReporteVentasProductos:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  async function exportarPDF(tipo, datos) {
    exportando.value = true
    error.value = null

    try {
      await reportesService.exportarPDF(tipo, datos)
      return true
    } catch (err) {
      error.value = err.message
      console.error('Error exportando PDF:', err)
      return false
    } finally {
      exportando.value = false
    }
  }

  async function exportarExcel(tipo, datos) {
    exportando.value = true
    error.value = null

    try {
      await reportesService.exportarExcel(tipo, datos)
      return true
    } catch (err) {
      error.value = err.message
      console.error('Error exportando Excel:', err)
      return false
    } finally {
      exportando.value = false
    }
  }

  function setFiltros(nuevosFiltros) {
    filtros.value = { ...filtros.value, ...nuevosFiltros }
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    loading,
    error,
    exportando,
    conciliacionData,
    movimientosData,
    ventasPeriodoData,
    ventasProductosData,
    filtros,

    // Getters
    totalPendiente,
    totalConciliado,
    porcentajeConciliacion,

    // Actions
    fetchReporteConciliacion,
    fetchReporteMovimientos,
    fetchReporteVentasPeriodo,
    fetchReporteVentasProductos,
    exportarPDF,
    exportarExcel,
    setFiltros,
    clearError
  }
})
