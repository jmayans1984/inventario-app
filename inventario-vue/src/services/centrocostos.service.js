import api from './api'
import { useAuthStore } from '../stores/auth'

const ENDPOINT = '/contabilidad/centrocostos'

function getEmpresaActiva() {
  const authStore = useAuthStore()
  return authStore.empresa
}

export const centroCostosService = {
  async getCentrosCostos(params = {}) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.get(ENDPOINT, { params: { ...params, empresa } })
      return response.data
    } catch (error) {
      console.error('Error obteniendo centros de costos:', error)
      throw error
    }
  },

  async getCentroCostos(codigo) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.get(`${ENDPOINT}/${codigo}`, { params: { empresa } })
      return response.data
    } catch (error) {
      console.error(`Error obteniendo centro de costos ${codigo}:`, error)
      throw error
    }
  },

  async buscar(query) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.get(`${ENDPOINT}/buscar`, { params: { q: query, empresa } })
      return response.data
    } catch (error) {
      console.error('Error buscando centros de costos:', error)
      throw error
    }
  },

  async crearCentroCostos(data) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.post(ENDPOINT, { ...data, empresa })
      return response.data
    } catch (error) {
      console.error('Error creando centro de costos:', error)
      throw error
    }
  },

  async actualizarCentroCostos(codigo, data) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.put(`${ENDPOINT}/${codigo}`, { ...data, empresa })
      return response.data
    } catch (error) {
      console.error(`Error actualizando centro de costos ${codigo}:`, error)
      throw error
    }
  },

  async eliminarCentroCostos(codigo) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.delete(`${ENDPOINT}/${codigo}`, { params: { empresa } })
      return response.data
    } catch (error) {
      console.error(`Error eliminando centro de costos ${codigo}:`, error)
      throw error
    }
  },

  async eliminarMultiples(codigos) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.post(`${ENDPOINT}/batch/eliminar`, { codigos, empresa })
      return response.data
    } catch (error) {
      console.error('Error en eliminación en lote:', error)
      throw error
    }
  },
}

export default centroCostosService
