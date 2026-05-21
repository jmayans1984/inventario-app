import api from './api'
import { useAuthStore } from '../stores/auth'

const ENDPOINT = '/tesoreria/facturas-venta'

function getEmpresaActiva() {
  const authStore = useAuthStore()
  return authStore.empresa
}

export const facturasVentasClienteService = {
  // Obtener facturas de venta para el cliente (empresa activa)
  async getFacturasVenta(params = {}) {
    try {
      const empresa = getEmpresaActiva()
      const paramsConEmpresa = { ...params, empresa }
      const response = await api.get(ENDPOINT, { params: paramsConEmpresa })
      return response.data
    } catch (error) {
      console.error('Error obteniendo facturas venta:', error)
      throw error
    }
  },

  // Obtener una factura específica
  async getFacturaVenta(codigo) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.get(`${ENDPOINT}/${codigo}`, { params: { empresa } })
      return response.data
    } catch (error) {
      console.error('Error obteniendo factura venta:', error)
      throw error
    }
  },

  // Obtener soportes de pago de una factura
  async getSoportesPago(codigo) {
    try {
      const response = await api.get(`${ENDPOINT}/${codigo}/soportes`, {})
      return response.data
    } catch (error) {
      console.error('Error obteniendo soportes de pago:', error)
      return { success: true, data: [] }
    }
  },

  // Subir soporte de pago (archivo)
  async subirSoportePago(codigo, archivo) {
    try {
      const formData = new FormData()
      formData.append('archivo', archivo)
      const response = await api.post(`${ENDPOINT}/${codigo}/soportes`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error subiendo soporte de pago:', error)
      throw error
    }
  },

  // Descargar soporte de pago
  async descargarSoporte(idSoporte) {
    try {
      const response = await api.get(`/tesoreria/soportes/${idSoporte}/descargar`, {
        responseType: 'blob'
      })
      // Obtener nombre del archivo de los headers
      const disposition = response.headers['content-disposition']
      let filename = `soporte-${idSoporte}`
      if (disposition && disposition.indexOf('filename') !== -1) {
        const filenameMatch = disposition.match(/filename="?([^"]+)"?/)
        if (filenameMatch[1]) filename = filenameMatch[1]
      }
      return { data: response.data, filename }
    } catch (error) {
      console.error('Error descargando soporte:', error)
      throw error
    }
  }
}

export default facturasVentasClienteService
