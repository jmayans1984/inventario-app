import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { produccionService } from '../services/produccion.service'

export const useProduccionStore = defineStore('produccion', () => {
  // ========== ESTADO COMPARTIDO ==========
  const loading = ref(false)
  const error = ref(null)

  // ========== PRODUCTOS PARA VENTA ==========
  const productosVenta = ref([])
  const filtrosProductos = ref({
    busqueda: '',
    grupo: '',
    estado: 'ACTIVO'
  })

  // ========== GRUPOS DE PRODUCTOS ==========
  const grupoProductos = ref([])

  // ========== LISTA DE PRECIOS ==========
  const listasPrecios = ref([])
  const filtrosPrecios = ref({
    busqueda: '',
    producto: ''
  })

  // ========== TÉRMINOS DE CRÉDITO ==========
  const terminosCredito = ref([])

  // ========== ÓRDENES DE COMPRA (RECIBIDAS) ==========
  const ordenesCompra = ref([])
  const filtrosOrdenes = ref({
    estado: 'PENDIENTE',
    cliente: '',
    fechaInicio: null,
    fechaFin: null
  })

  // ========== GETTERS ==========

  const totalProductosVenta = computed(() => productosVenta.value.length)

  const productosActivos = computed(() =>
    productosVenta.value.filter(p => p.estado === 'ACTIVO')
  )

  const totalGrupos = computed(() => grupoProductos.value.length)

  const totalTerminos = computed(() => terminosCredito.value.length)

  const ordenesActivas = computed(() =>
    ordenesCompra.value.filter(o => o.estado === 'PENDIENTE')
  )

  // ========== ACTIONS PRODUCTOS PARA VENTA ==========

  async function fetchProductosVenta(filtros = {}) {
    loading.value = true
    error.value = null
    try {
      const data = await produccionService.getProductosVenta(filtros)
      productosVenta.value = Array.isArray(data.data) ? data.data : data.data?.data || []
      return true
    } catch (err) {
      error.value = err.message
      console.error('Error fetchProductosVenta:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  async function crearProductoVenta(datos) {
    loading.value = true
    error.value = null
    try {
      const response = await produccionService.crearProductoVenta(datos)
      productosVenta.value.push(response.data)
      return true
    } catch (err) {
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }

  async function actualizarProductoVenta(id, datos) {
    loading.value = true
    error.value = null
    try {
      await produccionService.actualizarProductoVenta(id, datos)
      const idx = productosVenta.value.findIndex(p => p.id === id)
      if (idx >= 0) {
        productosVenta.value[idx] = { ...productosVenta.value[idx], ...datos }
      }
      return true
    } catch (err) {
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }

  async function eliminarProductoVenta(id) {
    loading.value = true
    error.value = null
    try {
      await produccionService.eliminarProductoVenta(id)
      productosVenta.value = productosVenta.value.filter(p => p.id !== id)
      return true
    } catch (err) {
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }

  // ========== ACTIONS GRUPOS DE PRODUCTOS ==========

  async function fetchGrupoProductos(filtros = {}) {
    loading.value = true
    error.value = null
    try {
      const data = await produccionService.getGrupoProductos(filtros)
      grupoProductos.value = Array.isArray(data.data) ? data.data : data.data?.data || []
      return true
    } catch (err) {
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }

  async function crearGrupo(datos) {
    loading.value = true
    error.value = null
    try {
      const response = await produccionService.crearGrupo(datos)
      grupoProductos.value.push(response.data)
      return true
    } catch (err) {
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }

  async function actualizarGrupo(id, datos) {
    loading.value = true
    error.value = null
    try {
      await produccionService.actualizarGrupo(id, datos)
      const idx = grupoProductos.value.findIndex(g => g.id === id)
      if (idx >= 0) {
        grupoProductos.value[idx] = { ...grupoProductos.value[idx], ...datos }
      }
      return true
    } catch (err) {
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }

  async function eliminarGrupo(id) {
    loading.value = true
    error.value = null
    try {
      await produccionService.eliminarGrupo(id)
      grupoProductos.value = grupoProductos.value.filter(g => g.id !== id)
      return true
    } catch (err) {
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }

  // ========== ACTIONS LISTA DE PRECIOS ==========

  async function fetchListaPrecios(filtros = {}) {
    loading.value = true
    error.value = null
    try {
      const data = await produccionService.getListaPrecios(filtros)
      listasPrecios.value = Array.isArray(data.data) ? data.data : data.data?.data || []
      return true
    } catch (err) {
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }

  async function crearListaPrecio(datos) {
    loading.value = true
    error.value = null
    try {
      const response = await produccionService.crearListaPrecio(datos)
      listasPrecios.value.push(response.data)
      return true
    } catch (err) {
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }

  async function actualizarListaPrecio(id, datos) {
    loading.value = true
    error.value = null
    try {
      await produccionService.actualizarListaPrecio(id, datos)
      const idx = listasPrecios.value.findIndex(lp => lp.id === id)
      if (idx >= 0) {
        listasPrecios.value[idx] = { ...listasPrecios.value[idx], ...datos }
      }
      return true
    } catch (err) {
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }

  async function eliminarListaPrecio(id) {
    loading.value = true
    error.value = null
    try {
      await produccionService.eliminarListaPrecio(id)
      listasPrecios.value = listasPrecios.value.filter(lp => lp.id !== id)
      return true
    } catch (err) {
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }

  // ========== ACTIONS TÉRMINOS DE CRÉDITO ==========

  async function fetchTerminosCredito(filtros = {}) {
    loading.value = true
    error.value = null
    try {
      const data = await produccionService.getTerminosCredito(filtros)
      terminosCredito.value = Array.isArray(data.data) ? data.data : data.data?.data || []
      return true
    } catch (err) {
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }

  async function crearTermino(datos) {
    loading.value = true
    error.value = null
    try {
      const response = await produccionService.crearTermino(datos)
      terminosCredito.value.push(response.data)
      return true
    } catch (err) {
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }

  async function actualizarTermino(id, datos) {
    loading.value = true
    error.value = null
    try {
      await produccionService.actualizarTermino(id, datos)
      const idx = terminosCredito.value.findIndex(t => t.id === id)
      if (idx >= 0) {
        terminosCredito.value[idx] = { ...terminosCredito.value[idx], ...datos }
      }
      return true
    } catch (err) {
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }

  async function eliminarTermino(id) {
    loading.value = true
    error.value = null
    try {
      await produccionService.eliminarTermino(id)
      terminosCredito.value = terminosCredito.value.filter(t => t.id !== id)
      return true
    } catch (err) {
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }

  // ========== ACTIONS ÓRDENES DE COMPRA ==========

  async function fetchOrdenesCompra(filtros = {}) {
    loading.value = true
    error.value = null
    try {
      const data = await produccionService.getOrdenesCompra(filtros)
      ordenesCompra.value = Array.isArray(data.data) ? data.data : data.data?.data || []
      return true
    } catch (err) {
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }

  async function cambiarEstadoOrden(id, estado) {
    loading.value = true
    error.value = null
    try {
      await produccionService.cambiarEstadoOrden(id, estado)
      const idx = ordenesCompra.value.findIndex(o => o.id === id)
      if (idx >= 0) {
        ordenesCompra.value[idx] = { ...ordenesCompra.value[idx], estado }
      }
      return true
    } catch (err) {
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }

  // ========== HELPERS ==========

  function setFiltrosProductos(filtros) {
    filtrosProductos.value = { ...filtrosProductos.value, ...filtros }
  }

  function setFiltrosPrecios(filtros) {
    filtrosPrecios.value = { ...filtrosPrecios.value, ...filtros }
  }

  function setFiltrosOrdenes(filtros) {
    filtrosOrdenes.value = { ...filtrosOrdenes.value, ...filtros }
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    loading,
    error,
    productosVenta,
    grupoProductos,
    listasPrecios,
    terminosCredito,
    ordenesCompra,
    filtrosProductos,
    filtrosPrecios,
    filtrosOrdenes,

    // Getters
    totalProductosVenta,
    productosActivos,
    totalGrupos,
    totalTerminos,
    ordenesActivas,

    // Actions
    fetchProductosVenta,
    crearProductoVenta,
    actualizarProductoVenta,
    eliminarProductoVenta,
    fetchGrupoProductos,
    crearGrupo,
    actualizarGrupo,
    eliminarGrupo,
    fetchListaPrecios,
    crearListaPrecio,
    actualizarListaPrecio,
    eliminarListaPrecio,
    fetchTerminosCredito,
    crearTermino,
    actualizarTermino,
    eliminarTermino,
    fetchOrdenesCompra,
    cambiarEstadoOrden,
    setFiltrosProductos,
    setFiltrosPrecios,
    setFiltrosOrdenes,
    clearError
  }
})
