import api from './api'
import { useAuthStore } from '../stores/auth'

const ENDPOINT = '/articulo-producto'

function getEmpresa() {
  return useAuthStore().empresa
}

export const articuloProductoService = {

  // Mapeos existentes, con el costo de cada lado para detectar desalineados
  async getMapeos() {
    const response = await api.get(ENDPOINT, { params: { empresa: getEmpresa() } })
    return response.data
  },

  // Artículos sin mapear con sus productos candidatos por similitud de nombre
  async getSugerencias(limite = 3) {
    const response = await api.get(`${ENDPOINT}/sugerencias`, { params: { limite } })
    return response.data
  },

  // Vincular un artículo con un producto. sincronizar=true copia de una vez
  // el costo del producto al artículo.
  async crear({ articulo, producto, sincronizar = true }) {
    const response = await api.post(ENDPOINT, {
      articulo, producto, sincronizar, empresa: getEmpresa(),
    })
    return response.data
  },

  async eliminar(articulo) {
    const response = await api.delete(`${ENDPOINT}/${encodeURIComponent(articulo)}`)
    return response.data
  },

  // Empuja el costo de todos los productos mapeados a sus artículos y recalcula
  // las recetas sin esperar al job nocturno.
  async sincronizarTodos() {
    const response = await api.post(`${ENDPOINT}/sincronizar`, { empresa: getEmpresa() })
    return response.data
  },
}

export default articuloProductoService
