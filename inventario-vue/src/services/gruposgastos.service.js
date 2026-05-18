import api from './api'

const ENDPOINT = '/contabilidad/grupos-gastos'

/**
 * Servicio de Grupos de Gastos
 * Obtiene la lista global de grupos de gastos (sin filtro de empresa)
 */
export const gruposGastosService = {
  /**
   * Obtener lista de grupos de gastos (GLOBAL, sin empresa)
   */
  async getGruposGastos(params = {}) {
    try {
      const response = await api.get(ENDPOINT, { params })
      return response.data
    } catch (error) {
      console.error('Error obteniendo grupos de gastos:', error)
      throw error
    }
  },

  /**
   * Obtener un grupo de gastos específico
   */
  async getGrupoGastos(codigo) {
    try {
      const response = await api.get(`${ENDPOINT}/${codigo}`)
      return response.data
    } catch (error) {
      console.error(`Error obteniendo grupo de gastos ${codigo}:`, error)
      throw error
    }
  },
}

export default gruposGastosService
