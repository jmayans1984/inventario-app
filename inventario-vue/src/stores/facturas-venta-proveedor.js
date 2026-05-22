import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { facturasVentaProveedorService } from '../services/facturas-venta-proveedor.service'

export const useFacturasVentaProveedorStore = defineStore('facturasVentaProveedor', () => {

  // ── Estado ───────────────────────────────────────────────────────────────
  const facturas         = ref([])
  const soportesPagoActual = ref([])
  const saldoFavorActual = ref(0)
  const loading          = ref(false)
  const error            = ref(null)
  const filtroEstado     = ref('TODOS')   // proveedor ve todo por defecto

  // ── Getters ──────────────────────────────────────────────────────────────
  const facturasFiltradas = computed(() => {
    if (filtroEstado.value === 'TODOS') return facturas.value
    return facturas.value.filter(f => f.estado === filtroEstado.value)
  })

  const facturasPendientes = computed(() =>
    facturas.value.filter(f => f.estado === 'PENDIENTE')
  )

  const facturasPorVerificar = computed(() =>
    facturas.value.filter(f => f.estado === 'POR VERIFICAR')
  )

  const facturasPagadas = computed(() =>
    facturas.value.filter(f => f.estado === 'PAGADA')
  )

  const totalPendiente = computed(() =>
    facturasPendientes.value.reduce(
      (sum, f) => sum + (parseFloat(f.total || 0) - parseFloat(f.valor_pagado || 0)), 0
    )
  )

  const totalPorVerificar = computed(() => facturasPorVerificar.value.length)

  const porcentajeCobrado = computed(() => {
    const total = facturas.value.reduce((s, f) => s + parseFloat(f.total || 0), 0)
    if (total === 0) return 0
    const pagado = facturas.value.reduce((s, f) => s + parseFloat(f.valor_pagado || 0), 0)
    return ((pagado / total) * 100).toFixed(1)
  })

  // ── Actions ──────────────────────────────────────────────────────────────

  async function fetchFacturas() {
    loading.value = true
    error.value = null
    try {
      const data = await facturasVentaProveedorService.getFacturas({ estado: 'TODOS' })
      facturas.value = Array.isArray(data) ? data : (data.data || [])
    } catch (err) {
      error.value = err.message
      console.error('Error fetchFacturas (proveedor):', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchSoportesPago(codigo) {
    try {
      const data = await facturasVentaProveedorService.getSoportesPago(codigo)
      soportesPagoActual.value = Array.isArray(data) ? data : (data.data || [])
    } catch (err) {
      console.error('Error fetchSoportesPago:', err)
      soportesPagoActual.value = []
    }
  }

  async function fetchSaldoFavor(cliente) {
    try {
      const data = await facturasVentaProveedorService.getSaldoFavor(cliente)
      saldoFavorActual.value = data?.data?.saldo || 0
    } catch (err) {
      console.error('Error fetchSaldoFavor:', err)
      saldoFavorActual.value = 0
    }
  }

  async function aprobarPago(codigo, dataPago) {
    loading.value = true
    error.value = null
    try {
      const result = await facturasVentaProveedorService.aprobarPago(codigo, dataPago)
      // Actualizar la factura en memoria sin recargar todo
      const idx = facturas.value.findIndex(f => f.codigo === codigo)
      if (idx !== -1 && result.data) {
        facturas.value[idx].estado       = result.data.estado
        facturas.value[idx].valor_pagado = result.data.valor_pagado
      }
      return result
    } catch (err) {
      error.value = err.response?.data?.error || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function descargarSoporte(idSoporte) {
    try {
      const result = await facturasVentaProveedorService.descargarSoporte(idSoporte)
      const url = window.URL.createObjectURL(result.data)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  function setFiltroEstado(estado) {
    filtroEstado.value = estado
  }

  function limpiarSoportes() {
    soportesPagoActual.value = []
    saldoFavorActual.value = 0
  }

  function clearError() {
    error.value = null
  }

  // ── Exponer ───────────────────────────────────────────────────────────────
  return {
    // State
    facturas,
    soportesPagoActual,
    saldoFavorActual,
    loading,
    error,
    filtroEstado,

    // Getters
    facturasFiltradas,
    facturasPendientes,
    facturasPorVerificar,
    facturasPagadas,
    totalPendiente,
    totalPorVerificar,
    porcentajeCobrado,

    // Actions
    fetchFacturas,
    fetchSoportesPago,
    fetchSaldoFavor,
    aprobarPago,
    descargarSoporte,
    setFiltroEstado,
    limpiarSoportes,
    clearError
  }
})
