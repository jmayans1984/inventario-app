import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import { cuentasBancariasService } from '../services/cuentasbancarias.service'
import { useAuthStore } from './auth'

export const useCuentasBancariasStore = defineStore('cuentasbancarias', () => {
  const cuentas   = ref([])
  const total     = ref(0)
  const loading   = ref(false)
  const error     = ref(null)

  const filters = reactive({
    search: '',
    estado: 'TODOS',
    page: 1,
    limit: 50,
    sortBy: 'codigo',
    sortOrder: 'asc',
  })

  // ─── FETCH ────────────────────────────────────────────

  async function fetchCuentas() {
    loading.value = true
    error.value = null
    try {
      const res = await cuentasBancariasService.getCuentas({
        page: filters.page, limit: filters.limit,
        search: filters.search, sortBy: filters.sortBy, sortOrder: filters.sortOrder,
        estado: filters.estado !== 'TODOS' ? filters.estado : undefined,
      })
      if (Array.isArray(res)) {
        cuentas.value = res; total.value = res.length
      } else if (Array.isArray(res?.data)) {
        cuentas.value = res.data; total.value = res.total ?? res.data.length
      }
    } catch (err) {
      error.value = 'API no disponible. Cargando datos de ejemplo...'
      const cached = localStorage.getItem('cb_cache')
      if (cached) { try { cuentas.value = JSON.parse(cached); total.value = cuentas.value.length; error.value = null } catch { cargarDatosEjemplo() } }
      else cargarDatosEjemplo()
    } finally { loading.value = false }
  }

  async function getProximoCodigo() {
    try {
      const res = await cuentasBancariasService.getProximoCodigo()
      return res.codigo || res
    } catch {
      // Calcular localmente si falla
      const codigos = cuentas.value.map(c => parseInt(c.codigo) || 0)
      const max = codigos.length ? Math.max(...codigos) : 0
      return String(max + 1).padStart(3, '0')
    }
  }

  async function crearCuenta(data) {
    loading.value = true; error.value = null
    try {
      const res = await cuentasBancariasService.crearCuenta(data)
      const nueva = res.data || res
      cuentas.value.unshift(nueva)
      total.value++
      guardarCache()
      return nueva
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al crear la cuenta'
      throw err
    } finally { loading.value = false }
  }

  async function actualizarCuenta(codigo, data) {
    loading.value = true; error.value = null
    try {
      const res = await cuentasBancariasService.actualizarCuenta(codigo, data)
      const actualizada = res.data || res
      const idx = cuentas.value.findIndex(c => c.codigo === codigo)
      if (idx !== -1) { cuentas.value[idx] = actualizada; guardarCache() }
      return actualizada
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al actualizar la cuenta'
      throw err
    } finally { loading.value = false }
  }

  async function toggleEstado(codigo) {
    const idx = cuentas.value.findIndex(c => c.codigo === codigo)
    if (idx === -1) return
    const estadoAnterior = cuentas.value[idx].estado
    const nuevoEstado = estadoAnterior === 'ACTIVA' ? 'INACTIVA' : 'ACTIVA'
    // Optimistic update — mutar el campo directamente para mantener reactividad
    cuentas.value[idx].estado = nuevoEstado
    try {
      await cuentasBancariasService.toggleEstado(codigo, estadoAnterior)
      guardarCache()
    } catch (err) {
      // Revertir si la API falla
      cuentas.value[idx].estado = estadoAnterior
      error.value = 'Error al cambiar el estado'
    }
  }

  async function buscar(query) {
    if (!query) { await fetchCuentas(); return }
    loading.value = true
    try {
      const res = await cuentasBancariasService.buscar(query)
      cuentas.value = Array.isArray(res) ? res : res.data || []
      total.value = cuentas.value.length
    } catch { error.value = 'Error en la búsqueda' }
    finally { loading.value = false }
  }

  function clearError() { error.value = null }

  function guardarCache() {
    try { localStorage.setItem('cb_cache', JSON.stringify(cuentas.value)) } catch {}
  }

  function cargarDatosEjemplo() {
    const empresa = useAuthStore().empresa
    const datos = [
      { codigo: '001', nombre_banco: 'Banesco',     nombre_cta: 'Cta Corriente Principal', tipo_cuenta: 'Corriente', nro_cta: '0134-0123-45-1234567890', cheque: 1, vr_transfe: 0, empresa, estado: 'ACTIVA'   },
      { codigo: '002', nombre_banco: 'Venezuela',   nombre_cta: 'Cta Nómina',              tipo_cuenta: 'Corriente', nro_cta: '0102-0456-78-0987654321', cheque: 0, vr_transfe: 0, empresa, estado: 'ACTIVA'   },
      { codigo: '003', nombre_banco: 'Mercantil',   nombre_cta: 'Cta Ahorro Reserva',      tipo_cuenta: 'Ahorro',    nro_cta: '0105-0789-01-1122334455', cheque: 0, vr_transfe: 0, empresa, estado: 'INACTIVA' },
    ]
    cuentas.value = datos; total.value = datos.length; guardarCache(); error.value = null
  }

  // ─── COMPUTED ────────────────────────────────────────

  const totalCuentas     = computed(() => total.value)
  const cuentasActivas   = computed(() => cuentas.value.filter(c => c.estado === 'ACTIVA'))
  const cuentasInactivas = computed(() => cuentas.value.filter(c => c.estado === 'INACTIVA'))
  const paginasTotales   = computed(() => Math.ceil(total.value / filters.limit))

  return {
    cuentas, total, loading, error, filters,
    fetchCuentas, getProximoCodigo, crearCuenta, actualizarCuenta, toggleEstado, buscar, clearError, cargarDatosEjemplo,
    totalCuentas, cuentasActivas, cuentasInactivas, paginasTotales,
  }
})
