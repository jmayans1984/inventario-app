import api from './api'

export const adminNotificacionesService = {

  async obtenerTiposNotificaciones() {
    const res = await api.get('/admin/tipos-notificaciones')
    return res.data.data
  },

  async crearTipo(data) {
    const res = await api.post('/admin/tipos-notificaciones', data)
    return res.data.data
  },

  async actualizarTipo(id, data) {
    const res = await api.put(`/admin/tipos-notificaciones/${id}`, data)
    return res.data.data
  },

  async eliminarTipo(id) {
    const res = await api.delete(`/admin/tipos-notificaciones/${id}`)
    return res.data
  },
}

export default adminNotificacionesService
