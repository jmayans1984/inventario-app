import api from './api'
import { useAuthStore } from '../stores/auth'

const ENDPOINT = '/contabilidad/proveedores'

/**
 * Obtener empresa activa del auth store
 */
function getEmpresaActiva() {
  const authStore = useAuthStore()
  return authStore.empresa
}

/**
 * Servicio de Proveedores
 * Gestiona todas las operaciones CRUD de proveedores
 */
export const proveedoresService = {
  /**
   * Obtener lista de proveedores con filtros y paginación
   */
  async getProveedores(params = {}) {
    try {
      // Agregar empresa activa como filtro obligatorio
      const empresa = getEmpresaActiva()
      const paramsConEmpresa = {
        ...params,
        empresa: empresa,
      }

      const response = await api.get(ENDPOINT, { params: paramsConEmpresa })
      return response.data
    } catch (error) {
      console.error('Error obteniendo proveedores:', error)
      throw error
    }
  },

  /**
   * Obtener un proveedor específico por código
   */
  async getProveedor(codigo) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.get(`${ENDPOINT}/${codigo}`, { params: { empresa } })
      return response.data
    } catch (error) {
      console.error(`Error obteniendo proveedor ${codigo}:`, error)
      throw error
    }
  },

  /**
   * Búsqueda global de proveedores
   */
  async buscar(query) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.get(`${ENDPOINT}/buscar`, {
        params: {
          q: query,
          empresa: empresa
        }
      })
      return response.data
    } catch (error) {
      console.error('Error buscando proveedores:', error)
      throw error
    }
  },

  /**
   * Verificar si un código ya existe (dentro de la empresa activa)
   */
  async verificarCodigoUnico(codigo, excluirId = null) {
    try {
      const empresa = getEmpresaActiva()
      const params = {
        codigo,
        empresa
      }
      if (excluirId) params.excluir_id = excluirId
      const response = await api.get(`${ENDPOINT}/verificar/codigo`, { params })
      return response.data
    } catch (error) {
      console.error('Error verificando código único:', error)
      throw error
    }
  },

  /**
   * Crear un nuevo proveedor
   */
  async crearProveedor(data) {
    try {
      // Garantizar que empresa tiene el valor de la empresa activa del auth store
      const empresa = getEmpresaActiva()
      const dataConEmpresa = {
        ...data,
        empresa: empresa
      }

      const response = await api.post(ENDPOINT, dataConEmpresa)
      return response.data
    } catch (error) {
      console.error('Error creando proveedor:', error)
      throw error
    }
  },

  /**
   * Actualizar un proveedor existente
   */
  async actualizarProveedor(codigo, data) {
    try {
      const empresa = getEmpresaActiva()
      const dataConEmpresa = {
        ...data,
        empresa: empresa
      }
      const response = await api.put(`${ENDPOINT}/${codigo}`, dataConEmpresa)
      return response.data
    } catch (error) {
      console.error(`Error actualizando proveedor ${codigo}:`, error)
      throw error
    }
  },

  /**
   * Eliminar un proveedor
   */
  async eliminarProveedor(codigo) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.delete(`${ENDPOINT}/${codigo}`, { params: { empresa } })
      return response.data
    } catch (error) {
      console.error(`Error eliminando proveedor ${codigo}:`, error)
      throw error
    }
  },

  /**
   * Eliminar múltiples proveedores (batch delete)
   */
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

  /**
   * Exportar proveedores a Excel
   */
  async exportarExcel(filters = {}) {
    try {
      const empresa = getEmpresaActiva()
      const filtersConEmpresa = {
        ...filters,
        empresa: empresa
      }

      const response = await api.get(`${ENDPOINT}/export/excel`, {
        params: filtersConEmpresa,
        responseType: 'blob'
      })
      // Descargar el archivo
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `proveedores-${new Date().toISOString().split('T')[0]}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.parentElement.removeChild(link)
      return true
    } catch (error) {
      console.error('Error exportando a Excel:', error)
      throw error
    }
  },
}

export default proveedoresService
