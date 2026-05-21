import api from './api'
import { useAuthStore } from '../stores/auth'

const ENDPOINT = '/tesoreria/movimientos'

function getEmpresaActiva() {
  const authStore = useAuthStore()
  return authStore.empresa
}

export const movimientosBancariosService = {
  // Obtener todos los movimientos (banco opcional, conciliado opcional)
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

  // Obtener cuentas bancarias activas
  async getCuentasBancarias() {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.get('/cuentas-bancarias', {
        params: { empresa, estado: 'ACTIVA' }
      })
      return response.data
    } catch (error) {
      console.error('Error obteniendo cuentas bancarias:', error)
      throw error
    }
  },

  // Obtener próximo número de movimiento
  async getNextNumero() {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.get(`${ENDPOINT}/next-numero`, {
        params: { empresa }
      })
      return response.data
    } catch (error) {
      console.error('Error obteniendo próximo número:', error)
      throw error
    }
  },

  // Crear nuevo movimiento
  async crearMovimiento(datos) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.post(ENDPOINT, { ...datos, empresa })
      return response.data
    } catch (error) {
      console.error('Error creando movimiento:', error)
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
