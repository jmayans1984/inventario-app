import api from './api'
import { useAuthStore } from '../stores/auth'

const ENDPOINT = '/tesoreria/movimientos'

function getEmpresaActiva() {
  const authStore = useAuthStore()
  return authStore.empresa
}

export const movimientosBancariosService = {
  // Obtener todos los movimientos (banco opcional, conciliado opcional)
  async getMovimientos(params = {}) {
    try {
      const empresa = getEmpresaActiva()
      const paramsConEmpresa = { ...params, empresa }
      const response = await api.get(ENDPOINT, { params: paramsConEmpresa })
      return response.data
    } catch (error) {
      console.error('Error obteniendo movimientos:', error)
      throw error
    }
  },

  // Obtener cuentas bancarias activas
  async getCuentasBancarias() {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.get('/cuentas-bancarias', {
        params: { empresa, estado: 'ACTIVA' }
      })
      return response.data
    } catch (error) {
      console.error('Error obteniendo cuentas bancarias:', error)
      throw error
    }
  },

  // Buscar proveedores por nombre
  async buscarProveedores(busqueda) {
    try {
      const empresa = getEmpresaActiva()
      console.log('[buscarProveedores] empresa:', empresa, 'busqueda:', busqueda)
      const response = await api.get('/tesoreria/proveedores/buscar', {
        params: { empresa, q: busqueda }
      })
      console.log('[buscarProveedores] response:', response.data)
      return response.data
    } catch (error) {
      console.error('Error buscando proveedores:', error)
      return { success: true, data: [] }
    }
  },

  // Crear nuevo movimiento (número se genera en el backend)
  async crearMovimiento(datos) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.post(ENDPOINT, { ...datos, empresa })
      return response.data
    } catch (error) {
      console.error('Error creando movimiento:', error)
      throw error
    }
  },

  // Editar un movimiento (solo permitido si no está asociado a un gasto)
  async editarMovimiento(numero, datos) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.put(`${ENDPOINT}/${numero}/editar`, { ...datos, empresa })
      return response.data
    } catch (error) {
      console.error('Error editando movimiento:', error)
      throw error
    }
  },

  // Eliminar un movimiento. conGasto=true además borra el gasto asociado
  // (y todas las líneas de su misma factura, si venía repartida).
  async eliminarMovimiento(numero, conGasto = false) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.delete(`${ENDPOINT}/${numero}`, {
        params: { empresa, con_gasto: conGasto },
      })
      return response.data
    } catch (error) {
      console.error('Error eliminando movimiento:', error)
      throw error
    }
  },

  // Filtrar por rango de fechas
  async getMovimientosPorFecha(fechaInicio, fechaFin, params = {}) {
    try {
      const empresa = getEmpresaActiva()
      const paramsConEmpresa = {
        ...params,
        empresa,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin
      }
      const response = await api.get(ENDPOINT, { params: paramsConEmpresa })
      return response.data
    } catch (error) {
      console.error('Error obteniendo movimientos por fecha:', error)
      throw error
    }
  }
}

export default movimientosBancariosService
