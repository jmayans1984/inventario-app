import api from './api'
import { useAuthStore } from '../stores/auth'

const ENDPOINT = '/tesoreria/facturas-proveedor'

function getEmpresaActiva() {
  const authStore = useAuthStore()
  return authStore.empresa
}

export const facturasVentaProveedorService = {

  // Obtener TODAS las facturas de venta (vista proveedor - sin filtro de cliente)
  async getFacturas(params = {}) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.get(ENDPOINT, { params: { ...params, empresa } })
      return response.data
    } catch (error) {
      console.error('Error obteniendo facturas (proveedor):', error)
      throw error
    }
  },

  // Obtener soportes de pago de una factura (reutiliza endpoint de facturas-compra)
  async getSoportesPago(codigo) {
    try {
      const response = await api.get(`/tesoreria/facturas-compra/${codigo}/soportes`)
      return response.data
    } catch (error) {
      console.error('Error obteniendo soportes:', error)
      return { success: true, data: [] }
    }
  },

  // Descargar soporte de pago
  async descargarSoporte(idSoporte) {
    try {
      const response = await api.get(`/tesoreria/soportes/${idSoporte}/descargar`, {
        responseType: 'blob'
      })
      const disposition = response.headers['content-disposition']
      let filename = `soporte-${idSoporte}`
      if (disposition && disposition.indexOf('filename') !== -1) {
        const match = disposition.match(/filename="?([^"]+)"?/)
        if (match?.[1]) filename = match[1]
      }
      return { data: response.data, filename }
    } catch (error) {
      console.error('Error descargando soporte:', error)
      throw error
    }
  },

  // Obtener saldo a favor del cliente
  async getSaldoFavor(cliente) {
    try {
      const response = await api.get(`/tesoreria/saldo-favor-cliente/${cliente}`)
      return response.data
    } catch (error) {
      console.error('Error obteniendo saldo a favor:', error)
      return { success: true, data: { saldo: 0, tiene_saldo: false } }
    }
  },

  // Aprobar pago de una factura (crea movimiento en MOVIBAN)
  async aprobarPago(codigo, { fecha, banco, valor_pagado }) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.post(`${ENDPOINT}/${codigo}/aprobar-pago`, {
        fecha,
        banco,
        valor_pagado: parseFloat(valor_pagado),
        empresa
      })
      return response.data
    } catch (error) {
      console.error('Error aprobando pago:', error)
      throw error
    }
  }
}

export default facturasVentaProveedorService
