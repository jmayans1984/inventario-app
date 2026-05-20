import api from './api'
import { useAuthStore } from '../stores/auth'

const ENDPOINTS = {
  productos: '/almacen/productos',
  control: '/almacen/control-inventario',
  gestion: '/almacen/gestion-inventario',
  tomaFisica: '/almacen/toma-fisica',
  valoracion: '/almacen/valoracion',
  ordenesCompra: '/almacen/ordenes-compra',
  kardex: '/almacen/kardex',
  consumos: '/almacen/consumos'
}

function getEmpresaActiva() {
  const authStore = useAuthStore()
  return authStore.empresa
}

export const almacenService = {
  // ========== PRODUCTOS ==========
  async getProductos(filtros = {}) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.get(ENDPOINTS.productos, {
        params: { ...filtros, empresa }
      })
      return response.data
    } catch (error) {
      console.error('Error obteniendo productos:', error)
      throw error
    }
  },

  async crearProducto(datos) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.post(ENDPOINTS.productos, { ...datos, empresa })
      return response.data
    } catch (error) {
      console.error('Error creando producto:', error)
      throw error
    }
  },

  async actualizarProducto(id, datos) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.put(`${ENDPOINTS.productos}/${id}`, { ...datos, empresa })
      return response.data
    } catch (error) {
      console.error('Error actualizando producto:', error)
      throw error
    }
  },

  async eliminarProducto(id) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.delete(`${ENDPOINTS.productos}/${id}`, { params: { empresa } })
      return response.data
    } catch (error) {
      console.error('Error eliminando producto:', error)
      throw error
    }
  },

  // ========== GESTIÓN DE INVENTARIO ==========
  async getMovimientosInventario(filtros = {}) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.get(ENDPOINTS.gestion, {
        params: { ...filtros, empresa }
      })
      return response.data
    } catch (error) {
      console.error('Error obteniendo movimientos:', error)
      throw error
    }
  },

  async registrarMovimiento(datos) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.post(ENDPOINTS.gestion, { ...datos, empresa })
      return response.data
    } catch (error) {
      console.error('Error registrando movimiento:', error)
      throw error
    }
  },

  // ========== TOMA FÍSICA DE INVENTARIO ==========
  async getTomaFisica(filtros = {}) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.get(ENDPOINTS.tomaFisica, {
        params: { ...filtros, empresa }
      })
      return response.data
    } catch (error) {
      console.error('Error obteniendo toma física:', error)
      throw error
    }
  },

  async registrarTomaFisica(datos) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.post(ENDPOINTS.tomaFisica, { ...datos, empresa })
      return response.data
    } catch (error) {
      console.error('Error registrando toma física:', error)
      throw error
    }
  },

  // ========== VALORACIÓN MENSUAL ==========
  async getValoracion(filtros = {}) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.get(ENDPOINTS.valoracion, {
        params: { ...filtros, empresa }
      })
      return response.data
    } catch (error) {
      console.error('Error obteniendo valoración:', error)
      throw error
    }
  },

  async generarValoracion(datos) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.post(ENDPOINTS.valoracion, { ...datos, empresa })
      return response.data
    } catch (error) {
      console.error('Error generando valoración:', error)
      throw error
    }
  },

  // ========== ÓRDENES DE COMPRA ==========
  async getOrdenesCompra(filtros = {}) {
    try {
      const empresa = getEmpresaActiva()
      const authStore = useAuthStore()
      const tipo = authStore.empresa?.tipo

      // Si es CLIENTE, filtra por empresa; Si es PROVEEDOR, no filtra
      const params = { ...filtros }
      if (tipo === 'CLIENTE') {
        params.empresa = empresa
      }

      const response = await api.get(ENDPOINTS.ordenesCompra, { params })
      return response.data
    } catch (error) {
      console.error('Error obteniendo órdenes de compra:', error)
      throw error
    }
  },

  async crearOrdenCompra(datos) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.post(ENDPOINTS.ordenesCompra, { ...datos, empresa })
      return response.data
    } catch (error) {
      console.error('Error creando orden de compra:', error)
      throw error
    }
  },

  // ========== REPORTES ==========
  async getKardex(filtros = {}) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.get(ENDPOINTS.kardex, {
        params: { ...filtros, empresa }
      })
      return response.data
    } catch (error) {
      console.error('Error obteniendo kardex:', error)
      throw error
    }
  },

  async getConsumos(filtros = {}) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.get(ENDPOINTS.consumos, {
        params: { ...filtros, empresa }
      })
      return response.data
    } catch (error) {
      console.error('Error obteniendo consumos:', error)
      throw error
    }
  }
}

export default almacenService
