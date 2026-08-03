import api from './api'

const BASE = '/almacen/presentaciones-compra'

export const presentacionesCompraService = {

  async getPresentaciones() {
    const res = await api.get(BASE)
    return res.data
  },

  async crear(data) {
    const res = await api.post(BASE, data)
    return res.data
  },

  async actualizar(id, data) {
    const res = await api.put(`${BASE}/${id}`, data)
    return res.data
  },

  async eliminar(id) {
    const res = await api.delete(`${BASE}/${id}`)
    return res.data
  },
}
