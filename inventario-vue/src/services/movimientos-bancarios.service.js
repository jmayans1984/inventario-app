import api from './api'
import { useAuthStore } from '../stores/auth'

const ENDPOINT = '/tesoreria/movimientos'

function getEmpresaActiva() {
  const authStore = useAuthStore()
  return authStore.empresa
}

export const movimientosBancariosService = {
  // Obtener todos los movimientos
  async getMovimientos(params = {}) {
    try {
      const empresa = getEmpresaActiva()
      const paramsConEmpresa = { ...params, empresa }
      const response = await api.get(ENDPOINT, { params: paramsConEmpresa })
      return response.data
    } catch (error) {
      console.error('Error obteniendo movimientos:', error)
      throw error
    }
  },

  // Obtener un movimiento específico
  async getMovimiento(id) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.get(`${ENDPOINT}/${id}`, {
        params: { empresa }
      })
      return response.data
    } catch (error) {
      console.error(`Error obteniendo movimiento ${id}:`, error)
      throw error
    }
  },

  // Obtener resumen de movimientos
  async getResumen(params = {}) {
    try {
      const empresa = getEmpresaActiva()
      const paramsConEmpresa = { ...params, empresa }
      const response = await api.get(`${ENDPOINT}/resumen`, {
        params: paramsConEmpresa
      })
      return response.data
    } catch (error) {
      console.error('Error obteniendo resumen:', error)
      throw error
    }
  },

  // Filtrar por rango de fechas
  async getMovimientosPorFecha(fechaInicio, fechaFin, params = {}) {
    try {
      const empresa = getEmpresaActiva()
      const paramsConEmpresa = {
        ...params,
        empresa,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin
      }
      const response = await api.get(ENDPOINT, { params: paramsConEmpresa })
      return response.data
    } catch (error) {
      console.error('Error obteniendo movimientos por fecha:', error)
      throw error
    }
  }
}

export default movimientosBancariosService
