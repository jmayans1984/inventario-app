import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { movimientosBancariosService } from '../services/movimientos-bancarios.service'

export const useMovimientosBancariosStore = defineStore('movimientosBancarios', () => {
  // Estado
  const movimientos = ref([])
  const cuentasBancarias = ref([])
  const bancoSeleccionado = ref(null)
  const proveedoresOptions = ref([])
  const loading = ref(false)
  const error = ref(null)
  const filtros = ref({
    tipo: 'TODOS',     // TODOS, ING, EGR, TRA
    busqueda: '',      // búsqueda por concepto o beneficiario
  })

  // Getters
  const movimientosIngresos = computed(() =>
    movimientos.value.filter(m => m.tipo === 'ING' || parseFloat(m.ingreso || 0) > 0)
  )

  const movimientosEgresos = computed(() =>
    movimientos.value.filter(m => m.tipo === 'EGR' || parseFloat(m.egreso || 0) > 0)
  )

  const totalMovimientos = computed(() => movimientos.value.length)

  const totalIngresos = computed(() =>
    movimientos.value.reduce((sum, m) => sum + parseFloat(m.ingreso || 0), 0)
  )

  const totalEgresos = computed(() =>
    movimientos.value.reduce((sum, m) => sum + parseFloat(m.egreso || 0), 0)
  )

  const saldoNeto = computed(() => totalIngresos.value - totalEgresos.value)

  const movimientosFiltrados = computed(() => {
    let filtered = [...movimientos.value]

    // Filtro por tipo
    if (filtros.value.tipo !== 'TODOS') {
      filtered = filtered.filter(m => m.tipo === filtros.value.tipo)
    }

    // Filtro por búsqueda (concepto o beneficiario)
    if (filtros.value.busqueda.trim()) {
      const q = filtros.value.busqueda.toLowerCase()
      filtered = filtered.filter(m =>
        (m.concepto  && m.concepto.toLowerCase().includes(q)) ||
        (m.beneficia && m.beneficia.toLowerCase().includes(q)) ||
        (m.numero    && m.numero.includes(q))
      )
    }

    return filtered
  })

  // Actions
  async function fetchCuentasBancarias() {
    try {
      const data = await movimientosBancariosService.getCuentasBancarias()
      // El endpoint ya filtra por estado='ACTIVA'
      cuentasBancarias.value = Array.isArray(data) ? data : (data.data || [])
    } catch (err) {
      console.error('Error fetchCuentasBancarias:', err)
      cuentasBancarias.value = []
    }
  }

  async function fetchMovimientos() {
    loading.value = true
    error.value = null
    try {
      const params = {}
      if (bancoSeleccionado.value) params.banco = bancoSeleccionado.value
      const data = await movimientosBancariosService.getMovimientos(params)
      movimientos.value = Array.isArray(data) ? data : (data.data || [])
    } catch (err) {
      error.value = err.message
      console.error('Error fetchMovimientos:', err)
    } finally {
      loading.value = false
    }
  }

  async function buscarProveedores(busqueda) {
    try {
      const data = await movimientosBancariosService.buscarProveedores(busqueda)
      proveedoresOptions.value = Array.isArray(data) ? data : (data.data || [])
    } catch (err) {
      console.error('Error buscarProveedores:', err)
      proveedoresOptions.value = []
    }
  }

  async function crearMovimiento(datos) {
    loading.value = true
    error.value = null
    try {
      const resp = await movimientosBancariosService.crearMovimiento(datos)
      // Recargar lista después de crear
      await fetchMovimientos()
      return resp
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function editarMovimiento(numero, datos) {
    loading.value = true
    error.value = null
    try {
      const resp = await movimientosBancariosService.editarMovimiento(numero, datos)
      await fetchMovimientos()
      return resp
    } catch (err) {
      error.value = err.response?.data?.error || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function eliminarMovimiento(numero, conGasto = false) {
    loading.value = true
    error.value = null
    try {
      const resp = await movimientosBancariosService.eliminarMovimiento(numero, conGasto)
      await fetchMovimientos()
      return resp
    } catch (err) {
      error.value = err.response?.data?.error || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  function setBanco(codigo) {
    bancoSeleccionado.value = codigo
    movimientos.value = []
  }

  function setFiltros(nuevosFiltros) {
    filtros.value = { ...filtros.value, ...nuevosFiltros }
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    movimientos,
    cuentasBancarias,
    bancoSeleccionado,
    proveedoresOptions,
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

    // Actions
    fetchCuentasBancarias,
    fetchMovimientos,
    buscarProveedores,
    crearMovimiento,
    editarMovimiento,
    eliminarMovimiento,
    setBanco,
    setFiltros,
    clearError,
  }
})
