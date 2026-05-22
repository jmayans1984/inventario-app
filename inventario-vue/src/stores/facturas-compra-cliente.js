import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { facturasCompraClienteService } from '../services/facturas-compra-cliente.service'

export const useFacturasCompraClienteStore = defineStore('facturasCompraCliente', () => {
  // Estado
  const facturas = ref([])
  const loading = ref(false)
  const error = ref(null)
  const filtroEstado = ref('PENDIENTE')
  const soportesPagoActual = ref([])

  // Getters
  const facturasPendientes = computed(() =>
    facturas.value.filter(f => f.estado === 'PENDIENTE')
  )

  const facturasPorVerificar = computed(() =>
    facturas.value.filter(f => f.estado === 'POR VERIFICAR')
  )

  const facturasVencidas = computed(() =>
    facturasPendientes.value.filter(f => {
      const hoy = new Date()
      const fecha_vencimiento = new Date(f.fecha_vencimiento)
      return fecha_vencimiento < hoy
    })
  )

  const facturasProximas = computed(() =>
    facturasPendientes.value.filter(f => {
      const hoy = new Date()
      const fecha_vencimiento = new Date(f.fecha_vencimiento)
      return fecha_vencimiento >= hoy
    })
  )

  const totalPendiente = computed(() =>
    facturasPendientes.value.reduce((sum, f) => sum + (parseFloat(f.total || 0) - parseFloat(f.valor_pagado || 0)), 0)
  )

  const totalVencido = computed(() =>
    facturasVencidas.value.reduce((sum, f) => sum + (parseFloat(f.total || 0) - parseFloat(f.valor_pagado || 0)), 0)
  )

  const cantidadPendientes = computed(() => facturasPendientes.value.length)

  const porcentajeCobro = computed(() => {
    const totalFacturas = facturas.value.reduce((sum, f) => sum + parseFloat(f.total || 0), 0)
    if (totalFacturas === 0) return 0
    const totalPagado = facturas.value.reduce((sum, f) => sum + parseFloat(f.valor_pagado || 0), 0)
    return ((totalPagado / totalFacturas) * 100).toFixed(1)
  })

  const facturasFiltradas = computed(() => {
    if (filtroEstado.value === 'TODOS') {
      return facturas.value
    }
    return facturas.value.filter(f => f.estado === filtroEstado.value)
  })

  // Actions
  async function fetchFacturasVenta() {
    loading.value = true
    error.value = null
    try {
      // Cargar TODAS las facturas (TODOS) para poder filtrar client-side
      const data = await facturasCompraClienteService.getFacturasVenta({ estado: 'TODOS' })
      facturas.value = Array.isArray(data) ? data : (data.data || [])
    } catch (err) {
      error.value = err.message
      console.error('Error fetchFacturasVenta:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchSoportesPago(codigo) {
    try {
      const data = await facturasCompraClienteService.getSoportesPago(codigo)
      soportesPagoActual.value = Array.isArray(data) ? data : (data.data || [])
    } catch (err) {
      console.error('Error fetchSoportesPago:', err)
      soportesPagoActual.value = []
    }
  }

  async function subirSoportePago(codigo, archivo) {
    loading.value = true
    error.value = null
    try {
      await facturasCompraClienteService.subirSoportePago(codigo, archivo)
      // Recargar soportes
      await fetchSoportesPago(codigo)
      return true
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function descargarSoporte(idSoporte) {
    try {
      const result = await facturasCompraClienteService.descargarSoporte(idSoporte)
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

  function clearError() {
    error.value = null
  }

  function limpiarSoportes() {
    soportesPagoActual.value = []
  }

  return {
    // State
    facturas,
    loading,
    error,
    filtroEstado,
    soportesPagoActual,

    // Getters
    facturasPendientes,
    facturasPorVerificar,
    facturasVencidas,
    facturasProximas,
    totalPendiente,
    totalVencido,
    cantidadPendientes,
    porcentajeCobro,
    facturasFiltradas,

    // Actions
    fetchFacturasVenta,
    fetchSoportesPago,
    subirSoportePago,
    descargarSoporte,
    setFiltroEstado,
    clearError,
    limpiarSoportes
  }
})
