import api from './api'
import { useAuthStore } from '../stores/auth'

function getEmpresaActiva() {
  const authStore = useAuthStore()
  return authStore.empresa
}

export const facturasService = {
  // ========== FACTURAS DE COMPRA ==========

  // Obtener facturas de compra
  async getFacturasCompra(filtros = {}) {
    try {
      const empresa = getEmpresaActiva()
      const params = { ...filtros, empresa }
      const response = await api.get('/tesoreria/facturas-compra', { params })
      return response.data
    } catch (error) {
      console.error('Error obteniendo facturas de compra:', error)
      throw error
    }
  },

  // Obtener una factura de compra
  async getFacturaCompra(id) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.get(`/tesoreria/facturas-compra/${id}`, {
        params: { empresa }
      })
      return response.data
    } catch (error) {
      console.error(`Error obteniendo factura de compra ${id}:`, error)
      throw error
    }
  },

  // Crear factura de compra
  async crearFacturaCompra(datos) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.post('/tesoreria/facturas-compra', {
        ...datos,
        empresa
      })
      return response.data
    } catch (error) {
      console.error('Error creando factura de compra:', error)
      throw error
    }
  },

  // Actualizar factura de compra
  async actualizarFacturaCompra(id, datos) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.put(`/tesoreria/facturas-compra/${id}`, {
        ...datos,
        empresa
      })
      return response.data
    } catch (error) {
      console.error(`Error actualizando factura de compra ${id}:`, error)
      throw error
    }
  },

  // Eliminar factura de compra
  async eliminarFacturaCompra(id) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.delete(`/tesoreria/facturas-compra/${id}`, {
        params: { empresa }
      })
      return response.data
    } catch (error) {
      console.error(`Error eliminando factura de compra ${id}:`, error)
      throw error
    }
  },

  // ========== FACTURAS DE VENTA ==========

  // Obtener facturas de venta
  async getFacturasVenta(filtros = {}) {
    try {
      const empresa = getEmpresaActiva()
      const params = { ...filtros, empresa }
      const response = await api.get('/tesoreria/facturas-venta', { params })
      return response.data
    } catch (error) {
      console.error('Error obteniendo facturas de venta:', error)
      throw error
    }
  },

  // Obtener una factura de venta
  async getFacturaVenta(id) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.get(`/tesoreria/facturas-venta/${id}`, {
        params: { empresa }
      })
      return response.data
    } catch (error) {
      console.error(`Error obteniendo factura de venta ${id}:`, error)
      throw error
    }
  },

  // Crear factura de venta
  async crearFacturaVenta(datos) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.post('/tesoreria/facturas-venta', {
        ...datos,
        empresa
      })
      return response.data
    } catch (error) {
      console.error('Error creando factura de venta:', error)
      throw error
    }
  },

  // Actualizar factura de venta
  async actualizarFacturaVenta(id, datos) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.put(`/tesoreria/facturas-venta/${id}`, {
        ...datos,
        empresa
      })
      return response.data
    } catch (error) {
      console.error(`Error actualizando factura de venta ${id}:`, error)
      throw error
    }
  },

  // Eliminar factura de venta
  async eliminarFacturaVenta(id) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.delete(`/tesoreria/facturas-venta/${id}`, {
        params: { empresa }
      })
      return response.data
    } catch (error) {
      console.error(`Error eliminando factura de venta ${id}:`, error)
      throw error
    }
  }
}

export default facturasService
