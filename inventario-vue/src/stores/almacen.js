import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { almacenService } from '../services/almacen.service'

export const useAlmacenStore = defineStore('almacen', () => {
  // ========== ESTADO COMPARTIDO ==========
  const loading = ref(false)
  const error = ref(null)

  // ========== PRODUCTOS ==========
  const productos = ref([])
  const productosFiltrados = ref([])
  const filtrosProductos = ref({
    busqueda: '',
    categoria: '',
    estado: 'ACTIVO'
  })

  // ========== GESTIÓN DE INVENTARIO ==========
  const movimientos = ref([])
  const filtrosMov = ref({
    tipo: 'TODOS',
    fechaInicio: null,
    fechaFin: null,
    producto: ''
  })

  // ========== TOMA FÍSICA ==========
  const tomasFisicas = ref([])

  // ========== VALORACIÓN ==========
  const valoraciones = ref([])

  // ========== ÓRDENES DE COMPRA ==========
  const ordenesCompra = ref([])
  const filtrosOrdenes = ref({
    estado: 'PENDIENTE',
    periodo: null
  })

  // ========== KARDEX ==========
  const kardex = ref([])

  // ========== CONSUMOS ==========
  const consumos = ref([])

  // ========== GETTERS ==========

  const totalProductos = computed(() => productos.value.length)

  const productosActivos = computed(() =>
    productos.value.filter(p => p.estado === 'ACTIVO')
  )

  const productosInactivos = computed(() =>
    productos.value.filter(p => p.estado === 'INACTIVO')
  )

  const totalInventario = computed(() => {
    return productos.value.reduce((sum, p) => sum + (parseFloat(p.stock || 0) * parseFloat(p.precio || 0)), 0)
  })

  // ========== ACTIONS PRODUCTOS ==========

  async function fetchProductos(filtros = {}) {
    loading.value = true
    error.value = null
    try {
      const data = await almacenService.getProductos(filtros)
      productos.value = Array.isArray(data.data) ? data.data : data.data?.data || []
      return true
    } catch (err) {
      error.value = err.message
      console.error('Error fetchProductos:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  async function crearProducto(datos) {
    loading.value = true
    error.value = null
    try {
      const response = await almacenService.crearProducto(datos)
      productos.value.push(response.data)
      return true
    } catch (err) {
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }

  async function actualizarProducto(id, datos) {
    loading.value = true
    error.value = null
    try {
      await almacenService.actualizarProducto(id, datos)
      const idx = productos.value.findIndex(p => p.id === id)
      if (idx >= 0) {
        productos.value[idx] = { ...productos.value[idx], ...datos }
      }
      return true
    } catch (err) {
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }

  async function eliminarProducto(id) {
    loading.value = true
    error.value = null
    try {
      await almacenService.eliminarProducto(id)
      productos.value = productos.value.filter(p => p.id !== id)
      return true
    } catch (err) {
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }

  // ========== ACTIONS GESTIÓN ==========

  async function fetchMovimientos(filtros = {}) {
    loading.value = true
    error.value = null
    try {
      const data = await almacenService.getMovimientosInventario(filtros)
      movimientos.value = Array.isArray(data.data) ? data.data : data.data?.data || []
      return true
    } catch (err) {
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }

  async function registrarMovimiento(datos) {
    loading.value = true
    error.value = null
    try {
      const response = await almacenService.registrarMovimiento(datos)
      movimientos.value.unshift(response.data)
      return true
    } catch (err) {
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }

  // ========== ACTIONS REPORTES ==========

  async function fetchKardex(filtros = {}) {
    loading.value = true
    error.value = null
    try {
      const data = await almacenService.getKardex(filtros)
      kardex.value = Array.isArray(data.data) ? data.data : data.data?.data || []
      return true
    } catch (err) {
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }

  async function fetchConsumos(filtros = {}) {
    loading.value = true
    error.value = null
    try {
      const data = await almacenService.getConsumos(filtros)
      consumos.value = Array.isArray(data.data) ? data.data : data.data?.data || []
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

  function setFiltrosMov(filtros) {
    filtrosMov.value = { ...filtrosMov.value, ...filtros }
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    loading,
    error,
    productos,
    movimientos,
    tomasFisicas,
    valoraciones,
    ordenesCompra,
    kardex,
    consumos,
    filtrosProductos,
    filtrosMov,
    filtrosOrdenes,

    // Getters
    totalProductos,
    productosActivos,
    productosInactivos,
    totalInventario,

    // Actions
    fetchProductos,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    fetchMovimientos,
    registrarMovimiento,
    fetchKardex,
    fetchConsumos,
    setFiltrosProductos,
    setFiltrosMov,
    clearError
  }
})
