import api from './api'
import { useAuthStore } from '../stores/auth'

const ENDPOINT = '/contabilidad/gastos'

function getEmpresaActiva() {
  const authStore = useAuthStore()
  return authStore.empresa
}

export const gestionGastosService = {
  async getGastos(params = {}) {
    try {
      const empresa = getEmpresaActiva()
      const paramsConEmpresa = { ...params, empresa }
      const response = await api.get(ENDPOINT, { params: paramsConEmpresa })
      return response.data
    } catch (error) {
      console.error('Error obteniendo gastos:', error)
      throw error
    }
  },

  async getGasto(codigo) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.get(`${ENDPOINT}/${codigo}`, { params: { empresa } })
      return response.data
    } catch (error) {
      console.error(`Error obteniendo gasto ${codigo}:`, error)
      throw error
    }
  },

  async buscar(query) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.get(`${ENDPOINT}/buscar`, {
        params: { q: query, empresa }
      })
      return response.data
    } catch (error) {
      console.error('Error buscando gastos:', error)
      throw error
    }
  },

  async crearGasto(data) {
    try {
      const empresa = getEmpresaActiva()
      const dataConEmpresa = { ...data, empresa }
      const response = await api.post(ENDPOINT, dataConEmpresa)
      return response.data
    } catch (error) {
      console.error('Error creando gasto:', error)
      throw error
    }
  },

  async actualizarGasto(codigo, data) {
    try {
      const empresa = getEmpresaActiva()
      const dataConEmpresa = { ...data, empresa }
      const response = await api.put(`${ENDPOINT}/${codigo}`, dataConEmpresa)
      return response.data
    } catch (error) {
      console.error(`Error actualizando gasto ${codigo}:`, error)
      throw error
    }
  },

  async eliminarGasto(codigo) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.delete(`${ENDPOINT}/${codigo}`, { params: { empresa } })
      return response.data
    } catch (error) {
      console.error(`Error eliminando gasto ${codigo}:`, error)
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

  async getProximoCodigo() {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.get(`${ENDPOINT}/proximo-codigo`, { params: { empresa } })
      return response.data.codigo
    } catch (error) {
      console.error('Error obteniendo próximo código:', error)
      throw error
    }
  },

  async exportarExcel(filters = {}) {
    try {
      const empresa = getEmpresaActiva()
      const filtersConEmpresa = { ...filters, empresa }
      const response = await api.get(`${ENDPOINT}/export/excel`, {
        params: filtersConEmpresa,
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `gastos-${new Date().toISOString().split('T')[0]}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.parentElement.removeChild(link)
      return true
    } catch (error) {
      console.error('Error exportando a Excel:', error)
      throw error
    }
  }
}

export default gestionGastosService
