import api from './api'

export const notificacionesService = {

  async obtenerNotificaciones() {
    const res = await api.get('/notificaciones')
    return res.data
  },

  async obtenerCountSinLeer() {
    const res = await api.get('/notificaciones/sin-leer/count')
    return res.data
  },

  async marcarComoLeida(id) {
    const res = await api.patch(`/notificaciones/${id}/leer`)
    return res.data
  },
}

export default notificacionesService
