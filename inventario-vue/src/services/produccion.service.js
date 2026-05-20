import api from './api'
import { useAuthStore } from '../stores/auth'

const ENDPOINTS = {
  productosVenta: '/produccion/productos-venta',
  grupoProductos: '/produccion/grupo-productos',
  listaPrecios: '/produccion/lista-precios',
  terminosCredito: '/produccion/terminos-credito',
  ordenesCompra: '/produccion/ordenes-compra'
}

function getEmpresaActiva() {
  const authStore = useAuthStore()
  return authStore.empresa
}

export const produccionService = {
  // ========== PRODUCTOS PARA VENTA ==========
  async getProductosVenta(filtros = {}) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.get(ENDPOINTS.productosVenta, {
        params: { ...filtros, empresa }
      })
      return response.data
    } catch (error) {
      console.error('Error obteniendo productos para venta:', error)
      throw error
    }
  },

  async crearProductoVenta(datos) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.post(ENDPOINTS.productosVenta, { ...datos, empresa })
      return response.data
    } catch (error) {
      console.error('Error creando producto para venta:', error)
      throw error
    }
  },

  async actualizarProductoVenta(id, datos) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.put(`${ENDPOINTS.productosVenta}/${id}`, { ...datos, empresa })
      return response.data
    } catch (error) {
      console.error('Error actualizando producto para venta:', error)
      throw error
    }
  },

  async eliminarProductoVenta(id) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.delete(`${ENDPOINTS.productosVenta}/${id}`, { params: { empresa } })
      return response.data
    } catch (error) {
      console.error('Error eliminando producto para venta:', error)
      throw error
    }
  },

  // ========== GRUPO DE PRODUCTOS ==========
  async getGrupoProductos(filtros = {}) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.get(ENDPOINTS.grupoProductos, {
        params: { ...filtros, empresa }
      })
      return response.data
    } catch (error) {
      console.error('Error obteniendo grupos de productos:', error)
      throw error
    }
  },

  async crearGrupo(datos) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.post(ENDPOINTS.grupoProductos, { ...datos, empresa })
      return response.data
    } catch (error) {
      console.error('Error creando grupo de productos:', error)
      throw error
    }
  },

  async actualizarGrupo(id, datos) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.put(`${ENDPOINTS.grupoProductos}/${id}`, { ...datos, empresa })
      return response.data
    } catch (error) {
      console.error('Error actualizando grupo de productos:', error)
      throw error
    }
  },

  async eliminarGrupo(id) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.delete(`${ENDPOINTS.grupoProductos}/${id}`, { params: { empresa } })
      return response.data
    } catch (error) {
      console.error('Error eliminando grupo de productos:', error)
      throw error
    }
  },

  // ========== LISTA DE PRECIOS ==========
  async getListaPrecios(filtros = {}) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.get(ENDPOINTS.listaPrecios, {
        params: { ...filtros, empresa }
      })
      return response.data
    } catch (error) {
      console.error('Error obteniendo lista de precios:', error)
      throw error
    }
  },

  async crearListaPrecio(datos) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.post(ENDPOINTS.listaPrecios, { ...datos, empresa })
      return response.data
    } catch (error) {
      console.error('Error creando lista de precios:', error)
      throw error
    }
  },

  async actualizarListaPrecio(id, datos) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.put(`${ENDPOINTS.listaPrecios}/${id}`, { ...datos, empresa })
      return response.data
    } catch (error) {
      console.error('Error actualizando lista de precios:', error)
      throw error
    }
  },

  async eliminarListaPrecio(id) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.delete(`${ENDPOINTS.listaPrecios}/${id}`, { params: { empresa } })
      return response.data
    } catch (error) {
      console.error('Error eliminando lista de precios:', error)
      throw error
    }
  },

  // ========== TÉRMINOS DE CRÉDITO ==========
  async getTerminosCredito(filtros = {}) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.get(ENDPOINTS.terminosCredito, {
        params: { ...filtros, empresa }
      })
      return response.data
    } catch (error) {
      console.error('Error obteniendo términos de crédito:', error)
      throw error
    }
  },

  async crearTermino(datos) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.post(ENDPOINTS.terminosCredito, { ...datos, empresa })
      return response.data
    } catch (error) {
      console.error('Error creando término de crédito:', error)
      throw error
    }
  },

  async actualizarTermino(id, datos) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.put(`${ENDPOINTS.terminosCredito}/${id}`, { ...datos, empresa })
      return response.data
    } catch (error) {
      console.error('Error actualizando término de crédito:', error)
      throw error
    }
  },

  async eliminarTermino(id) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.delete(`${ENDPOINTS.terminosCredito}/${id}`, { params: { empresa } })
      return response.data
    } catch (error) {
      console.error('Error eliminando término de crédito:', error)
      throw error
    }
  },

  // ========== ÓRDENES DE COMPRA (desde perspectiva PROVEEDOR) ==========
  async getOrdenesCompra(filtros = {}) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.get(ENDPOINTS.ordenesCompra, {
        params: { ...filtros, proveedor: empresa }
      })
      return response.data
    } catch (error) {
      console.error('Error obteniendo órdenes de compra:', error)
      throw error
    }
  },

  async getOrdenCompra(id) {
    try {
      const response = await api.get(`${ENDPOINTS.ordenesCompra}/${id}`)
      return response.data
    } catch (error) {
      console.error('Error obteniendo orden de compra:', error)
      throw error
    }
  },

  async cambiarEstadoOrden(id, estado) {
    try {
      const response = await api.patch(`${ENDPOINTS.ordenesCompra}/${id}/estado`, { estado })
      return response.data
    } catch (error) {
      console.error('Error cambiando estado de orden:', error)
      throw error
    }
  }
}

export default produccionService
