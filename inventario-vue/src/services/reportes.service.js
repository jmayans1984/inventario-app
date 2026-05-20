import api from './api'
import { useAuthStore } from '../stores/auth'

const ENDPOINT = '/tesoreria/reportes'

function getEmpresaActiva() {
  const authStore = useAuthStore()
  return authStore.empresa
}

export const reportesService = {
  // ========== REPORTES DE CONCILIACIÓN ==========

  async getReporteConciliacion(params = {}) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.get(`${ENDPOINT}/conciliacion`, {
        params: { ...params, empresa }
      })
      return response.data
    } catch (error) {
      console.error('Error obteniendo reporte de conciliación:', error)
      throw error
    }
  },

  // ========== REPORTES DE MOVIMIENTOS ==========

  async getReporteMovimientos(params = {}) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.get(`${ENDPOINT}/movimientos`, {
        params: { ...params, empresa }
      })
      return response.data
    } catch (error) {
      console.error('Error obteniendo reporte de movimientos:', error)
      throw error
    }
  },

  // ========== REPORTES DE VENTAS ==========

  async getReporteVentasPeriodo(params = {}) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.get(`${ENDPOINT}/ventas-periodo`, {
        params: { ...params, empresa }
      })
      return response.data
    } catch (error) {
      console.error('Error obteniendo reporte de ventas por período:', error)
      throw error
    }
  },

  async getReporteVentasProductos(params = {}) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.get(`${ENDPOINT}/ventas-productos`, {
        params: { ...params, empresa }
      })
      return response.data
    } catch (error) {
      console.error('Error obteniendo reporte de ventas por productos:', error)
      throw error
    }
  },

  // ========== EXPORTAR A PDF ==========

  async exportarPDF(tipo, datos) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.post(`${ENDPOINT}/exportar-pdf`, {
        tipo,
        datos,
        empresa
      }, {
        responseType: 'blob'
      })

      // Crear blob URL y descargar
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `reporte-${tipo}-${new Date().toISOString().split('T')[0]}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)

      return response.data
    } catch (error) {
      console.error('Error exportando PDF:', error)
      throw error
    }
  },

  // ========== EXPORTAR A EXCEL ==========

  async exportarExcel(tipo, datos) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.post(`${ENDPOINT}/exportar-excel`, {
        tipo,
        datos,
        empresa
      }, {
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `reporte-${tipo}-${new Date().toISOString().split('T')[0]}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)

      return response.data
    } catch (error) {
      console.error('Error exportando Excel:', error)
      throw error
    }
  }
}

export default reportesService
