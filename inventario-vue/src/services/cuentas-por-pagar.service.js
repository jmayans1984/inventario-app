import api from './api'
import { useAuthStore } from '../stores/auth'

const ENDPOINT = '/tesoreria/cuentas-por-pagar'

function getEmpresa() {
  return useAuthStore().empresa
}

export const cuentasPorPagarService = {

  // Listado de cuentas por pagar + KPIs. Filtros: desde, hasta, proveedor, estado
  async getCuentas(params = {}) {
    const response = await api.get(ENDPOINT, { params: { ...params, empresa: getEmpresa() } })
    return response.data
  },

  // Líneas del gasto e historial de abonos de una cuenta por pagar
  async getDetalle(grupo) {
    const response = await api.get(`${ENDPOINT}/${grupo}`, { params: { empresa: getEmpresa() } })
    return response.data
  },

  // Registra un abono: crea el movimiento bancario de egreso por el valor pagado
  async registrarPago(grupo, data) {
    const response = await api.post(`${ENDPOINT}/${grupo}/pagos`, { ...data, empresa: getEmpresa() })
    return response.data
  },

  // Reversa un abono: borra su movimiento bancario y devuelve el saldo
  async reversarPago(id) {
    const response = await api.delete(`${ENDPOINT}/pagos/${id}`, { params: { empresa: getEmpresa() } })
    return response.data
  },
}

export default cuentasPorPagarService
