import api from './api'
import { useAuthStore } from '../stores/auth'

const ENDPOINT = '/contabilidad/cuentas-bancarias'

function getEmpresa() {
  return useAuthStore().empresa
}

export const cuentasBancariasService = {

  async getCuentas(params = {}) {
    const response = await api.get(ENDPOINT, { params: { ...params, empresa: getEmpresa() } })
    return response.data
  },

  async getCuenta(codigo) {
    const response = await api.get(`${ENDPOINT}/${codigo}`, { params: { empresa: getEmpresa() } })
    return response.data
  },

  async getProximoCodigo() {
    const response = await api.get(`${ENDPOINT}/proximo-codigo`, { params: { empresa: getEmpresa() } })
    return response.data
  },

  async buscar(query) {
    const response = await api.get(`${ENDPOINT}/buscar`, { params: { q: query, empresa: getEmpresa() } })
    return response.data
  },

  async crearCuenta(data) {
    const response = await api.post(ENDPOINT, { ...data, empresa: getEmpresa() })
    return response.data
  },

  async actualizarCuenta(codigo, data) {
    const response = await api.put(`${ENDPOINT}/${codigo}`, { ...data, empresa: getEmpresa() })
    return response.data
  },

  async toggleEstado(codigo, estadoActual) {
    const nuevoEstado = estadoActual === 'ACTIVA' ? 'INACTIVA' : 'ACTIVA'
    const response = await api.patch(`${ENDPOINT}/${codigo}/estado`, { estado: nuevoEstado, empresa: getEmpresa() })
    return response.data
  },
}

export default cuentasBancariasService
