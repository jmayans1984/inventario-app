import api from './api'
import { useAuthStore } from '../stores/auth'

const ENDPOINT = '/tesoreria/movimientos'

function getEmpresaActiva() {
  const authStore = useAuthStore()
  return authStore.empresa
}

export const conciliacionBancariaService = {
  // Obtener movimientos no conciliados filtrados por banco
  async getMovimientosPendientes(banco, params = {}) {
    try {
      const empresa = getEmpresaActiva()
      const paramsConEmpresa = { ...params, empresa, banco, conciliado: 'NO' }
      const response = await api.get(ENDPOINT, { params: paramsConEmpresa })
      return response.data
    } catch (error) {
      console.error('Error obteniendo movimientos pendientes:', error)
      throw error
    }
  },

  // Obtener movimientos por banco (conciliados y no conciliados)
  async getMovimientos(banco = null, params = {}) {
    try {
      const empresa = getEmpresaActiva()
      const paramsConEmpresa = { ...params, empresa }
      if (banco) paramsConEmpresa.banco = banco
      // Por defecto trae solo los NO conciliados para la conciliación
      paramsConEmpresa.conciliado = 'NO'
      const response = await api.get(ENDPOINT, { params: paramsConEmpresa })
      return response.data
    } catch (error) {
      console.error('Error obteniendo movimientos:', error)
      throw error
    }
  },

  // Marcar movimiento como conciliado
  async marcarConciliado(id) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.put(`${ENDPOINT}/${id}`, {
        estado: 'CONCILIADO',
        empresa,
      })
      return response.data
    } catch (error) {
      console.error(`Error marcando movimiento ${id} como conciliado:`, error)
      throw error
    }
  },

  // Marcar como no conciliado
  async marcarPendiente(id) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.put(`${ENDPOINT}/${id}`, {
        estado: 'PENDIENTE',
        empresa,
      })
      return response.data
    } catch (error) {
      console.error(`Error marcando movimiento ${id} como pendiente:`, error)
      throw error
    }
  },

  // Marcar múltiples como conciliados
  async marcarMultiplesConciliados(ids) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.post(`${ENDPOINT}/batch/conciliar`, {
        ids,
        empresa,
      })
      return response.data
    } catch (error) {
      console.error('Error en conciliación en lote:', error)
      throw error
    }
  },

  // Obtener resumen de saldos por banco
  async getResumen(banco) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.get(`${ENDPOINT}/resumen`, {
        params: { empresa, banco }
      })
      return response.data
    } catch (error) {
      console.error('Error obteniendo resumen:', error)
      throw error
    }
  },
}

export default conciliacionBancariaService
