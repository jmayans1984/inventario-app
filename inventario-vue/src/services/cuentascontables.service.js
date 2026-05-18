import api from './api'
import { useAuthStore } from '../stores/auth'

const ENDPOINT = '/contabilidad/cuentas-contables'

/**
 * Obtener empresa activa del auth store
 */
function getEmpresaActiva() {
  const authStore = useAuthStore()
  return authStore.empresa
}

/**
 * Servicio de Cuentas Contables
 * Gestiona todas las operaciones CRUD de cuentas contables
 */
export const cuentasContablesService = {
  /**
   * Obtener lista de cuentas contables con filtros y paginación
   */
  async getCuentasContables(params = {}) {
    try {
      const empresa = getEmpresaActiva()
      const paramsConEmpresa = {
        ...params,
        empresa: empresa,
      }
      const response = await api.get(ENDPOINT, { params: paramsConEmpresa })
      return response.data
    } catch (error) {
      console.error('Error obteniendo cuentas contables:', error)
      throw error
    }
  },

  /**
   * Obtener una cuenta contable específica por código
   */
  async getCuentaContable(codigo) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.get(`${ENDPOINT}/${codigo}`, { params: { empresa } })
      return response.data
    } catch (error) {
      console.error(`Error obteniendo cuenta contable ${codigo}:`, error)
      throw error
    }
  },

  /**
   * Búsqueda global de cuentas contables
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
      console.error('Error buscando cuentas contables:', error)
      throw error
    }
  },

  /**
   * Crear una nueva cuenta contable
   */
  async crearCuentaContable(data) {
    try {
      const empresa = getEmpresaActiva()
      const dataConEmpresa = {
        ...data,
        empresa: empresa,
        iva_descontable: null,  // Siempre NULL al crear
        estado: 'ACTIVA'        // Siempre ACTIVA al crear
      }
      const response = await api.post(ENDPOINT, dataConEmpresa)
      return response.data
    } catch (error) {
      console.error('Error creando cuenta contable:', error)
      throw error
    }
  },

  /**
   * Actualizar una cuenta contable existente
   */
  async actualizarCuentaContable(codigo, data) {
    try {
      const empresa = getEmpresaActiva()
      const dataConEmpresa = {
        ...data,
        empresa: empresa
      }
      const response = await api.put(`${ENDPOINT}/${codigo}`, dataConEmpresa)
      return response.data
    } catch (error) {
      console.error(`Error actualizando cuenta contable ${codigo}:`, error)
      throw error
    }
  },

  /**
   * Cambiar estado (ACTIVA/INACTIVA) de una cuenta contable
   */
  async cambiarEstado(codigo, estadoActual) {
    try {
      const empresa = getEmpresaActiva()
      const nuevoEstado = estadoActual === 'ACTIVA' ? 'INACTIVA' : 'ACTIVA'
      const response = await api.patch(`${ENDPOINT}/${codigo}/estado`, { estado: nuevoEstado, empresa })
      return response.data
    } catch (error) {
      console.error(`Error cambiando estado de cuenta contable ${codigo}:`, error)
      throw error
    }
  },

  /**
   * Eliminar una cuenta contable
   */
  async eliminarCuentaContable(codigo) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.delete(`${ENDPOINT}/${codigo}`, { params: { empresa } })
      return response.data
    } catch (error) {
      console.error(`Error eliminando cuenta contable ${codigo}:`, error)
      throw error
    }
  },

  /**
   * Eliminar múltiples cuentas contables (batch delete)
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
   * Exportar cuentas contables a Excel
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
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `cuentas-contables-${new Date().toISOString().split('T')[0]}.xlsx`)
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

export default cuentasContablesService
