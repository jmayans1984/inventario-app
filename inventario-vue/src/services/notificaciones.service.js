import api from './api'
import { useAuthStore } from '../stores/auth'

export const notificacionesService = {

  async obtenerNotificaciones() {
    const authStore = useAuthStore()
    const res = await api.get('/notificaciones', {
      params: { usuario: authStore.userName }
    })
    return res.data
  },

  async obtenerCountSinLeer() {
    const authStore = useAuthStore()
    const res = await api.get('/notificaciones/sin-leer/count', {
      params: { usuario: authStore.userName }
    })
    return res.data
  },

  async marcarComoLeida(id) {
    const authStore = useAuthStore()
    const res = await api.patch(`/notificaciones/${id}/leer`, {}, {
      params: { usuario: authStore.userName }
    })
    return res.data
  },

  async eliminarNotificacion(id) {
    const authStore = useAuthStore()
    const res = await api.delete(`/notificaciones/${id}`, {
      params: { usuario: authStore.userName }
    })
    return res.data
  },

  async obtenerPreferencias() {
    const authStore = useAuthStore()
    const res = await api.get('/preferencias-notificaciones', {
      params: { empresa: authStore.empresa }
    })
    return res.data
  },

  async actualizarPreferencia(tipo, activa, usuarios_receptores = []) {
    const authStore = useAuthStore()
    const res = await api.put(`/preferencias-notificaciones/${tipo}`, { activa, usuarios_receptores }, {
      params: { empresa: authStore.empresa }
    })
    return res.data
  },
}

export default notificacionesService
